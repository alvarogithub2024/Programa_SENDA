/**
 * VALIDACIONES DE FORMULARIOS
 * Validaciones específicas para cada paso del formulario
 */

import { validarRUT, validarTelefono, validarEmail, validarEdad } from '../utilidades/formato.js';
import { VALIDACIONES, MENSAJES_ERROR } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';

/**
 * Valida un paso específico del formulario
 */
function validarPasoFormulario(paso) {
    try {
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        const pasoDiv = document.querySelector(`.form-step[data-step="${paso}"]`);
        if (!pasoDiv) return false;

        const errores = [];
        let esValido = true;

        // Limpiar errores previos
        pasoDiv.querySelectorAll('.error').forEach(campo => {
            campo.classList.remove('error');
        });

        switch (paso) {
            case 1:
                esValido = validarPaso1(tipoSolicitud, errores);
                break;
            case 2:
                esValido = validarPaso2(errores);
                break;
            case 3:
                esValido = validarPaso3(errores);
                break;
            case 4:
                esValido = validarPaso4(errores);
                break;
        }

        if (errores.length > 0) {
            mostrarNotificacion(errores.join('\n'), 'warning', 5000);
            marcarCamposConError(pasoDiv, errores);
        }

        return esValido;
    } catch (error) {
        console.error('Error validando paso del formulario:', error);
        return false;
    }
}

/**
 * Valida el paso 1 del formulario
 */
function validarPaso1(tipoSolicitud, errores) {
    let esValido = true;

    if (!tipoSolicitud) {
        errores.push('Selecciona un tipo de solicitud');
        esValido = false;
    } else if (tipoSolicitud === 'informacion') {
        const email = document.getElementById('info-email')?.value?.trim();
        if (!email) {
            errores.push('Ingresa un email para recibir información');
            esValido = false;
        } else if (!validarEmail(email)) {
            errores.push('Ingresa un email válido');
            esValido = false;
        }
    } else if (tipoSolicitud === 'identificado') {
        esValido = validarDatosBasicos(errores);
    }

    return esValido;
}

/**
 * Valida los datos básicos del paso 1
 */
function validarDatosBasicos(errores) {
    let esValido = true;

    const edad = parseInt(document.getElementById('patient-age')?.value);
    if (!edad || !validarEdad(edad)) {
        errores.push(`La edad debe estar entre ${VALIDACIONES.EDAD.MIN} y ${VALIDACIONES.EDAD.MAX} años`);
        esValido = false;
    }

    const cesfam = document.getElementById('patient-cesfam')?.value;
    if (!cesfam) {
        errores.push('Selecciona un CESFAM');
        esValido = false;
    }

    const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    if (!paraMi) {
        errores.push('Indica para quién solicitas ayuda');
        esValido = false;
    }

    return esValido;
}

/**
 * Valida el paso 2 del formulario (datos personales)
 */
function validarPaso2(errores) {
    let esValido = true;

    // Campos obligatorios
    const camposObligatorios = [
        { id: 'patient-name', nombre: 'Nombre' },
        { id: 'patient-lastname', nombre: 'Apellidos' },
        { id: 'patient-rut', nombre: 'RUT' },
        { id: 'patient-phone', nombre: 'Teléfono' }
    ];

    camposObligatorios.forEach(({ id, nombre }) => {
        const campo = document.getElementById(id);
        const valor = campo?.value?.trim();
        
        if (!valor) {
            errores.push(`${nombre} es obligatorio`);
            esValido = false;
            if (campo) campo.classList.add('error');
        }
    });

    // Validaciones específicas
    const rut = document.getElementById('patient-rut')?.value?.trim();
    if (rut && !validarRUT(rut)) {
        errores.push('RUT inválido');
        esValido = false;
        const rutField = document.getElementById('patient-rut');
        if (rutField) rutField.classList.add('error');
    }

    const telefono = document.getElementById('patient-phone')?.value?.trim();
    if (telefono && !validarTelefono(telefono)) {
        errores.push('Teléfono inválido');
        esValido = false;
        const phoneField = document.getElementById('patient-phone');
        if (phoneField) phoneField.classList.add('error');
    }

    const email = document.getElementById('patient-email')?.value?.trim();
    if (email && !validarEmail(email)) {
        errores.push('Email inválido');
        esValido = false;
        const emailField = document.getElementById('patient-email');
        if (emailField) emailField.classList.add('error');
    }

    return esValido;
}

/**
 * Valida el paso 3 del formulario (información clínica)
 */
function validarPaso3(errores) {
    let esValido = true;

    // Validar sustancias seleccionadas
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
        errores.push('Selecciona al menos una sustancia');
        esValido = false;
    }

    // Validar urgencia
    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (!urgencia) {
        errores.push('Selecciona el nivel de urgencia');
        esValido = false;
    }

    // Validar tratamiento previo
    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (!tratamientoPrevio) {
        errores.push('Indica si has recibido tratamiento previo');
        esValido = false;
    }

    return esValido;
}

