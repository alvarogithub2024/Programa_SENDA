window.onload = function() {
  // --- Firebase Configuración e Inicialización ---
  const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // --- MODALES (igual que antes) ---
  document.getElementById('abrir-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'flex';
  };
  document.getElementById('cerrar-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'none';
  };
  document.getElementById('modal-bg').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-modal-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-login-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
  };
  document.getElementById('modal-bg-login-profesional').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-form-ingresar').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
    document.getElementById('modal-bg-ingresar').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-ingresar').onclick = function() {
    document.getElementById('modal-bg-ingresar').style.display = 'none';
  };
  document.getElementById('modal-bg-ingresar').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-form-registrar').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
    document.getElementById('modal-bg-registrar').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-registrar').onclick = function() {
    document.getElementById('modal-bg-registrar').style.display = 'none';
  };
  document.getElementById('modal-bg-registrar').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  // --- REGISTRO PROFESIONAL EN FIREBASE ---
  document.getElementById('form-registrar-profesional').onsubmit = function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre-completo').value.trim();
    const correo = document.getElementById('correo-registrar').value.trim();
    const clave = document.getElementById('clave-registrar').value;
    const profesion = document.getElementById('profesion-registrar').value;

    // Validación simple
    if (nombre === "" || correo === "" || clave === "" || profesion === "") {
      alert("Completa todos los campos.");
      return;
    }

    // Crear usuario en Firebase Auth
    auth.createUserWithEmailAndPassword(correo, clave)
      .then(userCredential => {
        const user = userCredential.user;
        // Guardar datos en Firestore
        return db.collection("profesionales").doc(user.uid).set({
          nombre: nombre,
          correo: correo,
          profesion: profesion,
          creado: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        alert("¡Registro exitoso! Ahora puedes ingresar.");
        document.getElementById('modal-bg-registrar').style.display = 'none';
        document.getElementById('form-registrar-profesional').reset();
      })
      .catch(error => {
        if (error.code === "auth/email-already-in-use") {
          alert("El correo ya está registrado.");
        } else {
          alert("Error al registrar: " + error.message);
        }
      });
  };

  // --- PREVENIR SUBMIT EN LOS DEMÁS FORMULARIOS (puedes implementar lógica real aquí) ---
  document.getElementById('form-inscripcion').onsubmit = function(e) {
    e.preventDefault();
    alert("¡Inscripción enviada!");
    document.getElementById('modal-bg').style.display = 'none';
    document.getElementById('form-inscripcion').reset();
  };
  document.getElementById('form-login-profesional').onsubmit = function(e) {
    e.preventDefault();
    alert("¡Ingreso profesional enviado!");
    document.getElementById('modal-bg-ingresar').style.display = 'none';
    document.getElementById('form-login-profesional').reset();
  };
};
