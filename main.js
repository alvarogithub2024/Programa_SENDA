// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0 - VERSIÓN CORREGIDA
// Importar todos los módulos
import { initializeFirebase, isFirebaseInitialized } from './configuracion/firebase.js';
import { setupAuth } from './autenticacion/sesion.js';
import { setupTabs } from './navegacion/tabs.js';
import { setupFormularios } from './formularios/formulario-paciente.js';
import { setupEventListeners } from './navegacion/eventos.js';

// Calendario
import { initCalendar } from './calendario/agenda.js';
import { initUpcomingAppointments } from './calendario/citas.js';
import { initScheduleManager } from './calendario/horarios.js';

// Pacientes
import { initPatientsManager } from './pacientes/gestor-pacientes.js';
import { initPatientSearch } from './pacientes/busqueda.js';
import { initPatientRecord } from './pacientes/fichas.js';

// Seguimiento
import { initTimeline } from './seguimiento/timeline.js';
import { initAttentions } from './seguimiento/atenciones.js';
import { initUpcomingAppointments as initUpcomingAppointmentsFromSeguimiento } from './seguimiento/citas-proximas.js';

// Solicitudes
import { initSolicitudesManager } from './solicitudes/gestor-solicitudes.js';

// Utilidades
import { closeModal, showModal } from './utilidades/modales.js';
import { showNotification } from './utilidades/notificaciones.js';

// Variables globales para control de inicialización
let initializationCompleted = false;
let initializationTimer = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log('🔄 Iniciando sistema SENDA completo...\n');
    
    // Timeout de seguridad mejorado
    initializationTimer = setTimeout(() => {
        if (!initializationCompleted) {
            console.error('❌ TIMEOUT: La inicialización está tomando demasiado tiempo');
            showInitializationError();
        }
    }, 15000); // 15 segundos para dar más margen

    try {
        // Paso 1: Inicializar Firebase PRIMERO
        console.log('🔧 Paso 1: Inicializando Firebase...');
        const firebaseInitialized = initializeFirebase();
        
        if (!firebaseInitialized) {
            throw new Error('Firebase no se pudo inicializar');
        }
        
        // Verificar que Firebase se inicializó correctamente
        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');
        
        // Paso 2: Configurar autenticación
        console.log('🔧 Paso 2: Configurando autenticación...');
        setupAuth();
        console.log('✅ Autenticación configurada\n');
        
        // Paso 3: Configurar navegación
        console.log('🔧 Paso 3: Configurando navegación...');
        setupTabs();
        console.log('✅ Navegación configurada\n');
        
        // Paso 4: Configurar formularios
        console.log('🔧 Paso 4: Configurando formularios...');
        setupFormularios();
        console.log('✅ Formularios configurados\n');
        
        // Paso 5: Configurar eventos globales
        console.log('🔧 Paso 5: Configurando eventos globales...');
        setupEventListeners();
        console.log('✅ Eventos configurados\n');
        
        // Paso 6: Inicializar módulos del sistema
        console.log('🔧 Paso 6: Inicializando módulos del sistema...');
        await initializeSystemModules();
        
        // Paso 7: Configurar funciones globales
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
        
        // Mostrar error detallado al usuario
        showInitializationError(error);
        
        // Intentar recuperación básica
        attemptBasicRecovery();
    }
});

/**
 * Espera a que Firebase se inicialice completamente
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
 * Inicializa todos los módulos del sistema
 */
async function initializeSystemModules() {
    const modules = [
        {
            name: 'Calendario',
            init: async () => {
                try {
                    console.log('  📅 Inicializando calendario...');
                    initCalendar();
                    console.log('  ✅ Calendario inicializado');
                    
                    console.log('  📋 Inicializando citas próximas...');
                    initUpcomingAppointments();
                    console.log('  ✅ Citas próximas inicializadas');
                    
                    console.log('  ⏰ Inicializando gestión de horarios...');
                    initScheduleManager();
                    console.log('  ✅ Horarios inicializados');
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo calendario:', error);
                    throw error;
                }
            }
        },
        {
            name: 'Pacientes',
            init: async () => {
                try {
                    console.log('  👥 Inicializando gestor de pacientes...');
                    initPatientsManager();
                    console.log('  ✅ Gestor de pacientes inicializado');
                    
                    console.log('  🔍 Inicializando búsqueda de pacientes...');
                    initPatientSearch();
                    console.log('  ✅ Búsqueda de pacientes inicializada');
                    
                    console.log('  📋 Inicializando fichas de pacientes...');
                    initPatientRecord();
                    console.log('  ✅ Fichas de pacientes inicializadas');
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo pacientes:', error);
                    throw error;
                }
            }
        },
        {
            name: 'Seguimiento',
            init: async () => {
                try {
                    console.log('  📊 Inicializando timeline...');
                    initTimeline();
                    console.log('  ✅ Timeline inicializado');
                    
                    console.log('  🩺 Inicializando registro de atenciones...');
                    initAttentions();
                    console.log('  ✅ Atenciones inicializadas');
                    
                    console.log('  📅 Inicializando citas próximas (seguimiento)...');
                    if (typeof initUpcomingAppointmentsFromSeguimiento === 'function') {
                        initUpcomingAppointmentsFromSeguimiento();
                        console.log('  ✅ Citas próximas (seguimiento) inicializadas');
                    }
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo seguimiento:', error);
                    throw error;
                }
            }
        },
        // --- MÓDULO SOLICITUDES ---
        {
            name: 'Solicitudes',
            init: async () => {
                try {
                    console.log('  📨 Inicializando gestor de solicitudes...');
                    initGestorSolicitudes();
                    console.log('  ✅ Gestor de solicitudes inicializado');
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo solicitudes:', error);
                    throw error;
                }
            }
        }
    ];

    // Inicializar módulos secuencialmente
    for (const module of modules) {
        try {
            console.log(`🔧 Inicializando módulo: ${module.name}`);
            await module.init();
            console.log(`✅ Módulo ${module.name} inicializado correctamente\n`);
        } catch (error) {
            console.warn(`⚠️ Error inicializando módulo ${module.name}:`, error);
            continue;
        }
    }
}

/**
 * Configura las funciones globales necesarias
 */
function setupGlobalFunctions() {
    console.log('🔧 Configurando funciones globales...');
    try {
        window.closeModal = closeModal;
        window.showModal = showModal;
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
    const errorMessage = error ? error.message : 'Timeout de inicialización';
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
        window.closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        };
        window.showModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'flex';
        };
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

// Información del navegador para debugging
console.log('🔍 Información del Sistema:');
console.log(`   Navegador: ${navigator.userAgent}`);
console.log(`   Idioma: ${navigator.language}`);
console.log(`   Conexión: ${navigator.onLine ? 'Online' : 'Offline'}`);
console.log(`   Local Storage: ${typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible'}`);
console.log(`   Service Worker: ${'serviceWorker' in navigator ? 'Disponible' : 'No disponible'}`);

// Event listener para cambios de conectividad
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    showNotification('Conexión a Internet restaurada', 'success');
});
window.addEventListener('offline', () => {
    console.log('📴 Conexión perdida');
    showNotification('Sin conexión a Internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
});
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
if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    console.log('🔄 Página recargada por el usuario');
} else {
    console.log('🆕 Primera carga de la página');
}
console.log('\n📝 Sistema SENDA listo para inicialización...\n');
