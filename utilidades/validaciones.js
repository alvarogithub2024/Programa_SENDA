/**
 * VALIDACIONES GENERALES
 * Funciones de validación reutilizables en toda la aplicación
 */

import { VALIDACIONES, MENSAJES_ERROR } from '../configuracion/constantes.js';

/**
 * Valida un RUT chileno
 */
function validarRUT(rut) {
    try {
        if (!rut) return { valido: false, mensaje: 'RUT requerido' };
        
        const limpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
        
        if (limpio.length < VALIDACIONES.RUT.MIN_LENGTH || limpio.length > VALIDACIONES.RUT.MAX_LENGTH) {
            return { valido: false, mensaje: 'RUT debe tener entre 8 y 9 dígitos' };
        }
        
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        
        if (!/^\d+$/.test(cuerpo)) {
            return { valido: false, mensaje: 'RUT contiene caracteres inválidos' };
        }
        
        const dvCalculado = calcularDigitoVerificador(cuerpo);
        
        if (dv !== dvCalculado) {
            return { valido: false, mensaje: 'RUT inválido' };
        }
        
        return { valido: true };
        
    } catch (error) {
        console.error('Error validando RUT:', error);
        return { valido: false, mensaje: 'Error en validación de RUT' };
    }
}

/**
 * Calcula el dígito verificador de un RUT
 */
