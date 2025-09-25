// MAIN.JS - SISTEMA SENDA PUENTE ALTO v2.0

// === VARIABLES DE CONTROL ===
var initializationCompleted = false;
var initializationTimer = null;

// === INICIALIZACIÓN GLOBAL ===
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

        // Paso 2: Configurar autenticación
        console.log('🔧 Paso 2: Configurando autenticación...');
        window.setupAuth && window.setupAuth();
        console.log('✅ Autenticación configurada\n');

        // Paso 3: Configurar navegación
        console.log('🔧 Paso 3: Configurando navegación...');
        window.setupTabs && window.setupTabs();
        console.log('✅ Navegación configurada\n');

        // Paso 4: Configurar formularios
        console.log('🔧 Paso 4: Configurando formularios...');
        window.setupFormularios && window.setupFormularios();
        console.log('✅ Formularios configurados\n');

        // Paso 5: Configurar eventos globales
        console.log('🔧 Paso 5: Configurando eventos globales...');
        window.setupEventListeners && window.setupEventListeners();
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
            window.showNotification && window.showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
        }, 1000);

    } catch (error) {
        clearTimeout(initializationTimer);
        console.error('❌ ERROR CRÍTICO durante la inicialización:', error);
        showInitializationError(error);
        attemptBasicRecovery();
    }
});

// ====== ESPERAR INICIALIZACIÓN DE FIREBASE ======
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

// ====== INICIALIZAR MÓDULOS DEL SISTEMA ======
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

// ====== FUNCIONES GLOBALES ======
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

// ====== MODAL DE ERROR DE INICIALIZACIÓN ======
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

// ====== INTENTO DE RECUPERACIÓN BÁSICA ======
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

// ====== LOGIN DE PROFESIONALES CON VERIFICACIÓN EN FIRESTORE ======
document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      window.showNotification && window.showNotification("Completa email y contraseña", "warning");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;
        const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

        // Busca el profesional en la colección y verifica activo
        return db.collection("profesionales").doc(uid).get();
      })
      .then((doc) => {
        if (!doc.exists) {
          window.showNotification && window.showNotification("No tienes permisos de acceso como profesional.", "error");
          firebase.auth().signOut();
          return;
        }
        const profesional = doc.data();
        if (!profesional.activo) {
          window.showNotification && window.showNotification("Tu usuario está inactivo. Contacta al administrador.", "error");
          firebase.auth().signOut();
          return;
        }
// ====== REGISTRO DE PROFESIONALES EN FIREBASE ======
document.addEventListener("DOMContentLoaded", function() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Tomar los valores del formulario
    const nombre = document.getElementById('register-nombre').value.trim();
    const apellidos = document.getElementById('register-apellidos').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const profession = document.getElementById('register-profession').value;
    const cesfam = document.getElementById('register-cesfam').value;

    // Validación básica
    if (!nombre || !apellidos || !email || !password || !profession || !cesfam) {
      window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
      return;
    }

    // CREA el usuario en Firebase Auth
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
        const profesional = {
          activo: true,
          nombre: nombre,
          apellidos: apellidos,
          cesfam: cesfam,
          email: email,
          profession: profession,
          fechaCreacion: new Date().toISOString()
        };
        // Guarda en la colección profesionales (con el UID como doc ID)
        return db.collection("profesionales").doc(userCredential.user.uid).set(profesional);
      })
      .then(() => {
        window.showNotification && window.showNotification("Registro exitoso. Puedes iniciar sesión.", "success");
        registerForm.reset();
        // Opcional: cambia a la pestaña de login automáticamente
        if (typeof switchLoginTab === 'function') switchLoginTab('login');
      })
      .catch((error) => {
        window.showNotification && window.showNotification("Error al registrar: " + error.message, "error");
      });
  });
});


// ====== DIAGNÓSTICO DEL SISTEMA EN CONSOLA ======
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
