/**
 * UTILIDADES/VALIDACIONES.JS - VERSIÓN SIN IMPORTS
 * Funciones de validación para la aplicación
 */

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
window.validateRUT = function(rut) {
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
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
window.isValidEmail = function(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida un número de teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
window.validatePhoneNumberString = function(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
};

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} True si no está vacío
 */
window.isRequired = function(value) {
    return value && value.toString().trim().length > 0;
};

/**
 * Valida longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @returns {boolean} True si cumple la longitud
 */
window.minLength = function(value, minLength) {
    return value && value.length >= minLength;
};

/**
 * Valida que solo contenga letras y espacios
 * @param {string} value - Valor a validar
 * @returns {boolean} True si solo contiene letras
 */
window.isAlphabetic = function(value) {
    if (!value) return false;
    const alphaRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
    return alphaRegex.test(value);
};

/**
 * Valida que sea un número
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es número
 */
window.isNumeric = function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Valida rango de edad
 * @param {number} age - Edad a validar
 * @param {number} min - Edad mínima
 * @param {number} max - Edad máxima
 * @returns {boolean} True si está en rango
 */
window.isValidAge = function(age, min = 0, max = 120) {
    return window.isNumeric(age) && age >= min && age <= max;
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado
 */
window.formatRUT = function(rut) {
    try {
        if (!rut) return '';
        
        const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
        
        if (cleaned.length < 2) return cleaned;
        
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        
        const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        return `${formattedBody}-${dv}`;
    } catch (error) {
        console.error('Error formatting RUT:', error);
        return rut;
    }
};

/**
 * Formatea un número de teléfono chileno
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
window.formatPhoneNumber = function(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
};

/**
 * Formatea una fecha de Firestore
 * @param {Object} timestamp - Timestamp de Firestore
 * @returns {string} Fecha formateada
 */
window.formatDate = function(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }
        
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
};

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
window.truncateText = function(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
window.capitalize = function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formatea un nombre completo
 * @param {string} nombre - Nombre
 * @param {string} apellidos - Apellidos
 * @returns {string} Nombre completo formateado
 */
window.formatFullName = function(nombre, apellidos) {
    const nombreCapitalized = window.capitalize(nombre || '');
    const apellidosCapitalized = window.capitalize(apellidos || '');
    return `${nombreCapitalized} ${apellidosCapitalized}`.trim();
};

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre
 * @param {string} apellidos - Apellidos
 * @returns {string} Iniciales
 */
window.getInitials = function(nombre, apellidos) {
    const n = (nombre || '').charAt(0).toUpperCase();
    const a = (apellidos || '').charAt(0).toUpperCase();
    return `${n}${a}`;
};

/**
 * Auto-guardado de formulario
 */
window.autoSaveForm = function(formData, formId) {
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
};

/**
 * Carga un formulario guardado
 */
window.loadSavedForm = function(formId) {
    try {
        const saved = localStorage.getItem(`form_${formId}`);
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        
        // Verificar que no sea muy antiguo (24 horas)
        if (Date.now() - new Date(data.lastSaved).getTime() > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`form_${formId}`);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error cargando formulario guardado:', error);
        return null;
    }
};

/**
 * Limpia un formulario guardado
 */
window.clearSavedForm = function(formId) {
    try {
        localStorage.removeItem(`form_${formId}`);
        return true;
    } catch (error) {
        console.error('Error limpiando formulario guardado:', error);
        return false;
    }
};

/**
 * Valida un formulario completo
 */
window.validateForm = function(formElement) {
    if (!formElement) return false;
    
    let isValid = true;
    const requiredFields = formElement.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
};

/**
 * Muestra un error en un campo
 */
window.showFieldError = function(field, message) {
    field.classList.add('error');
    
    // Remover error existente
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Agregar nuevo error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
};

/**
 * Limpia el error de un campo
 */
window.clearFieldError = function(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
};

/**
 * Valida un campo específico
 */
window.validateField = function(field, validations = []) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    for (const validation of validations) {
        switch (validation.type) {
            case 'required':
                if (!value) {
                    isValid = false;
                    errorMessage = validation.message || 'Este campo es obligatorio';
                }
                break;
                
            case 'email':
                if (value && !window.isValidEmail(value)) {
                    isValid = false;
                    errorMessage = validation.message || 'Email inválido';
                }
                break;
                
            case 'rut':
                if (value && !window.validateRUT(value)) {
                    isValid = false;
                    errorMessage = validation.message || 'RUT inválido';
                }
                break;
                
            case 'phone':
                if (value && !window.validatePhoneNumberString(value)) {
                    isValid = false;
                    errorMessage = validation.message || 'Teléfono inválido';
                }
                break;
                
            case 'minLength':
                if (value && value.length < validation.min) {
                    isValid = false;
                    errorMessage = validation.message || `Mínimo ${validation.min} caracteres`;
                }
                break;
                
            case 'maxLength':
                if (value && value.length > validation.max) {
                    isValid = false;
                    errorMessage = validation.message || `Máximo ${validation.max} caracteres`;
                }
                break;
                
            case 'numeric':
                if (value && !window.isNumeric(value)) {
                    isValid = false;
                    errorMessage = validation.message || 'Debe ser un número válido';
                }
                break;
                
            case 'alphabetic':
                if (value && !window.isAlphabetic(value)) {
                    isValid = false;
                    errorMessage = validation.message || 'Solo se permiten letras y espacios';
                }
                break;
                
            case 'age':
                const age = parseInt(value);
                if (value && !window.isValidAge(age, validation.min, validation.max)) {
                    isValid = false;
                    errorMessage = validation.message || `Edad debe estar entre ${validation.min} y ${validation.max} años`;
                }
                break;
        }
        
        if (!isValid) break; // Detener en el primer error
    }
    
    if (isValid) {
        window.clearFieldError(field);
    } else {
        window.showFieldError(field, errorMessage);
    }
    
    return isValid;
};

/**
 * Configura validación en tiempo real para un campo
 */
window.setupFieldValidation = function(fieldId, validations) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Validación en blur
    field.addEventListener('blur', () => {
        window.validateField(field, validations);
    });
    
    // Formateo en input (para RUT y teléfono)
    field.addEventListener('input', (e) => {
        const hasRutValidation = validations.some(v => v.type === 'rut');
        const hasPhoneValidation = validations.some(v => v.type === 'phone');
        
        if (hasRutValidation) {
            e.target.value = window.formatRUT(e.target.value);
        } else if (hasPhoneValidation) {
            e.target.value = window.formatPhoneNumber(e.target.value);
        }
    });
};

/**
 * Configura validaciones para un formulario completo
 */
window.setupFormValidations = function(formId, fieldValidations) {
    Object.entries(fieldValidations).forEach(([fieldId, validations]) => {
        window.setupFieldValidation(fieldId, validations);
    });
    
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', (e) => {
            let isFormValid = true;
            
            Object.entries(fieldValidations).forEach(([fieldId, validations]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const isFieldValid = window.validateField(field, validations);
                    if (!isFieldValid) {
                        isFormValid = false;
                    }
                }
            });
            
            if (!isFormValid) {
                e.preventDefault();
                if (window.showNotification) {
                    window.showNotification('Por favor corrige los errores en el formulario', 'error');
                }
            }
        });
    }
};

console.log('✅ Sistema de validaciones cargado - Funciones disponibles en window');
