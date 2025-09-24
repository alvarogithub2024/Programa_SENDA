/**
 * UTILIDADES/NOTIFICACIONES.JS
 * Sistema de notificaciones y overlays de carga
 */

import { APP_CONFIG } from '../configuracion/constantes.js';

/**
 * Muestra una notificación al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (info, success, warning, error)
 * @param {number} duration - Duración en milisegundos
 */
export function showNotification(message, type = 'info', duration = 4000) {
    try {
        const container = document.getElementById('notifications') || createNotificationsContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i> 
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-remover después de la duración especificada
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`📢 Notification [${type.toUpperCase()}]: ${message}`);
        }
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback a alert nativo
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Obtiene el ícono apropiado para el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} Clase del ícono FontAwesome
 */
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Crea el contenedor de notificaciones si no existe
 * @returns {HTMLElement} Contenedor de notificaciones
 */
function createNotificationsContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Muestra u oculta el overlay de carga
 * @param {boolean} show - Mostrar u ocultar
 * @param {string} message - Mensaje de carga
 */
export function showLoading(show = true, message = 'Cargando...') {
    try {
        let overlay = document.getElementById('loading-overlay');
        
        // Crear overlay si no existe
        if (!overlay) {
            overlay = createLoadingOverlay();
        }
        
        const messageElement = overlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        if (show) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        } else {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error with loading overlay:', error);
    }
}

/**
 * Crea el overlay de carga si no existe
 * @returns {HTMLElement} Overlay de carga
 */
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay hidden';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Cargando...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Muestra una notificación de éxito
 * @param {string} message - Mensaje de éxito
 * @param {number} duration - Duración en milisegundos
 */
export function showSuccess(message, duration = 4000) {
    showNotification(message, 'success', duration);
}

/**
 * Muestra una notificación de error
 * @param {string} message - Mensaje de error
 * @param {number} duration - Duración en milisegundos
 */
export function showError(message, duration = 6000) {
    showNotification(message, 'error', duration);
}

/**
 * Muestra una notificación de advertencia
 * @param {string} message - Mensaje de advertencia
 * @param {number} duration - Duración en milisegundos
 */
export function showWarning(message, duration = 5000) {
    showNotification(message, 'warning', duration);
}

/**
 * Muestra una notificación de información
 * @param {string} message - Mensaje de información
 * @param {number} duration - Duración en milisegundos
 */
export function showInfo(message, duration = 4000) {
    showNotification(message, 'info', duration);
}

/**
 * Limpia todas las notificaciones activas
 */
export function clearAllNotifications() {
    try {
        const container = document.getElementById('notifications');
        if (container) {
            const notifications = container.querySelectorAll('.notification');
            notifications.forEach(notification => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            });
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

/**
 * Muestra un mensaje de confirmación
 * @param {string} message - Mensaje de confirmación
 * @param {Function} onConfirm - Callback para confirmación
 * @param {Function} onCancel - Callback para cancelación
 */
export function showConfirmation(message, onConfirm, onCancel = null) {
    try {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
    } catch (error) {
        console.error('Error showing confirmation:', error);
    }
}

/**
 * Muestra el indicador de borrador guardado
 */
export function showDraftSavedIndicator() {
    try {
        let indicator = document.getElementById('draft-saved-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'draft-saved-indicator';
            indicator.className = 'draft-saved-indicator';
            indicator.innerHTML = '<i class="fas fa-save"></i> Borrador guardado';
            document.body.appendChild(indicator);
        }
        
        // Mostrar temporalmente
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
        
    } catch (error) {
        console.error('Error showing draft saved indicator:', error);
    }
}
