function showNotification(mensaje, tipo, duracion) {
    tipo = tipo || 'info';
    duracion = duracion || 3000;

    var contenedor = document.getElementById('notificaciones-contenedor');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notificaciones-contenedor';
        contenedor.style.position = 'fixed';
        contenedor.style.top = '20px';
        contenedor.style.right = '20px';
        contenedor.style.zIndex = '99999';
        contenedor.style.display = 'flex';
        contenedor.style.flexDirection = 'column';
        contenedor.style.gap = '12px';
        document.body.appendChild(contenedor);
    }

    var notificacion = document.createElement('div');
    notificacion.className = 'notificacion ' + tipo;
    notificacion.style.background = ({
        info: '#2563eb',
        success: '#16a34a',
        warning: '#f59e42',
        error: '#ef4444'
    })[tipo] || '#2563eb';
    notificacion.style.color = 'white';
    notificacion.style.padding = '16px 24px';
    notificacion.style.borderRadius = '6px';
    notificacion.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    notificacion.style.fontSize = '1rem';
    notificacion.style.display = 'flex';
    notificacion.style.alignItems = 'center';
    notificacion.style.gap = '12px';
    notificacion.style.opacity = '0.98';
    notificacion.style.cursor = 'pointer';
    notificacion.innerHTML = `
        <span style="font-size:1.3em;">
            ${
                tipo === 'success' ? '✅' :
                tipo === 'warning' ? '⚠️' :
                tipo === 'error' ? '❌' :
                'ℹ️'
            }
        </span>
        <span>${mensaje}</span>
    `;

    notificacion.onclick = function() {
        contenedor.removeChild(notificacion);
    };

    contenedor.appendChild(notificacion);

    setTimeout(function() {
        if (contenedor.contains(notificacion)) {
            contenedor.removeChild(notificacion);
        }
    }, duracion);
}
// Agregar al inicio de utilidades/notificaciones.js para evitar errores de logger
function initializeLogger() {
    // Evitar errores de logger si no está disponible
    if (typeof logger === 'undefined') {
        window.logger = {
            info: function(msg) { console.log('ℹ️', msg); },
            warn: function(msg) { console.warn('⚠️', msg); },
            error: function(msg) { console.error('❌', msg); },
            debug: function(msg) { console.log('🐛', msg); }
        };
    }
}

// Función mejorada de notificaciones que no depende de logger externo
function showNotificationSafe(mensaje, tipo, duracion) {
    try {
        if (window.showNotification) {
            window.showNotification(mensaje, tipo, duracion);
        } else {
            // Fallback si showNotification no está disponible
            console.log(`${tipo?.toUpperCase() || 'INFO'}: ${mensaje}`);
            alert(mensaje);
        }
    } catch (error) {
        console.error('Error mostrando notificación:', error);
        alert(mensaje);
    }
}

initializeLogger();

window.showNotificationSafe = showNotificationSafe;
window.initializeLogger = initializeLogger;
window.showNotification = showNotification;
