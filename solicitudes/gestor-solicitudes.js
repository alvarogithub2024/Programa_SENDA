/**
 * SOLICITUDES/GESTOR-SOLICITUDES.JS
 * Gestión principal de solicitudes de ingreso y reingreso
 */

import { getFirestore } from '../configuracion/firebase.js';
import { getCurrentUserData, getCurrentUser } from '../autenticacion/sesion.js';
import { showNotification, showLoading } from '../utilidades/notificaciones.js';
import { getCachedData, setCachedData } from '../utilidades/cache.js';
import { retryOperation } from '../utilidades/validaciones.js';
import { closeModal, resetForm } from '../utilidades/modales.js';
import { APP_CONFIG } from '../configuracion/constantes.js';

let solicitudesData = [];
let solicitudesInformacionData = [];

/**
 * Carga todas las solicitudes para el CESFAM del usuario
 */
export async function loadSolicitudes() {
    const currentUserData = getCurrentUserData();
    
    if (!currentUserData || !hasAccessToSolicitudes()) {
        console.log('Usuario no tiene acceso a solicitudes');
        return;
    }

    try {
        showLoading(true, 'Cargando solicitudes...');
        
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }
        
        // Limpiar cache para forzar recarga
        const cacheKey = `solicitudes_${currentUserData.cesfam}`;
        setCachedData(cacheKey, null);
        
        await loadSolicitudesFromFirestore(true);
        
    } catch (error) {
        console.error('Error general cargando solicitudes:', error);
        renderSolicitudesError(error);
    } finally {
        showLoading(false);
    }
}

/**
 * Carga solicitudes directamente desde Firestore
 * @param {boolean} showLoadingIndicator - Mostrar indicador de carga
 */
async function loadSolicitudesFromFirestore(showLoadingIndicator = true) {
    const currentUserData = getCurrentUserData();
    const db = getFirestore();
    
    try {
        if (showLoadingIndicator) {
            const container = document.getElementById('requests-container');
            if (container) {
                container.innerHTML = `
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando solicitudes...
                    </div>
                `;
            }
        }
        
        const solicitudes = [];
        
        console.log('Cargando solicitudes para CESFAM:', currentUserData.cesfam);
        
        // Cargar solicitudes de ingreso
        try {
            const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
                .where('cesfam', '==', currentUserData.cesfam)
                .orderBy('fechaCreacion', 'desc')
                .limit(APP_CONFIG.PAGINATION_LIMIT)
                .get();
            
            console.log('Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);
            
            solicitudesSnapshot.forEach(doc => {
                const data = doc.data();
                solicitudes.push({
                    id: doc.id,
                    tipo: 'solicitud',
                    ...data
                });
            });
            
        } catch (error) {
            console.error('Error cargando solicitudes_ingreso:', error);
            if (error.code !== 'permission-denied') {
                throw error;
            }
        }
        
        // Cargar reingresos
        try {
            const reingresosSnapshot = await db.collection('reingresos')
                .where('cesfam', '==', currentUserData.cesfam)
                .orderBy('fechaCreacion', 'desc')
                .limit(APP_CONFIG.PAGINATION_LIMIT)
                .get();
            
            console.log('Reingresos encontrados:', reingresosSnapshot.size);
            
            reingresosSnapshot.forEach(doc => {
                const data = doc.data();
                solicitudes.push({
                    id: doc.id,
                    tipo: 'reingreso',
                    ...data
                });
            });
            
        } catch (error) {
            console.error('Error cargando reingresos:', error);
            if (error.code !== 'permission-denied') {
                throw error;
            }
        }
        
        // Cargar solicitudes de información
        try {
            const informacionSnapshot = await db.collection('solicitudes_informacion')
                .orderBy('fechaCreacion', 'desc')
                .limit(50)
                .get();
            
            console.log('Solicitudes información encontradas:', informacionSnapshot.size);
            
            informacionSnapshot.forEach(doc => {
                const data = doc.data();
                solicitudes.push({
                    id: doc.id,
                    tipo: 'informacion',
                    tipoSolicitud: 'informacion',
                    ...data
                });
            });
            
        } catch (error) {
            console.error('Error cargando solicitudes_informacion:', error);
            if (error.code !== 'permission-denied') {
                throw error;
            }
        }
        
        // Ordenar por fecha
        solicitudes.sort((a, b) => {
            const fechaA = a.fechaCreacion?.toDate() || new Date(0);
            const fechaB = b.fechaCreacion?.toDate() || new Date(0);
            return fechaB - fechaA;
        });
        
        console.log('Total solicitudes procesadas:', solicitudes.length);
        
        solicitudesData = solicitudes;
        
        const cacheKey = `solicitudes_${currentUserData.cesfam}`;
        setCachedData(cacheKey, solicitudes);
        
        renderSolicitudes(solicitudes);
        
    } catch (error) {
        console.error('Error cargando desde Firestore:', error);
        renderSolicitudesError(error);
    }
}

/**
 * Renderiza las solicitudes en la interfaz
 * @param {Array} solicitudes - Array de solicitudes
 */
function renderSolicitudes(solicitudes) {
    try {
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }

        console.log('Renderizando solicitudes:', solicitudes.length);

        if (solicitudes.length === 0) {
            const currentUserData = getCurrentUserData();
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-inbox"></i>
                    <h3>No hay solicitudes</h3>
                    <p>No se encontraron solicitudes para tu CESFAM: ${currentUserData?.cesfam || 'N/A'}</p>
                    <button class="btn btn-primary mt-4" onclick="window.loadSolicitudes()">
                        <i class="fas fa-redo"></i>
                        Actualizar
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = solicitudes.map(solicitud => createSolicitudCard(solicitud)).join('');

        // Agregar event listeners
        container.querySelectorAll('.request-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                
                const solicitudId = card.dataset.id;
                const solicitud = solicitudes.find(s => s.id === solicitudId);
                if (solicitud) {
                    showSolicitudDetail(solicitud);
                }
            });
        });
        
        console.log(`Renderizadas ${solicitudes.length} solicitudes`);
    } catch (error) {
        console.error('Error renderizando solicitudes:', error);
    }
}

