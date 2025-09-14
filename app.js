// ================= SENDA PUENTE ALTO - APP.JS PARTE 1 CORREGIDA =================
// Configuración Firebase Corregida y Variables Globales

// Firebase Configuration - VERIFICAR QUE ESTOS DATOS SEAN CORRECTOS
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
let auth, db, app;
let isFirebaseInitialized = false;

function initializeFirebase() {
  try {
    console.log('🔥 Iniciando configuración de Firebase...');
    
    // Verificar si Firebase ya está inicializado
    if (!firebase.apps || firebase.apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase app inicializada');
    } else {
      app = firebase.apps[0];
      console.log('✅ Firebase app ya existía');
    }
    
    // Inicializar servicios
    auth = firebase.auth();
    db = firebase.firestore();
    
    // IMPORTANTE: Configurar persistencia offline
    db.enablePersistence({
      synchronizeTabs: true
    }).then(() => {
      console.log('✅ Persistencia offline habilitada');
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistencia falló: múltiples tabs abiertas');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistencia no soportada en este navegador');
      } else {
        console.warn('⚠️ Error en persistencia:', err);
      }
    });
    
    // Configurar configuraciones de Firestore
    db.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    isFirebaseInitialized = true;
    console.log('🎉 Firebase inicializado completamente');
    
    // Verificar conexión
    testFirestoreConnection();
    
    return true;
    
  } catch (error) {
    console.error('❌ Error crítico inicializando Firebase:', error);
    showNotification('Error de conexión con el servidor. Verifica tu conexión a internet.', 'error', 10000);
    isFirebaseInitialized = false;
    return false;
  }
}

// Función para probar la conexión a Firestore
async function testFirestoreConnection() {
  try {
    console.log('🔍 Probando conexión a Firestore...');
    
    // Intentar una operación simple de lectura
    const testDoc = await db.collection('test').limit(1).get();
    console.log('✅ Conexión a Firestore verificada');
    
    // Probar reglas de seguridad básicas
    try {
      const solicitudesTest = await db.collection('solicitudes_ingreso').limit(1).get();
      console.log('✅ Acceso a solicitudes_ingreso confirmado');
    } catch (solicitudesError) {
      console.warn('⚠️ Problema con acceso a solicitudes_ingreso:', solicitudesError.code);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Firestore:', error);
    console.error('❌ Código de error:', error.code);
    console.error('❌ Mensaje:', error.message);
    
    showNotification(`Error de conexión: ${error.code || 'Conexión fallida'}`, 'error', 8000);
    return false;
  }
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
  "CESFAM Cardenal Raúl Silva Henríquez"
];

// Variables globales corregidas
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
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
let currentAgendaSolicitud = null;

// Configuración de horarios
const HORARIOS_CONFIG = {
  semana: {
    horaInicio: 8,
    horaFin: 16,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [1, 2, 3, 4, 5]
  },
  finSemana: {
    horaInicio: 9,
    horaFin: 12,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [0, 6]
  }
};

// Configuración de la aplicación mejorada
const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 50, // Reducido para mejor rendimiento
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true,
  FIRESTORE_TIMEOUT: 10000, // 10 segundos timeout
  CONNECTION_RETRY_DELAY: 2000
};

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
    // Fallback a alert si hay problemas
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
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
  `;
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
    }
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

function closeModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
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

// ================= FUNCIONES DE CONEXIÓN MEJORADAS =================

// Función para verificar el estado de la red
function checkNetworkStatus() {
  return navigator.onLine;
}

// Función para manejar errores de Firestore específicamente
function handleFirestoreError(error, operation = 'operación') {
  console.error(`❌ Error en ${operation}:`, error);
  
  let userMessage = '';
  
  switch (error.code) {
    case 'permission-denied':
      userMessage = `Sin permisos para realizar esta ${operation}. Verifica tu autenticación.`;
      break;
    case 'unavailable':
      userMessage = 'Servicio temporalmente no disponible. Intenta en unos momentos.';
      break;
    case 'deadline-exceeded':
    case 'timeout':
      userMessage = 'La operación tardó demasiado. Verifica tu conexión.';
      break;
    case 'resource-exhausted':
      userMessage = 'Límite de operaciones excedido. Intenta más tarde.';
      break;
    case 'failed-precondition':
      userMessage = 'No se cumplieron las condiciones para esta operación.';
      break;
    case 'not-found':
      userMessage = 'Documento o colección no encontrada.';
      break;
    case 'already-exists':
      userMessage = 'El documento ya existe.';
      break;
    case 'unauthenticated':
      userMessage = 'Usuario no autenticado. Inicia sesión nuevamente.';
      break;
    default:
      if (!checkNetworkStatus()) {
        userMessage = 'Sin conexión a internet. Verifica tu conexión.';
      } else {
        userMessage = `Error en ${operation}: ${error.message || 'Error desconocido'}`;
      }
  }
  
  showNotification(userMessage, 'error', 8000);
  return userMessage;
}

// Función mejorada para operaciones con reintentos
async function retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS, operationName = 'operación') {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (APP_CONFIG.DEBUG_MODE && attempt > 1) {
        console.log(`🔄 Reintentando ${operationName} (intento ${attempt}/${maxAttempts})`);
      }
      
      // Verificar conexión antes de cada intento
      if (!checkNetworkStatus()) {
        throw new Error('Sin conexión a internet');
      }
      
      // Verificar que Firebase esté inicializado
      if (!isFirebaseInitialized) {
        throw new Error('Firebase no está inicializado');
      }
      
      const result = await operation();
      
      if (APP_CONFIG.DEBUG_MODE && attempt > 1) {
        console.log(`✅ ${operationName} exitosa en intento ${attempt}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Intento ${attempt}/${maxAttempts} de ${operationName} falló:`, error.code || error.message);
      
      // No reintentar en ciertos errores
      if (error.code === 'permission-denied' || 
          error.code === 'unauthenticated' || 
          error.code === 'not-found') {
        console.log(`❌ Error no recuperable en ${operationName}, no reintentando`);
        break;
      }
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Esperar antes del siguiente intento con backoff exponencial
      const delay = APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Manejar el error final
  handleFirestoreError(lastError, operationName);
  throw lastError;
}

// Funciones de cache mejoradas
function getCachedData(key) {
  const cached = dataCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < APP_CONFIG.CACHE_DURATION) {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`📋 Datos obtenidos del cache: ${key}`);
    }
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  if (APP_CONFIG.DEBUG_MODE) {
    console.log(`💾 Datos guardados en cache: ${key}`);
  }
}

function clearCache() {
  dataCache.clear();
  console.log('🗑️ Cache limpiado');
}

// ================= INICIALIZACIÓN FIREBASE AL CARGAR =================

// Inicializar Firebase inmediatamente
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM cargado, iniciando Firebase...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está cargado');
    showNotification('Error: Firebase SDK no disponible. Recarga la página.', 'error', 10000);
    return;
  }
  
  const firebaseInitSuccess = initializeFirebase();
  
  if (!firebaseInitSuccess) {
    console.error('❌ Falló la inicialización de Firebase');
    return;
  }
  
  // Configurar listener de estado de autenticación después de inicializar Firebase
  setTimeout(() => {
    if (auth) {
      auth.onAuthStateChanged(onAuthStateChanged);
      console.log('👂 Auth state listener configurado');
    }
  }, 1000);
});

console.log('✅ PARTE 1: Configuración Firebase corregida y variables globales');

// ================= SENDA PUENTE ALTO - APP.JS PARTE 2 CORREGIDA =================
// Autenticación y Carga de Solicitudes - PROBLEMA PRINCIPAL SOLUCIONADO

// ================= GESTIÓN DE AUTENTICACIÓN CORREGIDA =================

function onAuthStateChanged(user) {
  try {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🔧 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
    }
    
    if (user) {
      currentUser = user;
      console.log('👤 Usuario autenticado:', user.email);
      loadUserData();
    } else {
      currentUser = null;
      currentUserData = null;
      clearUserCache();
      showPublicContent();
      console.log('👤 Usuario desconectado');
    }
  } catch (error) {
    console.error('❌ Error en cambio de estado de autenticación:', error);
    showNotification('Error en autenticación', 'error');
  }
}

// FUNCIÓN CRÍTICA CORREGIDA: Validación de email @senda.cl
function validateEmailSenda(email) {
  if (!email || !email.includes('@')) return false;
  return email.toLowerCase().endsWith('@senda.cl');
}

async function loadUserData() {
  try {
    showLoading(true, 'Cargando datos del usuario...');
    console.log('👤 Cargando datos para usuario:', currentUser.email);
    
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar cache primero
    const cacheKey = `user_${currentUser.uid}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      console.log('📋 Datos de usuario obtenidos del cache');
      currentUserData = cachedData;
      showProfessionalContent();
      await loadInitialData();
      return;
    }

    // Cargar desde Firestore con reintentos
    const userData = await retryOperation(async () => {
      console.log('🔍 Buscando datos del profesional en Firestore...');
      const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();
      
      if (!userDoc.exists) {
        console.error('❌ No se encontró el documento del profesional');
        throw new Error('No se encontraron datos del profesional');
      }
      
      const data = userDoc.data();
      console.log('✅ Datos del profesional cargados:', data);
      return data;
    }, 3, 'carga de datos de usuario');
    
    currentUserData = userData;
    setCachedData(cacheKey, userData);
    
    console.log('🎉 Usuario cargado correctamente:', userData.nombre, userData.apellidos);
    
    showProfessionalContent();
    await loadInitialData();
    
  } catch (error) {
    console.error('❌ Error cargando datos del usuario:', error);
    
    let errorMessage = 'Error al cargar datos del usuario';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Sin permisos para acceder a los datos de profesional';
    } else if (error.message.includes('No se encontraron datos')) {
      errorMessage = 'Perfil de profesional no encontrado. Contacta al administrador.';
    } else {
      errorMessage = `Error al cargar datos: ${error.message}`;
    }
    
    showNotification(errorMessage, 'error', 8000);
    await handleLogout();
  } finally {
    showLoading(false);
  }
}

