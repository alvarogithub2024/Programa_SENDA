// ================= SENDA PUENTE ALTO - SISTEMA CORREGIDO CON FORMULARIO ORIGINAL APP14 =================
// PARTE 1/4: Configuración, Variables Globales y Formulario Original - CORREGIDO

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
let solicitudesInformacionData = [];

// CORREGIDO: Configuración de horarios
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
// ================= PARTE 2/4: Eventos, Autenticación y Carga de Datos =================

// ================= GESTIÓN DE EVENTOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnPro = document.getElementById('logout-btn-professional');
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
        showModal('login-modal');
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutBtnPro) {
      logoutBtnPro.style.display = 'inline-flex';
      logoutBtnPro.addEventListener('click', handleLogout);
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
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    if (activeTab === 'solicitudes' && hasAccessToSolicitudes()) {
      await loadSolicitudes();
    } else if (activeTab === 'pacientes') {
      await loadPacientes();
    } else if (activeTab === 'agenda') {
      await loadTodayAppointments();
      renderCalendar(); // CORREGIDO: Cargar calendario inmediatamente
    } else if (activeTab === 'seguimiento') {
      await loadSeguimiento();
    }
    await loadProfessionalsList();
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
    const logoutBtnPro = document.getElementById('logout-btn-professional');
    if (publicContent) publicContent.style.display = 'block';
    if (professionalContent) professionalContent.style.display = 'none';
    if (professionalHeader) professionalHeader.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (logoutBtnPro) logoutBtnPro.style.display = 'none';
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
    const logoutBtnPro = document.getElementById('logout-btn-professional');
    if (publicContent) publicContent.style.display = 'none';
    if (professionalContent) professionalContent.style.display = 'block';
    if (professionalHeader) professionalHeader.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtnPro) logoutBtnPro.style.display = 'inline-flex';
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
// ================= CARGA CORREGIDA DE SOLICITUDES DESDE FIREBASE =================

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
    
    // CORREGIDO: Limpiar cache antes de cargar nuevos datos
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
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
    
    // CORREGIDO: Cargar solicitudes_ingreso SIN filtro de estado
    try {
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
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
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    // CORREGIDO: Cargar reingresos
    try {
      const reingresosSnapshot = await db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
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
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    // CORREGIDO: Cargar solicitudes_informacion
    try {
      const informacionSnapshot = await db.collection('solicitudes_informacion')
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
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
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    // Ordenar por fecha de creación (más recientes primero)
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
          <h3>No hay solicitudes</h3>
          <p>No se encontraron solicitudes para tu CESFAM: ${currentUserData.cesfam}</p>
          <button class="btn btn-primary mt-4" onclick="loadSolicitudes()">
            <i class="fas fa-redo"></i>
            Actualizar
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = solicitudes.map(solicitud => createSolicitudCard(solicitud)).join('');
    
    // CORREGIDO: Agregar event listeners a las tarjetas
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
      'en_proceso': 'fa-spinner',
      'agendada': 'fa-calendar-check',
      'completada': 'fa-check-circle',
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
            </button>` : ''
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

// ================= CARGA CORREGIDA DE PACIENTES DESDE FIREBASE =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    // CORREGIDO: Limpiar cache antes de cargar
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
        <button class="btn btn-sm btn-success" onclick="downloadPatientPDF('${paciente.id}')">
          <i class="fas fa-download"></i>
          Descargar PDF
        </button>
      </div>
    </div>
  `;
}
// ================= PARTE 4/4: Solicitudes, Agenda, Pacientes, Cambios Solicitados =================

// =================== PACIENTES ===================

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

    grid.innerHTML = pacientes.map(paciente => createPatientCard(paciente)).join('');
  } catch (error) {
    console.error('❌ Error rendering pacientes:', error);
  }
}

// Quitar botón PDF en ficha de paciente
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

