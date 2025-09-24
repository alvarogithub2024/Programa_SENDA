/**
 * CONFIGURACION/FIREBASE.JS
 * Configuración e inicialización de Firebase
 */

import { FIREBASE_CONFIG } from './constantes.js';

let auth, db;

export function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está cargado');
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar persistencia
        db.enablePersistence({
            synchronizeTabs: true
        }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistencia falló: múltiples tabs abiertas');
            } else if (err.code === 'unimplemented') {
                console.warn('Persistencia no soportada en este navegador');
            }
        });
        
        console.log('✅ Firebase inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        throw error;
    }
}

export function getAuth() {
    return auth;
}

export function getFirestore() {
    return db;
}
export { db };
