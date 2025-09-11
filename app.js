// ============================================
// SENDA SYSTEM - PARTE 1: FUNCIONES PRINCIPALES
// ============================================

// Firebase Configuration (mantener igual)
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global Variables
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;
let flowSteps = []; 
let currentStepIndex = 0;

// NUEVO: Variables para gestión clínica
let selectedPatient = null;
let currentAppointments = [];
let professionalSchedules = {};

// ============================================
// FUNCIONES DE VALIDACIÓN DE ROLES
// ============================================

function canViewRequests(userRole) {
  return ['asistente_social', 'coordinador', 'admin'].includes(userRole);
}

function canManagePatients(userRole) {
  return ['asistente_social', 'medico', 'psicologo', 'terapeuta', 'coordinador', 'admin'].includes(userRole);
}

function canScheduleAppointments(userRole) {
  return ['asistente_social', 'coordinador', 'admin'].includes(userRole);
}

function canWriteFollowups(userRole) {
  return ['medico', 'psicologo', 'terapeuta', 'asistente_social'].includes(userRole);
}

function canGenerateReports(userRole) {
  return ['asistente_social', 'medico', 'psicologo', 'coordinador', 'admin'].includes(userRole);
}

// ============================================
// GESTIÓN DE SOLICITUDES PARA ASISTENTES SOCIALES
// ============================================

async function loadRequestsForSocialWorkers(userData) {
  console.log('Loading requests for social worker:', userData.nombre);
  
  if (!canViewRequests(userData.profesion)) {
    document.getElementById('requests-list').innerHTML = 
      '<p class="access-denied">No tienes permisos para ver solicitudes.</p>';
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // Obtener solicitudes pendientes ordenadas por prioridad y fecha
    const query = db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', 'in', ['pendiente', 'en_proceso'])
      .orderBy('clasificacion.prioridad', 'desc')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = '<p class="no-data">No hay solicitudes pendientes.</p>';
      return;
    }
    
    let html = '';
    let criticalCount = 0;
    let highCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      const isAnonymous = data.datos_personales?.anonimo;
      const isInfoOnly = data.datos_personales?.solo_informacion;
      
      if (priority === 'critica') criticalCount++;
      if (priority === 'alta') highCount++;
      
      const patientName = isAnonymous ? 'Paciente Anónimo' : 
                         isInfoOnly ? 'Solicitud de Información' :
                         data.datos_contacto?.nombre_completo || 'Sin nombre';
      
      const contactInfo = isAnonymous ? data.datos_contacto?.telefono_principal :
                         isInfoOnly ? data.datos_contacto?.email :
                         `${data.datos_contacto?.telefono_principal || 'Sin teléfono'} | ${data.datos_contacto?.email || 'Sin email'}`;
      
      const substancesList = data.evaluacion_inicial?.sustancias_consumo?.join(', ') || 'No especificado';
      const urgency = data.evaluacion_inicial?.urgencia_declarada || 'No especificada';
      
      html += `
        <div class="request-card priority-${priority}" data-request-id="${doc.id}">
          <div class="request-header">
            <div class="request-title">
              <h3>${patientName}</h3>
              <span class="request-id">ID: ${doc.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="request-badges">
              <span class="priority-badge priority-${priority}">${priority.toUpperCase()}</span>
              <span class="status-badge status-${estado}">${estado.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          
          <div class="request-details">
            <div class="detail-row">
              <span class="label">Edad:</span>
              <span>${data.datos_personales?.edad || 'N/A'} años</span>
            </div>
            <div class="detail-row">
              <span class="label">Región:</span>
              <span>${data.datos_personales?.region || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Contacto:</span>
              <span>${contactInfo}</span>
            </div>
            ${!isInfoOnly ? `
            <div class="detail-row">
              <span class="label">Sustancias:</span>
              <span>${substancesList}</span>
            </div>
            <div class="detail-row">
              <span class="label">Urgencia:</span>
              <span class="urgency-${urgency}">${urgency}</span>
            </div>
            <div class="detail-row">
              <span class="label">Motivación:</span>
              <span>${data.evaluacion_inicial?.motivacion_cambio || 'N/A'}/10</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Fecha:</span>
              <span>${formatDate(data.metadata?.fecha_creacion)}</span>
            </div>
          </div>
          
          ${data.evaluacion_inicial?.descripcion_situacion ? `
          <div class="request-description">
            <strong>Situación:</strong>
            <p>${data.evaluacion_inicial.descripcion_situacion}</p>
          </div>
          ` : ''}
          
          <div class="request-actions">
            <button class="btn btn-outline btn-sm" onclick="viewRequestDetails('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalles
            </button>
            <button class="btn btn-primary btn-sm" onclick="processRequest('${doc.id}')">
              <i class="fas fa-user-plus"></i> Procesar Solicitud
            </button>
            ${priority === 'critica' ? `
            <button class="btn btn-danger btn-sm" onclick="handleCriticalCase('${doc.id}')">
              <i class="fas fa-exclamation-triangle"></i> Caso Crítico
            </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    // Mostrar estadísticas
    const statsHtml = `
      <div class="requests-stats">
        <div class="stat-item critical">
          <span class="stat-number">${criticalCount}</span>
          <span class="stat-label">Casos Críticos</span>
        </div>
        <div class="stat-item high">
          <span class="stat-number">${highCount}</span>
          <span class="stat-label">Prioridad Alta</span>
        </div>
        <div class="stat-item total">
          <span class="stat-number">${snapshot.size}</span>
          <span class="stat-label">Total Pendientes</span>
        </div>
      </div>
    `;
    
    requestsList.innerHTML = statsHtml + html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = '<p class="error-message">Error al cargar las solicitudes.</p>';
    }
  }
}

// ============================================
// FUNCIONES PARA PROCESAR SOLICITUDES
// ============================================

async function processRequest(requestId) {
  try {
    const docRef = db.collection('solicitudes_ingreso').doc(requestId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const data = doc.data();
    
    // Mostrar modal de procesamiento
    showRequestProcessingModal(requestId, data);
    
  } catch (error) {
    console.error('Error processing request:', error);
    showNotification('Error al procesar la solicitud', 'error');
  }
}

function showRequestProcessingModal(requestId, requestData) {
  const modalHtml = `
    <div class="modal-overlay" id="process-request-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('process-request-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Procesar Solicitud</h2>
        
        <div class="processing-tabs">
          <button class="tab-btn active" data-tab="review">Revisar</button>
          <button class="tab-btn" data-tab="patient">Crear Paciente</button>
          <button class="tab-btn" data-tab="schedule">Agendar</button>
        </div>
        
        <div class="tab-content active" id="review-tab">
          <div class="request-summary">
            <h3>Resumen de la Solicitud</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <label>Nombre:</label>
                <span>${requestData.datos_contacto?.nombre_completo || 'Anónimo'}</span>
              </div>
              <div class="summary-item">
                <label>Edad:</label>
                <span>${requestData.datos_personales?.edad} años</span>
              </div>
              <div class="summary-item">
                <label>Prioridad:</label>
                <span class="priority-${requestData.clasificacion?.prioridad}">${requestData.clasificacion?.prioridad?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tab-content" id="patient-tab">
          <form id="patient-creation-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Número de Ficha</label>
                <input type="text" class="form-input" id="patient-number" value="${generatePatientNumber()}" readonly>
              </div>
              <div class="form-group">
                <label>Estado Inicial</label>
                <select class="form-select" id="patient-status">
                  <option value="evaluacion">En Evaluación</option>
                  <option value="tratamiento">En Tratamiento</option>
                  <option value="seguimiento">En Seguimiento</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        
        <div class="tab-content" id="schedule-tab">
          <div class="scheduling-section">
            <h3>Agendar Primera Cita</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Profesional</label>
                <select class="form-select" id="professional-select">
                  <option value="">Seleccionar profesional...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fecha</label>
                <input type="date" class="form-input" id="appointment-date">
              </div>
              <div class="form-group">
                <label>Hora</label>
                <select class="form-select" id="appointment-time">
                  <option value="">Seleccionar hora...</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal('process-request-modal')">Cancelar</button>
          <button class="btn btn-success" onclick="finalizeRequestProcessing('${requestId}')">
            <i class="fas fa-check"></i> Finalizar Procesamiento
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Configurar tabs
  setupProcessingTabs();
  
  // Cargar profesionales disponibles
  loadAvailableProfessionals();
}

function generatePatientNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${year}${month}${random}`;
}

async function finalizeRequestProcessing(requestId) {
  try {
    showLoading(true);
    
    const patientNumber = document.getElementById('patient-number').value;
    const patientStatus = document.getElementById('patient-status').value;
    const selectedProfessional = document.getElementById('professional-select').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    
    // Actualizar solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'procesado',
      'clasificacion.fecha_procesamiento': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.procesado_por': currentUserData.uid,
      'derivacion.numero_ficha_asignado': patientNumber,
      'derivacion.estado_inicial': patientStatus
    });
    
    // Crear ficha de paciente
    const requestDoc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    const requestData = requestDoc.data();
    
    const patientData = {
      numero_ficha: patientNumber,
      datos_personales: requestData.datos_personales,
      datos_contacto: requestData.datos_contacto,
      evaluacion_inicial: requestData.evaluacion_inicial,
      estado: patientStatus,
      historial_clinico: [],
      citas: [],
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        solicitud_origen: requestId,
        creado_por: currentUserData.uid
      }
    };
    
    const patientRef = await db.collection('pacientes').add(patientData);
    
    // Agendar cita si se especificó
    if (selectedProfessional && appointmentDate && appointmentTime) {
      await scheduleFirstAppointment(patientRef.id, selectedProfessional, appointmentDate, appointmentTime);
    }
    
    closeModal('process-request-modal');
    showNotification('Solicitud procesada exitosamente', 'success');
    
    // Recargar solicitudes
    loadRequestsForSocialWorkers(currentUserData);
    
  } catch (error) {
    console.error('Error finalizing request:', error);
    showNotification('Error al procesar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function setupProcessingTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Actualizar botones
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Actualizar contenido
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId + '-tab').classList.add('active');
    });
  });
}

async function loadAvailableProfessionals() {
  try {
    const professionalsQuery = db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta']);
    
    const snapshot = await professionalsQuery.get();
    const select = document.getElementById('professional-select');
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.nombre} - ${getProfessionName(data.profesion)}`;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading professionals:', error);
  }
}

async function scheduleFirstAppointment(patientId, professionalId, date, time) {
  try {
    const appointmentData = {
      paciente_id: patientId,
      profesional_id: professionalId,
      fecha: new Date(`${date}T${time}`),
      tipo: 'primera_consulta',
      estado: 'programada',
      notas: 'Primera cita derivada desde solicitud de ingreso',
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        creado_por: currentUserData.uid
      }
    };
    
    await db.collection('citas').add(appointmentData);
    
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    throw error;
  }
}

