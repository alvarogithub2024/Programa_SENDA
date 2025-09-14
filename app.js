// ================= SENDA PUENTE ALTO - APP.JS PARTE 1 COMPLETA =================
// Configuración Firebase, Variables Globales y Formularios

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

// ================= FORMULARIO MULTI-STEP =================

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

    // Listeners para tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', () => {
        const tipoSolicitud = input.value;
        
        if (tipoSolicitud === 'informacion') {
          maxFormStep = 1;
          updateProgressIndicator(1, 1);
          
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'block';
          if (basicInfoContainer) basicInfoContainer.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          if (submitBtn) submitBtn.style.display = 'inline-flex';
          
        } else if (tipoSolicitud === 'identificado') {
          maxFormStep = 4;
          updateProgressIndicator(1, 4);
          
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'none';
          if (basicInfoContainer) basicInfoContainer.style.display = 'block';
          if (nextBtn) nextBtn.style.display = 'inline-flex';
          if (submitBtn) submitBtn.style.display = 'none';
        }
      });
    });

    // Listeners para motivación
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

    // Botón específico para envío de información
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

    const reentryForm = document.getElementById('reentry-form');
    if (reentryForm) {
      reentryForm.addEventListener('submit', handleReentrySubmit);
    }

    console.log('✅ Formulario multi-step configurado');
    
  } catch (error) {
    console.error('❌ Error configurando formulario multi-step:', error);
  }
}

function resetForm() {
  try {
    const form = document.getElementById('patient-form');
    if (form) {
      form.reset();
      goToStep(1);
      
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
      
      maxFormStep = 4;
      updateProgressIndicator(1, 4);
      
      const infoEmailContainer = document.getElementById('info-email-container');
      const basicInfoContainer = document.getElementById('basic-info-container');
      const nextBtn = document.getElementById('next-step-1');
      const submitBtn = document.getElementById('submit-step-1');
      
      if (infoEmailContainer) infoEmailContainer.style.display = 'none';
      if (basicInfoContainer) basicInfoContainer.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.style.display = 'none';
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🔧 Formulario reseteado');
    }
  } catch (error) {
    console.error('❌ Error reseteando formulario:', error);
  }
}

console.log('✅ PARTE 1: Configuración y formularios cargados');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 2 COMPLETA =================
// Autenticación con @senda.cl, Eventos y Gestión de Estado

// ================= CORRECCIÓN: HEADER SIN DOBLE BOTÓN =================

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

// ================= GESTIÓN DE EVENTOS CORREGIDA =================

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

