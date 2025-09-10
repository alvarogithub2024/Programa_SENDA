const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    console.log('Firebase Auth user created:', user.uid);
    
    // Update user profile
    await user.updateProfile({
      displayName: formData.name
    });
    console.log('User profile updated');
    
    // Create professional document in Firestore
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
        fecha_activacion: firebase.firestore.FieldValue.serverTimestamp()
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
        ip_registro: 'anonimizada',
        dispositivo_registro: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    };

    console.log('Saving professional data to Firestore:', professionalData);
    await db.collection('profesionales').doc(user.uid).set(professionalData);
    console.log('Professional data saved successfully');
    
    // Log registration activity
    try {
      await db.collection('actividad_profesionales').add({
        usuario_id: user.uid,
        accion: 'registro_exitoso',
        detalles: {
          profesion: formData.profession,
          centro: formData.center
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ip: 'anonimizada',
        user_agent: navigator.userAgent
      });
      console.log('Activity logged');
    } catch (activityError) {
      console.warn('Could not log activity:', activityError);
    }
    
    // Send email verification
    try {
      await user.sendEmailVerification();
      showNotification('Se ha enviado un email de verificación a tu correo corporativo', 'info', 6000);
    } catch (emailError) {
      console.warn('Could not send verification email:', emailError);
    }

    showNotification('¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta corporativa.', 'success', 6000);
    
    // Switch to login tab
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) {
      loginTab.click();
    }
    
    // Reset registration form
    document.getElementById('register-form').reset();
    
    // Pre-fill login email
    const loginEmailField = document.getElementById('login-email');
    if (loginEmailField) {
      loginEmailField.value = formData.email;
      loginEmailField.focus();
    }
    
    // Sign out to force manual login
    await auth.signOut();
    
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Error al registrar cuenta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Ya existe una cuenta con este correo electrónico';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del correo electrónico no es válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro de cuentas está temporalmente deshabilitado';
        break;
      case 'permission-denied':
        errorMessage = 'No tienes permisos para crear esta cuenta. Contacta al administrador del sistema.';
        break;
      default:
        errorMessage = `Error de registro: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
    // Clean up Auth user if Firestore save failed
    if (error.code === 'permission-denied' && auth.currentUser) {
      try {
        await auth.currentUser.delete();
        console.log('Cleaned up Auth user after Firestore error');
      } catch (deleteError) {
        console.error('Error cleaning up Auth user:', deleteError);
      }
    }
  } finally {
    showLoading(false);
  }
}

async function handleProfessionalLogin() {
  console.log('Starting professional login');
  
  const emailField = document.getElementById('login-email');
  const passwordField = document.getElementById('login-password');
  
  if (!emailField || !passwordField) {
    showNotification('Error: Campos de login no encontrados', 'error');
    return;
  }
  
  const email = emailField.value.trim();
  const password = passwordField.value;

  if (!email || !password) {
    showNotification('Por favor ingresa tu correo corporativo y contraseña', 'error');
    return;
  }

  // Validate corporate email
  if (!isValidSendaEmail(email)) {
    showNotification('Por favor usa tu correo corporativo @senda.cl', 'error');
    return;
  }

  showLoading(true);

  try {
    console.log('Attempting login for:', email);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('Firebase Auth login successful:', user.uid);
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    if (!doc.exists) {
      console.error('Professional document not found for user:', user.uid);
      showNotification('No se encontraron datos de usuario profesional. Contacta al administrador.', 'error');
      await auth.signOut();
      return;
    }
    
    const userData = doc.data();
    console.log('Professional data loaded:', userData.nombre, userData.profesion);
    
    if (!userData.configuracion_sistema?.activo) {
      console.warn('User account is inactive:', user.uid);
      showNotification('Tu cuenta está desactivada. Contacta al administrador del sistema.', 'error');
      await auth.signOut();
      return;
    }
    
    currentUserData = { uid: user.uid, ...userData };
    
    // Update last access
    await db.collection('profesionales').doc(user.uid).update({
      'estado_cuenta.fecha_ultimo_acceso': firebase.firestore.FieldValue.serverTimestamp(),
      'estado_cuenta.intentos_fallidos': 0,
      'metadata.ultima_actividad': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Log login activity
    try {
      await db.collection('actividad_profesionales').add({
        usuario_id: user.uid,
        accion: 'login_exitoso',
        detalles: {
          profesion: userData.profesion
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ip: 'anonimizada',
        user_agent: navigator.userAgent
      });
    } catch (activityError) {
      console.warn('Could not log login activity:', activityError);
    }
    
    const nombreCompleto = userData.nombre;
    const profesion = getProfessionName(userData.profesion);
    showNotification(`¡Bienvenido de vuelta, ${nombreCompleto}!`, 'success', 4000);
    
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
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
    // Update failed attempts counter
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
        console.warn('Could not update failed attempts:', updateError);
      }
    }
    
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

function getProfessionName(profession) {
  const names = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional',
    'coordinador': 'Coordinador Regional',
    'admin': 'Administrador'
  };
  return names[profession] || profession;
}

function showProfessionalPanel(userData) {
  console.log('Showing professional panel for:', userData.nombre);
  showModal('panel-modal');
  
  const userNameElement = document.getElementById('user-name');
  const userRoleElement = document.getElementById('user-role');
  const userAvatarElement = document.getElementById('user-avatar');
  
  if (userNameElement) userNameElement.textContent = userData.nombre;
  if (userRoleElement) userRoleElement.textContent = getProfessionName(userData.profesion);
  if (userAvatarElement) userAvatarElement.textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Setup role-based navigation
  setupRoleBasedNavigation(userData);
  
  // Setup panel navigation
  setupPanelNavigation(userData);
  
  // Load initial dashboard
  loadDashboard();
  
  // Start real-time listeners
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

function showPanel(panelId, userData) {
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    switch (panelId) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'requests':
        loadRequests(userData);
        break;
    }
  }
}

async function loadDashboard() {
  console.log('Loading dashboard...');
  try {
    const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    const criticalSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .get();
    
    // Update dashboard metrics
    const pendingElement = document.getElementById('pending-requests');
    const criticalElement = document.getElementById('critical-cases');
    const totalElement = document.getElementById('total-patients');
    
    if (pendingElement) pendingElement.textContent = solicitudesSnapshot.size;
    if (criticalElement) criticalElement.textContent = criticalSnapshot.size;
    if (totalElement) totalElement.textContent = solicitudesSnapshot.size;
    
    console.log('Dashboard loaded - Pending:', solicitudesSnapshot.size, 'Critical:', criticalSnapshot.size);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

async function loadRequests(userData) {
  console.log('Loading requests...');
  
  const requestsList = document.getElementById('requests-list');
  if (!requestsList) {
    console.warn('Requests list element not found');
    return;
  }
  
  requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
  
  try {
    const snapshot = await db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(20)
      .get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = '<p style="text-align: center; color: var(--gray-600);">No hay solicitudes pendientes</p>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const solicitudId = doc.id;
      
      html += `
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid var(--${data.clasificacion.prioridad === 'critica' ? 'danger-red' : 'primary-blue'});">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0; color: var(--gray-900);">
                ${data.datos_personales.anonimo ? 'Usuario Anónimo' : 
                  data.datos_contacto.nombre_completo || 'Sin nombre'}
              </h4>
              <small style="color: var(--gray-600);">ID: ${solicitudId.substring(0, 8).toUpperCase()}</small>
            </div>
            <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; 
                         background: var(--${data.clasificacion.prioridad === 'critica' ? 'danger-red' : 'primary-blue'}); color: white;">
              ${data.clasificacion.prioridad.toUpperCase()}
            </span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px;">
            <div><strong>Edad:</strong> ${data.datos_personales.edad} años</div>
            <div><strong>Región:</strong> ${regionesChile[data.datos_personales.region]?.nombre || data.datos_personales.region}</div>
            <div><strong>Para:</strong> ${data.datos_personales.para_quien}</div>
            <div><strong>Estado:</strong> ${data.clasificacion.estado}</div>
          </div>
          
          ${data.evaluacion_inicial ? `
            <div style="margin-bottom: 12px;">
              <strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ') || 'No especificadas'}
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" style="font-size: 14px; padding: 8px 16px;" 
                    onclick="viewRequestDetails('${solicitudId}')">
              <i class="fas fa-eye"></i> Ver detalles
            </button>
            <button class="btn btn-success" style="font-size: 14px; padding: 8px 16px;" 
                    onclick="assignRequest('${solicitudId}')">
              <i class="fas fa-user-check"></i> Asignar
            </button>
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    console.log('Requests loaded successfully');
    
  } catch (error) {
    console.error('Error loading requests:', error);
    requestsList.innerHTML = '<p style="color: var(--danger-red);">Error al cargar solicitudes</p>';
  }
}

function viewRequestDetails(solicitudId) {
  showNotification(`Abriendo detalles de solicitud ${solicitudId.substring(0, 8).toUpperCase()}`, 'info');
}

function assignRequest(solicitudId) {
  showNotification(`Asignando solicitud ${solicitudId.substring(0, 8).toUpperCase()}`, 'info');
}

function startRealTimeListeners(userData) {
  console.log('Starting real-time listeners...');
  
  // Listen for critical alerts
  db.collection('alertas_criticas')
    .where('estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          showNotification(`🚨 ALERTA CRÍTICA: ${data.mensaje}`, 'error', 10000);
          
          // Update notification badge
          const badge = document.getElementById('requests-badge');
          if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
          }
        }
      });
    }, error => {
      console.error('Error in critical alerts listener:', error);
    });
  
  // Listen for pending requests
  db.collection('solicitudes_ingreso')
    .where('clasificacion.estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      const pendingCount = snapshot.size;
      const pendingElement = document.getElementById('pending-requests');
      if (pendingElement) {
        pendingElement.textContent = pendingCount;
      }
      
      const badge = document.getElementById('requests-badge');
      if (badge) {
        badge.textContent = pendingCount;
      }
    }, error => {
      console.error('Error in requests listener:', error);
    });
}

async function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    try {
      console.log('Logging out user...');
      await auth.signOut();
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada correctamente', 'success');
      
      // Reset forms
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();
      
      // Switch to login tab
      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab) loginTab.click();
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
  }
}

// ===== UTILITY FUNCTIONS =====
function loadRegionsData() {
  const regionSelect = document.getElementById('patient-region');
  if (regionSelect) {
    regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
    Object.keys(regionesChile).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = regionesChile[key].nombre;
      regionSelect.appendChild(option);
    });
    console.log('Regions data loaded');
  }
}

function loadCommunesData(regionKey) {
  const comunaSelect = document.getElementById('patient-comuna');
  if (comunaSelect && regionKey && regionesChile[regionKey]) {
    comunaSelect.innerHTML = '<option value="">Seleccionar comuna...</option>';
    regionesChile[regionKey].comunas.forEach(comuna => {
      const option = document.createElement('option');
      option.value = comuna.toLowerCase().replace(/\s+/g, '_');
      option.textContent = comuna;
      comunaSelect.appendChild(option);
    });
    comunaSelect.disabled = false;
    console.log('Communes loaded for region:', regionKey);
  }
}

function setupFormValidation() {
  // RUT validation
  const rutInput = document.getElementById('patient-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('RUT inválido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }

  // Email validation
  document.addEventListener('blur', function(e) {
    if (e.target.type === 'email') {
      const email = e.target.value.trim();
      if (email) {
        // Check if it's a professional registration email
        if (e.target.id === 'register-email') {
          if (!isValidSendaEmail(email)) {
            e.target.classList.add('error');
            showNotification('Usa tu correo corporativo @senda.cl', 'error');
          } else {
            e.target.classList.remove('error');
          }
        } else {
          // Regular email validation for other fields
          if (!isValidEmail(email)) {
            e.target.classList.add('error');
            showNotification('Email inválido', 'error');
          } else {
            e.target.classList.remove('error');
          }
        }
      }
    }
  }, true);

  // Age validation
  const ageInput = document.getElementById('patient-age');
  if (ageInput) {
    ageInput.addEventListener('blur', function(e) {
      const age = parseInt(e.target.value);
      if (age && (age < 12 || age > 120)) {
        e.target.classList.add('error');
        showNotification('Edad debe estar entre 12-120 años', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }

  // Motivation slider
  const motivacionSlider = document.getElementById('motivacion');
  const motivacionValue = document.getElementById('motivacion-value');
  if (motivacionSlider && motivacionValue) {
    motivacionSlider.addEventListener('input', function() {
      motivacionValue.textContent = this.value;
    });
  }

  // Password confirmation validation
  const passwordConfirm = document.getElementById('register-password-confirm');
  if (passwordConfirm) {
    passwordConfirm.addEventListener('blur', function() {
      const password = document.getElementById('register-password')?.value;
      const confirmPassword = this.value;
      
      if (confirmPassword && password !== confirmPassword) {
        this.classList.add('error');
        showNotification('Las contraseñas no coinciden', 'error');
      } else {
        this.classList.remove('error');
      }
    });
  }
}

async function loadNearbyClinicas() {
  const centersList = document.getElementById('centers-list');
  if (!centersList) return;
  
  centersList.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando centros cercanos...</div>';
  
  const mockCenters = [
    {
      name: 'CESFAM La Florida',
      address: 'Av. Walker Martinez 1234, La Florida',
      distance: '1.2 km',
      phone: '+56 2 2987 6543',
      hours: 'Lun-Vie 8:00-17:00'
    },
    {
      name: 'CESFAM Maipú',
      address: 'Av. Pajaritos 5678, Maipú', 
      distance: '3.5 km',
      phone: '+56 2 2765 4321',
      hours: 'Lun-Vie 8:30-17:30'
    },
    {
      name: 'Centro SENDA Providencia',
      address: 'Av. Providencia 9876, Providencia',
      distance: '5.1 km', 
      phone: '+56 2 2234 5678',
      hours: 'Lun-Vie 9:00-18:00'
    }
  ];
  
  setTimeout(() => {
    let html = '';
    mockCenters.forEach(center => {
      html += `
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid var(--gray-200); transition: box-shadow 0.2s ease;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <h4 style="color: var(--primary-blue); margin: 0; font-size: 18px;">${center.name}</h4>
            <span style="color: var(--primary-blue); font-weight: 600;">${center.distance}</span>
          </div>
          <p style="margin: 4px 0; color: var(--gray-600);"><i class="fas fa-map-marker-alt"></i> ${center.address}</p>
          <p style="margin: 4px 0; color: var(--gray-600);"><i class="fas fa-phone"></i> ${center.phone}</p>
          <p style="margin: 4px 0; color: var(--gray-600);"><i class="fas fa-clock"></i> ${center.hours}</p>
          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button class="btn btn-outline" style="flex: 1;">
              <i class="fas fa-directions"></i> Cómo llegar
            </button>
            <button class="btn btn-primary" style="flex: 1;">
              <i class="fas fa-phone"></i> Llamar
            </button>
          </div>
        </div>
      `;
    });
    centersList.innerHTML = html;
  }, 1000);
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    showNotification('Obteniendo tu ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const locationInput = document.getElementById('location-input');
        if (locationInput) {
          locationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
        showNotification('Ubicación detectada correctamente', 'success');
        loadNearbyClinicas();
      },
      error => {
        console.error('Geolocation error:', error);
        showNotification('No se pudo obtener tu ubicación. Por favor ingresa tu dirección manualmente.', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  } else {
    showNotification('Tu navegador no soporta geolocalización', 'error');
  }
}

// Authentication state observer
auth.onAuthStateChanged(user => {
  currentUser = user;
  console.log('Auth state changed:', user ? user.uid : 'signed out');
  
  if (user) {
    loadUserData(user.uid);
  }
});

async function loadUserData(uid) {
  try {
    const doc = await db.collection('profesionales').doc(uid).get();
    if (doc.exists) {
      currentUserData = { uid, ...doc.data() };
      console.log('User data loaded for// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let formData = {};
let isDraftSaved = false;
let flowSteps = [1];
let currentStepIndex = 0;

// Chilean Regions Data
const regionesChile = {
  "arica": { nombre: "Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre"] },
  "tarapaca": { nombre: "Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte"] },
  "antofagasta": { nombre: "Antofagasta", comunas: ["Antofagasta", "Calama", "Tocopilla"] },
  "atacama": { nombre: "Atacama", comunas: ["Copiapó", "Caldera", "Vallenar"] },
  "coquimbo": { nombre: "Coquimbo", comunas: ["La Serena", "Coquimbo", "Ovalle"] },
  "valparaiso": { nombre: "Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué"] },
  "metropolitana": { nombre: "Metropolitana de Santiago", comunas: ["Santiago", "Las Condes", "Providencia", "La Florida", "Maipú", "Puente Alto", "Ñuñoa", "San Miguel"] },
  "ohiggins": { nombre: "Libertador Bernardo O'Higgins", comunas: ["Rancagua", "San Fernando", "Pichilemu"] },
  "maule": { nombre: "Maule", comunas: ["Talca", "Curicó", "Linares"] },
  "nuble": { nombre: "Ñuble", comunas: ["Chillán", "San Carlos", "Bulnes"] },
  "biobio": { nombre: "Biobío", comunas: ["Concepción", "Talcahuano", "Los Ángeles", "Chillán"] },
  "araucania": { nombre: "La Araucanía", comunas: ["Temuco", "Villarrica", "Pucón"] },
  "losrios": { nombre: "Los Ríos", comunas: ["Valdivia", "La Unión", "Panguipulli"] },
  "loslagos": { nombre: "Los Lagos", comunas: ["Puerto Montt", "Castro", "Osorno"] },
  "aysen": { nombre: "Aysén", comunas: ["Coyhaique", "Puerto Aysén"] },
  "magallanes": { nombre: "Magallanes", comunas: ["Punta Arenas", "Puerto Natales"] }
};

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info', duration = 4000) {
  console.log(`Notification [${type}]: ${message}`);
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer;">×</button>
  `;
  
  // Ensure notifications container exists
  let container = document.getElementById('notifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifications';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
    document.body.appendChild(container);
  }
  
  container.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, duration);
}

