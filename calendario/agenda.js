import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales para el calendario
let currentDate = new Date();
let selectedDate = null;
let appointments = [];

// Inicializar calendario
export function initCalendar() {
    renderCalendar();
    loadAppointments();
    setupCalendarEvents();
    console.log('📅 Calendario inicializado');
}

// Renderizar calendario
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Actualizar título del mes
    const monthTitle = document.getElementById('current-month');
    if (monthTitle) {
        monthTitle.textContent = `${getMonthName(month)} ${year}`;
    }

    // Limpiar grid
    calendarGrid.innerHTML = '';

    // Obtener primer día del mes y días en el mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Crear días vacíos para el inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    // Crear días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
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
}

// Seleccionar fecha
function selectDate(dayElement) {
    // Remover selección anterior
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });

    // Seleccionar nueva fecha
    dayElement.classList.add('selected');
    selectedDate = dayElement.dataset.date;
    
    // Mostrar citas del día
    showDayAppointments(selectedDate);
}

// Mostrar citas del día
function showDayAppointments(date) {
    const dayAppointments = appointments.filter(apt => apt.fecha === date);
    const appointmentsList = document.getElementById('day-appointments-list');
    
    if (!appointmentsList) return;

    appointmentsList.innerHTML = '';

    if (dayAppointments.length === 0) {
        appointmentsList.innerHTML = '<p class="no-appointments">No hay citas programadas para este día</p>';
        return;
    }

    dayAppointments.forEach(appointment => {
        const appointmentElement = document.createElement('div');
        appointmentElement.className = 'appointment-item';
        appointmentElement.innerHTML = `
            <div class="appointment-time">${appointment.hora}</div>
            <div class="appointment-details">
                <h4>${appointment.paciente}</h4>
                <p>${appointment.tipo || 'Consulta general'}</p>
                <p class="professional">Prof. ${appointment.profesional}</p>
            </div>
            <div class="appointment-status ${appointment.estado}">
                ${getStatusText(appointment.estado)}
            </div>
        `;
        appointmentsList.appendChild(appointmentElement);
    });
}

// Cargar citas desde Firebase
async function loadAppointments() {
    try {
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
}

// Configurar eventos del calendario
function setupCalendarEvents() {
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
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', openNewAppointmentModal);
    }
}

// Abrir modal para nueva cita
function openNewAppointmentModal() {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        // Pre-llenar con fecha seleccionada si existe
        if (selectedDate) {
            const dateInput = document.getElementById('appointment-date');
            if (dateInput) {
                dateInput.value = selectedDate;
            }
        }
        modal.style.display = 'flex';
    }
}

// Guardar nueva cita
export async function saveAppointment(appointmentData) {
    try {
        const citasRef = db.collection('citas');
        await citasRef.add({
            ...appointmentData,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'programada'
        });

        showNotification('Cita programada exitosamente', 'success');
        await loadAppointments(); // Recargar citas
        
        // Cerrar modal
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.style.display = 'none';
        }

    } catch (error) {
        console.error('Error guardando cita:', error);
        showNotification('Error al programar la cita', 'error');
    }
}

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

// Exportar funciones principales
export { 
    renderCalendar, 
    loadAppointments, 
    selectDate,
    showDayAppointments
};
