// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO COMPLETO CORREGIDO =================
// PARTE 1: Configuración, Variables Globales y Funciones Utilitarias - CORREGIDO FINAL

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

// Variables globales CORREGIDAS PARA APP14
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4; // CORREGIDO: 4 pasos para "mis datos", 1 para "información"
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

// CORREGIDO: Configuración de horarios extendida con fines de semana
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

// CORREGIDAS: Funciones para horarios extendidos con fines de semana
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
  // CORREGIDO: Ahora todos los días son laborables (lunes a domingo)
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

// Resto de las funciones utilitarias
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
// ================= PARTE 2: GESTIÓN DE EVENTOS Y AUTENTICACIÓN - CORREGIDO =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    const searchSolicitudes = document.getElementById('search-solicitudes');
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
    
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    
    // CORREGIDO: Solo cargar solicitudes si el usuario es asistente social
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
      updateTabVisibility();
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  } catch (error) {
    console.error('❌ Error mostrando contenido profesional:', error);
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

// ================= FORMULARIO MULTI-PASO ORIGINAL DEL APP14 =================

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

// ================= FORMULARIO MULTI-PASO ORIGINAL APP14 =================

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

    // ORIGINAL APP14: Listeners para tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', updateFormVisibility);
    });

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

// ORIGINAL APP14: Funciones para flujo de pasos
function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  switch (currentStep) {
    case 1:
      if (tipoSolicitud === 'informacion') {
        return null; // No hay siguiente paso para información - se envía directamente
      } else if (tipoSolicitud === 'identificado') {
        return 2; // Ir a datos personales - PASO 2
      }
      break;
    case 2:
      return 3; // De datos personales a evaluación - PASO 3
    case 3:
      return 4; // De evaluación a finalización - PASO 4
    case 4:
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
    case 4:
      return 3; // De finalización a evaluación
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

// ORIGINAL APP14: Función para manejar visibilidad según tipo de solicitud
function updateFormVisibility() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    // MANTENER LA LÓGICA ORIGINAL DEL APP14 EXACTAMENTE
    if (tipoSolicitud === 'informacion') {
      // Solo información - 1 paso
      maxFormStep = 1;
      const progressText = document.getElementById('progress-text');
      if (progressText) progressText.textContent = 'Paso 1 de 1';
    } else if (tipoSolicitud === 'identificado') {
      // Mis datos - 4 pasos
      maxFormStep = 4;
      const progressText = document.getElementById('progress-text');
      if (progressText) progressText.textContent = `Paso ${currentFormStep} de 4`;
    }
    
    setTimeout(saveFormDraft, 500);
    
  } catch (error) {
    console.error('Error updating form visibility:', error);
  }
}
// ================= CONTINUACIÓN PARTE 4A: FUNCIONES AUXILIARES COMPLETAS =================

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

// ================= FUNCIONES PARA SOLICITUDES DE INFORMACIÓN =================

