/**
 * AUTENTICACION/LOGIN.JS
 * Manejo del proceso de login de usuarios
 */

import { getAuth } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';
import { showLoading } from '../utilidades/notificaciones.js';

/**
 * Configura los event listeners para el formulario de login
 */
export function setupLoginForm() {
    try {
        console.log('🔧 Configurando formulario de login...');
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginSubmit);
            console.log('✅ Formulario de login configurado');
        } else {
            console.warn('⚠️ Formulario de login no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando formulario de login:', error);
    }
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} e - Evento de submit del formulario
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('🔐 Iniciando proceso de login...');
        
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value?.trim();
        
        if (!email || !password) {
            showNotification('Completa todos los campos', 'warning');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleSubmitButton(submitBtn, true);
        
        showLoading(true, 'Iniciando sesión...');
        
        console.log('🔐 Intentando login con email:', email);
        
        const auth = getAuth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Login exitoso:', userCredential.user.uid);
        
        closeModal('login-modal');
        showNotification('Sesión iniciada correctamente', 'success');
        
        e.target.reset();
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        const errorMessage = getLoginErrorMessage(error.code);
        showNotification(errorMessage, 'error');
        
    } finally {
        showLoading(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Obtiene el mensaje de error apropiado para el código de error
 * @param {string} errorCode - Código de error de Firebase Auth
 * @returns {string} Mensaje de error legible
 */
function getLoginErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
    };
    
    return `Error al iniciar sesión: ${errorMessages[errorCode] || 'Error desconocido'}`;
}
