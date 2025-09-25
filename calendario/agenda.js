/**
 * CALENDARIO/AGENDA.JS - VERSIÓN SIN IMPORTS CON FUNCIÓN PRINCIPAL
 */

// Variables globales para el calendario
let currentDate = new Date();
let selectedDate = null;
let appointments = [];

/**
 * FUNCIÓN PRINCIPAL - Inicializar calendario
 */
window.initCalendar = function() {
    try {
        console.log('📅 Inicializando calendario...');
        
        // Verificar que estemos en la pestaña correcta
        const agendaTab = document.getElementById('agenda-tab');
        if (!agendaTab || !agendaTab.classList.contains('active')) {
            console.log('⏸️ Calendario no se inicializa - pestaña no activa');
            return;
        }
        
        setupCalendarElements();
        renderCalendar();
        loadAppointments();
        setupCalendarEvents();
        
        console.log('✅ Calendario inicializado');
    } catch (error) {
        console.error('❌ Error inicializando calendario:', error);
    }
};

// Configurar elementos del calendario
function setupCalendarElements() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) {
        console.warn('⚠️ Contenedor de calendario no encontrado');
        return;
    }

    // Verificar o crear elementos necesarios
    if (!document.getElementById('calendar-month-year')) {
        const header = calendarContainer.querySelector('.calendar-header h3');
        if (header) header.id = 'calendar-month-year';
    }

    if (!document.getElementById('calendar-grid')) {
        const grid = calendarContainer.querySelector('.calendar-grid');
        if (grid) grid.id = 'calendar-grid';
    }

    if (!document.getElementById('appointments-list')) {
        const list = document.querySelector('.appointments-list');
        if (list) list.id = 'appointments-list';
    }
}

// Renderizar calendario
function renderCalendar() {
    try {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) {
            console.error('❌ Grid del calendario no encontrado');
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Actualizar título del mes
        updateMonthTitle(year, month);

        // Limpiar grid
        calendarGrid.innerHTML = '';

        // Crear headers de días
        createDayHeaders(calendarGrid);

        // Obtener información del mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Crear días vacíos para el inicio (ajustar domingo = 0 a lunes = 0)
        const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        for (let i = 0; i < adjustedStartDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Crear días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = createDayElement(year, month, day);
            calendarGrid.appendChild(dayElement);
        }

        console.log(`📅 Calendario renderizado: ${getMonthName(month)} ${year}`);

    } catch (error) {
        console.error('Error renderizando calendario:', error);
    }
}

// Crear headers de días de la semana
function createDayHeaders(grid) {
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    weekDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
}

// Crear elemento de día
function createDayElement(year, month, day) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    
    const appointmentsContainer = document.createElement('div');
    appointmentsContainer.className = 'calendar-appointments';
    
    dayElement.appendChild(dayNumber);
    dayElement.appendChild(appointmentsContainer);
    
    const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    dayElement.dataset.date = dateString;

    // Marcar día actual
    const today = new Date();
    if (year === today.getFullYear() && 
        month === today.getMonth() && 
        day === today.getDate()) {
        dayElement.classList.add('today');
    }

    // Marcar fines de semana
    const dayOfWeek = new Date(year, month, day).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayElement.classList.add('weekend');
    }

    // Event listener para seleccionar día
    dayElement.addEventListener('click', () => selectDate(dayElement));

    return dayElement;
}

// Actualizar título del mes
function updateMonthTitle(year, month) {
    const monthTitle = document.getElementById('calendar-month-year');
    if (monthTitle) {
        monthTitle.textContent = `${getMonthName(month)} ${year}`;
    }
}

// Seleccionar fecha
function selectDate(dayElement) {
    try {
        // Remover selección anterior
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Seleccionar nueva fecha
        dayElement.classList.add('selected');
        selectedDate = dayElement.dataset.date;
        
        // Mostrar citas del día
        showDayAppointments(selectedDate);
        
        console.log(`📅 Fecha seleccionada: ${selectedDate}`);
    } catch (error) {
        console.error('Error seleccionando fecha:', error);
    }
}

