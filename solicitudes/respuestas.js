// SOLICITUDES/RESPUESTAS.JS

// Requiere: window.getFirestore, window.showNotification, window.getServerTimestamp

// Agrega una respuesta/observación a una solicitud
function agregarRespuestaSolicitud(solicitudId, texto, usuario, callback) {
    var db = window.getFirestore();
    var respuestasRef = db.collection("solicitudes").doc(solicitudId).collection("respuestas");
    var datos = {
        texto: texto,
        usuario: usuario,
        fecha: window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString()
    };
    respuestasRef.add(datos)
        .then(function() {
            window.showNotification("Respuesta guardada", "success");
            if (typeof callback === "function") callback(true);
        })
        .catch(function(error) {
            window.showNotification("Error guardando respuesta: " + error.message, "error");
            if (typeof callback === "function") callback(false);
        });
}

// Obtiene las respuestas/observaciones de una solicitud
function obtenerRespuestasSolicitud(solicitudId, callback) {
    var db = window.getFirestore();
    db.collection("solicitudes").doc(solicitudId).collection("respuestas")
        .orderBy("fecha", "asc")
        .get()
        .then(function(snapshot) {
            var respuestas = [];
            snapshot.forEach(function(doc) {
                respuestas.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(respuestas);
        })
        .catch(function(error) {
            window.showNotification("Error obteniendo respuestas: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// Exportar globalmente
window.agregarRespuestaSolicitud = agregarRespuestaSolicitud;
window.obtenerRespuestasSolicitud = obtenerRespuestasSolicitud;
