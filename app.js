// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO COMPLETO =================
// CONFIGURACIÓN, VARIABLES GLOBALES Y FUNCIONES UTILITARIAS

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQjdHO0HXILWQhUXv8",
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
let solicitudesData = [];
let pacientesData = [];
let citasData = [];
let professionalsList = [];
let selectedProfessional = null;
let isLoading = false;
let fichasClinicasData = [];

// Configuración de horarios
const HORARIOS_CONFIG = {
  horaInicio: 8,
  horaFin: 16,
  minutoFin: 30,
  intervaloMinutos: 30,
  diasSemana: [1, 2, 3, 4, 5]
};

// Configuración de la aplicación
const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 50,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true
};

// Cache simple para datos
const dataCache = new Map();

// ================= FUNCIONES UTILITARIAS =================

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
    
    const tiempoConsumo = evaluationData.tiempoConsumo || evaluationData['tiempo-consumo'];
    if (tiempoConsumo === '60+') score += 3;
    if (tiempoConsumo === '24-60') score += 2;
    if (tiempoConsumo === '12-24') score += 1;
    
    if (evaluationData.urgencia === 'critica') score += 5;
    if (evaluationData.urgencia === 'alta') score += 3;
    if (evaluationData.urgencia === 'media') score += 1;
    
    const motivacion = parseInt(evaluationData.motivacion || evaluationData['motivacion-range']) || 5;
    if (motivacion <= 3) score += 2;
    if (motivacion >= 8) score -= 1;
    
    if (evaluationData.tratamientoPrevio === 'si_senda') score += 2;
    if (evaluationData.tratamientoPrevio === 'si_otro') score += 1;
    
    const descripcion = (evaluationData.descripcion || evaluationData['patient-description'] || '').toLowerCase();
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

// ================= FUNCIÓN AGREGADA: Toggle Submit Button =================
function toggleSubmitButton(button, loading) {
  if (!button) return;
  
  const buttonText = button.querySelector('.btn-text');
  const buttonLoading = button.querySelector('.btn-loading');
  
  if (loading) {
    button.disabled = true;
    if (buttonText) buttonText.style.display = 'none';
    if (buttonLoading) buttonLoading.style.display = 'inline-flex';
    if (!buttonText && !buttonLoading) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
  } else {
    button.disabled = false;
    if (buttonText) buttonText.style.display = 'inline';
    if (buttonLoading) buttonLoading.style.display = 'none';
  }
}

// ================= FUNCIÓN AGREGADA: Reset Form =================
function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      currentFormStep = 1;
      goToStep(1);
      
      // Limpiar validaciones visuales
      form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      form.querySelectorAll('.field-error').forEach(el => el.remove());
      
      // Resetear visibilidad de campos
      updateFormVisibility();
    }
    
    formData = {};
    isDraftSaved = false;
    
  } catch (error) {
    console.error('Error resetting form:', error);
  }
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

// ================= GESTIÓN DE EVENTOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    const searchSolicitudes = document.getElementById('search-solicitudes');
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
      nuevaCitaBtn.addEventListener('click', () => showNuevaCitaModal());
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

// ================= AUTENTICACIÓN =================

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
    fichasClinicasData = [];
    
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
    
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'solicitudes';
    
    switch (activeTab) {
      case 'solicitudes':
        loadPromises.push(loadSolicitudes());
        break;
      case 'pacientes':
        loadPromises.push(loadPacientes());
        break;
      case 'agenda':
        loadPromises.push(loadTodayAppointments());
        break;
      case 'seguimiento':
        loadPromises.push(loadSeguimiento());
        break;
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
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  } catch (error) {
    console.error('❌ Error mostrando contenido profesional:', error);
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

// ================= FORMULARIOS Y VALIDACIONES =================

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
  
  const isValid = phone.length === 8 || 
                  phone.length === 9 && phone.startsWith('9') || 
                  phone.length === 11 && phone.startsWith('56') || 
                  phone.length === 12 && phone.startsWith('569'); 
  
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

// ================= FORMULARIO MULTI-PASO CON CORRECCIONES =================

function setupMultiStepForm() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // CORREGIDO: Agregar event listener para submit del formulario
    form.addEventListener('submit', handlePatientFormSubmit);

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

// ================= FUNCIÓN CORREGIDA: Handle Patient Form Submit =================
async function handlePatientFormSubmit(e) {
  e.preventDefault();
  
  try {
    const formElement = e.target;
    const formData = new FormData(formElement);
    const data = {};
    
    // Convertir FormData a objeto
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Manejar checkboxes múltiples (sustancias)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    // Obtener valores adicionales del DOM
    data['patient-age'] = document.getElementById('patient-age')?.value;
    data['patient-cesfam'] = document.getElementById('patient-cesfam')?.value;
    data['anonymous-phone'] = document.getElementById('anonymous-phone')?.value;
    data['patient-name'] = document.getElementById('patient-name')?.value;
    data['patient-lastname'] = document.getElementById('patient-lastname')?.value;
    data['patient-rut'] = document.getElementById('patient-rut')?.value;
    data['patient-phone'] = document.getElementById('patient-phone')?.value;
    data['patient-email'] = document.getElementById('patient-email')?.value;
    data['patient-address'] = document.getElementById('patient-address')?.value;
    data['tiempo-consumo'] = document.getElementById('tiempo-consumo')?.value;
    data['motivacion-range'] = document.getElementById('motivacion-range')?.value;
    data['patient-description'] = document.getElementById('patient-description')?.value;
    
    // Validación final
    if (!data.tipoSolicitud) {
      showNotification('Error: Tipo de solicitud no especificado', 'error');
      return;
    }
    
    const submitBtn = formElement.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    console.log('📝 Procesando solicitud:', data.tipoSolicitud);
    
    // Procesar según tipo
    if (data.tipoSolicitud === 'identificado' || data.tipoSolicitud === 'anonimo') {
      await processSolicitudCompleta(data);
    } else if (data.tipoSolicitud === 'informacion') {
      await handleInformationOnlySubmit();
    }
    
  } catch (error) {
    console.error('❌ Error en envío de formulario:', error);
    showNotification('Error al enviar solicitud: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ================= FUNCIÓN AGREGADA: Procesar Solicitud Completa =================
async function processSolicitudCompleta(data) {
  try {
    // Calcular prioridad
    const prioridad = calculatePriority(data);
    
    // Preparar datos para Firestore
    const solicitudData = {
      tipoSolicitud: data.tipoSolicitud,
      nombre: data.tipoSolicitud === 'identificado' ? data['patient-name'] : null,
      apellidos: data.tipoSolicitud === 'identificado' ? data['patient-lastname'] : null,
      rut: data.tipoSolicitud === 'identificado' ? data['patient-rut'] : null,
      edad: parseInt(data['patient-age']),
      telefono: data.tipoSolicitud === 'identificado' ? data['patient-phone'] : data['anonymous-phone'],
      email: data['patient-email'] || null,
      direccion: data['patient-address'] || null,
      cesfam: data['patient-cesfam'],
      paraMi: data.paraMi,
      sustancias: Array.isArray(data.sustancias) ? data.sustancias : [data.sustancias],
      tiempoConsumo: data['tiempo-consumo'],
      urgencia: data.urgencia,
      tratamientoPrevio: data.tratamientoPrevio,
      motivacion: data['motivacion-range'],
      descripcion: data['patient-description'] || '',
      prioridad: prioridad,
      estado: 'pendiente',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      origen: 'web_publica'
    };
    
    console.log('💾 Guardando solicitud en Firestore...');
    
    // Guardar en Firestore
    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    console.log('✅ Solicitud guardada con ID:', docRef.id);
    
    // Limpiar formulario y cerrar modal
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    // Mostrar mensaje de éxito
    const mensajeExito = data.tipoSolicitud === 'anonimo' 
      ? 'Tu solicitud anónima fue enviada correctamente. Te contactaremos al número proporcionado.'
      : 'Tu solicitud fue enviada correctamente. Te contactaremos pronto a los datos proporcionados.';
    
    showNotification(mensajeExito, 'success', 6000);
    
  } catch (error) {
    console.error('❌ Error procesando solicitud:', error);
    showNotification('Error al enviar solicitud: ' + error.message, 'error');
    throw error;
  }
}

// FUNCIONES PARA FLUJO MODIFICADO
function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  switch (currentStep) {
    case 1:
      if (tipoSolicitud === 'informacion') {
        return null; // No hay siguiente paso para información
      } else if (tipoSolicitud === 'identificado') {
        return 2; // Ir a datos personales
      } else if (tipoSolicitud === 'anonimo') {
        return 3; // Saltar datos personales, ir a evaluación
      }
      break;
    case 2:
      return 3; // De datos personales a evaluación
    case 3:
      return 4; // De evaluación a finalización
    case 4:
      return null; // No hay siguiente paso
  }
  return null;
}

function getPreviousStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  switch (currentStep) {
    case 2:
      return 1; // De datos personales a tipo de solicitud
    case 3:
      if (tipoSolicitud === 'identificado') {
        return 2; // De evaluación a datos personales
      } else {
        return 1; // De evaluación a tipo de solicitud (anónimo)
      }
    case 4:
      return 3; // De finalización a evaluación
  }
  return null;
}

function updateMaxFormStep() {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    maxFormStep = 1; // Solo necesita el primer paso
  } else if (tipoSolicitud === 'anonimo') {
    maxFormStep = 3; // Paso 1 y 3 (salta el 2)
  } else {
    maxFormStep = 4; // Todos los pasos
  }
  
  // Actualizar texto del progress
  const progressText = document.getElementById('progress-text');
  if (progressText) {
    const currentStepNum = currentFormStep;
    const totalSteps = tipoSolicitud === 'anonimo' ? 3 : maxFormStep;
    progressText.textContent = `Paso ${currentStepNum} de ${totalSteps}`;
  }
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

function updateFormVisibility() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const anonymousPhone = document.getElementById('anonymous-phone-container');
    const infoEmail = document.getElementById('info-email-container');
    
    if (anonymousPhone) anonymousPhone.style.display = 'none';
    if (infoEmail) infoEmail.style.display = 'none';
    
    if (tipoSolicitud === 'anonimo' && anonymousPhone) {
      anonymousPhone.style.display = 'block';
      const phoneInput = document.getElementById('anonymous-phone');
      if (phoneInput) {
        phoneInput.required = true;
        phoneInput.focus();
      }
    } else if (tipoSolicitud === 'informacion' && infoEmail) {
      infoEmail.style.display = 'block';
      const emailInput = document.getElementById('info-email');
      if (emailInput) {
        emailInput.required = true;
        emailInput.focus();
      }
    }
    
    if (anonymousPhone && tipoSolicitud !== 'anonimo') {
      const phoneInput = document.getElementById('anonymous-phone');
      if (phoneInput) phoneInput.required = false;
    }
    if (infoEmail && tipoSolicitud !== 'informacion') {
      const emailInput = document.getElementById('info-email');
      if (emailInput) emailInput.required = false;
    }
    
    updateMaxFormStep();
    
    setTimeout(saveFormDraft, 500);
    
  } catch (error) {
    console.error('Error updating form visibility:', error);
  }
}

