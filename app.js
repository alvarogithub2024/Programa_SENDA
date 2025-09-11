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
    comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"]
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
      loadNearbyClínicas();
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
    license: licenseElement ? licenseElement.value.trim() : '', // Verificación segura
    center: centerElement ? centerElement.value : '' // Verificación segura
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
      licencia: registrationData.license || 'No especificada', // Valor por defecto
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
        loadRequests(userData);
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
    
    // Actualizar métricas en el dashboard
    const totalPatientsElement = document.getElementById('total-patients');
    const pendingRequestsElement = document.getElementById('pending-requests');
    const criticalCasesElement = document.getElementById('critical-cases');
    
    if (totalPatientsElement) totalPatientsElement.textContent = pendingRequests.size;
    if (pendingRequestsElement) pendingRequestsElement.textContent = pendingRequests.size;
    if (criticalCasesElement) criticalCasesElement.textContent = criticalCases.size;
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadRequests(userData) {
  console.log('Loading requests for:', userData.nombre);
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // Obtener solicitudes según el rol del usuario
    let query = db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(20);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = '<p>No hay solicitudes disponibles.</p>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      
      html += `
        <div class="card patient-card">
          <div class="card-header">
            <div>
              <h3>Solicitud ${doc.id.substring(0, 8).toUpperCase()}</h3>
              <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
            </div>
            <div>
              <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
              <span class="status-badge status-${estado}">${estado}</span>
            </div>
          </div>
          <div class="patient-info">
            <div>Región: ${data.datos_personales?.region || 'N/A'}</div>
            <div>Tipo: ${data.datos_personales?.anonimo ? 'Anónimo' : 'Identificado'}</div>
            <div>Fecha: ${formatDate(data.metadata?.fecha_creacion)}</div>
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = '<p>Error al cargar las solicitudes.</p>';
    }
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

async function loadNearbyClínicas() {
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
  currentUserData,
  regionesChile,
  // Funciones de prueba
  testPatientForm: () => {
    showModal('patient-modal');
    updateFormProgress();
  },
  testProfessionalLogin: () => {
    showModal('professional-modal');
  },
  getCurrentFormData: () => formData,
  getCurrentUser: () => currentUserData
};
// ================= FUNCIONES CLÍNICAS ADICIONALES =================

// Funciones para el panel de Solicitudes (solo Asistentes Sociales)
async function loadRequestsPanel(userData) {
  console.log('Loading requests panel for:', userData.nombre);
  
  // Verificar si es asistente social
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
    
    // Obtener solicitudes pendientes
    let query = db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes pendientes en este momento.
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
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}')">
              <i class="fas fa-eye"></i> Revisar
            </button>
            ${!isInfoOnly ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
            </button>
            <button class="btn btn-secondary btn-sm" onclick="assignRequest('${doc.id}')">
              <i class="fas fa-user-plus"></i> Asignar
            </button>
            ` : `
            <button class="btn btn-success btn-sm" onclick="sendInformation('${doc.id}')">
              <i class="fas fa-envelope"></i> Enviar Info
            </button>
            `}
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = '<p>Error al cargar las solicitudes.</p>';
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
    showRequestModal(requestId, data);
  } catch (error) {
    console.error('Error reviewing request:', error);
    showNotification('Error al cargar la solicitud', 'error');
  }
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
    // Mostrar modal de asignación con lista de profesionales
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

