// SEGUIMIENTO/CITAS-PROXIMAS.JS

// Requiere: window.getFirestore, window.showNotification

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

// Renderiza la lista de próximas citas
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
            &mdash; ${c.hora || ""} (${c.motivo || "Cita"})
        `;
        ul.appendChild(li);
    });
    cont.appendChild(ul);
}

// Exportar globalmente
window.cargarCitasProximas = cargarCitasProximas;
window.mostrarCitasProximas = mostrarCitasProximas;
