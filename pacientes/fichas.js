import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales
let currentPatient = null;
let patientHistory = [];
let appointments = [];
let documents = [];

// Inicializar vista de ficha
export function initPatientRecord() {
    setupPatientTabs();
    setupPatientActions();
    setupDocumentUpload();
    console.log('📋 Ficha de paciente inicializada');
}

// Cargar ficha de paciente
export async function loadPatientRecord(patientId) {
    try {
        showLoading(true);
        
        // Cargar datos del paciente
        await loadPatientData(patientId);
        
        // Cargar historial
        await loadPatientHistory(patientId);
        
        // Cargar citas
        await loadPatientAppointments(patientId);
        
        // Cargar documentos
        await loadPatientDocuments(patientId);
        
        // Renderizar ficha
        renderPatientRecord();
        
    } catch (error) {
        console.error('Error cargando ficha:', error);
        showNotification('Error al cargar la ficha del paciente', 'error');
    } finally {
        showLoading(false);
    }
}

// Cargar datos del paciente
async function loadPatientData(patientId) {
    const doc = await db.collection('pacientes').doc(patientId).get();
    
    if (!doc.exists) {
        throw new Error('Paciente no encontrado');
    }
    
    currentPatient = {
        id: doc.id,
        ...doc.data()
    };
}

// Cargar historial del paciente
async function loadPatientHistory(patientId) {
    const historialRef = db.collection('historial_pacientes');
    const snapshot = await historialRef
        .where('pacienteId', '==', patientId)
        .orderBy('fecha', 'desc')
        .get();
    
    patientHistory = [];
    snapshot.forEach(doc => {
        patientHistory.push({
            id: doc.id,
            ...doc.data()
        });
    });
}

// Cargar citas del paciente
async function loadPatientAppointments(patientId) {
    const citasRef = db.collection('citas');
    const snapshot = await citasRef
        .where('pacienteId', '==', patientId)
        .orderBy('fecha', 'desc')
        .limit(50)
        .get();
    
    appointments = [];
    snapshot.forEach(doc => {
        appointments.push({
            id: doc.id,
            ...doc.data()
        });
    });
}

// Cargar documentos del paciente
async function loadPatientDocuments(patientId) {
    const docsRef = db.collection('documentos_pacientes');
    const snapshot = await docsRef
        .where('pacienteId', '==', patientId)
        .orderBy('fechaSubida', 'desc')
        .get();
    
    documents = [];
    snapshot.forEach(doc => {
        documents.push({
            id: doc.id,
            ...doc.data()
        });
    });
}

// Renderizar ficha del paciente
function renderPatientRecord() {
    if (!currentPatient) return;

    renderPatientHeader();
    renderPatientDetails();
    renderPatientHistory();
    renderPatientAppointments();
    renderPatientDocuments();
    renderPatientStats();
}

// Renderizar cabecera del paciente
function renderPatientHeader() {
    const header = document.getElementById('patient-header');
    if (!header) return;

    const age = calculateAge(currentPatient.fechaNacimiento);
    const lastAppointment = appointments.length > 0 ? appointments[0] : null;

    header.innerHTML = `
        <div class="patient-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="patient-basic-info">
            <h2>${currentPatient.nombre} ${currentPatient.apellido}</h2>
            <div class="patient-meta">
                <span><i class="fas fa-id-card"></i> RUT: ${currentPatient.rut}</span>
                <span><i class="fas fa-birthday-cake"></i> ${age} años</span>
                <span><i class="fas fa-phone"></i> ${currentPatient.telefono || 'Sin teléfono'}</span>
                <span><i class="fas fa-envelope"></i> ${currentPatient.email || 'Sin email'}</span>
            </div>
            <div class="patient-status">
                <span class="status-badge ${getStatusClass(currentPatient.estadoPaciente)}">
                    ${currentPatient.estadoPaciente || 'Activo'}
                </span>
                ${lastAppointment ? `
                    <span class="last-appointment">
                        Última cita: ${formatDate(lastAppointment.fecha)}
                    </span>
                ` : ''}
            </div>
        </div>
        <div class="patient-actions">
            <button class="btn-primary" onclick="scheduleAppointment('${currentPatient.id}')">
                <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
            <button class="btn-secondary" onclick="editPatient('${currentPatient.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-secondary" onclick="addNote('${currentPatient.id}')">
                <i class="fas fa-sticky-note"></i> Agregar Nota
            </button>
            <div class="dropdown">
                <button class="btn-secondary dropdown-toggle">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu">
                    <a href="#" onclick="printPatientRecord()">Imprimir Ficha</a>
                    <a href="#" onclick="exportPatientData()">Exportar Datos</a>
                    <a href="#" onclick="sharePatientRecord()">Compartir</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" onclick="archivePatient('${currentPatient.id}')" class="text-danger">Archivar Paciente</a>
                </div>
            </div>
        </div>
    `;
}

