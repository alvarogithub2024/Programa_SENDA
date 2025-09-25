// FORMULARIOS/FORMULARIO-REINGRESO.JS

// Requiere: window.showNotification, window.getFirestore, window.getServerTimestamp

// Valida todos los campos del formulario de reingreso
function validarFormularioReingreso(form) {
    var rut = form.rut.value.trim();
    var motivo = form.motivo.value.trim();
    var fechaReingreso = form.fechaReingreso.value;

    if (!window.validarRUT(rut)) {
        window.showNotification("RUT inválido", "warning");
        return false;
    }
    if (!motivo) {
        window.showNotification("Motivo de reingreso obligatorio", "warning");
        return false;
    }
    if (!window.validarFecha(fechaReingreso)) {
        window.showNotification("Fecha de reingreso inválida", "warning");
        return false;
    }
    return true;
}

// Limpia todos los campos del formulario de reingreso
function limpiarFormularioReingreso(form) {
    form.reset();
    if (form.rut) form.rut.focus();
}

// Guarda el reingreso en Firestore
function guardarReingreso(form) {
    if (!validarFormularioReingreso(form)) return;

    var db = window.getFirestore();
    var datos = {
        rut: form.rut.value.trim(),
        motivo: form.motivo.value.trim(),
        fechaReingreso: form.fechaReingreso.value,
        observaciones: form.observaciones.value.trim() || "",
        fechaRegistro: window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString()
    };

    db.collection('reingresos').add(datos)
        .then(function() {
            window.showNotification("Reingreso guardado correctamente", "success");
            limpiarFormularioReingreso(form);
        })
        .catch(function(error) {
            window.showNotification("Error al guardar reingreso: " + error.message, "error");
        });
}

// Asigna eventos al formulario (llamar una vez en la carga)
function setupFormularioReingreso() {
    var form = document.getElementById("formulario-reingreso");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        guardarReingreso(form);
    });

    var limpiarBtn = document.getElementById("btn-limpiar-reingreso");
    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", function(e) {
            e.preventDefault();
            limpiarFormularioReingreso(form);
        });
    }
}

// Exportar globalmente
window.validarFormularioReingreso = validarFormularioReingreso;
window.limpiarFormularioReingreso = limpiarFormularioReingreso;
window.guardarReingreso = guardarReingreso;
window.setupFormularioReingreso = setupFormularioReingreso;
