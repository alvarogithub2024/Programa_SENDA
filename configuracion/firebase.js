/**
 * CONFIGURACION/FIREBASE.JS - VERSIÓN CORREGIDA SIN IMPORTS
 * Configuración de Firebase con funciones globales
 */

// Configuración de Firebase
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

// Variables globales de Firebase
let firebaseApp = null;
let auth = null;
let db = null;
let isInitialized = false;

/**
 * Inicializa Firebase
 */
window.initializeFirebase = async function() {
    try {
        console.log('🔥 Inicializando Firebase...');
        
        // Verificar que Firebase SDK esté cargado
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no está cargado');
        }
        
        // Verificar si ya está inicializado
        if (firebase.apps.length > 0) {
            console.log('✅ Firebase ya estaba inicializado');
            firebaseApp = firebase.apps[0];
        } else {
            // Inicializar Firebase
            firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('🔥 Firebase inicializado correctamente');
        }
        
        // Inicializar servicios
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar Firestore
        if (db) {
            // Configuración de Firestore para desarrollo
            console.log('📊 Firestore inicializado');
        }
        
        isInitialized = true;
        console.log('✅ Firebase completamente inicializado');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        isInitialized = false;
        return false;
    }
};

/**
 * Verifica si Firebase está inicializado
 */
window.isFirebaseInitialized = function() {
    return isInitialized && firebaseApp !== null;
};

/**
 * Obtiene la instancia de Auth
 */
window.getAuth = function() {
    if (!isInitialized || !auth) {
        console.error('❌ Firebase Auth no inicializado');
        return null;
    }
    return auth;
};

/**
 * Obtiene la instancia de Firestore
 */
window.getFirestore = function() {
    if (!isInitialized || !db) {
        console.error('❌ Firestore no inicializado');
        return null;
    }
    return db;
};

/**
 * Obtiene timestamp del servidor
 */
window.getServerTimestamp = function() {
    if (!isInitialized || !firebase.firestore) {
        console.error('❌ Firebase no inicializado para timestamp');
        return new Date();
    }
    return firebase.firestore.FieldValue.serverTimestamp();
};

/**
 * Operación con reintentos para Firestore
 */
