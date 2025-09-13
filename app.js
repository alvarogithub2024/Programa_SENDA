// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO COMPLETO =================
// PARTE 1 COMPLETA: Configuración, Inicialización y Funciones Utilitarias

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

// Variables globales para Firebase
let auth, db, firebaseApp;

// Función para inicializar Firebase de forma segura
function initializeFirebaseSafely() {
  try {
    console.log('🔄 Iniciando inicialización de Firebase...');
    
    // Verificar que Firebase SDK esté cargado
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK no está cargado. Verifica que los scripts estén incluidos.');
    }
    
    console.log('✅ Firebase SDK detectado');
    console.log('Apps existentes:', firebase.apps ? firebase.apps.length : 0);
    
    // Inicializar solo si no existe ya
    if (!firebase.apps || firebase.apps.length === 0) {
      console.log('🆕 Inicializando nueva app de Firebase...');
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      console.log('♻️ Usando app de Firebase existente...');
      firebaseApp = firebase.app();
    }
    
    // Verificar que la app se inicializó correctamente
    if (!firebaseApp) {
      throw new Error('No se pudo obtener la instancia de Firebase App');
    }
    
    console.log('✅ Firebase App inicializada:', firebaseApp.name);
    
    // Inicializar Auth
    try {
      auth = firebase.auth(firebaseApp);
      console.log('✅ Firebase Auth inicializado');
    } catch (authError) {
      console.error('❌ Error inicializando Auth:', authError);
      throw authError;
    }
    
    // Inicializar Firestore
    try {
      db = firebase.firestore(firebaseApp);
      console.log('✅ Firestore inicializado');
      
      // Configurar persistencia offline con manejo de errores
      db.enablePersistence({
        synchronizeTabs: true
      }).then(() => {
        console.log('✅ Persistencia offline habilitada');
      }).catch((err) => {
        console.warn('⚠️ Persistencia offline falló:', err.code);
        if (err.code === 'failed-precondition') {
          console.warn('Múltiples tabs abiertas, persistencia deshabilitada');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistencia no soportada en este navegador');
        }
      });
      
    } catch (firestoreError) {
      console.error('❌ Error inicializando Firestore:', firestoreError);
      throw firestoreError;
    }
    
    // Test de conexión básico
    testFirebaseConnection();
    
    console.log('🎉 Firebase inicializado completamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error crítico inicializando Firebase:', error);
    console.error('Detalles del error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Mostrar error al usuario
    showNotificationSafe('Error crítico: No se pudo conectar con Firebase. Recarga la página.', 'error');
    return false;
  }
}

// Función de test de conexión
async function testFirebaseConnection() {
  try {
    console.log('🧪 Probando conexión básica...');
    
    // Test 1: Verificar que las instancias existen
    if (!auth) {
      throw new Error('Auth no está inicializado');
    }
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    console.log('✅ Instancias de Firebase verificadas');
    
    // Test 2: Probar escritura simple (solo si las reglas lo permiten)
    try {
      const testRef = db.collection('test_connection');
      const testDoc = await testRef.add({
        test: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent.substring(0, 100)
      });
      
      console.log('✅ Test de escritura exitoso:', testDoc.id);
      
      // Limpiar documento de test
      await testDoc.delete();
      console.log('✅ Documento de test eliminado');
      
    } catch (writeError) {
      console.warn('⚠️ Test de escritura falló (puede ser normal):', writeError.code);
      // No es crítico si falla, puede ser por reglas de seguridad
    }
    
  } catch (testError) {
    console.error('❌ Test de conexión falló:', testError);
    throw testError;
  }
}

// Función segura para mostrar notificaciones (por si el sistema aún no está listo)
function showNotificationSafe(message, type = 'info') {
  try {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
      alert(`${type.toUpperCase()}: ${message}`);
    }
  } catch (error) {
    console.error('Error mostrando notificación:', error);
    alert(message);
  }
}

// Función para verificar el estado de Firebase
function getFirebaseStatus() {
  return {
    sdkLoaded: typeof firebase !== 'undefined',
    appInitialized: !!firebaseApp,
    authReady: !!auth,
    firestoreReady: !!db,
    appsCount: firebase.apps ? firebase.apps.length : 0
  };
}

// Función global para debugging
window.debugFirebase = function() {
  console.log('🔍 ESTADO DE FIREBASE:');
  const status = getFirebaseStatus();
  console.table(status);
  
  if (status.firestoreReady) {
    console.log('Probando conexión...');
    testFirebaseConnection().catch(console.error);
  }
  
  return status;
};

// Inicialización diferida de Firebase
function initializeFirebaseWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeFirebaseSafely, 100);
    });
  } else {
    setTimeout(initializeFirebaseSafely, 100);
  }
}

