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
         'cesfam-stats-modal'].includes(modalId)) {
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

    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    loadDraftIfExists();
    loadCesfamData(); // Cambiado de loadRegionsData
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

// FUNCIÓN CORREGIDA - Cargar CESFAM en lugar de regiones
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

// ================= VALIDACIÓN Y MANEJO DE FORMULARIOS =================

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
    formData.cesfam = document.getElementById('patient-cesfam')?.value; // Cambiado de región
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
        cesfam: formData.cesfam || 'sin_especificar', // Cambiado de región
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

// ================= AUTENTICACIÓN DE PROFESIONALES =================

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
  
  window.sendaUnsubscribers = [unsubscribeCritical, unsubscribeRequests];
}

// ================= PANEL DE GESTIÓN Y DASHBOARD =================

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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const pendingRequests = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    const criticalCases = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    const activePatients = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
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

// ================= FUNCIONES SIMPLIFICADAS PARA SOLICITUDES =================

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
    
    let query = db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(100);
    
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
            <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
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

// Funciones básicas para manejar solicitudes
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
              <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
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
    
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
      'clasificacion.fecha_aceptacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': currentUserData.uid
    });
    
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
      cesfam: solicitudData.datos_personales?.cesfam || '',
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

// ================= FUNCIONES BÁSICAS PARA PACIENTES =================

async function loadPatientsPanel(userData) {
  const patientsList = document.getElementById('patients-list');
  if (!patientsList) return;
  
  patientsList.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Gestión de Pacientes</h1>
      <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando pacientes...</div>
  `;
  
  try {
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      patientsList.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Gestión de Pacientes</h1>
          <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en el sistema.
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Pacientes</h1>
        <p class="panel-subtitle">Lista de pacientes activos en el sistema</p>
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
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
            <button class="btn btn-success btn-sm" onclick="addFollowupNote('${doc.id}')">
              <i class="fas fa-notes-medical"></i> Agregar Nota
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
      </div>
      <p>Error al cargar pacientes: ${error.message}</p>
    `;
  }
}

// Funciones básicas para pacientes
async function viewPatientDetail(patientId) {
  showNotification('Función de detalle de paciente en desarrollo', 'info');
}

async function addFollowupNote(patientId) {
  showNotification('Función de seguimiento en desarrollo', 'info');
}

// ================= FUNCIONES BÁSICAS PARA OTROS PANELES =================

async function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (!calendarPanel) return;
  
  calendarPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Agenda</h1>
      <p class="panel-subtitle">Gestión de citas y calendario</p>
    </div>
    <div class="card">
      <p style="text-align: center; color: var(--gray-600);">
        <i class="fas fa-calendar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
        Funcionalidad de agenda en desarrollo
      </p>
    </div>
  `;
}

async function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (!followupsPanel) return;
  
  followupsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos</h1>
      <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
    </div>
    <div class="card">
      <p style="text-align: center; color: var(--gray-600);">
        <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
        Funcionalidad de seguimientos en desarrollo
      </p>
    </div>
  `;
}

async function loadReportsPanel(userData) {
  const reportsPanel = document.getElementById('reports-panel');
  if (!reportsPanel) return;
  
  if (!userData.configuracion_sistema?.permisos?.includes('reportes') && 
      userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    reportsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes</h1>
        <p class="panel-subtitle">Generación de reportes y estadísticas</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
          No tienes permisos para acceder a los reportes.
        </p>
      </div>
    `;
    return;
  }
  
  try {
    const stats = await loadSystemStatistics();
    
    reportsPanel.innerHTML = `
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
            <h3>Estadísticas por CESFAM</h3>
            <p>Distribución de casos por CESFAM de Puente Alto</p>
            <button class="btn btn-primary" onclick="generateCesfamReport()">
              <i class="fas fa-chart-bar"></i> Ver Estadísticas
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Pacientes</h3>
            <p>Lista completa de pacientes activos</p>
            <button class="btn btn-primary" onclick="generatePatientsReport()">
              <i class="fas fa-file-excel"></i> Generar Excel
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Solicitudes</h3>
            <p>Historial de solicitudes de ingreso</p>
            <button class="btn btn-primary" onclick="generateRequestsReport()">
              <i class="fas fa-file-pdf"></i> Generar PDF
            </button>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading reports panel:', error);
    reportsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes</h1>
        <p class="panel-subtitle">Error al cargar estadísticas</p>
      </div>
      <p>Error: ${error.message}</p>
    `;
  }
}

async function loadSystemStatistics() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const [
      totalPatientsSnapshot,
      pendingRequestsSnapshot,
      criticalCasesSnapshot,
      appointmentsTodaySnapshot
    ] = await Promise.all([
      db.collection('pacientes').where('estado_actual.activo', '==', true).get(),
      db.collection('solicitudes_ingreso').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('solicitudes_ingreso').where('clasificacion.prioridad', '==', 'critica').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('citas').where('fecha', '>=', startOfDay).where('fecha', '<=', endOfDay).get()
    ]);
    
    return {
      totalPatients: totalPatientsSnapshot.size,
      pendingRequests: pendingRequestsSnapshot.size,
      criticalCases: criticalCasesSnapshot.size,
      appointmentsToday: appointmentsTodaySnapshot.size
    };
  } catch (error) {
    console.error('Error loading statistics:', error);
    return {
      totalPatients: 0,
      pendingRequests: 0,
      criticalCases: 0,
      appointmentsToday: 0
    };
  }
}

// ================= FUNCIONES DE REPORTES SIMPLIFICADAS =================

async function generateCesfamReport() {
  try {
    showLoading(true);

    const requestsSnapshot = await db.collection('solicitudes_ingreso').get();
    const patientsSnapshot = await db.collection('pacientes').get();

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
        <h2>Estadísticas por CESFAM - Puente Alto</h2>
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
    csvContent += "Nombre,RUT,Edad,CESFAM,Teléfono,Email,Programa,Fecha Ingreso\n";
    
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const row = [
        `"${data.datos_personales?.nombre_completo || 'Sin nombre'}"`,
        `"${data.datos_personales?.rut || 'Sin RUT'}"`,
        data.datos_personales?.edad || 0,
        `"${data.datos_personales?.cesfam || 'N/A'}"`,
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
    link.setAttribute("download", `pacientes_puente_alto_${new Date().toISOString().split('T')[0]}.csv`);
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
  showNotification('Función de reporte de solicitudes en desarrollo', 'info');
}

// ================= FUNCIONES AUXILIARES =================

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
        
        showNotification(`Ubicación obtenida: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
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

async function loadNearbyClinics(lat = null, lng = null) {
  try {
    const centersList = document.getElementById('centers-list');
    if (!centersList) return;
    
    let html = '<h3>CESFAM de Puente Alto</h3>';
    cesfamPuenteAlto.forEach(cesfam => {
      html += `
        <div class="center-card">
          <h3>${cesfam}</h3>
          <p><i class="fas fa-map-marker-alt"></i> Puente Alto, Región Metropolitana</p>
          <p><i class="fas fa-hospital"></i> Centro de Salud Familiar</p>
          <div class="center-actions">
            <button class="btn btn-sm btn-primary" onclick="selectCenter('${cesfam}')">
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

// ================= LIMPIEZA Y LISTENERS FINALES =================

window.addEventListener('beforeunload', function() {
  localStorage.removeItem('senda_draft');
});

window.addEventListener('online', function() {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', function() {
  showNotification('Sin conexión a internet', 'warning', 10000);
});

// Cargar CESFAM al inicializar
window.addEventListener('DOMContentLoaded', () => {
  loadCesfamData();
});