// Funciones para el panel de Pacientes
async function loadPatientsPanel(userData) {
  console.log('Loading patients panel for:', userData.nombre);
  
  const patientsContainer = document.getElementById('patients-panel');
  if (!patientsContainer) return;
  
  // Agregar HTML del panel de pacientes si no existe
  if (!document.getElementById('patients-search')) {
    patientsContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Pacientes</h1>
        <p class="panel-subtitle">Busca y gestiona información de pacientes</p>
      </div>
      
      <div class="search-section">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="patients-search" class="search-input" placeholder="Buscar por nombre, RUT o ID de paciente...">
        </div>
      </div>
      
      <div class="filters-section">
        <div class="filter-group">
          <select class="form-select" id="filter-status-patient">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="en_tratamiento">En tratamiento</option>
            <option value="alta">Alta</option>
            <option value="derivado">Derivado</option>
          </select>
          
          <select class="form-select" id="filter-professional">
            <option value="">Todos los profesionales</option>
          </select>
          
          <button class="btn btn-outline" id="clear-patient-filters">
            <i class="fas fa-times"></i> Limpiar
          </button>
        </div>
      </div>
      
      <div id="patients-list">
        <!-- Los pacientes se cargarán aquí -->
      </div>
    `;
  }
  
  // Configurar eventos de búsqueda
  setupPatientsSearch();
  
  // Cargar lista de pacientes
  await loadPatientsList(userData);
}

function setupPatientsSearch() {
  const searchInput = document.getElementById('patients-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      searchPatients(this.value);
    }, 300));
  }
  
  const clearFilters = document.getElementById('clear-patient-filters');
  if (clearFilters) {
    clearFilters.addEventListener('click', function() {
      document.getElementById('patients-search').value = '';
      document.getElementById('filter-status-patient').value = '';
      document.getElementById('filter-professional').value = '';
      loadPatientsList(currentUserData);
    });
  }
}

async function loadPatientsList(userData, searchTerm = '') {
  try {
    const patientsList = document.getElementById('patients-list');
    if (!patientsList) return;
    
    patientsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
    
    let query = db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      patientsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en este momento.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const patient = data.datos_personales;
      const estado = data.estado_actual;
      
      // Filtrar por búsqueda si hay término
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientText = `${patient.nombre_completo} ${patient.rut} ${doc.id}`.toLowerCase();
        if (!patientText.includes(searchLower)) {
          return;
        }
      }
      
      html += `
        <div class="card patient-card" data-patient-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>${patient.nombre_completo || 'Sin nombre'}</h3>
              <p>RUT: ${patient.rut || 'Sin RUT'}</p>
              <p>ID: ${doc.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${estado.activo ? 'active' : 'inactive'}">
                ${estado.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div style="margin-top: 8px; font-size: 12px; color: var(--gray-600);">
                ${estado.programa || 'Sin programa'}
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Edad:</strong> ${patient.edad || 'N/A'} años</div>
            <div><strong>Región:</strong> ${patient.region || 'N/A'}</div>
            <div><strong>Comuna:</strong> ${patient.comuna || 'N/A'}</div>
            <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'N/A'}</div>
            <div><strong>Email:</strong> ${data.contacto?.email || 'N/A'}</div>
            <div><strong>Fecha Ingreso:</strong> ${formatDate(estado.fecha_ingreso)}</div>
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetails('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Ficha
            </button>
            <button class="btn btn-secondary btn-sm" onclick="editPatient('${doc.id}')">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-outline btn-sm" onclick="viewHistory('${doc.id}')">
              <i class="fas fa-history"></i> Historial
            </button>
          </div>
        </div>
      `;
    });
    
    if (html === '') {
      patientsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            No se encontraron pacientes con los criterios de búsqueda.
          </p>
        </div>
      `;
    } else {
      patientsList.innerHTML = html;
    }
    
  } catch (error) {
    console.error('Error loading patients:', error);
    const patientsList = document.getElementById('patients-list');
    if (patientsList) {
      patientsList.innerHTML = '<p>Error al cargar los pacientes.</p>';
    }
  }
}

async function searchPatients(searchTerm) {
  await loadPatientsList(currentUserData, searchTerm);
}

async function viewPatientDetails(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const data = doc.data();
    showPatientDetailsModal(patientId, data);
  } catch (error) {
    console.error('Error viewing patient details:', error);
    showNotification('Error al cargar los detalles del paciente', 'error');
  }
}

async function editPatient(patientId) {
  // Función para editar paciente - implementar según necesidades
  showNotification('Función de edición en desarrollo', 'info');
}

async function viewHistory(patientId) {
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
    showNotification('Error al cargar el historial del paciente', 'error');
  }
}
// ================= FUNCIONES PARA AGENDA =================