function showModal(modalId) {
  console.log('Opening modal:', modalId);
  
  // Close all modals first
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    console.log('Modal opened successfully:', modalId);
  } else {
    console.error('Modal not found:', modalId);
    showNotification('Error: Modal no encontrado', 'error');
  }
}

function closeModal(modalId) {
  console.log('Closing modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

function formatRUT(rut) {
  const cleaned = rut.replace(/[^\dKk]/g, '');
  if (cleaned.length > 1) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
  }
  return cleaned;
}

function validateRUT(rut) {
  const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
  if (cleaned.length < 8) return false;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  let sum = 0, multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  return dv === finalDV;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSendaEmail(email) {
  return /^[^\s@]+@senda\.cl$/.test(email);
}

function calculatePriority(data) {
  let score = 0;
  if (data.sustancias?.includes('pasta_base')) score += 3;
  if (data.sustancias?.includes('cocaina')) score += 2;
  if (data.edad < 18) score += 2;
  if (data.urgencia === 'critica') score += 4;
  if (data.urgencia === 'alta') score += 2;
  
  if (score >= 6) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  console.log('Initializing SENDA app...');
  
  try {
    setupEventListeners();
    loadRegionsData();
    setupFormValidation();
    loadDraftIfExists();
    console.log('SENDA app initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al inicializar la aplicación', 'error');
  }
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Main buttons using event delegation for reliability
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    console.log('Button clicked:', target.id);
    
    switch(target.id) {
      case 'register-patient':
        e.preventDefault();
        console.log('Opening patient registration form');
        openPatientForm();
        break;
      case 'reentry-program':
        e.preventDefault();
        console.log('Opening reentry form');
        openPatientForm(true);
        break;
      case 'login-professional':
        e.preventDefault();
        console.log('Opening professional login');
        showModal('professional-modal');
        break;
      case 'find-center':
        e.preventDefault();
        console.log('Opening center finder');
        showModal('center-modal');
        loadNearbyClinicas();
        break;
      case 'about-program':
        e.preventDefault();
        console.log('Opening SENDA website');
        window.open('https://www.senda.gob.cl/quienes-somos/', '_blank');
        break;
      case 'next-step':
        e.preventDefault();
        nextFormStep();
        break;
      case 'prev-step':
        e.preventDefault();
        prevFormStep();
        break;
      case 'submit-form':
        e.preventDefault();
        submitPatientForm();
        break;
      case 'save-draft':
        e.preventDefault();
        saveDraft();
        break;
      case 'use-location':
        e.preventDefault();
        getCurrentLocation();
        break;
      case 'logout-btn':
        e.preventDefault();
        handleLogout();
        break;
    }
    
    // Close modals
    if (target.hasAttribute('data-close')) {
      e.preventDefault();
      const modalId = target.getAttribute('data-close');
      console.log('Closing modal via close button:', modalId);
      closeModal(modalId);
    }
  });
  
  // Form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Form submitted:', e.target.id);
    
    switch(e.target.id) {
      case 'patient-form':
        handlePatientRegistration();
        break;
      case 'login-form':
        handleProfessionalLogin();
        break;
      case 'register-form':
        handleProfessionalRegistration();
        break;
    }
  });
  
  // Tab functionality
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
      const tabGroup = e.target.closest('.tabs');
      const targetTab = e.target.dataset.tab;
      
      tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.target.classList.add('active');
      const tabContent = document.getElementById(targetTab + '-tab');
      if (tabContent) {
        tabContent.classList.add('active');
      }
    }
  });
  
  // Region change
  document.addEventListener('change', function(e) {
    if (e.target.id === 'patient-region') {
      console.log('Region changed to:', e.target.value);
      loadCommunesData(e.target.value);
    }
    
    if (e.target.name === 'tipoSolicitud') {
      console.log('Tipo solicitud changed to:', e.target.value);
      handleTipoSolicitudChange(e.target.value);
    }
  });
  
  console.log('Event listeners setup complete');
}

