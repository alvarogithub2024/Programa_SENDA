document.addEventListener("DOMContentLoaded", function() {
  // Elementos claves de la UI
  var btnLogin = document.getElementById('login-professional');
  var btnLogout = document.getElementById('logout-professional');
  var profHeader = document.getElementById('professional-header');
  var profContent = document.getElementById('professional-content');
  var pubContent = document.getElementById('public-content');

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Oculta botón login, muestra profesional
      if (btnLogin) btnLogin.style.display = 'none';
      if (btnLogout) btnLogout.style.display = '';
      if (profHeader) profHeader.style.display = '';
      if (profContent) profContent.style.display = '';
      if (pubContent) pubContent.style.display = 'none';

      // Cargar datos del profesional para el header y tabs
      const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
      db.collection('profesionales').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const profesional = doc.data();
          document.getElementById('professional-name').textContent = profesional.nombre + ' ' + profesional.apellidos;
          document.getElementById('professional-profession').textContent = profesional.profession || '';
          document.getElementById('professional-cesfam').textContent = profesional.cesfam || '';

          // Permite que el sistema de tabs conozca al usuario y active las pestañas
          if (window.setCurrentUserData) window.setCurrentUserData(profesional);
        } else {
          // Si no existe el profesional en la colección, limpia tabs
          if (window.setCurrentUserData) window.setCurrentUserData(null);
        }
      });
   
  // Botón cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', function() {
      firebase.auth().signOut().then(function() {
        window.showNotification && window.showNotification('Sesión cerrada.', 'success');
      }).catch(function(error) {
        window.showNotification && window.showNotification('Error al cerrar sesión: ' + error.message, 'error');
      });
    });
  }
});