// ================= AUTENTICACIÓN CON @senda.cl =================

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
      // CORRECCIÓN: Configurar búsqueda después de cargar
      setTimeout(() => {
        updatePacientesSearchHTML();
      }, 500);
    } else if (activeTab === 'agenda') {
      setupCalendar();
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

console.log('✅ PARTE 2: Autenticación con correcciones aplicadas');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 3 COMPLETA =================
// Solicitudes desde Firebase y Calendario con Fecha Actual

// ================= CORRECCIÓN: CARGAR SOLICITUDES DESDE FIREBASE =================

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
            Cargando solicitudes desde Firebase...
          </div>
        `;
      }
    }
    
    console.log('🔍 DEBUG: Iniciando carga de solicitudes');
    console.log('🔍 DEBUG: Usuario actual:', currentUserData);
    console.log('🔍 DEBUG: CESFAM:', currentUserData?.cesfam);
    
    const solicitudes = [];
    
    // CORRECCIÓN: Consulta sin filtro de CESFAM para probar
    try {
      console.log('📊 Intentando cargar solicitudes_ingreso...');
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .orderBy('fechaCreacion', 'desc')
        .limit(20)
        .get();
      
      console.log('📊 Solicitudes_ingreso encontradas (total):', solicitudesSnapshot.size);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('📄 Solicitud encontrada:', {
          id: doc.id,
          cesfam: data.cesfam,
          nombre: data.nombre,
          fechaCreacion: data.fechaCreacion
        });
        
        // Filtrar por CESFAM en JavaScript si es necesario
        if (!currentUserData.cesfam || data.cesfam === currentUserData.cesfam) {
          solicitudes.push({
            id: doc.id,
            tipo: 'solicitud',
            ...data
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Error específico en solicitudes_ingreso:', error);
      console.error('❌ Código de error:', error.code);
      console.error('❌ Mensaje de error:', error.message);
    }
    
    // CORRECCIÓN: Consulta reingresos sin filtro
    try {
      console.log('📊 Intentando cargar reingresos...');
      const reingresosSnapshot = await db.collection('reingresos')
        .orderBy('fechaCreacion', 'desc')
        .limit(20)
        .get();
      
      console.log('📊 Reingresos encontrados (total):', reingresosSnapshot.size);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('📄 Reingreso encontrado:', {
          id: doc.id,
          cesfam: data.cesfam,
          nombre: data.nombre
        });
        
        if (!currentUserData.cesfam || data.cesfam === currentUserData.cesfam) {
          solicitudes.push({
            id: doc.id,
            tipo: 'reingreso',
            ...data
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Error específico en reingresos:', error);
    }
    
    // CORRECCIÓN: Consulta información sin filtro
    try {
      console.log('📊 Intentando cargar solicitudes_informacion...');
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
      console.error('❌ Error específico en solicitudes_informacion:', error);
    }
    
    console.log('📋 Total solicitudes procesadas:', solicitudes.length);
    console.log('📋 Solicitudes por tipo:', {
      solicitudes: solicitudes.filter(s => s.tipo === 'solicitud').length,
      reingresos: solicitudes.filter(s => s.tipo === 'reingreso').length,
      informacion: solicitudes.filter(s => s.tipo === 'informacion').length
    });
    
    // Si no hay solicitudes, mostrar mensaje específico
    if (solicitudes.length === 0) {
      console.log('⚠️ No se encontraron solicitudes');
      await testFirebaseConnection();
    }
    
    solicitudesData = solicitudes;
    renderSolicitudes(solicitudes);
    
  } catch (error) {
    console.error('❌ Error general cargando solicitudes:', error);
    renderSolicitudesError(error);
  }
}

// NUEVA: Función para probar conexión a Firebase
async function testFirebaseConnection() {
  try {
    console.log('🔍 Probando conexión a Firebase...');
    
    // Probar conexión básica
    const testDoc = await db.collection('test').limit(1).get();
    console.log('✅ Conexión a Firebase exitosa');
    
    // Probar cada colección individualmente
    const collections = ['solicitudes_ingreso', 'reingresos', 'solicitudes_informacion'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`✅ Colección ${collectionName}: ${snapshot.size} documentos encontrados`);
      } catch (error) {
        console.error(`❌ Error en colección ${collectionName}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error probando conexión a Firebase:', error);
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

// ================= CORRECCIÓN: CALENDARIO CON FECHA ACTUAL (14 SEPTIEMBRE 2025) =================

function setupCalendar() {
  try {
    // CORRECCIÓN: Usar fecha actual del sistema (14 septiembre 2025, 16:38:22)
    const now = new Date(); // Esto da 14 septiembre 2025
    currentCalendarDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primer día del mes actual
    
    renderCalendar();
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Calendario configurado con fecha actual:', 
        currentCalendarDate.toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long' 
        })
      );
      console.log('📅 Fecha y hora actual:', now.toLocaleString('es-CL'));
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
    
    // CORRECCIÓN: Mostrar mes y año correctos (Septiembre 2025)
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
    
    // CORRECCIÓN: Usar fecha actual real del sistema (14 septiembre 2025)
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
    
    console.log('📅 Calendario renderizado para:', monthNames[month], year);
    console.log('📅 Fecha de hoy marcada:', today.toLocaleDateString('es-CL'));
    
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
  if (isToday) {
    dayElement.classList.add('today');
    console.log('📅 Día de hoy encontrado:', date.toLocaleDateString('es-CL'));
  }
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

function showPatientAppointmentInfo(appointment) {
  try {
    const infoModal = createPatientAppointmentInfoModal(appointment);
    document.body.insertAdjacentHTML('beforeend', infoModal);
    showModal('patient-appointment-info-modal');
  } catch (error) {
    console.error('Error showing patient appointment info:', error);
    showNotification('Error al mostrar información del paciente', 'error');
  }
}

