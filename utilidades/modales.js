// ==== FUNCIONES GLOBALES PARA MODALES ====
function showModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}
window.showModal = showModal;

function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}
window.closeModal = closeModal;

document.addEventListener("DOMContentLoaded", function() {
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


function showDetalleSolicitudModal(solicitud) {
    document.getElementById('modal-detalle-nombre').textContent = solicitud.nombre || '';
    document.getElementById('modal-detalle-rut').textContent = solicitud.rut || '';
    // ... otros campos
    document.getElementById('modal-detalle').style.display = 'flex';
}

function showEditarSolicitudModal(solicitud) {
    document.getElementById('modal-editar-nombre').value = solicitud.nombre || '';
    // ... otros campos
    document.getElementById('modal-editar').style.display = 'flex';
}

function showResponderSolicitudModal(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email || '';
    document.getElementById('modal-responder-nombre').textContent = nombre || '';
    document.getElementById('modal-responder-id').value = solicitudId || '';
    document.getElementById('modal-responder').style.display = 'flex';
}

window.showDetalleSolicitudModal = showDetalleSolicitudModal;
window.showEditarSolicitudModal = showEditarSolicitudModal;
window.showResponderSolicitudModal = showResponderSolicitudModal;
