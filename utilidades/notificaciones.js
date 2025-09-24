/**
 * SISTEMA DE NOTIFICACIONES
 * Maneja la creación y gestión de notificaciones en la interfaz
 */

import { ICONOS_NOTIFICACION, APP_CONFIG } from '../configuracion/constantes.js';

let contenedorNotificaciones = null;

/**
 * Inicializa el sistema de notificaciones
 */
function inicializarNotificaciones() {
    try {
        contenedorNotificaciones = crearContenedorNotificaciones();
        console.log('✅ Sistema de notificaciones inicializado');
    } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
    }
}

/**
 * Muestra una notificación en pantalla
 */
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 4000) {
    try {
        if (!contenedorNotificaciones) {
            contenedorNotificaciones = crearContenedorNotificaciones();
        }

        const notificacion = crearNotificacion(mensaje, tipo);
        contenedorNotificaciones.appendChild(notificacion);

        // Animación de entrada
        requestAnimationFrame(() => {
            notificacion.classList.add('show');
        });

        // Auto-eliminación
        setTimeout(() => {
            eliminarNotificacion(notificacion);
        }, duracion);

        // Log para debug
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`📢 Notificación [${tipo.toUpperCase()}]: ${mensaje}`);
        }

   catch (error) {
    console.error('Error mostrando notificación:', error);
    // Puedes mostrar un mensaje en consola, pero NO el alert
    // alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

/**
 * Crea el contenedor principal de notificaciones
 */
function crearContenedorNotificaciones() {
    let contenedor = document.getElementById('notifications');
    
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notifications';
        contenedor.className = 'notifications-container';
        document.body.appendChild(contenedor);
    }
    
    return contenedor;
}

/**
 * Crea un elemento de notificación
 */
function crearNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notification ${tipo}`;
    
    const icono = obtenerIconoNotificacion(tipo);
    
    notificacion.innerHTML = `
        <i class="fas fa-${icono}"></i>
        <span class="notification-message">${mensaje}</span>
        <button class="notification-close" aria-label="Cerrar notificación">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Event listener para botón de cierre
    const botonCerrar = notificacion.querySelector('.notification-close');
    botonCerrar.addEventListener('click', () => {
        eliminarNotificacion(notificacion);
    });

    return notificacion;
}

/**
 * Obtiene el ícono apropiado para el tipo de notificación
 */
function obtenerIconoNotificacion(tipo) {
    return ICONOS_NOTIFICACION[tipo] || ICONOS_NOTIFICACION.info;
}

/**
 * Elimina una notificación con animación
 */
function eliminarNotificacion(notificacion) {
    try {
        if (!notificacion.parentElement) return;

        notificacion.classList.remove('show');
        notificacion.classList.add('hide');

        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 300);

    } catch (error) {
        console.error('Error eliminando notificación:', error);
        // Forzar eliminación
        if (notificacion.parentElement) {
            notificacion.remove();
        }
    }
}

/**
 * Limpia todas las notificaciones
 */
function limpiarNotificaciones() {
    try {
        if (contenedorNotificaciones) {
            const notificaciones = contenedorNotificaciones.querySelectorAll('.notification');
            notificaciones.forEach(notificacion => {
                eliminarNotificacion(notificacion);
            });
        }
    } catch (error) {
        console.error('Error limpiando notificaciones:', error);
    }
}

/**
 * Muestra una notificación de éxito
 */
function mostrarExito(mensaje, duracion = 4000) {
    mostrarNotificacion(mensaje, 'success', duracion);
}

/**
 * Muestra una notificación de error
 */
function mostrarError(mensaje, duracion = 6000) {
    mostrarNotificacion(mensaje, 'error', duracion);
}

/**
 * Muestra una notificación de advertencia
 */
function mostrarAdvertencia(mensaje, duracion = 5000) {
    mostrarNotificacion(mensaje, 'warning', duracion);
}

/**
 * Muestra una notificación informativa
 */
function mostrarInfo(mensaje, duracion = 4000) {
    mostrarNotificacion(mensaje, 'info', duracion);
}

/**
 * Muestra una notificación de confirmación con callback
 */
function mostrarConfirmacion(mensaje, onConfirmar, onCancelar) {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay confirmation-modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal confirmation">
                <div class="confirmation-content">
                    <i class="fas fa-question-circle"></i>
                    <h3>Confirmación</h3>
                    <p>${mensaje}</p>
                    <div class="confirmation-buttons">
                        <button class="btn btn-outline btn-cancel">Cancelar</button>
                        <button class="btn btn-primary btn-confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const botonCancelar = modal.querySelector('.btn-cancel');
        const botonConfirmar = modal.querySelector('.btn-confirm');

        botonCancelar.addEventListener('click', () => {
            modal.remove();
            if (onCancelar) onCancelar();
        });

        botonConfirmar.addEventListener('click', () => {
            modal.remove();
            if (onConfirmar) onConfirmar();
        });

        // Cerrar con escape
        const manejarTecla = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                if (onCancelar) onCancelar();
                document.removeEventListener('keydown', manejarTecla);
            }
        };

        document.addEventListener('keydown', manejarTecla);

    } catch (error) {
        console.error('Error mostrando confirmación:', error);
        // Fallback a confirm nativo
        if (confirm(mensaje)) {
            if (onConfirmar) onConfirmar();
        } else {
            if (onCancelar) onCancelar();
        }
    }
}

export {
    inicializarNotificaciones,
    mostrarNotificacion,
    mostrarExito,
    mostrarError,
    mostrarAdvertencia,
    mostrarInfo,
    mostrarConfirmacion,
    limpiarNotificaciones
};
