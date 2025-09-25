import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales
let upcomingAppointments = [];
let overdueAppointments = [];
let todayAppointments = [];

// Inicializar seguimiento de citas próximas
export function initUpcomingAppointments() {
    setupAppointmentsView();
    setupAppointmentFilters();
    setupAppointmentActions();
    loadUpcomingAppointments();
    setupAutoRefresh();
    console.log('📅 Seguimiento de citas próximas inicializado');
}

// Configurar vista de citas próximas
function setupAppointmentsView() {
    const container = document.getElementById('upcoming-appointments-container');
    if (!container) return;

    container.innerHTML = `
        <div class="upcoming-header">
            <div class="upcoming-stats">
                <div class="stat-card today">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-day"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-number" id="today-count">0</div>
                        <div class="stat-label">Hoy</div>
                    </div>
                </div>
                
                <div class="stat-card upcoming">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-number" id="upcoming-count">0</div>
                        <div class="stat-label">Próximas 7 días</div>
                    </div>
                </div>
                
                <div class="stat-card overdue">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-number" id="overdue-count">0</div>
                        <div class="stat-label">Vencidas</div>
                    </div>
                </div>
                
                <div class="stat-card pending">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-number" id="pending-count">0</div>
                        <div class="stat-label">Por confirmar</div>
                    </div>
                </div>
            </div>
            
            <div class="upcoming-controls">
                <div class="view-toggles">
                    <button class="toggle-btn active" data-view="today" onclick="showAppointmentsView('today')">
                        Hoy
                    </button>
                    <button class="toggle-btn" data-view="upcoming" onclick="showAppointmentsView('upcoming')">
                        Próximas
                    </button>
                    <button class="toggle-btn" data-view="overdue" onclick="showAppointmentsView('overdue')">
                        Vencidas
                    </button>
                    <button class="toggle-btn" data-view="all" onclick="showAppointmentsView('all')">
                        Todas
                    </button>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-secondary" onclick="refreshAppointments()">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                    <button class="btn-secondary" onclick="sendReminders()">
                        <i class="fas fa-bell"></i> Enviar Recordatorios
                    </button>
                    <button class="btn-primary" onclick="scheduleNewAppointment()">
                        <i class="fas fa-plus"></i> Nueva Cita
                    </button>
                </div>
            </div>
        </div>
        
        <div class="upcoming-content">
            <div class="appointments-filters">
                <select id="professional-filter">
                    <option value="">Todos los profesionales</option>
                </select>
                
                <select id="status-filter">
                    <option value="">Todos los estados</option>
                    <option value="programada">Programada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente</option>
                </select>
                
                <select id="type-filter">
                    <option value="">Todos los tipos</option>
                    <option value="consulta">Consulta</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="evaluacion">Evaluación</option>
                </select>
                
                <input type="text" id="patient-search" placeholder="Buscar paciente...">
            </div>
            
            <div id="appointments-list" class="appointments-list">
                <!-- Lista de citas se carga aquí -->
            </div>
        </div>
    `;
}

// Cargar citas próximas
async function loadUpcomingAppointments() {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        // Citas de hoy
        await loadTodayAppointments(today);
        
        // Citas próximas (próximos 7 días)
        await loadUpcomingWeekAppointments(today, nextWeek);
        
        // Citas vencidas
        await loadOverdueAppointments(today);
        
        // Actualizar estadísticas
        updateAppointmentStats();
        
        // Mostrar vista por defecto (hoy)
        showAppointmentsView('today');
        
    } catch (error) {
        console.error('Error cargando citas próximas:', error);
        showNotification('Error al cargar las citas próximas', 'error');
    }
}

// Cargar citas de hoy
async function loadTodayAppointments(today) {
    const todayStr = formatDateForQuery(today);
    
    const citasRef = db.collection('citas');
    const query = citasRef
        .where('fecha', '==', todayStr)
        .where('estado', 'in', ['programada', 'confirmada'])
        .orderBy('hora');
    
    const snapshot = await query.get();
    
    todayAppointments = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const patientData = await getPatientData(data.pacienteId);
        
        todayAppointments.push({
            id: doc.id,
            ...data,
            paciente: patientData
        });
    }
}

// Cargar citas de la próxima semana
async function loadUpcomingWeekAppointments(startDate, endDate) {
    const startStr = formatDateForQuery(startDate);
    const endStr = formatDateForQuery(endDate);
    
    const citasRef = db.collection('citas');
    const query = citasRef
        .where('fecha', '>', startStr)
        .where('fecha', '<=', endStr)
        .where('estado', 'in', ['programada', 'confirmada'])
        .orderBy('fecha')
        .orderBy('hora');
    
    const snapshot = await query.get();
    
    upcomingAppointments = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const patientData = await getPatientData(data.pacienteId);
        
        upcomingAppointments.push({
            id: doc.id,
            ...data,
            paciente: patientData
        });
    }
}