async function loadCalendarPanel(userData) {
  console.log('Loading calendar panel for:', userData.nombre);
  
  const calendarContainer = document.getElementById('calendar-panel');
  if (!calendarContainer) return;
  
  // Agregar HTML del panel de agenda si no existe
  if (!document.getElementById('professionals-list')) {
    calendarContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Gestiona citas y horarios de profesionales</p>
      </div>
      
      <div class="calendar-controls">
        <div class="calendar-navigation">
          <button class="btn btn-outline" id="prev-month">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span id="current-month-year">Marzo 2024</span>
          <button class="btn btn-outline" id="next-month">
            <i class="fas fa-chevron-right"></i>
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
          <h3>Profesionales</h3>
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
        <h3>Citas de Hoy</h3>
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
    
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta'])
      .get();
    
    let html = '';
    professionalsSnapshot.forEach(doc => {
      const data = doc.data();
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
    document.getElementById('professionals-list').innerHTML = '<p>Error al cargar profesionales</p>';
  }
}

let selectedProfessional = null;
let currentCalendarDate = new Date();

function selectProfessional(professionalId) {
  selectedProfessional = professionalId;
  
  // Actualizar UI
  document.querySelectorAll('.professional-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelector(`[data-professional-id="${professionalId}"]`).classList.add('selected');
  
  // Recargar calendario con las citas del profesional seleccionado
  loadCalendarView();
}

function setupCalendarEvents() {
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
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
            <div class="appointment-item" style="background: var(--primary-blue); color: white; font-size: 10px; padding: 2px 4px; margin: 1px 0; border-radius: 2px;">
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
    showNotification('Selecciona un profesional primero', 'warning');
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
      
      // Obtener datos del profesional
      const professionalDoc = await db.collection('profesionales').doc(data.profesional_id).get();
      const professionalData = professionalDoc.data();
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
      const patientData = patientDoc.data();
      
      html += `
        <div class="appointment-summary-item">
          <div class="appointment-time">
            ${new Date(data.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
          </div>
          <div class="appointment-details">
            <div class="appointment-patient">${patientData?.datos_personales?.nombre_completo || 'Paciente sin nombre'}</div>
            <div class="appointment-professional">${professionalData?.nombre || 'Profesional'} - ${getProfessionName(professionalData?.profesion)}</div>
            <div class="appointment-type">${data.tipo_cita || 'Consulta general'}</div>
          </div>
          <div class="appointment-actions">
            <button class="btn btn-sm btn-outline" onclick="viewAppointment('${doc.id}')">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    todayContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading today appointments:', error);
    document.getElementById('today-appointments-list').innerHTML = '<p>Error al cargar citas de hoy</p>';
  }
}

// ================= FUNCIONES PARA SEGUIMIENTOS =================

async function loadFollowupsPanel(userData) {
  console.log('Loading followups panel for:', userData.nombre);
  
  const followupsContainer = document.getElementById('followups-panel');
  if (!followupsContainer) return;
  
  // Agregar HTML del panel de seguimientos si no existe
  if (!document.getElementById('followups-search')) {
    followupsContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Gestiona el seguimiento de pacientes y registra evolución</p>
      </div>
      
      <div class="search-section">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="followups-search" class="search-input" placeholder="Buscar paciente por nombre o RUT...">
        </div>
      </div>
      
      <div class="filters-section">
        <div class="filter-group">
          <select class="form-select" id="filter-followup-status">
            <option value="">Todos los estados</option>
            <option value="programado">Programado</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
            <option value="pendiente">Pendiente</option>
          </select>
          
          <select class="form-select" id="filter-my-patients">
            <option value="all">Todos los pacientes</option>
            <option value="mine">Mis pacientes</option>
          </select>
          
          <button class="btn btn-outline" id="clear-followup-filters">
            <i class="fas fa-times"></i> Limpiar
          </button>
        </div>
      </div>
      
      <div id="followups-list">
        <!-- Los seguimientos se cargarán aquí -->
      </div>
    `;
  }
  
  setupFollowupsSearch();
  await loadFollowupsList(userData);
}

function setupFollowupsSearch() {
  const searchInput = document.getElementById('followups-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function() {
      searchFollowups(this.value);
    }, 300));
  }
  
  const filterMyPatients = document.getElementById('filter-my-patients');
  if (filterMyPatients) {
    filterMyPatients.addEventListener('change', function() {
      loadFollowupsList(currentUserData);
    });
  }
  
  const clearFilters = document.getElementById('clear-followup-filters');
  if (clearFilters) {
    clearFilters.addEventListener('click', function() {
      document.getElementById('followups-search').value = '';
      document.getElementById('filter-followup-status').value = '';
      document.getElementById('filter-my-patients').value = 'all';
      loadFollowupsList(currentUserData);
    });
  }
}

