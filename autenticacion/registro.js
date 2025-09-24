import { obtenerFirestore } from '../configuracion/firebase.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

let db;

function inicializarRegistro() {
    db = obtenerFirestore();
    configurarFormularioRegistro();
    console.log('✅ Sistema de registro inicializado');
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
    console.log('Enviando registro...'); // <--- muy importante para depurar
    try {
        mostrarCarga(true, 'Registrando profesional...');
        // Campos
        const nombre = document.getElementById('register-nombre')?.value?.trim();
        const apellidos = document.getElementById('register-apellidos')?.value?.trim();
        const email = document.getElementById('register-email')?.value?.trim();
        const cesfam = document.getElementById('register-cesfam')?.value?.trim();
        const profession = document.getElementById('register-profession')?.value?.trim();

        if (!email || !nombre || !apellidos || !cesfam || !profession) {
            mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
            return;
        }

        // Registro en Firestore
        await db.collection('profesionales').add({
            nombre, apellidos, email, cesfam, profession,
            activo: true,
            fechaCreacion: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
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

export { inicializarRegistro, configurarFormularioRegistro };
