/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS
 * Manejo del formulario multi-paso para solicitudes de pacientes
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { validateRUT, isValidEmail } from '../utilidades/validaciones.js';
import { validateStep } from '../formularios/validaciones.js';
import { setupAutoSave, saveFormDraft, loadFormDraft, resetForm } from './autoguardado.js';
import { handleInformationRequestSubmit } from './formulario-paciente.js';

let currentFormStep = 1;
let maxFormStep = 4;

/**
 * Configura el formulario multi-paso de pacientes
 */
export function setupFormularios() {
    try {
        setupMultiStepForm();
        setupAutoSave();
        console.log('✅ Formularios configurados');
    } catch (error) {
        console.error('❌ Error configurando formularios:', error);
    }
}

/**
 * Configura el formulario multi-paso
 */
function setupMultiStepForm() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;

        setupNavigationButtons();
        setupTipoSolicitudListeners();
        setupMotivacionSlider();
        setupSubmitButtons();
        
        form.addEventListener('submit', handlePatientFormSubmit);
        
        console.log('✅ Formulario multi-step configurado');
        
    } catch (error) {
        console.error('❌ Error configurando formulario multi-step:', error);
    }
}

/**
 * Configura los botones de navegación
 */
function setupNavigationButtons() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    const nextButtons = form.querySelectorAll('[id^="next-step"]');
    const prevButtons = form.querySelectorAll('[id^="prev-step"]');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentStep = parseInt(btn.id.split('-')[2]);
            if (validateStep(currentStep)) {
                const nextStep = getNextStep(currentStep);
                if (nextStep) {
                    goToStep(nextStep);
                }
            }
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentStep = parseInt(btn.id.split('-')[2]);
            const prevStep = getPreviousStep(currentStep);
            if (prevStep) {
                goToStep(prevStep);
            }
        });
    });
}

/**
 * Configura los listeners para el tipo de solicitud
 */
function setupTipoSolicitudListeners() {
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    
    tipoSolicitudInputs.forEach(input => {
        input.addEventListener('change', () => {
            const tipoSolicitud = input.value;
            handleTipoSolicitudChange(tipoSolicitud);
        });
    });
}

/**
 * Maneja el cambio de tipo de solicitud
 * @param {string} tipoSolicitud - Tipo de solicitud seleccionado
 */
function handleTipoSolicitudChange(tipoSolicitud) {
    const infoEmailContainer = document.getElementById('info-email-container');
    const basicInfoContainer = document.getElementById('basic-info-container');
    const nextBtn = document.getElementById('next-step-1');
    const submitBtn = document.getElementById('submit-step-1');
    
    if (tipoSolicitud === 'informacion') {
        maxFormStep = 1;
        updateProgressIndicator(1, 1);
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'block';
        if (basicInfoContainer) basicInfoContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
        
    } else if (tipoSolicitud === 'identificado') {
        maxFormStep = 4;
        updateProgressIndicator(1, 4);
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
    }
    
    saveFormDraft();
}

/**
 * Configura el slider de motivación
 */
function setupMotivacionSlider() {
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    
    if (motivacionRange && motivacionValue) {
        motivacionRange.addEventListener('input', () => {
            motivacionValue.textContent = motivacionRange.value;
            updateMotivacionColor(motivacionRange.value);
        });
        
        motivacionValue.textContent = motivacionRange.value;
        updateMotivacionColor(motivacionRange.value);
    }
}

/**
 * Configura los botones de envío
 */
function setupSubmitButtons() {
    const submitInfoBtn = document.getElementById('submit-step-1');
    if (submitInfoBtn) {
        submitInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
            if (tipoSolicitud === 'informacion') {
                handleInformationOnlySubmit();
            }
        });
    }
}

/**
 * Navega al siguiente paso
 * @param {number} currentStep - Paso actual
 * @returns {number|null} Siguiente paso o null
 */
function getNextStep(currentStep) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (tipoSolicitud === 'informacion') {
        return null;
    }
    
    switch (currentStep) {
        case 1: return 2;
        case 2: return 3;
        case 3: return 4;
        case 4: return null;
    }
    return null;
}

/**
 * Navega al paso anterior
 * @param {number} currentStep - Paso actual
 * @returns {number|null} Paso anterior o null
 */
function getPreviousStep(currentStep) {
    switch (currentStep) {
        case 2: return 1;
        case 3: return 2;
        case 4: return 3;
    }
    return null;
}

/**
 * Navega a un paso específico
 * @param {number} step - Paso al que navegar
 */
export function goToStep(step) {
    try {
        if (step < 1 || step > maxFormStep) return;

        // Ocultar todos los pasos
        document.querySelectorAll('.form-step').forEach(stepDiv => {
            stepDiv.classList.remove('active');
        });
        
        // Mostrar el paso seleccionado
        const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
            
            // Enfocar primer input
            setTimeout(() => {
                const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
                if (firstInput && !firstInput.disabled) {
                    firstInput.focus();
                }
            }, 100);
        }

        updateProgressIndicator(step, maxFormStep);
        
        currentFormStep = step;
        saveFormDraft();

        console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
    } catch (error) {
        console.error('Error going to step:', error);
    }
}

/**
 * Actualiza el indicador de progreso
 * @param {number} current - Paso actual
 * @param {number} total - Total de pasos
 */
function updateProgressIndicator(current, total) {
    try {
        const progressFill = document.getElementById('form-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            const progressPercentage = (current / total) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Paso ${current} de ${total}`;
        }
    } catch (error) {
        console.error('Error updating progress indicator:', error);
    }
}

/**
 * Actualiza el color del valor de motivación
 * @param {number} value - Valor de motivación
 */
function updateMotivacionColor(value) {
    try {
        const motivacionValue = document.getElementById('motivacion-value');
        if (!motivacionValue) return;
        
        const numValue = parseInt(value);
        let color;
        
        if (numValue <= 3) {
            color = 'var(--danger-red)';
        } else if (numValue <= 6) {
            color = 'var(--warning-orange)';
        } else {
            color = 'var(--success-green)';
        }
        
        motivacionValue.style.backgroundColor = color;
        motivacionValue.style.color = 'white';
    } catch (error) {
        console.error('Error updating motivacion color:', error);
    }
}

/**
 * Obtiene los datos actuales del formulario
 * @returns {Object} Datos del formulario
 */
export function getCurrentFormStep() {
    return currentFormStep;
}

/**
 * Obtiene el máximo número de pasos
 * @returns {number} Máximo de pasos
 */
export function getMaxFormStep() {
    return maxFormStep;
}

/**
 * Maneja el envío de solicitudes de información
 */
export async function handleInformationRequestSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const requestData = {
        nombre: formData.get('nombre'),
        apellidos: formData.get('apellidos'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        rut: formData.get('rut'),
        tipoConsulta: formData.get('tipo-consulta'),
        mensaje: formData.get('mensaje'),
        cesfam: formData.get('cesfam'),
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        origen: 'formulario_web',
        version: '1.0'
    };

    try {
        const db = getFirestore();
        const solicitudesRef = db.collection('solicitudes_informacion');
        await solicitudesRef.add(requestData);
        
        showNotification('Solicitud de información enviada correctamente', 'success');
        e.target.reset();
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        showNotification('Error al enviar la solicitud', 'error');
    }
}
