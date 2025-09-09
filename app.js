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

// Global Variables
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;

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
  
  // Factores de riesgo alto
  if (evaluationData.sustancias?.includes('pasta_base')) score += 3;
  if (evaluationData.sustancias?.includes('cocaina')) score += 2;
  if (evaluationData.edad < 18) score += 2;
  if (evaluationData.tiempoConsumo > 60) score += 2;
  if (evaluationData.urgencia === 'critica') score += 4;
  if (evaluationData.urgencia === 'alta') score += 2;
  if (evaluationData.motivacion >= 8) score += 1;
  if (evaluationData.tratamientoPrevio === 'si_senda') score += 1;
  
  // Verificar palabras clave críticas en descripción
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
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
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
      formData = {}; // Reset form data
      currentFormStep = 1;
      showModal('patient-modal');
      updateFormProgress();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => showModal('professional-modal'));
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      showNotification('Redirigiendo al sitio oficial de SENDA...', 'info');
      setTimeout(() => window.open('https://www.senda.gob.cl', '_blank'), 1000);
    });
  }

  if (findCenterBtn) {
    findCenterBtn.addEventListener('click', () => {
      showModal('center-modal');
      loadNearbyClínicas();
    });
  }

  if (reentryBtn) {
    reentryBtn.addEventListener('click', () => {
      formData = { isReentry: true };
      currentFormStep = 1;
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
}

function setupModalControls() {
  // Close modal buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const modalId = e.target.closest('[data-close]').dataset.close;
      closeModal(modalId);
    });
  });

  // Close modals when clicking outside
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        const modalId = modal.id;
        if (modalId === 'patient-modal' && !isDraftSaved) {
          if (confirm('¿Deseas guardar tu progreso antes de salir?')) {
            saveDraft();
          }
        }
        closeModal(modalId);
      }
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

// Multi-Step Form Functions
function setupMultiStepForm() {
  // Motivación slider
  const motivacionSlider = document.getElementById('motivacion');
  const motivacionValue = document.getElementById('motivacion-value');
  
  if (motivacionSlider && motivacionValue) {
    motivacionSlider.addEventListener('input', function() {
      motivacionValue.textContent = this.value;
    });
  }

  // Conditional form steps based on selection
  const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
  tipoSolicitudInputs.forEach(input => {
    input.addEventListener('change', function() {
      formData.tipoSolicitud = this.value;
      updateFormSteps();
    });
  });
}

function updateFormSteps() {
  const step3 = document.querySelector('[data-step="3"]');
  if (step3) {
    if (formData.tipoSolicitud === 'anonimo' || formData.tipoSolicitud === 'informacion') {
      maxFormStep = 3; // Skip contact info for anonymous users
      step3.style.display = 'none';
    } else {
      maxFormStep = 4;
      step3.style.display = 'block';
    }
  }
}

function updateFormProgress() {
  const progressFill = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  const actualMaxStep = formData.tipoSolicitud === 'anonimo' ? 3 : 4;
  const progress = (currentFormStep / actualMaxStep) * 100;
  
  if (progressFill) progressFill.style.width = progress + '%';
  if (progressText) progressText.textContent = `Paso ${currentFormStep} de ${actualMaxStep}`;
  
  // Show/hide navigation buttons
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-form');
  
  if (prevBtn) prevBtn.style.display = currentFormStep > 1 ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = currentFormStep < actualMaxStep ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = currentFormStep === actualMaxStep ? 'block' : 'none';
}

function nextFormStep() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    const actualMaxStep = formData.tipoSolicitud === 'anonimo' ? 3 : 4;
    
    if (currentFormStep < actualMaxStep) {
      // Hide current step
      document.querySelector(`[data-step="${currentFormStep}"]`).classList.remove('active');
      
      // Show next step
      currentFormStep++;
      if (currentFormStep === 3 && formData.tipoSolicitud === 'anonimo') {
        currentFormStep = 4; // Skip contact step for anonymous
      }
      
      document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
      updateFormProgress();
      
      // Auto-save progress
      saveDraft(false);
    }
  }
}

function prevFormStep() {
  if (currentFormStep > 1) {
    // Hide current step
    document.querySelector(`[data-step="${currentFormStep}"]`).classList.remove('active');
    
    // Show previous step
    currentFormStep--;
    if (currentFormStep === 3 && formData.tipoSolicitud === 'anonimo') {
      currentFormStep = 2; // Skip contact step for anonymous
    }
    
    document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
    updateFormProgress();
  }
}

