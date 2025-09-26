// ==== MODAL AGENDAR CITA (Solicitud de Ingreso) ====

// Variables separadas para este modal, así no hay conflicto con "Nueva Cita"
let profesionalesAgendar = [];
let profesionesAgendar = [];
let miCesfamAgendar = null;

// Cargar profesionales y profesiones para el CESFAM del usuario logueado
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

// Llena el select de profesiones en el modal
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

// Llena el select de profesionales en el modal
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

// Autocompleta el nombre del profesional seleccionado
function autocompletarNombreProfesionalAgendarCita() {
  const selProfesional = document.getElementById('modal-cita-profesional');
  const nombreInput = document.getElementById('modal-cita-profesional-nombre');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

// Función principal para abrir el modal y preparar todo
function abrirModalAgendarCita(solicitudId, nombre, rut) {
  cargarProfesionalesAgendarCita(function() {
    llenarSelectProfesionesAgendarCita();
    llenarSelectProfesionalesAgendarCita();
    autocompletarNombreProfesionalAgendarCita();

    document.getElementById('modal-cita-id').value = solicitudId;
    document.getElementById('modal-cita-nombre').textContent = nombre;
    document.getElementById('modal-cita-rut').textContent = rut;

    // Listeners para selects en el modal de agendar cita
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

          // Guardar en Firebase
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
            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
            closeModal('modal-cita');
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

// Exportar funciones globalmente para que puedas llamarlas desde otros scripts
window.abrirModalAgendarCita = abrirModalAgendarCita;
window.cargarProfesionalesAgendarCita = cargarProfesionalesAgendarCita;
window.llenarSelectProfesionesAgendarCita = llenarSelectProfesionesAgendarCita;
window.llenarSelectProfesionalesAgendarCita = llenarSelectProfesionalesAgendarCita;
window.autocompletarNombreProfesionalAgendarCita = autocompletarNombreProfesionalAgendarCita;
