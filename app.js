// ================= VERIFICACIÓN DE FIREBASE =================
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase no está cargado');
  alert('Error: Firebase no está disponible. Verifica las librerías.');
}

// ================= CONFIGURACIÓN DE FIREBASE =================
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
let auth, db;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();
  
  db.enablePersistence({
    synchronizeTabs: true
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistencia falló: múltiples tabs abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistencia no soportada en este navegador');
    }
  });
  
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

// ================= VARIABLES GLOBALES =================
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

let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;
let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let currentFilter = 'todas';
let currentPriorityFilter = '';
let solicitudesData = [];
let pacientesData = [];
let citasData = [];
let professionalsList = [];
let selectedProfessional = null;
let isLoading = false;
let solicitudesInformacionData = [];

const HORARIOS_CONFIG = {
  semana: {
    horaInicio: 8,
    horaFin: 16,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [1, 2, 3, 4, 5]
  },
  finSemana: {
    horaInicio: 9,
    horaFin: 12,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [0, 6]
  }
};

const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 100,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true
};

const dataCache = new Map();

// ================= FUNCIONES UTILITARIAS =================

function showNotification(message, type = 'info', duration = 4000) {
  try {
    const container = document.getElementById('notifications') || createNotificationsContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${getNotificationIcon(type)}"></i> 
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(notification);
    
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, duration);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`📢 Notification [${type.toUpperCase()}]: ${message}`);
    }
    
  } catch (error) {
    console.error('Error showing notification:', error);
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

function getNotificationIcon(type) {
  const icons = {
    'success': 'check-circle',
    'error': 'exclamation-triangle',
    'warning': 'exclamation-triangle',
    'info': 'info-circle'
  };
  return icons[type] || 'info-circle';
}

function createNotificationsContainer() {
  const container = document.createElement('div');
  container.id = 'notifications';
  container.className = 'notifications-container';
  document.body.appendChild(container);
  return container;
}

function showModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) {
          firstInput.focus();
        }
      }, 100);
      
      if (APP_CONFIG.DEBUG_MODE) {
        console.log(`🔧 Modal abierto: ${modalId}`);
      }
    }
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

function closeModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modalId === 'patient-modal' && !isDraftSaved) {
        const hasChanges = checkFormChanges();
        if (hasChanges && !confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
          return;
        }
        resetForm();
      }
      
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      if (modal.classList.contains('temp-modal')) {
        modal.remove();
      }
      
      if (APP_CONFIG.DEBUG_MODE) {
        console.log(`🔧 Modal cerrado: ${modalId}`);
      }
    }
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

function checkFormChanges() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return false;
    
    const formData = new FormData(form);
    let hasData = false;
    
    for (let [key, value] of formData.entries()) {
      if (value && value.trim() !== '') {
        hasData = true;
        break;
      }
    }
    
    return hasData;
  } catch (error) {
    console.error('Error checking form changes:', error);
    return false;
  }
}

function showLoading(show = true, message = 'Cargando...') {
  try {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      const messageElement = overlay.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
      
      if (show) {
        overlay.classList.remove('hidden');
        isLoading = true;
      } else {
        overlay.classList.add('hidden');
        isLoading = false;
      }
    }
  } catch (error) {
    console.error('Error with loading overlay:', error);
  }
}

// ================= FORMULARIO MULTI-STEP COMPLETO =================

function setupMultiStepForm() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;

    const nextButtons = form.querySelectorAll('[id^="next-step"]');
    const prevButtons = form.querySelectorAll('[id^="prev-step"]');
    
    nextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        if (validateStep(currentStep)) {
          const nextStep = getNextStep(currentStep);
          if (nextStep) {
            goToStep(nextStep);
          }
        }
      });
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        const prevStep = getPreviousStep(currentStep);
        if (prevStep) {
          goToStep(prevStep);
        }
      });
    });

    form.addEventListener('submit', handlePatientFormSubmit);

    // Listeners para tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', () => {
        const tipoSolicitud = input.value;
        
        if (tipoSolicitud === 'informacion') {
          maxFormStep = 1;
          updateProgressIndicator(1, 1);
          
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'block';
          if (basicInfoContainer) basicInfoContainer.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          if (submitBtn) submitBtn.style.display = 'inline-flex';
          
        } else if (tipoSolicitud === 'identificado') {
          maxFormStep = 4;
          updateProgressIndicator(1, 4);
          
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'none';
          if (basicInfoContainer) basicInfoContainer.style.display = 'block';
          if (nextBtn) nextBtn.style.display = 'inline-flex';
          if (submitBtn) submitBtn.style.display = 'none';
        }
        
        saveFormDraft();
      });
    });

    // Listeners para motivación
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    if (motivacionRange && motivacionValue) {
      motivacionRange.addEventListener('input', () => {
        motivacionValue.textContent = motivacionRange.value;
        updateMotivacionColor(motivacionRange.value);
      });
      
      motivacionValue.textContent = motivacionRange.value;
      updateMotivacionColor(motivacionRange.value);
    }

    // Botón específico para envío de información
    const submitInfoBtn = document.getElementById('submit-step-1');
    if (submitInfoBtn) {
      submitInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        if (tipoSolicitud === 'informacion') {
          handleInformationOnlySubmit();
        }
      });
    }

    const reentryForm = document.getElementById('reentry-form');
    if (reentryForm) {
      reentryForm.addEventListener('submit', handleReentrySubmit);
    }

    setupAutoSave();
    console.log('✅ Formulario multi-step configurado');
    
  } catch (error) {
    console.error('❌ Error configurando formulario multi-step:', error);
  }
}

function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    return null;
  }
  
  switch (currentStep) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 4;
    case 4: return null;
  }
  return null;
}

function getPreviousStep(currentStep) {
  switch (currentStep) {
    case 2: return 1;
    case 3: return 2;
    case 4: return 3;
  }
  return null;
}

function goToStep(step) {
  try {
    if (step < 1 || step > maxFormStep) return;

    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.classList.remove('active');
    });
    
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
      
      setTimeout(() => {
        const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) {
          firstInput.focus();
        }
      }, 100);
    }

    updateProgressIndicator(step, maxFormStep);
    
    currentFormStep = step;
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
  }
}

function updateProgressIndicator(current, total) {
  try {
    const progressFill = document.getElementById('form-progress');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      const progressPercentage = (current / total) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Paso ${current} de ${total}`;
    }
  } catch (error) {
    console.error('Error updating progress indicator:', error);
  }
}

function setupAutoSave() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    let autoSaveTimer;
    
    form.addEventListener('input', () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveFormDraft, 2000);
    });
    
    loadFormDraft();
    console.log('✅ Auto-guardado configurado');
  } catch (error) {
    console.error('Error setting up auto-save:', error);
  }
}

function saveFormDraft() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const draftData = {};
    
    for (let [key, value] of formData.entries()) {
      draftData[key] = value;
    }
    
    draftData.currentStep = currentFormStep;
    draftData.maxFormStep = maxFormStep;
    draftData.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
    isDraftSaved = true;
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('💾 Borrador guardado automáticamente');
    }
    
  } catch (error) {
    console.error('Error saving form draft:', error);
  }
}

function loadFormDraft() {
  try {
    const savedDraft = localStorage.getItem('senda_form_draft');
    if (!savedDraft) return;
    
    const draftData = JSON.parse(savedDraft);
    
    if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('senda_form_draft');
      return;
    }
    
    restoreFormDraft(draftData);
    
  } catch (error) {
    console.error('Error loading form draft:', error);
  }
}

function restoreFormDraft(draftData) {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'maxFormStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = field.value === draftData[key];
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    if (draftData.maxFormStep) {
      maxFormStep = draftData.maxFormStep;
    }
    
    if (draftData.currentStep) {
      goToStep(draftData.currentStep);
    }
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    if (tipoSolicitud) {
      tipoSolicitud.dispatchEvent(new Event('change'));
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📝 Borrador restaurado');
    }
    
  } catch (error) {
    console.error('Error restoring form draft:', error);
  }
}

function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      goToStep(1);
      
      const motivacionRange = document.getElementById('motivacion-range');
      const motivacionValue = document.getElementById('motivacion-value');
      if (motivacionRange && motivacionValue) {
        motivacionRange.value = 5;
        motivacionValue.textContent = '5';
        updateMotivacionColor(5);
      }
      
      form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
      });
      
      maxFormStep = 4;
      updateProgressIndicator(1, 4);
      
      const infoEmailContainer = document.getElementById('info-email-container');
      const basicInfoContainer = document.getElementById('basic-info-container');
      const nextBtn = document.getElementById('next-step-1');
      const submitBtn = document.getElementById('submit-step-1');
      
      if (infoEmailContainer) infoEmailContainer.style.display = 'none';
      if (basicInfoContainer) basicInfoContainer.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.style.display = 'none';
    }
    
    isDraftSaved = false;
    localStorage.removeItem('senda_form_draft');
    
    console.log('✅ Formulario reseteado');
  } catch (error) {
    console.error('Error reseteando formulario:', error);
  }
}

function updateMotivacionColor(value) {
  try {
    const motivacionValue = document.getElementById('motivacion-value');
    if (!motivacionValue) return;
    
    const numValue = parseInt(value);
    let color;
    
    if (numValue <= 3) {
      color = 'var(--danger-red)';
    } else if (numValue <= 6) {
      color = 'var(--warning-orange)';
    } else {
      color = 'var(--success-green)';
    }
    
    motivacionValue.style.backgroundColor = color;
    motivacionValue.style.color = 'white';
  } catch (error) {
    console.error('Error updating motivacion color:', error);
  }
}

// ================= AUTENTICACIÓN COMPLETA =================

function setupAuthForms() {
  try {
    console.log('🔧 Configurando formularios de autenticación...');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
      console.log('✅ Formulario de login configurado');
    } else {
      console.warn('⚠️ Formulario de login no encontrado');
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegisterSubmit);
      console.log('✅ Formulario de registro configurado');
    } else {
      console.warn('⚠️ Formulario de registro no encontrado');
    }
    
    console.log('✅ Formularios de autenticación configurados');
  } catch (error) {
    console.error('❌ Error configurando formularios de auth:', error);
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  
  try {
    console.log('🔐 Iniciando proceso de login...');
    
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value?.trim();
    
    if (!email || !password) {
      showNotification('Completa todos los campos', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    showLoading(true, 'Iniciando sesión...');
    
    console.log('🔐 Intentando login con email:', email);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log('✅ Login exitoso:', userCredential.user.uid);
    
    closeModal('login-modal');
    showNotification('Sesión iniciada correctamente', 'success');
    
    e.target.reset();
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    
    let errorMessage = 'Error al iniciar sesión: ';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage += 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Email inválido';
        break;
      case 'auth/user-disabled':
        errorMessage += 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        errorMessage += error.message;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  
  try {
    console.log('📝 Iniciando proceso de registro...');
    
    const formData = {
      nombre: document.getElementById('register-nombre')?.value?.trim(),
      apellidos: document.getElementById('register-apellidos')?.value?.trim(),
      email: document.getElementById('register-email')?.value?.trim(),
      password: document.getElementById('register-password')?.value?.trim(),
      profession: document.getElementById('register-profession')?.value,
      cesfam: document.getElementById('register-cesfam')?.value
    };
    
    console.log('📝 Datos del formulario:', { ...formData, password: '***' });
    
    const requiredFields = ['nombre', 'apellidos', 'email', 'password', 'profession', 'cesfam'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        showNotification(`El campo ${field} es obligatorio`, 'warning');
        return;
      }
    }
    
    if (!formData.email.endsWith('@senda.cl')) {
      showNotification('Solo se permiten emails @senda.cl', 'warning');
      return;
    }
    
    if (formData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    showLoading(true, 'Registrando usuario...');
    
    console.log('📝 Creando usuario en Firebase Auth...');
    
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    console.log('✅ Usuario creado en Auth:', user.uid);
    
    const professionalData = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      email: formData.email,
      profession: formData.profession,
      cesfam: formData.cesfam,
      activo: true,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid
    };
    
    console.log('📝 Guardando datos del profesional en Firestore...');
    
    await db.collection('profesionales').doc(user.uid).set(professionalData);
    
    console.log('✅ Profesional guardado en Firestore');
    
    closeModal('login-modal');
    showNotification('Registro exitoso. Bienvenido al sistema SENDA', 'success');
    
    e.target.reset();
    
    console.log('✅ Usuario registrado exitosamente:', user.uid);
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    let errorMessage = 'Error al registrarse: ';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'Este email ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Email inválido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage += 'Registro no permitido';
        break;
      case 'auth/weak-password':
        errorMessage += 'Contraseña muy débil';
        break;
      case 'permission-denied':
        errorMessage += 'Sin permisos para crear el perfil profesional';
        break;
      default:
        errorMessage += error.message;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

function switchLoginTab(tab) {
  try {
    console.log('🔄 Cambiando tab a:', tab);
    
    const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
    const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
      if (loginTab) loginTab.classList.add('active');
      if (registerTab) registerTab.classList.remove('active');
      if (loginForm) loginForm.classList.add('active');
      if (registerForm) registerForm.classList.remove('active');
    } else if (tab === 'register') {
      if (registerTab) registerTab.classList.add('active');
      if (loginTab) loginTab.classList.remove('active');
      if (registerForm) registerForm.classList.add('active');
      if (loginForm) loginForm.classList.remove('active');
    }
  } catch (error) {
    console.error('Error switching login tab:', error);
  }
}

function onAuthStateChanged(user) {
  try {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🔧 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
    }
    
    if (user) {
      currentUser = user;
      loadUserData();
    } else {
      currentUser = null;
      currentUserData = null;
      clearUserCache();
      showPublicContent();
    }
  } catch (error) {
    console.error('❌ Error en cambio de estado de autenticación:', error);
    showNotification('Error en autenticación', 'error');
  }
}

async function handleLogout() {
  try {
    console.log('🔐 Cerrando sesión...');
    
    showLoading(true, 'Cerrando sesión...');
    
    await auth.signOut();
    
    currentUser = null;
    currentUserData = null;
    clearUserCache();
    
    showNotification('Sesión cerrada correctamente', 'success');
    showPublicContent();
    
    console.log('✅ Sesión cerrada exitosamente');
    
  } catch (error) {
    console.error('❌ Error during logout:', error);
    showNotification('Error al cerrar sesión: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function clearUserCache() {
  try {
    solicitudesData = [];
    pacientesData = [];
    citasData = [];
    professionalsList = [];
    solicitudesInformacionData = [];
    
    dataCache.clear();
    
    const containers = [
      'requests-container',
      'patients-grid',
      'appointments-list',
      'upcoming-appointments-grid',
      'patients-timeline'
    ];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    });
    
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

async function loadUserData() {
  try {
    showLoading(true, 'Cargando datos del usuario...');
    
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const cacheKey = `user_${currentUser.uid}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      currentUserData = cachedData;
      showProfessionalContent();
      await loadInitialData();
      return;
    }

    const userData = await retryOperation(async () => {
      const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('No se encontraron datos del profesional');
      }
      
      return userDoc.data();
    });
    
    currentUserData = userData;
    setCachedData(cacheKey, userData);
    
    showProfessionalContent();
    await loadInitialData();
    
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
    
    if (error.code === 'permission-denied') {
      showNotification('Sin permisos para acceder a los datos', 'error');
    } else if (error.message.includes('No se encontraron datos')) {
      showNotification('Perfil de profesional no encontrado. Contacta al administrador.', 'error');
    } else {
      showNotification('Error al cargar datos del usuario: ' + error.message, 'error');
    }
    
    await handleLogout();
  } finally {
    showLoading(false);
  }
}