// ================= VALIDACIÓN DE PASOS CORREGIDA =================

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
      } else {
        // Validar campos específicos según tipo de solicitud
        if (tipoSolicitud === 'anonimo') {
          const phone = document.getElementById('anonymous-phone');
          if (!phone.value.trim()) {
            errors.push('Ingresa un teléfono de contacto');
            isValid = false;
          } else if (!validatePhoneNumberString(phone.value.trim())) {
            errors.push('Ingresa un teléfono válido');
            isValid = false;
          }
        } else if (tipoSolicitud === 'informacion') {
          const email = document.getElementById('info-email');
          if (!email.value.trim()) {
            errors.push('Ingresa un email para recibir información');
            isValid = false;
          } else if (!isValidEmail(email.value.trim())) {
            errors.push('Ingresa un email válido');
            isValid = false;
          }
          
          // CORREGIDO: Si es válido, procesar información después de la validación
          if (isValid) {
            setTimeout(() => handleInformationOnlySubmit(), 100);
            return true; // Permitir que el flujo continue normalmente
          }
        }
      }

      const edad = parseInt(document.getElementById('patient-age').value);
      if (edad && (edad < 12 || edad > 120)) {
        errors.push('La edad debe estar entre 12 y 120 años');
        isValid = false;
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
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
      let displayStep = step;
      let totalSteps = maxFormStep;
      
      if (tipoSolicitud === 'anonimo' && step === 3) {
        displayStep = 2;
        totalSteps = 3;
      } else if (tipoSolicitud === 'anonimo' && step === 4) {
        displayStep = 3;
        totalSteps = 3;
      }
      
      progressText.textContent = `Paso ${displayStep} de ${totalSteps}`;
    }

    currentFormStep = step;
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 Navegando a paso ${step}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
  }
}

// FUNCIÓN CORREGIDA PARA MANEJO DE SOLICITUD SOLO INFORMACIÓN
async function handleInformationOnlySubmit() {
  try {
    console.log('📧 Procesando solicitud de información únicamente...');
    
    const email = document.getElementById('info-email')?.value?.trim();
    const edad = document.getElementById('patient-age')?.value;
    const cesfam = document.getElementById('patient-cesfam')?.value;
    
    if (!email || !isValidEmail(email)) {
      showNotification('Email inválido', 'error');
      return;
    }
    
    const informationData = {
      tipoSolicitud: 'informacion',
      email: email,
      edad: parseInt(edad) || null,
      cesfam: cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'información_enviada',
      origen: 'web_publica',
      prioridad: 'baja',
      identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log('💾 Guardando solicitud de información...');
    
    await db.collection('solicitudes_informacion').add(informationData);
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Información enviada a tu email correctamente. Revisa tu bandeja de entrada.', 'success', 6000);
    
  } catch (error) {
    console.error('❌ Error enviando información:', error);
    showNotification('Error al enviar la información: ' + error.message, 'error');
  }
}

// ================= NUEVA FUNCIÓN PARA MODAL DE NUEVA CITA =================

function showNuevaCitaModal() {
  try {
    const nuevaCitaModal = createNuevaCitaModal();
    document.body.insertAdjacentHTML('beforeend', nuevaCitaModal);
    showModal('nueva-cita-modal');
    
    setupNuevaCitaModal();
    
  } catch (error) {
    console.error('Error showing nueva cita modal:', error);
    showNotification('Error al abrir modal de nueva cita', 'error');
  }
}

function createNuevaCitaModal() {
  return `
    <div class="modal-overlay temp-modal" id="nueva-cita-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2 style="margin-bottom: 24px; color: var(--primary-blue);">
            <i class="fas fa-calendar-plus"></i> Nueva Cita
          </h2>
          
          <form id="nueva-cita-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Nombre del Paciente *</label>
                <input type="text" class="form-input" id="nuevo-paciente-nombre" required 
                       placeholder="Nombre completo del paciente">
              </div>
              
              <div class="form-group">
                <label class="form-label">RUT del Paciente *</label>
                <input type="text" class="form-input" id="nuevo-paciente-rut" required 
                       placeholder="12.345.678-9">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Profesional *</label>
                <select class="form-select" id="nueva-cita-professional" required>
                  <option value="">Seleccionar profesional...</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input type="date" class="form-input" id="nueva-cita-fecha" required>
              </div>
            </div>
            
            <div class="time-slots-container" id="nueva-cita-time-slots" style="display: none;">
              <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                <i class="fas fa-clock"></i> Horarios Disponibles
              </h4>
              <div class="time-slots-grid" id="nueva-cita-time-grid">
                <!-- Los slots de tiempo se cargarán aquí -->
              </div>
            </div>
            
            <div class="form-group" style="margin-top: 24px;">
              <label class="form-label">Observaciones</label>
              <textarea class="form-textarea" id="nueva-cita-observaciones" rows="3" 
                        placeholder="Observaciones adicionales para la cita..."></textarea>
            </div>
            
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="closeModal('nueva-cita-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success" disabled>
                <i class="fas fa-calendar-check"></i>
                Crear Cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

async function setupNuevaCitaModal() {
  try {
    // Cargar profesionales
    const professionalSelect = document.getElementById('nueva-cita-professional');
    if (professionalSelect && professionalsList.length > 0) {
      professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
      
      professionalsList.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.id;
        option.textContent = `${prof.nombre} ${prof.apellidos} - ${getProfessionName(prof.profession)}`;
        professionalSelect.appendChild(option);
      });
    }

    // Configurar fecha mínima (hoy)
    const fechaInput = document.getElementById('nueva-cita-fecha');
    if (fechaInput) {
      const today = new Date().toISOString().split('T')[0];
      fechaInput.min = today;
    }

    setupNuevaCitaEventListeners();
    
  } catch (error) {
    console.error('Error setting up nueva cita modal:', error);
  }
}

function setupNuevaCitaEventListeners() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const fechaInput = document.getElementById('nueva-cita-fecha');
    const rutInput = document.getElementById('nuevo-paciente-rut');
    const form = document.getElementById('nueva-cita-form');
    
    // Formatear RUT mientras se escribe
    if (rutInput) {
      rutInput.addEventListener('input', (e) => {
        e.target.value = formatRUT(e.target.value);
      });
      
      rutInput.addEventListener('blur', (e) => {
        const rut = e.target.value.trim();
        if (rut && !validateRUT(rut)) {
          e.target.classList.add('error');
          showFieldError(e.target, 'RUT inválido');
        } else {
          e.target.classList.remove('error');
          clearFieldError(e.target);
        }
      });
    }

    // Cargar horarios cuando cambie profesional o fecha
    if (professionalSelect) {
      professionalSelect.addEventListener('change', loadNuevaCitaTimeSlots);
    }
    
    if (fechaInput) {
      fechaInput.addEventListener('change', loadNuevaCitaTimeSlots);
    }

    // Manejar envío del formulario
    if (form) {
      form.addEventListener('submit', handleNuevaCitaSubmit);
    }
    
  } catch (error) {
    console.error('Error setting up nueva cita event listeners:', error);
  }
}

async function loadNuevaCitaTimeSlots() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const fechaInput = document.getElementById('nueva-cita-fecha');
    const timeSlotsContainer = document.getElementById('nueva-cita-time-slots');
    const timeSlotsGrid = document.getElementById('nueva-cita-time-grid');
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    
    if (!professionalSelect?.value || !fechaInput?.value) {
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    const selectedDate = new Date(fechaInput.value);
    
    // Verificar si es día laborable
    if (!isWorkingDay(selectedDate)) {
      if (timeSlotsGrid) {
        timeSlotsGrid.innerHTML = `
          <div style="text-align: center; padding: 20px; color: var(--gray-600);">
            <i class="fas fa-calendar-times" style="font-size: 24px; margin-bottom: 8px;"></i>
            <p>No hay atención los fines de semana</p>
            <p><small>Selecciona un día de lunes a viernes</small></p>
          </div>
        `;
      }
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    // Generar slots de tiempo disponibles
    const timeSlots = generateTimeSlots();
    const occupiedSlots = await getOccupiedSlots(professionalSelect.value, selectedDate);
    
    if (timeSlotsGrid) {
      timeSlotsGrid.innerHTML = timeSlots.map(slot => {
        const isOccupied = occupiedSlots.includes(slot.time);
        const isPast = isPastTimeSlot(selectedDate, slot.hour, slot.minute);
        const isDisabled = isOccupied || isPast;
        
        return `
          <button type="button" 
                  class="time-slot ${isDisabled ? 'disabled' : ''}" 
                  data-time="${slot.time}"
                  ${isDisabled ? 'disabled' : ''}
                  onclick="selectNuevaCitaTimeSlot(this)">
            <i class="fas fa-clock" style="margin-right: 4px;"></i>
            ${slot.time}
            ${isOccupied ? '<br><small>Ocupado</small>' : ''}
            ${isPast ? '<br><small>Pasado</small>' : ''}
          </button>
        `;
      }).join('');
    }
    
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true; // Se habilitará al seleccionar hora
    
  } catch (error) {
    console.error('Error loading nueva cita time slots:', error);
    showNotification('Error al cargar horarios disponibles', 'error');
  }
}

function selectNuevaCitaTimeSlot(button) {
  try {
    // Remover selección anterior
    document.querySelectorAll('#nueva-cita-time-grid .time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.style.background = 'white';
      slot.style.color = 'var(--primary-blue)';
    });
    
    // Seleccionar nuevo slot
    button.classList.add('selected');
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
    
    // Habilitar botón de envío
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('Error selecting nueva cita time slot:', error);
  }
}

async function handleNuevaCitaSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = {
      pacienteNombre: document.getElementById('nuevo-paciente-nombre')?.value?.trim(),
      pacienteRut: document.getElementById('nuevo-paciente-rut')?.value?.trim(),
      professionalId: document.getElementById('nueva-cita-professional')?.value,
      fecha: document.getElementById('nueva-cita-fecha')?.value,
      hora: document.querySelector('#nueva-cita-time-grid .time-slot.selected')?.dataset.time,
      observaciones: document.getElementById('nueva-cita-observaciones')?.value?.trim() || ''
    };
    
    console.log('📅 Datos de la nueva cita:', formData);
    
    // Validaciones
    if (!formData.pacienteNombre || !formData.pacienteRut || !formData.professionalId || 
        !formData.fecha || !formData.hora) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    if (!validateRUT(formData.pacienteRut)) {
      showNotification('RUT del paciente inválido', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    // Obtener datos del profesional
    const professional = professionalsList.find(p => p.id === formData.professionalId);
    if (!professional) {
      throw new Error('Profesional no encontrado');
    }
    
    // Crear fecha y hora completa
    const fechaCompleta = new Date(`${formData.fecha}T${formData.hora}:00`);
    
    const citaData = {
      pacienteNombre: formData.pacienteNombre,
      pacienteRut: formatRUT(formData.pacienteRut),
      profesionalId: formData.professionalId,
      profesionalNombre: `${professional.nombre} ${professional.apellidos}`,
      tipoProfesional: professional.profession,
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: 'consulta_general',
      cesfam: currentUserData.cesfam,
      observaciones: formData.observaciones,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: currentUser.uid,
      origen: 'agenda_directa'
    };
    
    console.log('💾 Guardando nueva cita...');
    
    // Guardar cita
    const citaRef = await db.collection('citas').add(citaData);
    
    console.log('✅ Nueva cita creada exitosamente');
    
    closeModal('nueva-cita-modal');
    
    // Actualizar calendario si estamos en la pestaña de agenda
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab === 'agenda') {
      renderCalendar();
      await loadTodayAppointments();
    }
    
    showNotification(`Cita agendada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`, 'success', 5000);
    
  } catch (error) {
    console.error('❌ Error creando nueva cita:', error);
    showNotification('Error al crear cita: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ================= FUNCIONES DE TIEMPO Y CALENDARIO =================

function generateTimeSlots() {
  const slots = [];
  const { horaInicio, horaFin, minutoFin, intervaloMinutos } = HORARIOS_CONFIG;
  
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
  const dayOfWeek = date.getDay();
  return HORARIOS_CONFIG.diasSemana.includes(dayOfWeek);
}

function isPastTimeSlot(date, hour, minute) {
  const now = new Date();
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);
  return slotTime <= now;
}

async function getOccupiedSlots(professionalId, date) {
  try {
    if (!currentUserData) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .where('estado', '!=', 'cancelada')
      .get();
    
    const occupiedSlots = [];
    snapshot.forEach(doc => {
      const cita = doc.data();
      const citaDate = cita.fecha.toDate();
      const timeString = citaDate.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      occupiedSlots.push(timeString);
    });
    
    return occupiedSlots;
    
  } catch (error) {
    console.error('Error getting occupied slots:', error);
    return [];
  }
}

// ================= GESTIÓN DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    const cacheKey = `pacientes_${currentUserData.cesfam}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      pacientesData = cachedData;
      renderPacientesFromCesfam(cachedData);
      return;
    }
    
    const pacientesSnapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();
    
    const pacientes = [];
    pacientesSnapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    pacientesData = pacientes;
    setCachedData(cacheKey, pacientes);
    renderPacientesFromCesfam(pacientes);
    
  } catch (error) {
    console.error('❌ Error loading pacientes:', error);
    showNotification('Error al cargar pacientes: ' + error.message, 'error');
    
    const grid = document.getElementById('patients-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar pacientes</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="loadPacientes()">
            <i class="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  } finally {
    showLoading(false);
  }
}

