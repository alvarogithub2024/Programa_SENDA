// FORMULARIOS/VALIDACIONES.JS - Funciones de validación consolidadas

/**
 * Valida un RUT chileno. Devuelve true si es válido.
 */
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

/**
 * Valida un correo electrónico.
 */
function validarEmail(email) {
    if (!email) return false;
    return /^[\w\.\-]+@([\w\-]+\.)+[a-zA-Z]{2,7}$/.test(email);
}

/**
 * Valida un teléfono chileno (9 dígitos, comienza con 9).
 */
function validarTelefono(telefono) {
    if (!telefono) return false;
    telefono = limpiarTelefonoChileno(telefono);
    return telefono.length === 9 && telefono[0] === '9';
}

/**
 * Limpia un teléfono chileno eliminando caracteres especiales
 */
function limpiarTelefonoChileno(tel) {
    tel = tel.replace(/\D/g, '');
    if (tel.startsWith("56")) tel = tel.slice(2);
    if (tel.length === 11 && tel.startsWith("569")) tel = tel.slice(2);
    return tel;
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
 * Valida fecha en formato YYYY-MM-DD
 */
function validarFecha(fecha) {
    if (!fecha || typeof fecha !== "string") return false;
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(fecha)) return false;
    const d = new Date(fecha);
    return !isNaN(d.getTime());
}

/**
 * Valida password mínimo 6 caracteres
 */
function validarPassword(password) {
    return typeof password === "string" && password.length >= 6;
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
    if (!window.CESFAM_PUENTE_ALTO || !window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) {
        errores.cesfam = "CESFAM inválido";
    }
    
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
    if (!window.CESFAM_PUENTE_ALTO || !window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) {
        errores.cesfam = "CESFAM inválido";
    }
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
    if (!validarPassword(datos.password)) errores.password = "Contraseña mínima 6 caracteres";
    if (!window.PROFESIONES || !window.PROFESIONES[datos.profesion]) {
        errores.profesion = "Profesión inválida";
    }
    if (!window.CESFAM_PUENTE_ALTO || !window.CESFAM_PUENTE_ALTO.includes(datos.cesfam)) {
        errores.cesfam = "CESFAM inválido";
    }
    
    return { esValido: Object.keys(errores).length === 0, errores };
}

// EXPORTAR GLOBALMENTE - LÍNEAS CORREGIDAS
window.validarRut = validarRut;
window.validarEmail = validarEmail;
window.validarTelefono = validarTelefono;
window.limpiarTelefonoChileno = limpiarTelefonoChileno;
window.validarNoVacio = validarNoVacio;
window.validarEdad = validarEdad;
window.validarFecha = validarFecha;
window.validarPassword = validarPassword;
window.validarFormularioPaciente = validarFormularioPaciente;
window.validarFormularioReingreso = validarFormularioReingreso;
window.validarFormularioLogin = validarFormularioLogin;
window.validarFormularioRegistro = validarFormularioRegistro;
