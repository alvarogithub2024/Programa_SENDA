// ================= PARTE 1: CONFIGURACIÓN Y FUNCIONES UTILITARIAS =================

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

// Lista de CESFAM de Puente Alto
const cesfamPuenteAlto = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla",
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
  
// Global Variables
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;
let flowSteps = [];
let currentStepIndex = 0;

// Variables para la agenda - NUEVAS PARA 2025
let selectedProfessional = null;
let currentCalendarDate = new Date(2025, 0, 1); // ESTABLECIDO EN ENERO 2025

// Utility Functions
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
    
    // Remover modales dinámicos del DOM
    if (['request-detail-modal', 'patient-detail-modal', 'patient-history-modal', 
         'patient-report-preview-modal', 'followup-note-modal', 'new-appointment-modal', 
         'day-appointments-modal', 'assignment-modal'].includes(modalId)) {
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
// ================= PARTE 2: INICIALIZACIÓN Y CONFIGURACIÓN DE EVENTOS =================

// Cambiar el título principal de la página
document.title = "PROGRAMA SENDA PUENTE ALTO";
const mainTitle = document.getElementById('main-title');
if (mainTitle) mainTitle.textContent = "PROGRAMA SENDA PUENTE ALTO-";

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  console.log('SENDA Platform loading...');
  initializeApp();
});

function initializeApp() {
  try {
    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    loadDraftIfExists();
    loadRegionsData();
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
  }
}

function initializeEventListeners() {
  // Main action buttons
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

  if (reentryBtn) {
    reentryBtn.addEventListener('click', () => {
      formData = { isReentry: true };
      currentFormStep = 1;
      currentStepIndex = 0;
      flowSteps = [1];
      isDraftSaved = false;
      showModal('patient-modal');
      updateFormProgress();
      showNotification('Formulario de reingreso activado', 'info');
    });
  }

  // Form submissions
  const patientForm = document.getElementById('patient-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (patientForm) {
    patientForm.addEventListener('submit', handlePatientRegistration);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleProfessionalLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleProfessionalRegistration);
  }

  // Navigation buttons
  const nextBtn = document.getElementById('next-step');
  const prevBtn = document.getElementById('prev-step');
  const submitBtn = document.getElementById('submit-form');
  const saveDraftBtn = document.getElementById('save-draft');

  if (nextBtn) nextBtn.addEventListener('click', nextFormStep);
  if (prevBtn) prevBtn.addEventListener('click', prevFormStep);
  if (submitBtn) submitBtn.addEventListener('click', submitPatientForm);
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);

  // Geolocation
  const useLocationBtn = document.getElementById('use-location');
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', getCurrentLocation);
  }

  // Region change listener
  const regionSelect = document.getElementById('patient-region');
  if (regionSelect) {
    regionSelect.addEventListener('change', function() {
      loadCommunesData(this.value);
    });
  }
}

function setupModalControls() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const modalId = e.target.closest('[data-close]').dataset.close;
      closeModal(modalId);
    });
  });
}

function setupTabFunctionality() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabGroup = btn.closest('.tabs');
      const targetTab = btn.dataset.tab;
      
      if (tabGroup) {
        tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabContent = document.getElementById(targetTab + '-tab');
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    });
  });
}

function setupMultiStepForm() {
  const motivacionSlider = document.getElementById('motivacion');
  const motivacionValue = document.getElementById('motivacion-value');
  
  if (motivacionSlider && motivacionValue) {
    motivacionSlider.addEventListener('input', function() {
      motivacionValue.textContent = this.value;
    });
  }

  const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
  tipoSolicitudInputs.forEach(input => {
    input.addEventListener('change', function() {
      const tipoSolicitud = this.value;
      handleTipoSolicitudChange(tipoSolicitud);
    });
  });
}

function handleTipoSolicitudChange(tipoSolicitud) {
  const phoneContainer = document.getElementById('anonymous-phone-container');
  const emailContainer = document.getElementById('info-email-container');
  
  if (phoneContainer) phoneContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'none';
  
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
  
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-form');
  
  if (prevBtn) prevBtn.style.display = currentStepIndex > 0 ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = currentStepIndex < flowSteps.length - 1 ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = currentStepIndex === flowSteps.length - 1 ? 'block' : 'none';
}

function nextFormStep() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    
    if (currentStepIndex < flowSteps.length - 1) {
      const currentStepNumber = flowSteps[currentStepIndex];
      document.querySelector(`[data-step="${currentStepNumber}"]`).classList.remove('active');
      
      currentStepIndex++;
      const nextStepNumber = flowSteps[currentStepIndex];
      currentFormStep = nextStepNumber;
      
      document.querySelector(`[data-step="${nextStepNumber}"]`).classList.add('active');
      updateFormProgress();
      
      saveDraft(false);
    }
  }
}

