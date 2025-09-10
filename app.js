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
    setupRegistrationValidation();
    loadDraftIfExists();
    loadRegionsData();
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
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

  const nextBtn = document.getElementById('next-step');
  const prevBtn = document.getElementById('prev-step');
  const submitBtn = document.getElementById('submit-form');
  const saveDraftBtn = document.getElementById('save-draft');

  if (nextBtn) nextBtn.addEventListener('click', nextFormStep);
  if (prevBtn) prevBtn.addEventListener('click', prevFormStep);
  if (submitBtn) submitBtn.addEventListener('click', submitPatientForm);
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);

  const useLocationBtn = document.getElementById('use-location');
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', getCurrentLocation);
  }

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

// Multi-step form functionality
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

// Form Validation Setup
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

// Registration validation setup
function setupRegistrationValidation() {
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-password-confirm');
  
  if (passwordInput && confirmPasswordInput) {
    confirmPasswordInput.addEventListener('blur', function() {
      const password = passwordInput.value;
      const confirmPassword = this.value;
      
      if (confirmPassword && password !== confirmPassword) {
        this.classList.add('error');
        showNotification('Las contraseñas no coinciden', 'error');
      } else {
        this.classList.remove('error');
      }
    });
    
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      validatePasswordStrength(password, this);
    });
  }
  
  const emailInput = document.getElementById('register-email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const email = this.value.trim();
      if (email && !isValidEmail(email)) {
        this.classList.add('error');
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
      } else {
        this.classList.remove('error');
      }
    });
  }
  
  const licenseInput = document.getElementById('register-license');
  if (licenseInput) {
    licenseInput.addEventListener('blur', function() {
      const license = this.value.trim();
      if (license && license.length < 5) {
        this.classList.add('error');
        showNotification('El número de licencia debe tener al menos 5 caracteres', 'error');
      } else {
        this.classList.remove('error');
      }
    });
  }
}

function validatePasswordStrength(password, inputElement) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const strength = Object.values(requirements).filter(Boolean).length;
  
  let strengthIndicator = document.getElementById('password-strength');
  if (strengthIndicator) {
    strengthIndicator.remove();
  }
  
  strengthIndicator = document.createElement('div');
  strengthIndicator.id = 'password-strength';
  strengthIndicator.style.marginTop = '8px';
  strengthIndicator.style.fontSize = '12px';
  
  if (password.length > 0) {
    if (strength < 3) {
      strengthIndicator.style.color = 'var(--danger-red)';
      strengthIndicator.textContent = '🔴 Contraseña débil';
      inputElement.classList.add('error');
    } else if (strength < 4) {
      strengthIndicator.style.color = 'var(--warning-orange)';
      strengthIndicator.textContent = '🟡 Contraseña media';
      inputElement.classList.remove('error');
    } else {
      strengthIndicator.style.color = 'var(--success-green)';
      strengthIndicator.textContent = '🟢 Contraseña fuerte';
      inputElement.classList.remove('error');
    }
    
    inputElement.parentNode.appendChild(strengthIndicator);
  }
}