function validateCurrentStep() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  const requiredFields = currentStepElement.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  // Additional validations
  if (currentFormStep === 1) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    const paraMi = document.querySelector('input[name="paraMi"]:checked');
    
    if (!tipoSolicitud || !paraMi) {
      showNotification('Por favor completa todos los campos obligatorios', 'error');
      isValid = false;
    }
  }
  
  if (currentFormStep === 2) {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Por favor selecciona al menos una sustancia', 'error');
      isValid = false;
    }
  }
  
  if (currentFormStep === 3 && formData.tipoSolicitud === 'identificado') {
    const rut = document.getElementById('patient-rut').value;
    const email = document.getElementById('patient-email').value;
    
    if (rut && !validateRUT(rut)) {
      showNotification('El RUT ingresado no es válido', 'error');
      isValid = false;
    }
    
    if (email && !isValidEmail(email)) {
      showNotification('El email ingresado no es válido', 'error');
      isValid = false;
    }
  }
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
}

function collectCurrentStepData() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  
  if (currentFormStep === 1) {
    formData.tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    formData.edad = document.getElementById('patient-age').value;
    formData.region = document.getElementById('patient-region').value;
    formData.paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
  }
  
  if (currentFormStep === 2) {
    const sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked'))
      .map(cb => cb.value);
    formData.sustancias = sustancias;
    formData.tiempoConsumo = document.getElementById('tiempo-consumo').value;
    formData.motivacion = document.getElementById('motivacion').value;
    formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
  }
  
  if (currentFormStep === 3) {
    formData.nombre = document.getElementById('patient-name').value;
    formData.apellido = document.getElementById('patient-lastname').value;
    formData.rut = document.getElementById('patient-rut').value;
    formData.telefono = document.getElementById('patient-phone').value;
    formData.email = document.getElementById('patient-email').value;
    formData.comuna = document.getElementById('patient-comuna').value;
    formData.direccion = document.getElementById('patient-address').value;
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
      
      // Load draft if less than 24 hours old
      if (draftAge < 24 * 60 * 60 * 1000) {
        const loadDraft = confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?');
        if (loadDraft) {
          formData = draftData;
          currentFormStep = draftData.currentStep || 1;
          restoreFormData();
          isDraftSaved = true;
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
  // Restore form fields based on formData
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
  
  updateFormSteps();
  updateFormProgress();
}

// Form Validation Setup
function setupFormValidation() {
  // RUT formatting and validation
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

  // Phone formatting
  const phoneInput = document.getElementById('patient-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }

  // Email validation
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

  // Age validation
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

// Patient Registration Handler
function submitPatientForm() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    handlePatientRegistration();
  }
}

async function handlePatientRegistration(e) {
  if (e) e.preventDefault();
  
  showLoading(true);
  
  try {
    // Calculate priority based on collected data
    const prioridad = calculatePriority(formData);
    
    const solicitudData = {
      // Clasificación
      clasificacion: {
        tipo: formData.isReentry ? 'reingreso' : 'ingreso_voluntario',
        estado: 'pendiente',
        prioridad: prioridad,
        categoria_riesgo: prioridad === 'critica' ? 'extremo' : 
                         prioridad === 'alta' ? 'alto' : 
                         prioridad === 'media' ? 'moderado' : 'bajo'
      },
      
      // Datos personales
      datos_personales: {
        anonimo: formData.tipoSolicitud === 'anonimo',
        edad: parseInt(formData.edad),
        genero: 'no_especificado',
        id_comuna_residencia: formData.comuna || 'no_especificada',
        situacion_laboral: 'no_especificada',
        para_quien: formData.paraMi
      },
      
      // Datos de contacto (si aplica)
      datos_contacto: formData.tipoSolicitud === 'identificado' ? {
        telefono_principal: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        nombre_completo: `${formData.nombre} ${formData.apellido}`,
        rut: formData.rut
      } : {},
      
      // Evaluación inicial
      evaluacion_inicial: {
        sustancias_consumo: formData.sustancias || [],
        tiempo_consumo_meses: parseInt(formData.tiempoConsumo) || 0,
        motivacion_cambio: parseInt(formData.motivacion) || 5,
        urgencia_declarada: formData.urgencia || 'no_especificada',
        tratamiento_previo: formData.tratamientoPrevio || 'no',
        descripcion_situacion: formData.razon || ''
      },
      
      // Derivación
      derivacion: {
        id_centro_preferido: formData.centroPreferencia || null,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp()
      },
      
      // Metadata
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        canal_ingreso: 'web_publica'
      }
    };

    // Save to Firestore
    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    // Create automatic follow-up for critical cases
    if (prioridad === 'critica') {
      await createCriticalCaseAlert(docRef.id, solicitudData);
    }
    
    // Clear draft
    localStorage.removeItem('senda_draft');
    
    // Show success message
    showSuccessMessage(docRef.id, formData.tipoSolicitud === 'anonimo');
    
    // Close modal and reset form
    closeModal('patient-modal');
    resetForm();
    
  } catch (error) {
    console.error('Error submitting patient registration:', error);
    showNotification('Error al enviar la solicitud. Por favor intenta nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}

function showSuccessMessage(solicitudId, isAnonymous) {
  const trackingCode = isAnonymous ? solicitudId.substring(0, 8).toUpperCase() : null;
  
  if (isAnonymous) {
    showNotification(
      `Solicitud enviada exitosamente. Tu código de seguimiento es: ${trackingCode}. Guárdalo para consultar el estado de tu solicitud.`,
      'success',
      8000
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
      mensaje: `Nuevo caso crítico: ${solicitudData.datos_personales.edad} años, urgencia ${solicitudData.evaluacion_inicial.urgencia_declarada}`,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      notificado: false
    });
  } catch (error) {
    console.error('Error creating critical alert:', error);
  }
}

function resetForm() {
  formData = {};
  currentFormStep = 1;
  isDraftSaved = false;
  
  // Reset form elements
  const form = document.getElementById('patient-form');
  if (form) {
    form.reset();
    
    // Reset step visibility
    document.querySelectorAll('.form-step').forEach((step, index) => {
      step.classList.toggle('active', index === 0);
    });
    
    updateFormProgress();
  }
}

// Professional Authentication
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
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    if (doc.exists) {
      const userData = doc.data();
      currentUserData = { uid: user.uid, ...userData };
      
      // Update last activity
      await db.collection('profesionales').doc(user.uid).update({
        ultima_actividad: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      showNotification(`Bienvenido, ${userData.nombre}`, 'success');
      closeModal('professional-modal');
      showProfessionalPanel(userData);
    } else {
      showNotification('No se encontraron datos de usuario profesional', 'error');
    }
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
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

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

  // Validation
  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Por favor completa todos los campos', 'error');
    showLoading(false);
    return;
  }

  if (!isValidEmail(formData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    showLoading(false);
    return;
  }

  if (formData.password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
    showLoading(false);
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    await db.collection('profesionales').doc(user.uid).set({
      nombre: formData.name,
      correo: formData.email,
      profesion: formData.profession,
      licencia: formData.license,
      id_centro_asignado: formData.center,
      configuracion_sistema: {
        rol: formData.profession,
        permisos: getDefaultPermissions(formData.profession),
        activo: true
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        ultima_actividad: firebase.firestore.FieldValue.serverTimestamp()
      }
    });

    showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
    // Switch to login tab
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    document.getElementById('register-form').reset();
    document.getElementById('login-email').value = formData.email;
    
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Error al registrar';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El correo ya está registrado';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

function getDefaultPermissions(profession) {
  const permissions = {
    'asistente_social': ['ver_casos', 'asignar_casos', 'derivar_casos', 'seguimiento'],
    'medico': ['ver_casos', 'atencion_medica', 'seguimiento', 'prescripcion'],
    'psicologo': ['ver_casos', 'atencion_psicologica', 'seguimiento'],
    'terapeuta': ['ver_casos', 'terapia_ocupacional', 'seguimiento'],
    'coordinador': ['ver_casos', 'asignar_casos', 'reportes', 'supervision'],
    'admin': ['ver_casos', 'asignar_casos', 'reportes', 'usuarios', 'configuracion']
  };
  
  return permissions[profession] || ['ver_casos'];
}

// Professional Panel Functions
function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  // Update user info
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Show/hide navigation based on role
  setupRoleBasedNavigation(userData);
  
  // Setup navigation
  setupPanelNavigation(userData);
  
  // Load initial panel
  showPanel('dashboard', userData);
  
  // Setup logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Start real-time listeners
  startRealTimeListeners(userData);
}

function setupRoleBasedNavigation(userData) {
  const role = userData.profesion;
  
  // Show/hide navigation items based on role
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
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function showPanel(panelId, userData) {
  // Hide all panels
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  // Show selected panel
  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    // Load panel-specific content
    switch (panelId) {
      case 'dashboard':
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequests(userData);
        break;
      case 'patients':
        setupPatientSearch(userData);
        break;
      case 'calendar':
        loadCalendar(userData);
        break;
      case 'followups':
        loadFollowups(userData);
        break;
      case 'reports':
        loadReports(userData);
        break;
      case 'centers':
        loadCenters(userData);
        break;
      case 'users':
        loadUsers(userData);
        break;
      case 'analytics':
        loadAnalytics(userData);
        break;
    }
  }
}

// Dashboard Functions
async function loadDashboard(userData) {
  try {
    showLoading(true);
    
    const stats = await loadDashboardStats(userData);
    updateDashboardMetrics(stats);
    
    await loadRecentActivity();
    await loadDashboardCharts(stats);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  } finally {
    showLoading(false);
  }
}

async function loadDashboardStats(userData) {
  const stats = {
    totalPatients: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    criticalCases: 0,
    priorityBreakdown: { critica: 0, alta: 0, media: 0, baja: 0 },
    monthlyTrend: []
  };

  try {
    // Get base query based on user role
    let baseQuery = db.collection('solicitudes_ingreso');
    
    if (userData.profesion === 'profesional_senda') {
      // Filter by assigned center
      baseQuery = baseQuery.where('derivacion.id_centro_preferido', '==', userData.id_centro_asignado);
    }

    // Total patients
    const patientsSnapshot = await baseQuery.get();
    stats.totalPatients = patientsSnapshot.size;

    // Pending requests
    const pendingSnapshot = await baseQuery
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    stats.pendingRequests = pendingSnapshot.size;

    // Critical cases
    const criticalSnapshot = await baseQuery
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', 'in', ['pendiente', 'en_proceso'])
      .get();
    stats.criticalCases = criticalSnapshot.size;

    // Priority breakdown
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const priority = data.clasificacion?.prioridad || 'baja';
      stats.priorityBreakdown[priority]++;
    });

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendSnapshot = await baseQuery
      .where('metadata.fecha_creacion', '>=', sixMonthsAgo)
      .get();
    
    // Group by month
    const monthlyData = {};
    trendSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.metadata?.fecha_creacion) {
        const date = data.metadata.fecha_creacion.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });
    
    stats.monthlyTrend = Object.entries(monthlyData)
      .sort()
      .map(([month, count]) => ({ month, count }));

    // Today's appointments (mock data - would integrate with calendar system)
    stats.todayAppointments = Math.floor(Math.random() * 12) + 3;

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }

  return stats;
}

function updateDashboardMetrics(stats) {
  document.getElementById('total-patients').textContent = stats.totalPatients;
  document.getElementById('today-appointments').textContent = stats.todayAppointments;
  document.getElementById('pending-requests').textContent = stats.pendingRequests;
  document.getElementById('critical-cases').textContent = stats.criticalCases;
  
  // Update requests badge
  const badge = document.getElementById('requests-badge');
  if (badge) {
    badge.textContent = stats.pendingRequests;
    badge.style.display = stats.pendingRequests > 0 ? 'block' : 'none';
  }
  
  // Mock next appointment time
  const nextAppointment = document.getElementById('next-appointment');
  if (nextAppointment) {
    const times = ['09:00', '10:30', '14:00', '15:30', '16:45'];
    nextAppointment.textContent = times[Math.floor(Math.random() * times.length)];
  }
  
  // Mock last alert
  const lastAlert = document.getElementById('last-alert');
  if (lastAlert && stats.criticalCases > 0) {
    lastAlert.textContent = 'Hace 23 min';
  }
}

async function loadRecentActivity() {
  const activityContainer = document.getElementById('activity-list');
  if (!activityContainer) return;

  try {
    const recentSolicitudes = await db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(5)
      .get();

    let html = '';
    recentSolicitudes.forEach(doc => {
      const data = doc.data();
      const prioridad = data.clasificacion?.prioridad || 'baja';
      const color = prioridad === 'critica' ? 'var(--danger-red)' : 
                   prioridad === 'alta' ? 'var(--warning-orange)' : 
                   prioridad === 'media' ? 'var(--secondary-blue)' : 'var(--success-green)';
      
      const edad = data.datos_personales?.edad || 'N/A';
      const tipo = data.clasificacion?.tipo || 'ingreso';
      
      html += `
        <div class="activity-item" style="border-left: 3px solid ${color};">
          <div class="activity-header">
            <strong>${tipo === 'reingreso' ? 'Reingreso' : 'Nueva solicitud'}</strong>
            <span class="activity-time">${formatDate(data.metadata?.fecha_creacion)}</span>
          </div>
          <div class="activity-details">
            Edad: ${edad} años • Prioridad: ${prioridad}
          </div>
        </div>
      `;
    });

    activityContainer.innerHTML = html || '<p>No hay actividad reciente.</p>';
  } catch (error) {
    console.error('Error loading recent activity:', error);
    activityContainer.innerHTML = '<p>Error al cargar actividad reciente.</p>';
  }
}

async function loadDashboardCharts(stats) {
  // Priority Chart
  const priorityCtx = document.getElementById('priority-chart');
  if (priorityCtx) {
    new Chart(priorityCtx, {
      type: 'doughnut',
      data: {
        labels: ['Crítica', 'Alta', 'Media', 'Baja'],
        datasets: [{
          data: [
            stats.priorityBreakdown.critica,
            stats.priorityBreakdown.alta,
            stats.priorityBreakdown.media,
            stats.priorityBreakdown.baja
          ],
          backgroundColor: [
            'var(--danger-red)',
            'var(--warning-orange)',
            'var(--secondary-blue)',
            'var(--success-green)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // Trend Chart
  const trendCtx = document.getElementById('trend-chart');
  if (trendCtx && stats.monthlyTrend.length > 0) {
    new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: stats.monthlyTrend.map(item => item.month),
        datasets: [{
          label: 'Casos por mes',
          data: stats.monthlyTrend.map(item => item.count),
          borderColor: 'var(--primary-blue)',
          backgroundColor: 'rgba(15, 76, 117, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}

// Requests Management
async function loadRequests(userData) {
  const requestsList = document.getElementById('requests-list');
  if (!requestsList) return;
  
  requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';

  try {
    let query = db.collection('solicitudes_ingreso');
    
    // Apply role-based filtering
    if (userData.profesion !== 'coordinador' && userData.profesion !== 'admin') {
      query = query.where('derivacion.id_centro_preferido', '==', userData.id_centro_asignado);
    }
    
    // Apply status filter
    query = query.where('clasificacion.estado', 'in', ['pendiente', 'en_proceso']);
    
    const snapshot = await query
      .orderBy('clasificacion.prioridad', 'desc')
      .orderBy('metadata.fecha_creacion', 'desc')
      .get();

    if (snapshot.empty) {
      requestsList.innerHTML = '<div class="empty-state"><p>No hay solicitudes pendientes.</p></div>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += createRequestCard(doc.id, data, userData);
    });

    requestsList.innerHTML = html;
    
    // Setup filter listeners
    setupRequestFilters(userData);

    // Add event listeners for action buttons
    setupRequestActions(userData);

  } catch (error) {
    console.error('Error loading requests:', error);
    requestsList.innerHTML = '<div class="error-state"><p>Error al cargar solicitudes: ' + error.message + '</p></div>';
  }
}

function createRequestCard(id, data, userData) {
  const prioridad = data.clasificacion?.prioridad || 'baja';
  const estado = data.clasificacion?.estado || 'pendiente';
  const edad = data.datos_personales?.edad || 'N/A';
  const sustancias = data.evaluacion_inicial?.sustancias_consumo || [];
  const esAnonimo = data.datos_personales?.anonimo || false;
  const fechaCreacion = formatDate(data.metadata?.fecha_creacion);
  
  const canTakeAction = userData.profesion === 'asistente_social' || 
                       userData.profesion === 'coordinador' || 
                       userData.profesion === 'admin';
  
  const priorityClass = {
    'critica': 'priority-critical',
    'alta': 'priority-high', 
    'media': 'priority-medium',
    'baja': 'priority-low'
  }[prioridad] || 'priority-low';
  
  return `
    <div class="request-card ${priorityClass}" data-request-id="${id}">
      <div class="request-header">
        <div class="request-info">
          <h4>Solicitud ${esAnonimo ? 'Anónima' : 'Identificada'}</h4>
          <span class="request-id">ID: ${id.substring(0, 8)}</span>
        </div>
        <div class="request-badges">
          <span class="priority-badge priority-${prioridad}">${prioridad.toUpperCase()}</span>
          <span class="status-badge status-${estado}">${estado.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>
      
      <div class="request-details">
        <div class="detail-row">
          <span><strong>Edad:</strong> ${edad} años</span>
          <span><strong>Fecha:</strong> ${fechaCreacion}</span>
        </div>
        
        ${sustancias.length > 0 ? `
          <div class="detail-row">
            <span><strong>Sustancias:</strong> ${sustancias.join(', ')}</span>
          </div>
        ` : ''}
        
        ${data.evaluacion_inicial?.descripcion_situacion ? `
          <div class="description">
            <strong>Descripción:</strong> ${data.evaluacion_inicial.descripcion_situacion.substring(0, 150)}${data.evaluacion_inicial.descripcion_situacion.length > 150 ? '...' : ''}
          </div>
        ` : ''}
        
        ${!esAnonimo && data.datos_contacto ? `
          <div class="contact-info">
            <strong>Contacto:</strong> 
            ${data.datos_contacto.telefono_principal || ''} 
            ${data.datos_contacto.email || ''}
          </div>
        ` : ''}
      </div>
      
      <div class="request-actions">
        <button class="btn btn-outline btn-sm view-details" data-id="${id}">
          <i class="fas fa-eye"></i> Ver Detalles
        </button>
        
        ${canTakeAction && estado === 'pendiente' ? `
          <button class="btn btn-primary btn-sm assign-case" data-id="${id}">
            <i class="fas fa-user-plus"></i> Asignar
          </button>
        ` : ''}
        
        ${userData.profesion === 'medico' && estado === 'en_proceso' ? `
          <button class="btn btn-success btn-sm start-attention" data-id="${id}">
            <i class="fas fa-stethoscope"></i> Atender
          </button>
        ` : ''}
        
        ${prioridad === 'critica' ? `
          <button class="btn btn-danger btn-sm urgent-contact" data-id="${id}">
            <i class="fas fa-phone"></i> Contacto Urgente
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function setupRequestFilters(userData) {
  const priorityFilter = document.getElementById('filter-priority');
  const statusFilter = document.getElementById('filter-status');
  const dateFilter = document.getElementById('filter-date');
  const clearFilters = document.getElementById('clear-filters');
  
  const applyFilters = debounce(() => {
    loadRequestsWithFilters(userData);
  }, 500);
  
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);
  
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      if (priorityFilter) priorityFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (dateFilter) dateFilter.value = '';
      loadRequests(userData);
    });
  }
}

async function loadRequestsWithFilters(userData) {
  const priorityFilter = document.getElementById('filter-priority')?.value;
  const statusFilter = document.getElementById('filter-status')?.value;
  const dateFilter = document.getElementById('filter-date')?.value;
  
  let query = db.collection('solicitudes_ingreso');
  
  // Role-based filtering
  if (userData.profesion !== 'coordinador' && userData.profesion !== 'admin') {
    query = query.where('derivacion.id_centro_preferido', '==', userData.id_centro_asignado);
  }
  
  // Apply filters
  if (priorityFilter) {
    query = query.where('clasificacion.prioridad', '==', priorityFilter);
  }
  
  if (statusFilter) {
    query = query.where('clasificacion.estado', '==', statusFilter);
  }
  
  if (dateFilter) {
    const selectedDate = new Date(dateFilter);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    query = query
      .where('metadata.fecha_creacion', '>=', selectedDate)
      .where('metadata.fecha_creacion', '<', nextDay);
  }
  
  try {
    const snapshot = await query
      .orderBy('clasificacion.prioridad', 'desc')
      .orderBy('metadata.fecha_creacion', 'desc')
      .get();
    
    const requestsList = document.getElementById('requests-list');
    if (snapshot.empty) {
      requestsList.innerHTML = '<div class="empty-state"><p>No se encontraron solicitudes con los filtros aplicados.</p></div>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += createRequestCard(doc.id, data, userData);
    });
    
    requestsList.innerHTML = html;
    setupRequestActions(userData);
    
  } catch (error) {
    console.error('Error filtering requests:', error);
    showNotification('Error al aplicar filtros', 'error');
  }
}

function setupRequestActions(userData) {
  // View details
  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const requestId = e.target.dataset.id;
      showRequestDetails(requestId);
    });
  });
  
  // Assign case
  document.querySelectorAll('.assign-case').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const requestId = e.target.dataset.id;
      assignCase(requestId, userData);
    });
  });
  
  // Start attention
  document.querySelectorAll('.start-attention').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const requestId = e.target.dataset.id;
      startMedicalAttention(requestId, userData);
    });
  });
  
  // Urgent contact
  document.querySelectorAll('.urgent-contact').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const requestId = e.target.dataset.id;
      initiateUrgentContact(requestId, userData);
    });
  });
}