function createPatientAppointmentInfoModal(appointment) {
  const fecha = appointment.fecha.toDate();
  const fechaStr = fecha.toLocaleDateString('es-CL');
  const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="modal-overlay temp-modal" id="patient-appointment-info-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('patient-appointment-info-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-check"></i> Información de Cita</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
              ${appointment.pacienteNombre}
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div><strong>RUT:</strong> ${appointment.pacienteRut || 'No disponible'}</div>
              <div><strong>Teléfono:</strong> ${appointment.pacienteTelefono || 'No disponible'}</div>
              <div><strong>Fecha:</strong> ${fechaStr}</div>
              <div><strong>Hora:</strong> ${horaStr}</div>
              <div><strong>Profesional:</strong> ${appointment.profesionalNombre}</div>
              <div><strong>Tipo:</strong> ${getProfessionName(appointment.tipoProfesional)}</div>
            </div>
            
            ${appointment.observaciones ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <strong>Observaciones:</strong>
                <p style="margin: 8px 0 0 0; font-style: italic;">${appointment.observaciones}</p>
              </div>` : ''
            }
          </div>
          
          <div style="text-align: center;">
            <button class="btn btn-primary" onclick="closeModal('patient-appointment-info-modal')">
              <i class="fas fa-check"></i>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

console.log('✅ PARTE 3: Solicitudes Firebase y calendario actual (Septiembre 2025) completados');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 4 COMPLETA =================
// Pacientes con Búsqueda Corregida y Botón Limpiar Funcional

// ================= CORRECCIÓN: BOTÓN LIMPIAR BÚSQUEDA RUT =================

function updatePacientesSearchHTML() {
  try {
    const pacientesSearchContainer = document.querySelector('.pacientes-search .search-rut');
    if (!pacientesSearchContainer) {
      console.error('❌ No se encontró el container de búsqueda de pacientes');
      return;
    }
    
    // Verificar si ya tiene el botón limpiar
    let existingCleanBtn = document.getElementById('limpiar-busqueda-btn');
    
    if (!existingCleanBtn) {
      console.log('➕ Agregando botón limpiar');
      
      const cleanBtn = document.createElement('button');
      cleanBtn.id = 'limpiar-busqueda-btn';
      cleanBtn.className = 'btn btn-outline';
      cleanBtn.innerHTML = '<i class="fas fa-eraser"></i> Limpiar';
      cleanBtn.type = 'button'; // IMPORTANTE: Prevenir submit
      
      pacientesSearchContainer.appendChild(cleanBtn);
      existingCleanBtn = cleanBtn;
    }
    
    // CORRECCIÓN: Reactivar event listeners
    setupPacientesSearchListeners();
    
    console.log('✅ HTML de búsqueda de pacientes actualizado');
    
  } catch (error) {
    console.error('❌ Error actualizando HTML de búsqueda:', error);
  }
}

function setupPacientesSearchListeners() {
  try {
    const searchInput = document.getElementById('search-pacientes-rut');
    const buscarBtn = document.getElementById('buscar-paciente-btn');
    const limpiarBtn = document.getElementById('limpiar-busqueda-btn');
    
    console.log('🔧 Configurando listeners de búsqueda');
    console.log('🔧 Search input:', !!searchInput);
    console.log('🔧 Buscar btn:', !!buscarBtn);
    console.log('🔧 Limpiar btn:', !!limpiarBtn);
    
    if (searchInput) {
      // Limpiar listeners existentes
      searchInput.removeEventListener('keypress', handleSearchKeypress);
      searchInput.removeEventListener('input', handleSearchInput);
      
      // Agregar nuevos listeners
      searchInput.addEventListener('keypress', handleSearchKeypress);
      searchInput.addEventListener('input', handleSearchInput);
      console.log('✅ Listeners agregados al input de búsqueda');
    }
    
    if (buscarBtn) {
      buscarBtn.removeEventListener('click', buscarPacientePorRUT);
      buscarBtn.addEventListener('click', buscarPacientePorRUT);
      console.log('✅ Listener agregado al botón buscar');
    }
    
    if (limpiarBtn) {
      // CORRECCIÓN: Limpiar listeners anteriores
      limpiarBtn.removeEventListener('click', limpiarBusquedaPaciente);
      
      // Agregar nuevo listener
      limpiarBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🧹 Botón limpiar clickeado');
        limpiarBusquedaPaciente();
      });
      
      console.log('✅ Listener agregado al botón limpiar');
    } else {
      console.error('❌ No se encontró el botón limpiar');
    }
    
  } catch (error) {
    console.error('❌ Error configurando listeners:', error);
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

// CORRECCIÓN: Función limpiar mejorada
function limpiarBusquedaPaciente() {
  try {
    console.log('🧹 Ejecutando limpiar búsqueda');
    
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (rutInput) {
      rutInput.value = '';
      rutInput.focus();
      console.log('✅ Input limpiado y enfocado');
    } else {
      console.error('❌ No se encontró el input de RUT');
    }
    
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
      console.log('✅ Resultados limpiados');
    } else {
      console.error('❌ No se encontró el container de resultados');
    }
    
    showNotification('Búsqueda limpiada correctamente', 'success', 2000);
    
  } catch (error) {
    console.error('❌ Error limpiando búsqueda:', error);
    showNotification('Error al limpiar búsqueda', 'error');
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
    
    // CORRECCIÓN: Configurar búsqueda después de cargar
    setTimeout(() => {
      updatePacientesSearchHTML();
      console.log('✅ Configuración de búsqueda de pacientes completada');
    }, 1000);
    
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

async function showPatientDetail(pacienteId) {
  try {
    showLoading(true, 'Cargando ficha del paciente...');
    
    const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
    
    if (!pacienteDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const paciente = {
      id: pacienteDoc.id,
      ...pacienteDoc.data()
    };
    
    const detailModal = createPatientDetailModal(paciente);
    document.body.insertAdjacentHTML('beforeend', detailModal);
    showModal('patient-detail-modal');
    
  } catch (error) {
    console.error('❌ Error loading patient detail:', error);
    showNotification('Error al cargar ficha del paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function createPatientDetailModal(paciente) {
  const fechaCreacion = formatDate(paciente.fechaCreacion);
  const fechaPrimeraAtencion = paciente.fechaPrimeraAtencion ? formatDate(paciente.fechaPrimeraAtencion) : 'No registrada';
  
  return `
    <div class="modal-overlay temp-modal" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-user-md"></i> Ficha del Paciente</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
              <div>
                <h3 style="margin: 0; color: var(--primary-blue);">
                  ${paciente.nombre} ${paciente.apellidos || ''}
                </h3>
                <p style="margin: 4px 0; font-weight: 500;">RUT: ${paciente.rut}</p>
              </div>
              <span class="patient-status ${paciente.estado || 'activo'}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                ${(paciente.estado || 'activo').toUpperCase()}
              </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Datos Personales</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                  <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
                  <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                  <div><strong>Dirección:</strong> ${paciente.direccion || 'No disponible'}</div>
                </div>
              </div>
              
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Información Clínica</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>CESFAM:</strong> ${paciente.cesfam}</div>
                  <div><strong>Prioridad:</strong> <span style="color: ${getPriorityColor(paciente.prioridad || 'media')}; font-weight: bold;">${(paciente.prioridad || 'media').toUpperCase()}</span></div>
                  <div><strong>Origen:</strong> ${paciente.origen || 'No especificado'}</div>
                  <div><strong>Motivación inicial:</strong> ${paciente.motivacionInicial || 'No registrada'}/10</div>
                </div>
              </div>
            </div>
            
            ${paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0 ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias Problemáticas</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${paciente.sustanciasProblematicas.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                </div>
              </div>` : ''
            }
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5); font-size: 12px; color: var(--gray-600);">
              <div><strong>Fecha de registro:</strong> ${fechaCreacion}</div>
              <div><strong>Primera atención:</strong> ${fechaPrimeraAtencion}</div>
              ${paciente.citaInicialId ? `<div><strong>Cita inicial ID:</strong> ${paciente.citaInicialId}</div>` : ''}
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="closeModal('patient-detail-modal')">
              <i class="fas fa-check"></i>
              Cerrar
            </button>
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

console.log('✅ PARTE 4: Pacientes con botón limpiar corregido completado');
// ================= SENDA PUENTE ALTO - APP.JS PARTE 5 COMPLETA =================
// Nueva Cita con Fecha Actual (14 Septiembre 2025) y Sin Duplicados

// ================= CORRECCIÓN: NUEVA CITA CON FECHA ACTUAL Y SIN DUPLICADOS =================

function createNuevaCitaModal() {
  try {
    const nuevaCitaModal = `
      <div class="modal-overlay temp-modal" id="nueva-cita-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-calendar-plus"></i> Nueva Cita</h2>
            
            <form id="nueva-cita-form">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="form-group">
                  <label class="form-label">Nombre del Paciente *</label>
                  <input type="text" class="form-input" id="nueva-cita-nombre" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label">RUT *</label>
                  <input type="text" class="form-input" id="nueva-cita-rut" placeholder="12.345.678-9" required>
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
                  <input type="date" class="form-input" id="nueva-cita-date" required>
                </div>
              </div>
              
              <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
                <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                  <i class="fas fa-clock"></i> Horarios Disponibles
                </h4>
                <div class="time-slots-grid" id="nueva-cita-time-slots-grid">
                  <!-- Los slots de tiempo se cargarán aquí -->
                </div>
              </div>
              
              <div class="form-group" style="margin-top: 24px;">
                <label class="form-label">Observaciones</label>
                <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
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
    
    document.body.insertAdjacentHTML('beforeend', nuevaCitaModal);
    showModal('nueva-cita-modal');
    
    // CORRECCIÓN: Configurar inmediatamente después de crear el modal
    setTimeout(() => {
      loadProfessionalsForNuevaCita();
      setupNuevaCitaFormListeners();
    }, 100);
    
  } catch (error) {
    console.error('Error creating nueva cita modal:', error);
    showNotification('Error al abrir modal de nueva cita', 'error');
  }
}

function setupNuevaCitaFormListeners() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const citaDate = document.getElementById('nueva-cita-date');
    const citaForm = document.getElementById('nueva-cita-form');
    const rutInput = document.getElementById('nueva-cita-rut');
    
    if (citaDate) {
      // CORRECCIÓN: Usar fecha actual real (14 septiembre 2025, 16:41:17 UTC)
      const today = new Date(); // 14 septiembre 2025
      const todayString = today.toISOString().split('T')[0]; // 2025-09-14
      citaDate.min = todayString;
      citaDate.value = todayString; // ESTABLECER FECHA ACTUAL POR DEFECTO
      
      console.log('📅 Fecha mínima establecida:', todayString);
      console.log('📅 Fecha actual establecida por defecto:', todayString);
      console.log('📅 Fecha y hora actuales:', new Date().toLocaleString('es-CL'));
    }

    if (rutInput) {
      rutInput.addEventListener('input', (e) => {
        e.target.value = formatRUT(e.target.value);
      });
    }

    if (professionalSelect) {
      professionalSelect.addEventListener('change', loadNuevaCitaTimeSlots);
    }
    
    if (citaDate) {
      citaDate.addEventListener('change', loadNuevaCitaTimeSlots);
    }

    if (citaForm) {
      citaForm.addEventListener('submit', handleNuevaCitaSubmit);
    }
    
    // CARGAR HORARIOS AUTOMÁTICAMENTE SI HAY PROFESIONAL Y FECHA
    setTimeout(() => {
      loadNuevaCitaTimeSlots();
    }, 500);
    
    console.log('✅ Event listeners de nueva cita configurados');
    
  } catch (error) {
    console.error('Error setting up nueva cita form listeners:', error);
  }
}

