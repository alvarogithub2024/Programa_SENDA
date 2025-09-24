
import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales para el calendario
let currentDate = new Date();
let selectedDate = null;
let appointments = [];

// Inicializar calendario
export function initCalendar() {
    try {
        renderCalendar();
        loadAppointments();
        setupCalendarEvents();
        console.log('📅 Calendario inicializado');
    } catch (error) {
        console.error('Error inicializando calendario:', error);
    }
}

// Renderizar calendario
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) {
        console.warn('Elemento calendar-grid no encontrado');
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // ✅ CORREGIR: Actualizar título del mes
    const monthTitle = document.getElementById('calendar-month-year');
    if (monthTitle) {
        monthTitle.textContent = `${getMonthName(month)} ${year}`;
    } else {
        console.warn('Elemento calendar-month-year no encontrado');
    }

    // Limpiar grid
    calendarGrid.innerHTML = '';

    // ✅ AGREGAR HEADERS DE DÍAS
    const daysHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    daysHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Obtener primer día del mes y días en el mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Crear días vacíos para el inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    // Crear días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        dayElement.dataset.date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // Marcar día actual
        const today = new Date();
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }

        // Event listener para seleccionar día
        dayElement.addEventListener('click', () => selectDate(dayElement));

        calendarGrid.appendChild(dayElement);
    }

    console.log('✅ Calendario renderizado correctamente');
}

// ✅ CORREGIR: Función para obtener nombre del mes
function getMonthName(monthIndex) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex] || 'Mes';
}

// ✅ CORREGIR: Configurar eventos del calendario
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

        // ✅ ARREGLAR: Botón nueva cita
        const newAppointmentBtn = document.getElementById('nueva-cita-btn');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', openNewAppointmentModal);
            console.log('✅ Botón nueva cita configurado');
        } else {
            console.warn('Botón nueva-cita-btn no encontrado');
        }
        
    } catch (error) {
        console.error('Error configurando eventos del calendario:', error);
    }
}

// ✅ FUNCIÓN PARA ABRIR MODAL DE NUEVA CITA
function openNewAppointmentModal() {
    try {
        console.log('🔧 Abriendo modal de nueva cita...');
        
        // Crear modal dinámicamente si no existe
        let modal = document.getElementById('appointment-modal');
        if (!modal) {
            modal = createAppointmentModal();
            document.body.appendChild(modal);
        }
        
        // Pre-llenar con fecha seleccionada si existe
        if (selectedDate) {
            const dateInput = modal.querySelector('#appointment-date');
            if (dateInput) {
                dateInput.value = selectedDate;
            }
        }
        
        modal.style.display = 'flex';
        console.log('✅ Modal de nueva cita abierto');
        
    } catch (error) {
        console.error('Error abriendo modal de nueva cita:', error);
        showNotification('Error abriendo formulario de cita', 'error');
    }
}

// ✅ CREAR MODAL DE CITA DINÁMICAMENTE
function createAppointmentModal() {
    const modal = document.createElement('div');
    modal.id = 'appointment-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal large-modal">
            <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">
                <i class="fas fa-times"></i>
            </button>
            
            <h2>Nueva Cita</h2>
            
            <form id="appointment-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="appointment-date">Fecha</label>
                        <input type="date" id="appointment-date" required>
                    </div>
                    <div class="form-group">
                        <label for="appointment-time">Hora</label>
                        <input type="time" id="appointment-time" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="patient-name">Nombre del Paciente</label>
                        <input type="text" id="patient-name" required>
                    </div>
                    <div class="form-group">
                        <label for="patient-rut">RUT</label>
                        <input type="text" id="patient-rut">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="patient-phone">Teléfono</label>
                        <input type="tel" id="patient-phone">
                    </div>
                    <div class="form-group">
                        <label for="professional">Profesional</label>
                        <select id="professional" required>
                            <option value="">Seleccionar profesional</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="appointment-type">Tipo de Cita</label>
                    <select id="appointment-type">
                        <option value="consulta">Consulta General</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="evaluacion">Evaluación</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="appointment-notes">Notas</label>
                    <textarea id="appointment-notes" rows="3"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="this.closest('.modal-overlay').style.display='none'" class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Programar Cita
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Configurar envío del formulario
    const form = modal.querySelector('#appointment-form');
    form.addEventListener('submit', handleAppointmentSubmit);
    
    return modal;
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
        
    } catch (error) {
        console.error('Error seleccionando fecha:', error);
    }
}

