(function () {
    // Variables globales para horarios
    let professionalSchedules = new Map();
    let currentWeek = new Date();

    // Inicializar gestión de horarios
    function initScheduleManager() {
        setupScheduleView();
        loadProfessionalSchedules();
        setupScheduleEvents();
        console.log('⏰ Gestor de horarios inicializado');
    }

    // Configurar vista de horarios
    function setupScheduleView() {
        renderWeekView();
        setupTimeSlots();
        setupProfessionalFilter();
    }

    // Renderizar vista semanal
    function renderWeekView() {
        const weekContainer = document.getElementById('week-schedule');
        if (!weekContainer) return;

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
    }

    // Renderizar slots de tiempo
    function renderTimeSlots() {
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
    }

    // Obtener fecha y hora del slot
    function getSlotDateTime(dayIndex, hour, minutes) {
        const startOfWeek = getStartOfWeek(currentWeek);
        const slotDate = new Date(startOfWeek);
        slotDate.setDate(slotDate.getDate() + dayIndex);
        slotDate.setHours(hour, minutes, 0, 0);

        return slotDate.toISOString().split('T')[0] + ' ' +
            `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Alternar disponibilidad del slot
    async function toggleSlotAvailability(slotElement) {
        const professional = document.getElementById('professional-filter').value;

        if (!professional) {
            showNotification('Selecciona un profesional primero', 'warning');
            return;
        }

        const isAvailable = slotElement.classList.contains('available');
        const datetime = slotElement.dataset.datetime;

        try {
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
            showNotification('Error al actualizar horario', 'error');
        }
    }

    // Agregar disponibilidad
    async function addAvailability(professional, datetime) {
        const db = getFirestore();
        const [date, time] = datetime.split(' ');

        const availabilityRef = db.collection('horarios_disponibles');
        await availabilityRef.add({
            profesional: professional,
            fecha: date,
            hora: time,
            disponible: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    // Remover disponibilidad
    async function removeAvailability(professional, datetime) {
        const db = getFirestore();
        const [date, time] = datetime.split(' ');

        const availabilityRef = db.collection('horarios_disponibles');
        const query = availabilityRef
            .where('profesional', '==', professional)
            .where('fecha', '==', date)
            .where('hora', '==', time);

        const snapshot = await query.get();
        snapshot.forEach(doc => {
            doc.ref.delete();
        });
    }

    // Cargar horarios de profesionales
    async function loadProfessionalSchedules() {
        try {
            const db = getFirestore();
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
            showNotification('Error al cargar horarios', 'error');
        }
    }

    // Actualizar la vista de horarios según profesional seleccionado
    function updateScheduleView() {
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
    }

    // Marcar citas existentes como ocupadas
    async function markExistingAppointments(professional) {
        try {
            const db = getFirestore();
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
                    slot.title = `Cita: ${cita.paciente || ''}`;
                }
            });

        } catch (error) {
            console.error('Error marcando citas existentes:', error);
        }
    }

    // Configurar filtro de profesionales
    function setupProfessionalFilter() {
        loadProfessionalsForFilter();

        const filter = document.getElementById('professional-filter');
        if (filter) {
            filter.addEventListener('change', updateScheduleView);
        }
    }

    // Cargar profesionales para el filtro
    async function loadProfessionalsForFilter() {
        try {
            const db = getFirestore();
            const profRef = db.collection('profesionales');
            const snapshot = await profRef.where('activo', '==', true).get();

            const select = document.getElementById('professional-filter');
            if (!select) return;

            select.innerHTML = '<option value="">Seleccionar profesional</option>';

            snapshot.forEach(doc => {
                const prof = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;  // Usar el ID del profesional aquí para consistencia
                option.textContent = `${prof.nombre} - ${prof.especialidad || ''}`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error cargando profesionales:', error);
        }
    }

    // Configurar eventos de horarios (navegación, recurrente, etc)
    function setupScheduleEvents() {
        const prevWeekBtn = document.getElementById('prev-week');
        const nextWeekBtn = document.getElementById('next-week');

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentWeek.setDate(currentWeek.getDate() - 7);
                renderWeekView();
                updateScheduleView();
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentWeek.setDate(currentWeek.getDate() + 7);
                renderWeekView();
                updateScheduleView();
            });
        }

        // Botón para establecer horario recurrente
        const recurringBtn = document.getElementById('set-recurring-schedule');
        if (recurringBtn) {
            recurringBtn.addEventListener('click', openRecurringScheduleModal);
        }
    }

    // Abrir modal para horario recurrente
    function openRecurringScheduleModal() {
        const modal = document.getElementById('recurring-schedule-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Establecer horario recurrente para profesional
    async function setRecurringSchedule(scheduleData) {
        const { professional, days, startTime, endTime, startDate, endDate } = scheduleData;

        try {
            const db = getFirestore();
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
                            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        start.setMinutes(start.getMinutes() + 30);
                    }
                }
                current.setDate(current.getDate() + 1);
            }

            await batch.commit();
            showNotification('Horario recurrente establecido correctamente', 'success');
            await loadProfessionalSchedules();

        } catch (error) {
            console.error('Error estableciendo horario recurrente:', error);
            showNotification('Error al establecer horario recurrente', 'error');
        }
    }

    // Utilidades
    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lunes
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    function formatTime(date) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    function parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    }

    /**
     * Retorna los horarios disponibles para un profesional en una fecha (para agendar nueva cita)
     * @param {string} professionalId
     * @param {string} date formato YYYY-MM-DD
     * @returns {Promise<string[]>}
     */
    async function getAvailableSlots(professionalId, date) {
        try {
            const db = getFirestore();
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
    }

    /**
     * Configura los slots de tiempo para las citas (si lo necesitas en algún formulario extra)
     */
    function setupTimeSlots() {
        try {
            const timeSlotsContainer = document.getElementById('time-slots-container');
            if (!timeSlotsContainer) {
                console.warn('Contenedor de slots de tiempo no encontrado');
                return;
            }

            // Generar slots de tiempo (ejemplo: 8:00 AM - 6:00 PM)
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
    }

    /**
     * Genera los slots de tiempo disponibles (por si lo necesitas)
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
    function formatTimeLabel(hour, minutes) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHour}:${displayMinutes} ${period}`;
    }

    // Exportar funciones principales al window
    window.initScheduleManager = initScheduleManager;
    window.setRecurringSchedule = setRecurringSchedule;
    window.getAvailableSlots = getAvailableSlots;
    window.loadProfessionalSchedules = loadProfessionalSchedules;
})();
}
