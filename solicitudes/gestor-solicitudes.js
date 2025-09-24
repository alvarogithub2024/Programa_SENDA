/**
 * GESTOR DE SOLICITUDES
 * Maneja la carga, visualización y gestión de solicitudes de ingreso
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual, tieneAccesoSolicitudes } from '../autenticacion/sesion.js';
import { APP_CONFIG, COLORES_PRIORIDAD, ICONOS_ESTADO } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha, truncarTexto } from '../utilidades/formato.js';
import { establecerCache, obtenerCache } from '../utilidades/cache.js';

let db;
let solicitudesData = [];
let filtroActual = 'todas';
let filtroPrioridadActual = '';

/**
 * Inicializa el gestor de solicitudes
 */
function inicializarGestorSolicitudes() {
    try {
        db = obtenerFirestore();
        configurarFiltrosSolicitudes();
        console.log('✅ Gestor de solicitudes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando gestor de solicitudes:', error);
        throw error;
    }
}

/**
 * Configura los filtros de solicitudes
 */
function configurarFiltrosSolicitudes() {
    const filtroEstado = document.getElementById('status-filter');
    const filtroPrioridad = document.getElementById('priority-filter');

    if (filtroEstado) {
        filtroEstado.addEventListener('change', (e) => {
            filtroActual = e.target.value;
            filtrarSolicitudes();
        });
    }

    if (filtroPrioridad) {
        filtroPrioridad.addEventListener('change', (e) => {
            filtroPrioridadActual = e.target.value;
            filtrarSolicitudes();
        });
    }
}

/**
 * Carga las solicitudes desde Firestore
 */
