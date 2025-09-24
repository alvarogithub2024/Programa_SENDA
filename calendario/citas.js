/**
 * GESTIÓN DE CITAS
 * Maneja la creación, edición y gestión de citas
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarModal, cerrarModal, mostrarCarga } from '../utilidades/modales.js';
import { formatearRUT, validarRUT, alternarBotonEnvio } from '../utilidades/formato.js';
import { generarSlots, obtenerSlotsOcupados } from './horarios.js';

let db;
let profesionalesLista = [];
let profesionalSeleccionado = null;

/**
 * Inicializa el gestor de citas
 */
function inicializarGestorCitas() {
    try {
        db = obtenerFirestore();
        console.log('✅ Gestor de citas inicializado');
    } catch (error) {
        console.error('❌ Error inicializando gestor de citas:', error);
        throw error;
    }
}

/**
 * Crea modal para nueva cita
 */
function crearModalNuevaCita() {
    const modalHTML = `
        <div class="modal-overlay temp-modal" id="nueva-cita-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('nueva-cita-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-calendar-plus"></i> Nueva Cita</h2>
                    
                    <form id="nueva-cita-form">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                            <div class="form-group">
                                <label class="form-label">Nombre del Paciente *</label>
                                <input type="text" class="form-input" id="nueva-cita-nombre" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">RUT *</label>
                                <input type="text" class="form-input" id="nueva-cita-rut" placeholder="12.345.678-9" required>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                            <div class="form-group">
                                <label class="form-label">Profesional *</label>
                                <select class="form-select" id="nueva-cita-professional" required>
                                    <option value="">Seleccionar profesional...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fecha *</label>
                                <input type="date" class="form-input" id="nueva-cita-date" required>
                            </div>
                        </div>
                        
                        <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
                            <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                                <i class="fas fa-clock"></i> Horarios Disponibles
                            </h4>
                            <div class="time-slots-grid" id="nueva-cita-time-slots-grid">
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 24px;">
                            <label class="form-label">Observaciones</label>
                            <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
                                      placeholder="Observaciones adicionales para la cita..."></textarea>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('nueva-cita-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-success" disabled>
                                <i class="fas fa-calendar-check"></i>
                                Crear Cita
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('nueva-cita-modal');
    
    cargarProfesionalesParaCita();
    configurarFormularioNuevaCita();
}

/**
 * Crea modal para nueva cita en fecha específica
 */
function crearModalNuevaCitaParaFecha(fechaIso) {
    crearModalNuevaCita();
    
    setTimeout(() => {
        const dateInput = document.getElementById('nueva-cita-date');
        if (dateInput) {
            const fecha = new Date(fechaIso);
            const hoy = new Date();
            
            if (fecha < hoy.setHours(0,0,0,0)) {
                fecha.setTime(hoy.getTime());
            }
            
            dateInput.value = fecha.toISOString().split('T')[0];
        }
    }, 100);
}

/**
 * Crea cita desde solicitud
 */
function mostrarModalAgendaDesdeSolicitud(solicitudId) {
    // Obtener datos de la solicitud
    let solicitud = null;
    if (window.solicitudesData) {
        solicitud = window.solicitudesData.find(s => s.id === solicitudId);
    }

    const modalHTML = crearModalCitaDesdeSolicitud(solicitud);
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('cita-solicitud-modal');
    
    cargarProfesionalesParaCita();
    configurarFormularioCitaSolicitud(solicitud);
}

/**
 * Crea el HTML del modal para cita desde solicitud
 */
function crearModalCitaDesdeSolicitud(solicitud) {
    if (!solicitud) {
        return crearModalNuevaCita();
    }

    return `
        <div class="modal-overlay temp-modal" id="cita-solicitud-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('cita-solicitud-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-calendar-plus"></i> Agendar Cita - Solicitud ${solicitud.id}</h2>
                    
                    <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">Datos del Solicitante</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                            <div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>
                            <div><strong>RUT:</strong> ${solicitud.rut}</div>
                            <div><strong>Edad:</strong> ${solicitud.edad} años</div>
                            <div><strong>Teléfono:</strong> ${solicitud.telefono || 'No disponible'}</div>
                            <div><strong>Email:</strong> ${solicitud.email || 'No disponible'}</div>
                            <div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>
                        </div>
                    </div>
                    
                    <form id="cita-solicitud-form">
                        <input type="hidden" id="solicitud-id" value="${solicitud.id}">
                        <input type="hidden" id="cita-nombre" value="${solicitud.nombre} ${solicitud.apellidos || ''}">
                        <input type="hidden" id="cita-rut" value="${solicitud.rut}">
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                            <div class="form-group">
                                <label class="form-label">Profesional *</label>
                                <select class="form-select" id="cita-professional" required>
                                    <option value="">Seleccionar profesional...</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fecha *</label>
                                <input type="date" class="form-input" id="cita-date" required>
                            </div>
                        </div>
                        
                        <div class="time-slots-container" id="cita-time-slots-container" style="display: none;">
                            <h4 style="margin-bottom: 16px; color: var(--primary-blue);">Horarios Disponibles</h4>
                            <div class="time-slots-grid" id="cita-time-slots-grid"></div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 24px;">
                            <label class="form-label">Observaciones</label>
                            <textarea class="form-textarea" id="cita-notes" rows="3">${solicitud.descripcion || solicitud.motivo || ''}</textarea>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('cita-solicitud-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-success" disabled>
                                <i class="fas fa-calendar-check"></i>
                                Agendar Cita
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

/**
 * Configura el formulario de nueva cita
 */
function configurarFormularioNuevaCita() {
    const form = document.getElementById('nueva-cita-form');
    const professionalSelect = document.getElementById('nueva-cita-professional');
    const dateInput = document.getElementById('nueva-cita-date');
    const rutInput = document.getElementById('nueva-cita-rut');
    
    // Configurar fecha mínima
    if (dateInput) {
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        if (!dateInput.value) {
            dateInput.value = today.toISOString().split('T')[0];
        }
    }

    // Formatear RUT automáticamente
    if (rutInput) {
        rutInput.addEventListener('input', (e) => {
            e.target.value = formatearRUT(e.target.value);
        });
    }

    // Event listeners para cargar slots
    if (professionalSelect && dateInput) {
        professionalSelect.addEventListener('change', cargarSlotsHorarios);
        dateInput.addEventListener('change', cargarSlotsHorarios);
    }

    // Envío del formulario
    if (form) {
        form.addEventListener('submit', manejarCreacionCita);
    }
}

/**
 * Configura el formulario de cita desde solicitud
 */
function configurarFormularioCitaSolicitud(solicitud) {
    const form = document.getElementById('cita-solicitud-form');
    const professionalSelect = document.getElementById('cita-professional');
    const dateInput = document.getElementById('cita-date');
    
    // Configurar fecha mínima
    if (dateInput) {
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = today.toISOString().split('T')[0];
    }

    // Event listeners
    if (professionalSelect && dateInput) {
        professionalSelect.addEventListener('change', () => cargarSlotsHorarios('cita'));
        dateInput.addEventListener('change', () => cargarSlotsHorarios('cita'));
    }

    if (form) {
        form.addEventListener('submit', manejarCreacionCitaSolicitud);
    }
}

/**
 * Carga profesionales disponibles para citas
 */
async function cargarProfesionalesParaCita() {
    try {
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return;

        if (profesionalesLista.length === 0) {
            const snapshot = await db.collection('profesionales')
                .where('cesfam', '==', userData.cesfam)
                .where('activo', '==', true)
                .get();
            
            profesionalesLista = [];
            snapshot.forEach(doc => {
                profesionalesLista.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }

        // Llenar selects
        const selects = ['nueva-cita-professional', 'cita-professional'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Seleccionar profesional...</option>';
                profesionalesLista.forEach(prof => {
                    const option = document.createElement('option');
                    option.value = prof.id;
                    option.textContent = `${prof.nombre} ${prof.apellidos} - ${obtenerNombreProfesion(prof.profession)}`;
                    option.dataset.profession = prof.profession;
                    option.dataset.nombre = `${prof.nombre} ${prof.apellidos}`;
                    select.appendChild(option);
                });
            }
        });

    } catch (error) {
        console.error('Error cargando profesionales:', error);
    }
}

/**
 * Carga los slots de horarios disponibles
 */
async function cargarSlotsHorarios(prefijo = 'nueva-cita') {
    try {
        const professionalSelect = document.getElementById(`${prefijo}-professional`);
        const dateInput = document.getElementById(`${prefijo}-date`);
        const timeSlotsContainer = document.getElementById(`${prefijo}-time-slots-container`);
        const timeSlotsGrid = document.getElementById(`${prefijo}-time-slots-grid`);
        const submitBtn = document.querySelector(`#${prefijo}-form button[type="submit"]`);
        
        if (!professionalSelect?.value || !dateInput?.value) {
            if (timeSlotsContainer) timeSlotsContainer.style.display = 'none';
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        const fechaSeleccionada = new Date(dateInput.value + 'T00:00:00');
        const slotsDisponibles = generarSlots(fechaSeleccionada);
        const slotsOcupados = await obtenerSlotsOcupados(professionalSelect.value, fechaSeleccionada);
        
        if (timeSlotsGrid) {
            timeSlotsGrid.innerHTML = slotsDisponibles.map(slot => {
                const ocupado = slotsOcupados.includes(slot.time);
                const esPasado = esPasadoSlot(fechaSeleccionada, slot.hour, slot.minute);
                const deshabilitado = ocupado || esPasado;
                
                return `
                    <button type="button" 
                            class="time-slot ${deshabilitado ? 'disabled' : ''}" 
                            data-time="${slot.time}"
                            ${deshabilitado ? 'disabled' : ''}
                            onclick="seleccionarSlotTiempo(this, '${prefijo}')"
                            style="
                                padding: 12px;
                                border: 2px solid ${deshabilitado ? 'var(--gray-300)' : 'var(--primary-blue)'};
                                border-radius: 8px;
                                background: ${deshabilitado ? 'var(--gray-100)' : 'white'};
                                color: ${deshabilitado ? 'var(--gray-400)' : 'var(--primary-blue)'};
                                cursor: ${deshabilitado ? 'not-allowed' : 'pointer'};
                                transition: all 0.2s ease;
                                font-weight: 500;
                            ">
                        <i class="fas fa-clock" style="margin-right: 4px;"></i>
                        ${slot.time}
                        ${ocupado ? '<br><small>Ocupado</small>' : ''}
                        ${esPasado ? '<br><small>Pasado</small>' : ''}
                    </button>
                `;
            }).join('');
        }
        
        if (timeSlotsContainer) timeSlotsContainer.style.display = 'block';
        if (submitBtn) submitBtn.disabled = true;
        
    } catch (error) {
        console.error('Error cargando slots de horarios:', error);
    }
}

/**
 * Verifica si un slot de tiempo ya pasó
 */
function esPasadoSlot(fecha, hora, minuto) {
    const now = new Date();
    const slotTime = new Date(fecha);
    slotTime.setHours(hora, minuto, 0, 0);

    const bufferTime = new Date(now);
    bufferTime.setMinutes(bufferTime.getMinutes() + 30);

    return slotTime <= bufferTime;
}

/**
 * Selecciona un slot de tiempo
 */
function seleccionarSlotTiempo(button, prefijo) {
    // Limpiar selección anterior
    document.querySelectorAll(`#${prefijo}-time-slots-grid .time-slot.selected`).forEach(slot => {
        slot.classList.remove('selected');
        slot.style.background = 'white';
        slot.style.color = 'var(--primary-blue)';
    });
    
    // Seleccionar nuevo slot
    button.classList.add('selected');
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
    
    // Habilitar botón submit
    const submitBtn = document.querySelector(`#${prefijo}-form button[type="submit"]`);
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

/**
 * Maneja la creación de nueva cita
 */
async function manejarCreacionCita(e) {
    e.preventDefault();
    
    try {
        const formData = {
            nombre: document.getElementById('nueva-cita-nombre')?.value?.trim(),
            rut: document.getElementById('nueva-cita-rut')?.value?.trim(),
            professionalId: document.getElementById('nueva-cita-professional')?.value,
            fecha: document.getElementById('nueva-cita-date')?.value,
            hora: document.querySelector('#nueva-cita-time-slots-grid .time-slot.selected')?.dataset.time,
            observaciones: document.getElementById('nueva-cita-notes')?.value?.trim() || ''
        };
        
        if (!validarDatosCita(formData)) return;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);
        
        await crearCita(formData, null);
        
        cerrarModal('nueva-cita-modal');
        mostrarExito('Cita creada exitosamente');
        
        // Recargar calendario
        import('./calendario.js')
            .then(modulo => modulo.renderizarCalendario())
            .catch(error => console.error('Error recargando calendario:', error));
        
    } catch (error) {
        console.error('Error creando cita:', error);
        mostrarNotificacion('Error al crear cita: ' + error.message, 'error');
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Maneja la creación de cita desde solicitud
 */
async function manejarCreacionCitaSolicitud(e) {
    e.preventDefault();
    
    try {
        const solicitudId = document.getElementById('solicitud-id')?.value;
        const formData = {
            nombre: document.getElementById('cita-nombre')?.value?.trim(),
            rut: document.getElementById('cita-rut')?.value?.trim(),
            professionalId: document.getElementById('cita-professional')?.value,
            fecha: document.getElementById('cita-date')?.value,
            hora: document.querySelector('#cita-time-slots-grid .time-slot.selected')?.dataset.time,
            observaciones: document.getElementById('cita-notes')?.value?.trim() || ''
        };
        
        if (!validarDatosCita(formData)) return;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);
        
        await crearCita(formData, solicitudId);
        
        cerrarModal('cita-solicitud-modal');
        mostrarExito('Cita agendada exitosamente desde solicitud');
        
        // Disparar evento para actualizar solicitudes
        const evento = new CustomEvent('citaCreada', {
            detail: { solicitudId }
        });
        document.dispatchEvent(evento);
        
    } catch (error) {
        console.error('Error creando cita desde solicitud:', error);
        mostrarNotificacion('Error al crear cita: ' + error.message, 'error');
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Valida los datos de la cita
 */
function validarDatosCita(formData) {
    if (!formData.nombre || !formData.rut || !formData.professionalId || !formData.fecha || !formData.hora) {
        mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
        return false;
    }
    
    if (!validarRUT(formData.rut)) {
        mostrarNotificacion('RUT inválido', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Crea la cita en Firestore
 */
async function crearCita(formData, solicitudId) {
    const userData = obtenerDatosUsuarioActual();
    const currentUser = obtenerUsuarioActual();
    
    const professionalSelect = document.getElementById(solicitudId ? 'cita-professional' : 'nueva-cita-professional');
    const selectedOption = professionalSelect.options[professionalSelect.selectedIndex];
    const profesionalNombre = selectedOption.dataset.nombre;
    const tipoProfesional = selectedOption.dataset.profession;
    
    const fechaCompleta = new Date(`${formData.fecha}T${formData.hora}:00`);
    
    const citaData = {
        profesionalId: formData.professionalId,
        profesionalNombre: profesionalNombre,
        tipoProfesional: tipoProfesional,
        pacienteNombre: formData.nombre,
        pacienteRut: formatearRUT(formData.rut),
        fecha: fechaCompleta,
        estado: 'programada',
        tipo: solicitudId ? 'cita_desde_solicitud' : 'cita_directa',
        cesfam: userData.cesfam,
        observaciones: formData.observaciones,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: currentUser.uid
    };
    
    if (solicitudId) {
        citaData.solicitudId = solicitudId;
        citaData.origenSolicitud = true;
    }
    
    const citaRef = await db.collection('citas').add(citaData);
    
    // Registrar paciente automáticamente si no existe
    await registrarPacienteAutomatico(formData, citaRef.id);
    
    // Actualizar estado de solicitud si aplica
    if (solicitudId) {
        await actualizarEstadoSolicitud(solicitudId, citaRef.id);
    }
    
    return citaRef.id;
}

/**
 * Registra paciente automáticamente
 */
async function registrarPacienteAutomatico(citaData, citaId) {
    try {
        const userData = obtenerDatosUsuarioActual();
        const rutFormateado = formatearRUT(citaData.rut);
        
        const existingPatient = await db.collection('pacientes')
            .where('rut', '==', rutFormateado)
            .where('cesfam', '==', userData.cesfam)
            .get();
        
        if (!existingPatient.empty) {
            console.log('Paciente ya existe');
            return;
        }
        
        const pacienteData = {
            nombre: citaData.nombre,
            apellidos: '',
            rut: rutFormateado,
            cesfam: userData.cesfam,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'activo',
            citaInicialId: citaId,
            origen: 'cita_directa',
            prioridad: 'media'
        };

        await db.collection('pacientes').add(pacienteData);
        console.log('✅ Paciente registrado automáticamente');
        
    } catch (error) {
        console.error('Error registrando paciente automáticamente:', error);
    }
}

/**
 * Actualiza el estado de la solicitud
 */
async function actualizarEstadoSolicitud(solicitudId, citaId) {
    try {
        // Determinar colección basándose en el tipo
        let coleccion = 'solicitudes_ingreso';
        
        if (window.solicitudesData) {
            const solicitud = window.solicitudesData.find(s => s.id === solicitudId);
            if (solicitud) {
                if (solicitud.tipo === 'reingreso') {
                    coleccion = 'reingresos';
                } else if (solicitud.tipo === 'informacion') {
                    coleccion = 'solicitudes_informacion';
                }
            }
        }
        
        await db.collection(coleccion).doc(solicitudId).update({
            estado: 'agendada',
            citaId: citaId,
            fechaAgenda: firebase.firestore.FieldValue.serverTimestamp(),
            agendadaPor: obtenerUsuarioActual().uid
        });
        
        console.log(`✅ Estado de solicitud ${solicitudId} actualizado a 'agendada'`);
        
    } catch (error) {
        console.error('Error actualizando estado de solicitud:', error);
    }
}

/**
 * Obtiene el nombre de la profesión
 */
function obtenerNombreProfesion(profession) {
    const nombres = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional',
        'coordinador': 'Coordinador Regional',
        'admin': 'Administrador'
    };
    return nombres[profession] || profession;
}

// Funciones globales
window.crearModalNuevaCita = crearModalNuevaCita;
window.crearModalNuevaCitaParaFecha = crearModalNuevaCitaParaFecha;
window.mostrarModalAgendaDesdeSolicitud = mostrarModalAgendaDesdeSolicitud;
window.seleccionarSlotTiempo = seleccionarSlotTiempo;

export {
    inicializarGestorCitas,
    crearModalNuevaCita,
    crearModalNuevaCitaParaFecha,
    mostrarModalAgendaDesdeSolicitud
};
