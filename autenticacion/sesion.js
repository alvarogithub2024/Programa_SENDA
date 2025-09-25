// autenticacion/sesion.js

document.addEventListener("DOMContentLoaded", function() {
  var btnLogin = document.getElementById('login-professional');
  var btnLogout = document.getElementById('logout-professional');

  // Escucha el estado de autenticación de Firebase
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Usuario autenticado: ocultar botón login
      if (btnLogin) btnLogin.style.display = 'none';
    } else {
      // Usuario no autenticado: mostrar botón login
      if (btnLogin) btnLogin.style.display = '';
      // Ocultar áreas profesionales por si acaso
      var profHeader = document.getElementById('professional-header');
      var profContent = document.getElementById('professional-content');
      var pubContent = document.getElementById('public-content');
      if (profHeader) profHeader.style.display = 'none';
      if (profContent) profContent.style.display = 'none';
      if (pubContent) pubContent.style.display = '';
    }
  });

  // Botón cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', function() {
      firebase.auth().signOut().then(function() {
        window.showNotification && window.showNotification('Sesión cerrada.', 'success');
        // El listener onAuthStateChanged se encarga del resto
      }).catch(function(error) {
        window.showNotification && window.showNotification('Error al cerrar sesión: ' + error.message, 'error');
      });
    });
  }
});