// ===== PATIENT FORM FUNCTIONS =====
function openPatientForm(isReentry = false) {
  console.log('Opening patient form, reentry:', isReentry);
  
  formData = isReentry ? { isReentry: true } : {};
  currentFormStep = 1;
  currentStepIndex = 0;
  flowSteps = [1];
  isDraftSaved = false;
  
  showModal('patient-modal');
  updateFormProgress();
  
  if (isReentry) {
    showNotification('Formulario de reingreso activado', 'info');
  }
}

function handleTipoSolicitudChange(tipoSolicitud) {
  console.log('Handling tipo solicitud change:', tipoSolicitud);
  
  const phoneContainer = document.getElementById('anonymous-phone-container');
  const emailContainer = document.getElementById('info-email-container');
  
  // Hide all special fields
  if (phoneContainer) phoneContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'none';
  
  // Configure flow steps
  switch(tipoSolicitud) {
    case 'anonimo':
      flowSteps = [1, 3, 4];
      if (phoneContainer) phoneContainer.style.display = 'block';
      break;
    case 'identificado':
      flowSteps = [1, 2, 3, 4];
      break;
    case 'informacion':
      flowSteps = [1];
      if (emailContainer) emailContainer.style.display = 'block';
      break;
  }
  
  console.log('New flow steps:', flowSteps);
  updateFormProgress();
}

