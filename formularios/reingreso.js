
function setupFormularioReingreso() {
    const form = document.getElementById("reentry-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const nombre = form.querySelector("#reentry-name").value.trim();
        const rut = form.querySelector("#reentry-rut").value.trim().replace(/[^0-9kK]/g, '').toUpperCase();
        const telefono = limpiarTelefonoChileno(form.querySelector("#reentry-phone").value.trim());
        const cesfam = form.querySelector("#reentry-cesfam").value;
        const motivo = form.querySelector("#reentry-reason").value.trim();
        const observaciones = ""; 
        const origen = "web";
        const prioridad = "media";
        const profesionalAsignado = null;
        const tipo = "reingreso";
        const version = 1;

        if (!nombre) return window.showNotification("El nombre es obligatorio", "warning");
        if (!rut || !window.validarRut || !window.validarRut(rut)) return window.showNotification("RUT inválido", "warning");
        if (!telefono || !window.validarTelefono || !window.validarTelefono(telefono)) return window.showNotification("Teléfono inválido", "warning");
        if (!cesfam) return window.showNotification("Selecciona un CESFAM", "warning");
        if (!motivo) return window.showNotification("El motivo es obligatorio", "warning");

        const data = {
            nombre,
            rut,
            telefono,
            cesfam,
            motivo,
            observaciones,
            origen,
            prioridad,
            profesionalAsignado,
            tipo,
            version,
            estado: "pendiente",
            fechaCreacion: fechaChileISO(),
            fechaRespuesta: null,
            fechaUltimaActualizacion: fechaChileISO()
        };

        guardarReingresoEnFirebase(data);
    });
}


function fechaChileISO() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" })).toISOString();
}


function guardarReingresoEnFirebase(data) {
    const db = window.getFirestore ? window.getFirestore() : null;
    if (!db) {
        window.showNotification && window.showNotification("No se pudo acceder a la base de datos", "error");
        return;
    }
    db.collection("reingresos").add(data)
        .then(function(docRef) {
            db.collection("reingresos").doc(docRef.id).set({ id: docRef.id }, { merge: true })
            .then(function() {
                window.showNotification && window.showNotification("Solicitud de reingreso enviada correctamente", "success");
                document.getElementById("reentry-form").reset();
                document.getElementById("reentry-modal").style.display = "none";
            })
            .catch(function(error) {
                window.showNotification && window.showNotification("Reingreso guardado pero no se pudo registrar el ID: "+error.message, "warning");
            });

            // --- SINCRONIZAR PACIENTE ---
            if (window.sincronizarPaciente) {
                window.sincronizarPaciente(data); // <-- Llamada a la función de sincronización
            }
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error guardando reingreso: "+error.message, "error");
        });
}


function validarRut(rut) {
    if (!rut) return false;
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length < 8 || rut.length > 9) return false;
    let cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1);
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    let dvEsperado = 11 - (suma % 11);
    dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    return dv === dvEsperado;
}
window.validarRut = window.validarRut || validarRut;


function limpiarTelefonoChileno(tel) {
    tel = tel.replace(/\D/g, '');
    if (tel.startsWith("56")) tel = tel.slice(2);
    if (tel.length === 11 && tel.startsWith("569")) tel = tel.slice(2);
    return tel;
}
function validarTelefonoChileno(telefono) {
    telefono = limpiarTelefonoChileno(telefono);
    return telefono.length === 9 && telefono[0] === "9";
}
window.validarTelefono = window.validarTelefono || validarTelefonoChileno;

window.setupFormularioReingreso = setupFormularioReingreso;
window.guardarReingresoEnFirebase = guardarReingresoEnFirebase;

document.addEventListener("DOMContentLoaded", setupFormularioReingreso);