// Cargar citas vencidas
async function loadOverdueAppointments(today) {
    const todayStr = formatDateForQuery(today);
    
    const citasRef = db.collection('citas');
    const query = citasRef
        .where('fecha', '<', todayStr)
        .where('estado', 'in', ['programada', 'confirmada'])
        .orderBy('fecha', 'desc')
        .limit(50);
    
    const snapshot = await query.get();
    
    overdueAppointments = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const patientData = await getPatientData(data.pacienteId);
        
        overdueAppointments.push({
            id: doc.id,
            ...data,
            paciente: patientData,
            overdue: true
        });
    }
}

// Obtener datos del paciente
async function getPatientData(patientId) {
    try {
        const doc = await db.collection('pacientes').doc(patientId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error obteniendo datos del paciente:', error);
        return null;
    }
}

// Mostrar vista de citas específica
window.showAppointmentsView = function(view) {
    // Actualizar botones activos
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
const viewBtn = document.querySelector(`[data-view="${view}"]`);
if (viewBtn) viewBtn.classList.add('active');
    
    // Mostrar citas correspondientes
    let appointmentsToShow = [];
    
    switch (view) {
        case 'today':
            appointmentsToShow = todayAppointments;
            break;
        case 'upcoming':
            appointmentsToShow = upcomingAppointments;
            break;
        case 'overdue':
            appointmentsToShow = overdueAppointments;
            break;
        case 'all':
            appointmentsToShow = [...todayAppointments, ...upcomingAppointments, ...overdueAppointments];
            break;
    }
    
    renderAppointmentsList(appointmentsToShow);
};

// Renderizar lista de citas
function renderAppointmentsList(appointments) {
    const listContainer = document.getElementById('appointments-list');
    if (!listContainer) return;

    if (appointments.length === 0) {
        listContainer.innerHTML = `
            <div class="no-appointments">
                <i class="fas fa-calendar-check"></i>
                <h4>No hay citas para mostrar</h4>
                <p>No se encontraron citas en esta categoría.</p>
            </div>
        `;
        return;
    }

    const appointmentsHTML = appointments.map(appointment => 
        createAppointmentCard(appointment)
    ).join('');

    listContainer.innerHTML = appointmentsHTML;
}

// Crear tarjeta de cita
function createAppointmentCard(appointment) {
    const isOverdue = appointment.overdue;
    const isToday = isAppointmentToday(appointment.fecha);
    const patientName = appointment.paciente ? 
        `${appointment.paciente.nombre} ${appointment.paciente.apellido}` : 
        'Paciente no encontrado';

    return `
        <div class="appointment-card ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}" 
             data-appointment-id="${appointment.id}">
            
            <div class="appointment-time">
                <div class="time-display">
                    <span class="hour">${appointment.hora}</span>
                    <span class="date">${formatDisplayDate(appointment.fecha)}</span>
                </div>
                <div class="duration">
                    ${appointment.duracionMinutos || 30} min
                </div>
            </div>
            
            <div class="appointment-info">
                <div class="patient-info">
                    <h4>${patientName}</h4>
                    <div class="patient-details">
                        ${appointment.paciente?.telefono ? `
                            <span><i class="fas fa-phone"></i> ${appointment.paciente.telefono}</span>
                        ` : ''}
                        ${appointment.paciente?.email ? `
                            <span><i class="fas fa-envelope"></i> ${appointment.paciente.email}</span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="appointment-details">
                    <div class="type-professional">
                        <span class="type">${appointment.tipo || 'Consulta'}</span>
                        <span class="professional">
                            <i class="fas fa-user-md"></i>
                            ${appointment.profesional}
                        </span>
                    </div>
                    
                    ${appointment.motivo ? `
                        <div class="reason">
                            <i class="fas fa-comment"></i>
                            ${appointment.motivo}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="appointment-status">
                <span class="status-badge ${appointment.estado}">
                    ${getStatusText(appointment.estado)}
                </span>
                
                ${isOverdue ? `
                    <span class="overdue-badge">
                        <i class="fas fa-exclamation-triangle"></i>
                        Vencida
                    </span>
                ` : ''}
                
                ${appointment.recordatorio ? `
                    <span class="reminder-badge">
                        <i class="fas fa-bell"></i>
                        Recordatorio enviado
                    </span>
                ` : ''}
            </div>
            
            <div class="appointment-actions">
                <div class="primary-actions">
                    ${appointment.estado !== 'confirmada' ? `
                        <button class="btn-sm success" onclick="confirmAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    ` : ''}
                    
                    ${isToday ? `
                        <button class="btn-sm primary" onclick="startAppointment('${appointment.id}')">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                    ` : ''}
                    
                    <button class="btn-sm secondary" onclick="editAppointment('${appointment.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
                
                <div class="secondary-actions">
                    <div class="dropdown">
                        <button class="btn-sm dropdown-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu">
                            <a href="#" onclick="viewPatient('${appointment.pacienteId}')">
                                Ver Ficha Paciente
                            </a>
                            <a href="#" onclick="sendAppointmentReminder('${appointment.id}')">
                                Enviar Recordatorio
                            </a>
                            <a href="#" onclick="rescheduleAppointment('${appointment.id}')">
                                Reprogramar
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" onclick="cancelAppointment('${appointment.id}')" class="text-danger">
                                Cancelar Cita
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Actualizar estadísticas de citas
function updateAppointmentStats() {
    document.getElementById('today-count').textContent = todayAppointments.length;
    document.getElementById('upcoming-count').textContent = upcomingAppointments.length;
    document.getElementById('overdue-count').textContent = overdueAppointments.length;
    
    const pendingCount = [...todayAppointments, ...upcomingAppointments]
        .filter(apt => apt.estado === 'programada').length;
    document.getElementById('pending-count').textContent = pendingCount;
}

// Configurar filtros
function setupAppointmentFilters() {
    const professionalFilter = document.getElementById('professional-filter');
    const statusFilter = document.getElementById('status-filter');
    const typeFilter = document.getElementById('type-filter');
    const patientSearch = document.getElementById('patient-search');

    [professionalFilter, statusFilter, typeFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyAppointmentFilters);
        }
    });

    if (patientSearch) {
        patientSearch.addEventListener('input', debounce(applyAppointmentFilters, 300));
    }

    loadProfessionalsForFilter();
}

