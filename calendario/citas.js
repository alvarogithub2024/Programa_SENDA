/**
 * SEGUIMIENTO/CITAS-PROXIMAS.JS - VERSIÓN CORREGIDA
 */

import { getFirestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales
let upcomingAppointments = [];
let overdueAppointments = [];
let todayAppointments = [];

// Inicializar seguimiento de citas próximas
export function initUpcomingAppointments() {
    try {
        console.log('📅 Inicializando citas próximas...');
        
        setupAppointmentsView();
        setupAppointmentFilters();
        setupAppointmentActions();
        loadUpcomingAppointments();
        setupAutoRefresh();
        
        console.log('✅ Seguimiento de citas próximas inicializado');
    } catch (error) {
        console.error('Error inicializando citas próximas:', error);
    }
}

// Configurar vista de citas próximas
function setupAppointmentsView() {
    try {
        let container = document.getElementById('upcoming-appointments-container');
        
        // Si no existe el contenedor, crearlo en la pestaña de seguimiento
        if (!container) {
            const seguimientoTab = document.getElementById('seguimiento-tab');
            if (seguimientoTab) {
                container = document.createElement('div');
                container.id = 'upcoming-appointments-container';
                seguimientoTab.appendChild(container);
            } else {
                console.warn('No se encontró pestaña de seguimiento');
                return;
            }
        }

        container.innerHTML = `
            <div class="upcoming-header">
                <h3>Citas Próximas</h3>
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
                        <button class="btn btn-secondary" onclick="refreshAppointments()">
                            <i class="fas fa-sync"></i> Actualizar
                        </button>
                        <button class="btn btn-primary" onclick="scheduleNewAppointment()">
                            <i class="fas fa-plus"></i> Nueva Cita
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="upcoming-content">
                <div id="appointments-list" class="appointments-list">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando citas...
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Vista de citas próximas configurada');
    } catch (error) {
        console.error('Error configurando vista:', error);
    }
}

// Cargar citas próximas - FUNCIÓN CORREGIDA
export async function loadUpcomingAppointments() {
    try {
        console.log('📋 Cargando citas próximas...');
        
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
        
        // Actualizar estadísticas - FUNCIÓN PROTEGIDA
        updateAppointmentStatsSafe();
        
        // Mostrar vista por defecto (hoy)
        showAppointmentsView('today');
        
        console.log('✅ Citas próximas cargadas exitosamente');
        
    } catch (error) {
        console.error('Error cargando citas próximas:', error);
        showNotification('Error al cargar las citas próximas', 'error');
        
        // Mostrar datos de ejemplo en caso de error
        createSampleData();
        updateAppointmentStatsSafe();
        showAppointmentsView('today');
    }
}

// Crear datos de ejemplo
function createSampleData() {
    const today = formatDateForQuery(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateForQuery(tomorrow);
    
    todayAppointments = [
        {
            id: 'sample1',
            fecha: today,
            hora: '09:00',
            paciente: { nombre: 'Juan', apellido: 'Pérez', telefono: '912345678' },
            profesional: 'Dr. García',
            tipo: 'Consulta inicial',
            estado: 'confirmada'
        }
    ];
    
    upcomingAppointments = [
        {
            id: 'sample2',
            fecha: tomorrowStr,
            hora: '14:30',
            paciente: { nombre: 'María', apellido: 'González', telefono: '987654321' },
            profesional: 'Dra. López',
            tipo: 'Seguimiento',
            estado: 'programada'
        }
    ];
    
    overdueAppointments = [];
}

// Cargar citas de hoy
async function loadTodayAppointments(today) {
    try {
        const todayStr = formatDateForQuery(today);
        
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible');
            return;
        }
        
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('fecha', '==', todayStr)
            .where('estado', 'in', ['programada', 'confirmada']);
        
        const snapshot = await query.get();
        
        todayAppointments = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const patientData = await getPatientDataSafe(data.pacienteId);
            
            todayAppointments.push({
                id: doc.id,
                ...data,
                paciente: patientData
            });
        }
        
        console.log(`📅 Cargadas ${todayAppointments.length} citas de hoy`);
        
    } catch (error) {
        console.error('Error cargando citas de hoy:', error);
        todayAppointments = [];
    }
}

// Cargar citas de la próxima semana
async function loadUpcomingWeekAppointments(startDate, endDate) {
    try {
        const startStr = formatDateForQuery(startDate);
        const endStr = formatDateForQuery(endDate);
        
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible');
            return;
        }
        
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('fecha', '>', startStr)
            .where('fecha', '<=', endStr)
            .where('estado', 'in', ['programada', 'confirmada']);
        
        const snapshot = await query.get();
        
        upcomingAppointments = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const patientData = await getPatientDataSafe(data.pacienteId);
            
            upcomingAppointments.push({
                id: doc.id,
                ...data,
                paciente: patientData
            });
        }
        
        console.log(`📅 Cargadas ${upcomingAppointments.length} citas próximas`);
        
    } catch (error) {
        console.error('Error cargando citas próximas:', error);
        upcomingAppointments = [];
    }
}

// Cargar citas vencidas
async function loadOverdueAppointments(today) {
    try {
        const todayStr = formatDateForQuery(today);
        
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible');
            return;
        }
        
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('fecha', '<', todayStr)
            .where('estado', 'in', ['programada', 'confirmada'])
            .limit(50);
        
        const snapshot = await query.get();
        
        overdueAppointments = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const patientData = await getPatientDataSafe(data.pacienteId);
            
            overdueAppointments.push({
                id: doc.id,
                ...data,
                paciente: patientData,
                overdue: true
            });
        }
        
        console.log(`⚠️ Cargadas ${overdueAppointments.length} citas vencidas`);
        
    } catch (error) {
        console.error('Error cargando citas vencidas:', error);
        overdueAppointments = [];
    }
}

// Obtener datos del paciente de manera segura
async function getPatientDataSafe(patientId) {
    try {
        if (!patientId) return null;
        
        const db = getFirestore();
        if (!db) return null;
        
        const doc = await db.collection('pacientes').doc(patientId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error obteniendo datos del paciente:', error);
        return null;
    }
}

// Actualizar estadísticas de manera segura
function updateAppointmentStatsSafe() {
    try {
        // Verificar que los elementos existan antes de actualizar
        const todayCountEl = document.getElementById('today-count');
        const upcomingCountEl = document.getElementById('upcoming-count');
        const overdueCountEl = document.getElementById('overdue-count');
        const pendingCountEl = document.getElementById('pending-count');
        
        if (todayCountEl) todayCountEl.textContent = todayAppointments.length;
        if (upcomingCountEl) upcomingCountEl.textContent = upcomingAppointments.length;
        if (overdueCountEl) overdueCountEl.textContent = overdueAppointments.length;
        
        if (pendingCountEl) {
            const pendingCount = [...todayAppointments, ...upcomingAppointments]
                .filter(apt => apt.estado === 'programada').length;
            pendingCountEl.textContent = pendingCount;
        }
        
        console.log('📊 Estadísticas actualizadas');
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Mostrar vista de citas específica - FUNCIÓN CORREGIDA
window.showAppointmentsView = function(view) {
    try {
        // Actualizar botones activos
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
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
        console.log(`👁️ Mostrando vista: ${view} (${appointmentsToShow.length} citas)`);
        
    } catch (error) {
        console.error('Error mostrando vista de citas:', error);
    }
};

// Renderizar lista de citas
function renderAppointmentsList(appointments) {
    try {
        const listContainer = document.getElementById('appointments-list');
        if (!listContainer) {
            console.warn('Contenedor de lista de citas no encontrado');
            return;
        }

        if (appointments.length === 0) {
            listContainer.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-check"></i>
                    <h4>No hay citas para mostrar</h4>
                    <p>No se encontraron citas en esta categoría.</p>
                    <button class="btn btn-primary" onclick="scheduleNewAppointment()">
                        <i class="fas fa-plus"></i> Agendar nueva cita
                    </button>
                </div>
            `;
            return;
        }

        const appointmentsHTML = appointments.map(appointment => 
            createAppointmentCard(appointment)
        ).join('');

        listContainer.innerHTML = appointmentsHTML;
        
        console.log(`📋 ${appointments.length} citas renderizadas`);
    } catch (error) {
        console.error('Error renderizando lista:', error);
    }
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
            </div>
            
            <div class="appointment-actions">
                <div class="primary-actions">
                    ${appointment.estado !== 'confirmada' ? `
                        <button class="btn btn-sm btn-success" onclick="confirmAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    ` : ''}
                    
                    ${isToday ? `
                        <button class="btn btn-sm btn-primary" onclick="startAppointment('${appointment.id}')">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-sm btn-secondary" onclick="editAppointment('${appointment.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Configurar filtros
function setupAppointmentFilters() {
    // Implementar filtros si es necesario
}

// Configurar acciones
function setupAppointmentActions() {
    // Las acciones se manejan mediante onclick
}

// Configurar auto-refresh
function setupAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Auto-actualizando citas próximas...');
        loadUpcomingAppointments();
    }, 5 * 60 * 1000); // Cada 5 minutos
}

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

// Funciones globales
window.confirmAppointment = async function(appointmentId) {
    try {
        const db = getFirestore();
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
    showNotification('Función de iniciar atención en desarrollo', 'info');
};

window.editAppointment = function(appointmentId) {
    showNotification('Función de editar cita en desarrollo', 'info');
};

window.refreshAppointments = function() {
    loadUpcomingAppointments();
};

window.scheduleNewAppointment = function() {
    // Cambiar a pestaña de agenda
    const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
    if (agendaTab) {
        agendaTab.click();
    }
};
