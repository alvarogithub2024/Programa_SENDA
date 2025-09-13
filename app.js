// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO =================

// Firebase Configuration
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

// Lista de CESFAM de Puente Alto - CORREGIDA
const cesfamPuenteAlto = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla", 
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
];

// Variables globales
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;
let flowSteps = [];
let currentStepIndex = 0;
let selectedProfessional = null;
let currentCalendarDate = new Date(2025, 0, 1);

// ================= FUNCIONES UTILITARIAS =================

function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const container = document.getElementById('notifications');
  if (container) {
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modalId === 'patient-modal' && !isDraftSaved) {
      resetForm();
    }
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Remover modales dinámicos
    if (['request-detail-modal', 'patient-detail-modal', 'patient-history-modal', 
         'patient-report-preview-modal', 'followup-note-modal', 'new-appointment-modal', 
         'day-appointments-modal', 'assignment-modal', 'regional-stats-modal',
         'cesfam-stats-modal', 'reentry-modal', 'patient-search-modal'].includes(modalId)) {
      modal.remove();
    }
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
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return dv === finalDV;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
  } else if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 11 && cleaned.startsWith('56')) {
    return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  return phone;
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

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatTimeOnly(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculatePriority(evaluationData) {
  let score = 0;
  
  if (evaluationData.sustancias?.includes('pasta_base')) score += 3;
  if (evaluationData.sustancias?.includes('cocaina')) score += 2;
  if (evaluationData.edad < 18) score += 2;
  if (evaluationData.tiempoConsumo > 60) score += 2;
  if (evaluationData.urgencia === 'critica') score += 4;
  if (evaluationData.urgencia === 'alta') score += 2;
  if (evaluationData.motivacion >= 8) score += 1;
  if (evaluationData.tratamientoPrevio === 'si_senda') score += 1;
  
  const descripcion = evaluationData.razon?.toLowerCase() || '';
  if (descripcion.includes('suicid') || descripcion.includes('muerte') || descripcion.includes('morir')) {
    score += 4;
  }
  
  if (score >= 6) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ================= INICIALIZACIÓN =================

document.addEventListener('DOMContentLoaded', function() {
  console.log('SENDA Puente Alto loading...');
  initializeApp();
});

function initializeApp() {
  try {
    // Cambiar título
    document.title = "PROGRAMA SENDA PUENTE ALTO";
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) mainTitle.textContent = "PROGRAMA SENDA PUENTE ALTO";

    // Crear overlay de loading si no existe
    if (!document.getElementById('loading-overlay')) {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.className = 'loading-overlay hidden';
      loadingOverlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }

    // Crear contenedor de notificaciones si no existe
    if (!document.getElementById('notifications')) {
      const notificationsContainer = document.createElement('div');
      notificationsContainer.id = 'notifications';
      notificationsContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(notificationsContainer);
    }

    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    loadDraftIfExists();
    loadCesfamData();
    setupEmailValidation();
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

function setupEmailValidation() {
  const emailInput = document.getElementById('register-email');
  if (emailInput) {
    emailInput.addEventListener('blur', function(e) {
      const email = e.target.value.trim();
      if (email && !email.endsWith('@senda.cl')) {
        e.target.classList.add('error');
        showNotification('El correo debe ser institucional (@senda.cl)', 'warning');
      } else if (email && isValidEmail(email)) {
        e.target.classList.remove('error');
      }
    });
    emailInput.placeholder = 'nombre@senda.cl';
  }
  
  const loginEmailInput = document.getElementById('login-email');
  if (loginEmailInput) {
    loginEmailInput.placeholder = 'nombre@senda.cl';
  }
}

function loadCesfamData() {
  const cesfamSelect = document.getElementById('patient-cesfam');
  if (cesfamSelect) {
    cesfamSelect.innerHTML = '<option value="">Seleccionar CESFAM...</option>';
    cesfamPuenteAlto.forEach(cesfam => {
      const option = document.createElement('option');
      option.value = cesfam;
      option.textContent = cesfam;
      cesfamSelect.appendChild(option);
    });
  }
}

function initializeEventListeners() {
  // Botones principales
  const registerBtn = document.getElementById('register-patient');
  const loginBtn = document.getElementById('login-professional');
  const aboutBtn = document.getElementById('about-program');
  const findCenterBtn = document.getElementById('find-center');
  const reentryBtn = document.getElementById('reentry-program');

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      formData = {};
      currentFormStep = 1;
      currentStepIndex = 0;
      flowSteps = [1];
      isDraftSaved = false;
      showModal('patient-modal');
      updateFormProgress();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => showModal('professional-modal'));
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      showNotification('Redirigiendo a información sobre el programa SENDA...', 'info');
      setTimeout(() => window.open('https://www.senda.gob.cl/quienes-somos/', '_blank'), 1000);
    });
  }

  if (findCenterBtn) {
    findCenterBtn.addEventListener('click', () => {
      showModal('center-modal');
      loadNearbyClinics();
    });
  }

  // EVENTO REINGRESO ACTUALIZADO
  if (reentryBtn) {
    reentryBtn.addEventListener('click', () => {
      showReentryModal();
    });
  }

  // Formularios
  const patientForm = document.getElementById('patient-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (patientForm) patientForm.addEventListener('submit', handlePatientRegistration);
  if (loginForm) loginForm.addEventListener('submit', handleProfessionalLogin);
  if (registerForm) registerForm.addEventListener('submit', handleProfessionalRegistration);

  // Navegación del formulario
  const nextBtn = document.getElementById('next-step');
  const prevBtn = document.getElementById('prev-step');
  const submitBtn = document.getElementById('submit-form');
  const saveDraftBtn = document.getElementById('save-draft');

  if (nextBtn) nextBtn.addEventListener('click', nextFormStep);
  if (prevBtn) prevBtn.addEventListener('click', prevFormStep);
  if (submitBtn) submitBtn.addEventListener('click', submitPatientForm);
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);

  // Geolocalización
  const useLocationBtn = document.getElementById('use-location');
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', getCurrentLocation);
  }
}