async function loadInitialData() {
  try {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    
    if (activeTab === 'solicitudes' && hasAccessToSolicitudes()) {
      await loadSolicitudes();
    } else if (activeTab === 'pacientes') {
      await loadPacientes();
    } else if (activeTab === 'agenda') {
      await loadTodayAppointments();
      renderCalendar();
    } else if (activeTab === 'seguimiento') {
      await loadSeguimiento();
    }
    
    await loadProfessionalsList();
    
  } catch (error) {
    console.error('Error cargando datos iniciales:', error);
  }
}

function showPublicContent() {
  try {
    const publicContent = document.getElementById('public-content');
    const professionalContent = document.getElementById('professional-content');
    const professionalHeader = document.getElementById('professional-header');
    const loginBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');

    if (publicContent) publicContent.style.display = 'block';
    if (professionalContent) professionalContent.style.display = 'none';
    if (professionalHeader) professionalHeader.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    console.log('📄 Mostrando contenido público');
  } catch (error) {
    console.error('Error mostrando contenido público:', error);
  }
}

function showProfessionalContent() {
  try {
    const publicContent = document.getElementById('public-content');
    const professionalContent = document.getElementById('professional-content');
    const professionalHeader = document.getElementById('professional-header');
    const loginBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');

    if (publicContent) publicContent.style.display = 'none';
    if (professionalContent) professionalContent.style.display = 'block';
    if (professionalHeader) professionalHeader.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    
    if (currentUserData) {
      updateProfessionalInfo();
      updateTabVisibility();
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  } catch (error) {
    console.error('Error mostrando contenido profesional:', error);
  }
}

function updateProfessionalInfo() {
  try {
    const professionalName = document.getElementById('professional-name');
    const professionalProfession = document.getElementById('professional-profession');
    const professionalCesfam = document.getElementById('professional-cesfam');

    if (professionalName) {
      professionalName.textContent = `${currentUserData.nombre} ${currentUserData.apellidos}`;
    }
    
    if (professionalProfession) {
      professionalProfession.textContent = getProfessionName(currentUserData.profession);
    }
    
    if (professionalCesfam) {
      professionalCesfam.textContent = currentUserData.cesfam;
    }
    
    const avatar = document.querySelector('.professional-avatar');
    if (avatar) {
      const initials = `${currentUserData.nombre.charAt(0)}${currentUserData.apellidos.charAt(0)}`.toUpperCase();
      avatar.textContent = initials;
    }
    
  } catch (error) {
    console.error('Error updating professional info:', error);
  }
}

function updateTabVisibility() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
      const tabName = btn.dataset.tab;
      if (canAccessTab(tabName)) {
        btn.style.display = 'flex';
      } else {
        btn.style.display = 'none';
        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
          const agendaPane = document.getElementById('agenda-tab');
          if (agendaTab && agendaPane) {
            agendaTab.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            agendaPane.classList.add('active');
            loadTabData('agenda');
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error updating tab visibility:', error);
  }
}

function hasAccessToSolicitudes() {
  if (!currentUserData) return false;
  return currentUserData.profession === 'asistente_social';
}

function canAccessTab(tabName) {
  if (!currentUserData) return false;
  
  switch (tabName) {
    case 'solicitudes':
      return currentUserData.profession === 'asistente_social';
    case 'agenda':
    case 'seguimiento':
    case 'pacientes':
      return true;
    default:
      return false;
  }
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

async function loadProfessionalsList() {
  try {
    const cacheKey = `professionals_${currentUserData.cesfam}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      professionalsList = cached;
      return;
    }
    
    const snapshot = await db.collection('profesionales')
      .where('activo', '==', true)
      .get();
    
    const professionals = [];
    snapshot.forEach(doc => {
      professionals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    professionalsList = professionals;
    setCachedData(cacheKey, professionals);
    
  } catch (error) {
    console.error('Error loading professionals list:', error);
  }
}

// ================= ENVÍO DE FORMULARIOS =================

async function handleInformationOnlySubmit() {
  try {
    console.log('Procesando solicitud de información únicamente...');
    
    const email = document.getElementById('info-email')?.value?.trim();
    
    if (!email || !isValidEmail(email)) {
      showNotification('Email inválido', 'error');
      return;
    }
    
    const informationData = {
      tipoSolicitud: 'informacion',
      email: email,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente_respuesta',
      origen: 'web_publica',
      prioridad: 'baja',
      identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log('Guardando solicitud de información...');
    
    await db.collection('solicitudes_informacion').add(informationData);
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 'success', 6000);
    
  } catch (error) {
    console.error('Error enviando información:', error);
    showNotification('Error al enviar la solicitud: ' + error.message, 'error');
  }
}

function collectFormDataSafe() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (!tipoSolicitud) {
      throw new Error('Tipo de solicitud no seleccionado');
    }
    
    const solicitudData = {
      tipoSolicitud,
      edad: parseInt(document.getElementById('patient-age')?.value) || null,
      cesfam: document.getElementById('patient-cesfam')?.value || '',
      paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || '',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      origen: 'web_publica',
      version: '2.0'
    };

    const sustanciasChecked = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustanciasChecked.length > 0) {
      solicitudData.sustancias = Array.from(sustanciasChecked).map(cb => cb.value);
    }

    const tiempoConsumo = document.getElementById('tiempo-consumo');
    if (tiempoConsumo && tiempoConsumo.value) {
      solicitudData.tiempoConsumo = tiempoConsumo.value;
    }

    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (urgencia) {
      solicitudData.urgencia = urgencia.value;
    }

    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (tratamientoPrevio) {
      solicitudData.tratamientoPrevio = tratamientoPrevio.value;
    }
    
    const descripcion = document.getElementById('patient-description');
    if (descripcion && descripcion.value.trim()) {
      solicitudData.descripcion = descripcion.value.trim();
    }

    const motivacion = document.getElementById('motivacion-range');
    if (motivacion && motivacion.value) {
      solicitudData.motivacion = parseInt(motivacion.value);
    }

    if (tipoSolicitud === 'identificado') {
      const nombre = document.getElementById('patient-name')?.value?.trim();
      const apellidos = document.getElementById('patient-lastname')?.value?.trim();
      const rut = document.getElementById('patient-rut')?.value?.trim();
      const telefono = document.getElementById('patient-phone')?.value?.trim();
      const email = document.getElementById('patient-email')?.value?.trim();
      const direccion = document.getElementById('patient-address')?.value?.trim();

      if (nombre) solicitudData.nombre = nombre;
      if (apellidos) solicitudData.apellidos = apellidos;
      if (rut) solicitudData.rut = formatRUT(rut);
      if (telefono) solicitudData.telefono = formatPhoneNumber(telefono);
      if (email) solicitudData.email = email;
      if (direccion) solicitudData.direccion = direccion;
    }

    console.log('Datos recopilados exitosamente:', solicitudData);
    return solicitudData;
    
  } catch (error) {
    console.error('Error recopilando datos del formulario:', error);
    throw new Error('Error recopilando datos del formulario: ' + error.message);
  }
}

function calculatePriority(solicitudData) {
  let score = 0;
  
  if (solicitudData.urgencia === 'alta') score += 3;
  else if (solicitudData.urgencia === 'media') score += 2;
  else score += 1;
  
  if (solicitudData.edad) {
    if (solicitudData.edad < 18 || solicitudData.edad > 65) score += 2;
    else score += 1;
  }
  
  if (solicitudData.sustancias && solicitudData.sustancias.length > 2) score += 2;
  else if (solicitudData.sustancias && solicitudData.sustancias.length > 0) score += 1;
  
  if (solicitudData.motivacion) {
    if (solicitudData.motivacion >= 8) score += 2;
    else if (solicitudData.motivacion >= 5) score += 1;
  }
  
  if (score >= 8) return 'critica';
  else if (score >= 6) return 'alta';
  else if (score >= 4) return 'media';
  else return 'baja';
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  console.log('Iniciando envío de solicitud...');
  
  const submitBtn = document.getElementById('submit-form');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (!tipoSolicitud) {
      showNotification('Selecciona un tipo de solicitud', 'warning');
      return;
    }

    if (tipoSolicitud !== 'identificado') {
      showNotification('Tipo de solicitud no válido para este flujo', 'error');
      return;
    }

    const edad = document.getElementById('patient-age')?.value;
    const cesfam = document.getElementById('patient-cesfam')?.value;
    const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    
    if (!edad || !cesfam || !paraMi) {
      showNotification('Completa todos los campos básicos obligatorios', 'warning');
      return;
    }

    const nombre = document.getElementById('patient-name')?.value?.trim();
    const apellidos = document.getElementById('patient-lastname')?.value?.trim();
    const rut = document.getElementById('patient-rut')?.value?.trim();
    const telefono = document.getElementById('patient-phone')?.value?.trim();
    
    if (!nombre || !apellidos || !rut || !telefono) {
      showNotification('Para solicitud identificada, completa todos los datos personales', 'warning');
      return;
    }
    
    if (!validateRUT(rut)) {
      showNotification('RUT inválido', 'warning');
      return;
    }
    
    if (!validatePhoneNumberString(telefono)) {
      showNotification('Teléfono inválido', 'warning');
      return;
    }

    const solicitudData = collectFormDataSafe();
    console.log('Datos recopilados:', solicitudData);
    
    solicitudData.prioridad = calculatePriority(solicitudData);
    console.log('Prioridad calculada:', solicitudData.prioridad);
    
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    console.log('Guardando en Firestore...');
    
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_ingreso').add(solicitudData);
    });
    
    console.log('Solicitud guardada con ID:', docRef.id);
    
    if (solicitudData.prioridad === 'critica') {
      try {
        await createCriticalAlert(solicitudData, docRef.id);
        console.log('Alerta crítica creada');
      } catch (alertError) {
        console.warn('Error creando alerta crítica:', alertError);
      }
    }
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.', 'success', 6000);
    console.log('Proceso completado exitosamente');
    
  } catch (error) {
    console.error('Error enviando solicitud:', error);
    
    let errorMessage = 'Error al enviar la solicitud: ';
    
    if (error.code === 'permission-denied') {
      errorMessage += 'Sin permisos para crear solicitudes. Verifica las reglas de Firebase.';
    } else if (error.code === 'network-request-failed') {
      errorMessage += 'Problema de conexión. Verifica tu internet.';
    } else if (error.code === 'unavailable') {
      errorMessage += 'Servicio no disponible temporalmente.';
    } else if (error.message.includes('Firebase')) {
      errorMessage += 'Error de configuración de Firebase.';
    } else {
      errorMessage += error.message || 'Intenta nuevamente en unos momentos.';
    }
    
    showNotification(errorMessage, 'error', 8000);
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

async function handleReentrySubmit(e) {
  e.preventDefault();
  console.log('Iniciando envío de reingreso...');
  
  const formData = {
    nombre: document.getElementById('reentry-name')?.value?.trim() || '',
    rut: document.getElementById('reentry-rut')?.value?.trim() || '',
    cesfam: document.getElementById('reentry-cesfam')?.value || '',
    motivo: document.getElementById('reentry-reason')?.value?.trim() || '',
    telefono: document.getElementById('reentry-phone')?.value?.trim() || ''
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  const requiredFields = [
    { field: 'nombre', name: 'Nombre' },
    { field: 'rut', name: 'RUT' },
    { field: 'cesfam', name: 'CESFAM' },
    { field: 'motivo', name: 'Motivo' },
    { field: 'telefono', name: 'Teléfono' }
  ];

  for (const { field, name } of requiredFields) {
    if (!formData[field]) {
      showNotification(`El campo ${name} es obligatorio`, 'warning');
      return;
    }
  }

  if (!validateRUT(formData.rut)) {
    showNotification('RUT inválido', 'warning');
    return;
  }

  const phoneClean = formData.telefono.replace(/\D/g, '');
  if (phoneClean.length < 8) {
    showNotification('Teléfono inválido', 'warning');
    return;
  }

  try {
    toggleSubmitButton(submitBtn, true);
    
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    const rutFormatted = formatRUT(formData.rut);
    try {
      const existingReingreso = await db.collection('reingresos')
        .where('rut', '==', rutFormatted)
        .where('estado', '==', 'pendiente')
        .get();
      
      if (!existingReingreso.empty) {
        showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
        return;
      }
    } catch (queryError) {
      console.warn('Error verificando reingresos existentes:', queryError);
    }
    
    const reingresoData = {
      nombre: formData.nombre,
      rut: rutFormatted,
      telefono: formatPhoneNumber(formData.telefono),
      cesfam: formData.cesfam,
      motivo: formData.motivo,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      prioridad: 'media',
      tipo: 'reingreso',
      origen: 'web_publica',
      version: '2.0'
    };

    const docRef = await db.collection('reingresos').add(reingresoData);
    
    closeModal('reentry-modal');
    e.target.reset();
    showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 5000);
    
  } catch (error) {
    console.error('Error enviando reingreso:', error);
    
    let errorMessage = 'Error al enviar la solicitud de reingreso: ';
    if (error.code === 'permission-denied') {
      errorMessage += 'Sin permisos para crear reingresos.';
    } else if (error.code === 'network-request-failed') {
      errorMessage += 'Problema de conexión. Verifica tu internet.';
    } else {
      errorMessage += error.message || 'Intenta nuevamente.';
    }
    
    showNotification(errorMessage, 'error', 8000);
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

async function createCriticalAlert(solicitudData, solicitudId) {
  try {
    const alertData = {
      id_solicitud: solicitudId,
      mensaje: `Nuevo caso crítico: ${solicitudData.edad} años, urgencia ${solicitudData.urgencia}`,
      prioridad: 'maxima',
      tipo_alerta: 'caso_critico_nuevo',
      estado: 'pendiente',
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      notificado: false,
      cesfam: solicitudData.cesfam,
      datos_paciente: {
        edad: solicitudData.edad,
        sustancias: solicitudData.sustancias,
        urgencia: solicitudData.urgencia,
        motivacion: solicitudData.motivacion
      }
    };
    
    await db.collection('alertas_criticas').add(alertData);
    
    console.log('Alerta crítica creada para solicitud:', solicitudId);
  } catch (error) {
    console.error('Error creando alerta crítica:', error);
  }
}

// ================= VALIDACIÓN DE FORMULARIOS =================

function validateStep(step) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
    let isValid = true;
    const errors = [];

    requiredFields.forEach(field => {
      const value = field.value?.trim() || '';
      
      if (!value) {
        field.classList.add('error');
        errors.push(`${getFieldLabel(field)} es obligatorio`);
        isValid = false;
      } else {
        field.classList.remove('error');
      }
    });

    if (step === 1) {
      if (!tipoSolicitud) {
        errors.push('Selecciona un tipo de solicitud');
        isValid = false;
      } else if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email');
        if (!email || !email.value.trim()) {
          errors.push('Ingresa un email para recibir información');
          isValid = false;
        } else if (!isValidEmail(email.value.trim())) {
          errors.push('Ingresa un email válido');
          isValid = false;
        }
      } else if (tipoSolicitud === 'identificado') {
        const edad = parseInt(document.getElementById('patient-age')?.value);
        if (!edad || edad < 12 || edad > 120) {
          errors.push('La edad debe estar entre 12 y 120 años');
          isValid = false;
        }

        const cesfam = document.getElementById('patient-cesfam')?.value;
        if (!cesfam) {
          errors.push('Selecciona un CESFAM');
          isValid = false;
        }

        const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
        if (!paraMi) {
          errors.push('Indica para quién solicitas ayuda');
          isValid = false;
        }
      }
    }

    if (step === 2) {
      const rut = document.getElementById('patient-rut');
      if (rut && rut.value.trim() && !validateRUT(rut.value.trim())) {
        errors.push('RUT inválido');
        isValid = false;
      }

      const phone = document.getElementById('patient-phone');
      if (phone && phone.value.trim() && !validatePhoneNumberString(phone.value.trim())) {
        errors.push('Teléfono inválido');
        isValid = false;
      }

      const email = document.getElementById('patient-email');
      if (email && email.value.trim() && !isValidEmail(email.value.trim())) {
        errors.push('Email inválido');
        isValid = false;
      }
    }

    if (step === 3) {
      const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
      if (sustancias.length === 0) {
        errors.push('Selecciona al menos una sustancia');
        isValid = false;
      }

      const urgencia = document.querySelector('input[name="urgencia"]:checked');
      if (!urgencia) {
        errors.push('Selecciona el nivel de urgencia');
        isValid = false;
      }

      const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
      if (!tratamientoPrevio) {
        errors.push('Indica si has recibido tratamiento previo');
        isValid = false;
      }
    }

    if (errors.length > 0) {
      showNotification(errors.join('\n'), 'warning', 5000);
    }

    return isValid;
  } catch (error) {
    console.error('Error validating step:', error);
    return false;
  }
}

function getFieldLabel(field) {
  try {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  } catch (error) {
    return 'Campo';
  }
}

// ================= FUNCIONES BÁSICAS =================

function formatRUT(rut) {
  try {
    if (!rut) return '';
    
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    
    if (cleaned.length < 2) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    
    return `${formattedBody}-${dv}`;
  } catch (error) {
    console.error('Error formatting RUT:', error);
    return rut;
  }
}
// ... (continuación del código anterior)

function validateRUT(rut) {
  try {
    if (!rut) return false;
    
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (cleaned.length < 8 || cleaned.length > 9) return false;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    if (!/^\d+$/.test(body)) return false;
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDV = 11 - (sum % 11);
    let finalDV;
    
    if (expectedDV === 11) {
      finalDV = '0';
    } else if (expectedDV === 10) {
      finalDV = 'K';
    } else {
      finalDV = expectedDV.toString();
    }
    
    return dv === finalDV;
  } catch (error) {
    console.error('Error validating RUT:', error);
    return false;
  }
}

function isValidEmail(email) {
  try {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  } catch (error) {
    console.error('Error validating email:', error);
    return false;
  }
}

function validatePhoneNumberString(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
}

function formatDate(timestamp) {
  try {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

function parseLocalDateFromInput(dateStr) {
  // Para 'YYYY-MM-DD'
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toggleSubmitButton(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.setAttribute('data-original-text', originalText);
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  } else {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.innerHTML = originalText;
    }
  }
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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

function getPriorityColor(prioridad) {
  const colors = {
    'critica': '#ef4444',
    'alta': '#f59e0b',
    'media': '#3b82f6',
    'baja': '#10b981'
  };
  return colors[prioridad] || '#6b7280';
}

async function retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
      );
    }
  }
}

function getCachedData(key) {
  const cached = dataCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < APP_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// ================= GESTIÓN DE SOLICITUDES =================

async function loadSolicitudes() {
  if (!currentUserData || !hasAccessToSolicitudes()) {
    console.log('Usuario no tiene acceso a solicitudes');
    return;
  }

  try {
    showLoading(true, 'Cargando solicitudes...');
    const container = document.getElementById('requests-container');
    
    if (!container) {
      console.error('Container requests-container no encontrado');
      return;
    }
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    await loadSolicitudesFromFirestore(true);
    
  } catch (error) {
    console.error('Error general cargando solicitudes:', error);
    renderSolicitudesError(error);
  } finally {
    showLoading(false);
  }
}

async function loadSolicitudesFromFirestore(showLoadingIndicator = true) {
  try {
    if (showLoadingIndicator) {
      const container = document.getElementById('requests-container');
      if (container) {
        container.innerHTML = `
          <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando solicitudes...
          </div>
        `;
      }
    }
    
    const solicitudes = [];
    
    console.log('Cargando solicitudes para CESFAM:', currentUserData.cesfam);
    
    try {
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'solicitud',
          ...data
        });
      });
      
    } catch (error) {
      console.error('Error cargando solicitudes_ingreso:', error);
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    try {
      const reingresosSnapshot = await db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('Reingresos encontrados:', reingresosSnapshot.size);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'reingreso',
          ...data
        });
      });
      
    } catch (error) {
      console.error('Error cargando reingresos:', error);
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    try {
      const informacionSnapshot = await db.collection('solicitudes_informacion')
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
        .get();
      
      console.log('Solicitudes información encontradas:', informacionSnapshot.size);
      
      informacionSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'informacion',
          tipoSolicitud: 'informacion',
          ...data
        });
      });
      
    } catch (error) {
      console.error('Error cargando solicitudes_informacion:', error);
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    console.log('Total solicitudes procesadas:', solicitudes.length);
    
    solicitudesData = solicitudes;
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    renderSolicitudes(solicitudes);
    
  } catch (error) {
    console.error('Error cargando desde Firestore:', error);
    renderSolicitudesError(error);
  }
}

function renderSolicitudes(solicitudes) {
  try {
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('Container requests-container no encontrado');
      return;
    }

    console.log('Renderizando solicitudes:', solicitudes.length);

    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-inbox"></i>
          <h3>No hay solicitudes</h3>
          <p>No se encontraron solicitudes para tu CESFAM: ${currentUserData.cesfam}</p>
          <button class="btn btn-primary mt-4" onclick="loadSolicitudes()">
            <i class="fas fa-redo"></i>
            Actualizar
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = solicitudes.map(solicitud => createSolicitudCard(solicitud)).join('');

    container.querySelectorAll('.request-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        
        const solicitudId = card.dataset.id;
        const solicitud = solicitudes.find(s => s.id === solicitudId);
        if (solicitud) {
          showSolicitudDetail(solicitud);
        }
      });
    });
    
    console.log(`Renderizadas ${solicitudes.length} solicitudes`);
  } catch (error) {
    console.error('Error renderizando solicitudes:', error);
  }
}

function createSolicitudCard(solicitud) {
  try {
    const fecha = formatDate(solicitud.fechaCreacion);
    const prioridad = solicitud.prioridad || 'baja';
    const estado = solicitud.estado || 'pendiente';
    
    let titulo, subtitulo, tipoIcon;
    
    if (solicitud.tipo === 'reingreso') {
      titulo = `Reingreso - ${solicitud.nombre || 'Sin nombre'}`;
      subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      tipoIcon = 'fa-redo';
    } else if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') {
      titulo = 'Solicitud de Información';
      subtitulo = `Email: ${solicitud.email || 'No disponible'}`;
      tipoIcon = 'fa-info-circle';
    } else {
      tipoIcon = 'fa-user-plus';
      if (solicitud.tipoSolicitud === 'identificado') {
        titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
        subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      } else {
        titulo = 'Solicitud General';
        subtitulo = `Edad: ${solicitud.edad || 'No especificada'} años`;
      }
    }

    const sustancias = solicitud.sustancias || [];
    const sustanciasHtml = sustancias.length > 0 ? 
      sustancias.map(s => `<span class="substance-tag">${s}</span>`).join('') : '';

    const prioridadColor = {
      'critica': '#ef4444',
      'alta': '#f59e0b',
      'media': '#3b82f6',
      'baja': '#10b981'
    };

    const estadoIcon = {
      'pendiente': 'fa-clock',
      'en_proceso': 'fa-spinner',
      'agendada': 'fa-calendar-check',
      'completada': 'fa-check-circle',
      'pendiente_respuesta': 'fa-reply'
    };

    const responderBtn = (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') ? 
      `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); showResponderModal('${solicitud.id}')" title="Responder solicitud de información">
        <i class="fas fa-reply"></i>
        Responder
      </button>` : '';

    return `
      <div class="request-card" data-id="${solicitud.id}" style="transition: all 0.2s ease;">
        <div class="request-header">
          <div class="request-info">
            <h3>
              <i class="fas ${tipoIcon}" style="margin-right: 8px; color: var(--primary-blue);"></i>
              ${titulo}
            </h3>
            <p style="color: var(--gray-600);">${subtitulo}</p>
          </div>
          <div class="request-meta">
            <span class="priority-badge ${prioridad}" style="background-color: ${prioridadColor[prioridad]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${prioridad.toUpperCase()}
            </span>
            ${solicitud.tipo === 'reingreso' ? '<span class="request-type reingreso" style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">REINGRESO</span>' : ''}
            ${solicitud.tipo === 'informacion' ? '<span class="request-type informacion" style="background: #f0f9ff; color: #0c4a6e; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">INFORMACIÓN</span>' : ''}
          </div>
        </div>
        
        <div class="request-body">
          ${sustanciasHtml ? `<div class="request-substances" style="margin-bottom: 8px;">${sustanciasHtml}</div>` : ''}
          ${solicitud.descripcion || solicitud.motivo ? 
            `<p class="request-description" style="color: var(--gray-700); line-height: 1.5;">${truncateText(solicitud.descripcion || solicitud.motivo, 150)}</p>` : ''}
          
          <div class="request-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--gray-600);">
            ${solicitud.cesfam ? `<div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>` : ''}
            <div><strong>Estado:</strong> 
              <span class="status-${estado}" style="display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas ${estadoIcon[estado] || 'fa-circle'}"></i>
                ${estado.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
            <div><strong>Fecha:</strong> ${fecha}</div>
          </div>
        </div>
        
        <div class="request-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          ${responderBtn}
          ${solicitud.tipo !== 'informacion' ? 
            `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModalFromSolicitud('${solicitud.id}')" title="Agendar cita">
              <i class="fas fa-calendar-plus"></i>
              Agendar
            </button>` : ''
          }
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showSolicitudDetailById('${solicitud.id}')" title="Ver detalles completos">
            <i class="fas fa-eye"></i>
            Ver Detalle
          </button>
          ${solicitud.prioridad === 'critica' ? 
            `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleUrgentCase('${solicitud.id}')" title="Caso urgente">
              <i class="fas fa-exclamation-triangle"></i>
              URGENTE
            </button>` : ''
          }
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error creando tarjeta de solicitud:', error);
    return `
      <div class="request-card error-card">
        <div class="request-header">
          <h3>Error al cargar solicitud</h3>
        </div>
        <div class="request-body">
          <p>No se pudo cargar la información de esta solicitud</p>
        </div>
      </div>
    `;
  }
}

function renderSolicitudesError(error) {
  const container = document.getElementById('requests-container');
  if (!container) return;
  
  let errorMessage = 'Error al cargar solicitudes';
  let errorDetails = '';
  
  if (error.code === 'permission-denied') {
    errorMessage = 'Sin permisos de acceso';
    errorDetails = 'No tienes permisos para ver las solicitudes de este CESFAM';
  } else if (error.code === 'unavailable') {
    errorMessage = 'Servicio no disponible';
    errorDetails = 'El servicio está temporalmente no disponible';
  } else {
    errorDetails = error.message;
  }
  
  container.innerHTML = `
    <div class="no-results">
      <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
      <h3>${errorMessage}</h3>
      <p>${errorDetails}</p>
      <div class="mt-4">
        <button class="btn btn-primary" onclick="loadSolicitudes()">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    </div>
  `;
}

function filterSolicitudes() {
  try {
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    
    let filteredSolicitudes = solicitudesData;
    
    if (currentFilter !== 'todas') {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.estado === currentFilter);
    }
    
    if (priorityFilter) {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.prioridad === priorityFilter);
    }
    
    renderSolicitudes(filteredSolicitudes);
    
  } catch (error) {
    console.error('Error filtering solicitudes:', error);
  }
}

