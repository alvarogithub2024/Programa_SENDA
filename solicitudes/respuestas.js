
// Variables globales para respuestas
let currentSolicitud = null;
let responseTemplates = [];
let responseHistory = [];

// Inicializar sistema de respuestas
 function initResponses() {
    setupResponseInterface();
    loadResponseTemplates();
    setupResponseEvents();
    console.log('📝 Sistema de respuestas inicializado');
}

// Configurar interfaz de respuestas
function setupResponseInterface() {
    const responsesContainer = document.getElementById('solicitud-responses');
    if (!responsesContainer) return;

    responsesContainer.innerHTML = `
        <div class="responses-header">
            <h4><i class="fas fa-comments"></i> Respuestas y Seguimiento</h4>
            <div class="response-actions">
                <button class="btn-primary" onclick="openResponseModal()">
                    <i class="fas fa-reply"></i> Nueva Respuesta
                </button>
                <button class="btn-secondary" onclick="openTemplateManager()">
                    <i class="fas fa-file-alt"></i> Plantillas
                </button>
            </div>
        </div>

        <div class="responses-content">
            <div class="response-timeline" id="response-timeline">
                <!-- Timeline de respuestas -->
            </div>
            
            <div class="quick-responses" id="quick-responses">
                <h5>Respuestas Rápidas</h5>
                <div class="quick-response-buttons">
                    <!-- Botones de respuestas rápidas -->
                </div>
            </div>
        </div>

        <!-- Modal de respuesta -->
        <div class="modal" id="response-modal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Nueva Respuesta</h3>
                    <button class="modal-close" onclick="closeResponseModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="response-form" class="modal-body">
                    <div class="form-section">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="response-type">Tipo de Respuesta</label>
                                <select id="response-type" required>
                                    <option value="">Seleccionar tipo</option>
                                    <option value="informacion">Información</option>
                                    <option value="solicitud_documentos">Solicitud de Documentos</option>
                                    <option value="aprobacion">Aprobación</option>
                                    <option value="rechazo">Rechazo</option>
                                    <option value="derivacion">Derivación</option>
                                    <option value="seguimiento">Seguimiento</option>
                                    <option value="cierre">Cierre de Caso</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="response-priority">Prioridad</label>
                                <select id="response-priority">
                                    <option value="normal">Normal</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="response-template">Usar Plantilla</label>
                                <select id="response-template">
                                    <option value="">Sin plantilla</option>
                                    <!-- Se cargan dinámicamente -->
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="notify-patient">Notificar al Paciente</label>
                                <div class="checkbox-group">
                                    <label>
                                        <input type="checkbox" id="notify-email" checked>
                                        Por Email
                                    </label>
                                    <label>
                                        <input type="checkbox" id="notify-sms">
                                        Por SMS
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label for="response-subject">Asunto</label>
                            <input type="text" id="response-subject" required>
                        </div>

                        <div class="form-group full-width">
                            <label for="response-content">Mensaje</label>
                            <div class="editor-toolbar">
                                <button type="button" onclick="formatText('bold')">
                                    <i class="fas fa-bold"></i>
                                </button>
                                <button type="button" onclick="formatText('italic')">
                                    <i class="fas fa-italic"></i>
                                </button>
                                <button type="button" onclick="formatText('underline')">
                                    <i class="fas fa-underline"></i>
                                </button>
                                <button type="button" onclick="insertList()">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                            <textarea id="response-content" 
                                     rows="8" 
                                     required 
                                     placeholder="Escriba su respuesta aquí..."></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="follow-up-date">Fecha de Seguimiento</label>
                                <input type="date" id="follow-up-date">
                            </div>
                            
                            <div class="form-group">
                                <label for="assign-to">Asignar a</label>
                                <select id="assign-to">
                                    <option value="">Mantener asignación actual</option>
                                    <!-- Se cargan profesionales -->
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="response-attachments">Adjuntar Archivos</label>
                            <input type="file" 
                                   id="response-attachments" 
                                   multiple 
                                   accept=".pdf,.doc,.docx,.jpg,.png">
                            <small>Archivos permitidos: PDF, Word, imágenes (máx. 10MB cada uno)</small>
                        </div>

                        <div class="form-group">
                            <label for="internal-notes">Notas Internas</label>
                            <textarea id="internal-notes" 
                                     rows="3" 
                                     placeholder="Notas solo para el equipo interno..."></textarea>
                        </div>
                    </div>
                </form>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="saveDraftResponse()">
                        <i class="fas fa-save"></i> Guardar Borrador
                    </button>
                    <button type="button" class="btn-secondary" onclick="previewResponse()">
                        <i class="fas fa-eye"></i> Vista Previa
                    </button>
                    <button type="submit" class="btn-primary" form="response-form">
                        <i class="fas fa-paper-plane"></i> Enviar Respuesta
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Cargar solicitud para responder
export async function loadSolicitudForResponse(solicitudId) {
    try {
        const doc = await db.collection('solicitudes').doc(solicitudId).get();
        
        if (!doc.exists) {
            throw new Error('Solicitud no encontrada');
        }

        currentSolicitud = { id: doc.id, ...doc.data() };
        
        // Cargar historial de respuestas
        await loadResponseHistory(solicitudId);
        
        // Renderizar timeline
        renderResponseTimeline();
        
        // Configurar respuestas rápidas
        setupQuickResponses();
        
    } catch (error) {
        console.error('Error cargando solicitud:', error);
        showNotification('Error al cargar la solicitud', 'error');
    }
}

// Cargar historial de respuestas
async function loadResponseHistory(solicitudId) {
    try {
        const respuestasRef = db.collection('respuestas_solicitudes');
        const query = respuestasRef
            .where('solicitudId', '==', solicitudId)
            .orderBy('fechaRespuesta', 'desc');

        const snapshot = await query.get();
        
        responseHistory = [];
        snapshot.forEach(doc => {
            responseHistory.push({
                id: doc.id,
                ...doc.data()
            });
        });

    } catch (error) {
        console.error('Error cargando historial de respuestas:', error);
    }
}

// Renderizar timeline de respuestas
function renderResponseTimeline() {
    const timeline = document.getElementById('response-timeline');
    if (!timeline) return;

    if (responseHistory.length === 0) {
        timeline.innerHTML = `
            <div class="no-responses">
                <i class="fas fa-comment-slash"></i>
                <h4>Sin respuestas</h4>
                <p>Esta solicitud aún no tiene respuestas.</p>
                <button class="btn-primary" onclick="openResponseModal()">
                    <i class="fas fa-reply"></i> Enviar Primera Respuesta
                </button>
            </div>
        `;
        return;
    }

    const timelineHTML = responseHistory.map(response => 
        createResponseTimelineEntry(response)
    ).join('');

    timeline.innerHTML = timelineHTML;
}

// Crear entrada del timeline de respuesta
function createResponseTimelineEntry(response) {
    return `
        <div class="timeline-entry response-entry" data-response-id="${response.id}">
            <div class="timeline-marker ${response.tipo}">
                <i class="${getResponseIcon(response.tipo)}"></i>
            </div>
            
            <div class="timeline-content">
                <div class="response-header">
                    <h5>${response.asunto}</h5>
                    <div class="response-meta">
                        <span class="response-date">
                            <i class="fas fa-clock"></i>
                            ${formatDateTime(response.fechaRespuesta)}
                        </span>
                        <span class="response-author">
                            <i class="fas fa-user"></i>
                            ${response.autor}
                        </span>
                        <span class="response-type ${response.tipo}">
                            ${getResponseTypeText(response.tipo)}
                        </span>
                    </div>
                </div>
                
                <div class="response-content">
                    ${formatResponseContent(response.contenido)}
                </div>
                
                ${response.adjuntos && response.adjuntos.length > 0 ? `
                    <div class="response-attachments">
                        <h6><i class="fas fa-paperclip"></i> Adjuntos:</h6>
                        <div class="attachment-list">
                            ${response.adjuntos.map(adjunto => `
                                <a href="${adjunto.url}" class="attachment-link" target="_blank">
                                    <i class="fas fa-file"></i>
                                    ${adjunto.nombre}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${response.notasInternas ? `
                    <div class="internal-notes">
                        <h6><i class="fas fa-eye-slash"></i> Notas Internas:</h6>
                        <p>${response.notasInternas}</p>
                    </div>
                ` : ''}
                
                <div class="response-actions">
                    <button class="btn-sm" onclick="replyToResponse('${response.id}')">
                        <i class="fas fa-reply"></i> Responder
                    </button>
                    <button class="btn-sm" onclick="forwardResponse('${response.id}')">
                        <i class="fas fa-share"></i> Reenviar
                    </button>
                    ${response.autor === getCurrentUser() ? `
                        <button class="btn-sm" onclick="editResponse('${response.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Configurar respuestas rápidas
function setupQuickResponses() {
    const quickResponsesContainer = document.querySelector('.quick-response-buttons');
    if (!quickResponsesContainer) return;

    const quickResponses = [
        {
            text: 'Información Recibida',
            template: 'info_recibida',
            action: () => sendQuickResponse('informacion', 'Información recibida correctamente, procesaremos su solicitud.')
        },
        {
            text: 'Solicitar Documentos',
            template: 'solicitar_docs',
            action: () => sendQuickResponse('solicitud_documentos', 'Necesitamos documentación adicional para continuar con su solicitud.')
        },
        {
            text: 'En Proceso',
            template: 'en_proceso',
            action: () => sendQuickResponse('seguimiento', 'Su solicitud está siendo procesada. Le mantendremos informado del progreso.')
        },
        {
            text: 'Aprobada',
            template: 'aprobada',
            action: () => sendQuickResponse('aprobacion', 'Su solicitud ha sido aprobada. Procederemos según los protocolos establecidos.')
        }
    ];

    quickResponsesContainer.innerHTML = quickResponses.map(response => `
        <button class="btn-sm secondary quick-response-btn" onclick="sendQuickResponseAction('${response.template}')">
            ${response.text}
        </button>
    `).join('');
}

// Cargar plantillas de respuesta
async function loadResponseTemplates() {
    try {
        const templatesRef = db.collection('plantillas_respuesta');
        const snapshot = await templatesRef.where('activa', '==', true).get();
        
        responseTemplates = [];
        snapshot.forEach(doc => {
            responseTemplates.push({
                id: doc.id,
                ...doc.data()
            });
        });

        populateTemplateSelect();

    } catch (error) {
        console.error('Error cargando plantillas:', error);
    }
}

// Poblar selector de plantillas
function populateTemplateSelect() {
    const select = document.getElementById('response-template');
    if (!select) return;

    select.innerHTML = '<option value="">Sin plantilla</option>';
    
    responseTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.nombre;
        select.appendChild(option);
    });
}

// Configurar eventos de respuesta
function setupResponseEvents() {
    const responseForm = document.getElementById('response-form');
    if (responseForm) {
        responseForm.addEventListener('submit', handleResponseSubmit);
    }

    // Event listener para plantillas
    const templateSelect = document.getElementById('response-template');
    if (templateSelect) {
        templateSelect.addEventListener('change', handleTemplateSelect);
    }

    // Event listener para tipo de respuesta
    const typeSelect = document.getElementById('response-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', handleResponseTypeChange);
    }
}

// Manejar envío de respuesta
async function handleResponseSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const responseData = {
        solicitudId: currentSolicitud.id,
        tipo: formData.get('response-type') || document.getElementById('response-type').value,
        asunto: formData.get('response-subject') || document.getElementById('response-subject').value,
        contenido: formData.get('response-content') || document.getElementById('response-content').value,
        prioridad: formData.get('response-priority') || document.getElementById('response-priority').value,
        notasInternas: formData.get('internal-notes') || document.getElementById('internal-notes').value,
        fechaSeguimiento: formData.get('follow-up-date') || document.getElementById('follow-up-date').value,
        asignadoA: formData.get('assign-to') || document.getElementById('assign-to').value,
        notificarEmail: document.getElementById('notify-email').checked,
        notificarSMS: document.getElementById('notify-sms').checked,
        autor: getCurrentUser(),
        fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validar campos requeridos
    if (!responseData.tipo || !responseData.asunto || !responseData.contenido) {
        showNotification('Todos los campos marcados son requeridos', 'error');
        return;
    }

    try {
        // Subir archivos adjuntos si existen
        const attachments = await uploadResponseAttachments();
        if (attachments.length > 0) {
            responseData.adjuntos = attachments;
        }

        // Guardar respuesta
        await saveResponse(responseData);
        
        // Actualizar estado de la solicitud si es necesario
        await updateSolicitudStatus(responseData);
        
        // Enviar notificaciones si está habilitado
        if (responseData.notificarEmail || responseData.notificarSMS) {
            await sendNotifications(responseData);
        }

        // Limpiar formulario y cerrar modal
        e.target.reset();
        closeResponseModal();
        
        // Recargar timeline
        await loadResponseHistory(currentSolicitud.id);
        renderResponseTimeline();
        
        showNotification('Respuesta enviada exitosamente', 'success');
        
    } catch (error) {
        console.error('Error enviando respuesta:', error);
        showNotification('Error al enviar la respuesta', 'error');
    }
}

// Guardar respuesta
async function saveResponse(responseData) {
    const respuestasRef = db.collection('respuestas_solicitudes');
    const docRef = await respuestasRef.add(responseData);
    
    // Agregar al historial de la solicitud
    await addToSolicitudHistory(responseData, docRef.id);
    
    return docRef.id;
}

// Agregar al historial de la solicitud
async function addToSolicitudHistory(responseData, responseId) {
    const historialRef = db.collection('historial_solicitudes');
    await historialRef.add({
        solicitudId: responseData.solicitudId,
        tipo: 'respuesta',
        descripcion: `Respuesta enviada: ${responseData.asunto}`,
        autor: responseData.autor,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        referenciaId: responseId
    });
}

// Actualizar estado de solicitud
async function updateSolicitudStatus(responseData) {
    const updates = {
        ultimaRespuesta: firebase.firestore.FieldValue.serverTimestamp(),
        ultimoAutor: responseData.autor
    };

    // Cambiar estado según tipo de respuesta
    switch (responseData.tipo) {
        case 'aprobacion':
            updates.estado = 'aprobada';
            break;
        case 'rechazo':
            updates.estado = 'rechazada';
            break;
        case 'cierre':
            updates.estado = 'completada';
            break;
        case 'derivacion':
            updates.estado = 'derivada';
            break;
    }

    // Asignar profesional si se especifica
    if (responseData.asignadoA) {
        updates.profesionalAsignado = responseData.asignadoA;
    }

    // Fecha de seguimiento
    if (responseData.fechaSeguimiento) {
        updates.fechaSeguimiento = responseData.fechaSeguimiento;
    }

    await db.collection('solicitudes').doc(currentSolicitud.id).update(updates);
}

// Subir archivos adjuntos
async function uploadResponseAttachments() {
    const fileInput = document.getElementById('response-attachments');
    if (!fileInput.files.length) return [];

    const attachments = [];
    
    for (const file of fileInput.files) {
        // Simular subida (implementar con Firebase Storage)
        const attachment = {
            nombre: file.name,
            tamaño: file.size,
            tipo: file.type,
            url: `#uploaded-${Date.now()}-${file.name}` // URL simulada
        };
        attachments.push(attachment);
    }

    return attachments;
}

