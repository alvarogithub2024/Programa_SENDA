// CONFIGURACION/FIREBASE.JS - VERSIÓN CORREGIDA

var auth = null, db = null, storage = null, isInitialized = false;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK no está cargado');
            return false;
        }
        if (!window.FIREBASE_CONFIG) {
            console.error('FIREBASE_CONFIG no definida');
            return false;
        }

        if (isInitialized && auth && db) {
            console.log('Firebase ya está inicializado');
            return true;
        }

        var app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(window.FIREBASE_CONFIG);
            console.log('✅ Nueva app Firebase inicializada');
        } else {
            app = firebase.apps[0];
            console.log('ℹ️ Usando app Firebase existente');
        }

        auth = firebase.auth(app);
        db = firebase.firestore(app);
        storage = firebase.storage ? firebase.storage(app) : null;

        // Habilitar persistencia sin configuración obsoleta
        if (!isInitialized) {
            configurePersistence();
        }

        isInitialized = true;
        
        // Helpers globales
        window.db = db;
        window.auth = auth;
        window.storage = storage;
        window.getFirestore = () => db;
        window.getAuth = () => auth;
        window.getStorage = () => storage;
        window.getServerTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
        window.isFirebaseInitialized = () => isInitialized && !!auth && !!db;
        
        return true;

    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        return false;
    }
}

function configurePersistence() {
    if (!db) return;
    try {
        db.enablePersistence({ synchronizeTabs: false })
            .then(function() {
                console.log('Persistencia offline habilitada');
            })
            .catch(function(err) {
                if (err.code === 'failed-precondition') {
                    console.warn('Persistencia: Múltiples pestañas abiertas');
                } else if (err.code === 'unimplemented') {
                    console.warn('Persistencia no soportada');
                } else {
                    console.warn('Error configurando persistencia:', err.code);
                }
            });
    } catch (syncError) {
        console.warn('Error con persistencia:', syncError);
    }
}

// Resto de funciones helper...
function getFirestore() {
    if (!db) {
        if (!initializeFirebase()) {
            throw new Error('No se pudo inicializar Firestore');
        }
    }
    return db;
}

// Exportar globalmente
window.initializeFirebase = initializeFirebase;
window.getFirestore = getFirestore;
window.getAuth = () => auth;
window.getStorage = () => storage;
window.getServerTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
window.isFirebaseInitialized = () => isInitialized && !!auth && !!db;

// Inicializar automáticamente
initializeFirebase();
