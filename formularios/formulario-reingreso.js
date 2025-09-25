// FORMULARIOS/FORMULARIO-REINGRESO.JS

function setupFormularioReingreso() {
    const form = document.getElementById("reentry-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Limpia y recoge datos
        const nombre = form.querySelector("#reentry-name").value.trim();
        const rut = form.querySelector("#reentry-rut").value.trim().replace(/[^0-9kK]/g, '').toUpperCase();
        const telefono = limpiarTelefonoChileno(form.querySelector("#reentry-phone").value.trim());
        const cesfam = form.querySelector("#reentry-cesfam").value;
        const motivo = form.querySelector("#reentry-reason").value.trim();

        // Valida
        if (!nombre) return window.showNotification("Nombre completo obligatorio", "warning");
        if (!window.validarRut || !window.validarRut(rut)) return window.showNotification("RUT inválido", "warning");
        if (!window.validarTelefono || !window.validarTelefono(telefono)) return window.showNotification("Teléfono inválido", "warning");
        if (!cesfam) return window.showNotification("Selecciona un CESFAM", "warning");
        if (!motivo) return window.showNotification("Motivo de reingreso obligatorio", "warning");

        // Prepara datos
        const datos = {
            tipo: "reingreso",
            nombre: nombre,
            rut: rut,
            telefono: telefono,
            cesfam: cesfam,
            motivo: motivo,
            fecha: new Date().toISOString()
        };

        guardarReingresoFirebase(datos, form);
    });

    // Botón cancelar (opcional)
    const btnCancelar = form.querySelector('button[type="button"].btn.btn-outline');
    if (btnCancelar) {
        btnCancelar.onclick = function() {
            form.reset();
            document.getElementById("reentry-modal").style.display = "none";
        };
    }
}

// Guarda en colección reingresos
function guardarReingresoFirebase(datos, form) {
    const db = window.getFirestore ? window.getFirestore() : null;
    if (!db) {
        window.showNotification && window.showNotification("No se pudo acceder a la base de datos", "error");
        return;
    }
    db.collection("reingresos").add(datos)
        .then(function() {
            window.showNotification && window.showNotification("Reingreso enviado correctamente", "success");
            form.reset();
            document.getElementById("reentry-modal").style.display = "none";
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error guardando reingreso: " + error.message, "error");
        });
}

// Utilidad para limpiar el teléfono chileno (igual que en paciente)
function limpiarTelefonoChileno(tel) {
    tel = tel.replace(/\D/g, '');
    if (tel.startsWith("56")) tel = tel.slice(2);
    if (tel.length === 11 && tel.startsWith("569")) tel = tel.slice(2);
    return tel;
}

// Exporta globalmente
window.setupFormularioReingreso = setupFormularioReingreso;
window.guardarReingresoFirebase = guardarReingresoFirebase;

document.addEventListener("DOMContentLoaded", setupFormularioReingreso);