// Ejecutar inicialización
initializeFirebaseWhenReady();

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
let solicitudesData = [];
let pacientesData = [];
let citasData = [];
let professionalsList = [];
let isLoading = false;

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
    
    // Animación de entrada
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto-remove después del tiempo especificado
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
    
    // Log para debugging
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
      
      // Focus en el primer input del modal
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
      // Verificar si hay cambios sin guardar en formularios
      if (modalId === 'patient-modal' && !isDraftSaved) {
        const hasChanges = checkFormChanges();
        if (hasChanges && !confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
          return;
        }
        resetForm();
      }
      
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      // Remover modales temporales
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
    
    // Limpiar el RUT
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    
    if (cleaned.length < 2) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Formatear con puntos
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
    
    // Validar que el cuerpo sean solo números
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
    
    // Teléfono fijo (8 dígitos)
    if (cleaned.length === 8 && !cleaned.startsWith('9')) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
    }
    
    // Celular sin código país (9 dígitos, empieza con 9)
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
    }
    
    // Con código país (11 dígitos, empieza con 56)
    if (cleaned.length === 11 && cleaned.startsWith('56')) {
      return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    
    // Número internacional completo (12 dígitos, empieza con 569)
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
    
    // Factores de riesgo por sustancia
    if (evaluationData.sustancias?.includes('pasta_base')) score += 4;
    if (evaluationData.sustancias?.includes('cocaina')) score += 3;
    if (evaluationData.sustancias?.includes('alcohol')) score += 1;
    if (evaluationData.sustancias?.includes('marihuana')) score += 1;
    
    // Factores de riesgo por edad
    if (evaluationData.edad < 18) score += 3;
    if (evaluationData.edad >= 65) score += 2;
    
    // Tiempo de consumo
    const tiempoConsumo = evaluationData.tiempoConsumo;
    if (tiempoConsumo === '60+') score += 3;
    if (tiempoConsumo === '24-60') score += 2;
    if (tiempoConsumo === '12-24') score += 1;
    
    // Urgencia reportada
    if (evaluationData.urgencia === 'critica') score += 5;
    if (evaluationData.urgencia === 'alta') score += 3;
    if (evaluationData.urgencia === 'media') score += 1;
    
    // Motivación (inversa - menor motivación = mayor riesgo)
    const motivacion = parseInt(evaluationData.motivacion) || 5;
    if (motivacion <= 3) score += 2;
    if (motivacion >= 8) score -= 1;
    
    // Tratamiento previo fallido
    if (evaluationData.tratamientoPrevio === 'si_senda') score += 2;
    if (evaluationData.tratamientoPrevio === 'si_otro') score += 1;
    
    // Palabras clave en descripción que indican crisis
    const descripcion = (evaluationData.descripcion || evaluationData.razon || '').toLowerCase();
    const palabrasCriticas = ['suicid', 'muerte', 'morir', 'matar', 'crisis', 'emergencia', 'urgente', 'desesper'];
    
    for (const palabra of palabrasCriticas) {
      if (descripcion.includes(palabra)) {
        score += 4;
        break;
      }
    }
    
    // Clasificación final
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

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Función para reintentos automáticos
async function retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      await new Promise(resolve => 
        setTimeout(resolve, APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
      );
    }
  }
}

// Función para cachear datos
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

// Validación de campos de formulario mejorada
function validateFormInputs() {
  try {
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    requiredInputs.forEach((input, index) => {
      // Asegurar tabindex
      if (!input.hasAttribute('tabindex')) {
        input.setAttribute('tabindex', index + 1);
      }
      
      // Asegurar visibilidad y capacidad de focus
      if (input.style.display === 'none' || input.hidden) {
        const parent = input.closest('.form-group');
        if (parent && parent.style.display !== 'none') {
          input.style.display = 'block';
          input.hidden = false;
        }
      }
      
      // Agregar aria-labels si no existen
      if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
        const label = input.closest('.form-group')?.querySelector('label');
        if (label) {
          const labelId = `label-${index}`;
          label.id = labelId;
          input.setAttribute('aria-labelledby', labelId);
        }
      }
    });
  } catch (error) {
    console.error('Error validating form inputs:', error);
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
    // Verificar dependencias críticas
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK no cargado');
    }
    
    // Esperar a que Firebase esté listo
    const checkFirebaseReady = () => {
      if (!auth || !db) {
        console.log('Esperando inicialización de Firebase...');
        setTimeout(checkFirebaseReady, 100);
        return;
      }
      
      console.log('Firebase listo, continuando inicialización...');
      continueAppInitialization();
    };
    
    checkFirebaseReady();
    
  } catch (error) {
    console.error('❌ Error inicializando app:', error);
    showNotification('Error al cargar el sistema: ' + error.message, 'error');
  }
}

function continueAppInitialization() {
  try {
    // Configurar título y elementos básicos
    document.title = "PROGRAMA SENDA PUENTE ALTO";
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) {
      mainTitle.textContent = "PROGRAMA SENDA PUENTE ALTO";
    }

    // Inicializar componentes en orden
    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    setupCalendar();
    setupFilters();
    validateFormInputs();
    
    // Configurar listener de autenticación
    auth.onAuthStateChanged(onAuthStateChanged);
    
    // Configurar manejo de errores globales
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.log('✅ SENDA Platform inicializado correctamente');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
    
  } catch (error) {
    console.error('❌ Error en inicialización:', error);
    showNotification('Error al inicializar componentes: ' + error.message, 'error');
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
  
  // Intentar reinicializar si es un error de Firebase
  if (event.reason && event.reason.code === 'app/no-app' || 
      (event.reason.message && event.reason.message.includes('NO_APP'))) {
    console.log('🔄 Intentando reinicializar Firebase...');
    setTimeout(() => {
      initializeFirebaseSafely();
    }, 1000);
  }
}

// Manejo global de errores de Firebase
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('Firebase') || 
       event.reason.message.includes('firestore') ||
       event.reason.code)) {
    
    console.error('❌ Error no manejado de Firebase:', event.reason);
    
    // Intentar reinicializar si es un error de app no encontrada
    if (event.reason.code === 'app/no-app' || 
        event.reason.message.includes('NO_APP')) {
      console.log('🔄 Intentando reinicializar Firebase...');
      setTimeout(() => {
        initializeFirebaseSafely();
      }, 1000);
    }
  }
});

console.log('🚀 Sistema de inicialización cargado');
console.log('📱 Versión: 1.0');
console.log('🏥 CESFAM: Configuración dinámica');
console.log('🔧 Debug mode:', APP_CONFIG.DEBUG_MODE ? 'Activado' : 'Desactivado');

// ================= FIN DE LA PARTE 1 =================
// ================= PARTE 2 COMPLETA: FORMULARIOS Y VALIDACIONES =================
// Versión corregida con flujo simplificado según tipo de solicitud

async function loadInitialData() {
  try {
    // Cargar datos básicos en paralelo
    const loadPromises = [];
    
    // Solo cargar si estamos en la tab activa correspondiente
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
    
    // Cargar lista de profesionales para referencias
    loadPromises.push(loadProfessionalsList());
    
    await Promise.allSettled(loadPromises);
    
  } catch (error) {
    console.error('Error cargando datos iniciales:', error);
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
    
    console.log('Mostrando contenido público');
  } catch (error) {
    console.error('Error mostrando contenido público:', error);
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
    
    // Actualizar información del profesional
    if (currentUserData) {
      updateProfessionalInfo();
    }
    
    console.log('Mostrando contenido profesional');
  } catch (error) {
    console.error('Error mostrando contenido profesional:', error);
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
    
    // Actualizar avatar con iniciales
    const avatar = document.querySelector('.professional-avatar');
    if (avatar) {
      const initials = `${currentUserData.nombre.charAt(0)}${currentUserData.apellidos.charAt(0)}`.toUpperCase();
      avatar.textContent = initials;
    }
    
  } catch (error) {
    console.error('Error updating professional info:', error);
  }
}

