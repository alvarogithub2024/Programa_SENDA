/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS
 * Sistema completo de formulario multi-paso - VERSIÓN CORREGIDA
 */

import { getFirestore, getServerTimestamp, retryFirestoreOperation } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';
import { validateRUT, isValidEmail, formatRUT, formatPhoneNumber } from '../utilidades/validaciones.js';

let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};

/**
 * Configura el formulario multi-paso de pacientes
 */
export function setupFormularios() {
    try {
        console.log('🔧 Configurando formularios...');
        
        setupMultiStepForm();
        setupAutoSave();
        setupFormValidation();
        
        console.log('✅ Formularios configurados correctamente');
        
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
        if (!form) {
            console.warn('⚠️ Formulario patient-form no encontrado');
            return;
        }

        // Configurar navegación entre pasos
        setupNavigationButtons();
        
        // Configurar listeners específicos
        setupTipoSolicitudListeners();
        setupMotivacionSlider();
        setupSubmitButtons();
        
        // Event listener principal del formulario
        form.addEventListener('submit', handlePatientFormSubmit);
        
        // Configurar validación en tiempo real
        setupRealTimeValidation();
        
        console.log('✅ Formulario multi-step configurado');
        
    } catch (error) {
        console.error('❌ Error configurando formulario multi-step:', error);
    }
}

/**
 * Configura los botones de navegación entre pasos
 */
function setupNavigationButtons() {
    try {
        // Botones "Siguiente"
        const nextButtons = [
            document.getElementById('next-step-1'),
            document.getElementById('next-step-2'),
            document.getElementById('next-step-3')
        ].filter(btn => btn);

        nextButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleNextStep(index + 1);
            });
        });

        // Botones "Anterior"
        const prevButtons = [
            document.getElementById('prev-step-2'),
            document.getElementById('prev-step-3'),
            document.getElementById('prev-step-4')
        ].filter(btn => btn);

        prevButtons.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                goToStep(index + 1); // prev-step-2 va al paso 1, etc.
            });
        });
        
    } catch (error) {
        console.error('Error configurando botones de navegación:', error);
    }
}

/**
 * Maneja el avance al siguiente paso
 */
function handleNextStep(currentStep) {
    try {
        // Validar paso actual
        if (!validateCurrentStep(currentStep)) {
            return;
        }
        
        // Guardar datos del paso actual
        saveCurrentStepData();
        
        // Determinar siguiente paso
        const nextStep = getNextStep(currentStep);
        if (nextStep) {
            goToStep(nextStep);
        }
        
    } catch (error) {
        console.error('Error en handleNextStep:', error);
    }
}

/**
 * Valida el paso actual
 */
function validateCurrentStep(step) {
    try {
        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"].active`);
        if (!currentStepElement) {
            console.warn('Elemento del paso actual no encontrado');
            return false;
        }
        
        // Validaciones específicas por paso
        switch (step) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            default:
                return true;
        }
        
    } catch (error) {
        console.error('Error validando paso:', error);
        return false;
    }
}

/**
 * Valida el paso 1
 */
function validateStep1() {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (!tipoSolicitud) {
        showNotification('Por favor selecciona un tipo de solicitud', 'warning');
        return false;
    }
    
    if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email')?.value?.trim();
        if (!email) {
            showNotification('Ingresa un email para recibir información', 'warning');
            return false;
        }
        if (!isValidEmail(email)) {
            showNotification('Ingresa un email válido', 'warning');
            return false;
        }
        return true;
    }
    
    if (tipoSolicitud === 'identificado') {
        // Validar campos básicos
        const edad = document.getElementById('patient-age')?.value;
        const cesfam = document.getElementById('patient-cesfam')?.value;
        const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
        
        if (!edad || edad < 12 || edad > 120) {
            showNotification('La edad debe estar entre 12 y 120 años', 'warning');
            return false;
        }
        
        if (!cesfam) {
            showNotification('Selecciona un CESFAM', 'warning');
            return false;
        }
        
        if (!paraMi) {
            showNotification('Indica para quién solicitas ayuda', 'warning');
            return false;
        }
    }
    
    return true;
}

/**
 * Valida el paso 2
 */
