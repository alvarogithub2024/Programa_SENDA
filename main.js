var initializationCompleted = false;
var initializationTimer = null;

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
        console.log('🔧 Paso 1: Inicializando Firebase...');
        var firebaseInitialized = window.initializeFirebase && window.initializeFirebase();
        if (!firebaseInitialized) {
            throw new Error('Firebase no se pudo inicializar');
        }
        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');
        console.log('🔧 Paso 2: Inicializando sistema de permisos...');
        if (window.inicializarSistemaPermisos) {
            window.inicializarSistemaPermisos();
        }
        console.log('✅ Sistema de permisos configurado\n');
        console.log('🔧 Paso 3: Configurando navegación...');
        window.setupTabs && window.setupTabs();
        console.log('✅ Navegación configurada\n');
        console.log('🔧 Paso 4: Configurando eventos globales...');
        window.setupEventListeners && window.setupEventListeners();
        console.log('✅ Eventos configurados\n');
        console.log('🔧 Paso 5: Inicializando módulos del sistema...');
        await initializeSystemModules();

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
        
        window.abrirModalEditarAtencionSeguro = function(atencionId, descripcion, tipo, rutPaciente) {
            if (window.puedeEditarHistorial && window.puedeEditarHistorial()) {
                if (window.abrirModalEditarAtencion) {
                    window.abrirModalEditarAtencion(atencionId, descripcion, tipo, rutPaciente);
                }
            } else {
                window.mostrarMensajePermisos && window.mostrarMensajePermisos('editar atenciones del historial clínico');
            }
        };

        window.eliminarAtencionSeguro = function(atencionId, rutPaciente) {
            if (window.puedeEliminarHistorial && window.puedeEliminarHistorial()) {
                if (window.eliminarAtencionDesdeModal) {
                    window.eliminarAtencionDesdeModal(atencionId, rutPaciente);
                }
            } else {
                window.mostrarMensajePermisos && window.mostrarMensajePermisos('eliminar atenciones del historial clínico');
            }
        };

        window.crearAtencionSeguro = function(rutPaciente) {
            if (window.puedeCrearAtenciones && window.puedeCrearAtenciones()) {
                if (window.mostrarFormularioNuevaAtencion) {
                    window.mostrarFormularioNuevaAtencion(rutPaciente);
                }
            } else {
                window.mostrarMensajePermisos && window.mostrarMensajePermisos('crear nuevas atenciones');
            }
        };

        window.SENDA_DEBUG = {
            getSystemInfo: function() {
                return {
                    version: '2.0',
                    initialized: initializationCompleted,
                    firebase: window.isFirebaseInitialized && window.isFirebaseInitialized(),
                    permisos: window.rolActual ? window.rolActual() : null,
                    timestamp: new Date().toISOString()
                };
            },
            reinitialize: function() {
                window.location.reload();
            },
            clearStorage: function() {
                localStorage.clear();
                sessionStorage.clear();
            },
            testPermisos: function() {
                console.log('🔐 Estado de permisos:');
                console.log('- Rol actual:', window.rolActual ? window.rolActual() : 'Sin rol');
                console.log('- Puede editar historial:', window.puedeEditarHistorial ? window.puedeEditarHistorial() : false);
                console.log('- Puede eliminar historial:', window.puedeEliminarHistorial ? window.puedeEliminarHistorial() : false);
                console.log('- Puede crear atenciones:', window.puedeCrearAtenciones ? window.puedeCrearAtenciones() : false);
                console.log('- Puede gestionar solicitudes:', window.puedeGestionarSolicitudes ? window.puedeGestionarSolicitudes() : false);
            }
        };
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
