// Registro de atenciones SIEMPRE vinculadas al paciente y cita

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

            // Obtener el idPaciente desde la cita o generarlo desde el RUT
            const rutPaciente = cita.pacienteRut || cita.rut || "";
            const idPaciente = cita.idPaciente || window.generarIdPaciente(rutPaciente);

            var datosAtencion = {
                idPaciente: idPaciente,
                pacienteId: pacienteId,
                pacienteNombre: cita.pacienteNombre || cita.nombre || "",
                pacienteRut: rutPaciente.replace(/[.\-]/g, '').toUpperCase(),
                cesfam: cita.cesfam || "",
                fecha: cita.fecha || "",
                hora: cita.hora || "",
                descripcion: descripcion,
                tipoAtencion: tipoAtencion,
                profesional: cita.profesionalNombre || (user ? user.email : ""),
                profesionalId: cita.profesionalId || (user ? user.uid : ""),
                fechaRegistro: new Date(),
                fechaCreacion: new Date().toISOString(),
                citaId: citaId
            };

            // Refuerzo: Actualizar paciente SIEMPRE antes de registrar atención
            window.crearOActualizarPaciente({
                rut: rutPaciente,
                nombre: cita.pacienteNombre || cita.nombre || "",
                apellidos: cita.apellidos || "",
                telefono: cita.telefono || "",
                email: cita.email || "",
                direccion: cita.direccion || "",
                cesfam: cita.cesfam || "",
                edad: cita.edad || ""
            }, function() {
                // Usar el sistema unificado
                window.crearAtencionConId(datosAtencion, function(atencionId, pacienteIdResult, error) {
                    if (error) {
                        window.showNotification("Error guardando atención: " + error.message, "error");
                        return;
                    }
                    window.showNotification("Atención registrada correctamente", "success");
                    closeModal("modal-registrar-atencion");
                    if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
                    if (window.mostrarCitasRestantesHoy) window.mostrarCitasRestantesHoy();
                });
            });
        });
    });
});

// Función para registrar atención desde otros flujos
window.registrarAtencion = function(datosAtencion, callback) {
    const rutPaciente = datosAtencion.pacienteRut || datosAtencion.rut || "";
    const idPaciente = datosAtencion.idPaciente || window.generarIdPaciente(rutPaciente);
    var datos = Object.assign({}, datosAtencion, {
        idPaciente: idPaciente,
        fechaRegistro: new Date(),
        fechaCreacion: new Date().toISOString()
    });

    // Refuerzo: Actualizar paciente antes de atención
    window.crearOActualizarPaciente({
        rut: rutPaciente,
        nombre: datosAtencion.pacienteNombre || datosAtencion.nombre || "",
        apellidos: datosAtencion.apellidos || "",
        telefono: datosAtencion.telefono || "",
        email: datosAtencion.email || "",
        direccion: datosAtencion.direccion || "",
        cesfam: datosAtencion.cesfam || "",
        edad: datosAtencion.edad || ""
    }, function() {
        window.crearAtencionConId(datos, function(atencionId, pacienteId, error) {
            if (error) {
                window.showNotification("Error al registrar atención: " + error.message, "error");
                if (typeof callback === "function") callback(false, null);
                return;
            }
            window.showNotification("Atención registrada correctamente", "success");
            if (typeof callback === "function") callback(true, atencionId);
        });
    });
};
