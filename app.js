// ================= SENDA PUENTE ALTO - SISTEMA CORREGIDO COMPLETO =================
// CONFIGURACIÓN, VARIABLES GLOBALES Y FUNCIONES UTILITARIAS

// Firebase Configuration - CORREGIDA
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8", // Completa tu API key real aquí
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

// ================= FUNCIONES UTILITARIAS CORREGIDAS =================

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

// ================= FUNCIÓN CORREGIDA: Toggle Submit Button =================
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

// ================= FUNCIÓN CORREGIDA: Reset Form =================
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

// ================= INICIALIZACIÓN CORREGIDA =================

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

// ================= GESTIÓN DE EVENTOS CORREGIDA =================

function initializeEventListeners() {
  try {
    // Botones principales
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    // Elementos de búsqueda y filtros
    const searchSolicitudes = document.getElementById('search-solicitudes');
    const priorityFilter = document.getElementById('priority-filter');
    
    // Elementos de calendario
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

    // Event listeners con verificación de existencia
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

// ================= FUNCIÓN CORREGIDA: loadFormDraft =================
function loadFormDraft() {
  try {
    const savedDraft = localStorage.getItem('senda_form_draft');
    if (!savedDraft) return;
    
    const draftData = JSON.parse(savedDraft);
    
    // Verificar si el borrador no es muy antiguo (24 horas)
    if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('senda_form_draft');
      return;
    }
    
    // Preguntar al usuario si quiere restaurar el borrador
    const shouldRestore = confirm('Se encontró un borrador guardado anteriormente. ¿Deseas restaurarlo?');
    
    if (shouldRestore) {
      restoreFormDraft(draftData);
    } else {
      localStorage.removeItem('senda_form_draft');
    }
    
  } catch (error) {
    console.error('Error loading form draft:', error);
    localStorage.removeItem('senda_form_draft');
  }
}

function restoreFormDraft(draftData) {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    // Restaurar valores de los campos
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"], #${key}`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          if (Array.isArray(draftData[key])) {
            // Para checkboxes múltiples
            const fields = form.querySelectorAll(`[name="${key}"]`);
            fields.forEach(f => {
              f.checked = draftData[key].includes(f.value);
            });
          } else {
            field.checked = field.value === draftData[key];
          }
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    // Restaurar paso actual
    if (draftData.currentStep) {
      goToStep(draftData.currentStep);
    }
    
    // Actualizar visibilidad del formulario
    updateFormVisibility();
    
    showNotification('Borrador restaurado correctamente', 'success');
    
  } catch (error) {
    console.error('Error restoring form draft:', error);
  }
}
// ================= AUTENTICACIÓN CORREGIDA =================

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

// ================= FORMULARIOS Y VALIDACIONES CORREGIDAS =================

