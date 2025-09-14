// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO COMPLETO APP.13 =================
// PARTE 1: Configuración, Variables Globales y Funciones Utilitarias

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

// Initialize Firebase con manejo de errores mejorado
let auth, db;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();
  
  // Configurar persistencia offline
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

// Variables globales MODIFICADAS
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 3; // MODIFICADO: Ahora solo 3 pasos para solicitud identificada
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
let solicitudesInformacionData = []; // NUEVO: Para solicitudes de información

// MODIFICADO: Configuración de horarios extendida con fines de semana
const HORARIOS_CONFIG = {
  semana: {
    horaInicio: 8, // 08:00
    horaFin: 16, // 16:30
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [1, 2, 3, 4, 5] // Lunes a Viernes
  },
  finSemana: {
    horaInicio: 9, // 09:00
    horaFin: 12, // 12:30
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [0, 6] // Sábado y Domingo
  }
};

// Configuración de la aplicación
const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 50,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  DEBUG_MODE: true
};

// Cache simple para datos
const dataCache = new Map();

// ================= FUNCIONES UTILITARIAS MEJORADAS =================

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
    } else {
      console.error(`❌ Modal ${modalId} no encontrado`);
      showNotification(`Error: Modal ${modalId} no encontrado`, 'error');
    }
  } catch (error) {
    console.error('Error showing modal:', error);
    showNotification('Error al abrir modal', 'error');
  }
}

function closeModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
      // MODIFICADO: Verificar cambios solo en formulario de pacientes
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

// MODIFICADAS: Funciones para horarios extendidos con fines de semana
function generateTimeSlots(date = null) {
  const slots = [];
  const targetDate = date || new Date();
  const dayOfWeek = targetDate.getDay();
  
  // Determinar si es fin de semana o día de semana
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const config = isWeekend ? HORARIOS_CONFIG.finSemana : HORARIOS_CONFIG.semana;
  
  const { horaInicio, horaFin, minutoFin, intervaloMinutos } = config;
  
  for (let hora = horaInicio; hora <= horaFin; hora++) {
    for (let minuto = 0; minuto < 60; minuto += intervaloMinutos) {
      // No agregar slots después de la hora de fin
      if (hora === horaFin && minuto > minutoFin) break;
      
      const timeString = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
      slots.push({
        time: timeString,
        hour: hora,
        minute: minuto,
        available: true
      });
    }
  }
  
  return slots;
}

function isWorkingDay(date) {
  // MODIFICADO: Ahora todos los días son laborables (lunes a domingo)
  return true;
}

function getWorkingHours(date) {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    return {
      inicio: '09:00',
      fin: '12:30',
      config: HORARIOS_CONFIG.finSemana
    };
  } else {
    return {
      inicio: '08:00',
      fin: '16:30',
      config: HORARIOS_CONFIG.semana
    };
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
      const data = doc.data();
      professionals.push({
        id: doc.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        profession: data.profession,
        cesfam: data.cesfam,
        email: data.email
      });
    });
    
    return professionals;
  } catch (error) {
    console.error('Error loading professionals:', error);
    return [];
  }
}

// NUEVA: Función para verificar acceso basado en profesión
function hasAccessToSolicitudes() {
  if (!currentUserData) return false;
  // Solo asistentes sociales pueden ver solicitudes
  return currentUserData.profession === 'asistente_social';
}

function canAccessTab(tabName) {
  if (!currentUserData) return false;
  
  switch (tabName) {
    case 'solicitudes':
      // Solo asistentes sociales pueden acceder a solicitudes
      return currentUserData.profession === 'asistente_social';
    case 'agenda':
    case 'seguimiento':
    case 'pacientes':
      // Todos los profesionales pueden acceder a estas tabs
      return true;
    default:
      return false;
  }
}

// Resto de las funciones utilitarias siguen igual...
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

function formatPhoneNumber(phone) {
  try {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 8 && !cleaned.startsWith('9')) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
    }
    
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('56')) {
      return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('569')) {
      return '+' + cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    
    return phone;
  } catch (error) {
    console.error('Error formatting phone:', error);
    return phone;
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

function calculatePriority(evaluationData) {
  try {
    let score = 0;
    
    if (evaluationData.sustancias?.includes('pasta_base')) score += 4;
    if (evaluationData.sustancias?.includes('cocaina')) score += 3;
    if (evaluationData.sustancias?.includes('alcohol')) score += 1;
    if (evaluationData.sustancias?.includes('marihuana')) score += 1;
    
    if (evaluationData.edad < 18) score += 3;
    if (evaluationData.edad >= 65) score += 2;
    
    const tiempoConsumo = evaluationData.tiempoConsumo;
    if (tiempoConsumo === '60+') score += 3;
    if (tiempoConsumo === '24-60') score += 2;
    if (tiempoConsumo === '12-24') score += 1;
    
    if (evaluationData.urgencia === 'critica') score += 5;
    if (evaluationData.urgencia === 'alta') score += 3;
    if (evaluationData.urgencia === 'media') score += 1;
    
    const motivacion = parseInt(evaluationData.motivacion) || 5;
    if (motivacion <= 3) score += 2;
    if (motivacion >= 8) score -= 1;
    
    if (evaluationData.tratamientoPrevio === 'si_senda') score += 2;
    if (evaluationData.tratamientoPrevio === 'si_otro') score += 1;
    
    const descripcion = (evaluationData.descripcion || evaluationData.razon || '').toLowerCase();
    const palabrasCriticas = ['suicid', 'muerte', 'morir', 'matar', 'crisis', 'emergencia', 'urgente', 'desesper'];
    
    for (const palabra of palabrasCriticas) {
      if (descripcion.includes(palabra)) {
        score += 4;
        break;
      }
    }
    
    if (score >= 8) return 'critica';
    if (score >= 5) return 'alta';
    if (score >= 2) return 'media';
    return 'baja';
    
  } catch (error) {
    console.error('Error calculating priority:', error);
    return 'media';
  }
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

// ================= INICIALIZACIÓN =================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 SENDA Puente Alto iniciando...');
  try {
    initializeApp();
  } catch (error) {
    console.error('❌ Error en DOMContentLoaded:', error);
    showNotification('Error al inicializar la aplicación: ' + error.message, 'error');
  }
});

