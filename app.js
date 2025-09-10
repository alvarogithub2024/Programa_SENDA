// Función mejorada para manejar el registro de profesionales
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  showLoading(true);
  
  const formData = {
    name: document.getElementById('register-name').value.trim(),
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value,
    profession: document.getElementById('register-profession').value,
    license: document.getElementById('register-license').value.trim(),
    center: document.getElementById('register-center').value
  };

  // Validaciones del lado del cliente
  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    showLoading(false);
    return;
  }

  if (!isValidEmail(formData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    showLoading(false);
    return;
  }

  if (formData.password.length < 8) {
    showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
    showLoading(false);
    return;
  }

  // Validar que el número de licencia tenga formato válido
  if (formData.license.length < 5) {
    showNotification('El número de licencia debe tener al menos 5 caracteres', 'error');
    showLoading(false);
    return;
  }

  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    // 2. Actualizar perfil de usuario
    await user.updateProfile({
      displayName: formData.name
    });
    
    // 3. Crear documento en Firestore con datos del profesional
    const professionalData = {
      nombre: formData.name,
      correo: formData.email,
      profesion: formData.profession,
      licencia: formData.license,
      id_centro_asignado: formData.center || null,
      configuracion_sistema: {
        rol: formData.profession,
        permisos: getDefaultPermissions(formData.profession),
        activo: true,
        fecha_activacion: firebase.firestore.FieldValue.serverTimestamp(),
        requiere_aprobacion: false // Cambiar a true si quieres que requiera aprobación manual
      },
      estado_cuenta: {
        verificado: false,
        activo: true,
        fecha_ultimo_acceso: null,
        intentos_fallidos: 0
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        ultima_actividad: firebase.firestore.FieldValue.serverTimestamp(),
        version_registro: '1.0',
        ip_registro: 'anonimizada', // En producción podrías capturar la IP real
        dispositivo_registro: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    };

    // Guardar en Firestore
    await db.collection('profesionales').doc(user.uid).set(professionalData);
    
    // 4. Enviar email de verificación (opcional)
    try {
      await user.sendEmailVerification();
      showNotification('Se ha enviado un email de verificación a tu correo', 'info', 6000);
    } catch (emailError) {
      console.warn('No se pudo enviar email de verificación:', emailError);
      // No bloquear el registro por esto
    }
    
    // 5. Crear entrada en log de actividad
    await logProfessionalActivity(user.uid, 'registro_exitoso', {
      profesion: formData.profession,
      centro: formData.center
    });

    // 6. Mostrar mensaje de éxito
    showNotification('¡Registro exitoso! Ya puedes iniciar sesión.', 'success', 5000);
    
    // 7. Cambiar a pestaña de login y prellenar email
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    // Limpiar formulario de registro
    document.getElementById('register-form').reset();
    
    // Prellenar email en login
    document.getElementById('login-email').value = formData.email;
    document.getElementById('login-email').focus();
    
    // 8. Cerrar sesión automáticamente para que haga login manual
    await auth.signOut();
    
  } catch (error) {
    console.error('Error en registro:', error);
    
    let errorMessage = 'Error al registrar cuenta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Ya existe una cuenta con este correo electrónico';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 8 caracteres';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del correo electrónico no es válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro de cuentas está temporalmente deshabilitado';
        break;
      case 'permission-denied':
        errorMessage = 'No tienes permisos para crear esta cuenta. Contacta al administrador.';
        break;
      default:
        errorMessage = `Error al registrar: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
    // Si se creó el usuario pero falló Firestore, limpiar Auth
    if (error.code === 'permission-denied' && auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (deleteError) {
        console.error('Error limpiando usuario:', deleteError);
      }
    }
  } finally {
    showLoading(false);
  }
}

// Función auxiliar para obtener permisos por defecto según profesión
function getDefaultPermissions(profession) {
  const permissions = {
    'asistente_social': [
      'ver_casos', 
      'asignar_casos', 
      'derivar_casos', 
      'seguimiento',
      'reportes_basicos'
    ],
    'medico': [
      'ver_casos', 
      'atencion_medica', 
      'seguimiento', 
      'prescripcion',
      'reportes_medicos'
    ],
    'psicologo': [
      'ver_casos', 
      'atencion_psicologica', 
      'seguimiento',
      'evaluaciones_psicologicas'
    ],
    'terapeuta': [
      'ver_casos', 
      'terapia_ocupacional', 
      'seguimiento',
      'planes_terapeuticos'
    ],
    'coordinador': [
      'ver_casos', 
      'asignar_casos', 
      'reportes', 
      'supervision',
      'gestion_equipo',
      'reportes_avanzados'
    ],
    'admin': [
      'ver_casos', 
      'asignar_casos', 
      'reportes', 
      'usuarios', 
      'configuracion',
      'gestion_centros',
      'reportes_completos',
      'auditoria'
    ]
  };
  
  return permissions[profession] || ['ver_casos'];
}

// Función para registrar actividad del profesional
async function logProfessionalActivity(userId, action, details = {}) {
  try {
    await db.collection('actividad_profesionales').add({
      usuario_id: userId,
      accion: action,
      detalles: details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: 'anonimizada',
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.warn('No se pudo registrar actividad:', error);
    // No bloquear el flujo principal por esto
  }
}

// Función mejorada para el login que actualiza última actividad
async function handleProfessionalLogin(e) {
  e.preventDefault();
  showLoading(true);
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showNotification('Por favor ingresa tu correo y contraseña', 'error');
    showLoading(false);
    return;
  }

  try {
    // 1. Autenticar con Firebase
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // 2. Obtener datos del profesional
    const doc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!doc.exists) {
      showNotification('No se encontraron datos de usuario profesional', 'error');
      await auth.signOut();
      showLoading(false);
      return;
    }
    
    const userData = doc.data();
    
    // 3. Verificar que la cuenta esté activa
    if (!userData.configuracion_sistema?.activo) {
      showNotification('Tu cuenta está desactivada. Contacta al administrador.', 'error');
      await auth.signOut();
      showLoading(false);
      return;
    }
    
    // 4. Actualizar datos de la sesión
    currentUserData = { uid: user.uid, ...userData };
    
    // 5. Actualizar última actividad y resetear intentos fallidos
    await db.collection('profesionales').doc(user.uid).update({
      'estado_cuenta.fecha_ultimo_acceso': firebase.firestore.FieldValue.serverTimestamp(),
      'estado_cuenta.intentos_fallidos': 0,
      'metadata.ultima_actividad': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 6. Registrar actividad de login
    await logProfessionalActivity(user.uid, 'login_exitoso', {
      profesion: userData.profesion
    });
    
    // 7. Mostrar mensaje de bienvenida
    const nombreCompleto = userData.nombre;
    const profesion = getProfessionName(userData.profesion);
    showNotification(`¡Bienvenido de vuelta, ${nombreCompleto}!`, 'success', 3000);
    
    // 8. Cerrar modal y mostrar panel
    closeModal('professional-modal');
    showProfessionalPanel(userData);
    
  } catch (error) {
    console.error('Error en login:', error);
    
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No existe un usuario con este correo electrónico';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
    // Incrementar contador de intentos fallidos si el usuario existe
    if (error.code === 'auth/wrong-password') {
      try {
        const userQuery = await db.collection('profesionales')
          .where('correo', '==', email)
          .limit(1)
          .get();
        
        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          const currentAttempts = userDoc.data().estado_cuenta?.intentos_fallidos || 0;
          
          await userDoc.ref.update({
            'estado_cuenta.intentos_fallidos': currentAttempts + 1,
            'estado_cuenta.ultimo_intento_fallido': firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (updateError) {
        console.warn('No se pudo actualizar intentos fallidos:', updateError);
      }
    }
    
  } finally {
    showLoading(false);
  }
}