// Funciones utilitarias (mantener las existentes)
function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const container = document.getElementById('notifications');
  if (container) {
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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
// ============================================
// SENDA SYSTEM - PARTE 2: GESTIÓN DE PACIENTES
// ============================================

// ============================================
// CARGAR PANEL DE PACIENTES
// ============================================

async function loadPatientsPanel(userData) {
  console.log('Loading patients panel for:', userData.nombre);
  
  if (!canManagePatients(userData.profesion)) {
    document.getElementById('patients-panel').innerHTML = 
      '<p class="access-denied">No tienes permisos para gestionar pacientes.</p>';
    return;
  }
  
  const patientsPanel = document.getElementById('patients-panel');
  
  const panelHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Gestión de Pacientes</h1>
      <p class="panel-subtitle">Busca y gestiona fichas clínicas</p>
    </div>
    
    <div class="patients-toolbar">
      <div class="search-section">
        <div class="search-bar">
          <input type="text" class="form-input search-input" id="patient-search" 
                 placeholder="Buscar por nombre, RUT, número de ficha...">
          <button class="btn btn-primary" onclick="searchPatients()">
            <i class="fas fa-search"></i> Buscar
          </button>
        </div>
        
        <div class="filters">
          <select class="form-select" id="status-filter">
            <option value="">Todos los estados</option>
            <option value="evaluacion">En Evaluación</option>
            <option value="tratamiento">En Tratamiento</option>
            <option value="seguimiento">En Seguimiento</option>
            <option value="alta">Alta</option>
            <option value="abandono">Abandono</option>
          </select>
          
          <select class="form-select" id="professional-filter">
            <option value="">Todos los profesionales</option>
          </select>
          
          <button class="btn btn-outline" onclick="clearPatientFilters()">
            <i class="fas fa-times"></i> Limpiar
          </button>
        </div>
      </div>
      
      <div class="quick-actions">
        <button class="btn btn-success" onclick="showCreatePatientModal()">
          <i class="fas fa-user-plus"></i> Nuevo Paciente
        </button>
        <button class="btn btn-outline" onclick="exportPatientsData()">
          <i class="fas fa-download"></i> Exportar
        </button>
      </div>
    </div>
    
    <div class="patients-stats">
      <div class="stat-card">
        <div class="stat-number" id="total-patients-count">0</div>
        <div class="stat-label">Total Pacientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="active-patients-count">0</div>
        <div class="stat-label">Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="treatment-patients-count">0</div>
        <div class="stat-label">En Tratamiento</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="followup-patients-count">0</div>
        <div class="stat-label">En Seguimiento</div>
      </div>
    </div>
    
    <div id="patients-list" class="patients-list">
      <!-- Los pacientes se cargarán aquí -->
    </div>
    
    <div class="pagination" id="patients-pagination">
      <!-- Paginación se generará dinámicamente -->
    </div>
  `;
  
  patientsPanel.innerHTML = panelHTML;
  
  // Configurar búsqueda en tiempo real
  setupPatientSearch();
  
  // Cargar filtros de profesionales
  loadProfessionalsFilter();
  
  // Cargar pacientes iniciales
  loadPatients();
}

// ============================================
// BÚSQUEDA Y FILTROS DE PACIENTES
// ============================================

function setupPatientSearch() {
  const searchInput = document.getElementById('patient-search');
  
  // Búsqueda con debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPatients();
    }, 500);
  });
  
  // Filtros
  document.getElementById('status-filter').addEventListener('change', searchPatients);
  document.getElementById('professional-filter').addEventListener('change', searchPatients);
}

async function searchPatients() {
  try {
    const searchTerm = document.getElementById('patient-search').value.trim().toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const professionalFilter = document.getElementById('professional-filter').value;
    
    let query = db.collection('pacientes');
    
    // Aplicar filtros
    if (statusFilter) {
      query = query.where('estado', '==', statusFilter);
    }
    
    if (professionalFilter) {
      query = query.where('profesional_asignado', '==', professionalFilter);
    }
    
    // Ordenar por fecha de creación
    query = query.orderBy('metadata.fecha_creacion', 'desc').limit(50);
    
    const snapshot = await query.get();
    
    let patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      
      // Filtrar por término de búsqueda si existe
      if (!searchTerm || 
          data.numero_ficha?.toLowerCase().includes(searchTerm) ||
          data.datos_contacto?.nombre_completo?.toLowerCase().includes(searchTerm) ||
          data.datos_contacto?.rut?.toLowerCase().includes(searchTerm)) {
        patients.push(data);
      }
    });
    
    displayPatients(patients);
    updatePatientsStats(patients);
    
  } catch (error) {
    console.error('Error searching patients:', error);
    showNotification('Error al buscar pacientes', 'error');
  }
}

async function loadPatients() {
  try {
    document.getElementById('patients-list').innerHTML = 
      '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
    
    const query = db.collection('pacientes')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(20);
    
    const snapshot = await query.get();
    
    const patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      patients.push(data);
    });
    
    displayPatients(patients);
    updatePatientsStats(patients);
    
  } catch (error) {
    console.error('Error loading patients:', error);
    document.getElementById('patients-list').innerHTML = 
      '<p class="error-message">Error al cargar los pacientes.</p>';
  }
}

function displayPatients(patients) {
  const patientsList = document.getElementById('patients-list');
  
  if (patients.length === 0) {
    patientsList.innerHTML = '<p class="no-data">No se encontraron pacientes.</p>';
    return;
  }
  
  let html = '';
  
  patients.forEach(patient => {
    const lastAppointment = patient.citas && patient.citas.length > 0 ? 
      patient.citas[patient.citas.length - 1] : null;
    
    const nextAppointment = patient.proxima_cita || null;
    
    html += `
      <div class="patient-card" data-patient-id="${patient.id}">
        <div class="patient-header">
          <div class="patient-info">
            <div class="patient-avatar">
              ${patient.datos_contacto?.nombre_completo?.substring(0, 2)?.toUpperCase() || 'PA'}
            </div>
            <div class="patient-details">
              <h3 class="patient-name">
                ${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}
              </h3>
              <div class="patient-meta">
                <span class="patient-id">Ficha: ${patient.numero_ficha}</span>
                <span class="patient-rut">${patient.datos_contacto?.rut || 'Sin RUT'}</span>
                <span class="patient-age">${patient.datos_personales?.edad} años</span>
              </div>
            </div>
          </div>
          
          <div class="patient-status">
            <span class="status-badge status-${patient.estado}">
              ${patient.estado?.replace('_', ' ')?.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div class="patient-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <label>Región:</label>
              <span>${patient.datos_personales?.region || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <label>Comuna:</label>
              <span>${patient.datos_personales?.id_comuna_residencia || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <label>Teléfono:</label>
              <span>${patient.datos_contacto?.telefono_principal || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <label>Email:</label>
              <span>${patient.datos_contacto?.email || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <label>Fecha Ingreso:</label>
              <span>${formatDate(patient.metadata?.fecha_creacion)}</span>
            </div>
            <div class="summary-item">
              <label>Última Cita:</label>
              <span>${lastAppointment ? formatDate(lastAppointment.fecha) : 'Sin citas'}</span>
            </div>
          </div>
          
          ${patient.evaluacion_inicial?.sustancias_consumo ? `
          <div class="substances-info">
            <label>Sustancias:</label>
            <div class="substances-tags">
              ${patient.evaluacion_inicial.sustancias_consumo.map(s => 
                `<span class="substance-tag">${s}</span>`
              ).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="patient-actions">
          <button class="btn btn-outline btn-sm" onclick="viewPatientHistory('${patient.id}')">
            <i class="fas fa-history"></i> Historial
          </button>
          <button class="btn btn-primary btn-sm" onclick="viewPatientDetails('${patient.id}')">
            <i class="fas fa-eye"></i> Ver Ficha
          </button>
          <button class="btn btn-success btn-sm" onclick="scheduleAppointment('${patient.id}')">
            <i class="fas fa-calendar-plus"></i> Agendar
          </button>
          <button class="btn btn-secondary btn-sm" onclick="addFollowup('${patient.id}')">
            <i class="fas fa-notes-medical"></i> Seguimiento
          </button>
        </div>
      </div>
    `;
  });
  
  patientsList.innerHTML = html;
}

function updatePatientsStats(patients) {
  const totalCount = patients.length;
  const activeCount = patients.filter(p => ['evaluacion', 'tratamiento', 'seguimiento'].includes(p.estado)).length;
  const treatmentCount = patients.filter(p => p.estado === 'tratamiento').length;
  const followupCount = patients.filter(p => p.estado === 'seguimiento').length;
  
  document.getElementById('total-patients-count').textContent = totalCount;
  document.getElementById('active-patients-count').textContent = activeCount;
  document.getElementById('treatment-patients-count').textContent = treatmentCount;
  document.getElementById('followup-patients-count').textContent = followupCount;
}

// ============================================
// VER DETALLES DE PACIENTE
// ============================================

async function viewPatientDetails(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patient = doc.data();
    showPatientDetailsModal(patientId, patient);
    
  } catch (error) {
    console.error('Error loading patient details:', error);
    showNotification('Error al cargar detalles del paciente', 'error');
  }
}

function showPatientDetailsModal(patientId, patient) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-details-modal">
      <div class="modal extra-large-modal">
        <button class="modal-close" onclick="closeModal('patient-details-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="patient-details-header">
          <div class="patient-avatar large">
            ${patient.datos_contacto?.nombre_completo?.substring(0, 2)?.toUpperCase() || 'PA'}
          </div>
          <div class="patient-title-info">
            <h2>${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}</h2>
            <div class="patient-subtitle">
              <span>Ficha: ${patient.numero_ficha}</span>
              <span class="status-badge status-${patient.estado}">
                ${patient.estado?.replace('_', ' ')?.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="patient-actions-header">
            <button class="btn btn-primary" onclick="editPatientInfo('${patientId}')">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-success" onclick="generatePatientReport('${patientId}')">
              <i class="fas fa-file-pdf"></i> Generar PDF
            </button>
          </div>
        </div>
        
        <div class="patient-details-tabs">
          <button class="tab-btn active" data-tab="personal">Datos Personales</button>
          <button class="tab-btn" data-tab="clinical">Información Clínica</button>
          <button class="tab-btn" data-tab="appointments">Citas</button>
          <button class="tab-btn" data-tab="history">Historial</button>
        </div>
        
        <div class="patient-details-content">
          <!-- Datos Personales -->
          <div class="tab-content active" id="personal-tab">
            <div class="details-section">
              <h3>Información Personal</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Nombre Completo:</label>
                  <span>${patient.datos_contacto?.nombre_completo || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>RUT:</label>
                  <span>${patient.datos_contacto?.rut || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>Edad:</label>
                  <span>${patient.datos_personales?.edad} años</span>
                </div>
                <div class="detail-item">
                  <label>Género:</label>
                  <span>${patient.datos_personales?.genero || 'No especificado'}</span>
                </div>
                <div class="detail-item">
                  <label>Teléfono:</label>
                  <span>${patient.datos_contacto?.telefono_principal || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>Email:</label>
                  <span>${patient.datos_contacto?.email || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>Región:</label>
                  <span>${patient.datos_personales?.region || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>Comuna:</label>
                  <span>${patient.datos_personales?.id_comuna_residencia || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <label>Dirección:</label>
                  <span>${patient.datos_contacto?.direccion || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Información Clínica -->
          <div class="tab-content" id="clinical-tab">
            ${generateClinicalInfoHTML(patient)}
          </div>
          
          <!-- Citas -->
          <div class="tab-content" id="appointments-tab">
            <div id="patient-appointments-list">
              <div class="loading"><div class="spinner"></div> Cargando citas...</div>
            </div>
          </div>
          
          <!-- Historial -->
          <div class="tab-content" id="history-tab">
            <div id="patient-history-list">
              <div class="loading"><div class="spinner"></div> Cargando historial...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Configurar tabs
  setupPatientDetailsTabs();
  
  // Cargar citas y historial
  loadPatientAppointments(patientId);
  loadPatientHistory(patientId);
}

function generateClinicalInfoHTML(patient) {
  const evaluation = patient.evaluacion_inicial || {};
  
  return `
    <div class="details-section">
      <h3>Evaluación Inicial</h3>
      <div class="details-grid">
        <div class="detail-item">
          <label>Sustancias de Consumo:</label>
          <div class="substances-display">
            ${evaluation.sustancias_consumo ? 
              evaluation.sustancias_consumo.map(s => `<span class="substance-tag">${s}</span>`).join('') :
              'No especificado'
            }
          </div>
        </div>
        <div class="detail-item">
          <label>Tiempo de Consumo:</label>
          <span>${evaluation.tiempo_consumo_meses ? `${evaluation.tiempo_consumo_meses} meses` : 'N/A'}</span>
        </div>
        <div class="detail-item">
          <label>Motivación para el Cambio:</label>
          <span>${evaluation.motivacion_cambio || 'N/A'}/10</span>
        </div>
        <div class="detail-item">
          <label>Urgencia Declarada:</label>
          <span class="urgency-${evaluation.urgencia_declarada || 'none'}">
            ${evaluation.urgencia_declarada || 'No especificada'}
          </span>
        </div>
        <div class="detail-item">
          <label>Tratamiento Previo:</label>
          <span>${evaluation.tratamiento_previo || 'No especificado'}</span>
        </div>
      </div>
      
      ${evaluation.descripcion_situacion ? `
      <div class="clinical-notes">
        <h4>Descripción de la Situación:</h4>
        <p>${evaluation.descripcion_situacion}</p>
      </div>
      ` : ''}
    </div>
  `;
}

function setupPatientDetailsTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Actualizar botones
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Actualizar contenido
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId + '-tab').classList.add('active');
    });
  });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function loadProfessionalsFilter() {
  try {
    const professionalsQuery = db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true);
    
    const snapshot = await professionalsQuery.get();
    const select = document.getElementById('professional-filter');
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.nombre} - ${getProfessionName(data.profesion)}`;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading professionals filter:', error);
  }
}

function clearPatientFilters() {
  document.getElementById('patient-search').value = '';
  document.getElementById('status-filter').value = '';
  document.getElementById('professional-filter').value = '';
  loadPatients();
}

async function loadPatientAppointments(patientId) {
  try {
    const appointmentsQuery = db.collection('citas')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc');
    
    const snapshot = await appointmentsQuery.get();
    const appointmentsList = document.getElementById('patient-appointments-list');
    
    if (snapshot.empty) {
      appointmentsList.innerHTML = '<p class="no-data">No hay citas registradas.</p>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const appointment = doc.data();
      html += generateAppointmentHTML(appointment);
    });
    
    appointmentsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading patient appointments:', error);
    document.getElementById('patient-appointments-list').innerHTML = 
      '<p class="error-message">Error al cargar las citas.</p>';
  }
}

async function loadPatientHistory(patientId) {
  try {
    const historyQuery = db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc');
    
    const snapshot = await historyQuery.get();
    const historyList = document.getElementById('patient-history-list');
    
    if (snapshot.empty) {
      historyList.innerHTML = '<p class="no-data">No hay seguimientos registrados.</p>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const followup = doc.data();
      html += generateFollowupHTML(followup);
    });
    
    historyList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading patient history:', error);
    document.getElementById('patient-history-list').innerHTML = 
      '<p class="error-message">Error al cargar el historial.</p>';
  }
}

function generateAppointmentHTML(appointment) {
  return `
    <div class="appointment-item">
      <div class="appointment-header">
        <span class="appointment-date">${formatDate(appointment.fecha)}</span>
        <span class="appointment-status status-${appointment.estado}">${appointment.estado}</span>
      </div>
      <div class="appointment-details">
        <p><strong>Tipo:</strong> ${appointment.tipo || 'Consulta general'}</p>
        <p><strong>Profesional:</strong> ${appointment.profesional_nombre || 'N/A'}</p>
        ${appointment.notas ? `<p><strong>Notas:</strong> ${appointment.notas}</p>` : ''}
      </div>
    </div>
  `;
}

function generateFollowupHTML(followup) {
  return `
    <div class="followup-item">
      <div class="followup-header">
        <span class="followup-date">${formatDate(followup.fecha)}</span>
        <span class="followup-professional">${followup.profesional_nombre || 'N/A'}</span>
      </div>
      <div class="followup-content">
        <p>${followup.notas || 'Sin notas'}</p>
      </div>
    </div>
  `;
}
// ============================================
// SENDA SYSTEM - PARTE 3: SISTEMA DE AGENDA Y CALENDARIO
// ============================================

// Variables globales para agenda
let currentCalendarDate = new Date();
let professionalSchedules = {};
let availableTimeSlots = {};

// ============================================
// CARGAR PANEL DE AGENDA
// ============================================

async function loadCalendarPanel(userData) {
  console.log('Loading calendar panel for:', userData.nombre);
  
  if (!canScheduleAppointments(userData.profesion)) {
    document.getElementById('calendar-panel').innerHTML = 
      '<p class="access-denied">No tienes permisos para gestionar la agenda.</p>';
    return;
  }
  
  const calendarPanel = document.getElementById('calendar-panel');
  
  const panelHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Gestión de Agenda</h1>
      <p class="panel-subtitle">Programa y gestiona citas con profesionales</p>
    </div>
    
    <div class="calendar-toolbar">
      <div class="calendar-controls">
        <button class="btn btn-outline" onclick="previousMonth()">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h3 id="current-month-year"></h3>
        <button class="btn btn-outline" onclick="nextMonth()">
          <i class="fas fa-chevron-right"></i>
        </button>
        <button class="btn btn-secondary" onclick="goToToday()">
          <i class="fas fa-calendar-day"></i> Hoy
        </button>
      </div>
      
      <div class="calendar-actions">
        <button class="btn btn-success" onclick="showScheduleAppointmentModal()">
          <i class="fas fa-calendar-plus"></i> Nueva Cita
        </button>
        <button class="btn btn-primary" onclick="showProfessionalAvailabilityModal()">
          <i class="fas fa-clock"></i> Disponibilidad
        </button>
      </div>
    </div>
    
    <div class="calendar-layout">
      <!-- Lista de Profesionales -->
      <div class="professionals-sidebar">
        <h3>Profesionales</h3>
        <div class="professionals-filter">
          <input type="text" class="form-input" id="professional-search" 
                 placeholder="Buscar profesional...">
        </div>
        <div id="professionals-list" class="professionals-list">
          <!-- Se cargará dinámicamente -->
        </div>
      </div>
      
      <!-- Calendario Principal -->
      <div class="calendar-main">
        <div class="calendar-header">
          <div class="weekdays">
            <div class="weekday">Dom</div>
            <div class="weekday">Lun</div>
            <div class="weekday">Mar</div>
            <div class="weekday">Mié</div>
            <div class="weekday">Jue</div>
            <div class="weekday">Vie</div>
            <div class="weekday">Sáb</div>
          </div>
        </div>
        <div id="calendar-grid" class="calendar-grid">
          <!-- Se generará dinámicamente -->
        </div>
      </div>
      
      <!-- Panel de Detalles del Día -->
      <div class="day-details-panel">
        <h3 id="selected-date-title">Selecciona una fecha</h3>
        <div id="day-appointments" class="day-appointments">
          <p class="no-selection">Haz clic en una fecha para ver las citas programadas</p>
        </div>
      </div>
    </div>
    
    <!-- Resumen de Estadísticas -->
    <div class="calendar-stats">
      <div class="stat-card">
        <div class="stat-number" id="today-appointments">0</div>
        <div class="stat-label">Citas Hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="week-appointments">0</div>
        <div class="stat-label">Esta Semana</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="month-appointments">0</div>
        <div class="stat-label">Este Mes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="available-slots">0</div>
        <div class="stat-label">Horarios Libres</div>
      </div>
    </div>
  `;
  
  calendarPanel.innerHTML = panelHTML;
  
  // Inicializar calendario
  initializeCalendar();
  
  // Cargar profesionales
  loadProfessionalsForCalendar();
  
  // Cargar citas del mes actual
  loadMonthAppointments();
}

// ============================================
// INICIALIZACIÓN DEL CALENDARIO
// ============================================

function initializeCalendar() {
  updateCalendarHeader();
  generateCalendarGrid();
  
  // Configurar búsqueda de profesionales
  const professionalSearch = document.getElementById('professional-search');
  if (professionalSearch) {
    professionalSearch.addEventListener('input', filterProfessionals);
  }
}

function updateCalendarHeader() {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const monthYear = document.getElementById('current-month-year');
  if (monthYear) {
    monthYear.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
  }
}

function generateCalendarGrid() {
  const calendarGrid = document.getElementById('calendar-grid');
  if (!calendarGrid) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  let html = '';
  let dayCounter = 1;
  
  // Generar 6 semanas (42 días)
  for (let week = 0; week < 6; week++) {
    html += '<div class="calendar-week">';
    
    for (let day = 0; day < 7; day++) {
      const dayIndex = week * 7 + day;
      
      if (dayIndex < startingDayOfWeek || dayCounter > daysInMonth) {
        // Día vacío
        html += '<div class="calendar-day empty"></div>';
      } else {
        const currentDate = new Date(year, month, dayCounter);
        const isToday = isDateToday(currentDate);
        const isWeekend = day === 0 || day === 6;
        
        html += `
          <div class="calendar-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}" 
               data-date="${formatDateForData(currentDate)}"
               onclick="selectCalendarDay('${formatDateForData(currentDate)}')">
            <div class="day-number">${dayCounter}</div>
            <div class="day-appointments-count" id="appointments-${formatDateForData(currentDate)}">
              <span class="appointments-indicator"></span>
            </div>
          </div>
        `;
        dayCounter++;
      }
    }
    
    html += '</div>';
  }
  
  calendarGrid.innerHTML = html;
}

// ============================================
// CARGA DE PROFESIONALES
// ============================================

async function loadProfessionalsForCalendar() {
  try {
    const professionalsQuery = db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta', 'asistente_social']);
    
    const snapshot = await professionalsQuery.get();
    const professionalsList = document.getElementById('professionals-list');
    
    if (snapshot.empty) {
      professionalsList.innerHTML = '<p class="no-data">No hay profesionales disponibles.</p>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const professional = doc.data();
      professional.id = doc.id;
      
      html += `
        <div class="professional-item" data-professional-id="${doc.id}">
          <div class="professional-avatar">
            ${professional.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div class="professional-info">
            <div class="professional-name">${professional.nombre}</div>
            <div class="professional-role">${getProfessionName(professional.profesion)}</div>
            <div class="professional-status">
              <span class="status-indicator available"></span>
              <span id="status-${doc.id}">Disponible</span>
            </div>
          </div>
          <div class="professional-actions">
            <button class="btn-icon" onclick="viewProfessionalSchedule('${doc.id}')" 
                    title="Ver horarios">
              <i class="fas fa-calendar-alt"></i>
            </button>
            <button class="btn-icon" onclick="setProfessionalAvailability('${doc.id}')" 
                    title="Configurar disponibilidad">
              <i class="fas fa-clock"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    professionalsList.innerHTML = html;
    
    // Cargar horarios de cada profesional
    snapshot.forEach(doc => {
      loadProfessionalAvailability(doc.id);
    });
    
  } catch (error) {
    console.error('Error loading professionals:', error);
  }
}

async function loadProfessionalAvailability(professionalId) {
  try {
    const availabilityQuery = db.collection('horarios_profesionales')
      .where('profesional_id', '==', professionalId)
      .where('activo', '==', true);
    
    const snapshot = await availabilityQuery.get();
    
    const schedule = {
      lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (schedule[data.dia_semana]) {
        schedule[data.dia_semana].push({
          inicio: data.hora_inicio,
          fin: data.hora_fin,
          duracion_cita: data.duracion_cita_minutos || 60
        });
      }
    });
    
    professionalSchedules[professionalId] = schedule;
    
    // Actualizar estado del profesional
    const hasSchedule = Object.values(schedule).some(day => day.length > 0);
    const statusElement = document.getElementById(`status-${professionalId}`);
    if (statusElement) {
      statusElement.textContent = hasSchedule ? 'Disponible' : 'Sin horarios';
      statusElement.parentElement.querySelector('.status-indicator')
        .className = `status-indicator ${hasSchedule ? 'available' : 'unavailable'}`;
    }
    
  } catch (error) {
    console.error('Error loading professional availability:', error);
  }
}

// ============================================
// GESTIÓN DE CITAS
// ============================================

async function loadMonthAppointments() {
  try {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const appointmentsQuery = db.collection('citas')
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha');
    
    const snapshot = await appointmentsQuery.get();
    
    // Limpiar contadores anteriores
    document.querySelectorAll('.day-appointments-count').forEach(el => {
      el.innerHTML = '<span class="appointments-indicator"></span>';
    });
    
    const appointmentsByDate = {};
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    snapshot.forEach(doc => {
      const appointment = doc.data();
      const appointmentDate = appointment.fecha.toDate();
      const dateKey = formatDateForData(appointmentDate);
      
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(appointment);
      
      // Contar estadísticas
      monthCount++;
      
      if (isDateToday(appointmentDate)) {
        todayCount++;
      }
      
      if (appointmentDate >= weekStart && appointmentDate <= weekEnd) {
        weekCount++;
      }
    });
    
    // Actualizar indicadores en el calendario
    Object.keys(appointmentsByDate).forEach(dateKey => {
      const dayElement = document.getElementById(`appointments-${dateKey}`);
      if (dayElement) {
        const count = appointmentsByDate[dateKey].length;
        dayElement.innerHTML = `
          <span class="appointments-indicator has-appointments"></span>
          <span class="appointments-count">${count}</span>
        `;
      }
    });
    
    // Actualizar estadísticas
    updateCalendarStats(todayCount, weekCount, monthCount);
    
  } catch (error) {
    console.error('Error loading month appointments:', error);
  }
}

function updateCalendarStats(today, week, month) {
  document.getElementById('today-appointments').textContent = today;
  document.getElementById('week-appointments').textContent = week;
  document.getElementById('month-appointments').textContent = month;
  
  // Calcular slots disponibles (simplificado)
  const availableSlots = calculateAvailableSlots();
  document.getElementById('available-slots').textContent = availableSlots;
}

function calculateAvailableSlots() {
  // Lógica simplificada para calcular slots disponibles
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  
  let totalSlots = 0;
  
  Object.values(professionalSchedules).forEach(schedule => {
    Object.values(schedule).forEach(daySchedule => {
      daySchedule.forEach(slot => {
        const duration = slot.duracion_cita || 60;
        const startTime = parseTime(slot.inicio);
        const endTime = parseTime(slot.fin);
        const slots = Math.floor((endTime - startTime) / duration);
        totalSlots += slots;
      });
    });
  });
  
  return totalSlots * 7; // Aproximación para la semana
}

// ============================================
// INTERACCIONES DEL CALENDARIO
// ============================================

async function selectCalendarDay(dateString) {
  const selectedDate = new Date(dateString);
  
  // Resaltar día seleccionado
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
  });
  document.querySelector(`[data-date="${dateString}"]`).classList.add('selected');
  
  // Actualizar título
  const dateTitle = document.getElementById('selected-date-title');
  dateTitle.textContent = formatDateDisplay(selectedDate);
  
  // Cargar citas del día
  await loadDayAppointments(dateString);
}

async function loadDayAppointments(dateString) {
  try {
    const selectedDate = new Date(dateString);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointmentsQuery = db.collection('citas')
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha');
    
    const snapshot = await appointmentsQuery.get();
    const dayAppointments = document.getElementById('day-appointments');
    
    if (snapshot.empty) {
      dayAppointments.innerHTML = `
        <div class="no-appointments">
          <i class="fas fa-calendar-day"></i>
          <p>No hay citas programadas para este día</p>
          <button class="btn btn-primary btn-sm" onclick="scheduleNewAppointment('${dateString}')">
            <i class="fas fa-plus"></i> Programar Cita
          </button>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    // Agrupar por hora
    const appointmentsByHour = {};
    
    for (const doc of snapshot.docs) {
      const appointment = doc.data();
      appointment.id = doc.id;
      
      // Obtener datos del paciente y profesional
      const [patientDoc, professionalDoc] = await Promise.all([
        db.collection('pacientes').doc(appointment.paciente_id).get(),
        db.collection('profesionales').doc(appointment.profesional_id).get()
      ]);
      
      appointment.paciente = patientDoc.exists ? patientDoc.data() : null;
      appointment.profesional = professionalDoc.exists ? professionalDoc.data() : null;
      
      const hour = appointment.fecha.toDate().getHours();
      if (!appointmentsByHour[hour]) {
        appointmentsByHour[hour] = [];
      }
      appointmentsByHour[hour].push(appointment);
    }
    
    // Generar HTML por horas
    const sortedHours = Object.keys(appointmentsByHour).sort((a, b) => parseInt(a) - parseInt(b));
    
    sortedHours.forEach(hour => {
      html += `
        <div class="hour-block">
          <div class="hour-label">${hour}:00</div>
          <div class="hour-appointments">
            ${appointmentsByHour[hour].map(appointment => generateAppointmentCardHTML(appointment)).join('')}
          </div>
        </div>
      `;
    });
    
    dayAppointments.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading day appointments:', error);
    document.getElementById('day-appointments').innerHTML = 
      '<p class="error-message">Error al cargar las citas del día.</p>';
  }
}

function generateAppointmentCardHTML(appointment) {
  const time = appointment.fecha.toDate().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const patientName = appointment.paciente?.datos_contacto?.nombre_completo || 'Paciente no encontrado';
  const professionalName = appointment.profesional?.nombre || 'Profesional no encontrado';
  
  return `
    <div class="appointment-card status-${appointment.estado}" data-appointment-id="${appointment.id}">
      <div class="appointment-time">${time}</div>
      <div class="appointment-info">
        <div class="appointment-patient">${patientName}</div>
        <div class="appointment-professional">${professionalName}</div>
        <div class="appointment-type">${appointment.tipo || 'Consulta general'}</div>
      </div>
      <div class="appointment-actions">
        <button class="btn-icon" onclick="viewAppointmentDetails('${appointment.id}')" title="Ver detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="editAppointment('${appointment.id}')" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon danger" onclick="cancelAppointment('${appointment.id}')" title="Cancelar">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// NAVEGACIÓN DEL CALENDARIO
// ============================================

function previousMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  updateCalendarHeader();
  generateCalendarGrid();
  loadMonthAppointments();
}

function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  updateCalendarHeader();
  generateCalendarGrid();
  loadMonthAppointments();
}

function goToToday() {
  currentCalendarDate = new Date();
  updateCalendarHeader();
  generateCalendarGrid();
  loadMonthAppointments();
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function isDateToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function formatDateForData(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function filterProfessionals() {
  const searchTerm = document.getElementById('professional-search').value.toLowerCase();
  const professionalItems = document.querySelectorAll('.professional-item');
  
  professionalItems.forEach(item => {
    const name = item.querySelector('.professional-name').textContent.toLowerCase();
    const role = item.querySelector('.professional-role').textContent.toLowerCase();
    
    if (name.includes(searchTerm) || role.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Funciones que se implementarán en las siguientes partes
function scheduleNewAppointment(dateString) {
  console.log('Schedule new appointment for:', dateString);
  // Se implementará en la siguiente parte
}

function viewAppointmentDetails(appointmentId) {
  console.log('View appointment details:', appointmentId);
  // Se implementará en la siguiente parte
}

function editAppointment(appointmentId) {
  console.log('Edit appointment:', appointmentId);
  // Se implementará en la siguiente parte
}

function cancelAppointment(appointmentId) {
  if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
    // Se implementará en la siguiente parte
    console.log('Cancel appointment:', appointmentId);
  }
}
// ============================================
// SENDA SYSTEM - PARTE 4: SEGUIMIENTOS E HISTORIAL CLÍNICO
// ============================================

// ============================================
// CARGAR PANEL DE SEGUIMIENTOS
// ============================================

async function loadFollowupsPanel(userData) {
  console.log('Loading followups panel for:', userData.nombre);
  
  if (!canWriteFollowups(userData.profesion)) {
    document.getElementById('followups-panel').innerHTML = 
      '<p class="access-denied">No tienes permisos para realizar seguimientos.</p>';
    return;
  }
  
  const followupsPanel = document.getElementById('followups-panel');
  
  const panelHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos Clínicos</h1>
      <p class="panel-subtitle">Gestiona el historial clínico de tus pacientes</p>
    </div>
    
    <div class="followups-toolbar">
      <div class="search-section">
        <input type="text" class="form-input search-input" id="followup-search" 
               placeholder="Buscar paciente por nombre o ficha...">
        <button class="btn btn-primary" onclick="searchPatientsForFollowup()">
          <i class="fas fa-search"></i> Buscar
        </button>
      </div>
      
      <div class="filter-section">
        <select class="form-select" id="followup-date-filter">
          <option value="today">Citas de Hoy</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="all">Todas</option>
        </select>
        
        <select class="form-select" id="followup-status-filter">
          <option value="">Todos los estados</option>
          <option value="programada">Programada</option>
          <option value="en_curso">En Curso</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
    </div>
    
    <div class="followups-stats">
      <div class="stat-card">
        <div class="stat-number" id="pending-followups">0</div>
        <div class="stat-label">Pendientes Hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="completed-followups">0</div>
        <div class="stat-label">Completadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="total-patients-followup">0</div>
        <div class="stat-label">Pacientes Activos</div>
      </div>
    </div>
    
    <div class="followups-layout">
      <!-- Lista de Pacientes/Citas -->
      <div class="appointments-list-panel">
        <h3>Citas Programadas</h3>
        <div id="scheduled-appointments" class="scheduled-appointments">
          <!-- Se cargará dinámicamente -->
        </div>
      </div>
      
      <!-- Panel de Seguimiento Activo -->
      <div class="active-followup-panel">
        <div id="no-patient-selected" class="no-selection">
          <i class="fas fa-user-md"></i>
          <h3>Selecciona un paciente</h3>
          <p>Elige una cita para comenzar o continuar el seguimiento clínico</p>
        </div>
        
        <div id="patient-followup-interface" class="patient-followup-interface" style="display: none;">
          <!-- Interface de seguimiento se cargará aquí -->
        </div>
      </div>
    </div>
  `;
  
  followupsPanel.innerHTML = panelHTML;
  
  // Configurar filtros y búsqueda
  setupFollowupFilters();
  
  // Cargar citas del profesional
  loadProfessionalAppointments(userData);
}

// ============================================
// CONFIGURACIÓN DE FILTROS Y BÚSQUEDA
// ============================================

function setupFollowupFilters() {
  document.getElementById('followup-date-filter').addEventListener('change', filterAppointments);
  document.getElementById('followup-status-filter').addEventListener('change', filterAppointments);
  
  const searchInput = document.getElementById('followup-search');
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPatientsForFollowup();
    }, 500);
  });
}

async function loadProfessionalAppointments(userData) {
  try {
    const appointmentsList = document.getElementById('scheduled-appointments');
    appointmentsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando citas...</div>';
    
    // Determinar rango de fechas según filtro
    const dateFilter = document.getElementById('followup-date-filter')?.value || 'today';
    const { startDate, endDate } = getDateRange(dateFilter);
    
    let query = db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha');
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      appointmentsList.innerHTML = '<p class="no-data">No hay citas programadas para este período.</p>';
      return;
    }
    
    let html = '';
    let pendingCount = 0;
    let completedCount = 0;
    const uniquePatients = new Set();
    
    for (const doc of snapshot.docs) {
      const appointment = doc.data();
      appointment.id = doc.id;
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(appointment.paciente_id).get();
      if (!patientDoc.exists) continue;
      
      const patient = patientDoc.data();
      uniquePatients.add(appointment.paciente_id);
      
      if (appointment.estado === 'programada') pendingCount++;
      if (appointment.estado === 'completada') completedCount++;
      
      html += generateAppointmentItemHTML(appointment, patient);
    }
    
    appointmentsList.innerHTML = html;
    
    // Actualizar estadísticas
    document.getElementById('pending-followups').textContent = pendingCount;
    document.getElementById('completed-followups').textContent = completedCount;
    document.getElementById('total-patients-followup').textContent = uniquePatients.size;
    
  } catch (error) {
    console.error('Error loading professional appointments:', error);
    document.getElementById('scheduled-appointments').innerHTML = 
      '<p class="error-message">Error al cargar las citas.</p>';
  }
}

function generateAppointmentItemHTML(appointment, patient) {
  const appointmentDate = appointment.fecha.toDate();
  const timeStr = appointmentDate.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const isToday = isDateToday(appointmentDate);
  const isPast = appointmentDate < new Date();
  
  return `
    <div class="appointment-item ${appointment.estado} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}" 
         data-appointment-id="${appointment.id}"
         onclick="selectAppointmentForFollowup('${appointment.id}', '${appointment.paciente_id}')">
      
      <div class="appointment-time">
        <div class="time">${timeStr}</div>
        <div class="date">${appointmentDate.toLocaleDateString('es-CL')}</div>
      </div>
      
      <div class="patient-info">
        <div class="patient-name">${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}</div>
        <div class="patient-details">
          <span>Ficha: ${patient.numero_ficha}</span>
          <span>${patient.datos_personales?.edad} años</span>
        </div>
        <div class="appointment-type">${appointment.tipo || 'Consulta general'}</div>
      </div>
      
      <div class="appointment-status">
        <span class="status-badge status-${appointment.estado}">
          ${appointment.estado.replace('_', ' ').toUpperCase()}
        </span>
        ${appointment.estado === 'programada' && isToday ? 
          '<span class="priority-indicator">HOY</span>' : ''}
      </div>
      
      <div class="appointment-actions" onclick="event.stopPropagation()">
        ${appointment.estado === 'programada' ? `
          <button class="btn btn-success btn-sm" onclick="startFollowup('${appointment.id}', '${appointment.paciente_id}')">
            <i class="fas fa-play"></i> Iniciar
          </button>
        ` : ''}
        <button class="btn btn-outline btn-sm" onclick="viewAppointmentHistory('${appointment.paciente_id}')">
          <i class="fas fa-history"></i> Historial
        </button>
      </div>
    </div>
  `;
}

// ============================================
// INTERFACE DE SEGUIMIENTO CLÍNICO
// ============================================

async function selectAppointmentForFollowup(appointmentId, patientId) {
  try {
    // Resaltar cita seleccionada
    document.querySelectorAll('.appointment-item').forEach(item => {
      item.classList.remove('selected');
    });
    document.querySelector(`[data-appointment-id="${appointmentId}"]`).classList.add('selected');
    
    // Cargar datos del paciente y cita
    const [appointmentDoc, patientDoc] = await Promise.all([
      db.collection('citas').doc(appointmentId).get(),
      db.collection('pacientes').doc(patientId).get()
    ]);
    
    if (!appointmentDoc.exists || !patientDoc.exists) {
      showNotification('Error al cargar los datos', 'error');
      return;
    }
    
    const appointment = appointmentDoc.data();
    const patient = patientDoc.data();
    
    showPatientFollowupInterface(appointmentId, appointment, patientId, patient);
    
  } catch (error) {
    console.error('Error selecting appointment:', error);
    showNotification('Error al seleccionar la cita', 'error');
  }
}

function showPatientFollowupInterface(appointmentId, appointment, patientId, patient) {
  const noPatientSelected = document.getElementById('no-patient-selected');
  const followupInterface = document.getElementById('patient-followup-interface');
  
  noPatientSelected.style.display = 'none';
  followupInterface.style.display = 'block';
  
  const interfaceHTML = `
    <div class="followup-header">
      <div class="patient-summary">
        <div class="patient-avatar">
          ${patient.datos_contacto?.nombre_completo?.substring(0, 2)?.toUpperCase() || 'PA'}
        </div>
        <div class="patient-details">
          <h3>${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}</h3>
          <div class="patient-meta">
            <span>Ficha: ${patient.numero_ficha}</span>
            <span>${patient.datos_personales?.edad} años</span>
            <span class="status-badge status-${patient.estado}">${patient.estado}</span>
          </div>
        </div>
      </div>
      
      <div class="appointment-summary">
        <div class="appointment-date">
          ${appointment.fecha.toDate().toLocaleDateString('es-CL')} - 
          ${appointment.fecha.toDate().toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
        </div>
        <div class="appointment-type">${appointment.tipo || 'Consulta general'}</div>
      </div>
    </div>
    
    <div class="followup-tabs">
      <button class="tab-btn active" data-tab="current">Sesión Actual</button>
      <button class="tab-btn" data-tab="history">Historial Clínico</button>
      <button class="tab-btn" data-tab="plans">Planes de Tratamiento</button>
    </div>
    
    <div class="followup-content">
      <!-- Sesión Actual -->
      <div class="tab-content active" id="current-tab">
        ${generateCurrentSessionHTML(appointmentId, appointment)}
      </div>
      
      <!-- Historial Clínico -->
      <div class="tab-content" id="history-tab">
        <div id="clinical-history-content">
          <div class="loading"><div class="spinner"></div> Cargando historial...</div>
        </div>
      </div>
      
      <!-- Planes de Tratamiento -->
      <div class="tab-content" id="plans-tab">
        <div id="treatment-plans-content">
          <div class="loading"><div class="spinner"></div> Cargando planes...</div>
        </div>
      </div>
    </div>
  `;
  
  followupInterface.innerHTML = interfaceHTML;
  
  // Configurar tabs
  setupFollowupTabs();
  
  // Cargar historial clínico
  loadClinicalHistory(patientId);
  
  // Cargar planes de tratamiento
  loadTreatmentPlans(patientId);
}

function generateCurrentSessionHTML(appointmentId, appointment) {
  const isStarted = appointment.estado === 'en_curso';
  const isCompleted = appointment.estado === 'completada';
  
  return `
    <div class="current-session">
      ${!isStarted && !isCompleted ? `
      <div class="session-start">
        <button class="btn btn-success btn-lg" onclick="startAppointmentSession('${appointmentId}')">
          <i class="fas fa-play"></i> Iniciar Sesión
        </button>
      </div>
      ` : ''}
      
      <form id="followup-form" class="followup-form" ${!isStarted && !isCompleted ? 'style="display: none;"' : ''}>
        <div class="form-sections">
          <!-- Observaciones Clínicas -->
          <div class="form-section">
            <h4><i class="fas fa-eye"></i> Observaciones Clínicas</h4>
            <textarea class="form-textarea" id="clinical-observations" 
                      placeholder="Describe el estado general del paciente, comportamiento observado, apariencia física..."
                      ${isCompleted ? 'readonly' : ''}></textarea>
          </div>
          
          <!-- Evaluación del Estado -->
          <div class="form-section">
            <h4><i class="fas fa-chart-line"></i> Evaluación del Estado</h4>
            <div class="evaluation-grid">
              <div class="evaluation-item">
                <label>Estado de Ánimo:</label>
                <select class="form-select" id="mood-state" ${isCompleted ? 'disabled' : ''}>
                  <option value="">Seleccionar...</option>
                  <option value="estable">Estable</option>
                  <option value="ansioso">Ansioso</option>
                  <option value="deprimido">Deprimido</option>
                  <option value="irritable">Irritable</option>
                  <option value="eufórico">Eufórico</option>
                </select>
              </div>
              
              <div class="evaluation-item">
                <label>Nivel de Consumo (últimos 7 días):</label>
                <select class="form-select" id="consumption-level" ${isCompleted ? 'disabled' : ''}>
                  <option value="">Seleccionar...</option>
                  <option value="abstinencia">Abstinencia completa</option>
                  <option value="reducido">Consumo reducido</option>
                  <option value="moderado">Consumo moderado</option>
                  <option value="alto">Consumo alto</option>
                  <option value="recaída">Recaída</option>
                </select>
              </div>
              
              <div class="evaluation-item">
                <label>Adherencia al Tratamiento:</label>
                <select class="form-select" id="treatment-adherence" ${isCompleted ? 'disabled' : ''}>
                  <option value="">Seleccionar...</option>
                  <option value="excelente">Excelente</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="deficiente">Deficiente</option>
                </select>
              </div>
              
              <div class="evaluation-item">
                <label>Motivación para el Cambio (1-10):</label>
                <input type="range" class="form-range" id="motivation-level" 
                       min="1" max="10" value="5" ${isCompleted ? 'disabled' : ''}>
                <span id="motivation-value">5</span>
              </div>
            </div>
          </div>
          
          <!-- Intervenciones Realizadas -->
          <div class="form-section">
            <h4><i class="fas fa-tools"></i> Intervenciones Realizadas</h4>
            <div class="interventions-checklist">
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="psicoeducacion" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Psicoeducación
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="entrevista_motivacional" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Entrevista Motivacional
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="terapia_cognitiva" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Terapia Cognitivo-Conductual
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="plan_prevencion" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Plan de Prevención de Recaídas
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="apoyo_familiar" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Trabajo con Familia/Red de Apoyo
              </label>
              <label class="checkbox-option">
                <input type="checkbox" name="interventions" value="derivacion" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                Derivación a Especialista
              </label>
            </div>
          </div>
          
          <!-- Objetivos y Tareas -->
          <div class="form-section">
            <h4><i class="fas fa-tasks"></i> Objetivos para la Próxima Sesión</h4>
            <textarea class="form-textarea" id="next-objectives" 
                      placeholder="Define objetivos específicos y tareas para el paciente hasta la próxima sesión..."
                      ${isCompleted ? 'readonly' : ''}></textarea>
          </div>
          
          <!-- Riesgo y Alertas -->
          <div class="form-section">
            <h4><i class="fas fa-exclamation-triangle"></i> Evaluación de Riesgo</h4>
            <div class="risk-assessment">
              <div class="risk-item">
                <label>Riesgo de Recaída:</label>
                <select class="form-select" id="relapse-risk" ${isCompleted ? 'disabled' : ''}>
                  <option value="bajo">Bajo</option>
                  <option value="moderado">Moderado</option>
                  <option value="alto">Alto</option>
                  <option value="crítico">Crítico</option>
                </select>
              </div>
              
              <div class="risk-item">
                <label>Riesgo de Abandono:</label>
                <select class="form-select" id="dropout-risk" ${isCompleted ? 'disabled' : ''}>
                  <option value="bajo">Bajo</option>
                  <option value="moderado">Moderado</option>
                  <option value="alto">Alto</option>
                  <option value="crítico">Crítico</option>
                </select>
              </div>
              
              <label class="checkbox-option">
                <input type="checkbox" id="suicide-risk" ${isCompleted ? 'disabled' : ''}>
                <span class="checkbox-custom"></span>
                <span class="risk-warning">Riesgo de autolesión/suicidio</span>
              </label>
            </div>
            
            <textarea class="form-textarea" id="risk-notes" 
                      placeholder="Especifica factores de riesgo identificados y medidas de seguridad recomendadas..."
                      ${isCompleted ? 'readonly' : ''}></textarea>
          </div>
        </div>
        
        ${!isCompleted ? `
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="saveDraftFollowup('${appointmentId}')">
            <i class="fas fa-save"></i> Guardar Borrador
          </button>
          <button type="button" class="btn btn-success" onclick="completeFollowupSession('${appointmentId}')">
            <i class="fas fa-check"></i> Completar Sesión
          </button>
        </div>
        ` : `
        <div class="completion-info">
          <i class="fas fa-check-circle"></i>
          <span>Sesión completada el ${formatDate(appointment.fecha_completada)}</span>
        </div>
        `}
      </form>
    </div>
  `;
}

// ============================================
// GESTIÓN DE SESIONES DE SEGUIMIENTO
// ============================================

async function startAppointmentSession(appointmentId) {
  try {
    showLoading(true);
    
    // Actualizar estado de la cita
    await db.collection('citas').doc(appointmentId).update({
      estado: 'en_curso',
      fecha_inicio: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Mostrar formulario
    document.querySelector('.session-start').style.display = 'none';
    document.getElementById('followup-form').style.display = 'block';
    
    showNotification('Sesión iniciada correctamente', 'success');
    
  } catch (error) {
    console.error('Error starting session:', error);
    showNotification('Error al iniciar la sesión', 'error');
  } finally {
    showLoading(false);
  }
}

async function completeFollowupSession(appointmentId) {
  try {
    showLoading(true);
    
    // Recopilar datos del formulario
    const followupData = collectFollowupFormData();
    
    // Validar datos obligatorios
    if (!followupData.clinical_observations.trim()) {
      showNotification('Las observaciones clínicas son obligatorias', 'error');
      showLoading(false);
      return;
    }
    
    // Actualizar cita
    await db.collection('citas').doc(appointmentId).update({
      estado: 'completada',
      fecha_completada: firebase.firestore.FieldValue.serverTimestamp(),
      notas_sesion: followupData.clinical_observations
    });
    
    // Crear registro de seguimiento
    const appointmentDoc = await db.collection('citas').doc(appointmentId).get();
    const appointment = appointmentDoc.data();
    
    const followupRecord = {
      paciente_id: appointment.paciente_id,
      profesional_id: currentUserData.uid,
      profesional_nombre: currentUserData.nombre,
      cita_id: appointmentId,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo_sesion: appointment.tipo || 'consulta_general',
      
      observaciones_clinicas: followupData.clinical_observations,
      evaluacion_estado: {
        estado_animo: followupData.mood_state,
        nivel_consumo: followupData.consumption_level,
        adherencia_tratamiento: followupData.treatment_adherence,
        motivacion_cambio: parseInt(followupData.motivation_level)
      },
      
      intervenciones_realizadas: followupData.interventions,
      objetivos_proxima_sesion: followupData.next_objectives,
      
      evaluacion_riesgo: {
        riesgo_recaida: followupData.relapse_risk,
        riesgo_abandono: followupData.dropout_risk,
        riesgo_suicidio: followupData.suicide_risk,
        notas_riesgo: followupData.risk_notes
      },
      
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        profesion_responsable: currentUserData.profesion
      }
    };
    
    await db.collection('seguimientos').add(followupRecord);
    
    // Si hay riesgo de suicidio, crear alerta
    if (followupData.suicide_risk) {
      await createSuicideRiskAlert(appointment.paciente_id, appointmentId);
    }
    
    showNotification('Sesión completada y guardada correctamente', 'success');
    
    // Recargar citas
    loadProfessionalAppointments(currentUserData);
    
    // Actualizar interfaz
    const form = document.getElementById('followup-form');
    form.innerHTML = generateCurrentSessionHTML(appointmentId, {
      ...appointment,
      estado: 'completada',
      fecha_completada: new Date()
    });
    
  } catch (error) {
    console.error('Error completing session:', error);
    showNotification('Error al completar la sesión', 'error');
  } finally {
    showLoading(false);
  }
}

function collectFollowupFormData() {
  // Recopilar intervenciones seleccionadas
  const interventions = Array.from(document.querySelectorAll('input[name="interventions"]:checked'))
    .map(cb => cb.value);
  
  return {
    clinical_observations: document.getElementById('clinical-observations').value,
    mood_state: document.getElementById('mood-state').value,
    consumption_level: document.getElementById('consumption-level').value,
    treatment_adherence: document.getElementById('treatment-adherence').value,
    motivation_level: document.getElementById('motivation-level').value,
    interventions: interventions,
    next_objectives: document.getElementById('next-objectives').value,
    relapse_risk: document.getElementById('relapse-risk').value,
    dropout_risk: document.getElementById('dropout-risk').value,
    suicide_risk: document.getElementById('suicide-risk').checked,
    risk_notes: document.getElementById('risk-notes').value
  };
}

async function createSuicideRiskAlert(patientId, appointmentId) {
  try {
    await db.collection('alertas_criticas').add({
      tipo_alerta: 'riesgo_suicidio',
      paciente_id: patientId,
      cita_id: appointmentId,
      profesional_id: currentUserData.uid,
      profesional_nombre: currentUserData.nombre,
      prioridad: 'maxima',
      mensaje: `Riesgo de suicidio identificado en seguimiento clínico`,
      estado: 'pendiente',
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      requiere_atencion_inmediata: true
    });
    
    showNotification('ALERTA: Se ha creado una notificación de riesgo de suicidio', 'error', 10000);
    
  } catch (error) {
    console.error('Error creating suicide risk alert:', error);
  }
}

// ============================================
// CARGA DE HISTORIAL CLÍNICO
// ============================================

async function loadClinicalHistory(patientId) {
  try {
    const historyQuery = db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc')
      .limit(20);
    
    const snapshot = await historyQuery.get();
    const historyContent = document.getElementById('clinical-history-content');
    
    if (snapshot.empty) {
      historyContent.innerHTML = '<p class="no-data">No hay registros en el historial clínico.</p>';
      return;
    }
    
    let html = '<div class="clinical-history-timeline">';
    
    snapshot.forEach(doc => {
      const record = doc.data();
      html += generateHistoryRecordHTML(record);
    });
    
    html += '</div>';
    historyContent.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading clinical history:', error);
    document.getElementById('clinical-history-content').innerHTML = 
      '<p class="error-message">Error al cargar el historial clínico.</p>';
  }
}

function generateHistoryRecordHTML(record) {
  const recordDate = record.fecha.toDate();
  
  return `
    <div class="history-record">
      <div class="record-timeline">
        <div class="timeline-marker"></div>
        <div class="timeline-date">
          ${recordDate.toLocaleDateString('es-CL')}
          <br>
          ${recordDate.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
        </div>
      </div>
      
      <div class="record-content">
        <div class="record-header">
          <h4>${record.tipo_sesion?.replace('_', ' ')?.toUpperCase() || 'CONSULTA'}</h4>
          <span class="record-professional">${record.profesional_nombre}</span>
        </div>
        
        <div class="record-details">
          <div class="detail-section">
            <strong>Observaciones Clínicas:</strong>
            <p>${record.observaciones_clinicas}</p>
          </div>
          
          ${record.evaluacion_estado ? `
          <div class="detail-section">
            <strong>Evaluación del Estado:</strong>
            <div class="evaluation-summary">
              ${record.evaluacion_estado.estado_animo ? 
                `<span class="eval-item">Ánimo: ${record.evaluacion_estado.estado_animo}</span>` : ''}
              ${record.evaluacion_estado.nivel_consumo ? 
                `<span class="eval-item">Consumo: ${record.evaluacion_estado.nivel_consumo}</span>` : ''}
              ${record.evaluacion_estado.motivacion_cambio ? 
                `<span class="eval-item">Motivación: ${record.evaluacion_estado.motivacion_cambio}/10</span>` : ''}
            </div>
          </div>
          ` : ''}
          
          ${record.intervenciones_realizadas && record.intervenciones_realizadas.length > 0 ? `
          <div class="detail-section">
            <strong>Intervenciones:</strong>
            <div class="interventions-tags">
              ${record.intervenciones_realizadas.map(intervention => 
                `<span class="intervention-tag">${intervention.replace('_', ' ')}</span>`
              ).join('')}
            </div>
          </div>
          ` : ''}
          
          ${record.objetivos_proxima_sesion ? `
          <div class="detail-section">
            <strong>Objetivos:</strong>
            <p>${record.objetivos_proxima_sesion}</p>
          </div>
          ` : ''}
          
          ${record.evaluacion_riesgo ? `
          <div class="detail-section risk-section">
            <strong>Evaluación de Riesgo:</strong>
            <div class="risk-summary">
              <span class="risk-item risk-${record.evaluacion_riesgo.riesgo_recaida}">
                Recaída: ${record.evaluacion_riesgo.riesgo_recaida}
              </span>
              ${record.evaluacion_riesgo.riesgo_suicidio ? 
                '<span class="risk-item risk-critical">⚠️ Riesgo de suicidio</span>' : ''}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function setupFollowupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Actualizar botones
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Actualizar contenido
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId + '-tab').classList.add('active');
    });
  });
  
  // Configurar slider de motivación
  const motivationSlider = document.getElementById('motivation-level');
  const motivationValue = document.getElementById('motivation-value');
  
  if (motivationSlider && motivationValue) {
    motivationSlider.addEventListener('input', function() {
      motivationValue.textContent = this.value;
    });
  }
}