window.retryFirestoreOperation = async function(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`⚠️ Intento ${attempt}/${maxRetries} fallido:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Esperar antes del siguiente intento
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

/**
 * Diagnóstico de Firebase
 */
window.firebaseDiagnosis = function() {
    const diagnosis = {
        sdkLoaded: typeof firebase !== 'undefined',
        appsCount: typeof firebase !== 'undefined' ? firebase.apps.length : 0,
        hasAuth: !!auth,
        hasDB: !!db,
        isInitialized: isInitialized,
        overallStatus: isInitialized && !!auth && !!db
    };
    
    console.log('🔍 Diagnóstico Firebase:', diagnosis);
    return diagnosis;
};

/**
 * Configurar observador de estado de autenticación
 */
window.setupAuth = function() {
    try {
        console.log('🔧 Configurando sistema de autenticación...');
        
        const authInstance = window.getAuth();
        if (!authInstance) {
            throw new Error('Firebase Auth no inicializado');
        }
        
        // Variables globales de autenticación
        window.currentUser = null;
        window.currentUserData = null;
        window.authInitialized = false;
        
        // Configurar observer de estado de autenticación
        authInstance.onAuthStateChanged(window.onAuthStateChanged);
        
        // Configurar listeners de sesión
        window.setupSessionListeners();
        
        window.authInitialized = true;
        console.log('✅ Sistema de autenticación configurado');
        
    } catch (error) {
        console.error('❌ Error configurando autenticación:', error);
        if (window.showNotification) {
            window.showNotification('Error en configuración de autenticación', 'error');
        }
    }
};

/**
 * Maneja los cambios en el estado de autenticación
 */
window.onAuthStateChanged = async function(user) {
    try {
        console.log('🔄 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
        
        // Mostrar indicador de carga
        if (window.showAuthLoading) {
            window.showAuthLoading(true);
        }
        
        if (user) {
            window.currentUser = user;
            await window.handleUserAuthenticated(user);
        } else {
            await window.handleUserLoggedOut();
        }
        
    } catch (error) {
        console.error('❌ Error en cambio de estado de autenticación:', error);
        if (window.showNotification) {
            window.showNotification('Error en autenticación: ' + error.message, 'error');
        }
        
        // En caso de error, mostrar contenido público
        await window.handleUserLoggedOut();
    } finally {
        if (window.showAuthLoading) {
            window.showAuthLoading(false);
        }
    }
};

/**
 * Maneja cuando el usuario está autenticado
 */
window.handleUserAuthenticated = async function(user) {
    try {
        console.log('👤 Usuario autenticado, cargando datos...');
        
        // Verificar email verificado (opcional)
        if (!user.emailVerified && user.email && user.email.includes('@senda.cl')) {
            console.warn('⚠️ Email no verificado para:', user.email);
        }
        
        // Cargar datos del profesional
        const userData = await window.loadProfessionalData(user.uid);
        
        if (!userData) {
            throw new Error('No se encontraron datos del profesional');
        }
        
        window.currentUserData = userData;
        
        // Mostrar contenido profesional
        window.showProfessionalContent();
        
        // Actualizar información en la UI
        window.updateProfessionalInfo();
        
        // Configurar tabs según permisos
        if (window.setCurrentUserData) {
            window.setCurrentUserData(userData);
        }
        
        console.log('✅ Usuario autenticado correctamente:', userData.nombre);
        
    } catch (error) {
        console.error('❌ Error manejando usuario autenticado:', error);
        
        let errorMessage = 'Error cargando datos del usuario';
        if (error.message.includes('No se encontraron datos')) {
            errorMessage = 'Perfil de profesional no encontrado. Contacta al administrador.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Sin permisos para acceder a los datos';
        }
        
        if (window.showNotification) {
            window.showNotification(errorMessage, 'error');
        }
        
        // Cerrar sesión en caso de error crítico
        await window.handleLogout();
    }
};

/**
 * Maneja cuando el usuario no está autenticado
 */
window.handleUserLoggedOut = async function() {
    try {
        console.log('🚪 Usuario no autenticado');
        
        // Limpiar datos de usuario
        window.currentUser = null;
        window.currentUserData = null;
        
        // Limpiar cache
        if (window.clearUserCache) {
            window.clearUserCache();
        }
        
        // Mostrar contenido público
        window.showPublicContent();
        
        console.log('✅ Sesión limpiada correctamente');
        
    } catch (error) {
        console.error('❌ Error manejando logout:', error);
    }
};

/**
 * Carga los datos del profesional desde Firestore
 */
window.loadProfessionalData = async function(userId) {
    try {
        // Verificar cache primero
        const cacheKey = `professional_${userId}`;
        if (window.getCachedData) {
            const cachedData = window.getCachedData(cacheKey);
            if (cachedData) {
                console.log('📦 Datos cargados desde cache');
                return cachedData;
            }
        }
        
        // Cargar desde Firestore con reintentos
        const userData = await window.retryFirestoreOperation(async () => {
            const db = window.getFirestore();
            if (!db) {
                throw new Error('Base de datos no disponible');
            }
            
            const userDoc = await db.collection('profesionales').doc(userId).get();
            
            if (!userDoc.exists) {
                throw new Error(`Profesional no encontrado: ${userId}`);
            }
            
            return {
                uid: userId,
                ...userDoc.data()
            };
        });
        
        // Guardar en cache
        if (window.setCachedData) {
            window.setCachedData(cacheKey, userData);
        }
        
        console.log('📊 Datos del profesional cargados:', userData.nombre);
        return userData;
        
    } catch (error) {
        console.error('❌ Error cargando datos del profesional:', error);
        throw error;
    }
};

/**
 * Muestra el contenido público
 */
window.showPublicContent = function() {
    try {
        const elements = {
            publicContent: document.getElementById('public-content'),
            professionalContent: document.getElementById('professional-content'),
            professionalHeader: document.getElementById('professional-header'),
            loginBtn: document.getElementById('login-professional'),
            logoutBtn: document.getElementById('logout-professional')
        };

        // Mostrar elementos públicos
        if (elements.publicContent) {
            elements.publicContent.style.display = 'block';
        }
        
        if (elements.loginBtn) {
            elements.loginBtn.style.display = 'flex';
        }

        // Ocultar elementos profesionales
        if (elements.professionalContent) {
            elements.professionalContent.style.display = 'none';
        }
        
        if (elements.professionalHeader) {
            elements.professionalHeader.style.display = 'none';
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.style.display = 'none';
        }
        
        console.log('🏠 Contenido público mostrado');
        
    } catch (error) {
        console.error('❌ Error mostrando contenido público:', error);
    }
};

/**
 * Muestra el contenido profesional
 */
window.showProfessionalContent = function() {
    try {
        const elements = {
            publicContent: document.getElementById('public-content'),
            professionalContent: document.getElementById('professional-content'),
            professionalHeader: document.getElementById('professional-header'),
            loginBtn: document.getElementById('login-professional'),
            logoutBtn: document.getElementById('logout-professional')
        };

        // Ocultar elementos públicos
        if (elements.publicContent) {
            elements.publicContent.style.display = 'none';
        }
        
        if (elements.loginBtn) {
            elements.loginBtn.style.display = 'none';
        }

        // Mostrar elementos profesionales
        if (elements.professionalContent) {
            elements.professionalContent.style.display = 'block';
        }
        
        if (elements.professionalHeader) {
            elements.professionalHeader.style.display = 'block';
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.style.display = 'flex';
        }
        
        console.log('👨‍⚕️ Contenido profesional mostrado');
        
    } catch (error) {
        console.error('❌ Error mostrando contenido profesional:', error);
    }
};

/**
 * Actualiza la información del profesional en la interfaz
 */
window.updateProfessionalInfo = function() {
    try {
        if (!window.currentUserData) {
            console.warn('⚠️ No hay datos de usuario para mostrar');
            return;
        }

        const elements = {
            name: document.getElementById('professional-name'),
            profession: document.getElementById('professional-profession'),
            cesfam: document.getElementById('professional-cesfam'),
            avatar: document.querySelector('.professional-avatar')
        };

        // Actualizar nombre
        if (elements.name) {
            elements.name.textContent = `${window.currentUserData.nombre || ''} ${window.currentUserData.apellidos || ''}`.trim();
        }
        
        // Actualizar profesión
        if (elements.profession) {
            elements.profession.textContent = window.getProfessionDisplayName(window.currentUserData.profession);
        }
        
        // Actualizar CESFAM
        if (elements.cesfam) {
            elements.cesfam.textContent = window.currentUserData.cesfam || 'CESFAM no asignado';
        }
        
        // Actualizar avatar con iniciales
        if (elements.avatar && window.currentUserData.nombre && window.currentUserData.apellidos) {
            const initials = `${window.currentUserData.nombre.charAt(0)}${window.currentUserData.apellidos.charAt(0)}`.toUpperCase();
            elements.avatar.textContent = initials;
        }
        
        console.log('✅ Información del profesional actualizada');
        
    } catch (error) {
        console.error('❌ Error actualizando información del profesional:', error);
    }
};

/**
 * Obtiene el nombre de display de la profesión
 */
window.getProfessionDisplayName = function(profession) {
    const professionNames = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional',
        'enfermero': 'Enfermero/a',
        'nutricionista': 'Nutricionista'
    };
    
    return professionNames[profession] || profession || 'Profesional de la Salud';
};

/**
 * Configurar listeners para eventos de sesión
 */
window.setupSessionListeners = function() {
    try {
        // Listener para botón de logout
        const logoutBtn = document.getElementById('logout-professional');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', window.handleLogout);
        }
        
        // Detectar cuando la pestaña se oculta/muestra para refrescar sesión
        document.addEventListener('visibilitychange', window.handleVisibilityChange);
        
        // Detectar foco de ventana para validar sesión
        window.addEventListener('focus', window.handleWindowFocus);
        
        console.log('✅ Session listeners configurados');
        
    } catch (error) {
        console.error('❌ Error configurando session listeners:', error);
    }
};

/**
 * Maneja el cambio de visibilidad de la pestaña
 */
window.handleVisibilityChange = function() {
    try {
        if (!document.hidden && window.currentUser) {
            // Validar que la sesión sigue activa
            window.validateCurrentSession();
        }
    } catch (error) {
        console.error('Error en handleVisibilityChange:', error);
    }
};

/**
 * Maneja cuando la ventana recibe el foco
 */
window.handleWindowFocus = function() {
    try {
        if (window.currentUser) {
            window.validateCurrentSession();
        }
    } catch (error) {
        console.error('Error en handleWindowFocus:', error);
    }
};

/**
 * Valida la sesión actual
 */
window.validateCurrentSession = async function() {
    try {
        if (!window.currentUser) return;
        
        const auth = window.getAuth();
        if (!auth) return;
        
        const user = auth.currentUser;
        
        if (!user) {
            console.warn('⚠️ Usuario ya no autenticado, limpiando sesión');
            await window.handleUserLoggedOut();
            return;
        }
        
        // Verificar token (opcional)
        try {
            await user.getIdToken(true); // Forzar refresh del token
        } catch (tokenError) {
            console.warn('⚠️ Error validando token:', tokenError);
            if (tokenError.code === 'auth/user-token-expired') {
                if (window.showNotification) {
                    window.showNotification('Sesión expirada, por favor inicia sesión nuevamente', 'warning');
                }
                await window.handleLogout();
                return;
            }
        }
        
    } catch (error) {
        console.error('❌ Error validando sesión:', error);
    }
};

/**
 * Cierra la sesión del usuario
 */
window.handleLogout = async function() {
    try {
        console.log('🚪 Iniciando cierre de sesión...');
        
        if (window.showAuthLoading) {
            window.showAuthLoading(true, 'Cerrando sesión...');
        }
        
        const auth = window.getAuth();
        if (auth) {
            await auth.signOut();
        }
        
        // Limpiar datos locales
        window.currentUser = null;
        window.currentUserData = null;
        
        // Limpiar cache
        if (window.clearUserCache) {
            window.clearUserCache();
        }
        
        // Limpiar localStorage
        localStorage.clear();
        
        // Mostrar contenido público
        window.showPublicContent();
        
        if (window.showNotification) {
            window.showNotification('Sesión cerrada correctamente', 'success');
        }
        
        console.log('✅ Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        if (window.showNotification) {
            window.showNotification('Error al cerrar sesión: ' + error.message, 'error');
        }
        
        // Forzar limpieza aunque haya error
        window.currentUser = null;
        window.currentUserData = null;
        if (window.clearUserCache) {
            window.clearUserCache();
        }
        window.showPublicContent();
        
    } finally {
        if (window.showAuthLoading) {
            window.showAuthLoading(false);
        }
    }
};

/**
 * Muestra/oculta el loading de autenticación
 */
window.showAuthLoading = function(show, message = 'Autenticando...') {
    try {
        let loadingElement = document.getElementById('auth-loading');
        
        if (show) {
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.id = 'auth-loading';
                loadingElement.className = 'auth-loading-overlay';
                loadingElement.innerHTML = `
                    <div class="auth-loading-content">
                        <div class="spinner"></div>
                        <p>${message}</p>
                    </div>
                `;
                document.body.appendChild(loadingElement);
            }
            loadingElement.style.display = 'flex';
        } else {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error mostrando loading de auth:', error);
    }
};

console.log('🔥 Firebase configuración cargada - Funciones disponibles en window');
