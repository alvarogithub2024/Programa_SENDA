/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS
 * Manejo del formulario multi-paso para solicitudes de pacientes
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { validateRUT, isValidEmail } from '../utilidades/validaciones.js';
import { setupAutoSave, saveFormDraft, loadFormDraft, resetForm } from './autoguardado.js';

let currentFormStep = 1;
let maxFormStep = 4;

/**
 * Configura el formulario multi-paso de pacientes
 */
export function setupFormularios() {
    try {
        setupMultiStepForm();
        if (typeof setupAutoSave === 'function') {
            setupAutoSave();
        }
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
    try {
        const form = document.getElementById('patient-form');
        if (!form) {
            console.warn('⚠️ Formulario patient-form no encontrado');
            return;
        }

        const nextButtons = form.querySelectorAll('[id^="next-step"]');
        const prevButtons = form.querySelectorAll('[id^="prev-step"]');
        
        console.log(`🔧 Configurando ${nextButtons.length} botones "siguiente" y ${prevButtons.length} botones "anterior"`);
        
        nextButtons.forEach(btn => {
            if (btn && typeof btn.addEventListener === 'function') {
                btn.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        const currentStep = parseInt(btn.id.split('-')[2]);
                        
                        // Validar paso antes de continuar
                        if (validateStepBasic(currentStep)) {
                            const nextStep = getNextStep(currentStep);
                            if (nextStep) {
                                goToStep(nextStep);
                            }
                        }
                    } catch (error) {
                        console.error('Error en botón siguiente:', error);
                    }
                });
            }
        });

        prevButtons.forEach(btn => {
            if (btn && typeof btn.addEventListener === 'function') {
                btn.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        const currentStep = parseInt(btn.id.split('-')[2]);
                        const prevStep = getPreviousStep(currentStep);
                        if (prevStep) {
                            goToStep(prevStep);
                        }
                    } catch (error) {
                        console.error('Error en botón anterior:', error);
                    }
                });
            }
        });
        
        console.log('✅ Botones de navegación configurados correctamente');
        
    } catch (error) {
        console.error('❌ Error configurando botones de navegación:', error);
    }
}

/**
 * Validación básica de pasos
 */
function validateStepBasic(step) {
    try {
        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStepElement) return false;
        
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                showNotification(`Por favor completa el campo: ${field.name || field.id}`, 'warning');
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error validando paso:', error);
        return true; // Permitir navegación en caso de error
    }
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
    
    if (typeof saveFormDraft === 'function') {
        saveFormDraft();
    }
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
        if (typeof saveFormDraft === 'function') {
            saveFormDraft();
        }

        console.log(`🔧 Navegando a paso ${step} de ${maxFormStep}`);
    } catch (error) {
        console.error('Error going to step:', error);
    }
}

/**
 * Actualiza el indicador de progreso
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
 * Maneja el envío del formulario de pacientes completo
 */
async function handlePatientFormSubmit(e) {
    try {
        e.preventDefault();
        console.log('📤 Enviando formulario de paciente');
        
        const formData = new FormData(e.target);
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (tipoSolicitud === 'informacion') {
            await handleInformationRequestSubmit(e);
        } else if (tipoSolicitud === 'identificado') {
            await handleSolicitudIngresoSubmit(e);
        }
        
    } catch (error) {
        console.error('Error enviando formulario:', error);
        showNotification('Error al procesar la solicitud', 'error');
    }
}

/**
 * Maneja el envío de solicitudes de información únicamente
 */
function handleInformationOnlySubmit() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
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

/**
 * Maneja el envío de solicitudes de ingreso
 */