async function loadProfessionalsForNuevaCita() {
  try {
    const select = document.getElementById('nueva-cita-professional');
    if (!select || !currentUserData) return;

    select.innerHTML = '<option value="">Cargando profesionales...</option>';

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

    select.innerHTML = '<option value="">Seleccionar profesional...</option>';
    
    professionals.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = `${prof.nombre} ${prof.apellidos} - ${getProfessionName(prof.profession)}`;
      option.dataset.nombre = `${prof.nombre} ${prof.apellidos}`;
      option.dataset.profession = prof.profession;
      select.appendChild(option);
    });

    console.log(`✅ Cargados ${professionals.length} profesionales para nueva cita`);

  } catch (error) {
    console.error('Error loading professionals for nueva cita:', error);
    const select = document.getElementById('nueva-cita-professional');
    if (select) {
      select.innerHTML = '<option value="">Error cargando profesionales</option>';
    }
  }
}

async function loadNuevaCitaTimeSlots() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const dateInput = document.getElementById('nueva-cita-date');
    const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
    const timeSlotsGrid = document.getElementById('nueva-cita-time-slots-grid');
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');

    if (!professionalSelect?.value || !dateInput?.value) {
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    const selectedDate = new Date(dateInput.value);
    const professionalId = professionalSelect.value;

    console.log('🔍 Cargando horarios para:', selectedDate.toLocaleDateString('es-CL'));
    console.log('🔍 Profesional ID:', professionalId);

    if (timeSlotsGrid) {
      timeSlotsGrid.innerHTML = '<div class="loading-time-slots"><i class="fas fa-spinner fa-spin"></i> Cargando horarios...</div>';
    }
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';

    // CORRECCIÓN: Verificar horarios ocupados en Firebase
    const occupiedSlots = await getOccupiedSlots(professionalId, selectedDate);
    console.log('⏰ Horarios ocupados encontrados:', occupiedSlots);

    const availableSlots = generateAvailableTimeSlots(selectedDate, occupiedSlots);
    console.log('✅ Horarios disponibles generados:', availableSlots.length);

    if (timeSlotsGrid) {
      if (availableSlots.length === 0) {
        timeSlotsGrid.innerHTML = `
          <div class="no-available-slots">
            <i class="fas fa-calendar-times"></i>
            <p>No hay horarios disponibles para esta fecha</p>
          </div>
        `;
      } else {
        timeSlotsGrid.innerHTML = availableSlots.map(slot => `
          <button type="button" class="time-slot" data-time="${slot.time}" onclick="selectNuevaCitaTimeSlot('${slot.time}')">
            <span class="time">${slot.time}</span>
            <span class="period">${slot.period}</span>
          </button>
        `).join('');
      }
    }

  } catch (error) {
    console.error('❌ Error loading time slots:', error);
    const timeSlotsGrid = document.getElementById('nueva-cita-time-slots-grid');
    if (timeSlotsGrid) {
      timeSlotsGrid.innerHTML = `
        <div class="error-loading-slots">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error cargando horarios</p>
        </div>
      `;
    }
  }
}