/**
 * Crea una tarjeta HTML para una solicitud
 * @param {Object} solicitud - Datos de la solicitud
 * @returns {string} HTML de la tarjeta
 */
function createSolicitudCard(solicitud) {
    try {
        const fecha = formatDate(solicitud.fechaCreacion);
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

        const prioridadColor = getPriorityColor(prioridad);
        const estadoIcon = getStatusIcon(estado);

        const responderBtn = (solicitud.tipo === 'informacion' || solicitud.tipoSolicitud === 'informacion') ? 
            `<button class="btn btn-success btn-sm" onclick="event.stopPropagation(); window.showResponderModal('${solicitud.id}')" title="Responder solicitud de información">
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
                        ${getTypeBadge(solicitud)}
                    </div>
                </div>
                
                <div class="request-body">
                    ${sustanciasHtml ? `<div class="request-substances" style="margin-bottom: 8px;">${sustanciasHtml}</div>` : ''}
                    ${getDescription(solicitud)}
                    ${getRequestDetails(solicitud, fecha, estado, estadoIcon)}
                </div>
                
                <div class="request-actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
                    ${responderBtn}
                    ${getActionButtons(solicitud)}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creando tarjeta de solicitud:', error);
        return createErrorCard();
    }
}

/**
 * Maneja el envío del formulario de pacientes
 * @param {Event} e - Evento de envío
 */
export async function handlePatientFormSubmit(e) {
    e.preventDefault();
    console.log('Iniciando envío de solicitud...');
    
    const submitBtn = document.getElementById('submit-form');
    
    try {
        const solicitudData = collectFormDataSafe();
        console.log('Datos recopilados:', solicitudData);
        
        solicitudData.prioridad = calculatePriority(solicitudData);
        console.log('Prioridad calculada:', solicitudData.prioridad);
        
        const db = getFirestore();
        if (!db) {
            throw new Error('No hay conexión a Firebase');
        }
        
        console.log('Guardando en Firestore...');
        
        const docRef = await retryOperation(async () => {
            return await db.collection('solicitudes_ingreso').add(solicitudData);
        });
        
        console.log('Solicitud guardada con ID:', docRef.id);
        
        if (solicitudData.prioridad === 'critica') {
            try {
                await createCriticalAlert(solicitudData, docRef.id);
                console.log('Alerta crítica creada');
            } catch (alertError) {
                console.warn('Error creando alerta crítica:', alertError);
            }
        }
        
        localStorage.removeItem('senda_form_draft');
        closeModal('patient-modal');
        resetForm();
        
        showNotification('Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.', 'success', 6000);
        console.log('Proceso completado exitosamente');
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        
        const errorMessage = getSubmitErrorMessage(error);
        showNotification(errorMessage, 'error', 8000);
    }
}

/**
 * Maneja el envío de solicitudes de información únicamente
 */
export async function handleInformationOnlySubmit() {
    try {
        console.log('Procesando solicitud de información únicamente...');
        
        const email = document.getElementById('info-email')?.value?.trim();
        
        if (!email || !isValidEmail(email)) {
            showNotification('Email inválido', 'error');
            return;
        }
        
        const informationData = {
            tipoSolicitud: 'informacion',
            email: email,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'pendiente_respuesta',
            origen: 'web_publica',
            prioridad: 'baja',
            identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        console.log('Guardando solicitud de información...');
        
        const db = getFirestore();
        await db.collection('solicitudes_informacion').add(informationData);
        
        localStorage.removeItem('senda_form_draft');
        closeModal('patient-modal');
        resetForm();
        
        showNotification('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 'success', 6000);
        
    } catch (error) {
        console.error('Error enviando información:', error);
        showNotification('Error al enviar la solicitud: ' + error.message, 'error');
    }
}

// Funciones auxiliares
function hasAccessToSolicitudes() {
    const currentUserData = getCurrentUserData();
    return currentUserData && currentUserData.profession === 'asistente_social';
}

function formatDate(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
}

function getPriorityColor(prioridad) {
    const colors = {
        'critica': '#ef4444',
        'alta': '#f59e0b',
        'media': '#3b82f6',
        'baja': '#10b981'
    };
    return colors[prioridad] || '#6b7280';
}

function getStatusIcon(estado) {
    const icons = {
        'pendiente': 'fa-clock',
        'en_proceso': 'fa-spinner',
        'agendada': 'fa-calendar-check',
        'completada': 'fa-check-circle',
        'pendiente_respuesta': 'fa-reply'
    };
    return icons[estado] || 'fa-circle';
}

function collectFormDataSafe() {
    // Implementación de recolección de datos del formulario
    // Esta función necesitaría ser completamente implementada
    return {};
}

function calculatePriority(solicitudData) {
    // Implementación del cálculo de prioridad
    return 'media';
}

function createCriticalAlert(solicitudData, solicitudId) {
    // Implementación de creación de alerta crítica
    return Promise.resolve();
}

function isValidEmail(email) {
    try {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    } catch (error) {
        console.error('Error validating email:', error);
        return false;
    }
}

function getSubmitErrorMessage(error) {
    let errorMessage = 'Error al enviar la solicitud: ';
    
    if (error.code === 'permission-denied') {
        errorMessage += 'Sin permisos para crear solicitudes. Verifica las reglas de Firebase.';
    } else if (error.code === 'network-request-failed') {
        errorMessage += 'Problema de conexión. Verifica tu internet.';
    } else if (error.code === 'unavailable') {
        errorMessage += 'Servicio no disponible temporalmente.';
    } else if (error.message && error.message.includes('Firebase')) {
        errorMessage += 'Error de configuración de Firebase.';
    } else {
        errorMessage += error.message || 'Intenta nuevamente en unos momentos.';
    }
    
    return errorMessage;
}

// Funciones placeholder para las funciones auxiliares de UI
function renderSolicitudesError(error) {
    console.error('Error rendering solicitudes:', error);
}

function showSolicitudDetail(solicitud) {
    console.log('Showing solicitud detail:', solicitud);
}

function getTypeBadge(solicitud) {
    return '';
}

function getDescription(solicitud) {
    return '';
}

function getRequestDetails(solicitud, fecha, estado, estadoIcon) {
    return '';
}

function getActionButtons(solicitud) {
    return '';
}

function createErrorCard() {
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

// Exportar funciones para uso global
window.loadSolicitudes = loadSolicitudes;
