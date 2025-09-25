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

// NUEVO: Cargar horarios disponibles para una fecha y profesional
function cargarHorariosDisponibles(fecha, profesionalId, callback) {
    var db = window.getFirestore();
    // Define los slots posibles (ajusta según tu horario real)
    var horarios = [];
    for (var h = 8; h <= 16; h++) {
        horarios.push(h.toString().padStart(2, '0') + ":00");
        horarios.push(h.toString().padStart(2, '0') + ":30");
    }
    // Busca los horarios ocupados en Firebase
    db.collection("citas")
        .where("fecha", "==", fecha)
        .where("profesionalId", "==", profesionalId)
        .get()
        .then(function(snapshot) {
            var ocupados = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                if (data.hora) ocupados.push(data.hora);
            });
            var disponibles = horarios.filter(function(h) {
                return ocupados.indexOf(h) === -1;
            });
            if (typeof callback === "function") callback(disponibles);
        })
        .catch(function(error) {
            window.showNotification("Error cargando horarios: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// NUEVO: Mostrar horarios disponibles en el select
function mostrarHorariosDisponibles(horarios) {
    var select = document.getElementById('cita-hora');
    select.innerHTML = "";
    if (!horarios.length) {
        var opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Sin horarios disponibles";
        select.appendChild(opt);
        return;
    }
    var optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "Selecciona hora...";
    select.appendChild(optDefault);
    horarios.forEach(function(horario) {
        var opt = document.createElement("option");
        opt.value = horario;
        opt.textContent = horario;
        select.appendChild(opt);
    });
}

// Exportar globalmente
window.agendarCita = agendarCita;
window.modificarCita = modificarCita;
window.eliminarCita = eliminarCita;
window.verDetalleCita = verDetalleCita;
window.cargarHorariosDisponibles = cargarHorariosDisponibles;
window.mostrarHorariosDisponibles = mostrarHorariosDisponibles;