function initializeApp() {
  try {
    if (!firebase) {
      throw new Error('Firebase SDK no cargado');
    }
    
    if (!auth || !db) {
      throw new Error('Firebase no está inicializado correctamente');
    }

    document.title = "PROGRAMA SENDA PUENTE ALTO";
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) {
      mainTitle.textContent = "PROGRAMA SENDA PUENTE ALTO";
    }

    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    setupCalendar();
    setupFilters();
    
    auth.onAuthStateChanged(onAuthStateChanged);
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.log('✅ SENDA Platform inicializado correctamente');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
    
  } catch (error) {
    console.error('❌ Error inicializando app:', error);
    showNotification('Error al cargar el sistema: ' + error.message, 'error');
  }
}

function handleGlobalError(event) {
  console.error('❌ Error global:', event.error);
  if (APP_CONFIG.DEBUG_MODE) {
    showNotification(`Error: ${event.error.message}`, 'error');
  }
}

function handleUnhandledRejection(event) {
  console.error('❌ Promise rechazada:', event.reason);
  if (APP_CONFIG.DEBUG_MODE) {
    showNotification(`Error async: ${event.reason.message || event.reason}`, 'error');
  }
}
// ================= PARTE 2: GESTIÓN DE EVENTOS Y AUTENTICACIÓN - MODIFICADO =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    const searchSolicitudes = document.getElementById('search-solicitudes');
    // ELIMINADO: searchSeguimiento ya que se quitó la búsqueda del seguimiento
    const searchPacientesRut = document.getElementById('search-pacientes-rut');
    const buscarPacienteBtn = document.getElementById('buscar-paciente-btn');
    
    const priorityFilter = document.getElementById('priority-filter');
    
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

    if (loginProfessionalBtn) {
      loginProfessionalBtn.addEventListener('click', () => {
        if (APP_CONFIG.DEBUG_MODE) console.log('🔧 Abriendo modal de login');
        showModal('login-modal');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    if (registerPatientBtn) {
      registerPatientBtn.addEventListener('click', () => {
        if (APP_CONFIG.DEBUG_MODE) console.log('🔧 Abriendo modal de registro de paciente');
        showModal('patient-modal');
      });
    }

    if (reentryProgramBtn) {
      reentryProgramBtn.addEventListener('click', () => {
        if (APP_CONFIG.DEBUG_MODE) console.log('🔧 Abriendo modal de reingreso');
        showModal('reentry-modal');
      });
    }

    if (aboutProgramBtn) {
      aboutProgramBtn.addEventListener('click', showAboutProgram);
    }

    if (searchSolicitudes) {
      searchSolicitudes.addEventListener('input', debounce(filterSolicitudes, 300));
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
      priorityFilter.addEventListener('change', filterSolicitudes);
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-solicitudes');
      if (searchInput && searchInput.style.display !== 'none') {
        searchInput.focus();
      }
    }
    
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

function clearUserCache() {
  try {
    solicitudesData = [];
    pacientesData = [];
    citasData = [];
    professionalsList = [];
    solicitudesInformacionData = []; // NUEVO
    
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
    console.error('❌ Error cargando datos del usuario:', error);
    
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
    const loadPromises = [];
    
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda'; // MODIFICADO: Default a agenda
    
    // MODIFICADO: Solo cargar solicitudes si el usuario es asistente social
    if (activeTab === 'solicitudes' && hasAccessToSolicitudes()) {
      loadPromises.push(loadSolicitudes());
    } else if (activeTab === 'pacientes') {
      loadPromises.push(loadPacientes());
    } else if (activeTab === 'agenda') {
      loadPromises.push(loadTodayAppointments());
    } else if (activeTab === 'seguimiento') {
      loadPromises.push(loadSeguimiento());
    }
    
    loadPromises.push(loadProfessionalsList());
    
    await Promise.allSettled(loadPromises);
    
  } catch (error) {
    console.error('❌ Error cargando datos iniciales:', error);
  }
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
    
    professionalsList = professionals;
    setCachedData(cacheKey, professionals);
    
  } catch (error) {
    console.error('Error loading professionals list:', error);
  }
}

function showPublicContent() {
  try {
    const publicContent = document.getElementById('public-content');
    const professionalContent = document.getElementById('professional-content');
    const professionalHeader = document.getElementById('professional-header');
    const loginBtn = document.getElementById('login-professional');

    if (publicContent) publicContent.style.display = 'block';
    if (professionalContent) professionalContent.style.display = 'none';
    if (professionalHeader) professionalHeader.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    
    console.log('📄 Mostrando contenido público');
  } catch (error) {
    console.error('❌ Error mostrando contenido público:', error);
  }
}

function showProfessionalContent() {
  try {
    const publicContent = document.getElementById('public-content');
    const professionalContent = document.getElementById('professional-content');
    const professionalHeader = document.getElementById('professional-header');
    const loginBtn = document.getElementById('login-professional');

    if (publicContent) publicContent.style.display = 'none';
    if (professionalContent) professionalContent.style.display = 'block';
    if (professionalHeader) professionalHeader.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    
    if (currentUserData) {
      updateProfessionalInfo();
      updateTabVisibility(); // NUEVO: Actualizar visibilidad de tabs según profesión
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  } catch (error) {
    console.error('❌ Error mostrando contenido profesional:', error);
  }
}

// NUEVA: Función para actualizar visibilidad de tabs según profesión
function updateTabVisibility() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
      const tabName = btn.dataset.tab;
      if (canAccessTab(tabName)) {
        btn.style.display = 'flex';
      } else {
        btn.style.display = 'none';
        // Si la tab activa no es accesible, cambiar a agenda
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

// ================= AUTENTICACIÓN CORREGIDA =================

function setupModalControls() {
  try {
    const modalTabs = document.querySelectorAll('.modal-tab');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        const modal = tab.closest('.modal');
        
        if (modal) {
          modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          modal.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
          const targetForm = modal.querySelector(`#${targetTab}-form`);
          if (targetForm) {
            targetForm.classList.add('active');
            
            setTimeout(() => {
              const firstInput = targetForm.querySelector('input:not([type="hidden"])');
              if (firstInput) firstInput.focus();
            }, 100);
          }
        }
      });
    });

    const closeButtons = document.querySelectorAll('.modal-close, [data-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = btn.dataset.close || btn.closest('.modal-overlay').id;
        closeModal(modalId);
      });
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    
    console.log('✅ Controles de modal configurados');
  } catch (error) {
    console.error('❌ Error configurando controles de modal:', error);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  try {
    const email = document.getElementById('login-email')?.value?.trim() || '';
    const password = document.getElementById('login-password')?.value || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
      showNotification('Por favor completa todos los campos', 'warning');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification('Email inválido', 'warning');
      return;
    }

    toggleSubmitButton(submitBtn, true);
    
    await retryOperation(async () => {
      await auth.signInWithEmailAndPassword(email, password);
    });
    
    closeModal('login-modal');
    showNotification('Sesión iniciada correctamente', 'success');
    
    e.target.reset();
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    
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
      case 'auth/user-disabled':
        message = 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos fallidos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      default:
        message = 'Error al iniciar sesión. Intenta nuevamente';
    }
    
    showNotification(message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  try {
    const formData = {
      nombre: document.getElementById('register-name')?.value?.trim() || '',
      apellidos: document.getElementById('register-lastname')?.value?.trim() || '',
      rut: document.getElementById('register-rut')?.value?.trim() || '',
      profession: document.getElementById('register-profession')?.value || '',
      cesfam: document.getElementById('register-cesfam')?.value || '',
      email: document.getElementById('register-email')?.value?.trim() || '',
      password: document.getElementById('register-password')?.value || ''
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validaciones
    if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
      showNotification('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    if (!validateRUT(formData.rut)) {
      showNotification('RUT inválido', 'warning');
      return;
    }

    if (!isValidEmail(formData.email)) {
      showNotification('Email inválido', 'warning');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    if (!formData.profession || !formData.cesfam) {
      showNotification('Selecciona profesión y CESFAM', 'warning');
      return;
    }

    toggleSubmitButton(submitBtn, true);
    
    // Verificar si el RUT ya existe
    const rutFormatted = formatRUT(formData.rut);
    try {
      const existingUser = await db.collection('profesionales')
        .where('rut', '==', rutFormatted)
        .get();
      
      if (!existingUser.empty) {
        throw new Error('Ya existe un profesional registrado con este RUT');
      }
    } catch (queryError) {
      if (queryError.message.includes('RUT')) {
        throw queryError;
      }
      console.warn('⚠️ Error verificando RUT (continuando):', queryError);
    }
    
    // Crear usuario en Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    const professionalData = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      rut: rutFormatted,
      profession: formData.profession,
      cesfam: formData.cesfam,
      email: formData.email,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      activo: true,
      configuracion: {
        notificaciones: true,
        idioma: 'es'
      }
    };
    
    // Guardar en Firestore con el UID como ID del documento
    await db.collection('profesionales').doc(user.uid).set(professionalData);
    
    closeModal('login-modal');
    showNotification('Cuenta creada exitosamente. ¡Bienvenido al sistema SENDA!', 'success');
    
    e.target.reset();
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
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
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      case 'permission-denied':
        message = 'Sin permisos para crear profesional. Verifica las reglas de Firebase.';
        break;
      default:
        if (error.message.includes('RUT')) {
          message = error.message;
        }
    }
    
    showNotification(message, 'error');
    
    // Si se creó el usuario pero falló Firestore, eliminarlo
    if (error.code === 'permission-denied' && auth.currentUser) {
      try {
        await auth.currentUser.delete();
        console.log('Usuario de autenticación eliminado debido a error en Firestore');
      } catch (deleteError) {
        console.error('Error eliminando usuario:', deleteError);
      }
    }
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

function toggleSubmitButton(button, loading) {
  try {
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline-flex';
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  } catch (error) {
    console.error('Error toggling submit button:', error);
  }
}

async function handleLogout() {
  try {
    const confirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmed) return;
    
    showLoading(true, 'Cerrando sesión...');
    
    await auth.signOut();
    showNotification('Sesión cerrada correctamente', 'info');
    
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  } finally {
    showLoading(false);
  }
}

// ================= FUNCIONES DE TABS Y CONFIGURACIÓN =================

function setupTabFunctionality() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Verificar acceso a la tab
        if (!canAccessTab(targetTab)) {
          showNotification('No tienes permisos para acceder a esta sección', 'warning');
          return;
        }

        // Remover active de todos los botones y panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        // Activar el botón y pane clickeado
        btn.classList.add('active');
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          loadTabData(targetTab);
        }
      });
    });

    console.log('✅ Funcionalidad de tabs configurada');
  } catch (error) {
    console.error('❌ Error configurando tabs:', error);
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

function setupFilters() {
  try {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilter = btn.dataset.filter;
        filterSolicitudes();
      });
    });
    
    console.log('✅ Filtros configurados');
  } catch (error) {
    console.error('❌ Error configurando filtros:', error);
  }
}