async function loadFollowupsList(userData, searchTerm = '') {
  try {
    const followupsList = document.getElementById('followups-list');
    if (!followupsList) return;
    
    followupsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>';
    
    // Obtener filtros
    const statusFilter = document.getElementById('filter-followup-status')?.value || '';
    const myPatientsFilter = document.getElementById('filter-my-patients')?.value || 'all';
    
    // Construir query base
    let query = db.collection('citas')
      .orderBy('fecha', 'desc')
      .limit(50);
    
    // Aplicar filtro de mis pacientes si está seleccionado
    if (myPatientsFilter === 'mine') {
      query = query.where('profesional_id', '==', userData.uid);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      followupsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos programados en este momento.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Aplicar filtro de estado si está seleccionado
      if (statusFilter && data.estado !== statusFilter) continue;
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
      const patientData = patientDoc.exists ? patientDoc.data() : null;
      
      // Obtener datos del profesional
      const professionalDoc = await db.collection('profesionales').doc(data.profesional_id).get();
      const professionalData = professionalDoc.exists ? professionalDoc.data() : null;
      
      if (!patientData || !professionalData) continue;
      
      // Filtrar por búsqueda si hay término
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const patientText = `${patientData.datos_personales?.nombre_completo} ${patientData.datos_personales?.rut}`.toLowerCase();
        if (!patientText.includes(searchLower)) continue;
      }
      
      const citaDate = data.fecha.toDate();
      const isToday = citaDate.toDateString() === new Date().toDateString();
      const isPast = citaDate < new Date();
      
      html += `
        <div class="card patient-card" data-followup-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>${patientData.datos_personales?.nombre_completo || 'Paciente sin nombre'}</h3>
              <p>RUT: ${patientData.datos_personales?.rut || 'Sin RUT'}</p>
              <p>Profesional: ${professionalData.nombre} (${getProfessionName(professionalData.profesion)})</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado || 'programado'}">
                ${data.estado || 'Programado'}
              </span>
              ${isToday ? '<div style="margin-top: 4px;"><span class="priority-indicator priority-alta">HOY</span></div>' : ''}
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Fecha:</strong> ${formatDate(data.fecha)}</div>
            <div><strong>Tipo:</strong> ${data.tipo_cita || 'Consulta general'}</div>
            <div><strong>Modalidad:</strong> ${data.modalidad || 'Presencial'}</div>
            <div><strong>Duración:</strong> ${data.duracion_minutos || 60} minutos</div>
            ${data.notas_previas ? `<div><strong>Notas:</strong> ${data.notas_previas}</div>` : ''}
            ${data.ultima_atencion ? `<div><strong>Última atención:</strong> ${formatDate(data.ultima_atencion)}</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            ${isPast ? `
              <button class="btn btn-primary btn-sm" onclick="addFollowupNote('${doc.id}')">
                <i class="fas fa-edit"></i> Registrar Atención
              </button>
            ` : `
              <button class="btn btn-success btn-sm" onclick="startFollowup('${doc.id}')">
                <i class="fas fa-play"></i> Iniciar Seguimiento
              </button>
            `}
            <button class="btn btn-outline btn-sm" onclick="viewPatientHistory('${data.paciente_id}')">
              <i class="fas fa-history"></i> Historial
            </button>
            <button class="btn btn-secondary btn-sm" onclick="rescheduleAppointment('${doc.id}')">
              <i class="fas fa-calendar-alt"></i> Reagendar
            </button>
          </div>
        </div>
      `;
    }
    
    if (html === '') {
      followupsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            No se encontraron seguimientos con los criterios seleccionados.
          </p>
        </div>
      `;
    } else {
      followupsList.innerHTML = html;
    }
    
  } catch (error) {
    console.error('Error loading followups:', error);
    const followupsList = document.getElementById('followups-list');
    if (followupsList) {
      followupsList.innerHTML = '<p>Error al cargar los seguimientos.</p>';
    }
  }
}

