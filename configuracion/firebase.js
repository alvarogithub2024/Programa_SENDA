/**
 * CONFIGURACIÓN DE FIREBASE
 * Inicializa Firestore y Auth, permite el registro completo de profesionales
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

let db, auth;

// Inicializa Firebase solo una vez
function inicializarFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    auth = firebase.auth();

    console.log('✅ Firebase inicializado correctamente');
    return { db, auth };
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

// ================= REGISTRO DE PROFESIONAL COMPLETO =================

function inicializarRegistro() {
    try {
        // Asegurar que Firebase esté inicializado
        if (!db || !auth) {
            inicializarFirebase();
        }

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
    console.log('🔐 Iniciando proceso de registro completo...');

    try {
        mostrarCarga(true, 'Creando cuenta de profesional...');

        // Obtener datos del formulario
        const nombre = document.getElementById('register-nombre')?.value?.trim();
        const apellidos = document.getElementById('register-apellidos')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const password = document.getElementById('register-password')?.value?.trim();
        const cesfam = document.getElementById('register-cesfam')?.value?.trim();
        const profession = document.getElementById('register-profession')?.value?.trim();

        // Validaciones
        if (!email || !nombre || !apellidos || !cesfam || !profession || !password) {
            mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
            return;
        }

        if (password.length < 6) {
            mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);

        console.log('📧 Creando usuario en Firebase Auth...');

        // PASO 1: Crear usuario en Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ Usuario Auth creado:', user.uid);
        console.log('💾 Guardando datos en Firestore...');

        // PASO 2: Guardar datos del profesional en Firestore usando el UID
        await db.collection('profesionales').doc(user.uid).set({
            nombre,
            apellidos,
            email,
            cesfam,
            profession,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            uid: user.uid // Guardar el UID para referencias
        });

        console.log('✅ Datos guardados en Firestore');

        // PASO 3: Actualizar perfil del usuario
        await user.updateProfile({
            displayName: `${nombre} ${apellidos}`
        });

        console.log('✅ Perfil de usuario actualizado');

        // Éxito total
        cerrarModal('login-modal');
        mostrarExito(`¡Registro exitoso! Bienvenido ${nombre} ${apellidos}`, 5000);

        // Resetear formulario
        e.target.reset();

        // El usuario ya está logueado automáticamente después del registro
        console.log('🎉 Registro completo exitoso');

    } catch (error) {
        console.error('❌ Error en registro:', error);

        let mensajeError = 'Error al registrar: ';

        // Mensajes específicos de Firebase Auth
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensajeError += 'Este email ya está registrado';
                break;
            case 'auth/invalid-email':
                mensajeError += 'Email inválido';
                break;
            case 'auth/weak-password':
                mensajeError += 'Contraseña muy débil';
                break;
            case 'auth/operation-not-allowed':
                mensajeError += 'Registro no permitido. Contacta al administrador';
                break;
            default:
                mensajeError += error.message;
        }

        mostrarNotificacion(mensajeError, 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

export {
    inicializarFirebase,
    obtenerFirestore,
    obtenerAuth,
    inicializarRegistro,
    configurarFormularioRegistro
};
