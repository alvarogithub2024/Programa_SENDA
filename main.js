// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0 - VERSIÓN CORREGIDA SIN IMPORTS

let initializationCompleted = false;
let initializationTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log('🔄 Iniciando sistema SENDA completo...\n');
    
    // Timer de timeout más largo
    initializationTimer = setTimeout(() => {
        if (!initializationCompleted) {
            console.error('❌ TIMEOUT: La inicialización está tomando demasiado tiempo');
            showInitializationError(new Error('Timeout de inicialización - 20 segundos'));
        }
    }, 20000); // 20 segundos

    try {
        // PASO 1: Verificar prerequisitos
        console.log('🔧 Paso 1: Verificando prerequisitos...');
        await verifyPrerequisites();
        
        // PASO 2: Inicializar Firebase con reintentos
        console.log('🔧 Paso 2: Inicializando Firebase...');
        const firebaseReady = await initializeFirebaseWithRetry();
        
        if (!firebaseReady) {
            throw new Error('Firebase no se pudo inicializar después de varios intentos');
        }
        
        console.log('✅ Firebase verificado y listo\n');
        
        // PASO 3: Configurar autenticación
        console.log('🔧 Paso 3: Configurando autenticación...');
        await setupAuthenticationSafely();
        
        // PASO 4: Configurar navegación
        console.log('🔧 Paso 4: Configurando navegación...');
        setupNavigationSafely();
        
        // PASO 5: Configurar formularios
        console.log('🔧 Paso 5: Configurando formularios...');
        setupFormulariosSafely();
        
        // PASO 6: Configurar eventos globales
        console.log('🔧 Paso 6: Configurando eventos globales...');
        setupEventListenersSafely();
        
        // PASO 7: Inicializar módulos del sistema
        console.log('🔧 Paso 7: Inicializando módulos del sistema...');
        await initializeSystemModulesSafely();
        
        // PASO 8: Configurar funciones globales
        setupGlobalFunctions();
        
        console.log('\n🎉 ¡SISTEMA SENDA INICIALIZADO CORRECTAMENTE!');
        console.log('=====================================');
        
        initializationCompleted = true;
        clearTimeout(initializationTimer);
        
        // Mostrar notificación de éxito
        setTimeout(() => {
            showSuccessNotification();
        }, 1000);
        
    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        showInitializationError(error);
        await attemptEmergencyRecovery();
    }
});

/**
 * Verificar prerequisitos del sistema
 */
async function verifyPrerequisites() {
    const checks = [
        {
            name: 'Firebase SDK',
            check: () => typeof firebase !== 'undefined',
            error: 'Firebase SDK no está cargado. Verifica los scripts en index.html'
        },
        {
            name: 'DOM Ready',
            check: () => document.readyState === 'complete' || document.readyState === 'interactive',
            error: 'DOM no está listo'
        },
        {
            name: 'Local Storage',
            check: () => typeof Storage !== 'undefined',
            error: 'Local Storage no está disponible'
        }
    ];

    for (const check of checks) {
        if (!check.check()) {
            throw new Error(`Prerequisito fallido: ${check.error}`);
        }
        console.log(`✅ ${check.name} - OK`);
    }
}

/**
 * Inicializar Firebase con reintentos
 */
