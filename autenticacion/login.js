document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      window.showNotification && window.showNotification("Completa email y contraseña", "warning");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;
        const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

        // Busca el profesional en la colección y verifica activo
        return db.collection("profesionales").doc(uid).get();
      })
      .then((doc) => {
        if (!doc.exists) {
          window.showNotification && window.showNotification("No tienes permisos de acceso como profesional.", "error");
          firebase.auth().signOut();
          return;
        }
        const profesional = doc.data();
        if (!profesional.activo) {
          window.showNotification && window.showNotification("Tu usuario está inactivo. Contacta al administrador.", "error");
          firebase.auth().signOut();
          return;
        }
        window.showNotification && window.showNotification("Bienvenido/a, acceso correcto.", "success");
        // SOLO cerrar el modal. NO manipules visibilidad aquí.
        window.closeModal && window.closeModal('login-modal');
        // El resto de la visibilidad la maneja el onAuthStateChanged.
      })
      .catch((error) => {
        window.showNotification && window.showNotification("Error al iniciar sesión: " + error.message, "error");
      });
  });
});