function updateFormProgress() {
  const progressFill = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  const totalSteps = flowSteps.length;
  const currentStepInFlow = currentStepIndex + 1;
  const progress = (currentStepInFlow / totalSteps) * 100;
  
  if (progressFill) progressFill.style.width = progress + '%';
  if (progressText) progressText.textContent = `Paso ${currentStepInFlow} de ${totalSteps}`;
  
  // Show/hide navigation buttons
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-form');
  
  if (prevBtn) prevBtn.style.display = currentStepIndex > 0 ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = currentStepIndex < flowSteps.length - 1 ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = currentStepIndex === flowSteps.length - 1 ? 'block' : 'none';
}

function nextFormStep() {
  console.log('Next form step clicked');
  if (validateCurrentStep()) {
    collectCurrentStepData();
    
    if (currentStepIndex < flowSteps.length - 1) {
      document.querySelector(`[data-step="${flowSteps[currentStepIndex]}"]`).classList.remove('active');
      currentStepIndex++;
      currentFormStep = flowSteps[currentStepIndex];
      document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
      updateFormProgress();
      saveDraft(false);
    }
  }
}

function prevFormStep() {
  console.log('Previous form step clicked');
  if (currentStepIndex > 0) {
    document.querySelector(`[data-step="${flowSteps[currentStepIndex]}"]`).classList.remove('active');
    currentStepIndex--;
    currentFormStep = flowSteps[currentStepIndex];
    document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
    updateFormProgress();
  }
}