function getDateRange(filter) {
  const now = new Date();
  let startDate, endDate;
  
  switch (filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      break;
      
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      break;
      
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
      
    default: // 'all'
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() + 1, 11, 31);
  }
  
  return { startDate, endDate };
}

async function filterAppointments() {
  if (currentUserData) {
    await loadProfessionalAppointments(currentUserData);
  }
}

async function searchPatientsForFollowup() {
  // Esta función permite buscar pacientes específicos para crear seguimientos
  const searchTerm = document.getElementById('followup-search').value.trim();
  if (!searchTerm) {
    filterAppointments();
    return;
  }
  
  // Implementar lógica de búsqueda de pacientes
  console.log('Searching patients for followup:', searchTerm);
}

async function saveDraftFollowup(appointmentId) {
  try {
    const followupData = collectFollowupFormData();
    
    // Guardar como borrador en localStorage o Firebase
    localStorage.setItem(`followup_draft_${appointmentId}`, JSON.stringify(followupData));
    
    showNotification('Borrador guardado', 'success', 2000);
    
  } catch (error) {
    console.error('Error saving draft:', error);
    showNotification('Error al guardar borrador', 'error');
  }
}

// Función placeholder para planes de tratamiento
async function loadTreatmentPlans(patientId) {
  document.getElementById('treatment-plans-content').innerHTML = 
    '<p class="no-data">Función de planes de tratamiento en desarrollo.</p>';
}
// ============================================
// SENDA SYSTEM - PARTE 5: SISTEMA DE REPORTES Y PDFs
// ============================================