function renderPacientesFromCesfam(pacientes) {
  try {
    const grid = document.getElementById('patients-grid');
    if (!grid) return;

    if (pacientes.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-users"></i>
          <h3>No hay pacientes registrados</h3>
          <p>No se encontraron pacientes que se hayan registrado en este CESFAM a través de solicitudes de ayuda</p>
          <div style="margin-top: 16px;">
            <button class="btn btn-primary" onclick="loadSolicitudes()">
              <i class="fas fa-inbox"></i>
              Ver Solicitudes Pendientes
            </button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = pacientes.map(paciente => createPacienteCard(paciente)).join('');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Renderizados ${pacientes.length} pacientes del CESFAM`);
    }
  } catch (error) {
    console.error('❌ Error rendering pacientes:', error);
  }
}

function createPacienteCard(paciente) {
  try {
    const fecha = formatDate(paciente.fechaCreacion);
    const estado = paciente.estado || 'activo';
    const edad = paciente.edad || 'N/A';
    const numFichas = paciente.fichasClinicas ? paciente.fichasClinicas.length : 0;
    
    return `
      <div class="patient-card" data-id="${paciente.id}">
        <div class="patient-header">
          <div class="patient-info">
            <h3>${paciente.nombre} ${paciente.apellidos}</h3>
            <p><strong>RUT:</strong> ${paciente.rut}</p>
          </div>
          <span class="patient-status ${estado}">
            <i class="fas fa-${estado === 'activo' ? 'check-circle' : 'times-circle'}"></i>
            ${estado.toUpperCase()}
          </span>
        </div>
        
        <div class="patient-details">
          <div class="detail-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <span><strong>Edad:</strong> ${edad} años</span>
            <span><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</span>
          </div>
          <div class="detail-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <span><strong>Registrado:</strong> ${fecha}</span>
            <span><strong>Fichas clínicas:</strong> ${numFichas}</span>
          </div>
          ${paciente.email ? `<div class="detail-row"><span><strong>Email:</strong> ${paciente.email}</span></div>` : ''}
        </div>
        
        <div class="patient-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          <button class="btn btn-primary btn-sm" onclick="verFichaClinicaPaciente('${paciente.id}')">
            <i class="fas fa-file-medical"></i>
            Ver Ficha
          </button>
          <button class="btn btn-success btn-sm" onclick="downloadFichaClinica('${paciente.id}')">
            <i class="fas fa-download"></i>
            Descargar PDF
          </button>
          <button class="btn btn-outline btn-sm" onclick="agendarPacienteExistente('${paciente.id}')">
            <i class="fas fa-calendar-plus"></i>
            Agendar
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error creating patient card:', error);
    return '<div class="patient-card error-card">Error al cargar paciente</div>';
  }
}

// ================= FUNCIONES PARA FICHAS CLÍNICAS =================

async function verFichaClinicaPaciente(pacienteId) {
  try {
    showLoading(true, 'Cargando ficha clínica...');
    
    const paciente = pacientesData.find(p => p.id === pacienteId);
    if (!paciente) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }

    // Cargar fichas clínicas del paciente
    const fichasSnapshot = await db.collection('fichas_clinicas')
      .where('pacienteId', '==', pacienteId)
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const fichas = [];
    fichasSnapshot.forEach(doc => {
      fichas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    const fichaModal = createFichaClinicaModal(paciente, fichas);
    document.body.insertAdjacentHTML('beforeend', fichaModal);
    showModal('ficha-clinica-modal');
    
  } catch (error) {
    console.error('Error loading ficha clínica:', error);
    showNotification('Error al cargar ficha clínica: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function createFichaClinicaModal(paciente, fichas) {
  const fechaRegistro = formatDate(paciente.fechaCreacion);
  
  const fichasHtml = fichas.length > 0 ? 
    fichas.map(ficha => {
      const fechaFicha = formatDate(ficha.fechaCreacion);
      const profesional = ficha.profesionalNombre || 'Profesional no especificado';
      
      return `
        <div class="ficha-entry" style="border: 1px solid var(--gray-200); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div class="ficha-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0; color: var(--primary-blue);">${ficha.tipoConsulta || 'Consulta General'}</h4>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--gray-600);">
                ${profesional} - ${fechaFicha}
              </p>
            </div>
            <span class="status-badge" style="background: var(--success-green); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${ficha.estado || 'COMPLETADA'}
            </span>
          </div>
          
          <div class="ficha-content">
            ${ficha.observaciones ? `
              <div style="margin-bottom: 12px;">
                <strong>Observaciones:</strong>
                <p style="margin: 4px 0; padding: 8px; background: var(--gray-50); border-radius: 4px; line-height: 1.5;">
                  ${ficha.observaciones}
                </p>
              </div>
            ` : ''}
            
            ${ficha.diagnostico ? `
              <div style="margin-bottom: 12px;">
                <strong>Diagnóstico:</strong>
                <p style="margin: 4px 0; padding: 8px; background: var(--gray-50); border-radius: 4px; line-height: 1.5;">
                  ${ficha.diagnostico}
                </p>
              </div>
            ` : ''}
            
            ${ficha.planTratamiento ? `
              <div style="margin-bottom: 12px;">
                <strong>Plan de Tratamiento:</strong>
                <p style="margin: 4px 0; padding: 8px; background: var(--gray-50); border-radius: 4px; line-height: 1.5;">
                  ${ficha.planTratamiento}
                </p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('') :
    `<div class="no-fichas" style="text-align: center; padding: 40px; color: var(--gray-500);">
      <i class="fas fa-file-medical" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
      <h3>Sin fichas clínicas</h3>
      <p>Este paciente aún no tiene fichas clínicas registradas</p>
      <button class="btn btn-primary mt-3" onclick="crearNuevaFicha('${paciente.id}')">
        <i class="fas fa-plus"></i>
        Crear Primera Ficha
      </button>
    </div>`;

  return `
    <div class="modal-overlay temp-modal" id="ficha-clinica-modal">
      <div class="modal large-modal" style="max-width: 900px;">
        <button class="modal-close" onclick="closeModal('ficha-clinica-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <div class="ficha-header" style="margin-bottom: 24px; border-bottom: 2px solid var(--gray-200); padding-bottom: 16px;">
            <h2 style="margin: 0; color: var(--primary-blue);">
              <i class="fas fa-file-medical"></i> Ficha Clínica
            </h2>
            <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h3 style="margin: 0; font-size: 18px;">${paciente.nombre} ${paciente.apellidos}</h3>
                <p style="margin: 4px 0; color: var(--gray-600);"><strong>RUT:</strong> ${paciente.rut}</p>
                <p style="margin: 4px 0; color: var(--gray-600);"><strong>Edad:</strong> ${paciente.edad} años</p>
              </div>
              <div>
                <p style="margin: 4px 0; color: var(--gray-600);"><strong>CESFAM:</strong> ${paciente.cesfam}</p>
                <p style="margin: 4px 0; color: var(--gray-600);"><strong>Registrado:</strong> ${fechaRegistro}</p>
                <p style="margin: 4px 0; color: var(--gray-600);"><strong>Total de consultas:</strong> ${fichas.length}</p>
              </div>
            </div>
          </div>
          
          <div class="fichas-list" style="max-height: 500px; overflow-y: auto;">
            ${fichasHtml}
          </div>
          
          <div class="ficha-actions" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--gray-200); display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('ficha-clinica-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
            ${fichas.length > 0 ? `
              <button class="btn btn-success" onclick="downloadFichaClinica('${paciente.id}')">
                <i class="fas fa-download"></i>
                Descargar PDF
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="crearNuevaFicha('${paciente.id}')">
              <i class="fas fa-plus"></i>
              Nueva Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function crearNuevaFicha(pacienteId) {
  try {
    const paciente = pacientesData.find(p => p.id === pacienteId);
    if (!paciente) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }

    // Cerrar modal anterior si está abierto
    closeModal('ficha-clinica-modal');

    const nuevaFichaModal = createNuevaFichaModal(paciente);
    document.body.insertAdjacentHTML('beforeend', nuevaFichaModal);
    showModal('nueva-ficha-modal');
    
  } catch (error) {
    console.error('Error creando nueva ficha:', error);
    showNotification('Error al crear nueva ficha', 'error');
  }
}

function createNuevaFichaModal(paciente) {
  return `
    <div class="modal-overlay temp-modal" id="nueva-ficha-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('nueva-ficha-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2 style="margin-bottom: 24px; color: var(--primary-blue);">
            <i class="fas fa-plus-circle"></i> Nueva Consulta Clínica
          </h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0; color: var(--primary-blue);">${paciente.nombre} ${paciente.apellidos}</h3>
            <p style="margin: 4px 0 0 0; color: var(--gray-700);">
              RUT: ${paciente.rut} - Edad: ${paciente.edad} años - ${paciente.cesfam}
            </p>
          </div>
          
          <form id="nueva-ficha-form">
            <input type="hidden" id="nueva-ficha-paciente-id" value="${paciente.id}">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Tipo de Consulta *</label>
                <select class="form-select" id="nueva-ficha-tipo" required>
                  <option value="">Seleccionar tipo...</option>
                  <option value="primera_consulta">Primera Consulta</option>
                  <option value="control">Control</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="urgencia">Consulta de Urgencia</option>
                  <option value="evaluacion">Evaluación</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha de Consulta *</label>
                <input type="date" class="form-input" id="nueva-ficha-fecha" required>
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Observaciones de la Consulta *</label>
              <textarea class="form-textarea" id="nueva-ficha-observaciones" rows="4" required
                        placeholder="Describe la consulta realizada, síntomas observados, evolución del paciente..."></textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Diagnóstico</label>
              <textarea class="form-textarea" id="nueva-ficha-diagnostico" rows="3"
                        placeholder="Diagnóstico o impresión clínica..."></textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Plan de Tratamiento</label>
              <textarea class="form-textarea" id="nueva-ficha-plan" rows="3"
                        placeholder="Plan de tratamiento, recomendaciones, próximas citas..."></textarea>
            </div>
            
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="closeModal('nueva-ficha-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success">
                <i class="fas fa-save"></i>
                Guardar Consulta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Función para manejar envío de nueva ficha
async function handleNuevaFichaSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = {
      pacienteId: document.getElementById('nueva-ficha-paciente-id')?.value,
      tipoConsulta: document.getElementById('nueva-ficha-tipo')?.value,
      fechaConsulta: document.getElementById('nueva-ficha-fecha')?.value,
      observaciones: document.getElementById('nueva-ficha-observaciones')?.value?.trim(),
      diagnostico: document.getElementById('nueva-ficha-diagnostico')?.value?.trim(),
      planTratamiento: document.getElementById('nueva-ficha-plan')?.value?.trim()
    };
    
    // Validaciones
    if (!formData.pacienteId || !formData.tipoConsulta || !formData.fechaConsulta || !formData.observaciones) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    const fichaData = {
      pacienteId: formData.pacienteId,
      tipoConsulta: formData.tipoConsulta,
      fechaConsulta: new Date(formData.fechaConsulta),
      observaciones: formData.observaciones,
      diagnostico: formData.diagnostico || '',
      planTratamiento: formData.planTratamiento || '',
      profesionalId: currentUser.uid,
      profesionalNombre: `${currentUserData.nombre} ${currentUserData.apellidos}`,
      profesionalTipo: currentUserData.profession,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'completada'
    };
    
    console.log('💾 Guardando nueva ficha clínica...');
    
    const fichaRef = await db.collection('fichas_clinicas').add(fichaData);
    
    console.log('✅ Ficha clínica guardada con ID:', fichaRef.id);
    
    closeModal('nueva-ficha-modal');
    showNotification('Consulta clínica guardada exitosamente', 'success');
    
    // Actualizar datos del paciente si es necesario
    setTimeout(() => {
      loadPacientes(); // Recargar lista de pacientes
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error guardando ficha clínica:', error);
    showNotification('Error al guardar consulta: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// Event listener dinámico para formularios que se crean después
document.addEventListener('submit', function(e) {
  if (e.target.id === 'nueva-ficha-form') {
    handleNuevaFichaSubmit(e);
  } else if (e.target.id === 'seguimiento-form') {
    handleSeguimientoSubmit(e);
  } else if (e.target.id === 'reentry-form') {
    handleReentrySubmit(e);
  }
});

// ================= CONTINUAR CON RESTO DE FUNCIONES... =================

// Función para descargar ficha clínica en PDF
async function downloadFichaClinica(pacienteId) {
  try {
    showLoading(true, 'Generando PDF...');
    
    const paciente = pacientesData.find(p => p.id === pacienteId);
    if (!paciente) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }

    // Cargar fichas clínicas
    const fichasSnapshot = await db.collection('fichas_clinicas')
      .where('pacienteId', '==', pacienteId)
      .orderBy('fechaCreacion', 'desc')
      .get();
    
    const fichas = [];
    fichasSnapshot.forEach(doc => {
      fichas.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (fichas.length === 0) {
      showNotification('No hay fichas clínicas para descargar', 'warning');
      return;
    }

    // Generar contenido HTML para PDF
    const htmlContent = generateFichaPDFContent(paciente, fichas);
    
    // Usar html2pdf para generar el PDF
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: 1,
        filename: `ficha_clinica_${paciente.rut.replace(/[.-]/g, '')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(htmlContent).save();
    } else {
      // Fallback: abrir en nueva ventana para imprimir
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    showNotification('PDF generado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error downloading ficha clínica:', error);
    showNotification('Error al generar PDF: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function generateFichaPDFContent(paciente, fichas) {
  const fechaGeneracion = new Date().toLocaleDateString('es-CL');
  
  const fichasHtml = fichas.map(ficha => {
    const fechaFicha = formatDate(ficha.fechaCreacion);
    return `
      <div style="page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; padding: 15px;">
        <h3 style="color: #0f4c75; margin-bottom: 10px;">${ficha.tipoConsulta || 'Consulta General'}</h3>
        <p><strong>Fecha:</strong> ${fechaFicha}</p>
        <p><strong>Profesional:</strong> ${ficha.profesionalNombre}</p>
        
        ${ficha.observaciones ? `
          <div style="margin: 15px 0;">
            <strong>Observaciones:</strong>
            <p style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #0f4c75;">
              ${ficha.observaciones}
            </p>
          </div>
        ` : ''}
        
        ${ficha.diagnostico ? `
          <div style="margin: 15px 0;">
            <strong>Diagnóstico:</strong>
            <p style="margin: 5px 0; padding: 10px; background: #f9f9f9;">
              ${ficha.diagnostico}
            </p>
          </div>
        ` : ''}
        
        ${ficha.planTratamiento ? `
          <div style="margin: 15px 0;">
            <strong>Plan de Tratamiento:</strong>
            <p style="margin: 5px 0; padding: 10px; background: #f9f9f9;">
              ${ficha.planTratamiento}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ficha Clínica - ${paciente.nombre} ${paciente.apellidos}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #0f4c75; padding-bottom: 20px; margin-bottom: 30px; }
        .patient-info { background: #f0f8ff; padding: 20px; margin-bottom: 30px; border-radius: 5px; }
        .patient-info h2 { margin-top: 0; color: #0f4c75; }
        h1 { color: #0f4c75; margin: 0; }
        h3 { color: #0f4c75; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROGRAMA SENDA PUENTE ALTO</h1>
        <h2>Ficha Clínica del Paciente</h2>
      </div>
      
      <div class="patient-info">
        <h2>Información del Paciente</h2>
        <p><strong>Nombre:</strong> ${paciente.nombre} ${paciente.apellidos}</p>
        <p><strong>RUT:</strong> ${paciente.rut}</p>
        <p><strong>Edad:</strong> ${paciente.edad} años</p>
        <p><strong>CESFAM:</strong> ${paciente.cesfam}</p>
        <p><strong>Fecha de registro:</strong> ${formatDate(paciente.fechaCreacion)}</p>
        <p><strong>Total de consultas:</strong> ${fichas.length}</p>
      </div>
      
      <h2 style="color: #0f4c75;">Historial de Consultas</h2>
      ${fichasHtml}
      
      <div class="footer">
        <p>Documento generado el ${fechaGeneracion}</p>
        <p>PROGRAMA SENDA - Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol</p>
      </div>
    </body>
    </html>
  `;
}

// Función placeholder para agendar paciente existente
async function agendarPacienteExistente(pacienteId) {
  const paciente = pacientesData.find(p => p.id === pacienteId);
  if (paciente) {
    // Simular una solicitud para usar el modal de agenda existente
    const solicitudSimulada = {
      id: 'temp_' + pacienteId,
      tipo: 'paciente_existente',
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      rut: paciente.rut,
      telefono: paciente.telefono,
      cesfam: paciente.cesfam,
      prioridad: 'media'
    };
    
    showAgendaModal(solicitudSimulada.id);
    
    // Agregar temporalmente a solicitudesData para que funcione el modal
    solicitudesData.push(solicitudSimulada);
  } else {
    showNotification('Paciente no encontrado', 'error');
  }
}

// ================= SEGUIMIENTO =================

async function loadSeguimiento() {
  if (!currentUserData) return;
  
  try {
    showLoading(true, 'Cargando seguimiento...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Cargar citas de hoy
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
    console.error('❌ Error loading seguimiento:', error);
    showNotification('Error al cargar seguimiento: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderPatientsTimeline(appointmentsSnapshot) {
  try {
    const timeline = document.getElementById('patients-timeline');
    if (!timeline) return;
    
    if (appointmentsSnapshot.empty) {
      timeline.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <h3>No hay pacientes agendados para hoy</h3>
          <p>No se encontraron citas programadas para hoy</p>
          <button class="btn btn-primary mt-3" onclick="switchToAgendaTab()">
            <i class="fas fa-calendar-plus"></i>
            Ir a Agenda
          </button>
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
        <div class="timeline-item" onclick="openSeguimientoModal('${appointment.id}')">
          <div class="timeline-time">${hora}</div>
          <div class="timeline-patient">
            <h4>${appointment.pacienteNombre}</h4>
            <p>${getProfessionName(appointment.tipoProfesional)} - ${appointment.profesionalNombre}</p>
            <small>Tipo: ${appointment.tipo || 'General'}</small>
          </div>
          <span class="timeline-status ${estado}">
            <i class="fas fa-${getStatusIcon(estado)}"></i>
            ${estado.toUpperCase()}
          </span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('❌ Error rendering patients timeline:', error);
  }
}

function getStatusIcon(estado) {
  const icons = {
    'pendiente': 'clock',
    'confirmada': 'check',
    'en_curso': 'play',
    'completada': 'check-circle',
    'cancelada': 'times-circle'
  };
  return icons[estado] || 'circle';
}

function renderUpcomingAppointments(appointmentsSnapshot) {
  try {
    const grid = document.getElementById('upcoming-appointments-grid');
    const noUpcomingSection = document.getElementById('no-upcoming-section');
    
    if (!grid) return;
    
    if (appointmentsSnapshot.empty) {
      grid.style.display = 'none';
      if (noUpcomingSection) {
        noUpcomingSection.style.display = 'block';
      }
      return;
    }
    
    if (noUpcomingSection) {
      noUpcomingSection.style.display = 'none';
    }
    grid.style.display = 'grid';
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    grid.innerHTML = appointments.map(appointment => {
      const fecha = appointment.fecha.toDate();
      const fechaStr = fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="appointment-card" onclick="openSeguimientoModal('${appointment.id}')">
          <div class="appointment-card-header">
            <span class="appointment-date">
              <i class="fas fa-calendar"></i>
              ${fechaStr}
            </span>
            <span class="appointment-time">
              <i class="fas fa-clock"></i>
              ${hora}
            </span>
          </div>
          <div class="appointment-card-body">
            <h4>${appointment.pacienteNombre}</h4>
            <p><i class="fas fa-user-md"></i> ${getProfessionName(appointment.tipoProfesional)}</p>
            <p><i class="fas fa-tags"></i> ${appointment.tipo || 'General'}</p>
          </div>
          <div class="appointment-card-footer">
            <span class="status-badge ${appointment.estado || 'programada'}">
              ${(appointment.estado || 'programada').toUpperCase()}
            </span>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('❌ Error rendering upcoming appointments:', error);
  }
}

// Modal de seguimiento para escribir en ficha del paciente
async function openSeguimientoModal(citaId) {
  try {
    showLoading(true, 'Cargando información de la cita...');
    
    // Buscar la cita
    const citaDoc = await db.collection('citas').doc(citaId).get();
    
    if (!citaDoc.exists) {
      showNotification('Cita no encontrada', 'error');
      return;
    }
    
    const cita = { id: citaDoc.id, ...citaDoc.data() };
    
    // Buscar el paciente
    let paciente = null;
    if (cita.pacienteRut) {
      const pacienteSnapshot = await db.collection('pacientes')
        .where('rut', '==', cita.pacienteRut)
        .where('cesfam', '==', currentUserData.cesfam)
        .get();
      
      if (!pacienteSnapshot.empty) {
        paciente = { id: pacienteSnapshot.docs[0].id, ...pacienteSnapshot.docs[0].data() };
      }
    }
    
    const seguimientoModal = createSeguimientoModal(cita, paciente);
    document.body.insertAdjacentHTML('beforeend', seguimientoModal);
    showModal('seguimiento-modal');
    
    // Configurar fecha actual por defecto
    const fechaInput = document.getElementById('seguimiento-fecha');
    if (fechaInput) {
      fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
  } catch (error) {
    console.error('Error opening seguimiento modal:', error);
    showNotification('Error al abrir seguimiento: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function createSeguimientoModal(cita, paciente) {
  const fechaCita = cita.fecha.toDate();
  const fechaCitaStr = fechaCita.toLocaleDateString('es-CL') + ' a las ' + 
                       fechaCita.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="modal-overlay temp-modal" id="seguimiento-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('seguimiento-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2 style="margin-bottom: 24px; color: var(--primary-blue);">
            <i class="fas fa-file-medical-alt"></i> Seguimiento del Paciente
          </h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="margin: 0; color: var(--primary-blue);">${cita.pacienteNombre}</h3>
            <p style="margin: 4px 0 0 0; color: var(--gray-700);">
              ${cita.pacienteRut ? `RUT: ${cita.pacienteRut} - ` : ''}Cita: ${fechaCitaStr}
            </p>
            <p style="margin: 4px 0 0 0; color: var(--gray-700);">
              Profesional: ${cita.profesionalNombre} (${getProfessionName(cita.tipoProfesional)})
            </p>
          </div>
          
          <form id="seguimiento-form">
            <input type="hidden" id="seguimiento-cita-id" value="${cita.id}">
            <input type="hidden" id="seguimiento-paciente-id" value="${paciente?.id || ''}">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Tipo de Consulta *</label>
                <select class="form-select" id="seguimiento-tipo" required>
                  <option value="">Seleccionar tipo...</option>
                  <option value="primera_consulta">Primera Consulta</option>
                  <option value="control">Control</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="urgencia">Consulta de Urgencia</option>
                  <option value="evaluacion">Evaluación</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha de Consulta *</label>
                <input type="date" class="form-input" id="seguimiento-fecha" required>
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Observaciones de la Consulta *</label>
              <textarea class="form-textarea" id="seguimiento-observaciones" rows="4" required
                        placeholder="Describe la consulta realizada, síntomas observados, evolución del paciente..."></textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Diagnóstico</label>
              <textarea class="form-textarea" id="seguimiento-diagnostico" rows="3"
                        placeholder="Diagnóstico o impresión clínica..."></textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 24px;">
              <label class="form-label">Plan de Tratamiento</label>
              <textarea class="form-textarea" id="seguimiento-plan" rows="3"
                        placeholder="Plan de tratamiento, recomendaciones, próximas citas..."></textarea>
            </div>
            
            <div class="form-actions
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="closeModal('seguimiento-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success">
                <i class="fas fa-save"></i>
                Guardar en Ficha
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Manejar envío de seguimiento
async function handleSeguimientoSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = {
      citaId: document.getElementById('seguimiento-cita-id')?.value,
      pacienteId: document.getElementById('seguimiento-paciente-id')?.value,
      tipoConsulta: document.getElementById('seguimiento-tipo')?.value,
      fechaConsulta: document.getElementById('seguimiento-fecha')?.value,
      observaciones: document.getElementById('seguimiento-observaciones')?.value?.trim(),
      diagnostico: document.getElementById('seguimiento-diagnostico')?.value?.trim(),
      planTratamiento: document.getElementById('seguimiento-plan')?.value?.trim()
    };
    
    // Validaciones
    if (!formData.citaId || !formData.tipoConsulta || !formData.fechaConsulta || !formData.observaciones) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    // Si no hay paciente, crearlo desde la cita
    let pacienteId = formData.pacienteId;
    if (!pacienteId) {
      pacienteId = await createPacienteFromCita(formData.citaId);
    }
    
    const fichaData = {
      pacienteId: pacienteId,
      citaId: formData.citaId,
      tipoConsulta: formData.tipoConsulta,
      fechaConsulta: new Date(formData.fechaConsulta),
      observaciones: formData.observaciones,
      diagnostico: formData.diagnostico || '',
      planTratamiento: formData.planTratamiento || '',
      profesionalId: currentUser.uid,
      profesionalNombre: `${currentUserData.nombre} ${currentUserData.apellidos}`,
      profesionalTipo: currentUserData.profession,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'completada'
    };
    
    console.log('💾 Guardando ficha clínica desde seguimiento...');
    
    const fichaRef = await db.collection('fichas_clinicas').add(fichaData);
    
    // Actualizar estado de la cita
    await db.collection('citas').doc(formData.citaId).update({
      estado: 'completada',
      fichaClinicaId: fichaRef.id,
      fechaCompletada: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Ficha clínica guardada desde seguimiento con ID:', fichaRef.id);
    
    closeModal('seguimiento-modal');
    showNotification('Consulta clínica guardada exitosamente', 'success');
    
    // Recargar seguimiento
    setTimeout(() => {
      loadSeguimiento();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error guardando seguimiento:', error);
    showNotification('Error al guardar consulta: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// Crear paciente desde cita
async function createPacienteFromCita(citaId) {
  try {
    const citaDoc = await db.collection('citas').doc(citaId).get();
    if (!citaDoc.exists) {
      throw new Error('Cita no encontrada');
    }
    
    const cita = citaDoc.data();
    
    const pacienteData = {
      nombre: cita.pacienteNombre.split(' ')[0] || '',
      apellidos: cita.pacienteNombre.split(' ').slice(1).join(' ') || '',
      rut: cita.pacienteRut || '',
      telefono: cita.pacienteTelefono || '',
      edad: null, // Se puede solicitar después
      email: '',
      direccion: '',
      cesfam: cita.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaOrigenId: citaId,
      fichasClinicas: [],
      historicoTratamientos: []
    };
    
    const pacienteRef = await db.collection('pacientes').add(pacienteData);
    console.log('✅ Paciente creado desde cita con ID:', pacienteRef.id);
    
    return pacienteRef.id;
    
  } catch (error) {
    console.error('Error creating patient from cita:', error);
    throw error;
  }
}

// ================= GESTIÓN DE SOLICITUDES =================

async function loadSolicitudes() {
  if (!currentUserData) {
    console.log('⚠️ No hay datos de usuario para cargar solicitudes');
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
    
    loadPromises.push(
      retryOperation(async () => {
        try {
          const snapshot = await db.collection('solicitudes_ingreso')
            .where('cesfam', '==', currentUserData.cesfam)
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
          <h3>No hay solicitudes</h3>
          <p>No se encontraron solicitudes para tu CESFAM</p>
          <p><small>Esto puede deberse a que no hay solicitudes registradas o a permisos de acceso</small></p>
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
      } else if (solicitud.tipoSolicitud === 'anonimo') {
        titulo = 'Solicitud Anónima';
        subtitulo = `Tel: ${solicitud.telefono || 'No disponible'}`;
        tipoIcon = 'fa-user-secret';
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
      'agendada': 'fa-calendar-check',
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
        <button class="btn btn-outline ml-2" onclick="debugFirebaseConnection()">
          <i class="fas fa-tools"></i>
          Diagnosticar
        </button>
      </div>
    </div>
  `;
}

// ================= FILTROS =================

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
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Filtros configurados');
    }
  } catch (error) {
    console.error('❌ Error setting up filters:', error);
  }
}

function filterSolicitudes() {
  try {
    const searchTerm = document.getElementById('search-solicitudes')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    
    const cards = document.querySelectorAll('.request-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      const cardText = card.textContent.toLowerCase();
      const cardPriority = card.querySelector('.priority-badge')?.textContent.toLowerCase() || '';
      
      let show = true;
      
      // Filtro de búsqueda de texto
      if (searchTerm && !cardText.includes(searchTerm)) {
        show = false;
      }
      
      // Filtro de prioridad
      if (priorityFilter && !cardPriority.includes(priorityFilter)) {
        show = false;
      }
      
      // Filtro de estado
      if (currentFilter !== 'todas') {
        const statusElement = card.querySelector('[class*="status-"]');
        const cardStatus = statusElement ? statusElement.textContent.toLowerCase().trim() : 'pendiente';
        const filterStatus = currentFilter.toLowerCase();
        
        if (!cardStatus.includes(filterStatus)) {
          show = false;
        }
      }
      
      card.style.display = show ? 'block' : 'none';
      if (show) visibleCount++;
    });
    
    updateFilterResultsCount(visibleCount, cards.length);
    
  } catch (error) {
    console.error('❌ Error filtering solicitudes:', error);
  }
}

function updateFilterResultsCount(visible, total) {
  try {
    let countElement = document.getElementById('filter-results-count');
    
    if (!countElement) {
      countElement = document.createElement('div');
      countElement.id = 'filter-results-count';
      countElement.style.cssText = `
        padding: 8px 16px;
        background: var(--gray-100);
        border-radius: 6px;
        font-size: 14px;
        color: var(--gray-600);
        margin-bottom: 16px;
      `;
      
      const container = document.getElementById('requests-container');
      if (container) {
        container.parentNode.insertBefore(countElement, container);
      }
    }
    
    countElement.textContent = `Mostrando ${visible} de ${total} solicitudes`;
    countElement.style.display = total > 0 ? 'block' : 'none';
    
  } catch (error) {
    console.error('Error updating filter count:', error);
  }
}

// ================= GESTIÓN DE TABS =================

function setupTabFunctionality() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          loadTabData(targetTab);
        }
      });
    });
    
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab) {
      loadTabData(activeTab);
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Tab functionality configurado');
    }
  } catch (error) {
    console.error('❌ Error setting up tab functionality:', error);
  }
}

async function loadTabData(tabName) {
  try {
    if (!currentUserData) return;
    
    switch (tabName) {
      case 'solicitudes':
        await loadSolicitudes();
        break;
      case 'agenda':
        renderCalendar();
        await loadTodayAppointments();
        break;
      case 'seguimiento':
        await loadSeguimiento();
        break;
      case 'pacientes':
        await loadPacientes();
        break;
    }
  } catch (error) {
    console.error(`❌ Error loading data for tab ${tabName}:`, error);
  }
}

function switchToAgendaTab() {
  try {
    // Cambiar tab activo
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    const agendaTabBtn = document.querySelector('.tab-btn[data-tab="agenda"]');
    const agendaTabPane = document.getElementById('agenda-tab');
    
    if (agendaTabBtn) agendaTabBtn.classList.add('active');
    if (agendaTabPane) agendaTabPane.classList.add('active');
    
    // Cargar datos de agenda
    loadTabData('agenda');
    
  } catch (error) {
    console.error('Error switching to agenda tab:', error);
  }
}

// ================= GESTIÓN DE CALENDARIO =================

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

function renderCalendar() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    calendarGrid.innerHTML = '';
    
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayElement = createCalendarDay(currentDate, month, today);
      calendarGrid.appendChild(dayElement);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    loadMonthAppointments(year, month);
    
  } catch (error) {
    console.error('❌ Error renderizando calendario:', error);
  }
}