function showSolicitudDetail(solicitud) {
  try {
    const detailModal = createSolicitudDetailModal(solicitud);
    document.body.insertAdjacentHTML('beforeend', detailModal);
    showModal('solicitud-detail-modal');
  } catch (error) {
    console.error('Error showing solicitud detail:', error);
    showNotification('Error al mostrar detalle de solicitud', 'error');
  }
}

function createSolicitudDetailModal(solicitud) {
  const fecha = formatDate(solicitud.fechaCreacion);
  const prioridad = solicitud.prioridad || 'baja';
  const estado = solicitud.estado || 'pendiente';
  
  let tipoSolicitud = 'Solicitud General';
  if (solicitud.tipo === 'reingreso') {
    tipoSolicitud = 'Reingreso';
  } else if (solicitud.tipoSolicitud === 'identificado') {
    tipoSolicitud = 'Solicitud Identificada';
  } else if (solicitud.tipoSolicitud === 'informacion') {
    tipoSolicitud = 'Solicitud de Información';
  }
  
  return `
    <div class="modal-overlay temp-modal" id="solicitud-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('solicitud-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-file-alt"></i> Detalle de Solicitud</h2>
          
          <div class="solicitud-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
              <div>
                <h3 style="margin: 0; color: var(--primary-blue);">
                  ${tipoSolicitud}
                </h3>
                <p style="margin: 4px 0; font-weight: 500;">ID: ${solicitud.id}</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <span class="priority-badge ${prioridad}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold; color: white; background-color: ${getPriorityColor(prioridad)};">
                  ${prioridad.toUpperCase()}
                </span>
                <span class="status-badge ${estado}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                  ${estado.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Datos Personales</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  ${solicitud.nombre ? `<div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>` : ''}
                  ${solicitud.rut ? `<div><strong>RUT:</strong> ${solicitud.rut}</div>` : ''}
                  ${solicitud.email ? `<div><strong>Email:</strong> ${solicitud.email}</div>` : ''}
                  ${solicitud.telefono ? `<div><strong>Teléfono:</strong> ${solicitud.telefono}</div>` : ''}
                  ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
                  ${solicitud.direccion ? `<div><strong>Dirección:</strong> ${solicitud.direccion}</div>` : ''}
                </div>
              </div>
              
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Información de Solicitud</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>CESFAM:</strong> ${solicitud.cesfam || 'No especificado'}</div>
                  <div><strong>Fecha:</strong> ${fecha}</div>
                  <div><strong>Origen:</strong> ${solicitud.origen || 'Web pública'}</div>
                  ${solicitud.paraMi ? `<div><strong>Para:</strong> ${solicitud.paraMi === 'si' ? 'Sí mismo' : 'Otra persona'}</div>` : ''}
                  ${solicitud.urgencia ? `<div><strong>Urgencia:</strong> ${solicitud.urgencia.toUpperCase()}</div>` : ''}
                  ${solicitud.motivacion ? `<div><strong>Motivación:</strong> ${solicitud.motivacion}/10</div>` : ''}
                </div>
              </div>
            </div>
            
            ${solicitud.sustancias && solicitud.sustancias.length > 0 ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias Problemáticas</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${solicitud.sustancias.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                </div>
              </div>` : ''
            }
            
            ${solicitud.descripcion || solicitud.motivo ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Descripción/Motivo</h4>
                <p style="margin: 0; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 6px; line-height: 1.5;">
                  ${solicitud.descripcion || solicitud.motivo}
                </p>
              </div>` : ''
            }
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showSolicitudDetailById(solicitudId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (solicitud) {
      showSolicitudDetail(solicitud);
    } else {
      showNotification('Solicitud no encontrada', 'error');
    }
  } catch (error) {
    console.error('Error showing solicitud detail by ID:', error);
  }
}

// ================= MODAL RESPONDER SOLICITUDES =================

function showResponderModal(solicitudId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }

    const responderModal = `
      <div class="modal-overlay temp-modal" id="responder-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('responder-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-reply"></i> Responder Solicitud de Información</h2>
            
            <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
                <i class="fas fa-info-circle"></i> Información de la Solicitud
              </h4>
              <div style="font-size: 14px;">
                <strong>Email del solicitante:</strong> ${solicitud.email}<br>
                <strong>Fecha:</strong> ${formatDate(solicitud.fechaCreacion)}<br>
                <strong>ID:</strong> ${solicitud.id}
              </div>
            </div>
            
            <form id="responder-form">
              <input type="hidden" id="responder-solicitud-id" value="${solicitud.id}">
              
              <div class="form-group">
                <label class="form-label">Desde (Email institucional) *</label>
                <input type="email" class="form-input" id="responder-from" 
                       value="${currentUserData.email || currentUserData.nombre.toLowerCase().replace(/\s+/g, '.')}@senda.cl" readonly>
              </div>
              
              <div class="form-group">
                <label class="form-label">Para *</label>
                <input type="email" class="form-input" id="responder-to" 
                       value="${solicitud.email}" readonly>
              </div>
              
              <div class="form-group">
                <label class="form-label">Asunto *</label>
                <input type="text" class="form-input" id="responder-subject" 
                       value="Respuesta a su solicitud de información - SENDA Puente Alto" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Mensaje *</label>
                <textarea class="form-textarea" id="responder-message" rows="8" required
                          placeholder="Estimado/a solicitante,

Gracias por contactar al Programa SENDA Puente Alto. En respuesta a su solicitud de información...

Atentamente,
${currentUserData.nombre} ${currentUserData.apellidos}
${getProfessionName(currentUserData.profession)}
SENDA ${currentUserData.cesfam}"></textarea>
              </div>
              
              <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeModal('responder-modal')">
                  <i class="fas fa-times"></i>
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success">
                  <i class="fas fa-paper-plane"></i>
                  Enviar Respuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', responderModal);
    showModal('responder-modal');

    document.getElementById('responder-form').addEventListener('submit', handleResponderSubmit);

  } catch (error) {
    console.error('Error showing responder modal:', error);
    showNotification('Error al abrir modal de respuesta', 'error');
  }
}