// Mostrar citas del día
function showDayAppointments(date) {
    try {
        const dayAppointments = appointments.filter(apt => apt.fecha === date);
        const appointmentsList = document.getElementById('appointments-list');
        
        if (!appointmentsList) {
            console.warn('⚠️ Lista de citas no encontrada');
            return;
        }

        appointmentsList.innerHTML = '';

        if (dayAppointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-check"></i>
                    <p>No hay citas programadas para este día</p>
                    <button class="btn btn-primary btn-sm" onclick="openNewAppointmentModal('${date}')">
                        <i class="fas fa-plus"></i> Agendar cita
                    </button>
                </div>
            `;
            return;
        }

        dayAppointments.forEach(appointment => {
            const appointmentElement = createAppointmentElement(appointment);
            appointmentsList.appendChild(appointmentElement);
        });

        console.log(`📋 Mostrando ${dayAppointments.length} citas para ${date}`);

    } catch (error) {
        console.error('Error mostrando citas del día:', error);
    }
}

// Crear elemento de cita
function createAppointmentElement(appointment) {
    const element = document.createElement('div');
    element.className = `appointment-item ${appointment.estado || 'programada'}`;
    
    element.innerHTML = `
        <div class="appointment-time">${appointment.hora}</div>
        <div class="appointment-details">
            <div class="appointment-patient">
                ${appointment.paciente || appointment.nombrePaciente || 'Sin nombre'}
            </div>
            <div class="appointment-type">
                ${appointment.tipo || 'Consulta general'}
            </div>
            <div class="appointment-professional">
                Prof. ${appointment.profesional || 'Sin asignar'}
            </div>
        </div>
        <div class="appointment-status">
            <span class="status-badge ${appointment.estado || 'programada'}">
                ${getStatusText(appointment.estado || 'programada')}
            </span>
        </div>
        <div class="appointment-actions">
            <button class="btn-sm btn-primary" onclick="viewAppointment('${appointment.id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-sm btn-secondary" onclick="editAppointment('${appointment.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
    
    return element;
}

// Cargar citas desde Firebase
window.loadAppointments = async function() {
    try {
        console.log('📋 Cargando citas...');
        
        // En un entorno real, cargarías desde Firebase
        // Por ahora, crear datos de ejemplo
        appointments = createSampleAppointments();

        // Actualizar vista del calendario con indicadores
        updateCalendarIndicators();
        
        console.log(`✅ ${appointments.length} citas cargadas`);
        
        if (appointments.length === 0) {
            if (window.showNotification) {
                window.showNotification('No hay citas programadas', 'info');
            }
        }
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        if (window.showNotification) {
            window.showNotification('Error al cargar las citas', 'error');
        }
        
        // Mostrar datos de ejemplo si falla
        appointments = createSampleAppointments();
        updateCalendarIndicators();
    }
};

// Crear citas de ejemplo para testing
function createSampleAppointments() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
        {
            id: 'sample1',
            fecha: formatDateForStorage(today),
            hora: '09:00',
            paciente: 'Juan Pérez',
            tipo: 'Consulta inicial',
            profesional: 'Dr. García',
            estado: 'confirmada'
        },
        {
            id: 'sample2',
            fecha: formatDateForStorage(tomorrow),
            hora: '14:30',
            paciente: 'María González',
            tipo: 'Seguimiento',
            profesional: 'Dra. López',
            estado: 'programada'
        },
        {
            id: 'sample3',
            fecha: formatDateForStorage(nextWeek),
            hora: '10:15',
            paciente: 'Pedro Martínez',
            tipo: 'Evaluación',
            profesional: 'Psic. Fernández',
            estado: 'programada'
        }
    ];
}

// Actualizar indicadores en el calendario
function updateCalendarIndicators() {
    try {
        // Limpiar indicadores anteriores
        document.querySelectorAll('.calendar-day .appointment-indicator').forEach(indicator => {
            indicator.remove();
        });

        // Agregar nuevos indicadores
        appointments.forEach(appointment => {
            const dayElement = document.querySelector(`[data-date="${appointment.fecha}"]`);
            if (dayElement && !dayElement.querySelector('.appointment-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'appointment-indicator';
                dayElement.appendChild(indicator);
            }
        });
        
        console.log('✅ Indicadores de calendario actualizados');
    } catch (error) {
        console.error('Error actualizando indicadores:', error);
    }
}

// Configurar eventos del calendario
function setupCalendarEvents() {
    try {
        // Botón mes anterior
        const prevButton = document.getElementById('prev-month');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
                updateCalendarIndicators();
            });
        }

        // Botón mes siguiente
        const nextButton = document.getElementById('next-month');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
                updateCalendarIndicators();
            });
        }

        // Botón nueva cita
        const newAppointmentBtn = document.getElementById('nueva-cita-btn');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => openNewAppointmentModal());
        }

        console.log('✅ Eventos de calendario configurados');
    } catch (error) {
        console.error('Error configurando eventos:', error);
    }
}