// CORRECCIÓN: Función mejorada para verificar horarios ocupados en Firebase
async function getOccupiedSlots(professionalId, date) {
  try {
    if (!currentUserData || !professionalId || !date) return [];
    
    console.log('🔍 Verificando horarios ocupados...');
    console.log('🔍 Profesional:', professionalId);
    console.log('🔍 Fecha:', date.toLocaleDateString('es-CL'));
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // CONSULTA DIRECTA A FIREBASE
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .where('estado', '!=', 'cancelada')
      .get();
    
    console.log('📊 Citas encontradas en Firebase para el día:', snapshot.size);
    
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
      
      console.log('⏰ Horario ocupado encontrado:', timeString, 'Paciente:', cita.pacienteNombre);
    });
    
    console.log('📅 Total horarios ocupados:', occupiedSlots);
    
    return occupiedSlots;
    
  } catch (error) {
    console.error('❌ Error obteniendo horarios ocupados:', error);
    return [];
  }
}

// CORRECCIÓN: Verificar si un horario ya pasó
function isPastTimeSlot(date, hour, minute) {
  try {
    // USAR FECHA Y HORA ACTUAL REAL (14 septiembre 2025, 16:41:17 UTC)
    const now = new Date(); // Fecha y hora actual del sistema
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);
    
    const isPast = slotTime <= now;
    
    if (isPast) {
      console.log(`⏰ Horario ${hour}:${minute.toString().padStart(2, '0')} ya pasó (hora actual: ${now.toLocaleTimeString('es-CL')})`);
    }
    
    return isPast;
  } catch (error) {
    console.error('Error checking past time slot:', error);
    return false;
  }
}

