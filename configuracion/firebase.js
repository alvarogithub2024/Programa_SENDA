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
     try {
    await db.enablePersistence({
        synchronizeTabs: true
    });
} catch (err) {
    if (err.code === 'failed-precondition') {
        console.warn('Persistencia fallida: múltiples tabs abiertas');
    } else if (err.code === 'unimplemented') {
        console.warn('Persistencia no soportada en este navegador');
    }
}

export function getAuth() {
    return auth;
}

export function getFirestore() {
    return db;
}
export { db };