async function cargarSolicitudes() {
    const userData = obtenerDatosUsuarioActual();
    
    if (!userData || !tieneAccesoSolicitudes()) {
        console.log('Usuario no tiene acceso a solicitudes');
        return;
    }

    try {
        mostrarCarga(true, 'Cargando solicitudes...');
        
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }

        // Verificar cache
        const cacheKey = `solicitudes_${userData.cesfam}`;
        const datosCacheados = obtenerCache(cacheKey);
        
        if (datosCacheados) {
            solicitudesData = datosCacheados;
            renderizarSolicitudes(solicitudesData);
            return;
        }

        await cargarSolicitudesDesdeFirestore();
        
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        renderizarErrorSolicitudes(error);
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Carga solicitudes directamente desde Firestore
 */
async function cargarSolicitudesDesdeFirestore() {
    const userData = obtenerDatosUsuarioActual();
    const solicitudes = [];

    console.log('Cargando solicitudes para CESFAM:', userData.cesfam);

    try {
        // Cargar solicitudes de ingreso
        const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();

        console.log('Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);

        solicitudesSnapshot.forEach(doc => {
            solicitudes.push({
                id: doc.id,
                tipo: 'solicitud',
                ...doc.data()
            });
        });

        // Cargar reingresos
        const reingresosSnapshot = await db.collection('reingresos')
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();

        console.log('Reingresos encontrados:', reingresosSnapshot.size);

        reingresosSnapshot.forEach(doc => {
            solicitudes.push({
                id: doc.id,
                tipo: 'reingreso',
                ...doc.data()
            });
        });

        // Cargar solicitudes de información (solo para asistentes sociales)
        if (userData.profession === 'asistente_social') {
            const informacionSnapshot = await db.collection('solicitudes_informacion')
                .orderBy('fechaCreacion', 'desc')
                .limit(50)
                .get();

            console.log('Solicitudes información encontradas:', informacionSnapshot.size);

            informacionSnapshot.forEach(doc => {
                solicitudes.push({
                    id: doc.id,
                    tipo: 'informacion',
                    tipoSolicitud: 'informacion',
                    ...doc.data()
                });
            });
        }

    } catch (error) {
        console.error('Error cargando desde Firestore:', error);
        throw error;
    }

    // Ordenar por fecha
    solicitudes.sort((a, b) => {
        const fechaA = a.fechaCreacion?.toDate() || new Date(0);
        const fechaB = b.fechaCreacion?.toDate() || new Date(0);
        return fechaB - fechaA;
    });

    console.log('Total solicitudes procesadas:', solicitudes.length);

    solicitudesData = solicitudes;

    // Cachear datos
    const cacheKey = `solicitudes_${userData.cesfam}`;
    establecerCache(cacheKey, solicitudes);

    renderizarSolicitudes(solicitudes);
}

/**
 * Renderiza las solicitudes en la interfaz
 */
function renderizarSolicitudes(solicitudes) {
    try {
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }

        console.log('Renderizando solicitudes:', solicitudes.length);

        if (solicitudes.length === 0) {
            container.innerHTML = crearMensajeSinSolicitudes();
            return;
        }

        container.innerHTML = solicitudes.map(solicitud => crearTarjetaSolicitud(solicitud)).join('');

        // Agregar event listeners
        agregarEventListenersTarjetas(container);

        console.log(`Renderizadas ${solicitudes.length} solicitudes`);
    } catch (error) {
        console.error('Error renderizando solicitudes:', error);
    }
}

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

        const responderBtn = (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') ? 
            `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); mostrarModalRespuesta('${solicitud.id}')" title="Responder solicitud de información">
                <i class="fas fa-reply"></i>
                Responder
            </button>` : '';

        return `
            <div class="request-card" data-id="${solicitud.id}" style="transition: all 0.2s ease; cursor: pointer;">
                <div class="request-header">
                    <div class="request-info">
                        <h3>
                            <i class="fas ${tipoIcon}" style="margin-right: 8px; color: var(--primary-blue);"></i>
                            ${titulo}
                        </h3>
                        <p style="color: var(--gray-600);">${subtitulo}</p>
                    </div>
                    <div class="request-meta">
                        <span class="priority-badge ${prioridad}" style="background-color: ${COLORES_PRIORIDAD[prioridad]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
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
                                <i class="fas ${ICONOS_ESTADO[estado] || 'fa-circle'}"></i>
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
                        `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); mostrarModalAgenda('${solicitud.id}')" title="Agendar cita">
                            <i class="fas fa-calendar-plus"></i>
                            Agendar
                        </button>` : ''
                    }
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); mostrarDetalleSolicitud('${solicitud.id}')" title="Ver detalles completos">
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
        return crearTarjetaError();
    }
}

/**
 * Crea una tarjeta de error
 */
function crearTarjetaError() {
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

/**
 * Crea mensaje cuando no hay solicitudes
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
 * Agrega event listeners a las tarjetas
 */
function agregarEventListenersTarjetas(container) {
    const tarjetas = container.querySelectorAll('.request-card');
    
    tarjetas.forEach(tarjeta => {
        tarjeta.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            
            const solicitudId = tarjeta.dataset.id;
            const solicitud = solicitudesData.find(s => s.id === solicitudId);
            if (solicitud) {
                mostrarDetalleSolicitud(solicitudId);
            }
        });
    });
}

/**
 * Filtra las solicitudes según los criterios seleccionados
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
 * Renderiza error al cargar solicitudes
 */
function renderizarErrorSolicitudes(error) {
    const container = document.getElementById('requests-container');
    if (!container) return;
    
    let mensajeError = 'Error al cargar solicitudes';
    let detallesError = '';
    
    if (error.code === 'permission-denied') {
        mensajeError = 'Sin permisos de acceso';
        detallesError = 'No tienes permisos para ver las solicitudes de este CESFAM';
    } else if (error.code === 'unavailable') {
        mensajeError = 'Servicio no disponible';
        detallesError = 'El servicio está temporalmente no disponible';
    } else {
        detallesError = error.message;
    }
    
    container.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
            <h3>${mensajeError}</h3>
            <p>${detallesError}</p>
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
 * Muestra el detalle de una solicitud específica
 */
function mostrarDetalleSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) {
        mostrarNotificacion('Solicitud no encontrada', 'error');
        return;
    }

    // Crear modal temporal con detalles
    import('../utilidades/modales.js')
        .then(modulo => {
            const modalId = modulo.crearModalTemporal(crearHTMLDetalleSolicitud(solicitud));
            modulo.mostrarModal(modalId);
        })
        .catch(error => console.error('Error creando modal de detalle:', error));
}

/**
 * Crea el HTML para el detalle de solicitud
 */
function crearHTMLDetalleSolicitud(solicitud) {
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
    
    return `
        <div class="modal">
            <button class="modal-close" onclick="closeModal(this.closest('.modal-overlay').id)">
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
                            <span class="priority-badge ${prioridad}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold; color: white; background-color: ${COLORES_PRIORIDAD[prioridad]};">
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
                    <button class="btn btn-outline" onclick="closeModal(this.closest('.modal-overlay').id)">
                        <i class="fas fa-times"></i>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Actualiza el estado de una solicitud
 */
async function actualizarEstadoSolicitud(solicitudId, nuevoEstado) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (!solicitud) return;

        let coleccion = 'solicitudes_ingreso';
        if (solicitud.tipo === 'reingreso') {
            coleccion = 'reingresos';
        } else if (solicitud.tipo === 'informacion') {
            coleccion = 'solicitudes_informacion';
        }

        await db.collection(coleccion).doc(solicitudId).update({
            estado: nuevoEstado,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar en memoria
        solicitud.estado = nuevoEstado;
        
        // Re-renderizar
        filtrarSolicitudes();
        
        mostrarNotificacion('Estado actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error actualizando estado:', error);
        mostrarNotificacion('Error al actualizar estado', 'error');
    }
}

// Funciones globales para los botones de las tarjetas
window.mostrarDetalleSolicitud = mostrarDetalleSolicitud;
window.mostrarModalRespuesta = function(solicitudId) {
    import('./respuestas.js')
        .then(modulo => modulo.mostrarModalRespuesta(solicitudId))
        .catch(error => console.error('Error cargando módulo de respuestas:', error));
};

window.mostrarModalAgenda = function(solicitudId) {
    import('../calendario/citas.js')
        .then(modulo => modulo.mostrarModalAgendaDesdeSolicitud(solicitudId))
        .catch(error => console.error('Error cargando módulo de citas:', error));
};

window.manejarCasoUrgente = function(solicitudId) {
    mostrarNotificacion('Caso urgente identificado. Se notificará al coordinador.', 'warning');
    console.log('Caso urgente identificado:', solicitudId);
};

export {
    inicializarGestorSolicitudes,
    cargarSolicitudes,
    filtrarSolicitudes,
    mostrarDetalleSolicitud,
    actualizarEstadoSolicitud
};
