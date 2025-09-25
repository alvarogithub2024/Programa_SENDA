// PACIENTES/FICHAS.JS

// Requiere: window.getFirestore, window.showNotification

// Obtiene la ficha completa de un paciente por ID
function obtenerFichaPaciente(pacienteId, callback) {
    var db = window.getFirestore();
    db.collection("pacientes").doc(pacienteId).get()
        .then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Paciente no encontrado", "warning");
                if (typeof callback === "function") callback(null);
                return;
            }
            var datos = doc.data();
            datos.id = doc.id;
            if (typeof callback === "function") callback(datos);
        })
        .catch(function(error) {
            window.showNotification("Error obteniendo ficha: " + error.message, "error");
            if (typeof callback === "function") callback(null);
        });
}

// Guarda información adicional en la ficha del paciente (por ejemplo, notas)
function actualizarFichaPaciente(pacienteId, datosExtra, callback) {
    var db = window.getFirestore();
    db.collection("pacientes").doc(pacienteId).update(datosExtra)
        .then(function() {
            window.showNotification("Ficha actualizada correctamente", "success");
            if (typeof callback === "function") callback(true);
        })
        .catch(function(error) {
            window.showNotification("Error actualizando ficha: " + error.message, "error");
            if (typeof callback === "function") callback(false);
        });
}

// Exportar globalmente
window.obtenerFichaPaciente = obtenerFichaPaciente;
window.actualizarFichaPaciente = actualizarFichaPaciente;