async function showRequestDetails(requestId) {
  try {
    const doc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    if (!doc.exists) {
      showNotification('No se encontró la solicitud', 'error');
      return;
    }
    
    const data = doc.data();
    
    // Create modal with request details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal large-modal">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle de Solicitud</h2>
        
        <div class="request-detail-content">
          <div class="detail-section">
            <h3>Información General</h3>
            <div class="detail-grid">
              <div><strong>ID:</strong> ${requestId}</div>
              <div><strong>Tipo:</strong> ${data.clasificacion?.tipo || 'N/A'}</div>
              <div><strong>Estado:</strong> ${data.clasificacion?.estado || 'N/A'}</div>
              <div><strong>Prioridad:</strong> ${data.clasificacion?.prioridad || 'N/A'}</div>
              <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion)}</div>
              <div><strong>Anónimo:</strong> ${data.datos_personales?.anonimo ? 'Sí' : 'No'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos Personales</h3>
            <div class="detail-grid">
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Para quién:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>
            </div>
          </div>
          
          ${!data.datos_personales?.anonimo && data.datos_contacto ? `
            <div class="detail-section">
              <h3>Datos de Contacto</h3>
              <div class="detail-grid">
                <div><strong>Nombre:</strong> ${data.datos_contacto.nombre_completo || 'N/A'}</div>
                <div><strong>RUT:</strong> ${data.datos_contacto.rut || 'N/A'}</div>
                <div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal || 'N/A'}</div>
                <div><strong>Email:</strong> ${data.datos_contacto.email || 'N/A'}</div>
                <div><strong>Dirección:</strong> ${data.datos_contacto.direccion || 'N/A'}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="detail-section">
            <h3>Evaluación Inicial</h3>
            <div class="detail-grid">
              <div><strong>Sustancias:</strong> ${data.evaluacion_inicial?.sustancias_consumo?.join(', ') || 'N/A'}</div>
              <div><strong>Tiempo de consumo:</strong> ${data.evaluacion_inicial?.tiempo_consumo_meses || 'N/A'} meses</div>
              <div><strong>Motivación:</strong> ${data.evaluacion_inicial?.motivacion_cambio || 'N/A'}/10</div>
              <div><strong>Urgencia:</strong> ${data.evaluacion_inicial?.urgencia_declarada || 'N/A'}</div>
              <div><strong>Tratamiento previo:</strong> ${data.evaluacion_inicial?.tratamiento_previo || 'N/A'}</div>
            </div>
            
            ${data.evaluacion_inicial?.descripcion_situacion ? `
              <div class="description-full">
                <strong>Descripción de la situación:</strong>
                <p>${data.evaluacion_inicial.descripcion_situacion}</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (error) {
    console.error('Error loading request details:', error);
    showNotification('Error al cargar los detalles', 'error');
  }
}

async function assignCase(requestId, userData) {
  try {
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'en_proceso',
      'derivacion.id_profesional_asignado': userData.uid,
      'derivacion.fecha_asignacion': firebase.firestore.FieldValue.serverTimestamp(),
      'derivacion.asignado_por': userData.nombre
    });
    
    // Create follow-up record
    await db.collection('seguimientos').add({
      referencias: {
        id_solicitud: requestId,
        id_profesional: userData.uid
      },
      accion_realizada: {
        tipo: 'asignacion_caso',
        fecha_accion: firebase.firestore.FieldValue.serverTimestamp(),
        descripcion: `Caso asignado a ${userData.nombre}`
      },
      cambio_estado: {
        estado_anterior: 'pendiente',
        estado_nuevo: 'en_proceso',
        justificacion: 'Asignación inicial del caso'
      }
    });
    
    showNotification('Caso asignado exitosamente', 'success');
    loadRequests(userData); // Reload requests
    
  } catch (error) {
    console.error('Error assigning case:', error);
    showNotification('Error al asignar el caso', 'error');
  }
}

