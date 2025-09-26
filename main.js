// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0

// Variables de control
var initializationCompleted = false;
var initializationTimer = null;

// Inicialización principal
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
        // Paso 1: Inicializar Firebase
        console.log('🔧 Paso 1: Inicializando Firebase...');
        var firebaseInitialized = window.initializeFirebase && window.initializeFirebase();
        if (!firebaseInitialized) {
            throw new Error('Firebase no se pudo inicializar');
        }
        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');

        // Paso 2: Configurar navegación
        console.log('🔧 Paso 2: Configurando navegación...');
        window.setupTabs && window.setupTabs();
        console.log('✅ Navegación configurada\n');

        // Paso 3: Configurar eventos globales
        console.log('🔧 Paso 3: Configurando eventos globales...');
        window.setupEventListeners && window.setupEventListeners();
        console.log('✅ Eventos configurados\n');

        // Paso 4: Inicializar módulos del sistema
        console.log('🔧 Paso 4: Inicializando módulos del sistema...');
        await initializeSystemModules();

        // Paso 5: Configurar funciones globales
        setupGlobalFunctions();

        console.log('\n🎉 ¡SISTEMA SENDA INICIALIZADO CORRECTAMENTE!');
        console.log('=====================================');

        initializationCompleted = true;
        clearTimeout(initializationTimer);

        setTimeout(function() {
            window.showNotification && window.showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
        }, 1000);

    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        showInitializationError(error);
        attemptBasicRecovery();
    }
});

// Esperar inicialización de Firebase
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

// Inicializar módulos del sistema
async function initializeSystemModules() {
    var modules = [
        {
            name: 'Calendario',
            init: async function() {
                try {
                    window.initCalendar && window.initCalendar();
                    window.initUpcomingAppointments && window.initUpcomingAppointments();
                    window.initScheduleManager && window.initScheduleManager();
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
                    window.initPatientsManager && window.initPatientsManager();
                    window.initPatientSearch && window.initPatientSearch();
                    window.initPatientRecord && window.initPatientRecord();
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
                    window.initTimeline && window.initTimeline();
                    window.initAttentions && window.initAttentions();
                    if (window.initUpcomingAppointmentsFromSeguimiento && typeof window.initUpcomingAppointmentsFromSeguimiento === 'function') {
                        window.initUpcomingAppointmentsFromSeguimiento();
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

// Configurar funciones globales
function setupGlobalFunctions() {
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
                window.location.reload();
            },
            clearStorage: function() {
                localStorage.clear();
                sessionStorage.clear();
            }
        };
    } catch (error) {
        console.error('❌ Error configurando funciones globales:', error);
    }
}

// Modal de error de inicialización
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
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="window.location.reload()" 
                                style="background: #ef4444; color: white; border: none; 
                                       padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🔄 Recargar Página
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

// Intento de recuperación básica
function attemptBasicRecovery() {
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
    } catch (recoveryError) {
        console.error('❌ Error en recuperación básica:', recoveryError);
    }
}

// Event listeners globales
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

console.log('\n📝 Sistema SENDA listo para inicialización...\n');
