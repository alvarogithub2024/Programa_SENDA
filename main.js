// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0 - VERSIÓN CORREGIDA PARA FIREBASE

let initializationCompleted = false;
let initializationTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log('🔄 Iniciando sistema SENDA completo...\n');
    
    initializationTimer = setTimeout(() => {
        if (!initializationCompleted) {
            console.error('❌ TIMEOUT: La inicialización está tomando demasiado tiempo');
            showInitializationError();
        }
    }, 15000); // 15 segundos

    try {
        // Paso 1: Inicializar Firebase PRIMERO
        console.log('🔧 Paso 1: Inicializando Firebase...');
        const firebaseResult = window.initializeFirebase && window.initializeFirebase();
        
        if (!firebaseResult) {
            throw new Error('Firebase no se pudo inicializar');
        }
        
        // Verificar que Firebase se inicializó correctamente
        await waitForFirebaseInitialization();
        console.log('✅ Firebase verificado y listo\n');
        
        // Paso 2: Configurar funciones básicas
        console.log('🔧 Paso 2: Configurando funciones básicas...');
        setupGlobalFunctions();
        console.log('✅ Funciones básicas configuradas\n');
        
        // Paso 3: Configurar formularios (CRÍTICO para solicitudes)
        console.log('🔧 Paso 3: Configurando formularios...');
        if (window.setupFormularios && typeof window.setupFormularios === 'function') {
            window.setupFormularios();
        } else {
            console.warn('⚠️ setupFormularios no disponible');
        }
        console.log('✅ Formularios configurados\n');
        
        // Paso 4: Configurar navegación
        console.log('🔧 Paso 4: Configurando navegación...');
        window.setupTabs && window.setupTabs();
        console.log('✅ Navegación configurada\n');
        
        // Paso 5: Configurar eventos globales
        console.log('🔧 Paso 5: Configurando eventos globales...');
        window.setupEventListeners && window.setupEventListeners();
        console.log('✅ Eventos configurados\n');
        
        // Paso 6: Configurar autenticación
        console.log('🔧 Paso 6: Configurando autenticación...');
        if (window.setupAuth && typeof window.setupAuth === 'function') {
            await window.setupAuth();
        } else {
            console.warn('⚠️ setupAuth no disponible');
        }
        console.log('✅ Autenticación configurada\n');
        
        // Paso 7: Inicializar módulos del sistema
        console.log('🔧 Paso 7: Inicializando módulos del sistema...');
        await initializeSystemModules();
        
        // Paso 8: Configurar event listeners específicos para formularios
        console.log('🔧 Paso 8: Configurando eventos de formularios...');
        setupFormEventListeners();
        
        console.log('\n🎉 ¡SISTEMA SENDA INICIALIZADO CORRECTAMENTE!');
        console.log('=====================================');
        
        initializationCompleted = true;
        clearTimeout(initializationTimer);
        
        setTimeout(() => {
            if (window.showNotification) {
                window.showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
            }
        }, 1000);
        
    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        showInitializationError(error);
        attemptBasicRecovery();
    }
});

/**
 * Configurar event listeners específicos para formularios
 */
function setupFormEventListeners() {
    try {
        console.log('🔧 Configurando eventos de formularios...');
        
        // Botón de solicitar ayuda
        const registerPatientBtn = document.getElementById('register-patient');
        if (registerPatientBtn) {
            registerPatientBtn.addEventListener('click', () => {
                console.log('📝 Abriendo formulario de solicitud');
                if (window.showModal) {
                    window.showModal('patient-modal');
                }
            });
            console.log('✅ Botón "Solicitar Ayuda" configurado');
        } else {
            console.warn('⚠️ Botón register-patient no encontrado');
        }
        
        // Botón de reingreso al programa
        const reentryProgramBtn = document.getElementById('reentry-program');
        if (reentryProgramBtn) {
            reentryProgramBtn.addEventListener('click', () => {
                console.log('🔄 Abriendo formulario de reingreso');
                if (window.showModal) {
                    window.showModal('reentry-modal');
                }
            });
            console.log('✅ Botón "Reingreso al Programa" configurado');
        } else {
            console.warn('⚠️ Botón reentry-program no encontrado');
        }
        
        // Configurar navegación del formulario de pasos
        setupFormStepNavigation();
        
        console.log('✅ Eventos de formularios configurados');
        
    } catch (error) {
        console.error('❌ Error configurando eventos de formularios:', error);
    }
}

/**
 * Configurar navegación por pasos del formulario
 */