function generateAvailableTimeSlots(selectedDate, occupiedSlots = []) {
  try {
    const slots = [];
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const config = isWeekend ? HORARIOS_CONFIG.finSemana : HORARIOS_CONFIG.semana;
    
    let currentHour = config.horaInicio;
    let currentMinute = 0;
    
    const endTime = config.horaFin * 60 + (config.minutoFin || 0);
    
    while ((currentHour * 60 + currentMinute) < endTime) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // CORRECCIÓN: Verificar si el horario ya pasó (considerando fecha y hora actual)
      const isPast = isPastTimeSlot(selectedDate, currentHour, currentMinute);
      
      // Verificar si está ocupado
      const isOccupied = occupiedSlots.includes(timeString);
      
      if (!isPast && !isOccupied) {
        slots.push({
          time: timeString,
          period: currentHour < 12 ? 'AM' : 'PM',
          available: true
        });
      } else {
        console.log(`⏰ Horario ${timeString} no disponible - Pasado: ${isPast}, Ocupado: ${isOccupied}`);
      }
      
      currentMinute += config.intervaloMinutos;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }
    
    console.log(`📅 Horarios disponibles generados para ${selectedDate.toLocaleDateString('es-CL')}:`, slots.length);
    
    return slots;
    
  } catch (error) {
    console.error('❌ Error generating time slots:', error);
    return [];
  }
}