function prevFormStep() {
  if (currentStepIndex > 0) {
    const currentStepNumber = flowSteps[currentStepIndex];
    document.querySelector(`[data-step="${currentStepNumber}"]`).classList.remove('active');
    
    currentStepIndex--;
    const prevStepNumber = flowSteps[currentStepIndex];
    currentFormStep = prevStepNumber;
    
    document.querySelector(`[data-step="${prevStepNumber}"]`).classList.add('active');
    updateFormProgress();
  }
}

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
  if (ageInput) {
    ageInput.addEventListener('blur', function(e) {
      const age = parseInt(e.target.value);
      if (age && (age < 12 || age > 120)) {
        e.target.classList.add('error');
        showNotification('Por favor ingresa una edad válida (12-120 años)', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }
}
// ================= PARTE 3: VALIDACIÓN Y MANEJO DE FORMULARIOS =================

// Función para cargar la lista de CESFAM en el formulario
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

function validateCurrentStep() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  const requiredFields = currentStepElement.querySelectorAll('[required]:not([style*="display: none"] [required])');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (field.offsetParent === null) return;
    
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  if (currentFormStep === 1) {
    isValid = validateStep1() && isValid;
  } else if (currentFormStep === 2) {
    isValid = validateStep2() && isValid;
  } else if (currentFormStep === 3) {
    isValid = validateStep3() && isValid;
  }
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
}

function validateStep1() {
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
  
  return true;
}

function validateStep2() {
  if (formData.tipoSolicitud !== 'identificado') return true;
  
  const rut = document.getElementById('patient-rut')?.value;
  const email = document.getElementById('patient-email')?.value;
  
  if (rut && !validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return false;
  }
  
  if (email && !isValidEmail(email)) {
    showNotification('El email ingresado no es válido', 'error');
    return false;
  }
  
  return true;
}

function validateStep3() {
  if (formData.tipoSolicitud !== 'informacion') {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Por favor selecciona al menos una sustancia', 'error');
      return false;
    }
  }
  
  return true;
}

function collectCurrentStepData() {
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
  
  if (currentFormStep === 3) {
    if (formData.tipoSolicitud !== 'informacion') {
      const sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked'))
        .map(cb => cb.value);
      formData.sustancias = sustancias;
      formData.tiempoConsumo = document.getElementById('tiempo-consumo').value;
      formData.motivacion = document.getElementById('motivacion').value;
      formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
    }
  }
  
  if (currentFormStep === 4) {
    formData.razon = document.getElementById('patient-reason').value;
    formData.tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    formData.centroPreferencia = document.getElementById('centro-preferencia').value;
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
  
  if (showMessage) {
    showNotification('Borrador guardado correctamente', 'success', 2000);
  }
}

function loadDraftIfExists() {
  const draft = localStorage.getItem('senda_draft');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      const draftAge = new Date() - new Date(draftData.timestamp);
      
      if (draftAge < 24 * 60 * 60 * 1000) {
        const loadDraft = confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?');
        if (loadDraft) {
          formData = draftData;
          currentFormStep = draftData.currentStep || 1;
          currentStepIndex = draftData.currentStepIndex || 0;
          flowSteps = draftData.flowSteps || [1];
          restoreFormData();
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

function restoreFormData() {
  Object.keys(formData).forEach(key => {
    const element = document.getElementById(`patient-${key}`) || 
                   document.querySelector(`input[name="${key}"]`) ||
                   document.querySelector(`select[name="${key}"]`);
    
    if (element && formData[key]) {
      if (element.type === 'radio' || element.type === 'checkbox') {
        if (Array.isArray(formData[key])) {
          formData[key].forEach(value => {
            const checkbox = document.querySelector(`input[name="${key}"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
          });
        } else {
          const radio = document.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
          if (radio) radio.checked = true;
        }
      } else {
        element.value = formData[key];
      }
    }
  });
  
  if (formData.tipoSolicitud) {
    handleTipoSolicitudChange(formData.tipoSolicitud);
  }
  
  if (formData.region) {
    loadCommunesData(formData.region);
    setTimeout(() => {
      if (formData.comuna) {
        document.getElementById('patient-comuna').value = formData.comuna;
      }
    }, 100);
  }
  
  document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
  document.querySelector(`[data-step="${currentFormStep}"]`)?.classList.add('active');
  
  updateFormProgress();
}

function submitPatientForm() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    handlePatientRegistration();
  }
}

function resetForm() {
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
    
    const phoneContainer = document.getElementById('anonymous-phone-container');
    const emailContainer = document.getElementById('info-email-container');
    if (phoneContainer) phoneContainer.style.display = 'none';
    if (emailContainer) emailContainer.style.display = 'none';
    
    const comunaSelect = document.getElementById('patient-comuna');
    if (comunaSelect) {
      comunaSelect.innerHTML = '<option value="">Seleccionar comuna...</option>';
      comunaSelect.disabled = true;
    }
    
    updateFormProgress();
  }
}

async function handlePatientRegistration(e) {
  if (e) e.preventDefault();
  
  showLoading(true);
  
  try {
    const prioridad = calculatePriority(formData);
    
    const solicitudData = {
      clasificacion: {
        tipo: formData.isReentry ? 'reingreso' : 'ingreso_voluntario',
        estado: 'pendiente',
        prioridad: prioridad,
        categoria_riesgo: prioridad === 'critica' ? 'extremo' : 
                         prioridad === 'alta' ? 'alto' : 
                         prioridad === 'media' ? 'moderado' : 'bajo'
      },
      
      datos_personales: {
        anonimo: formData.tipoSolicitud === 'anonimo',
        solo_informacion: formData.tipoSolicitud === 'informacion',
        edad: parseInt(formData.edad),
        genero: 'no_especificado',
        region: formData.region,
        id_comuna_residencia: formData.comuna || 'no_especificada',
        situacion_laboral: 'no_especificada',
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
      
      derivacion: {
        id_centro_preferido: formData.centroPreferencia || null,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp()
      },
      
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        canal_ingreso: 'web_publica'
      }
    };
    
    if (formData.tipoSolicitud === 'identificado') {
      solicitudData.datos_contacto = {
        telefono_principal: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
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

    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    if (prioridad === 'critica') {
      await createCriticalCaseAlert(docRef.id, solicitudData);
    }
    
    localStorage.removeItem('senda_draft');
    isDraftSaved = false;
    
    showSuccessMessage(docRef.id, formData.tipoSolicitud);
    
    closeModal('patient-modal');
    resetForm();
    
  } catch (error) {
    console.error('Error submitting patient registration:', error);
    showNotification('Error al enviar la solicitud. Por favor intenta nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}

function showSuccessMessage(solicitudId, tipoSolicitud) {
  const trackingCode = solicitudId.substring(0, 8).toUpperCase();
  
  if (tipoSolicitud === 'anonimo') {
    showNotification(
      `Solicitud enviada exitosamente. Tu código de seguimiento es: ${trackingCode}. Te contactaremos al teléfono proporcionado.`,
      'success',
      8000
    );
  } else if (tipoSolicitud === 'informacion') {
    showNotification(
      `Solicitud enviada exitosamente. Te enviaremos información del programa al email proporcionado.`,
      'success',
      6000
    );
  } else {
    showNotification(
      'Solicitud enviada exitosamente. Te contactaremos pronto al teléfono o email proporcionado.',
      'success',
      6000
    );
  }
}

async function createCriticalCaseAlert(solicitudId, solicitudData) {
  try {
    await db.collection('alertas_criticas').add({
      id_solicitud: solicitudId,
      tipo_alerta: 'caso_critico_nuevo',
      prioridad: 'maxima',
      mensaje: `Nuevo caso crítico: ${solicitudData.datos_personales.edad} años, urgencia ${solicitudData.evaluacion_inicial?.urgencia_declarada}`,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      notificado: false
    });
  } catch (error) {
    console.error('Error creating critical alert:', error);
  }
}
// ================= PARTE 4: AUTENTICACIÓN DE PROFESIONALES =================

// Estadísticas por CESFAM:
async function generateCesfamReport() {
  try {
    showLoading(true);

    const requestsSnapshot = await db.collection('solicitudes_ingreso').get();
    const patientsSnapshot = await db.collection('pacientes').get();

    // Analizar distribución por CESFAM
    const cesfamStats = {};

    cesfamPuenteAlto.forEach(c => cesfamStats[c] = { solicitudes: 0, pacientes: 0 });

    requestsSnapshot.forEach(doc => {
      const cesfam = doc.data().datos_personales?.cesfam || 'Sin CESFAM';
      if (!cesfamStats[cesfam]) cesfamStats[cesfam] = { solicitudes: 0, pacientes: 0 };
      cesfamStats[cesfam].solicitudes++;
    });

    patientsSnapshot.forEach(doc => {
      const cesfam = doc.data().datos_personales?.cesfam || 'Sin CESFAM';
      if (!cesfamStats[cesfam]) cesfamStats[cesfam] = { solicitudes: 0, pacientes: 0 };
      cesfamStats[cesfam].pacientes++;
    });

    showCesfamStatsModal(cesfamStats);

  } catch (error) {
    console.error('Error generando estadísticas por CESFAM:', error);
    showNotification('Error al generar estadísticas por CESFAM', 'error');
  } finally {
    showLoading(false);
  }
}

function showCesfamStatsModal(stats) {
  const modalHTML = `
    <div class="modal-overlay" id="cesfam-stats-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('cesfam-stats-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Estadísticas por CESFAM</h2>
        <div class="regional-stats">
          <table class="stats-table">
            <thead>
              <tr>
                <th>CESFAM</th>
                <th>Solicitudes</th>
                <th>Pacientes Activos</th>
                <th>Conversión</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats).map(([cesfam, data]) => `
                <tr>
                  <td><strong>${cesfam}</strong></td>
                  <td>${data.solicitudes}</td>
                  <td>${data.pacientes}</td>
                  <td>${data.solicitudes > 0 ? Math.round((data.pacientes / data.solicitudes) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-outline" onclick="closeModal('cesfam-stats-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('cesfam-stats-modal').style.display = 'flex';
}

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
// ================= PARTE 5: PANEL DE GESTIÓN Y DASHBOARD =================

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
    // Cargar estadísticas del dashboard
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Contar solicitudes pendientes
    const pendingRequests = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    // Contar casos críticos
    const criticalCases = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    // Contar pacientes activos
    const activePatients = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    // Actualizar métricas en el dashboard
    const totalPatientsElement = document.getElementById('total-patients');
    const pendingRequestsElement = document.getElementById('pending-requests');
    const criticalCasesElement = document.getElementById('critical-cases');
    
    if (totalPatientsElement) totalPatientsElement.textContent = activePatients.size;
    if (pendingRequestsElement) pendingRequestsElement.textContent = pendingRequests.size;
    if (criticalCasesElement) criticalCasesElement.textContent = criticalCases.size;
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ================= PANEL DE SOLICITUDES CORREGIDO PARA ASISTENTES SOCIALES =================

async function loadRequestsPanel(userData) {
  console.log('Loading requests panel for:', userData.nombre);
  
  // Verificar si es asistente social o admin
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
    
    // CONSULTA CORREGIDA - Obtener TODAS las solicitudes sin filtros de fecha
    let query = db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(100); // Aumentamos el límite para ver más solicitudes
    
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
      
      html += `
        <div class="card patient-card" data-request-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>Solicitud ${doc.id.substring(0, 8).toUpperCase()}</h3>
              <p>
                ${isInfoOnly ? 'Solo información' : 
                  isAnonymous ? 'Solicitud anónima' : 
                  (data.datos_contacto?.nombre_completo || 'Sin nombre')}
              </p>
              <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
            </div>
            <div style="text-align: right;">
              <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
              <div style="margin-top: 8px;">
                <span class="status-badge status-${estado}">${estado}</span>
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion)}</div>
            <div><strong>Para:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>
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
            <button class="btn btn-secondary btn-sm" onclick="assignRequest('${doc.id}')">
              <i class="fas fa-user-plus"></i> Asignar a Profesional
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

// Funciones para manejar solicitudes
async function reviewRequest(requestId) {
  try {
    const doc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    if (!doc.exists) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const data = doc.data();
    showRequestDetailModal(requestId, data);
  } catch (error) {
    console.error('Error reviewing request:', error);
    showNotification('Error al cargar la solicitud', 'error');
  }
}

function showRequestDetailModal(requestId, data) {
  const isAnonymous = data.datos_personales?.anonimo || false;
  const isInfoOnly = data.datos_personales?.solo_informacion || false;
  
  const modalHTML = `
    <div class="modal-overlay" id="request-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('request-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle de Solicitud ${requestId.substring(0, 8).toUpperCase()}</h2>
        
        <div class="request-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              ${!isAnonymous && data.datos_contacto?.nombre_completo ? 
                `<div><strong>Nombre:</strong> ${data.datos_contacto.nombre_completo}</div>` : ''}
              ${!isAnonymous && data.datos_contacto?.rut ? 
                `<div><strong>RUT:</strong> ${data.datos_contacto.rut}</div>` : ''}
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
              <div><strong>Para quien:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>
              <div><strong>Tipo:</strong> ${isInfoOnly ? 'Solo información' : isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos de Contacto</h3>
            <div class="info-grid">
              ${data.datos_contacto?.telefono_principal ? 
                `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
              ${data.datos_contacto?.email ? 
                `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
              ${data.datos_contacto?.direccion ? 
                `<div><strong>Dirección:</strong> ${data.datos_contacto.direccion}</div>` : ''}
            </div>
          </div>
          
          ${data.evaluacion_inicial ? `
          <div class="detail-section">
            <h3>Evaluación Inicial</h3>
            <div class="info-grid">
              ${data.evaluacion_inicial.sustancias_consumo ? 
                `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
              ${data.evaluacion_inicial.tiempo_consumo_meses ? 
                `<div><strong>Tiempo de consumo:</strong> ${data.evaluacion_inicial.tiempo_consumo_meses} meses</div>` : ''}
              ${data.evaluacion_inicial.motivacion_cambio ? 
                `<div><strong>Motivación al cambio:</strong> ${data.evaluacion_inicial.motivacion_cambio}/10</div>` : ''}
              ${data.evaluacion_inicial.urgencia_declarada ? 
                `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
              ${data.evaluacion_inicial.tratamiento_previo ? 
                `<div><strong>Tratamiento previo:</strong> ${data.evaluacion_inicial.tratamiento_previo}</div>` : ''}
            </div>
            ${data.evaluacion_inicial.descripcion_situacion ? `
            <div style="margin-top: 12px;">
              <strong>Descripción de la situación:</strong>
              <p style="margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 4px;">
                ${data.evaluacion_inicial.descripcion_situacion}
              </p>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="detail-section">
            <h3>Estado de la Solicitud</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.clasificacion?.estado || 'pendiente'}">${data.clasificacion?.estado || 'pendiente'}</span></div>
              <div><strong>Prioridad:</strong> <span class="priority-indicator priority-${data.clasificacion?.prioridad || 'baja'}">${data.clasificacion?.prioridad || 'baja'}</span></div>
              <div><strong>Fecha solicitud:</strong> ${formatDate(data.metadata?.fecha_creacion)}</div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          ${!isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="acceptRequest('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-check"></i> Aceptar Solicitud
          </button>
          <button class="btn btn-secondary" onclick="assignRequest('${requestId}')">
            <i class="fas fa-user-plus"></i> Asignar a Profesional
          </button>
          ` : ''}
          ${isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="sendInformation('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-envelope"></i> Enviar Información
          </button>
          ` : ''}
          <button class="btn btn-outline" onclick="closeModal('request-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('request-detail-modal').style.display = 'flex';
}

async function acceptRequest(requestId) {
  if (!confirm('¿Estás seguro de aceptar esta solicitud?')) return;
  
  try {
    showLoading(true);
    
    // Actualizar estado de la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
      'clasificacion.fecha_aceptacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': currentUserData.uid
    });
    
    // Crear entrada en pacientes si no existe
    const solicitud = await db.collection('solicitudes_ingreso').doc(requestId).get();
    const data = solicitud.data();
    
    if (!data.datos_personales.anonimo && !data.datos_personales.solo_informacion) {
      await createPatientRecord(requestId, data);
    }
    
    showNotification('Solicitud aceptada correctamente', 'success');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error accepting request:', error);
    showNotification('Error al aceptar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

async function assignRequest(requestId) {
  try {
    showAssignmentModal(requestId);
  } catch (error) {
    console.error('Error in assign request:', error);
    showNotification('Error al asignar solicitud', 'error');
  }
}

async function sendInformation(requestId) {
  if (!confirm('¿Enviar información del programa al email proporcionado?')) return;
  
  try {
    showLoading(true);
    
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'informacion_enviada',
      'clasificacion.fecha_respuesta': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_responsable': currentUserData.uid
    });
    
    showNotification('Información enviada correctamente', 'success');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error sending information:', error);
    showNotification('Error al enviar información', 'error');
  } finally {
    showLoading(false);
  }
}

async function createPatientRecord(solicitudId, solicitudData) {
  const patientData = {
    solicitud_origen: solicitudId,
    datos_personales: {
      nombre_completo: solicitudData.datos_contacto?.nombre_completo || '',
      rut: solicitudData.datos_contacto?.rut || '',
      edad: solicitudData.datos_personales?.edad || 0,
      region: solicitudData.datos_personales?.region || '',
      comuna: solicitudData.datos_personales?.id_comuna_residencia || '',
      direccion: solicitudData.datos_contacto?.direccion || ''
    },
    contacto: {
      telefono: solicitudData.datos_contacto?.telefono_principal || '',
      email: solicitudData.datos_contacto?.email || ''
    },
    historial_clinico: [{
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: 'ingreso_inicial',
      profesional: currentUserData.uid,
      evaluacion_inicial: solicitudData.evaluacion_inicial || {},
      observaciones: 'Paciente ingresado desde solicitud web'
    }],
    estado_actual: {
      activo: true,
      programa: 'ambulatorio',
      profesional_asignado: null,
      fecha_ingreso: firebase.firestore.FieldValue.serverTimestamp()
    },
    metadata: {
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      creado_por: currentUserData.uid
    }
  };
  
  await db.collection('pacientes').add(patientData);
}
// ================= PARTE 6: PANEL DE AGENDA 2025 Y GESTIÓN DE CITAS =================

async function loadCalendarPanel(userData) {
  console.log('Loading calendar panel for:', userData.nombre);
  
  const calendarContainer = document.getElementById('calendar-panel');
  if (!calendarContainer) return;
  
  // Agregar HTML del panel de agenda si no existe
  if (!document.getElementById('professionals-list')) {
    calendarContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda 2025</h1>
        <p class="panel-subtitle">Gestiona citas y horarios de profesionales - Año 2025 en adelante</p>
      </div>
      
      <div class="calendar-controls">
        <div class="calendar-navigation">
          <button class="btn btn-outline" id="prev-month">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span id="current-month-year">Enero 2025</span>
          <button class="btn btn-outline" id="next-month">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="calendar-view-controls">
          <button class="btn btn-secondary btn-sm" id="go-to-today">Ir a Hoy</button>
          <button class="btn btn-primary" id="new-appointment">
            <i class="fas fa-plus"></i> Nueva Cita
          </button>
        </div>
      </div>
      
      <div class="calendar-layout">
        <div class="professionals-sidebar">
          <h3>Profesionales Activos</h3>
          <div id="professionals-list">
            <!-- Lista de profesionales se cargará aquí -->
          </div>
        </div>
        
        <div class="calendar-main">
          <div id="calendar-grid">
            <!-- Calendario se generará aquí -->
          </div>
        </div>
      </div>
      
      <div class="appointments-summary">
        <h3>Resumen de Citas</h3>
        <div class="appointments-tabs">
          <button class="tab-btn active" data-period="today">Hoy</button>
          <button class="tab-btn" data-period="week">Esta Semana</button>
          <button class="tab-btn" data-period="month">Este Mes</button>
        </div>
        <div id="appointments-summary-list">
          <!-- Citas del período seleccionado se mostrarán aquí -->
        </div>
      </div>
    `;
  }
  
  // Asegurar que iniciamos en 2025
  currentCalendarDate = new Date(2025, 0, 1); // Enero 1, 2025
  
  setupCalendarEvents();
  await loadProfessionalsList();
  await loadCalendarView();
  await loadAppointmentsSummary('today');
}

async function loadProfessionalsList() {
  try {
    const professionalsContainer = document.getElementById('professionals-list');
    if (!professionalsContainer) return;
    
    professionalsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // CONSULTA CORREGIDA para obtener profesionales vinculados
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    let html = '';
    if (professionalsSnapshot.empty) {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay profesionales registrados</p>';
    } else {
      professionalsSnapshot.forEach(doc => {
        const data = doc.data();
        // Filtrar solo profesionales clínicos
        if (['medico', 'psicologo', 'terapeuta', 'asistente_social'].includes(data.profesion)) {
          html += `
            <div class="professional-item ${selectedProfessional === doc.id ? 'selected' : ''}" 
                 data-professional-id="${doc.id}" onclick="selectProfessional('${doc.id}')">
              <div class="professional-avatar">
                ${data.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div class="professional-info">
                <div class="professional-name">${data.nombre}</div>
                <div class="professional-role">${getProfessionName(data.profesion)}</div>
                <div class="professional-availability">
                  <span class="availability-dot available"></span>
                  Disponible
                </div>
              </div>
            </div>
          `;
        }
      });
    }
    
    if (html === '') {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay profesionales clínicos disponibles</p>';
    }
    
    professionalsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading professionals:', error);
    document.getElementById('professionals-list').innerHTML = '<p>Error al cargar profesionales: ' + error.message + '</p>';
  }
}

function selectProfessional(professionalId) {
  selectedProfessional = professionalId;
  
  // Actualizar UI
  document.querySelectorAll('.professional-item').forEach(item => {
    item.classList.remove('selected');
  });
  const selectedItem = document.querySelector(`[data-professional-id="${professionalId}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
  }
  
  // Recargar calendario con las citas del profesional seleccionado
  loadCalendarView();
  showNotification(`Profesional seleccionado. Mostrando agenda.`, 'info', 2000);
}

function setupCalendarEvents() {
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
  const newAppointment = document.getElementById('new-appointment');
  const goToToday = document.getElementById('go-to-today');
  
  if (prevMonth) {
    prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      // No permitir ir antes de 2025
      if (currentCalendarDate.getFullYear() < 2025) {
        currentCalendarDate = new Date(2025, 0, 1);
        showNotification('La agenda está disponible desde enero 2025 en adelante', 'warning');
      }
      loadCalendarView();
    });
  }
  
  if (nextMonth) {
    nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      loadCalendarView();
    });
  }
  
  if (goToToday) {
    goToToday.addEventListener('click', () => {
      const today = new Date();
      // Si estamos antes de 2025, ir a enero 2025
      if (today.getFullYear() < 2025) {
        currentCalendarDate = new Date(2025, 0, 1);
        showNotification('Navegando a enero 2025 (inicio de agenda disponible)', 'info');
      } else {
        currentCalendarDate = new Date(today);
      }
      loadCalendarView();
    });
  }
  
  if (newAppointment) {
    newAppointment.addEventListener('click', () => {
      showNewAppointmentModal();
    });
  }
  
  // Configurar tabs de resumen
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadAppointmentsSummary(this.dataset.period);
    });
  });
}

async function loadCalendarView() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('current-month-year');
    
    if (!calendarGrid || !monthYearSpan) return;
    
    // Actualizar título del mes
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    monthYearSpan.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Generar calendario
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Obtener citas del mes si hay profesional seleccionado
    let appointments = {};
    if (selectedProfessional) {
      try {
        const appointmentsSnapshot = await db.collection('citas')
          .where('profesional_id', '==', selectedProfessional)
          .where('fecha', '>=', firstDay)
          .where('fecha', '<=', lastDay)
          .get();
        
        appointmentsSnapshot.forEach(doc => {
          const data = doc.data();
          const date = data.fecha.toDate();
          const dateKey = date.toDateString();
          if (!appointments[dateKey]) appointments[dateKey] = [];
          appointments[dateKey].push({...data, id: doc.id});
        });
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    }
    
    let html = `
      <div class="calendar-header">
        <div class="calendar-day-header">Dom</div>
        <div class="calendar-day-header">Lun</div>
        <div class="calendar-day-header">Mar</div>
        <div class="calendar-day-header">Mié</div>
        <div class="calendar-day-header">Jue</div>
        <div class="calendar-day-header">Vie</div>
        <div class="calendar-day-header">Sáb</div>
      </div>
      <div class="calendar-days">
    `;
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === currentCalendarDate.getMonth();
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const dateKey = currentDate.toDateString();
      const dayAppointments = appointments[dateKey] || [];
      const isPast = currentDate < new Date().setHours(0,0,0,0);
      
      html += `
        <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}"
             onclick="selectCalendarDay('${currentDate.toISOString()}')">
          <div class="day-number">${currentDate.getDate()}</div>
          <div class="appointments-container">
            ${dayAppointments.slice(0, 3).map(apt => `
              <div class="appointment-item" 
                   style="background: var(--primary-blue); color: white; font-size: 10px; padding: 2px 4px; margin: 1px 0; border-radius: 2px; cursor: pointer;"
                   onclick="event.stopPropagation(); viewAppointment('${apt.id}')">
                ${new Date(apt.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
              </div>
            `).join('')}
            ${dayAppointments.length > 3 ? `<div class="more-appointments">+${dayAppointments.length - 3} más</div>` : ''}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    calendarGrid.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading calendar view:', error);
    document.getElementById('calendar-grid').innerHTML = '<p>Error al cargar el calendario</p>';
  }
}

function selectCalendarDay(dateISO) {
  if (!selectedProfessional) {
    showNotification('Selecciona un profesional primero para ver su agenda', 'warning');
    return;
  }
  
  const selectedDate = new Date(dateISO);
  
  // Verificar que no sea una fecha anterior a 2025
  if (selectedDate.getFullYear() < 2025) {
    showNotification('No se pueden agendar citas antes del año 2025', 'warning');
    return;
  }
  
  showDayAppointmentsModal(selectedDate, selectedProfessional);
}

async function loadAppointmentsSummary(period) {
  try {
    const summaryContainer = document.getElementById('appointments-summary-list');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }
    
    // Si estamos antes de 2025, mostrar desde 2025
    if (startDate.getFullYear() < 2025) {
      startDate = new Date(2025, 0, 1);
      if (period === 'today') {
        endDate = new Date(2025, 0, 1, 23, 59, 59);
      }
    }
    
    let query = db.collection('citas')
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha', 'asc');
    
    if (selectedProfessional) {
      query = query.where('profesional_id', '==', selectedProfessional);
    }
    
    const appointmentsSnapshot = await query.get();
    
    if (appointmentsSnapshot.empty) {
      summaryContainer.innerHTML = `<p style="color: var(--gray-600); text-align: center;">No hay citas programadas para ${period === 'today' ? 'hoy' : period === 'week' ? 'esta semana' : 'este mes'}</p>`;
      return;
    }
    
    let html = '';
    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener datos del profesional
      const professionalDoc = await db.collection('profesionales').doc(data.profesional_id).get();
      const professionalData = professionalDoc.exists ? professionalDoc.data() : null;
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
      const patientData = patientDoc.exists ? patientDoc.data() : null;
      
      const appointmentDate = data.fecha.toDate();
      const isToday = appointmentDate.toDateString() === new Date().toDateString();
      
      html += `
        <div class="appointment-summary-item ${isToday ? 'today-appointment' : ''}">
          <div class="appointment-time">
            <div class="time">${appointmentDate.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="date">${appointmentDate.toLocaleDateString('es-CL')}</div>
          </div>
          <div class="appointment-details">
            <div class="appointment-patient">${patientData?.datos_personales?.nombre_completo || 'Paciente sin nombre'}</div>
            <div class="appointment-professional">${professionalData?.nombre || 'Profesional'} - ${getProfessionName(professionalData?.profesion)}</div>
            <div class="appointment-type">${data.tipo_cita || 'Consulta general'}</div>
            <div class="appointment-status">
              <span class="status-badge status-${data.estado || 'programado'}">${data.estado || 'Programado'}</span>
            </div>
          </div>
          <div class="appointment-actions">
            <button class="btn btn-sm btn-outline" onclick="viewAppointment('${doc.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editAppointment('${doc.id}')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    summaryContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading appointments summary:', error);
    document.getElementById('appointments-summary-list').innerHTML = '<p>Error al cargar el resumen de citas</p>';
  }
}

function showAssignmentModal(requestId) {
  const modalHTML = `
    <div class="modal-overlay" id="assignment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('assignment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Asignar Solicitud a Profesional</h2>
        
        <form id="assignment-form">
          <div class="form-group">
            <label class="form-label">Seleccionar Profesional *</label>
            <select class="form-select" id="assign-professional" required>
              <option value="">Seleccionar profesional...</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas de asignación</label>
            <textarea class="form-textarea" id="assignment-notes" placeholder="Notas adicionales sobre la asignación..."></textarea>
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-user-check"></i> Asignar
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('assignment-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('assignment-modal').style.display = 'flex';
  
  // Cargar lista de profesionales
  loadProfessionalsForAssignment();
  
  // Manejar envío del formulario
  document.getElementById('assignment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    processAssignment(requestId);
  });
}

async function loadProfessionalsForAssignment() {
  try {
    const professionalSelect = document.getElementById('assign-professional');
    if (!professionalSelect) return;
    
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta', 'asistente_social'])
      .get();
    
    professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
    professionalsSnapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.nombre} - ${getProfessionName(data.profesion)}`;
      professionalSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading professionals for assignment:', error);
  }
}

async function processAssignment(requestId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('assign-professional').value;
    const notes = document.getElementById('assignment-notes').value;
    
    if (!professionalId) {
      showNotification('Por favor selecciona un profesional', 'error');
      return;
    }
    
    // Actualizar la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'asignada',
      'clasificacion.fecha_asignacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': professionalId,
      'clasificacion.notas_asignacion': notes,
      'clasificacion.asignado_por': currentUserData.uid
    });
    
    showNotification('Solicitud asignada correctamente', 'success');
    closeModal('assignment-modal');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error processing assignment:', error);
    showNotification('Error al asignar solicitud', 'error');
  } finally {
    showLoading(false);
  }
}
// ================= PARTE 7: GESTIÓN DE PACIENTES Y SEGUIMIENTOS =================

async function loadPatientsPanel(userData) {
  console.log('Loading patients panel for:', userData.nombre);
  
  try {
    const patientsList = document.getElementById('patients-list');
    if (!patientsList) return;
    
    patientsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
    
    // Obtener pacientes activos
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      patientsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en el sistema.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    for (const doc of patientsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener profesional asignado si existe
      let professionalName = 'Sin asignar';
      if (data.estado_actual?.profesional_asignado) {
        try {
          const profDoc = await db.collection('profesionales').doc(data.estado_actual.profesional_asignado).get();
          if (profDoc.exists) {
            professionalName = profDoc.data().nombre;
          }
        } catch (error) {
          console.error('Error loading professional:', error);
        }
      }
      
      // Calcular última actividad
      const lastActivity = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1].fecha
        : data.metadata?.fecha_creacion;
      
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
              <div style="margin-top: 8px;">
                <span class="priority-indicator priority-${data.estado_actual?.prioridad || 'media'}">
                  ${data.estado_actual?.prioridad || 'MEDIA'}
                </span>
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
            <div><strong>Profesional asignado:</strong> ${professionalName}</div>
            <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
            <div><strong>Comuna:</strong> ${data.datos_personales?.comuna || 'N/A'}</div>
            <div><strong>Última actividad:</strong> ${formatDate(lastActivity)}</div>
            <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'Sin teléfono'}</div>
            <div><strong>Email:</strong> ${data.contacto?.email || 'Sin email'}</div>
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
            <button class="btn btn-secondary btn-sm" onclick="viewPatientHistory('${doc.id}')">
              <i class="fas fa-history"></i> Historial
            </button>
            <button class="btn btn-success btn-sm" onclick="addFollowupNote('${doc.id}')">
              <i class="fas fa-notes-medical"></i> Agregar Nota
            </button>
            <button class="btn btn-info btn-sm" onclick="scheduleAppointment('${doc.id}')">
              <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </div>
      `;
    }
    
    patientsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading patients:', error);
    const patientsList = document.getElementById('patients-list');
    if (patientsList) {
      patientsList.innerHTML = '<p>Error al cargar pacientes: ' + error.message + '</p>';
    }
  }
}

async function viewPatientDetail(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const data = doc.data();
    showPatientDetailModal(patientId, data);
  } catch (error) {
    console.error('Error viewing patient detail:', error);
    showNotification('Error al cargar detalle del paciente', 'error');
  }
}

function showPatientDetailModal(patientId, data) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle del Paciente</h2>
        
        <div class="patient-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div><strong>Nombre completo:</strong> ${data.datos_personales?.nombre_completo || 'N/A'}</div>
              <div><strong>RUT:</strong> ${data.datos_personales?.rut || 'N/A'}</div>
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
              <div><strong>Comuna:</strong> ${data.datos_personales?.comuna || 'N/A'}</div>
              <div><strong>Dirección:</strong> ${data.datos_personales?.direccion || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos de Contacto</h3>
            <div class="info-grid">
              <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${data.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Estado Actual</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}</span></div>
              <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'N/A'}</div>
              <div><strong>Fecha de ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
            </div>
          </div>
          
          ${data.historial_clinico && data.historial_clinico.length > 0 ? `
          <div class="detail-section">
            <h3>Última Evaluación</h3>
            <div class="info-grid">
              ${data.historial_clinico[0].evaluacion_inicial ? `
                <div><strong>Sustancias:</strong> ${data.historial_clinico[0].evaluacion_inicial.sustancias_consumo?.join(', ') || 'N/A'}</div>
                <div><strong>Tiempo de consumo:</strong> ${data.historial_clinico[0].evaluacion_inicial.tiempo_consumo_meses || 'N/A'} meses</div>
                <div><strong>Motivación:</strong> ${data.historial_clinico[0].evaluacion_inicial.motivacion_cambio || 'N/A'}/10</div>
                <div><strong>Urgencia:</strong> ${data.historial_clinico[0].evaluacion_inicial.urgencia_declarada || 'N/A'}</div>
              ` : ''}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-success" onclick="addFollowupNote('${patientId}')">
            <i class="fas fa-notes-medical"></i> Agregar Nota de Seguimiento
          </button>
          <button class="btn btn-secondary" onclick="viewPatientHistory('${patientId}')">
            <i class="fas fa-history"></i> Ver Historial Completo
          </button>
          <button class="btn btn-info" onclick="generatePatientReport('${patientId}')">
            <i class="fas fa-file-alt"></i> Generar Reporte
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-detail-modal').style.display = 'flex';
}

async function viewPatientHistory(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const data = doc.data();
    showPatientHistoryModal(patientId, data);
  } catch (error) {
    console.error('Error viewing patient history:', error);
    showNotification('Error al cargar historial del paciente', 'error');
  }
}

function showPatientHistoryModal(patientId, data) {
  const historial = data.historial_clinico || [];
  
  const modalHTML = `
    <div class="modal-overlay" id="patient-history-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-history-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Historial Clínico - ${data.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
        
        <div class="history-timeline">
          ${historial.length > 0 ? historial.map((entry, index) => `
            <div class="timeline-item">
              <div class="timeline-marker">
                <i class="fas fa-${entry.tipo === 'ingreso_inicial' ? 'user-plus' : 
                                   entry.tipo === 'seguimiento' ? 'notes-medical' : 
                                   entry.tipo === 'cita' ? 'calendar-check' : 'file-medical'}"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>${entry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'}</h4>
                  <span class="timeline-date">${formatDate(entry.fecha)}</span>
                </div>
                <div class="timeline-body">
                  ${entry.observaciones ? `<p><strong>Observaciones:</strong> ${entry.observaciones}</p>` : ''}
                  ${entry.evaluacion_inicial ? `
                    <div class="evaluation-details">
                      <p><strong>Evaluación Inicial:</strong></p>
                      <ul>
                        ${entry.evaluacion_inicial.sustancias_consumo ? 
                          `<li>Sustancias: ${entry.evaluacion_inicial.sustancias_consumo.join(', ')}</li>` : ''}
                        ${entry.evaluacion_inicial.tiempo_consumo_meses ? 
                          `<li>Tiempo de consumo: ${entry.evaluacion_inicial.tiempo_consumo_meses} meses</li>` : ''}
                        ${entry.evaluacion_inicial.motivacion_cambio ? 
                          `<li>Motivación al cambio: ${entry.evaluacion_inicial.motivacion_cambio}/10</li>` : ''}
                      </ul>
                    </div>
                  ` : ''}
                  ${entry.notas_seguimiento ? `<p><strong>Notas:</strong> ${entry.notas_seguimiento}</p>` : ''}
                </div>
              </div>
            </div>
          `).join('') : '<p style="text-align: center; color: var(--gray-600);">No hay registros en el historial</p>'}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-primary" onclick="addFollowupNote('${patientId}')">
            <i class="fas fa-plus"></i> Agregar Nueva Nota
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-history-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-history-modal').style.display = 'flex';
}

function addFollowupNote(patientId) {
  const modalHTML = `
    <div class="modal-overlay" id="followup-note-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('followup-note-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agregar Nota de Seguimiento</h2>
        
        <form id="followup-note-form">
          <div class="form-group">
            <label class="form-label">Tipo de registro *</label>
            <select class="form-select" id="followup-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="seguimiento">Seguimiento general</option>
              <option value="cita">Registro de cita</option>
              <option value="evaluacion">Evaluación</option>
              <option value="crisis">Intervención en crisis</option>
              <option value="derivacion">Derivación</option>
              <option value="alta">Alta del programa</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas y observaciones *</label>
            <textarea class="form-textarea" id="followup-notes" rows="6" required
                      placeholder="Describe la situación, intervenciones realizadas, evolución del paciente, plan de seguimiento, etc."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado del paciente</label>
            <select class="form-select" id="patient-status">
              <option value="estable">Estable</option>
              <option value="mejoria">En mejoría</option>
              <option value="deterioro">En deterioro</option>
              <option value="crisis">En crisis</option>
              <option value="alta_voluntaria">Alta voluntaria</option>
              <option value="abandono">Abandono de tratamiento</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Próxima cita programada</label>
            <input type="datetime-local" class="form-input" id="next-appointment" min="2025-01-01T08:00">
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Guardar Nota
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('followup-note-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('followup-note-modal').style.display = 'flex';
  
  document.getElementById('followup-note-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveFollowupNote(patientId);
  });
}

async function saveFollowupNote(patientId) {
  try {
    showLoading(true);
    
    const noteData = {
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: document.getElementById('followup-type').value,
      profesional: currentUserData.uid,
      notas_seguimiento: document.getElementById('followup-notes').value,
      estado_paciente: document.getElementById('patient-status').value,
      observaciones: `Nota de seguimiento registrada por ${currentUserData.nombre}`
    };
    
    const nextAppointment = document.getElementById('next-appointment').value;
    if (nextAppointment) {
      noteData.proxima_cita = new Date(nextAppointment);
    }
    
    // Agregar al historial del paciente
    await db.collection('pacientes').doc(patientId).update({
      historial_clinico: firebase.firestore.FieldValue.arrayUnion(noteData),
      'metadata.ultima_actualizacion': firebase.firestore.FieldValue.serverTimestamp(),
      'metadata.actualizado_por': currentUserData.uid
    });
    
    showNotification('Nota de seguimiento agregada correctamente', 'success');
    closeModal('followup-note-modal');
    
    // Recargar panel de pacientes si está visible
    if (document.getElementById('patients-panel').classList.contains('active')) {
      loadPatientsPanel(currentUserData);
    }
    
  } catch (error) {
    console.error('Error saving followup note:', error);
    showNotification('Error al guardar la nota de seguimiento', 'error');
  } finally {
    showLoading(false);
  }
}

async function loadFollowupsPanel(userData) {
  console.log('Loading followups panel for:', userData.nombre);
  
  try {
    const followupsList = document.getElementById('followups-list');
    if (!followupsList) return;
    
    followupsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>';
    
    // Obtener pacientes con sus historiales más recientes
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.ultima_actualizacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      followupsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos registrados.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const lastEntry = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1] 
        : null;
      
      if (lastEntry) {
        html += `
          <div class="card followup-card">
            <div class="card-header">
              <div>
                <h3>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h3>
                <p>RUT: ${data.datos_personales?.rut || 'Sin RUT'}</p>
              </div>
              <div style="text-align: right;">
                <span class="followup-type">${lastEntry.tipo?.replace('_', ' ').toUpperCase()}</span>
                <div style="margin-top: 4px;">
                  <small style="color: var(--gray-600);">${formatDate(lastEntry.fecha)}</small>
                </div>
              </div>
            </div>
            <div class="followup-content">
              <p><strong>Último registro:</strong> ${lastEntry.notas_seguimiento || lastEntry.observaciones || 'Sin notas'}</p>
              ${lastEntry.estado_paciente ? `<p><strong>Estado:</strong> ${lastEntry.estado_paciente}</p>` : ''}
              ${lastEntry.proxima_cita ? `<p><strong>Próxima cita:</strong> ${formatDate(lastEntry.proxima_cita)}</p>` : ''}
            </div>
            <div class="card-actions" style="margin-top: 12px;">
              <button class="btn btn-primary btn-sm" onclick="addFollowupNote('${doc.id}')">
                <i class="fas fa-plus"></i> Nueva Nota
              </button>
              <button class="btn btn-secondary btn-sm" onclick="viewPatientHistory('${doc.id}')">
                <i class="fas fa-history"></i> Ver Historial
              </button>
            </div>
          </div>
        `;
      }
    });
    
    if (html === '') {
      html = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            No hay seguimientos recientes para mostrar.
          </p>
        </div>
      `;
    }
    
    followupsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading followups:', error);
    const followupsList = document.getElementById('followups-list');
    if (followupsList) {
      followupsList.innerHTML = '<p>Error al cargar seguimientos: ' + error.message + '</p>';
    }
  }
}
// ================= PARTE 8: REPORTES Y ESTADÍSTICAS =================

async function loadReportsPanel(userData) {
  console.log('Loading reports panel for:', userData.nombre);
  
  const reportsContainer = document.getElementById('reports-panel');
  if (!reportsContainer) return;
  
  // Verificar permisos
  if (!userData.configuracion_sistema?.permisos?.includes('reportes') && 
      userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    reportsContainer.innerHTML = `
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
          No tienes permisos para acceder a los reportes.
        </p>
      </div>
    `;
    return;
  }
  
  // Cargar estadísticas y métricas
  try {
    const stats = await loadSystemStatistics();
    
    reportsContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes y Estadísticas</h1>
        <p class="panel-subtitle">Métricas del sistema y reportes generales</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-content">
            <h3>${stats.totalPatients}</h3>
            <p>Pacientes Activos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
          <div class="stat-content">
            <h3>${stats.pendingRequests}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-content">
            <h3>${stats.criticalCases}</h3>
            <p>Casos Críticos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
          <div class="stat-content">
            <h3>${stats.appointmentsToday}</h3>
            <p>Citas Hoy</p>
          </div>
        </div>
      </div>
      
      <div class="reports-section">
        <h2>Generar Reportes</h2>
        <div class="reports-grid">
          <div class="report-card">
            <h3>Reporte de Pacientes</h3>
            <p>Lista completa de pacientes activos con sus datos básicos</p>
            <button class="btn btn-primary" onclick="generatePatientsReport()">
              <i class="fas fa-file-excel"></i> Generar Excel
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Solicitudes</h3>
            <p>Historial de solicitudes de ingreso por período</p>
            <button class="btn btn-primary" onclick="generateRequestsReport()">
              <i class="fas fa-file-pdf"></i> Generar PDF
            </button>
          </div>
          
          <div class="report-card">
            <h3>Estadísticas Regionales</h3>
            <p>Distribución de casos por región y comuna</p>
            <button class="btn btn-primary" onclick="generateRegionalReport()">
              <i class="fas fa-chart-bar"></i> Ver Estadísticas
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Seguimientos</h3>
            <p>Actividad de seguimiento por profesional</p>
            <button class="btn btn-primary" onclick="generateFollowupsReport()">
              <i class="fas fa-notes-medical"></i> Generar Reporte
            </button>
          </div>
        </div>
      </div>
      
      <div class="monthly-stats">
        <h2>Estadísticas del Mes - ${new Date().toLocaleDateString('es-CL', {month: 'long', year: 'numeric'})}</h2>
        <div class="monthly-grid">
          <div class="monthly-item">
            <strong>Nuevas solicitudes:</strong> ${stats.monthlyRequests}
          </div>
          <div class="monthly-item">
            <strong>Pacientes ingresados:</strong> ${stats.monthlyPatients}
          </div>
          <div class="monthly-item">
            <strong>Seguimientos realizados:</strong> ${stats.monthlyFollowups}
          </div>
          <div class="monthly-item">
            <strong>Citas programadas:</strong> ${stats.monthlyAppointments}
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading reports panel:', error);
    reportsContainer.innerHTML = '<p>Error al cargar estadísticas: ' + error.message + '</p>';
  }
}

async function loadSystemStatistics() {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Obtener estadísticas en paralelo
    const [
      totalPatientsSnapshot,
      pendingRequestsSnapshot,
      criticalCasesSnapshot,
      appointmentsTodaySnapshot,
      monthlyRequestsSnapshot,
      monthlyPatientsSnapshot,
      monthlyFollowupsSnapshot,
      monthlyAppointmentsSnapshot
    ] = await Promise.all([
      db.collection('pacientes').where('estado_actual.activo', '==', true).get(),
      db.collection('solicitudes_ingreso').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('solicitudes_ingreso').where('clasificacion.prioridad', '==', 'critica').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('citas').where('fecha', '>=', startOfDay).where('fecha', '<=', endOfDay).get(),
      db.collection('solicitudes_ingreso').where('metadata.fecha_creacion', '>=', startOfMonth).get(),
      db.collection('pacientes').where('metadata.fecha_creacion', '>=', startOfMonth).get(),
      db.collection('pacientes').where('metadata.ultima_actualizacion', '>=', startOfMonth).get(),
      db.collection('citas').where('fecha_creacion', '>=', startOfMonth).get()
    ]);
    
    return {
      totalPatients: totalPatientsSnapshot.size,
      pendingRequests: pendingRequestsSnapshot.size,
      criticalCases: criticalCasesSnapshot.size,
      appointmentsToday: appointmentsTodaySnapshot.size,
      monthlyRequests: monthlyRequestsSnapshot.size,
      monthlyPatients: monthlyPatientsSnapshot.size,
      monthlyFollowups: monthlyFollowupsSnapshot.size,
      monthlyAppointments: monthlyAppointmentsSnapshot.size
    };
  } catch (error) {
    console.error('Error loading statistics:', error);
    return {
      totalPatients: 0,
      pendingRequests: 0,
      criticalCases: 0,
      appointmentsToday: 0,
      monthlyRequests: 0,
      monthlyPatients: 0,
      monthlyFollowups: 0,
      monthlyAppointments: 0
    };
  }
}

async function generatePatientsReport() {
  try {
    showLoading(true);
    
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    if (patientsSnapshot.empty) {
      showNotification('No hay pacientes para generar el reporte', 'warning');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,RUT,Edad,Región,Comuna,Teléfono,Email,Programa,Fecha Ingreso\n";
    
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const row = [
        `"${data.datos_personales?.nombre_completo || 'Sin nombre'}"`,
        `"${data.datos_personales?.rut || 'Sin RUT'}"`,
        data.datos_personales?.edad || 0,
        `"${data.datos_personales?.region || 'N/A'}"`,
        `"${data.datos_personales?.comuna || 'N/A'}"`,
        `"${data.contacto?.telefono || 'Sin teléfono'}"`,
        `"${data.contacto?.email || 'Sin email'}"`,
        `"${data.estado_actual?.programa || 'N/A'}"`,
        `"${formatDate(data.estado_actual?.fecha_ingreso)}"`
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Reporte de pacientes generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating patients report:', error);
    showNotification('Error al generar el reporte de pacientes', 'error');
  } finally {
    showLoading(false);
  }
}

async function generateRequestsReport() {
  try {
    showLoading(true);
    
    const requestsSnapshot = await db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(1000)
      .get();
    
    if (requestsSnapshot.empty) {
      showNotification('No hay solicitudes para generar el reporte', 'warning');
      return;
    }
    
    // Crear contenido del reporte
    let reportContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Reporte de Solicitudes SENDA</h1>
        <p style="text-align: center; color: #666;">Generado el ${new Date().toLocaleDateString('es-CL')}</p>
        <hr style="margin: 30px 0;">
        
        <h2>Resumen Ejecutivo</h2>
        <p>Total de solicitudes: <strong>${requestsSnapshot.size}</strong></p>
        
        <h2>Detalle de Solicitudes</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Fecha</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Prioridad</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Región</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    requestsSnapshot.forEach(doc => {
      const data = doc.data();
      const tipo = data.datos_personales?.anonimo ? 'Anónimo' : 
                   data.datos_personales?.solo_informacion ? 'Información' : 'Identificado';
      
      reportContent += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${doc.id.substring(0, 8).toUpperCase()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(data.metadata?.fecha_creacion)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${tipo}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.clasificacion?.estado || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.clasificacion?.prioridad || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.datos_personales?.region || 'N/A'}</td>
        </tr>
      `;
    });
    
    reportContent += `
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            Este reporte fue generado automáticamente por el Sistema SENDA el ${new Date().toLocaleString('es-CL')}.
            Para más información, contacta al equipo de soporte técnico.
          </p>
        </div>
      </div>
    `;
    
    // Crear y descargar PDF (simulado con HTML)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.print();
    
    showNotification('Reporte de solicitudes generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating requests report:', error);
    showNotification('Error al generar el reporte de solicitudes', 'error');
  } finally {
    showLoading(false);
  }
}

async function generateRegionalReport() {
  try {
    showLoading(true);
    
    const requestsSnapshot = await db.collection('solicitudes_ingreso').get();
    const patientsSnapshot = await db.collection('pacientes').get();
    
    // Analizar distribución por región
    const regionalStats = {};
    
    requestsSnapshot.forEach(doc => {
      const region = doc.data().datos_personales?.region || 'Sin región';
      if (!regionalStats[region]) {
        regionalStats[region] = { solicitudes: 0, pacientes: 0 };
      }
      regionalStats[region].solicitudes++;
    });
    
    patientsSnapshot.forEach(doc => {
      const region = doc.data().datos_personales?.region || 'Sin región';
      if (!regionalStats[region]) {
        regionalStats[region] = { solicitudes: 0, pacientes: 0 };
      }
      regionalStats[region].pacientes++;
    });
    
    showRegionalStatsModal(regionalStats);
    
  } catch (error) {
    console.error('Error generating regional report:', error);
    showNotification('Error al generar estadísticas regionales', 'error');
  } finally {
    showLoading(false);
  }
}

function showRegionalStatsModal(stats) {
  const modalHTML = `
    <div class="modal-overlay" id="regional-stats-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('regional-stats-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Estadísticas Regionales</h2>
        
        <div class="regional-stats">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Región</th>
                <th>Solicitudes</th>
                <th>Pacientes Activos</th>
                <th>Conversión</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats).map(([region, data]) => `
                <tr>
                  <td><strong>${regionesChile[region]?.nombre || region}</strong></td>
                  <td>${data.solicitudes}</td>
                  <td>${data.pacientes}</td>
                  <td>${data.solicitudes > 0 ? Math.round((data.pacientes / data.solicitudes) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-outline" onclick="closeModal('regional-stats-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('regional-stats-modal').style.display = 'flex';
}
// ================= PARTE 9: FUNCIONES AUXILIARES Y UTILIDADES FINALES =================

// Función para mostrar modal de asignación de profesionales
async function showAssignmentModal(requestId) {
  try {
    // Obtener profesionales disponibles
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    const modalHTML = `
      <div class="modal-overlay" id="assignment-modal">
        <div class="modal">
          <button class="modal-close" onclick="closeModal('assignment-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Asignar Profesional</h2>
          
          <form id="assignment-form">
            <div class="form-group">
              <label class="form-label">Seleccionar profesional *</label>
              <select class="form-select" id="assigned-professional" required>
                <option value="">Seleccionar profesional...</option>
                ${professionalsSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return `<option value="${doc.id}">${data.nombre} - ${getProfessionName(data.profesion)}</option>`;
                }).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Prioridad de asignación</label>
              <select class="form-select" id="assignment-priority">
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Notas de asignación</label>
              <textarea class="form-textarea" id="assignment-notes" 
                        placeholder="Instrucciones especiales o comentarios..."></textarea>
            </div>
            
            <div class="modal-actions" style="margin-top: 24px;">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> Asignar
              </button>
              <button type="button" class="btn btn-outline" onclick="closeModal('assignment-modal')">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('assignment-modal').style.display = 'flex';
    
    document.getElementById('assignment-form').addEventListener('submit', function(e) {
      e.preventDefault();
      processAssignment(requestId);
    });
    
  } catch (error) {
    console.error('Error showing assignment modal:', error);
    showNotification('Error al cargar modal de asignación', 'error');
  }
}

async function processAssignment(requestId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('assigned-professional').value;
    const priority = document.getElementById('assignment-priority').value;
    const notes = document.getElementById('assignment-notes').value;
    
    if (!professionalId) {
      showNotification('Selecciona un profesional', 'error');
      return;
    }
    
    // Actualizar solicitud con asignación
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'asignada',
      'clasificacion.profesional_asignado': professionalId,
      'clasificacion.prioridad_asignacion': priority,
      'clasificacion.fecha_asignacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.notas_asignacion': notes,
      'clasificacion.asignado_por': currentUserData.uid
    });
    
    // Crear notificación para el profesional asignado
    await db.collection('notificaciones').add({
      destinatario: professionalId,
      tipo: 'nueva_asignacion',
      titulo: 'Nueva solicitud asignada',
      mensaje: `Se te ha asignado una nueva solicitud con prioridad ${priority}`,
      solicitud_id: requestId,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      leida: false
    });
    
    showNotification('Solicitud asignada correctamente', 'success');
    closeModal('assignment-modal');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error processing assignment:', error);
    showNotification('Error al asignar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

// Función para mostrar citas del día
async function showDayAppointmentsModal(selectedDate, professionalId) {
  try {
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('profesional_id', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    const modalHTML = `
      <div class="modal-overlay" id="day-appointments-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('day-appointments-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Citas del ${selectedDate.toLocaleDateString('es-CL')}</h2>
          
          <div class="day-appointments-list">
            ${appointmentsSnapshot.empty ? 
              '<p style="text-align: center; color: var(--gray-600);">No hay citas programadas para este día</p>' :
              appointmentsSnapshot.docs.map(doc => {
                const data = doc.data();
                return `
                  <div class="appointment-item-detail">
                    <div class="appointment-time">
                      ${new Date(data.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div class="appointment-info">
                      <h4>Paciente: ${data.paciente_nombre || 'Cargando...'}</h4>
                      <p>Tipo: ${data.tipo_cita || 'Consulta general'}</p>
                      <p>Modalidad: ${data.modalidad || 'Presencial'}</p>
                      <p>Duración: ${data.duracion_minutos || 60} minutos</p>
                      ${data.notas_previas ? `<p>Notas: ${data.notas_previas}</p>` : ''}
                    </div>
                    <div class="appointment-actions">
                      <button class="btn btn-sm btn-success" onclick="markAppointmentCompleted('${doc.id}')">
                        <i class="fas fa-check"></i> Completar
                      </button>
                      <button class="btn btn-sm btn-warning" onclick="rescheduleAppointment('${doc.id}')">
                        <i class="fas fa-clock"></i> Reagendar
                      </button>
                      <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${doc.id}')">
                        <i class="fas fa-times"></i> Cancelar
                      </button>
                    </div>
                  </div>
                `;
              }).join('')
            }
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button class="btn btn-primary" onclick="showNewAppointmentForDay('${selectedDate.toISOString()}', '${professionalId}')">
              <i class="fas fa-plus"></i> Nueva Cita Este Día
            </button>
            <button class="btn btn-outline" onclick="closeModal('day-appointments-modal')">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('day-appointments-modal').style.display = 'flex';
    
    // Cargar nombres de pacientes
    loadPatientNamesForAppointments(appointmentsSnapshot.docs);
    
  } catch (error) {
    console.error('Error showing day appointments:', error);
    showNotification('Error al cargar citas del día', 'error');
  }
}

async function loadPatientNamesForAppointments(appointmentDocs) {
  for (const doc of appointmentDocs) {
    const data = doc.data();
    if (data.paciente_id) {
      try {
        const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          const appointmentElement = document.querySelector(`[data-appointment-id="${doc.id}"] .appointment-info h4`);
          if (appointmentElement) {
            appointmentElement.textContent = `Paciente: ${patientData.datos_personales?.nombre_completo || 'Sin nombre'}`;
          }
        }
      } catch (error) {
        console.error('Error loading patient name:', error);
      }
    }
  }
}

// Funciones para manejar citas
async function markAppointmentCompleted(appointmentId) {
  if (!confirm('¿Marcar esta cita como completada?')) return;
  
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'completada',
      fecha_completada: firebase.firestore.FieldValue.serverTimestamp(),
      completada_por: currentUserData.uid
    });
    
    showNotification('Cita marcada como completada', 'success');
    closeModal('day-appointments-modal');
    loadCalendarView();
    
  } catch (error) {
    console.error('Error marking appointment as completed:', error);
    showNotification('Error al completar la cita', 'error');
  }
}

async function cancelAppointment(appointmentId) {
  if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
  
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'cancelada',
      fecha_cancelacion: firebase.firestore.FieldValue.serverTimestamp(),
      cancelada_por: currentUserData.uid
    });
    
    showNotification('Cita cancelada correctamente', 'success');
    closeModal('day-appointments-modal');
    loadCalendarView();
    
  } catch (error) {
    console.error('Error canceling appointment:', error);
    showNotification('Error al cancelar la cita', 'error');
  }
}

// Función para programar cita directamente para un paciente
function scheduleAppointment(patientId) {
  showNewAppointmentModal();
  
  // Pre-seleccionar el paciente
  setTimeout(() => {
    const patientSelect = document.getElementById('appointment-patient');
    if (patientSelect) {
      patientSelect.value = patientId;
    }
  }, 500);
}

// Función para generar reporte de paciente individual
async function generatePatientReport(patientId) {
  try {
    showLoading(true);
    
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    
    // Obtener citas del paciente
    const appointmentsSnapshot = await db.collection('citas')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc')
      .get();
    
    const reportContent = generatePatientReportHTML(patientData, appointmentsSnapshot.docs);
    showPatientReportModal(reportContent);
    
  } catch (error) {
    console.error('Error generating patient report:', error);
    showNotification('Error al generar reporte del paciente', 'error');
  } finally {
    showLoading(false);
  }
}

function generatePatientReportHTML(patientData, appointments) {
  return `
    <div class="patient-report">
      <div class="report-header">
        <h1>Reporte de Paciente</h1>
        <h2>${patientData.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
        <p>RUT: ${patientData.datos_personales?.rut || 'Sin RUT'}</p>
        <p>Generado el: ${new Date().toLocaleDateString('es-CL')}</p>
      </div>
      
      <div class="report-section">
        <h3>Información Personal</h3>
        <table class="report-table">
          <tr><td><strong>Edad:</strong></td><td>${patientData.datos_personales?.edad || 'N/A'} años</td></tr>
          <tr><td><strong>Región:</strong></td><td>${patientData.datos_personales?.region || 'N/A'}</td></tr>
          <tr><td><strong>Comuna:</strong></td><td>${patientData.datos_personales?.comuna || 'N/A'}</td></tr>
          <tr><td><strong>Dirección:</strong></td><td>${patientData.datos_personales?.direccion || 'N/A'}</td></tr>
          <tr><td><strong>Teléfono:</strong></td><td>${patientData.contacto?.telefono || 'N/A'}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${patientData.contacto?.email || 'N/A'}</td></tr>
        </table>
      </div>
      
      <div class="report-section">
        <h3>Estado del Tratamiento</h3>
        <table class="report-table">
          <tr><td><strong>Estado:</strong></td><td>${patientData.estado_actual?.activo ? 'Activo' : 'Inactivo'}</td></tr>
          <tr><td><strong>Programa:</strong></td><td>${patientData.estado_actual?.programa || 'N/A'}</td></tr>
          <tr><td><strong>Fecha de ingreso:</strong></td><td>${formatDate(patientData.estado_actual?.fecha_ingreso)}</td></tr>
        </table>
      </div>
      
      ${patientData.historial_clinico && patientData.historial_clinico.length > 0 ? `
      <div class="report-section">
        <h3>Historial Clínico</h3>
        ${patientData.historial_clinico.map(entry => `
          <div class="history-entry">
            <h4>${entry.tipo?.replace('_', ' ').toUpperCase()} - ${formatDate(entry.fecha)}</h4>
            <p>${entry.observaciones || entry.notas_seguimiento || 'Sin observaciones'}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${appointments.length > 0 ? `
      <div class="report-section">
        <h3>Historial de Citas</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Modalidad</th>
            </tr>
          </thead>
          <tbody>
            ${appointments.map(doc => {
              const data = doc.data();
              return `
                <tr>
                  <td>${formatDate(data.fecha)}</td>
                  <td>${data.tipo_cita || 'Consulta'}</td>
                  <td>${data.estado || 'Programada'}</td>
                  <td>${data.modalidad || 'Presencial'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    </div>
  `;
}

function showPatientReportModal(reportContent) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-report-preview-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-report-preview-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div class="modal-header">
          <h2>Vista previa del reporte</h2>
          <button class="btn btn-primary" onclick="printPatientReport()">
            <i class="fas fa-print"></i> Imprimir
          </button>
        </div>
        
        <div class="report-preview" id="report-content">
          ${reportContent}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-report-preview-modal').style.display = 'flex';
}

function printPatientReport() {
  const reportContent = document.getElementById('report-content').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Paciente</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; }
          .report-table th { background-color: #f5f5f5; }
          .report-section { margin: 20px 0; }
          .history-entry { margin: 10px 0; padding: 10px; border-left: 3px solid #2563eb; }
        </style>
      </head>
      <body>
        ${reportContent}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Función para obtener ubicación del usuario
function getCurrentLocation() {
  if (!navigator.geolocation) {
    showNotification('La geolocalización no está soportada en este navegador', 'error');
    return;
  }
  
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    async function(position) {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Aquí podrías hacer una llamada a una API de geocodificación inversa
        // Por simplicidad, solo mostramos las coordenadas
        showNotification(`Ubicación obtenida: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
        
        // Buscar centros cercanos (simulado)
        await loadNearbyClinics(lat, lng);
        
      } catch (error) {
        console.error('Error processing location:', error);
        showNotification('Error al procesar la ubicación', 'error');
      } finally {
        showLoading(false);
      }
    },
    function(error) {
      showLoading(false);
      let errorMessage = 'Error al obtener la ubicación';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de geolocalización denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Información de ubicación no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado para obtener la ubicación';
          break;
      }
      
      showNotification(errorMessage, 'error');
    }
  );
}

// Función para cargar centros cercanos
async function loadNearbyClinics(lat = null, lng = null) {
  try {
    const centersList = document.getElementById('centers-list');
    if (!centersList) return;
    
    // Simular centros SENDA (en un caso real, esto vendría de una base de datos)
    const centers = [
      {
        name: 'Centro SENDA Santiago Centro',
        address: 'Moneda 1180, Santiago, Región Metropolitana',
        phone: '+56 2 2690 4000',
        type: 'Ambulatorio',
        distance: lat && lng ? '2.5 km' : null
      },
      {
        name: 'Centro SENDA Maipú',
        address: 'Av. Pajaritos 3201, Maipú, Región Metropolitana',
        phone: '+56 2 2690 4100',
        type: 'Residencial',
        distance: lat && lng ? '8.3 km' : null
      },
      {
        name: 'Centro SENDA Las Condes',
        address: 'Av. Apoquindo 4499, Las Condes, Región Metropolitana',
        phone: '+56 2 2690 4200',
        type: 'Ambulatorio',
        distance: lat && lng ? '12.1 km' : null
      }
    ];
    
    let html = '';
    centers.forEach(center => {
      html += `
        <div class="center-card">
          <h3>${center.name}</h3>
          <p><i class="fas fa-map-marker-alt"></i> ${center.address}</p>
          <p><i class="fas fa-phone"></i> ${center.phone}</p>
          <p><i class="fas fa-hospital"></i> Tipo: ${center.type}</p>
          ${center.distance ? `<p><i class="fas fa-route"></i> Distancia: ${center.distance}</p>` : ''}
          <div class="center-actions">
            <button class="btn btn-sm btn-primary" onclick="selectCenter('${center.name}')">
              <i class="fas fa-check"></i> Seleccionar
            </button>
          </div>
        </div>
      `;
    });
    
    centersList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading centers:', error);
    const centersList = document.getElementById('centers-list');
    if (centersList) {
      centersList.innerHTML = '<p>Error al cargar centros: ' + error.message + '</p>';
    }
  }
}

function selectCenter(centerName) {
  const centerInput = document.getElementById('centro-preferencia');
  if (centerInput) {
    centerInput.value = centerName;
  }
  
  showNotification(`Centro seleccionado: ${centerName}`, 'success');
  closeModal('center-modal');
}

// Función para generar reporte de seguimientos
async function generateFollowupsReport() {
  try {
    showLoading(true);
    
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Paciente,RUT,Último Seguimiento,Tipo,Profesional,Estado\n";
    
    for (const doc of patientsSnapshot.docs) {
      const data = doc.data();
      const lastEntry = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1] 
        : null;
      
      if (lastEntry) {
        // Obtener nombre del profesional
        let professionalName = 'N/A';
        if (lastEntry.profesional) {
          try {
            const profDoc = await db.collection('profesionales').doc(lastEntry.profesional).get();
            if (profDoc.exists) {
              professionalName = profDoc.data().nombre;
            }
          } catch (error) {
            console.error('Error loading professional name:', error);
          }
        }
        
        const row = [
          `"${data.datos_personales?.nombre_completo || 'Sin nombre'}"`,
          `"${data.datos_personales?.rut || 'Sin RUT'}"`,
          `"${formatDate(lastEntry.fecha)}"`,
          `"${lastEntry.tipo || 'N/A'}"`,
          `"${professionalName}"`,
          `"${lastEntry.estado_paciente || 'N/A'}"`
        ].join(',');
        
        csvContent += row + "\n";
      }
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seguimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Reporte de seguimientos generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating followups report:', error);
    showNotification('Error al generar el reporte de seguimientos', 'error');
  } finally {
    showLoading(false);
  }
}

// Función para validar archivos adjuntos
function validateFileUpload(fileInput, maxSize = 5 * 1024 * 1024) { // 5MB por defecto
  const file = fileInput.files[0];
  if (!file) return false;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  
  if (!allowedTypes.includes(file.type)) {
    showNotification('Tipo de archivo no permitido. Solo se permiten imágenes, PDF y archivos de texto.', 'error');
    fileInput.value = '';
    return false;
  }
  
  if (file.size > maxSize) {
    showNotification(`El archivo es demasiado grande. Máximo permitido: ${maxSize / (1024 * 1024)}MB`, 'error');
    fileInput.value = '';
    return false;
  }
  
  return true;
}

// Función para limpiar datos sensibles del localStorage al cerrar
window.addEventListener('beforeunload', function() {
  localStorage.removeItem('senda_draft');
  // Limpiar otros datos sensibles si es necesario
});

// Función para manejar errores de red
function handleNetworkError(error) {
  console.error('Network error:', error);
  
  if (!navigator.onLine) {
    showNotification('Sin conexión a internet. Verifica tu conexión.', 'error', 10000);
  } else {
    showNotification('Error de conexión. Intenta nuevamente.', 'error');
  }
}

// Listener para estado de la conexión
window.addEventListener('online', function() {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', function() {
  showNotification('Sin conexión a internet', 'warning', 10000);
});

// Función para exportar datos del sistema (solo admins)
async function exportSystemData() {
  if (currentUserData?.profesion !== 'admin') {
    showNotification('Solo los administradores pueden exportar datos del sistema', 'error');
    return;
  }
  
  if (!confirm('¿Estás seguro de exportar todos los datos del sistema? Esta operación puede tomar varios minutos.')) {
    return;
  }
  
  try {
    showLoading(true);
    
    // Exportar todas las colecciones principales
    const collections = ['pacientes', 'solicitudes_ingreso', 'profesionales', 'citas'];
    const exportData = {};
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      exportData[collection] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `senda_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Datos exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Error al exportar los datos del sistema', 'error');
  } finally {
    showLoading(false);
  }
}
window.addEventListener('DOMContentLoaded', () => {
  loadCesfamData();
  // ...carga otros datos iniciales
});
