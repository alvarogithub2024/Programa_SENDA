import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { loadAppointments } from './agenda.js';

// Formulario de citas
export function setupAppointmentForm() {
    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', handleAppointmentSubmit);
    }

    // Configurar campos dinámicos
    setupProfessionalSelect();
    setupTimeSlots();
    
    console.log('📋 Formulario de citas configurado');
}

// Manejar envío del formulario
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const appointmentData = {
        paciente: formData.get('patient-name'),
        rut: formData.get('patient-rut'),
        telefono: formData.get('patient-phone'),
        email: formData.get('patient-email'),
        fecha: formData.get('appointment-date'),
        hora: formData.get('appointment-time'),
        profesional: formData.get('professional'),
        tipo: formData.get('appointment-type'),
        notas: formData.get('appointment-notes'),
        estado: 'programada'
    };

    // Validar campos requeridos
    if (!appointmentData.paciente || !appointmentData.fecha || 
        !appointmentData.hora || !appointmentData.profesional) {
        showNotification('Todos los campos marcados son requeridos', 'error');
        return;
    }

    // Validar disponibilidad
    const isAvailable = await checkTimeSlotAvailability(
        appointmentData.fecha, 
        appointmentData.hora, 
        appointmentData.profesional
    );

    if (!isAvailable) {
        showNotification('El horario seleccionado no está disponible', 'error');
        return;
    }

    try {
        await saveAppointment(appointmentData);
        e.target.reset();
        showNotification('Cita programada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al programar cita:', error);
        showNotification('Error al programar la cita', 'error');
    }
}

// Verificar disponibilidad de horario
async function checkTimeSlotAvailability(fecha, hora, profesional) {
    try {
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('fecha', '==', fecha)
            .where('hora', '==', hora)
            .where('profesional', '==', profesional)
            .where('estado', 'in', ['programada', 'confirmada']);

        const snapshot = await query.get();
        return snapshot.empty; // Disponible si no hay citas

    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        return false;
    }
}

// Configurar selector de profesionales
function setupProfessionalSelect() {
    loadProfessionals();
}

// Cargar profesionales
async function loadProfessionals() {
    try {
        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();
        
        const select = document.getElementById('professional');
        if (!select) return;

        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar profesional</option>';

        snapshot.forEach(doc => {
            const prof = doc.data();
            const option = document.createElement('option');
            option.value = prof.nombre;
            option.textContent = `${prof.nombre} - ${prof.especialidad}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando profesionales:', error);
    }
}

// Configurar horarios disponibles
function setupTimeSlots() {
    const timeSelect = document.getElementById('appointment-time');
    if (!timeSelect) return;

    // Generar horarios de 8:00 a 18:00 cada 30 minutos
    const startHour = 8;
    const endHour = 18;
    
    timeSelect.innerHTML = '<option value="">Seleccionar horario</option>';

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minutes of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        }
    }
}

// Guardar cita
async function saveAppointment(appointmentData) {
    const citasRef = db.collection('citas');
    await citasRef.add({
        ...appointmentData,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Recargar calendario
    await loadAppointments();
}

// Exportar funciones
export { 
    handleAppointmentSubmit, 
    checkTimeSlotAvailability,
    loadProfessionals 
};