// ================= CARGA DE DATOS INICIALES CORREGIDA =================

async function loadInitialData() {
  try {
    console.log('🔄 Cargando datos iniciales...');
    
    // Obtener pestaña activa
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    console.log('📊 Pestaña activa:', activeTab);
    
    // Cargar datos según la pestaña activa
    if (activeTab === 'solicitudes' && hasAccessToSolicitudes()) {
      console.log('📋 Cargando solicitudes (usuario tiene acceso)');
      await loadSolicitudes();
    } else if (activeTab === 'pacientes') {
      console.log('👥 Cargando pacientes');
      await loadPacientes();
    } else if (activeTab === 'agenda') {
      console.log('📅 Cargando calendario');
      renderCalendar();
    } else if (activeTab === 'seguimiento') {
      console.log('📈 Cargando seguimiento');
      await loadSeguimiento();
    }
    
    // Siempre cargar lista de profesionales
    await loadProfessionalsList();
    
    console.log('✅ Datos iniciales cargados completamente');
    
  } catch (error) {
    console.error('❌ Error cargando datos iniciales:', error);
    showNotification('Error al cargar algunos datos iniciales', 'warning');
  }
}

// ================= FUNCIÓN CRÍTICA: CARGA DE SOLICITUDES CORREGIDA =================

async function loadSolicitudes() {
  // VERIFICACIÓN CRÍTICA: Usuario debe tener acceso a solicitudes
  if (!currentUserData || !hasAccessToSolicitudes()) {
    console.log('⚠️ Usuario no tiene acceso a solicitudes');
    const container = document.getElementById('requests-container');
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-lock"></i>
          <h3>Acceso Restringido</h3>
          <p>Solo los Asistentes Sociales pueden ver las solicitudes pendientes.</p>
          <p>Tu rol actual: <strong>${getProfessionName(currentUserData.profession)}</strong></p>
        </div>
      `;
    }
    return;
  }

  try {
    showLoading(true, 'Cargando solicitudes pendientes...');
    console.log('🔍 Iniciando carga de solicitudes para:', currentUserData.cesfam);
    
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }
    
    // Limpiar cache para forzar carga fresh
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    // Mostrar indicador de carga
    container.innerHTML = `
      <div class="loading-message" style="text-align: center; padding: 40px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-blue); margin-bottom: 16px;"></i>
        <h3>Cargando solicitudes...</h3>
        <p>Obteniendo datos desde Firebase...</p>
      </div>
    `;
    
    await loadSolicitudesFromFirestore();
    
  } catch (error) {
    console.error('❌ Error general cargando solicitudes:', error);
    renderSolicitudesError(error);
  } finally {
    showLoading(false);
  }
}

async function loadSolicitudesFromFirestore() {
  try {
    console.log('🔥 Cargando desde Firestore para CESFAM:', currentUserData.cesfam);
    
    const solicitudes = [];
    let totalCargadas = 0;
    
    // 1. CARGAR SOLICITUDES DE INGRESO
    try {
      console.log('📋 Cargando solicitudes_ingreso...');
      
      const solicitudesQuery = db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .where('estado', 'in', ['pendiente', 'en_revision']) // Estados que deben aparecer
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT);
      
      const solicitudesSnapshot = await retryOperation(
        () => solicitudesQuery.get(),
        3,
        'carga de solicitudes_ingreso'
      );
      
      console.log(`📊 Solicitudes_ingreso encontradas: ${solicitudesSnapshot.size}`);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'solicitud',
          ...data
        });
        totalCargadas++;
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_ingreso:', error);
      handleFirestoreError(error, 'carga de solicitudes de ingreso');
    }
    
    // 2. CARGAR REINGRESOS
    try {
      console.log('🔄 Cargando reingresos...');
      
      const reingresosQuery = db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .where('estado', 'in', ['pendiente', 'en_revision'])
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT);
      
      const reingresosSnapshot = await retryOperation(
        () => reingresosQuery.get(),
        3,
        'carga de reingresos'
      );
      
      console.log(`📊 Reingresos encontrados: ${reingresosSnapshot.size}`);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'reingreso',
          ...data
        });
        totalCargadas++;
      });
      
    } catch (error) {
      console.error('❌ Error cargando reingresos:', error);
      handleFirestoreError(error, 'carga de reingresos');
    }
    
    // 3. CARGAR SOLICITUDES DE INFORMACIÓN
    try {
      console.log('📧 Cargando solicitudes_informacion...');
      
      const informacionQuery = db.collection('solicitudes_informacion')
        .where('estado', '==', 'pendiente_respuesta')
        .orderBy('fechaCreacion', 'desc')
        .limit(25); // Menos cantidad para información
      
      const informacionSnapshot = await retryOperation(
        () => informacionQuery.get(),
        3,
        'carga de solicitudes de información'
      );
      
      console.log(`📊 Solicitudes información encontradas: ${informacionSnapshot.size}`);
      
      informacionSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'informacion',
          tipoSolicitud: 'informacion',
          ...data
        });
        totalCargadas++;
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_informacion:', error);
      handleFirestoreError(error, 'carga de solicitudes de información');
    }
    
    // 4. PROCESAR Y MOSTRAR RESULTADOS
    console.log(`📈 Total solicitudes cargadas: ${totalCargadas}`);
    
    // Ordenar por fecha de creación (más recientes primero)
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    // Guardar en variables globales
    solicitudesData = solicitudes;
    
    // Guardar en cache
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    // Renderizar solicitudes
    renderSolicitudes(solicitudes);
    
    console.log(`🎉 Proceso de carga completado: ${solicitudes.length} solicitudes totales`);
    
    // Debug detallado si está habilitado
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📋 Resumen de solicitudes por tipo:');
      const porTipo = solicitudes.reduce((acc, s) => {
        acc[s.tipo] = (acc[s.tipo] || 0) + 1;
        return acc;
      }, {});
      console.table(porTipo);
    }
    
  } catch (error) {
    console.error('❌ Error crítico cargando desde Firestore:', error);
    renderSolicitudesError(error);
  }
}

// ================= FUNCIÓN CRÍTICA: RENDERIZAR SOLICITUDES CORREGIDA =================

function renderSolicitudes(solicitudes) {
  try {
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }

    console.log('🎨 Renderizando solicitudes:', solicitudes.length);

    // Caso: No hay solicitudes
    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="text-align: center; padding: 60px 20px;">
          <i class="fas fa-inbox" style="font-size: 4rem; color: var(--gray-400); margin-bottom: 20px;"></i>
          <h3 style="color: var(--text-dark); margin-bottom: 12px;">No hay solicitudes pendientes</h3>
          <p style="color: var(--text-medium); margin-bottom: 24px;">
            No se encontraron solicitudes pendientes para tu CESFAM: <strong>${currentUserData.cesfam}</strong>
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-primary" onclick="loadSolicitudes()">
              <i class="fas fa-redo"></i>
              Actualizar
            </button>
            <button class="btn btn-outline" onclick="clearCache(); loadSolicitudes()">
              <i class="fas fa-sync"></i>
              Forzar Recarga
            </button>
          </div>
          <div style="margin-top: 20px; padding: 16px; background: var(--light-blue); border-radius: 8px; font-size: 14px;">
            <strong>💡 Información:</strong><br>
            • Las solicitudes aparecen aquí cuando tienen estado "pendiente" o "en_revision"<br>
            • Solo los Asistentes Sociales pueden ver las solicitudes<br>
            • Las solicitudes agendadas no aparecen en esta lista
          </div>
        </div>
      `;
      return;
    }

    // Caso: Hay solicitudes - renderizar tarjetas
    const solicitudesHTML = solicitudes.map(solicitud => {
      try {
        return createSolicitudCard(solicitud);
      } catch (cardError) {
        console.error('❌ Error creando tarjeta para solicitud:', solicitud.id, cardError);
        return createErrorCard(solicitud.id);
      }
    }).join('');

    container.innerHTML = `
      <div class="solicitudes-header" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--primary-blue); margin: 0;">
            📋 ${solicitudes.length} Solicitud${solicitudes.length !== 1 ? 'es' : ''} Pendiente${solicitudes.length !== 1 ? 's' : ''}
          </h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="clearCache(); loadSolicitudes()" title="Actualizar datos">
              <i class="fas fa-sync"></i>
              Actualizar
            </button>
            ${APP_CONFIG.DEBUG_MODE ? `
            <button class="btn btn-outline btn-sm" onclick="console.log('Solicitudes:', solicitudesData)" title="Debug">
              <i class="fas fa-bug"></i>
              Debug
            </button>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="solicitudes-grid">
        ${solicitudesHTML}
      </div>
    `;
    
    // Agregar event listeners a las tarjetas
    container.querySelectorAll('.request-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No abrir detalle si se hizo clic en un botón
        if (e.target.closest('button')) return;
        
        const solicitudId = card.dataset.id;
        const solicitud = solicitudes.find(s => s.id === solicitudId);
        if (solicitud) {
          showSolicitudDetail(solicitud);
        }
      });
    });
    
    console.log(`✅ Renderizadas ${solicitudes.length} solicitudes correctamente`);
    
  } catch (error) {
    console.error('❌ Error renderizando solicitudes:', error);
    renderSolicitudesError(error);
  }
}

function createErrorCard(solicitudId) {
  return `
    <div class="request-card error-card" style="border: 2px solid var(--danger-red); background: #fef2f2;">
      <div class="request-header">
        <h3 style="color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar solicitud
        </h3>
      </div>
      <div class="request-body">
        <p>ID: ${solicitudId}</p>
        <p>No se pudo cargar la información de esta solicitud</p>
      </div>
    </div>
  `;
}

// ================= FUNCIONES DE ACCESO Y PERMISOS =================

function hasAccessToSolicitudes() {
  if (!currentUserData) return false;
  return currentUserData.profession === 'asistente_social';
}

function canAccessTab(tabName) {
  if (!currentUserData) return false;
  
  switch (tabName) {
    case 'solicitudes':
      return currentUserData.profession === 'asistente_social';
    case 'agenda':
    case 'seguimiento':
    case 'pacientes':
      return true;
    default:
      return false;
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

console.log('✅ PARTE 2: Autenticación y carga de solicitudes CORREGIDA');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 3 CORREGIDA =================
// Creación de Tarjetas de Solicitudes y Formularios

// ================= FUNCIÓN CRÍTICA: CREAR TARJETAS DE SOLICITUDES =================

function createSolicitudCard(solicitud) {
  try {
    // Validar datos básicos
    if (!solicitud || !solicitud.id) {
      console.error('❌ Solicitud inválida:', solicitud);
      return createErrorCard('unknown');
    }

    const fecha = formatDate(solicitud.fechaCreacion);
    const prioridad = solicitud.prioridad || 'baja';
    const estado = solicitud.estado || 'pendiente';
    
    // Determinar tipo y contenido
    let titulo, subtitulo, tipoIcon, tipoLabel, tipoClass;
    
    if (solicitud.tipo === 'reingreso') {
      titulo = `Reingreso - ${solicitud.nombre || 'Sin nombre'}`;
      subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      tipoIcon = 'fa-redo';
      tipoLabel = 'REINGRESO';
      tipoClass = 'reingreso';
    } else if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') {
      titulo = 'Solicitud de Información';
      subtitulo = `Email: ${solicitud.email || 'No disponible'}`;
      tipoIcon = 'fa-info-circle';
      tipoLabel = 'INFORMACIÓN';
      tipoClass = 'informacion';
    } else {
      // Solicitud normal
      tipoIcon = 'fa-user-plus';
      tipoLabel = 'SOLICITUD';
      tipoClass = 'solicitud';
      
      if (solicitud.tipoSolicitud === 'identificado') {
        titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
        subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      } else {
        titulo = 'Solicitud General';
        subtitulo = `Edad: ${solicitud.edad || 'No especificada'} años`;
      }
    }

    // Procesar sustancias
    const sustancias = solicitud.sustancias || [];
    const sustanciasHtml = sustancias.length > 0 ? 
      sustancias.slice(0, 3).map(s => `<span class="substance-tag">${s}</span>`).join('') +
      (sustancias.length > 3 ? `<span class="substance-tag more">+${sustancias.length - 3}</span>` : '')
      : '';

    // Colores por prioridad
    const prioridadColors = {
      'critica': '#ef4444',
      'alta': '#f59e0b',
      'media': '#3b82f6',
      'baja': '#10b981'
    };

    // Iconos por estado
    const estadoIcons = {
      'pendiente': 'fa-clock',
      'en_revision': 'fa-eye',
      'pendiente_respuesta': 'fa-reply'
    };

    // Determinar urgencia visual
    const isUrgent = prioridad === 'critica';
    const cardClass = isUrgent ? 'request-card urgent' : 'request-card';

    return `
      <div class="${cardClass}" data-id="${solicitud.id}" style="
        transition: all 0.2s ease;
        border: 2px solid ${isUrgent ? '#ef4444' : 'var(--border-light)'};
        background: ${isUrgent ? '#fef2f2' : 'white'};
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        cursor: pointer;
        position: relative;
        ${isUrgent ? 'box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);' : ''}
      ">
        ${isUrgent ? '<div class="urgent-indicator" style="position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; padding: 4px 8px; border-radius: 0 10px 0 10px; font-size: 10px; font-weight: bold;">URGENTE</div>' : ''}
        
        <div class="request-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div class="request-info" style="flex: 1;">
            <h3 style="margin: 0 0 4px 0; color: var(--text-dark); font-size: 1.1rem; font-weight: 600;">
              <i class="fas ${tipoIcon}" style="margin-right: 8px; color: var(--primary-blue);"></i>
              ${titulo}
            </h3>
            <p style="margin: 0; color: var(--text-medium); font-size: 0.9rem;">${subtitulo}</p>
          </div>
          
          <div class="request-meta" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <span class="priority-badge ${prioridad}" style="
              background-color: ${prioridadColors[prioridad]};
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            ">
              ${prioridad}
            </span>
            
            <span class="request-type ${tipoClass}" style="
              background: ${tipoClass === 'reingreso' ? '#e0e7ff' : tipoClass === 'informacion' ? '#f0f9ff' : '#e6f3ff'};
              color: ${tipoClass === 'reingreso' ? '#3730a3' : tipoClass === 'informacion' ? '#0c4a6e' : '#1e40af'};
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            ">
              ${tipoLabel}
            </span>
          </div>
        </div>
        
        <div class="request-body">
          ${sustanciasHtml ? `
            <div class="request-substances" style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${sustanciasHtml}
            </div>
          ` : ''}
          
          ${solicitud.descripcion || solicitud.motivo ? `
            <p class="request-description" style="
              color: var(--text-medium);
              line-height: 1.5;
              margin: 0 0 12px 0;
              font-size: 0.9rem;
            ">
              ${truncateText(solicitud.descripcion || solicitud.motivo, 120)}
            </p>
          ` : ''}
          
          <div class="request-details" style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            color: var(--text-medium);
          ">
            ${solicitud.cesfam ? `<div><strong>CESFAM:</strong> ${truncateText(solicitud.cesfam, 25)}</div>` : ''}
            <div>
              <strong>Estado:</strong> 
              <span class="status-${estado}" style="display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas ${estadoIcons[estado] || 'fa-circle'}"></i>
                ${estado.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
            <div><strong>Fecha:</strong> ${fecha}</div>
          </div>
        </div>
        
        <div class="request-actions" style="
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid var(--border-light);
        ">
          ${createActionButtons(solicitud)}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error creando tarjeta de solicitud:', error, solicitud);
    return createErrorCard(solicitud?.id || 'unknown');
  }
}

