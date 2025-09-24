/**
 * FORMULARIOS/AUTOGUARDADO.JS
 * Sistema de autoguardado para formularios
 */

import { APP_CONFIG } from '../configuracion/constantes.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { goToStep } from './formulario-paciente.js';

let isDraftSaved = false;
let autoSaveTimer = null;

/**
 * Configura el sistema de autoguardado
 */
export function setupAutoSave() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Configurar listener para cambios en el formulario
        form.addEventListener('input', handleFormChange);
        form.addEventListener('change', handleFormChange);
        
        // Cargar borrador existente
        loadFormDraft();
        
        console.log('✅ Auto-guardado configurado');
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

/**
 * Maneja los cambios en el formulario
 */
function handleFormChange() {
    try {
        // Cancelar timer anterior
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // Configurar nuevo timer
        autoSaveTimer = setTimeout(() => {
            saveFormDraft();
        }, 2000); // Guardar después de 2 segundos de inactividad
        
    } catch (error) {
        console.error('Error handling form change:', error);
    }
}

/**
 * Guarda un borrador del formulario
 */
export function saveFormDraft() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const draftData = {};
        
        // Extraer datos del formulario
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        // Agregar metadatos
        draftData.currentStep = getCurrentFormStep();
        draftData.maxFormStep = getMaxFormStep();
        draftData.timestamp = Date.now();
        
        // Guardar en localStorage
        localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
        isDraftSaved = true;
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('💾 Borrador guardado automáticamente');
        }
        
        showDraftSavedIndicator();
        
    } catch (error) {
        console.error('Error saving form draft:', error);
    }
}

/**
 * Carga un borrador del formulario
 */
export function loadFormDraft() {
    try {
        const savedDraft = localStorage.getItem('senda_form_draft');
        if (!savedDraft) return;
        
        const draftData = JSON.parse(savedDraft);
        
        // Verificar si el borrador no es muy antiguo (24 horas)
        if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('senda_form_draft');
            return;
        }
        
        // Preguntar al usuario si quiere restaurar el borrador
        if (confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?')) {
            restoreFormDraft(draftData);
        } else {
            localStorage.removeItem('senda_form_draft');
        }
        
    } catch (error) {
        console.error('Error loading form draft:', error);
    }
}

/**
 * Restaura un borrador del formulario
 * @param {Object} draftData - Datos del borrador
 */
function restoreFormDraft(draftData) {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        // Restaurar valores de los campos
        Object.keys(draftData).forEach(key => {
            if (key === 'currentStep' || key === 'maxFormStep' || key === 'timestamp') return;
            
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'radio' || field.type === 'checkbox') {
                    field.checked = field.value === draftData[key];
                } else {
                    field.value = draftData[key];
                }
                
                // Disparar evento change para activar validaciones
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Restaurar configuración del formulario
        if (draftData.maxFormStep) {
            setMaxFormStep(draftData.maxFormStep);
        }
        
        // Navegar al paso guardado
        if (draftData.currentStep) {
            setTimeout(() => {
                goToStep(draftData.currentStep);
            }, 100);
        }
        
        showNotification('Borrador restaurado correctamente', 'success');
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('📝 Borrador restaurado');
        }
        
    } catch (error) {
        console.error('Error restoring form draft:', error);
        showNotification('Error al restaurar el borrador', 'error');
    }
}

/**
 * Resetea el formulario y elimina borradores
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
        
        // Limpiar borrador
        isDraftSaved = false;
        localStorage.removeItem('senda_form_draft');
        
        console.log('✅ Formulario reseteado');
    } catch (error) {
        console.error('Error reseteando formulario:', error);
    }
}

/**
 * Resetea campos especiales del formulario
 */
function resetSpecialFields() {
    try {
        // Resetear slider de motivación
        const motivacionRange = document.getElementById('motivacion-range');
        const motivacionValue = document.getElementById('motivacion-value');
        if (motivacionRange && motivacionValue) {
            motivacionRange.value = 5;
            motivacionValue.textContent = '5';
            motivacionValue.style.backgroundColor = 'var(--warning-orange)';
        }
        
        // Resetear contenedores de tipo de solicitud
        const infoEmailContainer = document.getElementById('info-email-container');
        const basicInfoContainer = document.getElementById('basic-info-container');
        const nextBtn = document.getElementById('next-step-1');
        const submitBtn = document.getElementById('submit-step-1');
        
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
        
    } catch (error) {
        console.error('Error resetteando campos especiales:', error);
    }
}

/**
 * Verifica si hay cambios no guardados en el formulario
 * @returns {boolean} True si hay cambios
 */
export function hasUnsavedChanges() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return false;
        
        const formData = new FormData(form);
        let hasData = false;
        
        for (let [key, value] of formData.entries()) {
            if (value && value.trim() !== '') {
                hasData = true;
                break;
            }
        }
        
        return hasData && !isDraftSaved;
    } catch (error) {
        console.error('Error checking unsaved changes:', error);
        return false;
    }
}

/**
 * Muestra el indicador de borrador guardado
 */
function showDraftSavedIndicator() {
    try {
        // Crear o obtener el indicador
        let indicator = document.getElementById('draft-saved-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'draft-saved-indicator';
            indicator.className = 'draft-saved-indicator';
            indicator.innerHTML = '<i class="fas fa-save"></i> Borrador guardado';
            document.body.appendChild(indicator);
        }
        
        // Mostrar temporalmente
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
        
    } catch (error) {
        console.error('Error showing draft saved indicator:', error);
    }
}

// Variables auxiliares que se importarían de otros módulos
function getCurrentFormStep() {
    // Esta función debería importarse de formulario-paciente.js
    return 1; // placeholder
}

function getMaxFormStep() {
    // Esta función debería importarse de formulario-paciente.js
    return 4; // placeholder
}

function setMaxFormStep(step) {
    // Esta función debería implementarse en formulario-paciente.js
    console.log('Setting max form step to:', step);
}

/**
 * Obtiene el estado del draft guardado
 * @returns {boolean} Estado del draft
 */
export function isDraftSavedState() {
    return isDraftSaved;
}

/**
 * Establece el estado del draft guardado
 * @param {boolean} saved - Estado del draft
 */
export function setDraftSavedState(saved) {
    isDraftSaved = saved;
}