async function searchFollowups(searchTerm) {
  await loadFollowupsList(currentUserData, searchTerm);
}

async function addFollowupNote(citaId) {
  try {
    const citaDoc = await db.collection('citas').doc(citaId).get();
    if (!citaDoc.exists) {
      showNotification('Cita no encontrada', 'error');
      return;
    }
    
    const citaData = citaDoc.data();
    showFollowupNoteModal(citaId, citaData);
    
  } catch (error) {
    console.error('Error loading followup note:', error);
    showNotification('Error al cargar la cita', 'error');
  }
}

async function startFollowup(citaId) {
  try {
    // Actualizar estado de la cita
    await db.collection('citas').doc(citaId).update({
      estado: 'en_curso',
      fecha_inicio: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification('Seguimiento iniciado', 'success');
    loadFollowupsList(currentUserData);
    
  } catch (error) {
    console.error('Error starting followup:', error);
    showNotification('Error al iniciar el seguimiento', 'error');
  }
}

async function rescheduleAppointment(citaId) {
  // Función para reagendar cita - implementar según necesidades
  showNotification('Función de reagendamiento en desarrollo', 'info');
}
// ================= ACTUALIZACIÓN DE FUNCIÓN SHOWPANEL =================

// REEMPLAZA la función showPanel existente con esta versión actualizada:
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
        loadRequestsPanel(userData);  // Nueva función
        break;
      case 'patients':
        loadPatientsPanel(userData);  // Nueva función
        break;
      case 'calendar':
        loadCalendarPanel(userData);  // Nueva función
        break;
      case 'followups':
        loadFollowupsPanel(userData); // Nueva función
        break;
      case 'reports':
        loadReportsPanel(userData);   // Nueva función
        break;
    }
  }
}

// ================= FUNCIONES AUXILIARES ADICIONALES =================

function showNewAppointmentModal() {
  const modalHTML = `
    <div class="modal-overlay" id="new-appointment-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('new-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Nueva Cita</h2>
        
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
              <input type="datetime-local" class="form-input" id="appointment-datetime" required>
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
    
    // Cargar profesionales activos
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta'])
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
    
    const appointmentData = {
      paciente_id: document.getElementById('appointment-patient').value,
      profesional_id: document.getElementById('appointment-professional').value,
      fecha: new Date(document.getElementById('appointment-datetime').value),
      duracion_minutos: parseInt(document.getElementById('appointment-duration').value),
      tipo_cita: document.getElementById('appointment-type').value,
      modalidad: document.getElementById('appointment-modality').value,
      notas_previas: document.getElementById('appointment-notes').value,
      estado: 'programado',
      creado_por: currentUserData.uid,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('citas').add(appointmentData);
    
    showNotification('Cita agendada correctamente', 'success');
    closeModal('new-appointment-modal');
    loadCalendarView();
    loadTodayAppointments();
    
  } catch (error) {
    console.error('Error saving appointment:', error);
    showNotification('Error al agendar la cita', 'error');
  } finally {
    showLoading(false);
  }
}

function showDayAppointmentsModal(selectedDate, professionalId) {
  const dateStr = selectedDate.toLocaleDateString('es-CL');
  
  const modalHTML = `
    <div class="modal-overlay" id="day-appointments-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('day-appointments-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Citas del ${dateStr}</h2>
        
        <div id="day-appointments-content">
          <div class="loading"><div class="spinner"></div> Cargando citas...</div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-primary" onclick="addAppointmentToDay('${selectedDate.toISOString()}', '${professionalId}')">
            <i class="fas fa-plus"></i> Agregar Cita
          </button>
          <button class="btn btn-outline" onclick="closeModal('day-appointments-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('day-appointments-modal').style.display = 'flex';
  
  // Cargar citas del día
  loadDayAppointments(selectedDate, professionalId);
}