// ================= AUTENTICACIÓN =================

function setupModalControls() {
  try {
    // Configurar tabs de modales
    const modalTabs = document.querySelectorAll('.modal-tab');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        const modal = tab.closest('.modal');
        
        if (modal) {
          // Cambiar tab activo
          modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Cambiar form activo
          modal.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
          const targetForm = modal.querySelector(`#${targetTab}-form`);
          if (targetForm) {
            targetForm.classList.add('active');
            
            // Focus en primer input
            setTimeout(() => {
              const firstInput = targetForm.querySelector('input:not([type="hidden"])');
              if (firstInput) firstInput.focus();
            }, 100);
          }
        }
      });
    });

    // Configurar botones de cerrar
    const closeButtons = document.querySelectorAll('.modal-close, [data-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = btn.dataset.close || btn.closest('.modal-overlay').id;
        closeModal(modalId);
      });
    });

    // Configurar cierre con click fuera del modal
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    // Configurar formularios de autenticación
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    
    console.log('Controles de modal configurados');
  } catch (error) {
    console.error('Error configurando controles de modal:', error);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  try {
    const email = document.getElementById('login-email')?.value?.trim() || '';
    const password = document.getElementById('login-password')?.value || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validación básica
    if (!email || !password) {
      showNotification('Por favor completa todos los campos', 'warning');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification('Email inválido', 'warning');
      return;
    }

    toggleSubmitButton(submitBtn, true);
    
    // Intentar login con reintentos
    await retryOperation(async () => {
      await auth.signInWithEmailAndPassword(email, password);
    });
    
    closeModal('login-modal');
    showNotification('Sesión iniciada correctamente', 'success');
    
    // Limpiar formulario
    e.target.reset();
    
  } catch (error) {
    console.error('Error en login:', error);
    
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
    const existingUser = await db.collection('profesionales')
      .where('rut', '==', rutFormatted)
      .get();
    
    if (!existingUser.empty) {
      throw new Error('Ya existe un profesional registrado con este RUT');
    }
    
    // Crear usuario
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    // Guardar datos del profesional
    await db.collection('profesionales').doc(user.uid).set({
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
    });
    
    closeModal('login-modal');
    showNotification('Cuenta creada exitosamente. ¡Bienvenido al sistema SENDA!', 'success');
    
    // Limpiar formulario
    e.target.reset();
    
  } catch (error) {
    console.error('Error en registro:', error);
    
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
      default:
        if (error.message.includes('RUT')) {
          message = error.message;
        }
    }
    
    showNotification(message, 'error');
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
    console.error('Error al cerrar sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  } finally {
    showLoading(false);
  }
}

// ================= FORMULARIOS Y VALIDACIONES =================

function setupFormValidation() {
  try {
    // Configurar validación en tiempo real para RUTs
    const rutInputs = document.querySelectorAll('input[id*="rut"], input[placeholder*="RUT"]');
    rutInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const formatted = formatRUT(e.target.value);
        e.target.value = formatted;
        
        // Validación visual en tiempo real
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

    // Configurar validación para teléfonos
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Solo permitir números, espacios, + y -
        e.target.value = e.target.value.replace(/[^\d\s\+\-]/g, '');
      });
      
      input.addEventListener('blur', (e) => {
        if (e.target.value) {
          e.target.value = formatPhoneNumber(e.target.value);
          validatePhoneNumber(e.target);
        }
      });
    });

    // Configurar validación para emails
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

    // Configurar validación para campos de texto requeridos
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
      input.addEventListener('blur', validateRequiredField);
      input.addEventListener('input', clearFieldErrorOnInput);
    });

    console.log('Validación de formularios configurada');
  } catch (error) {
    console.error('Error configurando validación de formularios:', error);
  }
}

function validateRequiredField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  if (field.required && !value) {
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
  
  // Validar longitud según formato chileno
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

// Nueva función para validar teléfonos como string
function validatePhoneNumberString(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
}

// ================= FORMULARIO MULTI-STEP MEJORADO =================

function setupMultiStepForm() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // Configurar navegación entre pasos
    const nextButtons = form.querySelectorAll('[id^="next-step"]');
    const prevButtons = form.querySelectorAll('[id^="prev-step"]');
    
    nextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        
        // Lógica especial para el paso 1
        if (currentStep === 1) {
          const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
          
          if (tipoSolicitud === 'informacion') {
            // Para solo información, enviar directamente
            handlePatientFormSubmitSimplified();
            return;
          }
        }
        
        // Para otros pasos, validar y continuar
        if (validateStep(currentStep)) {
          goToStep(currentStep + 1);
        }
      });
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        
        // Lógica especial para navegación hacia atrás
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (currentStep === 3 && tipoSolicitud === 'anonimo') {
          // Si es anónimo y está en paso 3, regresar al paso 1
          goToStep(1);
        } else {
          goToStep(currentStep - 1);
        }
      });
    });

    // Configurar envío del formulario
    form.addEventListener('submit', handlePatientFormSubmit);

    // Configurar cambios en tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', updateFormVisibility);
    });

    // Configurar slider de motivación
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    if (motivacionRange && motivacionValue) {
      motivacionRange.addEventListener('input', () => {
        motivacionValue.textContent = motivacionRange.value;
        updateMotivacionColor(motivacionRange.value);
      });
      
      // Inicializar valor
      motivacionValue.textContent = motivacionRange.value;
      updateMotivacionColor(motivacionRange.value);
    }

    // Configurar formulario de reingreso
    const reentryForm = document.getElementById('reentry-form');
    if (reentryForm) {
      reentryForm.addEventListener('submit', handleReentrySubmit);
    }

    // Configurar autoguardado (draft)
    setupAutoSave();

    console.log('Formulario multi-step configurado con flujo simplificado');
  } catch (error) {
    console.error('Error configurando formulario multi-step:', error);
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
      autoSaveTimer = setTimeout(saveFormDraft, 2000); // Auto-save cada 2 segundos
    });
    
    // Cargar draft al abrir el formulario
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
    
    // Agregar datos adicionales
    draftData.currentStep = currentFormStep;
    draftData.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
    isDraftSaved = true;
    
    // Mostrar indicador visual de guardado
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
    
    // Verificar si el draft no es muy viejo (24 horas)
    if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('senda_form_draft');
      return;
    }
    
    // Preguntar si quiere restaurar
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
    
    // Restaurar valores de campos
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
    
    // Ir al paso guardado
    if (draftData.currentStep) {
      goToStep(draftData.currentStep);
    }
    
    // Actualizar visibilidad
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