function setupFormValidation() {
  try {
    // Validación de RUT
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

    // Validación de teléfonos
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

    // Validación de emails
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

    // Validación de campos requeridos
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

// ================= FORMULARIO MULTI-PASO CORREGIDO =================

function setupMultiStepForm() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // Event listener para submit del formulario
    form.addEventListener('submit', handlePatientFormSubmit);

    // Botones de navegación
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

    // Cambios en tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', updateFormVisibility);
    });

    // Slider de motivación
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
    data['info-email'] = document.getElementById('info-email')?.value;
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
      await handleInformationOnlySubmit(data);
    }
    
  } catch (error) {
    console.error('❌ Error en envío de formulario:', error);
    showNotification('Error al enviar solicitud: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ================= FUNCIÓN CORREGIDA: Procesar Solicitud Completa =================
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
      sustancias: Array.isArray(data.sustancias) ? data.sustancias : [data.sustancias].filter(Boolean),
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

// ================= FUNCIÓN CORREGIDA: Manejar Información =================
async function handleInformationOnlySubmit(data) {
  try {
    console.log('📧 Procesando solicitud de información únicamente...');
    
    const email = data['info-email']?.trim();
    const edad = data['patient-age'];
    const cesfam = data['patient-cesfam'];
    
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

// ================= FUNCIONES DE NAVEGACIÓN CORREGIDAS =================

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

function updateFormVisibility() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const anonymousPhone = document.getElementById('anonymous-phone-container');
    const infoEmail = document.getElementById('info-email-container');
    
    // Ocultar todos los campos especiales
    if (anonymousPhone) anonymousPhone.style.display = 'none';
    if (infoEmail) infoEmail.style.display = 'none';
    
    // Mostrar campo según tipo de solicitud
    if (tipoSolicitud === 'anonimo' && anonymousPhone) {
      anonymousPhone.style.display = 'block';
      const phoneInput = document.getElementById('anonymous-phone');
      if (phoneInput) {
        phoneInput.required = true;
      }
    } else if (tipoSolicitud === 'informacion' && infoEmail) {
      infoEmail.style.display = 'block';
      const emailInput = document.getElementById('info-email');
      if (emailInput) {
        emailInput.required = true;
      }
    }
    
    // Limpiar requerimientos de campos no visibles
    if (anonymousPhone && tipoSolicitud !== 'anonimo') {
      const phoneInput = document.getElementById('anonymous-phone');
      if (phoneInput) phoneInput.required = false;
    }
    if (infoEmail && tipoSolicitud !== 'informacion') {
      const emailInput = document.getElementById('info-email');
      if (emailInput) emailInput.required = false;
    }
    
    updateMaxFormStep();
    
    setTimeout(() => {
      if (typeof saveFormDraft === 'function') {
        saveFormDraft();
      }
    }, 500);
    
  } catch (error) {
    console.error('Error updating form visibility:', error);
  }
}

function updateMaxFormStep() {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    maxFormStep = 1; // Solo necesita el primer paso
  } else if (tipoSolicitud === 'anonimo') {
    maxFormStep = 4; // Todos los pasos pero salta el 2
  } else {
    maxFormStep = 4; // Todos los pasos
  }
  
  // Actualizar texto del progress
  const progressText = document.getElementById('progress-text');
  if (progressText) {
    const currentStepNum = currentFormStep;
    let displayStep = currentStepNum;
    let totalSteps = maxFormStep;
    
    if (tipoSolicitud === 'anonimo' && currentStepNum === 3) {
      displayStep = 2;
      totalSteps = 3;
    } else if (tipoSolicitud === 'anonimo' && currentStepNum === 4) {
      displayStep = 3;
      totalSteps = 3;
    }
    
    progressText.textContent = `Paso ${displayStep} de ${totalSteps}`;
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
      if (draftData[key]) {
        // Manejar múltiples valores (checkboxes)
        if (Array.isArray(draftData[key])) {
          draftData[key].push(value);
        } else {
          draftData[key] = [draftData[key], value];
        }
      } else {
        draftData[key] = value;
      }
    }
    
    // Agregar valores adicionales
    const additionalFields = [
      'patient-age', 'patient-cesfam', 'anonymous-phone', 'info-email',
      'patient-name', 'patient-lastname', 'patient-rut', 'patient-phone',
      'patient-email', 'patient-address', 'tiempo-consumo', 'motivacion-range',
      'patient-description'
    ];
    
    additionalFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && field.value) {
        draftData[fieldId] = field.value;
      }
    });
    
    draftData.currentStep = currentFormStep;
    draftData.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
    isDraftSaved = true;
    
    showDraftSavedIndicator();
    
  } catch (error) {
    console.error('Error saving form draft:', error);
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
          if (phone && (!phone.value.trim() || !validatePhoneNumberString(phone.value.trim()))) {
            errors.push('Ingresa un teléfono válido');
            isValid = false;
          }
        } else if (tipoSolicitud === 'informacion') {
          const email = document.getElementById('info-email');
          if (email && (!email.value.trim() || !isValidEmail(email.value.trim()))) {
            errors.push('Ingresa un email válido');
            isValid = false;
          }
          
          // Si es válido, procesar información
          if (isValid) {
            setTimeout(() => handleInformationOnlySubmit({
              'info-email': email.value.trim(),
              'patient-age': document.getElementById('patient-age')?.value,
              'patient-cesfam': document.getElementById('patient-cesfam')?.value
            }), 100);
            return true;
          }
        }
      }

      const edad = parseInt(document.getElementById('patient-age')?.value);
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
    
    if (typeof saveFormDraft === 'function') {
      saveFormDraft();
    }

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 Navegando a paso ${step}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
  }
}
// ================= AUTENTICACIÓN Y LOGIN CORREGIDOS =================

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

// ================= GESTIÓN DE MODALES CORREGIDA =================

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

