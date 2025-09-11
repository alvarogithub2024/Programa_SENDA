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

// Chilean Regions and Communes Data
const regionesChile = {
  "arica": {
    nombre: "Arica y Parinacota",
    comunas: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  "tarapaca": {
    nombre: "Tarapacá",
    comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
  },
  "antofagasta": {
    nombre: "Antofagasta",
    comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
  },
  "atacama": {
    nombre: "Atacama",
    comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  "coquimbo": {
    nombre: "Coquimbo",
    comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  "valparaiso": {
    nombre: "Valparaíso",
    comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Hijuelas", "La Calera", "La Cruz", "Limache", "Nogales", "Olmué", "Quillota"]
  },
  "metropolitana": {
    nombre: "Metropolitana de Santiago",
    comunas: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
  },
  "ohiggins": {
    nombre: "Libertador General Bernardo O'Higgins",
    comunas: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]
  },
  "maule": {
    nombre: "Maule",
    comunas: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]
  },
  "nuble": {
    nombre: "Ñuble",
    comunas: ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"]
  },
  "biobio": {
    nombre: "Biobío",
    comunas: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]
  },
  "araucania": {
    nombre: "La Araucanía",
    comunas: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]
  },
  "losrios": {
    nombre: "Los Ríos",
    comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
  },
  "loslagos": {
    nombre: "Los Lagos",
    comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]
  },
  "aysen": {
    nombre: "Aysén del General Carlos Ibáñez del Campo",
    comunas: ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
  },
  "magallanes": {
    nombre: "Magallanes y de la Antártica Chilena",
    comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  }
};

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
          <button class="btn btn-secondary" id="today-btn" style="margin-left: 12px;">
            <i class="fas fa-calendar-day"></i> Hoy
          </button>
        </div>
        <div>
          <button class="btn btn-primary" id="new-appointment">
            <i class="fas fa-plus"></i> Nueva Cita
          </button>
        </div>
      </div>
      
      <div class="calendar-layout">
        <div class="professionals-sidebar">
          <h3>Profesionales Disponibles</h3>
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
        <h3>Citas de Hoy - ${new Date().toLocaleDateString('es-CL')}</h3>
        <div id="today-appointments-list">
          <!-- Citas del día se mostrarán aquí -->
        </div>
      </div>
    `;
  }
  
  setupCalendarEvents();
  await loadProfessionalsList();
  await loadCalendarView();
  await loadTodayAppointments();
}

async function loadProfessionalsList() {
  try {
    const professionalsContainer = document.getElementById('professionals-list');
    if (!professionalsContainer) return;
    
    professionalsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // CONSULTA CORREGIDA - Obtener todos los profesionales activos
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    let html = '';
    professionalsSnapshot.forEach(doc => {
      const data = doc.data();
      // Incluir todos los profesionales, no solo médicos, psicólogos y terapeutas
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
    });
    
    if (html === '') {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay profesionales disponibles</p>';
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
}

function setupCalendarEvents() {
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
  const todayBtn = document.getElementById('today-btn');
  const newAppointment = document.getElementById('new-appointment');
  
  if (prevMonth) {
    prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      loadCalendarView();
    });
  }
  
  if (nextMonth) {
    nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      loadCalendarView();
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const today = new Date();
      // Si estamos antes de 2025, ir a enero 2025
      if (today.getFullYear() < 2025) {
        currentCalendarDate = new Date(2025, 0, 1);
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
}

async function loadCalendarView() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('current-month-year');
    
    if (!calendarGrid || !monthYearSpan) return;
    
    // Asegurar que no vamos antes de 2025
    if (currentCalendarDate.getFullYear() < 2025) {
      currentCalendarDate = new Date(2025, 0, 1);
    }
    
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
          appointments[dateKey].push(data);
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
      
      html += `
        <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}"
             onclick="selectCalendarDay('${currentDate.toISOString()}')">
          <div class="day-number">${currentDate.getDate()}</div>
          ${dayAppointments.map(apt => `
            <div class="appointment-item" style="background: var(--primary-blue); color: white; font-size: 10px; padding: 2px 4px; margin: 1px 0; border-radius: 2px; cursor: pointer;">
              ${new Date(apt.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
            </div>
          `).join('')}
        </div>
      `;
    }
    
    html += '</div>';
    calendarGrid.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading calendar view:', error);
  }
}

function selectCalendarDay(dateISO) {
  if (!selectedProfessional) {
    showNotification('Selecciona un profesional primero para ver/agregar citas', 'warning');
    return;
  }
  
  const selectedDate = new Date(dateISO);
  showDayAppointmentsModal(selectedDate, selectedProfessional);
}

async function loadTodayAppointments() {
  try {
    const todayContainer = document.getElementById('today-appointments-list');
    if (!todayContainer) return;
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (appointmentsSnapshot.empty) {
      todayContainer.innerHTML = '<p style="color: var(--gray-600);">No hay citas programadas para hoy</p>';
      return;
    }
    
    let html = '';
    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      
      try {
        // Obtener datos del profesional
        const professionalDoc = await db.collection('profesionales').doc(data.profesional_id).get();
        const professionalData = professionalDoc.exists ? professionalDoc.data() : null;
        
        // Obtener datos del paciente
        const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
        const patientData = patientDoc.exists ? patientDoc.data() : null;
        
        html += `
          <div class="appointment-summary-item">
            <div class="appointment-time">
              ${new Date(data.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
            </div>
            <div class="appointment-details">
              <div class="appointment-patient">${patientData?.datos_personales?.nombre_completo || 'Paciente sin nombre'}</div>
              <div class="appointment-professional">${professionalData?.nombre || 'Profesional'} - ${getProfessionName(professionalData?.profesion || '')}</div>
              <div class="appointment-type">${data.tipo_cita || 'Consulta general'}</div>
            </div>
            <div class="appointment-actions">
              <button class="btn btn-sm btn-outline" onclick="viewAppointment('${doc.id}')">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('Error loading appointment details:', error);
      }
    }
    
    todayContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading today appointments:', error);
    document.getElementById('today-appointments-list').innerHTML = '<p>Error al cargar citas de hoy: ' + error.message + '</p>';
  }
}

