/**
 * SISTEMA DE RESPUESTAS
 * Maneja las respuestas a solicitudes de información
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarModal, cerrarModal, mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha, alternarBotonEnvio } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el sistema de respuestas
 */
function inicializarRespuestas() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de respuestas inicializado');
    } catch (error) {
        console.error('❌ Error inicializando respuestas:', error);
    }
}

/**
 * Muestra modal para responder solicitud de información
 */
function mostrarModalRespuesta(solicitudId) {
    try {
        // Buscar la solicitud en los datos cargados
        let solicitud = null;
        
        // Intentar obtener desde el evento personalizado o variable global
        if (window.solicitudesData) {
            solicitud = window.solicitudesData.find(s => s.id === solicitudId);
        }

        if (!solicitud) {
            cargarSolicitudYMostrarModal(solicitudId);
            return;
        }

        crearModalRespuesta(solicitud);
        
    } catch (error) {
        console.error('Error mostrando modal de respuesta:', error);
        mostrarNotificacion('Error al abrir modal de respuesta', 'error');
    }
}

/**
 * Carga una solicitud específica y muestra el modal
 */
async function cargarSolicitudYMostrarModal(solicitudId) {
    try {
        mostrarCarga(true, 'Cargando solicitud...');

        // Intentar buscar en diferentes colecciones
        let solicitudDoc = await db.collection('solicitudes_informacion').doc(solicitudId).get();
        let coleccion = 'solicitudes_informacion';

        if (!solicitudDoc.exists) {
            solicitudDoc = await db.collection('solicitudes_ingreso').doc(solicitudId).get();
            coleccion = 'solicitudes_ingreso';
        }

        if (!solicitudDoc.exists) {
            solicitudDoc = await db.collection('reingresos').doc(solicitudId).get();
            coleccion = 'reingresos';
        }

        if (!solicitudDoc.exists) {
            mostrarNotificacion('Solicitud no encontrada', 'error');
            return;
        }

        const solicitud = {
            id: solicitudDoc.id,
            coleccion,
            ...solicitudDoc.data()
        };

        crearModalRespuesta(solicitud);

    } catch (error) {
        console.error('Error cargando solicitud:', error);
        mostrarNotificacion('Error al cargar solicitud', 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Crea el modal de respuesta
 */
function crearModalRespuesta(solicitud) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;

    const modalHTML = `
        <div class="modal-overlay temp-modal" id="respuesta-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('respuesta-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-reply"></i> Responder Solicitud</h2>
                    
                    <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
                            <i class="fas fa-info-circle"></i> Información de la Solicitud
                        </h4>
                        <div style="font-size: 14px;">
                            <strong>Tipo:</strong> ${determinarTipoSolicitud(solicitud)}<br>
                            <strong>Solicitante:</strong> ${obtenerNombreSolicitante(solicitud)}<br>
                            <strong>Email:</strong> ${solicitud.email || 'No disponible'}<br>
                            <strong>Fecha:</strong> ${formatearFecha(solicitud.fechaCreacion)}<br>
                            <strong>ID:</strong> ${solicitud.id}
                        </div>
                        ${solicitud.motivo ? 
                            `<div style="margin-top: 12px;">
                                <strong>Motivo/Descripción:</strong>
                                <p style="margin: 4px 0; font-style: italic; background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                                    ${solicitud.motivo || solicitud.descripcion}
                                </p>
                            </div>` : ''
                        }
                    </div>
                    
                    <form id="respuesta-form">
                        <input type="hidden" id="respuesta-solicitud-id" value="${solicitud.id}">
                        <input type="hidden" id="respuesta-coleccion" value="${solicitud.coleccion || 'solicitudes_informacion'}">
                        
                        <div class="form-group">
                            <label class="form-label">Desde (Email institucional) *</label>
                            <input type="email" class="form-input" id="respuesta-from" 
                                   value="${userData.email}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Para *</label>
                            <input type="email" class="form-input" id="respuesta-to" 
                                   value="${solicitud.email || ''}" ${!solicitud.email ? '' : 'readonly'}>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Asunto *</label>
                            <input type="text" class="form-input" id="respuesta-subject" 
                                   value="${generarAsuntoRespuesta(solicitud)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mensaje *</label>
                            <textarea class="form-textarea" id="respuesta-message" rows="10" required
                                      placeholder="Escribe tu respuesta aquí...">${generarPlantillaRespuesta(solicitud, userData)}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="marcar-respondida" checked>
                                Marcar solicitud como respondida automáticamente
                            </label>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('respuesta-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="guardarBorradorRespuesta()">
                                <i class="fas fa-save"></i>
                                Guardar Borrador
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-paper-plane"></i>
                                Enviar Respuesta
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('respuesta-modal');

    // Configurar el formulario
    document.getElementById('respuesta-form').addEventListener('submit', manejarEnvioRespuesta);
}

/**
 * Maneja el envío de la respuesta
 */
async function manejarEnvioRespuesta(e) {
    e.preventDefault();
    
    try {
        const solicitudId = document.getElementById('respuesta-solicitud-id').value;
        const coleccion = document.getElementById('respuesta-coleccion').value;
        const from = document.getElementById('respuesta-from').value;
        const to = document.getElementById('respuesta-to').value;
        const subject = document.getElementById('respuesta-subject').value;
        const message = document.getElementById('respuesta-message').value;
        const marcarRespondida = document.getElementById('marcar-respondida').checked;
        
        if (!subject.trim() || !message.trim() || !to.trim()) {
            mostrarNotificacion('Complete todos los campos obligatorios', 'warning');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);
        mostrarCarga(true, 'Enviando respuesta...');
        
        const userData = obtenerDatosUsuarioActual();
        const currentUser = obtenerUsuarioActual();
        
        // Crear registro de respuesta
        const respuestaData = {
            solicitudId: solicitudId,
            coleccionOrigen: coleccion,
            from: from,
            to: to,
            subject: subject,
            message: message,
            fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
            respondidoPor: currentUser.uid,
            profesionalNombre: `${userData.nombre} ${userData.apellidos}`,
            profesionalProfession: userData.profession,
            cesfam: userData.cesfam,
            estado: 'enviado'
        };
        
        // Guardar respuesta
        await db.collection('respuestas').add(respuestaData);
        
        // Actualizar estado de solicitud si está marcado
        if (marcarRespondida) {
            await db.collection(coleccion).doc(solicitudId).update({
                estado: 'respondida',
                fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
                respondidoPor: currentUser.uid
            });
        }
        
        cerrarModal('respuesta-modal');
        mostrarExito('Respuesta enviada y registrada correctamente');
        
        // Disparar evento para actualizar solicitudes
        const evento = new CustomEvent('respuestaEnviada', {
            detail: { solicitudId, coleccion }
        });
        document.dispatchEvent(evento);
        
    } catch (error) {
        console.error('Error enviando respuesta:', error);
        mostrarNotificacion('Error al enviar respuesta: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Guarda un borrador de la respuesta
 */
async function guardarBorradorRespuesta() {
    try {
        const solicitudId = document.getElementById('respuesta-solicitud-id').value;
        const subject = document.getElementById('respuesta-subject').value;
        const message = document.getElementById('respuesta-message').value;
        
        const borradorData = {
            solicitudId,
            subject,
            message,
            fechaGuardado: firebase.firestore.FieldValue.serverTimestamp(),
            guardadoPor: obtenerUsuarioActual().uid
        };
        
        await db.collection('borradores_respuestas').doc(solicitudId).set(borradorData);
        
        mostrarNotificacion('Borrador guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarNotificacion('Error al guardar borrador', 'error');
    }
}

/**
 * Determina el tipo de solicitud
 */
function determinarTipoSolicitud(solicitud) {
    if (solicitud.tipo === 'reingreso') return 'Reingreso';
    if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') return 'Solicitud de Información';
    if (solicitud.tipoSolicitud === 'identificado') return 'Solicitud Identificada';
    return 'Solicitud General';
}

/**
 * Obtiene el nombre del solicitante
 */
function obtenerNombreSolicitante(solicitud) {
    if (solicitud.nombre) {
        return `${solicitud.nombre} ${solicitud.apellidos || ''}`.trim();
    }
    return 'No especificado';
}

/**
 * Genera el asunto de la respuesta
 */
function generarAsuntoRespuesta(solicitud) {
    const tipo = determinarTipoSolicitud(solicitud);
    return `Respuesta a su ${tipo.toLowerCase()} - SENDA Puente Alto`;
}

/**
 * Genera una plantilla de respuesta
 */
function generarPlantillaRespuesta(solicitud, userData) {
    const nombreSolicitante = obtenerNombreSolicitante(solicitud);
    const saludo = nombreSolicitante !== 'No especificado' ? 
        `Estimado/a ${nombreSolicitante.split(' ')[0]}` : 
        'Estimado/a solicitante';

    return `${saludo},

Gracias por contactar al Programa SENDA Puente Alto. En respuesta a su solicitud de información...

[Escriba aquí su respuesta personalizada]

Si necesita información adicional o desea coordinar una cita, no dude en contactarnos al teléfono 1412 (gratuito) o responder a este correo.

Atentamente,

${userData.nombre} ${userData.apellidos}
${obtenerNombreProfesion(userData.profession)}
SENDA ${userData.cesfam}
Teléfono: 1412
Email: ${userData.email}`;
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

/**
 * Carga historial de respuestas de una solicitud
 */
async function cargarHistorialRespuestas(solicitudId) {
    try {
        const respuestasSnapshot = await db.collection('respuestas')
            .where('solicitudId', '==', solicitudId)
            .orderBy('fechaRespuesta', 'desc')
            .get();

        const respuestas = [];
        respuestasSnapshot.forEach(doc => {
            respuestas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return respuestas;

    } catch (error) {
        console.error('Error cargando historial de respuestas:', error);
        return [];
    }
}

// Funciones globales
window.mostrarModalRespuesta = mostrarModalRespuesta;
window.guardarBorradorRespuesta = guardarBorradorRespuesta;

export {
    inicializarRespuestas,
    mostrarModalRespuesta,
    cargarHistorialRespuestas,
    guardarBorradorRespuesta
};
