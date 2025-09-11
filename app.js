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

// CESFAM de la Región Metropolitana con coordenadas
const cesfamRegionMetropolitana = {
  "cesfam_alejandro_del_rio": {
    nombre: "CESFAM Alejandro del Río",
    comuna: "Independencia",
    direccion: "Santos Dumont 3292, Independencia",
    telefono: "+56 2 2735 6000",
    lat: -33.415,
    lng: -70.662,
    horario: "08:00 - 17:00"
  },
  "cesfam_arturo_baeza_goni": {
    nombre: "CESFAM Arturo Baeza Goñi",
    comuna: "Independencia", 
    direccion: "Profesor Zañartu 1180, Independencia",
    telefono: "+56 2 2735 6100",
    lat: -33.415,
    lng: -70.658,
    horario: "08:00 - 17:00"
  },
  "cesfam_garín": {
    nombre: "CESFAM Garín",
    comuna: "Independencia",
    direccion: "Garín 1351, Independencia", 
    telefono: "+56 2 2735 6200",
    lat: -33.409,
    lng: -70.659,
    horario: "08:00 - 17:00"
  },
  "cesfam_norte": {
    nombre: "CESFAM Norte",
    comuna: "Independencia",
    direccion: "Panamericana Norte 2176, Independencia",
    telefono: "+56 2 2735 6300",
    lat: -33.400,
    lng: -70.661,
    horario: "08:00 - 17:00"
  },
  "cesfam_cerrillos": {
    nombre: "CESFAM Cerrillos",
    comuna: "Cerrillos",
    direccion: "Los Cerrillos 5698, Cerrillos",
    telefono: "+56 2 2858 7000",
    lat: -33.497,
    lng: -70.727,
    horario: "08:00 - 17:00"
  },
  "cesfam_dr_steeger": {
    nombre: "CESFAM Dr. Steeger",
    comuna: "Cerro Navia",
    direccion: "Maipú 5575, Cerro Navia",
    telefono: "+56 2 2858 7100",
    lat: -33.428,
    lng: -70.734,
    horario: "08:00 - 17:00"
  },
  "cesfam_cerro_navia": {
    nombre: "CESFAM Cerro Navia",
    comuna: "Cerro Navia",
    direccion: "José Joaquín Prieto 6695, Cerro Navia",
    telefono: "+56 2 2858 7200",
    lat: -33.425,
    lng: -70.732,
    horario: "08:00 - 17:00"
  },
  "cesfam_conchalí": {
    nombre: "CESFAM Conchalí",
    comuna: "Conchalí",
    direccion: "Vivaceta 150, Conchalí",
    telefono: "+56 2 2858 7300",
    lat: -33.390,
    lng: -70.671,
    horario: "08:00 - 17:00"
  },
  "cesfam_jose_joaquín_aguirre": {
    nombre: "CESFAM José Joaquín Aguirre",
    comuna: "Conchalí",
    direccion: "Américo Vespucio 1291, Conchalí",
    telefono: "+56 2 2858 7400",
    lat: -33.382,
    lng: -70.662,
    horario: "08:00 - 17:00"
  },
  "cesfam_el_bosque": {
    nombre: "CESFAM El Bosque",
    comuna: "El Bosque",
    direccion: "José Miguel Carrera 8351, El Bosque",
    telefono: "+56 2 2858 7500",
    lat: -33.567,
    lng: -70.679,
    horario: "08:00 - 17:00"
  },
  "cesfam_clara_estrella": {
    nombre: "CESFAM Clara Estrella",
    comuna: "El Bosque", 
    direccion: "Clara Estrella 3401, El Bosque",
    telefono: "+56 2 2858 7600",
    lat: -33.563,
    lng: -70.687,
    horario: "08:00 - 17:00"
  },
  "cesfam_padre_orellana": {
    nombre: "CESFAM Padre Orellana",
    comuna: "El Bosque",
    direccion: "Padre Orellana 1895, El Bosque",
    telefono: "+56 2 2858 7700",
    lat: -33.569,
    lng: -70.681,
    horario: "08:00 - 17:00"
  },
  "cesfam_estación_central": {
    nombre: "CESFAM Estación Central",
    comuna: "Estación Central",
    direccion: "Alameda 3101, Estación Central",
    telefono: "+56 2 2858 7800",
    lat: -33.453,
    lng: -70.684,
    horario: "08:00 - 17:00"
  },
  "cesfam_dr_carlos_cardoen": {
    nombre: "CESFAM Dr. Carlos Cardoen",
    comuna: "Estación Central",
    direccion: "Carlos Cardoen 5045, Estación Central",
    telefono: "+56 2 2858 7900",
    lat: -33.456,
    lng: -70.691,
    horario: "08:00 - 17:00"
  },
  "cesfam_huechuraba": {
    nombre: "CESFAM Huechuraba",
    comuna: "Huechuraba",
    direccion: "Recoleta 1502, Huechuraba",
    telefono: "+56 2 2858 8000",
    lat: -33.366,
    lng: -70.637,
    horario: "08:00 - 17:00"
  },
  "cesfam_dr_francisco_mardones": {
    nombre: "CESFAM Dr. Francisco Mardones",
    comuna: "Huechuraba",
    direccion: "Francisco Mardones 14201, Huechuraba",
    telefono: "+56 2 2858 8100",
    lat: -33.361,
    lng: -70.644,
    horario: "08:00 - 17:00"
  },
  "cesfam_la_cisterna": {
    nombre: "CESFAM La Cisterna",
    comuna: "La Cisterna",
    direccion: "Santa Rosa 7001, La Cisterna",
    telefono: "+56 2 2858 8200",
    lat: -33.533,
    lng: -70.661,
    horario: "08:00 - 17:00"
  },
  "cesfam_el_roble": {
    nombre: "CESFAM El Roble",
    comuna: "La Cisterna",
    direccion: "El Roble 1298, La Cisterna",
    telefono: "+56 2 2858 8300",
    lat: -33.527,
    lng: -70.665,
    horario: "08:00 - 17:00"
  },
  "cesfam_la_florida": {
    nombre: "CESFAM La Florida",
    comuna: "La Florida",
    direccion: "Vicuña Mackenna 12881, La Florida",
    telefono: "+56 2 2858 8400",
    lat: -33.518,
    lng: -70.590,
    horario: "08:00 - 17:00"
  },
  "cesfam_villa_o_higgins": {
    nombre: "CESFAM Villa O'Higgins",
    comuna: "La Florida",
    direccion: "Vicente Pérez Rosales 8351, La Florida",
    telefono: "+56 2 2858 8500",
    lat: -33.532,
    lng: -70.584,
    horario: "08:00 - 17:00"
  },
  "cesfam_los_castaños": {
    nombre: "CESFAM Los Castaños",
    comuna: "La Florida",
    direccion: "Los Castaños 2301, La Florida",
    telefono: "+56 2 2858 8600",
    lat: -33.516,
    lng: -70.581,
    horario: "08:00 - 17:00"
  },
  "cesfam_la_granja": {
    nombre: "CESFAM La Granja",
    comuna: "La Granja", 
    direccion: "Santa Rosa 10598, La Granja",
    telefono: "+56 2 2858 8700",
    lat: -33.555,
    lng: -70.655,
    horario: "08:00 - 17:00"
  },
  "cesfam_laurita_vicuña": {
    nombre: "CESFAM Laurita Vicuña",
    comuna: "La Granja",
    direccion: "San Francisco 9698, La Granja",
    telefono: "+56 2 2858 8800",
    lat: -33.548,
    lng: -70.657,
    horario: "08:00 - 17:00"
  },
  "cesfam_la_pintana": {
    nombre: "CESFAM La Pintana",
    comuna: "La Pintana",
    direccion: "Observatorio 2015, La Pintana",
    telefono: "+56 2 2858 8900",
    lat: -33.584,
    lng: -70.634,
    horario: "08:00 - 17:00"
  },
  "cesfam_recreo": {
    nombre: "CESFAM Recreo",
    comuna: "La Pintana",
    direccion: "Recreo 6151, La Pintana",
    telefono: "+56 2 2858 9000",
    lat: -33.581,
    lng: -70.628,
    horario: "08:00 - 17:00"
  },
  "cesfam_la_reina": {
    nombre: "CESFAM La Reina",
    comuna: "La Reina",
    direccion: "Larraín 9502, La Reina",
    telefono: "+56 2 2858 9100",
    lat: -33.458,
    lng: -70.540,
    horario: "08:00 - 17:00"
  },
  "cesfam_las_condes": {
    nombre: "CESFAM Las Condes",
    comuna: "Las Condes",
    direccion: "Apoquindo 3600, Las Condes",
    telefono: "+56 2 2858 9200",
    lat: -33.413,
    lng: -70.550,
    horario: "08:00 - 17:00"
  },
  "cesfam_lo_barnechea": {
    nombre: "CESFAM Lo Barnechea",
    comuna: "Lo Barnechea",
    direccion: "Av. Lo Barnechea 6001, Lo Barnechea",
    telefono: "+56 2 2858 9300",
    lat: -33.348,
    lng: -70.508,
    horario: "08:00 - 17:00"
  },
  "cesfam_lo_espejo": {
    nombre: "CESFAM Lo Espejo",
    comuna: "Lo Espejo",
    direccion: "Central 1395, Lo Espejo",
    telefono: "+56 2 2858 9400",
    lat: -33.518,
    lng: -70.694,
    horario: "08:00 - 17:00"
  },
  "cesfam_lo_prado": {
    nombre: "CESFAM Lo Prado",
    comuna: "Lo Prado",
    direccion: "San Pablo 5801, Lo Prado",
    telefono: "+56 2 2858 9500",
    lat: -33.444,
    lng: -70.720,
    horario: "08:00 - 17:00"
  },
  "cesfam_macul": {
    nombre: "CESFAM Macul",
    comuna: "Macul",
    direccion: "Macul 7100, Macul",
    telefono: "+56 2 2858 9600",
    lat: -33.482,
    lng: -70.602,
    horario: "08:00 - 17:00"
  },
  "cesfam_maipu": {
    nombre: "CESFAM Maipú",
    comuna: "Maipú",
    direccion: "Américo Vespucio 1501, Maipú",
    telefono: "+56 2 2858 9700",
    lat: -33.508,
    lng: -70.758,
    horario: "08:00 - 17:00"
  },
  "cesfam_clotario_blest": {
    nombre: "CESFAM Clotario Blest",
    comuna: "Maipú",
    direccion: "Clotario Blest 1801, Maipú", 
    telefono: "+56 2 2858 9800",
    lat: -33.503,
    lng: -70.764,
    horario: "08:00 - 17:00"
  },
  "cesfam_ñuñoa": {
    nombre: "CESFAM Ñuñoa",
    comuna: "Ñuñoa",
    direccion: "Irarrázaval 2757, Ñuñoa",
    telefono: "+56 2 2858 9900",
    lat: -33.456,
    lng: -70.598,
    horario: "08:00 - 17:00"
  },
  "cesfam_ricardo_gutierrez": {
    nombre: "CESFAM Ricardo Gutiérrez",
    comuna: "Ñuñoa",
    direccion: "Ricardo Gutiérrez 4601, Ñuñoa",
    telefono: "+56 2 2859 0000",
    lat: -33.463,
    lng: -70.592,
    horario: "08:00 - 17:00"
  },
  "cesfam_pedro_aguirre_cerda": {
    nombre: "CESFAM Pedro Aguirre Cerda",
    comuna: "Pedro Aguirre Cerda",
    direccion: "Pedro Aguirre Cerda 7000, PAC",
    telefono: "+56 2 2859 0100",
    lat: -33.489,
    lng: -70.657,
    horario: "08:00 - 17:00"
  },
  "cesfam_peñalolen": {
    nombre: "CESFAM Peñalolén",
    comuna: "Peñalolén",
    direccion: "Grecia 8201, Peñalolén",
    telefono: "+56 2 2859 0200",
    lat: -33.479,
    lng: -70.551,
    horario: "08:00 - 17:00"
  },
  "cesfam_carol_urzua": {
    nombre: "CESFAM Carol Urzúa",
    comuna: "Peñalolén",
    direccion: "Carol Urzúa 2980, Peñalolén",
    telefono: "+56 2 2859 0300",
    lat: -33.484,
    lng: -70.548,
    horario: "08:00 - 17:00"
  },
  "cesfam_providencia": {
    nombre: "CESFAM Providencia",
    comuna: "Providencia",
    direccion: "Pocuro 499, Providencia",
    telefono: "+56 2 2859 0400",
    lat: -33.426,
    lng: -70.614,
    horario: "08:00 - 17:00"
  },
  "cesfam_pudahuel": {
    nombre: "CESFAM Pudahuel",
    comuna: "Pudahuel",
    direccion: "San Pablo 11501, Pudahuel",
    telefono: "+56 2 2859 0500",
    lat: -33.448,
    lng: -70.759,
    horario: "08:00 - 17:00"
  },
  "cesfam_violeta_parra": {
    nombre: "CESFAM Violeta Parra",
    comuna: "Pudahuel",
    direccion: "Violeta Parra 3801, Pudahuel",
    telefono: "+56 2 2859 0600",
    lat: -33.441,
    lng: -70.766,
    horario: "08:00 - 17:00"
  },
  "cesfam_quilicura": {
    nombre: "CESFAM Quilicura",
    comuna: "Quilicura",
    direccion: "Matta 840, Quilicura",
    telefono: "+56 2 2859 0700",
    lat: -33.360,
    lng: -70.728,
    horario: "08:00 - 17:00"
  },
  "cesfam_quinta_normal": {
    nombre: "CESFAM Quinta Normal",
    comuna: "Quinta Normal",
    direccion: "Carrascal 5201, Quinta Normal",
    telefono: "+56 2 2859 0800",
    lat: -33.415,
    lng: -70.698,
    horario: "08:00 - 17:00"
  },
  "cesfam_recoleta": {
    nombre: "CESFAM Recoleta",
    comuna: "Recoleta",
    direccion: "Recoleta 1290, Recoleta",
    telefono: "+56 2 2859 0900",
    lat: -33.415,
    lng: -70.645,
    horario: "08:00 - 17:00"
  },
  "cesfam_renca": {
    nombre: "CESFAM Renca",
    comuna: "Renca",
    direccion: "Argomedo 6001, Renca",
    telefono: "+56 2 2859 1000",
    lat: -33.408,
    lng: -70.696,
    horario: "08:00 - 17:00"
  },
  "cesfam_santiago_centro": {
    nombre: "CESFAM Santiago Centro",
    comuna: "Santiago",
    direccion: "San Francisco 8405, Santiago",
    telefono: "+56 2 2859 1100",
    lat: -33.456,
    lng: -70.649,
    horario: "08:00 - 17:00"
  },
  "cesfam_san_joaquín": {
    nombre: "CESFAM San Joaquín",
    comuna: "San Joaquín",
    direccion: "Vicuña Mackenna 7630, San Joaquín",
    telefono: "+56 2 2859 1200",
    lat: -33.497,
    lng: -70.630,
    horario: "08:00 - 17:00"
  },
  "cesfam_san_miguel": {
    nombre: "CESFAM San Miguel",
    comuna: "San Miguel",
    direccion: "El Llano 1101, San Miguel",
    telefono: "+56 2 2859 1300",
    lat: -33.497,
    lng: -70.648,
    horario: "08:00 - 17:00"
  },
  "cesfam_san_ramón": {
    nombre: "CESFAM San Ramón",
    comuna: "San Ramón",
    direccion: "Santa Rosa 12201, San Ramón",
    telefono: "+56 2 2859 1400",
    lat: -33.582,
    lng: -70.651,
    horario: "08:00 - 17:00"
  },
  "cesfam_vitacura": {
    nombre: "CESFAM Vitacura",
    comuna: "Vitacura",
    direccion: "Vitacura 7630, Vitacura",
    telefono: "+56 2 2859 1500",
    lat: -33.395,
    lng: -70.571,
    horario: "08:00 - 17:00"
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

// Variables para la agenda - MODIFICADO PARA MES ACTUAL
let selectedProfessional = null;
let currentCalendarDate = new Date(); // AHORA INICIA EN MES ACTUAL

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
         'day-appointments-modal', 'assignment-modal', 'reentry-modal'].includes(modalId)) {
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
    'terapeuta': 'Terapeuta Ocupacional'
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

// Función para calcular distancia entre dos puntos
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Función para cargar CESFAM en select
function loadCesfamOptions() {
  const cesfamSelects = document.querySelectorAll('#patient-cesfam, #reentry-cesfam, #register-center');
  
  cesfamSelects.forEach(select => {
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar CESFAM...</option>';
    Object.keys(cesfamRegionMetropolitana).forEach(key => {
      const cesfam = cesfamRegionMetropolitana[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = cesfam.nombre;
      select.appendChild(option);
    });
  });
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
    loadCesfamOptions(); // NUEVA FUNCIÓN PARA CARGAR CESFAM
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

function initializeEventListeners() {
  // Main action buttons
  const registerBtn = document.getElementById('register-patient');
  const loginBtn = document.getElementById('login-professional');
  const aboutBtn = document.getElementById('about-program');
  const findCenterBtn = document.getElementById('find-center');
  const reentryBtn = document.getElementById('reentry-program'); // MODIFICADO

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

  // NUEVO: Manejo del botón de reingreso
  if (reentryBtn) {
    reentryBtn.addEventListener('click', () => {
      showModal('reentry-modal');
    });
  }

  // Form submissions
  const patientForm = document.getElementById('patient-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const reentryForm = document.getElementById('reentry-form'); // NUEVO

  if (patientForm) {
    patientForm.addEventListener('submit', handlePatientRegistration);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleProfessionalLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleProfessionalRegistration);
  }

  // NUEVO: Manejo del formulario de reingreso
  if (reentryForm) {
    reentryForm.addEventListener('submit', handleReentrySubmission);
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

  // NUEVO: Búsqueda de pacientes en reportes
  const searchPatientBtn = document.getElementById('search-patient-btn');
  if (searchPatientBtn) {
    searchPatientBtn.addEventListener('click', searchPatient);
  }
}

// FUNCIÓN MODIFICADA: Manejo del formulario de reingreso
async function handleReentrySubmission(e) {
  e.preventDefault();
  showLoading(true);
  
  try {
    const reentryData = {
      nombre_completo: document.getElementById('reentry-name').value.trim(),
      rut: document.getElementById('reentry-rut').value.trim(),
      telefono: document.getElementById('reentry-phone').value.trim(),
      correo: document.getElementById('reentry-email').value.trim(),
      cesfam: document.getElementById('reentry-cesfam').value,
      motivo_reingreso: document.getElementById('reentry-reason').value.trim()
    };

    // Validaciones mejoradas
    if (!reentryData.nombre_completo || !reentryData.rut || !reentryData.telefono || 
        !reentryData.correo || !reentryData.cesfam || !reentryData.motivo_reingreso) {
      showNotification('Todos los campos son obligatorios', 'error');
      return;
    }

    // Validar RUT
    if (!validateRUT(reentryData.rut)) {
      showNotification('El RUT ingresado no es válido', 'error');
      return;
    }

    // Validar email
    if (!isValidEmail(reentryData.correo)) {
      showNotification('El correo electrónico no es válido', 'error');
      return;
    }

    // Validar motivo (mínimo 10 caracteres)
    if (reentryData.motivo_reingreso.length < 10) {
      showNotification('El motivo debe tener al menos 10 caracteres', 'error');
      return;
    }

    // Verificar si ya existe en el sistema
    const existingPatient = await db.collection('pacientes')
      .where('datos_personales.rut', '==', reentryData.rut)
      .get();

    // Crear solicitud de reingreso en Firebase
    const reingreso = {
      tipo_solicitud: 'reingreso',
      datos_personales: {
        nombre_completo: reentryData.nombre_completo,
        rut: reentryData.rut,
        telefono: reentryData.telefono,
        correo: reentryData.correo
      },
      cesfam_asignado: reentryData.cesfam,
      motivo_reingreso: reentryData.motivo_reingreso,
      paciente_existente: !existingPatient.empty,
      estado: 'pendiente',
      prioridad: 'alta',
      fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_publica',
        tipo: 'reingreso'
      }
    };

    await db.collection('solicitudes_reingreso').add(reingreso);

    showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 6000);
    closeModal('reentry-modal');
    document.getElementById('reentry-form').reset();

  } catch (error) {
    console.error('Error submitting reentry:', error);
    showNotification('Error al enviar la solicitud de reingreso: ' + error.message, 'error');
  } finally {
    showLoading(false);
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
  // Validación de RUT para formulario principal
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

  // NUEVO: Validación de RUT para formulario de reingreso
  const reentryRutInput = document.getElementById('reentry-rut');
  if (reentryRutInput) {
    reentryRutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });

    reentryRutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }

  // Validación de teléfonos
  const phoneInputs = document.querySelectorAll('#patient-phone, #anonymous-phone, #reentry-phone');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  });

  // Validación de emails
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