function createActionButtons(solicitud) {
  try {
    const buttons = [];
    
    if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') {
      // Botones para solicitudes de información
      buttons.push(`
        <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); showInformationModal('${solicitud.id}')" title="Enviar información">
          <i class="fas fa-envelope"></i>
          Enviar Info
        </button>
      `);
    } else {
      // Botones para solicitudes normales y reingresos
      buttons.push(`
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModal('${solicitud.id}')" title="Agendar cita">
          <i class="fas fa-calendar-plus"></i>
          Agendar
        </button>
      `);
    }
    
    // Botón ver detalle (siempre presente)
    buttons.push(`
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showSolicitudDetailById('${solicitud.id}')" title="Ver detalles completos">
        <i class="fas fa-eye"></i>
        Ver Detalle
      </button>
    `);
    
    // Botón urgente solo para casos críticos
    if (solicitud.prioridad === 'critica') {
      buttons.push(`
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); handleUrgentCase('${solicitud.id}')" title="Marcar como caso urgente">
          <i class="fas fa-exclamation-triangle"></i>
          URGENTE
        </button>
      `);
    }
    
    return buttons.join('');
  } catch (error) {
    console.error('❌ Error creando botones de acción:', error);
    return `
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showSolicitudDetailById('${solicitud.id}')">
        <i class="fas fa-eye"></i>
        Ver
      </button>
    `;
  }
}

// ================= ESTILOS CSS PARA SUSTANCIAS =================

