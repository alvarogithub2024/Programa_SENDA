let profesionalesAtencion = [];
let profesionesAtencion = [];
let miCesfam = null;

let profesionalesAgendar = [];
let profesionesAgendar = [];
let miCesfamAgendar = null;

function sanitizeCitaData(obj) {
  return {
    ...obj,
    telefono: typeof obj.telefono === "string" ? obj.telefono : "",
    email: typeof obj.email === "string" ? obj.email : "",
    direccion: typeof obj.direccion === "string" ? obj.direccion : ""
  };
}

function cargarProfesionalesAtencionPorCesfam(callback) {
  const user = firebase.auth().currentUser;
  if (!user) {
    window.showNotification && window.showNotification("Debes iniciar sesión para agendar citas.", "warning");
    return;
  }
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) {
      window.showNotification && window.showNotification("No se encontró tu CESFAM.", "warning");
      return;
    }
    miCesfam = doc.data().cesfam;

    db.collection('profesionales').where('activo', '==', true).where('cesfam', '==', miCesfam).get().then(snapshot => {
      profesionalesAtencion = [];
      profesionesAtencion = [];
      snapshot.forEach(doc => {
        const p = doc.data();
        p.uid = doc.id;
        profesionalesAtencion.push(p);
        if (p.profession && !profesionesAtencion.includes(p.profession)) {
          profesionesAtencion.push(p.profession);
        }
      });
      if (typeof callback === 'function') callback();
    });
  });
}

function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesPaciente() {
  const selProf = document.getElementById('pac-cita-profession');
  if (!selProf) return;
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesAtencion.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesion(prof);
    selProf.appendChild(opt);
  });
}

function llenarSelectProfesionalesPaciente() {
  const selProfesion = document.getElementById('pac-cita-profession');
  const selProfesional = document.getElementById('pac-cita-profesional');
  if (!selProfesion || !selProfesional) return;
  selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
  const filtro = selProfesion.value;
  profesionalesAtencion
    .filter(p => p.profession === filtro)
    .forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.uid;
      opt.textContent = `${p.nombre} ${p.apellidos}`;
      opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
      selProfesional.appendChild(opt);
    });
  const nombreInput = document.getElementById('pac-cita-profesional-nombre');
  if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesionalPaciente() {
  const selProfesional = document.getElementById('pac-cita-profesional');
  const nombreInput = document.getElementById('pac-cita-profesional-nombre');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

function limpiarTelefonoChileno(tel) {
  if (!tel) return "";
  tel = tel.replace(/\D/g, '');
  if (tel.startsWith("56")) tel = tel.slice(2);
  if (tel.length === 11 && tel.startsWith("569")) tel = tel.slice(2);
  return tel;
}

function validarEmail(email) {
  if (!email) return true;
  return /^[\w\.\-]+@([\w\-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}

// --- VINCULACIÓN Y GUARDADO DE CITA ---
function guardarCitaPaciente(datosCita, callback) {
  const datos = Object.assign({}, datosCita);
  datos.telefono = limpiarTelefonoChileno(datos.telefono || "");
  datos.email = datos.email ? datos.email.trim() : "";
  datos.direccion = datos.direccion ? datos.direccion.trim() : "";

  if (datos.email && !validarEmail(datos.email)) {
    window.showNotification && window.showNotification("Email inválido", "warning");
    if (typeof callback === "function") callback(null, new Error("Email inválido"));
    return;
  }

  // Vinculación fuerte: CREAMOS/ACTUALIZAMOS paciente ANTES de guardar la cita
  const idPaciente = window.generarIdPaciente(datos.rut || datos.pacienteRut);
  window.crearOActualizarPaciente(datos, function(pacienteId, error) {
    if (error) {
      window.showNotification && window.showNotification("Error actualizando paciente: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
      return;
    }
    const db = window.getFirestore();
    db.collection('citas').add({ ...datos, idPaciente })
      .then(function(docRef) {
        window.showNotification && window.showNotification("Cita agendada correctamente", "success");
        if (typeof callback === "function") callback(docRef.id);
      })
      .catch(function(error) {
        window.showNotification && window.showNotification("Error agendando cita: " + error.message, "error");
        if (typeof callback === "function") callback(null, error);
      });
  });
}

function abrirModalCitaPaciente() {
  cargarProfesionalesAtencionPorCesfam(function() {
    llenarSelectProfesionesPaciente();
    llenarSelectProfesionalesPaciente();
    autocompletarNombreProfesionalPaciente();

    const selProf = document.getElementById('pac-cita-profession');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesPaciente();
        autocompletarNombreProfesionalPaciente();
        if (window.actualizarHorasPaciente) window.actualizarHorasPaciente();
      };
    }
    const selPro = document.getElementById('pac-cita-profesional');
    if (selPro) {
      selPro.onchange = function() {
        autocompletarNombreProfesionalPaciente();
        if (window.actualizarHorasPaciente) window.actualizarHorasPaciente();
      };
    }
    if (window.inicializarListenersNuevaCitaPaciente) window.inicializarListenersNuevaCitaPaciente();
    if (window.actualizarHorasPaciente) window.actualizarHorasPaciente();

    showModal('modal-nueva-cita-paciente');

    setTimeout(function() {
      var form = document.getElementById('form-nueva-cita-paciente');
      if (form && !form._onsubmitSet) {
        form.onsubmit = function(e) {
          e.preventDefault();
          
          const datos = {
            cesfam: miCesfam,
            estado: "agendada",
            fechaCreacion: new Date().toISOString(),
            observaciones: document.getElementById('pac-cita-observaciones')?.value || "",
            origenSolicitud: "web",
            pacienteNombre: document.getElementById('pac-cita-paciente-nombre').value.trim(),
            nombre: document.getElementById('pac-cita-paciente-nombre').value.trim(),
            pacienteRut: document.getElementById('pac-cita-paciente-rut').value.trim(),
            rut: document.getElementById('pac-cita-paciente-rut').value.trim(),
            profesionalId: document.getElementById('pac-cita-profesional').value,
            profesionalNombre: document.getElementById('pac-cita-profesional-nombre').value,
            solicitudId: null,
            tipo: "paciente",
            tipoProfesional: document.getElementById('pac-cita-profession').value,
            profesion: document.getElementById('pac-cita-profession').value,
            fecha: document.getElementById('pac-cita-fecha').value,
            hora: document.getElementById('pac-cita-hora').value,
            telefono: document.getElementById('pac-cita-paciente-telefono')?.value || "",
            email: document.getElementById('pac-cita-paciente-email')?.value || "",
            direccion: document.getElementById('pac-cita-paciente-direccion')?.value || "",
          };
          
          if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
            window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
            return;
          }
          
          guardarCitaPaciente(datos, function(idCita, error) {
            if (!error) {
              closeModal('modal-nueva-cita-paciente');
              form.reset();
            }
          });
        };
        form._onsubmitSet = true;
      }
    }, 100);
  });
}

window.abrirModalCitaPaciente = abrirModalCitaPaciente;
window.guardarCitaPaciente = guardarCitaPaciente;
window.llenarSelectProfesionesPaciente = llenarSelectProfesionesPaciente;
window.llenarSelectProfesionalesPaciente = llenarSelectProfesionalesPaciente;
window.autocompletarNombreProfesionalPaciente = autocompletarNombreProfesionalPaciente;
window.cargarProfesionalesAtencionPorCesfam = cargarProfesionalesAtencionPorCesfam;
