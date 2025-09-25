

let auth, db, storage, isInitialized = false;

/**
 * Inicializa Firebase
 */
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK no está cargado. Verifica los scripts en index.html');
            return false;
        }

        if (isInitialized && auth && db) {
            console.log('Firebase ya está inicializado');
            return true;
        }

        // Verificar si ya hay apps inicializadas
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('Nueva app Firebase inicializada');
        } else {
            app = firebase.apps[0];
            console.log('Usando app Firebase existente');
        }
        
        // Obtener servicios
        auth = firebase.auth(app);
        db = firebase.firestore(app);
        storage = firebase.storage ? firebase.storage(app) : null;
        
        // Configurar persistencia solo si no está configurada
        if (!isInitialized) {
            configurePersistence();
        }
        
        isInitialized = true;
        console.log('Firebase inicializado correctamente');
        return true;
        
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        
        // Intentar usar Firebase existente si falla la inicialización
        if (firebase.apps.length > 0) {
            try {
                auth = firebase.auth();
                db = firebase.firestore();
                storage = firebase.storage ? firebase.storage() : null;
                isInitialized = true;
                console.log('Usando Firebase existente tras error');
                return true;
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
            }
        }
        return false;
    }
}

/**
 * Configura la persistencia de Firestore
 */
function configurePersistence() {
    if (!db) return;
    
    try {
        db.enablePersistence({ 
            synchronizeTabs: false 
        }).then(() => {
            console.log('Persistencia offline habilitada');
        }).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistencia: Múltiples pestañas abiertas');
            } else if (err.code === 'unimplemented') {
                console.warn('Persistencia no soportada en este navegador');
            } else if (err.code === 'already-enabled') {
                console.log('Persistencia ya estaba habilitada');
            } else {
                console.warn('Error configurando persistencia:', err.code);
            }
        });
    } catch (syncError) {
        console.warn('Error con persistencia:', syncError);
    }
}

/**
 * Obtiene la instancia de Auth
 */
function getAuth() {
    if (!auth) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Firebase Auth');
        }
    }
    return auth;
}

/**
 * Obtiene la instancia de Firestore
 */
function getFirestore() {
    if (!db) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Firestore');
        }
    }
    return db;
}

/**
 * Obtiene la instancia de Storage
 */
function getStorage() {
    if (!storage) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Storage');
        }
    }
    return storage;
}

/**
 * Obtiene un timestamp del servidor - FUNCIÓN QUE FALTABA
 */
function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Función de retry para operaciones de Firebase
 */
 async function retryFirestoreOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const delay = Math.pow(2, i) * 1000;
            console.warn(`Operación falló, reintentando en ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Verifica si Firebase está inicializado
 */
function isFirebaseInitialized() {
    return isInitialized && !!auth && !!db;
}

/**
 * Obtiene el usuario actual
 */
function getCurrentUser() {
    if (!auth) return null;
    return auth.currentUser;
}

/**
 * Escuchar cambios en autenticación
 */
 function onAuthStateChanged(callback) {
    if (!auth) {
        if (!initializeFirebase()) {
            callback(null);
            return;
        }
    }
    return auth.onAuthStateChanged(callback);
}

/**
 * Crear colecciones iniciales si no existen
 */
async function createInitialCollections() {
    try {
        if (!db) return;
        
        const collections = [
            'profesionales',
            'pacientes', 
            'solicitudes_ingreso',
            'reingresos',
            'solicitudes_informacion',
            'citas',
            'historial_pacientes',
            'centros',
            'configuracion'
        ];

        for (const collectionName of collections) {
            try {
                const collectionRef = db.collection(collectionName);
                const snapshot = await collectionRef.limit(1).get();
                
                if (snapshot.empty) {
                    console.log(`Creando colección inicial: ${collectionName}`);
                    await collectionRef.add({
                        _created: firebase.firestore.FieldValue.serverTimestamp(),
                        _type: 'initial_document',
                        _version: '1.0'
                    });
                }
            } catch (collectionError) {
                console.warn(`Error verificando colección ${collectionName}:`, collectionError);
            }
        }
        
        console.log('Colecciones iniciales verificadas/creadas');
        
    } catch (error) {
        console.error('Error creando colecciones iniciales:', error);
    }
}

// Exportaciones adicionales para compatibilidad
 { db, auth, storage };

// Funciones de utilidad para Firestore
const FirestoreUtils = {
    /**
     * Crear documento con ID automático
     */
    async addDocument(collectionPath, data) {
        const db = getFirestore();
        return await db.collection(collectionPath).add({
            ...data,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    /**
     * Obtener documento por ID
     */
    async getDocument(collectionPath, documentId) {
        const db = getFirestore();
        const doc = await db.collection(collectionPath).doc(documentId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    /**
     * Actualizar documento
     */
    async updateDocument(collectionPath, documentId, data) {
        const db = getFirestore();
        return await db.collection(collectionPath).doc(documentId).update({
            ...data,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    /**
     * Eliminar documento
     */
    async deleteDocument(collectionPath, documentId) {
        const db = getFirestore();
        return await db.collection(collectionPath).doc(documentId).delete();
    },

    /**
     * Obtener colección completa
     */
    async getCollection(collectionPath, orderBy = null, limit = null) {
        const db = getFirestore();
        let query = db.collection(collectionPath);
        
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        
        if (limit) {
            query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Manejo de errores Firebase
function handleFirebaseError(error) {
    const errorMessages = {
        'permission-denied': 'Sin permisos para esta operación',
        'not-found': 'Documento no encontrado',
        'already-exists': 'El documento ya existe',
        'resource-exhausted': 'Límite de operaciones excedido',
        'failed-precondition': 'Condición previa fallida',
        'aborted': 'Operación abortada',
        'out-of-range': 'Fuera de rango',
        'unimplemented': 'Operación no implementada',
        'internal': 'Error interno',
        'unavailable': 'Servicio no disponible',
        'data-loss': 'Pérdida de datos',
        'unauthenticated': 'Usuario no autenticado'
    };

    const message = errorMessages[error.code] || error.message || 'Error desconocido';
    console.error('Firebase Error:', error.code, message);
    
    return {
        code: error.code,
        message: message,
        originalError: error
    };
}
window.initializeFirebase = function() {

}