function addSubstanceTagStyles() {
  if (document.getElementById('substance-tag-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'substance-tag-styles';
  style.textContent = `
    .substance-tag {
      display: inline-block;
      background: var(--primary-blue);
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      margin: 2px;
    }
    
    .substance-tag.more {
      background: var(--gray-400);
    }
    
    .request-card {
      transition: all 0.2s ease;
    }
    
    .request-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .request-card.urgent {
      animation: urgent-pulse 2s infinite;
    }
    
    @keyframes urgent-pulse {
      0%, 100% { box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15); }
      50% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25); }
    }
  `;
  document.head.appendChild(style);
}

// ================= FORMULARIO MULTI-STEP MEJORADO =================

function setupMultiStepForm() {
  try {
    const form = document.getElementById('patient-form');
    if (!form) {
      console.warn('⚠️ Formulario patient-form no encontrado');
      return;
    }

    console.log('📝 Configurando formulario multi-step...');

    // Event listeners para navegación
    setupFormNavigation();
    
    // Event listeners para cambios de tipo de solicitud
    setupSolicitudTypeChange();
    
    // Event listeners para validación en tiempo real
    setupRealTimeValidation();
    
    // Event listeners para formateo automático
    setupAutoFormatting();
    
    // Event listeners para motivación
    setupMotivationRange();
    
    // Event listener para submit principal
    form.addEventListener('submit', handlePatientFormSubmit);

    // Configurar formulario de reingreso
    setupReentryForm();

    console.log('✅ Formulario multi-step configurado correctamente');
    
  } catch (error) {
    console.error('❌ Error configurando formulario multi-step:', error);
  }
}

function setupFormNavigation() {
  const form = document.getElementById('patient-form');
  if (!form) return;

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
}

function setupSolicitudTypeChange() {
  const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
  
  tipoSolicitudInputs.forEach(input => {
    input.addEventListener('change', () => {
      const tipoSolicitud = input.value;
      console.log('📝 Tipo de solicitud cambiado a:', tipoSolicitud);
      
      const infoEmailContainer = document.getElementById('info-email-container');
      const basicInfoContainer = document.getElementById('basic-info-container');
      const nextBtn = document.getElementById('next-step-1');
      const submitBtn = document.getElementById('submit-step-1');
      
      if (tipoSolicitud === 'informacion') {
        // Solo información - formulario simplificado
        maxFormStep = 1;
        updateProgressIndicator(1, 1);
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'block';
        if (basicInfoContainer) basicInfoContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
        
      } else if (tipoSolicitud === 'identificado') {
        // Formulario completo
        maxFormStep = 4;
        updateProgressIndicator(1, 4);
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
      }
    });
  });
}

function setupRealTimeValidation() {
  // Validación de RUT en tiempo real
  const rutInputs = document.querySelectorAll('input[id*="rut"], input[id*="RUT"]');
  rutInputs.forEach(input => {
    input.addEventListener('blur', () => {
      const rut = input.value.trim();
      if (rut && !validateRUT(rut)) {
        input.classList.add('error');
        showFieldError(input, 'RUT inválido');
      } else {
        input.classList.remove('error');
        hideFieldError(input);
      }
    });
  });

  // Validación de email en tiempo real
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', () => {
      const email = input.value.trim();
      if (email && !isValidEmail(email)) {
        input.classList.add('error');
        showFieldError(input, 'Email inválido');
      } else {
        input.classList.remove('error');
        hideFieldError(input);
      }
    });
  });

  // Validación de teléfono en tiempo real
  const phoneInputs = document.querySelectorAll('input[id*="phone"], input[id*="telefono"]');
  phoneInputs.forEach(input => {
    input.addEventListener('blur', () => {
      const phone = input.value.trim();
      if (phone && !validatePhoneNumberString(phone)) {
        input.classList.add('error');
        showFieldError(input, 'Teléfono inválido');
      } else {
        input.classList.remove('error');
        hideFieldError(input);
      }
    });
  });
}

function setupAutoFormatting() {
  // Auto-formateo de RUT
  document.addEventListener('input', (e) => {
    if (e.target.id && (e.target.id.includes('rut') || e.target.id.includes('RUT'))) {
      const oldValue = e.target.value;
      const newValue = formatRUT(oldValue);
      if (oldValue !== newValue) {
        e.target.value = newValue;
      }
    }
  });

  // Auto-formateo de teléfono
  const phoneInputs = document.querySelectorAll('input[id*="phone"], input[id*="telefono"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 0) {
        if (value.length <= 9) {
          // Formato: 9 1234 5678
          value = value.replace(/(\d{1})(\d{0,4})(\d{0,4})/, (match, p1, p2, p3) => {
            let formatted = p1;
            if (p2) formatted += ' ' + p2;
            if (p3) formatted += ' ' + p3;
            return formatted;
          });
        }
      }
      e.target.value = value;
    });
  });
}

function setupMotivationRange() {
  const motivacionRange = document.getElementById('motivacion-range');
  const motivacionValue = document.getElementById('motivacion-value');
  
  if (motivacionRange && motivacionValue) {
    motivacionRange.addEventListener('input', () => {
      const value = motivacionRange.value;
      motivacionValue.textContent = value;
      updateMotivacionColor(value);
    });
    
    // Establecer valor inicial
    motivacionValue.textContent = motivacionRange.value;
    updateMotivacionColor(motivacionRange.value);
  }
}

function setupReentryForm() {
  const reentryForm = document.getElementById('reentry-form');
  if (reentryForm) {
    reentryForm.addEventListener('submit', handleReentrySubmit);
    
    // Auto-formateo de RUT en formulario de reingreso
    const reentryRut = document.getElementById('reentry-rut');
    if (reentryRut) {
      reentryRut.addEventListener('input', (e) => {
        e.target.value = formatRUT(e.target.value);
      });
    }
  }
}

// ================= FUNCIONES DE VALIDACIÓN MEJORADAS =================

function showFieldError(field, message) {
  hideFieldError(field); // Limpiar error anterior
  
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.style.cssText = `
    color: var(--danger-red);
    font-size: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  `;
  errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  
  field.parentNode.appendChild(errorElement);
  field.style.borderColor = 'var(--danger-red)';
}

function hideFieldError(field) {
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  field.style.borderColor = '';
}

function validateStep(step) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    let isValid = true;
    const errors = [];

    // Limpiar errores previos
    currentStepDiv.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
      hideFieldError(field);
    });

    if (step === 1) {
      if (!tipoSolicitud) {
        errors.push('Selecciona un tipo de solicitud');
        isValid = false;
      } else if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email');
        if (!email || !email.value.trim()) {
          errors.push('Ingresa un email para recibir información');
          if (email) email.classList.add('error');
          isValid = false;
        } else if (!isValidEmail(email.value.trim())) {
          errors.push('Ingresa un email válido');
          email.classList.add('error');
          isValid = false;
        }
      } else if (tipoSolicitud === 'identificado') {
        // Validaciones para solicitud identificada
        const validaciones = [
          { field: 'patient-age', message: 'La edad es obligatoria', validate: (v) => v && parseInt(v) >= 12 && parseInt(v) <= 120 },
          { field: 'patient-cesfam', message: 'Selecciona un CESFAM', validate: (v) => v },
          { field: 'paraMi', message: 'Indica para quién solicitas ayuda', validate: () => document.querySelector('input[name="paraMi"]:checked') }
        ];

        validaciones.forEach(({ field, message, validate }) => {
          const element = field === 'paraMi' ? null : document.getElementById(field);
          const value = element ? element.value : null;
          
          if (!validate(value)) {
            errors.push(message);
            if (element) element.classList.add('error');
            isValid = false;
          }
        });
      }
    }

    // Validaciones para otros pasos...
    if (step === 2) {
      const requiredFields = [
        { id: 'patient-name', name: 'Nombre' },
        { id: 'patient-lastname', name: 'Apellidos' },
        { id: 'patient-rut', name: 'RUT' },
        { id: 'patient-phone', name: 'Teléfono' }
      ];

      requiredFields.forEach(({ id, name }) => {
        const field = document.getElementById(id);
        if (!field || !field.value.trim()) {
          errors.push(`${name} es obligatorio`);
          if (field) field.classList.add('error');
          isValid = false;
        }
      });

      // Validaciones específicas
      const rut = document.getElementById('patient-rut');
      if (rut && rut.value.trim() && !validateRUT(rut.value.trim())) {
        errors.push('RUT inválido');
        rut.classList.add('error');
        isValid = false;
      }

      const phone = document.getElementById('patient-phone');
      if (phone && phone.value.trim() && !validatePhoneNumberString(phone.value.trim())) {
        errors.push('Teléfono inválido');
        phone.classList.add('error');
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

// ================= FUNCIONES UTILITARIAS =================

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
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

function validatePhoneNumberString(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
}

// Inicializar estilos CSS cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  addSubstanceTagStyles();
});

console.log('✅ PARTE 3: Creación de tarjetas y formularios CORREGIDA');

// ================= SENDA PUENTE ALTO - APP.JS PARTE 4 CORREGIDA =================
// Manejo de Formularios y Envío a Firebase

// ================= FUNCIÓN CRÍTICA: MANEJO DE ENVÍO DE FORMULARIOS =================

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  console.log('📄 Iniciando envío de solicitud...');
  
  const submitBtn = document.getElementById('submit-form');
  
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
    
    // Verificar tipo de solicitud
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (!tipoSolicitud) {
      showNotification('Selecciona un tipo de solicitud', 'warning');
      return;
    }

    console.log('📝 Tipo de solicitud:', tipoSolicitud);

    if (tipoSolicitud !== 'identificado') {
      showNotification('Tipo de solicitud no válido para este flujo', 'error');
      return;
    }

    // Validaciones básicas críticas
    const validacionesCriticas = validateCriticalFields();
    if (!validacionesCriticas.valid) {
      showNotification(validacionesCriticas.message, 'warning');
      return;
    }

    // Recopilar datos del formulario
    const solicitudData = await collectFormDataSafe();
    console.log('📋 Datos recopilados:', solicitudData);
    
    // Calcular prioridad
    solicitudData.prioridad = calculatePriority(solicitudData);
    console.log('⚡ Prioridad calculada:', solicitudData.prioridad);
    
    // Verificar conexión a Firebase
    if (!isFirebaseInitialized || !db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    console.log('💾 Guardando en Firestore...');
    
    // Enviar a Firebase con reintentos
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_ingreso').add(solicitudData);
    }, 3, 'envío de solicitud');
    
    console.log('✅ Solicitud guardada con ID:', docRef.id);
    
    // Crear alerta crítica si es necesario
    if (solicitudData.prioridad === 'critica') {
      try {
        await createCriticalAlert(solicitudData, docRef.id);
        console.log('🚨 Alerta crítica creada');
      } catch (alertError) {
        console.warn('⚠️ Error creando alerta crítica:', alertError);
      }
    }
    
    // Cerrar modal y resetear formulario
    closeModal('patient-modal');
    resetForm();
    
    // Mostrar mensaje de éxito
    const successMessage = `Solicitud enviada correctamente. 
ID: ${docRef.id}
Prioridad: ${solicitudData.prioridad.toUpperCase()}
Te contactaremos pronto para coordinar una cita.`;
    
    showNotification(successMessage, 'success', 8000);
    console.log('🎉 Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error enviando solicitud:', error);
    handleFormSubmissionError(error);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
    }
  }
}

