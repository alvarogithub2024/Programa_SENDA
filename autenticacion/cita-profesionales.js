// Asegúrate que este script se carga después de Firebase y después del login del profesional

// 1. Obtener CESFAM del profesional logueado
let miCesfam = null;
let profesionalesCesfam = [];
let profesionesCesfam = [];

function obtenerMiCesfamYProfesionales(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  // 1.1 Obtener mi CESFAM
  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) return;
    miCesfam = doc.data().cesfam;

    // 1.2 Obtener profesionales (solo activos) de MI CESFAM
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

// 2. Llenar el select de profesiones
function llenarSelectProfesiones() {
  const selProf = document.getElementById('cita-profession');
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesCesfam.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesion(prof);
    selProf.appendChild(opt);
  });
}

// 3. Al elegir profesión, llenar profesionales de esa profesión
function llenarSelectProfesionales() {
  const selProfesion = document.getElementById('cita-profession');
  const selProfesional = document.getElementById('cita-profesional');
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
  document.getElementById('cita-profesional-nombre').value = '';
}

// 4. Al elegir profesional, autocompletar nombre
function autocompletarNombreProfesional() {
  const selProfesional = document.getElementById('cita-profesional');
  const nombreInput = document.getElementById('cita-profesional-nombre');
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

// Utilidad para capitalizar profesión
function capitalizarProfesion(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 5. Inicializar flujo al abrir el modal de cita
function inicializarFlujoProfesionalesCita() {
  obtenerMiCesfamYProfesionales(function() {
    llenarSelectProfesiones();
    llenarSelectProfesionales();
    autocompletarNombreProfesional();
  });

  // Eventos
  document.getElementById('cita-profession').onchange = function() {
    llenarSelectProfesionales();
    autocompletarNombreProfesional();
  };
  document.getElementById('cita-profesional').onchange = function() {
    autocompletarNombreProfesional();
  };
}

// Puedes llamar a esta función cada vez que abras el modal de nueva cita
// Por ejemplo:
document.addEventListener("DOMContentLoaded", function() {
  const btnNuevaCita = document.getElementById('nueva-cita-btn');
  if (btnNuevaCita) {
    btnNuevaCita.onclick = function() {
      inicializarFlujoProfesionalesCita();
      showModal('modal-nueva-cita');
    };
  }
});
