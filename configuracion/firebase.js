/**
 * CONFIGURACION/FIREBASE.JS
 * Configuración e inicialización de Firebase - VERSIÓN CORREGIDA
 */

import { FIREBASE_CONFIG } from './constantes.js';

let auth, db, isInitialized = false;

/**
 * Inicializa Firebase con configuración completa
 */
export function initializeFirebase() {
    try {
        console.log('🔧 Iniciando configuración de Firebase...');
        
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no está cargado. Verifica los scripts en index.html');
        }

        if (isInitialized) {
            console.log('✅ Firebase ya está inicializado');
            return true;
        }

        // Inicializar Firebase app
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
            console.log('🔥 Firebase app inicializada');
        }
        
        // Obtener referencias
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar persistencia offline
        configurePersistence();
        
        // Configurar configuración de red
        db.settings({
            experimentalForceLongPolling: true
        });
        
        isInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        
        // Crear colecciones iniciales si no existen
        initializeCollections();
        
        return true;
        
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
            console.log('💾 Persistencia offline habilitada');
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
 * Inicializa colecciones básicas del sistema
 */
async function initializeCollections() {
    try {
        const collections = [
            'profesionales',
            'pacientes', 
            'solicitudes_ingreso',
            'solicitudes_informacion',
            'reingresos',
            'citas',
            'historial_pacientes',
            'centros_salud',
            'alertas_criticas'
        ];

        console.log('📁 Verificando colecciones del sistema...');
        
        // Crear CESFAM predeterminados
        await createDefaultCenters();
        
        // Verificar que las colecciones existan
        for (const collectionName of collections) {
            try {
                const collectionRef = db.collection(collectionName);
                const snapshot = await collectionRef.limit(1).get();
                
                if (snapshot.empty && collectionName !== 'profesionales') {
                    // Crear documento inicial para establecer la colección
                    await collectionRef.add({
                        _initialized: true,
                        _timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        _collection: collectionName
                    });
                    console.log(`📁 Colección creada: ${collectionName}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error verificando colección ${collectionName}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Error inicializando colecciones:', error);
    }
}

/**
 * Crea los CESFAM predeterminados
 */
async function createDefaultCenters() {
    try {
        const centrosRef = db.collection('centros_salud');
        const snapshot = await centrosRef.limit(1).get();
        
        if (snapshot.empty) {
            const cesfams = [
                "CESFAM Alejandro del Río",
                "CESFAM Karol Wojtyla", 
                "CESFAM Laurita Vicuña",
                "CESFAM Padre Manuel Villaseca",
                "CESFAM San Gerónimo",
                "CESFAM Vista Hermosa",
                "CESFAM Bernardo Leighton",
                "CESFAM Cardenal Raúl Silva Henríquez"
            ];

            const batch = db.batch();
            
            cesfams.forEach((nombre, index) => {
                const docRef = centrosRef.doc(`cesfam_${index + 1}`);
                batch.set(docRef, {
                    nombre: nombre,
                    codigo: `CESFAM_PA_${index + 1}`,
                    activo: true,
                    comuna: 'Puente Alto',
                    region: 'Región Metropolitana',
                    telefono: `+56 2 ${2800 + index}${1000 + index}`,
                    direccion: `Dirección ${nombre}`,
                    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
            console.log('🏥 CESFAM predeterminados creados');
        }
    } catch (error) {
        console.error('Error creando CESFAM:', error);
    }
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
    return isInitialized && auth && db;
}

/**
 * Verifica conectividad con Firebase
 */
export async function checkFirebaseConnection() {
    try {
        if (!db) {
            throw new Error('Firestore no inicializado');
        }
        
        const testRef = db.collection('_connection_test');
        await testRef.add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            test: true
        });
        
        console.log('✅ Conexión a Firebase verificada');
        return true;
        
    } catch (error) {
        console.error('❌ Error de conexión a Firebase:', error);
        return false;
    }
}

/**
 * Maneja errores de Firestore con reintentos
 */
export async function retryFirestoreOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            console.warn(`Intento ${attempt} falló, reintentando...`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Obtiene timestamp del servidor
 */
export function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Obtiene timestamp actual como Date
 */
export function getCurrentTimestamp() {
    return firebase.firestore.Timestamp.now();
}

/**
 * Convierte timestamp de Firestore a Date
 */
export function timestampToDate(timestamp) {
    if (!timestamp) return null;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return new Date(timestamp);
}