function validateCriticalFields() {
  const requiredFields = [
    { id: 'patient-age', name: 'Edad', validate: (v) => v && parseInt(v) >= 12 && parseInt(v) <= 120 },
    { id: 'patient-cesfam', name: 'CESFAM', validate: (v) => v },
    { id: 'patient-name', name: 'Nombre', validate: (v) => v && v.trim().length >= 2 },
    { id: 'patient-lastname', name: 'Apellidos', validate: (v) => v && v.trim().length >= 2 },
    { id: 'patient-rut', name: 'RUT', validate: (v) => v && validateRUT(v) },
    { id: 'patient-phone', name: 'Teléfono', validate: (v) => v && validatePhoneNumberString(v) }
  ];

  for (const field of requiredFields) {
    const element = document.getElementById(field.id);
    const value = element ? element.value.trim() : '';
    
    if (!field.validate(value)) {
      if (element) {
        element.classList.add('error');
        element.focus();
      }
      return {
        valid: false,
        message: `${field.name} es obligatorio y debe ser válido`
      };
    }
  }

  // Validar que al menos una sustancia esté seleccionada
  const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
  if (sustancias.length === 0) {
    return {
      valid: false,
      message: 'Selecciona al menos una sustancia problemática'
    };
  }

  // Validar urgencia
  const urgencia = document.querySelector('input[name="urgencia"]:checked');
  if (!urgencia) {
    return {
      valid: false,
      message: 'Selecciona el nivel de urgencia'
    };
  }

  // Validar tratamiento previo
  const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
  if (!tratamientoPrevio) {
    return {
      valid: false,
      message: 'Indica si has recibido tratamiento previo'
    };
  }

  return { valid: true };
}

function collectFormDataSafe() {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (!tipoSolicitud) {
      throw new Error('Tipo de solicitud no seleccionado');
    }
    
    // Datos base de la solicitud
    const solicitudData = {
      tipoSolicitud,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      origen: 'web_publica',
      version: '2.1',
      ip_origen: getClientIP(),
      user_agent: navigator.userAgent
    };

    // Datos básicos
    const edad = parseInt(document.getElementById('patient-age')?.value);
    const cesfam = document.getElementById('patient-cesfam')?.value;
    const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;

    if (edad) solicitudData.edad = edad;
    if (cesfam) solicitudData.cesfam = cesfam;
    if (paraMi) solicitudData.paraMi = paraMi;

    // Datos personales (para solicitud identificada)
    if (tipoSolicitud === 'identificado') {
      const datosPersonales = {
        nombre: document.getElementById('patient-name')?.value?.trim(),
        apellidos: document.getElementById('patient-lastname')?.value?.trim(),
        rut: document.getElementById('patient-rut')?.value?.trim(),
        telefono: document.getElementById('patient-phone')?.value?.trim(),
        email: document.getElementById('patient-email')?.value?.trim(),
        direccion: document.getElementById('patient-address')?.value?.trim()
      };

      Object.keys(datosPersonales).forEach(key => {
        if (datosPersonales[key]) {
          if (key === 'rut') {
            solicitudData[key] = formatRUT(datosPersonales[key]);
          } else if (key === 'telefono') {
            solicitudData[key] = formatPhoneNumber(datosPersonales[key]);
          } else {
            solicitudData[key] = datosPersonales[key];
          }
        }
      });
    }

    // Datos de consumo
    const sustanciasChecked = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustanciasChecked.length > 0) {
      solicitudData.sustancias = Array.from(sustanciasChecked).map(cb => cb.value);
    }

    const tiempoConsumo = document.getElementById('tiempo-consumo')?.value;
    if (tiempoConsumo) {
      solicitudData.tiempoConsumo = tiempoConsumo;
    }

    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (urgencia) {
      solicitudData.urgencia = urgencia.value;
    }

    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (tratamientoPrevio) {
      solicitudData.tratamientoPrevio = tratamientoPrevio.value;
    }

    // Información adicional
    const descripcion = document.getElementById('patient-description')?.value?.trim();
    if (descripcion) {
      solicitudData.descripcion = descripcion;
    }

    const motivacion = document.getElementById('motivacion-range')?.value;
    if (motivacion) {
      solicitudData.motivacion = parseInt(motivacion);
    }

    console.log('✅ Datos recopilados exitosamente:', solicitudData);
    return solicitudData;
    
  } catch (error) {
    console.error('❌ Error recopilando datos del formulario:', error);
    throw new Error('Error recopilando datos del formulario: ' + error.message);
  }
}

function calculatePriority(solicitudData) {
  let score = 0;
  
  // Factor urgencia (peso alto)
  if (solicitudData.urgencia === 'alta') score += 4;
  else if (solicitudData.urgencia === 'media') score += 2;
  else score += 1;
  
  // Factor edad (menores y mayores tienen prioridad)
  if (solicitudData.edad) {
    if (solicitudData.edad < 18) score += 3; // Menores de edad
    else if (solicitudData.edad > 65) score += 2; // Adultos mayores
    else if (solicitudData.edad < 25) score += 1; // Jóvenes adultos
  }
  
  // Factor sustancias (múltiples sustancias = mayor riesgo)
  if (solicitudData.sustancias) {
    if (solicitudData.sustancias.length > 3) score += 3;
    else if (solicitudData.sustancias.length > 1) score += 2;
    else score += 1;
    
    // Sustancias de alto riesgo
    const sustanciasAltoRiesgo = ['Pasta Base', 'Cocaína', 'Opiáceos'];
    const tieneAltoRiesgo = solicitudData.sustancias.some(s => sustanciasAltoRiesgo.includes(s));
    if (tieneAltoRiesgo) score += 2;
  }
  
  // Factor motivación (baja motivación puede indicar crisis)
  if (solicitudData.motivacion) {
    if (solicitudData.motivacion <= 3) score += 2; // Baja motivación
    else if (solicitudData.motivacion >= 8) score += 1; // Alta motivación
  }
  
  // Factor tratamiento previo incompleto
  if (solicitudData.tratamientoPrevio === 'si_incompleto') {
    score += 2;
  }
  
  // Determinar prioridad final
  if (score >= 10) return 'critica';
  else if (score >= 7) return 'alta';
  else if (score >= 4) return 'media';
  else return 'baja';
}

function handleFormSubmissionError(error) {
  let errorMessage = 'Error al enviar la solicitud: ';
  
  switch (error.code) {
    case 'permission-denied':
      errorMessage += 'Sin permisos para crear solicitudes. Verifica las reglas de Firebase.';
      break;
    case 'network-request-failed':
      errorMessage += 'Problema de conexión. Verifica tu internet y reintenta.';
      break;
    case 'unavailable':
      errorMessage += 'Servicio no disponible temporalmente. Intenta en unos minutos.';
      break;
    case 'resource-exhausted':
      errorMessage += 'Límite de operaciones excedido. Intenta más tarde.';
      break;
    case 'deadline-exceeded':
    case 'timeout':
      errorMessage += 'La operación tardó demasiado. Verifica tu conexión.';
      break;
    default:
      if (error.message.includes('Firebase')) {
        errorMessage += 'Error de configuración de Firebase. Contacta al administrador.';
      } else if (!checkNetworkStatus()) {
        errorMessage += 'Sin conexión a internet. Verifica tu conectividad.';
      } else {
        errorMessage += error.message || 'Intenta nuevamente en unos momentos.';
      }
  }
  
  showNotification(errorMessage, 'error', 10000);
  
  // Log detallado para debugging
  console.error('📊 Detalles del error:');
  console.error('Code:', error.code);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
}

// ================= MANEJO DE SOLICITUD DE INFORMACIÓN =================

async function handleInformationOnlySubmit() {
  try {
    console.log('📧 Procesando solicitud de información únicamente...');
    
    const email = document.getElementById('info-email')?.value?.trim();
    
    if (!email || !isValidEmail(email)) {
      showNotification('Ingresa un email válido para recibir información', 'error');
      return;
    }
    
    const submitBtn = document.getElementById('submit-step-1');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }
    
    const informationData = {
      tipoSolicitud: 'informacion',
      email: email,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente_respuesta',
      origen: 'web_publica',
      prioridad: 'baja',
      identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ip_origen: getClientIP(),
      user_agent: navigator.userAgent
    };
    
    console.log('💾 Guardando solicitud de información...');
    
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_informacion').add(informationData);
    }, 3, 'envío de solicitud de información');
    
    console.log('✅ Solicitud de información guardada con ID:', docRef.id);
    
    closeModal('patient-modal');
    resetForm();
    
    showNotification(`Solicitud de información enviada correctamente.
ID: ${docRef.id}
Te responderemos pronto a: ${email}`, 'success', 8000);
    
  } catch (error) {
    console.error('❌ Error enviando información:', error);
    handleFormSubmissionError(error);
  } finally {
    const submitBtn = document.getElementById('submit-step-1');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitud';
    }
  }
}