async function handleResponderSubmit(e) {
  e.preventDefault();
  
  try {
    const solicitudId = document.getElementById('responder-solicitud-id').value;
    const from = document.getElementById('responder-from').value;
    const to = document.getElementById('responder-to').value;
    const subject = document.getElementById('responder-subject').value;
    const message = document.getElementById('responder-message').value;
    
    if (!subject.trim() || !message.trim()) {
      showNotification('Complete todos los campos obligatorios', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    const respuestaData = {
      solicitudId: solicitudId,
      from: from,
      to: to,
      subject: subject,
      message: message,
      fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
      respondidoPor: currentUser.uid,
      profesionalNombre: `${currentUserData.nombre} ${currentUserData.apellidos}`,
      cesfam: currentUserData.cesfam,
      estado: 'enviado'
    };
    
    await db.collection('respuestas_informacion').add(respuestaData);
    
    await db.collection('solicitudes_informacion').doc(solicitudId).update({
      estado: 'respondida',
      fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
      respondidoPor: currentUser.uid
    });
    
    closeModal('responder-modal');
    showNotification('Respuesta enviada y registrada correctamente', 'success');
    
    await loadSolicitudes();
    
  } catch (error) {
    console.error('Error enviando respuesta:', error);
    showNotification('Error al enviar respuesta: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ... (continuación del código anterior)

// ================= AGENDAR CITAS DESDE SOLICITUDES =================

function showAgendaModalFromSolicitud(solicitudId) {
  try {
    console.log('📅 Agendando cita desde solicitud:', solicitudId);
    
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const nuevaCitaModal = `
      <div class="modal-overlay temp-modal" id="nueva-cita-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-calendar-plus"></i> Agendar Cita - Solicitud ${solicitud.id}</h2>
            
            <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
                <i class="fas fa-info-circle"></i> Datos del Solicitante
              </h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                <div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>
                <div><strong>RUT:</strong> ${solicitud.rut}</div>
                <div><strong>Edad:</strong> ${solicitud.edad} años</div>
                <div><strong>Teléfono:</strong> ${solicitud.telefono || 'No disponible'}</div>
                <div><strong>Email:</strong> ${solicitud.email || 'No disponible'}</div>
                <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
              </div>
            </div>
            
            <form id="nueva-cita-form">
              <input type="hidden" id="solicitud-id" value="${solicitud.id}">
              <input type="hidden" id="nueva-cita-nombre" value="${solicitud.nombre} ${solicitud.apellidos || ''}">
              <input type="hidden" id="nueva-cita-rut" value="${solicitud.rut}">
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Profesional *</label>
                  <select class="form-select" id="nueva-cita-professional" required>
                    <option value="">Seleccionar profesional...</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Fecha *</label>
                  <input type="date" class="form-input" id="nueva-cita-date" required>
                </div>
              </div>
              
              <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
                <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                  <i class="fas fa-clock"></i> Horarios Disponibles
                </h4>
                <div class="time-slots-grid" id="nueva-cita-time-slots-grid">
                </div>
              </div>
              
              <div class="form-group" style="margin-top: 24px;">
                <label class="form-label">Observaciones</label>
                <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
                          placeholder="Observaciones adicionales para la cita...">${solicitud.descripcion || solicitud.motivo || ''}</textarea>
              </div>
              
              <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeModal('nueva-cita-modal')">
                  <i class="fas fa-times"></i>
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success" disabled>
                  <i class="fas fa-calendar-check"></i>
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', nuevaCitaModal);
    showModal('nueva-cita-modal');
    
    loadProfessionalsForNuevaCita();
    
  } catch (error) {
    console.error('Error showing agenda modal from solicitud:', error);
    showNotification('Error al abrir modal de agenda', 'error');
  }
}

function createNuevaCitaModal() {
  try {
    const nuevaCitaModal = `
      <div class="modal-overlay temp-modal" id="nueva-cita-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-calendar-plus"></i> Nueva Cita</h2>
            
            <form id="nueva-cita-form">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Nombre del Paciente *</label>
                  <input type="text" class="form-input" id="nueva-cita-nombre" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label">RUT *</label>
                  <input type="text" class="form-input" id="nueva-cita-rut" placeholder="12.345.678-9" required>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Profesional *</label>
                  <select class="form-select" id="nueva-cita-professional" required>
                    <option value="">Seleccionar profesional...</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Fecha *</label>
                  <input type="date" class="form-input" id="nueva-cita-date" required>
                </div>
              </div>
              
              <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
                <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                  <i class="fas fa-clock"></i> Horarios Disponibles
                </h4>
                <div class="time-slots-grid" id="nueva-cita-time-slots-grid">
                </div>
              </div>
              
              <div class="form-group" style="margin-top: 24px;">
                <label class="form-label">Observaciones</label>
                <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
                          placeholder="Observaciones adicionales para la cita..."></textarea>
              </div>
              
              <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeModal('nueva-cita-modal')">
                  <i class="fas fa-times"></i>
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success" disabled>
                  <i class="fas fa-calendar-check"></i>
                  Crear Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', nuevaCitaModal);
    showModal('nueva-cita-modal');
    
    loadProfessionalsForNuevaCita();
    
  } catch (error) {
    console.error('Error creating nueva cita modal:', error);
    showNotification('Error al abrir modal de nueva cita', 'error');
  }
}

async function loadProfessionalsForNuevaCita() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    if (!professionalSelect) return;

    let professionals = professionalsList;
    if (professionals.length === 0) {
      professionals = await loadProfessionalsByArea();
    }
    
    professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
    
    professionals.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = `${prof.nombre} ${prof.apellidos} - ${getProfessionName(prof.profession)}`;
      option.dataset.profession = prof.profession;
      option.dataset.nombre = `${prof.nombre} ${prof.apellidos}`;
      professionalSelect.appendChild(option);
    });

    setupNuevaCitaFormListeners();
    
  } catch (error) {
    console.error('Error loading professionals for nueva cita:', error);
    showNotification('Error al cargar profesionales', 'error');
  }
}

async function loadProfessionalsByArea() {
  try {
    if (!currentUserData) return [];
    
    const snapshot = await db.collection('profesionales')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('activo', '==', true)
      .get();
    
    const professionals = [];
    snapshot.forEach(doc => {
      professionals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return professionals;
  } catch (error) {
    console.error('Error loading professionals by area:', error);
    return [];
  }
}

function setupNuevaCitaFormListeners() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const citaDate = document.getElementById('nueva-cita-date');
    const citaForm = document.getElementById('nueva-cita-form');
    const rutInput = document.getElementById('nueva-cita-rut');
    
   if (citaDate) {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  citaDate.min = todayString;

  if (!citaDate.value) {
    citaDate.value = todayString;
  }
}

    if (rutInput) {
      rutInput.addEventListener('input', (e) => {
        e.target.value = formatRUT(e.target.value);
      });
    }

    if (professionalSelect) {
      professionalSelect.addEventListener('change', loadNuevaCitaTimeSlots);
    }
    
    if (citaDate) {
      citaDate.addEventListener('change', loadNuevaCitaTimeSlots);
    }

    if (citaForm) {
      citaForm.addEventListener('submit', handleNuevaCitaSubmit);
    }
    
  } catch (error) {
    console.error('Error setting up nueva cita form listeners:', error);
  }
}

async function loadNuevaCitaTimeSlots() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const citaDate = document.getElementById('nueva-cita-date');
    const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
    const timeSlotsGrid = document.getElementById('nueva-cita-time-slots-grid');
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    
    if (!professionalSelect?.value || !citaDate?.value) {
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

   const selectedDate = parseLocalDateFromInput(citaDate.value);
    const timeSlots = generateTimeSlots(selectedDate);
    const occupiedSlots = await getOccupiedSlots(professionalSelect.value, selectedDate);
    
    if (timeSlotsGrid) {
      timeSlotsGrid.innerHTML = timeSlots.map(slot => {
        const isOccupied = occupiedSlots.includes(slot.time);
        const isPast = isPastTimeSlot(selectedDate, slot.hour, slot.minute);
        const isDisabled = isOccupied || isPast;
        
        return `
          <button type="button" 
                  class="time-slot ${isDisabled ? 'disabled' : ''}" 
                  data-time="${slot.time}"
                  ${isDisabled ? 'disabled' : ''}
                  onclick="selectNuevaCitaTimeSlot(this)"
                  style="
                    padding: 12px;
                    border: 2px solid ${isDisabled ? 'var(--gray-300)' : 'var(--primary-blue)'};
                    border-radius: 8px;
                    background: ${isDisabled ? 'var(--gray-100)' : 'white'};
                    color: ${isDisabled ? 'var(--gray-400)' : 'var(--primary-blue)'};
                    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                    transition: all 0.2s ease;
                    font-weight: 500;
                  ">
            <i class="fas fa-clock" style="margin-right: 4px;"></i>
            ${slot.time}
            ${isOccupied ? '<br><small>Ocupado</small>' : ''}
            ${isPast ? '<br><small>Pasado</small>' : ''}
          </button>
        `;
      }).join('');
    }
    
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;
    
  } catch (error) {
    console.error('Error loading nueva cita time slots:', error);
    showNotification('Error al cargar horarios disponibles', 'error');
  }
}

