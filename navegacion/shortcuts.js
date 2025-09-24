/**
 * NAVEGACION/SHORTCUTS.JS
 * Atajos de teclado para la aplicación
 */

import { showModal, closeModal } from '../utilidades/modales.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { getCurrentUserData } from '../autenticacion/sesion.js';

const shortcuts = new Map();

/**
 * Configura todos los atajos de teclado
 */
export function setupKeyboardShortcuts() {
    try {
        registerShortcuts();
        setupGlobalKeyListener();
        
        console.log('✅ Atajos de teclado configurados');
        
        // Mostrar ayuda de atajos si está en debug mode
        if (window.location.search.includes('debug=shortcuts')) {
            showShortcutsHelp();
        }
        
    } catch (error) {
        console.error('Error setting up keyboard shortcuts:', error);
    }
}

/**
 * Registra todos los atajos de teclado
 */
function registerShortcuts() {
    // Atajos globales
    shortcuts.set('Escape', {
        description: 'Cerrar modal activo',
        handler: closeActiveModal,
        context: 'global'
    });
    
    shortcuts.set('F1', {
        description: 'Mostrar ayuda de atajos',
        handler: showShortcutsHelp,
        context: 'global'
    });
    
    // Atajos para contenido público
    shortcuts.set('ctrl+k', {
        description: 'Abrir login de profesionales',
        handler: () => showModal('login-modal'),
        context: 'public'
    });
    
    shortcuts.set('ctrl+h', {
        description: 'Solicitar ayuda',
        handler: () => showModal('patient-modal'),
        context: 'public'
    });
    
    shortcuts.set('ctrl+r', {
        description: 'Solicitar reingreso',
        handler: () => showModal('reentry-modal'),
        context: 'public'
    });
    
    shortcuts.set('ctrl+i', {
        description: 'Información del programa',
        handler: showAboutProgram,
        context: 'public'
    });
    
    // Atajos para contenido profesional
    shortcuts.set('ctrl+1', {
        description: 'Ir a Agenda',
        handler: () => switchToTab('agenda'),
        context: 'professional'
    });
    
    shortcuts.set('ctrl+2', {
        description: 'Ir a Solicitudes',
        handler: () => switchToTab('solicitudes'),
        context: 'professional'
    });
    
    shortcuts.set('ctrl+3', {
        description: 'Ir a Pacientes',
        handler: () => switchToTab('pacientes'),
        context: 'professional'
    });
    
    shortcuts.set('ctrl+4', {
        description: 'Ir a Seguimiento',
        handler: () => switchToTab('seguimiento'),
        context: 'professional'
    });
    
    shortcuts.set('ctrl+n', {
        description: 'Nueva cita',
        handler: createNewAppointment,
        context: 'professional'
    });
    
    shortcuts.set('ctrl+f', {
        description: 'Buscar paciente',
        handler: focusPatientSearch,
        context: 'professional'
    });
    
    shortcuts.set('ctrl+l', {
        description: 'Cerrar sesión',
        handler: confirmLogout,
        context: 'professional'
    });
}

/**
 * Configura el listener global de teclado
 */
function setupGlobalKeyListener() {
    document.addEventListener('keydown', (e) => {
        try {
            const key = getKeyString(e);
            const shortcut = shortcuts.get(key);
            
            if (shortcut && canExecuteShortcut(shortcut, e)) {
                e.preventDefault();
                e.stopPropagation();
                
                shortcut.handler();
                
                if (window.location.search.includes('debug=shortcuts')) {
                    console.log(`🔧 Atajo ejecutado: ${key}`);
                }
            }
        } catch (error) {
            console.error('Error handling keyboard shortcut:', error);
        }
    });
}

/**
 * Convierte el evento de teclado a string
 * @param {KeyboardEvent} e - Evento de teclado
 * @returns {string} String del atajo
 */
function getKeyString(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    parts.push(e.key);
    
    return parts.join('+').toLowerCase();
}

/**
 * Verifica si se puede ejecutar un atajo
 * @param {Object} shortcut - Configuración del atajo
 * @param {KeyboardEvent} e - Evento de teclado
 * @returns {boolean} True si se puede ejecutar
 */
function canExecuteShortcut(shortcut, e) {
    // No ejecutar si estamos escribiendo en un input
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    ) && e.key !== 'Escape' && e.key !== 'F1') {
        return false;
    }
    
    // Verificar contexto
    if (shortcut.context === 'public') {
        const publicContent = document.getElementById('public-content');
        return publicContent && publicContent.style.display !== 'none';
    }
    
    if (shortcut.context === 'professional') {
        const professionalContent = document.getElementById('professional-content');
        const currentUserData = getCurrentUserData();
        return professionalContent && 
               professionalContent.style.display !== 'none' && 
               currentUserData;
    }
    
    return true; // global shortcuts
}

/**
 * Cierra el modal activo
 */
function closeActiveModal() {
    const openModal = document.querySelector('.modal-overlay[style*="flex"]');
    if (openModal && openModal.id) {
        closeModal(openModal.id);
    }
}

/**
 * Cambia a una pestaña específica
 * @param {string} tabName - Nombre de la pestaña
 */
function switchToTab(tabName) {
    try {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const currentUserData = getCurrentUserData();
        
        if (!tabBtn || !currentUserData) {
            return;
        }
        
        // Verificar permisos
        if (tabName === 'solicitudes' && currentUserData.profession !== 'asistente_social') {
            showNotification('No tienes permisos para acceder a Solicitudes', 'warning');
            return;
        }
        
        if (tabBtn.style.display === 'none') {
            showNotification('Tab no disponible para tu perfil', 'warning');
            return;
        }
        
        tabBtn.click();
        
    } catch (error) {
        console.error('Error switching to tab:', error);
    }
}

