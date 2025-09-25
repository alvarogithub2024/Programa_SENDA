// UTILIDADES/MODALES.JS

// Abre un modal por ID
function showModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Bloquear scroll fondo
    }
}

// Cierra un modal por ID
function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// Cierra todos los modales con clase .modal-overlay
function closeAllModals() {
    var modales = document.querySelectorAll('.modal-overlay');
    modales.forEach(function(modal) {
        modal.style.display = 'none';
    });
    document.body.style.overflow = '';
}

// Permitir cerrar modal haciendo click en overlay (fondo)
document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Permitir cerrar modal con tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape") {
        closeAllModals();
    }
});

// Exportar globalmente
window.showModal = showModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