function showNewAppointmentModal() {
  const modalHTML = `
    <div class="modal-overlay" id="new-appointment-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('new-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Nueva Cita - Agenda 2025</h2>
        
        <form id="new-appointment-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Paciente *</label>
              <select class="form-select" id="appointment-patient" required>
                <option value="">Seleccionar paciente...</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Profesional *</label>
              <select class="form-select" id="appointment-professional" required>
                <option value="">Seleccionar profesional...</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha y hora *</label>
              <input type="datetime-local" class="form-input" id="appointment-datetime" required min="2025-01-01T08:00">
            </div>
            <div class="form-group">
              <label class="form-label">Duración (minutos)</label>
              <select class="form-select" id="appointment-duration">
                <option value="30">30 minutos</option>
                <option value="60" selected>60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de cita *</label>
            <select class="form-select" id="appointment-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="consulta_medica">Consulta médica</option>
              <option value="sesion_psicologica">Sesión psicológica</option>
              <option value="terapia_ocupacional">Terapia ocupacional</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="evaluacion_inicial">Evaluación inicial</option>
              <option value="revision_social">Revisión trabajo social</option>
              <option value="coordinacion">Coordinación</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Modalidad</label>
            <select class="form-select" id="appointment-modality">
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="telefonica">Telefónica</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea class="form-textarea" id="appointment-notes" placeholder="Notas adicionales sobre la cita..."></textarea>
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('new-appointment-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('new-appointment-modal').style.display = 'flex';
  
  // Cargar datos para los selects
  loadAppointmentFormData();
  
  // Manejar envío del formulario
  document.getElementById('new-appointment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveNewAppointment();
  });
}

async function loadAppointmentFormData() {
  try {
    // Cargar pacientes activos
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .limit(100)
      .get();
    
    const patientSelect = document.getElementById('appointment-patient');
    if (patientSelect) {
      patientSelect.innerHTML = '<option value="">Seleccionar paciente...</option>';
      patientsSnapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${data.datos_personales?.nombre_completo || 'Sin nombre'} - ${data.datos_personales?.rut || 'Sin RUT'}`;
        patientSelect.appendChild(option);
      });
    }
    
    // Cargar todos los profesionales activos
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    const professionalSelect = document.getElementById('appointment-professional');
    if (professionalSelect) {
      professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
      professionalsSnapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${data.nombre} - ${getProfessionName(data.profesion)}`;
        professionalSelect.appendChild(option);
      });
    }
    
  } catch (error) {
    console.error('Error loading appointment form data:', error);
  }
}

async function saveNewAppointment() {
  try {
    showLoading(true);
    
    const appointmentDateTime = new Date(document.getElementById('appointment-datetime').value);
    
    // Verificar que la fecha sea en 2025 o posterior
    if (appointmentDateTime.getFullYear() < 2025) {
      showNotification('Las citas deben programarse para el año 2025 en adelante', 'error');
      showLoading(false);
      return;
    }
    
    const appointmentData = {
      paciente_id: document.getElementById('appointment-patient').value,
      profesional_id: document.getElementById('appointment-professional').value,
      fecha: appointmentDateTime,
      duracion_minutos: parseInt(document.getElementById('appointment-duration').value),
      tipo_cita: document.getElementById('appointment-type').value,
      modalidad: document.getElementById('appointment-modality').value,
      notas_previas: document.getElementById('appointment-notes').value,
      estado: 'programado',
      creado_por: currentUserData.uid,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('citas').add(appointmentData);
    
    showNotification('Cita agendada correctamente para ' + appointmentDateTime.toLocaleDateString('es-CL'), 'success');
    closeModal('new-appointment-modal');
    loadCalendarView();
    loadTodayAppointments();
    
  } catch (error) {
    console.error('Error saving appointment:', error);
    showNotification('Error al agendar la cita: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}