// =================== SOLICITUDES - MODALS Y ACCIÓN DE AGENDAR =================

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
  // === Si es información, botón "Enviar Información" ===
  const isInfo = solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion';
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
                  <div><strong>CESFAM:</strong> ${solicitud.cesfam || 'No especificado'}</div>
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
                  ${solicitud.sustancias.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
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
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
            ${!isInfo ? `
              <button class="btn btn-success" onclick="showAgendaModal('${solicitud.id}')">
                <i class="fas fa-calendar-plus"></i>
                Agendar Cita
              </button>
            ` : `
              <button class="btn btn-success" onclick="enviarInformacionYEliminar('${solicitud.id}','${solicitud.email}')">
                <i class="fas fa-paper-plane"></i>
                Enviar Información
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============= MODAL PARA AGENDAR DESDE DETALLE DE SOLICITUD =============

function showAgendaModal(solicitudId) {
  const solicitud = solicitudesData.find(s => s.id === solicitudId);
  if (!solicitud) {
    showNotification("Solicitud no encontrada", "error");
    return;
  }

  let nombrePaciente = solicitud.nombre || '';
  let rutPaciente = solicitud.rut || '';
  let cesfamPaciente = solicitud.cesfam || (currentUserData ? currentUserData.cesfam : '');

  // Modal con selección de profesional y fecha/hora
  let professionals = professionalsList || [];
  let profOptions = professionals.map(p => 
    `<option value="${p.id}" data-nombre="${p.nombre} ${p.apellidos}" data-profession="${p.profession}">
      ${p.nombre} ${p.apellidos} - ${getProfessionName(p.profession)}
    </option>`
  ).join('');
  let today = new Date().toISOString().split('T')[0];

  const modalHtml = `
    <div class="modal-overlay temp-modal" id="agenda-cita-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('agenda-cita-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-plus"></i> Agendar Cita</h2>
          <form id="agenda-cita-form">
            <div class="form-group">
              <label class="form-label">Profesional *</label>
              <select class="form-select" id="agenda-cita-professional" required>
                <option value="">Seleccionar profesional...</option>
                ${profOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input type="date" class="form-input" id="agenda-cita-date" min="${today}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hora *</label>
              <input type="time" class="form-input" id="agenda-cita-time" required>
            </div>
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="closeModal('agenda-cita-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success">
                <i class="fas fa-calendar-check"></i>
                Crear Cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  showModal('agenda-cita-modal');
  document.getElementById('agenda-cita-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
      const profSelect = document.getElementById('agenda-cita-professional');
      const dateInput = document.getElementById('agenda-cita-date');
      const timeInput = document.getElementById('agenda-cita-time');
      const profId = profSelect.value;
      const fecha = dateInput.value;
      const hora = timeInput.value;
      if (!profId || !fecha || !hora) {
        showNotification("Completa profesional, fecha y hora", "warning");
        return;
      }
      const selectedProf = professionalsList.find(p => p.id === profId);
      const citaData = {
        profesionalId: profId,
        profesionalNombre: selectedProf ? (selectedProf.nombre + " " + selectedProf.apellidos) : "",
        tipoProfesional: selectedProf ? selectedProf.profession : "",
        pacienteNombre: nombrePaciente,
        pacienteRut: formatRUT(rutPaciente),
        fecha: new Date(`${fecha}T${hora}`),
        estado: "programada",
        tipo: "cita_desde_solicitud",
        cesfam: cesfamPaciente,
        observaciones: "",
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: currentUser.uid
      };
      await db.collection("citas").add(citaData);
      showNotification("Cita creada correctamente", "success");
      closeModal('agenda-cita-modal');
      renderCalendar();
      if (selectedCalendarDate) loadDayAppointments(selectedCalendarDate);
    } catch (err) {
      showNotification("Error al crear cita: " + err.message, "error");
    }
  });
}

// ======= ENVIAR INFORMACIÓN Y ELIMINAR SOLICITUD DE INFORMACIÓN ===========

async function enviarInformacionYEliminar(solicitudId, email) {
  try {
    if (!confirm("¿Enviar información y eliminar esta solicitud?")) return;
    showLoading(true, "Enviando información...");
    // Simular envío de correo (en real, usar Cloud Function o API backend)
    await new Promise(res => setTimeout(res, 1000)); // Simulación
    // Eliminar la solicitud de información
    await db.collection("solicitudes_informacion").doc(solicitudId).delete();
    closeModal("solicitud-detail-modal");
    showNotification("Información enviada y solicitud eliminada", "success");
    // Refrescar solicitudes
    loadSolicitudes();
  } catch (err) {
    showNotification("Error: " + err.message, "error");
  } finally {
    showLoading(false);
  }
}

// =============== INICIO EN PÁGINA PRINCIPAL SIEMPRE ==================
document.addEventListener('DOMContentLoaded', function() {
  try {
    setupMultiStepForm();
    initializeEventListeners();
    setupTabFunctionality();
    setupCalendar();
    auth.onAuthStateChanged(onAuthStateChanged);
    // Siempre mostrar pública al iniciar
    showPublicContent();
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
    }
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});