async function loadDayAppointments(selectedDate, professionalId) {
  try {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('profesional_id', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    const content = document.getElementById('day-appointments-content');
    if (!content) return;
    
    if (appointmentsSnapshot.empty) {
      content.innerHTML = '<p style="text-align: center; color: var(--gray-600);">No hay citas programadas para este día</p>';
      return;
    }
    
    let html = '';
    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
      const patientData = patientDoc.exists ? patientDoc.data() : null;
      
      html += `
        <div class="appointment-item-detailed">
          <div class="appointment-time">
            ${new Date(data.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
          </div>
          <div class="appointment-info">
            <h4>${patientData?.datos_personales?.nombre_completo || 'Paciente sin nombre'}</h4>
            <p>${data.tipo_cita || 'Consulta general'} - ${data.modalidad || 'Presencial'}</p>
            <p>Duración: ${data.duracion_minutos || 60} minutos</p>
            ${data.notas_previas ? `<p><em>${data.notas_previas}</em></p>` : ''}
          </div>
          <div class="appointment-actions">
            <button class="btn btn-sm btn-outline" onclick="editAppointment('${doc.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${doc.id}')">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    content.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading day appointments:', error);
    const content = document.getElementById('day-appointments-content');
    if (content) {
      content.innerHTML = '<p>Error al cargar las citas del día</p>';
    }
  }
}

function addAppointmentToDay(dateISO, professionalId) {
  closeModal('day-appointments-modal');
  showNewAppointmentModal();
  
  // Pre-rellenar fecha y profesional
  setTimeout(() => {
    const datetimeInput = document.getElementById('appointment-datetime');
    const professionalSelect = document.getElementById('appointment-professional');
    
    if (datetimeInput) {
      const date = new Date(dateISO);
      // Establecer hora por defecto (ej: 9:00 AM)
      date.setHours(9, 0, 0, 0);
      datetimeInput.value = date.toISOString().slice(0, 16);
    }
    
    if (professionalSelect) {
      professionalSelect.value = professionalId;
    }
  }, 100);
}

async function viewAppointment(appointmentId) {
  try {
    const doc = await db.collection('citas').doc(appointmentId).get();
    if (!doc.exists) {
      showNotification('Cita no encontrada', 'error');
      return;
    }
    
    const data = doc.data();
    // Mostrar modal con detalles de la cita
    showNotification('Vista detallada de cita en desarrollo', 'info');
    
  } catch (error) {
    console.error('Error viewing appointment:', error);
    showNotification('Error al cargar la cita', 'error');
  }
}

async function editAppointment(appointmentId) {
  showNotification('Edición de citas en desarrollo', 'info');
}

async function cancelAppointment(appointmentId) {
  if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
  
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'cancelado',
      fecha_cancelacion: firebase.firestore.FieldValue.serverTimestamp(),
      cancelado_por: currentUserData.uid
    });
    
    showNotification('Cita cancelada', 'success');
    closeModal('day-appointments-modal');
    loadCalendarView();
    
  } catch (error) {
    console.error('Error canceling appointment:', error);
    showNotification('Error al cancelar la cita', 'error');
  }
}

function showPatientHistoryModal(patientId, patientData) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-history-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-history-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Historial Clínico</h2>
        <h3>${patientData.datos_personales?.nombre_completo || 'Paciente sin nombre'}</h3>
        
        <div class="patient-history-content">
          ${generateHistoryModalHTML(patientData.historial_clinico || [])}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-primary" onclick="generatePatientReport('${patientId}', 'historial_atencion')">
            <i class="fas fa-file-pdf"></i> Descargar Historial
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-history-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-history-modal').style.display = 'flex';
}

function generateHistoryModalHTML(historial) {
  if (!historial || historial.length === 0) {
    return '<p style="text-align: center; color: var(--gray-600);">No hay registros en el historial clínico.</p>';
  }
  
  return historial.map(entry => `
    <div class="history-entry">
      <div class="history-header">
        <span class="history-date">${formatDate(entry.fecha)}</span>
        <span class="history-type">${entry.tipo || 'Consulta general'}</span>
      </div>
      ${entry.profesional_nombre ? `<div class="history-professional">Profesional: ${entry.profesional_nombre}</div>` : ''}
      ${entry.observaciones ? `
        <div class="history-section">
          <strong>Observaciones:</strong>
          <p>${entry.observaciones}</p>
        </div>
      ` : ''}
      ${entry.diagnostico ? `
        <div class="history-section">
          <strong>Diagnóstico:</strong>
          <p>${entry.diagnostico}</p>
        </div>
      ` : ''}
      ${entry.tratamiento ? `
        <div class="history-section">
          <strong>Tratamiento:</strong>
          <p>${entry.tratamiento}</p>
        </div>
      ` : ''}
      ${entry.estado_paciente ? `
        <div class="history-status">
          Estado: <span class="status-badge status-${entry.estado_paciente}">${entry.estado_paciente}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function showPatientReportPreview(patientId, patientData) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-report-preview-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-report-preview-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Vista Previa del Reporte</h2>
        
        <div class="report-preview-content">
          <div class="report-header">
            <h3>SENDA - Sistema de Gestión Integral</h3>
            <h4>Ficha Clínica Completa</h4>
            <p>Paciente: ${patientData.datos_personales?.nombre_completo || 'Sin nombre'}</p>
          </div>
          
          <div class="report-section">
            <h4>Información del Paciente</h4>
            <div class="info-grid">
              <div><strong>Nombre:</strong> ${patientData.datos_personales?.nombre_completo || 'N/A'}</div>
              <div><strong>RUT:</strong> ${patientData.datos_personales?.rut || 'N/A'}</div>
              <div><strong>Edad:</strong> ${patientData.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Región:</strong> ${patientData.datos_personales?.region || 'N/A'}</div>
              <div><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${patientData.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="report-section">
            <h4>Estado Actual</h4>
            <p><strong>Estado:</strong> ${patientData.estado_actual?.activo ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Programa:</strong> ${patientData.estado_actual?.programa || 'Sin programa'}</p>
            <p><strong>Fecha Ingreso:</strong> ${formatDate(patientData.estado_actual?.fecha_ingreso)}</p>
          </div>
          
          <div class="report-section">
            <h4>Historial Clínico (${patientData.historial_clinico?.length || 0} registros)</h4>
            ${generateHistoryHTML(patientData.historial_clinico || [])}
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-primary" onclick="generatePatientReport('${patientId}', 'ficha_completa')">
            <i class="fas fa-download"></i> Descargar PDF
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-report-preview-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-report-preview-modal').style.display = 'flex';
}

async function generateBulkReports() {
  showNotification('Generación masiva de reportes en desarrollo', 'info');
}

async function exportStatisticsReport() {
  showNotification('Exportación de estadísticas en desarrollo', 'info');
}

// Sobrescribir la función closeModal existente para manejar modales dinámicos
const originalCloseModal = closeModal;
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
         'day-appointments-modal'].includes(modalId)) {
      modal.remove();
    }
  }
}

// ================= ACTUALIZACIONES A LOADREQUESTS =================

// REEMPLAZA la función loadRequests existente con esta línea:
async function loadRequests(userData) {
  await loadRequestsPanel(userData);
}

console.log('Funciones clínicas cargadas correctamente');
console.log('SENDA Platform JavaScript loaded successfully');
console.log('Sistema cargado - Todos los botones deberían funcionar correctamente');
console.log('Funciones de debug disponibles en window.sendaApp');
