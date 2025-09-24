/**
 * CONFIGURACION/FIREBASE.JS
 * Configuración e inicialización de Firebase
 */

import { FIREBASE_CONFIG } from './constantes.js';

let auth, db, isInitialized = false;

/**
 * Inicializa Firebase
 */
export function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está cargado. Verifica que los scripts estén incluidos.');
        }

        if (isInitialized) {
            console.log('✅ Firebase ya está inicializado');
            return;
        }

        // Inicializar Firebase app
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
            console.log('🔧 Firebase app inicializada');
        }
        
        // Obtener referencias
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar persistencia (sin await ya que es compat)
        configurePersistence();
        
        isInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        throw error;
    }
}

/**
 * Configura la persistencia de Firestore
 */
function configurePersistence() {
    if (!db) return;

    db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log('💾 Persistencia habilitada');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Persistencia fallida: múltiples tabs abiertos');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistencia no soportada en este navegador');
            } else {
                console.warn('⚠️ Error configurando persistencia:', err);
            }
        });
}

/**
 * Obtiene la instancia de Auth
 */
export function getAuth() {
    if (!auth) {
        initializeFirebase();
    }
    return auth;
}

/**
 * Obtiene la instancia de Firestore
 */
export function getFirestore() {
    if (!db) {
        initializeFirebase();
    }
    return db;
}

/**
 * Exportación adicional para compatibilidad
 */
export { db };

/**
 * Verifica si Firebase está inicializado
 */
export function isFirebaseInitialized() {
    return isInitialized;
}