// Abrir modal para nueva cita
window.openNewAppointmentModal = function(preselectedDate = null) {
    try {
        console.log('📅 Abriendo modal de nueva cita...');
        
        // Crear modal dinámico si no existe
        createAppointmentModal();
        
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            // Pre-llenar con fecha seleccionada
            if (preselectedDate || selectedDate) {
                const dateInput = document.getElementById('appointment-date');
                if (dateInput) {
                    dateInput.value = preselectedDate || selectedDate;
                }
            }
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error abriendo modal de cita:', error);
        if (window.showNotification) {
            window.showNotification('Error abriendo formulario de cita', 'error');
        }
    }
};

// Crear modal de cita dinámicamente
function createAppointmentModal() {
    if (document.getElementById('appointment-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'appointment-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <button class="modal-close" onclick="closeModal('appointment-modal')">
                <i class="fas fa-times"></i>
            </button>
            
            <h2>Nueva Cita</h2>
            
            <form id="appointment-form">
                <div class="form-group">
                    <label for="appointment-date">Fecha</label>
                    <input type="date" id="appointment-date" name="fecha" required>
                </div>
                
                <div class="form-group">
                    <label for="appointment-time">Hora</label>
                    <select id="appointment-time" name="hora" required>
                        <option value="">Seleccionar hora</option>
                        ${generateTimeOptions()}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="patient-name">Paciente</label>
                    <input type="text" id="patient-name" name="paciente" required>
                </div>
                
                <div class="form-group">
                    <label for="appointment-type">Tipo de cita</label>
                    <select id="appointment-type" name="tipo">
                        <option value="consulta">Consulta</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="evaluacion">Evaluación</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal('appointment-modal')" class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Crear Cita
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar formulario
    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', handleAppointmentSubmit);
    }
}

// Generar opciones de hora
function generateTimeOptions() {
    const options = [];
    for (let hour = 8; hour < 18; hour++) {
        for (let minutes of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
            options.push(`<option value="${time}">${time}</option>`);
        }
    }
    return options.join('');
}

// Manejar envío de formulario de cita
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const appointmentData = {
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            paciente: formData.get('paciente'),
            tipo: formData.get('tipo') || 'consulta',
            profesional: getCurrentUserDisplayName(),
            estado: 'programada',
            fechaCreacion: new Date().toISOString()
        };
        
        await saveAppointment(appointmentData);
        
    } catch (error) {
        console.error('Error guardando cita:', error);
        if (window.showNotification) {
            window.showNotification('Error al crear la cita', 'error');
        }
    }
}

// Guardar nueva cita
window.saveAppointment = async function(appointmentData) {
    try {
        // En un entorno real, guardarías en Firebase
        // Por ahora, agregar a la lista local
        appointmentData.id = 'apt_' + Date.now();
        appointments.push(appointmentData);
        
        if (window.showNotification) {
            window.showNotification('Cita programada exitosamente', 'success');
        }
        
        await window.loadAppointments(); // Recargar citas
        
        // Cerrar modal
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error guardando cita:', error);
        if (window.showNotification) {
            window.showNotification('Error al programar la cita', 'error');
        }
    }
};

// Utilidades
function getMonthName(monthIndex) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
}

function getStatusText(status) {
    const statusMap = {
        'programada': 'Programada',
        'confirmada': 'Confirmada',
        'realizada': 'Realizada',
        'cancelada': 'Cancelada',
        'no_asistio': 'No asistió'
    };
    return statusMap[status] || status;
}

function formatDateForStorage(date) {
    return date.toISOString().split('T')[0];
}

function getCurrentUserDisplayName() {
    if (window.currentUserData) {
        return `${window.currentUserData.nombre} ${window.currentUserData.apellidos}`;
    }
    return 'Profesional SENDA';
}

// Función para cerrar modal (global)
window.closeModal = window.closeModal || function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// Funciones de gestión de citas
window.viewAppointment = function(appointmentId) {
    console.log('Ver cita:', appointmentId);
    if (window.showNotification) {
        window.showNotification('Función de ver cita en desarrollo', 'info');
    }
};

window.editAppointment = function(appointmentId) {
    console.log('Editar cita:', appointmentId);
    if (window.showNotification) {
        window.showNotification('Función de editar cita en desarrollo', 'info');
    }
};

// Funciones adicionales para módulos
window.initUpcomingAppointments = function() {
    console.log('📅 initUpcomingAppointments inicializado');
    // Esta función se puede expandir más adelante
};

window.initScheduleManager = function() {
    console.log('📅 initScheduleManager inicializado');
    // Esta función se puede expandir más adelante
};

console.log('📅 Calendario cargado - Función principal disponible en window.initCalendar');