function selectNuevaCitaTimeSlot(time) {
  try {
    document.querySelectorAll('#nueva-cita-time-slots-grid .time-slot').forEach(slot => {
      slot.classList.remove('selected');
    });
    
    const selectedSlot = document.querySelector(`#nueva-cita-time-slots-grid .time-slot[data-time="${time}"]`);
    if (selectedSlot) {
      selectedSlot.classList.add('selected');
    }
    
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    
    console.log('⏰ Horario seleccionado:', time);
    
  } catch (error) {
    console.error('❌ Error selecting time slot:', error);
  }
}

// CORRECCIÓN: Función para crear cita sin duplicados
async function handleNuevaCitaSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = {
      nombre: document.getElementById('nueva-cita-nombre')?.value?.trim(),
      rut: document.getElementById('nueva-cita-rut')?.value?.trim(),
      professionalId: document.getElementById('nueva-cita-professional')?.value,
      fecha: document.getElementById('nueva-cita-date')?.value,
      hora: document.querySelector('#nueva-cita-time-slots-grid .time-slot.selected')?.dataset.time,
      observaciones: document.getElementById('nueva-cita-notes')?.value?.trim() || ''
    };
    
    if (!formData.nombre || !formData.rut || !formData.professionalId || !formData.fecha || !formData.hora) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    if (!validateRUT(formData.rut)) {
      showNotification('RUT inválido', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const selectedOption = professionalSelect.options[professionalSelect.selectedIndex];
    const profesionalNombre = selectedOption.dataset.nombre;
    const tipoProfesional = selectedOption.dataset.profession;
    
    const fechaCompleta = new Date(`${formData.fecha}T${formData.hora}:00`);
    
    // CORRECCIÓN: Verificar NUEVAMENTE que el horario no esté ocupado
    console.log('🔒 Verificación final de horario antes de crear cita...');
    const occupiedSlots = await getOccupiedSlots(formData.professionalId, new Date(formData.fecha));
    
    if (occupiedSlots.includes(formData.hora)) {
      showNotification('⚠️ Este horario ya fue ocupado por otra cita. Selecciona otro horario.', 'warning');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Crear Cita';
      
      // Recargar horarios disponibles
      await loadNuevaCitaTimeSlots();
      return;
    }
    
    console.log('✅ Horario disponible, creando cita...');
    
    const citaData = {
      profesionalId: formData.professionalId,
      profesionalNombre: profesionalNombre,
      tipoProfesional: tipoProfesional,
      pacienteNombre: formData.nombre,
      pacienteRut: formatRUT(formData.rut),
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: 'cita_directa',
      cesfam: currentUserData.cesfam,
      observaciones: formData.observaciones,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: currentUser.uid
    };
    
    // GUARDAR EN FIREBASE
    const citaRef = await db.collection('citas').add(citaData);
    
    console.log('✅ Cita creada con ID:', citaRef.id);
    
    await moveToPatients(formData, citaRef.id);
    
    closeModal('nueva-cita-modal');
    
    showNotification(`✅ Cita creada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`, 'success', 5000);
    
    // RECARGAR CALENDARIO
    renderCalendar();
    
  } catch (error) {
    console.error('❌ Error creando nueva cita:', error);
    showNotification('Error al crear cita: ' + error.message, 'error');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Crear Cita';
    }
  }
}

