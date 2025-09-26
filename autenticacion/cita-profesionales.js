// ==== NUEVA CITA ENTRE PROFESIONALES ====

// Variables para Nueva Cita
let profesionalesProfesional = [];
let profesionesProfesional = [];
let miCesfamProfesional = null;

function cargarProfesionalesNuevaCitaProfesional(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) return;
    miCesfamProfesional = doc.data().cesfam;
    db.collection('profesionales').where('activo', '==', true).where('cesfam', '==', miCesfamProfesional).get().then(snapshot => {
      profesionalesProfesional = [];
      profesionesProfesional = [];
      snapshot.forEach(docu => {
        const p = docu.data();
        p.uid = docu.id;
        profesionalesProfesional.push(p);
        if (p.profession && !profesionesProfesional.includes(p.profession)) {
          profesionesProfesional.push(p.profession);
        }
      });
      if (typeof callback === 'function') callback();
    });
  });
}

function capitalizarProfesionProfesional(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesNuevaCitaProfesional() {
  const selProf = document.getElementById('prof-cita-profession');
  if (!selProf) return;
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesProfesional.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesionProfesional(prof);
    selProf.appendChild(opt);
  });
}

function llenarSelectProfesionalesNuevaCitaProfesional() {
  const selProfesion = document.getElementById('prof-cita-profession');
  const selProfesional = document.getElementById('prof-cita-profesional');
  if (!selProfesion || !selProfesional) return;
  selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
  const filtro = selProfesion.value;
  profesionalesProfesional
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

function autocompletarNombreProfesionalNuevaCitaProfesional() {
  const selProfesional = document.getElementById('prof-cita-profesional');
  const nombreInput = document.getElementById('prof-cita-profesional-nombre');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

// Llenar horas disponibles según fecha y profesional seleccionado (NUEVA CITA)
function actualizarHorasNuevaCitaProfesional() {
  const fecha = document.getElementById('prof-cita-fecha')?.value;
  const profesionalId = document.getElementById('prof-cita-profesional')?.value;
  const selectHora = document.getElementById('prof-cita-hora');
  if (!selectHora) return;
  selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
  if (!fecha || !profesionalId) return;
  window.cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
    if (!horariosDisponibles.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin horarios disponibles';
      selectHora.appendChild(opt);
    } else {
      horariosDisponibles.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        selectHora.appendChild(opt);
      });
    }
  });
}

function inicializarListenersNuevaCitaProfesional() {
  var fechaInput = document.getElementById('prof-cita-fecha');
  var profSelect = document.getElementById('prof-cita-profesional');
  if (fechaInput && profSelect) {
    fechaInput.addEventListener('change', actualizarHorasNuevaCitaProfesional);
    profSelect.addEventListener('change', actualizarHorasNuevaCitaProfesional);
  }
}

function abrirModalNuevaCitaProfesional() {
  cargarProfesionalesNuevaCitaProfesional(function() {
    llenarSelectProfesionesNuevaCitaProfesional();
    llenarSelectProfesionalesNuevaCitaProfesional();
    autocompletarNombreProfesionalNuevaCitaProfesional();

    const selProf = document.getElementById('prof-cita-profession');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesNuevaCitaProfesional();
        autocompletarNombreProfesionalNuevaCitaProfesional();
        actualizarHorasNuevaCitaProfesional();
      };
    }
    const selPro = document.getElementById('prof-cita-profesional');
    if (selPro) {
      selPro.onchange = function() {
        autocompletarNombreProfesionalNuevaCitaProfesional();
        actualizarHorasNuevaCitaProfesional();
      };
    }
    inicializarListenersNuevaCitaProfesional();
    actualizarHorasNuevaCitaProfesional();

    showModal('modal-nueva-cita-profesional');

    setTimeout(function() {
      var form = document.getElementById('form-nueva-cita-profesional');
      if (form && !form._onsubmitSet) {
        form.onsubmit = function(e) {
          e.preventDefault();
          // Guardar la cita de profesional aquí
        };
        form._onsubmitSet = true;
      }
    }, 100);
  });
}


// ==== AGENDAR CITA ENTRE PROFESIONALES (Solicitud de Ingreso) ====

// Variables para Agendar Cita
let profesionalesAgendarProf = [];
let profesionesAgendarProf = [];
let miCesfamAgendarProf = null;

function cargarProfesionalesAgendarCitaProfesional(callback) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  db.collection('profesionales').doc(user.uid).get().then(doc => {
    if (!doc.exists) return;
    miCesfamAgendarProf = doc.data().cesfam;
    db.collection('profesionales').where('activo', '==', true).where('cesfam', '==', miCesfamAgendarProf).get().then(snapshot => {
      profesionalesAgendarProf = [];
      profesionesAgendarProf = [];
      snapshot.forEach(docu => {
        const p = docu.data();
        p.uid = docu.id;
        profesionalesAgendarProf.push(p);
        if (p.profession && !profesionesAgendarProf.includes(p.profession)) {
          profesionesAgendarProf.push(p.profession);
        }
      });
      if (typeof callback === 'function') callback();
    });
  });
}

function capitalizarProfesionAgendarProf(str) {
  if (!str) return "";
  str = str.replace(/_/g, " ");
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesAgendarCitaProfesional() {
  const selProf = document.getElementById('modal-cita-profession-prof');
  if (!selProf) return;
  selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
  profesionesAgendarProf.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = capitalizarProfesionAgendarProf(prof);
    selProf.appendChild(opt);
  });
}

