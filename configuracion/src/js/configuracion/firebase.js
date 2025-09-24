// ====================================
// CONFIGURACIÓN DE FIREBASE
// ====================================

const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Verificación de Firebase
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase no está cargado');
  alert('Error: Firebase no está disponible. Verifica las librerías.');
}

// Variables globales Firebase
let auth, db;

// Inicialización Firebase
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
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
    return { auth, db };
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
  }
}

// Exportar funciones
window.SENDASystem = window.SENDASystem || {};
window.SENDASystem.firebase = {
  init: initFirebase,
  getAuth: () => auth,
  getDb: () => db
};
