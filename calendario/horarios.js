/**
 * CALENDARIO/HORARIOS.JS - VERSIÓN SIN IMPORTS
 * Gestión de horarios disponibles para profesionales
 */

// Variables globales para horarios
let professionalSchedules = new Map();
let currentWeek = new Date();

/**
 * Inicializar gestión de horarios
 */
window.initScheduleManager = function() {
    try {
        console.log('⏰ Inicializando gestor de horarios...');
        
        setupScheduleView();
        loadProfessionalSchedules();
        setupScheduleEvents();
        
        console.log('⏰ Gestor de horarios inicializado');
    } catch (error) {
        console.error('Error inicializando gestor de horarios:', error);
    }
};

/**
 * Configurar vista de horarios
 */
function setupScheduleView() {
    try {
        renderWeekView();
        setupTimeSlots();
        setupProfessionalFilter();
    } catch (error) {
        console.error('Error configurando vista de horarios:', error);
    }
}

/**
 * Renderizar vista semanal
 */
window.renderWeekView = function() {
    try {
        const weekContainer = document.getElementById('week-schedule');
        if (!weekContainer) {
            console.warn('Contenedor week-schedule no encontrado');
            return;
        }

        const startOfWeek = getStartOfWeek(currentWeek);
        const weekTitle = document.getElementById('current-week');
        
        if (weekTitle) {
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            weekTitle.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
        }

        // Limpiar contenedor
        weekContainer.innerHTML = '';

        // Crear header con días de la semana
        const headerRow = document.createElement('div');
        headerRow.className = 'schedule-header';
        
        const timeHeader = document.createElement('div');
        timeHeader.className = 'time-header';
        timeHeader.textContent = 'Hora';
        headerRow.appendChild(timeHeader);

        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        days.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(currentDate.getDate() + index);
            
            dayHeader.innerHTML = `
                <div class="day-name">${day}</div>
                <div class="day-date">${currentDate.getDate()}</div>
            `;
            headerRow.appendChild(dayHeader);
        });

        weekContainer.appendChild(headerRow);

        // Crear filas de horarios
        renderTimeSlots();
        
    } catch (error) {
        console.error('Error renderizando vista semanal:', error);
    }
};

/**
 * Renderizar slots de tiempo
 */
function renderTimeSlots() {
    try {
        const weekContainer = document.getElementById('week-schedule');
        if (!weekContainer) return;

        const startHour = 8;
        const endHour = 18;
        const interval = 30; // minutos

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += interval) {
                const timeSlotRow = document.createElement('div');
                timeSlotRow.className = 'schedule-row';

                // Columna de tiempo
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                timeLabel.textContent = timeString;
                timeSlotRow.appendChild(timeLabel);

                // Crear slots para cada día de la semana (lunes a sábado)
                for (let day = 0; day < 6; day++) {
                    const daySlot = document.createElement('div');
                    daySlot.className = 'time-slot';
                    daySlot.dataset.day = day;
                    daySlot.dataset.time = timeString;
                    daySlot.dataset.datetime = getSlotDateTime(day, hour, minutes);

                    // Event listener para gestionar disponibilidad
                    daySlot.addEventListener('click', () => toggleSlotAvailability(daySlot));

                    timeSlotRow.appendChild(daySlot);
                }

                weekContainer.appendChild(timeSlotRow);
            }
        }
    } catch (error) {
        console.error('Error renderizando slots de tiempo:', error);
    }
}

/**
 * Obtener fecha y hora del slot
 */
