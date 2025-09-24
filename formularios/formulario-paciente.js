/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS
 * Manejo del formulario multi-paso para solicitudes de pacientes
 */

import { showNotification } from '../utilidades/notificaciones.js';
import { validateRUT, isValidEmail, formatRUT, formatPhoneNumber } from '../utilidades/validaciones.js';

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
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;

        const nextButtons = form.querySelectorAll('[id^="next-step"]');
        const prevButtons = form.querySelectorAll('[id^="prev-step"]');
        
        nextButtons.forEach(btn => {
            if (btn && typeof btn.addEventListener === 'function') {
                btn.addEventListener('click', (e) => {
                    try {
                        e.preventDefault();
                        const currentStep = parseInt(btn.id.split('-')[2]);
                        
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
        
        console.log('✅ Botones de navegación configurados');
        
    } catch (error) {
        console.error('❌ Error configurando botones:', error);
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
        return true;
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
        saveFormDraft();

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
            color = '#ef4444';
        } else if (numValue <= 6) {
            color = '#f59e0b';
        } else {
            color = '#10b981';
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
 * Recopila datos del formulario de manera segura
 */
function collectFormDataSafe() {
    try {
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        
        if (!tipoSolicitud) {
            throw new Error('Tipo de solicitud no seleccionado');
        }
        
        const solicitudData = {
            // Información personal
            nombre: document.getElementById('patient-name')?.value?.trim() || '',
            apellidos: document.getElementById('patient-lastname')?.value?.trim() || '',
            rut: formatRUT(document.getElementById('patient-rut')?.value?.trim() || ''),
            edad: parseInt(document.getElementById('patient-age')?.value) || 0,
            email: document.getElementById('patient-email')?.value?.trim() || '',
            telefono: formatPhoneNumber(document.getElementById('patient-phone')?.value?.trim() || ''),
            direccion: document.getElementById('patient-address')?.value?.trim() || '',
            
            // Información de la solicitud
            cesfam: document.getElementById('patient-cesfam')?.value || 'CESFAM Karol Wojtyla',
            descripcion: document.getElementById('patient-description')?.value?.trim() || '',
            
            // Clasificación
            prioridad: 'baja', // Se calculará después
            urgencia: document.querySelector('input[name="urgencia"]:checked')?.value || 'media',
            motivacion: parseInt(document.getElementById('motivacion-range')?.value) || 5,
            
            // Información específica
            sustancias: obtenerSustancias(),
            tiempoConsumo: document.getElementById('tiempo-consumo')?.value || '',
            tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value || 'no',
            paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || 'si',
            
            // Metadata del sistema
            estado: 'pendiente',
            tipoSolicitud: tipoSolicitud,
            origen: 'web_publica',
            version: '2.0',
            
            // Timestamps
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaAgenda: null,
            
            // IDs relacionados
            agendadaPor: null,
            citaId: null
        };

        // Calcular prioridad
        solicitudData.prioridad = calculatePriority(solicitudData);
        
        console.log('✅ Datos recopilados:', solicitudData);
        return solicitudData;
        
    } catch (error) {
        console.error('❌ Error recopilando datos:', error);
        throw new Error('Error recopilando datos del formulario: ' + error.message);
    }
}

/**
 * Obtiene las sustancias seleccionadas
 */
function obtenerSustancias() {
    const sustancias = [];
    const sustanciasChecked = document.querySelectorAll('input[name="sustancias"]:checked');
    
    if (sustanciasChecked.length > 0) {
        sustanciasChecked.forEach(checkbox => {
            if (checkbox.value) {
                sustancias.push(checkbox.value);
            }
        });
    }
    
    if (sustancias.length === 0) {
        sustancias.push('no_especificada');
    }
    
    return sustancias;
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
        const palabrasCriticas = ['crisis', 'urgente', 'emergencia', 'violento', 'peligro'];
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
 * Maneja el envío de solicitudes de ingreso - VERSIÓN CORREGIDA
 */
async function handleSolicitudIngresoSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Iniciando envío de solicitud de ingreso...');
    
    try {
        // Validar tipo de solicitud
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        if (tipoSolicitud !== 'identificado') {
            showNotification('Este flujo es solo para solicitudes identificadas', 'error');
            return;
        }

        // Validar campos obligatorios
        const camposObligatorios = [
            { id: 'patient-name', nombre: 'Nombre' },
            { id: 'patient-lastname', nombre: 'Apellidos' },
            { id: 'patient-rut', nombre: 'RUT' },
            { id: 'patient-age', nombre: 'Edad' },
            { id: 'patient-phone', nombre: 'Teléfono' },
            { id: 'patient-cesfam', nombre: 'CESFAM' }
        ];
        
        for (const campo of camposObligatorios) {
            const elemento = document.getElementById(campo.id);
            const valor = elemento?.value?.trim();
            
            if (!valor) {
                showNotification(`El campo ${campo.nombre} es obligatorio`, 'warning');
                elemento?.focus();
                return;
            }
        }
        
        // Validaciones específicas
        const rut = document.getElementById('patient-rut')?.value?.trim();
        if (!validateRUT(rut)) {
            showNotification('RUT inválido', 'warning');
            return;
        }
        
        const telefono = document.getElementById('patient-phone')?.value?.trim();
        if (!validatePhoneNumberString(telefono)) {
            showNotification('Teléfono inválido', 'warning');
            return;
        }

        // Validar sustancias
        const sustanciasChecked = document.querySelectorAll('input[name="sustancias"]:checked');
        if (sustanciasChecked.length === 0) {
            showNotification('Selecciona al menos una sustancia problemática', 'warning');
            return;
        }

        // Recopilar datos usando la función corregida
        const solicitudData = collectFormDataSafe();
        
        // Verificar datos críticos
        if (!solicitudData.nombre || !solicitudData.apellidos || !solicitudData.rut) {
            throw new Error('Datos críticos faltantes');
        }
        
        console.log('💾 Guardando solicitud...', solicitudData);
        
        // Guardar en Firebase
        const { getFirestore } = await import('../configuracion/firebase.js');
        const db = getFirestore();
        
        const solicitudesRef = db.collection('solicitudes_ingreso');
        const docRef = await solicitudesRef.add(solicitudData);
        
        console.log('✅ Solicitud guardada con ID:', docRef.id);
        
        // Crear alerta crítica si es necesario
        if (solicitudData.prioridad === 'critica') {
            try {
                await createCriticalAlert(solicitudData, docRef.id);
                console.log('🚨 Alerta crítica creada');
            } catch (alertError) {
                console.warn('⚠️ Error creando alerta crítica:', alertError);
            }
        }
        
        showNotification(`Solicitud enviada correctamente con prioridad ${solicitudData.prioridad.toUpperCase()}. Te contactaremos pronto.`, 'success');
        
        e.target.reset();
        resetForm();
        goToStep(1);
        
    } catch (error) {
        console.error('❌ Error enviando solicitud:', error);
        
        let errorMessage = 'Error al enviar la solicitud: ';
        if (error.code === 'permission-denied') {
            errorMessage += 'Sin permisos para crear solicitudes';
        } else if (error.code === 'network-request-failed') {
            errorMessage += 'Problema de conexión';
        } else {
            errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
    }
}

/**
 * Crea alerta crítica
 */
async function createCriticalAlert(solicitudData, solicitudId) {
    try {
        const { getFirestore } = await import('../configuracion/firebase.js');
        const db = getFirestore();
        
        const alertData = {
            id_solicitud: solicitudId,
            mensaje: `Caso crítico: ${solicitudData.nombre} ${solicitudData.apellidos}, ${solicitudData.edad} años`,
            prioridad: 'maxima',
            tipo_alerta: 'caso_critico_nuevo',
            estado: 'pendiente',
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            cesfam: solicitudData.cesfam,
            datos_paciente: {
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
 * Validación de teléfono
 */
function validatePhoneNumberString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Auto-guardado de formulario
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
        
        loadFormDraft();
        console.log('✅ Auto-guardado configurado');
    } catch (error) {
        console.error('Error configurando auto-guardado:', error);
    }
}

function saveFormDraft() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        draftData.currentStep = currentFormStep;
        draftData.maxFormStep = maxFormStep;
        draftData.timestamp = Date.now();
        
        localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
    }
}

function loadFormDraft() {
    try {
        const savedDraft = localStorage.getItem('senda_form_draft');
        if (!savedDraft) return;
        
        const draftData = JSON.parse(savedDraft);
        
        // Borrar borradores viejos (24h)
        if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('senda_form_draft');
            return;
        }
        
        // Restaurar datos aquí si es necesario
        
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
}

function resetForm() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            goToStep(1);
            
            const motivacionRange = document.getElementById('motivacion-range');
            const motivacionValue = document.getElementById('motivacion-value');
            if (motivacionRange && motivacionValue) {
                motivacionRange.value = 5;
                motivacionValue.textContent = '5';
                updateMotivacionColor(5);
            }
            
            maxFormStep = 4;
            updateProgressIndicator(1, 4);
        }
        
        localStorage.removeItem('senda_form_draft');
        
    } catch (error) {
        console.error('Error reseteando formulario:', error);
    }
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

// Exportar resetForm para uso externo
export { resetForm };
