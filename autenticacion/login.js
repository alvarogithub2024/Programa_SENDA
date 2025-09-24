/**
 * AUTENTICACION/LOGIN.JS
 * Sistema completo de login - VERSIÓN CORREGIDA
 */

import { getAuth } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';

/**
 * Configura el formulario de login
 */
export function setupLoginForm() {
    try {
        console.log('🔧 Configurando formulario de login...');
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginSubmit);
            setupLoginValidation();
            console.log('✅ Formulario de login configurado');
        } else {
            console.warn('⚠️ Formulario de login no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando formulario de login:', error);
    }
}

/**
 * Configura validación en tiempo real para login
 */
function setupLoginValidation() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (emailInput) {
        emailInput.addEventListener('input', (e) => {
            validateEmailField(e.target);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            validatePasswordField(e.target);
        });
    }
}

/**
 * Valida campo de email
 */
function validateEmailField(input) {
    const email = input.value.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (email && !isValidEmail) {
        input.classList.add('error');
        showFieldError(input, 'Email inválido');
    } else if (email && !email.endsWith('@senda.cl')) {
        input.classList.add('error');
        showFieldError(input, 'Debe ser un email @senda.cl');
    } else {
        input.classList.remove('error');
        clearFieldError(input);
    }
}

/**
 * Valida campo de contraseña
 */
function validatePasswordField(input) {
    const password = input.value;
    
    if (password && password.length < 6) {
        input.classList.add('error');
        showFieldError(input, 'Mínimo 6 caracteres');
    } else {
        input.classList.remove('error');
        clearFieldError(input);
    }
}

/**
 * Muestra error en campo
 */
function showFieldError(input, message) {
    let errorElement = input.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

/**
 * Limpia error del campo
 */
function clearFieldError(input) {
    const errorElement = input.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Maneja el envío del formulario de login
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('🔑 Iniciando proceso de login...');
        
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value?.trim();
        
        // Validaciones básicas
        if (!email || !password) {
            showNotification('Completa todos los campos', 'warning');
            return;
        }
        
        if (!email.endsWith('@senda.cl')) {
            showNotification('Solo se permiten emails @senda.cl', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleSubmitButton(submitBtn, true);
        
        console.log('🔐 Autenticando usuario:', email);
        
        // Intentar login con Firebase Auth
        const auth = getAuth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        console.log('✅ Login exitoso para:', userCredential.user.uid);
        
        // Limpiar formulario
        e.target.reset();
        
        // Cerrar modal
        closeModal('login-modal');
        
        showNotification('¡Bienvenido al sistema SENDA!', 'success');
        
        // La actualización de la UI se maneja automáticamente por onAuthStateChanged
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        const errorMessage = getLoginErrorMessage(error.code);
        showNotification(errorMessage, 'error');
        
        // Enfocar campo apropiado según el error
        if (error.code === 'auth/user-not-found') {
            document.getElementById('login-email')?.focus();
        } else if (error.code === 'auth/wrong-password') {
            document.getElementById('login-password')?.focus();
        }
        
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Obtiene mensaje de error de login apropiado
 */
function getLoginErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No existe una cuenta con este email',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/invalid-credential': 'Credenciales inválidas'
    };
    
    return errorMessages[errorCode] || 'Error al iniciar sesión. Intenta nuevamente.';
}