// ================= GESTIÓN DE TABS CORREGIDA =================

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
    if (activeTab && currentUserData) {
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

// ================= GESTIÓN DE CALENDARIO CORREGIDA =================

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
    
    if (currentUserData) {
      loadMonthAppointments(year, month);
    }
    
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

// ================= FILTROS CORREGIDOS =================

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

// ================= FUNCIÓN CORREGIDA: About Program =================

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

// ================= FUNCIONES PLACEHOLDER PARA DESARROLLO FUTURO =================

function handleUrgentCase(solicitudId) { 
  showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning'); 
}

function editAppointment(appointmentId) { 
  showNotification('Función de editar cita en desarrollo', 'info'); 
}

function showAgendaModal(solicitudId) {
  showNotification('Función de agenda en desarrollo', 'info');
}

// ================= FUNCIONES PARA CARGA DE DATOS STUB =================

async function loadSolicitudes() {
  if (!currentUserData) return;
  try {
    showLoading(true, 'Cargando solicitudes...');
    // Implementar carga real de solicitudes aquí
    setTimeout(() => {
      const container = document.getElementById('requests-container');
      if (container) {
        container.innerHTML = `
          <div class="no-results">
            <i class="fas fa-inbox"></i>
            <h3>Sistema en desarrollo</h3>
            <p>La carga de solicitudes se implementará próximamente</p>
          </div>
        `;
      }
      showLoading(false);
    }, 1000);
  } catch (error) {
    console.error('Error loading solicitudes:', error);
    showLoading(false);
  }
}

async function loadPacientes() {
  if (!currentUserData) return;
  try {
    showLoading(true, 'Cargando pacientes...');
    // Implementar carga real de pacientes aquí
    setTimeout(() => {
      const grid = document.getElementById('patients-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="no-results">
            <i class="fas fa-users"></i>
            <h3>Sistema en desarrollo</h3>
            <p>La gestión de pacientes se implementará próximamente</p>
          </div>
        `;
      }
      showLoading(false);
    }, 1000);
  } catch (error) {
    console.error('Error loading pacientes:', error);
    showLoading(false);
  }
}

async function loadSeguimiento() {
  if (!currentUserData) return;
  try {
    showLoading(true, 'Cargando seguimiento...');
    // Implementar carga real de seguimiento aquí
    setTimeout(() => {
      const timeline = document.getElementById('patients-timeline');
      if (timeline) {
        timeline.innerHTML = `
          <div class="no-results">
            <i class="fas fa-calendar-day"></i>
            <h3>Sistema en desarrollo</h3>
            <p>El seguimiento de pacientes se implementará próximamente</p>
          </div>
        `;
      }
      showLoading(false);
    }, 1000);
  } catch (error) {
    console.error('Error loading seguimiento:', error);
    showLoading(false);
  }
}

async function loadProfessionalsList() {
  try {
    if (!currentUserData) return [];
    
    const cacheKey = `professionals_${currentUserData.cesfam}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      professionalsList = cached;
      return;
    }
    
    // Implementar carga real aquí
    professionalsList = [];
    setCachedData(cacheKey, professionalsList);
    
  } catch (error) {
    console.error('Error loading professionals list:', error);
  }
}

// ================= FUNCIONES GLOBALES Y EXPORTS =================

// Funciones globales necesarias para el HTML
window.showAboutProgram = showAboutProgram;
window.filterSolicitudes = filterSolicitudes;
window.loadSolicitudes = loadSolicitudes;
window.loadPacientes = loadPacientes;
window.loadSeguimiento = loadSeguimiento;
window.loadTodayAppointments = loadTodayAppointments;
window.switchToAgendaTab = switchToAgendaTab;
window.closeModal = closeModal;

// ================= INICIALIZACIÓN FINAL =================

// Event listener para reentry form
document.addEventListener('submit', function(e) {
  if (e.target.id === 'reentry-form') {
    handleReentrySubmit(e);
  }
});

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

// Auto-verificación de Firebase después de cargar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Auto-verificando Firebase...');
      debugFirebaseConnection();
    }
  }, 2000);
});

async function debugFirebaseConnection() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE FIREBASE...');
  
  try {
    console.log('Firebase apps:', firebase.apps.length);
    if (firebase.apps.length > 0) {
      console.log('✅ Firebase inicializado correctamente');
    } else {
      console.error('❌ Firebase NO inicializado');
      return false;
    }
    
    const currentUser = firebase.auth().currentUser;
    console.log('Usuario autenticado:', currentUser ? 'SÍ' : 'NO');
    
    console.log('Firestore disponible:', !!db);
    
    return true;
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return false;
  }
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

// Manejo de conectividad
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
