// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0 - SIN IMPORT/EXPORT

// Variables globales para control de inicialización
var initializationCompleted = false;
var initializationTimer = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async function() {
    console.log('\n🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    console.log('📅 Fecha:', new Date().toLocaleString('es-CL'));
    console.log('🔄 Iniciando sistema SENDA completo...\n');

    initializationTimer = setTimeout(function() {
        if (!initializationCompleted) {
            console.error('❌ TIMEOUT: La inicialización está tomando demasiado tiempo');
            showInitializationError();
        }
    }, 15000);

    try {
        // Paso 1: Inicializar Firebase PRIMERO
        console.log('🔧 Paso 1: Inicializando Firebase...');
        var firebaseInitialized = window.initializeFirebase();

        if (!firebaseInitialized) {
            throw new Error('Firebase no se pudo inicializar');
        }

        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');

        // Paso 2: Configurar autenticación
        console.log('🔧 Paso 2: Configurando autenticación...');
        window.setupAuth();
        console.log('✅ Autenticación configurada\n');

        // Paso 3: Configurar navegación
        console.log('🔧 Paso 3: Configurando navegación...');
        window.setupTabs();
        console.log('✅ Navegación configurada\n');

        // Paso 4: Configurar formularios
        console.log('🔧 Paso 4: Configurando formularios...');
        window.setupFormularios();
        console.log('✅ Formularios configurados\n');

        // Paso 5: Configurar eventos globales
        console.log('🔧 Paso 5: Configurando eventos globales...');
        window.setupEventListeners();
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

        setTimeout(function() {
            window.showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
        }, 1000);

    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        showInitializationError(error);
        attemptBasicRecovery();
    }
});

async function waitForFirebaseInitialization(maxRetries) {
    maxRetries = maxRetries || 10;
    for (var i = 0; i < maxRetries; i++) {
        if (window.isFirebaseInitialized && window.isFirebaseInitialized()) {
            return true;
        }
        console.log('⏳ Esperando Firebase... (' + (i + 1) + '/' + maxRetries + ')');
        await new Promise(function(resolve) { setTimeout(resolve, 500); });
    }
    throw new Error('Firebase no se inicializó en el tiempo esperado');
}

async function initializeSystemModules() {
    var modules = [
        {
            name: 'Calendario',
            init: async function() {
                try {
                    console.log('  📅 Inicializando calendario...');
                    window.initCalendar && window.initCalendar();
                    console.log('  ✅ Calendario inicializado');

                    console.log('  📋 Inicializando citas próximas...');
                    window.initUpcomingAppointments && window.initUpcomingAppointments();
                    console.log('  ✅ Citas próximas inicializadas');

                    console.log('  ⏰ Inicializando gestión de horarios...');
                    window.initScheduleManager && window.initScheduleManager();
                    console.log('  ✅ Horarios inicializados');
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo calendario:', error);
                    throw error;
                }
            }
        },
        {
            name: 'Pacientes',
            init: async function() {
                try {
                    console.log('  👥 Inicializando gestor de pacientes...');
                    window.initPatientsManager && window.initPatientsManager();
                    console.log('  ✅ Gestor de pacientes inicializado');

                    console.log('  🔍 Inicializando búsqueda de pacientes...');
                    window.initPatientSearch && window.initPatientSearch();
                    console.log('  ✅ Búsqueda de pacientes inicializada');

                    console.log('  📋 Inicializando fichas de pacientes...');
                    window.initPatientRecord && window.initPatientRecord();
                    console.log('  ✅ Fichas de pacientes inicializadas');
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo pacientes:', error);
                    throw error;
                }
            }
        },
        {
            name: 'Seguimiento',
            init: async function() {
                try {
                    console.log('  📊 Inicializando timeline...');
                    window.initTimeline && window.initTimeline();
                    console.log('  ✅ Timeline inicializado');

                    console.log('  🩺 Inicializando registro de atenciones...');
                    window.initAttentions && window.initAttentions();
                    console.log('  ✅ Atenciones inicializadas');

                    if (window.initUpcomingAppointmentsFromSeguimiento && typeof window.initUpcomingAppointmentsFromSeguimiento === 'function') {
                        window.initUpcomingAppointmentsFromSeguimiento();
                        console.log('  ✅ Citas próximas (seguimiento) inicializadas');
                    }
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo seguimiento:', error);
                    throw error;
                }
            }
        }
    ];

    for (var mi = 0; mi < modules.length; mi++) {
        var module = modules[mi];
        try {
            console.log('🔧 Inicializando módulo: ' + module.name);
            await module.init();
            console.log('✅ Módulo ' + module.name + ' inicializado correctamente\n');
        } catch (error) {
            console.warn('⚠️ Error inicializando módulo ' + module.name + ':', error);
            continue;
        }
    }
}

function setupGlobalFunctions() {
    console.log('🔧 Configurando funciones globales...');
    try {
        window.closeModal = window.closeModal || function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        };
        window.showModal = window.showModal || function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'flex';
        };

        window.switchLoginTab = function(tab) {
            try {
                var loginTab = document.querySelector('.modal-tab[onclick*="login"]');
                var registerTab = document.querySelector('.modal-tab[onclick*="register"]');
                var loginForm = document.getElementById('login-form');
                var registerForm = document.getElementById('register-form');
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
            getSystemInfo: function() {
                return {
                    version: '2.0',
                    initialized: initializationCompleted,
                    firebase: window.isFirebaseInitialized && window.isFirebaseInitialized(),
                    timestamp: new Date().toISOString()
                };
            },
            reinitialize: function() {
                console.log('🔄 Reinicializando sistema...');
                window.location.reload();
            },
            clearStorage: function() {
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

function showInitializationError(error) {
    var errorMessage = error ? error.message : 'Timeout de inicialización';
    var errorModal = document.getElementById('initialization-error-modal');
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

function attemptBasicRecovery() {
    console.log('🔄 Intentando recuperación básica...');
    try {
        window.closeModal = function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        };

        window.showModal = function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'flex';
        };

        document.addEventListener('click', function(e) {
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
console.log('   Navegador:', navigator.userAgent);
console.log('   Idioma:', navigator.language);
console.log('   Conexión:', navigator.onLine ? 'Online' : 'Offline');
console.log('   Local Storage:', typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible');
console.log('   Service Worker:', 'serviceWorker' in navigator ? 'Disponible' : 'No disponible');

window.addEventListener('online', function() {
    console.log('🌐 Conexión restaurada');
    window.showNotification && window.showNotification('Conexión a Internet restaurada', 'success');
});
window.addEventListener('offline', function() {
    console.log('📴 Conexión perdida');
    window.showNotification && window.showNotification('Sin conexión a Internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
});
window.addEventListener('error', function(event) {
    console.error('❌ Error no capturado:', event.error);
    if (event.error && event.error.message && 
        (event.error.message.includes('Firebase') || 
         event.error.message.includes('network') ||
         event.error.message.includes('auth'))) {
        window.showNotification && window.showNotification('Error del sistema detectado. Si persiste, recarga la página.', 'error');
    }
});
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada no capturada:', event.reason);
    event.preventDefault();
    if (event.reason && typeof event.reason === 'object' && event.reason.code) {
        console.warn('Código de error: ' + event.reason.code);
    }
});

if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    console.log('🔄 Página recargada por el usuario');
} else {
    console.log('🆕 Primera carga de la página');
}

console.log('\n📝 Sistema SENDA listo para inicialización...\n');
