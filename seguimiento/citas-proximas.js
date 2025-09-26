// SEGUIMIENTO/CITAS-PROXIMAS.JS

// --- Utilidad para obtener hora actual Chile ---
function getHoraActualChile() {
    let now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    let h = now.getHours();
    let m = now.getMinutes();
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// --- Mostrar el paciente de la hora actual en "Pacientes de Hoy" ---
// MODIFICADO: El paciente permanece en pantalla al menos 7 minutos desde que inicia su cita
function mostrarPacienteActualHoy() {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);
    var horaActual = getHoraActualChile();

    db.collection("citas")
        .where("fecha", "==", hoy)
        .orderBy("hora", "asc")
        .get()
        .then(function(snapshot) {
            let citaActual = null;
            let nowMinutes = parseInt(horaActual.slice(0,2),10)*60 + parseInt(horaActual.slice(3,5),10);
            snapshot.forEach(function(doc) {
                let cita = doc.data();
                let citaMin = parseInt(cita.hora.slice(0,2),10)*60 + parseInt(cita.hora.slice(3,5),10);
                // Mostrar paciente si la cita comenzó hace <= 7 minutos
                if (nowMinutes >= citaMin && nowMinutes <= citaMin + 7) {
                    citaActual = Object.assign({ id: doc.id }, cita);
                }
            });

            let cont = document.getElementById("patients-timeline");
            if (!cont) return;
            cont.innerHTML = "";
            if (!citaActual) {
                cont.innerHTML = `<div class="no-results"><i class="fas fa-user-clock"></i><p>No hay paciente agendado para la hora actual (${horaActual}).</p></div>`;
                return;
            }
            let div = document.createElement("div");
            div.className = "appointment-item";
            div.innerHTML = `
                <div>
                  <b>${citaActual.hora}</b> - <b>${citaActual.pacienteNombre || citaActual.nombre || ""}</b> (${citaActual.tipoProfesional || citaActual.profesion || ""})<br>
                  <span>${citaActual.cesfam || ""}</span>
                </div>
                <button class="btn btn-outline btn-sm" onclick="abrirModalRegistrarAtencion('${citaActual.id}')">Registrar atención</button>
            `;
            cont.appendChild(div);
        })
        .catch(function(error) {
            let cont = document.getElementById("patients-timeline");
            if (cont) cont.innerHTML = `<div class="no-results">Error cargando paciente de hoy: ${error.message}</div>`;
        });
}

// --- Mostrar todas las citas restantes del día en "Próximas citas" ---
function mostrarCitasRestantesHoy() {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);
    var horaActual = getHoraActualChile();

    db.collection("citas")
        .where("fecha", "==", hoy)
        .orderBy("hora", "asc")
        .get()
        .then(function(snapshot) {
            let citas = [];
            snapshot.forEach(function(doc) {
                let cita = doc.data();
                // Solo mostrar citas con hora mayor a la actual
                if (cita.hora > horaActual) {
                    citas.push(Object.assign({ id: doc.id }, cita));
                }
            });

            let cont = document.getElementById("upcoming-appointments-grid");
            if (!cont) return;
            cont.innerHTML = "";
            if (!citas.length) {
                cont.innerHTML = `<div class="no-results"><i class="fas fa-calendar-check"></i><p>No hay próximas citas para hoy después de las ${horaActual}.</p></div>`;
                return;
            }
            citas.forEach(function(cita) {
                let div = document.createElement("div");
                div.className = "appointment-item";
                div.innerHTML = `
                    <div>
                      <b>${cita.hora}</b> - <b>${cita.pacienteNombre || cita.nombre || ""}</b> (${cita.tipoProfesional || cita.profesion || ""})<br>
                      <span>${cita.cesfam || ""}</span>
                    </div>
                `;
                cont.appendChild(div);
            });
        })
        .catch(function(error) {
            let cont = document.getElementById("upcoming-appointments-grid");
            if (cont) cont.innerHTML = `<div class="no-results">Error cargando próximas citas: ${error.message}</div>`;
        });
}

// --- Función global para abrir el modal de atención ---
window.abrirModalRegistrarAtencion = function(citaId) {
    var db = window.getFirestore();
    db.collection("citas").doc(citaId).get().then(function(doc) {
        if (!doc.exists) {
            window.showNotification("Cita no encontrada", "error");
            return;
        }
        var cita = doc.data();
        cita.id = doc.id;
        var pacienteInfo = `
            <p><b>Paciente:</b> ${cita.pacienteNombre || cita.nombre || ""}</p>
            <p><b>RUT:</b> ${cita.pacienteRut || cita.rut || ""}</p>
            <p><b>CESFAM:</b> ${cita.cesfam || ""}</p>
            <p><b>Fecha:</b> ${cita.fecha || ""} ${cita.hora || ""}</p>
            <p><b>Profesional:</b> ${cita.profesionalNombre || ""}</p>
        `;
        document.getElementById("atencion-paciente-info").innerHTML = pacienteInfo;
        document.getElementById("atencion-cita-id").value = cita.id;
        document.getElementById("atencion-paciente-id").value = cita.pacienteId || "";

        showModal("modal-registrar-atencion");
    });
};

document.addEventListener("DOMContentLoaded", function() {
    mostrarPacienteActualHoy();
    mostrarCitasRestantesHoy();
    // Actualiza cada minuto ambas vistas
    setInterval(function() {
        mostrarPacienteActualHoy();
        mostrarCitasRestantesHoy();
    }, 60 * 1000);
});

// Exportar globalmente si necesitas
window.mostrarPacienteActualHoy = mostrarPacienteActualHoy;
window.mostrarCitasRestantesHoy = mostrarCitasRestantesHoy;