function selectNuevaCitaTimeSlot(button) {
  try {
    document.querySelectorAll('#nueva-cita-time-slots-grid .time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.style.background = 'white';
      slot.style.color = 'var(--primary-blue)';
    });
    
    button.classList.add('selected');
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
    
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('Error selecting nueva cita time slot:', error);
  }
}

async function handleNuevaCitaSubmit(e) {
  e.preventDefault();
  
  try {
    const solicitudId = document.getElementById('solicitud-id')?.value;
    
    const formData = {
      nombre: document.getElementById('nueva-cita-nombre')?.value?.trim(),
      rut: document.getElementById('nueva-cita-rut')?.value?.trim(),
      professionalId: document.getElementById('nueva-cita-professional')?.value,
      fecha: document.getElementById('nueva-cita-date')?.value,
      hora: document.querySelector('#nueva-cita-time-slots-grid .time-slot.selected')?.dataset.time,
      observaciones: document.getElementById('nueva-cita-notes')?.value?.trim() || ''
    };
    
    if (!formData.nombre || !formData.rut || !formData.professionalId || !formData.fecha || !formData.hora) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    if (!validateRUT(formData.rut)) {
      showNotification('RUT inválido', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const selectedOption = professionalSelect.options[professionalSelect.selectedIndex];
    const profesionalNombre = selectedOption.dataset.nombre;
    const tipoProfesional = selectedOption.dataset.profession;
    
    const fechaCompleta = new Date(`${formData.fecha}T${formData.hora}:00`);
    
    const citaData = {
      profesionalId: formData.professionalId,
      profesionalNombre: profesionalNombre,
      tipoProfesional: tipoProfesional,
      pacienteNombre: formData.nombre,
      pacienteRut: formatRUT(formData.rut),
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: solicitudId ? 'cita_desde_solicitud' : 'cita_directa',
      cesfam: currentUserData.cesfam,
      observaciones: formData.observaciones,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: currentUser.uid
    };
    
    if (solicitudId) {
      citaData.solicitudId = solicitudId;
      citaData.origenSolicitud = true;
    }
    
    const citaRef = await db.collection('citas').add(citaData);
    
    await registrarPacienteAutomaticamente(formData, citaRef.id);
    
    if (solicitudId) {
      try {
        await actualizarEstadoSolicitud(solicitudId, citaRef.id);
      } catch (error) {
        console.warn('Error actualizando estado de solicitud:', error);
      }
    }
    
    closeModal('nueva-cita-modal');
    
    const mensaje = solicitudId 
      ? `Cita agendada exitosamente desde solicitud para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`
      : `Cita creada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`;
    
    showNotification(mensaje, 'success', 5000);
    
    renderCalendar();
    if (selectedCalendarDate) {
      loadDayAppointments(selectedCalendarDate);
    } else {
      loadTodayAppointments();
    }
    
    if (solicitudId && hasAccessToSolicitudes()) {
      await loadSolicitudes();
    }
    
  } catch (error) {
    console.error('Error creando nueva cita:', error);
    showNotification('Error al crear cita: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

async function actualizarEstadoSolicitud(solicitudId, citaId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    let coleccion = 'solicitudes_ingreso';
    
    if (solicitud.tipo === 'reingreso') {
      coleccion = 'reingresos';
    } else if (solicitud.tipo === 'informacion') {
      coleccion = 'solicitudes_informacion';
    }
    
    await db.collection(coleccion).doc(solicitudId).update({
      estado: 'agendada',
      citaId: citaId,
      fechaAgenda: firebase.firestore.FieldValue.serverTimestamp(),
      agendadaPor: currentUser.uid
    });
    
    console.log(`✅ Estado de solicitud ${solicitudId} actualizado a 'agendada'`);
    
  } catch (error) {
    console.error('Error actualizando estado de solicitud:', error);
    throw error;
  }
}

async function registrarPacienteAutomaticamente(citaData, citaId) {
  try {
    const rutFormatted = formatRUT(citaData.rut);
    const existingPatient = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (!existingPatient.empty) {
      console.log('Paciente ya existe, no se registra nuevamente');
      return;
    }
    
    const pacienteData = {
      nombre: citaData.nombre,
      apellidos: '',
      rut: rutFormatted,
      telefono: null,
      email: null,
      direccion: null,
      edad: null,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaInicialId: citaId,
      origen: 'cita_directa',
      historialAtenciones: [],
      sustanciasProblematicas: [],
      prioridad: 'media',
      motivacionInicial: null
    };

    await db.collection('pacientes').add(pacienteData);
    
    console.log('✅ Paciente registrado automáticamente');
    
  } catch (error) {
    console.error('Error registrando paciente automáticamente:', error);
  }
}

// ================= FUNCIONES DE HORARIOS ================

function generateTimeSlots(date) {
  // Normaliza la fecha a la zona local (ignora la hora/minuto/segundo)
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = localDate.getDay();
  const slots = [];
  let config;

  // Lógica igual que antes...
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    config = HORARIOS_CONFIG.semana;
  } else if (dayOfWeek === 0 || dayOfWeek === 6) {
    config = HORARIOS_CONFIG.finSemana;
  } else {
    return [];
  }

  // El resto de tu función igual
  let currentHour = config.horaInicio;
  let currentMinute = 0;

  while (currentHour < config.horaFin || (currentHour === config.horaFin && currentMinute <= config.minutoFin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push({
      time: timeString,
      hour: currentHour,
      minute: currentMinute
    });

    currentMinute += config.intervaloMinutos;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
    if (currentHour > config.horaFin + 1) {
      break;
    }
  }

  console.log(`Día ${dayOfWeek} (${localDate.toLocaleDateString()}): ${slots.length} slots generados`, slots.map(s => s.time));
  return slots;
}

function debugTimeSlots() {
  const lunes = new Date('2025-09-15');
  const sabado = new Date('2025-09-13');

  console.log('=== DEBUG HORARIOS ===');
  console.log('Lunes 15/09:', lunes.getDay(), generateTimeSlots(lunes));
  console.log('Sábado 13/09:', sabado.getDay(), generateTimeSlots(sabado));
}

function isPastTimeSlot(date, hour, minute) {
  const now = new Date();
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);

  // Configura un buffer de 30 minutos para evitar agendar en horarios muy cercanos al actual
  const bufferTime = new Date(now);
  bufferTime.setMinutes(bufferTime.getMinutes() + 30);

  return slotTime <= bufferTime;
}
async function getOccupiedSlots(professionalId, date) {
  try {
    if (!currentUserData) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .where('estado', '!=', 'cancelada')
      .get();
    
    const occupiedSlots = [];
    snapshot.forEach(doc => {
      const cita = doc.data();
      const citaDate = cita.fecha.toDate();
      const timeString = citaDate.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      occupiedSlots.push(timeString);
    });
    
    return occupiedSlots;
    
  } catch (error) {
    console.error('Error getting occupied slots:', error);
    return [];
  }
}

// ================= CALENDARIO COMPLETO =================

function setupCalendar() {
  try {
    
    currentCalendarDate = new Date();
    selectedCalendarDate = new Date();
    
    renderCalendar();
    
    // Cargar las citas de hoy automáticamente
    if (currentUserData) {
      loadTodayAppointments();
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Calendario configurado con fecha actual:', currentCalendarDate.toLocaleDateString('es-CL'));
    }
  } catch (error) {
    console.error('❌ Error configurando calendario:', error);
  }
}

function renderCalendar() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;
    if (!currentCalendarDate) {
      currentCalendarDate = new Date();
    }
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    calendarGrid.innerHTML = '';
    
    const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayElement = createCalendarDay(currentDate, month, today);
      calendarGrid.appendChild(dayElement);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentUserData) {
      loadMonthAppointments(year, month);
    }
    
  } catch (error) {
    console.error('❌ Error renderizando calendario:', error);
  }
}

