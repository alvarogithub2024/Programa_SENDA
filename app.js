// ================= SENDA PUENTE ALTO - APP.JS COMPLETO Y CORREGIDO =================
// Sistema completo con todas las mejoras implementadas

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

// ================= GESTIÓN DE EVENTOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutProfessionalBtn = document.getElementById('logout-professional');
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

// ================= AUTENTICACIÓN =================

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
    } else if (activeTab === 'agenda') {
      renderCalendar();
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
    const logoutBtn = document.getElementById('logout-btn');

    if (publicContent) publicContent.style.display = 'block';
    if (professionalContent) professionalContent.style.display = 'none';
    if (professionalHeader) professionalHeader.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
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
    if (logoutBtn) logoutBtn.style.display = 'flex';
    
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

// ================= CALENDARIO CON FECHA/HORA ACTUAL =================

function setupCalendar() {
  try {
    // MEJORA 1: Siempre inicializar con la fecha y hora actual del sistema
    currentCalendarDate = new Date();
    renderCalendar();
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Calendario configurado con fecha/hora actual:', new Date().toLocaleString('es-CL'));
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
    
    // MEJORA 1: Usar fecha y hora actual real del sistema
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

// ================= MODAL NUEVA CITA CON FECHA/HORA ACTUAL =================

function createNuevaCitaModal() {
  try {
    // MEJORA 1: Obtener fecha y hora actual del sistema
    const now = new Date();
    const fechaActual = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaActual = now.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    const nuevaCitaModal = `
      <div class="modal-overlay temp-modal" id="nueva-cita-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-calendar-plus"></i> Nueva Cita</h2>
            
            <!-- MEJORA 1: Mostrar fecha y hora actual -->
            <div style="background: var(--light-blue); padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <strong>📅 Fecha y hora actual: ${now.toLocaleDateString('es-CL')} - ${horaActual}</strong>
            </div>
            
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
                  <label class="form-label">Fecha * (configurada con fecha actual)</label>
                  <input type="date" class="form-input" id="nueva-cita-date" value="${fechaActual}" required>
                </div>
              </div>
              
              <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
                <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                  <i class="fas fa-clock"></i> Horarios Disponibles (hora actual: ${horaActual})
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
    
    loadProfessionalsForNuevaCita();
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ Modal nueva cita abierto con fecha/hora actual: ${fechaActual} ${horaActual}`);
    }
    
  } catch (error) {
    console.error('Error creating nueva cita modal:', error);
    showNotification('Error al abrir modal de nueva cita', 'error');
  }
}

async function loadProfessionalsForNuevaCita() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    if (!professionalSelect) return;

    let professionals = professionalsList;
    if (professionals.length === 0) {
      professionals = await loadProfessionalsByArea();
    }
    
    professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
    
    professionals.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = `${prof.nombre} ${prof.apellidos} - ${getProfessionName(prof.profession)}`;
      option.dataset.profession = prof.profession;
      option.dataset.nombre = `${prof.nombre} ${prof.apellidos}`;
      professionalSelect.appendChild(option);
    });

    setupNuevaCitaFormListeners();
    
  } catch (error) {
    console.error('Error loading professionals for nueva cita:', error);
    showNotification('Error al cargar profesionales', 'error');
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
      professionals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return professionals;
  } catch (error) {
    console.error('Error loading professionals by area:', error);
    return [];
  }
}

function setupNuevaCitaFormListeners() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const citaDate = document.getElementById('nueva-cita-date');
    const citaForm = document.getElementById('nueva-cita-form');
    const rutInput = document.getElementById('nueva-cita-rut');
    
    // MEJORA 1: Asegurar que la fecha mínima sea siempre la actual
    if (citaDate) {
      const today = new Date().toISOString().split('T')[0];
      citaDate.min = today;
      
      // Si la fecha está vacía o es anterior a hoy, configurar con fecha actual
      if (!citaDate.value || citaDate.value < today) {
        citaDate.value = today;
      }
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
    
  } catch (error) {
    console.error('Error setting up nueva cita form listeners:', error);
  }
}