async function loadSolicitudesInformacion() {
  try {
    if (!currentUserData) return [];
    
    const snapshot = await db.collection('solicitudes_informacion')
      .where('estado', '!=', 'respondida')
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const solicitudes = [];
    snapshot.forEach(doc => {
      solicitudes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    solicitudesInformacionData = solicitudes;
    return solicitudes;
    
  } catch (error) {
    console.error('Error loading solicitudes información:', error);
    return [];
  }
}

// ================= FUNCIONES PLACEHOLDER PARA DESARROLLOS FUTUROS =================

function handleUrgentCase(solicitudId) { 
  try {
    showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning');
    
    // TODO: Implementar notificación real al coordinador
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🚨 Caso urgente identificado:', solicitudId);
    }
  } catch (error) {
    console.error('Error handling urgent case:', error);
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
                  <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
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
                  ${solicitud.sustancias.map(s => `<span class="substance-tag">${s}</span>`).join('')}
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
            
            ${solicitud.tratamientoPrevio ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Tratamiento Previo</h4>
                <p style="margin: 0;"><strong>${solicitud.tratamientoPrevio.replace('_', ' ').toUpperCase()}</strong></p>
              </div>` : ''
            }
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
            <button class="btn btn-success" onclick="showAgendaModal('${solicitud.id}')">
              <i class="fas fa-calendar-plus"></i>
              Agendar Cita
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

function showAgendaModal(solicitudId) {
  try {
    showNotification('Función de agenda en desarrollo. Por ahora usa el botón "Nueva Cita" en la agenda.', 'info', 5000);
    
    // TODO: Implementar modal de agenda específico para solicitudes
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📅 Solicitud para agendar:', solicitudId);
    }
  } catch (error) {
    console.error('Error showing agenda modal:', error);
  }
}

function showPatientFollowup(citaId, pacienteNombre, pacienteRut) {
  try {
    showNotification(`Función de seguimiento para ${pacienteNombre} en desarrollo`, 'info');
    
    // TODO: Implementar modal de seguimiento
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('👥 Seguimiento de paciente:', { citaId, pacienteNombre, pacienteRut });
    }
  } catch (error) {
    console.error('Error showing patient followup:', error);
  }
}

// ================= VALIDACIONES ADICIONALES =================

function validateFormStep(stepNumber) {
  try {
    const currentStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (!currentStep) return false;
    
    const requiredFields = currentStep.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      } else {
        field.classList.remove('error');
      }
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating form step:', error);
    return false;
  }
}

function formatFormData(formElement) {
  try {
    const formData = new FormData(formElement);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error formatting form data:', error);
    return {};
  }
}

// ================= MANEJO DE ERRORES MEJORADO =================

function handleFirebaseError(error, operation = 'operación') {
  console.error(`❌ Error en ${operation}:`, error);
  
  let userMessage = `Error en ${operation}: `;
  
  switch (error.code) {
    case 'permission-denied':
      userMessage += 'Sin permisos suficientes';
      break;
    case 'not-found':
      userMessage += 'Documento no encontrado';
      break;
    case 'already-exists':
      userMessage += 'El documento ya existe';
      break;
    case 'failed-precondition':
      userMessage += 'Condición previa no cumplida';
      break;
    case 'unavailable':
      userMessage += 'Servicio temporalmente no disponible';
      break;
    case 'deadline-exceeded':
      userMessage += 'Tiempo de espera agotado';
      break;
    case 'resource-exhausted':
      userMessage += 'Límite de recursos excedido';
      break;
    case 'unauthenticated':
      userMessage += 'Usuario no autenticado';
      break;
    case 'invalid-argument':
      userMessage += 'Argumentos inválidos';
      break;
    default:
      userMessage += error.message || 'Error desconocido';
  }
  
  showNotification(userMessage, 'error');
  return userMessage;
}

function handleNetworkError(error) {
  console.error('❌ Error de red:', error);
  
  if (!navigator.onLine) {
    showNotification('Sin conexión a internet. Verifica tu conexión.', 'error');
    return false;
  }
  
  showNotification('Error de conexión. Intenta nuevamente.', 'error');
  return false;
}

// ================= FUNCIONES DE UTILIDAD ADICIONALES =================

function sanitizeInput(input) {
  try {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 1000); // Limitar longitud
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return '';
  }
}

function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  } catch (error) {
    return `$${amount}`;
  }
}

function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado al portapapeles', 'success', 2000);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('Copiado al portapapeles', 'success', 2000);
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showNotification('Error al copiar', 'error');
  }
}

// ================= PERFORMANCE Y OPTIMIZACIÓN =================

function optimizeImages() {
  try {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

function cleanupOldCacheEntries() {
  try {
    const now = Date.now();
    const maxAge = APP_CONFIG.CACHE_DURATION * 2; // Doble del tiempo de cache
    
    for (let [key, value] of dataCache.entries()) {
      if (now - value.timestamp > maxAge) {
        dataCache.delete(key);
      }
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🧹 Cache limpiado, entradas restantes:', dataCache.size);
    }
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
}

// Limpiar cache cada 10 minutos
setInterval(cleanupOldCacheEntries, 10 * 60 * 1000);

// ================= ACCESSIBILITY MEJORAS =================

function improveAccessibility() {
  try {
    // Agregar atributos ARIA faltantes
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(btn => {
      if (!btn.getAttribute('aria-label')) {
        const text = btn.textContent.trim() || btn.title || 'Botón';
        btn.setAttribute('aria-label', text);
      }
    });
    
    // Mejorar navegación por teclado
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      if (!element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
    
  } catch (error) {
    console.error('Error improving accessibility:', error);
  }
}

// Ejecutar mejoras de accesibilidad después de cargar la página
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(improveAccessibility, 1000);
});
// ================= PARTE 4B: FUNCIONES GLOBALES Y EXPORTS FINALES =================

// ================= MÉTRICAS Y ESTADÍSTICAS =================

function generateSystemMetrics() {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      user: currentUserData ? {
        id: currentUser.uid,
        profession: currentUserData.profession,
        cesfam: currentUserData.cesfam
      } : null,
      data: {
        solicitudes: solicitudesData.length,
        pacientes: pacientesData.length,
        citas: citasData.length,
        solicitudesInformacion: solicitudesInformacionData.length
      },
      cache: {
        size: dataCache.size,
        keys: Array.from(dataCache.keys())
      },
      performance: {
        loadTime: Date.now() - (window.performance?.timing?.navigationStart || Date.now()),
        isLoading: isLoading
      }
    };
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📊 Métricas del sistema:', metrics);
    }
    
    return metrics;
  } catch (error) {
    console.error('Error generating metrics:', error);
    return null;
  }
}

function exportSystemData() {
  try {
    if (!currentUserData) {
      showNotification('Debes estar autenticado para exportar datos', 'warning');
      return;
    }
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        user: `${currentUserData.nombre} ${currentUserData.apellidos}`,
        cesfam: currentUserData.cesfam,
        version: '2.0'
      },
      solicitudes: solicitudesData,
      pacientes: pacientesData.slice(0, 100), // Limitar para evitar archivos muy grandes
      metrics: generateSystemMetrics()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `senda_export_${currentUserData.cesfam}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Datos exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Error al exportar datos: ' + error.message, 'error');
  }
}

// ================= NOTIFICACIONES PUSH (PREPARACIÓN PARA PWA) =================

function requestNotificationPermission() {
  try {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Permisos de notificación concedidos');
          localStorage.setItem('senda_notifications_enabled', 'true');
        } else {
          console.log('❌ Permisos de notificación denegados');
        }
      });
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}