function createCalendarDay(date, currentMonth, today) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isToday = date.toDateString() === today.toDateString();
  const isPast = date < today;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (!isCurrentMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  if (isWeekend) {
    dayElement.classList.add('weekend');
    dayElement.style.backgroundColor = '#f8f9ff';
  }
  
  dayElement.innerHTML = `
    <div class="calendar-day-number">${date.getDate()}</div>
    <div class="calendar-appointments" id="appointments-${date.toISOString().split('T')[0]}"></div>
  `;
  
  if (isCurrentMonth && !isPast) {
    dayElement.addEventListener('click', () => selectCalendarDay(new Date(date)));
    dayElement.style.cursor = 'pointer';
  }
  
  return dayElement;
}

function selectCalendarDay(date) {
  try {
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });
    
    const dayElements = document.querySelectorAll('.calendar-day');
    dayElements.forEach(dayEl => {
      const dayNumber = dayEl.querySelector('.calendar-day-number').textContent;
      if (parseInt(dayNumber) === date.getDate() && !dayEl.classList.contains('other-month')) {
        dayEl.classList.add('selected');
      }
    });
    
    selectedCalendarDate = date;
    loadDayAppointments(date);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📅 Día seleccionado:', date.toLocaleDateString('es-CL'));
    }
  } catch (error) {
    console.error('❌ Error seleccionando día del calendario:', error);
  }
}

async function loadMonthAppointments(year, month) {
  if (!currentUserData) return;
  
  try {
    console.log(`📝 Cargando citas para ${month + 1}/${year} - CESFAM: ${currentUserData.cesfam}`);
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfMonth)
      .where('fecha', '<=', endOfMonth)
      .get();
    
    console.log(`📊 Citas encontradas en ${month + 1}/${year}: ${appointmentsSnapshot.size}`);
    
    document.querySelectorAll('.calendar-appointments').forEach(container => {
      container.innerHTML = '';
    });
    
    const appointmentsByDate = {};
    
    appointmentsSnapshot.forEach(doc => {
      const appointment = doc.data();
      const appointmentDate = appointment.fecha.toDate();
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      if (!appointmentsByDate[dateString]) {
        appointmentsByDate[dateString] = [];
      }
      
      appointmentsByDate[dateString].push({
        id: doc.id,
        ...appointment
      });
    });
    
    Object.keys(appointmentsByDate).forEach(dateString => {
      const container = document.getElementById(`appointments-${dateString}`);
      if (container) {
        const appointments = appointmentsByDate[dateString];
        
        appointments.slice(0, 3).forEach((appointment, index) => {
          const appointmentEl = document.createElement('div');
          appointmentEl.className = 'calendar-appointment';
          appointmentEl.textContent = appointment.pacienteNombre || 'Cita';
          appointmentEl.title = `${appointment.pacienteNombre} - ${appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
          
          appointmentEl.style.cssText = `
            background: var(--primary-blue);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            transition: background 0.2s ease;
          `;
          
          appointmentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showPatientAppointmentInfo(appointment);
          });
          
          appointmentEl.addEventListener('mouseenter', () => {
            appointmentEl.style.background = 'var(--health-green)';
          });
          
          appointmentEl.addEventListener('mouseleave', () => {
            appointmentEl.style.background = 'var(--primary-blue)';
          });
          
          container.appendChild(appointmentEl);
        });
        
        if (appointments.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.className = 'calendar-appointment more';
          moreEl.textContent = `+${appointments.length - 3} más`;
          moreEl.style.cssText = `
            background: var(--gray-400);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 9px;
            text-align: center;
            cursor: pointer;
          `;
          
          moreEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const date = new Date(dateString);
            selectCalendarDay(date);
          });
          
          container.appendChild(moreEl);
        }
      }
    });
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Citas del mes cargadas y mostradas: ${appointmentsSnapshot.size}`);
    }
    
  } catch (error) {
    console.error('❌ Error cargando citas del mes:', error);
  }
}

function showPatientAppointmentInfo(appointment) {
  try {
    const infoModal = createPatientAppointmentInfoModal(appointment);
    document.body.insertAdjacentHTML('beforeend', infoModal);
    showModal('patient-appointment-info-modal');
  } catch (error) {
    console.error('Error showing patient appointment info:', error);
    showNotification('Error al mostrar información del paciente', 'error');
  }
}

function createPatientAppointmentInfoModal(appointment) {
  const fecha = appointment.fecha.toDate();
  const fechaStr = fecha.toLocaleDateString('es-CL');
  const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="modal-overlay temp-modal" id="patient-appointment-info-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('patient-appointment-info-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-check"></i> Información de Cita</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
              ${appointment.pacienteNombre}
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div><strong>RUT:</strong> ${appointment.pacienteRut || 'No disponible'}</div>
              <div><strong>Teléfono:</strong> ${appointment.pacienteTelefono || 'No disponible'}</div>
              <div><strong>Fecha:</strong> ${fechaStr}</div>
              <div><strong>Hora:</strong> ${horaStr}</div>
              <div><strong>Profesional:</strong> ${appointment.profesionalNombre}</div>
              <div><strong>Tipo:</strong> ${getProfessionName(appointment.tipoProfesional)}</div>
              <div><strong>Estado:</strong> <span style="color: ${getStatusColor(appointment.estado)}; font-weight: bold;">${(appointment.estado || 'programada').toUpperCase()}</span></div>
              <div><strong>Tipo cita:</strong> ${appointment.tipo || 'General'}</div>
            </div>
            
            ${appointment.observaciones ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <strong>Observaciones:</strong>
                <p style="margin: 8px 0 0 0; font-style: italic;">${appointment.observaciones}</p>
              </div>` : ''
            }
          </div>
          
          <div style="text-align: center;">
            <button class="btn btn-primary" onclick="closeModal('patient-appointment-info-modal')">
              <i class="fas fa-check"></i>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getStatusColor(estado) {
  const colors = {
    'programada': '#3b82f6',
    'confirmada': '#10b981',
    'en_curso': '#f59e0b',
    'completada': '#059669',
    'cancelada': '#ef4444'
  };
  return colors[estado] || '#6b7280';
}

async function loadDayAppointments(date) {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList || !currentUserData) return;
  
  try {
    appointmentsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>';
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (appointmentsSnapshot.empty) {
      const dayName = date.toLocaleDateString('es-CL', { weekday: 'long' });
      const workingHours = getWorkingHours(date);
      
      appointmentsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <p>No hay citas programadas para ${date.toLocaleDateString('es-CL')}</p>
          <p><small>${dayName} - Horario: ${workingHours.inicio} a ${workingHours.fin}</small></p>
          <button class="btn btn-primary btn-sm mt-2" onclick="createNuevaCitaModalForDate('${date.toISOString()}')">
            <i class="fas fa-plus"></i>
            Agregar Cita
          </button>
        </div>
      `;
      return;
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    appointmentsList.innerHTML = appointments.map(appointment => createAppointmentItem(appointment)).join('');
    
  } catch (error) {
    console.error('Error cargando citas del día:', error);
    appointmentsList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las citas</p>
        <button class="btn btn-outline btn-sm" onclick="loadDayAppointments(new Date('${date.toISOString()}'))">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    `;
  }
}

function createAppointmentItem(appointment) {
  const time = appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const statusIcon = {
    'programada': 'fa-clock',
    'confirmada': 'fa-check',
    'en_curso': 'fa-play',
    'completada': 'fa-check-circle',
    'cancelada': 'fa-times-circle'
  };
  
  return `
    <div class="appointment-item" data-id="${appointment.id}">
      <div class="appointment-time">${time}</div>
      <div class="appointment-details">
        <div class="appointment-patient" onclick="showPatientAppointmentInfo(${JSON.stringify(appointment).replace(/"/g, '&quot;')})" 
             style="cursor: pointer; color: var(--primary-blue); text-decoration: underline;">
          ${appointment.pacienteNombre}
        </div>
        <div class="appointment-professional">${appointment.profesionalNombre}</div>
        <div class="appointment-type">${getProfessionName(appointment.tipoProfesional)}</div>
      </div>
      <div class="appointment-status">
        <span class="status-badge ${appointment.estado || 'programada'}">
          <i class="fas ${statusIcon[appointment.estado] || 'fa-circle'}"></i>
          ${(appointment.estado || 'programada').toUpperCase()}
        </span>
      </div>
    </div>
  `;
}

async function loadTodayAppointments() {
  try {
    const today = new Date();
    await loadDayAppointments(today);
    
    // Siempre actualizar la fecha seleccionada a hoy
    selectedCalendarDate = today;
    selectCalendarDay(today);
    
    console.log('📅 Citas de hoy cargadas para:', today.toLocaleDateString('es-CL'));
  } catch (error) {
    console.error('Error cargando citas de hoy:', error);
  }
}

function getWorkingHours(date) {
  const dayOfWeek = date.getDay();
  
  if (HORARIOS_CONFIG.semana.diasSemana.includes(dayOfWeek)) {
    return {
      inicio: `${HORARIOS_CONFIG.semana.horaInicio}:00`,
      fin: `${HORARIOS_CONFIG.semana.horaFin}:${HORARIOS_CONFIG.semana.minutoFin.toString().padStart(2, '0')}`
    };
  } else if (HORARIOS_CONFIG.finSemana.diasSemana.includes(dayOfWeek)) {
    return {
      inicio: `${HORARIOS_CONFIG.finSemana.horaInicio}:00`,
      fin: `${HORARIOS_CONFIG.finSemana.horaFin}:${HORARIOS_CONFIG.finSemana.minutoFin.toString().padStart(2, '0')}`
    };
  } else {
    return {
      inicio: 'Cerrado',
      fin: 'Cerrado'
    };
  }
}

function createNuevaCitaModalForDate(dateIso) {
  createNuevaCitaModal();
  
  setTimeout(() => {
    const dateInput = document.getElementById('nueva-cita-date');
    if (dateInput) {
      const date = new Date(dateIso);
      const today = new Date();
      
      // No permitir fechas pasadas
      if (date < today.setHours(0,0,0,0)) {
        date.setTime(today.getTime());
      }
      
      dateInput.value = date.toISOString().split('T')[0];
    }
  }, 100);
}

// ================= GESTIÓN COMPLETA DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    const cacheKey = `pacientes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    console.log('Cargando pacientes para CESFAM:', currentUserData.cesfam);
    
    const pacientesSnapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();
    
    console.log('Pacientes encontrados:', pacientesSnapshot.size);
    
    const pacientes = [];
    pacientesSnapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    pacientesData = pacientes;
    setCachedData(cacheKey, pacientes);
    renderPacientes(pacientes);
    
    console.log(`Total pacientes cargados: ${pacientes.length}`);
    
  } catch (error) {
    console.error('Error loading pacientes:', error);
    showNotification('Error al cargar pacientes: ' + error.message, 'error');
    
    const grid = document.getElementById('patients-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar pacientes</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="loadPacientes()">
            <i class="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  } finally {
    showLoading(false);
  }
}