// ================= VISIBILIDAD Y NAVEGACIÓN DEL FORMULARIO =================

function updateFormVisibility() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const anonymousPhone = document.getElementById('anonymous-phone-container');
    const infoEmail = document.getElementById('info-email-container');
    
    // Ocultar todos los campos condicionales
    if (anonymousPhone) anonymousPhone.style.display = 'none';
    if (infoEmail) infoEmail.style.display = 'none';
    
    // Actualizar botón "Siguiente" del paso 1
    const nextBtn = document.getElementById('next-step-1');
    
    if (tipoSolicitud === 'anonimo') {
      if (anonymousPhone) {
        anonymousPhone.style.display = 'block';
        const phoneInput = document.getElementById('anonymous-phone');
        if (phoneInput) {
          phoneInput.required = true;
          phoneInput.focus();
        }
      }
      if (nextBtn) nextBtn.textContent = 'Siguiente';
      
    } else if (tipoSolicitud === 'informacion') {
      if (infoEmail) {
        infoEmail.style.display = 'block';
        const emailInput = document.getElementById('info-email');
        if (emailInput) {
          emailInput.required = true;
          emailInput.focus();
        }
      }
      // Cambiar botón a "Enviar" para solo información
      if (nextBtn) {
        nextBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
        nextBtn.style.background = 'var(--success-green)';
      }
      
    } else if (tipoSolicitud === 'identificado') {
      if (nextBtn) nextBtn.textContent = 'Siguiente';
    }
    
    // Limpiar requisitos de campos no visibles
    if (tipoSolicitud !== 'anonimo') {
      const phoneInput = document.getElementById('anonymous-phone');
      if (phoneInput) phoneInput.required = false;
    }
    if (tipoSolicitud !== 'informacion') {
      const emailInput = document.getElementById('info-email');
      if (emailInput) emailInput.required = false;
    }
    
    // Guardar draft después de cambios
    setTimeout(saveFormDraft, 500);
    
  } catch (error) {
    console.error('Error updating form visibility:', error);
  }
}

