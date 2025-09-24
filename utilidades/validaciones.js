/**
 * VALIDACIONES GENERALES
 * Utilidades para validación de formularios
 */

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email?.trim());
}

/**
 * Valida formato de RUT chileno
 * @param {string} rut
 * @returns {boolean}
 */
function validarRUT(rut) {
    if (!rut) return false;
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (cleaned.length < 8 || cleaned.length > 9) return false;
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    let sum = 0, multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDV = 11 - (sum % 11);
    let finalDV;
    if (expectedDV === 11) finalDV = '0';
    else if (expectedDV === 10) finalDV = 'K';
    else finalDV = expectedDV.toString();
    return dv === finalDV;
}

/**
 * Valida número de teléfono chileno
 * @param {string} telefono
 * @returns {boolean}
 */
function validarTelefono(telefono) {
    if (!telefono) return false;
    const cleaned = telefono.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

export {
    validarEmail,
    validarRUT,
    validarTelefono
};
