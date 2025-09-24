/**
 * CONFIGURACIÓN DE FIREBASE
 * Inicializa Firestore y permite el registro directo de profesionales
 */

const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.appspot.com",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

let app = null;
let db = null;
let auth = null;

// Inicializa Firebase solo una vez
function inicializarFirebase() {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase no está cargado');
    }
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    db = firebase.firestore();
    auth = firebase.auth();
    return db;
}

// Verifica si Firebase está disponible y Firestore está cargado
function verificarFirebase() {
    return typeof firebase !== 'undefined' && typeof firebase.firestore === 'function' && firebase.apps.length > 0;
}

function obtenerFirestore() {
    if (!db) {
        inicializarFirebase();
    }
    return db;
}

function obtenerAuth() {
    if (!auth) {
        inicializarFirebase();
    }
    return auth;
}

// ================= REGISTRO DE PROFESIONAL =================

import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

function inicializarRegistro() {
    try {
        db = obtenerFirestore();
        configurarFormularioRegistro();
        console.log('✅ Sistema de registro inicializado');
    } catch (error) {
        console.error('❌ Error inicializando registro:', error);
        throw error;
    }
}

function configurarFormularioRegistro() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', manejarEnvioRegistro);
        console.log('✅ Formulario de registro configurado');
    } else {
        console.warn('⚠️ Formulario de registro no encontrado');
    }
}

async function manejarEnvioRegistro(e) {
    e.preventDefault();

    try {
        mostrarCarga(true, 'Registrando profesional...');

        const nombre = document.getElementById('register-nombre')?.value?.trim();
        const apellidos = document.getElementById('register-apellidos')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const cesfam = document.getElementById('register-cesfam')?.value?.trim();
        const profession = document.getElementById('register-profession')?.value?.trim();

        if (!email || !nombre || !apellidos || !cesfam || !profession) {
            mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
            return;
        }

        // Guarda directamente en Firestore (colección profesionales)
        await db.collection('profesionales').add({
            nombre,
            apellidos,
            email,
            cesfam,
            profession,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue
                ? firebase.firestore.FieldValue.serverTimestamp()
                : new Date()
        });

        cerrarModal('register-modal');
        mostrarNotificacion('¡Registro exitoso! Tu información fue guardada.', 'success');
        e.target.reset();

    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarNotificacion('Error al registrar: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

// Exports (solo uno)
export {
    inicializarFirebase,
    verificarFirebase,
    obtenerFirestore,
    obtenerAuth,
    inicializarRegistro
};
