// ==== CITAS DE PACIENTES ====

let profesionalesAtencion = [];
let profesionesAtencion = [];

function cargarProfesionalesAtencion(callback) {
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  db.collection('profesionales').where('activo', '==', true).get().then(snapshot => {
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
}

function llenarSelectProfesionesPaciente() {
  const selProf = document.getElementById('pac-cita-profession');
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
  const selected = selProfesional.options[selProfesional.selectedIndex];
  if (nombreInput) nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function inicializarFlujoPacienteCita() {
  cargarProfesionalesAtencion(function() {
    llenarSelectProfesionesPaciente();
    llenarSelectProfesionalesPaciente();
    autocompletarNombreProfesionalPaciente();
  });

  document.getElementById('pac-cita-profession').onchange = function() {
    llenarSelectProfesionalesPaciente();
    autocompletarNombreProfesionalPaciente();
  };
  document.getElementById('pac-cita-profesional').onchange = function() {
    autocompletarNombreProfesionalPaciente();
  };
}

// Llama a esto AL ABRIR el modal de cita de paciente
function abrirModalCitaPaciente() {
  inicializarFlujoPacienteCita();
  showModal('modal-cita-paciente');
}
