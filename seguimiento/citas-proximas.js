// SEGUIMIENTO/CITAS-PROXIMAS.JS

// Carga las citas próximas de un paciente (por ID) ordenadas por fecha futura
function cargarCitasProximas(pacienteId, callback) {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);

    db.collection("citas")
        .where("pacienteId", "==", pacienteId)
        .where("fecha", ">=", hoy)
        .orderBy("fecha", "asc")
        .get()
        .then(function(snapshot) {
            var citas = [];
            snapshot.forEach(function(doc) {
                citas.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(citas);
        })
        .catch(function(error) {
            window.showNotification("Error cargando citas próximas: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// Renderiza la lista de próximas citas en el seguimiento (todas las citas del día)
function mostrarCitasProximas(citas, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = "";
    if (!citas.length) {
        cont.innerHTML = "<p>No hay citas próximas.</p>";
        return;
    }
    var ul = document.createElement("ul");
    citas.forEach(function(c) {
        var li = document.createElement("li");
        li.innerHTML = `
            <strong>${window.formatFecha ? window.formatFecha(c.fecha) : c.fecha}</strong>
            &mdash; ${c.hora || ""} (${c.pacienteNombre || c.nombre || ""}) 
            <button class="btn btn-outline btn-sm" onclick="abrirModalRegistrarAtencion('${c.id}')">Registrar atención</button>
        `;
        ul.appendChild(li);
    });
    cont.appendChild(ul);
}

// Mostrar solo citas del día actual en el grid de próximas citas (SEGUIMIENTO)
function cargarCitasProximasHoy() {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);
    db.collection("citas")
        .where("fecha", "==", hoy)
        .orderBy("hora", "asc")
        .get()
        .then(function(snapshot) {
            var citas = [];
            snapshot.forEach(function(doc) {
                citas.push(Object.assign({ id: doc.id }, doc.data()));
            });
            mostrarCitasProximasSeguimiento(citas, "upcoming-appointments-grid");
        })
        .catch(function(error) {
            window.showNotification("Error cargando citas del día: " + error.message, "error");
        });
}

function mostrarCitasProximasSeguimiento(citas, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = "";
    if (!citas.length) {
        cont.innerHTML = "<p>No hay citas próximas para hoy.</p>";
        return;
    }
    citas.forEach(function(cita) {
        var div = document.createElement("div");
        div.className = "appointment-item";
        div.innerHTML = `
            <div><b>${cita.hora || ""}</b> - <b>${cita.pacienteNombre || cita.nombre || ""}</b> (${cita.tipoProfesional || cita.profesion || ""})<br>
            <span>${cita.cesfam || ""}</span></div>
            <button class="btn btn-outline btn-sm" onclick="abrirModalRegistrarAtencion('${cita.id}')">Registrar atención</button>
        `;
        cont.appendChild(div);
    });
}

// Función global para abrir el modal de atención
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
    cargarCitasProximasHoy();
    setInterval(cargarCitasProximasHoy, 5 * 60 * 1000);
});

// Exportar globalmente
window.cargarCitasProximas = cargarCitasProximas;
window.mostrarCitasProximas = mostrarCitasProximas;