function validatePasswordStrengthScore(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  return Object.values(requirements).filter(Boolean).length;
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

// Professional Authentication Functions
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  showLoading(true);
  
  const formData = {
    name: document.getElementById('register-name').value.trim(),
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value,
    passwordConfirm: document.getElementById('register-password-confirm').value,
    profession: document.getElementById('register-profession').value,
    license: document.getElementById('register-license').value.trim(),
    center: document.getElementById('register-center').value,
    acceptTerms: document.getElementById('accept-terms').checked,
    acceptPrivacy: document.getElementById('accept-privacy').checked
  };

  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    showLoading(false);
    return;
  }

  if (!formData.acceptTerms || !formData.acceptPrivacy) {
    showNotification('Debes aceptar los términos y condiciones y la política de privacidad', 'error');
    showLoading(false);
    return;
  }

  if (formData.password !== formData.passwordConfirm) {
    showNotification('Las contraseñas no coinciden', 'error');
    showLoading(false);
    return;
  }

  if (!isValidEmail(formData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    showLoading(false);
    return;
  }

  if (formData.password.length < 8) {
    showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
    showLoading(false);
    return;
  }

  const passwordStrength = validatePasswordStrengthScore(formData.password);
  if (passwordStrength < 3) {
    showNotification('La contraseña es muy débil. Debe incluir mayúsculas, minúsculas y números', 'error');
    showLoading(false);
    return;
  }

  if (formData.license.length < 5) {
    showNotification('El número de licencia debe tener al menos 5 caracteres', 'error');
    showLoading(false);
    return;
  }

  try {
    const existingUserQuery = await db.collection('profesionales')
      .where('correo', '==', formData.email)
      .limit(1)
      .get();
    
    if (!existingUserQuery.empty) {
      showNotification('Ya existe una cuenta con este correo electrónico', 'error');
      showLoading(false);
      return;
    }

    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    await user.updateProfile({
      displayName: formData.name
    });
    
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
        fecha_activacion: firebase.firestore.FieldValue.serverTimestamp(),
        requiere_aprobacion: false
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

    await db.collection('profesionales').doc(user.uid).set(professionalData);
    
    try {
      await user.sendEmailVerification();
      showNotification('Se ha enviado un email de verificación a tu correo', 'info', 6000);
    } catch (emailError) {
      console.warn('No se pudo enviar email de verificación:', emailError);
    }
    
    await logProfessionalActivity(user.uid, 'registro_exitoso', {
      profesion: formData.profession,
      centro: formData.center
    });

    showNotification('¡Registro exitoso! Ya puedes iniciar sesión.', 'success', 5000);
    
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    document.getElementById('register-form').reset();
    document.getElementById('login-email').value = formData.email;
    document.getElementById('login-email').focus();
    
    await auth.signOut();
    
  } catch (error) {
    console.error('Error en registro:', error);
    
    let errorMessage = 'Error al registrar cuenta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Ya existe una cuenta con este correo electrónico';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del correo electrónico no es válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro está temporalmente deshabilitado';
        break;
      case 'permission-denied':
        errorMessage = 'No tienes permisos para crear esta cuenta';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
    if (error.code === 'permission-denied' && auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (deleteError) {
        console.error('Error limpiando usuario:', deleteError);
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

async function logProfessionalActivity(userId, action, details = {}) {
  try {
    await db.collection('actividad_profesionales').add({
      usuario_id: userId,
      accion: action,
      detalles: details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      ip: 'anonimizada',
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.warn('No se pudo registrar actividad:', error);
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

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!doc.exists) {
      showNotification('No se encontraron datos de usuario profesional', 'error');
      await auth.signOut();
      showLoading(false);
      return;
    }
    
    const userData = doc.data();
    
    if (!userData.configuracion_sistema?.activo) {
      showNotification('Tu cuenta está desactivada. Contacta al administrador.', 'error');
      await auth.signOut();
      showLoading(false);
      return;
    }
    
    currentUserData = { uid: user.uid, ...userData };
    
    await db.collection('profesionales').doc(user.uid).update({
      'estado_cuenta.fecha_ultimo_acceso': firebase.firestore.FieldValue.serverTimestamp(),
      'estado_cuenta.intentos_fallidos': 0,
      'metadata.ultima_actividad': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    await logProfessionalActivity(user.uid, 'login_exitoso', {
      profesion: userData.profesion
    });
    
    const nombreCompleto = userData.nombre;
    showNotification(`¡Bienvenido de vuelta, ${nombreCompleto}!`, 'success', 3000);
    
    closeModal('professional-modal');
    showProfessionalPanel(userData);
    
  } catch (error) {
    console.error('Error en login:', error);
    
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
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
    
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
        console.warn('No se pudo actualizar intentos fallidos:', updateError);
      }
    }
    
  } finally {
    showLoading(false);
  }
}

// Professional Panel Functions
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
  try {
    // Load basic metrics
    const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    const criticalCasesSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .get();
    
    // Update metric displays
    document.getElementById('pending-requests').textContent = solicitudesSnapshot.size;
    document.getElementById('critical-cases').textContent = criticalCasesSnapshot.size;
    
    // Load recent activity
    loadRecentActivity();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

async function loadRequests(userData) {
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
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
        <div class="card patient-card" data-id="${solicitudId}">
          <div class="patient-header">
            <div>
              <div class="patient-name">
                ${data.datos_personales.anonimo ? 'Usuario Anónimo' : 
                  data.datos_contacto.nombre_completo || 'Sin nombre'}
              </div>
              <div class="patient-id">ID: ${solicitudId.substring(0, 8).toUpperCase()}</div>
            </div>
            <div class="status-badge status-${data.clasificacion.estado}">
              ${data.clasificacion.estado}
            </div>
          </div>
          
          <div class="patient-info">
            <div><strong>Edad:</strong> ${data.datos_personales.edad} años</div>
            <div><strong>Región:</strong> ${regionesChile[data.datos_personales.region]?.nombre || data.datos_personales.region}</div>
            <div><strong>Prioridad:</strong> 
              <span class="priority-indicator priority-${data.clasificacion.prioridad}">
                ${data.clasificacion.prioridad.toUpperCase()}
              </span>
            </div>
            <div><strong>Fecha:</strong> ${formatDate(data.metadata.fecha_creacion)}</div>
          </div>
          
          ${data.evaluacion_inicial ? `
            <div style="margin-top: 12px;">
              <strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}
            </div>
          ` : ''}
          
          <div class="card-actions" style="margin-top: 16px;">
            <button class="btn btn-primary btn-sm" onclick="viewRequestDetails('${solicitudId}')">
              <i class="fas fa-eye"></i> Ver detalles
            </button>
            <button class="btn btn-success btn-sm" onclick="assignRequest('${solicitudId}')">
              <i class="fas fa-user-check"></i> Asignar
            </button>
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    document.getElementById('requests-list').innerHTML = 
      '<p style="color: var(--danger-red);">Error al cargar solicitudes</p>';
  }
}

async function loadRecentActivity() {
  try {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const snapshot = await db.collection('actividad_profesionales')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <div class="activity-item">
          <div class="activity-icon ${data.accion.includes('critico') ? 'critical' : 'new'}">
            <i class="fas fa-${data.accion.includes('login') ? 'sign-in-alt' : 'file-medical'}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${data.accion.replace('_', ' ')}</div>
            <div class="activity-time">${formatDate(data.timestamp)}</div>
          </div>
        </div>
      `;
    });
    
    activityList.innerHTML = html || '<p style="color: var(--gray-600);">No hay actividad reciente</p>';
    
  } catch (error) {
    console.error('Error loading activity:', error);
  }
}

function viewRequestDetails(solicitudId) {
  showNotification(`Abriendo detalles de solicitud ${solicitudId.substring(0, 8).toUpperCase()}`, 'info');
  // Aquí implementarías la lógica para mostrar detalles completos
}

function assignRequest(solicitudId) {
  showNotification(`Asignando solicitud ${solicitudId.substring(0, 8).toUpperCase()}`, 'info');
  // Aquí implementarías la lógica para asignar la solicitud
}

function startRealTimeListeners(userData) {
  // Listener para nuevas solicitudes críticas
  db.collection('alertas_criticas')
    .where('estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          showNotification(
            `🚨 ALERTA CRÍTICA: ${data.mensaje}`,
            'error',
            10000
          );
          
          // Actualizar badge de notificaciones
          const badge = document.getElementById('requests-badge');
          if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
          }
        }
      });
    }, error => {
      console.error('Error en listener de alertas:', error);
    });
  
  // Listener para nuevas solicitudes
  db.collection('solicitudes_ingreso')
    .where('clasificacion.estado', '==', 'pendiente')
    .onSnapshot(snapshot => {
      const pendingCount = snapshot.size;
      document.getElementById('pending-requests').textContent = pendingCount;
      
      // Actualizar badge
      const badge = document.getElementById('requests-badge');
      if (badge) {
        badge.textContent = pendingCount;
      }
    }, error => {
      console.error('Error en listener de solicitudes:', error);
    });
}

async function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    try {
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

// Center finder functions
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
        <div class="center-item">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 class="center-name">${center.name}</h4>
            <span style="color: var(--primary-blue); font-weight: 600;">${center.distance}</span>
          </div>
          <div class="center-info">
            <p><i class="fas fa-map-marker-alt"></i> ${center.address}</p>
            <p><i class="fas fa-phone"></i> ${center.phone}</p>
            <p><i class="fas fa-clock"></i> ${center.hours}</p>
          </div>
          <div class="center-actions">
            <button class="btn btn-outline" style="margin-right: 8px;">
              <i class="fas fa-directions"></i> Cómo llegar
            </button>
            <button class="btn btn-primary">
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
  regionesChile
};

console.log('SENDA Platform JavaScript loaded successfully');
