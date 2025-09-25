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

// Abrir modal de login
document.addEventListener("DOMContentLoaded", function() {
  var btnLogin = document.getElementById("login-professional");
  if (btnLogin) {
    btnLogin.addEventListener("click", function() {
      if (typeof showModal === "function") {
        showModal('login-modal');
      } else {
        var modal = document.getElementById('login-modal');
        if (modal) modal.style.display = "flex";
      }
    });
  }
});

    // Botón "Acceso Profesionales"
 var btnLogin = document.getElementById('login-modal').style.display
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
