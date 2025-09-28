// FORMULARIO DE REINGRESO CORRECTAMENTE VINCULADO A PACIENTES E IDPACIENTE

// --- FUNCIONES DE VINCULACIÓN ---
function guardarReingreso(datos, callback) {
    const db = window.getFirestore();
    const idPaciente = window.generarIdPaciente(datos.rut);

    // Crear o actualizar el paciente con los datos proporcionados
    window.crearOActualizarPaciente(datos, () => {
        // Guardar el reingreso con idPaciente vinculado
        const datosReingreso = {
            ...datos,
            idPaciente: idPaciente,
            rutLimpio: datos.rut.replace(/[.\-]/g, '').toUpperCase(),
            fechaCreacion: new Date().toISOString(),
            estado: 'pendiente'
        };
        db.collection('reingresos').add(datosReingreso)
            .then(docRef => {
                // Actualizar el documento con el id generado
                db.collection('reingresos').doc(docRef.id).update({
                    id: docRef.id,
                    idPaciente: idPaciente
                });
                if (typeof callback === 'function') callback(docRef.id, idPaciente);
            })
            .catch(error => {
                if (typeof callback === 'function') callback(null, null, error);
            });
    });
}

// --- VALIDACIONES REUTILIZADAS ---
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

// --- MANEJO DEL FORMULARIO ---
document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("reentry-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const nombre = document.getElementById("reentry-name").value.trim();
        const rut = document.getElementById("reentry-rut").value.trim();
        const telefono = document.getElementById("reentry-phone").value.trim();
        const cesfam = document.getElementById("reentry-cesfam").value;
        const motivo = document.getElementById("reentry-reason").value.trim();

        // Validaciones básicas
        if (!nombre) return window.showNotification && window.showNotification("Nombre obligatorio", "warning");
        if (!rut || !validarRut(rut)) return window.showNotification && window.showNotification("RUT inválido", "warning");
        if (!telefono || !validarTelefonoChileno(telefono)) return window.showNotification && window.showNotification("Teléfono inválido", "warning");
        if (!cesfam) return window.showNotification && window.showNotification("CESFAM obligatorio", "warning");
        if (!motivo) return window.showNotification && window.showNotification("Motivo obligatorio", "warning");

        const datos = {
            nombre: nombre,
            rut: rut,
            telefono: limpiarTelefonoChileno(telefono),
            cesfam: cesfam,
            motivo: motivo
        };

        guardarReingreso(datos, function(reingresoId, idPaciente, error) {
            if (error) {
                window.showNotification && window.showNotification("Error guardando reingreso: " + error.message, "error");
                return;
            }
            window.showNotification && window.showNotification("Reingreso enviado correctamente", "success");
            form.reset();
            closeModal("reentry-modal");
        });
    });
});
