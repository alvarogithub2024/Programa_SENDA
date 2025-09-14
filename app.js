// ================= SENDA PUENTE ALTO - APP.JS PARTE 1 CORREGIDA =================
// Configuración Firebase, Variables Globales y Correcciones Aplicadas

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
let auth, db;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  auth = firebase.auth();
  db = firebase.firestore();
  
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
  "CESFAM Cardenal Raúl Silva Henríquez"
];

// Variables globales
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let currentCalendarDate = new Date(); // CORRECCIÓN: Fecha actual del sistema
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

const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 100,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true
};

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

// ================= CORRECCIÓN 1: HEADER SIN DOBLE BOTÓN =================

function showPublicContent() {
  try {
    const publicContent = document.getElementById('public-content');
    const professionalContent = document.getElementById('professional-content');
    const professionalHeader = document.getElementById('professional-header');
    const loginBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');

    if (publicContent) publicContent.style.display = 'block';
    if (professionalContent) professionalContent.style.display = 'none';
    if (professionalHeader) professionalHeader.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none'; // OCULTAR botón en header principal
    
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
    const logoutBtn = document.getElementById('logout-btn');

    if (publicContent) publicContent.style.display = 'none';
    if (professionalContent) professionalContent.style.display = 'block';
    if (professionalHeader) professionalHeader.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none'; // MANTENER OCULTO botón en header principal
    
    if (currentUserData) {
      updateProfessionalInfo();
      updateTabVisibility();
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  } catch (error) {
    console.error('❌ Error mostrando contenido profesional:', error);
  }
}

// ================= AUTENTICACIÓN CORREGIDA =================

function validateEmailSenda(email) {
  if (!email || !email.includes('@')) return false;
  return email.toLowerCase().endsWith('@senda.cl');
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

console.log('✅ PARTE 3: Configuración y variables con correcciones aplicadas');

// ================= SENDA PUENTE ALTO - APP.JS PARTE 2 CORREGIDA =================
// Autenticación con @senda.cl y Gestión de Solicitudes desde Firebase

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
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    
    if (activeTab === 'solicitudes' && hasAccessToSolicitudes()) {
      await loadSolicitudes();
    } else if (activeTab === 'pacientes') {
      await loadPacientes();
      updatePacientesSearchHTML(); // CORRECCIÓN: Actualizar HTML de búsqueda
    } else if (activeTab === 'agenda') {
      setupCalendar(); // CORRECCIÓN: Configurar calendario con fecha actual
    } else if (activeTab === 'seguimiento') {
      await loadSeguimiento();
    }
    
    await loadProfessionalsList();
    
  } catch (error) {
    console.error('❌ Error cargando datos iniciales:', error);
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

// ================= CORRECCIÓN 2: CARGAR SOLICITUDES DESDE FIREBASE =================

async function loadSolicitudes() {
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
    
    // CORRECCIÓN: Limpiar cache y forzar recarga
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    console.log('🔍 DEBUG: Iniciando carga de solicitudes para CESFAM:', currentUserData.cesfam);
    console.log('🔍 DEBUG: Usuario actual:', currentUserData);
    
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
    
    console.log('🔍 Cargando solicitudes para CESFAM:', currentUserData.cesfam);
    
    // CORRECCIÓN: Mejorar consulta de solicitudes_ingreso
    try {
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
        .get();
      
      console.log('📊 Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'solicitud',
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_ingreso:', error);
      console.error('❌ Detalles del error:', error.message);
    }
    
    // CORRECCIÓN: Mejorar consulta de reingresos
    try {
      const reingresosSnapshot = await db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
        .get();
      
      console.log('📊 Reingresos encontrados:', reingresosSnapshot.size);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'reingreso',
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando reingresos:', error);
      console.error('❌ Detalles del error:', error.message);
    }
    
    // CORRECCIÓN: Cargar todas las solicitudes de información (sin filtro de CESFAM)
    try {
      const informacionSnapshot = await db.collection('solicitudes_informacion')
        .where('estado', '==', 'pendiente_respuesta')
        .orderBy('fechaCreacion', 'desc')
        .limit(20)
        .get();
      
      console.log('📊 Solicitudes información encontradas:', informacionSnapshot.size);
      
      informacionSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'informacion',
          tipoSolicitud: 'informacion',
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_informacion:', error);
      console.error('❌ Detalles del error:', error.message);
    }
    
    // Ordenar por fecha
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    console.log('📋 Total solicitudes procesadas:', solicitudes.length);
    
    solicitudesData = solicitudes;
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    renderSolicitudes(solicitudes);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Total solicitudes cargadas: ${solicitudes.length}`);
      console.log('📋 Solicitudes por tipo:', {
        solicitudes: solicitudes.filter(s => s.tipo === 'solicitud').length,
        reingresos: solicitudes.filter(s => s.tipo === 'reingreso').length,
        informacion: solicitudes.filter(s => s.tipo === 'informacion').length
      });
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

    console.log('🎨 Renderizando solicitudes:', solicitudes.length);

    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-inbox"></i>
          <h3>No hay solicitudes pendientes</h3>
          <p>No se encontraron solicitudes pendientes para tu CESFAM: ${currentUserData.cesfam}</p>
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
    } else if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') {
      titulo = 'Solicitud de Información';
      subtitulo = `Email: ${solicitud.email || 'No disponible'}`;
      tipoIcon = 'fa-info-circle';
    } else {
      tipoIcon = 'fa-user-plus';
      if (solicitud.tipoSolicitud === 'identificado') {
        titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
        subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
      } else {
        titulo = 'Solicitud General';
        subtitulo = `Edad: ${solicitud.edad || 'No especificada'} años`;
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
      'pendiente_respuesta': 'fa-reply'
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
            ${solicitud.tipo === 'informacion' ? '<span class="request-type informacion" style="background: #f0f9ff; color: #0c4a6e; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">INFORMACIÓN</span>' : ''}
          </div>
        </div>
        
        <div class="request-body">
          ${sustanciasHtml ? `<div class="request-substances" style="margin-bottom: 8px;">${sustanciasHtml}</div>` : ''}
          ${solicitud.descripcion || solicitud.motivo ? 
            `<p class="request-description" style="color: var(--gray-700); line-height: 1.5;">${truncateText(solicitud.descripcion || solicitud.motivo, 150)}</p>` : ''}
          
          <div class="request-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--gray-600);">
            ${solicitud.cesfam ? `<div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>` : ''}
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
          ${solicitud.tipo !== 'informacion' ? 
            `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModal('${solicitud.id}')" title="Agendar cita">
              <i class="fas fa-calendar-plus"></i>
              Agendar
            </button>` : 
            `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); showInformationModal('${solicitud.id}')" title="Enviar información">
              <i class="fas fa-envelope"></i>
              Enviar Información
            </button>`
          }
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

async function handleLogout() {
  try {
    await auth.signOut();
    
    currentUser = null;
    currentUserData = null;
    clearUserCache();
    
    showNotification('Sesión cerrada correctamente', 'success');
    showPublicContent();
    
  } catch (error) {
    console.error('Error during logout:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

console.log('✅ PARTE 4: Autenticación y solicitudes corregidas');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 3 CORREGIDA =================
// Calendario con Fecha Actual, Pacientes con Botón Limpiar y Funciones Finales

// ================= CORRECCIÓN 4: CALENDARIO CON FECHA ACTUAL =================

function setupCalendar() {
  try {
    // CORRECCIÓN: Usar fecha actual del sistema (septiembre 2025)
    const now = new Date();
    currentCalendarDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes actual
    
    renderCalendar();
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Calendario configurado con fecha actual:', 
        currentCalendarDate.toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long' 
        })
      );
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
    
    // CORRECCIÓN: Mostrar mes y año correctos
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    calendarGrid.innerHTML = '';
    
    const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    // CORRECCIÓN: Usar fecha actual real del sistema
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
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (!isCurrentMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  if (isWeekend) {
    dayElement.classList.add('weekend');
    dayElement.style.backgroundColor = '#f8f9ff';
  }
  
  dayElement.innerHTML = `
    <div class="calendar-day-number">${date.getDate()}</div>
    <div class="calendar-appointments" id="appointments-${date.toISOString().split('T')[0]}"></div>
  `;
  
  if (isCurrentMonth && !isPast) {
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
    console.log(`🔍 Cargando citas para ${month + 1}/${year} - CESFAM: ${currentUserData.cesfam}`);
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfMonth)
      .where('fecha', '<=', endOfMonth)
      .get();
    
    console.log(`📊 Citas encontradas en el mes: ${appointmentsSnapshot.size}`);
    
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
          
          appointmentEl.style.cssText = `
            background: var(--primary-blue);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
          `;
          
          appointmentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showPatientAppointmentInfo(appointment);
          });
          
          container.appendChild(appointmentEl);
        });
        
        if (appointments.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.className = 'calendar-appointment more';
          moreEl.textContent = `+${appointments.length - 3} más`;
          moreEl.style.cssText = `
            background: var(--gray-400);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 9px;
            text-align: center;
            cursor: pointer;
          `;
          
          moreEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const date = new Date(dateString);
            selectCalendarDay(date);
          });
          
          container.appendChild(moreEl);
        }
      }
    });
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Citas del mes cargadas y mostradas: ${appointmentsSnapshot.size}`);
    }
    
  } catch (error) {
    console.error('❌ Error cargando citas del mes:', error);
  }
}

