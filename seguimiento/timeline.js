function cargarTimelinePaciente(pacienteId, callback) {
    var db = window.getFirestore();
    db.collection("atenciones")
        .where("pacienteId", "==", pacienteId)
        .orderBy("fecha", "desc")
        .get()
        .then(function(snapshot) {
            var atenciones = [];
            snapshot.forEach(function(doc) {
                atenciones.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(atenciones);
        })
        .catch(function(error) {
            window.showNotification("Error cargando timeline: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

function mostrarTimeline(atenciones, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = "";
    if (!atenciones.length) {
        cont.innerHTML = "<p>No hay atenciones registradas.</p>";
        return;
    }
    atenciones.forEach(function(a) {
        var div = document.createElement("div");
        div.className = "timeline-item";
        div.innerHTML = `
            <div class="timeline-fecha">${window.formatFecha ? window.formatFecha(a.fecha) : a.fecha}</div>
            <div class="timeline-detalle">
                <strong>${a.tipoAtencion || "Atención"}</strong>
                <p>${a.descripcion || ""}</p>
                <small>${a.profesional || ""}</small>
            </div>
        `;
        cont.appendChild(div);
    });
}

window.cargarTimelinePaciente = cargarTimelinePaciente;
window.mostrarTimeline = mostrarTimeline;