// ================= FUNCIÓN DE REINGRESO =================

function showReentryModal() {
  const modalHTML = `
    <div class="modal-overlay" id="reentry-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('reentry-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Solicitud de Reingreso</h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
          Complete los siguientes datos para solicitar su reingreso al programa SENDA.
        </p>
        
        <form id="reentry-form">
          <div class="form-group">
            <label class="form-label">Nombre Completo *</label>
            <input type="text" class="form-input" id="reentry-name" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">RUT *</label>
            <input type="text" class="form-input" id="reentry-rut" placeholder="12.345.678-9" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">CESFAM *</label>
            <select class="form-select" id="reentry-cesfam" required>
              <option value="">Seleccionar CESFAM...</option>
              ${cesfamPuenteAlto.map(cesfam => `<option value="${cesfam}">${cesfam}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Teléfono de Contacto *</label>
            <input type="tel" class="form-input" id="reentry-phone" placeholder="+56 9 1234 5678" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="reentry-email" placeholder="correo@email.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo del Reingreso *</label>
            <textarea class="form-textarea" id="reentry-reason" placeholder="Explique brevemente el motivo de su solicitud de reingreso..." required></textarea>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('reentry-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-paper-plane"></i>
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('reentry-modal').style.display = 'flex';
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('reentry-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }
  
  // Configurar formateo de teléfono
  const phoneInput = document.getElementById('reentry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  // Manejar envío del formulario
  document.getElementById('reentry-form').addEventListener('submit', handleReentrySubmission);
}

async function handleReentrySubmission(e) {
  e.preventDefault();
  
  const name = document.getElementById('reentry-name').value.trim();
  const rut = document.getElementById('reentry-rut').value.trim();
  const cesfam = document.getElementById('reentry-cesfam').value;
  const phone = document.getElementById('reentry-phone').value.trim();
  const email = document.getElementById('reentry-email').value.trim();
  const reason = document.getElementById('reentry-reason').value.trim();
  
  // Validaciones
  if (!name || !rut || !cesfam || !phone || !reason) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  if (email && !isValidEmail(email)) {
    showNotification('El email ingresado no es válido', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Crear solicitud de reingreso en Firebase
    const reentryData = {
      tipo_solicitud: 'reingreso',
      datos_personales: {
        nombre_completo: name,
        rut: rut,
        cesfam: cesfam
      },
      datos_contacto: {
        telefono_principal: phone,
        email: email || null
      },
      reingreso: {
        motivo: reason,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente'
      },
      clasificacion: {
        tipo: 'reingreso',
        estado: 'pendiente',
        prioridad: 'media',
        categoria_riesgo: 'moderado'
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_reingreso',
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    };
    
    const docRef = await db.collection('solicitudes_ingreso').add(reentryData);
    
    showNotification('Solicitud de reingreso enviada correctamente. Se le contactará pronto.', 'success', 6000);
    closeModal('reentry-modal');
    
    console.log('Reentry request created:', docRef.id);
    
  } catch (error) {
    console.error('Error submitting reentry request:', error);
    showNotification('Error al enviar la solicitud de reingreso. Intente nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}

// ================= AUTENTICACIÓN DE PROFESIONALES ACTUALIZADA =================

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
    
    // CONSULTAR DATOS DEL PROFESIONAL EN FIREBASE
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
    
    // GUARDAR DATOS DEL USUARIO LOGUEADO
    currentUserData = { uid: user.uid, ...userData };
    
    // Actualizar última actividad
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

async function handleProfessionalRegistration(e) {
  e.preventDefault();
  showLoading(true);
  
  const nameElement = document.getElementById('register-name');
  const emailElement = document.getElementById('register-email');
  const passwordElement = document.getElementById('register-password');
  const professionElement = document.getElementById('register-profession');
  const licenseElement = document.getElementById('register-license');
  const centerElement = document.getElementById('register-center');

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

  // Validaciones
  if (!registrationData.name || !registrationData.email || !registrationData.password || !registrationData.profession) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    showLoading(false);
    return;
  }

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
    const userCredential = await auth.createUserWithEmailAndPassword(registrationData.email, registrationData.password);
    const user = userCredential.user;
    
    // GUARDAR DATOS DEL PROFESIONAL EN FIREBASE
    const professionalData = {
      nombre: registrationData.name,
      correo: registrationData.email,
      profesion: registrationData.profession,
      licencia: registrationData.license || 'No especificada',
      cesfam_asignado: registrationData.center || null, // CAMPO CESFAM
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

    await db.collection('profesionales').doc(user.uid).set(professionalData);

    await user.updateProfile({
      displayName: registrationData.name
    });

    showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
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
// ================= PANEL DE GESTIÓN Y DASHBOARD =================

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
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequestsPanel(userData);
        break;
      case 'patients':
        loadPatientsPanel(userData);
        break;
      case 'calendar':
        loadCalendarPanel(userData);
        break;
      case 'followups':
        loadFollowupsPanel(userData);
        break;
      case 'reports':
        loadReportsPanel(userData);
        break;
    }
  }
}

async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // FILTRAR POR CESFAM DEL PROFESIONAL
    let baseQuery = db.collection('solicitudes_ingreso');
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      baseQuery = baseQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    const pendingRequests = await baseQuery
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    const criticalCases = await baseQuery
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    // Pacientes activos (filtrar por CESFAM)
    let patientsQuery = db.collection('pacientes').where('estado_actual.activo', '==', true);
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      patientsQuery = patientsQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    const activePatients = await patientsQuery.get();
    
    // Citas de hoy para este profesional
    const todayAppointments = await db.collection('citas')
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .where('profesional_id', '==', userData.uid)
      .get();
    
    const totalPatientsElement = document.getElementById('total-patients');
    const pendingRequestsElement = document.getElementById('pending-requests');
    const criticalCasesElement = document.getElementById('critical-cases');
    const todayAppointmentsElement = document.getElementById('today-appointments');
    
    if (totalPatientsElement) totalPatientsElement.textContent = activePatients.size;
    if (pendingRequestsElement) pendingRequestsElement.textContent = pendingRequests.size;
    if (criticalCasesElement) criticalCasesElement.textContent = criticalCases.size;
    if (todayAppointmentsElement) todayAppointmentsElement.textContent = todayAppointments.size;
    
    // Próxima cita
    if (todayAppointments.size > 0) {
      const nextAppointment = todayAppointments.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.fecha.toDate() - b.fecha.toDate())[0];
      
      const nextAppointmentElement = document.getElementById('next-appointment');
      if (nextAppointmentElement) {
        nextAppointmentElement.textContent = formatTimeOnly(nextAppointment.fecha);
      }
    }
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ================= SOLICITUDES CON FILTRADO POR CESFAM =================

async function loadRequestsPanel(userData) {
  console.log('Loading requests panel for:', userData.nombre);
  
  if (userData.profesion !== 'asistente_social' && userData.profesion !== 'admin') {
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Solo los asistentes sociales pueden ver las solicitudes de ingreso.
          </p>
        </div>
      `;
    }
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // FILTRAR SOLICITUDES POR CESFAM
    let query = db.collection('solicitudes_ingreso');
    
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      query = query.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    query = query.orderBy('metadata.fecha_creacion', 'desc').limit(100);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes disponibles en este momento.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      const isAnonymous = data.datos_personales?.anonimo || false;
      const isInfoOnly = data.datos_personales?.solo_informacion || false;
      const isReentry = data.tipo_solicitud === 'reingreso';
      
      html += `
        <div class="card patient-card" data-request-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>
                ${isReentry ? '<i class="fas fa-redo" style="color: var(--warning-orange);"></i> ' : ''}
                Solicitud ${doc.id.substring(0, 8).toUpperCase()}
              </h3>
              <p>
                ${isInfoOnly ? 'Solo información' : 
                  isAnonymous ? 'Solicitud anónima' : 
                  isReentry ? data.datos_personales?.nombre_completo || 'Reingreso' :
                  (data.datos_contacto?.nombre_completo || 'Sin nombre')}
              </p>
              ${!isReentry ? `<p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
              <div style="margin-top: 8px;">
                <span class="status-badge status-${estado}">${estado}</span>
              </div>
              ${isReentry ? '<div style="margin-top: 4px; font-size: 12px; color: var(--warning-orange);">REINGRESO</div>' : ''}
            </div>
          </div>
          <div class="patient-info">
            <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${isReentry ? 'Reingreso' : isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
            ${!isReentry ? `<div><strong>Para:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>` : ''}
            ${isReentry ? `<div><strong>RUT:</strong> ${data.datos_personales?.rut || 'N/A'}</div>` : ''}
            ${data.evaluacion_inicial?.sustancias_consumo ? 
              `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
            ${data.evaluacion_inicial?.urgencia_declarada ? 
              `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
            ${data.datos_contacto?.telefono_principal ? 
              `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
            ${data.datos_contacto?.email ? 
              `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}')">
              <i class="fas fa-eye"></i> Revisar Completa
            </button>
            ${!isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
            </button>
            ` : ''}
            ${isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="sendInformation('${doc.id}')">
              <i class="fas fa-envelope"></i> Enviar Información
            </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = '<p>Error al cargar las solicitudes: ' + error.message + '</p>';
    }
  }
}

// ================= GESTIÓN DE PACIENTES CON FILTRADO POR CESFAM =================

async function loadPatientsPanel(userData) {
  const patientsList = document.getElementById('patients-list');
  if (!patientsList) return;
  
  patientsList.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Gestión de Pacientes</h1>
      <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-primary" onclick="showPatientSearchModal()">
          <i class="fas fa-search"></i> Buscar Paciente por RUT
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando pacientes...</div>
  `;
  
  try {
    // FILTRAR PACIENTES POR CESFAM DEL PROFESIONAL
    let patientsQuery = db.collection('pacientes').where('estado_actual.activo', '==', true);
    
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      patientsQuery = patientsQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    const patientsSnapshot = await patientsQuery
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      patientsList.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Gestión de Pacientes</h1>
          <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
          <div style="margin-top: 16px;">
            <button class="btn btn-primary" onclick="showPatientSearchModal()">
              <i class="fas fa-search"></i> Buscar Paciente por RUT
            </button>
          </div>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en el sistema para su CESFAM.
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Pacientes</h1>
        <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" onclick="showPatientSearchModal()">
            <i class="fas fa-search"></i> Buscar Paciente por RUT
          </button>
        </div>
      </div>
    `;
    
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      
      html += `
        <div class="card patient-card" data-patient-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h3>
              <p>RUT: ${data.datos_personales?.rut || 'Sin RUT'}</p>
              <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">
                ${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
            <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
            <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'Sin teléfono'}</div>
            <div><strong>Email:</strong> ${data.contacto?.email || 'Sin email'}</div>
            <div><strong>Fecha ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
            ${data.estado_actual?.profesional_asignado ? 
              `<div><strong>Profesional asignado:</strong> ${data.estado_actual.profesional_asignado}</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
            <button class="btn btn-success btn-sm" onclick="addFollowupNote('${doc.id}')">
              <i class="fas fa-notes-medical"></i> Agregar Nota
            </button>
            <button class="btn btn-outline btn-sm" onclick="scheduleAppointment('${doc.id}')">
              <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </div>
      `;
    });
    
    patientsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading patients:', error);
    patientsList.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Pacientes</h1>
        <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" onclick="showPatientSearchModal()">
            <i class="fas fa-search"></i> Buscar Paciente por RUT
          </button>
        </div>
      </div>
      <p>Error al cargar pacientes: ${error.message}</p>
    `;
  }
}

// ================= BÚSQUEDA DE PACIENTES POR RUT =================

function showPatientSearchModal() {
  const modalHTML = `
    <div class="modal-overlay" id="patient-search-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('patient-search-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Buscar Paciente por RUT</h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
          Ingrese el RUT del paciente para buscar su información y ficha clínica.
        </p>
        
        <div class="form-group">
          <label class="form-label">RUT del Paciente</label>
          <input type="text" class="form-input" id="search-patient-rut" placeholder="12.345.678-9" autocomplete="off">
          <small style="color: var(--gray-600);">Ingrese el RUT completo con puntos y guión</small>
        </div>
        
        <div class="form-navigation" style="margin-top: 24px;">
          <button type="button" class="btn btn-outline" onclick="closeModal('patient-search-modal')">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" onclick="searchPatientByRut()">
            <i class="fas fa-search"></i>
            Buscar Paciente
          </button>
        </div>
        
        <div id="search-results" style="margin-top: 24px; display: none;">
          <!-- Resultados de búsqueda aparecerán aquí -->
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-search-modal').style.display = 'flex';
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('search-patient-rut');
  if (rutInput) {
    rutInput.focus();
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    
    rutInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchPatientByRut();
      }
    });
  }
}

async function searchPatientByRut() {
  const rutInput = document.getElementById('search-patient-rut');
  const resultsDiv = document.getElementById('search-results');
  
  if (!rutInput || !resultsDiv) return;
  
  const rut = rutInput.value.trim();
  
  if (!rut) {
    showNotification('Por favor ingrese un RUT para buscar', 'warning');
    return;
  }
  
  if (!validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  try {
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando paciente...</div>';
    
    // Buscar en pacientes activos
    const patientsQuery = await db.collection('pacientes')
      .where('datos_personales.rut', '==', rut)
      .get();
    
    // Buscar en solicitudes de ingreso
    const requestsQuery = await db.collection('solicitudes_ingreso')
      .where('datos_contacto.rut', '==', rut)
      .get();
    
    if (patientsQuery.empty && requestsQuery.empty) {
      resultsDiv.innerHTML = `
        <div class="card" style="text-align: center; padding: 32px;">
          <i class="fas fa-user-slash" style="font-size: 48px; color: var(--gray-400); margin-bottom: 16px;"></i>
          <h3 style="color: var(--gray-600); margin-bottom: 8px;">Paciente no encontrado</h3>
          <p style="color: var(--gray-500);">No se encontró ningún paciente con el RUT ${rut}</p>
        </div>
      `;
      return;
    }
    
    let html = '<div style="border-top: 1px solid var(--gray-200); padding-top: 24px;">';
    
    // Mostrar pacientes encontrados
    if (!patientsQuery.empty) {
      html += '<h3 style="color: var(--primary-blue); margin-bottom: 16px;">Paciente Registrado</h3>';
      
      patientsQuery.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="card patient-card" style="margin-bottom: 16px;">
            <div class="card-header">
              <div>
                <h4>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h4>
                <p>RUT: ${data.datos_personales?.rut}</p>
                <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
              </div>
              <div style="text-align: right;">
                <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">
                  ${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <div class="patient-info">
              <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
              <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
              <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'Sin teléfono'}</div>
              <div><strong>Email:</strong> ${data.contacto?.email || 'Sin email'}</div>
              <div><strong>Fecha ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
              <div><strong>Dirección:</strong> ${data.datos_personales?.direccion || 'Sin dirección'}</div>
            </div>
            <div style="margin-top: 16px;">
              <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}'); closeModal('patient-search-modal');">
                <i class="fas fa-eye"></i> Ver Ficha Completa
              </button>
              <button class="btn btn-success btn-sm" onclick="addFollowupNote('${doc.id}'); closeModal('patient-search-modal');">
                <i class="fas fa-notes-medical"></i> Agregar Seguimiento
              </button>
            </div>
          </div>
        `;
      });
    }
    
    // Mostrar solicitudes encontradas
    if (!requestsQuery.empty) {
      html += '<h3 style="color: var(--warning-orange); margin-bottom: 16px; margin-top: 24px;">Solicitudes de Ingreso</h3>';
      
      requestsQuery.forEach(doc => {
        const data = doc.data();
        const isReentry = data.tipo_solicitud === 'reingreso';
        
        html += `
          <div class="card patient-card" style="margin-bottom: 16px; border-left: 4px solid var(--warning-orange);">
            <div class="card-header">
              <div>
                <h4>
                  ${isReentry ? '<i class="fas fa-redo"></i> ' : ''}
                  ${isReentry ? data.datos_personales?.nombre_completo : data.datos_contacto?.nombre_completo || 'Solicitud anónima'}
                </h4>
                <p>Solicitud: ${doc.id.substring(0, 8).toUpperCase()}</p>
                <p>Estado: ${data.clasificacion?.estado || 'pendiente'}</p>
              </div>
              <div style="text-align: right;">
                <span class="priority-indicator priority-${data.clasificacion?.prioridad || 'baja'}">
                  ${(data.clasificacion?.prioridad || 'baja').toUpperCase()}
                </span>
              </div>
            </div>
            <div class="patient-info">
              <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
              <div><strong>Tipo:</strong> ${isReentry ? 'Reingreso' : 'Solicitud inicial'}</div>
              <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
              <div><strong>Teléfono:</strong> ${data.datos_contacto?.telefono_principal || 'Sin teléfono'}</div>
              ${data.datos_contacto?.email ? `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
              ${isReentry && data.reingreso?.motivo ? `<div><strong>Motivo reingreso:</strong> ${data.reingreso.motivo}</div>` : ''}
            </div>
            <div style="margin-top: 16px;">
              <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}'); closeModal('patient-search-modal');">
                <i class="fas fa-eye"></i> Ver Solicitud Completa
              </button>
              ${data.clasificacion?.estado === 'pendiente' ? `
              <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}'); closeModal('patient-search-modal');">
                <i class="fas fa-check"></i> Aceptar Solicitud
              </button>
              ` : ''}
            </div>
          </div>
        `;
      });
    }
    
    html += '</div>';
    resultsDiv.innerHTML = html;
    
  } catch (error) {
    console.error('Error searching patient:', error);
    resultsDiv.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--danger-red); margin-bottom: 16px;"></i>
        <h3 style="color: var(--danger-red); margin-bottom: 8px;">Error en la búsqueda</h3>
        <p style="color: var(--gray-600);">Ocurrió un error al buscar el paciente: ${error.message}</p>
      </div>
    `;
  }
}

// ================= AGENDA Y CITAS =================

async function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (!calendarPanel) return;
  
  calendarPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Agenda</h1>
      <p class="panel-subtitle">Gestión de citas y horarios</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-primary" onclick="showNewAppointmentModal()">
          <i class="fas fa-calendar-plus"></i> Nueva Cita
        </button>
        <button class="btn btn-outline" onclick="showAvailableProfessionals()">
          <i class="fas fa-users"></i> Ver Disponibilidad
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando agenda...</div>
  `;
  
  try {
    // Cargar citas del profesional para los próximos 7 días
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const appointmentsQuery = await db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', today)
      .where('fecha', '<=', nextWeek)
      .orderBy('fecha', 'asc')
      .get();
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Gestión de citas y horarios</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" onclick="showNewAppointmentModal()">
            <i class="fas fa-calendar-plus"></i> Nueva Cita
          </button>
          <button class="btn btn-outline" onclick="showAvailableProfessionals()">
            <i class="fas fa-users"></i> Ver Disponibilidad
          </button>
        </div>
      </div>
      
      <div class="calendar-section">
        <h2>Próximas Citas (7 días)</h2>
    `;
    
    if (appointmentsQuery.empty) {
      html += `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-calendar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No tienes citas agendadas para los próximos 7 días.
          </p>
        </div>
      `;
    } else {
      // Agrupar citas por día
      const appointmentsByDay = {};
      
      appointmentsQuery.forEach(doc => {
        const data = doc.data();
        const dateKey = formatDateOnly(data.fecha);
        
        if (!appointmentsByDay[dateKey]) {
          appointmentsByDay[dateKey] = [];
        }
        appointmentsByDay[dateKey].push({ id: doc.id, ...data });
      });
      
      // Mostrar citas agrupadas por día
      Object.keys(appointmentsByDay).forEach(dateKey => {
        const appointments = appointmentsByDay[dateKey];
        
        html += `
          <div class="day-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--primary-blue); margin-bottom: 12px; border-bottom: 2px solid var(--gray-200); padding-bottom: 8px;">
              ${dateKey} (${appointments.length} citas)
            </h3>
            <div class="appointments-grid" style="display: grid; gap: 12px;">
        `;
        
        appointments.forEach(appointment => {
          html += `
            <div class="card appointment-card" style="border-left: 4px solid var(--success-green);">
              <div class="card-header">
                <div>
                  <h4>${appointment.paciente_nombre || 'Paciente sin nombre'}</h4>
                  <p><i class="fas fa-clock"></i> ${formatTimeOnly(appointment.fecha)}</p>
                </div>
                <div style="text-align: right;">
                  <span class="status-badge status-${appointment.estado || 'programada'}">
                    ${appointment.estado || 'Programada'}
                  </span>
                </div>
              </div>
              <div class="appointment-info" style="margin-top: 12px;">
                <div><strong>Tipo:</strong> ${appointment.tipo_cita || 'Consulta general'}</div>
                <div><strong>Paciente ID:</strong> ${appointment.paciente_id || 'N/A'}</div>
                ${appointment.observaciones ? `<div><strong>Observaciones:</strong> ${appointment.observaciones}</div>` : ''}
              </div>
              <div style="margin-top: 12px;">
                <button class="btn btn-success btn-sm" onclick="startAppointment('${appointment.id}')">
                  <i class="fas fa-play"></i> Iniciar Atención
                </button>
                <button class="btn btn-outline btn-sm" onclick="editAppointment('${appointment.id}')">
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${appointment.id}')">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              </div>
            </div>
          `;
        });
        
        html += '</div></div>';
      });
    }
    
    html += '</div>';
    calendarPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading calendar:', error);
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Error al cargar la agenda</p>
      </div>
      <p>Error: ${error.message}</p>
    `;
  }
}

async function scheduleAppointment(patientId) {
  try {
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    showNewAppointmentModal(patientId, patientData.datos_personales?.nombre_completo);
    
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    showNotification('Error al programar cita', 'error');
  }
}

function showNewAppointmentModal(preselectedPatientId = null, preselectedPatientName = null) {
  const modalHTML = `
    <div class="modal-overlay" id="new-appointment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('new-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Nueva Cita</h2>
        
        <form id="new-appointment-form">
          <div class="form-group">
            <label class="form-label">Paciente *</label>
            <input type="text" class="form-input" id="appointment-patient-name" 
                   value="${preselectedPatientName || ''}" 
                   placeholder="Nombre del paciente" required 
                   ${preselectedPatientId ? 'readonly' : ''}>
            <input type="hidden" id="appointment-patient-id" value="${preselectedPatientId || ''}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input type="date" class="form-input" id="appointment-date" required 
                     min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label">Hora *</label>
              <input type="time" class="form-input" id="appointment-time" required>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Cita *</label>
            <select class="form-select" id="appointment-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="consulta_inicial">Consulta Inicial</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="evaluacion">Evaluación</option>
              <option value="terapia">Sesión de Terapia</option>
              <option value="control">Control</option>
              <option value="urgencia">Urgencia</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea class="form-textarea" id="appointment-observations" 
                      placeholder="Observaciones adicionales sobre la cita..."></textarea>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('new-appointment-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-calendar-plus"></i>
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('new-appointment-modal').style.display = 'flex';
  
  // Configurar fecha mínima (hoy)
  const dateInput = document.getElementById('appointment-date');
  if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }
  
  // Manejar envío del formulario
  document.getElementById('new-appointment-form').addEventListener('submit', handleNewAppointment);
}

async function handleNewAppointment(e) {
  e.preventDefault();
  
  const patientName = document.getElementById('appointment-patient-name').value.trim();
  const patientId = document.getElementById('appointment-patient-id').value;
  const date = document.getElementById('appointment-date').value;
  const time = document.getElementById('appointment-time').value;
  const type = document.getElementById('appointment-type').value;
  const observations = document.getElementById('appointment-observations').value.trim();
  
  if (!patientName || !date || !time || !type) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Combinar fecha y hora
    const appointmentDateTime = new Date(`${date}T${time}`);
    
    // Verificar que no haya conflictos de horario
    const conflictQuery = await db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '==', appointmentDateTime)
      .where('estado', '!=', 'cancelada')
      .get();
    
    if (!conflictQuery.empty) {
      showNotification('Ya tienes una cita agendada a esta hora', 'error');
      showLoading(false);
      return;
    }
    
    // Crear la cita
    const appointmentData = {
      paciente_id: patientId || null,
      paciente_nombre: patientName,
      profesional_id: currentUserData.uid,
      profesional_nombre: currentUserData.nombre,
      fecha: appointmentDateTime,
      tipo_cita: type,
      estado: 'programada',
      observaciones: observations || null,
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        creado_por: currentUserData.uid,
        cesfam: currentUserData.cesfam_asignado || null
      }
    };
    
    await db.collection('citas').add(appointmentData);
    
    showNotification('Cita agendada correctamente', 'success');
    closeModal('new-appointment-modal');
    loadCalendarPanel(currentUserData); // Recargar agenda
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    showNotification('Error al agendar la cita', 'error');
  } finally {
    showLoading(false);
  }
}

