// ========== seguimiento/citas-proximas.js - SOLO EL PROFESIONAL DE LA CITA PUEDE REGISTRAR ATENCIÓN ==========

function getHoraActualChile() {
    let now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    let h = now.getHours();
    let m = now.getMinutes();
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getFechaActualChile() {
    let now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    return now.toISOString().slice(0, 10);
}

function mostrarPacienteActualHoy() {
    var db = window.getFirestore();
    if (!db) {
        console.error('❌ No se pudo acceder a Firestore');
        return;
    }
    var hoy = getFechaActualChile();
    var horaActual = getHoraActualChile();

    db.collection("citas")
        .where("fecha", "==", hoy)
        .get()
        .then(function(snapshot) {
            let citaActual = null;
            let nowMinutes = parseInt(horaActual.slice(0,2),10)*60 + parseInt(horaActual.slice(3,5),10);

            snapshot.forEach(function(doc) {
                let cita = doc.data();
                cita.id = doc.id;
                if (cita.hora) {
                    let citaMin = parseInt(cita.hora.slice(0,2),10)*60 + parseInt(cita.hora.slice(3,5),10);
                    if (nowMinutes >= citaMin && nowMinutes <= citaMin + 15) {
                        citaActual = cita;
                    }
                }
            });

            let cont = document.getElementById("patients-timeline");
            if (!cont) return;
            cont.innerHTML = "";

            if (!citaActual) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-user-clock"></i>
                        <p>No hay paciente agendado para la hora actual (${horaActual}).</p>
                        <small>Mostrando pacientes con citas en curso o que comenzaron hace máximo 15 minutos</small>
                    </div>
                `;
                return;
            }

            // SOLO EL PROFESIONAL DE LA CITA PUEDE REGISTRAR ATENCIÓN
            const user = firebase.auth().currentUser;
            let registrarBtn = '';
            if (user && citaActual.profesionalId && citaActual.profesionalId === user.uid) {
                registrarBtn = `<button class="btn btn-primary btn-sm" onclick="abrirModalRegistrarAtencion('${citaActual.id}')">
                        <i class="fas fa-notes-medical"></i> Registrar atención
                    </button>`;
            } else {
                registrarBtn = `<button class="btn btn-primary btn-sm" disabled
                        title="Solo el profesional asignado puede registrar esta atención">
                        <i class="fas fa-notes-medical"></i> Registrar atención
                    </button>`;
            }

            let div = document.createElement("div");
            div.className = "appointment-item";
            div.innerHTML = `
                <div class="cita-info">
                    <b>${citaActual.hora}</b> - <b>${citaActual.pacienteNombre || citaActual.nombre || "Sin nombre"}</b>
                    <br>
                    <span>
                        ${citaActual.tipoProfesional || citaActual.profesion || "Sin profesión"} | 
                        ${citaActual.cesfam || "Sin CESFAM"}
                    </span>
                    ${citaActual.rut ? `<br><span>RUT: ${citaActual.rut}</span>` : ''}
                </div>
                <div class="cita-actions">
                    ${registrarBtn}
                </div>
            `;
            cont.appendChild(div);
        })
        .catch(function(error) {
            let cont = document.getElementById("patients-timeline");
            if (cont) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando paciente de hoy: ${error.message}</p>
                    </div>
                `;
            }
        });
}

