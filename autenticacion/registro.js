/**
 * AUTENTICACION/REGISTRO.JS
 * Sistema completo de registro de profesionales - VERSIÓN CORREGIDA
 */

import { getAuth, getFirestore, getServerTimestamp, retryFirestoreOperation } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';
import { isValidEmail } from '../utilidades/validaciones.js';

/**
 * Configura el formulario de registro
 */
export function setupRegisterForm() {
    try {
        console.log('🔧 Configurando formulario de registro...');
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegisterSubmit);
            setupRegisterValidation();
            console.log('✅ Formulario de registro configurado');
        } else {
            console.warn('⚠️ Formulario de registro no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando formulario de registro:', error);
    }
}

/**
 * Configura la validación del formulario de registro
 */
function setupRegisterValidation() {
    try {
        const form = document.getElementById('register-form');
        if (!form) return;

        // Validación de email en tiempo real
        const emailInput = document.getElementById('register-email');
        if (emailInput) {
            emailInput.addEventListener('input', validateEmailField);
            emailInput.addEventListener('blur', validateEmailField);
        }

        // Validación de contraseña
        const passwordInput = document.getElementById('register-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', validatePasswordField);
        }

        // Validación de campos requeridos
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', (e) => validateRequiredField(e.target));
        });

    } catch (error) {
        console.error('Error configurando validación de registro:', error);
    }
}

/**
 * Valida el campo de email
 */
function validateEmailField(e) {
    const email = e.target.value.trim();
    const emailField = e.target;
    
    if (!email) {
        showFieldError(emailField, 'El email es obligatorio');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showFieldError(emailField, 'Email inválido');
        return false;
    }
    
    if (!email.endsWith('@senda.cl')) {
        showFieldError(emailField, 'Solo se permiten emails @senda.cl');
        return false;
    }
    
    clearFieldError(emailField);
    return true;
}

/**
 * Valida el campo de contraseña
 */
function validatePasswordField(e) {
    const password = e.target.value;
    const passwordField = e.target;
    
    if (password.length > 0 && password.length < 6) {
        showFieldError(passwordField, 'La contraseña debe tener al menos 6 caracteres');
        return false;
    }
    
    clearFieldError(passwordField);
    return true;
}

/**
 * Valida campos requeridos
 */
function validateRequiredField(field) {
    const value = field.value.trim();
    
    if (!value) {
        showFieldError(field, 'Este campo es obligatorio');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

/**
 * Muestra error en campo
 */
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remover error existente
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Agregar nuevo error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
}

/**
 * Limpia error en campo
 */
function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Maneja el envío del formulario de registro
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    console.log('🔧 Iniciando proceso de registro...');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        // Extraer datos del formulario
        const formData = extractFormData();
        
        // Validar datos
        if (!validateFormData(formData)) {
            return;
        }
        
        // Mostrar loading
        toggleSubmitButton(submitBtn, true);
        showNotification('Registrando usuario...', 'info');
        
        console.log('👤 Creando usuario en Firebase Auth...');
        
        // Crear usuario en Firebase Auth
        const auth = getAuth();
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;
        
        console.log('✅ Usuario creado en Auth:', user.uid);
        
        // Actualizar perfil del usuario
        await user.updateProfile({
            displayName: `${formData.nombre} ${formData.apellidos}`
        });
        
        // Guardar datos del profesional en Firestore
        await saveProfessionalData(user.uid, formData);
        
        console.log('✅ Usuario registrado exitosamente');
        
        // Éxito
        showNotification('Registro exitoso. Bienvenido al sistema SENDA', 'success');
        
        // Limpiar formulario y cerrar modal
        e.target.reset();
        closeModal('login-modal');
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        const errorMessage = getRegisterErrorMessage(error.code || error.message);
        showNotification(errorMessage, 'error');
        
    } finally {
        toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Extrae los datos del formulario
 */
function extractFormData() {
    return {
        nombre: document.getElementById('register-nombre')?.value?.trim() || '',
        apellidos: document.getElementById('register-apellidos')?.value?.trim() || '',
        email: document.getElementById('register-email')?.value?.trim() || '',
        password: document.getElementById('register-password')?.value || '',
        profession: document.getElementById('register-profession')?.value || '',
        cesfam: document.getElementById('register-cesfam')?.value || ''
    };
}

/**
 * Valida los datos del formulario
 */
function validateFormData(formData) {
    console.log('🔍 Validando datos del formulario...', { ...formData, password: '***' });
    
    // Campos requeridos
    const requiredFields = [
        { field: 'nombre', name: 'Nombre' },
        { field: 'apellidos', name: 'Apellidos' },
        { field: 'email', name: 'Email' },
        { field: 'password', name: 'Contraseña' },
        { field: 'profession', name: 'Profesión' },
        { field: 'cesfam', name: 'CESFAM' }
    ];
    
    for (const { field, name } of requiredFields) {
        if (!formData[field]) {
            showNotification(`El campo ${name} es obligatorio`, 'warning');
            focusField(`register-${field === 'profession' ? 'profession' : field === 'cesfam' ? 'cesfam' : field}`);
            return false;
        }
    }
    
    // Validar email
    if (!isValidEmail(formData.email)) {
        showNotification('Email inválido', 'warning');
        focusField('register-email');
        return false;
    }
    
    if (!formData.email.endsWith('@senda.cl')) {
        showNotification('Solo se permiten emails @senda.cl', 'warning');
        focusField('register-email');
        return false;
    }
    
    // Validar contraseña
    if (formData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        focusField('register-password');
        return false;
    }
    
    // Validar nombre y apellidos (solo letras y espacios)
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/;
    if (!nameRegex.test(formData.nombre)) {
        showNotification('El nombre solo puede contener letras', 'warning');
        focusField('register-nombre');
        return false;
    }
    
    if (!nameRegex.test(formData.apellidos)) {
        showNotification('Los apellidos solo pueden contener letras', 'warning');
        focusField('register-apellidos');
        return false;
    }
    
    return true;
}

/**
 * Enfoca un campo específico
 */
function focusField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.focus();
        field.classList.add('error');
    }
}

