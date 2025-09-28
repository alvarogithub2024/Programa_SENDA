
let profesionalesAtencion = [];
let profesionesAtencion = [];
let miCesfam = null;

let profesionalesAgendar = [];
let profesionesAgendar = [];
let miCesfamAgendar = null;

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

function guardarCitaPaciente(datosCita, callback) {
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  const datos = Object.assign({}, datosCita);
  datos.fechaCreacion = datos.fechaCreacion || new Date().toISOString();

  db.collection("citas").add(datos)
    .then(function(docRef) {
      window.showNotification && window.showNotification("Cita agendada correctamente", "success");
      
      if (datos.pacienteRut && datos.pacienteNombre) {
        const rutLimpio = datos.pacienteRut.replace(/[.\-]/g, "").toUpperCase();
        db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
          .then(function(snapshot) {
            const pacienteData = {
              nombre: datos.pacienteNombre,
              rut: rutLimpio,
              cesfam: datos.cesfam,
              telefono: datos.telefono || "",
              email: datos.email || "",
              direccion: datos.direccion || "",
              fechaRegistro: datos.fechaCreacion || new Date().toISOString(),
            };
            if (!snapshot.empty) {
              
              const docId = snapshot.docs[0].id;
              db.collection("pacientes").doc(docId).update(pacienteData);
            } else {
          
              db.collection("pacientes").add(pacienteData);
            }
          });
      }
      if (typeof callback === "function") callback(docRef.id);
    })
    .catch(function(error) {
      window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
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
            pacienteRut: document.getElementById('pac-cita-paciente-rut').value.trim(),
            profesionalId: document.getElementById('pac-cita-profesional').value,
            profesionalNombre: document.getElementById('pac-cita-profesional-nombre').value,
            solicitudId: null,
            tipo: "paciente",
            tipoProfesional: document.getElementById('pac-cita-profession').value,
            fecha: document.getElementById('pac-cita-fecha').value,
            hora: document.getElementById('pac-cita-hora').value
          };
          if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
            window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
            return;
          }
          guardarCitaPaciente(datos, function(idCita, error) {
            if (!error) closeModal('modal-nueva-cita-paciente');
          });
        };
        form._onsubmitSet = true;
      }
    }, 100);
  });
}


function cargarProfesionalesAgendarCita(callback) {
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
    miCesfamAgendar = doc.data().cesfam;

    db.collection('profesionales').where('activo', '==', true).where('cesfam', '==', miCesfamAgendar).get().then(snapshot => {
      profesionalesAgendar = [];
      profesionesAgendar = [];
      snapshot.forEach(doc => {
        const p = doc.data();
        p.uid = doc.id;
        profesionalesAgendar.push(p);
        if (p.profession && !profesionesAgendar.includes(p.profession)) {
          profesionesAgendar.push(p.profession);
        }
      });
      if (typeof callback === 'function') callback();
    });
  });
}

function capitalizarProfesionAgendar(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesAgendarCita() {
  const selProf = document.getElementById('modal-cita-profession');
  if (!selProf) return;
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesAgendar.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesionAgendar(prof);
    selProf.appendChild(opt);
  });
}

function llenarSelectProfesionalesAgendarCita() {
  const selProfesion = document.getElementById('modal-cita-profession');
  const selProfesional = document.getElementById('modal-cita-profesional');
  if (!selProfesion || !selProfesional) return;
  selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
  const filtro = selProfesion.value;
  profesionalesAgendar
    .filter(p => p.profession === filtro)
    .forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.uid;
      opt.textContent = `${p.nombre} ${p.apellidos}`;
      opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
      selProfesional.appendChild(opt);
    });
  const nombreInput = document.getElementById('modal-cita-profesional-nombre');
  if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesionalAgendarCita() {
  const selProfesional = document.getElementById('modal-cita-profesional');
  const nombreInput = document.getElementById('modal-cita-profesional-nombre');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}


function abrirModalAgendarCita(solicitudId, nombre, rut) {
  cargarProfesionalesAgendarCita(function() {
    llenarSelectProfesionesAgendarCita();
    llenarSelectProfesionalesAgendarCita();
    autocompletarNombreProfesionalAgendarCita();


var inputId = document.getElementById('modal-cita-id');
if (inputId) inputId.value = solicitudId;

var inputIdProf = document.getElementById('modal-cita-id-prof');
if (inputIdProf) inputIdProf.value = solicitudId;

var nombreSpan = document.getElementById('modal-cita-nombre');
if (nombreSpan) nombreSpan.textContent = nombre;
var nombreSpanProf = document.getElementById('modal-cita-nombre-prof');
if (nombreSpanProf) nombreSpanProf.textContent = nombre;

var rutSpan = document.getElementById('modal-cita-rut');
if (rutSpan) rutSpan.textContent = rut;
var rutSpanProf = document.getElementById('modal-cita-rut-prof');
if (rutSpanProf) rutSpanProf.textContent = rut;

    const selProf = document.getElementById('modal-cita-profession');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesAgendarCita();
        autocompletarNombreProfesionalAgendarCita();
      };
    }
    const selPro = document.getElementById('modal-cita-profesional');
    if (selPro) {
      selPro.onchange = autocompletarNombreProfesionalAgendarCita;
    }

    showModal('modal-cita');

    setTimeout(function() {
      var form = document.getElementById('form-agendar-cita');
      if (form && !form._onsubmitSet) {
        form.addEventListener('submit', function(e){
          e.preventDefault();
          const citaId = document.getElementById('modal-cita-id').value;
          const nombre = document.getElementById('modal-cita-nombre').textContent;
          const rut = document.getElementById('modal-cita-rut').textContent;
          const profesion = document.getElementById('modal-cita-profession').value;
          const profesional = document.getElementById('modal-cita-profesional').value;
          const profesionalNombre = document.getElementById('modal-cita-profesional-nombre').value;
          const fecha = document.getElementById('modal-cita-fecha').value;
          const hora = document.getElementById('modal-cita-hora').value;

          if (!nombre || !rut || !profesion || !profesional || !fecha || !hora) {
            window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
            return;
          }

          const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
          db.collection("citas").add({
            solicitudId: citaId,
            nombre: nombre,
            rut: rut,
            profesion: profesion,
            profesional: profesional,
            profesionalNombre: profesionalNombre,
            fecha: fecha,
            hora: hora,
            creado: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(function(docRef) {
       
            db.collection("solicitudes_ingreso").doc(citaId).update({ estado: "agendada" })
              .catch(() => {})
              .finally(() => {
                db.collection("reingresos").doc(citaId).update({ estado: "agendada" })
                  .catch(() => {})
                  .finally(() => {
                    window.showNotification && window.showNotification("Cita agendada correctamente", "success");
                    closeModal('modal-cita');
                    if (window.reloadSolicitudesFromFirebase) window.reloadSolicitudesFromFirebase();
                  });
              });
          })
          .catch(function(error) {
            window.showNotification && window.showNotification("Error al guardar la cita: " + error, "error");
          });
        });
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

window.abrirModalAgendarCita = abrirModalAgendarCita;
window.cargarProfesionalesAgendarCita = cargarProfesionalesAgendarCita;
window.llenarSelectProfesionesAgendarCita = llenarSelectProfesionesAgendarCita;
window.llenarSelectProfesionalesAgendarCita = llenarSelectProfesionalesAgendarCita;
window.autocompletarNombreProfesionalAgendarCita = autocompletarNombreProfesionalAgendarCita;
