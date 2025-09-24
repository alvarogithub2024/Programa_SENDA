/**
 * UTILIDADES/MODALES.JS
 * Gestión de modales y overlays
 */

import { APP_CONFIG } from '../configuracion/constantes.js';
import { hasUnsavedChanges, resetForm } from '../formularios/autoguardado.js';

/**
 * Muestra un modal por su ID
 * @param {string} modalId - ID del modal a mostrar
 */
export function showModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Enfocar primer input después de un breve delay
            setTimeout(() => {
                const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
                if (firstInput && !firstInput.disabled) {
                    firstInput.focus();
                }
            }, 100);
            
            if (APP_CONFIG.DEBUG_MODE) {
                console.log(`🔧 Modal abierto: ${modalId}`);
            }
        }
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}

/**
 * Cierra un modal por su ID
 * @param {string} modalId - ID del modal a cerrar
 */
export function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Verificar cambios no guardados en formularios específicos
            if (modalId === 'patient-modal' && hasUnsavedChanges()) {
                const confirmed = confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.');
                if (!confirmed) {
                    return;
                }
                resetForm();
            }
            
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Remover modales temporales
            if (modal.classList.contains('temp-modal')) {
                modal.remove();
            }
            
            if (APP_CONFIG.DEBUG_MODE) {
                console.log(`🔧 Modal cerrado: ${modalId}`);
            }
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

/**
 * Alterna el estado de un botón de envío (loading/normal)
 * @param {HTMLElement} button - Botón a alternar
 * @param {boolean} isLoading - Estado de carga
 */
export function toggleSubmitButton(button, isLoading) {
    if (!button) return;
    
    try {
        if (isLoading) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
                button.removeAttribute('data-original-text');
            }
        }
    } catch (error) {
        console.error('Error toggling submit button:', error);
    }
}

/**
 * Crea un modal dinámico
 * @param {string} id - ID del modal
 * @param {string} title - Título del modal
 * @param {string} content - Contenido HTML del modal
 * @param {Object} options - Opciones adicionales
 * @returns {HTMLElement} Elemento del modal creado
 */
export function createModal(id, title, content, options = {}) {
    try {
        // Remover modal existente si existe
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal-overlay temp-modal ${options.className || ''}`;
        
        const modalSize = options.large ? 'large-modal' : '';
        
        modal.innerHTML = `
            <div class="modal ${modalSize}">
                <button class="modal-close" onclick="closeModal('${id}')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2>${title}</h2>
                    <div class="modal-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        return modal;
    } catch (error) {
        console.error('Error creating modal:', error);
        return null;
    }
}

/**
 * Muestra un modal de confirmación personalizado
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje de confirmación
 * @param {Function} onConfirm - Callback para confirmación
 * @param {Function} onCancel - Callback para cancelación
 */
export function showConfirmationModal(title, message, onConfirm, onCancel = null) {
    try {
        const modalId = 'confirmation-modal';
        const content = `
            <p style="margin-bottom: 24px; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn btn-outline" onclick="handleConfirmationCancel('${modalId}')">
                    <i class="fas fa-times"></i>
                    Cancelar
                </button>
                <button class="btn btn-danger" onclick="handleConfirmationConfirm('${modalId}')">
                    <i class="fas fa-check"></i>
                    Confirmar
                </button>
            </div>
        `;
        
        const modal = createModal(modalId, title, content);
        
        // Guardar callbacks en el elemento modal
        if (modal) {
            modal.onConfirm = onConfirm;
            modal.onCancel = onCancel;
        }
        
        showModal(modalId);
        
        // Funciones globales para manejar confirmación
        window.handleConfirmationConfirm = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal && modal.onConfirm) {
                modal.onConfirm();
            }
            closeModal(modalId);
        };
        
        window.handleConfirmationCancel = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal && modal.onCancel) {
                modal.onCancel();
            }
            closeModal(modalId);
        };
        
    } catch (error) {
        console.error('Error showing confirmation modal:', error);
    }
}

/**
 * Configura los event listeners globales para modales
 */
export function setupModalEventListeners() {
    try {
        // Click fuera del modal para cerrar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId) {
                    closeModal(modalId);
                }
            }
        });
        
        // Tecla ESC para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal-overlay[style*="flex"]');
                if (openModals.length > 0) {
                    const lastModal = openModals[openModals.length - 1];
                    if (lastModal.id) {
                        closeModal(lastModal.id);
                    }
                }
            }
        });
        
        console.log('✅ Modal event listeners configurados');
    } catch (error) {
        console.error('Error setting up modal event listeners:', error);
    }
}

/**
 * Resetea el formulario principal
 */
export function resetForm() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            
            // Resetear campos específicos
            resetSpecialFormFields();
            
            // Limpiar estilos de error
            form.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });
        }
        
        // Limpiar localStorage
        localStorage.removeItem('senda_form_draft');
        
        console.log('✅ Formulario reseteado');
    } catch (error) {
        console.error('Error reseteando formulario:', error);
    }
}

/**
 * Resetea campos especiales del formulario
 */
function resetSpecialFormFields() {
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
        
        // Resetear progreso del formulario
        const progressFill = document.getElementById('form-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) progressFill.style.width = '25%';
        if (progressText) progressText.textContent = 'Paso 1 de 4';
        
        // Mostrar primer paso
        document.querySelectorAll('.form-step').forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
    } catch (error) {
        console.error('Error resetting special form fields:', error);
    }
}

// Exportar la función closeModal para uso global
window.closeModal = closeModal;
