
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

  // Limpiar rut para búsqueda
  const rutLimpio = datos.pacienteRut.replace(/[.\-]/g, "").toUpperCase();

  if (!rutLimpio) {
    window.showNotification && window.showNotification("Error: El paciente no tiene RUT, no se puede crear en la colección pacientes.", "error");
    if (typeof callback === "function") callback(null, "RUT vacío");
    return;
  }

  db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
    .then(function(snapshot) {
      let pacienteId;
      // Estructura completa del paciente, incluyendo profesionalDescripcion
      const pacienteData = {
        apellidos: datos.pacienteApellidos || "",
        cesfam: datos.cesfam,
        descripcion: datos.descripcion || "",
        direccion: datos.direccion || "",
        edad: datos.edad || "",
        email: datos.email || "",
        estado: datos.estado || "agendada",
        fecha: datos.fechaCreacion,
        motivacion: datos.motivacion || "",
        nombre: datos.pacienteNombre,
        paraMi: datos.paraMi || "",
        rut: rutLimpio,
        sustancias: datos.sustancias || [],
        telefono: datos.telefono || "",
        tiempoConsumo: datos.tiempoConsumo || "",
        tipo: datos.tipo || "",
        tratamientoPrevio: datos.tratamientoPrevio || "",
        urgencia: datos.urgencia || "",
        profesionalDescripcion: datos.profesionalDescripcion || "", // ESTE CAMPO es para contexto profesional, observaciones, etc.
      };
      if (!snapshot.empty) {
        // Paciente existe: actualizar y setear el campo id
        pacienteId = snapshot.docs[0].id;
        pacienteData.id = pacienteId; // el campo id ES el id de Firestore
        db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true })
          .then(() => {
            datos.pacienteId = pacienteId;
            crearCitaConPacienteId(db, datos, callback);
          }).catch(function(error) {
            console.error("Error actualizando paciente:", error);
            window.showNotification && window.showNotification("Error actualizando paciente: "+error.message, "error");
          });
      } else {
        // Paciente nuevo
        db.collection("pacientes").add(pacienteData)
          .then(function(docRef) {
            pacienteId = docRef.id;
            pacienteData.id = pacienteId;
            db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true }); // agrega el campo id
            datos.pacienteId = pacienteId;
            crearCitaConPacienteId(db, datos, callback);
          })
          .catch(function(error) {
            console.error("Error creando paciente:", error);
            window.showNotification && window.showNotification("Error creando paciente: "+error.message, "error");
          });
      }
    })
    .catch(function(error) {
      console.error("Error buscando paciente:", error);
      window.showNotification && window.showNotification("Error buscando paciente: "+error.message, "error");
    });
} 

function crearCitaConPacienteId(db, datos, callback) {
  db.collection("citas").add(datos)
    .then(function(docRef) {
      window.showNotification && window.showNotification("Cita agendada correctamente", "success");
      if (typeof callback === "function") callback(docRef.id);
    })
    .catch(function(error) {
      window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
    });
}

function crearCitaConPacienteId(db, datos, callback) {
  db.collection("citas").add(datos)
    .then(function(docRef) {
      window.showNotification && window.showNotification("Cita agendada correctamente", "success");
      if (typeof callback === "function") callback(docRef.id);
    })
    .catch(function(error) {
      window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
    });
}

