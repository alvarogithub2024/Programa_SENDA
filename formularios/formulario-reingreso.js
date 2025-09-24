/**
 * FORMULARIO DE REINGRESO
 * Maneja las solicitudes de reingreso al programa
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { CESFAM_PUENTE_ALTO, MENSAJES_ERROR } from '../configuracion/constantes.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { formatearRUT, validarRUT, formatearTelefono, validarTelefono, alternarBotonEnvio } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el formulario de reingreso
 */
function inicializarFormularioReingreso() {
    try {
        db = obtenerFirestore();
        configurarFormularioReingreso();
        console.log('✅ Formulario de reingreso inicializado');
    } catch (error) {
        console.error('❌ Error inicializando formulario de reingreso:', error);
        throw error;
    }
}

/**
 * Configura el formulario de reingreso
 */
function configurarFormularioReingreso() {
    const form = document.getElementById('reentry-form');
    if (!form) {
        console.warn('⚠️ Formulario de reingreso no encontrado');
        return;
    }

    // Event listener para envío del formulario
    form.addEventListener('submit', manejarEnvioReingreso);

    // Configurar validaciones en tiempo real
    configurarValidacionesReingreso();

    console.log('✅ Formulario de reingreso configurado');
}

/**
 * Configura validaciones en tiempo real
 */
function configurarValidacionesReingreso() {
    const rutField = document.getElementById('reentry-rut');
    const telefonoField = document.getElementById('reentry-phone');

    if (rutField) {
        rutField.addEventListener('input', (e) => {
            e.target.value = formatearRUT(e.target.value);
        });
        
        rutField.addEventListener('blur', () => {
            validarCampoRUT(rutField);
        });
    }

    if (telefonoField) {
        telefonoField.addEventListener('blur', () => {
            validarCampoTelefono(telefonoField);
        });
    }
}

/**
 * Valida campo RUT individualmente
 */
function validarCampoRUT(campo) {
    const valor = campo.value.trim();
    campo.classList.remove('error');

    if (valor && !validarRUT(valor)) {
        campo.classList.add('error');
        return false;
    }

    return true;
}

/**
 * Valida campo teléfono individualmente
 */
function validarCampoTelefono(campo) {
    const valor = campo.value.trim();
    campo.classList.remove('error');

    if (valor && !validarTelefono(valor)) {
        campo.classList.add('error');
        return false;
    }

    return true;
}

/**
 * Maneja el envío del formulario de reingreso
 */
async function manejarEnvioReingreso(e) {
    e.preventDefault();
    console.log('Iniciando envío de reingreso...');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        const datosFormulario = recopilarDatosReingreso(e.target);
        
        if (!validarDatosReingreso(datosFormulario)) {
            return;
        }

        alternarBotonEnvio(submitBtn, true);
        mostrarCarga(true, 'Enviando solicitud de reingreso...');

        // Verificar si ya existe una solicitud pendiente
        await verificarReingresoExistente(datosFormulario.rut);

        const datosReingreso = construirDatosReingreso(datosFormulario);
        const docRef = await db.collection('reingresos').add(datosReingreso);
        
        console.log('Reingreso guardado con ID:', docRef.id);

        cerrarModal('reentry-modal');
        e.target.reset();
        limpiarErroresFormulario(e.target);
        
        mostrarExito('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 5000);
        
    } catch (error) {
        console.error('Error enviando reingreso:', error);
        mostrarNotificacion(obtenerMensajeErrorReingreso(error), 'error', 8000);
    } finally {
        alternarBotonEnvio(submitBtn, false);
        mostrarCarga(false);
    }
}

/**
 * Recopila datos del formulario de reingreso
 */
function recopilarDatosReingreso(form) {
    return {
        nombre: form.querySelector('#reentry-name')?.value?.trim() || '',
        rut: form.querySelector('#reentry-rut')?.value?.trim() || '',
        cesfam: form.querySelector('#reentry-cesfam')?.value || '',
        motivo: form.querySelector('#reentry-reason')?.value?.trim() || '',
        telefono: form.querySelector('#reentry-phone')?.value?.trim() || ''
    };
}

/**
 * Valida los datos del formulario de reingreso
 */