// Renderizar detalles del paciente
function renderPatientDetails() {
    const details = document.getElementById('patient-details');
    if (!details) return;

    details.innerHTML = `
        <div class="details-grid">
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Información Personal</h3>
                <div class="detail-items">
                    <div class="detail-item">
                        <label>Fecha de Nacimiento:</label>
                        <span>${formatDate(currentPatient.fechaNacimiento) || 'No registrada'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Género:</label>
                        <span>${currentPatient.genero || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Estado Civil:</label>
                        <span>${currentPatient.estadoCivil || 'No especificado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Ocupación:</label>
                        <span>${currentPatient.ocupacion || 'No especificada'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Dirección</h3>
                <div class="detail-items">
                    <div class="detail-item">
                        <label>Dirección:</label>
                        <span>${currentPatient.direccion || 'No registrada'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Comuna:</label>
                        <span>${currentPatient.comuna || 'No registrada'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Región:</label>
                        <span>${currentPatient.region || 'No registrada'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-heartbeat"></i> Información Médica</h3>
                <div class="detail-items">
                    <div class="detail-item">
                        <label>Tipo de Sangre:</label>
                        <span>${currentPatient.tipoSangre || 'No registrado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Alergias:</label>
                        <span>${currentPatient.alergias || 'Ninguna registrada'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Medicamentos:</label>
                        <span>${currentPatient.medicamentos || 'Ninguno registrado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Condiciones Médicas:</label>
                        <span>${currentPatient.condicionesMedicas || 'Ninguna registrada'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-users"></i> Contacto de Emergencia</h3>
                <div class="detail-items">
                    <div class="detail-item">
                        <label>Nombre:</label>
                        <span>${currentPatient.contactoEmergenciaNombre || 'No registrado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Relación:</label>
                        <span>${currentPatient.contactoEmergenciaRelacion || 'No registrada'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Teléfono:</label>
                        <span>${currentPatient.contactoEmergenciaTelefono || 'No registrado'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar historial del paciente
function renderPatientHistory() {
    const historyContainer = document.getElementById('patient-history');
    if (!historyContainer) return;

    if (patientHistory.length === 0) {
        historyContainer.innerHTML = '<div class="no-history">No hay historial registrado</div>';
        return;
    }

    const historyHTML = patientHistory.map(entry => `
        <div class="history-entry">
            <div class="history-date">
                ${formatDateTime(entry.fecha)}
            </div>
            <div class="history-content">
                <div class="history-type">
                    <i class="${getHistoryIcon(entry.tipo)}"></i>
                    ${entry.tipo}
                </div>
                <div class="history-description">
                    ${entry.descripcion}
                </div>
                <div class="history-professional">
                    Por: ${entry.profesional}
                </div>
            </div>
        </div>
    `).join('');

    historyContainer.innerHTML = historyHTML;
}

// Renderizar citas del paciente
function renderPatientAppointments() {
    const appointmentsContainer = document.getElementById('patient-appointments');
    if (!appointmentsContainer) return;

    if (appointments.length === 0) {
        appointmentsContainer.innerHTML = '<div class="no-appointments">No hay citas registradas</div>';
        return;
    }

    const appointmentsHTML = appointments.map(appointment => `
        <div class="appointment-entry ${appointment.estado}">
            <div class="appointment-date">
                <div class="date">${formatDate(appointment.fecha)}</div>
                <div class="time">${appointment.hora}</div>
            </div>
            <div class="appointment-details">
                <div class="appointment-type">${appointment.tipo || 'Consulta General'}</div>
                <div class="appointment-professional">
                    <i class="fas fa-user-md"></i>
                    ${appointment.profesional}
                </div>
                <div class="appointment-status">
                    <span class="status-badge ${appointment.estado}">
                        ${getStatusText(appointment.estado)}
                    </span>
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn-sm" onclick="viewAppointment('${appointment.id}')">
                    Ver Detalle
                </button>
            </div>
        </div>
    `).join('');

    appointmentsContainer.innerHTML = appointmentsHTML;
}

// Renderizar documentos del paciente
function renderPatientDocuments() {
    const documentsContainer = document.getElementById('patient-documents');
    if (!documentsContainer) return;

    if (documents.length === 0) {
        documentsContainer.innerHTML = `
            <div class="no-documents">
                <i class="fas fa-folder-open"></i>
                <p>No hay documentos adjuntos</p>
                <button class="btn-primary" onclick="uploadDocument()">
                    <i class="fas fa-upload"></i> Subir Documento
                </button>
            </div>
        `;
        return;
    }

    const documentsHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-icon">
                <i class="${getDocumentIcon(doc.tipo)}"></i>
            </div>
            <div class="document-info">
                <div class="document-name">${doc.nombre}</div>
                <div class="document-meta">
                    <span>${doc.tipo}</span>
                    <span>${formatFileSize(doc.tamaño)}</span>
                    <span>Subido: ${formatDate(doc.fechaSubida)}</span>
                </div>
            </div>
            <div class="document-actions">
                <button class="btn-sm" onclick="downloadDocument('${doc.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn-sm" onclick="viewDocument('${doc.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-sm danger" onclick="deleteDocument('${doc.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    documentsContainer.innerHTML = `
        <div class="documents-header">
            <button class="btn-primary" onclick="uploadDocument()">
                <i class="fas fa-upload"></i> Subir Documento
            </button>
        </div>
        <div class="documents-list">
            ${documentsHTML}
        </div>
    `;
}

// Renderizar estadísticas del paciente
function renderPatientStats() {
    const statsContainer = document.getElementById('patient-stats');
    if (!statsContainer) return;

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.estado === 'realizada').length;
    const canceledAppointments = appointments.filter(apt => apt.estado === 'cancelada').length;
    const noShowAppointments = appointments.filter(apt => apt.estado === 'no_asistio').length;

    const attendanceRate = totalAppointments > 0 ? 
        Math.round((completedAppointments / totalAppointments) * 100) : 0;

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${totalAppointments}</div>
                <div class="stat-label">Total Citas</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${completedAppointments}</div>
                <div class="stat-label">Completadas</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${canceledAppointments}</div>
                <div class="stat-label">Canceladas</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${noShowAppointments}</div>
                <div class="stat-label">Inasistencias</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${attendanceRate}%</div>
                <div class="stat-label">Tasa Asistencia</div>
            </div>
        </div>
    `;
}