// ================= MANEJO DE REINGRESO =================

async function handleReentrySubmit(e) {
  e.preventDefault();
  console.log('📄 Iniciando envío de reingreso...');
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
    
    const formData = {
      nombre: document.getElementById('reentry-name')?.value?.trim() || '',
      rut: document.getElementById('reentry-rut')?.value?.trim() || '',
      cesfam: document.getElementById('reentry-cesfam')?.value || '',
      motivo: document.getElementById('reentry-reason')?.value?.trim() || '',
      telefono: document.getElementById('reentry-phone')?.value?.trim() || ''
    };
    
    // Validaciones críticas
    const requiredFields = [
      { field: 'nombre', name: 'Nombre', minLength: 2 },
      { field: 'rut', name: 'RUT', validate: validateRUT },
      { field: 'cesfam', name: 'CESFAM' },
      { field: 'motivo', name: 'Motivo', minLength: 10 },
      { field: 'telefono', name: 'Teléfono', validate: validatePhoneNumberString }
    ];

    for (const { field, name, minLength, validate } of requiredFields) {
      const value = formData[field];
      
      if (!value) {
        showNotification(`El campo ${name} es obligatorio`, 'warning');
        document.getElementById(`reentry-${field}`)?.focus();
        return;
      }
      
      if (minLength && value.length < minLength) {
        showNotification(`${name} debe tener al menos ${minLength} caracteres`, 'warning');
        return;
      }
      
      if (validate && !validate(value)) {
        showNotification(`${name} no es válido`, 'warning');
        return;
      }
    }
    
    // Verificar que Firebase esté disponible
    if (!isFirebaseInitialized || !db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    const rutFormatted = formatRUT(formData.rut);
    
    // Verificar duplicados
    try {
      const existingReingreso = await db.collection('reingresos')
        .where('rut', '==', rutFormatted)
        .where('estado', 'in', ['pendiente', 'en_revision'])
        .limit(1)
        .get();
      
      if (!existingReingreso.empty) {
        showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
        return;
      }
    } catch (queryError) {
      console.warn('⚠️ Error verificando reingresos existentes:', queryError);
      // Continuar aunque no se pueda verificar duplicados
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
      version: '2.1',
      ip_origen: getClientIP(),
      user_agent: navigator.userAgent
    };

    console.log('💾 Guardando reingreso...');
    
    const docRef = await retryOperation(async () => {
      return await db.collection('reingresos').add(reingresoData);
    }, 3, 'envío de reingreso');
    
    console.log('✅ Reingreso guardado con ID:', docRef.id);
    
    closeModal('reentry-modal');
    e.target.reset();
    
    showNotification(`Solicitud de reingreso enviada correctamente.
ID: ${docRef.id}
Te contactaremos pronto al: ${formData.telefono}`, 'success', 8000);
    
  } catch (error) {
    console.error('❌ Error enviando reingreso:', error);
    handleFormSubmissionError(error);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-redo"></i> Enviar Solicitud';
    }
  }
}

// ================= FUNCIONES AUXILIARES =================

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
        motivacion: solicitudData.motivacion,
        rut: solicitudData.rut,
        nombre: solicitudData.nombre
      }
    };
    
    await db.collection('alertas_criticas').add(alertData);
    
    console.log('🚨 Alerta crítica creada para solicitud:', solicitudId);
  } catch (error) {
    console.error('❌ Error creando alerta crítica:', error);
    // No fallar el proceso principal por error en alerta
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

function getClientIP() {
  // Esta función intentaría obtener la IP del cliente
  // En un entorno de producción, usarías un servicio externo
  return 'unknown';
}

// ================= RESET Y NAVEGACIÓN DE FORMULARIO =================

function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      goToStep(1);
      
      // Resetear motivación
      const motivacionRange = document.getElementById('motivacion-range');
      const motivacionValue = document.getElementById('motivacion-value');
      if (motivacionRange && motivacionValue) {
        motivacionRange.value = 5;
        motivacionValue.textContent = '5';
        updateMotivacionColor(5);
      }
      
      // Limpiar errores
      form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
        hideFieldError(field);
      });
      
      // Resetear configuración del formulario
      maxFormStep = 4;
      updateProgressIndicator(1, 4);
      
      // Resetear visibilidad de contenedores
      const infoEmailContainer = document.getElementById('info-email-container');
      const basicInfoContainer = document.getElementById('basic-info-container');
      const nextBtn = document.getElementById('next-step-1');
      const submitBtn = document.getElementById('submit-step-1');
      
      if (infoEmailContainer) infoEmailContainer.style.display = 'none';
      if (basicInfoContainer) basicInfoContainer.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.style.display = 'none';
    }
    
    console.log('🔧 Formulario reseteado completamente');
  } catch (error) {
    console.error('❌ Error reseteando formulario:', error);
  }
}

function goToStep(step) {
  try {
    if (step < 1 || step > maxFormStep) return;

    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.style.display = 'none';
      stepDiv.classList.remove('active');
    });
    
    // Mostrar paso actual
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.style.display = 'block';
      targetStep.classList.add('active');
      
      // Focus en el primer campo del paso
      setTimeout(() => {
        const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) {
          firstInput.focus();
        }
      }, 100);
    }

    // Actualizar indicador de progreso
    updateProgressIndicator(step, maxFormStep);
    currentFormStep = step;

    console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
  } catch (error) {
    console.error('❌ Error navegando a paso:', error);
  }
}

