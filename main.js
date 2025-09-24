// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0 - VERSIÓN COMPLETAMENTE CORREGIDA
import { initializeFirebase, isFirebaseInitialized } from './configuracion/firebase.js';
import { setupAuth } from './autenticacion/sesion.js';
import { setupTabs } from './navegacion/tabs.js';
import { setupFormularios } from './formularios/formulario-paciente.js';
import { setupEventListeners } from './navegacion/eventos.js';
import { showNotification } from './utilidades/notificaciones.js';
import { closeModal, showModal, setupModalEventListeners } from './utilidades/modales.js';

// Variables globales para control de inicialización
let initializationCompleted = false;
let initializationTimer = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log(`👤 Desarrollado por: CamiMoralesM`);
    console.log('🔄 Iniciando sistema SENDA completo...\n');
    
    // Timeout de seguridad
    initializationTimer = setTimeout(() => {
        if (!initializationCompleted) {
            console.error('❌ TIMEOUT: La inicialización está tomando demasiado tiempo');
            showInitializationError('Timeout de inicialización');
        }
    }, 20000);

    try {
        // Paso 1: Verificar dependencias
        if (!verifyDependencies()) {
            throw new Error('Dependencias no disponibles');
        }

        // Paso 2: Inicializar Firebase
        console.log('🔧 Paso 1: Inicializando Firebase...');
        const firebaseInitialized = initializeFirebase();
        
        if (!firebaseInitialized) {
            throw new Error('Firebase no se pudo inicializar');
        }
        
        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');
        
        // Paso 3: Configurar componentes básicos
        console.log('🔧 Paso 2: Configurando componentes básicos...');
        setupBasicComponents();
        console.log('✅ Componentes básicos configurados\n');
        
        // Paso 4: Configurar autenticación
        console.log('🔧 Paso 3: Configurando autenticación...');
        setupAuth();
        console.log('✅ Autenticación configurada\n');
        
        // Paso 5: Configurar navegación
        console.log('🔧 Paso 4: Configurando navegación...');
        setupTabs();
        console.log('✅ Navegación configurada\n');
        
        // Paso 6: Configurar formularios
        console.log('🔧 Paso 5: Configurando formularios...');
        setupFormularios();
        console.log('✅ Formularios configurados\n');
        
        // Paso 7: Configurar eventos globales
        console.log('🔧 Paso 6: Configurando eventos globales...');
        setupEventListeners();
        console.log('✅ Eventos configurados\n');
        
        // Paso 8: Inicializar módulos avanzados de forma lazy
        console.log('🔧 Paso 7: Preparando módulos avanzados...');
        setupLazyModules();
        
        // Paso 9: Configurar funciones globales
        setupGlobalFunctions();
        
        console.log('\n🎉 ¡SISTEMA SENDA INICIALIZADO CORRECTAMENTE!');
        console.log('=====================================');
        
        initializationCompleted = true;
        clearTimeout(initializationTimer);
        
        // Mostrar notificación de éxito
        setTimeout(() => {
            showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
        }, 1000);
        
    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        
        showInitializationError(error);
        attemptBasicRecovery();
    }
});

/**
 * Verifica que las dependencias estén disponibles
 */
function verifyDependencies() {
    const required = ['firebase', 'localStorage', 'sessionStorage'];
    
    for (const dep of required) {
        if (dep === 'firebase' && typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK no cargado');
            return false;
        }
        if (dep === 'localStorage' && typeof localStorage === 'undefined') {
            console.error('❌ localStorage no disponible');
            return false;
        }
        if (dep === 'sessionStorage' && typeof sessionStorage === 'undefined') {
            console.error('❌ sessionStorage no disponible');
            return false;
        }
    }
    
    return true;
}

/**
 * Configura componentes básicos
 */
