/**
 * NAVEGACION/EVENTOS.JS
 * Event listeners globales de la aplicación
 */

import { showModal, closeModal } from '../utilidades/modales.js';
import { handleLogout } from '../autenticacion/sesion.js';
import { setupLoginForm } from '../autenticacion/login.js';
import { setupRegisterForm } from '../autenticacion/registro.js';
import { setupReentryForm } from '../formularios/formulario-reingreso.js';
import { resetForm } from '../utilidades/modales.js';

/**
 * Configura todos los event listeners de la aplicación
 */
export function setupEventListeners() {
    try {
        console.log('🔧 Configurando event listeners globales...');
        
        setupHeaderEventListeners();
        setupModalEventListeners();
        setupFormEventListeners();
        setupKeyboardEventListeners();
        setupGlobalClickHandlers();
        
        console.log('✅ Event listeners globales configurados');
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

/**
 * Configura los event listeners del header
 */
function setupHeaderEventListeners() {
    try {
        const loginProfessionalBtn = document.getElementById('login-professional');
        const logoutBtn = document.getElementById('logout-professional');
        const registerPatientBtn = document.getElementById('register-patient');
        const reentryProgramBtn = document.getElementById('reentry-program');
        const aboutProgramBtn = document.getElementById('about-program');

        if (loginProfessionalBtn) {
            loginProfessionalBtn.addEventListener('click', () => {
                console.log('🔧 Click en botón login detectado');
                switchLoginTab('login'); // Asegurar que esté en tab de login
                showModal('login-modal');
            });
            console.log('✅ Event listener agregado al botón login');
        } else {
            console.warn('⚠️ Botón login-professional no encontrado');
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (registerPatientBtn) {
            registerPatientBtn.addEventListener('click', () => {
                resetForm();
                showModal('patient-modal');
            });
        }

        if (reentryProgramBtn) {
            reentryProgramBtn.addEventListener('click', () => {
                showModal('reentry-modal');
            });
        }

        if (aboutProgramBtn) {
            aboutProgramBtn.addEventListener('click', showAboutProgram);
        }
        
    } catch (error) {
        console.error('Error setting up header event listeners:', error);
    }
}

/**
 * Configura los event listeners específicos de modales
 */
function setupModalEventListeners() {
    try {
        // Event listeners para cerrar modales con clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId) {
                    closeModal(modalId);
                }
            }
        });

        // Event listeners para botones de cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal && modal.id) {
                    closeModal(modal.id);
                }
            });
        });
        
    } catch (error) {
        console.error('Error setting up modal event listeners:', error);
    }
}

/**
 * Configura los event listeners de formularios
 */
function setupFormEventListeners() {
    try {
        setupLoginForm();
        setupRegisterForm();
        setupReentryForm();
        
        // Event listeners para tabs de login
        setupLoginTabSwitching();
        
    } catch (error) {
        console.error('Error setting up form event listeners:', error);
    }
}

/**
 * Configura el cambio entre tabs de login
 */
function setupLoginTabSwitching() {
    try {
        const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
        const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => switchLoginTab('login'));
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => switchLoginTab('register'));
        }
        
    } catch (error) {
        console.error('Error setting up login tab switching:', error);
    }
}

/**
 * Cambia entre tabs de login/registro
 * @param {string} tab - Tab a mostrar ('login' o 'register')
 */
function switchLoginTab(tab) {
    try {
        const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
        const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
            if (registerForm) registerForm.classList.remove('active');
        } else if (tab === 'register') {
            if (registerTab) registerTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (registerForm) registerForm.classList.add('active');
            if (loginForm) loginForm.classList.remove('active');
        }
    } catch (error) {
        console.error('Error switching login tab:', error);
    }
}

/**
 * Configura los atajos de teclado
 */
function setupKeyboardEventListeners() {
    try {
        document.addEventListener('keydown', (e) => {
            // ESC para cerrar modales
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay[style*="flex"]');
                if (openModal && openModal.id) {
                    closeModal(openModal.id);
                }
            }
            
            // Ctrl/Cmd + K para abrir login (solo en página pública)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                const publicContent = document.getElementById('public-content');
                if (publicContent && publicContent.style.display !== 'none') {
                    e.preventDefault();
                    showModal('login-modal');
                }
            }
        });
        
    } catch (error) {
        console.error('Error setting up keyboard event listeners:', error);
    }
}

/**
 * Configura manejadores de clicks globales
 */
function setupGlobalClickHandlers() {
    try {
        // Prevenir comportamiento por defecto en enlaces con href="#"
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="#"]');
            if (link) {
                e.preventDefault();
            }
        });

        // Manejo de botones con data-action
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                handleDataAction(action, actionBtn);
            }
        });
        
    } catch (error) {
        console.error('Error setting up global click handlers:', error);
    }
}

/**
 * Maneja acciones basadas en data-action
 * @param {string} action - Acción a ejecutar
 * @param {HTMLElement} element - Elemento que disparó la acción
 */
function handleDataAction(action, element) {
    try {
        switch (action) {
            case 'close-modal':
                const modal = element.closest('.modal-overlay');
                if (modal && modal.id) {
                    closeModal(modal.id);
                }
                break;
                
            case 'show-login':
                showModal('login-modal');
                break;
                
            case 'show-register':
                switchLoginTab('register');
                showModal('login-modal');
                break;
                
            case 'logout':
                handleLogout();
                break;
                
            default:
                console.warn(`Acción no reconocida: ${action}`);
        }
    } catch (error) {
        console.error('Error handling data action:', error);
    }
}

/**
 * Muestra información sobre el programa
 */
function showAboutProgram() {
    try {
        const aboutModal = createAboutProgramModal();
        document.body.insertAdjacentHTML('beforeend', aboutModal);
        showModal('about-modal');
    } catch (error) {
        console.error('Error showing about program:', error);
    }
}

/**
 * Crea el modal de información del programa
 * @returns {string} HTML del modal
 */
function createAboutProgramModal() {
    return `
        <div class="modal-overlay temp-modal" id="about-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="closeModal('about-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
                    
                    <div style="line-height: 1.6; color: var(--text-dark);">
                        <p><strong>SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)</strong> es el organismo del Gobierno de Chile encargado de elaborar las políticas de prevención del consumo de drogas y alcohol, así como de tratamiento, rehabilitación e integración social de las personas afectadas por estas sustancias.</p>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Nuestros Servicios</h3>
                        <ul style="margin-left: 20px;">
                            <li>Tratamiento ambulatorio básico e intensivo</li>
                            <li>Tratamiento residencial</li>
                            <li>Programas de reinserción social</li>
                            <li>Apoyo familiar y comunitario</li>
                            <li>Prevención en establecimientos educacionales</li>
                            <li>Capacitación a profesionales</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Horarios de Atención</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
                            <li><strong>Sábados y Domingos:</strong> 09:00 - 12:30</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Contacto</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Teléfono:</strong> 1412 (gratuito)</li>
                            <li><strong>Emergencias:</strong> 131</li>
                            <li><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a></li>
                        </ul>
                        
                        <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px;">
                            <p style="margin: 0; font-style: italic; text-align: center;">
                                "Tu recuperación es posible. Estamos aquí para acompañarte en cada paso del camino."
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="closeModal('about-modal')">
                            <i class="fas fa-check"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Exportar funciones para uso global
window.switchLoginTab = switchLoginTab;