// NUEVA FUNCIÓN: Obtener ubicación del usuario con geolocalización real
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
        
        showNotification('Ubicación obtenida correctamente', 'success');
        
        // Buscar CESFAM cercanos basado en ubicación real
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
      // Cargar todos los CESFAM si falla la geolocalización
      loadNearbyClinics();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

// FUNCIÓN MODIFICADA: Cargar CESFAM cercanos con geolocalización real
async function loadNearbyClinics(userLat = null, userLng = null) {
  try {
    const centersList = document.getElementById('centers-list');
    if (!centersList) return;
    
    centersList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando CESFAM...</div>';
    
    let cesfamArray = Object.keys(cesfamRegionMetropolitana).map(key => ({
      id: key,
      ...cesfamRegionMetropolitana[key]
    }));
    
    // Si tenemos ubicación del usuario, calcular distancias y ordenar
    if (userLat && userLng) {
      cesfamArray.forEach(cesfam => {
        cesfam.distance = calculateDistance(userLat, userLng, cesfam.lat, cesfam.lng);
      });
      
      // Ordenar por distancia
      cesfamArray.sort((a, b) => a.distance - b.distance);
    }
    
    let html = '';
    cesfamArray.forEach(cesfam => {
      html += `
        <div class="center-card">
          <h3>${cesfam.nombre}</h3>
          <p><i class="fas fa-map-marker-alt"></i> ${cesfam.direccion}</p>
          <p><i class="fas fa-phone"></i> ${cesfam.telefono}</p>
          <p><i class="fas fa-clock"></i> Horario: ${cesfam.horario}</p>
          <p><i class="fas fa-building"></i> Comuna: ${cesfam.comuna}</p>
          ${cesfam.distance ? `<p><i class="fas fa-route"></i> Distancia: ${cesfam.distance.toFixed(1)} km</p>` : ''}
          <div class="center-actions">
            <button class="btn btn-sm btn-primary" onclick="selectCenter('${cesfam.id}')">
              <i class="fas fa-check"></i> Seleccionar
            </button>
          </div>
        </div>
      `;
    });
    
    centersList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading CESFAM:', error);
    const centersList = document.getElementById('centers-list');
    if (centersList) {
      centersList.innerHTML = '<p>Error al cargar CESFAM: ' + error.message + '</p>';
    }
  }
}

