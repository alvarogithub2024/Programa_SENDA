// UTILIDADES/VALIDACIONES.JS

// Valida formato de RUT chileno: 12.345.678-5 o 12345678-5
function validarRUT(rut) {
    if (!rut || typeof rut !== "string") return false;
    rut = rut.replace(/[.\-]/g, '').toUpperCase();
    if (rut.length < 8) return false;
    var cuerpo = rut.slice(0, -1);
    var dv = rut.slice(-1);
    var suma = 0, multiplo = 2;
    for (var i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i], 10) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    var dvEsperado = 11 - (suma % 11);
    dvEsperado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();
    return dv === dvEsperado;
}

// Valida email simple
function validarEmail(email) {
    if (!email || typeof email !== "string") return false;
    var re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i;
    return re.test(email);
}

// Valida teléfono chileno: 9 dígitos, comienza con 9 o 2 (móvil/fijo)
function validarTelefono(phone) {
    if (!phone || typeof phone !== "string") return false;
    phone = phone.replace(/[^0-9]/g, "");
    return phone.length === 9 && /^[29]/.test(phone);
}

// Valida que un campo no esté vacío
function validarNoVacio(valor) {
    return valor !== undefined && valor !== null && String(valor).trim() !== "";
}

// Valida fecha en formato YYYY-MM-DD
function validarFecha(fecha) {
    if (!fecha || typeof fecha !== "string") return false;
    var re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(fecha)) return false;
    var d = new Date(fecha);
    return !isNaN(d.getTime());
}

// Valida que la edad esté en rango [0, 120]
function validarEdad(edad) {
    var n = parseInt(edad, 10);
    return !isNaN(n) && n >= 0 && n <= 120;
}

// Valida password mínimo 8 caracteres, mayúscula, minúscula y número
function validarPassword(password) {
    if (typeof password !== "string") return false;
    return /[A-Z]/.test(password)
        && /[a-z]/.test(password)
        && /[0-9]/.test(password)
        && password.length >= 8;
}

// Valida coincidencia de dos passwords
function validarPasswordsIguales(pass1, pass2) {
    return pass1 === pass2;
}

// Exportar globalmente
window.validarRUT = validarRUT;
window.validarEmail = validarEmail;
window.validarTelefono = validarTelefono;
window.validarNoVacio = validarNoVacio;
window.validarFecha = validarFecha;
window.validarEdad = validarEdad;
window.validarPassword = validarPassword;
window.validarPasswordsIguales = validarPasswordsIguales;