function validateCurrentStep() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  if (!currentStepElement) {
    console.error('Current step element not found:', currentFormStep);
    return false;
  }
  
  const requiredFields = currentStepElement.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (field.offsetParent === null) return; // Skip hidden fields
    
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  // Specific validations
  if (currentFormStep === 1) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    const paraMi = document.querySelector('input[name="paraMi"]:checked');
    
    if (!tipoSolicitud || !paraMi) {
      showNotification('Por favor completa todos los campos obligatorios', 'error');
      return false;
    }
    
    if (tipoSolicitud.value === 'anonimo') {
      const phone = document.getElementById('anonymous-phone')?.value;
      if (!phone) {
        showNotification('Por favor ingresa un teléfono de contacto', 'error');
        return false;
      }
    }
    
    if (tipoSolicitud.value === 'informacion') {
      const email = document.getElementById('info-email')?.value;
      if (!email || !isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
      }
    }
  }
  
  if (currentFormStep === 3 && formData.tipoSolicitud !== 'informacion') {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Por favor selecciona al menos una sustancia', 'error');
      return false;
    }
  }
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
}

function collectCurrentStepData() {
  console.log('Collecting data for step:', currentFormStep);
  
  if (currentFormStep === 1) {
    formData.tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    formData.edad = document.getElementById('patient-age').value;
    formData.region = document.getElementById('patient-region').value;
    formData.paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    
    if (formData.tipoSolicitud === 'anonimo') {
      formData.telefonoContacto = document.getElementById('anonymous-phone')?.value;
    }
    if (formData.tipoSolicitud === 'informacion') {
      formData.emailInformacion = document.getElementById('info-email')?.value;
    }
  }
  
  if (currentFormStep === 2 && formData.tipoSolicitud === 'identificado') {
    formData.nombre = document.getElementById('patient-name').value;
    formData.apellido = document.getElementById('patient-lastname').value;
    formData.rut = document.getElementById('patient-rut').value;
    formData.telefono = document.getElementById('patient-phone').value;
    formData.email = document.getElementById('patient-email').value;
    formData.comuna = document.getElementById('patient-comuna').value;
    formData.direccion = document.getElementById('patient-address').value;
  }
  
  if (currentFormStep === 3 && formData.tipoSolicitud !== 'informacion') {
    const sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value);
    formData.sustancias = sustancias;
    formData.tiempoConsumo = document.getElementById('tiempo-consumo').value;
    formData.motivacion = document.getElementById('motivacion').value;
    formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
  }
  
  if (currentFormStep === 4) {
    formData.razon = document.getElementById('patient-reason').value;
    formData.tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    formData.centroPreferencia = document.getElementById('centro-preferencia').value;
  }
  
  console.log('Collected form data:', formData);
}

