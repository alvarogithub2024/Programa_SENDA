/**
 * UTILIDADES/VALIDACIONES.JS
 * Funciones de validación para la aplicación
 */

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
export function validateRUT(rut) {
    if (!rut) return false;
    
    // Limpiar RUT
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    if (cleanRut.length < 8 || cleanRut.length > 9) return false;
    
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDv = 11 - (sum % 11);
    const finalDv = calculatedDv === 11 ? '0' : calculatedDv === 10 ? 'K' : calculatedDv.toString();
    
    return dv === finalDv;
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida un número de teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
export function validatePhoneNumberString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} True si no está vacío
 */
export function isRequired(value) {
    return value && value.toString().trim().length > 0;
}

/**
 * Valida longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @returns {boolean} True si cumple la longitud
 */
export function minLength(value, minLength) {
    return value && value.length >= minLength;
}

/**
 * Valida que solo contenga letras y espacios
 * @param {string} value - Valor a validar
 * @returns {boolean} True si solo contiene letras
 */
export function isAlphabetic(value) {
    if (!value) return false;
    const alphaRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
    return alphaRegex.test(value);
}

/**
 * Valida que sea un número
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es número
 */
export function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Valida rango de edad
 * @param {number} age - Edad a validar
 * @param {number} min - Edad mínima
 * @param {number} max - Edad máxima
 * @returns {boolean} True si está en rango
 */
export function isValidAge(age, min = 0, max = 120) {
    return isNumeric(age) && age >= min && age <= max;
}