// Función auxiliar para crear la cita
function crearCitaConPacienteId(db, datos, callback) {
  db.collection("citas").add(datos)
    .then(function(docRef) {
      window.showNotification && window.showNotification("Cita agendada correctamente", "success");
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
          const rut = document.getElementById('modal-cita-rut').textContent = window.formatRUT ? window.formatRUT(rut) : rut;
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
// =======================
// Centralizar el flujo de crear/actualizar paciente + agendar cita
// =======================

function upsertPacienteYAgendarCita(datosCita, callback) {
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    const datos = Object.assign({}, datosCita);
    datos.fechaCreacion = datos.fechaCreacion || new Date().toISOString();
    const rutLimpio = datos.pacienteRut ? datos.pacienteRut.replace(/[.\-]/g, "").toUpperCase() : "";

    if (!rutLimpio) {
        window.showNotification && window.showNotification("Error: El paciente no tiene RUT, no se puede crear en la colección pacientes.", "error");
        if (typeof callback === "function") callback(null, "RUT vacío");
        return;
    }

    db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
        .then(function(snapshot) {
            let pacienteId;
            // Estructura completa del paciente, como en tu imagen
            const pacienteData = {
                apellidos: datos.pacienteApellidos || datos.apellidos || "",
                cesfam: datos.cesfam,
                descripcion: datos.descripcion || "",
                direccion: datos.direccion || "",
                edad: datos.edad || "",
                email: datos.email || "",
                estado: datos.estado || "agendada",
                fecha: datos.fechaCreacion,
                motivacion: datos.motivacion || "",
                nombre: datos.pacienteNombre || datos.nombre || "",
                paraMi: datos.paraMi || "",
                rut: rutLimpio,
                sustancias: datos.sustancias || [],
                telefono: datos.telefono || "",
                tiempoConsumo: datos.tiempoConsumo || "",
                tipo: datos.tipo || "",
                tratamientoPrevio: datos.tratamientoPrevio || "",
                urgencia: datos.urgencia || "",
                profesionalDescripcion: datos.profesionalDescripcion || "",
            };
            if (!snapshot.empty) {
                pacienteId = snapshot.docs[0].id;
                if (!pacienteId) {
                    window.showNotification && window.showNotification("Error: No se pudo determinar el id del paciente.", "error");
                    return;
                }
                pacienteData.id = pacienteId;
                db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true })
                    .then(() => {
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    }).catch(function(error) {
                        window.showNotification && window.showNotification("Error actualizando paciente: "+error.message, "error");
                    });
            } else {
                db.collection("pacientes").add(pacienteData)
                    .then(function(docRef) {
                        pacienteId = docRef.id;
                        if (!pacienteId) {
                            window.showNotification && window.showNotification("Error: Paciente creado sin id.", "error");
                            return;
                        }
                        pacienteData.id = pacienteId;
                        db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true });
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    })
                    .catch(function(error) {
                        window.showNotification && window.showNotification("Error creando paciente: "+error.message, "error");
                    });
            }
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error buscando paciente: "+error.message, "error");
        });
}

/**
 * Crea la cita vinculada al pacienteId.
 */
function crearCitaConPacienteId(db, datos, callback) {
    if (!datos.pacienteId) {
        window.showNotification && window.showNotification("Error: No se pudo vincular la cita a un paciente válido.", "error");
        if (typeof callback === "function") callback(null, "pacienteId vacío");
        return;
    }
    db.collection("citas").add(datos)
        .then(function(docRef) {
            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
            if (typeof callback === "function") callback(docRef.id);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
            if (typeof callback === "function") callback(null, error);
        });
}

// ===========
// INTEGRACIÓN EN FORMULARIOS NUEVA CITA Y AGENDAR CITA
// ===========

// Ejemplo para el submit del formulario de nueva cita
document.addEventListener("DOMContentLoaded", function() {
    var formNuevaCita = document.getElementById('form-nueva-cita-paciente');
    if (formNuevaCita) {
        formNuevaCita.onsubmit = function(e) {
            e.preventDefault();
            // Recolectar todos los datos del formulario:
            const datos = {
                pacienteNombre: document.getElementById('pac-cita-paciente-nombre')?.value.trim(),
                pacienteApellidos: document.getElementById('pac-cita-paciente-apellidos')?.value.trim() || "",
                pacienteRut: document.getElementById('pac-cita-paciente-rut')?.value.trim(),
                cesfam: document.getElementById('pac-cita-cesfam')?.value,
                edad: document.getElementById('pac-cita-edad')?.value || "",
                telefono: document.getElementById('pac-cita-telefono')?.value || "",
                email: document.getElementById('pac-cita-email')?.value || "",
                direccion: document.getElementById('pac-cita-direccion')?.value || "",
                sustancias: Array.from(document.querySelectorAll('[name="pac-cita-sustancias"]:checked')).map(x=>x.value),
                tiempoConsumo: document.getElementById('pac-cita-tiempo-consumo')?.value || "",
                urgencia: document.querySelector('[name="pac-cita-urgencia"]:checked')?.value || "",
                tratamientoPrevio: document.querySelector('[name="pac-cita-tratamiento-previo"]:checked')?.value || "",
                descripcion: document.getElementById('pac-cita-descripcion')?.value || "",
                motivacion: document.getElementById('pac-cita-motivacion')?.value || "",
                paraMi: document.querySelector('[name="pac-cita-para-mi"]:checked')?.value || "",
                estado: "agendada",
                fecha: document.getElementById('pac-cita-fecha')?.value,
                hora: document.getElementById('pac-cita-hora')?.value,
                profesionalId: document.getElementById('pac-cita-profesional')?.value,
                profesionalNombre: document.getElementById('pac-cita-profesional-nombre')?.value,
                tipo: "paciente",
                tipoProfesional: document.getElementById('pac-cita-profession')?.value,
                profesionalDescripcion: document.getElementById('pac-cita-profesional-descripcion')?.value || ""
            };
            if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
                window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                return;
            }
            upsertPacienteYAgendarCita(datos, function(idCita, error) {
                if (!error) closeModal('modal-nueva-cita-paciente');
            });
        };
    }
    // Puedes hacer un submit similar para el formulario de agendar cita, usando los mismos campos y lógica.
});
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