function validateStep2() {
    const nombre = document.getElementById('patient-name')?.value?.trim();
    const apellidos = document.getElementById('patient-lastname')?.value?.trim();
    const rut = document.getElementById('patient-rut')?.value?.trim();
    const telefono = document.getElementById('patient-phone')?.value?.trim();
    
    if (!nombre) {
        showNotification('El nombre es obligatorio', 'warning');
        return false;
    }
    
    if (!apellidos) {
        showNotification('Los apellidos son obligatorios', 'warning');
        return false;
    }
    
    if (!rut) {
        showNotification('El RUT es obligatorio', 'warning');
        return false;
    }
    
    if (!validateRUT(rut)) {
        showNotification('RUT inválido', 'warning');
        return false;
    }
    
    if (!telefono) {
        showNotification('El teléfono es obligatorio', 'warning');
        return false;
    }
    
    const phoneClean = telefono.replace(/\D/g, '');
    if (phoneClean.length < 8) {
        showNotification('Teléfono inválido', 'warning');
        return false;
    }
    
    const email = document.getElementById('patient-email')?.value?.trim();
    if (email && !isValidEmail(email)) {
        showNotification('Email inválido', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Valida el paso 3
 */
function validateStep3() {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
        showNotification('Selecciona al menos una sustancia problemática', 'warning');
        return false;
    }
    
    const urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
    if (!urgencia) {
        showNotification('Selecciona el nivel de urgencia', 'warning');
        return false;
    }
    
    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    if (!tratamientoPrevio) {
        showNotification('Indica si has recibido tratamiento previo', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Configura listeners para tipo de solicitud
 */
function setupTipoSolicitudListeners() {
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    
    tipoSolicitudInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const tipoSolicitud = e.target.value;
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
            const value = motivacionRange.value;
            motivacionValue.textContent = value;
            updateMotivacionColor(value);
        });
        
        // Inicializar valor
        motivacionValue.textContent = motivacionRange.value;
        updateMotivacionColor(motivacionRange.value);
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
            color = '#ef4444'; // Rojo
        } else if (numValue <= 6) {
            color = '#f59e0b'; // Amarillo
        } else {
            color = '#10b981'; // Verde
        }
        
        motivacionValue.style.backgroundColor = color;
        motivacionValue.style.color = 'white';
        motivacionValue.style.padding = '4px 12px';
        motivacionValue.style.borderRadius = '20px';
        motivacionValue.style.fontWeight = '600';
        
    } catch (error) {
        console.error('Error actualizando color de motivación:', error);
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
 * Obtiene el siguiente paso
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
        default: return null;
    }
}

/**
 * Navega a un paso específico
 */
export function goToStep(step) {
    try {
        if (step < 1 || step > maxFormStep) {
            console.warn(`Paso ${step} fuera de rango (1-${maxFormStep})`);
            return;
        }

        // Ocultar todos los pasos
        document.querySelectorAll('.form-step').forEach(stepDiv => {
            stepDiv.classList.remove('active');
        });
        
        // Mostrar el paso seleccionado
        const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
            
            // Scroll al inicio del formulario
            targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Enfocar primer input después de un momento
            setTimeout(() => {
                const firstInput = targetStep.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        }

        // Actualizar indicadores
        currentFormStep = step;
        updateProgressIndicator(step, maxFormStep);
        saveFormDraft();

        console.log(`Navegando a paso ${step} de ${maxFormStep}`);
        
    } catch (error) {
        console.error('Error navegando a paso:', error);
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
        console.error('Error actualizando indicador de progreso:', error);
    }
}

/**
 * Guarda datos del paso actual
 */
function saveCurrentStepData() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        const currentData = new FormData(form);
        
        // Actualizar formData global
        for (let [key, value] of currentData.entries()) {
            formData[key] = value;
        }
        
        // Guardar sustancias seleccionadas
        const sustancias = [];
        document.querySelectorAll('input[name="sustancias"]:checked').forEach(checkbox => {
            if (checkbox.value) {
                sustancias.push(checkbox.value);
            }
        });
        formData.sustancias = sustancias;
        
    } catch (error) {
        console.error('Error guardando datos del paso:', error);
    }
}

/**
 * Maneja el envío del formulario principal
 */
async function handlePatientFormSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('Enviando formulario de paciente...');
        
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (tipoSolicitud === 'informacion') {
            await handleInformationRequestSubmit(e);
        } else if (tipoSolicitud === 'identificado') {
            await handleSolicitudIngresoSubmit(e);
        }
        
    } catch (error) {
        console.error('Error enviando formulario:', error);
        showNotification('Error al procesar la solicitud: ' + error.message, 'error');
    }
}

/**
 * Maneja solicitud de información únicamente
 */
