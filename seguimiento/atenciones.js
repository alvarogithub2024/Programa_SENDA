/**
 * REGISTRO DE ATENCIONES
 * Maneja el registro y seguimiento de atenciones a pacientes
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarModal, cerrarModal, mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha, alternarBotonEnvio } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el sistema de atenciones
 */
function inicializarAtenciones() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de atenciones inicializado');
    } catch (error) {
        console.error('❌ Error inicializando atenciones:', error);
    }
}

/**
 * Muestra modal para registrar nueva atención
 */
function mostrarModalAtencion(rutPaciente, nombrePaciente) {
    const modalHTML = `
        <div class="modal-overlay temp-modal" id="atencion-modal">
            <div class="modal">
                <button class="modal-close" onclick="cerrarModal('atencion-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-user-md"></i> Registrar Atención</h2>
                    
                    <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">Paciente</h4>
                        <div style="font-size: 14px;">
                            <strong>Nombre:</strong> ${nombrePaciente}<br>
                            <strong>RUT:</strong> ${rutPaciente}
                        </div>
                    </div>
                    
                    <form id="atencion-form">
                        <input type="hidden" id="atencion-rut" value="${rutPaciente}">
                        <input type="hidden" id="atencion-nombre" value="${nombrePaciente}">
                        
                        <div class="form-group">
                            <label class="form-label">Tipo de atención *</label>
                            <select class="form-select" id="tipo-atencion" required>
                                <option value="">Seleccionar tipo...</option>
                                <option value="primera-vez">Primera vez</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="control">Control</option>
                                <option value="urgencia">Atención de urgencia</option>
                                <option value="grupal">Terapia grupal</option>
                                <option value="familiar">Terapia familiar</option>
                                <option value="psicoeducacion">Psicoeducación</option>
                                <option value="otra">Otra</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="otro-tipo-container" style="display: none;">
                            <label class="form-label">Especificar tipo de atención</label>
                            <input type="text" class="form-input" id="otro-tipo" placeholder="Describa el tipo de atención">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Duración (minutos) *</label>
                                <input type="number" class="form-input" id="duracion-atencion" required min="15" max="240" value="60">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Estado del paciente</label>
                                <select class="form-select" id="estado-paciente">
                                    <option value="">Seleccionar...</option>
                                    <option value="estable">Estable</option>
                                    <option value="mejoria">En mejoría</option>
                                    <option value="igual">Sin cambios</option>
                                    <option value="empeoramiento">Empeoramiento</option>
                                    <option value="crisis">En crisis</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Detalle de la atención *</label>
                            <textarea class="form-textarea" id="detalle-atencion" rows="6" required
                                      placeholder="Describa el desarrollo de la sesión, temas abordados, intervenciones realizadas, respuesta del paciente, etc."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Objetivos trabajados</label>
                            <textarea class="form-textarea" id="objetivos-trabajados" rows="3"
                                      placeholder="Objetivos terapéuticos abordados en esta sesión"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tareas/recomendaciones para el paciente</label>
                            <textarea class="form-textarea" id="tareas-recomendaciones" rows="3"
                                      placeholder="Tareas o recomendaciones para realizar antes de la próxima sesión"></textarea>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Adherencia al tratamiento</label>
                                <select class="form-select" id="adherencia-tratamiento">
                                    <option value="">Seleccionar...</option>
                                    <option value="excelente">Excelente</option>
                                    <option value="buena">Buena</option>
                                    <option value="regular">Regular</option>
                                    <option value="deficiente">Deficiente</option>
                                    <option value="nula">Nula</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Próxima cita sugerida</label>
                                <input type="date" class="form-input" id="proxima-cita-sugerida">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Observaciones adicionales</label>
                            <textarea class="form-textarea" id="observaciones-atencion" rows="2"
                                      placeholder="Observaciones importantes, alertas, seguimientos especiales..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="requiere-seguimiento"> 
                                Requiere seguimiento especial
                            </label>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('atencion-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="guardarBorradorAtencion()">
                                <i class="fas fa-save"></i>
                                Guardar Borrador
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-check"></i>
                                Registrar Atención
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('atencion-modal');

    // Configurar formulario
    configurarFormularioAtencion();
}

/**
 * Configura el formulario de atención
 */
function configurarFormularioAtencion() {
    const form = document.getElementById('atencion-form');
    const tipoAtencion = document.getElementById('tipo-atencion');
    const otroTipoContainer = document.getElementById('otro-tipo-container');

    // Mostrar/ocultar campo "otro tipo"
    tipoAtencion.addEventListener('change', () => {
        if (tipoAtencion.value === 'otra') {
            otroTipoContainer.style.display = 'block';
            document.getElementById('otro-tipo').required = true;
        } else {
            otroTipoContainer.style.display = 'none';
            document.getElementById('otro-tipo').required = false;
        }
    });

    // Configurar fecha mínima para próxima cita
    const proximaCita = document.getElementById('proxima-cita-sugerida');
    if (proximaCita) {
        const hoy = new Date().toISOString().split('T')[0];
        proximaCita.min = hoy;
    }

    form.addEventListener('submit', manejarEnvioAtencion);
}

/**
 * Maneja el envío del formulario de atención
 */
async function manejarEnvioAtencion(e) {
    e.preventDefault();
    
    try {
        const datosAtencion = recopilarDatosAtencion();
        
        if (!validarDatosAtencion(datosAtencion)) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);
        mostrarCarga(true, 'Registrando atención...');
        
        const userData = obtenerDatosUsuarioActual();
        const currentUser = obtenerUsuarioActual();
        
        const atencionCompleta = {
            ...datosAtencion,
            profesionalId: currentUser.uid,
            profesional: `${userData.nombre} ${userData.apellidos}`,
            profesionalProfession: userData.profession,
            cesfam: userData.cesfam,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const atencionRef = await db.collection('atenciones').add(atencionCompleta);
        
        // Actualizar información del paciente si es necesario
        await actualizarEstadoPaciente(datosAtencion);
        
        cerrarModal('atencion-modal');
        mostrarExito('Atención registrada correctamente');
        
        // Disparar evento
        const evento = new CustomEvent('atencionRegistrada', {
            detail: { atencionId: atencionRef.id, rutPaciente: datosAtencion.pacienteRut }
        });
        document.dispatchEvent(evento);
        
    } catch (error) {
        console.error('Error registrando atención:', error);
        mostrarNotificacion('Error al registrar atención: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Recopila los datos del formulario de atención
 */
function recopilarDatosAtencion() {
    const tipoAtencion = document.getElementById('tipo-atencion').value;
    const otroTipo = document.getElementById('otro-tipo').value;
    
    return {
        pacienteRut: document.getElementById('atencion-rut').value,
        pacienteNombre: document.getElementById('atencion-nombre').value,
        tipoAtencion: tipoAtencion === 'otra' ? otroTipo : tipoAtencion,
        duracion: parseInt(document.getElementById('duracion-atencion').value),
        estadoPaciente: document.getElementById('estado-paciente').value,
        detalle: document.getElementById('detalle-atencion').value.trim(),
        objetivosTrabajados: document.getElementById('objetivos-trabajados').value.trim(),
        tareasRecomendaciones: document.getElementById('tareas-recomendaciones').value.trim(),
        adherenciaTratamiento: document.getElementById('adherencia-tratamiento').value,
        proximaCitaSugerida: document.getElementById('proxima-cita-sugerida').value,
        observaciones: document.getElementById('observaciones-atencion').value.trim(),
        requiereSeguimiento: document.getElementById('requiere-seguimiento').checked
    };
}

/**
 * Valida los datos de la atención
 */
function validarDatosAtencion(datos) {
    if (!datos.tipoAtencion) {
        mostrarNotificacion('El tipo de atención es obligatorio', 'warning');
        return false;
    }
    
    if (!datos.detalle) {
        mostrarNotificacion('El detalle de la atención es obligatorio', 'warning');
        return false;
    }
    
    if (!datos.duracion || datos.duracion < 15) {
        mostrarNotificacion('La duración debe ser de al menos 15 minutos', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Actualiza el estado del paciente basado en la atención
 */
async function actualizarEstadoPaciente(datosAtencion) {
    try {
        const userData = obtenerDatosUsuarioActual();
        
        const pacienteSnapshot = await db.collection('pacientes')
            .where('rut', '==', datosAtencion.pacienteRut)
            .where('cesfam', '==', userData.cesfam)
            .get();
        
        if (!pacienteSnapshot.empty) {
            const pacienteDoc = pacienteSnapshot.docs[0];
            const actualizacion = {
                fechaUltimaAtencion: firebase.firestore.FieldValue.serverTimestamp(),
                totalAtenciones: firebase.firestore.FieldValue.increment(1)
            };
            
            // Actualizar estado si hay cambios relevantes
            if (datosAtencion.estadoPaciente) {
                actualizacion.estadoUltimaAtencion = datosAtencion.estadoPaciente;
            }
            
            if (datosAtencion.requiereSeguimiento) {
                actualizacion.requiereSeguimiento = true;
                actualizacion.fechaSeguimiento = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            await pacienteDoc.ref.update(actualizacion);
        }
        
    } catch (error) {
        console.error('Error actualizando estado del paciente:', error);
        // No lanzar error para no bloquear el registro de la atención
    }
}

/**
 * Guarda un borrador de la atención
 */
async function guardarBorradorAtencion() {
    try {
        const rutPaciente = document.getElementById('atencion-rut').value;
        const datosAtencion = recopilarDatosAtencion();
        
        const borradorData = {
            rutPaciente,
            datosAtencion,
            fechaGuardado: firebase.firestore.FieldValue.serverTimestamp(),
            guardadoPor: obtenerUsuarioActual().uid
        };
        
        await db.collection('borradores_atenciones').doc(rutPaciente).set(borradorData);
        mostrarNotificacion('Borrador guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarNotificacion('Error al guardar borrador', 'error');
    }
}

/**
 * Carga las atenciones de un paciente
 */
async function cargarAtencionesPaciente(rutPaciente, limite = 20) {
    try {
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return [];
        
        const atencionesSnapshot = await db.collection('atenciones')
            .where('pacienteRut', '==', rutPaciente)
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fecha', 'desc')
            .limit(limite)
            .get();
        
        const atenciones = [];
        atencionesSnapshot.forEach(doc => {
            atenciones.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return atenciones;
        
    } catch (error) {
        console.error('Error cargando atenciones:', error);
        return [];
    }
}

/**
 * Genera reporte de atenciones
 */
async function generarReporteAtenciones(filtros = {}) {
    try {
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return;
        
        let query = db.collection('atenciones').where('cesfam', '==', userData.cesfam);
        
        // Aplicar filtros
        if (filtros.profesionalId) {
            query = query.where('profesionalId', '==', filtros.profesionalId);
        }
        
        if (filtros.fechaInicio && filtros.fechaFin) {
            query = query
                .where('fecha', '>=', new Date(filtros.fechaInicio))
                .where('fecha', '<=', new Date(filtros.fechaFin));
        }
        
        query = query.orderBy('fecha', 'desc').limit(1000);
        
        const snapshot = await query.get();
        
        const atenciones = [];
        snapshot.forEach(doc => {
            atenciones.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return generarEstadisticasAtenciones(atenciones);
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        return null;
    }
}

/**
 * Genera estadísticas de atenciones
 */
function generarEstadisticasAtenciones(atenciones) {
    const stats = {
        total: atenciones.length,
        porTipo: {},
        porEstado: {},
        porAdherencia: {},
        duracionPromedio: 0,
        seguimientosRequeridos: 0
    };
    
    let sumaDuracion = 0;
    
    atenciones.forEach(atencion => {
        // Por tipo
        const tipo = atencion.tipoAtencion || 'No especificado';
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
        
        // Por estado
        const estado = atencion.estadoPaciente || 'No especificado';
        stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
        
        // Por adherencia
        const adherencia = atencion.adherenciaTratamiento || 'No especificada';
        stats.porAdherencia[adherencia] = (stats.porAdherencia[adherencia] || 0) + 1;
        
        // Duración
        if (atencion.duracion) {
            sumaDuracion += atencion.duracion;
        }
        
        // Seguimientos
        if (atencion.requiereSeguimiento) {
            stats.seguimientosRequeridos++;
        }
    });
    
    stats.duracionPromedio = atenciones.length > 0 ? Math.round(sumaDuracion / atenciones.length) : 0;
    
    return stats;
}

// Funciones globales
window.mostrarModalAtencion = mostrarModalAtencion;
window.guardarBorradorAtencion = guardarBorradorAtencion;

export {
    inicializarAtenciones,
    mostrarModalAtencion,
    cargarAtencionesPaciente,
    generarReporteAtenciones,
    guardarBorradorAtencion
};
