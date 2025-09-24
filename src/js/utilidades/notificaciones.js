// src/js/utilidades/notificaciones.js
const iconosNotificacion = {
  'success': 'check-circle',
  'error': 'exclamation-triangle', 
  'warning': 'exclamation-triangle',
  'info': 'info-circle'
};

export function mostrarNotificacion(mensaje, tipo = 'info', duracion = 4000) {
  try {
    const contenedor = document.getElementById('notifications') || crearContenedorNotificaciones();
    
    const notificacion = document.createElement('div');
    notificacion.className = `notification ${tipo}`;
    notificacion.innerHTML = `
      <i class="fas fa-${iconosNotificacion[tipo]}"></i> 
      <span>${mensaje}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    contenedor.appendChild(notificacion);
    
    requestAnimationFrame(() => notificacion.classList.add('show'));
    
    setTimeout(() => {
      if (notificacion.parentElement) {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 300);
      }
    }, duracion);
    
    console.log(`📢 Notificación [${tipo.toUpperCase()}]: ${mensaje}`);
    
  } catch (error) {
    console.error('Error mostrando notificación:', error);
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
  }
}

export function mostrarCarga(mostrar = true, mensaje = 'Cargando...') {
  try {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    const elementoMensaje = overlay.querySelector('p');
    if (elementoMensaje) elementoMensaje.textContent = mensaje;
    
    overlay.classList.toggle('hidden', !mostrar);
  } catch (error) {
    console.error('Error con overlay de carga:', error);
  }
}

function crearContenedorNotificaciones() {
  const contenedor = document.createElement('div');
  contenedor.id = 'notifications';
  contenedor.className = 'notifications-container';
  document.body.appendChild(contenedor);
  return contenedor;
}
