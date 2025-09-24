/**
 * CONFIGURACIÓN DE FIREBASE
 * Maneja la inicialización y configuración de Firebase
 */

// Variables globales para Firebase
let auth, db;

/**
 * Configuración de Firebase
 */
const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

/**
 * Verifica si Firebase está disponible
 */
function verificarFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está cargado');
        return false;
    }
    return true;
}

/**
 * Inicializa Firebase con configuración de persistencia
 */
async function inicializarFirebase() {
    try {
        // Verificar si Firebase ya está inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Inicializar servicios
        auth = firebase.auth();
        db = firebase.firestore();

        // Habilitar persistencia offline
        await habilitarPersistencia();

        console.log('✅ Firebase inicializado correctamente');
        return { auth, db };

    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        throw error;
    }
}

/**
 * Habilita la persistencia offline de Firestore
 */
async function habilitarPersistencia() {
    try {
        await db.enablePersistence({
            synchronizeTabs: true
        });
        console.log('✅ Persistencia offline habilitada');
    } catch (error) {
        if (error.code === 'failed-precondition') {
            console.warn('⚠️ Persistencia falló: múltiples tabs abiertas');
        } else if (error.code === 'unimplemented') {
            console.warn('⚠️ Persistencia no soportada en este navegador');
        } else {
            console.error('❌ Error habilitando persistencia:', error);
        }
    }
}

/**
 * Obtiene la instancia de Auth
 */
function obtenerAuth() {
    if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
    }
    return auth;
}

/**
 * Obtiene la instancia de Firestore
 */
function obtenerFirestore() {
    if (!db) {
        throw new Error('Firestore no está inicializado');
    }
    return db;
}

/**
 * Verifica el estado de conexión de Firebase
 */
function verificarConexion() {
    return new Promise((resolve) => {
        const connectedRef = db.collection('.info/connected');
        connectedRef.onSnapshot((snap) => {
            if (snap.exists()) {
                console.log('🔗 Conectado a Firebase');
                resolve(true);
            } else {
                console.log('🔌 Desconectado de Firebase');
                resolve(false);
            }
        });
    });
}

/**
 * Configuración de reglas de seguridad offline
 */
function configurarReglasOffline() {
    // Configurar reglas para funcionamiento offline
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
}

export {
    inicializarFirebase,
    verificarFirebase,
    obtenerAuth,
    obtenerFirestore,
    verificarConexion,
    auth,
    db
};