// ================= CORRECCIÓN 3: BOTÓN LIMPIAR BÚSQUEDA RUT =================

function updatePacientesSearchHTML() {
  const pacientesSearchContainer = document.querySelector('.pacientes-search .search-rut');
  if (pacientesSearchContainer) {
    // Verificar si ya tiene el botón limpiar
    const existingCleanBtn = pacientesSearchContainer.querySelector('#limpiar-busqueda-btn');
    if (!existingCleanBtn) {
      const cleanBtn = document.createElement('button');
      cleanBtn.id = 'limpiar-busqueda-btn';
      cleanBtn.className = 'btn btn-outline';
      cleanBtn.innerHTML = '<i class="fas fa-eraser"></i> Limpiar';
      pacientesSearchContainer.appendChild(cleanBtn);
    }
    
    // Reactivar event listeners
    setupPacientesSearchListeners();
  }
}

function setupPacientesSearchListeners() {
  const searchInput = document.getElementById('search-pacientes-rut');
  const buscarBtn = document.getElementById('buscar-paciente-btn');
  const limpiarBtn = document.getElementById('limpiar-busqueda-btn');
  
  if (searchInput) {
    // Remover listeners existentes para evitar duplicados
    searchInput.removeEventListener('keypress', handleSearchKeypress);
    searchInput.removeEventListener('input', handleSearchInput);
    
    searchInput.addEventListener('keypress', handleSearchKeypress);
    searchInput.addEventListener('input', handleSearchInput);
  }
  
  if (buscarBtn) {
    buscarBtn.removeEventListener('click', buscarPacientePorRUT);
    buscarBtn.addEventListener('click', buscarPacientePorRUT);
  }
  
  if (limpiarBtn) {
    limpiarBtn.removeEventListener('click', limpiarBusquedaPaciente);
    limpiarBtn.addEventListener('click', limpiarBusquedaPaciente);
  }
}