// ================= SEGUIMIENTOS =================

async function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (!followupsPanel) return;
  
  followupsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos</h1>
      <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>
  `;
  
  try {
    // Cargar seguimientos del profesional
    const followupsQuery = await db.collection('seguimientos')
      .where('profesional_id', '==', userData.uid)
      .orderBy('fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (followupsQuery.empty) {
      followupsPanel.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Seguimientos</h1>
          <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos registrados.
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
      </div>
    `;
    
    followupsQuery.forEach(doc => {
      const data = doc.data();
      
      html += `
        <div class="card followup-card" style="margin-bottom: 16px;">
          <div class="card-header">
            <div>
              <h4>${data.paciente_nombre || 'Paciente sin nombre'}</h4>
              <p>Fecha: ${formatDate(data.fecha_creacion)}</p>
              <p>Tipo: ${data.tipo_seguimiento || 'General'}</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado || 'completado'}">
                ${data.estado || 'Completado'}
              </span>
            </div>
          </div>
          <div class="followup-content" style="margin: 16px 0;">
            <div><strong>Resumen:</strong></div>
            <p style="margin: 8px 0; padding: 12px; background: var(--gray-50); border-radius: 8px;">
              ${data.observaciones || 'Sin observaciones registradas'}
            </p>
            ${data.proxima_cita ? `
            <div style="margin-top: 12px;">
              <strong>Próxima cita:</strong> ${formatDate(data.proxima_cita)}
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    followupsPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading followups:', error);
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Error al cargar seguimientos</p>
      </div>
      <p>Error: ${error.message}</p>
    `;
  }
}

async function addFollowupNote(patientId) {
  try {
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    showFollowupModal(patientId, patientData.datos_personales?.nombre_completo);
    
  } catch (error) {
    console.error('Error adding followup note:', error);
    showNotification('Error al abrir formulario de seguimiento', 'error');
  }
}

function showFollowupModal(patientId, patientName) {
  const modalHTML = `
    <div class="modal-overlay" id="followup-note-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('followup-note-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Registro de Seguimiento</h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
          Paciente: <strong>${patientName}</strong>
        </p>
        
        <form id="followup-form">
          <div class="form-group">
            <label class="form-label">Tipo de Seguimiento *</label>
            <select class="form-select" id="followup-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="consulta">Consulta de seguimiento</option>
              <option value="crisis">Manejo de crisis</option>
              <option value="adherencia">Control de adherencia</option>
              <option value="familiar">Intervención familiar</option>
              <option value="social">Seguimiento social</option>
              <option value="medico">Seguimiento médico</option>
              <option value="psicologico">Seguimiento psicológico</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones del Seguimiento *</label>
            <textarea class="form-textarea" id="followup-observations" required
                      placeholder="Describe la situación actual del paciente, avances, dificultades y recomendaciones..."></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Estado del Paciente</label>
              <select class="form-select" id="followup-patient-status">
                <option value="estable">Estable</option>
                <option value="mejorando">Mejorando</option>
                <option value="preocupante">Preocupante</option>
                <option value="crisis">En crisis</option>
                <option value="alta">Listo para alta</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Próxima Cita</label>
              <input type="date" class="form-input" id="followup-next-appointment"
                     min="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('followup-note-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-save"></i>
              Guardar Seguimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('followup-note-modal').style.display = 'flex';
  
  // Manejar envío del formulario
  document.getElementById('followup-form').addEventListener('submit', (e) => {
    handleFollowupSubmission(e, patientId, patientName);
  });
}

async function handleFollowupSubmission(e, patientId, patientName) {
  e.preventDefault();
  
  const type = document.getElementById('followup-type').value;
  const observations = document.getElementById('followup-observations').value.trim();
  const status = document.getElementById('followup-patient-status').value;
  const nextAppointment = document.getElementById('followup-next-appointment').value;
  
  if (!type || !observations) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Crear registro de seguimiento
    const followupData = {
      paciente_id: patientId,
      paciente_nombre: patientName,
      profesional_id: currentUserData.uid,
      profesional_nombre: currentUserData.nombre,
      tipo_seguimiento: type,
      observaciones: observations,
      estado_paciente: status,
      proxima_cita: nextAppointment ? new Date(nextAppointment) : null,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      metadata: {
        cesfam: currentUserData.cesfam_asignado || null,
        profesion: currentUserData.profesion
      }
    };
    
    await db.collection('seguimientos').add(followupData);
    
    // Actualizar historial clínico del paciente
    await db.collection('pacientes').doc(patientId).update({
      'historial_clinico': firebase.firestore.FieldValue.arrayUnion({
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        tipo: 'seguimiento',
        profesional: currentUserData.uid,
        profesional_nombre: currentUserData.nombre,
        observaciones: observations,
        tipo_seguimiento: type,
        estado_paciente: status
      }),
      'estado_actual.ultima_atencion': firebase.firestore.FieldValue.serverTimestamp(),
      'estado_actual.estado': status
    });
    
    showNotification('Seguimiento registrado correctamente', 'success');
    closeModal('followup-note-modal');
    
    // Recargar panel si estamos en seguimientos
    const followupsPanel = document.getElementById('followups-panel');
    if (followupsPanel && followupsPanel.classList.contains('active')) {
      loadFollowupsPanel(currentUserData);
    }
    
  } catch (error) {
    console.error('Error saving followup:', error);
    showNotification('Error al guardar el seguimiento', 'error');
  } finally {
    showLoading(false);
  }
}

