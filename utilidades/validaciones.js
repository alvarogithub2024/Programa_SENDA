/**
 * UTILIDADES/VALIDACIONES.JS
 * Funciones de validación generales
 */

import { APP_CONFIG } from '../configuracion/constantes.js';

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
export function validateRUT(rut) {
    try {
        if (!rut) return false;
        
        const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
        if (cleaned.length < 8 || cleaned.length > 9) return false;
        
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        
        if (!/^\d+$/.test(body)) return false;
        
        let sum = 0;
        let multiplier = 2;
        
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const expectedDV = 11 - (sum % 11);
        let finalDV;
        
        if (expectedDV === 11) {
            finalDV = '0';
        } else if (expectedDV === 10) {
            finalDV = 'K';
        } else {
            finalDV = expectedDV.toString();
        }
        
        return dv === finalDV;
    } catch (error) {
        console.error('Error validating RUT:', error);
        return false;
    }
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export function isValidEmail(email) {
    try {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    } catch (error) {
        console.error('Error validating email:', error);
        return false;
    }
}

/**
 * Valida un número de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
export function validatePhoneNumberString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Valida que una edad esté en rango válido
 * @param {number} age - Edad a validar
 * @returns {boolean} True si es válido
 */
export function validateAge(age) {
    return age && age >= 12 && age <= 120;
}

/**
 * Valida que un texto no esté vacío
 * @param {string} text - Texto a validar
 * @returns {boolean} True si no está vacío
 */
export function isNotEmpty(text) {
    return text && text.trim().length > 0;
}

/**
 * Valida que un texto tenga una longitud mínima
 * @param {string} text - Texto a validar
 * @param {number} minLength - Longitud mínima
 * @returns {boolean} True si cumple la longitud
 */
export function hasMinLength(text, minLength) {
    return text && text.trim().length >= minLength;
}

/**
 * Valida que un texto tenga una longitud máxima
 * @param {string} text - Texto a validar
 * @param {number} maxLength - Longitud máxima
 * @returns {boolean} True si no excede la longitud
 */
export function hasMaxLength(text, maxLength) {
    return !text || text.trim().length <= maxLength;
}

/**
 * Valida que una fecha no sea en el pasado
 * @param {Date} date - Fecha a validar
 * @returns {boolean} True si es hoy o futura
 */
export function isNotPastDate(date) {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today;
}

/**
 * Valida que una fecha esté en un rango
 * @param {Date} date - Fecha a validar
 * @param {Date} minDate - Fecha mínima
 * @param {Date} maxDate - Fecha máxima
 * @returns {boolean} True si está en rango
 */
export function isDateInRange(date, minDate, maxDate) {
    if (!date) return false;
    return date >= minDate && date <= maxDate;
}

/**
 * Reintenta una operación un número específico de veces
 * @param {Function} operation - Operación a reintentar
 * @param {number} maxAttempts - Número máximo de intentos
 * @returns {Promise} Resultado de la operación
 */
export async function retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
            
            if (attempt === maxAttempts) {
                throw error;
            }
            
            await new Promise(resolve => 
                setTimeout(resolve, APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
            );
        }
    }
}

/**
 * Valida un número dentro de un rango
 * @param {number} num - Número a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean} True si está en rango
 */
export function isNumberInRange(num, min, max) {
    return typeof num === 'number' && num >= min && num <= max;
}

/**
 * Valida que una cadena contenga solo letras y espacios
 * @param {string} text - Texto a validar
 * @returns {boolean} True si solo contiene letras y espacios
 */
export function isOnlyLettersAndSpaces(text) {
    if (!text) return false;
    const regex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/;
    return regex.test(text.trim());
}

/**
 * Valida que una cadena contenga solo números
 * @param {string} text - Texto a validar
 * @returns {boolean} True si solo contiene números
 */
export function isOnlyNumbers(text) {
    if (!text) return false;
    const regex = /^\d+$/;
    return regex.test(text.trim());
}

/**
 * Debounce function para optimizar llamadas
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounceada
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function para limitar llamadas
 * @param {Function} func - Función a throttle
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función throttleada
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