// Configurar acciones de citas
function setupAppointmentActions() {
    // Las acciones se manejan mediante onclick debido a la naturaleza dinámica del contenido
}

// Configurar actualización automática
function setupAutoRefresh() {
    // Actualizar cada 5 minutos
    setInterval(() => {
        console.log('Actualizando citas próximas automáticamente...');
        loadUpcomingAppointments();
    }, 5 * 60 * 1000);
}

// Funciones de acciones (expuestas globalmente)
window.confirmAppointment = async function(appointmentId) {
    try {
        await db.collection('citas').doc(appointmentId).update({
            estado: 'confirmada',
            fechaConfirmacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Cita confirmada exitosamente', 'success');
        await loadUpcomingAppointments();
        
    } catch (error) {
        console.error('Error confirmando cita:', error);
        showNotification('Error al confirmar la cita', 'error');
    }
};

window.startAppointment = function(appointmentId) {
    // Redirigir a registro de atención
    window.location.hash = `#atencion/nueva?cita=${appointmentId}`;
};

window.cancelAppointment = async function(appointmentId) {
    const confirmed = confirm('¿Está seguro de que desea cancelar esta cita?');
    if (!confirmed) return;

    try {
        await db.collection('citas').doc(appointmentId).update({
            estado: 'cancelada',
            fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Cita cancelada', 'success');
        await loadUpcomingAppointments();
        
    } catch (error) {
        console.error('Error cancelando cita:', error);
        showNotification('Error al cancelar la cita', 'error');
    }
};

window.sendAppointmentReminder = async function(appointmentId) {
    try {
        // Implementar envío de recordatorio
        // Por ahora solo simular
        await db.collection('citas').doc(appointmentId).update({
            recordatorio: true,
            fechaRecordatorio: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Recordatorio enviado', 'success');
        await loadUpcomingAppointments();
        
    } catch (error) {
        console.error('Error enviando recordatorio:', error);
        showNotification('Error al enviar recordatorio', 'error');
    }
};

window.refreshAppointments = function() {
    loadUpcomingAppointments();
};

window.sendReminders = async function() {
    // Enviar recordatorios masivos
    showNotification('Función de recordatorios masivos en desarrollo', 'info');
};

window.scheduleNewAppointment = function() {
    window.location.hash = '#calendario';
};

// Funciones utilitarias
function formatDateForQuery(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateString === formatDateForQuery(today)) {
        return 'Hoy';
    } else if (dateString === formatDateForQuery(tomorrow)) {
        return 'Mañana';
    } else {
        return date.toLocaleDateString('es-CL', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
    }
}

function isAppointmentToday(dateString) {
    const today = new Date();
    return dateString === formatDateForQuery(today);
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

function loadProfessionalsForFilter() {
    // Implementar carga de profesionales para filtro
}

function applyAppointmentFilters() {
    // Implementar aplicación de filtros
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

// Exportar funciones principales
export {
    loadUpcomingAppointments,
    updateAppointmentStats,
    renderAppointmentsList
};
