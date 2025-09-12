// ================= PARTE 4: AUTENTICACIÓN DE PROFESIONALES =================

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

  if (!email.endsWith('@senda.cl')) {
    showNotification('Solo se permite acceso con correos institucionales (@senda.cl)', 'error');
    showLoading(false);
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!doc.exists) {
      await auth.signOut();
      showNotification('Usuario no registrado como profesional del sistema', 'error');
      showLoading(false);
      return;
    }
    
    const userData = doc.data();
    
    if (!userData.configuracion_sistema?.activo) {
      await auth.signOut();
      showNotification('Tu cuenta está desactivada. Contacta al administrador.', 'error');
      showLoading(false);
      return;
    }
    
    currentUserData = { uid: user.uid, ...userData };
    
    await db.collection('profesionales').doc(user.uid).update({
      'metadata.ultima_actividad': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification(`Bienvenido, ${userData.nombre}`, 'success');
    closeModal('professional-modal');
    showProfessionalPanel(userData);
    
  } catch (error) {
    console.error('Login error:', error);
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
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN CORREGIDA DE REGISTRO DE PROFESIONALES
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  showLoading(true);
  
  // Verificar que todos los elementos existan antes de acceder a sus valores
  const nameElement = document.getElementById('register-name');
  const emailElement = document.getElementById('register-email');
  const passwordElement = document.getElementById('register-password');
  const professionElement = document.getElementById('register-profession');
  const licenseElement = document.getElementById('register-license');
  const centerElement = document.getElementById('register-center');

  // Verificar que todos los elementos existan
  if (!nameElement || !emailElement || !passwordElement || !professionElement) {
    console.error('Elementos del formulario no encontrados');
    showNotification('Error: Formulario no cargado correctamente', 'error');
    showLoading(false);
    return;
  }

  const registrationData = {
    name: nameElement.value.trim(),
    email: emailElement.value.trim(),
    password: passwordElement.value,
    profession: professionElement.value,
    license: licenseElement ? licenseElement.value.trim() : '',
    center: centerElement ? centerElement.value : ''
  };

  // Validaciones mejoradas
  if (!registrationData.name || !registrationData.email || !registrationData.password || !registrationData.profession) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    showLoading(false);
    return;
  }

  // Validar email institucional @senda.cl
  if (!registrationData.email.endsWith('@senda.cl')) {
    showNotification('El correo debe ser institucional (@senda.cl)', 'error');
    showLoading(false);
    return;
  }

  if (!isValidEmail(registrationData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    showLoading(false);
    return;
  }

  if (registrationData.password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
    showLoading(false);
    return;
  }

  try {
    // Crear usuario en Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(registrationData.email, registrationData.password);
    const user = userCredential.user;
    
    // Preparar datos del profesional para Firestore
    const professionalData = {
      nombre: registrationData.name,
      correo: registrationData.email,
      profesion: registrationData.profession,
      licencia: registrationData.license || 'No especificada',
      id_centro_asignado: registrationData.center || null,
      configuracion_sistema: {
        rol: registrationData.profession,
        permisos: getDefaultPermissions(registrationData.profession),
        activo: true,
        fecha_activacion: firebase.firestore.FieldValue.serverTimestamp()
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        ultima_actividad: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'activo'
      }
    };

    // Guardar en Firestore
    await db.collection('profesionales').doc(user.uid).set(professionalData);

    // Actualizar perfil de Firebase Auth con el nombre
    await user.updateProfile({
      displayName: registrationData.name
    });

    showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
    // Cambiar a la pestaña de login y prellenar el email
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.reset();
    
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput) loginEmailInput.value = registrationData.email;
    
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Error al registrar';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El correo ya está registrado en el sistema';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres)';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro de usuarios no está habilitado';
        break;
      default:
        errorMessage = `Error al registrar: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

function getDefaultPermissions(profession) {
  const permissions = {
    'asistente_social': [
      'ver_casos', 
      'asignar_casos', 
      'derivar_casos', 
      'seguimiento', 
      'crear_reportes_sociales'
    ],
    'medico': [
      'ver_casos', 
      'atencion_medica', 
      'seguimiento', 
      'prescripcion', 
      'evaluacion_medica'
    ],
    'psicologo': [
      'ver_casos', 
      'atencion_psicologica', 
      'seguimiento', 
      'evaluacion_psicologica',
      'crear_planes_tratamiento'
    ],
    'terapeuta': [
      'ver_casos', 
      'terapia_ocupacional', 
      'seguimiento', 
      'evaluacion_funcional'
    ],
    'coordinador': [
      'ver_casos', 
      'asignar_casos', 
      'reportes', 
      'supervision', 
      'gestion_centro',
      'estadisticas'
    ],
    'admin': [
      'ver_casos', 
      'asignar_casos', 
      'reportes', 
      'usuarios', 
      'configuracion',
      'sistema_completo'
    ]
  };
  
  return permissions[profession] || ['ver_casos'];
}

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  setupRoleBasedNavigation(userData);
  setupPanelNavigation(userData);
  showPanel('dashboard', userData);
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  startRealTimeListeners(userData);
}

function setupRoleBasedNavigation(userData) {
  const role = userData.profesion;
  
  const centersNav = document.getElementById('centers-nav');
  const usersNav = document.getElementById('users-nav');
  const analyticsNav = document.getElementById('analytics-nav');
  
  if (role === 'coordinador' || role === 'admin') {
    if (centersNav) centersNav.style.display = 'flex';
    if (analyticsNav) analyticsNav.style.display = 'flex';
  }
  
  if (role === 'admin') {
    if (usersNav) usersNav.style.display = 'flex';
  }
}

function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const panel = item.dataset.panel;
      if (panel) {
        showPanel(panel, userData);
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

async function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    try {
      // Limpiar listeners en tiempo real
      if (window.sendaUnsubscribers) {
        window.sendaUnsubscribers.forEach(unsubscribe => unsubscribe());
        window.sendaUnsubscribers = [];
      }
      
      await auth.signOut();
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada correctamente', 'success');
      
      document.getElementById('login-form')?.reset();
      document.getElementById('register-form')?.reset();
      document.querySelector('[data-tab="login"]')?.click();
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
  }
}

// Authentication State Observer
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    loadUserData(user.uid);
  }
});

async function loadUserData(uid) {
  try {
    const doc = await db.collection('profesionales').doc(uid).get();
    if (doc.exists) {
      currentUserData = { uid, ...doc.data() };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

function startRealTimeListeners(userData) {
  console.log('Starting real-time listeners for:', userData.nombre);
  
  // Listener para nuevas solicitudes críticas
  const unsubscribeCritical = db.collection('alertas_criticas')
    .where('estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const alertData = change.doc.data();
          showNotification(
            `Nueva alerta crítica: ${alertData.mensaje}`,
            'error',
            10000
          );
        }
      });
    });
  
  // Listener para nuevas solicitudes
  const unsubscribeRequests = db.collection('solicitudes_ingreso')
    .where('clasificacion.estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      const pendingCount = snapshot.size;
      const badge = document.getElementById('requests-badge');
      if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline' : 'none';
      }
    });
  
  // Guardar referencias para cleanup
  window.sendaUnsubscribers = [unsubscribeCritical, unsubscribeRequests];
}