// ================= OTRAS FUNCIONES AUXILIARES =================

async function viewPatientDetail(patientId) {
  try {
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    
    // Cargar seguimientos del paciente
    const followupsQuery = await db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha_creacion', 'desc')
      .limit(10)
      .get();
    
    showPatientDetailModal(patientId, patientData, followupsQuery.docs);
    
  } catch (error) {
    console.error('Error viewing patient detail:', error);
    showNotification('Error al cargar detalle del paciente', 'error');
  }
}

function showPatientDetailModal(patientId, data, followups) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Ficha Clínica - ${data.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
        
        <div class="patient-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div><strong>Nombre:</strong> ${data.datos_personales?.nombre_completo || 'N/A'}</div>
              <div><strong>RUT:</strong> ${data.datos_personales?.rut || 'N/A'}</div>
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
              <div><strong>Dirección:</strong> ${data.datos_personales?.direccion || 'N/A'}</div>
              <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${data.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Estado Actual</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}</span></div>
              <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'N/A'}</div>
              <div><strong>Fecha ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
              <div><strong>Última atención:</strong> ${formatDate(data.estado_actual?.ultima_atencion)}</div>
              ${data.estado_actual?.profesional_asignado ? `<div><strong>Profesional asignado:</strong> ${data.estado_actual.profesional_asignado}</div>` : ''}
              ${data.estado_actual?.estado ? `<div><strong>Estado del paciente:</strong> ${data.estado_actual.estado}</div>` : ''}
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Últimos Seguimientos</h3>
            ${followups.length > 0 ? followups.map(doc => {
              const followup = doc.data();
              return `
                <div style="border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>${followup.tipo_seguimiento || 'Seguimiento'}</strong>
                    <span style="color: var(--gray-600); font-size: 14px;">${formatDate(followup.fecha_creacion)}</span>
                  </div>
                  <p style="margin: 8px 0; color: var(--gray-700);">${followup.observaciones || 'Sin observaciones'}</p>
                  <div style="font-size: 14px; color: var(--gray-600);">
                    Por: ${followup.profesional_nombre || 'Profesional'}
                    ${followup.estado_paciente ? ` | Estado: ${followup.estado_paciente}` : ''}
                  </div>
                </div>
              `;
            }).join('') : '<p style="color: var(--gray-600); text-align: center;">No hay seguimientos registrados</p>'}
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-success" onclick="addFollowupNote('${patientId}'); closeModal('patient-detail-modal');">
            <i class="fas fa-notes-medical"></i> Agregar Seguimiento
          </button>
          <button class="btn btn-outline" onclick="scheduleAppointment('${patientId}'); closeModal('patient-detail-modal');">
            <i class="fas fa-calendar-plus"></i> Agendar Cita
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-detail-modal').style.display = 'flex';
}

// ================= FUNCIONES RESTANTES DE LA PRIMERA PARTE =================

function setupFormValidation() {
  const rutInput = document.getElementById('patient-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });

    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }

  const phoneInputs = document.querySelectorAll('#patient-phone, #anonymous-phone');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  });

  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function(e) {
      const email = e.target.value.trim();
      if (email && !isValidEmail(email)) {
        e.target.classList.add('error');
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  });

  const ageInput = document.getElementById('patient-age');
