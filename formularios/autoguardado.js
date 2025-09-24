/**
 * SISTEMA DE AUTOGUARDADO DE FORMULARIOS
 * Gestiona el guardado automático de formularios mientras el usuario escribe
 */

import { FORMULARIO_CONFIG } from '../configuracion/constantes.js';
import { guardarEnLocalStorage } from '../utilidades/cache.js';

let timerAutoguardado = null;
let formularioActivo = null;

/**
 * Inicializa el sistema de autoguardado
 */
function inicializarAutoguardado() {
    try {
        configurarAutoguardadoFormularioPaciente();
        configurarAutoguardadoFormularioReingreso();
        console.log('✅ Sistema de autoguardado inicializado');
    } catch (error) {
        console.error('❌ Error inicializando autoguardado:', error);
    }
}

/**
 * Configura autoguardado para el formulario de pacientes
 */
function configurarAutoguardadoFormularioPaciente() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // Detectar cambios en todos los campos
    form.addEventListener('input', debounceAutoguardado('patient-form'));
    form.addEventListener('change', debounceAutoguardado('patient-form'));

    console.log('✅ Autoguardado configurado para formulario de pacientes');
}

/**
 * Configura autoguardado para el formulario de reingreso
 */
function configurarAutoguardadoFormularioReingreso() {
    const form = document.getElementById('reentry-form');
    if (!form) return;

    form.addEventListener('input', debounceAutoguardado('reentry-form'));
    form.addEventListener('change', debounceAutoguardado('reentry-form'));

    console.log('✅ Autoguardado configurado para formulario de reingreso');
}

/**
 * Crea función de autoguardado con debounce
 */
function debounceAutoguardado(formId) {
    return function() {
        clearTimeout(timerAutoguardado);
        formularioActivo = formId;
        
        timerAutoguardado = setTimeout(() => {
            guardarBorradorActivo(formId);
        }, FORMULARIO_CONFIG.AUTOSAVE_DELAY);
    };
}

/**
 * Guarda el borrador del formulario activo
 */
function guardarBorradorActivo(formId) {
    try {
        const form = document.getElementById(formId);
        if (!form) return;

        const datosFormulario = extraerDatosFormulario(form);
        const claveBorrador = obtenerClaveBorrador(formId);

        guardarEnLocalStorage(claveBorrador, {
            formId,
            datos: datosFormulario,
            timestamp: Date.now(),
            paso: obtenerPasoActual(formId)
        }, FORMULARIO_CONFIG.MAX_DRAFT_AGE);

        mostrarIndicadorGuardado();

    } catch (error) {
        console.error('Error guardando borrador automático:', error);
    }
}

/**
 * Extrae datos del formulario
 */
function extraerDatosFormulario(form) {
    const formData = new FormData(form);
    const datos = {};

    for (let [clave, valor] of formData.entries()) {
        // Manejar campos múltiples (checkboxes)
        if (datos[clave]) {
            if (Array.isArray(datos[clave])) {
                datos[clave].push(valor);
            } else {
                datos[clave] = [datos[clave], valor];
            }
        } else {
            datos[clave] = valor;
        }
    }

    return datos;
}

/**
 * Obtiene la clave de borrador según el formulario
 */
function obtenerClaveBorrador(formId) {
    const claves = {
        'patient-form': 'senda_draft_patient',
        'reentry-form': 'senda_draft_reentry'
    };
    return claves[formId] || `senda_draft_${formId}`;
}

/**
 * Obtiene el paso actual del formulario multi-step
 */
function obtenerPasoActual(formId) {
    if (formId === 'patient-form') {
        const pasoActivo = document.querySelector('.form-step.active');
        if (pasoActivo) {
            return parseInt(pasoActivo.dataset.step) || 1;
        }
    }
    return 1;
}

/**
 * Muestra indicador visual de guardado automático
 */
function mostrarIndicadorGuardado() {
    try {
        // Buscar o crear indicador
        let indicador = document.getElementById('autosave-indicator');
        
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'autosave-indicator';
            indicador.className = 'autosave-indicator';
            indicador.innerHTML = '<i class="fas fa-check-circle"></i> Guardado automáticamente';
            document.body.appendChild(indicador);
        }

        // Mostrar indicador
        indicador.classList.add('show');

        // Ocultar después de 2 segundos
        setTimeout(() => {
            indicador.classList.remove('show');
        }, 2000);

    } catch (error) {
        console.error('Error mostrando indicador de guardado:', error);
    }
}

/**
 * Restaura borrador de un formulario específico
 */
