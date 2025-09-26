// ==== CITAS DE PACIENTES (solo del CESFAM del usuario logueado) ====

let profesionalesAtencion = [];
let profesionesAtencion = [];
let miCesfam = null;

function cargarProfesionalesAtencionPorCesfam(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  // 1. Obtener el CESFAM del usuario logueado
  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) return;
    miCesfam = doc.data().cesfam;

    // 2. Buscar profesionales activos SOLO de ese CESFAM
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

function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function guardarCitaPaciente(datosCita, callback) {
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  const datos = Object.assign({}, datosCita);

  // Agrega la fecha/hora de creación si no viene
  datos.fechaCreacion = datos.fechaCreacion || new Date().toISOString();

  db.collection("citas").add(datos)
    .then(function(docRef) {
      if (window.showNotification) window.showNotification("Cita agendada correctamente", "success");
      if (typeof callback === "function") callback(docRef.id);
    })
    .catch(function(error) {
      if (window.showNotification) window.showNotification("Error al agendar cita: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
    });
}

// Inicializa el flujo SOLO cuando abras el modal de paciente
function abrirModalCitaPaciente() {
  cargarProfesionalesAtencionPorCesfam(function() {
    llenarSelectProfesionesPaciente();
    llenarSelectProfesionalesPaciente();
    autocompletarNombreProfesionalPaciente();

    // Listeners seguros (solo si existen los elementos)
    const selProf = document.getElementById('pac-cita-profession');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesPaciente();
        autocompletarNombreProfesionalPaciente();
        // Al cambiar profesión, limpia horarios
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

    // Inicializa listeners de fecha y profesional para los horarios
    if (window.inicializarListenersNuevaCitaPaciente) {
      window.inicializarListenersNuevaCitaPaciente();
    }
    // Intenta cargar horarios si ambos campos tienen valor
    if (window.actualizarHorasPaciente) {
      window.actualizarHorasPaciente();
    }

    showModal('modal-nueva-cita-paciente');

    setTimeout(function() {
      var form = document.getElementById('form-nueva-cita-paciente');
      if (form && !form._onsubmitSet) { // Solo una vez
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

          // Validación básica
          if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
            if (window.showNotification) window.showNotification("Completa todos los campos obligatorios", "warning");
            return;
          }

          guardarCitaPaciente(datos, function(idCita, error) {
            if (!error) {
              closeModal('modal-nueva-cita-paciente');
              // Recarga calendario, citas del día, etc. si necesitas
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