// ============================================
// CARGAR PANEL DE REPORTES
// ============================================

async function loadReportsPanel(userData) {
  console.log('Loading reports panel for:', userData.nombre);
  
  if (!canGenerateReports(userData.profesion)) {
    document.getElementById('reports-panel').innerHTML = 
      '<p class="access-denied">No tienes permisos para generar reportes.</p>';
    return;
  }
  
  const reportsPanel = document.getElementById('reports-panel');
  
  const panelHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Generación de Reportes</h1>
      <p class="panel-subtitle">Genera reportes clínicos y estadísticos del programa</p>
    </div>
    
    <div class="reports-grid">
      <!-- Reportes de Pacientes -->
      <div class="report-category">
        <h3><i class="fas fa-user-md"></i> Reportes de Pacientes</h3>
        <div class="report-cards">
          <div class="report-card" onclick="showPatientReportOptions()">
            <div class="report-icon">
              <i class="fas fa-file-medical-alt"></i>
            </div>
            <div class="report-info">
              <h4>Ficha Clínica Completa</h4>
              <p>Genera PDF con historial completo del paciente</p>
            </div>
            <div class="report-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
          
          <div class="report-card" onclick="showEvolutionReportOptions()">
            <div class="report-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="report-info">
              <h4>Reporte de Evolución</h4>
              <p>Seguimiento de progreso y evolución del tratamiento</p>
            </div>
            <div class="report-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
          
          <div class="report-card" onclick="showSummaryReportOptions()">
            <div class="report-icon">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="report-info">
              <h4>Resumen Ejecutivo</h4>
              <p>Resumen condensado para derivaciones o alta</p>
            </div>
            <div class="report-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reportes Estadísticos -->
      <div class="report-category">
        <h3><i class="fas fa-chart-bar"></i> Reportes Estadísticos</h3>
        <div class="report-cards">
          <div class="report-card" onclick="showStatisticalReports()">
            <div class="report-icon">
              <i class="fas fa-analytics"></i>
            </div>
            <div class="report-info">
              <h4>Estadísticas del Centro</h4>
              <p>Indicadores de desempeño y resultados</p>
            </div>
            <div class="report-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
          
          <div class="report-card" onclick="showCaseloadReports()">
            <div class="report-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="report-info">
              <h4>Carga de Casos</h4>
              <p>Distribución de pacientes por profesional</p>
            </div>
            <div class="report-action">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Historial de Reportes Generados -->
    <div class="reports-history">
      <h3>Reportes Generados Recientemente</h3>
      <div id="reports-history-list" class="reports-history-list">
        <!-- Se cargará dinámicamente -->
      </div>
    </div>
  `;
  
  reportsPanel.innerHTML = panelHTML;
  
  // Cargar historial de reportes
  loadReportsHistory(userData);
}

// ============================================
// GENERACIÓN DE FICHA CLÍNICA COMPLETA
// ============================================

function showPatientReportOptions() {
  const modalHTML = `
    <div class="modal-overlay" id="patient-report-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-report-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <h2>Generar Ficha Clínica Completa</h2>
        
        <div class="patient-search-section">
          <div class="form-group">
            <label class="form-label">Buscar Paciente</label>
            <input type="text" class="form-input" id="report-patient-search" 
                   placeholder="Buscar por nombre, RUT o número de ficha...">
          </div>
          
          <div id="patient-search-results" class="patient-search-results">
            <!-- Resultados de búsqueda -->
          </div>
        </div>
        
        <div id="selected-patient-info" class="selected-patient-info" style="display: none;">
          <h3>Paciente Seleccionado</h3>
          <div class="patient-summary">
            <!-- Información del paciente seleccionado -->
          </div>
          
          <div class="report-options">
            <h4>Opciones del Reporte</h4>
            
            <div class="options-grid">
              <label class="checkbox-option">
                <input type="checkbox" id="include-personal-data" checked>
                <span class="checkbox-custom"></span>
                Datos Personales y de Contacto
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="include-initial-evaluation" checked>
                <span class="checkbox-custom"></span>
                Evaluación Inicial
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="include-clinical-history" checked>
                <span class="checkbox-custom"></span>
                Historial de Seguimientos
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="include-appointments" checked>
                <span class="checkbox-custom"></span>
                Registro de Citas
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="include-evolution-charts">
                <span class="checkbox-custom"></span>
                Gráficos de Evolución
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" id="include-risk-assessment">
                <span class="checkbox-custom"></span>
                Evaluaciones de Riesgo
              </label>
            </div>
            
            <div class="form-group">
              <label class="form-label">Período del Reporte</label>
              <div class="form-row">
                <input type="date" class="form-input" id="report-start-date">
                <input type="date" class="form-input" id="report-end-date">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Observaciones Adicionales (opcional)</label>
              <textarea class="form-textarea" id="report-additional-notes" 
                        placeholder="Notas especiales para incluir en el reporte..."></textarea>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal('patient-report-modal')">Cancelar</button>
            <button class="btn btn-primary" onclick="previewPatientReport()">
              <i class="fas fa-eye"></i> Vista Previa
            </button>
            <button class="btn btn-success" onclick="generatePatientReport()">
              <i class="fas fa-file-pdf"></i> Generar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Configurar búsqueda de pacientes
  setupPatientReportSearch();
}