function handleSearchKeypress(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarPacientePorRUT();
  }
}

function handleSearchInput(e) {
  e.target.value = formatRUT(e.target.value);
}

// NUEVA: Función para limpiar búsqueda
function limpiarBusquedaPaciente() {
  try {
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (rutInput) {
      rutInput.value = '';
      rutInput.focus();
    }
    
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
    
    showNotification('Búsqueda limpiada', 'info', 2000);
    
  } catch (error) {
    console.error('Error limpiando búsqueda:', error);
  }
}

// Búsqueda mejorada de pacientes por RUT en CESFAM
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
    
    // Buscar en CESFAM específico
    const snapshot = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (snapshot.empty) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <h3>Paciente no encontrado en tu CESFAM</h3>
          <p>No se encontró ningún paciente con el RUT ${rutFormatted} en ${currentUserData.cesfam}</p>
          <div style="margin-top: 16px; padding: 16px; background: var(--light-blue); border-radius: 8px;">
            <h4 style="color: var(--primary-blue); margin-bottom: 8px;">¿El paciente está en otro CESFAM?</h4>
            <p style="margin: 0; font-size: 14px; color: var(--text-medium);">
              Si el paciente está registrado en otro CESFAM de Puente Alto, 
              deberás coordinar su traslado o derivación a través del coordinador regional.
            </p>
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
        <h4 style="color: var(--primary-blue); margin-bottom: 16px;">
          <i class="fas fa-check-circle"></i> 
          Paciente encontrado en ${currentUserData.cesfam}
        </h4>
        <div class="patients-grid">
          ${pacientes.map(createPatientCard).join('')}
        </div>
      `;
    }
    
  } catch (error) {
    console.error('❌ Error buscando paciente:', error);
    showNotification('Error al buscar paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ================= GESTIÓN DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    const cacheKey = `pacientes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    console.log('🔍 Cargando pacientes para CESFAM:', currentUserData.cesfam);
    
    const pacientesSnapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();
    
    console.log('📊 Pacientes encontrados:', pacientesSnapshot.size);
    
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
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Total pacientes cargados: ${pacientes.length}`);
    }
    
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

    console.log('🎨 Renderizando pacientes:', pacientes.length);

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

    grid.innerHTML = pacientes.map(paciente => createPatientCard(paciente)).join('');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Renderizados ${pacientes.length} pacientes`);
    }
  } catch (error) {
    console.error('❌ Error rendering pacientes:', error);
  }
}