function mostrarCitasRestantesHoy() {
    var db = window.getFirestore();
    if (!db) {
        console.error('❌ No se pudo acceder a Firestore');
        return;
    }
    var hoy = getFechaActualChile();
    var horaActual = getHoraActualChile();

    db.collection("citas")
        .where("fecha", "==", hoy)
        .get()
        .then(function(snapshot) {
            let citas = [];
            snapshot.forEach(function(doc) {
                let cita = doc.data();
                cita.id = doc.id;
                if (cita.hora && cita.hora > horaActual) {
                    citas.push(cita);
                }
            });

            citas.sort((a, b) => a.hora.localeCompare(b.hora));

            let cont = document.getElementById("upcoming-appointments-grid");
            if (!cont) return;
            cont.innerHTML = "";

            if (!citas.length) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-calendar-check"></i>
                        <p>No hay próximas citas para hoy después de las ${horaActual}.</p>
                    </div>
                `;
                return;
            }

            const user = firebase.auth().currentUser;

            citas.forEach(function(cita) {
                let registrarBtn = '';
                if (user && cita.profesionalId && cita.profesionalId === user.uid) {
                    registrarBtn = `<button class="btn btn-primary btn-sm" onclick="abrirModalRegistrarAtencion('${cita.id}')">
                        <i class="fas fa-notes-medical"></i> Registrar atención
                    </button>`;
                } else {
                    registrarBtn = `<button class="btn btn-primary btn-sm" disabled
                        title="Solo el profesional asignado puede registrar esta atención">
                        <i class="fas fa-notes-medical"></i> Registrar atención
                    </button>`;
                }

                let div = document.createElement("div");
                div.className = "appointment-item";
                div.innerHTML = `
                    <div class="cita-info">
                        <b>${cita.hora}</b> - <b>${cita.pacienteNombre || cita.nombre || "Sin nombre"}</b>
                        <br>
                        <span>
                            ${cita.tipoProfesional || cita.profesion || "Sin profesión"} | 
                            ${cita.cesfam || "Sin CESFAM"}
                        </span>
                        ${cita.rut ? `<br><span>RUT: ${cita.rut}</span>` : ''}
                    </div>
                    <div class="cita-actions">
                        ${registrarBtn}
                    </div>
                `;
                cont.appendChild(div);
            });
        })
        .catch(function(error) {
            let cont = document.getElementById("upcoming-appointments-grid");
            if (cont) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando próximas citas: ${error.message}</p>
                    </div>
                `;
            }
        });
}

window.abrirModalRegistrarAtencion = function(citaId) {
    var db = window.getFirestore();
    db.collection("citas").doc(citaId).get().then(function(doc) {
        if (!doc.exists) {
            window.showNotification && window.showNotification("Cita no encontrada", "error");
            return;
        }
        var cita = doc.data();
        cita.id = doc.id;

        var pacienteInfo = `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #2563eb; margin-bottom: 0.5rem;">
                    <i class="fas fa-user"></i> Información del Paciente
                </h4>
                <p><b>Paciente:</b> ${cita.pacienteNombre || cita.nombre || "Sin nombre"}</p>
                <p><b>RUT:</b> ${cita.pacienteRut || cita.rut || "Sin RUT"}</p>
                <p><b>CESFAM:</b> ${cita.cesfam || "Sin CESFAM"}</p>
                <p><b>Fecha y Hora:</b> ${cita.fecha || ""} ${cita.hora || ""}</p>
                <p><b>Profesional:</b> ${cita.profesionalNombre || "Sin profesional asignado"}</p>
            </div>
        `;

        document.getElementById("atencion-cita-id").value = cita.id || "";
        document.getElementById("atencion-paciente-id").value = cita.pacienteId || "";
        document.getElementById("atencion-descripcion").value = "";
        document.getElementById("atencion-tipo").value = "";

        showModal("modal-registrar-atencion");
    })
    .catch(function(error) {
        window.showNotification && window.showNotification("Error al cargar datos de la cita", "error");
    });
};

function initUpcomingAppointments() {
    mostrarPacienteActualHoy();
    mostrarCitasRestantesHoy();
    const intervalo = setInterval(function() {
        mostrarPacienteActualHoy();
        mostrarCitasRestantesHoy();
    }, 60 * 1000);
    return function cleanup() {
        clearInterval(intervalo);
    };
}

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(initUpcomingAppointments, 2000);
});

window.mostrarPacienteActualHoy = mostrarPacienteActualHoy;
window.mostrarCitasRestantesHoy = mostrarCitasRestantesHoy;
window.initUpcomingAppointments = initUpcomingAppointments;
window.initUpcomingAppointmentsFromSeguimiento = initUpcomingAppointments;
