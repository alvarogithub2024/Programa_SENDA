
function enviarCorreoSenda() {
    const email = document.getElementById('modal-responder-email').value;
    const asunto = document.getElementById('modal-responder-asunto').value;
    const mensaje = document.getElementById('modal-responder-mensaje').value;
    const solicitudId = document.getElementById('modal-responder-id').value;


    if (!email || !asunto || !mensaje) {
        window.showNotification && window.showNotification('Completa todos los campos del correo', 'warning');
        return;
    }

    if (!solicitudId) {
        window.showNotification && window.showNotification('Error: ID de solicitud no encontrado', 'error');
        return;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        window.showNotification && window.showNotification('Error: Usuario no autenticado', 'error');
        return;
    }

    const db = window.getFirestore();
    const ahora = new Date().toISOString();

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

    db.collection('respuesta_informacion').add(respuestaData)
        .then(function(docRef) {
            console.log('✅ Respuesta guardada con ID:', docRef.id);
            
            return marcarSolicitudComoRespondida(solicitudId, ahora);
        })
        .then(function() {
            window.showNotification && window.showNotification('Respuesta guardada correctamente en el sistema', 'success');
            cerrarModalResponder();
            
            if (window.reloadSolicitudesFromFirebase) {
                window.reloadSolicitudesFromFirebase();
            }
        })
        .catch(function(error) {
            console.error('❌ Error guardando respuesta:', error);
            window.showNotification && window.showNotification('Error al guardar la respuesta: ' + error.message, 'error');
        });
}


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
            throw error;
        });
}


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

function limpiarFormularioRespuesta() {
    document.getElementById('modal-responder-asunto').value = 'Respuesta a su solicitud de información';
    document.getElementById('modal-responder-mensaje').value = '';
}

function abrirModalResponder(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email || '';
    document.getElementById('modal-responder-nombre').textContent = nombre || '';
    document.getElementById('modal-responder-id').value = solicitudId || '';

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

window.enviarCorreoSenda = enviarCorreoSenda;
window.marcarSolicitudComoRespondida = marcarSolicitudComoRespondida;
window.verRespuestasSolicitud = verRespuestasSolicitud;
window.mostrarHistorialRespuestas = mostrarHistorialRespuestas;
window.limpiarFormularioRespuesta = limpiarFormularioRespuesta;
window.abrirModalResponder = abrirModalResponder;

console.log('📧 Sistema de respuestas de información cargado');

function cargarTodasLasRespuestas() {
    const db = window.getFirestore();
    
    db.collection('respuesta_informacion')
        .orderBy('fechaRespuesta', 'desc')
        .limit(50) 
        .get()
        .then(function(snapshot) {
            const respuestas = [];
            snapshot.forEach(function(doc) {
                const respuesta = doc.data();
                respuesta.id = doc.id;
                respuestas.push(respuesta);
            });
            
            console.log('📊 Total de respuestas cargadas:', respuestas.length);
            mostrarTablaRespuestas(respuestas);
        })
        .catch(function(error) {
            console.error('❌ Error cargando respuestas:', error);
            window.showNotification && window.showNotification('Error al cargar respuestas', 'error');
        });
}

function mostrarTablaRespuestas(respuestas) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    
    let tableHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-envelope-open"></i> Historial de Respuestas</h2>
            <div style="overflow-x: auto;">
                <table class="solicitudes-table" style="width: 100%; margin-top: 1rem;">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Email Destino</th>
                            <th>Asunto</th>
                            <th>Respondido por</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (!respuestas.length) {
        tableHTML += `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
                    No hay respuestas registradas
                </td>
            </tr>
        `;
    } else {
        respuestas.forEach(function(respuesta) {
            const fecha = new Date(respuesta.fechaRespuesta).toLocaleString('es-CL');
            tableHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td>${respuesta.emailDestino}</td>
                    <td>${respuesta.asunto}</td>
                    <td>${respuesta.respondidoPor}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="verDetalleRespuesta('${respuesta.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    tableHTML += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-secondary" onclick="exportarRespuestas()">
                    <i class="fas fa-download"></i> Exportar CSV
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = tableHTML;
    document.body.appendChild(modal);
}


function verDetalleRespuesta(respuestaId) {
    const db = window.getFirestore();
    
    db.collection('respuesta_informacion').doc(respuestaId).get()
        .then(function(doc) {
            if (!doc.exists) {
                window.showNotification && window.showNotification('Respuesta no encontrada', 'error');
                return;
            }
            
            const respuesta = doc.data();
            const fecha = new Date(respuesta.fechaRespuesta).toLocaleString('es-CL');
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                    <h2><i class="fas fa-envelope-open-text"></i> Detalle de Respuesta</h2>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <p><strong>Para:</strong> ${respuesta.emailDestino}</p>
                        <p><strong>Asunto:</strong> ${respuesta.asunto}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Respondido por:</strong> ${respuesta.respondidoPor}</p>
                    </div>
                    <div style="background: white; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 8px;">
                        <h4>Mensaje:</h4>
                        <div style="white-space: pre-wrap; line-height: 1.6;">${respuesta.mensaje}</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        })
        .catch(function(error) {
            console.error('❌ Error obteniendo detalle:', error);
            window.showNotification && window.showNotification('Error al cargar detalle de respuesta', 'error');
        });
}

function exportarRespuestas() {
    const db = window.getFirestore();
    
    db.collection('respuesta_informacion')
        .orderBy('fechaRespuesta', 'desc')
        .get()
        .then(function(snapshot) {
            const respuestas = [];
            snapshot.forEach(function(doc) {
                const respuesta = doc.data();
                respuestas.push({
                    'Fecha': new Date(respuesta.fechaRespuesta).toLocaleString('es-CL'),
                    'Email Destino': respuesta.emailDestino,
                    'Asunto': respuesta.asunto,
                    'Respondido Por': respuesta.respondidoPor,
                    'Mensaje': respuesta.mensaje.replace(/\n/g, ' ').substring(0, 200) + '...'
                });
            });
            
            if (!respuestas.length) {
                window.showNotification && window.showNotification('No hay respuestas para exportar', 'warning');
                return;
            }
            
            const headers = Object.keys(respuestas[0]);
            let csvContent = headers.join(',') + '\n';
            
            respuestas.forEach(function(respuesta) {
                const row = headers.map(header => `"${respuesta[header]}"`).join(',');
                csvContent += row + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const filename = `respuestas_senda_${new Date().toISOString().slice(0, 10)}.csv`;
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            window.showNotification && window.showNotification(`Archivo exportado: ${filename}`, 'success');
        })
        .catch(function(error) {
            console.error('❌ Error exportando respuestas:', error);
            window.showNotification && window.showNotification('Error al exportar respuestas', 'error');
        });
}


window.cargarTodasLasRespuestas = cargarTodasLasRespuestas;
window.mostrarTablaRespuestas = mostrarTablaRespuestas;
window.verDetalleRespuesta = verDetalleRespuesta;
window.exportarRespuestas = exportarRespuestas;

console.log('📊 Vista administrativa de respuestas cargada');