// Función goToStep con flujo simplificado
function goToStep(step) {
  try {
    if (step < 1 || step > maxFormStep) return;

    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    // LÓGICA DE SALTOS SEGÚN TIPO DE SOLICITUD
    if (tipoSolicitud === 'informacion') {
      // SOLO INFORMACIÓN: Solo paso 1, saltar directamente al envío
      if (step > 1) {
        // Si intenta ir más allá del paso 1, enviar directamente
        handlePatientFormSubmitSimplified();
        return;
      }
    } else if (tipoSolicitud === 'anonimo') {
      // ANÓNIMO: Pasos 1, 3, 4 (saltar paso 2)
      if (step === 2) {
        goToStep(3); // Saltar el paso 2
        return;
      }
    }
    // IDENTIFICADO: Todos los pasos 1, 2, 3, 4

    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.classList.remove('active');
    });
    
    // Mostrar paso objetivo
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
      
      // Focus en primer campo del paso
      setTimeout(() => {
        const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) {
          firstInput.focus();
        }
      }, 100);
    }

    // Actualizar barra de progreso según el tipo de solicitud
    updateProgressBar(step, tipoSolicitud);

    currentFormStep = step;

    // Guardar progreso en draft
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`Navegando a paso ${step} para tipo: ${tipoSolicitud}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
  }
}

// Nueva función para actualizar la barra de progreso según el tipo
function updateProgressBar(step, tipoSolicitud) {
  const progressFill = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  if (!progressFill || !progressText) return;
  
  let totalSteps, progressPercentage, stepText;
  
  if (tipoSolicitud === 'informacion') {
    // Solo información: 1 paso
    totalSteps = 1;
    progressPercentage = 100;
    stepText = 'Completado';
  } else if (tipoSolicitud === 'anonimo') {
    // Anónimo: 3 pasos (1, 3, 4)
    const stepMapping = { 1: 1, 3: 2, 4: 3 };
    totalSteps = 3;
    const currentMappedStep = stepMapping[step] || step;
    progressPercentage = (currentMappedStep / totalSteps) * 100;
    stepText = `Paso ${currentMappedStep} de ${totalSteps}`;
  } else {
    // Identificado: 4 pasos completos
    totalSteps = 4;
    progressPercentage = (step / totalSteps) * 100;
    stepText = `Paso ${step} de ${totalSteps}`;
  }
  
  progressFill.style.width = `${progressPercentage}%`;
  progressText.textContent = stepText;
}

// ================= VALIDACIÓN DE PASOS =================

function validateStep(step) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (step === 1) {
      // Validar tipo de solicitud
      if (!tipoSolicitud) {
        showNotification('Selecciona un tipo de solicitud', 'warning');
        return false;
      }
      
      // Validar campos según tipo
      if (tipoSolicitud === 'anonimo') {
        const phone = document.getElementById('anonymous-phone')?.value?.trim();
        if (!phone) {
          showNotification('Ingresa un teléfono de contacto', 'warning');
          return false;
        }
        if (!validatePhoneNumberString(phone)) {
          showNotification('Ingresa un teléfono válido', 'warning');
          return false;
        }
      } else if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email')?.value?.trim();
        if (!email) {
          showNotification('Ingresa un email para recibir información', 'warning');
          return false;
        }
        if (!isValidEmail(email)) {
          showNotification('Ingresa un email válido', 'warning');
          return false;
        }
      }
      
      // Validar campos básicos (solo si no es solo información)
      if (tipoSolicitud !== 'informacion') {
        const edad = document.getElementById('patient-age')?.value;
        const cesfam = document.getElementById('patient-cesfam')?.value;
        const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
        
        if (!edad || !cesfam || !paraMi) {
          showNotification('Completa todos los campos obligatorios', 'warning');
          return false;
        }
        
        if (parseInt(edad) < 12 || parseInt(edad) > 120) {
          showNotification('La edad debe estar entre 12 y 120 años', 'warning');
          return false;
        }
      }
      
      return true;
    }
    
    if (step === 2) {
      // Solo validar si es identificado
      if (tipoSolicitud === 'identificado') {
        const nombre = document.getElementById('patient-name')?.value?.trim();
        const apellidos = document.getElementById('patient-lastname')?.value?.trim();
        const rut = document.getElementById('patient-rut')?.value?.trim();
        const telefono = document.getElementById('patient-phone')?.value?.trim();
        
        if (!nombre || !apellidos || !rut || !telefono) {
          showNotification('Completa todos los datos personales', 'warning');
          return false;
        }
        
        if (!validateRUT(rut)) {
          showNotification('RUT inválido', 'warning');
          return false;
        }
        
        if (!validatePhoneNumberString(telefono)) {
          showNotification('Teléfono inválido', 'warning');
          return false;
        }
      }
      return true;
    }
    
    if (step === 3) {
      // Solo validar si no es solo información
      if (tipoSolicitud !== 'informacion') {
        const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
        if (sustancias.length === 0) {
          showNotification('Selecciona al menos una sustancia', 'warning');
          return false;
        }
        
        const urgencia = document.querySelector('input[name="urgencia"]:checked');
        if (!urgencia) {
          showNotification('Selecciona el nivel de urgencia', 'warning');
          return false;
        }
        
        const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
        if (!tratamientoPrevio) {
          showNotification('Indica si has recibido tratamiento previo', 'warning');
          return false;
        }
      }
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating step:', error);
    return false;
  }
}

function getFieldLabel(field) {
  try {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  } catch (error) {
    return 'Campo';
  }
}

// ================= MANEJO DE ENVÍO DE FORMULARIOS =================

// Función simplificada para envío directo (solo información)
async function handlePatientFormSubmitSimplified() {
  console.log('Enviando solicitud de solo información...');
  
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    const email = document.getElementById('info-email')?.value?.trim();
    
    if (!email) {
      showNotification('Ingresa un email para recibir información', 'warning');
      return;
    }
    
    if (!isValidEmail(email)) {
      showNotification('Ingresa un email válido', 'warning');
      return;
    }
    
    try {
      const solicitudData = {
        tipoSolicitud: 'informacion',
        email: email,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        origen: 'web_publica',
        prioridad: 'baja',
        identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
      console.log('Solicitud de información enviada:', docRef.id);
      
      closeModal('patient-modal');
      resetForm();
      showNotification('Solicitud de información enviada. Te contactaremos por email.', 'success', 5000);
      
    } catch (error) {
      console.error('Error enviando solicitud de información:', error);
      showNotification('Error al enviar solicitud: ' + error.message, 'error');
    }
  }
}

// Función principal de envío del formulario
async function handlePatientFormSubmit(e) {
  e.preventDefault();
  console.log('Iniciando envío de solicitud...');
  
  const submitBtn = document.getElementById('submit-form');
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  // Si es solo información, usar la función simplificada
  if (tipoSolicitud === 'informacion') {
    return handlePatientFormSubmitSimplified();
  }
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    // Validar según el tipo
    if (!validateFinalForm(tipoSolicitud)) {
      return;
    }
    
    // Recopilar datos
    const solicitudData = collectFormDataByType(tipoSolicitud);
    console.log('Datos recopilados:', solicitudData);
    
    // Calcular prioridad
    solicitudData.prioridad = calculatePriority(solicitudData);
    console.log('Prioridad calculada:', solicitudData.prioridad);
    
    // Verificar conexión a Firebase
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    // Guardar en Firebase
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_ingreso').add(solicitudData);
    });
    
    console.log('Solicitud guardada con ID:', docRef.id);
    
    // Crear alerta crítica si es necesario
    if (solicitudData.prioridad === 'critica') {
      try {
        await createCriticalAlert(solicitudData, docRef.id);
        console.log('Alerta crítica creada');
      } catch (alertError) {
        console.warn('Error creando alerta crítica:', alertError);
      }
    }
    
    // Limpiar y cerrar
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    // Mensaje de éxito
    const successMessage = tipoSolicitud === 'anonimo' 
      ? 'Solicitud anónima enviada. Te contactaremos al número proporcionado.'
      : 'Solicitud enviada correctamente. Te contactaremos pronto.';
    
    showNotification(successMessage, 'success', 6000);
    console.log('Proceso completado exitosamente');
    
  } catch (error) {
    console.error('Error enviando solicitud:', error);
    
    let errorMessage = 'Error al enviar la solicitud: ';
    if (error.code === 'permission-denied') {
      errorMessage += 'Sin permisos para crear solicitudes.';
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

// Función para validar el formulario final
function validateFinalForm(tipoSolicitud) {
  if (tipoSolicitud === 'anonimo') {
    const phone = document.getElementById('anonymous-phone')?.value?.trim();
    const edad = document.getElementById('patient-age')?.value;
    const cesfam = document.getElementById('patient-cesfam')?.value;
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    
    if (!phone || !edad || !cesfam || sustancias.length === 0) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return false;
    }
  } else if (tipoSolicitud === 'identificado') {
    // Validar todos los campos
    const requiredFields = [
      'patient-name', 'patient-lastname', 'patient-rut', 'patient-phone',
      'patient-age', 'patient-cesfam'
    ];
    
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field?.value?.trim()) {
        showNotification('Completa todos los campos obligatorios', 'warning');
        return false;
      }
    }
    
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Selecciona al menos una sustancia', 'warning');
      return false;
    }
  }
  
  return true;
}

// Función para recopilar datos según el tipo
function collectFormDataByType(tipoSolicitud) {
  const baseData = {
    tipoSolicitud,
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
    estado: 'pendiente',
    origen: 'web_publica',
    version: '1.0'
  };
  
  if (tipoSolicitud === 'anonimo') {
    return {
      ...baseData,
      telefono: formatPhoneNumber(document.getElementById('anonymous-phone').value),
      edad: parseInt(document.getElementById('patient-age').value),
      cesfam: document.getElementById('patient-cesfam').value,
      paraMi: document.querySelector('input[name="paraMi"]:checked')?.value,
      sustancias: Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value),
      tiempoConsumo: document.getElementById('tiempo-consumo')?.value,
      urgencia: document.querySelector('input[name="urgencia"]:checked')?.value,
      tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value,
      descripcion: document.getElementById('patient-description')?.value?.trim(),
      motivacion: parseInt(document.getElementById('motivacion-range')?.value),
      identificador: `ANONIMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } else if (tipoSolicitud === 'identificado') {
    return {
      ...baseData,
      nombre: document.getElementById('patient-name').value.trim(),
      apellidos: document.getElementById('patient-lastname').value.trim(),
      rut: formatRUT(document.getElementById('patient-rut').value),
      telefono: formatPhoneNumber(document.getElementById('patient-phone').value),
      email: document.getElementById('patient-email')?.value?.trim(),
      direccion: document.getElementById('patient-address')?.value?.trim(),
      edad: parseInt(document.getElementById('patient-age').value),
      cesfam: document.getElementById('patient-cesfam').value,
      paraMi: document.querySelector('input[name="paraMi"]:checked')?.value,
      sustancias: Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value),
      tiempoConsumo: document.getElementById('tiempo-consumo')?.value,
      urgencia: document.querySelector('input[name="urgencia"]:checked')?.value,
      tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value,
      descripcion: document.getElementById('patient-description')?.value?.trim(),
      motivacion: parseInt(document.getElementById('motivacion-range')?.value)
    };
  }
  
  return baseData;
}

