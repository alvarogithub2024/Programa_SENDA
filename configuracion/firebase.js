// CONFIGURACION/FIREBASE.JS - VERSIÓN SIN IMPORT/EXPORT

// Dependencias: window.FIREBASE_CONFIG debe estar definido en constantes.js

var auth, db, storage, isInitialized = false;

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

        var app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(window.FIREBASE_CONFIG);
            console.log('Nueva app Firebase inicializada');
        } else {
            app = firebase.apps[0];
            console.log('Usando app Firebase existente');
        }

        auth = firebase.auth(app);
        db = firebase.firestore(app);
        storage = firebase.storage ? firebase.storage(app) : null;

        if (!isInitialized) {
            configurePersistence();
        }

        isInitialized = true;
        console.log('Firebase inicializado correctamente');
        return true;

    } catch (error) {
        console.error('Error inicializando Firebase:', error);

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

function configurePersistence() {
    if (!db) return;
    try {
        db.enablePersistence({ synchronizeTabs: false }).then(function() {
            console.log('Persistencia offline habilitada');
        }).catch(function(err) {
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

function getAuth() {
    if (!auth) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Firebase Auth');
        }
    }
    return auth;
}

function getFirestore() {
    if (!db) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Firestore');
        }
    }
    return db;
}

function getStorage() {
    if (!storage) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Storage');
        }
    }
    return storage;
}

function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

async function retryFirestoreOperation(operation, maxRetries) {
    maxRetries = maxRetries || 3;
    for (var i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            var delay = Math.pow(2, i) * 1000;
            console.warn('Operación falló, reintentando en ' + delay + 'ms...', error);
            await new Promise(function(resolve) { setTimeout(resolve, delay); });
        }
    }
}

function isFirebaseInitialized() {
    return isInitialized && !!auth && !!db;
}

function getCurrentUser() {
    if (!auth) return null;
    return auth.currentUser;
}

function onAuthStateChanged(callback) {
    if (!auth) {
        if (!initializeFirebase()) {
            callback(null);
            return;
        }
    }
    return auth.onAuthStateChanged(callback);
}

async function createInitialCollections() {
    try {
        if (!db) return;
        var collections = [
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

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i];
            try {
                var collectionRef = db.collection(collectionName);
                var snapshot = await collectionRef.limit(1).get();
                if (snapshot.empty) {
                    console.log('Creando colección inicial: ' + collectionName);
                    await collectionRef.add({
                        _created: firebase.firestore.FieldValue.serverTimestamp(),
                        _type: 'initial_document',
                        _version: '1.0'
                    });
                }
            } catch (collectionError) {
                console.warn('Error verificando colección ' + collectionName + ':', collectionError);
            }
        }
        console.log('Colecciones iniciales verificadas/creadas');
    } catch (error) {
        console.error('Error creando colecciones iniciales:', error);
    }
}

function handleFirebaseError(error) {
    var errorMessages = {
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
    var message = errorMessages[error.code] || error.message || 'Error desconocido';
    console.error('Firebase Error:', error.code, message);
    return {
        code: error.code,
        message: message,
        originalError: error
    };
}

// Utilidades Firestore
var FirestoreUtils = {
    addDocument: async function(collectionPath, data) {
        var db = getFirestore();
        return await db.collection(collectionPath).add(
            Object.assign({}, data, {
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            })
        );
    },
    getDocument: async function(collectionPath, documentId) {
        var db = getFirestore();
        var doc = await db.collection(collectionPath).doc(documentId).get();
        return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : null;
    },
    updateDocument: async function(collectionPath, documentId, data) {
        var db = getFirestore();
        return await db.collection(collectionPath).doc(documentId).update(
            Object.assign({}, data, {
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            })
        );
    },
    deleteDocument: async function(collectionPath, documentId) {
        var db = getFirestore();
        return await db.collection(collectionPath).doc(documentId).delete();
    },
    getCollection: async function(collectionPath, orderBy, limit) {
        var db = getFirestore();
        var query = db.collection(collectionPath);
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        if (limit) {
            query = query.limit(limit);
        }
        var snapshot = await query.get();
        return snapshot.docs.map(function(doc) { return Object.assign({ id: doc.id }, doc.data()); });
    }
};

// Exportar globalmente
window.initializeFirebase = initializeFirebase;
window.configurePersistence = configurePersistence;
window.getAuth = getAuth;
window.getFirestore = getFirestore;
window.getStorage = getStorage;
window.getServerTimestamp = getServerTimestamp;
window.retryFirestoreOperation = retryFirestoreOperation;
window.isFirebaseInitialized = isFirebaseInitialized;
window.getCurrentUser = getCurrentUser;
window.onAuthStateChanged = onAuthStateChanged;
window.createInitialCollections = createInitialCollections;
window.handleFirebaseError = handleFirebaseError;
window.FirestoreUtils = FirestoreUtils;
// Para compatibilidad directa
window.db = db;
window.auth = auth;
window.storage = storage;