// Real-time listeners
function startRealTimeListeners(userData) {
  // Listen for new requests
  let query = db.collection('solicitudes_ingreso')
    .where('clasificacion.estado', '==', 'pendiente');
  
  if (userData.profesion !== 'coordinador' && userData.profesion !== 'admin') {
    query = query.where('derivacion.id_centro_preferido', '==', userData.id_centro_asignado);
  }
  
  query.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.clasificacion?.prioridad === 'critica') {
          showNotification(
            `🚨 NUEVO CASO CRÍTICO: Paciente ${data.datos_personales?.edad} años`,
            'error',
            10000
          );
        }
      }
    });
    
    // Update badge count
    updateRequestsBadge(snapshot.size);
  });
}

function updateRequestsBadge(count) {
  const badge = document.getElementById('requests-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }
}

// Logout function
async function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    try {
      await auth.signOut();
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada correctamente', 'success');
      
      // Clear forms
      document.getElementById('login-form')?.reset();
      document.getElementById('register-form')?.reset();
      
      // Reset to login tab
      document.querySelector('[data-tab="login"]')?.click();
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
  }
}

// Center finder functions
async function loadNearbyClínicas() {
  const centersList = document.getElementById('centers-list');
  if (!centersList) return;
  
  centersList.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando centros cercanos...</div>';
  
  // Mock data for demonstration
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
        <div class="center-card">
          <div class="center-header">
            <h4>${center.name}</h4>
            <span class="distance">${center.distance}</span>
          </div>
          <div class="center-details">
            <p><i class="fas fa-map-marker-alt"></i> ${center.address}</p>
            <p><i class="fas fa-phone"></i> ${center.phone}</p>
            <p><i class="fas fa-clock"></i> ${center.hours}</p>
          </div>
          <div class="center-actions">
            <button class="btn btn-outline btn-sm">
              <i class="fas fa-directions"></i> Cómo llegar
            </button>
            <button class="btn btn-primary btn-sm">
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
        document.getElementById('location-input').value = `${latitude}, ${longitude}`;
        showNotification('Ubicación detectada', 'success');
        loadNearbyClínicas();
      },
      error => {
        console.error('Geolocation error:', error);
        showNotification('No se pudo obtener tu ubicación. Por favor ingresa tu dirección manualmente.', 'error');
      }
    );
  } else {
    showNotification('Tu navegador no soporta geolocalización', 'error');
  }
}

// Additional panel functions (stubs for now)
async function setupPatientSearch(userData) {
  console.log('Setting up patient search for:', userData.nombre);
  // Implementation would go here
}

async function loadCalendar(userData) {
  console.log('Loading calendar for:', userData.nombre);
  // Implementation would go here
}

async function loadFollowups(userData) {
  console.log('Loading followups for:', userData.nombre);
  // Implementation would go here
}

async function loadReports(userData) {
  console.log('Loading reports for:', userData.nombre);
  // Implementation would go here
}

async function loadCenters(userData) {
  console.log('Loading centers for:', userData.nombre);
  // Implementation would go here
}

async function loadUsers(userData) {
  console.log('Loading users for:', userData.nombre);
  // Implementation would go here
}

async function loadAnalytics(userData) {
  console.log('Loading analytics for:', userData.nombre);
  // Implementation would go here
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

// Export functions for debugging
window.sendaApp = {
  showNotification,
  showModal,
  closeModal,
  formatRUT,
  validateRUT,
  getProfessionName,
  formData,
  currentUserData
};

console.log('SENDA Platform JavaScript loaded successfully');
