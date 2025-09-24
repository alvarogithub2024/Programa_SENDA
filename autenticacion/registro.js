/**
 * MANEJO DE LOGIN DE USUARIOS
 * Gestiona el proceso de inicio de sesión
 */

import { obtenerAuth, obtenerFirestore } from '../configuracion/firebase.js';
import { MENSAJES_ERROR } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

let auth;
let db = obtenerFirestore();

/**
 * Inicializa el sistema de login
 */
function inicializarRegistro() {
    try {
        auth = obtenerAuth();
        configurarFormularioRegistro();
        console.log('✅ Sistema de registro inicializado');
    } catch (error) {
        console.error('❌ Error inicializando registro:', error);
        throw error;
    }
}

/**
 * Configura el formulario de login
 */
function configurarFormularioRegistro() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', manejarEnvioRegistro);
        console.log('✅ Formulario de registro configurado');
    } else {
        console.warn('⚠️ Formulario de registro no encontrado');
    }
}

/**
 * Maneja el envío del formulario de login
 */
async function manejarEnvioRegistro(e) {
    e.preventDefault();

    try {
        mostrarCarga(true, 'Creando cuenta...');

        const nombre = document.getElementById('register-nombre')?.value?.trim();
        const apellidos = document.getElementById('register-apellidos')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const password = document.getElementById('register-password')?.value?.trim();
        const cesfam = document.getElementById('register-cesfam')?.value?.trim();
        const profession = document.getElementById('register-profession')?.value?.trim();

        if (!email || !password || !nombre || !apellidos || !cesfam || !profession) {
            mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
            return;
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Registrar profesional en Firestore
        await db.collection('profesionales').doc(uid).set({
            nombre,
            apellidos,
            email,
            cesfam,
            profession,
            uid,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        cerrarModal('register-modal');
        mostrarNotificacion('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');
        e.target.reset();

    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarNotificacion(obtenerMensajeError(error), 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Valida el formato de email
 */
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Obtiene el mensaje de error apropiado
 */
function obtenerMensajeError(error) {
    const mensajesFirebase = MENSAJES_ERROR.FIREBASE;
    const mensajePersonalizado = mensajesFirebase[error.code];
    
    if (mensajePersonalizado) {
        return mensajePersonalizado;
    }
    
    return `Error al iniciar sesión: ${error.message}`;
}

/**
 * Cambia entre tabs de login y registro
 */
function cambiarTabLogin(tab) {
    try {
        console.log('🔄 Cambiando tab a:', tab);

        const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
        const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
            if (registerForm) registerForm.classList.remove('active');
        } else if (tab === 'register') {
            if (registerTab) registerTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (registerForm) registerForm.classList.add('active');
            if (loginForm) loginForm.classList.remove('active');
        }
    } catch (error) {
        console.error('Error cambiando tab de login:', error);
    }
}

/**
 * Resetea el formulario de login
 */
function resetearFormularioLogin() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
        
        // Limpiar errores
        const campos = loginForm.querySelectorAll('.error');
        campos.forEach(campo => campo.classList.remove('error'));
    }
}

/**
 * Maneja el olvido de contraseña
 */
async function manejarOlvidoPassword() {
    try {
        const email = document.getElementById('login-email')?.value?.trim();
        
        if (!email) {
            mostrarNotificacion('Ingresa tu email para recuperar la contraseña', 'warning');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacion('Email inválido', 'warning');
            return;
        }

        mostrarCarga(true, 'Enviando email de recuperación...');

        await auth.sendPasswordResetEmail(email);

        mostrarNotificacion('Email de recuperación enviado. Revisa tu bandeja de entrada.', 'success');
        cerrarModal('login-modal');

    } catch (error) {
        console.error('Error enviando email de recuperación:', error);
        mostrarNotificacion(obtenerMensajeError(error), 'error');
    } finally {
        mostrarCarga(false);
    }
}

export {
    inicializarLogin,
    cambiarTabLogin,
    resetearFormularioLogin,
    manejarOlvidoPassword,
    inicializarRegistro,
};
