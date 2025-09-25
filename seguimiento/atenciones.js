// SEGUIMIENTO/ATENCIONES.JS

// Requiere: window.getFirestore, window.showNotification, window.getServerTimestamp

// Registra una nueva atención para un paciente
function registrarAtencion(datosAtencion, callback) {
    var db = window.getFirestore();
    var datos = Object.assign({}, datosAtencion, {
        fechaRegistro: window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString()
    });

    db.collection("atenciones")
        .add(datos)
        .then(function(docRef) {
            window.showNotification("Atención registrada correctamente", "success");
            if (typeof callback === "function") callback(true, docRef.id);
        })
        .catch(function(error) {
            window.showNotification("Error al registrar atención: " + error.message, "error");
            if (typeof callback === "function") callback(false, null);
        });
}

// Edita una atención existente
function editarAtencion(atencionId, nuevosDatos, callback) {
    var db = window.getFirestore();
    db.collection("atenciones").doc(atencionId)
        .update(nuevosDatos)
        .then(function() {
            window.showNotification("Atención actualizada", "success");
            if (typeof callback === "function") callback(true);
        })
        .catch(function(error) {
            window.showNotification("Error actualizando atención: " + error.message, "error");
            if (typeof callback === "function") callback(false);
        });
}

// Obtiene una atención por ID
function obtenerAtencionPorId(atencionId, callback) {
    var db = window.getFirestore();
    db.collection("atenciones").doc(atencionId).get()
        .then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Atención no encontrada", "warning");
                if (typeof callback === "function") callback(null);
                return;
            }
            var data = doc.data();
            data.id = doc.id;
            if (typeof callback === "function") callback(data);
        })
        .catch(function(error) {
            window.showNotification("Error obteniendo atención: " + error.message, "error");
            if (typeof callback === "function") callback(null);
        });
}

// Exportar globalmente
window.registrarAtencion = registrarAtencion;
window.editarAtencion = editarAtencion;
window.obtenerAtencionPorId = obtenerAtencionPorId;
