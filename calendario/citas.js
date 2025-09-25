
/**
 * Abre el modal de nueva cita ordenado
 * @param {Date|string} preselectedDate Fecha preseleccionada (opcional)
 */
function openNewAppointmentModal(preselectedDate = null) {
    let modal = document.getElementById('appointment-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'appointment-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal large-modal">
            <button class="modal-close" onclick="closeModal('appointment-modal')">
                <i class="fas fa-times"></i>
            </button>
            <h2>Nueva Cita</h2>
            <form id="appointment-form" autocomplete="off">
                <div class="form-row">
                    <div class="form-group">
                        <label>RUT Paciente *</label>
                        <input type="text" id="appointment-patient-rut" required autocomplete="off" placeholder="Buscar RUT...">
                        <div id="appointment-patient-autocomplete" class="autocomplete-list"></div>
                    </div>
                    <div class="form-group">
                        <label>Nombre Paciente</label>
                        <input type="text" id="appointment-patient-name" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Profesional *</label>
                        <select id="appointment-professional" required></select>
                    </div>
                    <div class="form-group">
                        <label>Profesión</label>
                        <input type="text" id="appointment-profession" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" id="appointment-date" required>
                    </div>
                    <div class="form-group">
                        <label>Horario *</label>
                        <select id="appointment-time" required>
                            <option value="">Selecciona fecha y profesional</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('appointment-modal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cita</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // --- Paciente autocompletar ---
    const rutInput = modal.querySelector('#appointment-patient-rut');
    const nameInput = modal.querySelector('#appointment-patient-name');
    const autocompleteDiv = modal.querySelector('#appointment-patient-autocomplete');
    rutInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            autocompleteDiv.innerHTML = '';
            nameInput.value = '';
            return;
        }
        const results = await performQuickSearch(query);
        autocompleteDiv.innerHTML = results.map(
            p => `<div class="autocomplete-item" data-id="${p.id}" data-name="${p.nombre} ${p.apellido}">${p.rut} - ${p.nombre} ${p.apellido}</div>`
        ).join('');
        autocompleteDiv.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                rutInput.value = item.textContent.split(' - ')[0];
                nameInput.value = item.dataset.name;
                rutInput.dataset.patientId = item.dataset.id;
                autocompleteDiv.innerHTML = '';
            });
        });
    });

    // --- Profesionales ---
    const profSelect = modal.querySelector('#appointment-professional');
    const profNameInput = modal.querySelector('#appointment-profession');
    loadProfessionalsForModal().then(list => {
        profSelect.innerHTML = '<option value="">Seleccionar profesional...</option>' +
            list.map(p => `<option value="${p.id}" data-profession="${p.professionName}">${p.nombre} ${p.apellidos}</option>`).join('');
    });
    profSelect.addEventListener('change', function() {
        const selectedOption = profSelect.options[profSelect.selectedIndex];
        profNameInput.value = selectedOption?.dataset.profession || '';
        updateAvailableSlots();
    });

    // --- Fecha y horarios disponibles ---
    const dateInput = modal.querySelector('#appointment-date');
    dateInput.value = preselectedDate ? formatDateForInput(preselectedDate) : formatDateForInput(new Date());
    dateInput.addEventListener('change', updateAvailableSlots);

    const timeSelect = modal.querySelector('#appointment-time');
    async function updateAvailableSlots() {
        const profId = profSelect.value;
        const date = dateInput.value;
        if (!profId || !date) {
            timeSelect.innerHTML = '<option value="">Selecciona fecha y profesional</option>';
            return;
        }
        const slots = await getAvailableSlots(profId, date);
        if (!slots.length) {
            timeSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
            return;
        }
        timeSelect.innerHTML = slots.map(h => `<option value="${h}">${h}</option>`).join('');
    }

    // --- Guardar cita ---
    modal.querySelector('#appointment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = rutInput.dataset.patientId;
        const patientRut = rutInput.value.trim();
        const patientName = nameInput.value.trim();
        const profId = profSelect.value;
        const profName = profSelect.options[profSelect.selectedIndex]?.textContent || "";
        const profProfession = profNameInput.value;
        const date = dateInput.value;
        const time = timeSelect.value;

        if (!patientId || !profId || !date || !time) {
            showNotification('Completa todos los campos obligatorios', 'warning');
            return;
        }

        try {
            const db = getFirestore();
            await db.collection('citas').add({
                pacienteId: patientId,
                pacienteRut,
                pacienteNombre: patientName,
                profesionalId: profId,
                profesionalNombre: profName,
                profesion: profProfession,
                fecha: date,
                hora: time,
                estado: 'programada',
                fechaCreacion: window.firebase ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
            });
            showNotification('Cita creada correctamente', 'success');
            closeModal('appointment-modal');
        } catch (err) {
            showNotification('Error guardando la cita', 'error');
            console.error(err);
        }
    });
}

// --- Helpers ---
async function loadProfessionalsForModal() {
    const db = getFirestore();
    const snapshot = await db.collection('profesionales').where('activo', '==', true).get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        apellidos: doc.data().apellidos,
        professionName: doc.data().profession ? getProfessionDisplay(doc.data().profession) : ''
    }));
}
function getProfessionDisplay(code) {
    const map = { 'asistente_social': 'Asistente Social', 'medico': 'Médico', 'psicologo': 'Psicólogo', 'terapeuta': 'Terapeuta Ocupacional' };
    return map[code] || code;
}
function formatDateForInput(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Hacer visible la función globalmente si se usa inline en HTML
if (typeof window !== 'undefined') {
    window.openNewAppointmentModal = openNewAppointmentModal;
}


