
let miCesfam = null;
let profesionalesCesfam = [];
let profesionesCesfam = [];

function obtenerMiCesfamYProfesionales(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) return;
    miCesfam = doc.data().cesfam;

    db.collection('profesionales')
      .where('cesfam', '==', miCesfam)
      .where('activo', '==', true)
      .get()
      .then(snapshot => {
        profesionalesCesfam = [];
        profesionesCesfam = [];
        snapshot.forEach(docu => {
          const p = docu.data();
          p.uid = docu.id;
          profesionalesCesfam.push(p);
          if (p.profession && !profesionesCesfam.includes(p.profession)) {
            profesionesCesfam.push(p.profession);
          }
        });
        if (typeof callback === 'function') callback();
      });
  });
}

function llenarSelectProfesiones() {
  const selProf = document.getElementById('prof-cita-profession');
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesCesfam.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesion(prof);
    selProf.appendChild(opt);
  });
}

function llenarSelectProfesionales() {
  const selProfesion = document.getElementById('prof-cita-profession');
  const selProfesional = document.getElementById('prof-cita-profesional');
  selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
  const filtro = selProfesion.value;
  profesionalesCesfam
    .filter(p => p.profession === filtro)
    .forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.uid;
      opt.textContent = `${p.nombre} ${p.apellidos}`;
      opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
      selProfesional.appendChild(opt);
    });
  const nombreInput = document.getElementById('prof-cita-profesional-nombre');
  if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesional() {
  const selProfesional = document.getElementById('prof-cita-profesional');
  const nombreInput = document.getElementById('prof-cita-profesional-nombre');
  const selected = selProfesional.options[selProfesional.selectedIndex];
  if (nombreInput) nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function inicializarFlujoProfesionalesCita() {
  obtenerMiCesfamYProfesionales(function() {
    llenarSelectProfesiones();
    llenarSelectProfesionales();
    autocompletarNombreProfesional();
  });

  document.getElementById('prof-cita-profession').onchange = function() {
    llenarSelectProfesionales();
    autocompletarNombreProfesional();
  };
  document.getElementById('prof-cita-profesional').onchange = function() {
    autocompletarNombreProfesional();
  };
}

// Llama a esto AL ABRIR el modal de cita profesional
// Ejemplo:
function abrirModalCitaProfesional() {
  inicializarFlujoProfesionalesCita();
  showModal('modal-cita-profesional');
}
