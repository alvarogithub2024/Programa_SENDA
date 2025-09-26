// ==== CITAS DE PACIENTES (solo del CESFAM del usuario logueado) ====

// Variables globales para profesionales y profesiones
let profesionalesAtencion = [];
let profesionesAtencion = [];
let miCesfam = null;

// Cargar profesionales y profesiones de CESFAM del usuario logueado
function cargarProfesionalesAtencionPorCesfam(callback) {
  const user = firebase.auth().currentUser;
  if (!user) {
    // Si el usuario no está logueado, no se puede cargar nada
    if (window.showNotification) window.showNotification("Debes iniciar sesión para agendar citas.", "warning");
    return;
  }
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) {
      if (window.showNotification) window.showNotification("No se encontró tu CESFAM.", "warning");
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

// Llena el select de profesiones en el modal (de paciente)
function llenarSelectProfesionesPaciente() {
  const selProf = document.getElementById('modal-cita-profession');
  if (!selProf) return;
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesAtencion.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesion(prof);
    selProf.appendChild(opt);
  });
}

// Llena el select de profesionales en el modal (de paciente)
function llenarSelectProfesionalesPaciente() {
  const selProfesion = document.getElementById('modal-cita-profession');
  const selProfesional = document.getElementById('modal-cita-profesional');
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
  const nombreInput = document.getElementById('modal-cita-profesional-nombre');
  if (nombreInput) nombreInput.value = '';
}

// Autocompleta el nombre del profesional seleccionado
function autocompletarNombreProfesionalPaciente() {
  const selProfesional = document.getElementById('modal-cita-profesional');
  const nombreInput = document.getElementById('modal-cita-profesional-nombre');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

// Capitaliza la profesión para mostrarla bien en el select
function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Guardar cita en Firebase
function guardarCitaPaciente(datosCita, callback) {
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  const datos = Object.assign({}, datosCita);
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

// MODAL: Agendar Cita (Solicitud de Ingreso)
function abrirModalAgendarCita(solicitudId, nombre, rut) {
  cargarProfesionalesAtencionPorCesfam(function() {
    llenarSelectProfesionesPaciente();
    llenarSelectProfesionalesPaciente();
    autocompletarNombreProfesionalPaciente();

    document.getElementById('modal-cita-id').value = solicitudId;
    document.getElementById('modal-cita-nombre').textContent = nombre;
    document.getElementById('modal-cita-rut').textContent = rut;

    // Listeners para selects en el modal de agendar cita
    const selProf = document.getElementById('modal-cita-profession');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesPaciente();
        autocompletarNombreProfesionalPaciente();
      };
    }
    const selPro = document.getElementById('modal-cita-profesional');
    if (selPro) {
      selPro.onchange = autocompletarNombreProfesionalPaciente;
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
            if (window.showNotification) window.showNotification("Completa todos los campos obligatorios", "warning");
            return;
          }

          firebase.firestore().collection("citas").add({
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
            if (window.showNotification) window.showNotification("Cita agendada correctamente", "success");
            closeModal('modal-cita');
          })
          .catch(function(error) {
            if (window.showNotification) window.showNotification("Error al guardar la cita: " + error, "error");
          });
        });
        form._onsubmitSet = true;
      }
    }, 100);
  });
}

// Exponer funciones globales
window.abrirModalAgendarCita = abrirModalAgendarCita;
window.guardarCitaPaciente = guardarCitaPaciente;
window.llenarSelectProfesionesPaciente = llenarSelectProfesionesPaciente;
window.llenarSelectProfesionalesPaciente = llenarSelectProfesionalesPaciente;
window.autocompletarNombreProfesionalPaciente = autocompletarNombreProfesionalPaciente;
window.cargarProfesionalesAtencionPorCesfam = cargarProfesionalesAtencionPorCesfam;
