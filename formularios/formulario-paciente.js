/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS
 * Manejo del formulario multi-paso para solicitudes de pacientes
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { validateRUT, isValidEmail } from '../utilidades/validaciones.js';
import { validateStep } from '../formularios/validaciones.js';
import { setupAutoSave, saveFormDraft, loadFormDraft, resetForm } from './autoguardado.js';

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
 * Maneja el envío de solicitudes de información únicamente
 */
function handleInformationOnlySubmit() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Crear evento simulado para usar la función existente
        const fakeEvent = {
            preventDefault: () => {},
            target: form
        };
        
        handleInformationRequestSubmit(fakeEvent);
        
    } catch (error) {
        console.error('Error enviando solicitud de información:', error);
        showNotification('Error al enviar la solicitud', 'error');
    }
}

/**
 * Maneja el envío del formulario de pacientes completo
 */
async function handlePatientFormSubmit(e) {
    try {
        e.preventDefault();
        console.log('📤 Enviando formulario de paciente');
        
        const formData = new FormData(e.target);
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (tipoSolicitud === 'informacion') {
            // Usar función existente para solicitudes de información
            await handleInformationRequestSubmit(e);
        } else if (tipoSolicitud === 'identificado') {
            // Manejar como solicitud de ingreso
            await handleSolicitudIngresoSubmit(e);
        }
        
    } catch (error) {
        console.error('Error enviando formulario:', error);
        showNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Maneja el envío de solicitudes de ingreso (guardado en solicitudes_ingreso)
 */
async function handleSolicitudIngresoSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Construir datos para solicitud de ingreso
    const solicitudData = {
        // Información personal
        nombre: formData.get('nombre') || '',
        apellidos: formData.get('apellidos') || formData.get('apellido') || '',
        rut: formData.get('rut') || '',
        edad: parseInt(formData.get('edad')) || 0,
        email: formData.get('email') || '',
        telefono: formData.get('telefono') || '',
        direccion: formData.get('direccion') || '',
        
        // Información de la solicitud
        cesfam: formData.get('cesfam') || 'CESFAM Karol Wojtyla',
        descripcion: formData.get('descripcion') || formData.get('motivoConsulta') || '',
        
        // Clasificación
        prioridad: determinarPrioridad(formData),
        urgencia: determinarUrgencia(formData),
        motivacion: parseInt(formData.get('motivacion')) || 5,
        
        // Información específica
        sustancias: obtenerSustancias(formData),
        tiempoConsumo: formData.get('tiempoConsumo') || '',
        tratamientoPrevio: formData.get('tratamientoPrevio') || 'no',
        paraMi: formData.get('paraMi') || formData.get('esPara') || 'si',
        
        // Metadata del sistema
        estado: 'pendiente',
        tipoSolicitud: 'identificado',
        origen: 'web_publica',
        version: '2.0',
        
        // Timestamps
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        fechaAgenda: null,
        
        // IDs relacionados
        agendadaPor: null,
        citaId: null
    };

    try {
        // Importar getFirestore dinámicamente para evitar errores de import
        const { getFirestore } = await import('../configuracion/firebase.js');
        const db = getFirestore();
        
        // Guardar en la colección correcta: solicitudes_ingreso
        const solicitudesRef = db.collection('solicitudes_ingreso');
        const docRef = await solicitudesRef.add(solicitudData);
        
        console.log('✅ Solicitud de ingreso guardada con ID:', docRef.id);
        showNotification('¡Solicitud de ayuda enviada correctamente! Te contactaremos pronto.', 'success');
        
        // Limpiar formulario y resetear
        e.target.reset();
        resetForm();
        goToStep(1);
        
    } catch (error) {
        console.error('❌ Error guardando solicitud de ingreso:', error);
        showNotification('Error al enviar la solicitud. Por favor intente nuevamente.', 'error');
    }
}

/**
 * Determina la prioridad basada en los datos del formulario
 */
function determinarPrioridad(formData) {
    const motivacion = parseInt(formData.get('motivacion')) || 5;
    const sustancias = obtenerSustancias(formData);
    const tiempoConsumo = formData.get('tiempoConsumo');
    
    if (motivacion >= 8 && (sustancias.includes('pasta_base') || sustancias.includes('cocaina'))) {
        return 'alta';
    } else if (motivacion >= 6 || tiempoConsumo === 'mas_5_años') {
        return 'media';
    } else {
        return 'baja';
    }
}

/**
 * Determina la urgencia basada en los datos del formulario
 */
function determinarUrgencia(formData) {
    const descripcion = (formData.get('descripcion') || '').toLowerCase();
    const sustancias = obtenerSustancias(formData);
    
    // Palabras clave que indican alta urgencia
    const palabrasUrgentes = ['crisis', 'urgente', 'emergencia', 'suicidio', 'violento', 'peligro'];
    
    if (palabrasUrgentes.some(palabra => descripcion.includes(palabra))) {
        return 'alta';
    } else if (sustancias.includes('pasta_base') || sustancias.includes('cocaina')) {
        return 'media';
    } else {
        return 'baja';
    }
}

/**
 * Obtiene las sustancias seleccionadas del formulario
 */
function obtenerSustancias(formData) {
    const sustancias = [];
    
    // Verificar checkboxes de sustancias
    const sustanciasDisponibles = ['alcohol', 'marihuana', 'cocaina', 'pasta_base', 'benzodiacepinas', 'otros'];
    
    sustanciasDisponibles.forEach(sustancia => {
        if (formData.get(`sustancia_${sustancia}`) || formData.get(sustancia)) {
            sustancias.push(sustancia);
        }
    });
    
    // Si no hay sustancias específicas, intentar obtener de un campo general
    if (sustancias.length === 0) {
        const sustanciaGeneral = formData.get('sustancias');
        if (sustanciaGeneral) {
            sustancias.push(sustanciaGeneral);
        }
    }
    
    return sustancias;
}
/**
 * Maneja el envío de solicitudes de información
 */
export async function handleInformationRequestSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const requestData = {
        nombre: formData.get('nombre') || '',
        apellidos: formData.get('apellidos') || '',
        email: formData.get('email') || document.getElementById('info-email')?.value || '',
        telefono: formData.get('telefono') || '',
        rut: formData.get('rut') || '',
        tipoConsulta: 'informacion',
        mensaje: formData.get('mensaje') || 'Solicitud de información general',
        cesfam: formData.get('cesfam') || 'CESFAM Karol Wojtyla',
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        origen: 'formulario_web',
        version: '1.0'
    };

    try {
        const { getFirestore } = await import('../configuracion/firebase.js');
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
