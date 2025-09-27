// REEMPLAZAR la función enviarCorreoSenda en solicitudes/respuestas.js

// Función para guardar respuesta en Firebase (sin enviar correo)
function enviarCorreoSenda() {
    const email = document.getElementById('modal-responder-email').value;
    const asunto = document.getElementById('modal-responder-asunto').value;
    const mensaje = document.getElementById('modal-responder-mensaje').value;
    const solicitudId = document.getElementById('modal-responder-id').value;

    // Validar campos obligatorios
    if (!email || !asunto || !mensaje) {
        window.showNotification && window.showNotification('Completa todos los campos del correo', 'warning');
        return;
    }

    if (!solicitudId) {
        window.showNotification && window.showNotification('Error: ID de solicitud no encontrado', 'error');
        return;
    }

    // Obtener datos del usuario actual
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        window.showNotification && window.showNotification('Error: Usuario no autenticado', 'error');
        return;
    }

    const db = window.getFirestore();
    const ahora = new Date().toISOString();

    // Datos a guardar en la colección respuesta_informacion
    const respuestaData = {
        solicitudId: solicitudId,
        emailDestino: email,
        asunto: asunto,
        mensaje: mensaje,
        fechaRespuesta: ahora,
        respondidoPor: currentUser.email || currentUser.uid,
        profesionalId: currentUser.uid,
        estado: 'enviada',
        fechaCreacion: ahora
    };

    console.log('💾 Guardando respuesta:', respuestaData);

    // Guardar en la colección respuesta_informacion
    db.collection('respuesta_informacion').add(respuestaData)
        .then(function(docRef) {
            console.log('✅ Respuesta guardada con ID:', docRef.id);
            
            // Actualizar el estado de la solicitud original
            return marcarSolicitudComoRespondida(solicitudId, ahora);
        })
        .then(function() {
            window.showNotification && window.showNotification('Respuesta guardada correctamente en el sistema', 'success');
            cerrarModalResponder();
            
            // Recargar solicitudes si la función existe
            if (window.reloadSolicitudesFromFirebase) {
                window.reloadSolicitudesFromFirebase();
            }
        })
        .catch(function(error) {
            console.error('❌ Error guardando respuesta:', error);
            window.showNotification && window.showNotification('Error al guardar la respuesta: ' + error.message, 'error');
        });
}

// Función para marcar solicitud como respondida
function marcarSolicitudComoRespondida(solicitudId, fechaRespuesta) {
    const db = window.getFirestore();
    const currentUser = firebase.auth().currentUser;
    
    const updateData = {
        estado: 'respondida',
        fechaRespuesta: fechaRespuesta,
        fechaUltimaActualizacion: fechaRespuesta,
        respondidoPor: currentUser ? (currentUser.email || currentUser.uid) : 'sistema'
    };

    console.log('📝 Actualizando solicitud:', solicitudId, updateData);
    
    return db.collection('solicitudes_informacion').doc(solicitudId).update(updateData)
        .then(function() {
            console.log('✅ Solicitud marcada como respondida');
        })
        .catch(function(error) {
            console.error('❌ Error actualizando estado de solicitud:', error);
            throw error; // Re-lanzar el error para que se maneje en el catch principal
        });
}

// Función para ver todas las respuestas de una solicitud
function verRespuestasSolicitud(solicitudId) {
    const db = window.getFirestore();
    
    db.collection('respuesta_informacion')
        .where('solicitudId', '==', solicitudId)
        .orderBy('fechaRespuesta', 'desc')
        .get()
        .then(function(snapshot) {
            const respuestas = [];
            snapshot.forEach(function(doc) {
                const respuesta = doc.data();
                respuesta.id = doc.id;
                respuestas.push(respuesta);
            });
            
            console.log('📧 Respuestas encontradas:', respuestas);
            mostrarHistorialRespuestas(respuestas);
        })
        .catch(function(error) {
            console.error('❌ Error obteniendo respuestas:', error);
            window.showNotification && window.showNotification('Error al cargar historial de respuestas', 'error');
        });
}

// Función para mostrar historial de respuestas (opcional)
function mostrarHistorialRespuestas(respuestas) {
    if (!respuestas.length) {
        window.showNotification && window.showNotification('No hay respuestas registradas para esta solicitud', 'info');
        return;
    }

    let html = '<div class="historial-respuestas">';
    html += '<h3>Historial de Respuestas</h3>';
    
    respuestas.forEach(function(respuesta) {
        const fecha = new Date(respuesta.fechaRespuesta).toLocaleString('es-CL');
        html += `
            <div class="respuesta-item" style="background: #f8fafc; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 4px solid #2563eb;">
                <div style="font-weight: 600; color: #2563eb; margin-bottom: 0.5rem;">
                    📧 ${respuesta.asunto}
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <strong>Para:</strong> ${respuesta.emailDestino}
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <strong>Fecha:</strong> ${fecha}
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <strong>Respondido por:</strong> ${respuesta.respondidoPor}
                </div>
                <div style="background: white; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem;">
                    ${respuesta.mensaje}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Crear modal para mostrar historial
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            ${html}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Función para limpiar el formulario de respuesta
function limpiarFormularioRespuesta() {
    document.getElementById('modal-responder-asunto').value = 'Respuesta a su solicitud de información';
    document.getElementById('modal-responder-mensaje').value = '';
}

// Función mejorada para abrir modal de responder
function abrirModalResponder(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email || '';
    document.getElementById('modal-responder-nombre').textContent = nombre || '';
    document.getElementById('modal-responder-id').value = solicitudId || '';
    
    // Llenar mensaje predeterminado
    const mensajePredeterminado = `Estimado/a ${nombre || 'Usuario'},

Gracias por contactar al Programa SENDA Puente Alto.

Hemos recibido su solicitud de información y queremos informarle que...

[COMPLETAR CON LA INFORMACIÓN SOLICITADA]

Para más información o para solicitar una cita, puede contactarnos a través de:
- Teléfono: [NÚMERO]
- Email: [EMAIL]
- Presencialmente en su CESFAM correspondiente

Saludos cordiales,
Equipo SENDA Puente Alto`;

    document.getElementById('modal-responder-mensaje').value = mensajePredeterminado;
    document.getElementById('modal-responder').style.display = 'flex';
    
    console.log('📧 Modal de respuesta abierto para:', { email, nombre, solicitudId });
}

// Exportar funciones globalmente
window.enviarCorreoSenda = enviarCorreoSenda;
window.marcarSolicitudComoRespondida = marcarSolicitudComoRespondida;
window.verRespuestasSolicitud = verRespuestasSolicitud;
window.mostrarHistorialRespuestas = mostrarHistorialRespuestas;
window.limpiarFormularioRespuesta = limpiarFormularioRespuesta;
window.abrirModalResponder = abrirModalResponder;

console.log('📧 Sistema de respuestas de información cargado');
