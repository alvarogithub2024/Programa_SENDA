// Inicializa Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.appspot.com",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const dominioPermitido = '@senda.cl';

let profesionActual = "";
let usuarioUid = "";

// Abrir login profesional
document.getElementById('abrir-modal-profesional').onclick = function() {
  document.getElementById('modal-bg-login-profesional').style.display = 'flex';
  document.getElementById('error-login-profesional').style.display = 'none';
  document.getElementById('form-login-profesional').reset();
  document.getElementById('grupo-profesion-profesional').style.display = 'block';
};
document.getElementById('cerrar-modal-login-profesional').onclick = function() {
  document.getElementById('modal-bg-login-profesional').style.display = 'none';
};
document.getElementById('modal-bg-login-profesional').onclick = function(e) {
  if(e.target === this) this.style.display = 'none';
};

// Login profesional con Firebase Auth
document.getElementById('form-login-profesional').onsubmit = async function(e) {
  e.preventDefault();
  const correo = document.getElementById('correo-profesional').value.trim();
  const clave = document.getElementById('clave-profesional').value;
  const profesion = document.getElementById('profesion-profesional').value;
  const errorDiv = document.getElementById('error-login-profesional');

  if (!correo.endsWith(dominioPermitido)) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Solo se permite acceso con correo institucional (' + dominioPermitido + ')';
    return;
  }
  auth.signInWithEmailAndPassword(correo, clave)
    .then(async (userCredential) => {
      usuarioUid = userCredential.user.uid;
      // Consultar si ya tiene profesión guardada
      const docProf = await db.collection("usuarios").doc(usuarioUid).get();
      if(docProf.exists && docProf.data().profesion) {
        profesionActual = docProf.data().profesion;
        document.getElementById('grupo-profesion-profesional').style.display = 'none';
      } else {
        // Si no existe, pedir profesión sólo una vez
        if (!profesion) {
          errorDiv.style.display = 'block';
          errorDiv.innerText = 'Seleccione su profesión.';
          return;
        }
        profesionActual = profesion;
        await db.collection("usuarios").doc(usuarioUid).set({ profesion: profesionActual });
      }
      errorDiv.style.display = 'none';
      document.getElementById('modal-bg-login-profesional').style.display = 'none';
      document.getElementById('panel-profesional-titulo').innerText =
        profesionActual === "asistente_social" ? "Asistente Social" : "Médico";
      document.getElementById('modal-bg-profesional-panel').style.display = 'flex';
      cargarSolicitudesProfesional();
    })
    .catch((error) => {
      errorDiv.style.display = 'block';
      errorDiv.innerText = 'Error: ' + error.message;
    });
};

// Registro profesional
document.getElementById('registrar-profesional').onclick = async function() {
  const correo = document.getElementById('correo-profesional').value.trim();
  const clave = document.getElementById('clave-profesional').value;
  const profesion = document.getElementById('profesion-profesional').value;
  const errorDiv = document.getElementById('error-login-profesional');
  if (!correo.endsWith(dominioPermitido)) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Solo se permite registro con correo institucional (' + dominioPermitido + ')';
    return;
  }
  if (!profesion) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Seleccione su profesión.';
    return;
  }
  auth.createUserWithEmailAndPassword(correo, clave)
    .then(async (userCredential) => {
      usuarioUid = userCredential.user.uid;
      profesionActual = profesion;
      await db.collection("usuarios").doc(usuarioUid).set({ profesion: profesionActual });
      errorDiv.style.display = 'none';
      alert('Registro exitoso, ahora puede ingresar.');
    })
    .catch((error) => {
      errorDiv.style.display = 'block';
      errorDiv.innerText = 'Error: ' + error.message;
    });
};

// Logout profesional
document.getElementById('logout-profesional').onclick = function() {
  auth.signOut().then(() => {
    document.getElementById('modal-bg-profesional-panel').style.display = 'none';
    profesionActual = "";
    usuarioUid = "";
  });
};
document.getElementById('cerrar-modal-profesional-panel').onclick = function() {
  document.getElementById('modal-bg-profesional-panel').style.display = 'none';
};
document.getElementById('modal-bg-profesional-panel').onclick = function(e) {
  if(e.target === this) this.style.display = 'none';
};

// Modal solicitud paciente
document.getElementById('abrir-modal').onclick = function() {
  document.getElementById('modal-bg').style.display = 'flex';
};
document.getElementById('cerrar-modal').onclick = function() {
  document.getElementById('modal-bg').style.display = 'none';
};
document.getElementById('modal-bg').onclick = function(e) {
  if(e.target === this) this.style.display = 'none';
};

// Modal de éxito paciente
function mostrarModalExito() {
  document.getElementById('modal-bg-success').style.display = 'flex';
}
document.getElementById('cerrar-modal-success').onclick = function() {
  document.getElementById('modal-bg-success').style.display = 'none';
};
document.getElementById('modal-bg-success').onclick = function(e) {
  if(e.target === this) this.style.display = 'none';
};

// Guardar la solicitud en Firestore y mostrar modal de éxito
document.getElementById('form-postulacion').onsubmit = function(e) {
  e.preventDefault();
  const datos = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    rut: document.getElementById('rut').value,
    telefono: document.getElementById('telefono').value,
    correo: document.getElementById('correo').value,
    comuna: document.getElementById('comuna').value,
    direccion: document.getElementById('direccion').value,
    fecha: new Date().toLocaleString(),
    derivacion: "pendiente"
  };
  db.collection("solicitudes").add(datos)
    .then(() => {
      document.getElementById('modal-bg').style.display = 'none';
      document.getElementById('form-postulacion').reset();
      mostrarModalExito();
    })
    .catch((error) => {
      alert('Error al enviar la solicitud: ' + error.message);
    });
};