async function loadNuevaCitaTimeSlots() {
  try {
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const citaDate = document.getElementById('nueva-cita-date');
    const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
    const timeSlotsGrid = document.getElementById('nueva-cita-time-slots-grid');
    const submitBtn = document.querySelector('#nueva-cita-form button[type="submit"]');
    
    if (!professionalSelect?.value || !citaDate?.value) {
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    const selectedDate = new Date(citaDate.value);
    
    const timeSlots = generateTimeSlots(selectedDate);
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
                  onclick="selectNuevaCitaTimeSlot(this)"
                  style="
                    padding: 12px;
                    border: 2px solid ${isDisabled ? 'var(--gray-300)' : 'var(--primary-blue)'};
                    border-radius: 8px;
                    background: ${isDisabled ? 'var(--gray-100)' : 'white'};
                    color: ${isDisabled ? 'var(--gray-400)' : 'var(--primary-blue)'};
                    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                    transition: all 0.2s ease;
                    font-weight: 500;
                  ">
            <i class="fas fa-clock" style="margin-right: 4px;"></i>
            ${slot.time}
            ${isOccupied ? '<br><small style="color: #ef4444;">Ocupado</small>' : ''}
            ${isPast ? '<br><small style="color: #6b7280;">Pasado</small>' : ''}
          </button>
        `;
      }).join('');
    }
    
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;
    
  } catch (error) {
    console.error('Error loading nueva cita time slots:', error);
    showNotification('Error al cargar horarios disponibles', 'error');
  }
}

function generateTimeSlots(date) {
  const dayOfWeek = date.getDay();
  const slots = [];
  
  let config;
  if (HORARIOS_CONFIG.semana.diasSemana.includes(dayOfWeek)) {
    config = HORARIOS_CONFIG.semana;
  } else if (HORARIOS_CONFIG.finSemana.diasSemana.includes(dayOfWeek)) {
    config = HORARIOS_CONFIG.finSemana;
  } else {
    return [];
  }
  
  let currentHour = config.horaInicio;
  let currentMinute = 0;
  
  while (currentHour < config.horaFin || (currentHour === config.horaFin && currentMinute <= config.minutoFin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    slots.push({
      time: timeString,
      hour: currentHour,
      minute: currentMinute
    });
    
    currentMinute += config.intervaloMinutos;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return slots;
}

function isPastTimeSlot(date, hour, minute) {
  // MEJORA 1: Usar fecha y hora actual real del sistema
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
    
    console.log(`📅 Horarios ocupados para ${professionalId} el ${date.toLocaleDateString('es-CL')}:`, occupiedSlots);
    
    return occupiedSlots;
    
  } catch (error) {
    console.error('Error getting occupied slots:', error);
    return [];
  }
}

function selectNuevaCitaTimeSlot(button) {
  try {
    document.querySelectorAll('#nueva-cita-time-slots-grid .time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.style.background = 'white';
      slot.style.color = 'var(--primary-blue)';
    });
    
    button.classList.add('selected');
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
    
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
    
    // Verificar nuevamente que el horario no esté ocupado antes de crear
    const occupiedSlots = await getOccupiedSlots(formData.professionalId, new Date(formData.fecha));
    if (occupiedSlots.includes(formData.hora)) {
      showNotification('Este horario ya fue ocupado por otra cita. Selecciona otro horario.', 'warning');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Crear Cita';
      return;
    }
    
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
    
    const citaRef = await db.collection('citas').add(citaData);
    
    await moveToPatients(formData, citaRef.id);
    
    closeModal('nueva-cita-modal');
    
    showNotification(`Cita creada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`, 'success', 5000);
    
    renderCalendar();
    
  } catch (error) {
    console.error('Error creando nueva cita:', error);
    showNotification('Error al crear cita: ' + error.message, 'error');
  }
}

async function moveToPatients(solicitudData, citaId) {
  try {
    const pacienteData = {
      nombre: solicitudData.nombre || 'Paciente',
      apellidos: solicitudData.apellidos || '',
      rut: formatRUT(solicitudData.rut),
      telefono: solicitudData.telefono || null,
      email: solicitudData.email || null,
      direccion: solicitudData.direccion || null,
      edad: solicitudData.edad || null,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaInicialId: citaId,
      origen: 'cita_directa',
      historialAtenciones: [],
      sustanciasProblematicas: solicitudData.sustancias || [],
      prioridad: solicitudData.prioridad || 'media',
      motivacionInicial: solicitudData.motivacion || 5
    };

    await db.collection('pacientes').add(pacienteData);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('✅ Paciente movido a colección de pacientes');
    }
    
  } catch (error) {
    console.error('Error moving to patients:', error);
  }
}

// ================= ENLACE CON FIREBASE SOLICITUDES_INGRESO =================

// MEJORA 2: Función mejorada para cargar solicitudes desde Firebase
async function loadSolicitudes() {
  if (!currentUserData || !hasAccessToSolicitudes()) {
    console.log('⚠️ Usuario no tiene acceso a solicitudes');
    return;
  }

  try {
    showLoading(true, 'Cargando solicitudes desde Firebase...');
    const container = document.getElementById('requests-container');
    
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    await loadSolicitudesFromFirebaseEnhanced(true);
    
  } catch (error) {
    console.error('❌ Error general cargando solicitudes:', error);
    renderSolicitudesError(error);
  } finally {
    showLoading(false);
  }
}

// ================= CONTINUACIÓN DEL CÓDIGO COMPLETO =================

// MEJORA 2: Función que enlaza directamente con Firebase solicitudes_ingreso
async function loadSolicitudesFromFirebaseEnhanced(showLoadingIndicator = true) {
  try {
    if (showLoadingIndicator) {
      const container = document.getElementById('requests-container');
      if (container) {
        container.innerHTML = `
          <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando solicitudes desde Firebase (solicitudes_ingreso)...
          </div>
        `;
      }
    }
    
    const solicitudes = [];
    
    console.log('🔍 MEJORA 2: Cargando desde Firebase - solicitudes_ingreso para CESFAM:', currentUserData.cesfam);
    
    // MEJORA 2: Cargar desde solicitudes_ingreso con mejor enlace
    try {
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .where('estado', 'in', ['pendiente', 'pendiente_respuesta', 'en_evaluacion'])
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('📊 MEJORA 2: Solicitudes_ingreso encontradas desde Firebase:', solicitudesSnapshot.size);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        const tipoNecesidad = determinarTipoNecesidad(data);
        
        solicitudes.push({
          id: doc.id,
          tipo: 'solicitud',
          tipoNecesidad: tipoNecesidad,
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_ingreso desde Firebase:', error);
    }
    
    // MEJORA 2: Cargar reingresos desde Firebase
    try {
      const reingresosSnapshot = await db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .where('estado', 'in', ['pendiente', 'en_evaluacion'])
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('📊 MEJORA 2: Reingresos encontrados desde Firebase:', reingresosSnapshot.size);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'reingreso',
          tipoNecesidad: 'necesita_hora',
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando reingresos desde Firebase:', error);
    }
    
    // MEJORA 2: Cargar solicitudes de información desde Firebase
    try {
      const informacionSnapshot = await db.collection('solicitudes_informacion')
        .where('estado', '==', 'pendiente_respuesta')
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
        .get();
      
      console.log('📊 MEJORA 2: Solicitudes información encontradas desde Firebase:', informacionSnapshot.size);
      
      informacionSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'informacion',
          tipoSolicitud: 'informacion',
          tipoNecesidad: 'necesita_informacion',
          ...data
        });
      });
      
    } catch (error) {
      console.error('❌ Error cargando solicitudes_informacion desde Firebase:', error);
    }
    
    // Ordenar por fecha de creación
    solicitudes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    console.log('📋 MEJORA 2: Total solicitudes procesadas desde Firebase:', solicitudes.length);
    
    const estadisticas = categorizarSolicitudes(solicitudes);
    console.log('📊 MEJORA 2: Estadísticas de solicitudes:', estadisticas);
    
    solicitudesData = solicitudes;
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    renderSolicitudesEnhanced(solicitudes, estadisticas);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`✅ MEJORA 2: Total solicitudes cargadas desde Firebase: ${solicitudes.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error cargando desde Firebase mejorado:', error);
    renderSolicitudesError(error);
  }
}

function determinarTipoNecesidad(data) {
  if (data.tipoSolicitud === 'informacion') {
    return 'necesita_informacion';
  }
  
  if (data.tipoSolicitud === 'identificado') {
    return 'necesita_hora';
  }
  
  if (data.nombre && data.rut && data.telefono) {
    return 'necesita_hora';
  }
  
  return 'necesita_informacion';
}

function categorizarSolicitudes(solicitudes) {
  const stats = {
    total: solicitudes.length,
    necesitanHora: 0,
    necesitanInformacion: 0,
    reingresos: 0,
    urgentes: 0
  };
  
  solicitudes.forEach(sol => {
    if (sol.tipoNecesidad === 'necesita_hora') stats.necesitanHora++;
    if (sol.tipoNecesidad === 'necesita_informacion') stats.necesitanInformacion++;
    if (sol.tipo === 'reingreso') stats.reingresos++;
    if (sol.prioridad === 'critica' || sol.prioridad === 'alta') stats.urgentes++;
  });
  
  return stats;
}

function renderSolicitudesEnhanced(solicitudes, estadisticas) {
  try {
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('❌ Container requests-container no encontrado');
      return;
    }

    console.log('🎨 MEJORA 2: Renderizando solicitudes enlazadas con Firebase:', solicitudes.length);

    if (solicitudes.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-inbox"></i>
          <h3>No hay solicitudes pendientes en Firebase</h3>
          <p>No se encontraron solicitudes pendientes en solicitudes_ingreso para tu CESFAM: ${currentUserData.cesfam}</p>
          <button class="btn btn-primary mt-4" onclick="loadSolicitudes()">
            <i class="fas fa-redo"></i>
            Actualizar desde Firebase
          </button>
        </div>
      `;
      return;
    }

    const estadisticasHtml = `
      <div class="solicitudes-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="stat-card" style="background: var(--light-blue); padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: var(--primary-blue);">${estadisticas.necesitanHora}</div>
          <div style="font-size: 14px; color: var(--text-medium);">Necesitan Hora</div>
        </div>
        <div class="stat-card" style="background: #f0f9ff; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #0c4a6e;">${estadisticas.necesitanInformacion}</div>
          <div style="font-size: 14px; color: var(--text-medium);">Necesitan Información</div>
        </div>
        <div class="stat-card" style="background: #f3e8ff; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${estadisticas.reingresos}</div>
          <div style="font-size: 14px; color: var(--text-medium);">Reingresos</div>
        </div>
        <div class="stat-card" style="background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #d97706;">${estadisticas.urgentes}</div>
          <div style="font-size: 14px; color: var(--text-medium);">Casos Urgentes</div>
        </div>
      </div>
    `;

    container.innerHTML = estadisticasHtml + solicitudes.map(solicitud => createSolicitudCardEnhanced(solicitud)).join('');
    
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
      console.log(`✅ MEJORA 2: Renderizadas ${solicitudes.length} solicitudes desde Firebase`);
    }
  } catch (error) {
    console.error('❌ Error renderizando solicitudes mejoradas:', error);
  }
}

function createSolicitudCardEnhanced(solicitud) {
  try {
    const fecha = formatDate(solicitud.fechaCreacion);
    const prioridad = solicitud.prioridad || 'baja';
    const estado = solicitud.estado || 'pendiente';
    
    let titulo, subtitulo, tipoIcon, necesidadBadge;
    
    if (solicitud.tipoNecesidad === 'necesita_hora') {
      necesidadBadge = '<span class="necesidad-badge hora" style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">NECESITA HORA</span>';
    } else if (solicitud.tipoNecesidad === 'necesita_informacion') {
      necesidadBadge = '<span class="necesidad-badge info" style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">NECESITA INFO</span>';
    } else {
      necesidadBadge = '';
    }
    
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
      'pendiente_respuesta': 'fa-reply',
      'en_evaluacion': 'fa-search'
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
            ${necesidadBadge}
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
            <div><strong>Origen:</strong> Firebase (solicitudes_ingreso)</div>
            <div><strong>Necesita:</strong> ${solicitud.tipoNecesidad === 'necesita_hora' ? 'Agendar Hora' : 'Información'}</div>
          </div>
        </div>
        
        <div class="request-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          ${solicitud.tipoNecesidad === 'necesita_hora' ? 
            `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModal('${solicitud.id}')" title="Agendar cita">
              <i class="fas fa-calendar-plus"></i>
              Agendar Hora
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
    console.error('❌ Error creando tarjeta de solicitud mejorada:', error);
    return `
      <div class="request-card error-card">
        <div class="request-header">
          <h3>Error al cargar solicitud desde Firebase</h3>
        </div>
        <div class="request-body">
          <p>No se pudo cargar la información de esta solicitud desde solicitudes_ingreso</p>
        </div>
      </div>
    `;
  }
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ================= PACIENTES CON BOTÓN LIMPIAR FUNCIONAL =================

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

// MEJORA 3: Búsqueda de pacientes por RUT con botón limpiar funcional
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
          <!-- MEJORA 3: Botón limpiar en resultado de búsqueda -->
          <div style="margin-top: 16px; text-align: center;">
            <button class="btn btn-outline" onclick="limpiarBusquedaPacientes()">
              <i class="fas fa-eraser"></i>
              Limpiar Búsqueda
            </button>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h4 style="color: var(--primary-blue); margin: 0;">
            <i class="fas fa-check-circle"></i> 
            Paciente encontrado en ${currentUserData.cesfam}
          </h4>
          <!-- MEJORA 3: Botón limpiar funcional -->
          <button class="btn btn-outline btn-sm" onclick="limpiarBusquedaPacientes()">
            <i class="fas fa-eraser"></i>
            Limpiar
          </button>
        </div>
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

// MEJORA 3: Función para limpiar búsqueda de pacientes que SÍ funciona
function limpiarBusquedaPacientes() {
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
    
    showNotification('Búsqueda limpiada correctamente', 'success', 2000);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🧹 MEJORA 3: Búsqueda de pacientes limpiada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando búsqueda:', error);
    showNotification('Error al limpiar búsqueda', 'error');
  }
}

// MEJORA 3: Configurar el botón limpiar al cargar la página
function setupLimpiarButton() {
  try {
    const rutInput = document.getElementById('search-pacientes-rut');
    const buscarBtn = document.getElementById('buscar-paciente-btn');
    
    if (rutInput && buscarBtn) {
      let limpiarBtn = document.getElementById('limpiar-paciente-btn');
      
      if (!limpiarBtn) {
        limpiarBtn = document.createElement('button');
        limpiarBtn.id = 'limpiar-paciente-btn';
        limpiarBtn.className = 'btn btn-outline';
        limpiarBtn.innerHTML = '<i class="fas fa-eraser"></i> Limpiar';
        limpiarBtn.onclick = limpiarBusquedaPacientes;
        
        buscarBtn.parentNode.insertBefore(limpiarBtn, buscarBtn.nextSibling);
      }
      
      rutInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          limpiarBusquedaPacientes();
        }
      });
      
      console.log('✅ MEJORA 3: Botón limpiar configurado correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error configurando botón limpiar:', error);
  }
}

