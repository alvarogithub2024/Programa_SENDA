// utilidades/modales.js

/**
 * Muestra un modal por ID (display:flex)
 */
function showModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
}

/**
 * Cierra un modal por ID (display:none)
 */
function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

// Exportar globalmente
window.showModal = showModal;
window.closeModal = closeModal;

// Cerrar modal al hacer click en el fondo (modal-overlay)
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.style.display = "none";
            }
        });
    });

    // Botón "Acceso Profesionales"
 var btnLogin = document.getElementById("login-professional");
if (btnLogin) {
    btnLogin.addEventListener("click", function() {
        showModal('login-modal');
    });
}

    // Botón "Solicitar Ayuda"
    var btnPaciente = document.getElementById("register-patient");
    if (btnPaciente) {
        btnPaciente.addEventListener("click", function() {
            showModal('patient-modal');
        });
    }

    // Botón "Reingreso"
    var btnReingreso = document.getElementById("reentry-program");
    if (btnReingreso) {
        btnReingreso.addEventListener("click", function() {
            showModal('reentry-modal');
        });
    }
});
