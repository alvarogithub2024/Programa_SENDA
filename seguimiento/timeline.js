/**
 * TIMELINE DE SEGUIMIENTO
 * Maneja la visualización del timeline de pacientes y citas próximas
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearSoloFecha, formatearSoloHora } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el sistema de seguimiento
 */
function inicializarSeguimiento() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de seguimiento inicializado');
    } catch (error) {
        console.error('❌ Error inicializando seguimiento:', error);
        throw error;
    }
}

/**
 * Carga el seguimiento completo
 */
async function cargarSeguimiento() {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;
    
    try {
        mostrarCarga(true, 'Cargando seguimiento...');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);
        
        // Cargar citas de hoy para el timeline
        const citasHoySnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', hoy)
            .where('fecha', '<', mañana)
            .orderBy('fecha', 'asc')
            .get();
        
        renderizarTimelinePacientes(citasHoySnapshot);
        
        // Cargar próximas citas
        const proximasCitasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', mañana)
            .orderBy('fecha', 'asc')
            .limit(10)
            .get();
        
        renderizarProximasCitas(proximasCitasSnapshot);
        
    } catch (error) {
        console.error('Error cargando seguimiento:', error);
        mostrarNotificacion('Error al cargar seguimiento: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Renderiza el timeline de pacientes de hoy
 */
function renderizarTimelinePacientes(citasSnapshot) {
    try {
        const timeline = document.getElementById('patients-timeline');
        if (!timeline) return;
        
        if (citasSnapshot.empty) {
            timeline.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-calendar-day"></i>
                    <h3>No hay pacientes agendados para hoy</h3>
                    <p>No se encontraron citas programadas para hoy</p>
                </div>
            `;
            return;
        }
        
        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        timeline.innerHTML = citas.map(cita => crearElementoTimeline(cita)).join('');
        
    } catch (error) {
        console.error('Error renderizando timeline de pacientes:', error);
    }
}

/**
 * Crea un elemento del timeline
 */
function crearElementoTimeline(cita) {
    const fecha = cita.fecha.toDate();
    const hora = formatearSoloHora(fecha);
    const estado = cita.estado || 'programada';
    
    const iconosEstado = {
        'programada': 'fa-clock',
        'confirmada': 'fa-check',
        'en_curso': 'fa-play',
        'completada': 'fa-check-circle',
        'cancelada': 'fa-times-circle'
    };

    const coloresEstado = {
        'programada': '#3b82f6',
        'confirmada': '#10b981',
        'en_curso': '#f59e0b',
        'completada': '#059669',
        'cancelada': '#ef4444'
    };
    
    return `
        <div class="timeline-item" onclick="registrarAtencionRapida('${cita.pacienteRut}', '${cita.pacienteNombre}')" 
             style="cursor: pointer; border-left: 4px solid ${coloresEstado[estado]}; padding: 16px; margin-bottom: 16px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;">
            <div class="timeline-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="timeline-time" style="font-weight: bold; font-size: 18px; color: var(--primary-blue);">
                    <i class="fas fa-clock" style="margin-right: 8px;"></i>
                    ${hora}
                </div>
                <span class="timeline-status ${estado}" style="background: ${coloresEstado[estado]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    <i class="fas ${iconosEstado[estado]}"></i>
                    ${estado.toUpperCase()}
                </span>
            </div>
            
            <div class="timeline-patient">
                <h4 style="margin: 0 0 4px 0; color: var(--text-dark);">${cita.pacienteNombre}</h4>
                <p style="margin: 0 0 4px 0; color: var(--gray-600); font-size: 14px;">
                    <i class="fas fa-user-md" style="margin-right: 4px;"></i>
                    ${obtenerNombreProfesion(cita.tipoProfesional)} - ${cita.profesionalNombre}
                </p>
                <small style="color: var(--gray-500);">
                    <i class="fas fa-tag" style="margin-right: 4px;"></i>
                    Tipo: ${cita.tipo || 'General'}
                </small>
            </div>
            
            ${cita.observaciones ? 
                `<div class="timeline-notes" style="margin-top: 12px; padding: 8px; background: var(--light-blue); border-radius: 4px; font-size: 13px;">
                    <i class="fas fa-sticky-note" style="margin-right: 4px; color: var(--primary-blue);"></i>
                    ${cita.observaciones}
                </div>` : ''
            }
        </div>
    `;
}

/**
 * Renderiza las próximas citas
 */
function renderizarProximasCitas(citasSnapshot) {
    try {
        const grid = document.getElementById('upcoming-appointments-grid');
        const noUpcomingSection = document.getElementById('no-upcoming-section');
        
        if (!grid) return;
        
        if (citasSnapshot.empty) {
            if (noUpcomingSection) noUpcomingSection.style.display = 'block';
            grid.innerHTML = '';
            return;
        }
        
        if (noUpcomingSection) noUpcomingSection.style.display = 'none';
        
        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        grid.innerHTML = citas.map(cita => crearTarjetaCitaProxima(cita)).join('');
        
    } catch (error) {
        console.error('Error renderizando próximas citas:', error);
    }
}

/**
 * Crea una tarjeta para cita próxima
 */
function crearTarjetaCitaProxima(cita) {
    const fecha = cita.fecha.toDate();
    const fechaStr = formatearSoloFecha(fecha);
    const hora = formatearSoloHora(fecha);
    const estado = cita.estado || 'programada';
    
    // Calcular días hasta la cita
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(fecha);
    fechaCita.setHours(0, 0, 0, 0);
    const diasHasta = Math.ceil((fechaCita - hoy) / (1000 * 60 * 60 * 24));
    
    let proximidadTexto = '';
    let proximidadColor = '';
    
    if (diasHasta === 1) {
        proximidadTexto = 'Mañana';
        proximidadColor = '#f59e0b';
    } else if (diasHasta <= 3) {
        proximidadTexto = `En ${diasHasta} días`;
        proximidadColor = '#3b82f6';
    } else if (diasHasta <= 7) {
        proximidadTexto = `En ${diasHasta} días`;
        proximidadColor = '#10b981';
    } else {
        proximidadTexto = fechaStr;
        proximidadColor = '#6b7280';
    }
    
    return `
        <div class="appointment-card" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s ease; cursor: pointer;"
             onclick="mostrarDetalleCitaProxima('${cita.id}')">
            <div class="appointment-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="appointment-date" style="color: ${proximidadColor}; font-weight: bold; font-size: 14px;">
                    <i class="fas fa-calendar"></i>
                    ${proximidadTexto}
                </span>
                <span class="appointment-time" style="color: var(--primary-blue); font-weight: bold;">
                    <i class="fas fa-clock"></i>
                    ${hora}
                </span>
            </div>
            
            <div class="appointment-card-body">
                <h4 style="margin: 0 0 8px 0; color: var(--text-dark);">${cita.pacienteNombre}</h4>
                <p style="margin: 0 0 4px 0; color: var(--gray-600); font-size: 13px;">
                    <i class="fas fa-user-md"></i> ${obtenerNombreProfesion(cita.tipoProfesional)}
                </p>
                <p style="margin: 0; color: var(--gray-500); font-size: 12px;">
                    <i class="fas fa-tags"></i> ${cita.tipo || 'General'}
                </p>
            </div>
            
            <div class="appointment-card-footer" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span class="status-badge ${estado}" style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: var(--light-blue); color: var(--primary-blue);">
                    ${estado.toUpperCase()}
                </span>
                ${diasHasta <= 1 ? 
                    '<span style="color: var(--warning-orange); font-size: 11px; font-weight: bold;"><i class="fas fa-exclamation-circle"></i> Próximamente</span>' : 
                    ''
                }
            </div>
        </div>
    `;
}

/**
 * Registra una atención rápida
 */
function registrarAtencionRapida(rutPaciente, nombrePaciente) {
    import('./atenciones.js')
        .then(modulo => modulo.mostrarModalAtencion(rutPaciente, nombrePaciente))
        .catch(error => console.error('Error registrando atención:', error));
}

/**
 * Muestra el detalle de una cita próxima
 */
async function mostrarDetalleCitaProxima(citaId) {
    try {
        const citaDoc = await db.collection('citas').doc(citaId).get();
        
        if (!citaDoc.exists) {
            mostrarNotificacion('Cita no encontrada', 'error');
            return;
        }
        
        const cita = {
            id: citaDoc.id,
            ...citaDoc.data()
        };
        
        import('../utilidades/modales.js')
            .then(modulo => {
                const modalHTML = crearModalDetalleCita(cita);
                const modalId = modulo.crearModalTemporal(modalHTML);
                modulo.mostrarModal(modalId);
            });
        
    } catch (error) {
        console.error('Error cargando detalle de cita:', error);
        mostrarNotificacion('Error al cargar detalle de cita', 'error');
    }
}

/**
 * Crea el modal de detalle de cita
 */
function crearModalDetalleCita(cita) {
    const fecha = cita.fecha.toDate();
    const fechaStr = formatearSoloFecha(fecha);
    const horaStr = formatearSoloHora(fecha);
    
    return `
        <div class="modal">
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="padding: 24px;">
                <h2><i class="fas fa-calendar-check"></i> Detalle de Cita Próxima</h2>
                
                <div class="cita-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
                        ${cita.pacienteNombre}
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                        <div><strong>RUT:</strong> ${cita.pacienteRut || 'No disponible'}</div>
                        <div><strong>Teléfono:</strong> ${cita.pacienteTelefono || 'No disponible'}</div>
                        <div><strong>Fecha:</strong> ${fechaStr}</div>
                        <div><strong>Hora:</strong> ${horaStr}</div>
                        <div><strong>Profesional:</strong> ${cita.profesionalNombre}</div>
                        <div><strong>Tipo:</strong> ${obtenerNombreProfesion(cita.tipoProfesional)}</div>
                        <div><strong>Estado:</strong> ${(cita.estado || 'programada').toUpperCase()}</div>
                        <div><strong>Tipo cita:</strong> ${cita.tipo || 'General'}</div>
                    </div>
                    
                    ${cita.observaciones ? 
                        `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                            <strong>Observaciones:</strong>
                            <p style="margin: 8px 0 0 0; font-style: italic;">${cita.observaciones}</p>
                        </div>` : ''
                    }
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                        Cerrar
                    </button>
                    <button class="btn btn-primary" onclick="editarCita('${cita.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-success" onclick="confirmarCita('${cita.id}')">
                        <i class="fas fa-check"></i>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Confirma una cita
 */
async function confirmarCita(citaId) {
    try {
        await db.collection('citas').doc(citaId).update({
            estado: 'confirmada',
            fechaConfirmacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarNotificacion('Cita confirmada correctamente', 'success');
        
        // Cerrar modal y recargar seguimiento
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        cargarSeguimiento();
        
    } catch (error) {
        console.error('Error confirmando cita:', error);
        mostrarNotificacion('Error al confirmar cita', 'error');
    }
}

/**
 * Carga estadísticas del seguimiento
 */
async function cargarEstadisticasSeguimiento() {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;
    
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);
        
        // Citas de hoy
        const citasHoySnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', hoy)
            .where('fecha', '<', mañana)
            .get();
        
        // Citas completadas hoy
        const citasCompletadasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', hoy)
            .where('fecha', '<', mañana)
            .where('estado', '==', 'completada')
            .get();
        
        // Próximas 7 días
        const proximaSemana = new Date(hoy);
        proximaSemana.setDate(proximaSemana.getDate() + 7);
        
        const citasProximasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', mañana)
            .where('fecha', '<', proximaSemana)
            .get();
        
        actualizarEstadisticasInterfaz({
            citasHoy: citasHoySnapshot.size,
            citasCompletadas: citasCompletadasSnapshot.size,
            citasProximas: citasProximasSnapshot.size
        });
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

/**
 * Actualiza las estadísticas en la interfaz
 */
function actualizarEstadisticasInterfaz(stats) {
    const elementos = {
        'citas-hoy': stats.citasHoy,
        'citas-completadas': stats.citasCompletadas,
        'citas-proximas': stats.citasProximas
    };
    
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
        }
    });
    
    // Calcular porcentaje de completadas
    const porcentajeCompletadas = stats.citasHoy > 0 ? 
        Math.round((stats.citasCompletadas / stats.citasHoy) * 100) : 0;
    
    const porcentajeElement = document.getElementById('porcentaje-completadas');
    if (porcentajeElement) {
        porcentajeElement.textContent = `${porcentajeCompletadas}%`;
    }
}

/**
 * Obtiene el nombre legible de una profesión
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
window.registrarAtencionRapida = registrarAtencionRapida;
window.mostrarDetalleCitaProxima = mostrarDetalleCitaProxima;
window.confirmarCita = confirmarCita;

window.editarCita = function(citaId) {
    import('../calendario/citas.js')
        .then(modulo => modulo.editarCita(citaId))
        .catch(error => console.error('Error editando cita:', error));
};

export {
    inicializarSeguimiento,
    cargarSeguimiento,
    cargarEstadisticasSeguimiento,
    registrarAtencionRapida
};
