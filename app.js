// ConfiguraciÃ³n, Variables Globales y Formulario Original - CORREGIDO

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
      console.warn('Persistencia fallÃ³: mÃºltiples tabs abiertas');
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
  "CESFAM Alejandro del R­ío",
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

// CORREGIDO: ConfiguraciÃ³n de horarios
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
// ================= AUTENTICACIÓN Y EVENTOS CORREGIDOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    const logoutBtn = document.getElementById('logout-btn');
    const logoutProfessionalBtn = document.getElementById('logout-professional'); // AGREGADO
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

    // CORREGIDO: Ambos botones de logout funcionan
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

// CORREGIDO: Función de logout que funciona correctamente
async function handleLogout() {
  try {
    console.log('🔐 Cerrando sesión...');
    
    showLoading(true, 'Cerrando sesión...');
    
    await auth.signOut();
    
    currentUser = null;
    currentUserData = null;
    clearUserCache();
    
    showNotification('Sesión cerrada correctamente', 'success');
    showPublicContent();
    
    console.log('✅ Sesión cerrada exitosamente');
    
  } catch (error) {
    console.error('❌ Error during logout:', error);
    showNotification('Error al cerrar sesión: ' + error.message, 'error');
  } finally {
    showLoading(false);
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
// ================= FORMULARIO ORIGINAL APP14 - SIN MODIFICACIONES =================

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

    // Listeners para tipo de solicitud EXACTO
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
      input.addEventListener('change', () => {
        const tipoSolicitud = input.value;
        
        // ORIGINAL APP14: Lógica exacta del formulario
        if (tipoSolicitud === 'informacion') {
          // Solo información: mostrar email y enviar directamente
          maxFormStep = 1;
          updateProgressIndicator(1, 1);
          
          // Mostrar campo de email para información
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'block';
          if (basicInfoContainer) basicInfoContainer.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          if (submitBtn) submitBtn.style.display = 'inline-flex';
          
        } else if (tipoSolicitud === 'identificado') {
          // Mis datos: 4 pasos completos
          maxFormStep = 4;
          updateProgressIndicator(1, 4);
          
          // Ocultar campo de email y mostrar campos básicos
          const infoEmailContainer = document.getElementById('info-email-container');
          const basicInfoContainer = document.getElementById('basic-info-container');
          const nextBtn = document.getElementById('next-step-1');
          const submitBtn = document.getElementById('submit-step-1');
          
          if (infoEmailContainer) infoEmailContainer.style.display = 'none';
          if (basicInfoContainer) basicInfoContainer.style.display = 'block';
          if (nextBtn) nextBtn.style.display = 'inline-flex';
          if (submitBtn) submitBtn.style.display = 'none';
        }
        
        saveFormDraft();
      });
    });

    // ORIGINAL APP14: Listeners para motivación
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

    setupAutoSave();
    console.log('✅ Formulario multi-step original APP14 configurado');
    
  } catch (error) {
    console.error('❌ Error configurando formulario multi-step:', error);
  }
}

// ORIGINAL APP14: Funciones de navegación de pasos SIN CAMBIOS
function getNextStep(currentStep) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') {
    return null; // Solo 1 paso para información
  }
  
  // Para "identificado" - 4 pasos
  switch (currentStep) {
    case 1: return 2; // Paso 1 → Paso 2 (Datos personales)
    case 2: return 3; // Paso 2 → Paso 3 (Evaluación)
    case 3: return 4; // Paso 3 → Paso 4 (Finalización)
    case 4: return null; // No hay más pasos
  }
  return null;
}

function getPreviousStep(currentStep) {
  switch (currentStep) {
    case 2: return 1; // Paso 2 → Paso 1
    case 3: return 2; // Paso 3 → Paso 2
    case 4: return 3; // Paso 4 → Paso 3
  }
  return null;
}