function setupCalendar() {
  try {
    currentCalendarDate = new Date();
    renderCalendar();
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Calendario configurado');
    }
  } catch (error) {
    console.error('❌ Error configurando calendario:', error);
  }
}

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

// ================= CONTINÚA EN PARTE 3 PARA FORMULARIOS Y GESTIÓN =================
// Las siguientes funciones incluyen los formularios multi-paso modificados,
// gestión de solicitudes, calendario con horarios extendidos, 
// seguimiento de pacientes y todas las funcionalidades del app.13
// ================= PARTE 3: FORMULARIOS Y VALIDACIONES DEL APP.13 =================

function setupFormValidation() {
  try {
    const rutInputs = document.querySelectorAll('input[id*="rut"], input[placeholder*="RUT"]');
    rutInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const formatted = formatRUT(e.target.value);
        e.target.value = formatted;
        
        if (formatted.length > 3) {
          if (validateRUT(formatted)) {
            e.target.classList.remove('error');
            e.target.classList.add('valid');
          } else {
            e.target.classList.add('error');
            e.target.classList.remove('valid');
          }
        }
      });
      
      input.addEventListener('blur', (e) => {
        const rut = e.target.value.trim();
        if (rut && !validateRUT(rut)) {
          e.target.classList.add('error');
          showFieldError(e.target, 'RUT inválido');
        } else {
          e.target.classList.remove('error');
          clearFieldError(e.target);
        }
      });
    });

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d\s\+\-]/g, '');
      });
      
      input.addEventListener('blur', (e) => {
        if (e.target.value) {
          e.target.value = formatPhoneNumber(e.target.value);
          validatePhoneNumber(e.target);
        }
      });
    });

    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const email = e.target.value.trim();
        if (email) {
          if (isValidEmail(email)) {
            e.target.classList.remove('error');
            e.target.classList.add('valid');
            clearFieldError(e.target);
          } else {
            e.target.classList.add('error');
            e.target.classList.remove('valid');
            showFieldError(e.target, 'Email inválido');
          }
        }
      });
    });

    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
      input.addEventListener('blur', validateRequiredField);
      input.addEventListener('input', clearFieldErrorOnInput);
    });

    console.log('✅ Validación de formularios configurada');
  } catch (error) {
    console.error('❌ Error configurando validación de formularios:', error);
  }
}