/**
 * Crea una nueva cita
 */
function createNewAppointment() {
    try {
        const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        
        if (currentTab !== 'agenda') {
            switchToTab('agenda');
            setTimeout(() => {
                const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
                if (nuevaCitaBtn) {
                    nuevaCitaBtn.click();
                }
            }, 300);
        } else {
            const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
            if (nuevaCitaBtn) {
                nuevaCitaBtn.click();
            }
        }
    } catch (error) {
        console.error('Error creating new appointment:', error);
    }
}

/**
 * Enfoca el campo de búsqueda de pacientes
 */
function focusPatientSearch() {
    try {
        const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        
        if (currentTab !== 'pacientes') {
            switchToTab('pacientes');
            setTimeout(() => {
                const searchInput = document.getElementById('search-pacientes-rut');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 300);
        } else {
            const searchInput = document.getElementById('search-pacientes-rut');
            if (searchInput) {
                searchInput.focus();
            }
        }
    } catch (error) {
        console.error('Error focusing patient search:', error);
    }
}

/**
 * Confirma el cierre de sesión
 */
function confirmLogout() {
    try {
        const confirmed = confirm('¿Estás seguro de que quieres cerrar sesión?');
        if (confirmed) {
            import('../autenticacion/sesion.js').then(module => {
                module.handleLogout();
            });
        }
    } catch (error) {
        console.error('Error confirming logout:', error);
    }
}

/**
 * Muestra información del programa
 */
function showAboutProgram() {
    try {
        import('../navegacion/eventos.js').then(module => {
            // Esta función sería importada desde eventos.js
            console.log('Showing about program via shortcut');
        });
    } catch (error) {
        console.error('Error showing about program:', error);
    }
}

/**
 * Muestra la ayuda de atajos de teclado
 */
function showShortcutsHelp() {
    try {
        const currentUserData = getCurrentUserData();
        const isPublic = !currentUserData;
        
        const helpContent = generateShortcutsHelpContent(isPublic);
        
        const helpModal = `
            <div class="modal-overlay temp-modal" id="shortcuts-help-modal">
                <div class="modal large-modal">
                    <button class="modal-close" onclick="closeModal('shortcuts-help-modal')">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div style="padding: 24px;">
                        <h2><i class="fas fa-keyboard"></i> Atajos de Teclado</h2>
                        <div class="shortcuts-help-content">
                            ${helpContent}
                        </div>
                        
                        <div style="text-align: center; margin-top: 24px;">
                            <button class="btn btn-primary" onclick="closeModal('shortcuts-help-modal')">
                                <i class="fas fa-check"></i>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpModal);
        showModal('shortcuts-help-modal');
        
    } catch (error) {
        console.error('Error showing shortcuts help:', error);
    }
}

/**
 * Genera el contenido de ayuda de atajos
 * @param {boolean} isPublic - Si es vista pública
 * @returns {string} HTML del contenido
 */
function generateShortcutsHelpContent(isPublic) {
    const globalShortcuts = Array.from(shortcuts.entries())
        .filter(([key, shortcut]) => shortcut.context === 'global');
    
    const contextShortcuts = Array.from(shortcuts.entries())
        .filter(([key, shortcut]) => shortcut.context === (isPublic ? 'public' : 'professional'));
    
    const formatShortcut = (key) => {
        return key.split('+').map(part => {
            const keyMap = {
                'ctrl': '⌃ Ctrl',
                'shift': '⇧ Shift',
                'alt': '⌥ Alt',
                'escape': 'Esc',
                'f1': 'F1'
            };
            return keyMap[part.toLowerCase()] || part.toUpperCase();
        }).join(' + ');
    };
    
    let content = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">';
    
    // Atajos globales
    content += '<div>';
    content += '<h3 style="color: var(--primary-blue); margin-bottom: 16px;">Globales</h3>';
    content += '<div style="display: flex; flex-direction: column; gap: 8px;">';
    globalShortcuts.forEach(([key, shortcut]) => {
        content += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--light-blue); border-radius: 6px;">
                <span style="font-weight: 500;">${shortcut.description}</span>
                <kbd style="background: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: 1px solid var(--border-color);">
                    ${formatShortcut(key)}
                </kbd>
            </div>
        `;
    });
    content += '</div></div>';
    
    // Atajos de contexto
    content += '<div>';
    content += `<h3 style="color: var(--primary-blue); margin-bottom: 16px;">${isPublic ? 'Página Pública' : 'Panel Profesional'}</h3>`;
    content += '<div style="display: flex; flex-direction: column; gap: 8px;">';
    contextShortcuts.forEach(([key, shortcut]) => {
        content += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--light-blue); border-radius: 6px;">
                <span style="font-weight: 500;">${shortcut.description}</span>
                <kbd style="background: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: 1px solid var(--border-color);">
                    ${formatShortcut(key)}
                </kbd>
            </div>
        `;
    });
    content += '</div></div>';
    
    content += '</div>';
    
    return content;
}

/**
 * Registra un atajo personalizado
 * @param {string} key - Combinación de teclas
 * @param {Function} handler - Función a ejecutar
 * @param {string} description - Descripción del atajo
 * @param {string} context - Contexto del atajo
 */
export function registerShortcut(key, handler, description, context = 'global') {
    shortcuts.set(key.toLowerCase(), {
        handler,
        description,
        context
    });
}

/**
 * Desregistra un atajo
 * @param {string} key - Combinación de teclas
 */
export function unregisterShortcut(key) {
    shortcuts.delete(key.toLowerCase());
}
