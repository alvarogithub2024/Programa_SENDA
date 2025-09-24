/**
 * VALIDACIONES GENERALES
 * Funciones de validación para formularios y datos
 */

/**
 * Valida el formato de un email
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
    try {
        if (!email || typeof email !== 'string') return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailLimpio = email.trim();
        
        return emailRegex.test(emailLimpio) && emailLimpio.length <= 254;
    } catch (error) {
        console.error('Error validando email:', error);
        return false;
    }
}

/**
 * Valida el formato y dígito verificador de un RUT chileno
 * @param {string} rut
 * @returns {boolean}
 */
function validarRUT(rut) {
    try {
        if (!rut || typeof rut !== 'string') return false;
        
        const rutLimpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
        
        if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
        
        const cuerpo = rutLimpio.slice(0, -1);
        const digitoVerificador = rutLimpio.slice(-1);
        
        // Validar que el cuerpo sean solo números
        if (!/^\d+$/.test(cuerpo)) return false;
        
        // Calcular dígito verificador
        let suma = 0;
        let multiplicador = 2;
        
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo[i]) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const residuo = suma % 11;
        const digitoCalculado = 11 - residuo;
        
        let digitoEsperado;
        if (digitoCalculado === 11) {
            digitoEsperado = '0';
        } else if (digitoCalculado === 10) {
            digitoEsperado = 'K';
        } else {
            digitoEsperado = digitoCalculado.toString();
        }
        
        return digitoVerificador === digitoEsperado;
        
    } catch (error) {
        console.error('Error validando RUT:', error);
        return false;
    }
}

/**
 * Valida el formato de un número de teléfono chileno
 * @param {string} telefono
 * @returns {boolean}
 */
function validarTelefono(telefono) {
    try {
        if (!telefono || typeof telefono !== 'string') return false;
        
        const telefonoLimpio = telefono.replace(/\D/g, '');
        
        // Acepta entre 8 y 12 dígitos
        return telefonoLimpio.length >= 8 && telefonoLimpio.length <= 12;
        
    } catch (error) {
        console.error('Error validando teléfono:', error);
        return false;
    }
}

/**
 * Valida que un texto no esté vacío y tenga longitud mínima
 * @param {string} texto
 * @param {number} longitudMinima
 * @returns {boolean}
 */
function validarTextoRequerido(texto, longitudMinima = 1) {
    try {
        if (!texto || typeof texto !== 'string') return false;
        
        const textoLimpio = texto.trim();
        return textoLimpio.length >= longitudMinima;
        
    } catch (error) {
        console.error('Error validando texto requerido:', error);
        return false;
    }
}

/**
 * Valida que una edad esté en un rango válido
 * @param {number|string} edad
 * @param {number} minimo
 * @param {number} maximo
 * @returns {boolean}
 */
function validarEdad(edad, minimo = 12, maximo = 120) {
    try {
        const edadNumerica = parseInt(edad);
        
        if (isNaN(edadNumerica)) return false;
        
        return edadNumerica >= minimo && edadNumerica <= maximo;
        
    } catch (error) {
        console.error('Error validando edad:', error);
        return false;
    }
}

/**
 * Valida que una contraseña cumpla los requisitos mínimos
 * @param {string} password
 * @returns {object}
 */
function validarPassword(password) {
    const resultado = {
        valida: false,
        errores: []
    };
    
    try {
        if (!password || typeof password !== 'string') {
            resultado.errores.push('La contraseña es requerida');
            return resultado;
        }
        
        if (password.length < 6) {
            resultado.errores.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (password.length > 128) {
            resultado.errores.push('La contraseña no puede tener más de 128 caracteres');
        }
        
        if (!/[A-Za-z]/.test(password)) {
            resultado.errores.push('La contraseña debe contener al menos una letra');
        }
        
        if (!/\d/.test(password)) {
            resultado.errores.push('La contraseña debe contener al menos un número');
        }
        
        resultado.valida = resultado.errores.length === 0;
        return resultado;
        
    } catch (error) {
        console.error('Error validando contraseña:', error);
        resultado.errores.push('Error al validar contraseña');
        return resultado;
    }
}

/**
 * Valida una fecha en formato YYYY-MM-DD
 * @param {string} fecha
 * @returns {boolean}
 */
function validarFecha(fecha) {
    try {
        if (!fecha || typeof fecha !== 'string') return false;
        
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha)) return false;
        
        const fechaObj = new Date(fecha);
        const [año, mes, dia] = fecha.split('-').map(Number);
        
        return fechaObj.getFullYear() === año &&
               fechaObj.getMonth() === mes - 1 &&
               fechaObj.getDate() === dia;
               
    } catch (error) {
        console.error('Error validando fecha:', error);
        return false;
    }
}