// ================= FUNCIONES UTILITARIAS ADICIONALES =================

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

// ================= GESTIÓN DE TABS =================

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
        renderCalendar();
        break;
      case 'seguimiento':
        loadSeguimiento();
        break;
      case 'pacientes':
        loadPacientes();
        setTimeout(setupLimpiarButton, 100);
        break;
    }
  } catch (error) {
    console.error('Error loading tab data:', error);
  }
}

// ================= FUNCIONES DE SEGUIMIENTO =================

async function loadSeguimiento() {
  if (!currentUserData) return;
  
  try {
    showLoading(true, 'Cargando seguimiento...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', today)
      .where('fecha', '<', tomorrow)
      .orderBy('fecha', 'asc')
      .get();
    
    renderPatientsTimeline(todayAppointmentsSnapshot);
    
    const upcomingAppointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', tomorrow)
      .orderBy('fecha', 'asc')
      .limit(10)
      .get();
    
    renderUpcomingAppointments(upcomingAppointmentsSnapshot);
    
  } catch (error) {
    console.error('Error loading seguimiento:', error);
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
      const estado = appointment.estado || 'programada';
      
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
    console.error('Error rendering patients timeline:', error);
  }
}

function getStatusIcon(estado) {
  const icons = {
    'programada': 'clock',
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
      if (noUpcomingSection) noUpcomingSection.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    
    if (noUpcomingSection) noUpcomingSection.style.display = 'none';
    
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
    console.error('Error rendering upcoming appointments:', error);
  }
}

// ================= FORMULARIOS DE ENVÍO =================

async function handleInformationOnlySubmit() {
  try {
    console.log('📧 Procesando solicitud de información únicamente...');
    
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
    
    await db.collection('solicitudes_informacion').add(informationData);
    
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 'success', 6000);
    
  } catch (error) {
    console.error('❌ Error enviando información:', error);
    showNotification('Error al enviar la solicitud: ' + error.message, 'error');
  }
}

// ================= CONTINÚA EN LA SIGUIENTE PARTE =================

console.log('✅ PARTE 2 DEL CÓDIGO COMPLETO CARGADA');
