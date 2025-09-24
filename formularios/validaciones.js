/**
 * UTILIDADES/VALIDACIONES.JS
 */

// Función para validar email
export function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar RUT chileno
export function validateRUT(rut) {
    if (!rut || rut.length < 8) return false;
    
    const rutClean = rut.replace(/[.-]/g, '');
    const rutBody = rutClean.slice(0, -1);
    const checkDigit = rutClean.slice(-1).toUpperCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutBody.length - 1; i >= 0; i--) {
        sum += parseInt(rutBody[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDigit = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'K' : (11 - remainder).toString());
    
    return calculatedDigit === checkDigit;
}

// Función para formatear RUT
export function formatRUT(rut) {
    if (!rut) return '';
    
    const rutClean = rut.replace(/[.-]/g, '');
    if (rutClean.length < 8) return rut;
    
    const rutBody = rutClean.slice(0, -1);
    const checkDigit = rutClean.slice(-1);
    
    return `${rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${checkDigit}`;
}

// Función para formatear número de teléfono
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    } else if (cleaned.length === 9) {
        return cleaned.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2-$3');
    }
    
    return cleaned;
}

// Función para validar teléfono
export function validatePhoneNumberString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

// Auto-guardado de formulario
export function autoSaveForm(formData, formId) {
    try {
        const dataToSave = {
            ...formData,
            lastSaved: new Date().toISOString(),
            formId: formId
        };
        
        localStorage.setItem(`form_${formId}`, JSON.stringify(dataToSave));
        return true;
    } catch (error) {
        console.error('Error al guardar formulario:', error);
        return false;
    }
}

// Función para configurar auto-guardado
function setupAutoSave() {
    try {
        const form = document.getElementById('patient-form');
        // resto del código de auto-guardado
    } catch (error) {
        console.error('Error creando alerta crítica:', error);
        throw error;
    }
}
