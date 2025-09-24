/**
 * FORMULARIOS/VALIDACIONES.JS
 * Funciones de validación para formularios
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { isValidEmail, validateRUT, validatePhoneNumberString } from '../utilidades/validaciones.js';
/**
 * Valida un paso específico del formulario multi-paso
 * @param {number} step - Número del paso a validar
 * @returns {boolean} True si el paso es válido
 */
export function validateStep(step) {
    try {
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStepDiv) return false;

        const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
        let isValid = true;
        const errors = [];

        // Validar campos requeridos
        requiredFields.forEach(field => {
            const value = field.value?.trim() || '';
            
            if (!value) {
                field.classList.add('error');
                errors.push(`${getFieldLabel(field)} es obligatorio`);
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        // Validaciones específicas por paso
        if (step === 1) {
            isValid = validateStep1(tipoSolicitud, errors) && isValid;
        } else if (step === 2) {
            isValid = validateStep2(errors) && isValid;
        } else if (step === 3) {
            isValid = validateStep3(errors) && isValid;
        }

        if (errors.length > 0) {
            showNotification(errors.join('\n'), 'warning', 5000);
        }

        return isValid;
    } catch (error) {
        console.error('Error validating step:', error);
        return false;
    }
}

/**
 * Valida el paso 1 del formulario
 * @param {string} tipoSolicitud - Tipo de solicitud seleccionado
 * @param {Array} errors - Array para acumular errores
 * @returns {boolean} True si es válido
 */
function validateStep1(tipoSolicitud, errors) {
    if (!tipoSolicitud) {
        errors.push('Selecciona un tipo de solicitud');
        return false;
    }
    
    if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email');
        if (!email || !email.value.trim()) {
            errors.push('Ingresa un email para recibir información');
            return false;
        } else if (!isValidEmail(email.value.trim())) {
            errors.push('Ingresa un email válido');
            return false;
        }
    } else if (tipoSolicitud === 'identificado') {
        return validateBasicInfo(errors);
    }
    
    return true;
}

/**
 * Valida la información básica del paso 1
 * @param {Array} errors - Array para acumular errores
 * @returns {boolean} True si es válido
 */
function validateBasicInfo(errors) {
    const edad = parseInt(document.getElementById('patient-age')?.value);
    if (!edad || edad < 12 || edad > 120) {
        errors.push('La edad debe estar entre 12 y 120 años');
        return false;
    }

    const cesfam = document.getElementById('patient-cesfam')?.value;
    if (!cesfam) {
        errors.push('Selecciona un CESFAM');
        return false;
    }

    const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    if (!paraMi) {
        errors.push('Indica para quién solicitas ayuda');
        return false;
    }
    
    return true;
}

/**
 * Valida el paso 2 del formulario (datos personales)
 * @param {Array} errors - Array para acumular errores
 * @returns {boolean} True si es válido
 */
function validateStep2(errors) {
    let isValid = true;
    
    const rut = document.getElementById('patient-rut');
    if (rut && rut.value.trim() && !validateRUT(rut.value.trim())) {
        errors.push('RUT inválido');
        rut.classList.add('error');
        isValid = false;
    }

    const phone = document.getElementById('patient-phone');
    if (phone && phone.value.trim() && !validatePhoneNumberString(phone.value.trim())) {
        errors.push('Teléfono inválido');
        phone.classList.add('error');
        isValid = false;
    }

    const email = document.getElementById('patient-email');
    if (email && email.value.trim() && !isValidEmail(email.value.trim())) {
        errors.push('Email inválido');
        email.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Valida el paso 3 del formulario (evaluación)
 * @param {Array} errors - Array para acumular errores
 * @returns {boolean} True si es válido
 */
function validateStep3(errors) {
    let isValid = true;
    
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
        errors.push('Selecciona al menos una sustancia');
        isValid = false;
    }

    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (!urgencia) {
        errors.push('Selecciona el nivel de urgencia');
        isValid = false;
    }

    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (!tratamientoPrevio) {
        errors.push('Indica si has recibido tratamiento previo');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Obtiene la etiqueta de un campo de formulario
 * @param {HTMLElement} field - Campo de formulario
 * @returns {string} Etiqueta del campo
 */
function getFieldLabel(field) {
    try {
        const label = field.closest('.form-group')?.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : 'Campo';
    } catch (error) {
        return 'Campo';
    }
}

/**
 * Valida el formulario completo antes del envío
 * @returns {boolean} True si todo el formulario es válido
 */
export function validateCompleteForm() {
    try {
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (!tipoSolicitud) {
            showNotification('Selecciona un tipo de solicitud', 'warning');
            return false;
        }

        if (tipoSolicitud !== 'identificado') {
            showNotification('Tipo de solicitud no válido para este flujo', 'error');
            return false;
        }

        // Validar campos básicos obligatorios
        const edad = document.getElementById('patient-age')?.value;
        const cesfam = document.getElementById('patient-cesfam')?.value;
        const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
        
        if (!edad || !cesfam || !paraMi) {
            showNotification('Completa todos los campos básicos obligatorios', 'warning');
            return false;
        }

        // Validar datos personales
        const nombre = document.getElementById('patient-name')?.value?.trim();
        const apellidos = document.getElementById('patient-lastname')?.value?.trim();
        const rut = document.getElementById('patient-rut')?.value?.trim();
        const telefono = document.getElementById('patient-phone')?.value?.trim();
        
        if (!nombre || !apellidos || !rut || !telefono) {
            showNotification('Para solicitud identificada, completa todos los datos personales', 'warning');
            return false;
        }
        
        if (!validateRUT(rut)) {
            showNotification('RUT inválido', 'warning');
            return false;
        }
        
        if (!validatePhoneNumberString(telefono)) {
            showNotification('Teléfono inválido', 'warning');
            return false;
        }

        return true;
        
    } catch (error) {
        console.error('Error validating complete form:', error);
        return false;
    }
}