function setupPatientReportSearch() {
  const searchInput = document.getElementById('report-patient-search');
  
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPatientsForReport(this.value.trim());
    }, 500);
  });
}

async function searchPatientsForReport(searchTerm) {
  if (!searchTerm) {
    document.getElementById('patient-search-results').innerHTML = '';
    return;
  }
  
  try {
    const resultsContainer = document.getElementById('patient-search-results');
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando...</div>';
    
    // Buscar pacientes
    const patientsQuery = db.collection('pacientes')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(20);
    
    const snapshot = await patientsQuery.get();
    
    const matchingPatients = [];
    snapshot.forEach(doc => {
      const patient = doc.data();
      patient.id = doc.id;
      
      const searchLower = searchTerm.toLowerCase();
      const name = patient.datos_contacto?.nombre_completo?.toLowerCase() || '';
      const rut = patient.datos_contacto?.rut?.toLowerCase() || '';
      const ficha = patient.numero_ficha?.toLowerCase() || '';
      
      if (name.includes(searchLower) || rut.includes(searchLower) || ficha.includes(searchLower)) {
        matchingPatients.push(patient);
      }
    });
    
    if (matchingPatients.length === 0) {
      resultsContainer.innerHTML = '<p class="no-data">No se encontraron pacientes.</p>';
      return;
    }
    
    let html = '';
    matchingPatients.forEach(patient => {
      html += `
        <div class="patient-search-item" onclick="selectPatientForReport('${patient.id}', '${patient.numero_ficha}')">
          <div class="patient-avatar">
            ${patient.datos_contacto?.nombre_completo?.substring(0, 2)?.toUpperCase() || 'PA'}
          </div>
          <div class="patient-info">
            <div class="patient-name">${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}</div>
            <div class="patient-details">
              <span>Ficha: ${patient.numero_ficha}</span>
              <span>${patient.datos_contacto?.rut || 'Sin RUT'}</span>
              <span>${patient.datos_personales?.edad} años</span>
            </div>
          </div>
          <div class="patient-status">
            <span class="status-badge status-${patient.estado}">${patient.estado}</span>
          </div>
        </div>
      `;
    });
    
    resultsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error searching patients:', error);
    document.getElementById('patient-search-results').innerHTML = 
      '<p class="error-message">Error al buscar pacientes.</p>';
  }
}

