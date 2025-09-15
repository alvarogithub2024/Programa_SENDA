// ================= VERIFICACIÓN DE FIREBASE =================
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase no está cargado');
  alert('Error: Firebase no está disponible. Verifica las librerías.');
}

// ================= CONFIGURACIÓN DE FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Inicializar Firebase
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
      console.warn('Persistencia falló: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistencia no soportada en este navegador');
    }
  });

  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
}

// ================= VARIABLES GLOBALES =================
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
      console.log(`📢 Notificación [${type.toUpperCase()}]: ${message}`);
    }

  } catch (error) {
    console.error('Error mostrando notificación:', error);
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
    console.error('Error mostrando modal:', error);
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
    console.error('Error cerrando modal:', error);
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
    console.error('Error revisando cambios en formulario:', error);
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
    console.error('Error mostrando overlay de carga:', error);
  }
}

// ================= FORMULARIO MULTIPASO COMPLETO =================

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

        saveFormDraft();
      });
    });

    // Listener para motivación
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
    console.log('✅ Formulario multipaso configurado');
  } catch (error) {
    console.error('❌ Error configurando formulario multipaso:', error);
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

    updateProgressIndicator(step, maxFormStep);

    currentFormStep = step;
    saveFormDraft();

    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
    }
  } catch (error) {
    console.error('Error cambiando de paso:', error);
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
    console.error('Error actualizando indicador de progreso:', error);
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
    console.log('✅ Auto-guardado configurado');
  } catch (error) {
    console.error('Error configurando auto-guardado:', error);
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

    if (APP_CONFIG.DEBUG_MODE) {
      console.log('💾 Borrador guardado automáticamente');
    }
  } catch (error) {
    console.error('Error guardando borrador:', error);
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

    restoreFormDraft(draftData);
  } catch (error) {
    console.error('Error cargando borrador:', error);
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

    if (APP_CONFIG.DEBUG_MODE) {
      console.log('📝 Borrador restaurado');
    }
  } catch (error) {
    console.error('Error restaurando borrador:', error);
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

    console.log('✅ Formulario reseteado');
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
    console.error('Error actualizando color de motivación:', error);
  }
}
// ================= FUNCIONES DE HORARIOS =================

function generateTimeSlots(date) {
  const dayOfWeek = date.getDay();
  const slots = [];
  let config;

  // Lunes a Viernes: día 1-5
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    config = HORARIOS_CONFIG.semana; // 08:00 - 16:30
  }
  // Sábado y Domingo: día 6 y 0
  else if (dayOfWeek === 0 || dayOfWeek === 6) {
    config = HORARIOS_CONFIG.finSemana; // 09:00 - 12:30
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
function debugTimeSlots() {
  const lunes = new Date('2025-09-15');
  const sabado = new Date('2025-09-13');
  
  console.log('=== DEBUG HORARIOS ===');
  console.log('Lunes 15/09:', lunes.getDay(), generateTimeSlots(lunes));
  console.log('SÃ¡bado 13/09:', sabado.getDay(), generateTimeSlots(sabado));
}

function isPastTimeSlot(date, hour, minute) {
  const now = new Date();
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);
  
  const bufferTime = new Date(now);
  bufferTime.setMinutes(bufferTime.getMinutes() + 30);
  
  return slotTime <= bufferTime;
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

// ================= CALENDARIO COMPLETO =================

function setupCalendar() {
  try {
    
    currentCalendarDate = new Date();
    selectedCalendarDate = new Date();
    
    renderCalendar();
    
    // Cargar las citas de hoy automÃ¡ticamente
    if (currentUserData) {
      loadTodayAppointments();
    }
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('âœ… Calendario configurado con fecha actual:', currentCalendarDate.toLocaleDateString('es-CL'));
    }
  } catch (error) {
    console.error('âŒ Error configurando calendario:', error);
  }
}

