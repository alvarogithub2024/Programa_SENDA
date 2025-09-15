// Verificar que Firebase esté disponible
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase no está cargado');
  alert('Error: Firebase no está disponible. Verifica las librerías.');
}

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

// ================= CREAR TARJETA DE SOLICITUD =================

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

    const responderBtn = (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') ? 
      `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); showResponderModal('${solicitud.id}')" title="Responder solicitud de información">
        <i class="fas fa-reply"></i>
        Responder
      </button>` : '';

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
          ${responderBtn}
          ${solicitud.tipo !== 'informacion' ? 
            `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showAgendaModalFromSolicitud('${solicitud.id}')" title="Agendar cita">
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

// ================= MODAL PARA RESPONDER SOLICITUDES =================

function showResponderModal(solicitudId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }

    const responderModal = `
      <div class="modal-overlay temp-modal" id="responder-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('responder-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-reply"></i> Responder Solicitud de Información</h2>
            
            <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
                <i class="fas fa-info-circle"></i> Información de la Solicitud
              </h4>
              <div style="font-size: 14px;">
                <strong>Email del solicitante:</strong> ${solicitud.email}<br>
                <strong>Fecha:</strong> ${formatDate(solicitud.fechaCreacion)}<br>
                <strong>ID:</strong> ${solicitud.id}
              </div>
            </div>
            
            <form id="responder-form">
              <input type="hidden" id="responder-solicitud-id" value="${solicitud.id}">
              
              <div class="form-group">
                <label class="form-label">Desde (Email institucional) *</label>
                <input type="email" class="form-input" id="responder-from" 
                       value="${currentUserData.email || currentUserData.nombre.toLowerCase().replace(/\s+/g, '.')}@senda.cl" readonly>
              </div>
              
              <div class="form-group">
                <label class="form-label">Para *</label>
                <input type="email" class="form-input" id="responder-to" 
                       value="${solicitud.email}" readonly>
              </div>
              
              <div class="form-group">
                <label class="form-label">Asunto *</label>
                <input type="text" class="form-input" id="responder-subject" 
                       value="Respuesta a su solicitud de información - SENDA Puente Alto" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Mensaje *</label>
                <textarea class="form-textarea" id="responder-message" rows="8" required
                          placeholder="Estimado/a solicitante,

Gracias por contactar al Programa SENDA Puente Alto. En respuesta a su solicitud de información...

Atentamente,
${currentUserData.nombre} ${currentUserData.apellidos}
${getProfessionName(currentUserData.profession)}
SENDA ${currentUserData.cesfam}"></textarea>
              </div>
              
              <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeModal('responder-modal')">
                  <i class="fas fa-times"></i>
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success">
                  <i class="fas fa-paper-plane"></i>
                  Enviar Respuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', responderModal);
    showModal('responder-modal');

    document.getElementById('responder-form').addEventListener('submit', handleResponderSubmit);

  } catch (error) {
    console.error('Error showing responder modal:', error);
    showNotification('Error al abrir modal de respuesta', 'error');
  }
}