// ================= FORMULARIO DE REINGRESO =================

async function handleReentrySubmit(e) {
  e.preventDefault();
  console.log('Iniciando envío de reingreso...');
  
  const formData = {
    nombre: document.getElementById('reentry-name')?.value?.trim() || '',
    rut: document.getElementById('reentry-rut')?.value?.trim() || '',
    cesfam: document.getElementById('reentry-cesfam')?.value || '',
    motivo: document.getElementById('reentry-reason')?.value?.trim() || '',
    telefono: document.getElementById('reentry-phone')?.value?.trim() || ''
  };
  
  console.log('Datos del reingreso:', formData);
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Validaciones mejoradas
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

  // Validación básica de teléfono
  const phoneClean = formData.telefono.replace(/\D/g, '');
  if (phoneClean.length < 8) {
    showNotification('Teléfono inválido', 'warning');
    return;
  }

  try {
    toggleSubmitButton(submitBtn, true);
    
    // Verificar conexión a Firebase
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    console.log('Verificando reingresos existentes...');
    
    // Verificar si ya existe una solicitud de reingreso pendiente (más flexible)
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
      console.warn('Error verificando reingresos existentes:', queryError);
      // Continuar de todas formas si es solo un problema de consulta
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
      version: '1.0'
    };

    console.log('Guardando reingreso en Firestore...');
    const docRef = await db.collection('reingresos').add(reingresoData);
    console.log('Reingreso guardado con ID:', docRef.id);
    
    closeModal('reentry-modal');
    e.target.reset();
    showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 5000);
    console.log('Reingreso completado exitosamente');
    
  } catch (error) {
    console.error('Error enviando reingreso:', error);
    
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

// ================= GESTIÓN DE ALERTAS CRÍTICAS =================

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
      console.log('Alerta crítica creada para solicitud:', solicitudId);
    }
  } catch (error) {
    console.error('Error creando alerta crítica:', error);
    // No fallar la solicitud principal por esto
  }
}

function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      goToStep(1);
      
      // Ocultar campos condicionales
      const anonymousPhone = document.getElementById('anonymous-phone-container');
      const infoEmail = document.getElementById('info-email-container');
      
      if (anonymousPhone) anonymousPhone.style.display = 'none';
      if (infoEmail) infoEmail.style.display = 'none';
      
      // Resetear slider de motivación
      const motivacionRange = document.getElementById('motivacion-range');
      const motivacionValue = document.getElementById('motivacion-value');
      if (motivacionRange && motivacionValue) {
        motivacionRange.value = 5;
        motivacionValue.textContent = '5';
        updateMotivacionColor(5);
      }
      
      // Limpiar errores visuales
      form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
      });
      
      form.querySelectorAll('.field-error').forEach(error => {
        error.remove();
      });
      
      // Resetear botón del paso 1
      const nextBtn = document.getElementById('next-step-1');
      if (nextBtn) {
        nextBtn.textContent = 'Siguiente';
        nextBtn.style.background = '';
      }
    }
    
    isDraftSaved = false;
    localStorage.removeItem('senda_form_draft');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Formulario reseteado');
    }
  } catch (error) {
    console.error('Error reseteando formulario:', error);
  }
}
// ================= PARTE 3 FINAL: GESTIÓN DE DATOS Y FUNCIONES AUXILIARES =================
// Continuación desde la PARTE 2

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
    
    // Verificar cache primero
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      solicitudesData = cachedData;
      renderSolicitudes(cachedData);
      
      // Cargar datos frescos en background
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
    
    // Cargar solicitudes de ingreso
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
    
    // Cargar reingresos
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
    
    // Ejecutar cargas en paralelo
    await Promise.allSettled(loadPromises);
    
    // Ordenar por fecha
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    solicitudesData = solicitudes;
    
    // Guardar en cache
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
    
    // Configurar event listeners para las tarjetas
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
            <span class="priority-badge ${prioridad}" style="background-color: ${prioridadColor[prioridad]};">
              ${prioridad.toUpperCase()}
            </span>
            ${solicitud.tipo === 'reingreso' ? '<span class="request-type reingreso">REINGRESO</span>' : ''}
          </div>
        </div>
        
        <div class="request-body">
          ${sustanciasHtml ? `<div class="request-substances">${sustanciasHtml}</div>` : ''}
          ${solicitud.descripcion || solicitud.motivo ? 
            `<p class="request-description">${truncateText(solicitud.descripcion || solicitud.motivo, 150)}</p>` : ''}
          
          <div class="request-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 13px;">
            <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div>
              <strong>Estado:</strong> 
              <span class="status-${estado}" style="display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas ${estadoIcon[estado] || 'fa-circle'}"></i>
                ${estado.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
          </div>
        </div>
        
        <div class="request-actions">
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

// ================= FILTROS Y BÚSQUEDAS =================

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
    const dateFilter = document.getElementById('date-filter')?.value || '';
    
    const cards = document.querySelectorAll('.request-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      const cardText = card.textContent.toLowerCase();
      const cardPriority = card.querySelector('.priority-badge')?.textContent.toLowerCase() || '';
      const cardDate = card.querySelector('.request-description')?.parentElement.textContent || '';
      
      let show = true;
      
      // Filtro de búsqueda de texto
      if (searchTerm && !cardText.includes(searchTerm)) {
        show = false;
      }
      
      // Filtro de prioridad
      if (priorityFilter && !cardPriority.includes(priorityFilter)) {
        show = false;
      }
      
      // Filtro de fecha
      if (dateFilter) {
        const filterDate = new Date(dateFilter).toLocaleDateString('es-CL');
        if (!cardDate.includes(filterDate)) {
          show = false;
        }
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
    
    // Mostrar contador de resultados
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

function filterSeguimiento() {
  try {
    const searchTerm = document.getElementById('search-seguimiento')?.value.toLowerCase() || '';
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
      const itemText = item.textContent.toLowerCase();
      item.style.display = itemText.includes(searchTerm) ? 'flex' : 'none';
    });
  } catch (error) {
    console.error('❌ Error filtering seguimiento:', error);
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
        
        // Cambiar tab activo
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Cambiar pane activo
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          
          // Cargar datos específicos de cada tab
          loadTabData(targetTab);
        }
      });
    });
    
    // Cargar datos del tab inicial
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