function renderCalendar() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;
    if (!currentCalendarDate) {
      currentCalendarDate = new Date();
    }
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    calendarGrid.innerHTML = '';
    
    const dayHeaders = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'];
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
    console.error('âŒ Error renderizando calendario:', error);
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
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('ðŸ“… DÃ­a seleccionado:', date.toLocaleDateString('es-CL'));
    }
  } catch (error) {
    console.error('âŒ Error seleccionando dÃ­a del calendario:', error);
  }
}

async function loadMonthAppointments(year, month) {
  if (!currentUserData) return;
  
  try {
    console.log(`ðŸ“ Cargando citas para ${month + 1}/${year} - CESFAM: ${currentUserData.cesfam}`);
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('cesfam', '==', currentUserData.cesfam)
      .where('fecha', '>=', startOfMonth)
      .where('fecha', '<=', endOfMonth)
      .get();
    
    console.log(`ðŸ“Š Citas encontradas en ${month + 1}/${year}: ${appointmentsSnapshot.size}`);
    
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
            transition: background 0.2s ease;
          `;
          
          appointmentEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showPatientAppointmentInfo(appointment);
          });
          
          appointmentEl.addEventListener('mouseenter', () => {
            appointmentEl.style.background = 'var(--health-green)';
          });
          
          appointmentEl.addEventListener('mouseleave', () => {
            appointmentEl.style.background = 'var(--primary-blue)';
          });
          
          container.appendChild(appointmentEl);
        });
        
        if (appointments.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.className = 'calendar-appointment more';
          moreEl.textContent = `+${appointments.length - 3} mÃ¡s`;
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
      console.log(`âœ… Citas del mes cargadas y mostradas: ${appointmentsSnapshot.size}`);
    }
    
  } catch (error) {
    console.error('âŒ Error cargando citas del mes:', error);
  }
}

function showPatientAppointmentInfo(appointment) {
  try {
    const infoModal = createPatientAppointmentInfoModal(appointment);
    document.body.insertAdjacentHTML('beforeend', infoModal);
    showModal('patient-appointment-info-modal');
  } catch (error) {
    console.error('Error showing patient appointment info:', error);
    showNotification('Error al mostrar informaciÃ³n del paciente', 'error');
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
          <h2><i class="fas fa-calendar-check"></i> InformaciÃ³n de Cita</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
              ${appointment.pacienteNombre}
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div><strong>RUT:</strong> ${appointment.pacienteRut || 'No disponible'}</div>
              <div><strong>TelÃ©fono:</strong> ${appointment.pacienteTelefono || 'No disponible'}</div>
              <div><strong>Fecha:</strong> ${fechaStr}</div>
              <div><strong>Hora:</strong> ${horaStr}</div>
              <div><strong>Profesional:</strong> ${appointment.profesionalNombre}</div>
              <div><strong>Tipo:</strong> ${getProfessionName(appointment.tipoProfesional)}</div>
              <div><strong>Estado:</strong> <span style="color: ${getStatusColor(appointment.estado)}; font-weight: bold;">${(appointment.estado || 'programada').toUpperCase()}</span></div>
              <div><strong>Tipo cita:</strong> ${appointment.tipo || 'General'}</div>
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

function getStatusColor(estado) {
  const colors = {
    'programada': '#3b82f6',
    'confirmada': '#10b981',
    'en_curso': '#f59e0b',
    'completada': '#059669',
    'cancelada': '#ef4444'
  };
  return colors[estado] || '#6b7280';
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
      .where('fecha', '<', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (appointmentsSnapshot.empty) {
      const dayName = date.toLocaleDateString('es-CL', { weekday: 'long' });
      const workingHours = getWorkingHours(date);
      
      appointmentsList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <p>No hay citas programadas para ${date.toLocaleDateString('es-CL')}</p>
          <p><small>${dayName} - Horario: ${workingHours.inicio} a ${workingHours.fin}</small></p>
          <button class="btn btn-primary btn-sm mt-2" onclick="createNuevaCitaModalForDate('${date.toISOString()}')">
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
    console.error('Error cargando citas del dÃ­a:', error);
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
        <div class="appointment-patient" onclick="showPatientAppointmentInfo(${JSON.stringify(appointment).replace(/"/g, '&quot;')})" 
             style="cursor: pointer; color: var(--primary-blue); text-decoration: underline;">
          ${appointment.pacienteNombre}
        </div>
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
    
    // Siempre actualizar la fecha seleccionada a hoy
    selectedCalendarDate = today;
    selectCalendarDay(today);
    
    console.log('ðŸ“… Citas de hoy cargadas para:', today.toLocaleDateString('es-CL'));
  } catch (error) {
    console.error('Error cargando citas de hoy:', error);
  }
}

function getWorkingHours(date) {
  const dayOfWeek = date.getDay();
  
  if (HORARIOS_CONFIG.semana.diasSemana.includes(dayOfWeek)) {
    return {
      inicio: `${HORARIOS_CONFIG.semana.horaInicio}:00`,
      fin: `${HORARIOS_CONFIG.semana.horaFin}:${HORARIOS_CONFIG.semana.minutoFin.toString().padStart(2, '0')}`
    };
  } else if (HORARIOS_CONFIG.finSemana.diasSemana.includes(dayOfWeek)) {
    return {
      inicio: `${HORARIOS_CONFIG.finSemana.horaInicio}:00`,
      fin: `${HORARIOS_CONFIG.finSemana.horaFin}:${HORARIOS_CONFIG.finSemana.minutoFin.toString().padStart(2, '0')}`
    };
  } else {
    return {
      inicio: 'Cerrado',
      fin: 'Cerrado'
    };
  }
}

function createNuevaCitaModalForDate(dateIso) {
  createNuevaCitaModal();
  
  setTimeout(() => {
    const dateInput = document.getElementById('nueva-cita-date');
    if (dateInput) {
      const date = new Date(dateIso);
      const today = new Date();
      
      // No permitir fechas pasadas
      if (date < today.setHours(0,0,0,0)) {
        date.setTime(today.getTime());
      }
      
      dateInput.value = date.toISOString().split('T')[0];
    }
  }, 100);
}

// ================= GESTIÃ“N COMPLETA DE PACIENTES =================

async function loadPacientes() {
  if (!currentUserData) return;

  try {
    showLoading(true, 'Cargando pacientes...');
    
    const cacheKey = `pacientes_${currentUserData.cesfam}`;
    dataCache.delete(cacheKey);
    
    console.log('Cargando pacientes para CESFAM:', currentUserData.cesfam);
    
    const pacientesSnapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(APP_CONFIG.PAGINATION_LIMIT)
      .get();
    
    console.log('Pacientes encontrados:', pacientesSnapshot.size);
    
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
    
    console.log(`Total pacientes cargados: ${pacientes.length}`);
    
  } catch (error) {
    console.error('Error loading pacientes:', error);
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

    console.log('Renderizando pacientes:', pacientes.length);

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
    
    console.log(`Renderizados ${pacientes.length} pacientes`);
  } catch (error) {
    console.error('Error rendering pacientes:', error);
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
        <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} aÃ±os</div>
        <div><strong>TelÃ©fono:</strong> ${paciente.telefono || 'No disponible'}</div>
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
    console.error('Error loading patient detail:', error);
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
                  <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} aÃ±os</div>
                  <div><strong>TelÃ©fono:</strong> ${paciente.telefono || 'No disponible'}</div>
                  <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                  <div><strong>DirecciÃ³n:</strong> ${paciente.direccion || 'No disponible'}</div>
                </div>
              </div>
              
              <div>
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">InformaciÃ³n ClÃ­nica</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                  <div><strong>CESFAM:</strong> ${paciente.cesfam}</div>
                  <div><strong>Prioridad:</strong> <span style="color: ${getPriorityColor(paciente.prioridad || 'media')}; font-weight: bold;">${(paciente.prioridad || 'media').toUpperCase()}</span></div>
                  <div><strong>Origen:</strong> ${paciente.origen || 'No especificado'}</div>
                  <div><strong>MotivaciÃ³n inicial:</strong> ${paciente.motivacionInicial || 'No registrada'}/10</div>
                </div>
              </div>
            </div>
            
            ${paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0 ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias ProblemÃ¡ticas</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${paciente.sustanciasProblematicas.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                </div>
              </div>` : ''
            }
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5); font-size: 12px; color: var(--gray-600);">
              <div><strong>Fecha de registro:</strong> ${fechaCreacion}</div>
              <div><strong>Primera atenciÃ³n:</strong> ${fechaPrimeraAtencion}</div>
              ${paciente.citaInicialId ? `<div><strong>Cita inicial ID:</strong> ${paciente.citaInicialId}</div>` : ''}
            </div>
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ================= BÃšSQUEDA DE PACIENTES POR RUT =================

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
      showNotification('RUT invÃ¡lido', 'error');
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
          <h3>Paciente no encontrado</h3>
          <p>No se encontrÃ³ ningÃºn paciente con el RUT ${rutFormatted} en tu CESFAM</p>
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
        <h4>Resultados de bÃºsqueda:</h4>
        <div class="patients-grid">
          ${pacientes.map(createPatientCard).join('')}
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error buscando paciente:', error);
    showNotification('Error al buscar paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ================= SISTEMA DE SEGUIMIENTO =================

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
function showAtencionModal(pacienteRut, pacienteNombre) {
  const modal = `
    <div class="modal-overlay temp-modal" id="atencion-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('atencion-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div style="padding:24px;">
          <h2>Registrar AtenciÃ³n</h2>
          <p><strong>Paciente:</strong> ${pacienteNombre} (${pacienteRut})</p>
          <form id="atencion-form">
            <div class="form-group">
              <label>Detalle de la atenciÃ³n</label>
              <textarea id="atencion-detalle" rows="5" required></textarea>
            </div>
            <div style="text-align:right;margin-top:16px;">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Guardar AtenciÃ³n
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
  showModal('atencion-modal');
  
  document.getElementById('atencion-form').addEventListener('submit', async function(e){
    e.preventDefault();
    const detalle = document.getElementById('atencion-detalle').value.trim();
    if(!detalle) return showNotification('Debes escribir la atenciÃ³n', 'warning');
    try {
      await db.collection('atenciones').add({
        pacienteRut,
        pacienteNombre,
        detalle,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        profesional: currentUserData ? `${currentUserData.nombre} ${currentUserData.apellidos}` : '',
        profesionalId: currentUser ? currentUser.uid : '',
        cesfam: currentUserData ? currentUserData.cesfam : '',
      });
      showNotification('AtenciÃ³n registrada', 'success');
      closeModal('atencion-modal');
    } catch(err){
      showNotification('Error guardando atenciÃ³n', 'error');
    }
  });
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
      
      // SOLO ESTE RETURN:
      return `
        <div class="timeline-item" onclick="showAtencionModal('${appointment.pacienteRut}', '${appointment.pacienteNombre}')">
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

// ================= GESTIÃ“N DE TABS =================

function setupTabFunctionality() {
  try {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        if (!canAccessTab(targetTab)) {
          showNotification('No tienes permisos para acceder a esta secciÃ³n', 'warning');
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

    console.log('âœ… Tab functionality configurada');
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

// ================= EVENT LISTENERS COMPLETOS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    
    console.log('ðŸ”§ BotÃ³n login encontrado:', loginProfessionalBtn);
    
    if (loginProfessionalBtn) {
      loginProfessionalBtn.addEventListener('click', () => {
        console.log('ðŸ”§ Click en botÃ³n login detectado');
        showModal('login-modal');
      });
      console.log('âœ… Event listener agregado al botÃ³n login');
    } else {
      console.error('âŒ BotÃ³n login-professional no encontrado');
    }

    const logoutBtn = document.getElementById('logout-professional');
    const registerPatientBtn = document.getElementById('register-patient');
    const reentryProgramBtn = document.getElementById('reentry-program');
    const aboutProgramBtn = document.getElementById('about-program');
    
    const searchPacientesRut = document.getElementById('search-pacientes-rut');
    const buscarPacienteBtn = document.getElementById('buscar-paciente-btn');
    
    const priorityFilter = document.getElementById('priority-filter');
    
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
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
      priorityFilter.addEventListener('change', (e) => {
        currentPriorityFilter = e.target.value;
        filterSolicitudes();
      });
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
    
    console.log('âœ… Event listeners inicializados correctamente');
  } catch (error) {
    console.error('âŒ Error inicializando event listeners:', error);
  }
}

function handleKeyboardShortcuts(e) {
  try {
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

// ================= FUNCIONES PLACEHOLDER Y UTILITARIAS =================

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
              <p><strong>SENDA (Servicio Nacional para la PrevenciÃ³n y RehabilitaciÃ³n del Consumo de Drogas y Alcohol)</strong> es el organismo del Gobierno de Chile encargado de elaborar las polÃ­ticas de prevenciÃ³n del consumo de drogas y alcohol, asÃ­ como de tratamiento, rehabilitaciÃ³n e integraciÃ³n social de las personas afectadas por estas sustancias.</p>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Nuestros Servicios</h3>
              <ul style="margin-left: 20px;">
                <li>Tratamiento ambulatorio bÃ¡sico e intensivo</li>
                <li>Tratamiento residencial</li>
                <li>Programas de reinserciÃ³n social</li>
                <li>Apoyo familiar y comunitario</li>
                <li>PrevenciÃ³n en establecimientos educacionales</li>
                <li>CapacitaciÃ³n a profesionales</li>
              </ul>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Horarios de AtenciÃ³n</h3>
              <ul style="margin-left: 20px;">
                <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
                <li><strong>SÃ¡bados y Domingos:</strong> 09:00 - 12:30</li>
              </ul>
              
              <h3 style="color: var(--primary-blue); margin-top: 24px;">Contacto</h3>
              <ul style="margin-left: 20px;">
                <li><strong>TelÃ©fono:</strong> 1412 (gratuito)</li>
                <li><strong>Emergencias:</strong> 131</li>
                <li><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a></li>
              </ul>
              
              <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px;">
                <p style="margin: 0; font-style: italic; text-align: center;">
                  "Tu recuperaciÃ³n es posible. Estamos aquÃ­ para acompaÃ±arte en cada paso del camino."
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
    showNotification('Error al mostrar informaciÃ³n del programa', 'error');
  }
}

function handleUrgentCase(solicitudId) { 
  try {
    showNotification('Caso urgente identificado. Se notificarÃ¡ al coordinador.', 'warning');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('ðŸš¨ Caso urgente identificado:', solicitudId);
    }
  } catch (error) {
    console.error('Error handling urgent case:', error);
  }
}

// ================= DESCARGA DE PDF =================

async function downloadPatientPDF(pacienteId) {
  try {
    showLoading(true, 'Generando PDF...');
    
    const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
    
    if (!pacienteDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const paciente = pacienteDoc.data();
    
    if (typeof window.jsPDF === 'undefined') {
      showNotification('Error: LibrerÃ­a PDF no disponible. Cargando...', 'warning');
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        setTimeout(() => downloadPatientPDF(pacienteId), 500);
      };
      script.onerror = () => {
        showNotification('Error cargando librerÃ­a PDF. Intenta nuevamente.', 'error');
      };
      document.head.appendChild(script);
      return;
    }
    
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('FICHA PACIENTE - PROGRAMA SENDA', 20, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`CESFAM: ${paciente.cesfam}`, 20, 50);
    doc.text(`Fecha de generaciÃ³n: ${new Date().toLocaleDateString('es-CL')}`, 20, 60);
    doc.text(`Profesional: ${currentUserData.nombre} ${currentUserData.apellidos}`, 20, 70);
    
    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('DATOS DEL PACIENTE', 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let yPos = 110;
    
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellidos || ''}`, 20, yPos);
    yPos += 10;
    doc.text(`RUT: ${paciente.rut}`, 20, yPos);
    yPos += 10;
    doc.text(`Edad: ${paciente.edad || 'No especificada'} aÃ±os`, 20, yPos);
    yPos += 10;
    doc.text(`TelÃ©fono: ${paciente.telefono || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`Email: ${paciente.email || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`DirecciÃ³n: ${paciente.direccion || 'No disponible'}`, 20, yPos);
    yPos += 15;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('INFORMACIÃ“N CLÃNICA', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Estado: ${(paciente.estado || 'Activo').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Prioridad: ${(paciente.prioridad || 'Media').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`MotivaciÃ³n inicial: ${paciente.motivacionInicial || 'No registrada'}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Origen: ${paciente.origen || 'No especificado'}`, 20, yPos);
    yPos += 10;
    
    if (paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0) {
      doc.text(`Sustancias problemÃ¡ticas: ${paciente.sustanciasProblematicas.join(', ')}`, 20, yPos);
      yPos += 10;
    }
    
    yPos += 10;
    doc.text(`Fecha de registro: ${formatDate(paciente.fechaCreacion)}`, 20, yPos);
    yPos += 10;
    
    if (paciente.fechaPrimeraAtencion) {
      doc.text(`Primera atenciÃ³n: ${formatDate(paciente.fechaPrimeraAtencion)}`, 20, yPos);
    }
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado por Sistema SENDA Puente Alto', 20, 280);
    doc.text('InformaciÃ³n confidencial - Uso exclusivo profesional', 20, 290);
 
    const fileName = `ficha_${paciente.nombre.replace(/\s+/g, '_')}_${paciente.rut.replace(/[.-]/g, '')}.pdf`;
    doc.save(fileName);
    
    showNotification('PDF generado y descargado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    showNotification('Error al generar PDF: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ================= INICIALIZACIÃ“N FINAL =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('ðŸš€ Iniciando sistema SENDA completo...');
    
    // Configurar formularios
    setupMultiStepForm();
    setupAuthForms();
    
    // Configurar event listeners
    initializeEventListeners();
    
    // Configurar funcionalidades
    setupTabFunctionality();
    setupCalendar();
    
    // Configurar autenticaciÃ³n
    auth.onAuthStateChanged(onAuthStateChanged);
    

    setInterval(() => {
      if (currentUserData) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Recargar slots de tiempo si estÃ¡n visibles y han cambiado
        const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
        if (timeSlotsContainer && timeSlotsContainer.style.display !== 'none') {
          loadNuevaCitaTimeSlots();
        }
      }
    }, 60000); // Cada minuto
    
    console.log('ðŸŽ‰ SENDA Puente Alto - Sistema completo inicializado');
    
  } catch (error) {
    console.error('âŒ Error durante la inicializaciÃ³n:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});

// ================= EXPORTAR FUNCIONES GLOBALES =================

window.showPatientDetail = showPatientDetail;
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.createNuevaCitaModal = createNuevaCitaModal;
window.createNuevaCitaModalForDate = createNuevaCitaModalForDate;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showSolicitudDetail = showSolicitudDetail;
window.showAgendaModalFromSolicitud = showAgendaModalFromSolicitud;
window.showResponderModal = showResponderModal;
window.handleUrgentCase = handleUrgentCase;
window.showAboutProgram = showAboutProgram;
window.showModal = showModal;
window.closeModal = closeModal;
window.showPatientAppointmentInfo = showPatientAppointmentInfo;
window.switchLoginTab = switchLoginTab;
window.downloadPatientPDF = downloadPatientPDF;
window.loadSolicitudes = loadSolicitudes;
window.showAtencionModal = showAtencionModal;

// ================= MENSAJE FINAL =================

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