function setupFormStepNavigation() {
    try {
        // Configurar botones de navegación por pasos
        const nextButtons = document.querySelectorAll('#next-step-1, #next-step-2, #next-step-3');
        const prevButtons = document.querySelectorAll('#prev-step-2, #prev-step-3, #prev-step-4');
        
        nextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('➡️ Avanzando al siguiente paso');
                // La lógica de navegación se maneja en el formulario
            });
        });
        
        prevButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⬅️ Retrocediendo al paso anterior');
                // La lógica de navegación se maneja en el formulario
            });
        });
        
        // Configurar radio buttons para tipo de solicitud
        const tipoSolicitudRadios = document.querySelectorAll('input[name="tipoSolicitud"]');
        tipoSolicitudRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('📋 Tipo de solicitud cambiado:', e.target.value);
                handleTipoSolicitudChange(e.target.value);
            });
        });
        
        // Configurar slider de motivación
        const motivacionRange = document.getElementById('motivacion-range');
        const motivacionValue = document.getElementById('motivacion-value');
        
        if (motivacionRange && motivacionValue) {
            motivacionRange.addEventListener('input', (e) => {
                motivacionValue.textContent = e.target.value;
                updateMotivacionColor(e.target.value);
            });
        }
        
        console.log('✅ Navegación de formulario configurada');
        
    } catch (error) {
        console.error('❌ Error configurando navegación de formulario:', error);
    }
}

/**
 * Manejar cambio de tipo de solicitud
 */
