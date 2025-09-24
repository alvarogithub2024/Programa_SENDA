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
// Agregar esta función al final del archivo formulario-paciente.js

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

// Exportar las nuevas funciones
export { collectFormDataSafe, obtenerSustancias, calculatePriority };