function validateRequiredField(e) {
  const field = e.target;
  if (field.required && !field.value.trim()) {
    field.classList.add('error');
    showFieldError(field, 'Este campo es obligatorio');
  } else {
    field.classList.remove('error');
    clearFieldError(field);
  }
}

function clearFieldErrorOnInput(e) {
  const field = e.target;
  if (field.classList.contains('error') && field.value.trim()) {
    field.classList.remove('error');
    clearFieldError(field);
  }
}

function showFieldError(field, message) {
  try {
    clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--danger-red)';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '4px';
    
    field.parentNode.appendChild(errorElement);
  } catch (error) {
    console.error('Error showing field error:', error);
  }
}

function clearFieldError(field) {
  try {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  } catch (error) {
    console.error('Error clearing field error:', error);
  }
}

function validatePhoneNumber(input) {
  const phone = input.value.replace(/\D/g, '');
  
  const isValid = phone.length === 8 || // Fijo
                  phone.length === 9 && phone.startsWith('9') || // Celular sin código
                  phone.length === 11 && phone.startsWith('56') || // Con código país
                  phone.length === 12 && phone.startsWith('569'); // Celular con código país
  
  if (isValid) {
    input.classList.remove('error');
    input.classList.add('valid');
    clearFieldError(input);
  } else {
    input.classList.add('error');
    input.classList.remove('valid');
    showFieldError(input, 'Número de teléfono inválido');
  }
  
  return isValid;
}

// ================= FORMULARIO MULTI-PASO DEL APP.13 =================

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

    // MODIFICADO: Listener para tipo de solicitud del app.13
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', updateFormVisibility);
    });

    // NUEVO: Botón especial para envío directo de información
    const sendInfoBtn = document.getElementById('send-info-btn');
    if (sendInfoBtn) {
      sendInfoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInformationOnlySubmit();
      });
    }

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

// MODIFICADAS: Funciones para nuevo flujo de pasos del app.13 (3 pasos para identificado, 1 para información)
function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  switch (currentStep) {
    case 1:
      if (tipoSolicitud === 'informacion') {
        return null; // No hay siguiente paso para información - se envía directamente
      } else if (tipoSolicitud === 'identificado') {
        return 2; // Ir a datos personales
      }
      break;
    case 2:
      return 3; // De datos personales a evaluación/finalización
    case 3:
      return null; // No hay siguiente paso
  }
  return null;
}

function getPreviousStep(currentStep) {
  switch (currentStep) {
    case 2:
      return 1; // De datos personales a tipo de solicitud
    case 3:
      return 2; // De evaluación a datos personales
  }
  return null;
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
    draftData.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
    isDraftSaved = true;
    
    showDraftSavedIndicator();
    
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
    
    if (confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?')) {
      restoreFormDraft(draftData);
    }
  } catch (error) {
    console.error('Error loading form draft:', error);
  }
}

function restoreFormDraft(draftData) {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = field.value === draftData[key];
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    if (draftData.currentStep) {
      goToStep(draftData.currentStep);
    }
    
    updateFormVisibility();
    
    showNotification('Borrador restaurado correctamente', 'success');
    
  } catch (error) {
    console.error('Error restoring form draft:', error);
  }
}

function showDraftSavedIndicator() {
  try {
    const indicator = document.createElement('div');
    indicator.className = 'draft-saved-indicator';
    indicator.innerHTML = '<i class="fas fa-save"></i> Borrador guardado';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-green);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    requestAnimationFrame(() => {
      indicator.style.opacity = '1';
    });
    
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 2000);
    
  } catch (error) {
    console.error('Error showing draft saved indicator:', error);
  }
}

// MODIFICADA: Función para manejar visibilidad según tipo de solicitud del app.13
function updateFormVisibility() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const infoEmailContainer = document.getElementById('info-email-container');
    const basicInfoContainer = document.getElementById('basic-info-container');
    const nextBtn = document.getElementById('next-step-1');
    const sendInfoBtn = document.getElementById('send-info-btn');
    const progressText = document.getElementById('progress-text');
    
    // Resetear visibilidad
    if (infoEmailContainer) infoEmailContainer.style.display = 'none';
    if (basicInfoContainer) basicInfoContainer.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (sendInfoBtn) sendInfoBtn.style.display = 'none';
    
    if (tipoSolicitud === 'informacion') {
      // Mostrar solo email para información
      if (infoEmailContainer) infoEmailContainer.style.display = 'block';
      if (basicInfoContainer) basicInfoContainer.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (sendInfoBtn) sendInfoBtn.style.display = 'inline-flex';
      if (progressText) progressText.textContent = 'Paso 1 de 1';
      
      const emailInput = document.getElementById('info-email');
      if (emailInput) {
        emailInput.required = true;
        setTimeout(() => emailInput.focus(), 100);
      }
      
      // Actualizar maxFormStep para información
      maxFormStep = 1;
    } else if (tipoSolicitud === 'identificado') {
      // Mostrar campos básicos para solicitud identificada
      if (infoEmailContainer) infoEmailContainer.style.display = 'none';
      if (basicInfoContainer) basicInfoContainer.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (sendInfoBtn) sendInfoBtn.style.display = 'none';
      if (progressText) progressText.textContent = 'Paso 1 de 3'; // MODIFICADO: 3 pasos en app.13
      
      const emailInput = document.getElementById('info-email');
      if (emailInput) emailInput.required = false;
      
      // Actualizar maxFormStep para identificado
      maxFormStep = 3; // MODIFICADO: 3 pasos en app.13
    }
    
    setTimeout(saveFormDraft, 500);
    
  } catch (error) {
    console.error('Error updating form visibility:', error);
  }
}