function handleTipoSolicitudChange(tipo) {
    const infoEmailContainer = document.getElementById('info-email-container');
    const basicInfoContainer = document.getElementById('basic-info-container');
    const nextBtn = document.getElementById('next-step-1');
    const submitBtn = document.getElementById('submit-step-1');
    
    if (tipo === 'informacion') {
        // Solo información por email
        if (infoEmailContainer) infoEmailContainer.style.display = 'block';
        if (basicInfoContainer) basicInfoContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
    } else {
        // Solicitud completa
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

/**
 * Actualizar color del slider de motivación
 */
function updateMotivacionColor(value) {
    const motivacionValue = document.getElementById('motivacion-value');
    if (!motivacionValue) return;
    
    const numValue = parseInt(value);
    let color = '#10b981'; // verde por defecto
    
    if (numValue <= 3) {
        color = '#ef4444'; // rojo
    } else if (numValue <= 6) {
        color = '#f59e0b'; // amarillo
    } else {
        color = '#10b981'; // verde
    }
    
    motivacionValue.style.backgroundColor = color;
}

/**
 * Esperar a que Firebase se inicialice
 */
async function waitForFirebaseInitialization(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        if (window.isFirebaseInitialized && window.isFirebaseInitialized()) {
            return true;
        }
        console.log(`⏳ Esperando Firebase... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('Firebase no se inicializó en el tiempo esperado');
}

/**
 * Inicializar módulos del sistema
 */
async function initializeSystemModules() {
    const modules = [
        {
            name: 'Calendario',
            init: async () => {
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
            init: async () => {
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
            init: async () => {
                try {
                    window.initTimeline && window.initTimeline();
                    window.initAttentions && window.initAttentions();
                    window.initUpcomingAppointmentsFromSeguimiento && window.initUpcomingAppointmentsFromSeguimiento();
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo seguimiento:', error);
                    throw error;
                }
            }
        },
        {
            name: 'Solicitudes',
            init: async () => {
                try {
                    window.initSolicitudesManager && window.initSolicitudesManager();
                } catch (error) {
                    console.warn('  ⚠️ Error en módulo solicitudes:', error);
                    throw error;
                }
            }
        }
    ];

    for (const module of modules) {
        try {
            await module.init();
            console.log(`✅ Módulo ${module.name} inicializado correctamente`);
        } catch (error) {
            console.warn(`⚠️ Error inicializando módulo ${module.name}:`, error);
            continue;
        }
    }
}

/**
 * Configurar funciones globales
 */
function setupGlobalFunctions() {
    try {
        // Función para cerrar modales
        window.closeModal = window.closeModal || function(modalId) {
            console.log('🔧 Cerrando modal:', modalId);
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
        
        // Función para mostrar modales
        window.showModal = window.showModal || function(modalId) {
            console.log('🔧 Mostrando modal:', modalId);
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Enfocar primer input
                setTimeout(() => {
                    const firstInput = modal.querySelector('input:not([type="hidden"]):not([disabled])');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 150);
            }
        };
        
        // Función de cambio de tabs de login
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
        
        // Sistema de notificaciones básico
        window.showNotification = window.showNotification || function(message, type = 'info', duration = 3000) {
            try {
                console.log(`📢 [${type.toUpperCase()}] ${message}`);
                
                // Crear contenedor si no existe
                let container = document.getElementById('notifications');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'notifications';
                    container.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10000;
                        max-width: 400px;
                    `;
                    document.body.appendChild(container);
                }
                
                // Crear notificación
                const notification = document.createElement('div');
                notification.style.cssText = `
                    background: ${getNotificationColor(type)};
                    color: white;
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: slideInRight 0.3s ease;
                `;
                
                notification.innerHTML = `
                    <i class="fas fa-${getNotificationIcon(type)}"></i>
                    <span style="flex: 1;">${message}</span>
                    <button onclick="this.parentElement.remove()" 
                            style="background: none; border: none; color: white; cursor: pointer; padding: 0; margin-left: 8px;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                container.appendChild(notification);
                
                // Auto-remover
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, duration);
                
            } catch (error) {
                console.error('Error mostrando notificación:', error);
                alert(`${type.toUpperCase()}: ${message}`);
            }
        };
        
        // Debug del sistema
        window.SENDA_DEBUG = {
            getSystemInfo: () => ({
                version: '2.0',
                initialized: initializationCompleted,
                firebase: window.isFirebaseInitialized ? window.isFirebaseInitialized() : false,
                timestamp: new Date().toISOString()
            }),
            reinitialize: () => window.location.reload(),
            clearStorage: () => {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🗑️ Storage limpiado');
            },
            firebaseDiagnosis: () => window.firebaseDiagnosis ? window.firebaseDiagnosis() : 'No disponible'
        };
        
        console.log('✅ Funciones globales configuradas');
    } catch (error) {
        console.error('❌ Error configurando funciones globales:', error);
    }
}

/**
 * Obtener color para notificaciones
 */
function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || colors.info;
}

/**
 * Obtener icono para notificaciones
 */
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Mostrar error de inicialización
 */
function showInitializationError(error = null) {
    const errorMessage = error ? error.message : 'Error desconocido de inicialización';
    
    // Agregar diagnóstico Firebase si está disponible
    let firebaseDiag = '';
    if (window.firebaseDiagnosis) {
        try {
            const diag = window.firebaseDiagnosis();
            firebaseDiag = `
                <div style="margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 4px; text-align: left; font-size: 12px;">
                    <strong>Diagnóstico Firebase:</strong><br>
                    SDK cargado: ${diag.sdkLoaded ? '✅' : '❌'}<br>
                    Apps: ${diag.appsCount}<br>
                    Auth: ${diag.hasAuth ? '✅' : '❌'}<br>
                    DB: ${diag.hasDB ? '✅' : '❌'}<br>
                    Estado: ${diag.overallStatus ? '✅' : '❌'}
                </div>
            `;
        } catch (e) {
            firebaseDiag = '<div style="margin-top: 16px; color: #6b7280;">Diagnóstico no disponible</div>';
        }
    }
    
    let errorModal = document.getElementById('initialization-error-modal');
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'initialization-error-modal';
        errorModal.className = 'modal-overlay';
        errorModal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999; align-items: center; justify-content: center;';
        errorModal.innerHTML = `
            <div style="background: white; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="text-align: center; padding: 24px;">
                    <div style="color: #ef4444; font-size: 3rem; margin-bottom: 16px;">⚠️</div>
                    <h2 style="color: #ef4444; margin-bottom: 16px;">Error de Inicialización</h2>
                    <p style="margin-bottom: 16px; color: #6b7280;">${errorMessage}</p>
                    ${firebaseDiag}
                    <div style="margin: 24px 0; padding: 16px; background: #fee2e2; border-radius: 8px;">
                        <h4 style="margin-bottom: 8px;">Soluciones recomendadas:</h4>
                        <ol style="text-align: left; color: #7f1d1d; padding-left: 20px;">
                            <li>Verificar conexión a Internet</li>
                            <li>Recargar la página (F5)</li>
                            <li>Limpiar caché del navegador</li>
                            <li>Verificar configuración de Firebase</li>
                            <li>Contactar al administrador</li>
                        </ol>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.reload()" 
                                style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🔄 Recargar
                        </button>
                        <button onclick="window.SENDA_DEBUG?.clearStorage(); window.location.reload()" 
                                style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🗑️ Limpiar & Recargar
                        </button>
                        <button onclick="if(window.SENDA_DEBUG) console.log(window.SENDA_DEBUG.getSystemInfo())" 
                                style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🔍 Diagnóstico
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
 * Intentar recuperación básica
 */
function attemptBasicRecovery() {
    try {
        console.log('🚑 Intentando recuperación de emergencia...');
        
        // Configurar funciones mínimas
        setupGlobalFunctions();
        
        // Configurar eventos básicos para cerrar modales
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });
        
        console.log('✅ Recuperación de emergencia completada');
        
    } catch (recoveryError) {
        console.error('❌ Error en recuperación de emergencia:', recoveryError);
    }
}

// Event listeners de conectividad
window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    if (window.showNotification) {
        window.showNotification('Conexión a Internet restaurada', 'success');
    }
});

window.addEventListener('offline', () => {
    console.log('🌐 Sin conexión');
    if (window.showNotification) {
        window.showNotification('Sin conexión a Internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
    }
});

// Información del sistema
console.log('🔍 Información del Sistema:');
console.log(`   Navegador: ${navigator.userAgent}`);
console.log(`   Idioma: ${navigator.language}`);
console.log(`   Conexión: ${navigator.onLine ? 'Online' : 'Offline'}`);
console.log(`   Local Storage: ${typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible'}`);

console.log('\n📝 Sistema SENDA listo para inicialización...\n');