/**
 * Guarda los datos del profesional en Firestore
 */
async function saveProfessionalData(userId, formData) {
    console.log('💾 Guardando datos del profesional en Firestore...');
    
    const db = getFirestore();
    
    const professionalData = {
        uid: userId,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        profession: formData.profession,
        especialidad: getProfessionName(formData.profession),
        cesfam: formData.cesfam,
        activo: true,
        fechaCreacion: getServerTimestamp(),
        fechaUltimaActividad: getServerTimestamp(),
        permisos: {
            solicitudes: formData.profession === 'asistente_social',
            agenda: true,
            pacientes: true,
            seguimiento: true
        },
        configuracion: {
            notificaciones: true,
            alertasCriticas: formData.profession === 'asistente_social',
            horariosDisponibles: []
        }
    };
    
    try {
        await retryFirestoreOperation(async () => {
            await db.collection('profesionales').doc(userId).set(professionalData);
        });
        
        console.log('✅ Profesional guardado en Firestore');
        
        // Crear configuración inicial del profesional
        await createInitialProfessionalSetup(userId, formData);
        
    } catch (error) {
        console.error('❌ Error guardando profesional:', error);
        throw error;
    }
}

/**
 * Crea configuración inicial del profesional
 */
async function createInitialProfessionalSetup(userId, formData) {
    try {
        const db = getFirestore();
        
        // Crear horarios predeterminados (8:00-17:00 L-V)
        const horariosRef = db.collection('horarios_profesionales');
        const diasSemana = [1, 2, 3, 4, 5]; // Lunes a Viernes
        
        const batch = db.batch();
        
        for (const dia of diasSemana) {
            const horarioDoc = horariosRef.doc();
            batch.set(horarioDoc, {
                profesionalId: userId,
                diaSemana: dia,
                horaInicio: '08:00',
                horaFin: '17:00',
                disponible: true,
                fechaCreacion: getServerTimestamp()
            });
        }
        
        await batch.commit();
        
        console.log('✅ Configuración inicial del profesional creada');
        
    } catch (error) {
        console.warn('⚠️ Error creando configuración inicial:', error);
        // No lanzar error, es opcional
    }
}

/**
 * Obtiene el nombre completo de la profesión
 */
function getProfessionName(professionCode) {
    const professions = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional'
    };
    
    return professions[professionCode] || professionCode;
}

/**
 * Obtiene mensaje de error apropiado
 */
function getRegisterErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Registro no permitido',
        'auth/weak-password': 'Contraseña muy débil',
        'permission-denied': 'Sin permisos para crear el perfil profesional',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
    };
    
    return `Error al registrarse: ${errorMessages[errorCode] || 'Error desconocido'}`;
}

/**
 * Verifica si un email ya está registrado
 */
export async function checkEmailExists(email) {
    try {
        const db = getFirestore();
        const profRef = db.collection('profesionales');
        const query = profRef.where('email', '==', email.toLowerCase());
        const snapshot = await query.get();
        
        return !snapshot.empty;
        
    } catch (error) {
        console.error('Error verificando email:', error);
        return false;
    }
}

/**
 * Genera sugerencia de email basada en nombre
 */
export function generateEmailSuggestion(nombre, apellidos) {
    try {
        if (!nombre || !apellidos) return '';
        
        const cleanNombre = nombre.toLowerCase().replace(/[^a-z]/g, '');
        const cleanApellido = apellidos.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
        
        const suggestions = [
            `${cleanNombre}.${cleanApellido}@senda.cl`,
            `${cleanNombre}${cleanApellido}@senda.cl`,
            `${cleanNombre.charAt(0)}${cleanApellido}@senda.cl`,
            `${cleanNombre}${cleanApellido.charAt(0)}@senda.cl`
        ];
        
        return suggestions[0];
        
    } catch (error) {
        console.error('Error generando sugerencia de email:', error);
        return '';
    }
}

/**
 * Valida la fortaleza de la contraseña
 */
export function validatePasswordStrength(password) {
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
        score,
        checks,
        strength: score < 2 ? 'débil' : score < 4 ? 'media' : 'fuerte'
    };
}

/**
 * Configurar indicador de fortaleza de contraseña
 */
export function setupPasswordStrengthIndicator() {
    const passwordInput = document.getElementById('register-password');
    if (!passwordInput) return;
    
    // Crear indicador si no existe
    let indicator = document.getElementById('password-strength-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'password-strength-indicator';
        indicator.className = 'password-strength-indicator';
        passwordInput.parentNode.appendChild(indicator);
    }
    
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = validatePasswordStrength(password);
        
        indicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill strength-${strength.strength}" style="width: ${(strength.score / 5) * 100}%"></div>
            </div>
            <span class="strength-text">Fortaleza: ${strength.strength}</span>
        `;
        
        indicator.className = `password-strength-indicator ${strength.strength}`;
    });
}