// Configurar tabs de paciente
function setupPatientTabs() {
    const tabs = document.querySelectorAll('.patient-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
}

// Manejar click en tabs
function handleTabClick(e) {
    e.preventDefault();
    
    const targetTab = e.target.dataset.tab;
    
    // Actualizar tabs activos
    document.querySelectorAll('.patient-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Mostrar contenido correspondiente
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(`${targetTab}-content`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

// Configurar acciones de paciente
function setupPatientActions() {
    // Implementar acciones específicas
}

// Configurar subida de documentos
function setupDocumentUpload() {
    const uploadInput = document.getElementById('document-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', handleDocumentUpload);
    }
}

// Funciones de acciones (expuestas globalmente)
window.addNote = async function(patientId) {
    const note = prompt('Ingrese la nota:');
    if (!note) return;

    try {
        await db.collection('historial_pacientes').add({
            pacienteId: patientId,
            tipo: 'Nota',
            descripcion: note,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            profesional: 'Usuario Actual' // TODO: obtener del contexto
        });

        showNotification('Nota agregada correctamente', 'success');
        await loadPatientHistory(patientId);
        renderPatientHistory();

    } catch (error) {
        console.error('Error agregando nota:', error);
        showNotification('Error al agregar nota', 'error');
    }
};

// Funciones utilitarias
function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL');
}

function getStatusClass(status) {
    const classes = {
        'activo': 'success',
        'inactivo': 'warning', 
        'archivado': 'danger',
        'suspendido': 'danger'
    };
    return classes[status] || 'success';
}

function getStatusText(status) {
    const texts = {
        'programada': 'Programada',
        'confirmada': 'Confirmada',
        'realizada': 'Realizada',
        'cancelada': 'Cancelada',
        'no_asistio': 'No asistió'
    };
    return texts[status] || status;
}

function getHistoryIcon(type) {
    const icons = {
        'Consulta': 'fas fa-stethoscope',
        'Nota': 'fas fa-sticky-note',
        'Examen': 'fas fa-file-medical',
        'Tratamiento': 'fas fa-pills'
    };
    return icons[type] || 'fas fa-circle';
}

function getDocumentIcon(type) {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'image': 'fas fa-file-image',
        'document': 'fas fa-file-alt'
    };
    return icons[type] || 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showLoading(show) {
    const loading = document.getElementById('patient-loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Exportar funciones principales
export { 
    renderPatientRecord,
    currentPatient
};
