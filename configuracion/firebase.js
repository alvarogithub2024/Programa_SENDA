/**
 * CONFIGURACION/FIREBASE.JS - VERSIÓN CORREGIDA
 * Configuración completa de Firebase
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

let app = null;
let db = null;
let auth = null;
let isInitialized = false;

/**
 * Inicializar Firebase
 */
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK no está cargado');
            return false;
        }

        console.log('🔧 Inicializando Firebase...');
        
        // Inicializar Firebase si no está inicializado
        if (!firebase.apps.length) {
            app = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('✅ Firebase App inicializada');
        } else {
            app = firebase.app();
            console.log('✅ Firebase App ya existía');
        }

        // Inicializar servicios
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar Firestore
        db.settings({
            timestampsInSnapshots: true,
            ignoreUndefinedProperties: true
        });

        isInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        return false;
    }
}

/**
 * Verificar si Firebase está inicializado
 */
function isFirebaseInitialized() {
    return isInitialized && db !== null && auth !== null;
}

/**
 * Obtener instancia de Firestore
 */
function getFirestore() {
    if (!isInitialized || !db) {
        console.error('❌ Firestore no inicializado');
        return null;
    }
    return db;
}

/**
 * Obtener instancia de Auth
 */
function getAuth() {
    if (!isInitialized || !auth) {
        console.error('❌ Auth no inicializado');
        return null;
    }
    return auth;
}

/**
 * Obtener timestamp del servidor
 */
function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Operación con reintentos para Firestore
 */
async function retryFirestoreOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Esperar antes del siguiente intento (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
}

/**
 * Diagnóstico de Firebase
 */
function firebaseDiagnosis() {
    const diagnosis = {
        sdkLoaded: typeof firebase !== 'undefined',
        appsCount: firebase.apps ? firebase.apps.length : 0,
        hasAuth: auth !== null,
        hasDB: db !== null,
        overallStatus: isInitialized
    };
    
    console.log('🔍 Diagnóstico Firebase:', diagnosis);
    return diagnosis;
}

// Exportar a window para uso global
if (typeof window !== 'undefined') {
    window.initializeFirebase = initializeFirebase;
    window.isFirebaseInitialized = isFirebaseInitialized;
    window.getFirestore = getFirestore;
    window.getAuth = getAuth;
    window.getServerTimestamp = getServerTimestamp;
    window.retryFirestoreOperation = retryFirestoreOperation;
    window.firebaseDiagnosis = firebaseDiagnosis;
}

console.log('📁 Firebase config loaded');