function validarDatosReingreso(datos) {
    const errores = [];

    // Campos obligatorios
    const camposObligatorios = [
        { campo: 'nombre', nombre: 'Nombre' },
        { campo: 'rut', nombre: 'RUT' },
        { campo: 'cesfam', nombre: 'CESFAM' },
        { campo: 'motivo', nombre: 'Motivo' },
        { campo: 'telefono', nombre: 'Teléfono' }
    ];

    camposObligatorios.forEach(({ campo, nombre }) => {
        if (!datos[campo]) {
            errores.push(`El campo ${nombre} es obligatorio`);
        }
    });

    // Validaciones específicas
    if (datos.rut && !validarRUT(datos.rut)) {
        errores.push('RUT inválido');
    }

    if (datos.telefono && !validarTelefono(datos.telefono)) {
        errores.push('Teléfono inválido');
    }

    if (datos.cesfam && !CESFAM_PUENTE_ALTO.includes(datos.cesfam)) {
        errores.push('CESFAM no válido');
    }

    if (datos.motivo && datos.motivo.length < 10) {
        errores.push('El motivo debe tener al menos 10 caracteres');
    }

    if (errores.length > 0) {
        mostrarNotificacion(errores.join('\n'), 'warning');
        return false;
    }

    return true;
}

/**
 * Verifica si ya existe un reingreso pendiente para el RUT
 */
async function verificarReingresoExistente(rut) {
    try {
        const rutFormateado = formatearRUT(rut);
        const reingresoExistente = await db.collection('reingresos')
            .where('rut', '==', rutFormateado)
            .where('estado', '==', 'pendiente')
            .get();
        
        if (!reingresoExistente.empty) {
            throw new Error('Ya existe una solicitud de reingreso pendiente para este RUT');
        }
    } catch (error) {
        if (error.message.includes('Ya existe una solicitud')) {
            throw error;
        }
        console.warn('Error verificando reingresos existentes:', error);
        // No bloquear el proceso si hay error en la verificación
    }
}

/**
 * Construye el objeto de datos para guardar en Firestore
 */
function construirDatosReingreso(datosFormulario) {
    return {
        nombre: datosFormulario.nombre,
        rut: formatearRUT(datosFormulario.rut),
        telefono: formatearTelefono(datosFormulario.telefono),
        cesfam: datosFormulario.cesfam,
        motivo: datosFormulario.motivo,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        prioridad: 'media',
        tipo: 'reingreso',
        origen: 'web_publica',
        version: '2.0'
    };
}

/**
 * Obtiene mensaje de error apropiado para reingreso
 */
function obtenerMensajeErrorReingreso(error) {
    if (error.message.includes('Ya existe una solicitud')) {
        return error.message;
    }

    const mensajesFirebase = MENSAJES_ERROR.FIREBASE;
    const mensajePersonalizado = mensajesFirebase[error.code];
    
    if (mensajePersonalizado) {
        return `Error al enviar la solicitud de reingreso: ${mensajePersonalizado}`;
    }
    
    return `Error al enviar la solicitud de reingreso: ${error.message || 'Intenta nuevamente.'}`;
}

/**
 * Limpia errores visuales del formulario
 */
function limpiarErroresFormulario(form) {
    const camposConError = form.querySelectorAll('.error');
    camposConError.forEach(campo => {
        campo.classList.remove('error');
    });
}

/**
 * Resetea el formulario de reingreso
 */
function resetearFormularioReingreso() {
    const form = document.getElementById('reentry-form');
    if (form) {
        form.reset();
        limpiarErroresFormulario(form);
    }
}

/**
 * Prefill del formulario con datos conocidos
 */
function precargarDatosReingreso(datos) {
    try {
        if (datos.nombre) {
            const nombreField = document.getElementById('reentry-name');
            if (nombreField) nombreField.value = datos.nombre;
        }

        if (datos.rut) {
            const rutField = document.getElementById('reentry-rut');
            if (rutField) rutField.value = formatearRUT(datos.rut);
        }

        if (datos.telefono) {
            const telefonoField = document.getElementById('reentry-phone');
            if (telefonoField) telefonoField.value = datos.telefono;
        }

        if (datos.cesfam) {
            const cesfamField = document.getElementById('reentry-cesfam');
            if (cesfamField) cesfamField.value = datos.cesfam;
        }

        console.log('Datos precargados en formulario de reingreso');
    } catch (error) {
        console.error('Error precargando datos:', error);
    }
}

export {
    inicializarFormularioReingreso,
    resetearFormularioReingreso,
    precargarDatosReingreso
};
