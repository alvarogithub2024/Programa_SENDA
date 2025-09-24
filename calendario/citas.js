/**
 * CALENDARIO/CITAS.JS - VERSIÓN CORREGIDA
 */

import { getFirestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { loadAppointments } from './agenda.js';

// Formulario de citas
export function setupAppointmentForm() {
    try {
        const form = document.getElementById('appointment-form');
        if (form) {
            form.addEventListener('submit', handleAppointmentSubmit);
            console.log('📋 Formulario de citas configurado');
        }

        // Configurar campos dinámicos
        setupProfessionalSelect();
        setupTimeSlots();
        
    } catch (error) {
        console.error('Error configurando formulario de citas:', error);
    }
}

// Manejar envío del formulario
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const appointmentData = {
            paciente: formData.get('patient-name') || formData.get('paciente'),
            rut: formData.get('patient-rut') || '',
            telefono: formData.get('patient-phone') || '',
            email: formData.get('patient-email') || '',
            fecha: formData.get('appointment-date') || formData.get('fecha'),
            hora: formData.get('appointment-time') || formData.get('hora'),
            profesional: formData.get('professional') || 'Profesional SENDA',
            tipo: formData.get('appointment-type') || formData.get('tipo') || 'consulta',
            notas: formData.get('appointment-notes') || '',
            estado: 'programada',
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
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

        await saveAppointment(appointmentData);
        e.target.reset();
        showNotification('Cita programada exitosamente', 'success');
        
        // Cerrar modal si existe
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error al programar cita:', error);
        showNotification('Error al programar la cita', 'error');
    }
}

// Verificar disponibilidad de horario
export async function checkTimeSlotAvailability(fecha, hora, profesional) {
    try {
        const db = getFirestore();
        if (!db) return false;
        
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
export async function loadProfessionals() {
    try {
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no disponible');
            return;
        }
        
        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();
        
        const select = document.getElementById('professional') || document.getElementById('professional-select');
        if (!select) {
            console.warn('Selector de profesionales no encontrado');
            return;
        }

        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar profesional</option>';

        if (snapshot.empty) {
            // Agregar opciones por defecto si no hay profesionales en Firebase
            const defaultProfessionals = [
                { nombre: 'Dr. García', especialidad: 'Médico' },
                { nombre: 'Dra. López', especialidad: 'Psicólogo' },
                { nombre: 'Sra. Martínez', especialidad: 'Asistente Social' }
            ];
            
            defaultProfessionals.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.nombre;
                option.textContent = `${prof.nombre} - ${prof.especialidad}`;
                select.appendChild(option);
            });
            
            console.log('📋 Profesionales por defecto cargados');
        } else {
            snapshot.forEach(doc => {
                const prof = doc.data();
                const option = document.createElement('option');
                option.value = prof.nombre;
                option.textContent = `${prof.nombre} - ${prof.especialidad || 'Sin especialidad'}`;
                select.appendChild(option);
            });
            
            console.log(`📋 ${snapshot.size} profesionales cargados desde Firebase`);
        }

    } catch (error) {
        console.error('Error cargando profesionales:', error);
        
        // Fallback: crear opciones básicas
        const select = document.getElementById('professional') || document.getElementById('professional-select');
        if (select) {
            select.innerHTML = `
                <option value="">Seleccionar profesional</option>
                <option value="Dr. García">Dr. García - Médico</option>
                <option value="Dra. López">Dra. López - Psicólogo</option>
                <option value="Sra. Martínez">Sra. Martínez - Asistente Social</option>
            `;
        }
    }
}

// Configurar horarios disponibles
export function setupTimeSlots() {
    try {
        const timeSelect = document.getElementById('appointment-time');
        if (!timeSelect) {
            console.warn('Selector de horarios no encontrado');
            return;
        }

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
        
        console.log('⏰ Horarios configurados (8:00 - 18:00)');
        
    } catch (error) {
        console.error('Error configurando horarios:', error);
    }
}

// Guardar cita
async function saveAppointment(appointmentData) {
    try {
        const db = getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        
        const citasRef = db.collection('citas');
        await citasRef.add({
            ...appointmentData,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Recargar calendario si la función existe
        if (typeof loadAppointments === 'function') {
            await loadAppointments();
        }
        
        console.log('✅ Cita guardada exitosamente');
        
    } catch (error) {
        console.error('Error guardando cita:', error);
        throw error;
    }
}

// Obtener citas por profesional
export async function getAppointmentsByProfessional(professionalName) {
    try {
        const db = getFirestore();
        if (!db) return [];
        
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('profesional', '==', professionalName)
            .orderBy('fecha')
            .orderBy('hora');

        const snapshot = await query.get();
        const appointments = [];
        
        snapshot.forEach(doc => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return appointments;

    } catch (error) {
        console.error('Error obteniendo citas por profesional:', error);
        return [];
    }
}

// Obtener citas por fecha
export async function getAppointmentsByDate(date) {
    try {
        const db = getFirestore();
        if (!db) return [];
        
        const citasRef = db.collection('citas');
        const query = citasRef
            .where('fecha', '==', date)
            .orderBy('hora');

        const snapshot = await query.get();
        const appointments = [];
        
        snapshot.forEach(doc => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return appointments;

    } catch (error) {
        console.error('Error obteniendo citas por fecha:', error);
        return [];
    }
}

// Cancelar cita
export async function cancelAppointment(appointmentId, reason = '') {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Base de datos no disponible');
        
        const citaRef = db.collection('citas').doc(appointmentId);
        await citaRef.update({
            estado: 'cancelada',
            razonCancelacion: reason,
            fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp(),
            ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Cita cancelada exitosamente', 'success');
        
        // Recargar calendario
        if (typeof loadAppointments === 'function') {
            await loadAppointments();
        }

    } catch (error) {
        console.error('Error cancelando cita:', error);
        showNotification('Error al cancelar la cita', 'error');
    }
}

// Actualizar estado de cita
export async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Base de datos no disponible');
        
        const citaRef = db.collection('citas').doc(appointmentId);
        await citaRef.update({
            estado: newStatus,
            ultimaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification(`Estado de cita actualizado a ${newStatus}`, 'success');
        
        // Recargar calendario
        if (typeof loadAppointments === 'function') {
            await loadAppointments();
        }

    } catch (error) {
        console.error('Error actualizando estado de cita:', error);
        showNotification('Error al actualizar estado de cita', 'error');
    }
}

// Exportar funciones principales
export { 
    handleAppointmentSubmit
};
