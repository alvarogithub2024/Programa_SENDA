// autenticacion/registro.js

document.addEventListener("DOMContentLoaded", function() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Tomar los valores del formulario
    const nombre = document.getElementById('register-nombre').value.trim();
    const apellidos = document.getElementById('register-apellidos').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const profession = document.getElementById('register-profession').value;
    const cesfam = document.getElementById('register-cesfam').value;

    // Validación básica
    if (!nombre || !apellidos || !email || !password || !profession || !cesfam) {
      window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
      return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
        const profesional = {
          activo: true,
          nombre: nombre,
          apellidos: apellidos,
          cesfam: cesfam,
          email: email,
          profession: profession,
          fechaCreacion: new Date().toISOString()
        };
        // Guarda en la colección profesionales (con el UID como doc ID)
        return db.collection("profesionales").doc(userCredential.user.uid).set(profesional);
      })
      .then(() => {
        window.showNotification && window.showNotification("Registro exitoso. Puedes iniciar sesión.", "success");
        registerForm.reset();
        // Cambia a la pestaña de login automáticamente
        if (typeof switchLoginTab === 'function') switchLoginTab('login');
      })
      .catch((error) => {
        window.showNotification && window.showNotification("Error al registrar: " + error.message, "error");
      });
  });
});