// ✅ CORREGIR: Mostrar citas del día
function showDayAppointments(date) {
    try {
        const dayAppointments = appointments.filter(apt => apt.fecha === date);
        const appointmentsList = document.getElementById('appointments-list');
        
        if (!appointmentsList) {
            console.warn('Lista de citas no encontrada');
            return;
        }

        appointmentsList.innerHTML = '';

        if (dayAppointments.length === 0) {
            appointmentsList.innerHTML = '<div class="no-appointments"><p>No hay citas programadas para este día</p></div>';
            return;
        }

        dayAppointments.forEach(appointment => {
            const appointmentElement = document.createElement('div');
            appointmentElement.className = 'appointment-item';
            appointmentElement.innerHTML = `
                <div class="appointment-time">${appointment.hora}</div>
                <div class="appointment-details">
                    <div class="appointment-patient">${appointment.paciente}</div>
                    <div class="appointment-professional">${appointment.profesional}</div>
                    <div class="appointment-type">${appointment.tipo || 'Consulta general'}</div>
                </div>
                <div class="appointment-status">
                    <span class="status-badge ${appointment.estado}">${getStatusText(appointment.estado)}</span>
                </div>
            `;
            appointmentsList.appendChild(appointmentElement);
        });
        
    } catch (error) {
        console.error('Error mostrando citas del día:', error);
    }
}

// Cargar citas desde Firebase
export async function loadAppointments() {
    try {
        console.log('📅 Cargando citas desde Firebase...');
        
        if (!db) {
            console.error('Base de datos no inicializada');
            return;
        }
        
        const citasRef = db.collection('citas');
        const snapshot = await citasRef.get();
        
        appointments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            appointments.push({
                id: doc.id,
                ...data
            });
        });

        // Actualizar vista del calendario con indicadores
        updateCalendarIndicators();
        console.log(`📅 ${appointments.length} citas cargadas`);
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        showNotification('Error al cargar las citas', 'error');
    }
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
        
    } catch (error) {
        console.error('Error actualizando indicadores:', error);
    }
}

// ✅ MANEJAR ENVÍO DE FORMULARIO DE CITA
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const appointmentData = {
            paciente: e.target.querySelector('#patient-name').value,
            rut: e.target.querySelector('#patient-rut').value,
            telefono: e.target.querySelector('#patient-phone').value,
            fecha: e.target.querySelector('#appointment-date').value,
            hora: e.target.querySelector('#appointment-time').value,
            profesional: e.target.querySelector('#professional').value,
            tipo: e.target.querySelector('#appointment-type').value,
            notas: e.target.querySelector('#appointment-notes').value,
            estado: 'programada',
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validar campos requeridos
        if (!appointmentData.paciente || !appointmentData.fecha || 
            !appointmentData.hora || !appointmentData.profesional) {
            showNotification('Todos los campos marcados son requeridos', 'error');
            return;
        }

        await saveAppointment(appointmentData);
        
        // Cerrar modal y limpiar formulario
        document.getElementById('appointment-modal').style.display = 'none';
        e.target.reset();
        showNotification('Cita programada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error guardando cita:', error);
        showNotification('Error al programar la cita', 'error');
    }
}

// Guardar cita
async function saveAppointment(appointmentData) {
    const citasRef = db.collection('citas');
    await citasRef.add(appointmentData);
    await loadAppointments(); // Recargar citas
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
