// ========== calendario/citas.js - ACTUALIZADO ==========

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

// ========== FUNCIÓN ACTUALIZADA CON SISTEMA UNIFICADO ==========
function guardarCitaPaciente(datosCita, callback) {
    if (!window.SISTEMA_ID_UNIFICADO) {
        window.showNotification && window.showNotification("Sistema no inicializado", "error");
        if (typeof callback === "function") callback(null, new Error("Sistema no inicializado"));
        return;
    }
    
    window.SISTEMA_ID_UNIFICADO.crearCitaUnificada(datosCita)
        .then(function(resultado) {
            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
            if (typeof callback === "function") callback(resultado.citaId, resultado.pacienteId);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
            if (typeof callback === "function") callback(null, null, error);
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
          guardarCitaPaciente(datos, function(idCita, idPaciente, error) {
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

          const datosCita = {
            solicitudId: citaId,
            pacienteNombre: nombre,
            pacienteRut: rut,
            profesion: profesion,
            profesionalId: profesional,
            profesionalNombre: profesionalNombre,
            fecha: fecha,
            hora: hora,
            tipo: "paciente",
            estado: "agendada",
            fechaCreacion: new Date().toISOString()
          };

          // Usar sistema unificado
          if (!window.SISTEMA_ID_UNIFICADO) {
            window.showNotification && window.showNotification("Sistema no inicializado", "error");
            return;
          }

          window.SISTEMA_ID_UNIFICADO.crearCitaUnificada(datosCita)
            .then(function(resultado) {
              const db = window.getFirestore();
              return Promise.all([
                db.collection("solicitudes_ingreso").doc(citaId).update({ estado: "agendada" }).catch(() => {}),
                db.collection("reingresos").doc(citaId).update({ estado: "agendada" }).catch(() => {})
              ]);
            })
            .then(function() {
              window.showNotification && window.showNotification("Cita agendada correctamente", "success");
              closeModal('modal-cita');
              if (window.reloadSolicitudesFromFirebase) window.reloadSolicitudesFromFirebase();
            })
            .catch(function(error) {
              window.showNotification && window.showNotification("Error al guardar la cita: " + error.message, "error");
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

// ======================= CONTROL DE PASOS SOLICITUD DE AYUDA (MULTIPASO) =======================

document.addEventListener("DOMContentLoaded", function() {
  // Mostrar/ocultar según selección de tipoSolicitud
  function updateTipoSolicitudUI() {
    const tipo = document.querySelector('input[name="tipoSolicitud"]:checked');
    if (!tipo) return;
    if (tipo.value === 'informacion') {
      document.getElementById('info-email-container').style.display = '';
      document.getElementById('basic-info-container').style.display = 'none';
      document.getElementById('submit-step-1').style.display = 'none';
      document.getElementById('next-step-1').style.display = 'none';
    } else {
      document.getElementById('info-email-container').style.display = 'none';
      document.getElementById('basic-info-container').style.display = '';
      document.getElementById('submit-step-1').style.display = 'none';
      document.getElementById('next-step-1').style.display = '';
    }
  }

  document.querySelectorAll('input[name="tipoSolicitud"]').forEach(function(radio) {
    radio.addEventListener('change', updateTipoSolicitudUI);
  });
  // Ejecutar al cargar
  updateTipoSolicitudUI();

  // Paso 1: Botón siguiente
  const next1 = document.getElementById('next-step-1');
  if (next1) {
    next1.onclick = function() {
      // Validaciones del paso 1 (edad, cesfam, paraMi)
      const edad = document.getElementById('patient-age').value;
      const cesfam = document.getElementById('patient-cesfam').value;
      const paraMi = document.querySelector('input[name="paraMi"]:checked');
      if (!edad || !cesfam || !paraMi) {
        window.showNotification && window.showNotification("Completa todos los campos obligatorios del Paso 1", "warning");
        return;
      }
      // Avanza al paso 2
      document.querySelector('.form-step[data-step="1"]').classList.remove('active');
      document.querySelector('.form-step[data-step="2"]').classList.add('active');
      document.getElementById('form-progress').style.width = "25%";
      document.getElementById('progress-text').innerText = "Paso 2 de 4";
    };
  }

  // Paso 2: Botón anterior
  const prev2 = document.getElementById('prev-step-2');
  if (prev2) {
    prev2.onclick = function() {
      document.querySelector('.form-step[data-step="2"]').classList.remove('active');
      document.querySelector('.form-step[data-step="1"]').classList.add('active');
      document.getElementById('form-progress').style.width = "0%";
      document.getElementById('progress-text').innerText = "Paso 1 de 4";
    };
  }

  // Paso 2: Botón siguiente
  const next2 = document.getElementById('next-step-2');
  if (next2) {
    next2.onclick = function() {
      const nombre = document.getElementById('patient-name').value;
      const apellidos = document.getElementById('patient-lastname').value;
      const rut = document.getElementById('patient-rut').value;
      const telefono = document.getElementById('patient-phone').value;
      if (!nombre || !apellidos || !rut || !telefono) {
        window.showNotification && window.showNotification("Completa todos los campos obligatorios del Paso 2", "warning");
        return;
      }
      document.querySelector('.form-step[data-step="2"]').classList.remove('active');
      document.querySelector('.form-step[data-step="3"]').classList.add('active');
      document.getElementById('form-progress').style.width = "50%";
      document.getElementById('progress-text').innerText = "Paso 3 de 4";
    };
  }

  // Paso 3: Botón anterior
  const prev3 = document.getElementById('prev-step-3');
  if (prev3) {
    prev3.onclick = function() {
      document.querySelector('.form-step[data-step="3"]').classList.remove('active');
      document.querySelector('.form-step[data-step="2"]').classList.add('active');
      document.getElementById('form-progress').style.width = "25%";
      document.getElementById('progress-text').innerText = "Paso 2 de 4";
    };
  }

  // Paso 3: Botón siguiente
  const next3 = document.getElementById('next-step-3');
  if (next3) {
    next3.onclick = function() {
      const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
      const urgencia = document.querySelector('input[name="urgencia"]:checked');
      const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
      if (sustancias.length === 0 || !urgencia || !tratamientoPrevio) {
        window.showNotification && window.showNotification("Completa todos los campos obligatorios del Paso 3", "warning");
        return;
      }
      document.querySelector('.form-step[data-step="3"]').classList.remove('active');
      document.querySelector('.form-step[data-step="4"]').classList.add('active');
      document.getElementById('form-progress').style.width = "75%";
      document.getElementById('progress-text').innerText = "Paso 4 de 4";
    };
  }

  // Paso 4: Botón anterior
  const prev4 = document.getElementById('prev-step-4');
  if (prev4) {
    prev4.onclick = function() {
      document.querySelector('.form-step[data-step="4"]').classList.remove('active');
      document.querySelector('.form-step[data-step="3"]').classList.add('active');
      document.getElementById('form-progress').style.width = "50%";
      document.getElementById('progress-text').innerText = "Paso 3 de 4";
    };
  }

  // Botón "Enviar solo información"
  const btnInfo = document.getElementById('enviar-solo-info');
  if (btnInfo) {
    btnInfo.onclick = function() {
      const email = document.getElementById('info-email').value.trim();
      if (!email) {
        window.showNotification && window.showNotification("Completa el email para recibir información", "warning");
        return;
      }
      const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
      db.collection('solicitudes_informacion').add({
        email: email,
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente',
        origen: 'informacion' // ¡IMPORTANTE para que aparezca el botón "Responder"!
      }).then(() => {
        window.showNotification && window.showNotification("Solicitud enviada. Revisa tu correo.", "success");
        closeModal('patient-modal');
      }).catch((error) => {
        window.showNotification && window.showNotification("Error al guardar solicitud: " + error.message, "error");
      });
    };
  }

  // Botón final "Enviar Solicitud" (multipaso)
  const submitForm = document.getElementById('submit-form');
  if (submitForm) {
    submitForm.onclick = function(e) {
      e.preventDefault();
      const datos = {
        nombre: document.getElementById('patient-name').value.trim(),
        apellidos: document.getElementById('patient-lastname').value.trim(),
        rut: document.getElementById('patient-rut').value.trim(),
        telefono: document.getElementById('patient-phone').value.trim(),
        email: document.getElementById('patient-email').value.trim(),
        direccion: document.getElementById('patient-address').value.trim(),
        edad: document.getElementById('patient-age').value.trim(),
        cesfam: document.getElementById('patient-cesfam').value,
        sustancias: Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(el => el.value),
        tiempoConsumo: document.getElementById('tiempo-consumo').value,
        prioridad: document.querySelector('input[name="urgencia"]:checked')?.value || 'media',
        tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value || '',
        descripcion: document.getElementById('patient-description').value.trim(),
        motivacion: document.getElementById('motivacion-range').value,
        paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || '',
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente',
        origen: 'ingreso' // ¡IMPORTANTE para que aparezca el botón "Agendar cita"!
      };
      if (window.SISTEMA_ID_UNIFICADO) {
        window.SISTEMA_ID_UNIFICADO.crearSolicitudIngreso(datos)
        .then(() => {
          window.showNotification && window.showNotification("Solicitud enviada correctamente", "success");
          closeModal('patient-modal');
        }).catch((error) => {
          window.showNotification && window.showNotification("Error al guardar solicitud: " + error.message, "error");
        });
      } else {
        window.showNotification && window.showNotification("Sistema no inicializado", "error");
      }
    };
  }
});
