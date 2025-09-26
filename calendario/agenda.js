function mostrarCitasDelDia(fecha) {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList) return;
  appointmentsList.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>`;
  const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

  db.collection("citas")
    .where("fecha", "==", fecha)
    .orderBy("hora", "asc")
    .get()
    .then(function(snapshot) {
      const citas = [];
      snapshot.forEach(function(doc) {
        const cita = doc.data();
        cita.id = doc.id;
        citas.push(cita);
      });
      appointmentsList.innerHTML = "";
      if (!citas.length) {
        appointmentsList.innerHTML = "<div class='no-results'>No hay citas agendadas para este día.</div>";
        return;
      }
      citas.forEach(function(cita) {
        const div = document.createElement("div");
        div.className = "appointment-item";
        let mainName = "";
        let subName = "";
        if (cita.tipo === "profesional") {
          // Para citas entre profesionales
          mainName = cita.profesionalNombre || cita.nombre || "Sin nombre";
          subName = cita.nombre && cita.nombre !== mainName ? cita.nombre : "";
        } else {
          // Para citas de paciente
          mainName = cita.pacienteNombre || cita.paciente || cita.nombre || "Sin nombre";
          subName = cita.profesionalNombre || "";
        }
        div.innerHTML = `
          <div class="appointment-time">${cita.hora || ""}</div>
          <div class="appointment-details">
            <div class="appointment-patient"><strong>${mainName}</strong></div>
            ${subName ? `<div class="appointment-professional">${subName}</div>` : ""}
          </div>
          <div class="appointment-status">
            <span class="status-badge ${cita.estado || "agendada"}">${cita.estado || "Agendada"}</span>
          </div>
        `;
        appointmentsList.appendChild(div);
      });
      window.citasDelDia = citas;
    })
    .catch(function(error) {
      appointmentsList.innerHTML = "<div class='no-results'>Error cargando citas.</div>";
      if (window.showNotification) window.showNotification("Error cargando citas del día: " + error.message, "error");
    });
}
);
