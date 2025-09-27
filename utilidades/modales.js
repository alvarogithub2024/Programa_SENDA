
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
  var btnLogin = document.getElementById("login-professional");
  if (btnLogin) {
    btnLogin.addEventListener("click", function() {
      showModal('login-modal');
    });
  }

  var btnPaciente = document.getElementById("register-patient");
  if (btnPaciente) {
    btnPaciente.addEventListener("click", function() {
      showModal('patient-modal');
    });
  }

  var btnReingreso = document.getElementById("reentry-program");
  if (btnReingreso) {
    btnReingreso.addEventListener("click", function() {
      showModal('reentry-modal');
    });
  }
});