function selectCenter(cesfamId) {
  const cesfam = cesfamRegionMetropolitana[cesfamId];
  if (!cesfam) return;
  
  const cesfamInput = document.getElementById('patient-cesfam');
  if (cesfamInput) {
    cesfamInput.value = cesfamId;
  }
  
  showNotification(`CESFAM seleccionado: ${cesfam.nombre}`, 'success');
  closeModal('center-modal');
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
  const cesfam = document.getElementById('patient-cesfam')?.value;
  
  if (!tipoSolicitud || !paraMi || !cesfam) {
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
    formData.cesfam = document.getElementById('patient-cesfam').value; // MODIFICADO: CESFAM en lugar de región
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
    
    // MODIFICADO: Incluir CESFAM en la solicitud
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
        cesfam_asignado: formData.cesfam, // NUEVO: CESFAM asignado
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
        cesfam_destino: formData.cesfam, // NUEVO: CESFAM de destino
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
      cesfam: solicitudData.datos_personales.cesfam_asignado, // NUEVO: Incluir CESFAM
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
// ================= PARTE 4: AUTENTICACIÓN DE PROFESIONALES MODIFICADA =================

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
    
    // ESPERAR UN POCO ANTES DE BUSCAR EL DOCUMENTO
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN MODIFICADA: Registro de profesionales (sin coordinador y admin)
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  showLoading(true);
  
  const nameElement = document.getElementById('register-name');
  const emailElement = document.getElementById('register-email');
  const passwordElement = document.getElementById('register-password');
  const professionElement = document.getElementById('register-profession');
  const centerElement = document.getElementById('register-center');

  if (!nameElement || !emailElement || !passwordElement || !professionElement || !centerElement) {
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
    center: centerElement.value
  };

  // Validaciones
  if (!registrationData.name || !registrationData.email || !registrationData.password || 
      !registrationData.profession || !registrationData.center) {
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

  // VALIDACIÓN: Solo profesiones permitidas (sin coordinador y admin)
  const allowedProfessions = ['asistente_social', 'medico', 'psicologo', 'terapeuta'];
  if (!allowedProfessions.includes(registrationData.profession)) {
    showNotification('Profesión no válida', 'error');
    showLoading(false);
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(registrationData.email, registrationData.password);
    const user = userCredential.user;
    
    // DATOS MODIFICADOS: Incluir CESFAM y solo profesiones clínicas
    const professionalData = {
      nombre: registrationData.name,
      correo: registrationData.email,
      profesion: registrationData.profession,
      cesfam_asignado: registrationData.center, // NUEVO: CESFAM asignado
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

// FUNCIÓN MODIFICADA: Permisos solo para profesiones clínicas
function getDefaultPermissions(profession) {
  const permissions = {
    'asistente_social': [
      'ver_casos', 
      'asignar_casos', 
      'derivar_casos', 
      'seguimiento', 
      'crear_reportes_sociales',
      'agenda',
      'reportes'
    ],
    'medico': [
      'ver_casos', 
      'atencion_medica', 
      'seguimiento', 
      'prescripcion', 
      'evaluacion_medica',
      'agenda',
      'reportes'
    ],
    'psicologo': [
      'ver_casos', 
      'atencion_psicologica', 
      'seguimiento', 
      'evaluacion_psicologica',
      'crear_planes_tratamiento',
      'agenda',
      'reportes'
    ],
    'terapeuta': [
      'ver_casos', 
      'terapia_ocupacional', 
      'seguimiento', 
      'evaluacion_funcional',
      'agenda',
      'reportes'
    ]
  };
  
  return permissions[profession] || ['ver_casos'];
}

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  setupPanelNavigation(userData);
  showPanel('dashboard', userData);
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  startRealTimeListeners(userData);
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

// FUNCIÓN MODIFICADA: Listeners en tiempo real filtrados por CESFAM
function startRealTimeListeners(userData) {
  console.log('Starting real-time listeners for:', userData.nombre);
  
  // Listener para nuevas solicitudes críticas del mismo CESFAM
  const unsubscribeCritical = db.collection('alertas_criticas')
    .where('estado', '==', 'pendiente')
    .where('cesfam', '==', userData.cesfam_asignado)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const alertData = change.doc.data();
          showNotification(
            `Nueva alerta crítica en tu CESFAM: ${alertData.mensaje}`,
            'error',
            10000
          );
        }
      });
    });
  
  // Listener para nuevas solicitudes del mismo CESFAM
  const unsubscribeRequests = db.collection('solicitudes_ingreso')
    .where('clasificacion.estado', '==', 'pendiente')
    .where('datos_personales.cesfam_asignado', '==', userData.cesfam_asignado)
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

// FUNCIÓN MODIFICADA: Dashboard filtrado por CESFAM
async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // MODIFICADO: Contar solicitudes pendientes del CESFAM del usuario
    const pendingRequests = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .where('datos_personales.cesfam_asignado', '==', userData.cesfam_asignado)
      .get();
    
    // MODIFICADO: Contar casos críticos del CESFAM del usuario
    const criticalCases = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', '==', 'pendiente')
      .where('datos_personales.cesfam_asignado', '==', userData.cesfam_asignado)
      .get();
    
    // MODIFICADO: Contar pacientes activos del CESFAM del usuario
    const activePatients = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .where('cesfam_asignado', '==', userData.cesfam_asignado)
      .get();

    // MODIFICADO: Contar citas de hoy del profesional
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayAppointments = await db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .get();
    
    // Actualizar métricas en el dashboard
    const totalPatientsElement = document.getElementById('total-patients');
    const pendingRequestsElement = document.getElementById('pending-requests');
    const criticalCasesElement = document.getElementById('critical-cases');
    const todayAppointmentsElement = document.getElementById('today-appointments');
    
    if (totalPatientsElement) totalPatientsElement.textContent = activePatients.size;
    if (pendingRequestsElement) pendingRequestsElement.textContent = pendingRequests.size;
    if (criticalCasesElement) criticalCasesElement.textContent = criticalCases.size;
    if (todayAppointmentsElement) todayAppointmentsElement.textContent = todayAppointments.size;

    // Mostrar próxima cita
    if (todayAppointments.size > 0) {
      const nextAppointment = todayAppointments.docs
        .map(doc => doc.data())
        .sort((a, b) => a.fecha.toDate() - b.fecha.toDate())
        .find(cita => cita.fecha.toDate() > new Date());
      
      const nextAppointmentElement = document.getElementById('next-appointment');
      if (nextAppointmentElement && nextAppointment) {
        nextAppointmentElement.textContent = nextAppointment.fecha.toDate().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar dashboard', 'error');
  }
}

// ================= PANEL DE SOLICITUDES MODIFICADO PARA CESFAM =================

// FUNCIÓN MODIFICADA: Panel de solicitudes filtrado por CESFAM
async function loadRequestsPanel(userData) {
  console.log('Loading requests panel for:', userData.nombre);
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // MODIFICADO: Obtener solicitudes del CESFAM del usuario
    let query = db.collection('solicitudes_ingreso')
      .where('datos_personales.cesfam_asignado', '==', userData.cesfam_asignado)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes para tu CESFAM.
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
            <div><strong>CESFAM:</strong> ${cesfamRegionMetropolitana[data.datos_personales.cesfam_asignado]?.nombre || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${isAnonymous ? 'Anónimo' : 'Identificado'}</div>
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
              <i class="fas fa-eye"></i> Revisar
            </button>
            ${!isInfoOnly && estado === 'pendiente' && userData.profesion === 'asistente_social' ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
            </button>
            <button class="btn btn-secondary btn-sm" onclick="assignRequest('${doc.id}')">
              <i class="fas fa-user-plus"></i> Asignar
            </button>
            ` : ''}
            ${isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="sendInformation('${doc.id}')">
              <i class="fas fa-envelope"></i> Enviar Info
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
              <div><strong>CESFAM:</strong> ${cesfamRegionMetropolitana[data.datos_personales.cesfam_asignado]?.nombre || 'N/A'}</div>
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
            </div>
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          ${!isInfoOnly && data.clasificacion?.estado === 'pendiente' && currentUserData.profesion === 'asistente_social' ? `
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
    
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
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
    cesfam_asignado: solicitudData.datos_personales.cesfam_asignado, // NUEVO: CESFAM asignado
    datos_personales: {
      nombre_completo: solicitudData.datos_contacto?.nombre_completo || '',
      rut: solicitudData.datos_contacto?.rut || '',
      edad: solicitudData.datos_personales?.edad || 0,
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
// ================= PARTE 6: ASIGNACIÓN DE SOLICITUDES (SOLO ASISTENTE SOCIAL) =================

// FUNCIÓN MODIFICADA: Asignación de solicitudes solo para asistentes sociales
async function assignRequest(requestId) {
  // Verificar que solo asistentes sociales puedan asignar
  if (currentUserData.profesion !== 'asistente_social') {
    showNotification('Solo los asistentes sociales pueden asignar solicitudes', 'error');
    return;
  }
  
  try {
    showAssignmentModal(requestId);
  } catch (error) {
    console.error('Error in assign request:', error);
    showNotification('Error al asignar solicitud', 'error');
  }
}

// FUNCIÓN MODIFICADA: Modal de asignación con profesionales del mismo CESFAM
async function showAssignmentModal(requestId) {
  try {
    // Obtener profesionales del mismo CESFAM
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('cesfam_asignado', '==', currentUserData.cesfam_asignado)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta', 'asistente_social'])
      .get();
    
    if (professionalsSnapshot.empty) {
      showNotification('No hay profesionales disponibles en tu CESFAM', 'error');
      return;
    }

    // Agrupar profesionales por profesión
    const professionalsByType = {};
    professionalsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!professionalsByType[data.profesion]) {
        professionalsByType[data.profesion] = [];
      }
      professionalsByType[data.profesion].push({
        id: doc.id,
        ...data
      });
    });
    
    const modalHTML = `
      <div class="modal-overlay" id="assignment-modal">
        <div class="modal">
          <button class="modal-close" onclick="closeModal('assignment-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Asignar Solicitud a Profesional</h2>
          
          <form id="assignment-form">
            <div class="form-group">
              <label class="form-label">Tipo de profesional *</label>
              <select class="form-select" id="professional-type" required onchange="loadProfessionalsByType()">
                <option value="">Seleccionar tipo...</option>
                ${Object.keys(professionalsByType).map(type => 
                  `<option value="${type}">${getProfessionName(type)}</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="form-group" id="professional-select-container" style="display: none;">
              <label class="form-label">Profesional específico *</label>
              <select class="form-select" id="assign-professional" required>
                <option value="">Primero selecciona el tipo...</option>
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
            
            <div class="form-group">
              <input type="checkbox" id="schedule-appointment"> 
              <label for="schedule-appointment">Programar cita inmediatamente</label>
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
    
    // Guardar datos de profesionales para uso posterior
    window.assignmentProfessionals = professionalsByType;
    
    document.getElementById('assignment-form').addEventListener('submit', function(e) {
      e.preventDefault();
      processAssignment(requestId);
    });
    
  } catch (error) {
    console.error('Error showing assignment modal:', error);
    showNotification('Error al cargar modal de asignación', 'error');
  }
}

// NUEVA FUNCIÓN: Cargar profesionales por tipo
function loadProfessionalsByType() {
  const typeSelect = document.getElementById('professional-type');
  const professionalSelect = document.getElementById('assign-professional');
  const container = document.getElementById('professional-select-container');
  
  const selectedType = typeSelect.value;
  
  if (!selectedType || !window.assignmentProfessionals[selectedType]) {
    container.style.display = 'none';
    return;
  }
  
  const professionals = window.assignmentProfessionals[selectedType];
  
  professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
  professionals.forEach(prof => {
    const option = document.createElement('option');
    option.value = prof.id;
    option.textContent = prof.nombre;
    professionalSelect.appendChild(option);
  });
  
  container.style.display = 'block';
}

// FUNCIÓN MODIFICADA: Procesar asignación con opción de agendar cita
async function processAssignment(requestId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('assign-professional').value;
    const priority = document.getElementById('assignment-priority').value;
    const notes = document.getElementById('assignment-notes').value;
    const scheduleAppointment = document.getElementById('schedule-appointment').checked;
    
    if (!professionalId) {
      showNotification('Selecciona un profesional', 'error');
      return;
    }
    
    // Actualizar la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'asignada',
      'clasificacion.profesional_asignado': professionalId,
      'clasificacion.prioridad_asignacion': priority,
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
    
    // Si se marcó para agendar cita, abrir modal de agenda
    if (scheduleAppointment) {
      // Obtener datos de la solicitud para crear paciente si es necesario
      const solicitudDoc = await db.collection('solicitudes_ingreso').doc(requestId).get();
      const solicitudData = solicitudDoc.data();
      
      if (!solicitudData.datos_personales.anonimo) {
        // Crear o encontrar paciente
        const patientId = await findOrCreatePatient(requestId, solicitudData);
        
        // Abrir agenda para programar cita
        showScheduleAppointmentModal(professionalId, patientId);
      }
    }
    
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error processing assignment:', error);
    showNotification('Error al asignar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

// NUEVA FUNCIÓN: Encontrar o crear paciente
async function findOrCreatePatient(solicitudId, solicitudData) {
  try {
    // Verificar si ya existe el paciente
    let patientQuery;
    if (solicitudData.datos_contacto?.rut) {
      patientQuery = await db.collection('pacientes')
        .where('datos_personales.rut', '==', solicitudData.datos_contacto.rut)
        .get();
    }
    
    if (patientQuery && !patientQuery.empty) {
      return patientQuery.docs[0].id;
    }
    
    // Crear nuevo paciente
    const patientData = {
      solicitud_origen: solicitudId,
      cesfam_asignado: solicitudData.datos_personales.cesfam_asignado,
      datos_personales: {
        nombre_completo: solicitudData.datos_contacto?.nombre_completo || '',
        rut: solicitudData.datos_contacto?.rut || '',
        edad: solicitudData.datos_personales?.edad || 0,
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
        observaciones: 'Paciente creado desde asignación de solicitud'
      }],
      estado_actual: {
        activo: true,
        programa: 'ambulatorio',
        profesional_asignado: solicitudData.clasificacion.profesional_asignado,
        fecha_ingreso: firebase.firestore.FieldValue.serverTimestamp()
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        creado_por: currentUserData.uid
      }
    };
    
    const patientRef = await db.collection('pacientes').add(patientData);
    return patientRef.id;
    
  } catch (error) {
    console.error('Error finding/creating patient:', error);
    throw error;
  }
}

// NUEVA FUNCIÓN: Modal para agendar cita después de asignación
function showScheduleAppointmentModal(professionalId, patientId) {
  const modalHTML = `
    <div class="modal-overlay" id="schedule-appointment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('schedule-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Programar Primera Cita</h2>
        
        <form id="schedule-appointment-form">
          <div class="form-group">
            <label class="form-label">Fecha y hora *</label>
            <input type="datetime-local" class="form-input" id="appointment-datetime" required 
                   min="${new Date().toISOString().slice(0, 16)}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de cita</label>
            <select class="form-select" id="appointment-type">
              <option value="primera_consulta">Primera Consulta</option>
              <option value="evaluacion_inicial">Evaluación Inicial</option>
              <option value="admision">Admisión al Programa</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Duración (minutos)</label>
            <select class="form-select" id="appointment-duration">
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60" selected>60 minutos</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea class="form-textarea" id="appointment-notes" 
                      placeholder="Observaciones sobre la cita..."></textarea>
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-calendar-plus"></i> Programar Cita
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('schedule-appointment-modal')">
              Omitir
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('schedule-appointment-modal').style.display = 'flex';
  
  document.getElementById('schedule-appointment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createAppointment(professionalId, patientId);
  });
}

// NUEVA FUNCIÓN: Crear cita
async function createAppointment(professionalId, patientId) {
  try {
    showLoading(true);
    
    const datetime = document.getElementById('appointment-datetime').value;
    const type = document.getElementById('appointment-type').value;
    const duration = parseInt(document.getElementById('appointment-duration').value);
    const notes = document.getElementById('appointment-notes').value;
    
    if (!datetime) {
      showNotification('Selecciona fecha y hora', 'error');
      return;
    }
    
    const appointmentDate = new Date(datetime);
    
    // Verificar que la cita sea en horario laboral (08:00 - 16:30)
    const hour = appointmentDate.getHours();
    const minute = appointmentDate.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    if (totalMinutes < 8 * 60 || totalMinutes > 16 * 60 + 30) {
      showNotification('Las citas deben programarse entre 08:00 y 16:30', 'error');
      return;
    }
    
    // Verificar conflictos de horario
    const startTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + duration * 60000);
    
    const conflictQuery = await db.collection('citas')
      .where('profesional_id', '==', professionalId)
      .where('fecha', '>=', startTime)
      .where('fecha', '<', endTime)
      .where('estado', '==', 'programada')
      .get();
    
    if (!conflictQuery.empty) {
      showNotification('El profesional ya tiene una cita programada en ese horario', 'error');
      return;
    }
    
    // Crear la cita
    const citaData = {
      profesional_id: professionalId,
      paciente_id: patientId,
      fecha: appointmentDate,
      tipo_cita: type,
      duracion_minutos: duration,
      estado: 'programada',
      notas_previas: notes,
      cesfam: currentUserData.cesfam_asignado,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      creado_por: currentUserData.uid
    };
    
    await db.collection('citas').add(citaData);
    
    showNotification('Cita programada correctamente', 'success');
    closeModal('schedule-appointment-modal');
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    showNotification('Error al programar la cita', 'error');
  } finally {
    showLoading(false);
  }
}
// ================= PARTE 7: PANEL DE PACIENTES Y AGENDA =================

// FUNCIÓN MODIFICADA: Panel de pacientes filtrado por CESFAM
async function loadPatientsPanel(userData) {
  console.log('Loading patients panel for:', userData.nombre);
  
  try {
    const patientsList = document.getElementById('patients-list');
    if (!patientsList) return;
    
    patientsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
    
    // MODIFICADO: Obtener solo pacientes del CESFAM del usuario
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .where('cesfam_asignado', '==', userData.cesfam_asignado)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      patientsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en tu CESFAM.
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
      
      const cesfamName = cesfamRegionMetropolitana[data.cesfam_asignado]?.nombre || 'CESFAM no especificado';
      
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
            <div><strong>CESFAM:</strong> ${cesfamName}</div>
            <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
            <div><strong>Profesional asignado:</strong> ${professionalName}</div>
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
            <button class="btn btn-info btn-sm" onclick="scheduleAppointmentForPatient('${doc.id}')">
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

// FUNCIÓN MODIFICADA: Panel de agenda con mes actual y profesionales del mismo CESFAM
async function loadCalendarPanel(userData) {
  console.log('Loading calendar panel for:', userData.nombre);
  
  const calendarContainer = document.getElementById('calendar-panel');
  if (!calendarContainer) return;
  
  // Agregar HTML del panel de agenda si no existe
  if (!document.getElementById('professionals-list')) {
    calendarContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda ${new Date().getFullYear()}</h1>
        <p class="panel-subtitle">Gestiona citas y horarios de profesionales de tu CESFAM</p>
      </div>
      
      <div class="calendar-controls">
        <div class="calendar-navigation">
          <button class="btn btn-outline" id="prev-month">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span id="current-month-year">${new Date().toLocaleDateString('es-CL', {month: 'long', year: 'numeric'})}</span>
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
          <h3>Profesionales de tu CESFAM</h3>
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
  
  // MODIFICADO: Iniciar en el mes actual
  currentCalendarDate = new Date();
  
  setupCalendarEvents();
  await loadProfessionalsList(userData);
  await loadCalendarView();
  await loadAppointmentsSummary('today');
}

// FUNCIÓN MODIFICADA: Cargar solo profesionales del mismo CESFAM
async function loadProfessionalsList(userData) {
  try {
    const professionalsContainer = document.getElementById('professionals-list');
    if (!professionalsContainer) return;
    
    professionalsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // MODIFICADO: Obtener solo profesionales del mismo CESFAM
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('cesfam_asignado', '==', userData.cesfam_asignado)
      .get();
    
    let html = '';
    if (professionalsSnapshot.empty) {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay otros profesionales en tu CESFAM</p>';
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
      currentCalendarDate = new Date(); // MODIFICADO: Ir al mes actual
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
  showDayAppointmentsModal(selectedDate, selectedProfessional);
}

// NUEVA FUNCIÓN: Agendar cita para un paciente específico
async function scheduleAppointmentForPatient(patientId) {
  try {
    // Obtener datos del paciente
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    
    // Obtener profesionales del mismo CESFAM
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('cesfam_asignado', '==', currentUserData.cesfam_asignado)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta', 'asistente_social'])
      .get();
    
    showSchedulePatientAppointmentModal(patientId, patientData, professionalsSnapshot.docs);
    
  } catch (error) {
    console.error('Error scheduling appointment for patient:', error);
    showNotification('Error al agendar cita', 'error');
  }
}

function showSchedulePatientAppointmentModal(patientId, patientData, professionals) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-appointment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('patient-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agendar Cita - ${patientData.datos_personales?.nombre_completo}</h2>
        
        <form id="patient-appointment-form">
          <div class="form-group">
            <label class="form-label">Profesional *</label>
            <select class="form-select" id="appointment-professional" required>
              <option value="">Seleccionar profesional...</option>
              ${professionals.map(doc => {
                const data = doc.data();
                return `<option value="${doc.id}">${data.nombre} - ${getProfessionName(data.profesion)}</option>`;
              }).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Fecha y hora *</label>
            <input type="datetime-local" class="form-input" id="patient-appointment-datetime" required 
                   min="${new Date().toISOString().slice(0, 16)}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de cita</label>
            <select class="form-select" id="patient-appointment-type">
              <option value="consulta_medica">Consulta Médica</option>
              <option value="sesion_psicologica">Sesión Psicológica</option>
              <option value="terapia_ocupacional">Terapia Ocupacional</option>
              <option value="seguimiento_social">Seguimiento Social</option>
              <option value="evaluacion">Evaluación</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Duración (minutos)</label>
            <select class="form-select" id="patient-appointment-duration">
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60" selected>60 minutos</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea class="form-textarea" id="patient-appointment-notes" 
                      placeholder="Observaciones sobre la cita..."></textarea>
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-calendar-plus"></i> Programar Cita
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('patient-appointment-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-appointment-modal').style.display = 'flex';
  
  document.getElementById('patient-appointment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createPatientAppointment(patientId);
  });
}

async function createPatientAppointment(patientId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('appointment-professional').value;
    const datetime = document.getElementById('patient-appointment-datetime').value;
    const type = document.getElementById('patient-appointment-type').value;
    const duration = parseInt(document.getElementById('patient-appointment-duration').value);
    const notes = document.getElementById('patient-appointment-notes').value;
    
    if (!professionalId || !datetime) {
      showNotification('Completa los campos obligatorios', 'error');
      return;
    }
    
    const appointmentDate = new Date(datetime);
    
    // Verificar horario laboral (08:00 - 16:30)
    const hour = appointmentDate.getHours();
    const minute = appointmentDate.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    if (totalMinutes < 8 * 60 || totalMinutes > 16 * 60 + 30) {
      showNotification('Las citas deben programarse entre 08:00 y 16:30', 'error');
      return;
    }
    
    // Crear la cita
    const citaData = {
      profesional_id: professionalId,
      paciente_id: patientId,
      fecha: appointmentDate,
      tipo_cita: type,
      duracion_minutos: duration,
      estado: 'programada',
      notas_previas: notes,
      cesfam: currentUserData.cesfam_asignado,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      creado_por: currentUserData.uid
    };
    
    await db.collection('citas').add(citaData);
    
    showNotification('Cita programada correctamente', 'success');
    closeModal('patient-appointment-modal');
    
    // Refrescar la vista si estamos en el panel de agenda
    if (document.getElementById('calendar-panel').classList.contains('active')) {
      loadCalendarView();
    }
    
  } catch (error) {
    console.error('Error creating patient appointment:', error);
    showNotification('Error al programar la cita', 'error');
  } finally {
    showLoading(false);
  }
}
// ================= PARTE 8: PANEL DE SEGUIMIENTOS CON HORARIOS 08:00-16:30 =================

// FUNCIÓN MODIFICADA: Panel de seguimientos con horario específico
async function loadFollowupsPanel(userData) {
  console.log('Loading followups panel for:', userData.nombre);
  
  try {
    const followupsContainer = document.getElementById('followups-panel');
    if (!followupsContainer) return;
    
    // Crear la interfaz del panel de seguimientos si no existe
    if (!document.getElementById('followups-schedule')) {
      followupsContainer.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Seguimientos</h1>
          <p class="panel-subtitle">Horarios de atención 08:00 - 16:30</p>
        </div>
        
        <div class="schedule-controls">
          <div class="date-navigation">
            <button class="btn btn-outline" id="prev-day">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span id="current-date">${new Date().toLocaleDateString('es-CL', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</span>
            <button class="btn btn-outline" id="next-day">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="schedule-actions">
            <button class="btn btn-secondary btn-sm" id="go-to-today-followups">Ir a Hoy</button>
            <button class="btn btn-primary" id="refresh-schedule">
              <i class="fas fa-sync"></i> Actualizar
            </button>
          </div>
        </div>
        
        <div id="followups-schedule">
          <!-- Horario de seguimientos se cargará aquí -->
        </div>
      `;
    }
    
    // Variable para la fecha actual de seguimientos
    window.currentFollowupDate = new Date();
    
    setupFollowupsEvents(userData);
    await loadDailySchedule(userData, window.currentFollowupDate);
    
  } catch (error) {
    console.error('Error loading followups panel:', error);
    const followupsContainer = document.getElementById('followups-panel');
    if (followupsContainer) {
      followupsContainer.innerHTML = '<p>Error al cargar seguimientos: ' + error.message + '</p>';
    }
  }
}

function setupFollowupsEvents(userData) {
  const prevDay = document.getElementById('prev-day');
  const nextDay = document.getElementById('next-day');
  const goToToday = document.getElementById('go-to-today-followups');
  const refreshSchedule = document.getElementById('refresh-schedule');
  
  if (prevDay) {
    prevDay.addEventListener('click', () => {
      window.currentFollowupDate.setDate(window.currentFollowupDate.getDate() - 1);
      updateDateDisplay();
      loadDailySchedule(userData, window.currentFollowupDate);
    });
  }
  
  if (nextDay) {
    nextDay.addEventListener('click', () => {
      window.currentFollowupDate.setDate(window.currentFollowupDate.getDate() + 1);
      updateDateDisplay();
      loadDailySchedule(userData, window.currentFollowupDate);
    });
  }
  
  if (goToToday) {
    goToToday.addEventListener('click', () => {
      window.currentFollowupDate = new Date();
      updateDateDisplay();
      loadDailySchedule(userData, window.currentFollowupDate);
    });
  }
  
  if (refreshSchedule) {
    refreshSchedule.addEventListener('click', () => {
      loadDailySchedule(userData, window.currentFollowupDate);
    });
  }
}

function updateDateDisplay() {
  const currentDateElement = document.getElementById('current-date');
  if (currentDateElement) {
    currentDateElement.textContent = window.currentFollowupDate.toLocaleDateString('es-CL', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }
}

// FUNCIÓN NUEVA: Cargar horario diario con citas del profesional
async function loadDailySchedule(userData, date) {
  try {
    const scheduleContainer = document.getElementById('followups-schedule');
    if (!scheduleContainer) return;
    
    scheduleContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando horario...</div>';
    
    // Obtener citas del profesional para el día seleccionado
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    // Generar horario de 08:00 a 16:30 en bloques de 30 minutos
    const timeSlots = generateTimeSlots();
    
    // Mapear citas a los bloques de tiempo
    const appointments = {};
    appointmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const appointmentTime = data.fecha.toDate();
      const timeKey = appointmentTime.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'});
      appointments[timeKey] = {...data, id: doc.id};
    });
    
    let html = `
      <div class="schedule-grid">
        <div class="schedule-header">
          <div class="time-column">Hora</div>
          <div class="appointment-column">Paciente / Actividad</div>
          <div class="actions-column">Acciones</div>
        </div>
    `;
    
    timeSlots.forEach(timeSlot => {
      const appointment = appointments[timeSlot];
      const isPast = isPastTimeSlot(date, timeSlot);
      
      html += `
        <div class="schedule-row ${isPast ? 'past-slot' : ''} ${appointment ? 'has-appointment' : 'available-slot'}">
          <div class="time-slot">${timeSlot}</div>
          <div class="appointment-content">
            ${appointment ? `
              <div class="appointment-details">
                <strong>Paciente:</strong> <span id="patient-name-${appointment.id}">Cargando...</span><br>
                <strong>Tipo:</strong> ${appointment.tipo_cita || 'Consulta'}<br>
                <strong>Estado:</strong> <span class="status-badge status-${appointment.estado}">${appointment.estado}</span>
                ${appointment.notas_previas ? `<br><strong>Notas:</strong> ${appointment.notas_previas}` : ''}
              </div>
            ` : `
              <span class="available-text">Horario disponible</span>
            `}
          </div>
          <div class="slot-actions">
            ${appointment ? `
              <button class="btn btn-sm btn-success" onclick="startFollowup('${appointment.id}', '${appointment.paciente_id}')">
                <i class="fas fa-play"></i> Iniciar Atención
              </button>
              ${appointment.estado === 'completada' ? `
                <button class="btn btn-sm btn-info" onclick="viewFollowupNotes('${appointment.id}')">
                  <i class="fas fa-eye"></i> Ver Notas
                </button>
              ` : ''}
            ` : `
              <button class="btn btn-sm btn-outline" onclick="scheduleQuickAppointment('${timeSlot}', '${date.toISOString()}')">
                <i class="fas fa-plus"></i> Agendar
              </button>
            `}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    scheduleContainer.innerHTML = html;
    
    // Cargar nombres de pacientes para las citas
    if (appointmentsSnapshot.size > 0) {
      loadPatientNamesForSchedule(appointmentsSnapshot.docs);
    }
    
  } catch (error) {
    console.error('Error loading daily schedule:', error);
    const scheduleContainer = document.getElementById('followups-schedule');
    if (scheduleContainer) {
      scheduleContainer.innerHTML = '<p>Error al cargar horario: ' + error.message + '</p>';
    }
  }
}

// FUNCIÓN NUEVA: Generar bloques de tiempo de 08:00 a 16:30
function generateTimeSlots() {
  const slots = [];
  const startHour = 8; // 08:00
  const endHour = 16; // 16:00
  const endMinute = 30; // hasta 16:30
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // No agregar 16:30 como inicio de bloque, solo hasta 16:00
      if (hour === endHour && minute > endMinute) break;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
}

// FUNCIÓN NUEVA: Verificar si el bloque de tiempo ya pasó
function isPastTimeSlot(date, timeSlot) {
  const now = new Date();
  const slotDateTime = new Date(date);
  const [hours, minutes] = timeSlot.split(':').map(Number);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  return slotDateTime < now;
}

// FUNCIÓN NUEVA: Cargar nombres de pacientes para el horario
async function loadPatientNamesForSchedule(appointmentDocs) {
  for (const doc of appointmentDocs) {
    const data = doc.data();
    if (data.paciente_id) {
      try {
        const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          const nameElement = document.getElementById(`patient-name-${doc.id}`);
          if (nameElement) {
            nameElement.textContent = patientData.datos_personales?.nombre_completo || 'Sin nombre';
          }
        }
      } catch (error) {
        console.error('Error loading patient name:', error);
      }
    }
  }
}

// FUNCIÓN NUEVA: Iniciar seguimiento/atención
async function startFollowup(appointmentId, patientId) {
  try {
    // Obtener datos del paciente
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    showFollowupModal(appointmentId, patientId, patientData);
    
  } catch (error) {
    console.error('Error starting followup:', error);
    showNotification('Error al iniciar atención', 'error');
  }
}

// FUNCIÓN NUEVA: Modal para registrar seguimiento
function showFollowupModal(appointmentId, patientId, patientData) {
  const modalHTML = `
    <div class="modal-overlay" id="followup-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('followup-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Atención - ${patientData.datos_personales?.nombre_completo}</h2>
        
        <div class="patient-summary">
          <div class="info-grid">
            <div><strong>RUT:</strong> ${patientData.datos_personales?.rut || 'N/A'}</div>
            <div><strong>Edad:</strong> ${patientData.datos_personales?.edad || 'N/A'} años</div>
            <div><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'N/A'}</div>
            <div><strong>Email:</strong> ${patientData.contacto?.email || 'N/A'}</div>
          </div>
        </div>
        
        <form id="followup-form">
          <div class="form-group">
            <label class="form-label">Tipo de atención *</label>
            <select class="form-select" id="followup-attention-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="consulta_medica">Consulta Médica</option>
              <option value="sesion_psicologica">Sesión Psicológica</option>
              <option value="terapia_ocupacional">Terapia Ocupacional</option>
              <option value="seguimiento_social">Seguimiento Social</option>
              <option value="evaluacion">Evaluación</option>
              <option value="crisis">Atención de Crisis</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones de la atención *</label>
            <textarea class="form-textarea" id="followup-observations" rows="6" required
                      placeholder="Describe la atención realizada, evolución del paciente, intervenciones, etc."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado del paciente después de la atención</label>
            <select class="form-select" id="followup-patient-status">
              <option value="estable">Estable</option>
              <option value="mejoria">En mejoría</option>
              <option value="sin_cambios">Sin cambios</option>
              <option value="deterioro">En deterioro</option>
              <option value="crisis">En crisis</option>
              <option value="requiere_derivacion">Requiere derivación</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Plan de seguimiento</label>
            <textarea class="form-textarea" id="followup-plan" rows="3"
                      placeholder="Plan de tratamiento, próximas intervenciones, recomendaciones..."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Próxima cita</label>
            <input type="datetime-local" class="form-input" id="followup-next-appointment" 
                   min="${new Date().toISOString().slice(0, 16)}">
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Completar Atención
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('followup-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('followup-modal').style.display = 'flex';
  
  document.getElementById('followup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    completeFollowup(appointmentId, patientId);
  });
}

// FUNCIÓN NUEVA: Completar seguimiento
async function completeFollowup(appointmentId, patientId) {
  try {
    showLoading(true);
    
    const attentionType = document.getElementById('followup-attention-type').value;
    const observations = document.getElementById('followup-observations').value;
    const patientStatus = document.getElementById('followup-patient-status').value;
    const plan = document.getElementById('followup-plan').value;
    const nextAppointment = document.getElementById('followup-next-appointment').value;
    
    if (!attentionType || !observations) {
      showNotification('Completa los campos obligatorios', 'error');
      return;
    }
    
    // Actualizar la cita como completada
    await db.collection('citas').doc(appointmentId).update({
      estado: 'completada',
      fecha_completada: firebase.firestore.FieldValue.serverTimestamp(),
      atencion_realizada: {
        tipo: attentionType,
        observaciones: observations,
        estado_paciente: patientStatus,
        plan_seguimiento: plan,
        profesional: currentUserData.uid,
        fecha_atencion: firebase.firestore.FieldValue.serverTimestamp()
      }
    });
    
    // Agregar entrada al historial clínico del paciente
    const historyEntry = {
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: 'atencion_clinica',
      profesional: currentUserData.uid,
      tipo_atencion: attentionType,
      observaciones: observations,
      estado_paciente: patientStatus,
      plan_seguimiento: plan,
      cita_id: appointmentId
    };
    
    await db.collection('pacientes').doc(patientId).update({
      historial_clinico: firebase.firestore.FieldValue.arrayUnion(historyEntry),
      'metadata.ultima_actualizacion': firebase.firestore.FieldValue.serverTimestamp(),
      'metadata.actualizado_por': currentUserData.uid
    });
    
    // Programar próxima cita si se especificó
    if (nextAppointment) {
      const nextDate = new Date(nextAppointment);
      const nextCitaData = {
        profesional_id: currentUserData.uid,
        paciente_id: patientId,
        fecha: nextDate,
        tipo_cita: 'seguimiento',
        duracion_minutos: 60,
        estado: 'programada',
        cesfam: currentUserData.cesfam_asignado,
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        creado_por: currentUserData.uid
      };
      
      await db.collection('citas').add(nextCitaData);
    }
    
    showNotification('Atención completada correctamente', 'success');
    closeModal('followup-modal');
    
    // Recargar el horario
    loadDailySchedule(currentUserData, window.currentFollowupDate);
    
  } catch (error) {
    console.error('Error completing followup:', error);
    showNotification('Error al completar la atención', 'error');
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN NUEVA: Ver notas de seguimiento
async function viewFollowupNotes(appointmentId) {
  try {
    const appointmentDoc = await db.collection('citas').doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      showNotification('Cita no encontrada', 'error');
      return;
    }
    
    const appointmentData = appointmentDoc.data();
    const attention = appointmentData.atencion_realizada;
    
    if (!attention) {
      showNotification('No hay notas de atención registradas', 'warning');
      return;
    }
    
    // Obtener datos del profesional que realizó la atención
    const professionalDoc = await db.collection('profesionales').doc(attention.profesional).get();
    const professionalName = professionalDoc.exists ? professionalDoc.data().nombre : 'Profesional no encontrado';
    
    const modalHTML = `
      <div class="modal-overlay" id="followup-notes-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('followup-notes-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Notas de Atención</h2>
          
          <div class="attention-details">
            <div class="detail-section">
              <h3>Información de la Atención</h3>
              <div class="info-grid">
                <div><strong>Fecha:</strong> ${formatDate(attention.fecha_atencion)}</div>
                <div><strong>Profesional:</strong> ${professionalName}</div>
                <div><strong>Tipo de atención:</strong> ${attention.tipo}</div>
                <div><strong>Estado del paciente:</strong> ${attention.estado_paciente}</div>
              </div>
            </div>
            
            <div class="detail-section">
              <h3>Observaciones</h3>
              <div class="observations-content">
                ${attention.observaciones}
              </div>
            </div>
            
            ${attention.plan_seguimiento ? `
            <div class="detail-section">
              <h3>Plan de Seguimiento</h3>
              <div class="plan-content">
                ${attention.plan_seguimiento}
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button class="btn btn-outline" onclick="closeModal('followup-notes-modal')">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('followup-notes-modal').style.display = 'flex';
    
  } catch (error) {
    console.error('Error viewing followup notes:', error);
    showNotification('Error al cargar las notas', 'error');
  }
}

// FUNCIÓN NUEVA: Agendar cita rápida en horario específico
function scheduleQuickAppointment(timeSlot, dateISO) {
  const date = new Date(dateISO);
  const [hours, minutes] = timeSlot.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  
  // Verificar que no sea en el pasado
  if (date < new Date()) {
    showNotification('No se puede agendar en horarios pasados', 'error');
    return;
  }
  
  const formattedDateTime = date.toISOString().slice(0, 16);
  
  // Abrir modal de agendar cita con la hora preseleccionada
  showNewAppointmentModal(formattedDateTime);
}

// FUNCIÓN AUXILIAR: Modal de nueva cita con hora preseleccionada
function showNewAppointmentModal(preselectedDateTime = null) {
  // Esta función se implementará en la siguiente parte junto con el resto de funcionalidades
  showNotification('Funcionalidad de nueva cita en desarrollo', 'info');
}
// ================= PARTE 9: PANEL DE REPORTES MODIFICADO =================

// FUNCIÓN MODIFICADA: Panel de reportes con búsqueda por RUT/nombre
async function loadReportsPanel(userData) {
  console.log('Loading reports panel for:', userData.nombre);
  
  const reportsContainer = document.getElementById('reports-panel');
  if (!reportsContainer) return;
  
  // Crear la interfaz del panel de reportes si no existe
  if (!document.getElementById('patient-search')) {
    reportsContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes</h1>
        <p class="panel-subtitle">Buscar y generar reportes de pacientes de tu CESFAM</p>
      </div>
      
      <div class="search-section">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="patient-search" class="search-input" 
                 placeholder="Buscar por RUT (ej: 12.345.678-9) o nombre completo...">
        </div>
        <button class="btn btn-primary" id="search-patient-btn">
          <i class="fas fa-search"></i> Buscar
        </button>
        <button class="btn btn-secondary" id="clear-search-btn">
          <i class="fas fa-times"></i> Limpiar
        </button>
      </div>
      
      <div id="search-results-container" style="display: none;">
        <h3>Resultados de búsqueda</h3>
        <div id="patient-results"></div>
      </div>
      
      <div id="recent-patients" style="margin-top: 32px;">
        <h3>Pacientes recientes de tu CESFAM</h3>
        <div id="recent-patients-list"></div>
      </div>
    `;
  }
  
  setupReportsEvents();
  await loadRecentPatients(userData);
}

function setupReportsEvents() {
  const searchBtn = document.getElementById('search-patient-btn');
  const clearBtn = document.getElementById('clear-search-btn');
  const searchInput = document.getElementById('patient-search');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', searchPatient);
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', clearSearch);
  }
  
  if (searchInput) {
    // Buscar al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchPatient();
      }
    });
    
    // Formatear RUT mientras se escribe
    searchInput.addEventListener('input', function(e) {
      const value = e.target.value;
      // Si parece un RUT (números y guiones), formatearlo
      if (/^[\d\-kK\.]+$/.test(value)) {
        e.target.value = formatRUT(value);
      }
    });
  }
}

// FUNCIÓN NUEVA: Buscar paciente por RUT o nombre
async function searchPatient() {
  const searchTerm = document.getElementById('patient-search').value.trim();
  
  if (!searchTerm) {
    showNotification('Ingresa un RUT o nombre para buscar', 'warning');
    return;
  }
  
  if (searchTerm.length < 3) {
    showNotification('Ingresa al menos 3 caracteres para buscar', 'warning');
    return;
  }
  
  try {
    showLoading(true);
    
    const resultsContainer = document.getElementById('patient-results');
    const searchResultsContainer = document.getElementById('search-results-container');
    
    if (!resultsContainer || !searchResultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando...</div>';
    searchResultsContainer.style.display = 'block';
    
    let patients = [];
    
    // Determinar si es búsqueda por RUT o por nombre
    const isRutSearch = /^[\d\.\-kK]+$/.test(searchTerm);
    
    if (isRutSearch) {
      // Búsqueda por RUT
      const cleanRut = searchTerm.replace(/[^\dkK]/gi, '').toUpperCase();
      const formattedRut = formatRUT(searchTerm);
      
      // Buscar por RUT exacto o parcial
      const rutQuery = await db.collection('pacientes')
        .where('cesfam_asignado', '==', currentUserData.cesfam_asignado)
        .get();
      
      patients = rutQuery.docs.filter(doc => {
        const patientRut = doc.data().datos_personales?.rut || '';
        const cleanPatientRut = patientRut.replace(/[^\dkK]/gi, '').toUpperCase();
        return cleanPatientRut.includes(cleanRut);
      });
      
    } else {
      // Búsqueda por nombre
      const searchTermLower = searchTerm.toLowerCase();
      
      // Obtener todos los pacientes del CESFAM y filtrar por nombre
      const nameQuery = await db.collection('pacientes')
        .where('cesfam_asignado', '==', currentUserData.cesfam_asignado)
        .get();
      
      patients = nameQuery.docs.filter(doc => {
        const patientName = doc.data().datos_personales?.nombre_completo || '';
        return patientName.toLowerCase().includes(searchTermLower);
      });
    }
    
    if (patients.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-slash"></i>
          <h3>No se encontraron pacientes</h3>
          <p>No hay pacientes que coincidan con "${searchTerm}" en tu CESFAM</p>
        </div>
      `;
      return;
    }
    
    // Mostrar resultados
    let html = '';
    patients.forEach(doc => {
      const data = doc.data();
      html += generatePatientCard(doc.id, data, true);
    });
    
    resultsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error searching patient:', error);
    showNotification('Error al buscar paciente', 'error');
    document.getElementById('patient-results').innerHTML = '<p>Error en la búsqueda</p>';
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN NUEVA: Limpiar búsqueda
function clearSearch() {
  document.getElementById('patient-search').value = '';
  document.getElementById('search-results-container').style.display = 'none';
}

// FUNCIÓN NUEVA: Cargar pacientes recientes del CESFAM
async function loadRecentPatients(userData) {
  try {
    const recentPatientsContainer = document.getElementById('recent-patients-list');
    if (!recentPatientsContainer) return;
    
    recentPatientsContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
    
    // Obtener los 10 pacientes más recientes del CESFAM
    const recentPatientsSnapshot = await db.collection('pacientes')
      .where('cesfam_asignado', '==', userData.cesfam_asignado)
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(10)
      .get();
    
    if (recentPatientsSnapshot.empty) {
      recentPatientsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No hay pacientes recientes</h3>
          <p>No se encontraron pacientes en tu CESFAM</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    recentPatientsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      html += generatePatientCard(doc.id, data, false);
    });
    
    recentPatientsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading recent patients:', error);
    document.getElementById('recent-patients-list').innerHTML = '<p>Error al cargar pacientes recientes</p>';
  }
}

// FUNCIÓN NUEVA: Generar tarjeta de paciente para reportes
function generatePatientCard(patientId, data, isSearchResult = false) {
  const cesfamName = cesfamRegionMetropolitana[data.cesfam_asignado]?.nombre || 'CESFAM no especificado';
  
  return `
    <div class="card patient-report-card" data-patient-id="${patientId}">
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
        <div><strong>CESFAM:</strong> ${cesfamName}</div>
        <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
        <div><strong>Fecha ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
        <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'Sin teléfono'}</div>
        <div><strong>Total atenciones:</strong> ${data.historial_clinico?.length || 0}</div>
      </div>
      <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
        <button class="btn btn-primary btn-sm" onclick="viewPatientReportDetail('${patientId}')">
          <i class="fas fa-eye"></i> Ver Ficha
        </button>
        <button class="btn btn-success btn-sm" onclick="downloadPatientReport('${patientId}', 'single')">
          <i class="fas fa-download"></i> Descargar Última Atención
        </button>
        <button class="btn btn-info btn-sm" onclick="downloadPatientReport('${patientId}', 'all')">
          <i class="fas fa-file-pdf"></i> Descargar Todas las Atenciones
        </button>
      </div>
    </div>
  `;
}

// FUNCIÓN NUEVA: Ver detalle de ficha del paciente
async function viewPatientReportDetail(patientId) {
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
    
    showPatientReportDetailModal(patientId, patientData, appointmentsSnapshot.docs);
    
  } catch (error) {
    console.error('Error viewing patient report detail:', error);
    showNotification('Error al cargar ficha del paciente', 'error');
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN NUEVA: Modal con detalle completo del paciente
function showPatientReportDetailModal(patientId, patientData, appointments) {
  const cesfamName = cesfamRegionMetropolitana[patientData.cesfam_asignado]?.nombre || 'CESFAM no especificado';
  
  const modalHTML = `
    <div class="modal-overlay" id="patient-report-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-report-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Ficha del Paciente</h2>
        
        <div class="patient-file-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div><strong>Nombre completo:</strong> ${patientData.datos_personales?.nombre_completo || 'N/A'}</div>
              <div><strong>RUT:</strong> ${patientData.datos_personales?.rut || 'N/A'}</div>
              <div><strong>Edad:</strong> ${patientData.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Dirección:</strong> ${patientData.datos_personales?.direccion || 'N/A'}</div>
              <div><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${patientData.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Estado del Tratamiento</h3>
            <div class="info-grid">
              <div><strong>CESFAM:</strong> ${cesfamName}</div>
              <div><strong>Estado:</strong> <span class="status-badge status-${patientData.estado_actual?.activo ? 'activo' : 'inactivo'}">${patientData.estado_actual?.activo ? 'Activo' : 'Inactivo'}</span></div>
              <div><strong>Programa:</strong> ${patientData.estado_actual?.programa || 'N/A'}</div>
              <div><strong>Fecha de ingreso:</strong> ${formatDate(patientData.estado_actual?.fecha_ingreso)}</div>
              <div><strong>Total atenciones:</strong> ${patientData.historial_clinico?.length || 0}</div>
              <div><strong>Total citas:</strong> ${appointments.length}</div>
            </div>
          </div>
          
          ${patientData.historial_clinico && patientData.historial_clinico.length > 0 ? `
          <div class="detail-section">
            <h3>Historial Clínico (${patientData.historial_clinico.length} registros)</h3>
            <div class="history-list" style="max-height: 300px; overflow-y: auto;">
              ${patientData.historial_clinico.slice().reverse().map((entry, index) => `
                <div class="history-entry">
                  <div class="history-header">
                    <strong>${entry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'}</strong>
                    <span class="history-date">${formatDate(entry.fecha)}</span>
                  </div>
                  <div class="history-content">
                    ${entry.observaciones ? `<p><strong>Observaciones:</strong> ${entry.observaciones}</p>` : ''}
                    ${entry.tipo_atencion ? `<p><strong>Tipo de atención:</strong> ${entry.tipo_atencion}</p>` : ''}
                    ${entry.estado_paciente ? `<p><strong>Estado:</strong> ${entry.estado_paciente}</p>` : ''}
                    ${entry.plan_seguimiento ? `<p><strong>Plan:</strong> ${entry.plan_seguimiento}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          ${appointments.length > 0 ? `
          <div class="detail-section">
            <h3>Citas Registradas (${appointments.length})</h3>
            <div class="appointments-list" style="max-height: 200px; overflow-y: auto;">
              ${appointments.map(doc => {
                const data = doc.data();
                return `
                  <div class="appointment-entry">
                    <div class="appointment-header">
                      <strong>${formatDate(data.fecha)}</strong>
                      <span class="status-badge status-${data.estado}">${data.estado}</span>
                    </div>
                    <div class="appointment-details">
                      <p><strong>Tipo:</strong> ${data.tipo_cita || 'Consulta'}</p>
                      ${data.atencion_realizada ? `<p><strong>Atención:</strong> ${data.atencion_realizada.observaciones}</p>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-success" onclick="downloadPatientReport('${patientId}', 'single')">
            <i class="fas fa-download"></i> Descargar Última Atención PDF
          </button>
          <button class="btn btn-info" onclick="downloadPatientReport('${patientId}', 'all')">
            <i class="fas fa-file-pdf"></i> Descargar Todas las Atenciones PDF
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-report-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-report-detail-modal').style.display = 'flex';
}

// FUNCIÓN NUEVA: Descargar reporte del paciente en PDF
async function downloadPatientReport(patientId, type = 'single') {
  try {
    showLoading(true);
    
    // Obtener datos del paciente
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
    
    // Generar contenido del PDF
    let reportContent = generatePatientPDFContent(patientData, appointmentsSnapshot.docs, type);
    
    // Crear ventana para imprimir/descargar PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte ${patientData.datos_personales?.nombre_completo || 'Paciente'} - SENDA</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #0f4c75; 
              padding-bottom: 20px;
            }
            .section { 
              margin: 20px 0; 
              page-break-inside: avoid;
            }
            .section h3 { 
              color: #0f4c75; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin: 10px 0; 
            }
            .history-entry { 
              margin: 15px 0; 
              padding: 10px; 
              border: 1px solid #ddd; 
              border-radius: 5px;
              page-break-inside: avoid;
            }
            .history-header { 
              font-weight: bold; 
              margin-bottom: 8px; 
              color: #0f4c75;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 12px; 
              color: #666; 
              border-top: 1px solid #ddd; 
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${reportContent}
          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString('es-CL')}</p>
            <p>Sistema SENDA - ${cesfamRegionMetropolitana[currentUserData.cesfam_asignado]?.nombre || 'CESFAM'}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Imprimir automáticamente después de cargar
    printWindow.onload = function() {
      printWindow.print();
    };
    
    showNotification('Reporte generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error downloading patient report:', error);
    showNotification('Error al generar el reporte', 'error');
  } finally {
    showLoading(false);
  }
}

// FUNCIÓN NUEVA: Generar contenido del PDF
function generatePatientPDFContent(patientData, appointments, type) {
  const cesfamName = cesfamRegionMetropolitana[patientData.cesfam_asignado]?.nombre || 'CESFAM no especificado';
  
  let content = `
    <div class="header">
      <h1>REPORTE DE PACIENTE</h1>
      <h2>${patientData.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
      <p>RUT: ${patientData.datos_personales?.rut || 'Sin RUT'}</p>
    </div>
    
    <div class="section">
      <h3>Información Personal</h3>
      <div class="info-grid">
        <div><strong>Nombre:</strong> ${patientData.datos_personales?.nombre_completo || 'N/A'}</div>
        <div><strong>RUT:</strong> ${patientData.datos_personales?.rut || 'N/A'}</div>
        <div><strong>Edad:</strong> ${patientData.datos_personales?.edad || 'N/A'} años</div>
        <div><strong>Dirección:</strong> ${patientData.datos_personales?.direccion || 'N/A'}</div>
        <div><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'N/A'}</div>
        <div><strong>Email:</strong> ${patientData.contacto?.email || 'N/A'}</div>
      </div>
    </div>
    
    <div class="section">
      <h3>Estado del Tratamiento</h3>
      <div class="info-grid">
        <div><strong>CESFAM:</strong> ${cesfamName}</div>
        <div><strong>Estado:</strong> ${patientData.estado_actual?.activo ? 'Activo' : 'Inactivo'}</div>
        <div><strong>Programa:</strong> ${patientData.estado_actual?.programa || 'N/A'}</div>
        <div><strong>Fecha de ingreso:</strong> ${formatDate(patientData.estado_actual?.fecha_ingreso)}</div>
      </div>
    </div>
  `;
  
  // Agregar historial según el tipo solicitado
  if (type === 'single' && patientData.historial_clinico && patientData.historial_clinico.length > 0) {
    const lastEntry = patientData.historial_clinico[patientData.historial_clinico.length - 1];
    content += `
      <div class="section">
        <h3>Última Atención</h3>
        <div class="history-entry">
          <div class="history-header">
            ${lastEntry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'} - ${formatDate(lastEntry.fecha)}
          </div>
          <div class="history-content">
            ${lastEntry.observaciones ? `<p><strong>Observaciones:</strong> ${lastEntry.observaciones}</p>` : ''}
            ${lastEntry.tipo_atencion ? `<p><strong>Tipo de atención:</strong> ${lastEntry.tipo_atencion}</p>` : ''}
            ${lastEntry.estado_paciente ? `<p><strong>Estado del paciente:</strong> ${lastEntry.estado_paciente}</p>` : ''}
            ${lastEntry.plan_seguimiento ? `<p><strong>Plan de seguimiento:</strong> ${lastEntry.plan_seguimiento}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (type === 'all' && patientData.historial_clinico && patientData.historial_clinico.length > 0) {
    content += `
      <div class="section">
        <h3>Historial Completo de Atenciones (${patientData.historial_clinico.length} registros)</h3>
        ${patientData.historial_clinico.slice().reverse().map(entry => `
          <div class="history-entry">
            <div class="history-header">
              ${entry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'} - ${formatDate(entry.fecha)}
            </div>
            <div class="history-content">
              ${entry.observaciones ? `<p><strong>Observaciones:</strong> ${entry.observaciones}</p>` : ''}
              ${entry.tipo_atencion ? `<p><strong>Tipo de atención:</strong> ${entry.tipo_atencion}</p>` : ''}
              ${entry.estado_paciente ? `<p><strong>Estado del paciente:</strong> ${entry.estado_paciente}</p>` : ''}
              ${entry.plan_seguimiento ? `<p><strong>Plan de seguimiento:</strong> ${entry.plan_seguimiento}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return content;
}
// ================= PARTE 10: FUNCIONES AUXILIARES FINALES =================

// Funciones de vista de detalles de pacientes
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
  const cesfamName = cesfamRegionMetropolitana[data.cesfam_asignado]?.nombre || 'CESFAM no especificado';
  
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
              <div><strong>Dirección:</strong> ${data.datos_personales?.direccion || 'N/A'}</div>
              <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${data.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Estado del Tratamiento</h3>
            <div class="info-grid">
              <div><strong>CESFAM:</strong> ${cesfamName}</div>
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
          <button class="btn btn-info" onclick="scheduleAppointmentForPatient('${patientId}')">
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
          ${historial.length > 0 ? historial.slice().reverse().map((entry, index) => `
            <div class="timeline-item">
              <div class="timeline-marker">
                <i class="fas fa-${entry.tipo === 'ingreso_inicial' ? 'user-plus' : 
                                   entry.tipo === 'atencion_clinica' ? 'notes-medical' : 
                                   entry.tipo === 'cita' ? 'calendar-check' : 'file-medical'}"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>${entry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'}</h4>
                  <span class="timeline-date">${formatDate(entry.fecha)}</span>
                </div>
                <div class="timeline-body">
                  ${entry.observaciones ? `<p><strong>Observaciones:</strong> ${entry.observaciones}</p>` : ''}
                  ${entry.tipo_atencion ? `<p><strong>Tipo de atención:</strong> ${entry.tipo_atencion}</p>` : ''}
                  ${entry.estado_paciente ? `<p><strong>Estado del paciente:</strong> ${entry.estado_paciente}</p>` : ''}
                  ${entry.plan_seguimiento ? `<p><strong>Plan de seguimiento:</strong> ${entry.plan_seguimiento}</p>` : ''}
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
              <option value="atencion_clinica">Atención clínica</option>
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
            <input type="datetime-local" class="form-input" id="next-appointment" 
                   min="${new Date().toISOString().slice(0, 16)}">
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
      observaciones: document.getElementById('followup-notes').value,
      estado_paciente: document.getElementById('patient-status').value
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
    
    // Recargar panel activo
    const activePanel = document.querySelector('.panel-content.active');
    if (activePanel) {
      const panelId = activePanel.id.replace('-panel', '');
      showPanel(panelId, currentUserData);
    }
    
  } catch (error) {
    console.error('Error saving followup note:', error);
    showNotification('Error al guardar la nota de seguimiento', 'error');
  } finally {
    showLoading(false);
  }
}

// Funciones auxiliares para citas
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
    
    let query = db.collection('citas')
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha', 'asc');
    
    // Filtrar por CESFAM del usuario
    query = query.where('cesfam', '==', currentUserData.cesfam_asignado);
    
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
            ${data.profesional_id === currentUserData.uid ? `
            <button class="btn btn-sm btn-secondary" onclick="editAppointment('${doc.id}')">
              <i class="fas fa-edit"></i>
            </button>
            ` : ''}
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
                      <h4>Paciente: <span id="patient-name-${doc.id}">Cargando...</span></h4>
                      <p>Tipo: ${data.tipo_cita || 'Consulta general'}</p>
                      <p>Duración: ${data.duracion_minutos || 60} minutos</p>
                      <p>Estado: <span class="status-badge status-${data.estado}">${data.estado}</span></p>
                      ${data.notas_previas ? `<p>Notas: ${data.notas_previas}</p>` : ''}
                    </div>
                    <div class="appointment-actions">
                      ${data.estado === 'programada' ? `
                      <button class="btn btn-sm btn-success" onclick="markAppointmentCompleted('${doc.id}')">
                        <i class="fas fa-check"></i> Completar
                      </button>
                      ` : ''}
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
          const nameElement = document.getElementById(`patient-name-${doc.id}`);
          if (nameElement) {
            nameElement.textContent = patientData.datos_personales?.nombre_completo || 'Sin nombre';
          }
        }
      } catch (error) {
        console.error('Error loading patient name:', error);
      }
    }
  }
}

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

// Funciones de limpieza y utilidades finales
function handleNetworkError(error) {
  console.error('Network error:', error);
  
  if (!navigator.onLine) {
    showNotification('Sin conexión a internet. Verifica tu conexión.', 'error', 10000);
  } else {
    showNotification('Error de conexión. Intenta nuevamente.', 'error');
  }
}

// Listeners para estado de la conexión
window.addEventListener('online', function() {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', function() {
  showNotification('Sin conexión a internet', 'warning', 10000);
});

// Limpiar datos sensibles al cerrar
window.addEventListener('beforeunload', function() {
  localStorage.removeItem('senda_draft');
});

// Funciones auxiliares para completar funcionalidades
function showNewAppointmentModal(preselectedDateTime = null) {
  showNotification('Modal de nueva cita - funcionalidad disponible en agenda', 'info');
}

function showNewAppointmentForDay(dateISO, professionalId) {
  const date = new Date(dateISO);
  const formattedDateTime = date.toISOString().slice(0, 16);
  showNewAppointmentModal(formattedDateTime);
}

function viewAppointment(appointmentId) {
  showNotification('Ver detalle de cita - funcionalidad en desarrollo', 'info');
}

function editAppointment(appointmentId) {
  showNotification('Editar cita - funcionalidad en desarrollo', 'info');
}

console.log('SENDA System - All modules loaded successfully');