// ================= VALIDACIÓN DE PASOS DEL APP.13 =================

function validateStep(step) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
    let isValid = true;
    const errors = [];

    // Validar campos requeridos visibles
    requiredFields.forEach(field => {
      const value = field.value?.trim() || '';
      
      if (!value) {
        field.classList.add('error');
        showFieldError(field, 'Este campo es obligatorio');
        errors.push(`${getFieldLabel(field)} es obligatorio`);
        isValid = false;
      } else {
        field.classList.remove('error');
        clearFieldError(field);
      }
    });

    // Validaciones específicas por paso
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
        // Validar campos básicos para solicitudes identificadas
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

function validatePhoneNumberString(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
}

function getFieldLabel(field) {
  try {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  } catch (error) {
    return 'Campo';
  }
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
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
  }
}

// NUEVA FUNCIÓN PARA MANEJO DE SOLICITUD SOLO INFORMACIÓN DEL APP.13
async function handleInformationOnlySubmit() {
  try {
    console.log('🔧 Procesando solicitud de información únicamente...');
    
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
    
    console.log('💾 Guardando solicitud de información...');
    
    // Guardar en la nueva colección de solicitudes_informacion
    await db.collection('solicitudes_informacion').add(informationData);
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 'success', 6000);
    
  } catch (error) {
    console.error('❌ Error enviando información:', error);
    showNotification('Error al enviar la solicitud: ' + error.message, 'error');
  }
}

function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      goToStep(1);
      
      // Resetear visibilidad
      const infoEmail = document.getElementById('info-email-container');
      const basicInfo = document.getElementById('basic-info-container');
      const nextBtn = document.getElementById('next-step-1');
      const sendInfoBtn = document.getElementById('send-info-btn');
      
      if (infoEmail) infoEmail.style.display = 'none';
      if (basicInfo) basicInfo.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (sendInfoBtn) sendInfoBtn.style.display = 'none';
      
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
      
      form.querySelectorAll('.field-error').forEach(error => {
        error.remove();
      });
      
      // Resetear maxFormStep del app.13
      maxFormStep = 3; // MODIFICADO: 3 pasos en app.13
      
      const progressText = document.getElementById('progress-text');
      if (progressText) progressText.textContent = 'Paso 1 de 3'; // MODIFICADO
    }
    
    isDraftSaved = false;
    localStorage.removeItem('senda_form_draft');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🔧 Formulario reseteado');
    }
  } catch (error) {
    console.error('❌ Error reseteando formulario:', error);
  }
}

// ================= CONTINÚA EN PARTE 4 =================
// La parte 4 incluirá: gestión de solicitudes, calendario con horarios extendidos,
// seguimiento de pacientes, gestión de citas y todas las funciones específicas del app.13
// ================= PARTE 4: GESTIÓN COMPLETA DE SOLICITUDES Y FUNCIONALIDADES DEL APP.13 =================

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  console.log('📄 Iniciando envío de solicitud...');
  
  const submitBtn = document.getElementById('submit-form');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (!tipoSolicitud) {
      showNotification('Selecciona un tipo de solicitud', 'warning');
      return;
    }

    // Solo procesar solicitudes identificadas aquí (las de información ya se procesaron)
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

    // Validar campos específicos para solicitudes identificadas
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
    console.log('📋 Datos recopilados:', solicitudData);
    
    solicitudData.prioridad = calculatePriority(solicitudData);
    console.log('⚡ Prioridad calculada:', solicitudData.prioridad);
    
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    console.log('💾 Guardando en Firestore...');
    
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_ingreso').add(solicitudData);
    });
    
    console.log('✅ Solicitud guardada con ID:', docRef.id);
    
    if (solicitudData.prioridad === 'critica') {
      try {
        await createCriticalAlert(solicitudData, docRef.id);
        console.log('🚨 Alerta crítica creada');
      } catch (alertError) {
        console.warn('⚠️ Error creando alerta crítica:', alertError);
      }
    }
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.', 'success', 6000);
    console.log('🎉 Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error enviando solicitud:', error);
    
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

    // Datos de evaluación
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

    // Datos específicos para solicitudes identificadas
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

async function handleReentrySubmit(e) {
  e.preventDefault();
  console.log('📄 Iniciando envío de reingreso...');
  
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
      console.warn('⚠️ Error verificando reingresos existentes:', queryError);
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
    console.error('❌ Error enviando reingreso:', error);
    
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
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🚨 Alerta crítica creada para solicitud:', solicitudId);
    }
  } catch (error) {
    console.error('❌ Error creando alerta crítica:', error);
  }
}

// ================= GESTIÓN DE SOLICITUDES DEL APP.13 =================