function handleInformationOnlySubmit() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Crear evento simulado
        const event = {
            preventDefault: () => {},
            target: form
        };
        
        handleInformationRequestSubmit(event);
        
    } catch (error) {
        console.error('Error enviando solicitud de información:', error);
        showNotification('Error al enviar la solicitud', 'error');
    }
}

/**
 * Procesa solicitudes de información
 */
export async function handleInformationRequestSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-step-1');
    
    try {
        toggleSubmitButton(submitBtn, true);
        
        const email = document.getElementById('info-email')?.value?.trim();
        const edad = document.getElementById('patient-age')?.value;
        const cesfam = document.getElementById('patient-cesfam')?.value;
        const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
        
        if (!email || !isValidEmail(email)) {
            showNotification('Ingresa un email válido', 'warning');
            return;
        }
        
        const requestData = {
            tipo: 'informacion',
            email: email,
            edad: edad ? parseInt(edad) : null,
            cesfam: cesfam || 'No especificado',
            paraMi: paraMi || 'si',
            fechaCreacion: getServerTimestamp(),
            estado: 'pendiente',
            origen: 'web_publica',
            version: '2.0'
        };

        const db = getFirestore();
        const docRef = await retryFirestoreOperation(async () => {
            return await db.collection('solicitudes_informacion').add(requestData);
        });
        
        console.log('Solicitud de información guardada con ID:', docRef.id);
        
        showNotification('Solicitud de información enviada correctamente. Te contactaremos por email.', 'success');
        
        // Limpiar y cerrar
        resetForm();
        closeModal('patient-modal');
        
    } catch (error) {
        console.error('Error enviando solicitud de información:', error);
        
        let errorMessage = 'Error al enviar la solicitud';
        if (error.code === 'permission-denied') {
            errorMessage += ': Sin permisos para crear solicitudes';
        } else if (error.code === 'network-request-failed') {
            errorMessage += ': Problema de conexión';
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Procesa solicitudes de ingreso identificadas
 */
async function handleSolicitudIngresoSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('#patient-form button[type="submit"]');
    
    try {
        console.log('Procesando solicitud de ingreso...');
        
        toggleSubmitButton(submitBtn, true);
        
        // Validar formulario completo
        if (!validateCompleteForm()) {
            return;
        }
        
        // Recopilar datos
        const solicitudData = collectSolicitudData();
        
        // Verificar datos críticos
        if (!solicitudData.nombre || !solicitudData.apellidos || !solicitudData.rut) {
            throw new Error('Datos críticos faltantes');
        }
        
        console.log('Guardando solicitud de ingreso...', {
            nombre: solicitudData.nombre,
            rut: solicitudData.rut,
            prioridad: solicitudData.prioridad
        });
        
        // Guardar en Firebase
        const db = getFirestore();
        const docRef = await retryFirestoreOperation(async () => {
            return await db.collection('solicitudes_ingreso').add(solicitudData);
        });
        
        console.log('Solicitud guardada con ID:', docRef.id);
        
        // Crear alerta crítica si es necesario
        if (solicitudData.prioridad === 'critica') {
            try {
                await createCriticalAlert(solicitudData, docRef.id);
                console.log('Alerta crítica creada');
            } catch (alertError) {
                console.warn('Error creando alerta crítica:', alertError);
            }
        }
        
        const prioridadText = solicitudData.prioridad.toUpperCase();
        showNotification(
            `Solicitud enviada correctamente con prioridad ${prioridadText}. Te contactaremos pronto.`,
            'success',
            6000
        );
        
        // Limpiar y cerrar
        resetForm();
        closeModal('patient-modal');
        
    } catch (error) {
        console.error('Error enviando solicitud de ingreso:', error);
        
        let errorMessage = 'Error al enviar la solicitud';
        if (error.code === 'permission-denied') {
            errorMessage += ': Sin permisos para crear solicitudes';
        } else if (error.code === 'network-request-failed') {
            errorMessage += ': Problema de conexión';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        showNotification(errorMessage, 'error');
        
    } finally {
        toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Valida el formulario completo
 */
function validateCompleteForm() {
    // Validar todos los pasos
    for (let step = 1; step <= 3; step++) {
        if (!validateCurrentStep(step)) {
            goToStep(step);
            return false;
        }
    }
    return true;
}

/**
 * Recopila todos los datos de la solicitud
 */
function collectSolicitudData() {
    try {
        saveCurrentStepData(); // Asegurar datos actuales
        
        const solicitudData = {
            // Información personal
            nombre: formData['patient-name'] || '',
            apellidos: formData['patient-lastname'] || '',
            rut: formatRUT(formData['patient-rut'] || ''),
            edad: parseInt(formData['patient-age']) || 0,
            email: formData['patient-email'] || '',
            telefono: formatPhoneNumber(formData['patient-phone'] || ''),
            direccion: formData['patient-address'] || '',
            
            // Información de la solicitud
            cesfam: formData['patient-cesfam'] || '',
            descripcion: formData['patient-description'] || '',
            
            // Clasificación
            urgencia: formData['urgencia'] || 'media',
            motivacion: parseInt(formData['motivacion-range']) || 5,
            
            // Información específica
            sustancias: formData.sustancias || [],
            tiempoConsumo: formData['tiempo-consumo'] || '',
            tratamientoPrevio: formData['tratamientoPrevio'] || 'no',
            paraMi: formData['paraMi'] || 'si',
            
            // Metadata del sistema
            estado: 'pendiente',
            tipoSolicitud: 'identificado',
            origen: 'web_publica',
            version: '2.0',
            
            // Timestamps
            fechaCreacion: getServerTimestamp(),
            fechaAgenda: null,
            
            // IDs relacionados
            agendadaPor: null,
            citaId: null
        };

        // Calcular prioridad
        solicitudData.prioridad = calculatePriority(solicitudData);
        
        return solicitudData;
        
    } catch (error) {
        console.error('Error recopilando datos:', error);
        throw new Error('Error recopilando datos del formulario: ' + error.message);
    }
}

/**
 * Calcula la prioridad basada en los datos
 */
function calculatePriority(solicitudData) {
    let score = 0;
    
    // Por urgencia
    if (solicitudData.urgencia === 'alta') score += 3;
    else if (solicitudData.urgencia === 'media') score += 2;
    else score += 1;
    
    // Por edad
    if (solicitudData.edad) {
        if (solicitudData.edad < 18 || solicitudData.edad > 65) score += 2;
        else score += 1;
    }
    
    // Por sustancias
    if (solicitudData.sustancias && Array.isArray(solicitudData.sustancias)) {
        const sustanciasPeligrosas = ['cocaina', 'pasta_base'];
        const tienePeligrosas = solicitudData.sustancias.some(s => sustanciasPeligrosas.includes(s));
        
        if (tienePeligrosas) score += 3;
        else if (solicitudData.sustancias.length > 2) score += 2;
        else if (solicitudData.sustancias.length > 0) score += 1;
    }
    
    // Por motivación
    if (solicitudData.motivacion >= 8) score += 2;
    else if (solicitudData.motivacion >= 6) score += 1;
    
    // Por descripción
    if (solicitudData.descripcion) {
        const palabrasCriticas = ['crisis', 'urgente', 'emergencia', 'violento', 'peligro', 'suicidio'];
        const tieneCriticas = palabrasCriticas.some(palabra => 
            solicitudData.descripcion.toLowerCase().includes(palabra)
        );
        if (tieneCriticas) score += 3;
    }
    
    if (score >= 10) return 'critica';
    else if (score >= 7) return 'alta';
    else if (score >= 4) return 'media';
    else return 'baja';
}

/**
 * Crea alerta crítica
 */
async function createCriticalAlert(solicitudData, solicitudId) {
    try {
        const db = getFirestore();
        
        const alertData = {
            solicitudId: solicitudId,
            mensaje: `Caso crítico: ${solicitudData.nombre} ${solicitudData.apellidos}, ${solicitudData.edad} años`,
            prioridad: 'maxima',
            tipo: 'caso_critico_nuevo',
            estado: 'pendiente',
            fechaCreacion: getServerTimestamp(),
            cesfam: solicitudData.cesfam,
            datosPaciente: {
                edad: solicitudData.edad,
                sustancias: solicitudData.sustancias,
                urgencia: solicitudData.urgencia,
                motivacion: solicitudData.motivacion
            }
        };
        
        await db.collection('alertas_criticas').add(alertData);
        
    } catch (error) {
        console.error('Error creando alerta crítica:', error);
        throw error;
    }
}

/**
 * Configura validación en tiempo real
 */
function setupRealTimeValidation() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // RUT formatting
        const rutInput = document.getElementById('patient-rut');
        if (rutInput) {
            rutInput.addEventListener('input', (e) => {
                e.target.value = formatRUT(e.target.value);
            });
        }
        
        // Phone formatting
        const phoneInput = document.getElementById('patient-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
        
    } catch (error) {
        console.error('Error configurando validación en tiempo real:', error);
    }
}

/**
 * Configura auto-guardado
 */
function setupAutoSave() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        let autoSaveTimer;
        
        form.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(saveFormDraft, 2000);
        });
        
        form.addEventListener('change', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(saveFormDraft, 1000);
        });
        
        loadFormDraft();
        
    } catch (error) {
        console.error('Error configurando auto-guardado:', error);
    }
}