function restaurarBorrador(formId) {
    try {
        const claveBorrador = obtenerClaveBorrador(formId);
        const borrador = obtenerDeLocalStorage(claveBorrador);
        
        if (!borrador || !borrador.datos) {
            return false;
        }

        // Verificar edad del borrador
        const edadBorrador = Date.now() - borrador.timestamp;
        if (edadBorrador > FORMULARIO_CONFIG.MAX_DRAFT_AGE) {
            limpiarBorrador(formId);
            return false;
        }

        const form = document.getElementById(formId);
        if (!form) return false;

        restaurarDatosEnFormulario(form, borrador.datos);
        
        // Restaurar paso si es formulario multi-step
        if (formId === 'patient-form' && borrador.paso) {
            setTimeout(() => {
                const evento = new CustomEvent('restaurarPaso', {
                    detail: { paso: borrador.paso }
                });
                form.dispatchEvent(evento);
            }, 100);
        }

        console.log(`📋 Borrador restaurado para ${formId}`);
        return true;

    } catch (error) {
        console.error('Error restaurando borrador:', error);
        return false;
    }
}

/**
 * Restaura datos en los campos del formulario
 */
function restaurarDatosEnFormulario(form, datos) {
    try {
        Object.keys(datos).forEach(clave => {
            const valor = datos[clave];
            const campos = form.querySelectorAll(`[name="${clave}"]`);
            
            campos.forEach(campo => {
                if (campo.type === 'radio' || campo.type === 'checkbox') {
                    if (Array.isArray(valor)) {
                        campo.checked = valor.includes(campo.value);
                    } else {
                        campo.checked = campo.value === valor;
                    }
                } else {
                    campo.value = Array.isArray(valor) ? valor[0] : valor;
                }
            });
        });
    } catch (error) {
        console.error('Error restaurando datos en formulario:', error);
    }
}

/**
 * Limpia el borrador de un formulario
 */
function limpiarBorrador(formId) {
    try {
        const claveBorrador = obtenerClaveBorrador(formId);
        localStorage.removeItem(claveBorrador);
        console.log(`🗑️ Borrador limpiado para ${formId}`);
    } catch (error) {
        console.error('Error limpiando borrador:', error);
    }
}

/**
 * Verifica si existe un borrador válido
 */
function existeBorrador(formId) {
    try {
        const claveBorrador = obtenerClaveBorrador(formId);
        const borrador = obtenerDeLocalStorage(claveBorrador);
        
        if (!borrador) return false;
        
        const edadBorrador = Date.now() - borrador.timestamp;
        return edadBorrador <= FORMULARIO_CONFIG.MAX_DRAFT_AGE;
        
    } catch (error) {
        console.error('Error verificando borrador:', error);
        return false;
    }
}

/**
 * Pausa el autoguardado temporalmente
 */
function pausarAutoguardado() {
    if (timerAutoguardado) {
        clearTimeout(timerAutoguardado);
        timerAutoguardado = null;
    }
}

/**
 * Reanuda el autoguardado
 */
function reanudarAutoguardado() {
    if (formularioActivo) {
        const form = document.getElementById(formularioActivo);
        if (form) {
            // Reconfigurar listeners
            form.removeEventListener('input', debounceAutoguardado(formularioActivo));
            form.removeEventListener('change', debounceAutoguardado(formularioActivo));
            
            form.addEventListener('input', debounceAutoguardado(formularioActivo));
            form.addEventListener('change', debounceAutoguardado(formularioActivo));
        }
    }
}

/**
 * Limpia todos los borradores expirados
 */
function limpiarBorradoresExpirados() {
    try {
        const prefijo = 'senda_draft_';
        let borradoresEliminados = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            
            if (clave && clave.startsWith(prefijo)) {
                try {
                    const item = localStorage.getItem(clave);
                    const borrador = JSON.parse(item);
                    
                    const edadBorrador = Date.now() - borrador.timestamp;
                    if (edadBorrador > FORMULARIO_CONFIG.MAX_DRAFT_AGE) {
                        localStorage.removeItem(clave);
                        borradoresEliminados++;
                    }
                } catch (e) {
                    // Borrador corrupto, eliminarlo
                    localStorage.removeItem(clave);
                    borradoresEliminados++;
                }
            }
        }

        if (borradoresEliminados > 0) {
            console.log(`🧹 ${borradoresEliminados} borradores expirados eliminados`);
        }

        return borradoresEliminados;
    } catch (error) {
        console.error('Error limpiando borradores expirados:', error);
        return 0;
    }
}

export {
    inicializarAutoguardado,
    restaurarBorrador,
    limpiarBorrador,
    existeBorrador,
    pausarAutoguardado,
    reanudarAutoguardado,
    limpiarBorradoresExpirados
};
