/*
 * MANEJO DE LOGIN DE USUARIOS
 * Gestiona el proceso de inicio de sesión
 */

import { obtenerAuth } from '../configuracion/firebase.js';
import { MENSAJES_ERROR } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

let auth;

/**
 * Inicializa el sistema de login
 */
function inicializarLogin() {
    try {
        auth = obtenerAuth();
        configurarFormularioLogin();
        console.log('✅ Sistema de login inicializado');
    } catch (error) {
        console.error('❌ Error inicializando login:', error);
        throw error;
    }
}

/**
 * Configura el formulario de login
 */
function configurarFormularioLogin() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', manejarEnvioLogin);
        console.log('✅ Formulario de login configurado');
    } else {
        console.warn('⚠️ Formulario de login no encontrado');
    }
}

/**
 * Maneja el envío del formulario de login
 */
async function manejarEnvioLogin(e) {
    e.preventDefault();

    try {
        console.log('🔐 Iniciando proceso de login...');

        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value?.trim();

        if (!email || !password) {
            mostrarNotificacion('Completa todos los campos', 'warning');
            return;
        }

        if (!validarEmail(email)) {
            mostrarNotificacion('Email inválido', 'warning');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);

        mostrarCarga(true, 'Iniciando sesión...');

        console.log('🔍 Intentando login con email:', email);

        // Usar la función correcta de Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login exitoso:', userCredential.user.uid);

        cerrarModal('login-modal');
        mostrarNotificacion('Sesión iniciada correctamente', 'success');

        e.target.reset();

    } catch (error) {
        console.error('❌ Error en login:', error);
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
    const mensajesFirebase = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/missing-password': 'Falta la contraseña'
    };
    
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

        const loginTab = document.querySelector('.modal-tab[data-tab="login"]');
        const registerTab = document.querySelector('.modal-tab[data-tab="register"]');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        // Remover active de ambos
        if (loginTab) loginTab.classList.remove('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.remove('active');

        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (loginForm) loginForm.classList.add('active');
        } else if (tab === 'register') {
            if (registerTab) registerTab.classList.add('active');
            if (registerForm) registerForm.classList.add('active');
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
    manejarOlvidoPassword
};
