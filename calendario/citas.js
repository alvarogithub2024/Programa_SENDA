let profesionalesAtencion = [];
let profesionesAtencion = [];
let miCesfam = null;

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

// === CENTRALIZADO ===
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

// === INTEGRACIÓN EN FORMULARIOS ===
document.addEventListener("DOMContentLoaded", function() {
    var formNuevaCita = document.getElementById('form-nueva-cita-paciente');
    if (formNuevaCita) {
        formNuevaCita.onsubmit = function(e) {
            e.preventDefault();
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
    // Puedes agregar aquí el submit del formulario de Agendar Cita si tienes otro modal.
});

window.abrirModalCitaPaciente = abrirModalCitaPaciente;
window.llenarSelectProfesionesPaciente = llenarSelectProfesionesPaciente;
window.llenarSelectProfesionalesPaciente = llenarSelectProfesionalesPaciente;
window.autocompletarNombreProfesionalPaciente = autocompletarNombreProfesionalPaciente;
window.cargarProfesionalesAtencionPorCesfam = cargarProfesionalesAtencionPorCesfam;