function submitPatientForm() {
  console.log('Submitting patient form');
  if (validateCurrentStep()) {
    collectCurrentStepData();
    handlePatientRegistration();
  }
}

async function handlePatientRegistration() {
  console.log('Handling patient registration with data:', formData);
  showLoading(true);
  
  try {
    const prioridad = calculatePriority(formData);
    console.log('Calculated priority:', prioridad);
    
    const solicitudData = {
      clasificacion: {
        tipo: formData.isReentry ? 'reingreso' : 'ingreso_voluntario',
        estado: 'pendiente',
        prioridad: prioridad
      },
      datos_personales: {
        anonimo: formData.tipoSolicitud === 'anonimo',
        solo_informacion: formData.tipoSolicitud === 'informacion',
        edad: parseInt(formData.edad),
        region: formData.region,
        para_quien: formData.paraMi
      },
      datos_contacto: {},
      evaluacion_inicial: formData.tipoSolicitud !== 'informacion' ? {
        sustancias_consumo: formData.sustancias || [],
        tiempo_consumo_meses: parseInt(formData.tiempoConsumo) || 0,
        motivacion_cambio: parseInt(formData.motivacion) || 5,
        urgencia_declarada: formData.urgencia || 'no_especificada',
        tratamiento_previo: formData.tratamientoPrevio || 'no',
        descripcion_situacion: formData.razon || ''
      } : null,
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_publica'
      }
    };
    
    // Add contact data based on type
    if (formData.tipoSolicitud === 'identificado') {
      solicitudData.datos_contacto = {
        telefono_principal: formData.telefono,
        email: formData.email,
        nombre_completo: `${formData.nombre} ${formData.apellido}`,
        rut: formData.rut
      };
    } else if (formData.tipoSolicitud === 'anonimo') {
      solicitudData.datos_contacto = {
        telefono_principal: formData.telefonoContacto,
        es_anonimo: true
      };
    } else if (formData.tipoSolicitud === 'informacion') {
      solicitudData.datos_contacto = {
        email: formData.emailInformacion,
        solo_informacion: true
      };
    }

    console.log('Saving solicitud data:', solicitudData);
    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    console.log('Solicitud saved with ID:', docRef.id);
    
    // Create critical alert if needed
    if (prioridad === 'critica') {
      console.log('Creating critical alert');
      await db.collection('alertas_criticas').add({
        id_solicitud: docRef.id,
        tipo_alerta: 'caso_critico_nuevo',
        prioridad: 'maxima',
        mensaje: `Nuevo caso crítico: ${formData.edad} años`,
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente'
      });
    }
    
    localStorage.removeItem('senda_draft');
    isDraftSaved = false;
    
    const trackingCode = docRef.id.substring(0, 8).toUpperCase();
    showNotification(`Solicitud enviada exitosamente. Código de seguimiento: ${trackingCode}`, 'success', 8000);
    
    closeModal('patient-modal');
    resetForm();
    
  } catch (error) {
    console.error('Error submitting patient registration:', error);
    showNotification(`Error al enviar la solicitud: ${error.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

function saveDraft(showMessage = true) {
  collectCurrentStepData();
  const draftData = {
    ...formData,
    currentStep: currentFormStep,
    currentStepIndex: currentStepIndex,
    flowSteps: flowSteps,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('senda_draft', JSON.stringify(draftData));
  isDraftSaved = true;
  if (showMessage) showNotification('Borrador guardado', 'success', 2000);
}

function loadDraftIfExists() {
  const draft = localStorage.getItem('senda_draft');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      const draftAge = new Date() - new Date(draftData.timestamp);
      
      if (draftAge < 24 * 60 * 60 * 1000) {
        if (confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?')) {
          formData = draftData;
          currentFormStep = draftData.currentStep || 1;
          currentStepIndex = draftData.currentStepIndex || 0;
          flowSteps = draftData.flowSteps || [1];
          isDraftSaved = true;
        } else {
          localStorage.removeItem('senda_draft');
        }
      } else {
        localStorage.removeItem('senda_draft');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      localStorage.removeItem('senda_draft');
    }
  }
}

function resetForm() {
  console.log('Resetting form');
  formData = {};
  currentFormStep = 1;
  currentStepIndex = 0;
  flowSteps = [1];
  isDraftSaved = false;
  
  const form = document.getElementById('patient-form');
  if (form) {
    form.reset();
    document.querySelectorAll('.form-step').forEach((step, index) => {
      step.classList.toggle('active', index === 0);
    });
    
    // Hide conditional fields
    const phoneContainer = document.getElementById('anonymous-phone-container');
    const emailContainer = document.getElementById('info-email-container');
    if (phoneContainer) phoneContainer.style.display = 'none';
    if (emailContainer) emailContainer.style.display = 'none';
    
    updateFormProgress();
  }
}

// ===== PROFESSIONAL FUNCTIONS =====
async function handleProfessionalRegistration() {
  console.log('Starting professional registration');
  
  const formElements = {
    name: document.getElementById('register-name'),
    email: document.getElementById('register-email'),
    password: document.getElementById('register-password'),
    passwordConfirm: document.getElementById('register-password-confirm'),
    profession: document.getElementById('register-profession'),
    license: document.getElementById('register-license'),
    center: document.getElementById('register-center')
  };
  
  // Check if all elements exist
  for (const [key, element] of Object.entries(formElements)) {
    if (!element) {
      console.error(`Form element not found: ${key}`);
      showNotification(`Error: Campo ${key} no encontrado`, 'error');
      return;
    }
  }
  
  const formData = {
    name: formElements.name.value.trim(),
    email: formElements.email.value.trim(),
    password: formElements.password.value,
    passwordConfirm: formElements.passwordConfirm?.value || '',
    profession: formElements.profession.value,
    license: formElements.license.value.trim(),
    center: formElements.center.value
  };
  
  console.log('Registration form data:', { ...formData, password: '[HIDDEN]', passwordConfirm: '[HIDDEN]' });

  // Validations
  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  // Check password confirmation if field exists
  if (formElements.passwordConfirm && formData.password !== formData.passwordConfirm) {
    showNotification('Las contraseñas no coinciden', 'error');
    return;
  }

  // Validate corporate email
  if (!isValidSendaEmail(formData.email)) {
    showNotification('Por favor usa un correo corporativo @senda.cl', 'error');
    return;
  }

  if (formData.password.length < 8) {
    showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
    return;
  }

  if (formData.license.length < 5) {
    showNotification('El número de licencia debe tener al menos 5 caracteres', 'error');
    return;
  }

  showLoading(true);

  try {
    console.log('Creating Firebase Auth user...');
    
    // Check if user already exists in Firestore
    const existingUserQuery = await db.collection('profesionales')
      .where('correo', '==', formData.email)
      .limit(1)
      .get();
    
    if (!existingUserQuery.empty) {
      showNotification('Ya existe una cuenta con este correo electrónico', 'error');
      showLoading(false);
      return;
    }
    
    const userCredential = await auth