async function initializeFirebaseWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Intento ${attempt}/${maxRetries} de inicialización Firebase...`);
            
            // Verificar que la función existe en window
            if (!window.initializeFirebase || typeof window.initializeFirebase !== 'function') {
                throw new Error('window.initializeFirebase no está disponible');
            }
            
            // Llamar a la función de inicialización
            const result = await window.initializeFirebase();
            
            if (result) {
                // Verificar que realmente esté inicializado
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
                
                if (window.isFirebaseInitialized && window.isFirebaseInitialized()) {
                    console.log(`✅ Firebase inicializado correctamente en intento ${attempt}`);
                    return true;
                }
            }
            
            throw new Error('Firebase no pasó la verificación de estado');
            
        } catch (error) {
            console.warn(`⚠️ Intento ${attempt} fallido:`, error.message);
            
            if (attempt === maxRetries) {
                console.error('❌ Todos los intentos de Firebase fallaron');
                // Mostrar diagnóstico
                if (window.firebaseDiagnosis) {
                    window.firebaseDiagnosis();
                }
                return false;
            }
            
            // Esperar antes del siguiente intento
            const delay = attempt * 2000; // 2s, 4s, 6s
            console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return false;
}

/**
 * Configurar autenticación de forma segura
 */
async function setupAuthenticationSafely() {
    try {
        if (window.setupAuth && typeof window.setupAuth === 'function') {
            await window.setupAuth();
            console.log('✅ Autenticación configurada');
        } else {
            console.warn('⚠️ setupAuth no disponible');
        }
    } catch (error) {
        console.error('❌ Error configurando autenticación:', error);
        throw error;
    }
}

/**
 * Configurar navegación de forma segura
 */
function setupNavigationSafely() {
    try {
        if (window.setupTabs && typeof window.setupTabs === 'function') {
            window.setupTabs();
            console.log('✅ Navegación configurada');
        } else {
            console.warn('⚠️ setupTabs no disponible');
        }
    } catch (error) {
        console.warn('⚠️ Error configurando navegación:', error);
        // No es crítico, continuar
    }
}

/**
 * Configurar formularios de forma segura
 */
function setupFormulariosSafely() {
    try {
        if (window.setupFormularios && typeof window.setupFormularios === 'function') {
            window.setupFormularios();
            console.log('✅ Formularios configurados');
        } else {
            console.warn('⚠️ setupFormularios no disponible');
        }
    } catch (error) {
        console.warn('⚠️ Error configurando formularios:', error);
        // No es crítico, continuar
    }
}

/**
 * Configurar eventos de forma segura
 */
function setupEventListenersSafely() {
    try {
        if (window.setupEventListeners && typeof window.setupEventListeners === 'function') {
            window.setupEventListeners();
            console.log('✅ Eventos configurados');
        } else {
            console.warn('⚠️ setupEventListeners no disponible');
        }
    } catch (error) {
        console.warn('⚠️ Error configurando eventos:', error);
        // No es crítico, continuar
    }
}

/**
 * Inicializar módulos de forma segura
 */
async function initializeSystemModulesSafely() {
    const modules = [
        { 
            name: 'Calendario', 
            init: () => {
                if (window.initCalendar) window.initCalendar();
                if (window.initUpcomingAppointments) window.initUpcomingAppointments();
                if (window.initScheduleManager) window.initScheduleManager();
            }
        },
        { 
            name: 'Pacientes', 
            init: () => {
                if (window.initPatientsManager) window.initPatientsManager();
                if (window.initPatientSearch) window.initPatientSearch();
                if (window.initPatientRecord) window.initPatientRecord();
            }
        },
        { 
            name: 'Seguimiento', 
            init: () => {
                if (window.initTimeline) window.initTimeline();
                if (window.initAttentions) window.initAttentions();
            }
        },
        { 
            name: 'Solicitudes', 
            init: () => {
                if (window.initSolicitudesManager) window.initSolicitudesManager();
            }
        }
    ];

    let successCount = 0;
    for (const module of modules) {
        try {
            if (module.init && typeof module.init === 'function') {
                await module.init();
                console.log(`✅ Módulo ${module.name} inicializado`);
                successCount++;
            } else {
                console.warn(`⚠️ Módulo ${module.name} no disponible`);
            }
        } catch (error) {
            console.warn(`⚠️ Error en módulo ${module.name}:`, error);
            // Continuar con otros módulos
        }
    }
    
    console.log(`📊 Módulos inicializados: ${successCount}/${modules.length}`);
}

/**
 * Configurar funciones globales
 */
function setupGlobalFunctions() {
    try {
        // Funciones modales básicas
        if (!window.closeModal) {
            window.closeModal = function(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) modal.style.display = 'none';
            };
        }
        
        if (!window.showModal) {
            window.showModal = function(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) modal.style.display = 'flex';
            };
        }
        
        // Sistema de notificaciones básico
        if (!window.showNotification) {
            window.showNotification = function(message, type = 'info', duration = 3000) {
                console.log(`[${type.toUpperCase()}] ${message}`);
                // Implementación básica en consola si no existe otra
                
                // Intentar usar el sistema de notificaciones si existe
                try {
                    const container = document.getElementById('notifications') || createNotificationsContainer();
                    
                    const notification = document.createElement('div');
                    notification.className = `notification ${type}`;
                    notification.innerHTML = `
                        <i class="fas fa-${getNotificationIcon(type)}"></i> 
                        <span>${message}</span>
                        <button class="notification-close" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    container.appendChild(notification);
                    
                    // Mostrar animación
                    requestAnimationFrame(() => {
                        notification.classList.add('show');
                    });
                    
                    // Auto-remover
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.classList.remove('show');
                            setTimeout(() => {
                                if (notification.parentElement) {
                                    notification.remove();
                                }
                            }, 300);
                        }
                    }, duration);
                    
                } catch (error) {
                    console.error('Error en notificación:', error);
                }
            };
        }
        
        // Función auxiliar para crear contenedor de notificaciones
        function createNotificationsContainer() {
            const container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
            return container;
        }
        
        // Función auxiliar para iconos de notificación
        function getNotificationIcon(type) {
            const icons = {
                'success': 'check-circle',
                'error': 'exclamation-triangle',
                'warning': 'exclamation-triangle',
                'info': 'info-circle'
            };
            return icons[type] || 'info-circle';
        }
        
        // Función para cambiar entre tabs de login
        if (!window.switchLoginTab) {
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
        }
        
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
 * Mostrar notificación de éxito
 */
function showSuccessNotification() {
    if (window.showNotification) {
        window.showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
    } else {
        console.log('🎉 Sistema SENDA cargado correctamente');
    }
}

/**
 * Mostrar error de inicialización mejorado
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
                        <button onclick="if(window.SENDA_DEBUG) window.SENDA_DEBUG.clearStorage(); window.location.reload()" 
                                style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                            🗑️ Limpiar & Recargar
                        </button>
                        <button onclick="if(window.firebaseDiagnosis) console.log(window.firebaseDiagnosis())" 
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
 * Recuperación de emergencia
 */
async function attemptEmergencyRecovery() {
    try {
        console.log('🚑 Intentando recuperación de emergencia...');
        
        // Configurar funciones mínimas
        setupGlobalFunctions();
        
        // Intentar configurar eventos básicos
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
        window.showNotification('Sin conexión a Internet', 'warning', 5000);
    }
});

window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        (event.error.message.includes('Firebase') || 
         event.error.message.includes('network') ||
         event.error.message.includes('auth'))) {
        if (window.showNotification) {
            window.showNotification('Error del sistema detectado. Si persiste, recarga la página.', 'error');
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    console.warn('Promise rejection capturada:', event.reason);
});

// Información del sistema
console.log('🔍 Información del Sistema:');
console.log(`   Navegador: ${navigator.userAgent}`);
console.log(`   Conexión: ${navigator.onLine ? 'Online' : 'Offline'}`);
console.log(`   Local Storage: ${typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible'}`);
console.log('\n📝 Sistema SENDA listo para inicialización...\n');