async function loadSolicitudes() {
  // Solo cargar si el usuario tiene acceso (asistentes sociales)
  if (!currentUserData || !hasAccessToSolicitudes()) {
    console.log('⚠️ Usuario no tiene acceso a solicitudes');
    return;
  }

  try {
    showLoading(true, 'Cargando solicitudes...');
    const container = document.getElementById('requests-container');
    
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      solicitudesData = cachedData;
      renderSolicitudes(cachedData);
      loadSolicitudesFromFirestore(false);
      return;
    }
    
    await loadSolicitudesFromFirestore(true);
    
  } catch (error) {
    console.error('❌ Error general cargando solicitudes:', error);
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
    const loadPromises = [];
    
    // Solo cargar solicitudes que no estén agendadas
    loadPromises.push(
      retryOperation(async () => {
        try {
          const snapshot = await db.collection('solicitudes_ingreso')
            .where('cesfam', '==', currentUserData.cesfam)
            .where('estado', '!=', 'agendada')
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();
          
          snapshot.forEach(doc => {
            solicitudes.push({
              id: doc.id,
              tipo: 'solicitud',
              ...doc.data()
            });
          });
          
          if (APP_CONFIG.DEBUG_MODE) {
            console.log(`✅ Cargadas ${snapshot.size} solicitudes de ingreso`);
          }
        } catch (error) {
          if (error.code === 'permission-denied') {
            console.warn('⚠️ Sin permisos para solicitudes_ingreso');
          } else {
            throw error;
          }
        }
      })
    );
    
    loadPromises.push(
      retryOperation(async () => {
        try {
          const snapshot = await db.collection('reingresos')
            .where('cesfam', '==', currentUserData.cesfam)
            .where('estado', '!=', 'agendada')
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();
          
          snapshot.forEach(doc => {
            solicitudes.push({
              id: doc.id,
              tipo: 'reingreso',
              ...doc.data()
            });
          });
          
          if (APP_CONFIG.DEBUG_MODE) {
            console.log(`✅ Cargados ${snapshot.size} reingresos`);
          }
        } catch (error) {
          if (error.code === 'permission-denied') {
            console.warn('⚠️ Sin permisos para reingresos');
          } else {
            throw error;
          }
        }
      })
    );
    
    await Promise.allSettled(loadPromises);
    
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    solicitudesData = solicitudes;
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    renderSolicitudes(solicitudes);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Total solicitudes cargadas: ${solicitudes.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error cargando desde Firestore:', error);
    renderSolicitudesError(error);
  }
}

function renderSolicitudes(solicitudes) {
  try {
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }

    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-inbox"></i>
          <h3>No hay solicitudes pendientes</h3>
          <p>No se encontraron solicitudes pendientes para tu CESFAM</p>
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
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Renderizadas ${solicitudes.length} solicitudes`);
    }
  } catch (error) {
    console.error('❌ Error renderizando solicitudes:', error);
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
    } else {
      tipoIcon = 'fa-user-plus';
      if (solicitud.tipoSolicitud === 'identificado') {
        titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
        subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      } else {
        titulo = 'Solicitud de Información';
        subtitulo = `Email: ${solicitud.email || 'No disponible'}`;
        tipoIcon = 'fa-info-circle';
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
      'completada': 'fa-check-circle'
    };

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
          </div>
        </div>
        
        <div class="request-body">
          ${sustanciasHtml ? `<div class="request-substances" style="margin-bottom: 8px;">${sustanciasHtml}</div>` : ''}
          ${solicitud.descripcion || solicitud.motivo ? 
            `<p class="request-description" style="color: var(--gray-700); line-height: 1.5;">${truncateText(solicitud.descripcion || solicitud.motivo, 150)}</p>` : ''}
          
          <div class="request-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--gray-600);">
            <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
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
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModal('${solicitud.id}')" title="Agendar cita">
            <i class="fas fa-calendar-plus"></i>
            Agendar
          </button>
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
    console.error('❌ Error creando tarjeta de solicitud:', error);
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

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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

// ================= FILTROS Y BÚSQUEDA =================

function filterSolicitudes() {
  try {
    const searchTerm = document.getElementById('search-solicitudes')?.value?.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    
    let filteredSolicitudes = solicitudesData;
    
    // Filtrar por estado
    if (currentFilter !== 'todas') {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.estado === currentFilter);
    }
    
    // Filtrar por prioridad
    if (priorityFilter) {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.prioridad === priorityFilter);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filteredSolicitudes = filteredSolicitudes.filter(s => {
        const searchableText = `
          ${s.nombre || ''} 
          ${s.apellidos || ''} 
          ${s.rut || ''} 
          ${s.email || ''} 
          ${s.descripcion || ''} 
          ${s.motivo || ''}
        `.toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }
    
    renderSolicitudes(filteredSolicitudes);
    
  } catch (error) {
    console.error('Error filtering solicitudes:', error);
  }
}

// ================= CALENDARIO Y AGENDA DEL APP.13 =================

function renderCalendar() {
  try {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    const monthYear = document.getElementById('current-month-year');
    if (monthYear) {
      monthYear.textContent = currentCalendarDate.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric'
      });
    }

    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let calendarHTML = `
      <div class="calendar-grid">
        <div class="calendar-header">
          <div class="day-header">Dom</div>
          <div class="day-header">Lun</div>
          <div class="day-header">Mar</div>
          <div class="day-header">Mié</div>
          <div class="day-header">Jue</div>
          <div class="day-header">Vie</div>
          <div class="day-header">Sáb</div>
        </div>
        <div class="calendar-body">
    `;

    // Espacios en blanco para días del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
      const isWorkingDay = isWorkingDayExtended(date); // MODIFICADO: Usar función extendida del app.13

      let dayClass = 'calendar-day';
      if (isToday) dayClass += ' today';
      if (isSelected) dayClass += ' selected';
      if (!isWorkingDay) dayClass += ' non-working';

      // Contar citas para este día
      const dayAppointments = citasData.filter(cita => {
        if (!cita.fecha || !cita.fecha.toDate) return false;
        const citaDate = cita.fecha.toDate();
        return citaDate.toDateString() === date.toDateString();
      });

      const appointmentCount = dayAppointments.length;
      const appointmentIndicator = appointmentCount > 0 ? 
        `<div class="appointment-indicator">${appointmentCount}</div>` : '';

      calendarHTML += `
        <div class="${dayClass}" onclick="selectCalendarDay('${date.toISOString()}')">
          <span class="day-number">${day}</span>
          ${appointmentIndicator}
        </div>
      `;
    }

    calendarHTML += '</div></div>';
    calendarContainer.innerHTML = calendarHTML;

    if (selectedCalendarDate) {
      loadDayAppointments(selectedCalendarDate);
    }

  } catch (error) {
    console.error('Error rendering calendar:', error);
  }
}

// MODIFICADA: Función extendida para días laborables que incluye fines de semana
function isWorkingDayExtended(date) {
  // En el app.13 todos los días son laborables (lunes a domingo)
  return true;
}

function selectCalendarDay(dateString) {
  try {
    selectedCalendarDate = new Date(dateString);
    renderCalendar();
    loadDayAppointments(selectedCalendarDate);
  } catch (error) {
    console.error('Error selecting calendar day:', error);
  }
}

async function loadDayAppointments(date) {
  try {
    if (!date || !currentUserData) return;

    const dayAppointmentsContainer = document.getElementById('day-appointments');
    if (!dayAppointmentsContainer) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayAppointments = citasData.filter(cita => {
      if (!cita.fecha || !cita.fecha.toDate) return false;
      const citaDate = cita.fecha.toDate();
      return citaDate >= startOfDay && citaDate <= endOfDay;
    });

    dayAppointments.sort((a, b) => {
      const timeA = a.fecha.toDate();
      const timeB = b.fecha.toDate();
      return timeA - timeB;
    });

    if (dayAppointments.length === 0) {
      dayAppointmentsContainer.innerHTML = `
        <div class="no-appointments">
          <i class="fas fa-calendar-check"></i>
          <p>No hay citas programadas para este día</p>
          <button class="btn btn-primary btn-sm" onclick="createNuevaCitaModal('${date.toISOString()}')">
            <i class="fas fa-plus"></i>
            Agregar Cita
          </button>
        </div>
      `;
      return;
    }

    dayAppointmentsContainer.innerHTML = `
      <div class="appointments-header">
        <h4>Citas del ${date.toLocaleDateString('es-CL')}</h4>
        <button class="btn btn-primary btn-sm" onclick="createNuevaCitaModal('${date.toISOString()}')">
          <i class="fas fa-plus"></i>
          Nueva Cita
        </button>
      </div>
      <div class="appointments-list">
        ${dayAppointments.map(createAppointmentCard).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error loading day appointments:', error);
  }
}

