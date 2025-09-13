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
];

// Variables globales
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
let currentDateFilter = '';

// ================= FUNCIONES UTILITARIAS =================

function showNotification(message, type = 'info', duration = 4000) {
  const container = document.getElementById('notifications') || createNotificationsContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function createNotificationsContainer() {
  const container = document.createElement('div');
  container.id = 'notifications';
  container.className = 'notifications-container';
  document.body.appendChild(container);
  return container;
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
  }
}

function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    if (show) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
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
    setupCalendar();
    setupFilters();
    
    // Monitor auth state
    auth.onAuthStateChanged(onAuthStateChanged);
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

function initializeEventListeners() {
  // Header buttons
  const findCenterBtn = document.getElementById('find-center');
  const loginProfessionalBtn = document.getElementById('login-professional');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Main action buttons
  const registerPatientBtn = document.getElementById('register-patient');
  const reentryProgramBtn = document.getElementById('reentry-program');
  const aboutProgramBtn = document.getElementById('about-program');
  
  // Search and filters
  const searchSolicitudes = document.getElementById('search-solicitudes');
  const searchSeguimiento = document.getElementById('search-seguimiento');
  const searchPacientesRut = document.getElementById('search-pacientes-rut');
  const buscarPacienteBtn = document.getElementById('buscar-paciente-btn');
  const priorityFilter = document.getElementById('priority-filter');
  const dateFilter = document.getElementById('date-filter');
  
  // Calendar navigation
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

  if (findCenterBtn) {
    findCenterBtn.addEventListener('click', () => {
      window.open('https://www.senda.gob.cl/encuentra-tu-centro/', '_blank');
    });
  }

  if (loginProfessionalBtn) {
    loginProfessionalBtn.addEventListener('click', () => showModal('login-modal'));
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  if (registerPatientBtn) {
    registerPatientBtn.addEventListener('click', () => showModal('patient-modal'));
  }

  if (reentryProgramBtn) {
    reentryProgramBtn.addEventListener('click', () => showModal('reentry-modal'));
  }

  if (aboutProgramBtn) {
    aboutProgramBtn.addEventListener('click', showAboutProgram);
  }

  // Search functionality
  if (searchSolicitudes) {
    searchSolicitudes.addEventListener('input', debounce(filterSolicitudes, 300));
  }

  if (searchSeguimiento) {
    searchSeguimiento.addEventListener('input', debounce(filterSeguimiento, 300));
  }

  if (buscarPacienteBtn) {
    buscarPacienteBtn.addEventListener('click', buscarPacientePorRUT);
  }

  if (searchPacientesRut) {
    searchPacientesRut.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        buscarPacientePorRUT();
      }
    });
  }

  // Filters
  if (priorityFilter) {
    priorityFilter.addEventListener('change', filterSolicitudes);
  }

  if (dateFilter) {
    dateFilter.addEventListener('change', filterSolicitudes);
  }

  // Calendar navigation
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
    nuevaCitaBtn.addEventListener('click', () => showModal('nueva-cita-modal'));
  }
}

function onAuthStateChanged(user) {
  if (user) {
    currentUser = user;
    loadUserData();
  } else {
    currentUser = null;
    currentUserData = null;
    showPublicContent();
  }
}

async function loadUserData() {
  try {
    showLoading(true);
    const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();
    
    if (userDoc.exists) {
      currentUserData = userDoc.data();
      showProfessionalContent();
      loadSolicitudes();
      loadPacientes();
    } else {
      showNotification('No se encontraron datos del profesional', 'error');
      logout();
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showNotification('Error al cargar datos del usuario', 'error');
    logout();
  } finally {
    showLoading(false);
  }
}

function showPublicContent() {
  document.getElementById('public-content').style.display = 'block';
  document.getElementById('professional-content').style.display = 'none';
  document.getElementById('professional-header').style.display = 'none';
  
  // Update header buttons
  const loginBtn = document.getElementById('login-professional');
  if (loginBtn) {
    loginBtn.style.display = 'flex';
  }
}

function showProfessionalContent() {
  document.getElementById('public-content').style.display = 'none';
  document.getElementById('professional-content').style.display = 'block';
  document.getElementById('professional-header').style.display = 'block';
  
  // Update header buttons
  const loginBtn = document.getElementById('login-professional');
  if (loginBtn) {
    loginBtn.style.display = 'none';
  }
  
  // Update professional info
  if (currentUserData) {
    document.getElementById('professional-name').textContent = 
      `${currentUserData.nombre} ${currentUserData.apellidos}`;
    document.getElementById('professional-profession').textContent = 
      getProfessionName(currentUserData.profession);
    document.getElementById('professional-cesfam').textContent = 
      currentUserData.cesfam;
  }
}
// ================= AUTENTICACIÓN =================

function setupModalControls() {
  // Modal tabs
  const modalTabs = document.querySelectorAll('.modal-tab');
  modalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      const modal = tab.closest('.modal');
      
      // Update active tab
      modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active form
      modal.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
      modal.querySelector(`#${targetTab}-form`).classList.add('active');
    });
  });

  // Modal close buttons
  const closeButtons = document.querySelectorAll('.modal-close');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close || btn.closest('.modal-overlay').id;
      closeModal(modalId);
    });
  });

  // Close modal when clicking overlay
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Auth forms
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  if (!email || !password) {
    showNotification('Por favor completa todos los campos', 'warning');
    return;
  }

  try {
    toggleSubmitButton(submitBtn, true);
    
    await auth.signInWithEmailAndPassword(email, password);
    closeModal('login-modal');
    showNotification('Sesión iniciada correctamente', 'success');
    
  } catch (error) {
    console.error('Login error:', error);
    let message = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
    }
    
    showNotification(message, 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const formData = {
    nombre: document.getElementById('register-name').value.trim(),
    apellidos: document.getElementById('register-lastname').value.trim(),
    rut: document.getElementById('register-rut').value.trim(),
    profession: document.getElementById('register-profession').value,
    cesfam: document.getElementById('register-cesfam').value,
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Validations
  if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
    showNotification('Por favor completa todos los campos obligatorios', 'warning');
    return;
  }

  if (!validateRUT(formData.rut)) {
    showNotification('RUT inválido', 'warning');
    return;
  }

  if (!formData.email.endsWith('@senda.cl')) {
    showNotification('Debe usar un correo institucional (@senda.cl)', 'warning');
    return;
  }

  if (formData.password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
    return;
  }

  try {
    toggleSubmitButton(submitBtn, true);
    
    // Create user account
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    // Save professional data
    await db.collection('profesionales').doc(user.uid).set({
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      rut: formatRUT(formData.rut),
      profession: formData.profession,
      cesfam: formData.cesfam,
      email: formData.email,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      activo: true
    });
    
    closeModal('login-modal');
    showNotification('Cuenta creada exitosamente', 'success');
    
  } catch (error) {
    console.error('Register error:', error);
    let message = 'Error al crear la cuenta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este email ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es muy débil';
        break;
    }
    
    showNotification(message, 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

function toggleSubmitButton(button, loading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoading = button.querySelector('.btn-loading');
  
  if (loading) {
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
  } else {
    button.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

async function logout() {
  try {
    await auth.signOut();
    showNotification('Sesión cerrada', 'info');
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

// ================= FORMULARIOS =================

function setupFormValidation() {
  // RUT formatting
  const rutInputs = document.querySelectorAll('input[id*="rut"]');
  rutInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = formatRUT(e.target.value);
    });
    
    input.addEventListener('blur', (e) => {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('RUT inválido', 'warning');
      } else {
        e.target.classList.remove('error');
      }
    });
  });

  // Phone formatting
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('blur', (e) => {
      if (e.target.value) {
        e.target.value = formatPhoneNumber(e.target.value);
      }
    });
  });

  // Email validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', (e) => {
      const email = e.target.value.trim();
      if (email && !isValidEmail(email)) {
        e.target.classList.add('error');
        showNotification('Email inválido', 'warning');
      } else {
        e.target.classList.remove('error');
      }
    });
  });
}