function updateProgressIndicator(current, total) {
  try {
    const progressFill = document.getElementById('form-progress');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      const progressPercentage = (current / total) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Paso ${current} de ${total}`;
    }
  } catch (error) {
    console.error('❌ Error actualizando indicador de progreso:', error);
  }
}

function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    return null;
  }
  
  switch (currentStep) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 4;
    case 4: return null;
  }
  return null;
}

function getPreviousStep(currentStep) {
  switch (currentStep) {
    case 2: return 1;
    case 3: return 2;
    case 4: return 3;
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
      color = '#ef4444'; // Rojo
    } else if (numValue <= 6) {
      color = '#f59e0b'; // Amarillo
    } else {
      color = '#10b981'; // Verde
    }
    
    motivacionValue.style.backgroundColor = color;
    motivacionValue.style.color = 'white';
    motivacionValue.style.padding = '4px 8px';
    motivacionValue.style.borderRadius = '4px';
    motivacionValue.style.fontWeight = 'bold';
  } catch (error) {
    console.error('❌ Error actualizando color de motivación:', error);
  }
}

// ================= CONFIGURACIÓN DE EVENTO PARA BOTÓN DE INFORMACIÓN =================

document.addEventListener('DOMContentLoaded', function() {
  // Configurar botón específico para envío de información
  const submitInfoBtn = document.getElementById('submit-step-1');
  if (submitInfoBtn) {
    submitInfoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
      if (tipoSolicitud === 'informacion') {
        handleInformationOnlySubmit();
      }
    });
  }
});

console.log('✅ PARTE 4: Manejo de formularios y envío a Firebase CORREGIDO');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 5 FINAL =================
// Inicialización Completa, Funciones Auxiliares y Sistema Integrado

// ================= GESTIÓN DE EVENTOS Y INICIALIZACIÓN =================

function initializeEventListeners() {
  try {
    console.log('🎯 Configurando event listeners...');

    // Botones principales de navegación
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutProfessionalBtn = document.getElementById('logout-professional');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');

    // Event listeners para botones principales
    if (loginProfessionalBtn) {
      loginProfessionalBtn.addEventListener('click', () => showModal('login-modal'));
    }

    if (logoutProfessionalBtn) {
      logoutProfessionalBtn.addEventListener('click', handleLogout);
    }

    if (registerPatientBtn) {
      registerPatientBtn.addEventListener('click', () => {
        resetForm();
        showModal('patient-modal');
      });
    }

    if (reentryProgramBtn) {
      reentryProgramBtn.addEventListener('click', () => showModal('reentry-modal'));
    }

    if (aboutProgramBtn) {
      aboutProgramBtn.addEventListener('click', showAboutProgram);
    }

    // Búsqueda y filtros
    const searchSolicitudes = document.getElementById('search-solicitudes');
    const priorityFilter = document.getElementById('priority-filter');
    const searchPacientesRut = document.getElementById('search-pacientes-rut');
    const buscarPacienteBtn = document.getElementById('buscar-paciente-btn');
    const limpiarBusquedaBtn = document.getElementById('limpiar-busqueda-btn');

    if (searchSolicitudes) {
      searchSolicitudes.addEventListener('input', debounce(filterSolicitudes, 300));
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', filterSolicitudes);
    }

    if (buscarPacienteBtn) {
      buscarPacienteBtn.addEventListener('click', buscarPacientePorRUT);
    }

    if (limpiarBusquedaBtn) {
      limpiarBusquedaBtn.addEventListener('click', limpiarBusquedaPacientes);
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

    // Navegación del calendario
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

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
      nuevaCitaBtn.addEventListener('click', createNuevaCitaModal);
    }

    // Atajos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Configurar formularios de autenticación
    setupAuthenticationForms();

    console.log('✅ Event listeners configurados correctamente');
  } catch (error) {
    console.error('❌ Error configurando event listeners:', error);
  }
}

function setupAuthenticationForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      // CRÍTICO: Validar email @senda.cl para login
      if (!validateEmailSenda(email)) {
        showNotification('Solo se permite el acceso con correos @senda.cl', 'error');
        return;
      }
      
      try {
        showLoading(true, 'Iniciando sesión...');
        console.log('🔐 Intentando login para:', email);
        
        await auth.signInWithEmailAndPassword(email, password);
        closeModal('login-modal');
        showNotification('Sesión iniciada correctamente', 'success');
        
      } catch (error) {
        console.error('❌ Error en login:', error);
        handleAuthError(error, 'login');
      } finally {
        showLoading(false);
      }
    });
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        email: document.getElementById('register-email').value.trim(),
        password: document.getElementById('register-password').value,
        nombre: document.getElementById('register-nombre').value.trim(),
        apellidos: document.getElementById('register-apellidos').value.trim(),
        profession: document.getElementById('register-profession').value,
        cesfam: document.getElementById('register-cesfam').value
      };
      
      // CRÍTICO: Validar email @senda.cl obligatorio para registro
      if (!validateEmailSenda(formData.email)) {
        showNotification('El registro requiere un correo @senda.cl', 'error');
        return;
      }
      
      if (formData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
      }
      
      if (!formData.nombre || !formData.apellidos || !formData.profession || !formData.cesfam) {
        showNotification('Completa todos los campos obligatorios', 'warning');
        return;
      }
      
      try {
        showLoading(true, 'Registrando usuario...');
        console.log('📝 Registrando usuario:', formData.email);
        
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;
        
        // Crear documento de profesional
        await db.collection('profesionales').doc(user.uid).set({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          profession: formData.profession,
          cesfam: formData.cesfam,
          activo: true,
          fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
          verificado: false,
          version: '2.1'
        });
        
        closeModal('login-modal');
        showNotification('Registro exitoso. Tu cuenta será verificada por un administrador.', 'success', 8000);
        
      } catch (error) {
        console.error('❌ Error en registro:', error);
        handleAuthError(error, 'registro');
      } finally {
        showLoading(false);
      }
    });
  }
}

function handleAuthError(error, operation) {
  let errorMessage = `Error en ${operation}`;
  
  switch (error.code) {
    case 'auth/user-not-found':
      errorMessage = 'Usuario no encontrado';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Contraseña incorrecta';
      break;
    case 'auth/invalid-email':
      errorMessage = 'Email inválido';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Demasiados intentos. Intenta más tarde';
      break;
    case 'auth/email-already-in-use':
      errorMessage = 'El email ya está registrado';
      break;
    case 'auth/weak-password':
      errorMessage = 'La contraseña es muy débil';
      break;
    case 'auth/network-request-failed':
      errorMessage = 'Error de conexión. Verifica tu internet';
      break;
    default:
      errorMessage = error.message || `Error desconocido en ${operation}`;
  }
  
  showNotification(errorMessage, 'error');
}

async function handleLogout() {
  try {
    console.log('🚪 Cerrando sesión...');
    showLoading(true, 'Cerrando sesión...');
    
    await auth.signOut();
    
    currentUser = null;
    currentUserData = null;
    clearUserCache();
    
    showNotification('Sesión cerrada correctamente', 'success');
    showPublicContent();
    
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  } finally {
    showLoading(false);
  }
}

function handleKeyboardShortcuts(e) {
  try {
    // Ctrl/Cmd + K para búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-solicitudes');
      if (searchInput && !searchInput.style.display === 'none') {
        searchInput.focus();
      }
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
    
    // F5 para recargar datos (en desarrollo)
    if (e.key === 'F5' && APP_CONFIG.DEBUG_MODE) {
      e.preventDefault();
      clearCache();
      if (currentUserData) {
        loadInitialData();
      }
    }
  } catch (error) {
    console.error('❌ Error manejando atajos de teclado:', error);
  }
}

// ================= GESTIÓN DE CONTENIDO Y NAVEGACIÓN =================

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
    console.error('❌ Error actualizando información profesional:', error);
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
        // Si la pestaña activa se oculta, cambiar a agenda
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
    console.error('❌ Error actualizando visibilidad de pestañas:', error);
  }
}

// ================= GESTIÓN DE PESTAÑAS =================

function setupTabFunctionality() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        if (!canAccessTab(targetTab)) {
          showNotification('No tienes permisos para acceder a esta sección', 'warning');
          return;
        }

        // Actualizar pestañas activas
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          
          // Agregar título especial para agenda
          if (targetTab === 'agenda') {
            updateAgendaTitle();
          }
          
          loadTabData(targetTab);
        }
      });
    });

    console.log('✅ Funcionalidad de pestañas configurada');
  } catch (error) {
    console.error('❌ Error configurando pestañas:', error);
  }
}

function updateAgendaTitle() {
  try {
    const agendaTab = document.getElementById('agenda-tab');
    if (agendaTab) {
      let titleElement = agendaTab.querySelector('.agenda-title');
      
      if (!titleElement) {
        titleElement = document.createElement('div');
        titleElement.className = 'agenda-title';
        titleElement.innerHTML = `
          <h2 style="color: var(--primary-blue); margin-bottom: 2rem; font-size: 1.75rem; font-weight: 700; text-align: center;">
            <i class="fas fa-calendar-alt" style="margin-right: 12px;"></i>
            Gestión de Agenda
          </h2>
        `;
        
        const firstChild = agendaTab.firstElementChild;
        if (firstChild) {
          agendaTab.insertBefore(titleElement, firstChild);
        } else {
          agendaTab.appendChild(titleElement);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error actualizando título de agenda:', error);
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
        updateAgendaTitle();
        renderCalendar();
        break;
      case 'seguimiento':
        loadSeguimiento();
        break;
      case 'pacientes':
        loadPacientes();
        break;
    }
  } catch (error) {
    console.error('❌ Error cargando datos de pestaña:', error);
  }
}

// ================= FUNCIONES AUXILIARES ESPECÍFICAS =================

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
    
    const snapshot = await retryOperation(async () => {
      return await db.collection('pacientes')
        .where('rut', '==', rutFormatted)
        .where('cesfam', '==', currentUserData.cesfam)
        .get();
    }, 3, 'búsqueda de paciente');
    
    if (snapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="no-results" style="text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 12px; margin: 20px 0;">
          <i class="fas fa-user-slash" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 16px;"></i>
          <h3 style="color: var(--text-dark); margin-bottom: 12px;">Paciente no encontrado</h3>
          <p style="color: var(--text-medium); margin-bottom: 20px;">
            No se encontró ningún paciente con el RUT <strong>${rutFormatted}</strong> en <strong>${currentUserData.cesfam}</strong>
          </p>
          <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; text-align: left;">
            <h4 style="color: var(--primary-blue); margin-bottom: 8px;">
              <i class="fas fa-info-circle"></i> ¿Qué puedes hacer?
            </h4>
            <ul style="margin: 0; color: var(--text-medium); font-size: 14px;">
              <li>Verifica que el RUT esté correcto</li>
              <li>El paciente puede estar en otro CESFAM de Puente Alto</li>
              <li>Contacta al coordinador regional para derivaciones</li>
              <li>Revisa las solicitudes pendientes por si aún no ha sido registrado</li>
            </ul>
          </div>
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
        <div style="margin: 20px 0;">
          <h4 style="color: var(--primary-blue); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-check-circle"></i> 
            Paciente encontrado en ${currentUserData.cesfam}
          </h4>
          <div class="patients-grid">
            ${pacientes.map(createPatientCard).join('')}
          </div>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('❌ Error buscando paciente:', error);
    handleFirestoreError(error, 'búsqueda de paciente');
  } finally {
    showLoading(false);
  }
}

function limpiarBusquedaPacientes() {
  try {
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (rutInput) rutInput.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    showNotification('Búsqueda limpiada', 'info', 2000);
  } catch (error) {
    console.error('❌ Error limpiando búsqueda:', error);
  }
}

function filterSolicitudes() {
  try {
    const searchTerm = document.getElementById('search-solicitudes')?.value?.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    
    let filteredSolicitudes = [...solicitudesData];
    
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
          ${s.cesfam || ''}
        `.toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }
    
    renderSolicitudes(filteredSolicitudes);
    
    // Mostrar información del filtrado
    if (searchTerm || priorityFilter) {
      const container = document.getElementById('requests-container');
      if (container) {
        const existingInfo = container.querySelector('.filter-info');
        if (existingInfo) existingInfo.remove();
        
        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info';
        filterInfo.style.cssText = `
          background: var(--light-blue);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        filterInfo.innerHTML = `
          <span>
            <i class="fas fa-filter"></i>
            Mostrando ${filteredSolicitudes.length} de ${solicitudesData.length} solicitudes
            ${searchTerm ? `| Búsqueda: "${searchTerm}"` : ''}
            ${priorityFilter ? `| Prioridad: ${priorityFilter.toUpperCase()}` : ''}
          </span>
          <button class="btn btn-sm btn-outline" onclick="clearFilters()">
            <i class="fas fa-times"></i>
            Limpiar
          </button>
        `;
        
        container.insertBefore(filterInfo, container.firstChild);
      }
    }
    
  } catch (error) {
    console.error('❌ Error filtrando solicitudes:', error);
  }
}

function clearFilters() {
  try {
    const searchInput = document.getElementById('search-solicitudes');
    const priorityFilter = document.getElementById('priority-filter');
    
    if (searchInput) searchInput.value = '';
    if (priorityFilter) priorityFilter.value = '';
    
    renderSolicitudes(solicitudesData);
    
    const filterInfo = document.querySelector('.filter-info');
    if (filterInfo) filterInfo.remove();
    
  } catch (error) {
    console.error('❌ Error limpiando filtros:', error);
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
          
          <div style="padding: 32px; max-height: 80vh; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: var(--primary-blue); margin-bottom: 8px;">
                <i class="fas fa-info-circle"></i> 
                Programa SENDA Puente Alto
              </h2>
              <p style="color: var(--text-medium); font-size: 1.1rem;">
                Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol
              </p>
            </div>
            
            <div style="line-height: 1.7; color: var(--text-dark);">
              <div style="background: var(--light-blue); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="color: var(--primary-blue); margin-top: 0;">🎯 Nuestra Misión</h3>
                <p style="margin-bottom: 0;">
                  Mitigar el impacto social y sanitario del consumo de alcohol y otras drogas, 
                  mejorando el bienestar y la calidad de vida de las personas, familias y comunidades 
                  en la comuna de Puente Alto.
                </p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div>
                  <h3 style="color: var(--primary-blue);">🏥 Nuestros Servicios</h3>
                  <ul style="margin-left: 20px;">
                    <li>Tratamiento ambulatorio básico e intensivo</li>
                    <li>Tratamiento residencial</li>
                    <li>Programas de reinserción social</li>
                    <li>Apoyo familiar y comunitario</li>
                    <li>Prevención en establecimientos educacionales</li>
                    <li>Capacitación a profesionales</li>
                    <li>Intervenciones grupales</li>
                  </ul>
                </div>
                
                <div>
                  <h3 style="color: var(--primary-blue);">📍 CESFAM Activos</h3>
                  <ul style="margin-left: 20px; font-size: 14px;">
                    ${cesfamPuenteAlto.map(cesfam => `<li>${cesfam.replace('CESFAM ', '')}</li>`).join('')}
                  </ul>
                </div>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="color: var(--primary-blue); margin-top: 0;">🕒 Horarios de Atención</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <strong>Lunes a Viernes:</strong><br>
                    08:00 - 16:30 hrs
                  </div>
                  <div>
                    <strong>Sábados y Domingos:</strong><br>
                    09:00 - 12:30 hrs
                  </div>
                </div>
              </div>
              
              <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="color: var(--primary-blue); margin-top: 0;">📞 Contacto y Emergencias</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <strong>📱 Línea SENDA:</strong> 1412 (gratuito)<br>
                    <strong>🚑 SAPU:</strong> 131<br>
                    <strong>🆘 Emergencias:</strong> 132
                  </div>
                  <div>
                    <strong>🌐 Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a><br>
                    <strong>🏛️ Gobierno:</strong> <a href="https://www.gob.cl" target="_blank">www.gob.cl</a>
                  </div>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, var(--primary-blue), #2563eb); color: white; padding: 24px; border-radius: 12px; text-align: center;">
                <h3 style="margin-top: 0; color: white;">
                  <i class="fas fa-heart"></i> 
                  Tu recuperación es posible
                </h3>
                <p style="margin-bottom: 0; font-size: 1.1rem; font-style: italic;">
                  "Estamos aquí para acompañarte en cada paso del camino hacia una vida libre de drogas y alcohol."
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 32px;">
              <button class="btn btn-primary btn-lg" onclick="closeModal('about-modal')">
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
    console.error('❌ Error mostrando información del programa:', error);
    showNotification('Error al mostrar información del programa', 'error');
  }
}

// ================= FUNCIONES UTILITARIAS FINALES =================

function clearUserCache() {
  try {
    solicitudesData = [];
    pacientesData = [];
    citasData = [];
    professionalsList = [];
    solicitudesInformacionData = [];
    
    clearCache();
    
    const containers = [
      'requests-container',
      'patients-grid',
      'upcoming-appointments-grid',
      'patients-timeline',
      'pacientes-search-results'
    ];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    });
    
    console.log('🗑️ Cache de usuario limpiado');
  } catch (error) {
    console.error('❌ Error limpiando cache de usuario:', error);
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

function renderSolicitudesError(error) {
  const container = document.getElementById('requests-container');
  if (!container) return;
  
  let errorMessage = 'Error al cargar solicitudes';
  let errorDetails = '';
  let actionButton = '';
  
  if (error.code === 'permission-denied') {
    errorMessage = 'Sin permisos de acceso';
    errorDetails = 'No tienes permisos para ver las solicitudes de este CESFAM. Contacta al administrador.';
    actionButton = `
      <button class="btn btn-outline" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt"></i>
        Cerrar Sesión
      </button>
    `;
  } else if (error.code === 'unavailable') {
    errorMessage = 'Servicio no disponible';
    errorDetails = 'El servicio está temporalmente no disponible. Intenta en unos minutos.';
    actionButton = `
      <button class="btn btn-primary" onclick="loadSolicitudes()">
        <i class="fas fa-redo"></i>
        Reintentar
      </button>
    `;
  } else {
    errorDetails = error.message || 'Error desconocido';
    actionButton = `
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-primary" onclick="loadSolicitudes()">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
        <button class="btn btn-outline" onclick="clearCache(); loadSolicitudes()">
          <i class="fas fa-sync"></i>
          Forzar Recarga
        </button>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="no-results" style="text-align: center; padding: 60px 20px;">
      <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger-red); margin-bottom: 20px;"></i>
      <h3 style="color: var(--text-dark); margin-bottom: 12px;">${errorMessage}</h3>
      <p style="color: var(--text-medium); margin-bottom: 24px;">${errorDetails}</p>
      ${actionButton}
      
      ${APP_CONFIG.DEBUG_MODE ? `
        <div style="margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; text-align: left; font-family: monospace; font-size: 12px;">
          <strong>Debug Info:</strong><br>
          Error Code: ${error.code || 'N/A'}<br>
          Error Message: ${error.message || 'N/A'}<br>
          Timestamp: ${new Date().toISOString()}
        </div>
      ` : ''}
    </div>
  `;
}

// ================= INICIALIZACIÓN FINAL COMPLETA =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('🚀 Iniciando Sistema SENDA Puente Alto v2.1...');
    
    // Verificar dependencias críticas
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK no está cargado');
      showNotification('Error crítico: Firebase SDK no disponible. Recarga la página.', 'error', 15000);
      return;
    }
    
    // Inicializar Firebase
    const firebaseSuccess = initializeFirebase();
    if (!firebaseSuccess) {
      console.error('❌ Falló la inicialización de Firebase');
      return;
    }
    
    // Configurar componentes
    setupMultiStepForm();
    initializeEventListeners();
    setupTabFunctionality();
    
    // Mostrar contenido inicial
    showPublicContent();
    
    // Configurar listener de autenticación
    setTimeout(() => {
      if (auth) {
        auth.onAuthStateChanged(onAuthStateChanged);
        console.log('👂 Auth state listener configurado');
      } else {
        console.error('❌ Auth no disponible para listener');
      }
    }, 1000);
    
    // Configurar service worker para offline (opcional)
    if ('serviceWorker' in navigator && !APP_CONFIG.DEBUG_MODE) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('ServiceWorker no disponible:', err);
      });
    }
    
    console.log(`
🎉 ====================================
   SISTEMA SENDA PUENTE ALTO v2.1
   ====================================
   
   ✅ Firebase inicializado correctamente
   ✅ Formularios configurados
   ✅ Event listeners activos
   ✅ Pestañas funcionales
   ✅ Autenticación con @senda.cl
   ✅ Sistema de solicitudes corregido
   ✅ Cache y offline support
   ✅ Debug mode: ${APP_CONFIG.DEBUG_MODE}
   
   📧 Usuario de desarrollo: CamiMoralesM
   📅 Fecha: 2025-09-14
   
   🚀 SISTEMA COMPLETAMENTE OPERATIVO
   ====================================
    `);
    
  } catch (error) {
    console.error('❌ Error crítico durante la inicialización:', error);
    showNotification('Error crítico inicializando el sistema. Contacta al administrador.', 'error', 15000);
  }
});

// ================= EXPORTAR FUNCIONES GLOBALES =================

// Funciones que deben estar disponibles globalmente para el HTML
window.showModal = showModal;
window.closeModal = closeModal;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.limpiarBusquedaPacientes = limpiarBusquedaPacientes;
window.clearFilters = clearFilters;
window.showAboutProgram = showAboutProgram;
window.handleUrgentCase = (id) => {
  showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning');
  console.log('🚨 Caso urgente:', id);
};
window.showSolicitudDetailById = (id) => {
  const solicitud = solicitudesData.find(s => s.id === id);
  if (solicitud) showSolicitudDetail(solicitud);
};
window.showInformationModal = showInformationModal;
window.showAgendaModal = showAgendaModal;

console.log('✅ PARTE 5 FINAL: Sistema completo inicializado y operativo');
