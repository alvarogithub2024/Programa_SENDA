/**
 * Crea el HTML para una tarjeta de solicitud
 */
function crearTarjetaSolicitud(solicitud) {
    try {
        const fecha = formatearFecha(solicitud.fechaCreacion);
        const prioridad = solicitud.prioridad || 'baja';
        const estado = solicitud.estado || 'pendiente';
        
        let titulo, subtitulo, tipoIcon;
        
        if (solicitud.tipo === 'reingreso') {
            titulo = `Reingreso - ${solicitud.nombre || 'Sin nombre'}`;
            subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
            tipoIcon = 'fa-redo';
        } else if (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') {
            titulo = 'Solicitud de Información';
            subtitulo = `Email: ${solicitud.email || 'No disponible'}`;
            tipoIcon = 'fa-info-circle';
        } else {
            tipoIcon = 'fa-user-plus';
            if (solicitud.tipoSolicitud === 'identificado') {
                titulo = `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`.trim() || 'Solicitud identificada';
                subtitulo = `RUT: ${solicitud.rut || 'No disponible'}`;
            } else {
                titulo = 'Solicitud General';
                subtitulo = `Edad: ${solicitud.edad || 'No especificada'} años`;
            }
        }

        const sustancias = solicitud.sustancias || [];
        const sustanciasHtml = sustancias.length > 0 ? 
            sustancias.map(s => `<span class="substance-tag">${s}</span>`).join('') : '';

        const prioridadColor = COLORES_PRIORIDAD[prioridad] || COLORES_PRIORIDAD.baja;
        const estadoIcon = ICONOS_ESTADO[estado] || ICONOS_ESTADO.pendiente;

        const responderBtn = (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') ? 
            `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); mostrarModalResponder('${solicitud.id}')" title="Responder solicitud de información">
                <i class="fas fa-reply"></i>
                Responder
            </button>` : '';

        return `
            <div class="request-card" data-id="${solicitud.id}" style="transition: all 0.2s ease;">
                <div class="request-header">
                    <div class="request-info">
                        <h3>
                            <i class="fas ${tipoIcon}" style="margin-right: 8px; color: var(--primary-blue);"></i>
                            ${titulo}
                        </h3>
                        <p style="color: var(--gray-600);">${subtitulo}</p>
                    </div>
                    <div class="request-meta">
                        <span class="priority-badge ${prioridad}" style="background-color: ${prioridadColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${prioridad.toUpperCase()}
                        </span>
                        ${solicitud.tipo === 'reingreso' ? '<span class="request-type reingreso" style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">REINGRESO</span>' : ''}
                        ${solicitud.tipo === 'informacion' ? '<span class="request-type informacion" style="background: #f0f9ff; color: #0c4a6e; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">INFORMACIÓN</span>' : ''}
                    </div>
                </div>
                
                <div class="request-body">
                    ${sustanciasHtml ? `<div class="request-substances" style="margin-bottom: 8px;">${sustanciasHtml}</div>` : ''}
                    ${solicitud.descripcion || solicitud.motivo ? 
                        `<p class="request-description" style="color: var(--gray-700); line-height: 1.5;">${truncarTexto(solicitud.descripcion || solicitud.motivo, 150)}</p>` : ''}
                    
                    <div class="request-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--gray-600);">
                        ${solicitud.cesfam ? `<div><strong>CESFAM:</strong> ${solicitud.cesfam}</div>` : ''}
                        <div><strong>Estado:</strong> 
                            <span class="status-${estado}" style="display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas ${estadoIcon}"></i>
                                ${estado.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
                        <div><strong>Fecha:</strong> ${fecha}</div>
                    </div>
                </div>
                
                <div class="request-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
                    ${responderBtn}
                    ${solicitud.tipo !== 'informacion' ? 
                        `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); mostrarModalAgendaDesdeSolicitud('${solicitud.id}')" title="Agendar cita">
                            <i class="fas fa-calendar-plus"></i>
                            Agendar
                        </button>` : ''
                    }
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); mostrarDetalleSolicitudPorId('${solicitud.id}')" title="Ver detalles completos">
                        <i class="fas fa-eye"></i>
                        Ver Detalle
                    </button>
                    ${solicitud.prioridad === 'critica' ? 
                        `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); manejarCasoUrgente('${solicitud.id}')" title="Caso urgente">
                            <i class="fas fa-exclamation-triangle"></i>
                            URGENTE
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creando tarjeta de solicitud:', error);
        return `
            <div class="request-card error-card">
                <div class="request-header">
                    <h3>Error al cargar solicitud</h3>
                </div>
                <div class="request-body">
                    <p>No se pudo cargar la información de esta solicitud</p>
                </div>
            </div>
        `;
    }
}

/**
 * Crea el mensaje cuando no hay solicitudes
 */