function llenarSelectProfesionalesAgendarCitaProfesional() {
  const selProfesion = document.getElementById('modal-cita-profession-prof');
  const selProfesional = document.getElementById('modal-cita-profesional-prof');
  if (!selProfesion || !selProfesional) return;
  selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
  const filtro = selProfesion.value;
  profesionalesAgendarProf
    .filter(p => p.profession === filtro)
    .forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.uid;
      opt.textContent = `${p.nombre} ${p.apellidos}`;
      opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
      selProfesional.appendChild(opt);
    });
  const nombreInput = document.getElementById('modal-cita-profesional-nombre-prof');
  if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesionalAgendarCitaProfesional() {
  const selProfesional = document.getElementById('modal-cita-profesional-prof');
  const nombreInput = document.getElementById('modal-cita-profesional-nombre-prof');
  if (!selProfesional || !nombreInput) return;
  const selected = selProfesional.options[selProfesional.selectedIndex];
  nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

// Llenar horas disponibles según fecha y profesional seleccionado (AGENDAR CITA)
function actualizarHorasAgendarProfesional() {
  const fecha = document.getElementById('modal-cita-fecha-prof')?.value;
  const profesionalId = document.getElementById('modal-cita-profesional-prof')?.value;
  const selectHora = document.getElementById('modal-cita-hora-prof');
  if (!selectHora) return;
  selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
  if (!fecha || !profesionalId) return;
  window.cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
    if (!horariosDisponibles.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin horarios disponibles';
      selectHora.appendChild(opt);
    } else {
      horariosDisponibles.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        selectHora.appendChild(opt);
      });
    }
  });
}

function inicializarListenersAgendarCitaProfesional() {
  var fechaInput = document.getElementById('modal-cita-fecha-prof');
  var profSelect = document.getElementById('modal-cita-profesional-prof');
  if (fechaInput && profSelect) {
    fechaInput.addEventListener('change', actualizarHorasAgendarProfesional);
    profSelect.addEventListener('change', actualizarHorasAgendarProfesional);
  }
}

function abrirModalAgendarCitaProfesional(solicitudId, nombre, rut) {
  cargarProfesionalesAgendarCitaProfesional(function() {
    llenarSelectProfesionesAgendarCitaProfesional();
    llenarSelectProfesionalesAgendarCitaProfesional();
    autocompletarNombreProfesionalAgendarCitaProfesional();

    document.getElementById('modal-cita-id-prof').value = solicitudId;
    document.getElementById('modal-cita-nombre-prof').textContent = nombre;
    document.getElementById('modal-cita-rut-prof').textContent = rut;

    const selProf = document.getElementById('modal-cita-profession-prof');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesAgendarCitaProfesional();
        autocompletarNombreProfesionalAgendarCitaProfesional();
        actualizarHorasAgendarProfesional();
      };
    }
    const selPro = document.getElementById('modal-cita-profesional-prof');
    if (selPro) {
      selPro.onchange = function() {
        autocompletarNombreProfesionalAgendarCitaProfesional();
        actualizarHorasAgendarProfesional();
      };
    }
    inicializarListenersAgendarCitaProfesional();
    actualizarHorasAgendarProfesional();

    showModal('modal-agendar-cita-profesional');

    setTimeout(function() {
      var form = document.getElementById('form-agendar-cita-profesional');
      if (form && !form._onsubmitSet) {
        form.addEventListener('submit', function(e){
          e.preventDefault();
          // --- AGREGAR GUARDADO EN FIREBASE ---
          const cita = {
    solicitudId: document.getElementById('modal-cita-id-prof').value,
    nombre: document.getElementById('modal-cita-nombre-prof').textContent,
    rut: document.getElementById('modal-cita-rut-prof').textContent,
    profesion: document.getElementById('modal-cita-profession-prof').value,
    profesionalId: document.getElementById('modal-cita-profesional-prof').value,
    profesionalNombre: document.getElementById('modal-cita-profesional-nombre-prof').value,
    fecha: document.getElementById('modal-cita-fecha-prof').value,
    hora: document.getElementById('modal-cita-hora-prof').value,
    creado: new Date().toISOString(),
    tipo: "profesional"
  };

  // Validar campos obligatorios
  if (!cita.nombre || !cita.rut || !cita.profesion || !cita.profesionalId || !cita.fecha || !cita.hora) {
    window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
    return;
  }

  // Guardar en Firebase
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
  db.collection("citas").add(cita)
    .then(function(docRef) {
      // Cambia estado en solicitudes_ingreso y reingresos
      const solicitudId = cita.solicitudId;
      // Primero intenta en ingreso
      db.collection("solicitudes_ingreso").doc(solicitudId).update({ estado: "agendada" })
        .catch(() => {})
        .finally(() => {
          // También intenta en reingresos
          db.collection("reingresos").doc(solicitudId).update({ estado: "agendada" })
            .catch(() => {})
            .finally(() => {
              window.showNotification && window.showNotification("Cita agendada correctamente", "success");
              closeModal('modal-agendar-cita-profesional');
            });
        });
    })
    .catch(function(error) {
      window.showNotification && window.showNotification("Error al guardar la cita: " + error, "error");
    });
});
// Exportar funciones globales
window.abrirModalNuevaCitaProfesional = abrirModalNuevaCitaProfesional;
window.abrirModalAgendarCitaProfesional = abrirModalAgendarCitaProfesional;