/**
 * Valida que una fecha no sea anterior a hoy
 * @param {string} fecha
 * @returns {boolean}
 */
function validarFechaNoAnterior(fecha) {
    try {
        if (!validarFecha(fecha)) return false;
        
        const fechaIngresada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        return fechaIngresada >= hoy;
        
    } catch (error) {
        console.error('Error validando fecha no anterior:', error);
        return false;
    }
}

/**
 * Valida un formulario completo
 * @param {HTMLFormElement} formulario
 * @param {Object} reglas
 * @returns {object}
 */
function validarFormulario(formulario, reglas = {}) {
    const resultado = {
        valido: true,
        errores: {},
        camposConError: []
    };
    
    try {
        if (!formulario) {
            resultado.valido = false;
            resultado.errores.general = 'Formulario no encontrado';
            return resultado;
        }
        
        const formData = new FormData(formulario);
        
        for (const [campo, valor] of formData.entries()) {
            const regla = reglas[campo];
            if (!regla) continue;
            
            let esValido = true;
            let mensajeError = '';
            
            // Validación requerido
            if (regla.requerido && !validarTextoRequerido(valor)) {
                esValido = false;
                mensajeError = regla.mensajeRequerido || `${campo} es requerido`;
            }
            
            // Validaciones específicas
            if (esValido && valor) {
                if (regla.tipo === 'email' && !validarEmail(valor)) {
                    esValido = false;
                    mensajeError = 'Email inválido';
                } else if (regla.tipo === 'rut' && !validarRUT(valor)) {
                    esValido = false;
                    mensajeError = 'RUT inválido';
                } else if (regla.tipo === 'telefono' && !validarTelefono(valor)) {
                    esValido = false;
                    mensajeError = 'Teléfono inválido';
                } else if (regla.tipo === 'edad' && !validarEdad(valor)) {
                    esValido = false;
                    mensajeError = 'Edad inválida';
                }
            }
            
            if (!esValido) {
                resultado.valido = false;
                resultado.errores[campo] = mensajeError;
                resultado.camposConError.push(campo);
            }
        }
        
        return resultado;
        
    } catch (error) {
        console.error('Error validando formulario:', error);
        resultado.valido = false;
        resultado.errores.general = 'Error al validar formulario';
        return resultado;
    }
}

/**
 * Marca visualmente los campos con errores
 * @param {HTMLFormElement} formulario
 * @param {Array} camposConError
 */
function marcarCamposConError(formulario, camposConError) {
    try {
        if (!formulario || !Array.isArray(camposConError)) return;
        
        // Limpiar errores previos
        const camposConErrorPrevio = formulario.querySelectorAll('.error');
        camposConErrorPrevio.forEach(campo => campo.classList.remove('error'));
        
        // Marcar nuevos errores
        camposConError.forEach(nombreCampo => {
            const campo = formulario.querySelector(`[name="${nombreCampo}"]`);
            if (campo) {
                campo.classList.add('error');
            }
        });
        
    } catch (error) {
        console.error('Error marcando campos con error:', error);
    }
}

export {
    validarEmail,
    validarRUT,
    validarTelefono,
    validarTextoRequerido,
    validarEdad,
    validarPassword,
    validarFecha,
    validarFechaNoAnterior,
    validarFormulario,
    marcarCamposConError
};
