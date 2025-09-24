/**
 * VALIDACIONES GENERALES
 * Funciones de validación reutilizables para todo el sistema
 */

// Constantes de validación
const VALIDATION_CONSTANTS = {
  RUT_MIN_LENGTH: 8,
  RUT_MAX_LENGTH: 9,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_MIN_LENGTH: 8,
  PHONE_MAX_LENGTH: 12,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  AGE_MIN: 12,
  AGE_MAX: 120
};

// Mensajes de error
const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_RUT: 'RUT inválido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_NAME: 'Nombre inválido',
  INVALID_AGE: 'Edad debe estar entre 12 y 120 años',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 6 caracteres',
  EMAIL_NOT_SENDA: 'Solo se permiten emails @senda.cl',
  INVALID_DATE: 'Fecha inválida',
  DATE_IN_PAST: 'La fecha no puede ser anterior a hoy',
  INVALID_RANGE: 'Valor fuera del rango permitido'
};

/**
 * Validación de RUT chileno
 */
function validateRUT(rut) {
  try {
    if (!rut) return false;
    
    // Limpiar y normalizar
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    
    // Verificar longitud
    if (cleaned.length < VALIDATION_CONSTANTS.RUT_MIN_LENGTH || 
        cleaned.length > VALIDATION_CONSTANTS.RUT_MAX_LENGTH) {
      return false;
    }
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Verificar que el cuerpo sean solo números
    if (!/^\d+$/.test(body)) return false;
    
    // Calcular dígito verificador
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
 * Validación de email
 */
function isValidEmail(email) {
  try {
    if (!email || typeof email !== 'string') return false;
    return VALIDATION_CONSTANTS.EMAIL_REGEX.test(email.trim());
  } catch (error) {
    console.error('Error validating email:', error);
    return false;
  }
}

/**
 * Validación de email institucional SENDA
 */
function isValidSendaEmail(email) {
  try {
    if (!isValidEmail(email)) return false;
    return email.toLowerCase().endsWith('@senda.cl');
  } catch (error) {
    console.error('Error validating SENDA email:', error);
    return false;
  }
}

/**
 * Validación de teléfono
 */
function validatePhoneNumber(phone) {
  try {
    if (!phone || typeof phone !== 'string') return false;
    
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= VALIDATION_CONSTANTS.PHONE_MIN_LENGTH && 
           cleaned.length <= VALIDATION_CONSTANTS.PHONE_MAX_LENGTH;
  } catch (error) {
    console.error('Error validating phone:', error);
    return false;
  }
}

/**
 * Validación de teléfono móvil chileno
 */
function validateChileanMobile(phone) {
  try {
    if (!phone) return false;
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Teléfono móvil chileno: 9 dígitos empezando con 9
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return true;
    }
    
    // Con código de país (+56 9)
    if (cleaned.length === 11 && cleaned.startsWith('569')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating Chilean mobile:', error);
    return false;
  }
}

/**
 * Validación de nombre
 */
function validateName(name) {
  try {
    if (!name || typeof name !== 'string') return false;
    
    const trimmedName = name.trim();
    
    // Verificar longitud
    if (trimmedName.length < VALIDATION_CONSTANTS.NAME_MIN_LENGTH || 
        trimmedName.length > VALIDATION_CONSTANTS.NAME_MAX_LENGTH) {
      return false;
    }
    
    // Solo letras, espacios, tildes y ñ
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return nameRegex.test(trimmedName);
  } catch (error) {
    console.error('Error validating name:', error);
    return false;
  }
}

/**
 * Validación de edad
 */
function validateAge(age) {
  try {
    const numAge = parseInt(age);
    if (isNaN(numAge)) return false;
    
    return numAge >= VALIDATION_CONSTANTS.AGE_MIN && 
           numAge <= VALIDATION_CONSTANTS.AGE_MAX;
  } catch (error) {
    console.error('Error validating age:', error);
    return false;
  }
}

/**
 * Validación de contraseña
 */
function validatePassword(password) {
  try {
    if (!password || typeof password !== 'string') return false;
    
    return password.length >= VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH;
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
}

/**
 * Validación de contraseña segura
 */
function validateSecurePassword(password) {
  try {
    if (!validatePassword(password)) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  } catch (error) {
    console.error('Error validating secure password:', error);
    return false;
  }
}

/**
 * Validación de fecha
 */
function validateDate(dateString) {
  try {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    console.error('Error validating date:', error);
    return false;
  }
}

/**
 * Validación de fecha futura
 */
function validateFutureDate(dateString) {
  try {
    if (!validateDate(dateString)) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
  } catch (error) {
    console.error('Error validating future date:', error);
    return false;
  }
}

/**
 * Validación de rango numérico
 */
function validateRange(value, min, max) {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    return numValue >= min && numValue <= max;
  } catch (error) {
    console.error('Error validating range:', error);
    return false;
  }
}

/**
 * Validación de campo requerido
 */
function validateRequired(value) {
  try {
    if (value === null || value === undefined) return false;
    
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    return Boolean(value);
  } catch (error) {
    console.error('Error validating required field:', error);
    return false;
  }
}

/**
 * Validación de selección múltiple
 */
function validateMultipleSelection(values, minSelections = 1, maxSelections = null) {
  try {
    if (!Array.isArray(values)) return false;
    
    const validCount = values.filter(v => v && v.trim()).length;
    
    if (validCount < minSelections) return false;
    if (maxSelections && validCount > maxSelections) return false;
    
    return true;
  } catch (error) {
    console.error('Error validating multiple selection:', error);
    return false;
  }
}

/**
 * Validación de URL
 */
function validateURL(url) {
  try {
    if (!url || typeof url !== 'string') return false;
    
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return urlRegex.test(url);
  } catch (error) {
    console.error('Error validating URL:', error);
    return false;
  }
}

/**
 * Sanitización de texto
 */
function sanitizeText(text) {
  try {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Eliminar < y >
      .replace(/javascript:/gi, '') // Eliminar javascript:
      .replace(/on\w+=/gi, ''); // Eliminar eventos onclick, etc.
  } catch (error) {
    console.error('Error sanitizing text:', error);
    return '';
  }
}

/**
 * Validador de formulario genérico
 */
class FormValidator {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.errors = new Map();
    this.rules = new Map();
  }
  
  addRule(fieldName, validationRules) {
    this.rules.set(fieldName, validationRules);
    return this;
  }
  
  validate() {
    this.errors.clear();
    
    for (let [fieldName, rules] of this.rules) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;
      
      const value = this.getFieldValue(field);
      const fieldErrors = [];
      
      for (let rule of rules) {
        if (!this.validateRule(value, rule)) {
          fieldErrors.push(rule.message || ERROR_MESSAGES.REQUIRED);
        }
      }
      
      if (fieldErrors.length > 0) {
        this.errors.set(fieldName, fieldErrors);
        this.markFieldAsError(field);
      } else {
        this.markFieldAsValid(field);
      }
    }
    
    return this.errors.size === 0;
  }
  
  getFieldValue(field) {
    if (field.type === 'checkbox') {
      return field.checked;
    } else if (field.type === 'radio') {
      const checked = this.form.querySelector(`[name="${field.name}"]:checked`);
      return checked ? checked.value : null;
    } else if (field.type === 'select-multiple') {
      return Array.from(field.selectedOptions).map(option => option.value);
    } else {
      return field.value;
    }
  }
  
  validateRule(value, rule) {
    switch (rule.type) {
      case 'required':
        return validateRequired(value);
      case 'email':
        return !value || isValidEmail(value);
      case 'rut':
        return !value || validateRUT(value);
      case 'phone':
        return !value || validatePhoneNumber(value);
      case 'name':
        return !value || validateName(value);
      case 'age':
        return !value || validateAge(value);
      case 'password':
        return !value || validatePassword(value);
      case 'date':
        return !value || validateDate(value);
      case 'range':
        return !value || validateRange(value, rule.min, rule.max);
      case 'custom':
        return rule.validator(value);
      default:
        return true;
    }
  }
  
  markFieldAsError(field) {
    field.classList.add('error');
    field.classList.remove('valid');
  }
  
  markFieldAsValid(field) {
    field.classList.remove('error');
    field.classList.add('valid');
  }
  
  getErrors() {
    return this.errors;
  }
  
  showErrors() {
    let errorMessage = 'Por favor, corrige los siguientes errores:\n\n';
    
    for (let [fieldName, fieldErrors] of this.errors) {
      errorMessage += `${fieldName}: ${fieldErrors.join(', ')}\n`;
    }
    
    showNotification(errorMessage, 'error', 8000);
  }
}