async function selectPatientForReport(patientId, fichaNumber) {
  try {
    // Cargar datos completos del paciente
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patient = patientDoc.data();
    
    // Mostrar información del paciente seleccionado
    const selectedInfo = document.getElementById('selected-patient-info');
    selectedInfo.style.display = 'block';
    
    const patientSummary = selectedInfo.querySelector('.patient-summary');
    patientSummary.innerHTML = `
      <div class="selected-patient-card">
        <div class="patient-avatar large">
          ${patient.datos_contacto?.nombre_completo?.substring(0, 2)?.toUpperCase() || 'PA'}
        </div>
        <div class="patient-details">
          <h4>${patient.datos_contacto?.nombre_completo || 'Paciente Anónimo'}</h4>
          <div class="patient-meta">
            <span>Ficha: ${patient.numero_ficha}</span>
            <span>${patient.datos_contacto?.rut || 'Sin RUT'}</span>
            <span>${patient.datos_personales?.edad} años</span>
            <span class="status-badge status-${patient.estado}">${patient.estado}</span>
          </div>
          <div class="patient-dates">
            <span>Ingreso: ${formatDate(patient.metadata?.fecha_creacion)}</span>
          </div>
        </div>
      </div>
    `;
    
    // Configurar fechas por defecto
    const endDate = new Date();
    const startDate = new Date(patient.metadata?.fecha_creacion?.toDate() || endDate);
    
    document.getElementById('report-start-date').value = formatDateForInput(startDate);
    document.getElementById('report-end-date').value = formatDateForInput(endDate);
    
    // Guardar ID del paciente para uso posterior
    selectedInfo.dataset.patientId = patientId;
    
  } catch (error) {
    console.error('Error selecting patient:', error);
    showNotification('Error al seleccionar paciente', 'error');
  }
}

// ============================================
// GENERACIÓN DEL PDF
// ============================================

async function generatePatientReport() {
  try {
    showLoading(true);
    
    const selectedInfo = document.getElementById('selected-patient-info');
    const patientId = selectedInfo.dataset.patientId;
    
    if (!patientId) {
      showNotification('No hay paciente seleccionado', 'error');
      return;
    }
    
    // Recopilar opciones del reporte
    const reportOptions = {
      includePersonalData: document.getElementById('include-personal-data').checked,
      includeInitialEvaluation: document.getElementById('include-initial-evaluation').checked,
      includeClinicalHistory: document.getElementById('include-clinical-history').checked,
      includeAppointments: document.getElementById('include-appointments').checked,
      includeEvolutionCharts: document.getElementById('include-evolution-charts').checked,
      includeRiskAssessment: document.getElementById('include-risk-assessment').checked,
      startDate: new Date(document.getElementById('report-start-date').value),
      endDate: new Date(document.getElementById('report-end-date').value),
      additionalNotes: document.getElementById('report-additional-notes').value
    };
    
    // Cargar todos los datos necesarios
    const reportData = await gatherPatientReportData(patientId, reportOptions);
    
    // Generar el PDF
    await createPatientPDF(reportData, reportOptions);
    
    // Registrar el reporte generado
    await saveReportRecord(patientId, 'ficha_clinica_completa', reportOptions);
    
    closeModal('patient-report-modal');
    showNotification('Reporte generado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error generating patient report:', error);
    showNotification('Error al generar el reporte', 'error');
  } finally {
    showLoading(false);
  }
}

async function gatherPatientReportData(patientId, options) {
  const data = {};
  
  // Datos del paciente
  const patientDoc = await db.collection('pacientes').doc(patientId).get();
  data.patient = patientDoc.data();
  
  // Historial de seguimientos
  if (options.includeClinicalHistory) {
    const followupsQuery = db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .where('fecha', '>=', options.startDate)
      .where('fecha', '<=', options.endDate)
      .orderBy('fecha', 'desc');
    
    const followupsSnapshot = await followupsQuery.get();
    data.followups = [];
    followupsSnapshot.forEach(doc => {
      data.followups.push(doc.data());
    });
  }
  
  // Citas
  if (options.includeAppointments) {
    const appointmentsQuery = db.collection('citas')
      .where('paciente_id', '==', patientId)
      .where('fecha', '>=', options.startDate)
      .where('fecha', '<=', options.endDate)
      .orderBy('fecha', 'desc');
    
    const appointmentsSnapshot = await appointmentsQuery.get();
    data.appointments = [];
    appointmentsSnapshot.forEach(doc => {
      data.appointments.push(doc.data());
    });
  }
  
  // Evaluaciones de riesgo
  if (options.includeRiskAssessment) {
    data.riskAssessments = data.followups?.filter(f => f.evaluacion_riesgo) || [];
  }
  
  return data;
}

async function createPatientPDF(reportData, options) {
  // Crear contenido HTML para el PDF
  const htmlContent = generatePatientReportHTML(reportData, options);
  
  // Crear ventana temporal para imprimir/guardar como PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Configurar e imprimir
  printWindow.onload = function() {
    printWindow.print();
  };
}