function showSystemNotification(title, body, options = {}) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'senda-notification',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    }
  } catch (error) {
    console.error('Error showing system notification:', error);
  }
}

// ================= BACKUP Y SINCRONIZACIÓN =================

async function createSystemBackup() {
  try {
    if (!currentUserData) {
      showNotification('Debes estar autenticado para crear backup', 'warning');
      return;
    }
    
    showLoading(true, 'Creando backup del sistema...');
    
    const backupData = {
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      user: currentUser.uid,
      cesfam: currentUserData.cesfam,
      data: {
        solicitudes: solicitudesData,
        pacientes: pacientesData,
        configuracion: {
          version: '2.0',
          features: ['calendario', 'nueva-cita', 'pdf-export', 'search']
        }
      }
    };
    
    await db.collection('backups').add(backupData);
    
    showNotification('Backup creado correctamente', 'success');
    
  } catch (error) {
    console.error('Error creating backup:', error);
    showNotification('Error al crear backup: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function syncOfflineData() {
  try {
    if (!navigator.onLine) {
      console.log('📡 Sin conexión - postponiendo sincronización');
      return;
    }
    
    const offlineData = localStorage.getItem('senda_offline_data');
    if (!offlineData) return;
    
    const data = JSON.parse(offlineData);
    console.log('🔄 Sincronizando datos offline:', data);
    
    // Procesar datos offline cuando se recupere la conexión
    for (const item of data) {
      try {
        if (item.type === 'solicitud') {
          await db.collection('solicitudes_ingreso').add(item.data);
        } else if (item.type === 'reingreso') {
          await db.collection('reingresos').add(item.data);
        }
      } catch (syncError) {
        console.error('Error sincronizando item:', syncError);
      }
    }
    
    localStorage.removeItem('senda_offline_data');
    showNotification('Datos sincronizados correctamente', 'success');
    
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}

// Sincronizar cuando se recupere la conexión
window.addEventListener('online', syncOfflineData);

// ================= CONFIGURACIÓN DE USUARIO =================

function saveUserPreferences(preferences) {
  try {
    const prefs = {
      theme: 'light',
      notifications: true,
      autoSave: true,
      language: 'es',
      ...preferences
    };
    
    localStorage.setItem('senda_user_preferences', JSON.stringify(prefs));
    
    if (currentUser) {
      // Guardar también en Firestore
      db.collection('profesionales').doc(currentUser.uid).update({
        configuracion: prefs
      }).catch(error => {
        console.warn('No se pudo guardar preferencias en Firestore:', error);
      });
    }
    
    applyUserPreferences(prefs);
    
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

function loadUserPreferences() {
  try {
    const saved = localStorage.getItem('senda_user_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      applyUserPreferences(prefs);
      return prefs;
    }
    
    return {
      theme: 'light',
      notifications: true,
      autoSave: true,
      language: 'es'
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return {};
  }
}

function applyUserPreferences(preferences) {
  try {
    if (preferences.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    if (preferences.notifications && 'Notification' in window) {
      requestNotificationPermission();
    }
    
  } catch (error) {
    console.error('Error applying preferences:', error);
  }
}

// ================= SHORTCUT KEYS MEJORADOS =================

function setupAdvancedKeyboardShortcuts() {
  try {
    document.addEventListener('keydown', (e) => {
      // Solo ejecutar si no estamos en un input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            if (currentUserData) createNuevaCitaModal();
            break;
          case 's':
            e.preventDefault();
            if (currentUserData) createSystemBackup();
            break;
          case 'e':
            e.preventDefault();
            if (currentUserData) exportSystemData();
            break;
          case '/':
            e.preventDefault();
            showKeyboardShortcuts();
            break;
        }
      }
      
      // Teclas sin modificador
      switch (e.key) {
        case 'Escape':
          const openModal = document.querySelector('.modal-overlay[style*="flex"]');
          if (openModal) {
            closeModal(openModal.id);
          }
          break;
        case '?':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            showKeyboardShortcuts();
          }
          break;
      }
    });
    
    console.log('⌨️ Atajos de teclado avanzados configurados');
  } catch (error) {
    console.error('Error setting up keyboard shortcuts:', error);
  }
}

function showKeyboardShortcuts() {
  const shortcutsModal = `
    <div class="modal-overlay temp-modal" id="shortcuts-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('shortcuts-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-keyboard"></i> Atajos de Teclado</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
            <div>
              <h3 style="color: var(--primary-blue); margin-bottom: 12px;">Navegación</h3>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                <span>Buscar solicitudes</span>
              </div>
              <div class="shortcut-item">
                <kbd>Esc</kbd>
                <span>Cerrar modal</span>
              </div>
              <div class="shortcut-item">
                <kbd>?</kbd>
                <span>Mostrar ayuda</span>
              </div>
            </div>
            
            <div>
              <h3 style="color: var(--primary-blue); margin-bottom: 12px;">Acciones</h3>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>N</kbd>
                <span>Nueva cita</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
                <span>Crear backup</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>E</kbd>
                <span>Exportar datos</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <button class="btn btn-primary" onclick="closeModal('shortcuts-modal')">
              <i class="fas fa-check"></i>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--light-gray);
      }
      
      .shortcut-item:last-child {
        border-bottom: none;
      }
      
      kbd {
        background: var(--gray-100);
        border: 1px solid var(--gray-300);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        color: var(--gray-700);
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', shortcutsModal);
  showModal('shortcuts-modal');
}

// ================= MONITOREO DE ESTADO =================

function startSystemMonitoring() {
  try {
    // Monitorear conexión
    window.addEventListener('online', () => {
      showNotification('Conexión restaurada', 'success', 3000);
      syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      showNotification('Sin conexión - modo offline activado', 'warning', 5000);
    });
    
    // Monitorear performance
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 1000) { // Operaciones que toman más de 1 segundo
            console.warn('⚠️ Operación lenta detectada:', entry.name, entry.duration + 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
    
    // Limpiar memoria cada 5 minutos
    setInterval(() => {
      if (window.gc && APP_CONFIG.DEBUG_MODE) {
        window.gc();
        console.log('🧹 Limpieza de memoria ejecutada');
      }
    }, 5 * 60 * 1000);
    
    console.log('📊 Sistema de monitoreo iniciado');
  } catch (error) {
    console.error('Error starting system monitoring:', error);
  }
}

// ================= FUNCIONES GLOBALES EXPORTADAS =================

// Funciones principales del calendario y citas
window.setupCalendar = setupCalendar;
window.renderCalendar = renderCalendar;
window.selectCalendarDay = selectCalendarDay;
window.loadDayAppointments = loadDayAppointments;
window.loadTodayAppointments = loadTodayAppointments;
window.createNuevaCitaModal = createNuevaCitaModal;
window.createNuevaCitaModalForDate = createNuevaCitaModalForDate;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;

// Funciones de pacientes
window.showPatientDetail = showPatientDetail;
window.downloadPatientPDF = downloadPatientPDF;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.loadPacientes = loadPacientes;
window.showPatientAppointmentInfo = showPatientAppointmentInfo;

// Funciones de solicitudes
window.loadSolicitudes = loadSolicitudes;
window.filterSolicitudes = filterSolicitudes;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showSolicitudDetail = showSolicitudDetail;
window.showAgendaModal = showAgendaModal;
window.handleUrgentCase = handleUrgentCase;

// Funciones de seguimiento
window.loadSeguimiento = loadSeguimiento;
window.showPatientFollowup = showPatientFollowup;

// Funciones de utilidad
window.showAboutProgram = showAboutProgram;
window.exportSystemData = exportSystemData;
window.createSystemBackup = createSystemBackup;
window.generateSystemMetrics = generateSystemMetrics;
window.showKeyboardShortcuts = showKeyboardShortcuts;

// Funciones de modales
window.showModal = showModal;
window.closeModal = closeModal;

// ================= INICIALIZACIÓN FINAL =================

// Configurar preferencias de usuario al cargar
document.addEventListener('DOMContentLoaded', () => {
  loadUserPreferences();
  setupAdvancedKeyboardShortcuts();
  startSystemMonitoring();
  
  // Optimizar imágenes después de un delay
  setTimeout(optimizeImages, 2000);
});

// ================= CLEANUP Y LISTENERS FINALES =================

// Cleanup al salir de la página
window.addEventListener('beforeunload', (e) => {
  try {
    // Guardar estado de draft si hay cambios
    if (isDraftSaved === false) {
      saveFormDraft();
    }
    
    // Limpiar listeners temporales
    document.querySelectorAll('.temp-modal').forEach(modal => {
      modal.remove();
    });
    
    // Generar métricas finales
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📊 Métricas finales:', generateSystemMetrics());
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Manejo de errores no capturados mejorado
window.addEventListener('error', (event) => {
  console.error('❌ Error global capturado:', event.error);
  
  if (APP_CONFIG.DEBUG_MODE) {
    showNotification(`Error: ${event.error?.message || 'Error desconocido'}`, 'error');
  }
  
  // Reportar error (en producción se enviaría a un servicio de logging)
  try {
    const errorReport = {
      message: event.error?.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    localStorage.setItem('senda_last_error', JSON.stringify(errorReport));
  } catch (reportError) {
    console.error('No se pudo reportar el error:', reportError);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rechazada:', event.reason);
  
  if (APP_CONFIG.DEBUG_MODE) {
    showNotification(`Promise rechazada: ${event.reason?.message || event.reason}`, 'error');
  }
});

// ================= MENSAJE FINAL DE INICIALIZACIÓN =================

console.log(`
🎉 ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
   
   ✅ Firebase configurado
   ✅ Autenticación activa
   ✅ Formularios funcionales
   ✅ Calendario completo
   ✅ Nueva cita operativa
   ✅ Gestión de pacientes
   ✅ Descargas PDF
   ✅ Búsqueda implementada
   ✅ Filtros activos
   ✅ Modo offline preparado
   ✅ Atajos de teclado
   ✅ Monitoreo activo
   
   📊 Sistema completamente operativo
   🔧 Debug: ${APP_CONFIG.DEBUG_MODE ? 'ACTIVADO' : 'DESACTIVADO'}
   
   Desarrollado para SENDA Puente Alto
   ====================================
`);

// Notificación final de sistema listo
setTimeout(() => {
  if (APP_CONFIG.DEBUG_MODE) {
    showNotification('🚀 Sistema SENDA completamente cargado y operativo', 'success', 3000);
  }
}, 1000);

// ================= EXPORT PARA MÓDULOS (FUTURO) =================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Funciones principales
    setupCalendar,
    renderCalendar,
    loadPacientes,
    loadSolicitudes,
    showPatientDetail,
    downloadPatientPDF,
    createNuevaCitaModal,
    
    // Utilidades
    formatRUT,
    validateRUT,
    formatDate,
    showNotification,
    
    // Configuración
    APP_CONFIG,
    cesfamPuenteAlto
  };
}

// Finalización del script
console.log('✅ SENDA Puente Alto - Sistema completo cargado exitosamente');