/**
 * Valida el paso 4 del formulario (información adicional)
 */
function validarPaso4(errores) {
    // Este paso es opcional, solo validar formato si hay datos
    let esValido = true;

    const descripcion = document.getElementById('patient-description')?.value?.trim();
    if (descripcion && descripcion.length > 1000) {
        errores.push('La descripción no puede exceder 1000 caracteres');
        esValido = false;
    }

    return esValido;
}

/**
 * Marca campos con error visualmente
 */
function marcarCamposConError(contenedor, errores) {
    try {
        // Lógica para marcar campos específicos basado en los errores
        errores.forEach(error => {
            if (error.includes('Nombre')) {
                const campo = contenedor.querySelector('#patient-name');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('Apellidos')) {
                const campo = contenedor.querySelector('#patient-lastname');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('RUT')) {
                const campo = contenedor.querySelector('#patient-rut');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('Teléfono')) {
                const campo = contenedor.querySelector('#patient-phone');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('Email')) {
                const campo = contenedor.querySelector('#patient-email, #info-email');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('edad')) {
                const campo = contenedor.querySelector('#patient-age');
                if (campo) campo.classList.add('error');
            }
            if (error.includes('CESFAM')) {
                const campo = contenedor.querySelector('#patient-cesfam');
                if (campo) campo.classList.add('error');
            }
        });
    } catch (error) {
        console.error('Error marcando campos con error:', error);
    }
}

/**
 * Valida campos individuales en tiempo real
 */
function validarCampoIndividual(campo) {
    try {
        campo.classList.remove('error');
        
        const valor = campo.value?.trim();
        const tipo = campo.getAttribute('data-validate');
        let esValido = true;

        switch (tipo) {
            case 'rut':
                if (valor && !validarRUT(valor)) {
                    campo.classList.add('error');
                    esValido = false;
                }
                break;
            case 'email':
                if (valor && !validarEmail(valor)) {
                    campo.classList.add('error');
                    esValido = false;
                }
                break;
            case 'telefono':
                if (valor && !validarTelefono(valor)) {
                    campo.classList.add('error');
                    esValido = false;
                }
                break;
            case 'edad':
                const edad = parseInt(valor);
                if (valor && !validarEdad(edad)) {
                    campo.classList.add('error');
                    esValido = false;
                }
                break;
        }

        return esValido;
    } catch (error) {
        console.error('Error validando campo individual:', error);
        return false;
    }
}

/**
 * Configura validación en tiempo real para campos específicos
 */
function configurarValidacionTiempoReal() {
    try {
        // RUT
        const rutField = document.getElementById('patient-rut');
        if (rutField) {
            rutField.addEventListener('blur', () => validarCampoIndividual(rutField));
            rutField.setAttribute('data-validate', 'rut');
        }

        // Email
        const emailFields = document.querySelectorAll('#patient-email, #info-email');
        emailFields.forEach(field => {
            field.addEventListener('blur', () => validarCampoIndividual(field));
            field.setAttribute('data-validate', 'email');
        });

        // Teléfono
        const phoneField = document.getElementById('patient-phone');
        if (phoneField) {
            phoneField.addEventListener('blur', () => validarCampoIndividual(phoneField));
            phoneField.setAttribute('data-validate', 'telefono');
        }

        // Edad
        const ageField = document.getElementById('patient-age');
        if (ageField) {
            ageField.addEventListener('blur', () => validarCampoIndividual(ageField));
            ageField.setAttribute('data-validate', 'edad');
        }

        console.log('✅ Validación en tiempo real configurada');
    } catch (error) {
        console.error('Error configurando validación en tiempo real:', error);
    }
}

/**
 * Obtiene etiqueta de un campo para mensajes de error
 */
function obtenerEtiquetaCampo(campo) {
    try {
        const label = campo.closest('.form-group')?.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : 'Campo';
    } catch (error) {
        return 'Campo';
    }
}

/**
 * Valida que al menos un campo requerido esté lleno en un grupo
 */
function validarGrupoOpcional(selector, nombreGrupo) {
    const campos = document.querySelectorAll(selector);
    const tieneValor = Array.from(campos).some(campo => {
        if (campo.type === 'checkbox' || campo.type === 'radio') {
            return campo.checked;
        }
        return campo.value?.trim() !== '';
    });

    if (!tieneValor) {
        return `Debe completar al menos un campo en ${nombreGrupo}`;
    }

    return null;
}

/**
 * Limpia todos los errores visuales del formulario
 */
function limpiarErroresFormulario() {
    try {
        const camposConError = document.querySelectorAll('.error');
        camposConError.forEach(campo => {
            campo.classList.remove('error');
        });
    } catch (error) {
        console.error('Error limpiando errores del formulario:', error);
    }
}

export {
    validarPasoFormulario,
    validarCampoIndividual,
    configurarValidacionTiempoReal,
    obtenerEtiquetaCampo,
    validarGrupoOpcional,
    limpiarErroresFormulario
};