// Mostrar solicitudes SOLO si está logueado
function cargarSolicitudesProfesional() {
  let lista = document.getElementById('solicitudes-list');
  lista.innerHTML = '<p>Cargando solicitudes...</p>';
  db.collection("solicitudes").orderBy("fecha", "desc").get()
    .then((querySnapshot) => {
      lista.innerHTML = '';
      if (querySnapshot.empty) {
        lista.innerHTML = '<p>No hay solicitudes recibidas aún.</p>';
        return;
      }
      querySnapshot.forEach((doc) => {
        const solicitud = doc.data();
        const id = doc.id;
        let derivarHTML = '';
        if(profesionActual === "asistente_social" && solicitud.derivacion === "pendiente") {
          derivarHTML = `
            <label class="derivacion-label">Derivar a médico:</label>
            <select class="derivar-select" id="derivar-${id}">
              <option value="">Seleccione...</option>
              <option value="medico">Médico</option>
            </select>
            <button class="boton-derivar" onclick="derivarSolicitud('${id}')">Derivar</button>
          `;
        } else if (solicitud.derivacion !== "pendiente") {
          derivarHTML = `<span class="derivacion-label">Derivado a: <strong>${solicitud.derivacion.charAt(0).toUpperCase() + solicitud.derivacion.slice(1)}</strong></span>`;
        }
        lista.innerHTML += `
          <div class="solicitud-item" id="item-${id}">
            <strong>Nombre:</strong> ${solicitud.nombre} ${solicitud.apellido}<br>
            <strong>RUT:</strong> ${solicitud.rut}<br>
            <strong>Teléfono:</strong> ${solicitud.telefono}<br>
            <strong>Correo:</strong> ${solicitud.correo}<br>
            <strong>Comuna:</strong> ${solicitud.comuna}<br>
            <strong>Dirección:</strong> ${solicitud.direccion}<br>
            <strong>Fecha:</strong> ${solicitud.fecha}
            ${derivarHTML}
            <button class="boton-verficha" onclick="verFichaUsuario('${id}')">Ver ficha</button>
          </div>`;
      });
    })
    .catch((error) => {
      lista.innerHTML = '<p>Error al cargar las solicitudes: ' + error.message + '</p>';
    });
}

// Derivar solicitud SOLO a médico
window.derivarSolicitud = function(id) {
  const select = document.getElementById('derivar-' + id);
  const value = select.value;
  if(!value) { alert('Seleccione a quién derivar la solicitud.'); return; }
  db.collection("solicitudes").doc(id).update({ derivacion: value })
    .then(() => {
      alert('Solicitud derivada con éxito.');
      cargarSolicitudesProfesional();
    })
    .catch((error) => {
      alert('Error al derivar: ' + error.message);
    });
};

// Ficha usuario: ver toda la info y notas
let fichaUsuarioId = null;
window.verFichaUsuario = function(id) {
  fichaUsuarioId = id;
  document.getElementById('modal-bg-ficha').style.display = 'flex';
  mostrarFichaUsuario(id);
};
document.getElementById('cerrar-modal-ficha').onclick = function() {
  document.getElementById('modal-bg-ficha').style.display = 'none';
};
document.getElementById('modal-bg-ficha').onclick = function(e) {
  if(e.target === this) this.style.display = 'none';
};

function mostrarFichaUsuario(id) {
  db.collection("solicitudes").doc(id).get()
    .then((doc) => {
      if (!doc.exists) return;
      const u = doc.data();
      let html = `
        <div class="ficha-label">Nombre:</div> ${u.nombre} ${u.apellido}<br>
        <div class="ficha-label">RUT:</div> ${u.rut}<br>
        <div class="ficha-label">Teléfono:</div> ${u.telefono}<br>
        <div class="ficha-label">Correo:</div> ${u.correo}<br>
        <div class="ficha-label">Comuna:</div> ${u.comuna}<br>
        <div class="ficha-label">Dirección:</div> ${u.direccion}<br>
        <div class="ficha-label">Fecha de solicitud:</div> ${u.fecha}<br>
        <div class="ficha-label">Derivación:</div> ${u.derivacion ? u.derivacion : "sin derivar"}
      `;
      document.getElementById('ficha-usuario-info').innerHTML = html;
      cargarNotasFicha(id);
    });
}

// Guardar nota en la ficha
document.getElementById('form-nota-ficha').onsubmit = function(e) {
  e.preventDefault();
  const texto = document.getElementById('nota-ficha').value.trim();
  if(!texto) return;
  db.collection("solicitudes").doc(fichaUsuarioId).collection("notas").add({
    texto, fecha: new Date().toLocaleString()
  }).then(() => {
    document.getElementById('nota-ficha').value = '';
    cargarNotasFicha(fichaUsuarioId);
  });
};

// Mostrar notas de la ficha
function cargarNotasFicha(id) {
  let notasDiv = document.getElementById('ficha-usuario-notas');
  db.collection("solicitudes").doc(id).collection("notas").orderBy("fecha").get()
    .then((querySnapshot) => {
      let html = '<div class="ficha-label" style="margin-bottom:8px;">Notas de atención:</div>';
      if (querySnapshot.empty) {
        html += '<div class="ficha-notas">No hay notas registradas aún.</div>';
      } else {
        html += '<div class="ficha-notas">';
        querySnapshot.forEach((doc) => {
          let nota = doc.data();
          html += `<div class="ficha-nota-item"><strong>${nota.fecha}:</strong><br>${nota.texto}</div>`;
        });
        html += '</div>';
      }
      notasDiv.innerHTML = html;
    });
}
