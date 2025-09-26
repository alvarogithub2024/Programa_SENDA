function abrirModalAgendarCitaProfesional(solicitudId, nombre, rut) {
  cargarProfesionalesAgendarCitaProfesional(function() {
    llenarSelectProfesionesAgendarCitaProfesional();
    llenarSelectProfesionalesAgendarCitaProfesional();
    autocompletarNombreProfesionalAgendarCitaProfesional();

    // Asigna los datos solo si el elemento existe
    var inputIdProf = document.getElementById('modal-cita-id-prof');
    if (inputIdProf) inputIdProf.value = solicitudId;

    // Mostrar nombre completo y rut ARRIBA
    var nombreSpanProf = document.getElementById('modal-cita-nombre-prof');
    if (nombreSpanProf) nombreSpanProf.textContent = nombre;

    var rutSpanProf = document.getElementById('modal-cita-rut-prof');
    if (rutSpanProf) rutSpanProf.textContent = rut;

    // Nuevo: mostrar detalles de cita (profesión, profesional, fecha, hora) EN UN DIV
    function actualizarResumenCitaAgendarProf() {
      var resumenDiv = document.getElementById('modal-cita-resumen-prof');
      if (!resumenDiv) return;
      var profesion = document.getElementById('modal-cita-profession-prof')?.value || "";
      var profesional = document.getElementById('modal-cita-profesional-nombre-prof')?.value || "";
      var fecha = document.getElementById('modal-cita-fecha-prof')?.value || "";
      var hora = document.getElementById('modal-cita-hora-prof')?.value || "";
      resumenDiv.innerHTML = `
        <strong>Profesión:</strong> ${profesion ? profesion.replace(/_/g, " ") : "-"}<br>
        <strong>Profesional:</strong> ${profesional || "-"}<br>
        <strong>Fecha:</strong> ${fecha || "-"}<br>
        <strong>Hora:</strong> ${hora || "-"}
      `;
    }
    // Actualizar resumen al cambiar campos
    ['modal-cita-profession-prof', 'modal-cita-profesional-prof', 'modal-cita-fecha-prof', 'modal-cita-hora-prof'].forEach(id => {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', actualizarResumenCitaAgendarProf);
    });
    setTimeout(actualizarResumenCitaAgendarProf, 200);

    // Listeners normales
    const selProf = document.getElementById('modal-cita-profession-prof');
    if (selProf) {
      selProf.onchange = function() {
        llenarSelectProfesionalesAgendarCitaProfesional();
        autocompletarNombreProfesionalAgendarCitaProfesional();
        actualizarHorasAgendarProfesional();
        actualizarResumenCitaAgendarProf();
      };
    }
    const selPro = document.getElementById('modal-cita-profesional-prof');
    if (selPro) {
      selPro.onchange = function() {
        autocompletarNombreProfesionalAgendarCitaProfesional();
        actualizarHorasAgendarProfesional();
        actualizarResumenCitaAgendarProf();
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
              db.collection("solicitudes_ingreso").doc(solicitudId).update({ estado: "agendada" })
                .catch(() => {})
                .finally(() => {
                  db.collection("reingresos").doc(solicitudId).update({ estado: "agendada" })
                    .catch(() => {})
                    .finally(() => {
                      window.showNotification && window.showNotification("Cita agendada correctamente", "success");
                      closeModal('modal-agendar-cita-profesional');
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
window.abrirModalNuevaCitaProfesional = abrirModalNuevaCitaProfesional;
window.abrirModalAgendarCitaProfesional = abrirModalAgendarCitaProfesional;

window.cargarProfesionalesAgendarCitaProfesional = cargarProfesionalesAgendarCitaProfesional;
window.llenarSelectProfesionesAgendarCitaProfesional = llenarSelectProfesionesAgendarCitaProfesional;
window.llenarSelectProfesionalesAgendarCitaProfesional = llenarSelectProfesionalesAgendarCitaProfesional;
window.autocompletarNombreProfesionalAgendarCitaProfesional = autocompletarNombreProfesionalAgendarCitaProfesional;
window.actualizarHorasAgendarProfesional = actualizarHorasAgendarProfesional;
window.inicializarListenersAgendarCitaProfesional = inicializarListenersAgendarCitaProfesional;