function setupMultiStepForm() {
  const form = document.getElementById('patient-form');
  if (!form) return;

  // Step navigation buttons
  const nextButtons = form.querySelectorAll('[id^="next-step"]');
  const prevButtons = form.querySelectorAll('[id^="prev-step"]');
  
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStep = parseInt(btn.id.split('-')[2]);
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentStep = parseInt(btn.id.split('-')[2]);
      goToStep(currentStep - 1);
    });
  });

  // Form submission
  form.addEventListener('submit', handlePatientFormSubmit);

  // Dynamic field visibility
  const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
  tipoSolicitudInputs.forEach(input => {
    input.addEventListener('change', updateFormVisibility);
  });

  // Motivation range slider
  const motivacionRange = document.getElementById('motivacion-range');
  const motivacionValue = document.getElementById('motivacion-value');
  if (motivacionRange && motivacionValue) {
    motivacionRange.addEventListener('input', () => {
      motivacionValue.textContent = motivacionRange.value;
    });
  }

  // Reentry form
  const reentryForm = document.getElementById('reentry-form');
  if (reentryForm) {
    reentryForm.addEventListener('submit', handleReentrySubmit);
  }
}

function updateFormVisibility() {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  const anonymousPhone = document.getElementById('anonymous-phone-container');
  const infoEmail = document.getElementById('info-email-container');
  
  // Hide all conditional fields first
  if (anonymousPhone) anonymousPhone.style.display = 'none';
  if (infoEmail) infoEmail.style.display = 'none';
  
  if (tipoSolicitud === 'anonimo' && anonymousPhone) {
    anonymousPhone.style.display = 'block';
    document.getElementById('anonymous-phone').required = true;
  } else if (tipoSolicitud === 'informacion' && infoEmail) {
    infoEmail.style.display = 'block';
    document.getElementById('info-email').required = true;
  }
  
  // Reset required attributes
  if (anonymousPhone && tipoSolicitud !== 'anonimo') {
    document.getElementById('anonymous-phone').required = false;
  }
  if (infoEmail && tipoSolicitud !== 'informacion') {
    document.getElementById('info-email').required = false;
  }
}

function validateStep(step) {
  const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
  if (!currentStepDiv) return false;

  const requiredFields = currentStepDiv.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });

  // Step-specific validations
  if (step === 1) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    if (!tipoSolicitud) {
      showNotification('Selecciona un tipo de solicitud', 'warning');
      return false;
    }

    // Validate conditional fields
    if (tipoSolicitud.value === 'anonimo') {
      const phone = document.getElementById('anonymous-phone').value.trim();
      if (!phone) {
        showNotification('Ingresa un teléfono de contacto', 'warning');
        return false;
      }
    } else if (tipoSolicitud.value === 'informacion') {
      const email = document.getElementById('info-email').value.trim();
      if (!email || !isValidEmail(email)) {
        showNotification('Ingresa un email válido', 'warning');
        return false;
      }
    }
  }

  if (step === 2) {
    const rut = document.getElementById('patient-rut').value.trim();
    if (rut && !validateRUT(rut)) {
      showNotification('RUT inválido', 'warning');
      return false;
    }
  }

  if (step === 3) {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Selecciona al menos una sustancia', 'warning');
      return false;
    }
  }

  if (!isValid) {
    showNotification('Por favor completa todos los campos obligatorios', 'warning');
  }

  return isValid;
}