function createAppointmentCard(cita) {
  const fecha = cita.fecha.toDate();
  const hora = fecha.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const estadoColor = {
    'programada': '#3b82f6',
    'confirmada': '#10b981',
    'en_curso': '#f59e0b',
    'completada': '#6b7280',
    'cancelada': '#ef4444',
    'no_asistio': '#ef4444'
  };

  return `
    <div class="appointment-card" onclick="showAppointmentDetail('${cita.id}')">
      <div class="appointment-time">
        <i class="fas fa-clock"></i>
        ${hora}
      </div>
      <div class="appointment-info">
        <h4>${cita.pacienteNombre} ${cita.pacienteApellidos || ''}</h4>
        <p><strong>Tipo:</strong> ${cita.tipo || 'Consulta'}</p>
        <p><strong>Profesional:</strong> ${cita.profesionalNombre}</p>
      </div>
      <div class="appointment-status">
        <span class="status-badge" style="background-color: ${estadoColor[cita.estado] || '#6b7280'}">
          ${cita.estado?.replace('_', ' ').toUpperCase() || 'PROGRAMADA'}
        </span>
      </div>
    </div>
  `;
}

async function loadTodayAppointments() {
  try {
    showLoading(true, 'Cargando citas de hoy...');
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(startOfDay))
      .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(endOfDay))
      .orderBy('fecha', 'asc')
      .get();

    const appointments = [];
    snapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    citasData = appointments;
    renderTodayAppointments(appointments);

  } catch (error) {
    console.error('Error loading today appointments:', error);
    const container = document.getElementById('upcoming-appointments-grid');
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar citas</h3>
          <p>No se pudieron cargar las citas de hoy</p>
        </div>
      `;
    }
  } finally {
    showLoading(false);
  }
}

function renderTodayAppointments(appointments) {
  const container = document.getElementById('upcoming-appointments-grid');
  if (!container) return;

  if (appointments.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-calendar-day"></i>
        <h3>No hay citas para hoy</h3>
        <p>No tienes citas programadas para el día de hoy</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appointments.map(createTodayAppointmentCard).join('');
}

function createTodayAppointmentCard(cita) {
  const fecha = cita.fecha.toDate();
  const hora = fecha.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const now = new Date();
  const isUpcoming = fecha > now;
  const timeDiff = Math.abs(fecha - now);
  const minutesDiff = Math.floor(timeDiff / (1000 * 60));

  let timeStatus = '';
  if (isUpcoming) {
    if (minutesDiff < 60) {
      timeStatus = `<span class="time-status upcoming">En ${minutesDiff} min</span>`;
    } else {
      timeStatus = `<span class="time-status">A las ${hora}</span>`;
    }
  } else {
    timeStatus = `<span class="time-status past">Pasada</span>`;
  }

  return `
    <div class="appointment-card-today ${isUpcoming ? 'upcoming' : 'past'}" onclick="showAppointmentDetail('${cita.id}')">
      <div class="appointment-header">
        <h4>${cita.pacienteNombre} ${cita.pacienteApellidos || ''}</h4>
        ${timeStatus}
      </div>
      <div class="appointment-details">
        <p><i class="fas fa-user-md"></i> ${cita.profesionalNombre}</p>
        <p><i class="fas fa-stethoscope"></i> ${cita.tipo || 'Consulta'}</p>
        <p><i class="fas fa-clock"></i> ${hora}</p>
      </div>
      <div class="appointment-actions">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); startAppointment('${cita.id}')">
          <i class="fas fa-play"></i>
          Iniciar
        </button>
      </div>
    </div>
  `;
}

// ================= GESTIÓN DE PACIENTES DEL APP.13 =================

async function loadPacientes() {
  try {
    showLoading(true, 'Cargando pacientes...');
    
    const snapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();

    const pacientes = [];
    snapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    pacientesData = pacientes;
    renderPacientes(pacientes);

  } catch (error) {
    console.error('Error loading pacientes:', error);
    renderPacientesError(error);
  } finally {
    showLoading(false);
  }
}

function renderPacientes(pacientes) {
  const container = document.getElementById('patients-grid');
  if (!container) return;

  if (pacientes.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-users"></i>
        <h3>No hay pacientes registrados</h3>
        <p>No se encontraron pacientes para tu CESFAM</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pacientes.map(createPatientCard).join('');
}

function createPatientCard(paciente) {
  const fecha = formatDate(paciente.fechaCreacion);
  const estado = paciente.estado || 'activo';
  
  return `
    <div class="patient-card" onclick="showPatientDetail('${paciente.id}')">
      <div class="patient-header">
        <div class="patient-info">
          <h3>${paciente.nombre} ${paciente.apellidos}</h3>
          <p>RUT: ${paciente.rut}</p>
        </div>
        <span class="patient-status ${estado}">
          ${estado.toUpperCase()}
        </span>
      </div>
      <div class="patient-details">
        <div><strong>Edad:</strong> ${paciente.edad} años</div>
        <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
        <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
        <div><strong>Registrado:</strong> ${fecha}</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); downloadPatientPDF('${paciente.id}')">
          <i class="fas fa-download"></i>
          Descargar PDF
        </button>
      </div>
    </div>
  `;
}

function renderPacientesError(error) {
  const container = document.getElementById('patients-grid');
  if (!container) return;
  
  container.innerHTML = `
    <div class="no-results">
      <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
      <h3>Error al cargar pacientes</h3>
      <p>${error.message}</p>
      <button class="btn btn-primary" onclick="loadPacientes()">
        <i class="fas fa-redo"></i>
        Reintentar
      </button>
    </div>
  `;
}

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
    
    try {
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
      
    } catch (queryError) {
      console.error('Error en consulta:', queryError);
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error en la búsqueda</h3>
          <p>No se pudo realizar la búsqueda. Intenta nuevamente.</p>
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

// ================= SEGUIMIENTO DEL APP.13 =================

async function loadSeguimiento() {
  try {
    showLoading(true, 'Cargando seguimientos...');
    
    const snapshot = await db.collection('seguimientos')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();

    const seguimientos = [];
    snapshot.forEach(doc => {
      seguimientos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    renderSeguimientos(seguimientos);

  } catch (error) {
    console.error('Error loading seguimientos:', error);
    renderSeguimientosError(error);
  } finally {
    showLoading(false);
  }
}

function renderSeguimientos(seguimientos) {
  const container = document.getElementById('patients-timeline');
  if (!container) return;

  if (seguimientos.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-clipboard-list"></i>
        <h3>No hay seguimientos registrados</h3>
        <p>No se encontraron seguimientos para tu CESFAM</p>
      </div>
    `;
    return;
  }

  container.innerHTML = seguimientos.map(createSeguimientoCard).join('');
}

