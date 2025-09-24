// 1. CORREGIR firebase.js
/**
 * CONFIGURACION/FIREBASE.JS - VERSIÓN CORREGIDA
 */

import { FIREBASE_CONFIG } from './constantes.js';

let auth, db, isInitialized = false;

/**
 * Inicializa Firebase
 */
export function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no está cargado');
        }

        if (isInitialized && auth && db) {
            console.log('✅ Firebase ya está inicializado');
            return;
        }

        // ✅ EVITAR MÚLTIPLE INICIALIZACIÓN
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('🔧 Nueva app Firebase inicializada');
        } else {
            app = firebase.apps[0];
            console.log('✅ Usando app Firebase existente');
        }
        
        // Obtener servicios
        auth = firebase.auth(app);
        db = firebase.firestore(app);
        
        // NO configurar persistencia si ya está configurada
        if (!isInitialized) {
            configurePersistence();
        }
        
        isInitialized = true;
        console.log('✅ Firebase inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        // NO lanzar error, continuar con lo que tenemos
        if (firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
            isInitialized = true;
        }
    }
}

/**
 * Configura la persistencia SOLO si no está ya configurada
 */
function configurePersistence() {
    if (!db) return;
    
    // ✅ VERIFICAR SI PERSISTENCIA YA ESTÁ HABILITADA
    try {
        db.enablePersistence({ 
            synchronizeTabs: false  // ✅ CAMBIAR A FALSE para evitar conflictos entre pestañas
        }).then(() => {
            console.log('💾 Persistencia offline habilitada');
        }).catch((err) => {
            // ✅ MANEJAR TODOS LOS POSIBLES ERRORES
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Persistencia: Ya hay otra pestaña activa');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistencia no soportada en este navegador');
            } else if (err.code === 'already-enabled') {
                console.log('✅ Persistencia ya estaba habilitada');
            } else {
                console.warn('⚠️ Error configurando persistencia:', err.code, err.message);
            }
            // ✅ LA APP CONTINÚA FUNCIONANDO SIN PERSISTENCIA
        });
    } catch (syncError) {
        console.warn('⚠️ Error sincronizando persistencia:', syncError);
    }
}

// ✅ FUNCIONES DE ACCESO SEGURAS
export function getAuth() {
    if (!isInitialized) {
        initializeFirebase();
    }
    return auth;
}

export function getFirestore() {
    if (!isInitialized) {
        initializeFirebase();
    }
    return db;
}

export function isFirebaseInitialized() {
    return isInitialized;
}

// ✅ EXPORTACIÓN ADICIONAL PARA COMPATIBILIDAD
export { db };

// 2. CORREGIR main.js - INICIALIZACIÓN MEJORADA
/**
 * MAIN.JS - VERSIÓN CORREGIDA
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 SISTEMA SENDA PUENTE ALTO v2.0');
    console.log('=====================================');
    
    try {
        // ✅ VERIFICAR QUE FIREBASE ESTÉ CARGADO ANTES DE CONTINUAR
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no está cargado. Verifica los scripts en index.html');
        }
        
        console.log('🔧 Inicializando Firebase...');
        
        // ✅ IMPORTAR E INICIALIZAR FIREBASE
        const { initializeFirebase, isFirebaseInitialized } = await import('./configuracion/firebase.js');
        initializeFirebase();
        
        // ✅ VERIFICAR INICIALIZACIÓN
        if (!isFirebaseInitialized()) {
            throw new Error('Firebase no se inicializó correctamente');
        }
        console.log('✅ Firebase verificado y listo');
        
        // ✅ IMPORTAR MÓDULOS DESPUÉS DE FIREBASE
        const { setupAuth } = await import('./autenticacion/sesion.js');
        const { setupTabs } = await import('./navegacion/tabs.js');
        const { setupFormularios } = await import('./formularios/formulario-paciente.js');
        const { setupEventListeners } = await import('./navegacion/eventos.js');
        
        console.log('🔧 Configurando componentes...');
        setupAuth();
        setupTabs();
        setupFormularios(); 
        setupEventListeners();
        
        // ✅ INICIALIZAR MÓDULOS ESPECÍFICOS
        await initializeModules();
        
        console.log('✅ Sistema SENDA inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        showErrorToUser(error);
    }
});

async function initializeModules() {
    try {
        // ✅ IMPORTAR DINÁMICAMENTE PARA EVITAR ERRORES DE DEPENDENCIAS
        const modules = [
            () => import('./calendario/agenda.js').then(m => m.initCalendar?.()),
            () => import('./pacientes/gestor-pacientes.js').then(m => m.initPatientsManager?.()),
            () => import('./seguimiento/timeline.js').then(m => m.initTimeline?.()),
        ];
        
        for (const moduleLoader of modules) {
            try {
                await moduleLoader();
            } catch (error) {
                console.warn('⚠️ Error inicializando módulo:', error);
            }
        }
        
    } catch (error) {
        console.error('Error inicializando módulos:', error);
    }
}

function showErrorToUser(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #ef4444; color: white; padding: 16px; border-radius: 8px;
        max-width: 300px; font-family: system-ui;
    `;
    errorDiv.innerHTML = `
        <strong>Error de inicialización</strong><br>
        ${error.message}<br>
        <button onclick="location.reload()" style="background: white; color: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; margin-top: 8px; cursor: pointer;">
            Recargar página
        </button>
    `;
    document.body.appendChild(errorDiv);
}

// 3. VERIFICAR index.html - ORDEN CORRECTO DE SCRIPTS
/*
ASEGÚRATE QUE EN index.html TENGAS ESTE ORDEN:

1. Firebase SDKs PRIMERO:
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

2. EmailJS (opcional):
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>

3. TU SCRIPT AL FINAL:
<script type="module" src="main.js"></script>
*/

// 4. CONSTANTES.JS - VERIFICA TU CONFIGURACIÓN
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",

// 5. REGLAS DE FIRESTORE - AGREGAR EN FIREBASE CONSOLE
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir creación de solicitudes desde la web pública
    match /solicitudes_ingreso/{document} {
      allow create: if true;
    }
    
    match /reingresos/{document} {
      allow create: if true;
    }
    
    match /solicitudes_informacion/{document} {
      allow create: if true;
    }
  }
}
*/
