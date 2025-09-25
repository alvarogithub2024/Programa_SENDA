// autenticacion/sesion.js

document.addEventListener("DOMContentLoaded", function() {
  var btnLogin = document.getElementById('login-professional');
  var btnLogout = document.getElementById('logout-professional');
  var profHeader = document.getElementById('professional-header');
  var profContent = document.getElementById('professional-content');
  var pubContent = document.getElementById('public-content');

  // Escucha el estado de autenticación de Firebase
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Usuario autenticado: mostrar zona profesional
      if (btnLogin) btnLogin.style.display = 'none';
      if (profHeader) profHeader.style.display = '';
      if (profContent) profContent.style.display = '';
      if (pubContent) pubContent.style.display = 'none';

      // Cargar datos del profesional para el header
      const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
      db.collection('profesionales').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const profesional = doc.data();
          document.getElementById('professional-name').textContent = profesional.nombre + ' ' + profesional.apellidos;
          document.getElementById('professional-profession').textContent = profesional.profession || '';
          document.getElementById('professional-cesfam').textContent = profesional.cesfam || '';
        }
      });
    } else {
      // Usuario no autenticado: mostrar solo la zona pública
      if (btnLogin) btnLogin.style.display = '';
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
      }).catch(function(error) {
        window.showNotification && window.showNotification('Error al cerrar sesión: ' + error.message, 'error');
      });
    });
  }
});
document.addEventListener("DOMContentLoaded", function() {
  var btnLogin = document.getElementById('login-professional');
  var btnLogout = document.getElementById('logout-professional');
  var profHeader = document.getElementById('professional-header');
  var profContent = document.getElementById('professional-content');
  var pubContent = document.getElementById('public-content');

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Usuario autenticado: mostrar zona profesional, ocultar pública
      if (btnLogin) btnLogin.style.display = 'none';
      if (profHeader) profHeader.style.display = '';
      if (profContent) profContent.style.display = '';
      if (pubContent) pubContent.style.display = 'none';

      // Cargar datos del profesional para el header siempre, incluso tras refresco
      const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
      db.collection('profesionales').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const profesional = doc.data();
          document.getElementById('professional-name').textContent = profesional.nombre + ' ' + profesional.apellidos;
          document.getElementById('professional-profession').textContent = profesional.profession || '';
          document.getElementById('professional-cesfam').textContent = profesional.cesfam || '';
        }
      });

    } else {
      // Usuario NO autenticado: mostrar solo la zona pública
      if (btnLogin) btnLogin.style.display = '';
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
      }).catch(function(error) {
        window.showNotification && window.showNotification('Error al cerrar sesión: ' + error.message, 'error');
      });
    });
  }
});