function setupBasicComponents() {
    // Configurar modales
    setupModalEventListeners();
    
    // Configurar notificaciones
    if (!document.getElementById('notifications')) {
        const notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications';
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    // Configurar loading overlay
    if (!document.getElementById('loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay hidden';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando...</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }
}

/**
 * Configura módulos de carga lazy
 */
function setupLazyModules() {
    // Configurar carga lazy de módulos pesados
    const lazyModules = {
        calendario: () => import('./calendario/agenda.js'),
        pacientes: () => import('./pacientes/gestor-pacientes.js'),
        solicitudes: () => import('./solicitudes/gestor-solicitudes.js'),
        seguimiento: () => import('./seguimiento/timeline.js')
    };
    
    // Event listener para tabs que activa la carga lazy
    document.addEventListener('tabChanged', async (e) => {
        const tabName = e.detail?.tabName;
        if (tabName && lazyModules[tabName]) {
            try {
                console.log(`📦 Cargando módulo: ${tabName}`);
                const module = await lazyModules[tabName]();
                
                // Inicializar el módulo si tiene función init
                if (module.init && typeof module.init === 'function') {
                    module.init();
                }
                
                console.log(`✅ Módulo ${tabName} cargado`);
            } catch (error) {
                console.error(`❌ Error cargando módulo ${tabName}:`, error);
                showNotification(`Error cargando ${tabName}`, 'warning');
            }
        }
    });
}

/**
 * Espera a que Firebase se inicialice
 */
async function waitForFirebaseInitialization(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        if (isFirebaseInitialized()) {
            return true;
        }
        
        console.log(`⏳ Esperando Firebase... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Firebase no se inicializó en el tiempo esperado');
}

/**
 * Configura las funciones globales necesarias
 */
function setupGlobalFunctions() {
    console.log('🔧 Configurando funciones globales...');
    
    try {
        // Exportar funciones de modales globalmente
        window.closeModal = closeModal;
        window.showModal = showModal;
        
        // Función para cambiar entre tabs de login/registro
        window.switchLoginTab = function(tab) {
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
        };

        // Función de utilidad para debugging
        window.SENDA_DEBUG = {
            getSystemInfo: () => ({
                version: '2.0',
                initialized: initializationCompleted,
                firebase: isFirebaseInitialized(),
                timestamp: new Date().toISOString()
            }),
            reinitialize: () => {
                console.log('🔄 Reinicializando sistema...');
                window.location.reload();
            },
            clearStorage: () => {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🗑️ Storage limpiado');
            }
        };

        console.log('✅ Funciones globales configuradas');
        
    } catch (error) {
        console.error('❌ Error configurando funciones globales:', error);
    }
}

/**
 * Muestra error de inicialización al usuario
 */
function showInitializationError(error = null) {
    const errorMessage = error ? error.message : 'Error de inicialización';
    
    // Crear modal de error si no existe
    let errorModal = document.getElementById('initialization-error-modal');
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'initialization-error-modal';
        errorModal.className = 'modal-overlay';
        errorModal.style.display = 'flex';
        errorModal.style.zIndex = '99999';
        
        errorModal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div style="text-align: center; padding: 24px;">
                    <div style="color: #ef4444; font-size: 3rem; margin-bottom: 16px;">
                        ⚠️
                    </div>
                    <h2 style="color: #ef4444; margin-bottom: 16px;">
                        Error de Inicialización
                    </h2>
                    <p style="margin-bottom: 24px; color: #6b7280;">
                        ${errorMessage}
                    </p>
                    <div style="margin-bottom: 24px; padding: 16px; background: #fee2e2; border-radius: 8px;">
                        <h4 style="margin-bottom: 8px;">Posibles soluciones:</h4>
                        <ul style="text-align: left; color: #7f1d1d;">
                            <li>Verifica tu conexión a Internet</li>
                            <li>Recarga la página (F5)</li>
                            <li>Limpia el caché del navegador</li>
                            <li>Contacta al administrador si persiste</li>
                        </ul>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="window.location.reload()" 
                                style="background: #ef4444; color: white; border: none; 
                                       padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🔄 Recargar Página
                        </button>
                        <button onclick="window.SENDA_DEBUG?.clearStorage(); window.location.reload()" 
                                style="background: #6b7280; color: white; border: none; 
                                       padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🗑️ Limpiar y Recargar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorModal);
    } else {
        errorModal.style.display = 'flex';
    }
}

/**
 * Intenta una recuperación básica del sistema
 */
function attemptBasicRecovery() {
    console.log('🔄 Intentando recuperación básica...');
    
    try {
        // Configurar funciones mínimas
        window.closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        };
        
        window.showModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'flex';
        };
        
        // Configurar eventos básicos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });
        
        console.log('✅ Recuperación básica completada');
        
    } catch (recoveryError) {
        console.error('❌ Error en recuperación básica:', recoveryError);
    }
}

// Event listeners adicionales para manejo de errores
window.addEventListener('error', (event) => {
    console.error('❌ Error no capturado:', event.error);
    
    if (event.error && event.error.message && 
        (event.error.message.includes('Firebase') || 
         event.error.message.includes('network') ||
         event.error.message.includes('auth'))) {
        showNotification('Error del sistema detectado. Si persiste, recarga la página.', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promesa rechazada no capturada:', event.reason);
    event.preventDefault();
    
    if (event.reason && typeof event.reason === 'object' && event.reason.code) {
        console.warn(`Código de error: ${event.reason.code}`);
    }
});

// Detectar conexión
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    showNotification('Conexión a Internet restaurada', 'success');
});

window.addEventListener('offline', () => {
    console.log('📴 Conexión perdida');
    showNotification('Sin conexión a Internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
});

console.log('\n📝 Sistema SENDA listo para inicialización...\n');
