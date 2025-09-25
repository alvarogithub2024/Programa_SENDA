// CALENDARIO/CITAS.JS

// Requiere: window.getFirestore, window.getServerTimestamp, window.showNotification

// Agenda una nueva cita en Firestore
function agendarCita(datosCita, callback) {
    var db = window.getFirestore();
    var datos = Object.assign({}, datosCita);
    datos.fechaCreacion = window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString();

    // Validaciones mínimas
    if (!datos.fecha || !datos.hora || !datos.pacienteId || !datos.profesionalId) {
        window.showNotification("Completa los campos obligatorios de la cita", "warning");
        return;
    }

    db.collection("citas").add(datos)
        .then(function(docRef) {
            window.showNotification("Cita agendada correctamente", "success");
            if (typeof callback === "function") callback(docRef.id);
        })
        .catch(function(error) {
            window.showNotification("Error al agendar cita: " + error.message, "error");
            if (typeof callback === "function") callback(null, error);
        });
}

// Modifica una cita existente en Firestore
function modificarCita(citaId, nuevosDatos, callback) {
    var db = window.getFirestore();
    nuevosDatos.fechaActualizacion = window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString();

    db.collection("citas").doc(citaId).update(nuevosDatos)
        .then(function() {
            window.showNotification("Cita actualizada", "success");
            if (typeof callback === "function") callback(true);
        })
        .catch(function(error) {
            window.showNotification("Error al actualizar cita: " + error.message, "error");
            if (typeof callback === "function") callback(false, error);
        });
}

// Elimina una cita existente en Firestore
function eliminarCita(citaId, callback) {
    var db = window.getFirestore();
    db.collection("citas").doc(citaId).delete()
        .then(function() {
            window.showNotification("Cita eliminada", "success");
            if (typeof callback === "function") callback(true);
        })
        .catch(function(error) {
            window.showNotification("Error al eliminar cita: " + error.message, "error");
            if (typeof callback === "function") callback(false, error);
        });
}

// Obtiene los detalles de una cita por ID y los muestra
function verDetalleCita(citaId) {
    var db = window.getFirestore();
    db.collection("citas").doc(citaId).get()
        .then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Cita no encontrada", "warning");
                return;
            }
            var data = doc.data();
            // Aquí puedes mostrar los detalles en un modal o sección
            if (window.mostrarModalDetalleCita) {
                window.mostrarModalDetalleCita(data, doc.id);
            } else {
                alert("Detalle de cita:\n" + JSON.stringify(data, null, 2));
            }
        })
        .catch(function(error) {
            window.showNotification("Error obteniendo la cita: " + error.message, "error");
        });
}

// Exportar globalmente
window.agendarCita = agendarCita;
window.modificarCita = modificarCita;
window.eliminarCita = eliminarCita;
window.verDetalleCita = verDetalleCita;
