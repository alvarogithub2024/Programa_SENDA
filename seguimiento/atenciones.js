// SEGUIMIENTO/ATENCIONES.JS

document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("form-registrar-atencion");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var citaId = document.getElementById("atencion-cita-id").value;
        var pacienteId = document.getElementById("atencion-paciente-id").value;
        var descripcion = document.getElementById("atencion-descripcion").value.trim();
        var tipoAtencion = document.getElementById("atencion-tipo").value;

        if (!descripcion || !tipoAtencion) {
            window.showNotification("Completa los campos obligatorios", "warning");
            return;
        }

        var db = window.getFirestore();
        var user = firebase.auth().currentUser;

        db.collection("citas").doc(citaId).get().then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Cita no encontrada", "error");
                return;
            }
            var cita = doc.data();

            var datosAtencion = {
                pacienteId: pacienteId,
                pacienteNombre: cita.pacienteNombre || cita.nombre || "",
                pacienteRut: cita.pacienteRut || cita.rut || "",
                cesfam: cita.cesfam || "",
                fecha: cita.fecha || "",
                hora: cita.hora || "",
                descripcion: descripcion,
                tipoAtencion: tipoAtencion,
                profesional: cita.profesionalNombre || (user ? user.email : ""),
                profesionalId: cita.profesionalId || (user ? user.uid : ""),
                fechaRegistro: new Date().toISOString(),
                citaId: citaId
            };

            db.collection("atenciones").add(datosAtencion)
            .then(function() {
                window.showNotification("Atención registrada correctamente", "success");
                closeModal("modal-registrar-atencion");
                // Opcional: recargar pacientes de hoy
                if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
                if (window.mostrarCitasRestantesHoy) window.mostrarCitasRestantesHoy();
            })
            .catch(function(error) {
                window.showNotification("Error guardando atención: " + error.message, "error");
            });
        });
    });
});

// Exportar globalmente
window.registrarAtencion = function(datosAtencion, callback) {
    var db = window.getFirestore();
    var datos = Object.assign({}, datosAtencion, {
        fechaRegistro: new Date().toISOString()
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
};