function createCalendarDay(date, currentMonth, today) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isToday = date.toDateString() === today.toDateString();
  const isPast = date < today;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  if (!isCurrentMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  if (isWeekend) dayElement.classList.add('weekend');
  if (isPast && isCurrentMonth) {
    dayElement.classList.add('past');
    dayElement.style.opacity = '0.5';
  }
  
  dayElement.innerHTML = `
    <div class="calendar-day-number">${date.getDate()}</div>
    <div class="calendar-appointments" id="appointments-${date.toISOString().split('T')[0]}"></div>
  `;
  
  if (!isPast && isCurrentMonth) {
    dayElement.addEventListener('click', () => selectCalendarDay(new Date(date)));
    dayElement.style.cursor = 'pointer';
  }
  
  return dayElement;
}

function selectCalendarDay(date) {
  try {
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });
    
    const dayElements = document.querySelectorAll('.calendar-day');
    dayElements.forEach(dayEl => {
      const dayNumber = dayEl.querySelector('.calendar-day-number').textContent;
      if (parseInt(dayNumber) === date.getDate() && !dayEl.classList.contains('other-month')) {
        dayEl.classList.add('selected');
      }
    });
    
    selectedCalendarDate = date;
    loadDayAppointments(date);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📅 Día seleccionado:', date.toLocaleDateString('es-CL'));
    }
  } catch (error) {
    console.error('❌ Error seleccionando día del calendario:', error);
  }
}