/**
 * Guarda borrador del formulario
 */
function saveFormDraft() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        saveCurrentStepData();
        
        const draftData = {
            ...formData,
            currentStep: currentFormStep,
            maxFormStep: maxFormStep,
            timestamp: Date.now()
        };
        
        localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
    }
}

/**
 * Carga borrador del formulario
 */
function loadFormDraft() {
    try {
        const savedDraft = localStorage.getItem('senda_form_draft');
        if (!savedDraft) return;
        
        const draftData = JSON.parse(savedDraft);
        
        // Verificar antigüedad (24 horas)
        if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('senda_form_draft');
            return;
        }
        
        // Preguntar si restaurar
        if (confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?')) {
            restoreFormDraft(draftData);
        } else {
            localStorage.removeItem('senda_form_draft');
        }
        
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
}

/**
 * Restaura borrador del formulario
 */
function restoreFormDraft(draftData) {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Restaurar valores
        Object.keys(draftData).forEach(key => {
            if (['currentStep', 'maxFormStep', 'timestamp', 'sustancias'].includes(key)) return;
            
            const field = form.querySelector(`[name="${key}"], #${key}`);
            if (field) {
                if (field.type === 'radio' || field.type === 'checkbox') {
                    field.checked = field.value === draftData[key];
                } else {
                    field.value = draftData[key];
                }
            }
        });
        
        // Restaurar sustancias
        if (draftData.sustancias && Array.isArray(draftData.sustancias)) {
            draftData.sustancias.forEach(sustancia => {
                const checkbox = form.querySelector(`input[name="sustancias"][value="${sustancia}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // Restaurar configuración
        if (draftData.maxFormStep) {
            maxFormStep = draftData.maxFormStep;
        }
        
        // Navegar al paso guardado
        if (draftData.currentStep) {
            setTimeout(() => {
                goToStep(draftData.currentStep);
            }, 100);
        }
        
        formData = { ...draftData };
        
        showNotification('Borrador restaurado correctamente', 'success');
        
    } catch (error) {
        console.error('Error restaurando borrador:', error);
    }
}

/**
 * Resetea el formulario
 */
export function resetForm() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            
            // Resetear campos especiales
            resetSpecialFields();
            
            // Limpiar estilos de error
            form.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });
        }
        
        // Limpiar datos globales
        formData = {};
        currentFormStep = 1;
        maxFormStep = 4;
        
        // Ir al primer paso
        goToStep(1);
        
        // Limpiar borrador
        localStorage.removeItem('senda_form_draft');
        
        console.log('Formulario reseteado');
        
    } catch (error) {
        console.error('Error reseteando formulario:', error);
    }
}

/**
 * Resetea campos especiales
 */
function resetSpecialFields() {
    try {
        // Resetear slider de motivación
        const motivacionRange = document.getElementById('motivacion-range');
        const motivacionValue = document.getElementById('motivacion-value');
        if (motivacionRange && motivacionValue) {
            motivacionRange.value = 5;
            motivacionValue.textContent = '5';
            updateMotivacionColor(5);
        }
        
        // Resetear contenedores
        const infoEmailContainer = document.getElementById('info-email-container');
        const basicInfoContainer = document.getElementById('basic-info-container');
        const nextBtn = document.getElementById('next-step-1');
        const submitBtn = document.getElementById('submit-step-1');
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
        
        // Resetear progreso
        updateProgressIndicator(1, 4);
        
    } catch (error) {
        console.error('Error reseteando campos especiales:', error);
    }
}

/**
 * Configura validación del formulario
 */
function setupFormValidation() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Event listener para validación en envío
        form.addEventListener('submit', (e) => {
            const isValid = validateCompleteForm();
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
    } catch (error) {
        console.error('Error configurando validación:', error);
    }
}

// Obtener funciones actuales del formulario
export function getCurrentFormStep() {
    return currentFormStep;
}

export function getMaxFormStep() {
    return maxFormStep;
}