function goToStep(step) {
  if (step < 1 || step > maxFormStep) return;

  // Update step visibility
  document.querySelectorAll('.form-step').forEach(stepDiv => {
    stepDiv.classList.remove('active');
  });
  
  const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
  if (targetStep) {
    targetStep.classList.add('active');
  }

  // Update progress
  const progressFill = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  if (progressFill) {
    const progressPercentage = (step / maxFormStep) * 100;
    progressFill.style.width = `${progressPercentage}%`;
  }
  
  if (progressText) {
    progressText.textContent = `Paso ${step} de ${maxFormStep}`;
  }

  currentFormStep = step;

  // Handle step 2 visibility for identified patients only
  if (step === 2) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (tipoSolicitud !== 'identificado') {
      goToStep(3); // Skip to step 3 for anonymous or info-only requests
      return;
    }
  }
}

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  
  if (!validateStep(4)) return;

  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  const submitBtn = document.getElementById('submit-form');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    // Collect form data
    const solicitudData = {
      tipoSolicitud,
      edad: parseInt(document.getElementById('patient-age').value),
      cesfam: document.getElementById('patient-cesfam').value,
      paraMi: document.querySelector('input[name="paraMi"]:checked')?.value,
      sustancias: Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value),
      tiempoConsumo: document.getElementById('tiempo-consumo').value,
      urgencia: document.querySelector('input[name="urgencia"]:checked')?.value,
      tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value,
      descripcion: document.getElementById('patient-description').value.trim(),
      motivacion: parseInt(document.getElementById('motivacion-range').value),
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente'
    };

    // Add contact info based on tipo solicitud
    if (tipoSolicitud === 'identificado') {
      solicitudData.nombre = document.getElementById('patient-name').value.trim();
      solicitudData.apellidos = document.getElementById('patient-lastname').value.trim();
      solicitudData.rut = document.getElementById('patient-rut').value.trim();
      solicitudData.telefono = document.getElementById('patient-phone').value.trim();
      solicitudData.email = document.getElementById('patient-email').value.trim();
      solicitudData.direccion = document.getElementById('patient-address').value.trim();
    } else if (tipoSolicitud === 'anonimo') {
      solicitudData.telefono = document.getElementById('anonymous-phone').value.trim();
    } else if (tipoSolicitud === 'informacion') {
      solicitudData.email = document.getElementById('info-email').value.trim();
    }

    // Calculate priority
    solicitudData.prioridad = calculatePriority(solicitudData);

    // Save to Firebase
    await db.collection('solicitudes_ingreso').add(solicitudData);
    
    closeModal('patient-modal');
    resetForm();
    showNotification('Solicitud enviada correctamente. Te contactaremos pronto.', 'success');
    
  } catch (error) {
    console.error('Error submitting form:', error);
    showNotification('Error al enviar la solicitud. Intenta nuevamente.', 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

async function handleReentrySubmit(e) {
  e.preventDefault();
  
  const formData = {
    nombre: document.getElementById('reentry-name').value.trim(),
    rut: document.getElementById('reentry-rut').value.trim(),
    cesfam: document.getElementById('reentry-cesfam').value,
    motivo: document.getElementById('reentry-reason').value.trim(),
    telefono: document.getElementById('reentry-phone').value.trim()
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Validations
  if (!formData.nombre || !formData.rut || !formData.cesfam || !formData.motivo || !formData.telefono) {
    showNotification('Por favor completa todos los campos', 'warning');
    return;
  }

  if (!validateRUT(formData.rut)) {
    showNotification('RUT inválido', 'warning');
    return;
  }

  try {
    toggleSubmitButton(submitBtn, true);
    
    const reingresoData = {
      ...formData,
      rut: formatRUT(formData.rut),
      telefono: formatPhoneNumber(formData.telefono),
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      prioridad: 'media',
      tipo: 'reingreso'
    };

    await db.collection('reingresos').add(reingresoData);
    
    closeModal('reentry-modal');
    e.target.reset();
    showNotification('Solicitud de reingreso enviada correctamente', 'success');
    
  } catch (error) {
    console.error('Error submitting reentry:', error);
    showNotification('Error al enviar la solicitud. Intenta nuevamente.', 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

function resetForm() {
  const form = document.getElementById('patient-form');
  if (form) {
    form.reset();
    goToStep(1);
    
    // Reset visibility
    document.getElementById('anonymous-phone-container').style.display = 'none';
    document.getElementById('info-email-container').style.display = 'none';
    
    // Reset motivation slider
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    if (motivacionRange && motivacionValue) {
      motivacionRange.value = 5;
      motivacionValue.textContent = '5';
    }
  }
  
  isDraftSaved = false;
}
// ================= GESTIÓN DE SOLICITUDES =================

async function loadSolicitudes() {
  if (!currentUserData || currentUserData.profession !== 'asistente_social') {
    return; // Solo asistentes sociales ven solicitudes
  }

  try {
    showLoading(true);
    
    // Cargar solicitudes normales
    const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    // Cargar reingresos
    const reingresosSnapshot = await db.collection('reingresos')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const solicitudes = [];
    
    // Procesar solicitudes normales
    solicitudesSnapshot.forEach(doc => {
      solicitudes.push({
        id: doc.id,
        tipo: 'solicitud',
        ...doc.data()
      });
    });
    
    // Procesar reingresos
    reingresosSnapshot.forEach(doc => {
      solicitudes.push({
        id: doc.id,
        tipo: 'reingreso',
        ...doc.data()
      });
    });
    
    // Ordenar por fecha
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    renderSolicitudes(solicitudes);
    
  } catch (error) {
    console.error('Error loading solicitudes:', error);
    showNotification('Error al cargar solicitudes', 'error');
  } finally {
    showLoading(false);
  }
}

function renderSolicitudes(solicitudes) {
  const container = document.getElementById('requests-container');
  if (!container) return;

  if (solicitudes.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-inbox"></i>
        <p>No hay solicitudes para mostrar</p>
      </div>
    `;
    return;
  }

  container.innerHTML = solicitudes.map(solicitud => createSolicitudCard(solicitud)).join('');
  
  // Add click handlers
  container.querySelectorAll('.request-card').forEach(card => {
    card.addEventListener('click', () => {
      const solicitudId = card.dataset.id;
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (solicitud) {
        showSolicitudDetail(solicitud);
      }
    });
  });
}

function createSolicitudCard(solicitud) {
  const fecha = formatDate(solicitud.fechaCreacion);
  const prioridad = solicitud.prioridad || 'baja';
  const estado = solicitud.estado || 'pendiente';
  
  let titulo, subtitulo;
  
  if (solicitud.tipo === 'reingreso') {
    titulo = `Reingreso - ${solicitud.nombre}`;
    subtitulo = `RUT: ${solicitud.rut}`;
  } else {
    if (solicitud.tipoSolicitud === 'identificado') {
      titulo = `${solicitud.nombre} ${solicitud.apellidos}`;
      subtitulo = `RUT: ${solicitud.rut}`;
    } else if (solicitud.tipoSolicitud === 'anonimo') {
      titulo = 'Solicitud Anónima';
      subtitulo = `Tel: ${solicitud.telefono}`;
    } else {
      titulo = 'Solicitud de Información';
      subtitulo = `Email: ${solicitud.email}`;
    }
  }

  const sustancias = solicitud.sustancias || [];
  const sustanciasHtml = sustancias.length > 0 ? 
    sustancias.map(s => `<span class="substance-tag">${s}</span>`).join('') : '';

  return `
    <div class="request-card" data-id="${solicitud.id}">
      <div class="request-header">
        <div class="request-info">
          <h3>${titulo}</h3>
          <p>${subtitulo}</p>
        </div>
        <div class="request-meta">
          <span class="priority-badge ${prioridad}">${prioridad.toUpperCase()}</span>
          ${solicitud.tipo === 'reingreso' ? '<span class="request-type reingreso">REINGRESO</span>' : ''}
        </div>
      </div>
      
      <div class="request-body">
        ${sustanciasHtml ? `<div class="request-substances">${sustanciasHtml}</div>` : ''}
        ${solicitud.descripcion || solicitud.motivo ? 
          `<p class="request-description">${(solicitud.descripcion || solicitud.motivo).substring(0, 150)}${(solicitud.descripcion || solicitud.motivo).length > 150 ? '...' : ''}</p>` : ''}
        <p><strong>CESFAM:</strong> ${solicitud.cesfam}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Estado:</strong> <span class="status-${estado}">${estado.toUpperCase()}</span></p>
      </div>
      
      <div class="request-actions">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModal('${solicitud.id}')">
          <i class="fas fa-calendar-plus"></i>
          Agendar
        </button>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showSolicitudDetail('${solicitud.id}')">
          <i class="fas fa-eye"></i>
          Ver Detalle
        </button>
      </div>
    </div>
  `;
}

function setupFilters() {
  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentFilter = btn.dataset.filter;
      filterSolicitudes();
    });
  });
}

function filterSolicitudes() {
  const searchTerm = document.getElementById('search-solicitudes')?.value.toLowerCase() || '';
  const priorityFilter = document.getElementById('priority-filter')?.value || '';
  const dateFilter = document.getElementById('date-filter')?.value || '';
  
  const cards = document.querySelectorAll('.request-card');
  
  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    const cardPriority = card.querySelector('.priority-badge')?.textContent.toLowerCase() || '';
    const cardDate = card.querySelector('.request-description')?.parentElement.textContent || '';
    
    let show = true;
    
    // Text search
    if (searchTerm && !cardText.includes(searchTerm)) {
      show = false;
    }
    
    // Priority filter
    if (priorityFilter && !cardPriority.includes(priorityFilter)) {
      show = false;
    }
    
    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toLocaleDateString('es-CL');
      if (!cardDate.includes(filterDate)) {
        show = false;
      }
    }
    
    // Status filter
    if (currentFilter !== 'todas') {
      const statusElement = card.querySelector('[class*="status-"]');
      const cardStatus = statusElement ? statusElement.textContent.toLowerCase() : 'pendiente';
      if (currentFilter !== cardStatus) {
        show = false;
      }
    }
    
    card.style.display = show ? 'block' : 'none';
  });
}

// ================= GESTIÓN DE TABS =================

function setupTabFunctionality() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      const targetPane = document.getElementById(`${targetTab}-tab`);
      if (targetPane) {
        targetPane.classList.add('active');
        
        // Load content based on tab
        switch (targetTab) {
          case 'solicitudes':
            loadSolicitudes();
            break;
          case 'agenda':
            renderCalendar();
            loadTodayAppointments();
            break;
          case 'seguimiento':
            loadSeguimiento();
            break;
          case 'pacientes':
            loadPacientes();
            break;
        }
      }
    });
  });
}

// ================= GESTIÓN DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true);
    
    const pacientesSnapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const pacientes = [];
    pacientesSnapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderPacientes(pacientes);
    
  } catch (error) {
    console.error('Error loading pacientes:', error);
    showNotification('Error al cargar pacientes', 'error');
  } finally {
    showLoading(false);
  }
}

function renderPacientes(pacientes) {
  const grid = document.getElementById('patients-grid');
  if (!grid) return;

  if (pacientes.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-users"></i>
        <p>No hay pacientes registrados en este CESFAM</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = pacientes.map(paciente => createPacienteCard(paciente)).join('');
}

function createPacienteCard(paciente) {
  const fecha = formatDate(paciente.fechaCreacion);
  const estado = paciente.estado || 'activo';
  
  return `
    <div class="patient-card" data-id="${paciente.id}">
      <div class="patient-header">
        <div class="patient-info">
          <h3>${paciente.nombre} ${paciente.apellidos}</h3>
          <p>RUT: ${paciente.rut}</p>
        </div>
        <span class="patient-status ${estado}">${estado.toUpperCase()}</span>
      </div>
      
      <div class="patient-details">
        <p><strong>Edad:</strong> ${paciente.edad} años</p>
        <p><strong>Teléfono:</strong> ${paciente.telefono}</p>
        <p><strong>Registrado:</strong> ${fecha}</p>
      </div>
      
      <div class="patient-actions">
        <button class="btn btn-primary btn-sm" onclick="verFichaPaciente('${paciente.id}')">
          <i class="fas fa-file-medical"></i>
          Ver Ficha
        </button>
        <button class="btn btn-outline btn-sm" onclick="agendarPaciente('${paciente.id}')">
          <i class="fas fa-calendar-plus"></i>
          Agendar
        </button>
      </div>
    </div>
  `;
}

async function buscarPacientePorRUT() {
  const rut = document.getElementById('search-pacientes-rut').value.trim();
  const resultsContainer = document.getElementById('pacientes-search-results');
  
  if (!rut) {
    showNotification('Ingresa un RUT para buscar', 'warning');
    return;
  }

  if (!validateRUT(rut)) {
    showNotification('RUT inválido', 'warning');
    return;
  }

  try {
    showLoading(true);
    
    const formattedRUT = formatRUT(rut);
    
    // Buscar en pacientes del mismo CESFAM
    const pacienteSnapshot = await db.collection('pacientes')
      .where('rut', '==', formattedRUT)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (pacienteSnapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <p>No se encontró ningún paciente con RUT ${formattedRUT} en tu CESFAM</p>
        </div>
      `;
      return;
    }

    const paciente = pacienteSnapshot.docs[0].data();
    paciente.id = pacienteSnapshot.docs[0].id;
    
    resultsContainer.innerHTML = createPacienteFoundCard(paciente);
    
  } catch (error) {
    console.error('Error searching patient:', error);
    showNotification('Error al buscar paciente', 'error');
  } finally {
    showLoading(false);
  }
}

function createPacienteFoundCard(paciente) {
  const fecha = formatDate(paciente.fechaCreacion);
  
  return `
    <div class="patient-found">
      <div class="patient-found-header">
        <h3><i class="fas fa-check-circle"></i> Paciente Encontrado</h3>
        <button class="btn btn-primary" onclick="verFichaPaciente('${paciente.id}')">
          <i class="fas fa-file-medical"></i>
          Ver Ficha Completa
        </button>
      </div>
      
      <div class="patient-found-details">
        <div class="detail-item">
          <span class="detail-label">Nombre Completo</span>
          <span class="detail-value">${paciente.nombre} ${paciente.apellidos}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">RUT</span>
          <span class="detail-value">${paciente.rut}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Edad</span>
          <span class="detail-value">${paciente.edad} años</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Teléfono</span>
          <span class="detail-value">${paciente.telefono}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Email</span>
          <span class="detail-value">${paciente.email || 'No registrado'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Dirección</span>
          <span class="detail-value">${paciente.direccion || 'No registrada'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">CESFAM</span>
          <span class="detail-value">${paciente.cesfam}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de Registro</span>
          <span class="detail-value">${fecha}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Estado</span>
          <span class="detail-value patient-status ${paciente.estado || 'activo'}">${(paciente.estado || 'activo').toUpperCase()}</span>
        </div>
      </div>
    </div>
  `;
}

// ================= FUNCIONES AUXILIARES =================

function showAboutProgram() {
  const aboutInfo = `
    <div class="modal-overlay" id="about-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('about-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Sobre el Programa SENDA</h2>
        <div style="padding: 0 24px 24px;">
          <p style="margin-bottom: 16px;">
            SENDA es el Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol, 
            organismo del gobierno de Chile dependiente del Ministerio del Interior y Seguridad Pública.
          </p>
          <p style="margin-bottom: 16px;">
            <strong>Nuestra misión:</strong> Desarrollar y implementar políticas públicas en materia de drogas, 
            orientadas a prevenir su consumo, tratar y rehabilitar a quienes presentan consumo problemático.
          </p>
          <h3 style="color: var(--primary-blue); margin: 24px 0 16px 0;">Servicios que ofrecemos:</h3>
          <ul style="padding-left: 20px; margin-bottom: 16px;">
            <li>Atención ambulatoria básica</li>
            <li>Atención ambulatoria intensiva</li>
            <li>Tratamiento residencial</li>
            <li>Programas de reinserción social</li>
            <li>Apoyo familiar</li>
            <li>Prevención comunitaria</li>
          </ul>
          <p style="margin-bottom: 16px;">
            <strong>Contacto Nacional:</strong><br>
            Teléfono: 1412 (gratuito)<br>
            Web: <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a>
          </p>
          <div style="background: var(--light-blue); padding: 16px; border-radius: 8px;">
            <strong>¿Necesitas ayuda inmediata?</strong><br>
            Emergencias: 131<br>
            Salud Responde: 600 360 7777
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', aboutInfo);
  showModal('about-modal');
}
// ================= GESTIÓN DE CALENDARIO Y AGENDA =================

function setupCalendar() {
  // Inicializar calendario con el mes actual
  currentCalendarDate = new Date();
  renderCalendar();
}

function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthYearElement = document.getElementById('calendar-month-year');
  
  if (!calendarGrid || !monthYearElement) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update month/year display
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  monthYearElement.textContent = `${monthNames[month]} ${year}`;
  
  // Clear grid
  calendarGrid.innerHTML = '';
  
  // Add day headers
  const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  dayHeaders.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Generate calendar days
  const today = new Date();
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.toDateString() === today.toDateString();
    const isPast = currentDate < today.setHours(0, 0, 0, 0);
    
    if (!isCurrentMonth) {
      dayElement.classList.add('other-month');
    }
    
    if (isToday) {
      dayElement.classList.add('today');
    }
    
    if (isPast && isCurrentMonth) {
      dayElement.style.opacity = '0.5';
      dayElement.style.pointerEvents = 'none';
    }
    
    dayElement.innerHTML = `
      <div class="calendar-day-number">${currentDate.getDate()}</div>
      <div class="calendar-appointments" id="appointments-${currentDate.toISOString().split('T')[0]}"></div>
    `;
    
    // Add click handler
    if (!isPast && isCurrentMonth) {
      dayElement.addEventListener('click', () => selectCalendarDay(new Date(currentDate)));
    }
    
    calendarGrid.appendChild(dayElement);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Load appointments for this month
  loadMonthAppointments(year, month);
}

function selectCalendarDay(date) {
  // Remove previous selection
  document.querySelectorAll('.calendar-day.selected').forEach(day => {
    day.classList.remove('selected');
  });
  
  // Add selection to clicked day
  const dayElements = document.querySelectorAll('.calendar-day');
  dayElements.forEach(dayEl => {
    const dayNumber = dayEl.querySelector('.calendar-day-number').textContent;
    if (parseInt(dayNumber) === date.getDate()) {
      dayEl.classList.add('selected');
    }
  });
  
  selectedCalendarDate = date;
  loadDayAppointments(date);
}

async function loadMonthAppointments(year, month) {
  if (!currentUserData) return;
  
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfMonth)
      .where('fecha', '<=', endOfMonth)
      .get();
    
    // Clear existing appointments
    document.querySelectorAll('.calendar-appointments').forEach(container => {
      container.innerHTML = '';
    });
    
    appointmentsSnapshot.forEach(doc => {
      const appointment = doc.data();
      const appointmentDate = appointment.fecha.toDate();
      const dateString = appointmentDate.toISOString().split('T')[0];
      const container = document.getElementById(`appointments-${dateString}`);
      
      if (container) {
        const appointmentEl = document.createElement('div');
        appointmentEl.className = 'calendar-appointment';
        appointmentEl.textContent = appointment.pacienteNombre || 'Cita';
        container.appendChild(appointmentEl);
      }
    });
    
  } catch (error) {
    console.error('Error loading month appointments:', error);
  }
}

async function loadDayAppointments(date) {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList || !currentUserData) return;
  
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (appointmentsSnapshot.empty) {
      appointmentsList.innerHTML = '<p>No hay citas programadas para este día</p>';
      return;
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    appointmentsList.innerHTML = appointments.map(appointment => `
      <div class="appointment-item" data-id="${appointment.id}">
        <div class="appointment-time">${appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
        <div>
          <div class="appointment-patient">${appointment.pacienteNombre}</div>
          <div class="appointment-type">${getProfessionName(appointment.tipoProfesional)}</div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="editAppointment('${appointment.id}')">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading day appointments:', error);
    appointmentsList.innerHTML = '<p>Error al cargar las citas</p>';
  }
}

async function loadTodayAppointments() {
  const today = new Date();
  loadDayAppointments(today);
}

// ================= GESTIÓN DE SEGUIMIENTO =================

async function loadSeguimiento() {
  if (!currentUserData) return;
  
  try {
    showLoading(true);
    
    // Cargar pacientes agendados para hoy
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
    
    // Cargar próximas citas
    const upcomingAppointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', tomorrow)
      .orderBy('fecha', 'asc')
      .limit(10)
      .get();
    
    renderUpcomingAppointments(upcomingAppointmentsSnapshot);
    
  } catch (error) {
    console.error('Error loading seguimiento:', error);
    showNotification('Error al cargar seguimiento', 'error');
  } finally {
    showLoading(false);
  }
}

function renderPatientsTimeline(appointmentsSnapshot) {
  const timeline = document.getElementById('patients-timeline');
  if (!timeline) return;
  
  if (appointmentsSnapshot.empty) {
    timeline.innerHTML = `
      <div class="no-results">
        <i class="fas fa-calendar-day"></i>
        <p>No hay pacientes agendados para hoy</p>
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
    const estado = appointment.estado || 'pendiente';
    
    return `
      <div class="timeline-item" onclick="openSeguimientoForm('${appointment.id}')">
        <div class="timeline-time">${hora}</div>
        <div class="timeline-patient">
          <h4>${appointment.pacienteNombre}</h4>
          <p>${getProfessionName(appointment.tipoProfesional)} - ${appointment.profesionalNombre}</p>
        </div>
        <span class="timeline-status ${estado}">${estado.toUpperCase()}</span>
      </div>
    `;
  }).join('');
}

function renderUpcomingAppointments(appointmentsSnapshot) {
  const grid = document.getElementById('upcoming-appointments-grid');
  if (!grid) return;
  
  if (appointmentsSnapshot.empty) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-calendar-week"></i>
        <p>No hay próximas citas programadas</p>
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
  
  grid.innerHTML = appointments.map(appointment => {
    const fecha = appointment.fecha.toDate();
    const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="appointment-card" onclick="viewAppointmentDetail('${appointment.id}')">
        <div class="appointment-card-header">
          <span class="appointment-date">${fechaStr} - ${hora}</span>
        </div>
        <div class="appointment-card-body">
          <h4>${appointment.pacienteNombre}</h4>
          <p>${getProfessionName(appointment.tipoProfesional)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function openSeguimientoForm(appointmentId) {
  // Crear modal de seguimiento
  const seguimientoModal = `
    <div class="modal-overlay" id="seguimiento-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('seguimiento-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Registro de Seguimiento</h2>
        
        <form id="seguimiento-form">
          <input type="hidden" id="appointment-id" value="${appointmentId}">
          
          <div class="form-group">
            <label class="form-label">Tipo de Atención *</label>
            <select class="form-select" id="tipo-atencion" required>
              <option value="">Seleccionar...</option>
              <option value="primera_vez">Primera Vez</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="control">Control</option>
              <option value="crisis">Atención de Crisis</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado del Paciente *</label>
            <select class="form-select" id="estado-paciente" required>
              <option value="">Seleccionar...</option>
              <option value="asistio">Asistió</option>
              <option value="no_asistio">No Asistió</option>
              <option value="reprogramada">Reprogramada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones de la Sesión *</label>
            <textarea class="form-textarea" id="observaciones" rows="4" 
                      placeholder="Describe el desarrollo de la sesión, avances, dificultades, etc." required></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Plan de Tratamiento</label>
            <textarea class="form-textarea" id="plan-tratamiento" rows="3" 
                      placeholder="Próximos pasos, objetivos, recomendaciones..."></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Próxima Cita</label>
              <input type="date" class="form-input" id="proxima-cita">
            </div>
            <div class="form-group">
              <label class="form-label">Hora</label>
              <input type="time" class="form-input" id="hora-proxima-cita">
            </div>
          </div>
          
          <div class="form-navigation">
            <button type="button" class="btn btn-outline" onclick="closeModal('seguimiento-modal')">
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
  
  document.body.insertAdjacentHTML('beforeend', seguimientoModal);
  showModal('seguimiento-modal');
  
  // Setup form handler
  document.getElementById('seguimiento-form').addEventListener('submit', handleSeguimientoSubmit);
}

async function handleSeguimientoSubmit(e) {
  e.preventDefault();
  
  const appointmentId = document.getElementById('appointment-id').value;
  const formData = {
    appointmentId,
    tipoAtencion: document.getElementById('tipo-atencion').value,
    estadoPaciente: document.getElementById('estado-paciente').value,
    observaciones: document.getElementById('observaciones').value.trim(),
    planTratamiento: document.getElementById('plan-tratamiento').value.trim(),
    proximaCita: document.getElementById('proxima-cita').value,
    horaProximaCita: document.getElementById('hora-proxima-cita').value,
    profesionalId: currentUser.uid,
    profesionalNombre: `${currentUserData.nombre} ${currentUserData.apellidos}`,
    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    // Guardar seguimiento
    await db.collection('seguimientos').add(formData);
    
    // Actualizar estado de la cita
    await db.collection('citas').doc(appointmentId).update({
      estado: formData.estadoPaciente === 'asistio' ? 'completado' : formData.estadoPaciente,
      ultimoSeguimiento: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Si hay próxima cita, crearla
    if (formData.proximaCita && formData.horaProximaCita) {
      const proximaFecha = new Date(`${formData.proximaCita}T${formData.horaProximaCita}`);
      
      // Obtener datos de la cita actual
      const currentAppointment = await db.collection('citas').doc(appointmentId).get();
      const currentData = currentAppointment.data();
      
      await db.collection('citas').add({
        pacienteId: currentData.pacienteId,
        pacienteNombre: currentData.pacienteNombre,
        profesionalId: currentData.profesionalId,
        profesionalNombre: currentData.profesionalNombre,
        tipoProfesional: currentData.tipoProfesional,
        cesfam: currentData.cesfam,
        fecha: proximaFecha,
        estado: 'programada',
        tipo: 'seguimiento',
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    closeModal('seguimiento-modal');
    showNotification('Seguimiento registrado correctamente', 'success');
    loadSeguimiento(); // Reload seguimiento data
    
  } catch (error) {
    console.error('Error saving seguimiento:', error);
    showNotification('Error al guardar seguimiento', 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

// ================= FUNCIONES DE AGENDA =================

function showAgendaModal(solicitudId) {
  // Crear modal de agenda
  const agendaModal = `
    <div class="modal-overlay" id="agenda-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('agenda-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agendar Paciente</h2>
        
        <form id="agenda-form">
          <input type="hidden" id="solicitud-id" value="${solicitudId}">
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de Profesional *</label>
              <select class="form-select" id="tipo-profesional" required>
                <option value="">Seleccionar...</option>
                <option value="asistente_social">Asistente Social</option>
                <option value="medico">Médico</option>
                <option value="psicologo">Psicólogo</option>
                <option value="terapeuta">Terapeuta Ocupacional</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Profesional *</label>
              <select class="form-select" id="profesional-asignado" required disabled>
                <option value="">Primero selecciona el tipo</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input type="date" class="form-input" id="fecha-cita" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hora *</label>
              <select class="form-select" id="hora-cita" required>
                <option value="">Seleccionar hora...</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea class="form-textarea" id="observaciones-cita" rows="3" 
                      placeholder="Observaciones adicionales para la cita..."></textarea>
          </div>
          
          <div class="form-navigation">
            <button type="button" class="btn btn-outline" onclick="closeModal('agenda-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-calendar-check"></i>
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', agendaModal);
  showModal('agenda-modal');
  
  // Setup form handlers
  setupAgendaForm();
}

function setupAgendaForm() {
  const tipoProfesionalSelect = document.getElementById('tipo-profesional');
  const profesionalSelect = document.getElementById('profesional-asignado');
  const fechaCitaInput = document.getElementById('fecha-cita');
  const horaCitaSelect = document.getElementById('hora-cita');
  
  // Load professionals when type changes
  tipoProfesionalSelect.addEventListener('change', async () => {
    const tipo = tipoProfesionalSelect.value;
    if (!tipo) {
      profesionalSelect.disabled = true;
      profesionalSelect.innerHTML = '<option value="">Primero selecciona el tipo</option>';
      return;
    }
    
    try {
      const professionalsSnapshot = await db.collection('profesionales')
        .where('profession', '==', tipo)
        .where('cesfam', '==', currentUserData.cesfam)
        .where('activo', '==', true)
        .get();
      
      profesionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
      
      professionalsSnapshot.forEach(doc => {
        const prof = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${prof.nombre} ${prof.apellidos}`;
        profesionalSelect.appendChild(option);
      });
      
      profesionalSelect.disabled = false;
      
    } catch (error) {
      console.error('Error loading professionals:', error);
      showNotification('Error al cargar profesionales', 'error');
    }
  });
  
  // Generate time slots when date changes
  fechaCitaInput.addEventListener('change', generateTimeSlots);
  
  // Setup minimum date (today)
  const today = new Date();
  fechaCitaInput.min = today.toISOString().split('T')[0];
  
  // Setup form submission
  document.getElementById('agenda-form').addEventListener('submit', handleAgendaSubmit);
}

function generateTimeSlots() {
  const horaCitaSelect = document.getElementById('hora-cita');
  horaCitaSelect.innerHTML = '<option value="">Seleccionar hora...</option>';
  
  // Generate slots from 08:00 to 16:30 in 30-minute intervals
  for (let hour = 8; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 16 && minute > 30) break; // Stop at 16:30
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const option = document.createElement('option');
      option.value = timeString;
      option.textContent = timeString;
      horaCitaSelect.appendChild(option);
    }
  }
}

async function handleAgendaSubmit(e) {
  e.preventDefault();
  
  const solicitudId = document.getElementById('solicitud-id').value;
  const formData = {
    tipoProfesional: document.getElementById('tipo-profesional').value,
    profesionalId: document.getElementById('profesional-asignado').value,
    fecha: document.getElementById('fecha-cita').value,
    hora: document.getElementById('hora-cita').value,
    observaciones: document.getElementById('observaciones-cita').value.trim()
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    // Get professional data
    const professionalDoc = await db.collection('profesionales').doc(formData.profesionalId).get();
    const professionalData = professionalDoc.data();
    
    // Get solicitud data
    const solicitudDoc = await db.collection('solicitudes_ingreso').doc(solicitudId).get();
    const solicitudData = solicitudDoc.data();
    
    // Create appointment
    const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
    
    const citaData = {
      solicitudId,
      pacienteId: solicitudData.rut || null,
      pacienteNombre: solicitudData.nombre ? `${solicitudData.nombre} ${solicitudData.apellidos}` : 'Paciente Anónimo',
      profesionalId: formData.profesionalId,
      profesionalNombre: `${professionalData.nombre} ${professionalData.apellidos}`,
      tipoProfesional: formData.tipoProfesional,
      cesfam: currentUserData.cesfam,
      fecha: fechaHora,
      observaciones: formData.observaciones,
      estado: 'programada',
      tipo: 'primera_vez',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('citas').add(citaData);
    
    // Update solicitud status
    await db.collection('solicitudes_ingreso').doc(solicitudId).update({
      estado: 'agendada',
      fechaAgenda: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    closeModal('agenda-modal');
    showNotification('Cita agendada correctamente', 'success');
    loadSolicitudes(); // Reload solicitudes
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    showNotification('Error al agendar cita', 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}
// ================= FUNCIONES DE DETALLE =================

function showSolicitudDetail(solicitudId) {
  // Si recibimos el ID como string, buscamos la solicitud
  if (typeof solicitudId === 'string') {
    // Esta función se llamará desde el renderizado, necesitamos buscar la solicitud
    const solicitudCards = document.querySelectorAll('.request-card');
    let solicitudData = null;
    
    solicitudCards.forEach(card => {
      if (card.dataset.id === solicitudId) {
        // Extraer datos de la card (simplificado para el ejemplo)
        // En un caso real, sería mejor tener los datos en memoria o hacer una consulta
        solicitudData = { id: solicitudId };
      }
    });
    
    if (!solicitudData) {
      showNotification('No se pudo cargar el detalle de la solicitud', 'error');
      return;
    }
  }
  
  // Si recibimos el objeto completo
  const solicitud = typeof solicitudId === 'object' ? solicitudId : null;
  
  if (!solicitud) {
    // Hacer consulta a Firebase para obtener la solicitud
    loadSolicitudDetail(solicitudId);
    return;
  }
  
  const fecha = formatDate(solicitud.fechaCreacion);
  const prioridad = solicitud.prioridad || 'baja';
  
  let contenidoDetalle = '';
  
  if (solicitud.tipo === 'reingreso') {
    contenidoDetalle = `
      <div class="detail-section">
        <h4>Información del Reingreso</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">${solicitud.nombre}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">RUT</span>
            <span class="detail-value">${solicitud.rut}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Teléfono</span>
            <span class="detail-value">${solicitud.telefono}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">CESFAM</span>
            <span class="detail-value">${solicitud.cesfam}</span>
          </div>
        </div>
        <div class="detail-item full-width">
          <span class="detail-label">Motivo del Reingreso</span>
          <span class="detail-value">${solicitud.motivo}</span>
        </div>
      </div>
    `;
  } else {
    // Solicitud normal
    contenidoDetalle = `
      <div class="detail-section">
        <h4>Información Personal</h4>
        <div class="detail-grid">
          ${solicitud.tipoSolicitud === 'identificado' ? `
            <div class="detail-item">
              <span class="detail-label">Nombre</span>
              <span class="detail-value">${solicitud.nombre} ${solicitud.apellidos}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">RUT</span>
              <span class="detail-value">${solicitud.rut}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono</span>
              <span class="detail-value">${solicitud.telefono}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">${solicitud.email || 'No proporcionado'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Dirección</span>
              <span class="detail-value">${solicitud.direccion || 'No proporcionada'}</span>
            </div>
          ` : solicitud.tipoSolicitud === 'anonimo' ? `
            <div class="detail-item">
              <span class="detail-label">Tipo</span>
              <span class="detail-value">Solicitud Anónima</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono</span>
              <span class="detail-value">${solicitud.telefono}</span>
            </div>
          ` : `
            <div class="detail-item">
              <span class="detail-label">Tipo</span>
              <span class="detail-value">Solicitud de Información</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">${solicitud.email}</span>
            </div>
          `}
          <div class="detail-item">
            <span class="detail-label">Edad</span>
            <span class="detail-value">${solicitud.edad} años</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">CESFAM</span>
            <span class="detail-value">${solicitud.cesfam}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Para quién</span>
            <span class="detail-value">${solicitud.paraMi === 'mi_mismo' ? 'Para mí mismo/a' : solicitud.paraMi === 'familiar' ? 'Para un familiar' : 'Para un amigo/a'}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Evaluación Clínica</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Sustancias</span>
            <span class="detail-value">${(solicitud.sustancias || []).join(', ')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tiempo de Consumo</span>
            <span class="detail-value">${solicitud.tiempoConsumo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Urgencia</span>
            <span class="detail-value priority-badge ${solicitud.urgencia}">${(solicitud.urgencia || '').toUpperCase()}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tratamiento Previo</span>
            <span class="detail-value">${solicitud.tratamientoPrevio === 'no' ? 'No, es mi primera vez' : solicitud.tratamientoPrevio === 'si_senda' ? 'Sí, en SENDA' : 'Sí, en otro lugar'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Motivación</span>
            <span class="detail-value">${solicitud.motivacion}/10</span>
          </div>
        </div>
        ${solicitud.descripcion ? `
          <div class="detail-item full-width">
            <span class="detail-label">Descripción de la Situación</span>
            <span class="detail-value">${solicitud.descripcion}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  const detailModal = `
    <div class="modal-overlay" id="solicitud-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('solicitud-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle de ${solicitud.tipo === 'reingreso' ? 'Reingreso' : 'Solicitud'}</h2>
        
        <div style="padding: 0 24px 24px;">
          <div class="detail-header">
            <div class="detail-meta">
              <span class="priority-badge ${prioridad}">Prioridad: ${prioridad.toUpperCase()}</span>
              <span class="detail-date">Fecha: ${fecha}</span>
              <span class="detail-status">Estado: ${(solicitud.estado || 'pendiente').toUpperCase()}</span>
            </div>
          </div>
          
          ${contenidoDetalle}
          
          <div class="detail-actions">
            <button class="btn btn-primary" onclick="closeModal('solicitud-detail-modal'); showAgendaModal('${solicitud.id}')">
              <i class="fas fa-calendar-plus"></i>
              Agendar Cita
            </button>
            <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', detailModal);
  showModal('solicitud-detail-modal');
}

async function loadSolicitudDetail(solicitudId) {
  try {
    showLoading(true);
    
    // Buscar en solicitudes normales
    let solicitudDoc = await db.collection('solicitudes').doc(solicitudId).get();
    
    if (!solicitudDoc.exists) {
      // Buscar en reingresos
      solicitudDoc = await db.collection('reingresos').doc(solicitudId).get();
    }
    
    if (solicitudDoc.exists) {
      const solicitud = {
        id: solicitudDoc.id,
        tipo: solicitudDoc.ref.parent.id === 'reingresos' ? 'reingreso' : 'solicitud',
        ...solicitudDoc.data()
      };
      showSolicitudDetail(solicitud);
    } else {
      showNotification('Solicitud no encontrada', 'error');
    }
    
  } catch (error) {
    console.error('Error loading solicitud detail:', error);
    showNotification('Error al cargar detalle de la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

async function verFichaPaciente(pacienteId) {
  try {
    showLoading(true);
    
    const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
    
    if (!pacienteDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const paciente = pacienteDoc.data();
    const fecha = formatDate(paciente.fechaCreacion);
    
    // Cargar historial de citas
    const citasSnapshot = await db.collection('citas')
      .where('pacienteId', '==', paciente.rut)
      .orderBy('fecha', 'desc')
      .get();
    
    const citas = [];
    citasSnapshot.forEach(doc => {
      citas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Cargar seguimientos
    const seguimientosSnapshot = await db.collection('seguimientos')
      .where('appointmentId', 'in', citas.map(c => c.id))
      .orderBy('fechaRegistro', 'desc')
      .get();
    
    const seguimientos = [];
    seguimientosSnapshot.forEach(doc => {
      seguimientos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const fichaModal = `
      <div class="modal-overlay" id="ficha-paciente-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('ficha-paciente-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Ficha del Paciente</h2>
          
          <div style="padding: 0 24px 24px;">
            <div class="detail-section">
              <h4>Información Personal</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Nombre Completo</span>
                  <span class="detail-value">${paciente.nombre} ${paciente.apellidos}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">RUT</span>
                  <span class="detail-value">${paciente.rut}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Edad</span>
                  <span class="detail-value">${paciente.edad} años</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Teléfono</span>
                  <span class="detail-value">${paciente.telefono}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">${paciente.email || 'No registrado'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Dirección</span>
                  <span class="detail-value">${paciente.direccion || 'No registrada'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">CESFAM</span>
                  <span class="detail-value">${paciente.cesfam}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Fecha de Registro</span>
                  <span class="detail-value">${fecha}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado</span>
                  <span class="detail-value patient-status ${paciente.estado || 'activo'}">${(paciente.estado || 'activo').toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Historial de Citas (${citas.length})</h4>
              ${citas.length > 0 ? `
                <div class="citas-historial">
                  ${citas.map(cita => `
                    <div class="cita-item">
                      <div class="cita-fecha">${formatDate(cita.fecha)}</div>
                      <div class="cita-profesional">${cita.profesionalNombre} - ${getProfessionName(cita.tipoProfesional)}</div>
                      <div class="cita-estado status-${cita.estado}">${(cita.estado || 'programada').toUpperCase()}</div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p>No hay citas registradas</p>'}
            </div>
            
            <div class="detail-section">
              <h4>Seguimientos (${seguimientos.length})</h4>
              ${seguimientos.length > 0 ? `
                <div class="seguimientos-historial">
                  ${seguimientos.map(seg => `
                    <div class="seguimiento-item">
                      <div class="seguimiento-fecha">${formatDate(seg.fechaRegistro)}</div>
                      <div class="seguimiento-profesional">${seg.profesionalNombre}</div>
                      <div class="seguimiento-tipo">${seg.tipoAtencion}</div>
                      <div class="seguimiento-observaciones">${seg.observaciones}</div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p>No hay seguimientos registrados</p>'}
            </div>
            
            <div class="detail-actions">
              <button class="btn btn-primary" onclick="agendarPaciente('${pacienteId}')">
                <i class="fas fa-calendar-plus"></i>
                Nueva Cita
              </button>
              <button class="btn btn-outline" onclick="closeModal('ficha-paciente-modal')">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', fichaModal);
    showModal('ficha-paciente-modal');
    
  } catch (error) {
    console.error('Error loading patient file:', error);
    showNotification('Error al cargar ficha del paciente', 'error');
  } finally {
    showLoading(false);
  }
}

function agendarPaciente(pacienteId) {
  // Similar a showAgendaModal pero para pacientes existentes
  closeModal('ficha-paciente-modal'); // Cerrar modal anterior si está abierto
  
  // Crear modal de agenda para paciente existente
  const agendaModal = `
    <div class="modal-overlay" id="agenda-paciente-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('agenda-paciente-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agendar Cita para Paciente</h2>
        
        <form id="agenda-paciente-form">
          <input type="hidden" id="paciente-id" value="${pacienteId}">
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de Profesional *</label>
              <select class="form-select" id="tipo-profesional-paciente" required>
                <option value="">Seleccionar...</option>
                <option value="asistente_social">Asistente Social</option>
                <option value="medico">Médico</option>
                <option value="psicologo">Psicólogo</option>
                <option value="terapeuta">Terapeuta Ocupacional</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Profesional *</label>
              <select class="form-select" id="profesional-asignado-paciente" required disabled>
                <option value="">Primero selecciona el tipo</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input type="date" class="form-input" id="fecha-cita-paciente" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hora *</label>
              <select class="form-select" id="hora-cita-paciente" required>
                <option value="">Seleccionar hora...</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Cita *</label>
            <select class="form-select" id="tipo-cita" required>
              <option value="">Seleccionar...</option>
              <option value="primera_vez">Primera Vez</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="control">Control</option>
              <option value="urgencia">Urgencia</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea class="form-textarea" id="observaciones-cita-paciente" rows="3" 
                      placeholder="Observaciones adicionales para la cita..."></textarea>
          </div>
          
          <div class="form-navigation">
            <button type="button" class="btn btn-outline" onclick="closeModal('agenda-paciente-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-calendar-check"></i>
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', agendaModal);
  showModal('agenda-paciente-modal');
  
  // Setup form handlers similar to agenda form
  setupAgendaPacienteForm();
}

function setupAgendaPacienteForm() {
  const tipoProfesionalSelect = document.getElementById('tipo-profesional-paciente');
  const profesionalSelect = document.getElementById('profesional-asignado-paciente');
  const fechaCitaInput = document.getElementById('fecha-cita-paciente');
  const horaCitaSelect = document.getElementById('hora-cita-paciente');
  
  // Similar setup to agenda form
  tipoProfesionalSelect.addEventListener('change', async () => {
    const tipo = tipoProfesionalSelect.value;
    if (!tipo) {
      profesionalSelect.disabled = true;
      profesionalSelect.innerHTML = '<option value="">Primero selecciona el tipo</option>';
      return;
    }
    
    try {
      const professionalsSnapshot = await db.collection('profesionales')
        .where('profession', '==', tipo)
        .where('cesfam', '==', currentUserData.cesfam)
        .where('activo', '==', true)
        .get();
      
      profesionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
      
      professionalsSnapshot.forEach(doc => {
        const prof = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${prof.nombre} ${prof.apellidos}`;
        profesionalSelect.appendChild(option);
      });
      
      profesionalSelect.disabled = false;
      
    } catch (error) {
      console.error('Error loading professionals:', error);
      showNotification('Error al cargar profesionales', 'error');
    }
  });
  
  fechaCitaInput.addEventListener('change', () => {
    horaCitaSelect.innerHTML = '<option value="">Seleccionar hora...</option>';
    
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 16 && minute > 30) break;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = timeString;
        option.textContent = timeString;
        horaCitaSelect.appendChild(option);
      }
    }
  });
  
  const today = new Date();
  fechaCitaInput.min = today.toISOString().split('T')[0];
  
  document.getElementById('agenda-paciente-form').addEventListener('submit', handleAgendaPacienteSubmit);
}

async function handleAgendaPacienteSubmit(e) {
  e.preventDefault();
  
  const pacienteId = document.getElementById('paciente-id').value;
  const formData = {
    tipoProfesional: document.getElementById('tipo-profesional-paciente').value,
    profesionalId: document.getElementById('profesional-asignado-paciente').value,
    fecha: document.getElementById('fecha-cita-paciente').value,
    hora: document.getElementById('hora-cita-paciente').value,
    tipoCita: document.getElementById('tipo-cita').value,
    observaciones: document.getElementById('observaciones-cita-paciente').value.trim()
  };
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    // Get patient and professional data
    const [pacienteDoc, professionalDoc] = await Promise.all([
      db.collection('pacientes').doc(pacienteId).get(),
      db.collection('profesionales').doc(formData.profesionalId).get()
    ]);
    
    const pacienteData = pacienteDoc.data();
    const professionalData = professionalDoc.data();
    
    const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
    
    const citaData = {
      pacienteId: pacienteData.rut,
      pacienteNombre: `${pacienteData.nombre} ${pacienteData.apellidos}`,
      profesionalId: formData.profesionalId,
      profesionalNombre: `${professionalData.nombre} ${professionalData.apellidos}`,
      tipoProfesional: formData.tipoProfesional,
      cesfam: currentUserData.cesfam,
      fecha: fechaHora,
      observaciones: formData.observaciones,
      estado: 'programada',
      tipo: formData.tipoCita,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('citas').add(citaData);
    
    closeModal('agenda-paciente-modal');
    showNotification('Cita agendada correctamente', 'success');
    
  } catch (error) {
    console.error('Error creating patient appointment:', error);
    showNotification('Error al agendar cita', 'error');
  } finally {
    toggleSubmitButton(submitBtn, false);
  }
}

function filterSeguimiento() {
  const searchTerm = document.getElementById('search-seguimiento')?.value.toLowerCase() || '';
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  timelineItems.forEach(item => {
    const itemText = item.textContent.toLowerCase();
    item.style.display = itemText.includes(searchTerm) ? 'flex' : 'none';
  });
}

function viewAppointmentDetail(appointmentId) {
  // Función para ver detalles de una cita específica
  console.log('Viewing appointment detail:', appointmentId);
  // Implementar según necesidades específicas
}

function editAppointment(appointmentId) {
  // Función para editar una cita
  console.log('Editing appointment:', appointmentId);
  // Implementar según necesidades específicas
}


// ================= INICIALIZACIÓN FINAL =================

// Asegurar que todas las funciones estén disponibles globalmente
window.showSolicitudDetail = showSolicitudDetail;
window.showAgendaModal = showAgendaModal;
window.verFichaPaciente = verFichaPaciente;
window.agendarPaciente = agendarPaciente;
window.openSeguimientoForm = openSeguimientoForm;
window.viewAppointmentDetail = viewAppointmentDetail;
window.editAppointment = editAppointment;
window.closeModal = closeModal;

console.log('SENDA Puente Alto - Sistema completamente cargado');
