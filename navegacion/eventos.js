// NAVEGACION/EVENTOS.JS

// Centraliza eventos de navegación (ejemplo: botones, menú, etc.)

function setupEventListeners() {
    // Botón logout global
    var logoutBtn = document.getElementById("logout-professional");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (window.cerrarSesion) {
                window.cerrarSesion();
            }
        });
    }

    // Botones de menú lateral
    var menuBtns = document.querySelectorAll(".menu-btn[data-tab]");
    menuBtns.forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            var tabId = btn.dataset.tab;
            if (window.cambiarTab) {
                window.cambiarTab(tabId);
            }
        });
    });

    // Acceso directo a tab de inicio al hacer click en logo
    var logo = document.getElementById("logo-senda");
    if (logo) {
        logo.addEventListener("click", function(e) {
            if (window.cambiarTab) {
                window.cambiarTab("inicio");
            }
        });
    }

   document.getElementById('cita-fecha').addEventListener('change', actualizarHoras);
document.getElementById('cita-profesional').addEventListener('change', actualizarHoras);

function actualizarHoras() {
  var fecha = document.getElementById('cita-fecha').value;
  var profesionalId = document.getElementById('cita-profesional').value;
  if (!fecha || !profesionalId) {
    mostrarHorariosDisponibles([]);
    return;
  }
  cargarHorariosDisponibles(fecha, profesionalId, mostrarHorariosDisponibles);
}
// cargarHorariosDisponibles y mostrarHorariosDisponibles deben estar implementadas como en mensajes anteriores
}

// Exportar globalmente
window.setupEventListeners = setupEventListeners;
