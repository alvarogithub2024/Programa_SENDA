// FORMULARIOS/FORMULARIO-PACIENTE.JS

// Requiere: window.validarRUT, window.validarEmail, window.validarTelefono, window.showNotification

// Valida todos los campos del formulario de paciente
function validarFormularioPaciente(form) {
    var rut = form.rut.value.trim();
    var nombre = form.nombre.value.trim();
    var apellidos = form.apellidos.value.trim();
    var fechaNacimiento = form.fechaNacimiento.value;
    var email = form.email.value.trim();
    var telefono = form.telefono.value.trim();

    if (!window.validarRUT(rut)) {
        window.showNotification("RUT inválido", "warning");
        return false;
    }
    if (!nombre || !apellidos) {
        window.showNotification("Nombre y apellidos obligatorios", "warning");
        return false;
    }
    if (!window.validarFecha(fechaNacimiento)) {
        window.showNotification("Fecha de nacimiento inválida", "warning");
        return false;
    }
    if (email && !window.validarEmail(email)) {
        window.showNotification("Correo electrónico inválido", "warning");
        return false;
    }
    if (telefono && !window.validarTelefono(telefono)) {
        window.showNotification("Teléfono inválido", "warning");
        return false;
    }
    return true;
}

// Limpia todos los campos del formulario de paciente
function limpiarFormularioPaciente(form) {
    form.reset();
    if (form.rut) form.rut.focus();
}

// Asigna eventos al formulario (llamar una vez en la carga)
function setupFormularioPaciente() {
    var form = document.getElementById("formulario-paciente");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        if (validarFormularioPaciente(form)) {
            window.showNotification("Paciente guardado correctamente", "success");
            // Aquí puedes llamar a la función para guardar el paciente en Firestore
            // window.guardarPaciente(form)
        }
    });

    var limpiarBtn = document.getElementById("btn-limpiar-paciente");
    if (limpiarBtn) {
        limpiarBtn.addEventListener("click", function(e) {
            e.preventDefault();
            limpiarFormularioPaciente(form);
        });
    }
}

// Exportar globalmente
window.validarFormularioPaciente = validarFormularioPaciente;
window.limpiarFormularioPaciente = limpiarFormularioPaciente;
window.setupFormularioPaciente = setupFormularioPaciente;
