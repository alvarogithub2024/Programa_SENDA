/**
 * UTILIDADES/NOTIFICACIONES.JS - VERSIÓN SIN IMPORTS
 * Sistema de notificaciones para la aplicación
 */

/**
 * Muestra una notificación al usuario
 */
window.showNotification = function(message, type = 'info', duration = 4000) {
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
        
        // Mostrar animación
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-remover después del tiempo especificado
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
        
        console.log(`📢 Notification [${type.toUpperCase()}]: ${message}`);
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback a alert si falla el sistema de notificaciones
        alert(`${type.toUpperCase()}: ${message}`);
    }
};

/**
 * Obtiene el icono para el tipo de notificación
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
 */
function createNotificationsContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

/**
 * Limpia todas las notificaciones
 */
window.clearAllNotifications = function() {
    const container = document.getElementById('notifications');
    if (container) {
        container.innerHTML = '';
    }
};

console.log('📢 Sistema de notificaciones cargado - Funciones disponibles en window');
