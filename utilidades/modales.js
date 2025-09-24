

import { APP_CONFIG } from '../configuracion/constantes.js';
import { resetForm } from '../formularios/formulario-paciente.js';

/**
 * Muestra un modal por su ID
 * @param {string} modalId - ID del modal a mostrar
 */
export function showModal(modalId) {
    try {
        console.log('🔧 Intentando mostrar modal:', modalId);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('❌ Modal no encontrado:', modalId);
            return false;
        }

        // Cerrar otros modales abiertos primero
        closeAllModals();

        // Mostrar modal
        modal.style.display = 'flex';
        modal.classList.add('modal-open');
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        
        // Enfocar primer input después de animación
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
            if (firstInput) {
                firstInput.focus();
            }
        }, 150);
        
        console.log('✅ Modal mostrado:', modalId);
        return true;
        
    } catch (error) {
        console.error('❌ Error mostrando modal:', error);
        return false;
    }
}

/**
 * Cierra un modal por su ID
 * @param {string} modalId - ID del modal a cerrar
 */
export function closeModal(modalId) {
    try {
        console.log('🔧 Intentando cerrar modal:', modalId);
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('⚠️ Modal no encontrado para cerrar:', modalId);
            return false;
        }

        // Verificar cambios no guardados en formularios específicos
        if (modalId === 'patient-modal') {
            const hasChanges = checkUnsavedChanges();
            if (hasChanges) {
                const confirmed = confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.');
                if (!confirmed) {
                    return false;
                }
                resetForm();
            }
        }
        
        // Ocultar modal
        modal.style.display = 'none';
        modal.classList.remove('modal-open');
        
        // Restaurar scroll del body
        document.body.style.overflow = 'auto';
        
        // Remover modales temporales
        if (modal.classList.contains('temp-modal')) {
            modal.remove();
        }
        
        console.log('✅ Modal cerrado:', modalId);
        return true;
        
    } catch (error) {
        console.error('❌ Error cerrando modal:', error);
        return false;
    }
}

/**
 * Cierra todos los modales abiertos
 */
export function closeAllModals() {
    try {
        const openModals = document.querySelectorAll('.modal-overlay[style*="flex"], .modal-overlay.modal-open');
        
        openModals.forEach(modal => {
            if (modal.id) {
                closeModal(modal.id);
            } else {
                modal.style.display = 'none';
                modal.classList.remove('modal-open');
            }
        });
        
        document.body.style.overflow = 'auto';
        
    } catch (error) {
        console.error('Error cerrando todos los modales:', error);
    }
}

/**
 * Verifica si hay cambios sin guardar
 */
function checkUnsavedChanges() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return false;
        
        const formData = new FormData(form);
        let hasData = false;
        
        for (let [key, value] of formData.entries()) {
            if (value && value.toString().trim() !== '') {
                hasData = true;
                break;
            }
        }
        
        return hasData;
    } catch (error) {
        console.error('Error checking unsaved changes:', error);
        return false;
    }
}

/**
 * Alterna el estado de un botón de envío
 * @param {HTMLElement} button - Botón a alternar
 * @param {boolean} isLoading - Estado de carga
 */
export function toggleSubmitButton(button, isLoading) {
    if (!button) return;
    
    try {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
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
 */
export function createModal(id, title, content, options = {}) {
    try {
        // Remover modal existente
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
                
                <div class="modal-header">
                    <h2>${title}</h2>
                </div>
                
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos
        setupModalEvents(modal);
        
        return modal;
        
    } catch (error) {
        console.error('Error creando modal:', error);
        return null;
    }
}

/**
 * Configura eventos del modal
 * @param {HTMLElement} modal - Elemento del modal
 */
function setupModalEvents(modal) {
    try {
        // Click fuera del modal para cerrar
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
        
        // Botón de cerrar
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal(modal.id);
            });
        }
        
    } catch (error) {
        console.error('Error configurando eventos del modal:', error);
    }
}

/**
 * Muestra un modal de confirmación
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje de confirmación
 * @param {Function} onConfirm - Callback para confirmación
 * @param {Function} onCancel - Callback para cancelación
 */
export function showConfirmationModal(title, message, onConfirm, onCancel = null) {
    try {
        const modalId = 'confirmation-modal-' + Date.now();
        const content = `
            <div class="confirmation-content">
                <div class="confirmation-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <p class="confirmation-message">${message}</p>
                <div class="confirmation-actions">
                    <button class="btn btn-outline" data-action="cancel">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="btn btn-primary" data-action="confirm">
                        <i class="fas fa-check"></i>
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal(modalId, title, content);
        if (!modal) return;
        
        // Configurar callbacks
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        const confirmBtn = modal.querySelector('[data-action="confirm"]');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                closeModal(modalId);
                if (onCancel) onCancel();
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                closeModal(modalId);
                if (onConfirm) onConfirm();
            });
        }
        
        showModal(modalId);
        
    } catch (error) {
        console.error('Error mostrando modal de confirmación:', error);
    }
}

/**
 * Configura los event listeners globales para modales
 */
export function setupModalEventListeners() {
    try {
        // Prevenir múltiples configuraciones
        if (window.modalEventListenersSetup) {
            return;
        }
        
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
                const openModals = document.querySelectorAll('.modal-overlay[style*="flex"], .modal-overlay.modal-open');
                if (openModals.length > 0) {
                    const lastModal = openModals[openModals.length - 1];
                    if (lastModal.id) {
                        closeModal(lastModal.id);
                    }
                }
            }
        });
        
        // Event listeners para botones de cerrar modales existentes
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal && modal.id) {
                    closeModal(modal.id);
                }
            });
        });
        
        window.modalEventListenersSetup = true;
        console.log('✅ Event listeners de modales configurados');
        
    } catch (error) {
        console.error('Error configurando event listeners de modales:', error);
    }
}

/**
 * Muestra loading en un modal específico
 * @param {string} modalId - ID del modal
 * @param {boolean} show - Mostrar o ocultar loading
 */
export function showModalLoading(modalId, show) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        let loadingOverlay = modal.querySelector('.modal-loading-overlay');
        
        if (show) {
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'modal-loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Cargando...</p>
                    </div>
                `;
                modal.appendChild(loadingOverlay);
            }
            loadingOverlay.style.display = 'flex';
        } else {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error mostrando loading en modal:', error);
    }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.showModal = showModal;
    window.closeModal = closeModal;
    window.showConfirmationModal = showConfirmationModal;
}
