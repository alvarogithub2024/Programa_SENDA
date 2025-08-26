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
  if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    // Puedes acceder a firestore con: firebase.firestore()
    // Y a auth con: firebase.auth()
  }

  // --- MODALES ---
  // Modal Inscribirse
  document.getElementById('abrir-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'flex';
  };
  document.getElementById('cerrar-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'none';
  };
  document.getElementById('modal-bg').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  // Modal Profesional - menú
  document.getElementById('abrir-modal-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-login-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
  };
  document.getElementById('modal-bg-login-profesional').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  // Abrir modal de formulario ingresar profesional
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

  // Abrir modal de formulario registrar profesional
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

  // Prevent default for forms (solo demo)
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
  document.getElementById('form-registrar-profesional').onsubmit = function(e) {
    e.preventDefault();
    alert("¡Registro profesional enviado!");
    document.getElementById('modal-bg-registrar').style.display = 'none';
    document.getElementById('form-registrar-profesional').reset();
  };
};