function generatePatientReportHTML(data, options) {
  const patient = data.patient;
  const now = new Date();
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ficha Clínica - ${patient.datos_contacto?.nombre_completo || 'Paciente'}</title>
      <style>
        ${getPDFStyles()}
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <div class="logo-section">
          <h1>PROGRAMA SENDA</h1>
          <h2>FICHA CLÍNICA COMPLETA</h2>
        </div>
        <div class="report-info">
          <p><strong>Fecha de Generación:</strong> ${formatDate(now)}</p>
          <p><strong>Generado por:</strong> ${currentUserData.nombre}</p>
          <p><strong>Profesión:</strong> ${getProfessionName(currentUserData.profesion)}</p>
        </div>
      </div>
  `;
  
  // Datos personales
  if (options.includePersonalData) {
    html += generatePersonalDataSection(patient);
  }
  
  // Evaluación inicial
  if (options.includeInitialEvaluation) {
    html += generateInitialEvaluationSection(patient);
  }
  
  // Historial clínico
  if (options.includeClinicalHistory && data.followups) {
    html += generateClinicalHistorySection(data.followups);
  }
  
  // Registro de citas
  if (options.includeAppointments && data.appointments) {
    html += generateAppointmentsSection(data.appointments);
  }
  
  // Evaluación de riesgo
  if (options.includeRiskAssessment && data.riskAssessments) {
    html += generateRiskAssessmentSection(data.riskAssessments);
  }
  
  // Notas adicionales
  if (options.additionalNotes) {
    html += `
      <div class="pdf-section">
        <h3>OBSERVACIONES ADICIONALES</h3>
        <div class="notes-content">
          ${options.additionalNotes.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }
  
  html += `
      <div class="pdf-footer">
        <p>Este documento contiene información confidencial protegida por la Ley de Protección de Datos Personales.</p>
        <p>Generado el ${formatDate(now)} por el Sistema SENDA</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

function generatePersonalDataSection(patient) {
  return `
    <div class="pdf-section">
      <h3>DATOS PERSONALES</h3>
      <div class="data-grid">
        <div class="data-item">
          <label>Nombre Completo:</label>
          <span>${patient.datos_contacto?.nombre_completo || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>RUT:</label>
          <span>${patient.datos_contacto?.rut || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Número de Ficha:</label>
          <span>${patient.numero_ficha}</span>
        </div>
        <div class="data-item">
          <label>Edad:</label>
          <span>${patient.datos_personales?.edad} años</span>
        </div>
        <div class="data-item">
          <label>Género:</label>
          <span>${patient.datos_personales?.genero || 'No especificado'}</span>
        </div>
        <div class="data-item">
          <label>Teléfono:</label>
          <span>${patient.datos_contacto?.telefono_principal || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Email:</label>
          <span>${patient.datos_contacto?.email || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Región:</label>
          <span>${patient.datos_personales?.region || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Comuna:</label>
          <span>${patient.datos_personales?.id_comuna_residencia || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Dirección:</label>
          <span>${patient.datos_contacto?.direccion || 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Estado Actual:</label>
          <span class="status-text">${patient.estado?.toUpperCase()}</span>
        </div>
        <div class="data-item">
          <label>Fecha de Ingreso:</label>
          <span>${formatDate(patient.metadata?.fecha_creacion)}</span>
        </div>
      </div>
    </div>
  `;
}

function generateInitialEvaluationSection(patient) {
  const evaluation = patient.evaluacion_inicial || {};
  
  return `
    <div class="pdf-section">
      <h3>EVALUACIÓN INICIAL</h3>
      <div class="evaluation-content">
        <div class="data-item">
          <label>Sustancias de Consumo:</label>
          <span>${evaluation.sustancias_consumo ? evaluation.sustancias_consumo.join(', ') : 'No especificado'}</span>
        </div>
        <div class="data-item">
          <label>Tiempo de Consumo:</label>
          <span>${evaluation.tiempo_consumo_meses ? `${evaluation.tiempo_consumo_meses} meses` : 'N/A'}</span>
        </div>
        <div class="data-item">
          <label>Motivación para el Cambio:</label>
          <span>${evaluation.motivacion_cambio || 'N/A'}/10</span>
        </div>
        <div class="data-item">
          <label>Urgencia Declarada:</label>
          <span>${evaluation.urgencia_declarada || 'No especificada'}</span>
        </div>
        <div class="data-item">
          <label>Tratamiento Previo:</label>
          <span>${evaluation.tratamiento_previo || 'No especificado'}</span>
        </div>
        ${evaluation.descripcion_situacion ? `
        <div class="data-item full-width">
          <label>Descripción de la Situación:</label>
          <div class="description-text">${evaluation.descripcion_situacion}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateClinicalHistorySection(followups) {
  let html = `
    <div class="pdf-section">
      <h3>HISTORIAL DE SEGUIMIENTOS CLÍNICOS</h3>
  `;
  
  if (followups.length === 0) {
    html += '<p>No hay registros de seguimientos en el período seleccionado.</p>';
  } else {
    html += '<div class="followups-list">';
    
    followups.forEach(followup => {
      html += `
        <div class="followup-record">
          <div class="followup-header">
            <h4>Sesión del ${formatDate(followup.fecha)}</h4>
            <span class="professional">Prof. ${followup.profesional_nombre}</span>
          </div>
          
          <div class="followup-content">
            <div class="data-item">
              <label>Observaciones Clínicas:</label>
              <div class="observation-text">${followup.observaciones_clinicas}</div>
            </div>
            
            ${followup.evaluacion_estado ? `
            <div class="evaluation-summary">
              <strong>Evaluación del Estado:</strong>
              <span>Ánimo: ${followup.evaluacion_estado.estado_animo || 'N/A'}</span>
              <span>Consumo: ${followup.evaluacion_estado.nivel_consumo || 'N/A'}</span>
              <span>Motivación: ${followup.evaluacion_estado.motivacion_cambio || 'N/A'}/10</span>
            </div>
            ` : ''}
            
            ${followup.intervenciones_realizadas && followup.intervenciones_realizadas.length > 0 ? `
            <div class="data-item">
              <label>Intervenciones:</label>
              <span>${followup.intervenciones_realizadas.join(', ')}</span>
            </div>
            ` : ''}
            
            ${followup.objetivos_proxima_sesion ? `
            <div class="data-item">
              <label>Objetivos:</label>
              <div class="objective-text">${followup.objetivos_proxima_sesion}</div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

function generateAppointmentsSection(appointments) {
  let html = `
    <div class="pdf-section">
      <h3>REGISTRO DE CITAS</h3>
  `;
  
  if (appointments.length === 0) {
    html += '<p>No hay citas registradas en el período seleccionado.</p>';
  } else {
    html += `
      <table class="appointments-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    appointments.forEach(appointment => {
      const appointmentDate = appointment.fecha.toDate();
      html += `
        <tr>
          <td>${appointmentDate.toLocaleDateString('es-CL')}</td>
          <td>${appointmentDate.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</td>
          <td>${appointment.tipo || 'Consulta general'}</td>
          <td>${appointment.estado}</td>
          <td>${appointment.notas_sesion || appointment.notas || '-'}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
  }
  
  html += '</div>';
  return html;
}

function generateRiskAssessmentSection(riskAssessments) {
  let html = `
    <div class="pdf-section">
      <h3>EVALUACIONES DE RIESGO</h3>
  `;
  
  if (riskAssessments.length === 0) {
    html += '<p>No hay evaluaciones de riesgo registradas.</p>';
  } else {
    html += '<div class="risk-assessments">';
    
    riskAssessments.forEach(assessment => {
      const risk = assessment.evaluacion_riesgo;
      html += `
        <div class="risk-record">
          <h4>Evaluación del ${formatDate(assessment.fecha)}</h4>
          <div class="risk-items">
            <div class="risk-item">
              <label>Riesgo de Recaída:</label>
              <span class="risk-level risk-${risk.riesgo_recaida}">${risk.riesgo_recaida}</span>
            </div>
            <div class="risk-item">
              <label>Riesgo de Abandono:</label>
              <span class="risk-level risk-${risk.riesgo_abandono}">${risk.riesgo_abandono}</span>
            </div>
            ${risk.riesgo_suicidio ? `
            <div class="risk-item critical">
              <label>⚠️ RIESGO DE SUICIDIO IDENTIFICADO</label>
            </div>
            ` : ''}
            ${risk.notas_riesgo ? `
            <div class="risk-notes">
              <label>Observaciones:</label>
              <div>${risk.notas_riesgo}</div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

function getPDFStyles() {
  return `
    @page { 
      size: A4; 
      margin: 2cm 1.5cm; 
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    
    .pdf-header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo-section h1 {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin: 0 0 5px 0;
    }
    
    .logo-section h2 {
      font-size: 16px;
      font-weight: normal;
      color: #666;
      margin: 0;
    }
    
    .report-info {
      text-align: right;
      font-size: 11px;
    }
    
    .pdf-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .pdf-section h3 {
      background-color: #f3f4f6;
      padding: 8px 12px;
      margin: 0 0 15px 0;
      font-size: 14px;
      font-weight: bold;
      color: #374151;
      border-left: 4px solid #2563eb;
    }
    
    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .data-item {
      display: flex;
      padding: 5px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .data-item.full-width {
      grid-column: 1 / -1;
      flex-direction: column;
    }
    
    .data-item label {
      font-weight: bold;
      min-width: 120px;
      color: #374151;
    }
    
    .data-item span {
      color: #6b7280;
    }
    
    .status-text {
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .description-text, .observation-text, .objective-text {
      background-color: #f9fafb;
      padding: 8px;
      border-radius: 4px;
      margin-top: 5px;
    }
    
    .followups-list {
      space-y: 20px;
    }
    
    .followup-record {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .followup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .followup-header h4 {
      margin: 0;
      font-size: 13px;
      color: #2563eb;
    }
    
    .professional {
      font-size: 11px;
      color: #6b7280;
    }
    
    .evaluation-summary {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin: 8px 0;
      font-size: 11px;
    }
    
    .evaluation-summary span {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .appointments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    .appointments-table th,
    .appointments-table td {
      border: 1px solid #e5e7eb;
      padding: 6px 8px;
      text-align: left;
    }
    
    .appointments-table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    
    .risk-record {
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      background-color: #fef2f2;
    }
    
    .risk-record h4 {
      margin: 0 0 8px 0;
      color: #dc2626;
    }
    
    .risk-items {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .risk-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    
    .risk-item.critical {
      grid-column: 1 / -1;
      color: #dc2626;
      font-weight: bold;
      background-color: #fee2e2;
      padding: 8px;
      border-radius: 4px;
    }
    
    .risk-level {
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .risk-level.risk-bajo { background-color: #dcfce7; color: #166534; }
    .risk-level.risk-moderado { background-color: #fef3c7; color: #92400e; }
    .risk-level.risk-alto { background-color: #fed7aa; color: #c2410c; }
    .risk-level.risk-crítico { background-color: #fecaca; color: #dc2626; }
    
    .risk-notes {
      grid-column: 1 / -1;
      margin-top: 8px;
    }
    
    .pdf-footer {
      position: fixed;
      bottom: 1cm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
    
    @media print {
      .pdf-footer {
        position: fixed;
        bottom: 0;
      }
    }
  `;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function saveReportRecord(patientId, reportType, options) {
  try {
    await db.collection('reportes_generados').add({
      paciente_id: patientId,
      tipo_reporte: reportType,
      generado_por: currentUserData.uid,
      nombre_profesional: currentUserData.nombre,
      fecha_generacion: firebase.firestore.FieldValue.serverTimestamp(),
      opciones_reporte: options,
      metadata: {
        version_sistema: '1.0',
        formato: 'PDF'
      }
    });
  } catch (error) {
    console.error('Error saving report record:', error);
  }
}

async function loadReportsHistory(userData) {
  try {
    const reportsQuery = db.collection('reportes_generados')
      .where('generado_por', '==', userData.uid)
      .orderBy('fecha_generacion', 'desc')
      .limit(10);
    
    const snapshot = await reportsQuery.get();
    const historyList = document.getElementById('reports-history-list');
    
    if (snapshot.empty) {
      historyList.innerHTML = '<p class="no-data">No has generado reportes recientemente.</p>';
      return;
    }
    
    let html = '';
    for (const doc of snapshot.docs) {
      const report = doc.data();
      
      // Obtener nombre del paciente
      let patientName = 'Paciente no encontrado';
      try {
        const patientDoc = await db.collection('pacientes').doc(report.paciente_id).get();
        if (patientDoc.exists) {
          patientName = patientDoc.data().datos_contacto?.nombre_completo || 'Paciente Anónimo';
        }
      } catch (error) {
        console.error('Error loading patient name:', error);
      }
      
      html += `
        <div class="report-history-item">
          <div class="report-info">
            <div class="report-title">${getReportTypeName(report.tipo_reporte)}</div>
            <div class="report-patient">${patientName}</div>
            <div class="report-date">${formatDate(report.fecha_generacion)}</div>
          </div>
          <div class="report-actions">
            <button class="btn btn-outline btn-sm" onclick="regenerateReport('${doc.id}')">
              <i class="fas fa-redo"></i> Regenerar
            </button>
          </div>
        </div>
      `;
    }
    
    historyList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading reports history:', error);
    document.getElementById('reports-history-list').innerHTML = 
      '<p class="error-message">Error al cargar el historial de reportes.</p>';
  }
}

function getReportTypeName(type) {
  const names = {
    'ficha_clinica_completa': 'Ficha Clínica Completa',
    'reporte_evolucion': 'Reporte de Evolución',
    'resumen_ejecutivo': 'Resumen Ejecutivo',
    'estadisticas_centro': 'Estadísticas del Centro'
  };
  return names[type] || type;
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

// Funciones placeholder para otros tipos de reportes
function showEvolutionReportOptions() {
  showNotification('Función en desarrollo', 'info');
}

function showSummaryReportOptions() {
  showNotification('Función en desarrollo', 'info');
}

function showStatisticalReports() {
  showNotification('Función en desarrollo', 'info');
}

function showCaseloadReports() {
  showNotification('Función en desarrollo', 'info');
}

function previewPatientReport() {
  showNotification('Vista previa en desarrollo', 'info');
}

function regenerateReport(reportId) {
  showNotification('Función de regeneración en desarrollo', 'info');
}
// ============================================
// SENDA SYSTEM - PARTE 6: PANEL PRINCIPAL Y NAVEGACIÓN
// ============================================

// ============================================
// ACTUALIZACIÓN DE LA FUNCIÓN PRINCIPAL showPanel
// ============================================

function showPanel(panelId, userData) {
  console.log('Showing panel:', panelId, 'for user:', userData.nombre);
  
  // Ocultar todos los paneles
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  // Mostrar panel seleccionado
  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    // Cargar contenido específico según el panel
    switch (panelId) {
      case 'dashboard':
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequestsForSocialWorkers(userData);
        break;
      case 'patients':
        loadPatientsPanel(userData);
        break;
      case 'calendar':
        loadCalendarPanel(userData);
        break;
      case 'followups':
        loadFollowupsPanel(userData);
        break;
      case 'reports':
        loadReportsPanel(userData);
        break;
      case 'centers':
        loadCentersPanel(userData);
        break;
      case 'users':
        loadUsersPanel(userData);
        break;
      case 'analytics':
        loadAnalyticsPanel(userData);
        break;
      default:
        console.warn('Panel desconocido:', panelId);
    }
  }
}

// ============================================
// ACTUALIZACIÓN DE showProfessionalPanel
// ============================================

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  // Actualizar información del usuario
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Configurar navegación basada en roles
  setupRoleBasedNavigation(userData);
  setupPanelNavigation(userData);
  
  // Mostrar dashboard por defecto
  showPanel('dashboard', userData);
  
  // Configurar botón de logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Iniciar listeners en tiempo real
  startRealTimeListeners(userData);
}

// ============================================
// ACTUALIZACIÓN DE setupRoleBasedNavigation
// ============================================

function setupRoleBasedNavigation(userData) {
  const role = userData.profesion;
  
  // Elementos de navegación
  const requestsNav = document.querySelector('[data-panel="requests"]');
  const patientsNav = document.querySelector('[data-panel="patients"]');
  const calendarNav = document.querySelector('[data-panel="calendar"]');
  const followupsNav = document.querySelector('[data-panel="followups"]');
  const reportsNav = document.querySelector('[data-panel="reports"]');
  const centersNav = document.querySelector('[data-panel="centers"]');
  const usersNav = document.querySelector('[data-panel="users"]');
  const analyticsNav = document.querySelector('[data-panel="analytics"]');
  
  // Ocultar todos los elementos inicialmente
  [requestsNav, patientsNav, calendarNav, followupsNav, reportsNav, centersNav, usersNav, analyticsNav]
    .forEach(nav => {
      if (nav) nav.style.display = 'none';
    });
  
  // Mostrar según permisos
  if (canViewRequests(role) && requestsNav) {
    requestsNav.style.display = 'flex';
  }
  
  if (canManagePatients(role) && patientsNav) {
    patientsNav.style.display = 'flex';
  }
  
  if (canScheduleAppointments(role) && calendarNav) {
    calendarNav.style.display = 'flex';
  }
  
  if (canWriteFollowups(role) && followupsNav) {
    followupsNav.style.display = 'flex';
  }
  
  if (canGenerateReports(role) && reportsNav) {
    reportsNav.style.display = 'flex';
  }
  
  if (['coordinador', 'admin'].includes(role) && centersNav) {
    centersNav.style.display = 'flex';
  }
  
  if (role === 'admin' && usersNav) {
    usersNav.style.display = 'flex';
  }
  
  if (['coordinador', 'admin'].includes(role) && analyticsNav) {
    analyticsNav.style.display = 'flex';
  }
}

// ============================================
// DASHBOARD ACTUALIZADO
// ============================================

async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  
  try {
    // Cargar estadísticas generales
    const stats = await loadDashboardStats(userData);
    
    // Actualizar métricas
    updateDashboardMetrics(stats);
    
    // Cargar actividad reciente
    await loadRecentActivity(userData);
    
    // Cargar gráficos si es necesario
    loadDashboardCharts(stats);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

async function loadDashboardStats(userData) {
  const stats = {
    totalPatients: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    criticalCases: 0,
    weekAppointments: 0,
    monthAppointments: 0
  };
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Contar pacientes totales (según rol)
    if (canManagePatients(userData.profesion)) {
      const patientsQuery = userData.profesion === 'admin' 
        ? db.collection('pacientes')
        : db.collection('pacientes').where('profesional_asignado', '==', userData.uid);
      
      const patientsSnapshot = await patientsQuery.get();
      stats.totalPatients = patientsSnapshot.size;
    }
    
    // Contar citas de hoy
    if (canWriteFollowups(userData.profesion)) {
      const todayAppointmentsQuery = db.collection('citas')
        .where('profesional_id', '==', userData.uid)
        .where('fecha', '>=', startOfDay)
        .where('fecha', '<', endOfDay);
      
      const todaySnapshot = await todayAppointmentsQuery.get();
      stats.todayAppointments = todaySnapshot.size;
      
      // Contar citas de la semana
      const weekAppointmentsQuery = db.collection('citas')
        .where('profesional_id', '==', userData.uid)
        .where('fecha', '>=', startOfWeek)
        .where('fecha', '<', endOfWeek);
      
      const weekSnapshot = await weekAppointmentsQuery.get();
      stats.weekAppointments = weekSnapshot.size;
      
      // Contar citas del mes
      const monthAppointmentsQuery = db.collection('citas')
        .where('profesional_id', '==', userData.uid)
        .where('fecha', '>=', startOfMonth)
        .where('fecha', '<=', endOfMonth);
      
      const monthSnapshot = await monthAppointmentsQuery.get();
      stats.monthAppointments = monthSnapshot.size;
    }
    
    // Contar solicitudes pendientes (solo asistentes sociales)
    if (canViewRequests(userData.profesion)) {
      const pendingRequestsQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente');
      
      const pendingSnapshot = await pendingRequestsQuery.get();
      stats.pendingRequests = pendingSnapshot.size;
      
      // Contar casos críticos
      const criticalCasesQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.prioridad', '==', 'critica')
        .where('clasificacion.estado', '==', 'pendiente');
      
      const criticalSnapshot = await criticalCasesQuery.get();
      stats.criticalCases = criticalSnapshot.size;
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return stats;
  }
}

function updateDashboardMetrics(stats) {
  const elements = {
    'total-patients': stats.totalPatients,
    'today-appointments': stats.todayAppointments,
    'pending-requests': stats.pendingRequests,
    'critical-cases': stats.criticalCases
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = elements[id];
    }
  });
  
  // Actualizar próxima cita
  updateNextAppointment();
}

async function updateNextAppointment() {
  try {
    const now = new Date();
    const nextAppointmentQuery = db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>', now)
      .where('estado', '==', 'programada')
      .orderBy('fecha')
      .limit(1);
    
    const snapshot = await nextAppointmentQuery.get();
    const nextAppointmentElement = document.getElementById('next-appointment');
    
    if (nextAppointmentElement) {
      if (snapshot.empty) {
        nextAppointmentElement.textContent = 'Sin citas';
      } else {
        const appointment = snapshot.docs[0].data();
        const appointmentDate = appointment.fecha.toDate();
        nextAppointmentElement.textContent = appointmentDate.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
  } catch (error) {
    console.error('Error updating next appointment:', error);
  }
}

async function loadRecentActivity(userData) {
  try {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const activities = [];
    
    // Cargar seguimientos recientes
    if (canWriteFollowups(userData.profesion)) {
      const followupsQuery = db.collection('seguimientos')
        .where('profesional_id', '==', userData.uid)
        .orderBy('fecha', 'desc')
        .limit(5);
      
      const followupsSnapshot = await followupsQuery.get();
      
      for (const doc of followupsSnapshot.docs) {
        const followup = doc.data();
        const patientDoc = await db.collection('pacientes').doc(followup.paciente_id).get();
        const patient = patientDoc.exists ? patientDoc.data() : null;
        
        activities.push({
          type: 'followup',
          date: followup.fecha.toDate(),
          patient: patient?.datos_contacto?.nombre_completo || 'Paciente no encontrado',
          description: 'Seguimiento clínico completado'
        });
      }
    }
    
    // Cargar solicitudes procesadas recientes (asistentes sociales)
    if (canViewRequests(userData.profesion)) {
      const processedRequestsQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.procesado_por', '==', userData.uid)
        .orderBy('clasificacion.fecha_procesamiento', 'desc')
        .limit(5);
      
      const processedSnapshot = await processedRequestsQuery.get();
      
      processedSnapshot.forEach(doc => {
        const request = doc.data();
        activities.push({
          type: 'request',
          date: request.clasificacion.fecha_procesamiento.toDate(),
          patient: request.datos_contacto?.nombre_completo || 'Solicitud anónima',
          description: 'Solicitud procesada'
        });
      });
    }
    
    // Ordenar actividades por fecha
    activities.sort((a, b) => b.date - a.date);
    
    // Generar HTML
    if (activities.length === 0) {
      activityList.innerHTML = '<p class="no-data">No hay actividad reciente.</p>';
    } else {
      let html = '';
      activities.slice(0, 8).forEach(activity => {
        const timeAgo = getTimeAgo(activity.date);
        html += `
          <div class="activity-item">
            <div class="activity-icon activity-${activity.type}">
              <i class="fas fa-${activity.type === 'followup' ? 'notes-medical' : 'user-plus'}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-description">${activity.description}</div>
              <div class="activity-patient">${activity.patient}</div>
              <div class="activity-time">${timeAgo}</div>
            </div>
          </div>
        `;
      });
      activityList.innerHTML = html;
    }
    
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      activityList.innerHTML = '<p class="error-message">Error al cargar actividad reciente.</p>';
    }
  }
}

function loadDashboardCharts(stats) {
  // Cargar gráfico de casos por prioridad (solo para asistentes sociales)
  if (canViewRequests(currentUserData.profesion)) {
    loadPriorityChart();
  }
  
  // Cargar gráfico de tendencia mensual
  loadTrendChart(stats);
}

async function loadPriorityChart() {
  try {
    const priorityCanvas = document.getElementById('priority-chart');
    if (!priorityCanvas) return;
    
    // Contar casos por prioridad
    const priorities = { critica: 0, alta: 0, media: 0, baja: 0 };
    
    const requestsQuery = db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente');
    
    const snapshot = await requestsQuery.get();
    
    snapshot.forEach(doc => {
      const priority = doc.data().clasificacion?.prioridad || 'baja';
      if (priorities.hasOwnProperty(priority)) {
        priorities[priority]++;
      }
    });
    
    // Crear gráfico
    new Chart(priorityCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Crítica', 'Alta', 'Media', 'Baja'],
        datasets: [{
          data: [priorities.critica, priorities.alta, priorities.media, priorities.baja],
          backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#65a30d'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error loading priority chart:', error);
  }
}

function loadTrendChart(stats) {
  const trendCanvas = document.getElementById('trend-chart');
  if (!trendCanvas) return;
  
  // Datos simulados para tendencia mensual
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const data = [12, 19, 15, 25, 22, stats.monthAppointments || 18];
  
  new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Citas por Mes',
        data: data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CL');
}

// ============================================
// PANELES ADICIONALES (Placeholder)
// ============================================

function loadCentersPanel(userData) {
  const centersPanel = document.getElementById('centers-panel');
  if (centersPanel) {
    centersPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Centros</h1>
        <p class="panel-subtitle">Administra centros de salud y recursos</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-hospital"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de centros estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadUsersPanel(userData) {
  const usersPanel = document.getElementById('users-panel');
  if (usersPanel) {
    usersPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Usuarios</h1>
        <p class="panel-subtitle">Administra profesionales y permisos del sistema</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-user-cog"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de usuarios estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadAnalyticsPanel(userData) {
  const analyticsPanel = document.getElementById('analytics-panel');
  if (analyticsPanel) {
    analyticsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Analytics Avanzado</h1>
        <p class="panel-subtitle">Análisis estadístico y métricas de desempeño</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-chart-bar"></i>
        <h3>Función en Desarrollo</h3>
        <p>Las analíticas avanzadas estarán disponibles próximamente.</p>
      </div>
    `;
  }
}

// ============================================
// INICIALIZACIÓN MEJORADA
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('SENDA Platform loading...');
  
  // Verificar disponibilidad de Firebase
  if (typeof firebase === 'undefined') {
    console.error('Firebase no está cargado');
    showNotification('Error: Firebase no disponible', 'error');
    return;
  }
  
  initializeApp();
});

function initializeApp() {
  try {
    // Inicializar componentes básicos
    initializeEventListeners();
    setupFormValidation();
    setupMultiStepForm();
    setupModalControls();
    setupTabFunctionality();
    
    // Cargar datos iniciales
    loadDraftIfExists();
    loadRegionsData();
    setupEmailValidation();
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

// ============================================
// ACTUALIZACIÓN DE FUNCIONES EXISTENTES
// ============================================

// Actualizar loadRequests para usar la nueva función
async function loadRequests(userData) {
  return loadRequestsForSocialWorkers(userData);
}

// Función para mostrar modal de cierre
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modalId === 'patient-modal' && !isDraftSaved) {
      const shouldClose = confirm('¿Estás seguro de que quieres cerrar? Los datos no guardados se perderán.');
      if (!shouldClose) return;
      resetForm();
    }
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Limpiar modales dinámicos
    if (modalId.includes('dynamic') || modalId.includes('request') || modalId.includes('report')) {
      modal.remove();
    }
  }
}

// Mejorar la función showModal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus en el primer elemento focuseable
    const firstFocusable = modal.querySelector('input, button, select, textarea');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

// Actualizar las funciones de debug
window.sendaApp = {
  // Funciones básicas
  showNotification,
  showModal,
  closeModal,
  formatRUT,
  validateRUT,
  getProfessionName,
  
  // Estado de la aplicación
  formData,
  currentUserData,
  regionesChile,
  
  // Funciones de panel
  loadDashboard,
  loadRequestsForSocialWorkers,
  loadPatientsPanel,
  loadCalendarPanel,
  loadFollowupsPanel,
  loadReportsPanel,
  
  // Funciones de pacientes
  searchPatients,
  viewPatientDetails,
  generatePatientReport,
  
  // Funciones de calendario
  selectCalendarDay,
  scheduleNewAppointment,
  
  // Funciones de seguimiento
  startFollowupSession: startAppointmentSession,
  completeFollowupSession,
  
  // Funciones de debug
  testPatientForm: () => {
    showModal('patient-modal');
    updateFormProgress();
  },
  testProfessionalLogin: () => {
    showModal('professional-modal');
  },
  getCurrentFormData: () => formData,
  getCurrentUser: () => currentUserData,
  
  // Simulaciones de datos para pruebas
  simulateLogin: (profession = 'asistente_social') => {
    currentUserData = {
      uid: 'test-user-' + Math.random(),
      nombre: 'Usuario de Prueba',
      profesion: profession,
      correo: 'test@senda.cl'
    };
    showProfessionalPanel(currentUserData);
  }
};

console.log('SENDA Platform JavaScript loaded successfully');
console.log('Sistema cargado - Todos los paneles deberían funcionar correctamente');
console.log('Funciones de debug disponibles en window.sendaApp');
console.log('Para probar, usa: window.sendaApp.simulateLogin("asistente_social")');