function createSeguimientoCard(seguimiento) {
  const fecha = formatDate(seguimiento.fechaCreacion);
  
  return `
    <div class="seguimiento-card">
      <div class="seguimiento-header">
        <h4>${seguimiento.pacienteNombre} ${seguimiento.pacienteApellidos || ''}</h4>
        <span class="seguimiento-date">${fecha}</span>
      </div>
      <div class="seguimiento-body">
        <p><strong>Tipo:</strong> ${seguimiento.tipo}</p>
        <p><strong>Profesional:</strong> ${seguimiento.profesionalNombre}</p>
        ${seguimiento.observaciones ? `<p><strong>Observaciones:</strong> ${seguimiento.observaciones}</p>` : ''}
      </div>
    </div>
  `;
}

function renderSeguimientosError(error) {
  const container = document.getElementById('patients-timeline');
  if (!container) return;
  
  container.innerHTML = `
    <div class="no-results">
      <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
      <h3>Error al cargar seguimientos</h3>
      <p>${error.message}</p>
      <button class="btn btn-primary" onclick="loadSeguimiento()">
        <i class="fas fa-redo"></i>
        Reintentar
      </button>
    </div>
  `;
}

// ================= EXPORTAR FUNCIONES GLOBALES DEL APP.13 =================

// Funciones que necesitan estar disponibles globalmente
window.showSolicitudDetailById = showSolicitudDetailById;
window.showAgendaModal = showAgendaModal;
window.handleUrgentCase = handleUrgentCase;
window.downloadPatientPDF = downloadPatientPDF;
window.showPatientDetail = showPatientDetail;
window.filterSolicitudes = filterSolicitudes;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.loadSolicitudes = loadSolicitudes;
window.loadPacientes = loadPacientes;
window.loadSeguimiento = loadSeguimiento;
window.loadTodayAppointments = loadTodayAppointments;
window.selectCalendarDay = selectCalendarDay;
window.loadDayAppointments = loadDayAppointments;
window.createNuevaCitaModal = createNuevaCitaModal;
window.showAppointmentDetail = showAppointmentDetail;
window.startAppointment = startAppointment;

// Funciones del calendario
window.renderCalendar = renderCalendar;

// Stubs para funciones que serán implementadas por el profesional
window.showSolicitudDetailById = function(id) {
  console.log('Mostrar detalle de solicitud:', id);
  showNotification('Función de detalle de solicitud en desarrollo', 'info');
};

window.showAgendaModal = function(solicitudId) {
  console.log('Agendar solicitud:', solicitudId);
  showNotification('Función de agenda en desarrollo', 'info');
};

window.handleUrgentCase = function(solicitudId) {
  console.log('Manejar caso urgente:', solicitudId);
  showNotification('Función de casos urgentes en desarrollo', 'info');
};

window.downloadPatientPDF = function(pacienteId) {
  console.log('Descargar PDF del paciente:', pacienteId);
  showNotification('Función de descarga PDF en desarrollo', 'info');
};

window.showPatientDetail = function(pacienteId) {
  console.log('Mostrar detalle del paciente:', pacienteId);
  showNotification('Función de detalle de paciente en desarrollo', 'info');
};

window.createNuevaCitaModal = function(dateString) {
  console.log('Crear nueva cita para fecha:', dateString);
  showNotification('Función de nueva cita en desarrollo', 'info');
};

window.showAppointmentDetail = function(citaId) {
  console.log('Mostrar detalle de cita:', citaId);
  showNotification('Función de detalle de cita en desarrollo', 'info');
};

window.startAppointment = function(citaId) {
  console.log('Iniciar cita:', citaId);
  showNotification('Función de iniciar cita en desarrollo', 'info');
};

console.log('✅ SENDA Puente Alto - Sistema completo del app.13 cargado');