function renderPacientes(pacientes) {
  try {
    const grid = document.getElementById('patients-grid');
    if (!grid) return;

    console.log('Renderizando pacientes:', pacientes.length);

    if (pacientes.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-users"></i>
          <h3>No hay pacientes registrados</h3>
          <p>No se encontraron pacientes en este CESFAM</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = pacientes.map(paciente => createPatientCard(paciente)).join('');
    
    console.log(`Renderizados ${pacientes.length} pacientes`);
  } catch (error) {
    console.error('Error rendering pacientes:', error);
  }
}

function createPatientCard(paciente) {
  const fecha = formatDate(paciente.fechaCreacion);
  const estado = paciente.estado || 'activo';
  
  return `
    <div class="patient-card">
      <div class="patient-header">
        <div class="patient-info">
          <h3>${paciente.nombre} ${paciente.apellidos || ''}</h3>
          <p>RUT: ${paciente.rut}</p>
        </div>
        <span class="patient-status ${estado}">
          ${estado.toUpperCase()}
        </span>
      </div>
      <div class="patient-details">
        <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
        <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
        <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
        <div><strong>Registrado:</strong> ${fecha}</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-primary" onclick="showPatientDetail('${paciente.id}')">
          <i class="fas fa-eye"></i>
          Ver Ficha
        </button>
      </div>
    </div>
  `;
}

async function showPatientDetail(pacienteId) {
  try {
    showLoading(true, 'Cargando ficha del paciente...');
    
    const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
    
    if (!pacienteDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const paciente = {
      id: pacienteDoc.id,
      ...pacienteDoc.data()
    };
    
    const detailModal = createPatientDetailModal(paciente);
    document.body.insertAdjacentHTML('beforeend', detailModal);
    showModal('patient-detail-modal');
    
    // Aquí sí: paciente.rut ya existe
    loadAtencionesPaciente(paciente.rut, `atenciones-list-${paciente.rut}`);
    
  } catch (error) {
    console.error('Error loading patient detail:', error);
    showNotification('Error al cargar ficha del paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}
async function loadAtencionesPaciente(rut, containerId) {
  try {
    const atencionesSnapshot = await db.collection('atenciones')
      .where('pacienteRut', '==', rut)
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fecha', 'desc')
      .get();

    const container = document.getElementById(containerId);
    if (!container) return;

    if (atencionesSnapshot.empty) {
      container.innerHTML = `<p style="color:gray;">Sin atenciones registradas.</p>`;
      return;
    }

    const atenciones = [];
    atencionesSnapshot.forEach(doc => atenciones.push(doc.data()));

    container.innerHTML = atenciones.map(atencion => {
      const fecha = atencion.fecha && atencion.fecha.toDate
        ? atencion.fecha.toDate().toLocaleString('es-CL')
        : '';
      return `
        <div class="atencion-item" style="margin-bottom:16px; padding:10px; border:1px solid #dde;">
          <div><b>Fecha:</b> ${fecha}</div>
          <div><b>Profesional:</b> ${atencion.profesional || ''}</div>
          <div><b>Detalle:</b><br> ${atencion.detalle || ''}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando atenciones:', err);
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = `<p style="color:red;">Error al cargar atenciones.</p>`;
  }
}
function createPatientDetailModal(paciente) {
  const fechaCreacion = formatDate(paciente.fechaCreacion);
  const fechaPrimeraAtencion = paciente.fechaPrimeraAtencion ? formatDate(paciente.fechaPrimeraAtencion) : 'No registrada';
  
  return `
    <div class="modal-overlay temp-modal" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
          </div>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-user-md"></i> Ficha del Paciente</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
              <div>
                <h3 style="margin: 0; color: var(--primary-blue);">
                  ${paciente.nombre} ${paciente.apellidos || ''}
                </h3>
                <p style="margin: 4px 0; font-weight: 500;">RUT: ${paciente.rut}</p>
              </div>
              <span class="patient-status ${paciente.estado || 'activo'}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                ${(paciente.estado || 'activo').toUpperCase()}
              </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Datos Personales</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                  <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
                  <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                  <div><strong>Dirección:</strong> ${paciente.direccion || 'No disponible'}</div>
                </div>
              </div>
              
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Información Clínica</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>CESFAM:</strong> ${paciente.cesfam}</div>
                  <div><strong>Prioridad:</strong> <span style="color: ${getPriorityColor(paciente.prioridad || 'media')}; font-weight: bold;">${(paciente.prioridad || 'media').toUpperCase()}</span></div>
                  <div><strong>Origen:</strong> ${paciente.origen || 'No especificado'}</div>
                  <div><strong>Motivación inicial:</strong> ${paciente.motivacionInicial || 'No registrada'}/10</div>
                </div>
              </div>
            </div>
            
            ${paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0 ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias Problemáticas</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${paciente.sustanciasProblematicas.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                </div>
              </div>` : ''
            }
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5); font-size: 12px; color: var(--gray-600);">
              <div><strong>Fecha de registro:</strong> ${fechaCreacion}</div>
              <div><strong>Primera atención:</strong> ${fechaPrimeraAtencion}</div>
              ${paciente.citaInicialId ? `<div><strong>Cita inicial ID:</strong> ${paciente.citaInicialId}</div>` : ''}
            </div>
          </div>
          
          <!-- Bloque de historial de atenciones, solo una vez -->
          <div id="atenciones-paciente-${paciente.rut}" style="margin-top:24px;">
            <h4 style="margin-bottom:8px;">Historial de Atenciones</h4>
            <div id="atenciones-list-${paciente.rut}">Cargando...</div>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
    const atenciones = [];
atencionesSnapshot.forEach(doc => atenciones.push(doc.data()));

    container.innerHTML = atenciones.map(atencion => {
      const fecha = atencion.fecha && atencion.fecha.toDate
        ? atencion.fecha.toDate().toLocaleString('es-CL')
        : '';
      return `
        <div class="atencion-item" style="margin-bottom:16px; padding:10px; border:1px solid #dde;">
          <div><b>Fecha:</b> ${fecha}</div>
          <div><b>Profesional:</b> ${atencion.profesional || ''}</div>
          <div><b>Detalle:</b><br> ${atencion.detalle || ''}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando atenciones:', err);
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = `<p style="color:red;">Error al cargar atenciones.</p>`;
  }
}
// ================= BÚSQUEDA DE PACIENTES POR RUT =================

async function buscarPacientePorRUT() {
  try {
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (!rutInput || !resultsContainer) return;
    
    const rut = rutInput.value.trim();
    
    if (!rut) {
      showNotification('Ingresa un RUT para buscar', 'warning');
      return;
    }
    
    if (!validateRUT(rut)) {
      showNotification('RUT inválido', 'error');
      return;
    }
    
    showLoading(true, 'Buscando paciente...');
    
    const rutFormatted = formatRUT(rut);
    
    const snapshot = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (snapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <h3>Paciente no encontrado</h3>
          <p>No se encontró ningún paciente con el RUT ${rutFormatted} en tu CESFAM</p>
        </div>
      `;
    } else {
      const pacientes = [];
      snapshot.forEach(doc => {
        pacientes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      resultsContainer.innerHTML = `
        <h4>Resultados de búsqueda:</h4>
        <div class="patients-grid">
          ${pacientes.map(createPatientCard).join('')}
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error buscando paciente:', error);
    showNotification('Error al buscar paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ================= SISTEMA DE SEGUIMIENTO =================

async function loadSeguimiento() {
  if (!currentUserData) return;
  
  try {
    showLoading(true, 'Cargando seguimiento...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', today)
      .where('fecha', '<', tomorrow)
      .orderBy('fecha', 'asc')
      .get();
    
    renderPatientsTimeline(todayAppointmentsSnapshot);
    
    const upcomingAppointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', tomorrow)
      .orderBy('fecha', 'asc')
      .limit(10)
      .get();
    
    renderUpcomingAppointments(upcomingAppointmentsSnapshot);
    
  } catch (error) {
    console.error('Error loading seguimiento:', error);
    showNotification('Error al cargar seguimiento: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}
function showAtencionModal(pacienteRut, pacienteNombre) {
  const modal = `
    <div class="modal-overlay temp-modal" id="atencion-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('atencion-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div style="padding:24px;">
          <h2>Registrar Atención</h2>
          <p><strong>Paciente:</strong> ${pacienteNombre} (${pacienteRut})</p>
          <form id="atencion-form">
            <div class="form-group">
              <label>Detalle de la atención</label>
              <textarea id="atencion-detalle" rows="5" required></textarea>
            </div>
            <div style="text-align:right;margin-top:16px;">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Guardar Atención
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
  showModal('atencion-modal');
  
  document.getElementById('atencion-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const detalle = document.getElementById('atencion-detalle').value.trim();
    if(!detalle) return showNotification('Debes escribir la atención', 'warning');
    try {
      await db.collection('atenciones').add({
        pacienteRut,
        pacienteNombre,
        detalle,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        profesional: currentUserData ? `${currentUserData.nombre} ${currentUserData.apellidos}` : '',
        profesionalId: currentUser ? currentUser.uid : '',
        cesfam: currentUserData ? currentUserData.cesfam : '',
      });
      showNotification('Atención registrada', 'success');
      closeModal('atencion-modal');
    } catch(err){
      showNotification('Error guardando atención', 'error');
    }
  });
}

function renderPatientsTimeline(appointmentsSnapshot) {
  try {
    const timeline = document.getElementById('patients-timeline');
    if (!timeline) return;
    
    if (appointmentsSnapshot.empty) {
      timeline.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <h3>No hay pacientes agendados para hoy</h3>
          <p>No se encontraron citas programadas para hoy</p>
        </div>
      `;
      return;
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    timeline.innerHTML = appointments.map(appointment => {
      const fecha = appointment.fecha.toDate();
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      const estado = appointment.estado || 'programada';
      
      // SOLO ESTE RETURN:
      return `
        <div class="timeline-item" onclick="showAtencionModal('${appointment.pacienteRut}', '${appointment.pacienteNombre}')">
          <div class="timeline-time">${hora}</div>
          <div class="timeline-patient">
            <h4>${appointment.pacienteNombre}</h4>
            <p>${getProfessionName(appointment.tipoProfesional)} - ${appointment.profesionalNombre}</p>
            <small>Tipo: ${appointment.tipo || 'General'}</small>
          </div>
          <span class="timeline-status ${estado}">
            <i class="fas fa-${getStatusIcon(estado)}"></i>
            ${estado.toUpperCase()}
          </span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error rendering patients timeline:', error);
  }
}

function getStatusIcon(estado) {
  const icons = {
    'programada': 'clock',
    'confirmada': 'check',
    'en_curso': 'play',
    'completada': 'check-circle',
    'cancelada': 'times-circle'
  };
  return icons[estado] || 'circle';
}

function renderUpcomingAppointments(appointmentsSnapshot) {
  try {
    const grid = document.getElementById('upcoming-appointments-grid');
    const noUpcomingSection = document.getElementById('no-upcoming-section');
    
    if (!grid) return;
    
    if (appointmentsSnapshot.empty) {
      if (noUpcomingSection) noUpcomingSection.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    
    if (noUpcomingSection) noUpcomingSection.style.display = 'none';
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    grid.innerHTML = appointments.map(appointment => {
      const fecha = appointment.fecha.toDate();
      const fechaStr = fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="appointment-card">
          <div class="appointment-card-header">
            <span class="appointment-date">
              <i class="fas fa-calendar"></i>
              ${fechaStr}
            </span>
            <span class="appointment-time">
              <i class="fas fa-clock"></i>
              ${hora}
            </span>
          </div>
          <div class="appointment-card-body">
            <h4>${appointment.pacienteNombre}</h4>
            <p><i class="fas fa-user-md"></i> ${getProfessionName(appointment.tipoProfesional)}</p>
            <p><i class="fas fa-tags"></i> ${appointment.tipo || 'General'}</p>
          </div>
          <div class="appointment-card-footer">
            <span class="status-badge ${appointment.estado || 'programada'}">
              ${(appointment.estado || 'programada').toUpperCase()}
            </span>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error rendering upcoming appointments:', error);
  }
}

// ================= GESTIÓN DE TABS =================

function setupTabFunctionality() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        if (!canAccessTab(targetTab)) {
          showNotification('No tienes permisos para acceder a esta sección', 'warning');
          return;
        }

        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          loadTabData(targetTab);
        }
      });
    });

    console.log('✅ Tab functionality configurada');
  } catch (error) {
    console.error('Error configurando tabs:', error);
  }
}

function loadTabData(tabName) {
  try {
    if (!currentUserData) return;

    switch (tabName) {
      case 'solicitudes':
        if (hasAccessToSolicitudes()) {
          loadSolicitudes();
        }
        break;
      case 'agenda':
        loadTodayAppointments();
        if (!selectedCalendarDate) {
          renderCalendar();
        }
        break;
      case 'seguimiento':
        loadSeguimiento();
        break;
      case 'pacientes':
        loadPacientes();
        break;
    }
  } catch (error) {
    console.error('Error loading tab data:', error);
  }
}

// ================= EVENT LISTENERS COMPLETOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    
    console.log('🔧 Botón login encontrado:', loginProfessionalBtn);
    
    if (loginProfessionalBtn) {
      loginProfessionalBtn.addEventListener('click', () => {
        console.log('🔧 Click en botón login detectado');
        showModal('login-modal');
      });
      console.log('✅ Event listener agregado al botón login');
    } else {
      console.error('❌ Botón login-professional no encontrado');
    }

    const logoutBtn = document.getElementById('logout-professional');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    const searchPacientesRut = document.getElementById('search-pacientes-rut');
    const buscarPacienteBtn = document.getElementById('buscar-paciente-btn');
    
    const priorityFilter = document.getElementById('priority-filter');
    
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    if (registerPatientBtn) {
      registerPatientBtn.addEventListener('click', () => {
        resetForm();
        showModal('patient-modal');
      });
    }

    if (reentryProgramBtn) {
      reentryProgramBtn.addEventListener('click', () => {
        showModal('reentry-modal');
      });
    }

    if (aboutProgramBtn) {
      aboutProgramBtn.addEventListener('click', showAboutProgram);
    }

    if (buscarPacienteBtn) {
      buscarPacienteBtn.addEventListener('click', buscarPacientePorRUT);
    }

    if (searchPacientesRut) {
      searchPacientesRut.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          buscarPacientePorRUT();
        }
      });
      
      searchPacientesRut.addEventListener('input', (e) => {
        e.target.value = formatRUT(e.target.value);
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        currentPriorityFilter = e.target.value;
        filterSolicitudes();
      });
    }

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
      });
    }

    if (nuevaCitaBtn) {
      nuevaCitaBtn.addEventListener('click', () => createNuevaCitaModal());
    }

    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('✅ Event listeners inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando event listeners:', error);
  }
}

function handleKeyboardShortcuts(e) {
  try {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  } catch (error) {
    console.error('Error handling keyboard shortcuts:', error);
  }
}

// ================= FUNCIONES PLACEHOLDER Y UTILITARIAS =================

function showAboutProgram() {
  try {
    const aboutModal = `
      <div class="modal-overlay temp-modal" id="about-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('about-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
            
            <div style="line-height: 1.6; color: var(--text-dark);">
              <p><strong>SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)</strong> es el organismo del Gobierno de Chile encargado de elaborar las políticas de prevención del consumo de drogas y alcohol, así como de tratamiento, rehabilitación e integración social de las personas afectadas por estas sustancias.</p>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Nuestros Servicios</h3>
              <ul style="margin-left: 20px;">
                <li>Tratamiento ambulatorio básico e intensivo</li>
                <li>Tratamiento residencial</li>
                <li>Programas de reinserción social</li>
                <li>Apoyo familiar y comunitario</li>
                <li>Prevención en establecimientos educacionales</li>
                <li>Capacitación a profesionales</li>
              </ul>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Horarios de Atención</h3>
              <ul style="margin-left: 20px;">
                <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
                <li><strong>Sábados y Domingos:</strong> 09:00 - 12:30</li>
              </ul>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Contacto</h3>
              <ul style="margin-left: 20px;">
                <li><strong>Teléfono:</strong> 1412 (gratuito)</li>
                <li><strong>Emergencias:</strong> 131</li>
                <li><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a></li>
              </ul>
              
              <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px;">
                <p style="margin: 0; font-style: italic; text-align: center;">
                  "Tu recuperación es posible. Estamos aquí para acompañarte en cada paso del camino."
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
              <button class="btn btn-primary" onclick="closeModal('about-modal')">
                <i class="fas fa-check"></i>
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', aboutModal);
    showModal('about-modal');
    
  } catch (error) {
    console.error('Error showing about program:', error);
    showNotification('Error al mostrar información del programa', 'error');
  }
}

function handleUrgentCase(solicitudId) { 
  try {
    showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🚨 Caso urgente identificado:', solicitudId);
    }
  } catch (error) {
    console.error('Error handling urgent case:', error);
  }
}

// ================= DESCARGA DE PDF =================

async function downloadPatientPDF(pacienteId) {
  try {
    showLoading(true, 'Generando PDF...');
    
    const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
    
    if (!pacienteDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const paciente = pacienteDoc.data();
    
    if (typeof window.jsPDF === 'undefined') {
      showNotification('Error: Librería PDF no disponible. Cargando...', 'warning');
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        setTimeout(() => downloadPatientPDF(pacienteId), 500);
      };
      script.onerror = () => {
        showNotification('Error cargando librería PDF. Intenta nuevamente.', 'error');
      };
      document.head.appendChild(script);
      return;
    }
    
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('FICHA PACIENTE - PROGRAMA SENDA', 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`CESFAM: ${paciente.cesfam}`, 20, 50);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')}`, 20, 60);
    doc.text(`Profesional: ${currentUserData.nombre} ${currentUserData.apellidos}`, 20, 70);
    
    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('DATOS DEL PACIENTE', 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let yPos = 110;
    
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellidos || ''}`, 20, yPos);
    yPos += 10;
    doc.text(`RUT: ${paciente.rut}`, 20, yPos);
    yPos += 10;
    doc.text(`Edad: ${paciente.edad || 'No especificada'} años`, 20, yPos);
    yPos += 10;
    doc.text(`Teléfono: ${paciente.telefono || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`Email: ${paciente.email || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`Dirección: ${paciente.direccion || 'No disponible'}`, 20, yPos);
    yPos += 15;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('INFORMACIÓN CLÍNICA', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Estado: ${(paciente.estado || 'Activo').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Prioridad: ${(paciente.prioridad || 'Media').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Motivación inicial: ${paciente.motivacionInicial || 'No registrada'}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Origen: ${paciente.origen || 'No especificado'}`, 20, yPos);
    yPos += 10;
    
    if (paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0) {
      doc.text(`Sustancias problemáticas: ${paciente.sustanciasProblematicas.join(', ')}`, 20, yPos);
      yPos += 10;
    }
    
    yPos += 10;
    doc.text(`Fecha de registro: ${formatDate(paciente.fechaCreacion)}`, 20, yPos);
    yPos += 10;
    
    if (paciente.fechaPrimeraAtencion) {
      doc.text(`Primera atención: ${formatDate(paciente.fechaPrimeraAtencion)}`, 20, yPos);
    }
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado por Sistema SENDA Puente Alto', 20, 280);
    doc.text('Información confidencial - Uso exclusivo profesional', 20, 290);
 
    const fileName = `ficha_${paciente.nombre.replace(/\s+/g, '_')}_${paciente.rut.replace(/[.-]/g, '')}.pdf`;
    doc.save(fileName);
    
    showNotification('PDF generado y descargado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    showNotification('Error al generar PDF: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ================= INICIALIZACIÓN FINAL =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('🚀 Iniciando sistema SENDA completo...');
    
    // Configurar formularios
    setupMultiStepForm();
    setupAuthForms();
    
    // Configurar event listeners
    initializeEventListeners();
    
    // Configurar funcionalidades
    setupTabFunctionality();
    setupCalendar();
    
    // Configurar autenticación
    auth.onAuthStateChanged(onAuthStateChanged);
    

    setInterval(() => {
      if (currentUserData) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Recargar slots de tiempo si están visibles y han cambiado
        const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
        if (timeSlotsContainer && timeSlotsContainer.style.display !== 'none') {
          loadNuevaCitaTimeSlots();
        }
      }
    }, 60000); // Cada minuto
    
    console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});

// ================= EXPORTAR FUNCIONES GLOBALES =================

window.showPatientDetail = showPatientDetail;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.createNuevaCitaModal = createNuevaCitaModal;
window.createNuevaCitaModalForDate = createNuevaCitaModalForDate;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showSolicitudDetail = showSolicitudDetail;
window.showAgendaModalFromSolicitud = showAgendaModalFromSolicitud;
window.showResponderModal = showResponderModal;
window.handleUrgentCase = handleUrgentCase;
window.showAboutProgram = showAboutProgram;
window.showModal = showModal;
window.closeModal = closeModal;
window.showPatientAppointmentInfo = showPatientAppointmentInfo;
window.switchLoginTab = switchLoginTab;
window.downloadPatientPDF = downloadPatientPDF;
window.loadSolicitudes = loadSolicitudes;
window.showAtencionModal = showAtencionModal;

// ================= MENSAJE FINAL =================

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