async function moveToPatients(formData, citaId) {
  try {
    console.log('👥 Creando/actualizando paciente...');
    
    const rutFormatted = formatRUT(formData.rut);
    
    // Verificar si el paciente ya existe
    const existingPatient = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (existingPatient.empty) {
      // Crear nuevo paciente
      const pacienteData = {
        nombre: formData.nombre,
        rut: rutFormatted,
        cesfam: currentUserData.cesfam,
        estado: 'activo',
        origen: 'cita_directa',
        citaInicialId: citaId,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        fechaPrimeraAtencion: null
      };
      
      await db.collection('pacientes').add(pacienteData);
      console.log('✅ Nuevo paciente creado');
    } else {
      console.log('✅ Paciente ya existe en el sistema');
    }
    
  } catch (error) {
    console.error('❌ Error creating/updating patient:', error);
  }
}

// ================= FUNCIONES DE TABS CORREGIDAS =================

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

// CORRECCIÓN: Función loadTabData actualizada
function loadTabData(tabName) {
  try {
    if (!currentUserData) return;

    switch (tabName) {
      case 'solicitudes':
        if (hasAccessToSolicitudes()) {
          console.log('🔄 Cargando solicitudes...');
          loadSolicitudes();
        }
        break;
      case 'agenda':
        console.log('📅 Cargando agenda...');
        updateAgendaTitle();
        setupCalendar(); // CORRECCIÓN: Reconfigurar calendario con fecha actual
        break;
      case 'seguimiento':
        console.log('📊 Cargando seguimiento...');
        loadSeguimiento();
        break;
      case 'pacientes':
        console.log('👥 Cargando pacientes...');
        loadPacientes();
        // CORRECCIÓN: Asegurar que el botón limpiar se configure
        setTimeout(() => {
          updatePacientesSearchHTML();
        }, 500);
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
    setupCalendar(); // CORRECCIÓN: Calendario con fecha actual (14 septiembre 2025)
    
    // CORRECCIÓN: Siempre iniciar mostrando contenido público
    showPublicContent();
    
    // El estado de autenticación determinará si mostrar contenido profesional
    auth.onAuthStateChanged(onAuthStateChanged);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🎉 SENDA Puente Alto - Sistema completo inicializado con correcciones');
      console.log('📅 Fecha actual del sistema:', new Date().toLocaleDateString('es-CL'));
      console.log('⏰ Hora actual del sistema:', new Date().toLocaleTimeString('es-CL'));
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
   SISTEMA SENDA PUENTE ALTO v2.3
   ====================================
   
   ✅ CORRECCIÓN 1: Header único (sin doble cerrar sesión)
   ✅ CORRECCIÓN 2: Solicitudes cargan desde Firebase
   ✅ CORRECCIÓN 3: Botón limpiar búsqueda RUT funcional
   ✅ CORRECCIÓN 4: Calendario con fecha actual (14 Sept 2025)
   ✅ CORRECCIÓN 5: Nueva cita con fecha actual y sin duplicados
   
   📅 FECHA Y HORA ACTUAL: ${new Date().toLocaleString('es-CL')}
   🚀 TODAS LAS CORRECCIONES APLICADAS
   ====================================
`);

console.log('✅ PARTE 5 FINAL: Sistema completo con nueva cita corregida - 14 Septiembre 2025, 16:41:17');