/**
 * Validación en tiempo real para campos
 */
function setupRealTimeValidation(fieldId, validationRules) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const validator = new FormValidator(field.form.id);
  validator.addRule(field.name, validationRules);
  
  field.addEventListener('blur', () => {
    validator.validate();
  });
  
  field.addEventListener('input', debounce(() => {
    validator.validate();
  }, 500));
}

/**
 * Validación específica para formulario de pacientes
 */
function validatePatientForm(formData) {
  const errors = [];
  
  // Validar tipo de solicitud
  if (!formData.tipoSolicitud) {
    errors.push('Debe seleccionar un tipo de solicitud');
  }
  
  // Validaciones específicas por tipo
  if (formData.tipoSolicitud === 'identificado') {
    if (!formData.nombre || !validateName(formData.nombre)) {
      errors.push('Nombre inválido');
    }
    
    if (!formData.apellidos || !validateName(formData.apellidos)) {
      errors.push('Apellidos inválidos');
    }
    
    if (!formData.rut || !validateRUT(formData.rut)) {
      errors.push('RUT inválido');
    }
    
    if (!formData.telefono || !validatePhoneNumber(formData.telefono)) {
      errors.push('Teléfono inválido');
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      errors.push('Email inválido');
    }
  } else if (formData.tipoSolicitud === 'informacion') {
    if (!formData.email || !isValidEmail(formData.email)) {
      errors.push('Email válido requerido para solicitud de información');
    }
  }
  
  // Validaciones comunes
  if (!formData.edad || !validateAge(formData.edad)) {
    errors.push('Edad debe estar entre 12 y 120 años');
  }
  
  if (!formData.cesfam) {
    errors.push('Debe seleccionar un CESFAM');
  }
  
  if (!formData.paraMi) {
    errors.push('Debe indicar para quién solicita ayuda');
  }
  
  // Validar sustancias (si aplica)
  if (formData.sustancias && formData.sustancias.length === 0) {
    errors.push('Debe seleccionar al menos una sustancia problemática');
  }
  
  // Validar urgencia
  if (!formData.urgencia) {
    errors.push('Debe indicar el nivel de urgencia');
  }
  
  // Validar tratamiento previo
  if (formData.tratamientoPrevio === null || formData.tratamientoPrevio === undefined) {
    errors.push('Debe indicar si ha recibido tratamiento previo');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validación para formulario de registro de profesionales
 */
function validateProfessionalRegistration(formData) {
  const errors = [];
  
  if (!formData.nombre || !validateName(formData.nombre)) {
    errors.push('Nombre inválido');
  }
  
  if (!formData.apellidos || !validateName(formData.apellidos)) {
    errors.push('Apellidos inválidos');
  }
  
  if (!formData.email || !isValidSendaEmail(formData.email)) {
    errors.push('Email debe ser @senda.cl');
  }
  
  if (!formData.password || !validatePassword(formData.password)) {
    errors.push('Contraseña debe tener al menos 6 caracteres');
  }
  
  if (!formData.profession) {
    errors.push('Debe seleccionar una profesión');
  }
  
  if (!formData.cesfam) {
    errors.push('Debe seleccionar un CESFAM');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validación para formulario de citas
 */
function validateAppointmentForm(formData) {
  const errors = [];
  
  if (!formData.pacienteNombre || !validateName(formData.pacienteNombre)) {
    errors.push('Nombre del paciente inválido');
  }
  
  if (!formData.pacienteRut || !validateRUT(formData.pacienteRut)) {
    errors.push('RUT del paciente inválido');
  }
  
  if (!formData.professionalId) {
    errors.push('Debe seleccionar un profesional');
  }
  
  if (!formData.fecha || !validateFutureDate(formData.fecha)) {
    errors.push('Debe seleccionar una fecha válida');
  }
  
  if (!formData.hora) {
    errors.push('Debe seleccionar un horario');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validación para búsqueda avanzada
 */
function validateAdvancedSearch(filters) {
  const errors = [];
  
  if (filters.edadMin && !validateAge(filters.edadMin)) {
    errors.push('Edad mínima inválida');
  }
  
  if (filters.edadMax && !validateAge(filters.edadMax)) {
    errors.push('Edad máxima inválida');
  }
  
  if (filters.edadMin && filters.edadMax && 
      parseInt(filters.edadMin) > parseInt(filters.edadMax)) {
    errors.push('Edad mínima no puede ser mayor que la máxima');
  }
  
  if (filters.fechaDesde && !validateDate(filters.fechaDesde)) {
    errors.push('Fecha desde inválida');
  }
  
  if (filters.fechaHasta && !validateDate(filters.fechaHasta)) {
    errors.push('Fecha hasta inválida');
  }
  
  if (filters.fechaDesde && filters.fechaHasta && 
      new Date(filters.fechaDesde) > new Date(filters.fechaHasta)) {
    errors.push('Fecha desde no puede ser posterior a fecha hasta');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Función de debounce para validación en tiempo real
 */
function debounce(func, wait) {
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
 * Mostrar errores de validación en el formulario
 */
function displayValidationErrors(errors, containerId = null) {
  if (!errors || errors.length === 0) return;
  
  const errorMessage = errors.join('\n• ');
  
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="validation-errors">
          <i class="fas fa-exclamation-triangle"></i>
          <ul>
            ${errors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        </div>
      `;
      return;
    }
  }
  
  showNotification('Por favor, corrige los siguientes errores:\n• ' + errorMessage, 'error', 8000);
}

/**
 * Limpiar errores de validación
 */
function clearValidationErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  // Remover clases de error
  form.querySelectorAll('.error').forEach(field => {
    field.classList.remove('error');
  });
  
  // Remover mensajes de error
  form.querySelectorAll('.validation-errors').forEach(errorDiv => {
    errorDiv.remove();
  });
}

/**
 * Configurar validación automática para un formulario
 */
function setupFormValidation(formId, validationRules) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const validator = new FormValidator(formId);
  
  // Agregar reglas
  Object.entries(validationRules).forEach(([fieldName, rules]) => {
    validator.addRule(fieldName, rules);
    
    // Configurar validación en tiempo real
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      setupRealTimeValidation(field.id || fieldName, rules);
    }
  });
  
  // Validar al enviar el formulario
  form.addEventListener('submit', (e) => {
    if (!validator.validate()) {
      e.preventDefault();
      validator.showErrors();
    }
  });
  
  return validator;
}

// Exportar funciones principales
if (typeof window !== 'undefined') {
  window.validateRUT = validateRUT;
  window.isValidEmail = isValidEmail;
  window.isValidSendaEmail = isValidSendaEmail;
  window.validatePhoneNumber = validatePhoneNumber;
  window.validateChileanMobile = validateChileanMobile;
  window.validateName = validateName;
  window.validateAge = validateAge;
  window.validatePassword = validatePassword;
  window.validateSecurePassword = validateSecurePassword;
  window.validateDate = validateDate;
  window.validateFutureDate = validateFutureDate;
  window.validateRange = validateRange;
  window.validateRequired = validateRequired;
  window.validateMultipleSelection = validateMultipleSelection;
  window.validateURL = validateURL;
  window.sanitizeText = sanitizeText;
  
  window.FormValidator = FormValidator;
  window.setupRealTimeValidation = setupRealTimeValidation;
  window.validatePatientForm = validatePatientForm;
  window.validateProfessionalRegistration = validateProfessionalRegistration;
  window.validateAppointmentForm = validateAppointmentForm;
  window.validateAdvancedSearch = validateAdvancedSearch;
  window.displayValidationErrors = displayValidationErrors;
  window.clearValidationErrors = clearValidationErrors;
  window.setupFormValidation = setupFormValidation;
  
  window.VALIDATION_CONSTANTS = VALIDATION_CONSTANTS;
  window.ERROR_MESSAGES = ERROR_MESSAGES;
}

console.log('✅ Módulo de validaciones generales cargado');