function crearMensajeSinSolicitudes() {
    const userData = obtenerDatosUsuarioActual();
    return `
        <div class="no-results">
            <i class="fas fa-inbox"></i>
            <h3>No hay solicitudes</h3>
            <p>No se encontraron solicitudes para tu CESFAM: ${userData.cesfam}</p>
            <button class="btn btn-primary mt-4" onclick="cargarSolicitudes()">
                <i class="fas fa-redo"></i>
                Actualizar
            </button>
        </div>
    `;
}

/**
 * Agrega event listeners a las tarjetas de solicitudes
 */
function agregarEventListenersTarjetas(container) {
    try {
        container.querySelectorAll('.request-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                
                const solicitudId = card.dataset.id;
                const solicitud = solicitudesData.find(s => s.id === solicitudId);
                if (solicitud) {
                    mostrarDetalleSolicitud(solicitud);
                }
            });
        });
    } catch (error) {
        console.error('Error agregando event listeners:', error);
    }
}

/**
 * Renderiza error al cargar solicitudes
 */
function renderizarErrorSolicitudes(error) {
    const container = document.getElementById('requests-container');
    if (!container) return;
    
    let errorMessage = 'Error al cargar solicitudes';
    let errorDetails = '';
    
    if (error.code === 'permission-denied') {
        errorMessage = 'Sin permisos de acceso';
        errorDetails = 'No tienes permisos para ver las solicitudes de este CESFAM';
    } else if (error.code === 'unavailable') {
        errorMessage = 'Servicio no disponible';
        errorDetails = 'El servicio está temporalmente no disponible';
    } else {
        errorDetails = error.message;
    }
    
    container.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
            <h3>${errorMessage}</h3>
            <p>${errorDetails}</p>
            <div class="mt-4">
                <button class="btn btn-primary" onclick="cargarSolicitudes()">
                    <i class="fas fa-redo"></i>
                    Reintentar
                </button>
            </div>
        </div>
    `;
}

/**
 * Filtra las solicitudes según los criterios actuales
 */
function filtrarSolicitudes() {
    try {
        let solicitudesFiltradas = solicitudesData;
        
        if (filtroActual !== 'todas') {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => s.estado === filtroActual);
        }
        
        if (filtroPrioridadActual) {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => s.prioridad === filtroPrioridadActual);
        }
        
        renderizarSolicitudes(solicitudesFiltradas);
        
    } catch (error) {
        console.error('Error filtrando solicitudes:', error);
    }
}

/**
 * Muestra el detalle de una solicitud
 */
function mostrarDetalleSolicitud(solicitud) {
    try {
        const detailModal = crearModalDetalleSolicitud(solicitud);
        document.body.insertAdjacentHTML('beforeend', detailModal);
        
        // Importar función de modales
        if (typeof window.showModal === 'function') {
            window.showModal('solicitud-detail-modal');
        }
    } catch (error) {
        console.error('Error mostrando detalle de solicitud:', error);
        mostrarNotificacion('Error al mostrar detalle de solicitud', 'error');
    }
}

/**
 * Crea el modal de detalle de solicitud
 */
function crearModalDetalleSolicitud(solicitud) {
    const fecha = formatearFecha(solicitud.fechaCreacion);
    const prioridad = solicitud.prioridad || 'baja';
    const estado = solicitud.estado || 'pendiente';
    
    let tipoSolicitud = 'Solicitud General';
    if (solicitud.tipo === 'reingreso') {
        tipoSolicitud = 'Reingreso';
    } else if (solicitud.tipoSolicitud === 'identificado') {
        tipoSolicitud = 'Solicitud Identificada';
    } else if (solicitud.tipoSolicitud === 'informacion') {
        tipoSolicitud = 'Solicitud de Información';
    }
    
    const prioridadColor = COLORES_PRIORIDAD[prioridad] || COLORES_PRIORIDAD.baja;
    
    return `
        <div class="modal-overlay temp-modal" id="solicitud-detail-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="closeModal('solicitud-detail-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-file-alt"></i> Detalle de Solicitud</h2>
                    
                    <div class="solicitud-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                            <div>
                                <h3 style="margin: 0; color: var(--primary-blue);">
                                    ${tipoSolicitud}
                                </h3>
                                <p style="margin: 4px 0; font-weight: 500;">ID: ${solicitud.id}</p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <span class="priority-badge ${prioridad}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold; color: white; background-color: ${prioridadColor};">
                                    ${prioridad.toUpperCase()}
                                </span>
                                <span class="status-badge ${estado}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                                    ${estado.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Datos Personales</h4>
                                <div style="font-size: 14px; line-height: 1.6;">
                                    ${solicitud.nombre ? `<div><strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos || ''}</div>` : ''}
                                    ${solicitud.rut ? `<div><strong>RUT:</strong> ${solicitud.rut}</div>` : ''}
                                    ${solicitud.email ? `<div><strong>Email:</strong> ${solicitud.email}</div>` : ''}
                                    ${solicitud.telefono ? `<div><strong>Teléfono:</strong> ${solicitud.telefono}</div>` : ''}
                                    ${solicitud.edad ? `<div><strong>Edad:</strong> ${solicitud.edad} años</div>` : ''}
                                    ${solicitud.direccion ? `<div><strong>Dirección:</strong> ${solicitud.direccion}</div>` : ''}
                                </div>
                            </div>
                            
                            <div>
                                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Información de Solicitud</h4>
                                <div style="font-size: 14px; line-height: 1.6;">
                                    <div><strong>CESFAM:</strong> ${solicitud.cesfam || 'No especificado'}</div>
                                    <div><strong>Fecha:</strong> ${fecha}</div>
                                    <div><strong>Origen:</strong> ${solicitud.origen || 'Web pública'}</div>
                                    ${solicitud.paraMi ? `<div><strong>Para:</strong> ${solicitud.paraMi === 'si' ? 'Sí mismo' : 'Otra persona'}</div>` : ''}
                                    ${solicitud.urgencia ? `<div><strong>Urgencia:</strong> ${solicitud.urgencia.toUpperCase()}</div>` : ''}
                                    ${solicitud.motivacion ? `<div><strong>Motivación:</strong> ${solicitud.motivacion}/10</div>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${solicitud.sustancias && solicitud.sustancias.length > 0 ? 
                            `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias Problemáticas</h4>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${solicitud.sustancias.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                                </div>
                            </div>` : ''
                        }
                        
                        ${solicitud.descripcion || solicitud.motivo ? 
                            `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                                <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Descripción/Motivo</h4>
                                <p style="margin: 0; background: rgba(255,255,255,0.7); padding: 12px; border-radius: 6px; line-height: 1.5;">
                                    ${solicitud.descripcion || solicitud.motivo}
                                </p>
                            </div>` : ''
                        }
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" onclick="closeModal('solicitud-detail-modal')">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Muestra detalle de solicitud por ID
 */
function mostrarDetalleSolicitudPorId(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (solicitud) {
            mostrarDetalleSolicitud(solicitud);
        } else {
            mostrarNotificacion('Solicitud no encontrada', 'error');
        }
    } catch (error) {
        console.error('Error mostrando detalle de solicitud por ID:', error);
    }
}

/**
 * Actualiza el estado de una solicitud
 */
async function actualizarEstadoSolicitud(solicitudId, nuevoEstado, datosAdicionales = {}) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (!solicitud) {
            throw new Error('Solicitud no encontrada');
        }

        let coleccion = 'solicitudes_ingreso';
        
        if (solicitud.tipo === 'reingreso') {
            coleccion = 'reingresos';
        } else if (solicitud.tipo === 'informacion') {
            coleccion = 'solicitudes_informacion';
        }

        const updateData = {
            estado: nuevoEstado,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
            ...datosAdicionales
        };

        await db.collection(coleccion).doc(solicitudId).update(updateData);

        // Actualizar datos locales
        const index = solicitudesData.findIndex(s => s.id === solicitudId);
        if (index !== -1) {
            solicitudesData[index] = { ...solicitudesData[index], ...updateData };
        }

        console.log(`Estado de solicitud ${solicitudId} actualizado a '${nuevoEstado}'`);
        
        // Refrescar vista
        filtrarSolicitudes();
        
        return true;
    } catch (error) {
        console.error('Error actualizando estado de solicitud:', error);
        throw error;
    }
}

/**
 * Obtiene las solicitudes actuales
 */
function obtenerSolicitudes() {
    return solicitudesData;
}

/**
 * Limpia los datos de solicitudes
 */
function limpiarSolicitudes() {
    solicitudesData = [];
    filtroActual = 'todas';
    filtroPrioridadActual = '';
}

// Funciones para ser llamadas desde el HTML/otros módulos
window.mostrarDetalleSolicitudPorId = mostrarDetalleSolicitudPorId;
window.mostrarModalResponder = function(solicitudId) {
    // Esta función debe ser implementada en el módulo de respuestas
    console.log('Abrir modal responder para solicitud:', solicitudId);
};
window.mostrarModalAgendaDesdeSolicitud = function(solicitudId) {
    // Esta función debe ser implementada en el módulo de calendario
    console.log('Abrir modal agenda para solicitud:', solicitudId);
};
window.manejarCasoUrgente = function(solicitudId) {
    mostrarNotificacion('Caso urgente identificado. Se notificará al coordinador.', 'warning');
    console.log('Caso urgente identificado:', solicitudId);
};

export {
    inicializarGestorSolicitudes,
    cargarSolicitudes,
    filtrarSolicitudes,
    actualizarEstadoSolicitud,
    obtenerSolicitudes,
    limpiarSolicitudes,
    mostrarDetalleSolicitud,
    mostrarDetalleSolicitudPorId
};
