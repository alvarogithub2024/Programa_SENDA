// NAVEGACION/SHORTCUTS.JS

// Atajos de teclado globales para navegación rápida

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function(e) {
        // Ctrl+1, Ctrl+2, ..., Ctrl+9 para cambiar de tab
        if (e.ctrlKey && !e.shiftKey) {
            var num = parseInt(e.key, 10);
            if (num >= 1 && num <= 9) {
                var tabs = document.querySelectorAll(".tab-btn");
                if (tabs[num - 1]) {
                    var tabId = tabs[num - 1].dataset.tab;
                    if (window.cambiarTab) {
                        window.cambiarTab(tabId);
                        e.preventDefault();
                    }
                }
            }
        }

        // Ctrl+S para guardar (si hay formulario activo)
        if (e.ctrlKey && e.key.toLowerCase() === "s") {
            var form = document.querySelector("form:visible, form.active");
            if (form) {
                form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                e.preventDefault();
            }
        }

        // Ctrl+L para cerrar sesión
        if (e.ctrlKey && e.key.toLowerCase() === "l") {
            if (window.cerrarSesion) {
                window.cerrarSesion();
                e.preventDefault();
            }
        }
    });
}

// Exportar globalmente
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