async function handleResponderSubmit(e) {
  e.preventDefault();
  
  try {
    const solicitudId = document.getElementById('responder-solicitud-id').value;
    const from = document.getElementById('responder-from').value;
    const to = document.getElementById('responder-to').value;
    const subject = document.getElementById('responder-subject').value;
    const message = document.getElementById('responder-message').value;
    
    if (!subject.trim() || !message.trim()) {
      showNotification('Complete todos los campos obligatorios', 'warning');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    toggleSubmitButton(submitBtn, true);
    
    const respuestaData = {
      solicitudId: solicitudId,
      from: from,
      to: to,
      subject: subject,
      message: message,
      fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
      respondidoPor: currentUser.uid,
      profesionalNombre: `${currentUserData.nombre} ${currentUserData.apellidos}`,
      cesfam: currentUserData.cesfam,
      estado: 'enviado'
    };
    
    await db.collection('respuestas_informacion').add(respuestaData);
    
    await db.collection('solicitudes_informacion').doc(solicitudId).update({
      estado: 'respondida',
      fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
      respondidoPor: currentUser.uid
    });
    
    closeModal('responder-modal');
    showNotification('Respuesta enviada y registrada correctamente', 'success');
    
    await loadSolicitudes();
    
  } catch (error) {
    console.error('Error enviando respuesta:', error);
    showNotification('Error al enviar respuesta: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

// ================= AGENDAR DESDE SOLICITUD =================

function showAgendaModalFromSolicitud(solicitudId) {
  try {
    console.log('📅 Agendando cita desde solicitud:', solicitudId);
    
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const nuevaCitaModal = `
      <div class="modal-overlay temp-modal" id="nueva-cita-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('nueva-cita-modal')">
            <i class="fas fa-times"></i>
          </button>
          
          <div style="padding: 24px;">
            <h2><i class="fas fa-calendar-plus"></i> Agendar Cita - Solicitud ${solicitud.id}</h2>
            
            <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
                <i class="fas fa-info-circle"></i> Datos del Solicitante
              </h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                <div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>
                <div><strong>RUT:</strong> ${solicitud.rut}</div>
                <div><strong>Edad:</strong> ${solicitud.edad} años</div>
                <div><strong>Teléfono:</strong> ${solicitud.telefono || 'No disponible'}</div>
                <div><strong>Email:</strong> ${solicitud.email || 'No disponible'}</div>
                <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
              </div>
            </div>
            
            <form id="nueva-cita-form">
              <input type="hidden" id="solicitud-id" value="${solicitud.id}">
              <input type="hidden" id="nueva-cita-nombre" value="${solicitud.nombre} ${solicitud.apellidos || ''}">
              <input type="hidden" id="nueva-cita-rut" value="${solicitud.rut}">
              
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
                </div>
              </div>
              
              <div class="form-group" style="margin-top: 24px;">
                <label class="form-label">Observaciones</label>
                <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
                          placeholder="Observaciones adicionales para la cita...">${solicitud.descripcion || solicitud.motivo || ''}</textarea>
              </div>
              
              <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" class="btn btn-outline" onclick="closeModal('nueva-cita-modal')">
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
    
    document.body.insertAdjacentHTML('beforeend', nuevaCitaModal);
    showModal('nueva-cita-modal');
    
    loadProfessionalsForNuevaCita();
    
  } catch (error) {
    console.error('Error showing agenda modal from solicitud:', error);
    showNotification('Error al abrir modal de agenda', 'error');
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
    
    if (citaDate) {
      const today = new Date().toISOString().split('T')[0];
      citaDate.min = today;
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
            ${isOccupied ? '<br><small>Ocupado</small>' : ''}
            ${isPast ? '<br><small>Pasado</small>' : ''}
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
    const solicitudId = document.getElementById('solicitud-id')?.value;
    
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
    toggleSubmitButton(submitBtn, true);
    
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const selectedOption = professionalSelect.options[professionalSelect.selectedIndex];
    const profesionalNombre = selectedOption.dataset.nombre;
    const tipoProfesional = selectedOption.dataset.profession;
    
    const fechaCompleta = new Date(`${formData.fecha}T${formData.hora}:00`);
    
    const citaData = {
      profesionalId: formData.professionalId,
      profesionalNombre: profesionalNombre,
      tipoProfesional: tipoProfesional,
      pacienteNombre: formData.nombre,
      pacienteRut: formatRUT(formData.rut),
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: solicitudId ? 'cita_desde_solicitud' : 'cita_directa',
      cesfam: currentUserData.cesfam,
      observaciones: formData.observaciones,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: currentUser.uid
    };
    
    if (solicitudId) {
      citaData.solicitudId = solicitudId;
      citaData.origenSolicitud = true;
    }
    
    const citaRef = await db.collection('citas').add(citaData);
    
    await registrarPacienteAutomaticamente(formData, citaRef.id);
    
    if (solicitudId) {
      try {
        await actualizarEstadoSolicitud(solicitudId, citaRef.id);
      } catch (error) {
        console.warn('Error actualizando estado de solicitud:', error);
      }
    }
    
    closeModal('nueva-cita-modal');
    
    const mensaje = solicitudId 
      ? `Cita agendada exitosamente desde solicitud para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`
      : `Cita creada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${formData.hora}`;
    
    showNotification(mensaje, 'success', 5000);
    
    if (solicitudId && hasAccessToSolicitudes()) {
      await loadSolicitudes();
    }
    
  } catch (error) {
    console.error('Error creando nueva cita:', error);
    showNotification('Error al crear cita: ' + error.message, 'error');
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) toggleSubmitButton(submitBtn, false);
  }
}

async function actualizarEstadoSolicitud(solicitudId, citaId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    let coleccion = 'solicitudes_ingreso';
    
    if (solicitud.tipo === 'reingreso') {
      coleccion = 'reingresos';
    } else if (solicitud.tipo === 'informacion') {
      coleccion = 'solicitudes_informacion';
    }
    
    await db.collection(coleccion).doc(solicitudId).update({
      estado: 'agendada',
      citaId: citaId,
      fechaAgenda: firebase.firestore.FieldValue.serverTimestamp(),
      agendadaPor: currentUser.uid
    });
    
    console.log(`✅ Estado de solicitud ${solicitudId} actualizado a 'agendada'`);
    
  } catch (error) {
    console.error('Error actualizando estado de solicitud:', error);
    throw error;
  }
}

async function registrarPacienteAutomaticamente(citaData, citaId) {
  try {
    const rutFormatted = formatRUT(citaData.rut);
    const existingPatient = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    if (!existingPatient.empty) {
      console.log('Paciente ya existe, no se registra nuevamente');
      return;
    }
    
    const pacienteData = {
      nombre: citaData.nombre,
      apellidos: '',
      rut: rutFormatted,
      telefono: null,
      email: null,
      direccion: null,
      edad: null,
      cesfam: currentUserData.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaInicialId: citaId,
      origen: 'cita_directa',
      historialAtenciones: [],
      sustanciasProblematicas: [],
      prioridad: 'media',
      motivacionInicial: null
    };

    await db.collection('pacientes').add(pacienteData);
    
    console.log('✅ Paciente registrado automáticamente');
    
  } catch (error) {
    console.error('Error registrando paciente automáticamente:', error);
  }
}

// ================= FUNCIONES BÁSICAS =================

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

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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

function hasAccessToSolicitudes() {
  if (!currentUserData) return false;
  return currentUserData.profession === 'asistente_social';
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
    
    console.log(`Renderizadas ${solicitudes.length} solicitudes`);
  } catch (error) {
    console.error('Error renderizando solicitudes:', error);
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
            // ... (continuación del código anterior)

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
          </div>
        </div>
      </div>
    </div>
  `;
}

function showSolicitudDetailById(solicitudId) {
  try {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (solicitud) {
      showSolicitudDetail(solicitud);
    } else {
      showNotification('Solicitud no encontrada', 'error');
    }
  } catch (error) {
    console.error('Error showing solicitud detail by ID:', error);
  }
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

function setCachedData(key, data) {
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
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
    console.error('Error mostrando contenido público:', error);
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

// ================= FUNCIONES UTILITARIAS ADICIONALES =================

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

// ================= INICIALIZACIÓN Y LISTENERS =================

function initializeEventListeners() {
  try {
    const loginProfessionalBtn = document.getElementById('login-professional');
    
    console.log('🔧 Botón login encontrado:', loginProfessionalBtn);
    
    if (loginProfessionalBtn) {
      loginProfessionalBtn.addEventListener('click', () => {
        console.log('🔧 Click en botón login detectado');
        showModal('login-modal');
      });
      console.log('✅ Event listener agregado al botón login');
    } else {
      console.error('❌ Botón login-professional no encontrado');
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
    
    console.log('✅ Event listeners inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando event listeners:', error);
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

// ================= FUNCIONES PLACEHOLDER =================

function resetForm() {
  console.log('Reset form function placeholder');
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

function buscarPacientePorRUT() {
  console.log('Buscar paciente por RUT placeholder');
}

function filterSolicitudes() {
  console.log('Filter solicitudes placeholder');
}

function createNuevaCitaModal() {
  console.log('Create nueva cita modal placeholder');
}

function renderCalendar() {
  console.log('Render calendar placeholder');
}

function loadTodayAppointments() {
  console.log('Load today appointments placeholder');
}

function loadSeguimiento() {
  console.log('Load seguimiento placeholder');
}

function loadPacientes() {
  console.log('Load pacientes placeholder');
}

function handleUrgentCase(solicitudId) { 
  try {
    showNotification('Caso urgente identificado. Se notificará al coordinador.', 'warning');
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('🚨 Caso urgente identificado:', solicitudId);
    }
  } catch (error) {
    console.error('Error handling urgent case:', error);
  }
}

// ================= INICIALIZACIÓN FINAL =================

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('🚀 Iniciando sistema SENDA...');
    
    initializeEventListeners();
    
    auth.onAuthStateChanged(onAuthStateChanged);
    
    console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    showNotification('Error inicializando el sistema', 'error');
  }
});

// EXPORTAR FUNCIONES GLOBALES
window.showAgendaModalFromSolicitud = showAgendaModalFromSolicitud;
window.showResponderModal = showResponderModal;
window.showSolicitudDetailById = showSolicitudDetailById;
window.showSolicitudDetail = showSolicitudDetail;
window.handleUrgentCase = handleUrgentCase;
window.showAboutProgram = showAboutProgram;
window.showModal = showModal;
window.closeModal = closeModal;
window.selectNuevaCitaTimeSlot = selectNuevaCitaTimeSlot;

console.log(`
🎉 ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
         
