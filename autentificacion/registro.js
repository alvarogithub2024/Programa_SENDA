/**
 * REGISTRO DE USUARIOS PROFESIONALES
 * Maneja el registro de nuevos profesionales en el sistema
 */

import { obtenerAuth, obtenerFirestore } from '../configuracion/firebase.js';
import { CESFAM_PUENTE_ALTO, MENSAJES_ERROR, VALIDACIONES } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

let auth, db;

/**
 * Inicializa el sistema de registro
 */
function inicializarRegistro() {
    try {
        auth = obtenerAuth();
        db = obtenerFirestore();
        configurarFormularioRegistro();
        console.log('✅ Sistema de registro inicializado');
    } catch (error) {
        console.error('❌ Error inicializando registro:', error);
        throw error;
    }
}

/**
 * Configura el formulario de registro
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
 * Maneja el envío del formulario de registro
 */
async function manejarEnvioRegistro(e) {
    e.preventDefault();

    try {
        console.log('📝 Iniciando proceso de registro...');

        const datosFormulario = recopilarDatosFormulario(e.target);
        
        if (!validarDatosRegistro(datosFormulario)) {
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);

        mostrarCarga(true, 'Registrando usuario...');

        console.log('🔍 Creando usuario en Firebase Auth...');

        const userCredential = await auth.createUserWithEmailAndPassword(
            datosFormulario.email, 
            datosFormulario.password
        );
        const user = userCredential.user;

        console.log('✅ Usuario creado en Auth:', user.uid);

        await crearPerfilProfesional(user.uid, datosFormulario);

        cerrarModal('login-modal');
        mostrarNotificacion('Registro exitoso. Bienvenido al sistema SENDA', 'success');

        e.target.reset();

        console.log('✅ Usuario registrado exitosamente:', user.uid);

    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarNotificacion(obtenerMensajeErrorRegistro(error), 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Recopila los datos del formulario
 */
function recopilarDatosFormulario(form) {
    return {
        nombre: form.querySelector('#register-nombre')?.value?.trim(),
        apellidos: form.querySelector('#register-apellidos')?.value?.trim(),
        email: form.querySelector('#register-email')?.value?.trim(),
        password: form.querySelector('#register-password')?.value?.trim(),
        profession: form.querySelector('#register-profession')?.value,
        cesfam: form.querySelector('#register-cesfam')?.value
    };
}

/**
 * Valida los datos de registro
 */
function validarDatosRegistro(datos) {
    const camposRequeridos = [
        { campo: 'nombre', nombre: 'Nombre' },
        { campo: 'apellidos', nombre: 'Apellidos' },
        { campo: 'email', nombre: 'Email' },
        { campo: 'password', nombre: 'Contraseña' },
        { campo: 'profession', nombre: 'Profesión' },
        { campo: 'cesfam', nombre: 'CESFAM' }
    ];

    for (const { campo, nombre } of camposRequeridos) {
        if (!datos[campo]) {
            mostrarNotificacion(`El campo ${nombre} es obligatorio`, 'warning');
            return false;
        }
    }

    if (!validarEmail(datos.email)) {
        mostrarNotificacion('Email inválido', 'warning');
        return false;
    }

    if (!datos.email.endsWith('@senda.cl')) {
        mostrarNotificacion('Solo se permiten emails @senda.cl', 'warning');
        return false;
    }

    if (datos.password.length < VALIDACIONES.PASSWORD.MIN_LENGTH) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'warning');
        return false;
    }

    if (!CESFAM_PUENTE_ALTO.includes(datos.cesfam)) {
        mostrarNotificacion('CESFAM no válido', 'warning');
        return false;
    }

    return true;
}

/**
 * Valida el formato de email
 */
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Crea el perfil del profesional en Firestore
 */
async function crearPerfilProfesional(uid, datos) {
    try {
        const datosPerfilProfesional = {
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            email: datos.email,
            profession: datos.profession,
            cesfam: datos.cesfam,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            uid: uid
        };

        console.log('📝 Guardando datos del profesional en Firestore...');

        await db.collection('profesionales').doc(uid).set(datosPerfilProfesional);

        console.log('✅ Profesional guardado en Firestore');

    } catch (error) {
        console.error('Error creando perfil profesional:', error);
        throw error;
    }
}

/**
 * Obtiene el mensaje de error apropiado para registro
 */
function obtenerMensajeErrorRegistro(error) {
    const mensajesFirebase = MENSAJES_ERROR.FIREBASE;
    const mensajePersonalizado = mensajesFirebase[error.code];
    
    if (mensajePersonalizado) {
        return mensajePersonalizado;
    }

    if (error.code === 'permission-denied') {
        return 'Sin permisos para crear el perfil profesional';
    }
    
    return `Error al registrarse: ${error.message}`;
}

/**
 * Resetea el formulario de registro
 */
function resetearFormularioRegistro() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.reset();
        
        // Limpiar errores
        const campos = registerForm.querySelectorAll('.error');
        campos.forEach(campo => campo.classList.remove('error'));
    }
}

/**
 * Valida la disponibilidad del email
 */
async function validarDisponibilidadEmail(email) {
    try {
        const methods = await auth.fetchSignInMethodsForEmail(email);
        return methods.length === 0;
    } catch (error) {
        console.error('Error verificando disponibilidad del email:', error);
        return false;
    }
}

export {
    inicializarRegistro,
    resetearFormularioRegistro,
    validarDisponibilidadEmail
};
