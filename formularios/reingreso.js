// ========== formularios/reingreso.js - COMPLETO CON SISTEMA UNIFICADO ==========

function setupFormularioReingreso() {
    const form = document.getElementById("reentry-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Obtener y limpiar datos del formulario
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

        // Validaciones
        if (!nombre) return window.showNotification("El nombre es obligatorio", "warning");
        if (!rut || !window.validarRut || !window.validarRut(rut)) return window.showNotification("RUT inválido", "warning");
        if (!telefono || !window.validarTelefono || !window.validarTelefono(telefono)) return window.showNotification("Teléfono inválido", "warning");
        if (!cesfam) return window.showNotification("Selecciona un CESFAM", "warning");
        if (!motivo) return window.showNotification("El motivo es obligatorio", "warning");

        // Preparar datos para el sistema unificado
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

// ========== FUNCIÓN PRINCIPAL CON SISTEMA UNIFICADO ==========
function guardarReingresoEnFirebase(data) {
    if (!window.SISTEMA_ID_UNIFICADO) {
        window.showNotification && window.showNotification("Sistema no inicializado", "error");
        return;
    }
    
    // Usar el sistema unificado para crear el reingreso
    window.SISTEMA_ID_UNIFICADO.crearReingresoUnificado(data)
        .then(function(resultado) {
            console.log('✅ Reingreso creado:', resultado);
            window.showNotification && window.showNotification("Solicitud de reingreso enviada correctamente", "success");
            
            // Limpiar formulario y cerrar modal
            document.getElementById("reentry-form").reset();
            document.getElementById("reentry-modal").style.display = "none";
        })
        .catch(function(error) {
            console.error('❌ Error guardando reingreso:', error);
            window.showNotification && window.showNotification("Error guardando reingreso: " + error.message, "error");
        });
}

// ========== FUNCIONES DE VALIDACIÓN ==========
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

// Asegurar que las funciones de validación estén disponibles globalmente
window.validarRut = window.validarRut || validarRut;
window.validarTelefono = window.validarTelefono || validarTelefonoChileno;

// ========== EXPORTAR FUNCIONES ==========
window.setupFormularioReingreso = setupFormularioReingreso;
window.guardarReingresoEnFirebase = guardarReingresoEnFirebase;

// ========== INICIALIZACIÓN AUTOMÁTICA ==========
document.addEventListener("DOMContentLoaded", setupFormularioReingreso);

console.log('🔄 Formulario de reingreso cargado con sistema unificado');
