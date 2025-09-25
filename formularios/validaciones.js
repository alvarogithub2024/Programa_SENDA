// formularios/validaciones.js

/**
 * Valida un RUT chileno. Devuelve true si es válido.
 */
function validarRut(rut) {
    if (!rut) return false;
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase(); // Limpiar: solo números y K
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
/**
 * Valida un correo electrónico.
 */
function validarEmail(email) {
    if (!email) return false;
    return /^[\w\.\-]+@([\w\-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}

/**
 * Valida un teléfono chileno (9 dígitos, opcionalmente con +56).
 */
function validarTelefono(telefono) {
    if (!telefono) return false;
    telefono = telefono.replace(/\D/g, '');
    if (telefono.startsWith('56')) telefono = telefono.slice(2);
    return telefono.length === 9 && telefono[0] === '9';
}

/**
 * Valida que un campo de texto no esté vacío.
 */
function validarNoVacio(valor) {
    return typeof valor === "string" ? valor.trim() !== "" : !!valor;
}

/**
 * Valida la edad (debe ser número entre 12 y 120).
 */
function validarEdad(edad) {
    edad = parseInt(edad, 10);
    return !isNaN(edad) && edad >= 12 && edad <= 120;
}

/**
 * Valida un formulario de paciente (devuelve objeto {esValido, errores})
 */
function validarFormularioPaciente(datos) {
    let errores = {};
    if (!validarNoVacio(datos.nombre)) errores.nombre = "El nombre es obligatorio";
    if (!validarNoVacio(datos.apellidos)) errores.apellidos = "Los apellidos son obligatorios";
    if (!validarRut(datos.rut)) errores.rut = "RUT inválido";
    if (!validarTelefono(datos.telefono)) errores.telefono = "Teléfono inválido";
    if (datos.email && !validarEmail(datos.email)) errores.email = "Correo inválido";
    if (!validarEdad(datos.edad)) errores.edad = "Edad fuera de rango";
    if (!window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) errores.cesfam = "CESFAM inválido";
    return { esValido: Object.keys(errores).length === 0, errores };
}

/**
 * Valida un formulario de reingreso
 */
function validarFormularioReingreso(datos) {
    let errores = {};
    if (!validarNoVacio(datos.nombre)) errores.nombre = "Nombre obligatorio";
    if (!validarRut(datos.rut)) errores.rut = "RUT inválido";
    if (!validarTelefono(datos.telefono)) errores.telefono = "Teléfono inválido";
    if (!window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) errores.cesfam = "CESFAM inválido";
    if (!validarNoVacio(datos.motivo)) errores.motivo = "Motivo obligatorio";
    return { esValido: Object.keys(errores).length === 0, errores };
}

/**
 * Valida el formulario de login de profesional
 */
function validarFormularioLogin(datos) {
    let errores = {};
    if (!validarEmail(datos.email)) errores.email = "Correo inválido";
    if (!validarNoVacio(datos.password)) errores.password = "Contraseña obligatoria";
    return { esValido: Object.keys(errores).length === 0, errores };
}

/**
 * Valida el formulario de registro de profesional
 */
function validarFormularioRegistro(datos) {
    let errores = {};
    if (!validarNoVacio(datos.nombre)) errores.nombre = "Nombre obligatorio";
    if (!validarNoVacio(datos.apellidos)) errores.apellidos = "Apellidos obligatorios";
    if (!validarEmail(datos.email)) errores.email = "Correo inválido";
    if (!/.*@senda\.cl$/.test(datos.email)) errores.email = "El correo debe ser @senda.cl";
    if (!validarNoVacio(datos.password) || datos.password.length < 6) errores.password = "Contraseña mínima 6 caracteres";
    if (!window.PROFESIONES[datos.profesion]) errores.profesion = "Profesión inválida";
    if (!window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) errores.cesfam = "CESFAM inválido";
    return { esValido: Object.keys(errores).length === 0, errores };
}

// Exportar globalmente
window.validarRut = validarRut;
window.validarEmail = validarEmail;
window.validarTelefono = validarTelefono;
window.validarNoVacio = validarNoVacio;
window.validarEdad = validarEdad;
window.validarFormularioPaciente = validarFormularioPaciente;
window.validarFormularioReingreso = validarFormularioReingreso;
window.validarFormularioLogin = validarFormularioLogin;
window.validarFormularioRegistro = validarFormularioRegistro;
