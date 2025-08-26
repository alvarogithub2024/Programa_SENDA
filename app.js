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

// ... después del login profesional exitoso ...

function mostrarPanelProfesional(usuario) {
  // usuario: objeto {uid, nombre, correo, profesion}
  document.getElementById('modal-bg-profesional-panel').style.display = 'flex';

  // Mostrar datos en "Mis datos"
  document.getElementById('tab-mis-datos').innerHTML = `
    <h3>${usuario.nombre}</h3>
    <p><b>Correo:</b> ${usuario.correo}</p>
    <p><b>Profesión:</b> ${usuario.profesion === "asistente_social" ? "Asistente Social" : "Médico"}</p>
  `;

  // Tabs handler
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    };
  });

  // Solo asistentes sociales ven y pueden derivar solicitudes
  if (usuario.profesion === "asistente_social") {
    cargarSolicitudesAsistente(usuario);
  } else {
    document.getElementById('tab-solicitudes').innerHTML = "<p>Solo los asistentes sociales pueden ver solicitudes para derivar.</p>";
  }
}

// Ejemplo función para cargar solicitudes y derivar con observación
function cargarSolicitudesAsistente(usuario) {
  db.collection("solicitudes").where("derivacion", "==", "pendiente").get().then(snap => {
    let html = "";
    snap.forEach(doc => {
      const sol = doc.data();
      html += `
        <div class="solicitud-item">
          <p><b>${sol.nombre} ${sol.apellido}</b> - ${sol.rut}</p>
          <p><b>Comuna:</b> ${sol.comuna} <b>Tel:</b> ${sol.telefono}</p>
          <textarea placeholder="Observación para derivar" id="obs-${doc.id}" class="obs-derivar"></textarea>
          <button onclick="derivarSolicitud('${doc.id}', '${usuario.nombre}')">Derivar al médico</button>
        </div>
      `;
    });
    document.getElementById('tab-solicitudes').innerHTML = html || "<p>No hay solicitudes pendientes.</p>";
  });
}

// Esta función debe ser global (window.)
window.derivarSolicitud = function(idSolicitud, nombreProfesional) {
  const obs = document.getElementById('obs-' + idSolicitud).value.trim();
  if (!obs) { alert("Debes ingresar una observación."); return; }
  db.collection("solicitudes").doc(idSolicitud).update({
    derivacion: "medico",
    observacion_derivacion: obs,
    derivado_por: nombreProfesional
  })
  .then(() => {
    alert("Solicitud derivada con observación.");
    // Recargar solicitudes
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        db.collection("profesionales").doc(user.uid).get().then(doc => {
          if (doc.exists) mostrarPanelProfesional({uid: user.uid, ...doc.data()});
        });
      }
    });
  });
}
