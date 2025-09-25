firebase.auth().onAuthStateChanged(function(user) {
  var btnLogin = document.getElementById('login-professional');
  var btnLogout = document.getElementById('logout-professional');
  var profHeader = document.getElementById('professional-header');
  var profContent = document.getElementById('professional-content');
  var pubContent = document.getElementById('public-content');

  if (user) {
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = ''; // si tienes el botón de logout
    if (profHeader) profHeader.style.display = '';
    if (profContent) profContent.style.display = '';
    if (pubContent) pubContent.style.display = 'none';

    // Si tu sistema de tabs requiere datos del usuario:
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    db.collection('profesionales').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const profesional = doc.data();
        document.getElementById('professional-name').textContent = profesional.nombre + ' ' + profesional.apellidos;
        document.getElementById('professional-profession').textContent = profesional.profession || '';
        document.getElementById('professional-cesfam').textContent = profesional.cesfam || '';
        // Si usas setCurrentUserData para tabs:
        if (window.setCurrentUserData) window.setCurrentUserData(profesional);
      }
    });
  } else {
    if (btnLogin) btnLogin.style.display = '';
    if (btnLogout) btnLogout.style.display = 'none';
    if (profHeader) profHeader.style.display = 'none';
    if (profContent) profContent.style.display = 'none';
    if (pubContent) pubContent.style.display = '';
  }
});
