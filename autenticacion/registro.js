/**
 * AUTENTICACION/REGISTRO.JS
 * Manejo del proceso de registro de usuarios
 */

import { getAuth, getFirestore } from '../configuracion/firebase.js';
import { showNotification, showLoading } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';

/**
 * Configura los event listeners para el formulario de registro
 */
export function setupRegisterForm() {
    try {
        console.log('🔧 Configurando formulario de registro...');
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegisterSubmit);
            console.log('✅ Formulario de registro configurado');
        } else {
            console.warn('⚠️ Formulario de registro no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando formulario de registro:', error);
    }
}

/**
 * Maneja el envío del formulario de registro
 * @param {Event} e - Evento de submit del formulario
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('📝 Iniciando proceso de registro...');
        
        const formData = extractFormData();
        
        if (!validateFormData(formData)) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleSubmitButton(submitBtn, true);
        
        showLoading(true, 'Registrando usuario...');
        
        console.log('📝 Creando usuario en Firebase Auth...');
        
        const auth = getAuth();
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;
        
        console.log('✅ Usuario creado en Auth:', user.uid);
        
        await saveProfessionalData(user.uid, formData);
        
        closeModal('login-modal');
        showNotification('Registro exitoso. Bienvenido al sistema SENDA', 'success');
        
        e.target.reset();
        
        console.log('✅ Usuario registrado exitosamente:', user.uid);
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        const errorMessage = getRegisterErrorMessage(error.code);
        showNotification(errorMessage, 'error');
        
    } finally {
        showLoading(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Extrae los datos del formulario de registro
 * @returns {Object} Datos del formulario
 */
function extractFormData() {
    return {
        nombre: document.getElementById('register-nombre')?.value?.trim(),
        apellidos: document.getElementById('register-apellidos')?.value?.trim(),
        email: document.getElementById('register-email')?.value?.trim(),
        password: document.getElementById('register-password')?.value?.trim(),
        profession: document.getElementById('register-profession')?.value,
        cesfam: document.getElementById('register-cesfam')?.value
    };
}

/**
 * Valida los datos del formulario de registro
 * @param {Object} formData - Datos del formulario
 * @returns {boolean} True si los datos son válidos
 */
function validateFormData(formData) {
    console.log('📝 Validando datos del formulario:', { ...formData, password: '***' });
    
    const requiredFields = ['nombre', 'apellidos', 'email', 'password', 'profession', 'cesfam'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            showNotification(`El campo ${field} es obligatorio`, 'warning');
            return false;
        }
    }
    
    if (!formData.email.endsWith('@senda.cl')) {
        showNotification('Solo se permiten emails @senda.cl', 'warning');
        return false;
    }
    
    if (formData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Guarda los datos del profesional en Firestore
 * @param {string} userId - ID del usuario
 * @param {Object} formData - Datos del formulario
 */
async function saveProfessionalData(userId, formData) {
    const db = getFirestore();
    
    const professionalData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        profession: formData.profession,
        cesfam: formData.cesfam,
        activo: true,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        uid: userId
    };
    
    console.log('📝 Guardando datos del profesional en Firestore...');
    
    await db.collection('profesionales').doc(userId).set(professionalData);
    
    console.log('✅ Profesional guardado en Firestore');
}

/**
 * Obtiene el mensaje de error apropiado para el código de error
 * @param {string} errorCode - Código de error de Firebase Auth
 * @returns {string} Mensaje de error legible
 */
function getRegisterErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Registro no permitido',
        'auth/weak-password': 'Contraseña muy débil',
        'permission-denied': 'Sin permisos para crear el perfil profesional'
    };
    
    return `Error al registrarse: ${errorMessages[errorCode] || 'Error desconocido'}`;
}