// ================= GESTIÓN DE CALENDARIO Y CITAS =================

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
    
    // Headers de días
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Calcular fechas
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(startDate);
    
    // Generar días del calendario
    for (let i = 0; i < 42; i++) { // 6 semanas
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
  
  // Aplicar clases
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
  
  // Event listener para días válidos
  if (!isPast && isCurrentMonth) {
    dayElement.addEventListener('click', () => selectCalendarDay(new Date(date)));
    dayElement.style.cursor = 'pointer';
  }
  
  return dayElement;
}

function selectCalendarDay(date) {
  try {
    // Remover selección anterior
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Seleccionar día actual
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
    
    // Limpiar appointments anteriores
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
    
    // Renderizar appointments en el calendario
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
        
        // Mostrar indicador si hay más citas
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
          <button class="btn btn-primary btn-sm mt-2" onclick="createQuickAppointment('${date.toISOString()}')">
            <i class="fas fa-plus"></i>
            Agregar Cita
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
        <button class="btn btn-sm btn-success" onclick="markAppointmentComplete('${appointment.id}')" title="Marcar como completada">
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
        <div class="timeline-item">
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
    if (!grid) return;
    
    if (appointmentsSnapshot.empty) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-week"></i>
          <h3>No hay próximas citas</h3>
          <p>No hay citas programadas para los próximos días</p>
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
      const fechaStr = fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="appointment-card">
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

// ================= GESTIÓN DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    const cacheKey = `pacientes_${currentUserData.cesfam}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      pacientesData = cachedData;
      renderPacientes(cachedData);
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
    renderPacientes(pacientes);
    
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

function renderPacientes(pacientes) {
  try {
    const grid = document.getElementById('patients-grid');
    if (!grid) return;

    if (pacientes.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-users"></i>
          <h3>No hay pacientes registrados</h3>
          <p>No se encontraron pacientes en este CESFAM</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = pacientes.map(paciente => createPacienteCard(paciente)).join('');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Renderizados ${pacientes.length} pacientes`);
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
          <div class="detail-row">
            <span><strong>Edad:</strong> ${edad} años</span>
            <span><strong>Teléfono:</strong> ${paciente.telefono}</span>
          </div>
          <div class="detail-row">
            <span><strong>Registrado:</strong> ${fecha}</span>
            <span><strong>CESFAM:</strong> ${paciente.cesfam}</span>
          </div>
          ${paciente.email ? `<div class="detail-row"><span><strong>Email:</strong> ${paciente.email}</span></div>` : ''}
        </div>
        
        <div class="patient-actions">
          <button class="btn btn-primary btn-sm" onclick="verFichaPaciente('${paciente.id}')">
            <i class="fas fa-file-medical"></i>
            Ver Ficha
          </button>
          <button class="btn btn-success btn-sm" onclick="agendarPaciente('${paciente.id}')">
            <i class="fas fa-calendar-plus"></i>
            Agendar
          </button>
          <button class="btn btn-outline btn-sm" onclick="editarPaciente('${paciente.id}')">
            <i class="fas fa-edit"></i>
            Editar
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error creating patient card:', error);
    return '<div class="patient-card error-card">Error al cargar paciente</div>';
  }
}

async function buscarPacientePorRUT() {
  const rutInput = document.getElementById('search-pacientes-rut');
  const resultsContainer = document.getElementById('pacientes-search-results');
  
  if (!rutInput || !resultsContainer) return;
  
  const rut = rutInput.value.trim();
  
  if (!rut) {
    showNotification('Ingresa un RUT para buscar', 'warning');
    return;
  }

  if (!validateRUT(rut)) {
    showNotification('RUT inválido', 'warning');
    return;
  }

  try {
    showLoading(true, 'Buscando paciente...');
    
    const formattedRUT = formatRUT(rut);
    
    const pacienteSnapshot = await db.collection('pacientes')
      .where('rut', '==', formattedRUT)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (pacienteSnapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <h3>Paciente no encontrado</h3>
          <p>No se encontró ningún paciente con RUT ${formattedRUT} en tu CESFAM</p>
        </div>
      `;
      return;
    }

    const paciente = pacienteSnapshot.docs[0].data();
    paciente.id = pacienteSnapshot.docs[0].id;
    
    resultsContainer.innerHTML = createPacienteFoundCard(paciente);
    
  } catch (error) {
    console.error('❌ Error searching patient:', error);
    showNotification('Error al buscar paciente: ' + error.message, 'error');
    
    resultsContainer.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error en la búsqueda</h3>
        <p>${error.message}</p>
        <button class="btn btn-outline" onclick="buscarPacientePorRUT()">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

function createPacienteFoundCard(paciente) {
  try {
    const fecha = formatDate(paciente.fechaCreacion);
    
    return `
      <div class="patient-found">
        <div class="patient-found-header">
          <h3><i class="fas fa-check-circle"></i> Paciente Encontrado</h3>
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
            <span class="detail-value">
              <a href="tel:${paciente.telefono}" style="color: var(--primary-blue);">
                <i class="fas fa-phone"></i> ${paciente.telefono}
              </a>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">
              ${paciente.email ? 
                `<a href="mailto:${paciente.email}" style="color: var(--primary-blue);">
                  <i class="fas fa-envelope"></i> ${paciente.email}
                </a>` : 
                'No registrado'
              }
            </span>
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
            <span class="detail-value patient-status ${paciente.estado || 'activo'}">
              <i class="fas fa-${(paciente.estado || 'activo') === 'activo' ? 'check-circle' : 'times-circle'}"></i>
              ${(paciente.estado || 'activo').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error creating patient found card:', error);
    return '<div class="patient-found">Error al mostrar información del paciente</div>';
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
            <div class="about-section">
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
            
            <div class="about-section">
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
            
            <div class="about-section">
              <h3><i class="fas fa-phone"></i> Contacto Nacional</h3>
              <div class="contact-info">
                <p><strong>Teléfono:</strong> <a href="tel:1412" style="color: var(--primary-blue);">1412 (gratuito)</a></p>
                <p><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank" style="color: var(--primary-blue);">www.senda.gob.cl</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@senda.gob.cl" style="color: var(--primary-blue);">info@senda.gob.cl</a></p>
              </div>
            </div>
            
            <div class="emergency-section" style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h4><i class="fas fa-exclamation-triangle"></i> ¿Necesitas ayuda inmediata?</h4>
              <div style="display: flex; gap: 16px; margin-top: 8px;">
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
    // 1. Verificar Firebase App
    console.log('Firebase apps:', firebase.apps.length);
    if (firebase.apps.length > 0) {
      console.log('Firebase inicializado correctamente');
    } else {
      console.error('Firebase NO inicializado');
      return false;
    }
    
    // 2. Verificar Auth
    const currentUser = firebase.auth().currentUser;
    console.log('Usuario autenticado:', currentUser ? 'SÍ' : 'NO');
    
    // 3. Verificar Firestore
    console.log('Firestore disponible:', !!db);
    
    // 4. Probar escritura simple
    testFirestoreWrite();
    
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
    
    // Intentar escribir en una colección de prueba
    const docRef = await db.collection('test_connection').add(testData);
    console.log('✅ Escritura exitosa, ID:', docRef.id);
    
    // Limpiar el documento de prueba
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

// Función para debugging manual (usar en consola del navegador)
window.debugSenda = function() {
  console.clear();
  console.log('🔍 INICIANDO DEBUGGING COMPLETO...');
  
  debugFirebaseConnection();
  
  // Verificar configuración
  console.log('=== CONFIGURACIÓN ===');
  console.log('APP_CONFIG:', APP_CONFIG);
  console.log('currentUser:', currentUser);
  console.log('currentUserData:', currentUserData);
  
  console.log('=== DEBUGGING COMPLETADO ===');
};

// Función para simular envío de formulario (para testing)
window.testFormSubmission = async function() {
  console.log('🧪 PROBANDO ENVÍO DE FORMULARIO...');
  
  try {
    const testSolicitud = {
      tipoSolicitud: 'anonimo',
      edad: 25,
      cesfam: 'CESFAM Alejandro del Río',
      paraMi: 'mi_mismo',
      telefono: '+56912345678',
      sustancias: ['alcohol'],
      urgencia: 'media',
      tratamientoPrevio: 'no',
      motivacion: 7,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      origen: 'test',
      identificador: `TEST_${Date.now()}`
    };
    
    console.log('Datos de prueba:', testSolicitud);
    
    const docRef = await db.collection('solicitudes_ingreso').add(testSolicitud);
    console.log('✅ Solicitud de prueba creada:', docRef.id);
    
    // Limpiar
    await docRef.delete();
    console.log('✅ Solicitud de prueba eliminada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
};

// ================= FUNCIONES PLACEHOLDER =================

function showSolicitudDetail(solicitud) { showNotification('Función en desarrollo', 'info'); }
function showSolicitudDetailById(solicitudId) { showNotification('Función en desarrollo', 'info'); }
function showAgendaModal(solicitudId) { showNotification('Función en desarrollo', 'info'); }
function handleUrgentCase(solicitudId) { showNotification('Función en desarrollo', 'info'); }
function verFichaPaciente(pacienteId) { showNotification('Función en desarrollo', 'info'); }
function agendarPaciente(pacienteId) { showNotification('Función en desarrollo', 'info'); }
function editarPaciente(pacienteId) { showNotification('Función en desarrollo', 'info'); }
function createNuevaCitaModal() { showNotification('Función en desarrollo', 'info'); }
function createQuickAppointment(dateIso) { showNotification('Función en desarrollo', 'info'); }
function editAppointment(appointmentId) { showNotification('Función en desarrollo', 'info'); }
function markAppointmentComplete(appointmentId) { showNotification('Función en desarrollo', 'info'); }

// ================= FUNCIONES GLOBALES Y EXPORTS =================

// Funciones que deben ser accesibles globalmente
window.showSolicitudDetail = showSolicitudDetail;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showAgendaModal = showAgendaModal;
window.handleUrgentCase = handleUrgentCase;
window.verFichaPaciente = verFichaPaciente;
window.agendarPaciente = agendarPaciente;
window.editarPaciente = editarPaciente;
window.createNuevaCitaModal = createNuevaCitaModal;
window.createQuickAppointment = createQuickAppointment;
window.editAppointment = editAppointment;
window.markAppointmentComplete = markAppointmentComplete;
window.showAboutProgram = showAboutProgram;
window.filterSolicitudes = filterSolicitudes;
window.filterSeguimiento = filterSeguimiento;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.loadSolicitudes = loadSolicitudes;
window.loadPacientes = loadPacientes;
window.loadSeguimiento = loadSeguimiento;
window.loadTodayAppointments = loadTodayAppointments;
window.debugFirebaseConnection = debugFirebaseConnection;
window.validateFormInputs = validateFormInputs;

// ================= INICIALIZACIÓN FINAL =================

// Auto-ejecutar verificación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Auto-verificando Firebase...');
      debugFirebaseConnection();
    }
  }, 2000);
});

// Agregar event listener para cargar la aplicación
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