function createPatientCard(paciente) {
  const fecha = formatDate(paciente.fechaCreacion);
  const estado = paciente.estado || 'activo';
  
  return `
    <div class="patient-card">
      <div class="patient-header">
        <div class="patient-info">
          <h3>${paciente.nombre} ${paciente.apellidos || ''}</h3>
          <p>RUT: ${paciente.rut}</p>
        </div>
        <span class="patient-status ${estado}">
          ${estado.toUpperCase()}
        </span>
      </div>
      <div class="patient-details">
        <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
        <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
        <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
        <div><strong>Registrado:</strong> ${fecha}</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-primary" onclick="showPatientDetail('${paciente.id}')">
          <i class="fas fa-eye"></i>
          Ver Ficha
        </button>
      </div>
    </div>
  `;
}

// ================= EVENT LISTENERS CORREGIDOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutProfessionalBtn = document.getElementById('logout-professional'); // SOLO este botón
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
        showModal('login-modal');
      });
    }

    // CORRECCIÓN: Solo un botón de logout
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
      reentryProgramBtn.addEventListener('click', () => {
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
      nuevaCitaBtn.addEventListener('click', () => createNuevaCitaModal());
    }

    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('✅ Event listeners inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando event listeners:', error);
  }
}

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

        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          
          if (targetTab === 'agenda') {
            updateAgendaTitle();
          }
          
          loadTabData(targetTab);
        }
      });
    });

    console.log('✅ Funcionalidad de tabs configurada');
  } catch (error) {
    console.error('❌ Error configurando tabs:', error);
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
    console.error('Error updating agenda title:', error);
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
        setupCalendar(); // CORRECCIÓN: Reconfigurar calendario con fecha actual
        break;
      case 'seguimiento':
        loadSeguimiento();
        break;
      case 'pacientes':
        loadPacientes();
        updatePacientesSearchHTML(); // CORRECCIÓN: Actualizar HTML de búsqueda
        break;
    }
  } catch (error) {
    console.error('Error loading tab data:', error);
  }
}

// ================= FUNCIONES UTILITARIAS FINALES =================

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

// ================= INICIALIZACIÓN FINAL CORREGIDA =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    setupMultiStepForm();
    initializeEventListeners();
    setupTabFunctionality();
    setupCalendar(); // CORRECCIÓN: Calendario con fecha actual (septiembre 2025)
    
    // CORRECCIÓN: Siempre iniciar mostrando contenido público
    showPublicContent();
    
    // El estado de autenticación determinará si mostrar contenido profesional
    auth.onAuthStateChanged(onAuthStateChanged);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🎉 SENDA Puente Alto - Sistema completo inicializado con correcciones');
      console.log('📅 Fecha actual del sistema:', new Date().toLocaleDateString('es-CL'));
      console.log('📅 Calendario inicializado para:', new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }));
    }
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});

// EXPORTAR FUNCIONES GLOBALES
window.showPatientDetail = showPatientDetail;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.limpiarBusquedaPaciente = limpiarBusquedaPaciente;
window.createNuevaCitaModal = createNuevaCitaModal;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;
window.showSolicitudDetailById = (id) => {
  const solicitud = solicitudesData.find(s => s.id === id);
  if (solicitud) showSolicitudDetail(solicitud);
};
window.showSolicitudDetail = showSolicitudDetail;
window.showAgendaModal = showAgendaModal;
window.showInformationModal = showInformationModal;
window.handleUrgentCase = handleUrgentCase;
window.showAboutProgram = showAboutProgram;
window.showModal = showModal;
window.closeModal = closeModal;
window.showPatientAppointmentInfo = showPatientAppointmentInfo;
window.selectAgendaTimeSlot = selectAgendaTimeSlot;

console.log(`
🎉 ====================================
   SISTEMA SENDA PUENTE ALTO v2.2
   ====================================
   
   ✅ CORRECCIÓN 1: Header único (sin doble cerrar sesión)
   ✅ CORRECCIÓN 2: Solicitudes cargan desde Firebase
   ✅ CORRECCIÓN 3: Botón limpiar búsqueda RUT
   ✅ CORRECCIÓN 4: Calendario con fecha actual (septiembre 2025)
   
   🚀 TODAS LAS CORRECCIONES APLICADAS
   ====================================
`);

console.log('✅ PARTE 5 FINAL: Sistema completo con todas las correcciones implementadas');