async function handleSolicitudIngresoSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const solicitudData = {
        // Información personal
        nombre: formData.get('nombre') || formData.get('patient-name') || '',
        apellidos: formData.get('apellidos') || formData.get('patient-lastname') || '',
        rut: formatRUT(formData.get('rut') || formData.get('patient-rut') || ''),
        edad: parseInt(formData.get('edad') || formData.get('patient-age')) || 0,
        email: formData.get('email') || formData.get('patient-email') || '',
        telefono: formatPhoneNumber(formData.get('telefono') || formData.get('patient-phone') || ''),
        direccion: formData.get('direccion') || formData.get('patient-address') || '',
        
        // Información de la solicitud
        cesfam: formData.get('cesfam') || formData.get('patient-cesfam') || 'CESFAM Karol Wojtyla',
        descripcion: formData.get('descripcion') || formData.get('patient-description') || formData.get('motivoConsulta') || '',
        
        // Clasificación
        prioridad: determinarPrioridad(formData),
        urgencia: determinarUrgencia(formData),
        motivacion: parseInt(formData.get('motivacion') || formData.get('motivacion-range')) || 5,
        
        // Información específica
        sustancias: obtenerSustancias(formData),
        tiempoConsumo: formData.get('tiempoConsumo') || formData.get('tiempo-consumo') || '',
        tratamientoPrevio: formData.get('tratamientoPrevio') || 'no',
        paraMi: formData.get('paraMi') || 'si',
        
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
        const { getFirestore } = await import('../configuracion/firebase.js');
        const db = getFirestore();
        
        const solicitudesRef = db.collection('solicitudes_ingreso');
        const docRef = await solicitudesRef.add(solicitudData);
        
        console.log('✅ Solicitud de ingreso guardada con ID:', docRef.id);
        showNotification('¡Solicitud de ayuda enviada correctamente! Te contactaremos pronto.', 'success');
        
        e.target.reset();
        if (typeof resetForm === 'function') {
            resetForm();
        }
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
    const motivacion = parseInt(formData.get('motivacion') || formData.get('motivacion-range')) || 5;
    const sustancias = obtenerSustancias(formData);
    const tiempoConsumo = formData.get('tiempoConsumo') || formData.get('tiempo-consumo') || '';
    
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
    const descripcion = (formData.get('descripcion') || formData.get('patient-description') || '').toLowerCase();
    const sustancias = obtenerSustancias(formData);
    
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
    
    const sustanciasDisponibles = [
        'alcohol',
        'marihuana', 
        'cocaina',
        'pasta_base',
        'benzodiacepinas',
        'medicamentos',
        'otros'
    ];
    
    sustanciasDisponibles.forEach(sustancia => {
        if (formData.get(`sustancia_${sustancia}`) || 
            formData.get(sustancia) ||
            formData.get(`sustancias`) === sustancia) {
            sustancias.push(sustancia);
        }
    });
    
    const sustanciasGenerales = formData.getAll('sustancias');
    if (sustanciasGenerales.length > 0) {
        sustanciasGenerales.forEach(sustancia => {
            if (sustancia && !sustancias.includes(sustancia)) {
                sustancias.push(sustancia);
            }
        });
    }
    
    if (sustancias.length === 0) {
        sustancias.push('no_especificada');
    }
    
    return sustancias;
}

/**
 * Formatea un RUT chileno
 */
function formatRUT(rut) {
    if (!rut) return '';
    
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (cleaned.length < 2) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    
    return `${formattedBody}-${dv}`;
}

/**
 * Formatea un número de teléfono chileno
 */
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
    }
    
    return phone;
}

/**
 * Actualiza la solicitud cuando se agenda una cita
 */
export async function actualizarSolicitudAgendada(solicitudId, citaId, profesionalId, fechaAgenda) {
    try {
        const { getFirestore } = await import('../configuracion/firebase.js');
        const db = getFirestore();
        
        await db.collection('solicitudes_ingreso').doc(solicitudId).update({
            estado: 'agendada',
            agendadaPor: profesionalId,
            citaId: citaId,
            fechaAgenda: firebase.firestore.Timestamp.fromDate(fechaAgenda)
        });
        
        console.log('✅ Solicitud actualizada como agendada');
        
    } catch (error) {
        console.error('❌ Error actualizando solicitud:', error);
        throw error;
    }
}

/**
 * Obtiene los datos actuales del formulario
 */
export function getCurrentFormStep() {
    return currentFormStep;
}

/**
 * Obtiene el máximo número de pasos
 */
export function getMaxFormStep() {
    return maxFormStep;
}