function goToStep(step) {
  try {
    if (step < 1 || step > maxFormStep) return;

    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.classList.remove('active');
    });
    
    // Mostrar el paso objetivo
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

    // Actualizar indicador de progreso
    updateProgressIndicator(step, maxFormStep);
    
    currentFormStep = step;
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 APP14: Navegando a paso ${step} de ${maxFormStep}`);
    }
  } catch (error) {
    console.error('Error going to step:', error);
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
    console.error('Error updating progress indicator:', error);
  }
}
// ================= MODAL AGENDAR PARA SOLICITUDES - CORREGIDO =================

// CORREGIDO: Función para mostrar modal de agendar desde solicitudes
function showAgendaModal(solicitudId) {
  try {
    console.log('📅 Abriendo modal de agenda para solicitud:', solicitudId);
    
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const agendaModal = createAgendaCitaModal(solicitud);
    document.body.insertAdjacentHTML('beforeend', agendaModal);
    showModal('agenda-cita-modal');
    
    // Cargar datos después de mostrar el modal
    loadProfessionalsForAgenda();
    
  } catch (error) {
    console.error('Error showing agenda modal:', error);
    showNotification('Error al abrir modal de agenda', 'error');
  }
}

function createAgendaCitaModal(solicitud) {
  // Determinar los datos a mostrar según el tipo de solicitud
  let patientInfo = '';
  
  if (solicitud.tipo === 'reingreso') {
    patientInfo = `
      <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
          <i class="fas fa-redo"></i> Reingreso
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          <div><strong>Nombre:</strong> ${solicitud.nombre || 'No disponible'}</div>
          <div><strong>RUT:</strong> ${solicitud.rut || 'No disponible'}</div>
          <div><strong>Teléfono:</strong> ${solicitud.telefono || 'No disponible'}</div>
          <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
        </div>
        ${solicitud.motivo ? `
          <div style="margin-top: 12px;">
            <strong>Motivo:</strong>
            <p style="margin: 4px 0; font-style: italic;">${solicitud.motivo}</p>
          </div>
        ` : ''}
      </div>
    `;
  } else if (solicitud.tipoSolicitud === 'identificado') {
    patientInfo = `
      <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
          <i class="fas fa-user"></i> Solicitud Identificada
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          ${solicitud.nombre ? `<div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>` : ''}
          ${solicitud.rut ? `<div><strong>RUT:</strong> ${solicitud.rut}</div>` : ''}
          ${solicitud.telefono ? `<div><strong>Teléfono:</strong> ${solicitud.telefono}</div>` : ''}
          ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
          <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
          <div><strong>Prioridad:</strong> <span style="color: ${getPriorityColor(solicitud.prioridad)}; font-weight: bold;">${(solicitud.prioridad || 'media').toUpperCase()}</span></div>
        </div>
        ${solicitud.sustancias && solicitud.sustancias.length > 0 ? `
          <div style="margin-top: 12px;">
            <strong>Sustancias:</strong>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
              ${solicitud.sustancias.map(s => `<span style="background: var(--primary-blue); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${s}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    patientInfo = `
      <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
          <i class="fas fa-file-alt"></i> Solicitud General
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
          ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
          <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
          <div><strong>Prioridad:</strong> <span style="color: ${getPriorityColor(solicitud.prioridad)}; font-weight: bold;">${(solicitud.prioridad || 'media').toUpperCase()}</span></div>
          <div><strong>Para:</strong> ${solicitud.paraMi === 'si' ? 'Sí mismo' : 'Otra persona'}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-overlay temp-modal" id="agenda-cita-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('agenda-cita-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-plus"></i> Agendar Cita</h2>
          <p style="color: var(--text-medium); margin-bottom: 20px;">Programa una cita para esta solicitud</p>

          ${patientInfo}

          <form id="agenda-cita-form">
            <input type="hidden" id="agenda-solicitud-id" value="${solicitud.id}">
            <input type="hidden" id="agenda-solicitud-tipo" value="${solicitud.tipo || 'solicitud'}">
            
            <div class="form-group">
              <label class="form-label">Profesional *</label>
              <select class="form-select" id="agenda-professional" required>
                <option value="">Seleccionar profesional...</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Fecha *</label>
              <input type="date" class="form-input" id="agenda-date" required>
            </div>
            
            <div class="time-slots-container" id="agenda-time-slots-container" style="display: none;">
              <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                <i class="fas fa-clock"></i> Horarios Disponibles
              </h4>
              <div class="time-slots-grid" id="agenda-time-slots-grid">
                <!-- Los slots de tiempo se cargarán aquí -->
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Observaciones</label>
              <textarea class="form-textarea" id="agenda-notes" rows="3" 
                        placeholder="Observaciones adicionales..."></textarea>
            </div>
            
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="closeModal('agenda-cita-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success" disabled>
                <i class="fas fa-calendar-check"></i>
                Agendar Cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

async function loadProfessionalsForAgenda() {
  try {
    const professionalSelect = document.getElementById('agenda-professional');
    if (!professionalSelect) return;

    // Usar la lista ya cargada o cargar si no existe
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

    setupAgendaCitaFormListeners();
    
  } catch (error) {
    console.error('Error loading professionals for agenda:', error);
    showNotification('Error al cargar profesionales', 'error');
  }
}

function setupAgendaCitaFormListeners() {
  try {
    const professionalSelect = document.getElementById('agenda-professional');
    const agendaDate = document.getElementById('agenda-date');
    const agendaForm = document.getElementById('agenda-cita-form');
    
    if (agendaDate) {
      const today = new Date().toISOString().split('T')[0];
      agendaDate.min = today;
    }

    if (professionalSelect) {
      professionalSelect.addEventListener('change', loadAgendaTimeSlots);
    }
    
    if (agendaDate) {
      agendaDate.addEventListener('change', loadAgendaTimeSlots);
    }

    if (agendaForm) {
      agendaForm.addEventListener('submit', handleAgendaCitaSubmit);
    }
    
  } catch (error) {
    console.error('Error setting up agenda cita form listeners:', error);
  }
}
// ================= FUNCIONES DE AGENDA Y SLOTS DE TIEMPO =================

async function loadAgendaTimeSlots() {
  try {
    const professionalSelect = document.getElementById('agenda-professional');
    const agendaDate = document.getElementById('agenda-date');
    const timeSlotsContainer = document.getElementById('agenda-time-slots-container');
    const timeSlotsGrid = document.getElementById('agenda-time-slots-grid');
    const submitBtn = document.querySelector('#agenda-cita-form button[type="submit"]');
    
    if (!professionalSelect?.value || !agendaDate?.value) {
      if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    const selectedDate = new Date(agendaDate.value);
    
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
                  onclick="selectAgendaTimeSlot(this)"
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
            ${isOccupied ? '<br><small>Ocupado</small>' : ''}
            ${isPast ? '<br><small>Pasado</small>' : ''}
          </button>
        `;
      }).join('');
    }
    
    if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;
    
  } catch (error) {
    console.error('Error loading agenda time slots:', error);
    showNotification('Error al cargar horarios disponibles', 'error');
  }
}

function selectAgendaTimeSlot(button) {
  try {
    document.querySelectorAll('#agenda-time-slots-grid .time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.style.background = 'white';
      slot.style.color = 'var(--primary-blue)';
    });
    
    button.classList.add('selected');
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
    
    const submitBtn = document.querySelector('#agenda-cita-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('Error selecting agenda time slot:', error);
  }
}

// CORREGIDO: Submit del formulario de agenda
async function handleAgendaCitaSubmit(e) {
  e.preventDefault();
  
  try {
    const solicitudId = document.getElementById('agenda-solicitud-id')?.value;
    const solicitudTipo = document.getElementById('agenda-solicitud-tipo')?.value;
    const professionalId = document.getElementById('agenda-professional')?.value;
    const fecha = document.getElementById('agenda-date')?.value;
    const hora = document.querySelector('#agenda-time-slots-grid .time-slot.selected')?.dataset.time;
    const observaciones = document.getElementById('agenda-notes')?.value?.trim() || '';
    
    if (!solicitudId || !professionalId || !fecha || !hora) {
      showNotification('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    // Obtener datos del profesional seleccionado
    const professionalSelect = document.getElementById('agenda-professional');
    const selectedOption = professionalSelect.options[professionalSelect.selectedIndex];
    const profesionalNombre = selectedOption.dataset.nombre;
    const tipoProfesional = selectedOption.dataset.profession;
    
    // Obtener datos de la solicitud
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }
    
    const fechaCompleta = new Date(`${fecha}T${hora}:00`);
    
    // Datos del paciente según el tipo de solicitud
    let pacienteNombre = 'Paciente';
    let pacienteRut = '';
    let pacienteTelefono = '';
    
    if (solicitudTipo === 'reingreso') {
      pacienteNombre = solicitud.nombre || 'Paciente';
      pacienteRut = solicitud.rut || '';
      pacienteTelefono = solicitud.telefono || '';
    } else if (solicitud.tipoSolicitud === 'identificado') {
      pacienteNombre = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Paciente';
      pacienteRut = solicitud.rut || '';
      pacienteTelefono = solicitud.telefono || '';
    } else {
      pacienteNombre = `Paciente (${solicitud.edad || 'edad no esp.'} años)`;
    }
    
    const citaData = {
      profesionalId: professionalId,
      profesionalNombre: profesionalNombre,
      tipoProfesional: tipoProfesional,
      pacienteNombre: pacienteNombre,
      pacienteRut: pacienteRut,
      pacienteTelefono: pacienteTelefono,
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: 'desde_solicitud',
      cesfam: currentUserData.cesfam,
      observaciones: observaciones,
      solicitudId: solicitudId,
      solicitudTipo: solicitudTipo,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: currentUser.uid
    };
    
    // Crear la cita
    const citaRef = await db.collection('citas').add(citaData);
    
    // Actualizar estado de la solicitud
    const solicitudCollection = solicitudTipo === 'reingreso' ? 'reingresos' : 'solicitudes_ingreso';
    await db.collection(solicitudCollection).doc(solicitudId).update({
      estado: 'agendada',
      citaId: citaRef.id,
      fechaAgenda: firebase.firestore.FieldValue.serverTimestamp(),
      agendadoPor: currentUser.uid
    });
    
    // Mover a pacientes si es necesario
    if (solicitud.tipoSolicitud === 'identificado' || solicitudTipo === 'reingreso') {
      await moveToPatients(solicitud, citaRef.id);
    }
    
    closeModal('agenda-cita-modal');
    
    showNotification(`Cita agendada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${hora}`, 'success', 5000);
    
    // Actualizar vistas
    renderCalendar();
    await loadSolicitudes(); // Recargar solicitudes para ver el cambio de estado
    
  } catch (error) {
    console.error('Error creando cita desde solicitud:', error);
    showNotification('Error al agendar cita: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
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
    return []; // No hay horarios para este día
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
// ================= FUNCIONES UTILITARIAS BÁSICAS =================

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

function getFieldLabel(field) {
  try {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  } catch (error) {
    return 'Campo';
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

function toggleSubmitButton(button, isLoading) {
  if (!button) return;
  
  if (isLoading) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.setAttribute('data-original-text', originalText);
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  } else {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
      button.innerHTML = originalText;
    }
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

function getPriorityColor(prioridad) {
  const colors = {
    'critica': '#ef4444',
    'alta': '#f59e0b',
    'media': '#3b82f6',
    'baja': '#10b981'
  };
  return colors[prioridad] || '#6b7280';
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
// ================= CARGA DE DATOS Y RENDERIZADO =================

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
    console.error('Error cargando datos del usuario:', error);
    
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
      renderCalendar();
    } else if (activeTab === 'seguimiento') {
      await loadSeguimiento();
    }
    
    await loadProfessionalsList();
    
  } catch (error) {
    console.error('Error cargando datos iniciales:', error);
  }
}

async function loadSolicitudes() {
  if (!currentUserData || !hasAccessToSolicitudes()) {
    console.log('Usuario no tiene acceso a solicitudes');
    return;
  }

  try {
    showLoading(true, 'Cargando solicitudes...');
    const container = document.getElementById('requests-container');
    
    if (!container) {
      console.error('Container requests-container no encontrado');
      return;
    }
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    await loadSolicitudesFromFirestore(true);
    
  } catch (error) {
    console.error('Error general cargando solicitudes:', error);
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
    
    console.log('Cargando solicitudes para CESFAM:', currentUserData.cesfam);
    
    // Cargar solicitudes_ingreso
    try {
      const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);
      
      solicitudesSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'solicitud',
          ...data
        });
      });
      
    } catch (error) {
      console.error('Error cargando solicitudes_ingreso:', error);
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    // Cargar reingresos
    try {
      const reingresosSnapshot = await db.collection('reingresos')
        .where('cesfam', '==', currentUserData.cesfam)
        .orderBy('fechaCreacion', 'desc')
        .limit(APP_CONFIG.PAGINATION_LIMIT)
        .get();
      
      console.log('Reingresos encontrados:', reingresosSnapshot.size);
      
      reingresosSnapshot.forEach(doc => {
        const data = doc.data();
        solicitudes.push({
          id: doc.id,
          tipo: 'reingreso',
          ...data
        });
      });
      
    } catch (error) {
      console.error('Error cargando reingresos:', error);
      if (error.code !== 'permission-denied') {
        throw error;
      }
    }
    
    // Cargar solicitudes_informacion
    try {
      const informacionSnapshot = await db.collection('solicitudes_informacion')
        .orderBy('fechaCreacion', 'desc')
        .limit(50)
        .get();
      
      console.log('Solicitudes información encontradas:', informacionSnapshot.size);
      
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
      console.error('Error cargando solicitudes_informacion:', error);
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
    
    console.log('Total solicitudes procesadas:', solicitudes.length);
    
    solicitudesData = solicitudes;
    
    const cacheKey = `solicitudes_${currentUserData.cesfam}`;
    setCachedData(cacheKey, solicitudes);
    
    renderSolicitudes(solicitudes);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`Total solicitudes cargadas: ${solicitudes.length}`);
    }
    
  } catch (error) {
    console.error('Error cargando desde Firestore:', error);
    renderSolicitudesError(error);
  }
}

function renderSolicitudes(solicitudes) {
  try {
    const container = document.getElementById('requests-container');
    if (!container) {
      console.error('Container requests-container no encontrado');
      return;
    }

    console.log('Renderizando solicitudes:', solicitudes.length);

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
    
    // Agregar event listeners a las tarjetas
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
      console.log(`Renderizadas ${solicitudes.length} solicitudes`);
    }
  } catch (error) {
    console.error('Error renderizando solicitudes:', error);
  }
}
// ================= CREAR TARJETA DE SOLICITUD CORREGIDA =================

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
    console.error('Error creando tarjeta de solicitud:', error);
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

// ================= FUNCIONES AUXILIARES =================

function retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        resolve(result);
        return;
      } catch (error) {
        console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
        
        if (attempt === maxAttempts) {
          reject(error);
          return;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
        );
      }
    }
  });
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
// ================= FORMULARIOS Y VALIDACIÓN =================

function validateStep(step) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
    let isValid = true;
    const errors = [];

    // Validar campos requeridos
    requiredFields.forEach(field => {
      const value = field.value?.trim() || '';
      
      if (!value) {
        field.classList.add('error');
        errors.push(`${getFieldLabel(field)} es obligatorio`);
        isValid = false;
      } else {
        field.classList.remove('error');
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

// ================= AUTO-GUARDADO =================

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
    draftData.maxFormStep = maxFormStep;
    draftData.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
    isDraftSaved = true;
    
  } catch (error) {
    console.error('Error saving form draft:', error);
  }
}

function restoreFormDraft(draftData) {
  try {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'maxFormStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = field.value === draftData[key];
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    if (draftData.maxFormStep) {
      maxFormStep = draftData.maxFormStep;
    }
    
    if (draftData.currentStep) {
      goToStep(draftData.currentStep);
    }
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    if (tipoSolicitud) {
      tipoSolicitud.dispatchEvent(new Event('change'));
    }
    
    showNotification('Borrador restaurado correctamente', 'success');
    
  } catch (error) {
    console.error('Error restoring form draft:', error);
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
    
    isDraftSaved = false;
    localStorage.removeItem('senda_form_draft');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Formulario reseteado');
    }
  } catch (error) {
    console.error('Error reseteando formulario:', error);
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
// ================= ENVÍO DE FORMULARIOS =================

async function handleInformationOnlySubmit() {
  try {
    console.log('Procesando solicitud de información únicamente...');
    
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
    
    console.log('Guardando solicitud de información...');
    
    await db.collection('solicitudes_informacion').add(informationData);
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 'success', 6000);
    
  } catch (error) {
    console.error('Error enviando información:', error);
    showNotification('Error al enviar la solicitud: ' + error.message, 'error');
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

function calculatePriority(solicitudData) {
  let score = 0;
  
  if (solicitudData.urgencia === 'alta') score += 3;
  else if (solicitudData.urgencia === 'media') score += 2;
  else score += 1;
  
  if (solicitudData.edad) {
    if (solicitudData.edad < 18 || solicitudData.edad > 65) score += 2;
    else score += 1;
  }
  
  if (solicitudData.sustancias && solicitudData.sustancias.length > 2) score += 2;
  else if (solicitudData.sustancias && solicitudData.sustancias.length > 0) score += 1;
  
  if (solicitudData.motivacion) {
    if (solicitudData.motivacion >= 8) score += 2;
    else if (solicitudData.motivacion >= 5) score += 1;
  }
  
  if (score >= 8) return 'critica';
  else if (score >= 6) return 'alta';
  else if (score >= 4) return 'media';
  else return 'baja';
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  console.log('Iniciando envío de solicitud...');
  
  const submitBtn = document.getElementById('submit-form');
  
  try {
    toggleSubmitButton(submitBtn, true);
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (!tipoSolicitud) {
      showNotification('Selecciona un tipo de solicitud', 'warning');
      return;
    }

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
    console.log('Datos recopilados:', solicitudData);
    
    solicitudData.prioridad = calculatePriority(solicitudData);
    console.log('Prioridad calculada:', solicitudData.prioridad);
    
    if (!db) {
      throw new Error('No hay conexión a Firebase');
    }
    
    console.log('Guardando en Firestore...');
    
    const docRef = await retryOperation(async () => {
      return await db.collection('solicitudes_ingreso').add(solicitudData);
    });
    
    console.log('Solicitud guardada con ID:', docRef.id);
    
    if (solicitudData.prioridad === 'critica') {
      try {
        await createCriticalAlert(solicitudData, docRef.id);
        console.log('Alerta crítica creada');
      } catch (alertError) {
        console.warn('Error creando alerta crítica:', alertError);
      }
    }
    
    localStorage.removeItem('senda_form_draft');
    closeModal('patient-modal');
    resetForm();
    
    showNotification('Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.', 'success', 6000);
    console.log('Proceso completado exitosamente');
    
  } catch (error) {
    console.error('Error enviando solicitud:', error);
    
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
      console.warn('Error verificando reingresos existentes:', queryError);
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
  }
}
// ================= FUNCIONES AUXILIARES FINALES =================

async function moveToPatients(solicitudData, citaId) {
  try {
    const pacienteData = {
      nombre: solicitudData.nombre || 'Paciente',
      apellidos: solicitudData.apellidos || '',
      rut: formatRUT(solicitudData.rut || ''),
      telefono: solicitudData.telefono || null,
      email: solicitudData.email || null,
      direccion: solicitudData.direccion || null,
      edad: solicitudData.edad || null,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaInicialId: citaId,
      origen: 'solicitud_web',
      historialAtenciones: [],
      sustanciasProblematicas: solicitudData.sustancias || [],
      prioridad: solicitudData.prioridad || 'media',
      motivacionInicial: solicitudData.motivacion || 5
    };

    await db.collection('pacientes').add(pacienteData);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Paciente movido a colección de pacientes');
    }
    
  } catch (error) {
    console.error('Error moving to patients:', error);
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
          loadTabData(targetTab);
        }
      });
    });

    console.log('Tab functionality configured');
  } catch (error) {
    console.error('Error configurando tabs:', error);
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
        if (!selectedCalendarDate) {
          renderCalendar();
        }
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

// ================= CALENDARIO BÁSICO =================

function setupCalendar() {
  try {
    currentCalendarDate = new Date();
    renderCalendar();
    
    console.log('Calendario configurado');
  } catch (error) {
    console.error('Error configurando calendario:', error);
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
    console.error('Error renderizando calendario:', error);
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
    loadDayAppointments(date);
    
  } catch (error) {
    console.error('Error seleccionando día del calendario:', error);
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
          
          container.appendChild(moreEl);
        }
      }
    });
    
  } catch (error) {
    console.error('Error cargando citas del mes:', error);
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
    
    appointmentsList.innerHTML = appointments.map(appointment => {
      const time = appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="appointment-item" data-id="${appointment.id}">
          <div class="appointment-time">${time}</div>
          <div class="appointment-details">
            <div class="appointment-patient">${appointment.pacienteNombre}</div>
            <div class="appointment-professional">${appointment.profesionalNombre}</div>
            <div class="appointment-type">${getProfessionName(appointment.tipoProfesional)}</div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error cargando citas del día:', error);
  }
}

async function loadTodayAppointments() {
  try {
    const today = new Date();
    await loadDayAppointments(today);
    
    if (!selectedCalendarDate) {
      selectedCalendarDate = today;
      selectCalendarDay(today);
    }
  } catch (error) {
    console.error('Error cargando citas de hoy:', error);
  }
}

// ================= FUNCIONES PLACEHOLDER =================

function showSolicitudDetail(solicitud) {
  showNotification('Función de detalle en desarrollo', 'info');
}

function showSolicitudDetailById(solicitudId) {
  showNotification('Función de detalle en desarrollo', 'info');
}

function handleUrgentCase(solicitudId) { 
  showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning');
}

function showAboutProgram() {
  showNotification('Información del programa disponible en la página principal', 'info');
}

async function loadPacientes() {
  showNotification('Función de pacientes en desarrollo', 'info');
}

async function loadProfessionalsList() {
  try {
    if (!currentUserData) return;
    
    const snapshot = await db.collection('profesionales')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('activo', '==', true)
      .get();
    
    professionalsList = [];
    snapshot.forEach(doc => {
      professionalsList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
  } catch (error) {
    console.error('Error loading professionals list:', error);
  }
}

async function loadProfessionalsByArea() {
  return professionalsList;
}

function filterSolicitudes() {
  try {
    const searchTerm = document.getElementById('search-solicitudes')?.value?.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    
    let filteredSolicitudes = solicitudesData;
    
    if (currentFilter !== 'todas') {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.estado === currentFilter);
    }
    
    if (priorityFilter) {
      filteredSolicitudes = filteredSolicitudes.filter(s => s.prioridad === priorityFilter);
    }
    
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

// ================= INICIALIZACIÓN FINAL =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    setupMultiStepForm();
    initializeEventListeners();
    setupTabFunctionality();
    setupCalendar();
    
    auth.onAuthStateChanged(onAuthStateChanged);
    
    console.log('Sistema SENDA Puente Alto inicializado');
    
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});

// EXPORTAR FUNCIONES GLOBALES
window.showAgendaModal = showAgendaModal;
window.selectAgendaTimeSlot = selectAgendaTimeSlot;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showSolicitudDetail = showSolicitudDetail;
window.handleUrgentCase = handleUrgentCase;
window.showAboutProgram = showAboutProgram;
window.showModal = showModal;
window.closeModal = closeModal;

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
