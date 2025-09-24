/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS - IMPORTS CORREGIDOS
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { isValidEmail, validateRUT } from '../utilidades/validaciones.js';

// IMPORTS CORREGIDOS - SIN getServerTimestamp
import { getFirestore } from '../configuracion/firebase.js';

let currentFormStep = 1;
let maxFormStep = 4;

// FUNCIÓN CORREGIDA PARA TIMESTAMP
function getFirebaseTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Inicializa el formulario de paciente
 */
export function initPatientForm() {
    try {
        setupFormSteps();
        setupValidationListeners();
        setupAutoSave();
        loadSavedData();
    } catch (error) {
        console.error('Error inicializando formulario:', error);
    }
}

/**
 * Configura los pasos del formulario
 */
function setupFormSteps() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    
    nextButtons.forEach(button => {
        button.addEventListener('click', handleNextStep);
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', handlePrevStep);
    });
}

/**
 * Maneja el paso siguiente del formulario
 */
function handleNextStep() {
    if (validateCurrentStep()) {
        if (currentFormStep < maxFormStep) {
            currentFormStep++;
            showFormStep(currentFormStep);
        }
    }
}

/**
 * Maneja el paso anterior del formulario
 */
function handlePrevStep() {
    if (currentFormStep > 1) {
        currentFormStep--;
        showFormStep(currentFormStep);
    }
}

/**
 * Muestra un paso específico del formulario
 */
function showFormStep(step) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
        stepDiv.style.display = 'none';
    });
    
    // Mostrar el paso actual
    const currentStepDiv = document.querySelector(`[data-step="${step}"]`);
    if (currentStepDiv) {
        currentStepDiv.style.display = 'block';
    }
    
    // Actualizar indicador de progreso
    updateProgressIndicator(step);
}

/**
 * Actualiza el indicador de progreso
 */
function updateProgressIndicator(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((progressStep, index) => {
        if (index + 1 <= step) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    });
}

/**
 * Valida el paso actual del formulario
 */
function validateCurrentStep() {
    const currentStepDiv = document.querySelector(`[data-step="${currentFormStep}"]`);
    if (!currentStepDiv) return false;
    
    const requiredFields = currentStepDiv.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Validaciones específicas por paso
    if (currentFormStep === 2) {
        isValid = validatePersonalData() && isValid;
    }
    
    return isValid;
}

/**
 * Valida los datos personales
 */
function validatePersonalData() {
    let isValid = true;
    
    const rutField = document.getElementById('patient-rut');
    if (rutField && rutField.value.trim()) {
        if (!validateRUT(rutField.value.trim())) {
            rutField.classList.add('error');
            showNotification('RUT inválido', 'error');
            isValid = false;
        } else {
            rutField.classList.remove('error');
        }
    }
    
    const emailField = document.getElementById('patient-email');
    if (emailField && emailField.value.trim()) {
        if (!isValidEmail(emailField.value.trim())) {
            emailField.classList.add('error');
            showNotification('Email inválido', 'error');
            isValid = false;
        } else {
            emailField.classList.remove('error');
        }
    }
    
    return isValid;
}

/**
 * Configura los listeners de validación
 */
function setupValidationListeners() {
    // Validación de RUT en tiempo real
    const rutField = document.getElementById('patient-rut');
    if (rutField) {
        rutField.addEventListener('blur', function() {
            if (this.value.trim() && !validateRUT(this.value.trim())) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }
}

/**
 * Auto-guardado de formulario
 */
function setupAutoSave() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        setInterval(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem('patient-form-data', JSON.stringify(data));
        }, 30000); // Auto-guardar cada 30 segundos
        
    } catch (error) {
        console.error('Error configurando auto-guardado:', error);
    }
}

/**
 * Carga datos guardados previamente
 */
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('patient-form-data');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
        
    } catch (error) {
        console.error('Error cargando datos guardados:', error);
    }
}

/**
 * Limpia los datos guardados
 */
function clearSavedData() {
    localStorage.removeItem('patient-form-data');
}

/**
 * FUNCIÓN FALTANTE - resetForm
 * Resetea el formulario completamente
 */
export function resetForm() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            currentFormStep = 1;
            showFormStep(1);
            clearSavedData();
            // Limpiar clases de error
            const errorFields = form.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
        }
    } catch (error) {
        console.error('Error resetting form:', error);
    }
}

/**
 * Envía el formulario
 */
export function submitForm() {
    try {
        if (!validateCompleteForm()) {
            return false;
        }
        
        const formData = collectFormData();
        saveToFirebase(formData);
        
    } catch (error) {
        console.error('Error enviando formulario:', error);
        showNotification('Error al enviar formulario', 'error');
    }
}

/**
 * Valida el formulario completo
 */
function validateCompleteForm() {
    // Validar todos los pasos
    for (let step = 1; step <= maxFormStep; step++) {
        currentFormStep = step;
        if (!validateCurrentStep()) {
            showFormStep(step);
            return false;
        }
    }
    return true;
}

/**
 * Recolecta todos los datos del formulario
 */
function collectFormData() {
    const form = document.getElementById('patient-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData);
}

/**
 * Guarda los datos en Firebase
 */
async function saveToFirebase(data) {
    try {
        const db = getFirestore();
        const docRef = await db.collection('pacientes').add({
            ...data,
            timestamp: getFirebaseTimestamp(),
            status: 'pending'
        });
        
        showNotification('Formulario enviado correctamente', 'success');
        clearSavedData();
        
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        showNotification('Error al guardar datos', 'error');
    }
}

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', initPatientForm);