function calcularDigitoVerificador(rutSinDv) {
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutSinDv.length - 1; i >= 0; i--) {
        suma += parseInt(rutSinDv[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dv = 11 - resto;
    
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

/**
 * Valida un email
 */
function validarEmail(email) {
    if (!email) return { valido: false, mensaje: 'Email requerido' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email.trim())) {
        return { valido: false, mensaje: 'Formato de email inválido' };
    }
    
    return { valido: true };
}

/**
 * Valida un email institucional (@senda.cl)
 */
function validarEmailInstitucional(email) {
    const validacionBasica = validarEmail(email);
    if (!validacionBasica.valido) return validacionBasica;
    
    if (!email.trim().endsWith('@senda.cl')) {
        return { valido: false, mensaje: 'Debe ser un email @senda.cl' };
    }
    
    return { valido: true };
}

/**
 * Valida un número de teléfono chileno
 */
function validarTelefono(telefono) {
    if (!telefono) return { valido: false, mensaje: 'Teléfono requerido' };
    
    const telefonoLimpio = telefono.replace(/\D/g, '');
    
    if (telefonoLimpio.length < VALIDACIONES.TELEFONO.MIN_LENGTH) {
        return { valido: false, mensaje: 'Teléfono debe tener al menos 8 dígitos' };
    }
    
    if (telefonoLimpio.length > VALIDACIONES.TELEFONO.MAX_LENGTH) {
        return { valido: false, mensaje: 'Teléfono no puede tener más de 12 dígitos' };
    }
    
    // Validar que empiece con dígitos válidos para Chile
    if (telefonoLimpio.length === 9 && !['2', '3', '4', '5', '6', '7', '8', '9'].includes(telefonoLimpio[0])) {
        return { valido: false, mensaje: 'Número de teléfono inválido para Chile' };
    }
    
    return { valido: true };
}

/**
 * Valida una edad
 */
function validarEdad(edad) {
    if (!edad) return { valido: false, mensaje: 'Edad requerida' };
    
    const edadNum = parseInt(edad);
    
    if (isNaN(edadNum)) {
        return { valido: false, mensaje: 'Edad debe ser un número' };
    }
    
    if (edadNum < VALIDACIONES.EDAD.MIN) {
        return { valido: false, mensaje: `Edad mínima: ${VALIDACIONES.EDAD.MIN} años` };
    }
    
    if (edadNum > VALIDACIONES.EDAD.MAX) {
        return { valido: false, mensaje: `Edad máxima: ${VALIDACIONES.EDAD.MAX} años` };
    }
    
    return { valido: true };
}

/**
 * Valida una contraseña
 */
function validarPassword(password) {
    if (!password) return { valido: false, mensaje: 'Contraseña requerida' };
    
    if (password.length < VALIDACIONES.PASSWORD.MIN_LENGTH) {
        return { valido: false, mensaje: `Contraseña debe tener al menos ${VALIDACIONES.PASSWORD.MIN_LENGTH} caracteres` };
    }
    
    // Validar que tenga al menos una letra y un número
    if (!/[a-zA-Z]/.test(password)) {
        return { valido: false, mensaje: 'Contraseña debe contener al menos una letra' };
    }
    
    if (!/\d/.test(password)) {
        return { valido: false, mensaje: 'Contraseña debe contener al menos un número' };
    }
    
    return { valido: true };
}

/**
 * Valida una fecha
 */
function validarFecha(fecha, opciones = {}) {
    if (!fecha) return { valido: false, mensaje: 'Fecha requerida' };
    
    const fechaObj = new Date(fecha);
    
    if (isNaN(fechaObj.getTime())) {
        return { valido: false, mensaje: 'Fecha inválida' };
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Validar fecha mínima
    if (opciones.fechaMinima) {
        const fechaMin = new Date(opciones.fechaMinima);
        if (fechaObj < fechaMin) {
            return { valido: false, mensaje: `Fecha debe ser posterior a ${fechaMin.toLocaleDateString('es-CL')}` };
        }
    }
    
    // Validar fecha máxima
    if (opciones.fechaMaxima) {
        const fechaMax = new Date(opciones.fechaMaxima);
        if (fechaObj > fechaMax) {
            return { valido: false, mensaje: `Fecha debe ser anterior a ${fechaMax.toLocaleDateString('es-CL')}` };
        }
    }
    
    // Validar que no sea fecha pasada (opcional)
    if (opciones.noPermitirPasado && fechaObj < hoy) {
        return { valido: false, mensaje: 'No se permiten fechas pasadas' };
    }
    
    // Validar que no sea fecha futura (opcional)
    if (opciones.noPermitirFuturo && fechaObj > hoy) {
        return { valido: false, mensaje: 'No se permiten fechas futuras' };
    }
    
    return { valido: true };
}

/**
 * Valida un texto con longitud mínima y máxima
 */
function validarTexto(texto, opciones = {}) {
    if (!texto && opciones.requerido) {
        return { valido: false, mensaje: opciones.mensajeRequerido || 'Campo requerido' };
    }
    
    if (!texto) return { valido: true };
    
    const textoTrimmed = texto.trim();
    
    if (opciones.longitudMinima && textoTrimmed.length < opciones.longitudMinima) {
        return { valido: false, mensaje: `Debe tener al menos ${opciones.longitudMinima} caracteres` };
    }
    
    if (opciones.longitudMaxima && textoTrimmed.length > opciones.longitudMaxima) {
        return { valido: false, mensaje: `No puede tener más de ${opciones.longitudMaxima} caracteres` };
    }
    
    // Validar caracteres permitidos
    if (opciones.soloLetras && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(textoTrimmed)) {
        return { valido: false, mensaje: 'Solo se permiten letras y espacios' };
    }
    
    if (opciones.soloNumeros && !/^\d+$/.test(textoTrimmed)) {
        return { valido: false, mensaje: 'Solo se permiten números' };
    }
    
    if (opciones.alfanumerico && !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(textoTrimmed)) {
        return { valido: false, mensaje: 'Solo se permiten letras, números y espacios' };
    }
    
    return { valido: true };
}

/**
 * Valida un URL
 */
function validarURL(url) {
    if (!url) return { valido: false, mensaje: 'URL requerida' };
    
    try {
        new URL(url);
        return { valido: true };
    } catch {
        return { valido: false, mensaje: 'URL inválida' };
    }
}

/**
 * Valida un formulario completo
 */
function validarFormulario(formulario, reglas) {
    const errores = {};
    let formularioValido = true;
    
    Object.keys(reglas).forEach(campo => {
        const valor = formulario[campo];
        const reglaCampo = reglas[campo];
        let resultado = { valido: true };
        
        // Aplicar validaciones según el tipo
        switch (reglaCampo.tipo) {
            case 'rut':
                resultado = validarRUT(valor);
                break;
            case 'email':
                resultado = validarEmail(valor);
                break;
            case 'email-institucional':
                resultado = validarEmailInstitucional(valor);
                break;
            case 'telefono':
                resultado = validarTelefono(valor);
                break;
            case 'edad':
                resultado = validarEdad(valor);
                break;
            case 'password':
                resultado = validarPassword(valor);
                break;
            case 'fecha':
                resultado = validarFecha(valor, reglaCampo.opciones || {});
                break;
            case 'texto':
                resultado = validarTexto(valor, reglaCampo.opciones || {});
                break;
            case 'url':
                resultado = validarURL(valor);
                break;
            default:
                // Validación personalizada
                if (reglaCampo.validador) {
                    resultado = reglaCampo.validador(valor);
                }
        }
        
        if (!resultado.valido) {
            errores[campo] = resultado.mensaje;
            formularioValido = false;
        }
    });
    
    return {
        valido: formularioValido,
        errores
    };
}

/**
 * Valida campos obligatorios
 */
function validarCamposObligatorios(datos, camposObligatorios) {
    const errores = [];
    
    camposObligatorios.forEach(campo => {
        if (!datos[campo] || (typeof datos[campo] === 'string' && !datos[campo].trim())) {
            errores.push(`${campo} es obligatorio`);
        }
    });
    
    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Valida que al menos uno de los campos esté presente
 */
function validarAlMenosUnCampo(datos, campos, mensaje = 'Al menos un campo es requerido') {
    const tieneAlgunCampo = campos.some(campo => 
        datos[campo] && (typeof datos[campo] !== 'string' || datos[campo].trim())
    );
    
    return {
        valido: tieneAlgunCampo,
        mensaje: tieneAlgunCampo ? '' : mensaje
    };
}

/**
 * Valida formato de hora (HH:MM)
 */
function validarHora(hora) {
    if (!hora) return { valido: false, mensaje: 'Hora requerida' };
    
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!horaRegex.test(hora)) {
        return { valido: false, mensaje: 'Formato de hora inválido (HH:MM)' };
    }
    
    return { valido: true };
}

/**
 * Valida que una fecha y hora estén en el futuro
 */
function validarFechaHoraFutura(fecha, hora) {
    const validacionFecha = validarFecha(fecha);
    if (!validacionFecha.valido) return validacionFecha;
    
    const validacionHora = validarHora(hora);
    if (!validacionHora.valido) return validacionHora;
    
    const fechaHora = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();
    
    if (fechaHora <= ahora) {
        return { valido: false, mensaje: 'La fecha y hora deben estar en el futuro' };
    }
    
    return { valido: true };
}

/**
 * Sanitiza HTML básico para prevenir XSS
 */
function sanitizarHTML(html) {
    const elemento = document.createElement('div');
    elemento.textContent = html;
    return elemento.innerHTML;
}

/**
 * Valida y sanitiza entrada de usuario
 */
function validarYSanitizar(valor, opciones = {}) {
    let valorLimpio = valor;
    
    if (typeof valorLimpio === 'string') {
        valorLimpio = valorLimpio.trim();
        
        if (opciones.sanitizarHTML) {
            valorLimpio = sanitizarHTML(valorLimpio);
        }
        
        if (opciones.removerEspaciosExtra) {
            valorLimpio = valorLimpio.replace(/\s+/g, ' ');
        }
        
        if (opciones.minusculas) {
            valorLimpio = valorLimpio.toLowerCase();
        }
        
        if (opciones.mayusculas) {
            valorLimpio = valorLimpio.toUpperCase();
        }
    }
    
    return {
        valor: valorLimpio,
        esValido: valorLimpio !== null && valorLimpio !== undefined && valorLimpio !== ''
    };
}

export {
    validarRUT,
    validarEmail,
    validarEmailInstitucional,
    validarTelefono,
    validarEdad,
    validarPassword,
    validarFecha,
    validarTexto,
    validarURL,
    validarFormulario,
    validarCamposObligatorios,
    validarAlMenosUnCampo,
    validarHora,
    validarFechaHoraFutura,
    sanitizarHTML,
    validarYSanitizar,
    calcularDigitoVerificador
};
