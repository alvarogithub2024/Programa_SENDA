// AGREGAR AL FINAL DE solicitudes/respuestas.js

// Función para enviar correo de respuesta
function enviarCorreoSenda() {
    const email = document.getElementById('modal-responder-email').value;
    const asunto = document.getElementById('modal-responder-asunto').value;
    const mensaje = document.getElementById('modal-responder-mensaje').value;
    const solicitudId = document.getElementById('modal-responder-id').value;

    if (!email || !asunto || !mensaje) {
        window.showNotification && window.showNotification('Completa todos los campos del correo', 'warning');
        return;
    }

    // Opción 1: Usar EmailJS (Recomendado)
    if (typeof emailjs !== 'undefined') {
        const templateParams = {
            to_email: email,
            subject: asunto,
            message: mensaje,
            from_name: 'SENDA Puente Alto'
        };

        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
            .then(function(response) {
                window.showNotification && window.showNotification('Correo enviado correctamente', 'success');
                marcarSolicitudComoRespondida(solicitudId);
                cerrarModalResponder();
            })
            .catch(function(error) {
                console.error('Error enviando correo:', error);
                window.showNotification && window.showNotification('Error al enviar el correo: ' + error.text, 'error');
            });
    } 
    // Opción 2: Abrir cliente de correo del usuario
    else {
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
        window.open(mailtoLink);
        
        // Marcar como respondida después de abrir el cliente
        setTimeout(function() {
            const confirmar = confirm('¿Se abrió correctamente tu cliente de correo? Presiona OK si enviaste el correo.');
            if (confirmar) {
                marcarSolicitudComoRespondida(solicitudId);
                window.showNotification && window.showNotification('Correo marcado como enviado', 'success');
                cerrarModalResponder();
            }
        }, 1000);
    }
}

// Función para marcar solicitud como respondida
function marcarSolicitudComoRespondida(solicitudId) {
    const db = window.getFirestore();
    const ahora = new Date().toISOString();
    
    db.collection('solicitudes_informacion').doc(solicitudId).update({
        estado: 'respondida',
        fechaRespuesta: ahora,
        fechaUltimaActualizacion: ahora
    })
    .then(function() {
        console.log('Solicitud marcada como respondida');
        // Recargar solicitudes si la función existe
        if (window.reloadSolicitudesFromFirebase) {
            window.reloadSolicitudesFromFirebase();
        }
    })
    .catch(function(error) {
        console.error('Error actualizando estado:', error);
    });
}

// Configurar EmailJS (opcional)
function configurarEmailJS() {
    // Agrega esto al head de tu index.html:
    // <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    
    if (typeof emailjs !== 'undefined') {
        emailjs.init('YOUR_PUBLIC_KEY'); // Reemplaza con tu clave pública de EmailJS
    }
}

// Exportar funciones globalmente
window.enviarCorreoSenda = enviarCorreoSenda;
window.marcarSolicitudComoRespondida = marcarSolicitudComoRespondida;
window.configurarEmailJS = configurarEmailJS;

// Inicializar EmailJS cuando se carga el documento
document.addEventListener('DOMContentLoaded', configurarEmailJS);