// Enviar notificaciones
async function sendNotifications(responseData) {
    // Implementar envío de notificaciones por email/SMS
    console.log('Enviando notificaciones...', responseData);
}

// Manejar selección de plantilla
function handleTemplateSelect(e) {
    const templateId = e.target.value;
    if (!templateId) return;

    const template = responseTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Aplicar plantilla
    document.getElementById('response-subject').value = template.asunto || '';
    document.getElementById('response-content').value = template.contenido || '';
    document.getElementById('response-type').value = template.tipo || '';
}

// Manejar cambio de tipo de respuesta
function handleResponseTypeChange(e) {
    const responseType = e.target.value;
    
    // Mostrar/ocultar campos según el tipo
    const followUpGroup = document.querySelector('[for="follow-up-date"]').closest('.form-group');
    const assignGroup = document.querySelector('[for="assign-to"]').closest('.form-group');
    
    if (['seguimiento', 'derivacion'].includes(responseType)) {
        followUpGroup.style.display = 'block';
        assignGroup.style.display = 'block';
    } else {
        followUpGroup.style.display = 'none';
        assignGroup.style.display = 'none';
    }
}

// Funciones expuestas globalmente
window.openResponseModal = function() {
    const modal = document.getElementById('response-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeResponseModal = function() {
    const modal = document.getElementById('response-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.sendQuickResponse = async function(type, content) {
    if (!currentSolicitud) {
        showNotification('No hay solicitud seleccionada', 'error');
        return;
    }

    const responseData = {
        solicitudId: currentSolicitud.id,
        tipo: type,
        asunto: `Re: ${currentSolicitud.asunto || currentSolicitud.tipoSolicitud}`,
        contenido: content,
        prioridad: 'normal',
        autor: getCurrentUser(),
        fechaRespuesta: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await saveResponse(responseData);
        await updateSolicitudStatus(responseData);
        
        // Recargar timeline
        await loadResponseHistory(currentSolicitud.id);
        renderResponseTimeline();
        
        showNotification('Respuesta rápida enviada', 'success');
        
    } catch (error) {
        console.error('Error enviando respuesta rápida:', error);
        showNotification('Error al enviar respuesta rápida', 'error');
    }
};

// Funciones utilitarias
function getResponseIcon(type) {
    const icons = {
        'informacion': 'fas fa-info-circle',
        'solicitud_documentos': 'fas fa-file-upload',
        'aprobacion': 'fas fa-check-circle',
        'rechazo': 'fas fa-times-circle',
        'derivacion': 'fas fa-share-alt',
        'seguimiento': 'fas fa-eye',
        'cierre': 'fas fa-lock'
    };
    return icons[type] || 'fas fa-comment';
}

function getResponseTypeText(type) {
    const texts = {
        'informacion': 'Información',
        'solicitud_documentos': 'Solicitud de Documentos',
        'aprobacion': 'Aprobación',
        'rechazo': 'Rechazo',
        'derivacion': 'Derivación',
        'seguimiento': 'Seguimiento',
        'cierre': 'Cierre'
    };
    return texts[type] || type;
}

function formatResponseContent(content) {
    return content.replace(/\n/g, '<br>');
}

function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CL');
}

function getCurrentUser() {
    // Implementar obtención del usuario actual
    return 'Usuario Actual';
}