function getSlotDateTime(dayIndex, hour, minutes) {
    try {
        const startOfWeek = getStartOfWeek(currentWeek);
        const slotDate = new Date(startOfWeek);
        slotDate.setDate(slotDate.getDate() + dayIndex);
        slotDate.setHours(hour, minutes, 0, 0);
        
        return slotDate.toISOString().split('T')[0] + ' ' + 
               `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Error obteniendo fecha del slot:', error);
        return '';
    }
}

/**
 * Alternar disponibilidad del slot
 */
window.toggleSlotAvailability = async function(slotElement) {
    try {
        const professional = document.getElementById('professional-filter')?.value;
        
        if (!professional) {
            if (window.showNotification) {
                window.showNotification('Selecciona un profesional primero', 'warning');
            }
            return;
        }

        const isAvailable = slotElement.classList.contains('available');
        const datetime = slotElement.dataset.datetime;

        if (isAvailable) {
            // Remover disponibilidad
            await removeAvailability(professional, datetime);
            slotElement.classList.remove('available');
            slotElement.classList.add('unavailable');
        } else {
            // Agregar disponibilidad
            await addAvailability(professional, datetime);
            slotElement.classList.remove('unavailable');
            slotElement.classList.add('available');
        }
    } catch (error) {
        console.error('Error actualizando disponibilidad:', error);
        if (window.showNotification) {
            window.showNotification('Error al actualizar horario', 'error');
        }
    }
};

/**
 * Agregar disponibilidad
 */
async function addAvailability(professional, datetime) {
    try {
        const db = window.getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        
        const [date, time] = datetime.split(' ');
        
        const availabilityRef = db.collection('horarios_disponibles');
        await availabilityRef.add({
            profesional: professional,
            fecha: date,
            hora: time,
            disponible: true,
            fechaCreacion: window.getServerTimestamp ? window.getServerTimestamp() : new Date()
        });
        
        console.log(`✅ Disponibilidad agregada: ${professional} - ${datetime}`);
        
    } catch (error) {
        console.error('Error agregando disponibilidad:', error);
        throw error;
    }
}

/**
 * Remover disponibilidad
 */
async function removeAvailability(professional, datetime) {
    try {
        const db = window.getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        
        const [date, time] = datetime.split(' ');
        
        const availabilityRef = db.collection('horarios_disponibles');
        const query = availabilityRef
            .where('profesional', '==', professional)
            .where('fecha', '==', date)
            .where('hora', '==', time);

        const snapshot = await query.get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`🗑️ Disponibilidad removida: ${professional} - ${datetime}`);
        
    } catch (error) {
        console.error('Error removiendo disponibilidad:', error);
        throw error;
    }
}

/**
 * Cargar horarios de profesionales
 */
window.loadProfessionalSchedules = async function() {
    try {
        console.log('📅 Cargando horarios de profesionales...');
        
        const db = window.getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible, usando datos de ejemplo');
            createSampleSchedules();
            return;
        }

        const horariosRef = db.collection('horarios_disponibles');
        const snapshot = await horariosRef.get();
        
        professionalSchedules.clear();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = `${data.profesional}-${data.fecha}-${data.hora}`;
            professionalSchedules.set(key, {
                id: doc.id,
                ...data
            });
        });

        updateScheduleView();
        console.log(`⏰ ${professionalSchedules.size} horarios cargados`);

    } catch (error) {
        console.error('Error cargando horarios:', error);
        createSampleSchedules();
        if (window.showNotification) {
            window.showNotification('Error al cargar horarios, usando datos de ejemplo', 'warning');
        }
    }
};

/**
 * Crear horarios de ejemplo
 */
function createSampleSchedules() {
    try {
        professionalSchedules.clear();
        
        const today = new Date();
        const professionals = ['prof1', 'prof2', 'prof3'];
        
        professionals.forEach((prof, profIndex) => {
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const date = new Date(today);
                date.setDate(date.getDate() + dayOffset);
                const dateStr = formatDate(date);
                
                // Horarios de 9:00 a 17:00 con algunos gaps
                for (let hour = 9; hour < 17; hour++) {
                    for (let minutes of [0, 30]) {
                        // Crear algunos horarios disponibles aleatoriamente
                        if (Math.random() > 0.3) { // 70% de probabilidad
                            const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            const key = `${prof}-${dateStr}-${timeStr}`;
                            
                            professionalSchedules.set(key, {
                                id: `sample_${profIndex}_${dayOffset}_${hour}_${minutes}`,
                                profesional: prof,
                                fecha: dateStr,
                                hora: timeStr,
                                disponible: true,
                                fechaCreacion: new Date()
                            });
                        }
                    }
                }
            }
        });
        
        console.log(`📝 ${professionalSchedules.size} horarios de ejemplo creados`);
    } catch (error) {
        console.error('Error creando horarios de ejemplo:', error);
    }
}

/**
 * Actualizar la vista de horarios según profesional seleccionado
 */
window.updateScheduleView = function() {
    try {
        const professional = document.getElementById('professional-filter')?.value;
        if (!professional) {
            console.warn('No hay profesional seleccionado');
            return;
        }

        // Limpiar clases anteriores
        document.querySelectorAll('.time-slot').forEach(slot => {
            if (slot) {
                slot.classList.remove('available', 'unavailable', 'booked');
            }
        });

        // Aplicar disponibilidad actual
        document.querySelectorAll('.time-slot').forEach(slot => {
            if (!slot || !slot.dataset) return;
            
            const datetime = slot.dataset.datetime;
            if (!datetime) return;
            
            const [date, time] = datetime.split(' ');
            const key = `${professional}-${date}-${time}`;
            
            if (professionalSchedules.has(key)) {
                const schedule = professionalSchedules.get(key);
                if (schedule && schedule.disponible) {
                    slot.classList.add('available');
                } else {
                    slot.classList.add('unavailable');
                }
            } else {
                slot.classList.add('unavailable');
            }
        });

        // Marcar citas existentes
        markExistingAppointments(professional);
    } catch (error) {
        console.error('Error actualizando vista de horarios:', error);
    }
};

/**
 * Marcar citas existentes como ocupadas
 */
async function markExistingAppointments(professional) {
    try {
        const db = window.getFirestore();
        if (!db) return;

        const startOfWeek = getStartOfWeek(currentWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const citasRef = db.collection('citas');
        const query = citasRef
            .where('profesional', '==', professional)
            .where('fecha', '>=', formatDate(startOfWeek))
            .where('fecha', '<=', formatDate(endOfWeek))
            .where('estado', 'in', ['programada', 'confirmada']);

        const snapshot = await query.get();
        
        snapshot.forEach(doc => {
            const cita = doc.data();
            const datetime = `${cita.fecha} ${cita.hora}`;
            const slot = document.querySelector(`[data-datetime="${datetime}"]`);
            
            if (slot) {
                slot.classList.remove('available', 'unavailable');
                slot.classList.add('booked');
                slot.title = `Cita: ${cita.paciente || 'Paciente'}`;
            }
        });

    } catch (error) {
        console.error('Error marcando citas existentes:', error);
    }
}

/**
 * Configurar filtro de profesionales
 */
function setupProfessionalFilter() {
    try {
        loadProfessionalsForFilter();
        
        const filter = document.getElementById('professional-filter');
        if (filter) {
            filter.addEventListener('change', window.updateScheduleView);
        }
    } catch (error) {
        console.error('Error configurando filtro de profesionales:', error);
    }
}

/**
 * Cargar profesionales para el filtro
 */
async function loadProfessionalsForFilter() {
    try {
        const select = document.getElementById('professional-filter');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar profesional</option>';

        const db = window.getFirestore();
        if (!db) {
            // Usar datos de ejemplo
            const sampleProfessionals = [
                { id: 'prof1', nombre: 'Dr. García', especialidad: 'Médico' },
                { id: 'prof2', nombre: 'Psic. López', especialidad: 'Psicólogo' },
                { id: 'prof3', nombre: 'T.S. Martínez', especialidad: 'Asistente Social' }
            ];
            
            sampleProfessionals.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = `${prof.nombre} - ${prof.especialidad}`;
                select.appendChild(option);
            });
            return;
        }

        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();

        snapshot.forEach(doc => {
            const prof = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${prof.nombre} - ${prof.especialidad || 'Profesional'}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando profesionales:', error);
    }
}

/**
 * Configurar eventos de horarios
 */
function setupScheduleEvents() {
    try {
        const prevWeekBtn = document.getElementById('prev-week');
        const nextWeekBtn = document.getElementById('next-week');

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentWeek.setDate(currentWeek.getDate() - 7);
                window.renderWeekView();
                window.updateScheduleView();
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentWeek.setDate(currentWeek.getDate() + 7);
                window.renderWeekView();
                window.updateScheduleView();
            });
        }

        // Botón para establecer horario recurrente
        const recurringBtn = document.getElementById('set-recurring-schedule');
        if (recurringBtn) {
            recurringBtn.addEventListener('click', openRecurringScheduleModal);
        }
    } catch (error) {
        console.error('Error configurando eventos de horarios:', error);
    }
}

/**
 * Abrir modal para horario recurrente
 */
function openRecurringScheduleModal() {
    try {
        const modal = document.getElementById('recurring-schedule-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            if (window.showNotification) {
                window.showNotification('Modal de horario recurrente no encontrado', 'warning');
            }
        }
    } catch (error) {
        console.error('Error abriendo modal de horario recurrente:', error);
    }
}

/**
 * Establecer horario recurrente para profesional
 */
window.setRecurringSchedule = async function(scheduleData) {
    try {
        const { professional, days, startTime, endTime, startDate, endDate } = scheduleData;
        
        const db = window.getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }

        const batch = db.batch();
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (days.includes(dayOfWeek)) {
                const dateStr = formatDate(current);
                const start = parseTime(startTime);
                const endT = parseTime(endTime);

                while (start < endT) {
                    const timeStr = formatTime(start);
                    const availabilityRef = db.collection('horarios_disponibles').doc();
                    batch.set(availabilityRef, {
                        profesional: professional,
                        fecha: dateStr,
                        hora: timeStr,
                        disponible: true,
                        recurrente: true,
                        fechaCreacion: window.getServerTimestamp ? window.getServerTimestamp() : new Date()
                    });
                    start.setMinutes(start.getMinutes() + 30);
                }
            }
            current.setDate(current.getDate() + 1);
        }

        await batch.commit();
        
        if (window.showNotification) {
            window.showNotification('Horario recurrente establecido correctamente', 'success');
        }
        
        await window.loadProfessionalSchedules();
        
    } catch (error) {
        console.error('Error estableciendo horario recurrente:', error);
        if (window.showNotification) {
            window.showNotification('Error al establecer horario recurrente', 'error');
        }
    }
};

/**
 * Retorna los horarios disponibles para un profesional en una fecha
 */
window.getAvailableSlots = async function(professionalId, date) {
    try {
        const db = window.getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible, retornando slots de ejemplo');
            return ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];
        }

        const horariosRef = db.collection('horarios_disponibles');
        const query = horariosRef
            .where('profesional', '==', professionalId)
            .where('fecha', '==', date)
            .where('disponible', '==', true);

        const snapshot = await query.get();
        const availableSlots = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            availableSlots.push(data.hora);
        });

        // Filtrar slots que ya tienen citas tomadas
        const citasRef = db.collection('citas');
        const citasQuery = citasRef
            .where('profesional', '==', professionalId)
            .where('fecha', '==', date)
            .where('estado', 'in', ['programada', 'confirmada']);

        const citasSnapshot = await citasQuery.get();
        const bookedSlots = [];

        citasSnapshot.forEach(doc => {
            bookedSlots.push(doc.data().hora);
        });

        return availableSlots.filter(slot => !bookedSlots.includes(slot));
    } catch (error) {
        console.error('Error obteniendo slots disponibles:', error);
        return [];
    }
};

/**
 * Configurar los slots de tiempo
 */
window.setupTimeSlots = function() {
    try {
        const timeSlotsContainer = document.getElementById('time-slots-container');
        if (!timeSlotsContainer) {
            console.warn('Contenedor de slots de tiempo no encontrado');
            return;
        }

        // Generar slots de tiempo (8:00 AM - 6:00 PM)
        const timeSlots = generateTimeSlots();
        
        timeSlotsContainer.innerHTML = timeSlots.map(slot => `
            <div class="time-slot" data-time="${slot.value}">
                <input type="radio" name="appointment-time" value="${slot.value}" id="time-${slot.value}">
                <label for="time-${slot.value}">${slot.label}</label>
            </div>
        `).join('');

        console.log('✅ Slots de tiempo configurados');
        
    } catch (error) {
        console.error('❌ Error configurando slots de tiempo:', error);
    }
};

/**
 * Genera los slots de tiempo disponibles
 */
function generateTimeSlots() {
    const slots = [];
    const startHour = 8; // 8:00 AM
    const endHour = 18;  // 6:00 PM
    const interval = 30; // 30 minutos

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minutes = 0; minutes < 60; minutes += interval) {
            const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const label = formatTimeLabel(hour, minutes);
            
            slots.push({
                value: time,
                label: label
            });
        }
    }

    return slots;
}

// === FUNCIONES UTILITARIAS ===

function getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
}

function formatDate(date) {
    if (!date) return '';
    return date.toISOString().split('T')[0];
}

function formatTime(date) {
    if (!date) return '';
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
}

function formatTimeLabel(hour, minutes) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${period}`;
}

console.log('⏰ Sistema de horarios cargado - Funciones disponibles en window');
      