async function loadMonthAppointments(year, month) {
  if (!currentUserData) return;
  
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfMonth)
      .where('fecha', '<=', endOfMonth)
      .get();
    
    document.querySelectorAll('.calendar-appointments').forEach(container => {
      container.innerHTML = '';
    });
    
    const appointmentsByDate = {};
    
    appointmentsSnapshot.forEach(doc => {
      const appointment = doc.data();
      const appointmentDate = appointment.fecha.toDate();
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      if (!appointmentsByDate[dateString]) {
        appointmentsByDate[dateString] = [];
      }
      
      appointmentsByDate[dateString].push({
        id: doc.id,
        ...appointment
      });
    });
    
    Object.keys(appointmentsByDate).forEach(dateString => {
      const container = document.getElementById(`appointments-${dateString}`);
      if (container) {
        const appointments = appointmentsByDate[dateString];
        
        appointments.slice(0, 3).forEach((appointment, index) => {
          const appointmentEl = document.createElement('div');
          appointmentEl.className = 'calendar-appointment';
          appointmentEl.textContent = appointment.pacienteNombre || 'Cita';
          appointmentEl.title = `${appointment.pacienteNombre} - ${appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
          container.appendChild(appointmentEl);
        });
        
        if (appointments.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.className = 'calendar-appointment more';
          moreEl.textContent = `+${appointments.length - 3} más`;
          moreEl.style.fontSize = '10px';
          moreEl.style.opacity = '0.8';
          container.appendChild(moreEl);
        }
      }
    });
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Cargadas citas del mes: ${appointmentsSnapshot.size}`);
    }
    
  } catch (error) {
    console.error('❌ Error cargando citas del mes:', error);
  }
}

async function loadDayAppointments(date) {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList || !currentUserData) return;
  
  try {
    appointmentsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>';
    
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
      appointmentsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <p>No hay citas programadas para ${date.toLocaleDateString('es-CL')}</p>
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
    
    appointmentsList.innerHTML = appointments.map(appointment => createAppointmentItem(appointment)).join('');
    
  } catch (error) {
    console.error('❌ Error cargando citas del día:', error);
    appointmentsList.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las citas</p>
        <button class="btn btn-outline btn-sm" onclick="loadDayAppointments(new Date('${date.toISOString()}'))">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    `;
  }
}

function createAppointmentItem(appointment) {
  const time = appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const statusIcon = {
    'programada': 'fa-clock',
    'confirmada': 'fa-check',
    'en_curso': 'fa-play',
    'completada': 'fa-check-circle',
    'cancelada': 'fa-times-circle'
  };
  
  return `
    <div class="appointment-item" data-id="${appointment.id}">
      <div class="appointment-time">${time}</div>
      <div class="appointment-details">
        <div class="appointment-patient">${appointment.pacienteNombre}</div>
        <div class="appointment-professional">${appointment.profesionalNombre}</div>
        <div class="appointment-type">${getProfessionName(appointment.tipoProfesional)}</div>
      </div>
      <div class="appointment-status">
        <span class="status-badge ${appointment.estado || 'programada'}">
          <i class="fas ${statusIcon[appointment.estado] || 'fa-circle'}"></i>
          ${(appointment.estado || 'programada').toUpperCase()}
        </span>
      </div>
      <div class="appointment-actions">
        <button class="btn btn-sm btn-outline" onclick="editAppointment('${appointment.id}')" title="Editar cita">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-success" onclick="openSeguimientoModal('${appointment.id}')" title="Completar consulta">
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
  `;
}

async function loadTodayAppointments() {
  try {
    const today = new Date();
    await loadDayAppointments(today);
  } catch (error) {
    console.error('❌ Error cargando citas de hoy:', error);
  }
}

// ================= FUNCIONES DE MODAL CONTROLS =================

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

// ================= FUNCIONES DE AUTENTICACIÓN =================

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

// ================= FUNCIÓN PARA MANEJAR REENTRY SUBMIT =================

async function handleReentrySubmit(e) {
  e.preventDefault();
  
  try {
    const formData = {
      nombre: document.getElementById('reentry-name')?.value?.trim(),
      rut: document.getElementById('reentry-rut')?.value?.trim(),
      cesfam: document.getElementById('reentry-cesfam')?.value,
      motivo: document.getElementById('reentry-reason')?.value?.trim(),
      telefono: document.getElementById('reentry-phone')?.value?.trim()
    };
    
    // Validaciones
    if (!formData.nombre || !formData.rut || !formData.cesfam || !formData.motivo || !formData.telefono) {
      showNotification('Por favor completa todos los campos', 'warning');
      return;
    }
    
    if (!validateRUT(formData.rut)) {
      showNotification('RUT inválido', 'warning');
      return;
    }
    
    if (!validatePhoneNumberString(formData.telefono)) {
      showNotification('Teléfono inválido', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    const reingresoData = {
      nombre: formData.nombre,
      rut: formatRUT(formData.rut),
      cesfam: formData.cesfam,
      motivo: formData.motivo,
      telefono: formData.telefono,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      prioridad: 'media',
      origen: 'web_publica',
      tipo: 'reingreso'
    };
    
    console.log('💾 Guardando solicitud de reingreso...');
    
    const docRef = await db.collection('reingresos').add(reingresoData);
    
    console.log('✅ Reingreso guardado con ID:', docRef.id);
    
    closeModal('reentry-modal');
    e.target.reset();
    
    showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 6000);
    
  } catch (error) {
    console.error('❌ Error enviando reingreso:', error);
    showNotification('Error al enviar solicitud de reingreso: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ================= FUNCIONES AUXILIARES Y PLACEHOLDERS =================

function showAboutProgram() {
  try {
    const aboutInfo = `
      <div class="modal-overlay temp-modal" id="about-modal">
        <div class="modal">
          <button class="modal-close" onclick="closeModal('about-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
          <div style="padding: 0 24px 24px;">
            <div class="about-section" style="margin-bottom: 20px;">
              <h3><i class="fas fa-target"></i> Misión</h3>
              <p>
                SENDA es el Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol, 
                organismo del gobierno de Chile dependiente del Ministerio del Interior y Seguridad Pública.
              </p>
              <p>
                <strong>Nuestra misión:</strong> Desarrollar e implementar políticas públicas en materia de drogas, 
                orientadas a prevenir su consumo, tratar y rehabilitar a quienes presentan consumo problemático.
              </p>
            </div>
            
            <div class="about-section" style="margin-bottom: 20px;">
              <h3><i class="fas fa-heart"></i> Servicios que ofrecemos</h3>
              <ul style="padding-left: 20px; margin-bottom: 16px;">
                <li>Atención ambulatoria básica</li>
                <li>Atención ambulatoria intensiva</li>
                <li>Tratamiento residencial</li>
                <li>Programas de reinserción social</li>
                <li>Apoyo familiar</li>
                <li>Prevención comunitaria</li>
              </ul>
            </div>
            
            <div class="about-section" style="margin-bottom: 20px;">
              <h3><i class="fas fa-phone"></i> Contacto Nacional</h3>
              <div class="contact-info">
                <p><strong>Teléfono:</strong> <a href="tel:1412" style="color: var(--primary-blue);">1412 (gratuito)</a></p>
                <p><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank" style="color: var(--primary-blue);">www.senda.gob.cl</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@senda.gob.cl" style="color: var(--primary-blue);">info@senda.gob.cl</a></p>
              </div>
            </div>
            
            <div class="emergency-section" style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h4><i class="fas fa-exclamation-triangle"></i> ¿Necesitas ayuda inmediata?</h4>
              <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
                <a href="tel:131" class="btn btn-danger btn-sm">
                  <i class="fas fa-phone"></i> Emergencias: 131
                </a>
                <a href="tel:6003607777" class="btn btn-primary btn-sm">
                  <i class="fas fa-headset"></i> Salud Responde: 600 360 7777
                </a>
              </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: var(--gray-500);">
              <p>Sistema desarrollado para el Programa SENDA Puente Alto</p>
              <p>Versión 1.0 - ${new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', aboutInfo);
    showModal('about-modal');
  } catch (error) {
    console.error('❌ Error showing about program:', error);
    showNotification('Error al mostrar información del programa', 'error');
  }
}

// ================= FUNCIONES DE DEBUGGING =================

async function debugFirebaseConnection() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE FIREBASE...');
  
  try {
    console.log('Firebase apps:', firebase.apps.length);
    if (firebase.apps.length > 0) {
      console.log('Firebase inicializado correctamente');
    } else {
      console.error('Firebase NO inicializado');
      return false;
    }
    
    const currentUser = firebase.auth().currentUser;
    console.log('Usuario autenticado:', currentUser ? 'SÍ' : 'NO');
    
    console.log('Firestore disponible:', !!db);
    
    await testFirestoreWrite();
    
    return true;
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

async function testFirestoreWrite() {
  try {
    console.log('Probando escritura en Firestore...');
    
    const testData = {
      test: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      message: 'Test de conexión'
    };
    
    const docRef = await db.collection('test_connection').add(testData);
    console.log('✅ Escritura exitosa, ID:', docRef.id);
    
    await docRef.delete();
    console.log('✅ Documento de prueba eliminado');
    
    return true;
  } catch (error) {
    console.error('❌ Error en escritura de prueba:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    return false;
  }
}

// ================= FUNCIONES DE DETALLE Y AGENDA =================

function showSolicitudDetail(solicitud) {
  try {
    const detailModal = createSolicitudDetailModal(solicitud);
    document.body.insertAdjacentHTML('beforeend', detailModal);
    showModal('solicitud-detail-modal');
  } catch (error) {
    console.error('Error showing solicitud detail:', error);
    showNotification('Error al mostrar detalles de la solicitud', 'error');
  }
}

function showSolicitudDetailById(solicitudId) {
  const solicitud = solicitudesData.find(s => s.id === solicitudId);
  if (solicitud) {
    showSolicitudDetail(solicitud);
  } else {
    showNotification('Solicitud no encontrada', 'error');
  }
}

function createSolicitudDetailModal(solicitud) {
  const fecha = formatDate(solicitud.fechaCreacion);
  const prioridad = solicitud.prioridad || 'baja';
  const estado = solicitud.estado || 'pendiente';
  
  let titulo, tipoIcon, tipoLabel;
  
  if (solicitud.tipo === 'reingreso') {
    titulo = `${solicitud.nombre || 'Sin nombre'}`;
    tipoIcon = 'fa-redo';
    tipoLabel = 'Reingreso';
  } else {
    tipoIcon = 'fa-user-plus';
    tipoLabel = 'Nueva Solicitud';
    if (solicitud.tipoSolicitud === 'identificado') {
      titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
    } else if (solicitud.tipoSolicitud === 'anonimo') {
      titulo = 'Solicitud Anónima';
      tipoIcon = 'fa-user-secret';
    } else {
      titulo = 'Solicitud de Información';
      tipoIcon = 'fa-info-circle';
    }
  }

  const sustancias = solicitud.sustancias || [];
  const sustanciasHtml = sustancias.length > 0 ? 
    `<div class="detail-section">
      <h4><i class="fas fa-flask"></i> Sustancias</h4>
      <div class="substances-list">
        ${sustancias.map(s => `<span class="substance-tag">${s}</span>`).join('')}
      </div>
    </div>` : '';

  return `
    <div class="modal-overlay temp-modal" id="solicitud-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('solicitud-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <div class="detail-header" style="margin-bottom: 24px; border-bottom: 2px solid var(--gray-200); padding-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h2 style="margin: 0; color: var(--primary-blue);">
                  <i class="fas ${tipoIcon}"></i> ${titulo}
                </h2>
                <p style="margin: 4px 0; color: var(--gray-600); font-weight: 500;">${tipoLabel}</p>
              </div>
              <div style="text-align: right;">
                <span class="priority-badge ${prioridad}" style="background-color: ${getPriorityColor(prioridad)}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                  PRIORIDAD ${prioridad.toUpperCase()}
                </span>
                <div style="margin-top: 8px;">
                  <span class="status-badge ${estado}" style="background-color: ${getStatusColor(estado)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${estado.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="detail-column">
              <div class="detail-section" style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-blue); margin-bottom: 12px; font-size: 16px;">
                  <i class="fas fa-info-circle"></i> Información General
                </h4>
                <div class="detail-grid" style="display: grid; gap: 8px;">
                  ${solicitud.rut ? `<div><strong>RUT:</strong> ${solicitud.rut}</div>` : ''}
                  ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
                  ${solicitud.telefono ? `<div><strong>Teléfono:</strong> <a href="tel:${solicitud.telefono}" style="color: var(--primary-blue);">${solicitud.telefono}</a></div>` : ''}
                  ${solicitud.email ? `<div><strong>Email:</strong> <a href="mailto:${solicitud.email}" style="color: var(--primary-blue);">${solicitud.email}</a></div>` : ''}
                  ${solicitud.direccion ? `<div><strong>Dirección:</strong> ${solicitud.direccion}</div>` : ''}
                  <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
                  <div>
                  <div><strong>Fecha:</strong> ${fecha}</div>
                  ${solicitud.paraMi ? `<div><strong>Solicita para:</strong> ${solicitud.paraMi.replace('_', ' ')}</div>` : ''}
                </div>
              </div>
              
              ${sustanciasHtml}
            </div>
            
            <div class="detail-column">
              ${solicitud.urgencia || solicitud.tiempoConsumo || solicitud.tratamientoPrevio || solicitud.motivacion ? 
                `<div class="detail-section" style="margin-bottom: 20px;">
                  <h4 style="color: var(--primary-blue); margin-bottom: 12px; font-size: 16px;">
                    <i class="fas fa-stethoscope"></i> Evaluación Clínica
                  </h4>
                  <div class="detail-grid" style="display: grid; gap: 8px;">
                    ${solicitud.urgencia ? `<div><strong>Nivel de urgencia:</strong> <span style="color: ${getPriorityColor(solicitud.urgencia)}; font-weight: bold;">${solicitud.urgencia.toUpperCase()}</span></div>` : ''}
                    ${solicitud.tiempoConsumo ? `<div><strong>Tiempo de consumo:</strong> ${formatTiempoConsumo(solicitud.tiempoConsumo)}</div>` : ''}
                    ${solicitud.tratamientoPrevio ? `<div><strong>Tratamiento previo:</strong> ${formatTratamientoPrevio(solicitud.tratamientoPrevio)}</div>` : ''}
                    ${solicitud.motivacion ? `<div><strong>Motivación (1-10):</strong> <span style="color: ${getMotivacionColor(solicitud.motivacion)}; font-weight: bold;">${solicitud.motivacion}/10</span></div>` : ''}
                  </div>
                </div>` : ''
              }
              
              ${solicitud.descripcion || solicitud.motivo ? 
                `<div class="detail-section">
                  <h4 style="color: var(--primary-blue); margin-bottom: 12px; font-size: 16px;">
                    <i class="fas fa-comment-alt"></i> ${solicitud.tipo === 'reingreso' ? 'Motivo del Reingreso' : 'Descripción'}
                  </h4>
                  <div style="background: var(--gray-50); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary-blue);">
                    <p style="margin: 0; line-height: 1.6; color: var(--gray-700);">${solicitud.descripcion || solicitud.motivo}</p>
                  </div>
                </div>` : ''
              }
            </div>
          </div>
          
          <div class="detail-actions" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--gray-200); display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
            <button class="btn btn-success" onclick="showAgendaModal('${solicitud.id}')">
              <i class="fas fa-calendar-plus"></i>
              Agendar Cita
            </button>
            ${solicitud.prioridad === 'critica' ? 
              `<button class="btn btn-danger" onclick="handleUrgentCase('${solicitud.id}')">
                <i class="fas fa-exclamation-triangle"></i>
                Caso Urgente
              </button>` : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function getPriorityColor(prioridad) {
  const colors = {
    'critica': '#ef4444',
    'alta': '#f59e0b',
    'media': '#3b82f6',
    'baja': '#10b981'
  };
  return colors[prioridad] || '#6b7280';
}

function getStatusColor(estado) {
  const colors = {
    'pendiente': '#f59e0b',
    'en_proceso': '#3b82f6',
    'agendada': '#10b981',
    'completada': '#059669'
  };
  return colors[estado] || '#6b7280';
}

function getMotivacionColor(motivacion) {
  const nivel = parseInt(motivacion);
  if (nivel <= 3) return '#ef4444';
  if (nivel <= 6) return '#f59e0b';
  return '#10b981';
}

function formatTiempoConsumo(tiempo) {
  const tiempos = {
    '0-6': 'Menos de 6 meses',
    '6-12': '6 meses a 1 año',
    '12-24': '1 a 2 años',
    '24-60': '2 a 5 años',
    '60+': 'Más de 5 años'
  };
  return tiempos[tiempo] || tiempo;
}

function formatTratamientoPrevio(tratamiento) {
  const tratamientos = {
    'no': 'No, es la primera vez',
    'si_senda': 'Sí, en SENDA',
    'si_otro': 'Sí, en otro lugar'
  };
  return tratamientos[tratamiento] || tratamiento;
}

// ================= FUNCIONES PLACEHOLDER ACTUALIZADAS =================

function handleUrgentCase(solicitudId) { 
  showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning'); 
}

function editAppointment(appointmentId) { 
  showNotification('Función de editar cita en desarrollo', 'info'); 
}

function showAgendaModal(solicitudId) {
  showNotification('Función de agenda en desarrollo', 'info');
}

// ================= FUNCIONES GLOBALES Y EXPORTS =================

window.showSolicitudDetail = showSolicitudDetail;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showAgendaModal = showAgendaModal;
window.handleUrgentCase = handleUrgentCase;
window.verFichaClinicaPaciente = verFichaClinicaPaciente;
window.downloadFichaClinica = downloadFichaClinica;
window.agendarPacienteExistente = agendarPacienteExistente;
window.showNuevaCitaModal = showNuevaCitaModal;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;
window.crearNuevaFicha = crearNuevaFicha;
window.openSeguimientoModal = openSeguimientoModal;
window.editAppointment = editAppointment;
window.showAboutProgram = showAboutProgram;
window.filterSolicitudes = filterSolicitudes;
window.loadSolicitudes = loadSolicitudes;
window.loadPacientes = loadPacientes;
window.loadSeguimiento = loadSeguimiento;
window.loadTodayAppointments = loadTodayAppointments;
window.debugFirebaseConnection = debugFirebaseConnection;
window.switchToAgendaTab = switchToAgendaTab;

// ================= INICIALIZACIÓN FINAL =================

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Auto-verificando Firebase...');
      debugFirebaseConnection();
    }
  }, 2000);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Registro de service worker para PWA (opcional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('✅ Service Worker registrado:', registration.scope);
        }
      })
      .catch(error => {
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('❌ Error registrando Service Worker:', error);
        }
      });
  });
}

// Event listeners globales para PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

// Manejo de errores no capturados
window.addEventListener('error', (e) => {
  if (APP_CONFIG.DEBUG_MODE) {
    console.error('❌ Error no capturado:', e.error);
  }
});

// Verificar conectividad
window.addEventListener('online', () => {
  showNotification('Conexión restaurada', 'success', 2000);
});

window.addEventListener('offline', () => {
  showNotification('Sin conexión a internet', 'warning', 5000);
});

console.log('🎉 SENDA PUENTE ALTO - Sistema cargado completamente');
console.log('📱 Versión: 1.0');
console.log('🏥 CESFAM: Configuración dinámica');
console.log('🔧 Debug mode:', APP_CONFIG.DEBUG_MODE ? 'Activado' : 'Desactivado');

// ================= FIN DEL ARCHIVO APP.JS =================
