/**
 * FORMULARIO MULTI-STEP DE PACIENTES
 * Maneja el formulario de registro de pacientes con múltiples pasos
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { FORMULARIO_CONFIG, SUSTANCIAS_DISPONIBLES } from '../configuracion/constantes.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarCarga, cerrarModal } from '../utilidades/modales.js';
import { formatearRUT, validarRUT, validarTelefono, validarEmail, alternarBotonEnvio } from '../utilidades/formato.js';
import { guardarEnLocalStorage, obtenerDeLocalStorage, eliminarDeLocalStorage } from '../utilidades/cache.js';
import { validarPasoFormulario } from './validaciones.js';
import { inicializarAutoguardado } from './autoguardado.js';

let db;
let pasoActual = 1;
let pasoMaximo = 4;
let borradorGuardado = false;

/**
 * Inicializa el formulario multi-step de pacientes
 */
function inicializarFormularios() {
    try {
        db = obtenerFirestore();
        configurarFormularioPaciente();
        inicializarAutoguardado();
        console.log('✅ Formulario de pacientes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando formulario de pacientes:', error);
        throw error;
    }
}

/**
 * Configura el formulario principal de pacientes
 */
function configurarFormularioPaciente() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    configurarBotonesNavegacion();
    configurarListeners();
    configurarSliderMotivacion();
    cargarBorradorFormulario();

    console.log('✅ Formulario multi-step configurado');
}

/**
 * Configura los botones de navegación entre pasos
 */
function configurarBotonesNavegacion() {
    // Botones "Siguiente"
    const botonesNext = document.querySelectorAll('[id^="next-step"]');
    botonesNext.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pasoActualBtn = parseInt(btn.id.split('-')[2]);
            if (validarPasoFormulario(pasoActualBtn)) {
                const siguientePaso = obtenerSiguientePaso(pasoActualBtn);
                if (siguientePaso) {
                    irAPaso(siguientePaso);
                }
            }
        });
    });

    // Botones "Anterior"
    const botonesPrev = document.querySelectorAll('[id^="prev-step"]');
    botonesPrev.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pasoActualBtn = parseInt(btn.id.split('-')[2]);
            const pasoAnterior = obtenerPasoAnterior(pasoActualBtn);
            if (pasoAnterior) {
                irAPaso(pasoAnterior);
            }
        });
    });

    // Formulario principal
    const form = document.getElementById('patient-form');
    if (form) {
        form.addEventListener('submit', manejarEnvioFormularioPaciente);
    }
}

/**
 * Configura listeners específicos del formulario
 */
function configurarListeners() {
    // Listener para tipo de solicitud
    const tipoSolicitudInputs = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudInputs.forEach(input => {
        input.addEventListener('change', manejarCambioTipoSolicitud);
    });

    // Botón de envío para información únicamente
    const submitInfoBtn = document.getElementById('submit-step-1');
    if (submitInfoBtn) {
        submitInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
            if (tipoSolicitud === 'informacion') {
                manejarEnvioSoloInformacion();
            }
        });
    }
}

/**
 * Maneja el cambio en el tipo de solicitud
 */
function manejarCambioTipoSolicitud() {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (tipoSolicitud === 'informacion') {
        pasoMaximo = 1;
        actualizarIndicadorProgreso(1, 1);
        
        const contenedorEmail = document.getElementById('info-email-container');
        const contenedorDatosBasicos = document.getElementById('basic-info-container');
        const btnNext = document.getElementById('next-step-1');
        const btnSubmit = document.getElementById('submit-step-1');
        
        if (contenedorEmail) contenedorEmail.style.display = 'block';
        if (contenedorDatosBasicos) contenedorDatosBasicos.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'inline-flex';
        
    } else if (tipoSolicitud === 'identificado') {
        pasoMaximo = 4;
        actualizarIndicadorProgreso(1, 4);
        
        const contenedorEmail = document.getElementById('info-email-container');
        const contenedorDatosBasicos = document.getElementById('basic-info-container');
        const btnNext = document.getElementById('next-step-1');
        const btnSubmit = document.getElementById('submit-step-1');
        
        if (contenedorEmail) contenedorEmail.style.display = 'none';
        if (contenedorDatosBasicos) contenedorDatosBasicos.style.display = 'block';
        if (btnNext) btnNext.style.display = 'inline-flex';
        if (btnSubmit) btnSubmit.style.display = 'none';
    }
    
    guardarBorradorFormulario();
}

/**
 * Configura el slider de motivación
 */
function configurarSliderMotivacion() {
    const sliderMotivacion = document.getElementById('motivacion-range');
    const valorMotivacion = document.getElementById('motivacion-value');
    
    if (sliderMotivacion && valorMotivacion) {
        sliderMotivacion.addEventListener('input', () => {
            valorMotivacion.textContent = sliderMotivacion.value;
            actualizarColorMotivacion(sliderMotivacion.value);
        });
        
        valorMotivacion.textContent = sliderMotivacion.value;
        actualizarColorMotivacion(sliderMotivacion.value);
    }
}

/**
 * Actualiza el color del indicador de motivación
 */
function actualizarColorMotivacion(valor) {
    try {
        const valorMotivacion = document.getElementById('motivacion-value');
        if (!valorMotivacion) return;
        
        const numValor = parseInt(valor);
        let color;
        
        if (numValor <= 3) {
            color = 'var(--danger-red)';
        } else if (numValor <= 6) {
            color = 'var(--warning-orange)';
        } else {
            color = 'var(--success-green)';
        }
        
        valorMotivacion.style.backgroundColor = color;
        valorMotivacion.style.color = 'white';
    } catch (error) {
        console.error('Error actualizando color de motivación:', error);
    }
}

/**
 * Obtiene el siguiente paso según el flujo
 */
function obtenerSiguientePaso(pasoActual) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    
    if (tipoSolicitud === 'informacion') {
        return null;
    }
    
    switch (pasoActual) {
        case 1: return 2;
        case 2: return 3;
        case 3: return 4;
        case 4: return null;
    }
    return null;
}

/**
 * Obtiene el paso anterior
 */
function obtenerPasoAnterior(pasoActual) {
    switch (pasoActual) {
        case 2: return 1;
        case 3: return 2;
        case 4: return 3;
    }
    return null;
}

/**
 * Navega a un paso específico
 */
function irAPaso(paso) {
    try {
        if (paso < 1 || paso > pasoMaximo) return;

        // Ocultar todos los pasos
        document.querySelectorAll('.form-step').forEach(stepDiv => {
            stepDiv.classList.remove('active');
        });
        
        // Mostrar paso objetivo
        const pasoObjetivo = document.querySelector(`.form-step[data-step="${paso}"]`);
        if (pasoObjetivo) {
            pasoObjetivo.classList.add('active');
            
            // Enfocar primer input
            setTimeout(() => {
                const primerInput = pasoObjetivo.querySelector('input:not([type="hidden"]), select, textarea');
                if (primerInput && !primerInput.disabled) {
                    primerInput.focus();
                }
            }, 100);
        }

        actualizarIndicadorProgreso(paso, pasoMaximo);
        pasoActual = paso;
        guardarBorradorFormulario();

        console.log(`🔧 Navegando a paso ${paso} de ${pasoMaximo}`);
    } catch (error) {
        console.error('Error navegando a paso:', error);
    }
}

/**
 * Actualiza el indicador de progreso
 */
function actualizarIndicadorProgreso(actual, total) {
    try {
        const progresoFill = document.getElementById('form-progress');
        const progresoTexto = document.getElementById('progress-text');
        
        if (progresoFill) {
            const porcentajeProgreso = (actual / total) * 100;
            progresoFill.style.width = `${porcentajeProgreso}%`;
        }
        
        if (progresoTexto) {
            progresoTexto.textContent = `Paso ${actual} de ${total}`;
        }
    } catch (error) {
        console.error('Error actualizando indicador de progreso:', error);
    }
}

/**
 * Guarda borrador del formulario
 */
function guardarBorradorFormulario() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const datosFormulario = {};
        
        for (let [clave, valor] of formData.entries()) {
            datosFormulario[clave] = valor;
        }
        
        datosFormulario.pasoActual = pasoActual;
        datosFormulario.pasoMaximo = pasoMaximo;
        
        guardarEnLocalStorage('senda_form_draft', datosFormulario, 24 * 60 * 60 * 1000); // 24 horas
        borradorGuardado = true;
        
        console.log('💾 Borrador guardado automáticamente');
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
    }
}

/**
 * Carga borrador guardado del formulario
 */
function cargarBorradorFormulario() {
    try {
        const borradorGuardado = obtenerDeLocalStorage('senda_form_draft');
        if (!borradorGuardado) return;
        
        restaurarBorradorFormulario(borradorGuardado);
        
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
}

/**
 * Restaura el borrador en el formulario
 */
function restaurarBorradorFormulario(datos) {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        Object.keys(datos).forEach(clave => {
            if (['pasoActual', 'pasoMaximo'].includes(clave)) return;
            
            const campo = form.querySelector(`[name="${clave}"]`);
            if (campo) {
                if (campo.type === 'radio' || campo.type === 'checkbox') {
                    campo.checked = campo.value === datos[clave];
                } else {
                    campo.value = datos[clave];
                }
            }
        });
        
        if (datos.pasoMaximo) {
            pasoMaximo = datos.pasoMaximo;
        }
        
        if (datos.pasoActual) {
            irAPaso(datos.pasoActual);
        }
        
        // Trigger cambio de tipo de solicitud
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
        if (tipoSolicitud) {
            tipoSolicitud.dispatchEvent(new Event('change'));
        }
        
        console.log('📋 Borrador restaurado');
        
    } catch (error) {
        console.error('Error restaurando borrador:', error);
    }
}

/**
 * Resetea el formulario completo
 */
function resetearFormulario() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            irAPaso(1);
            
            // Resetear slider de motivación
            const sliderMotivacion = document.getElementById('motivacion-range');
            const valorMotivacion = document.getElementById('motivacion-value');
            if (sliderMotivacion && valorMotivacion) {
                sliderMotivacion.value = 5;
                valorMotivacion.textContent = '5';
                actualizarColorMotivacion(5);
            }
            
            // Limpiar errores
            form.querySelectorAll('.error').forEach(campo => {
                campo.classList.remove('error');
            });
            
            pasoMaximo = 4;
            actualizarIndicadorProgreso(1, 4);
            
            // Resetear contenedores
            const contenedorEmail = document.getElementById('info-email-container');
            const contenedorDatosBasicos = document.getElementById('basic-info-container');
            const btnNext = document.getElementById('next-step-1');
            const btnSubmit = document.getElementById('submit-step-1');
            
            if (contenedorEmail) contenedorEmail.style.display = 'none';
            if (contenedorDatosBasicos) contenedorDatosBasicos.style.display = 'block';
            if (btnNext) btnNext.style.display = 'inline-flex';
            if (btnSubmit) btnSubmit.style.display = 'none';
        }
        
        borradorGuardado = false;
        eliminarDeLocalStorage('senda_form_draft');
        
        console.log('✅ Formulario reseteado');
    } catch (error) {
        console.error('Error reseteando formulario:', error);
    }
}

/**
 * Maneja el envío de solicitud solo de información
 */
async function manejarEnvioSoloInformacion() {
    try {
        console.log('Procesando solicitud de información únicamente...');
        
        const email = document.getElementById('info-email')?.value?.trim();
        
        if (!email || !validarEmail(email)) {
            mostrarNotificacion('Email inválido', 'error');
            return;
        }
        
        mostrarCarga(true, 'Enviando solicitud...');
        
        const datosInformacion = {
            tipoSolicitud: 'informacion',
            email: email,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'pendiente_respuesta',
            origen: 'web_publica',
            prioridad: 'baja',
            identificador: `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        await db.collection('solicitudes_informacion').add(datosInformacion);
        
        eliminarDeLocalStorage('senda_form_draft');
        cerrarModal('patient-modal');
        resetearFormulario();
        
        mostrarExito('Solicitud de información enviada correctamente. Te responderemos pronto a tu email.', 6000);
        
    } catch (error) {
        console.error('Error enviando información:', error);
        mostrarNotificacion('Error al enviar la solicitud: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Maneja el envío completo del formulario de paciente
 */
async function manejarEnvioFormularioPaciente(e) {
    e.preventDefault();
    console.log('Iniciando envío de solicitud...');
    
    const submitBtn = document.getElementById('submit-form');
    
    try {
        alternarBotonEnvio(submitBtn, true);
        
        const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
        if (!tipoSolicitud || tipoSolicitud !== 'identificado') {
            mostrarNotificacion('Tipo de solicitud no válido para este flujo', 'error');
            return;
        }

        // Validar campos obligatorios
        if (!validarCamposObligatorios()) {
            return;
        }

        const datosFormulario = recopilarDatosFormulario();
        console.log('Datos recopilados:', datosFormulario);
        
        datosFormulario.prioridad = calcularPrioridad(datosFormulario);
        console.log('Prioridad calculada:', datosFormulario.prioridad);
        
        console.log('Guardando en Firestore...');
        
        const docRef = await db.collection('solicitudes_ingreso').add(datosFormulario);
        
        console.log('Solicitud guardada con ID:', docRef.id);
        
        // Crear alerta crítica si es necesario
        if (datosFormulario.prioridad === 'critica') {
            try {
                await crearAlertaCritica(datosFormulario, docRef.id);
                console.log('Alerta crítica creada');
            } catch (alertError) {
                console.warn('Error creando alerta crítica:', alertError);
            }
        }
        
        eliminarDeLocalStorage('senda_form_draft');
        cerrarModal('patient-modal');
        resetearFormulario();
        
        mostrarExito('Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.', 6000);
        console.log('Proceso completado exitosamente');
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        
        let mensajeError = 'Error al enviar la solicitud: ';
        
        if (error.code === 'permission-denied') {
            mensajeError += 'Sin permisos para crear solicitudes.';
        } else if (error.code === 'network-request-failed') {
            mensajeError += 'Problema de conexión. Verifica tu internet.';
        } else if (error.code === 'unavailable') {
            mensajeError += 'Servicio no disponible temporalmente.';
        } else {
            mensajeError += error.message || 'Intenta nuevamente en unos momentos.';
        }
        
        mostrarNotificacion(mensajeError, 'error', 8000);
    } finally {
        alternarBotonEnvio(submitBtn, false);
        mostrarCarga(false);
    }
}

/**
 * Valida campos obligatorios del formulario
 */
function validarCamposObligatorios() {
    const edad = document.getElementById('patient-age')?.value;
    const cesfam = document.getElementById('patient-cesfam')?.value;
    const paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    
    if (!edad || !cesfam || !paraMi) {
        mostrarNotificacion('Completa todos los campos básicos obligatorios', 'warning');
        return false;
    }

    const nombre = document.getElementById('patient-name')?.value?.trim();
    const apellidos = document.getElementById('patient-lastname')?.value?.trim();
    const rut = document.getElementById('patient-rut')?.value?.trim();
    const telefono = document.getElementById('patient-phone')?.value?.trim();
    
    if (!nombre || !apellidos || !rut || !telefono) {
        mostrarNotificacion('Para solicitud identificada, completa todos los datos personales', 'warning');
        return false;
    }
    
    if (!validarRUT(rut)) {
        mostrarNotificacion('RUT inválido', 'warning');
        return false;
    }
    
    if (!validarTelefono(telefono)) {
        mostrarNotificacion('Teléfono inválido', 'warning');
        return false;
    }

    return true;
}

/**
 * Recopila todos los datos del formulario
 */
function recopilarDatosFormulario() {
    const datosFormulario = {
        tipoSolicitud: 'identificado',
        edad: parseInt(document.getElementById('patient-age')?.value) || null,
        cesfam: document.getElementById('patient-cesfam')?.value || '',
        paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || '',
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        origen: 'web_publica',
        version: '2.0'
    };

    // Datos personales
    const nombre = document.getElementById('patient-name')?.value?.trim();
    const apellidos = document.getElementById('patient-lastname')?.value?.trim();
    const rut = document.getElementById('patient-rut')?.value?.trim();
    const telefono = document.getElementById('patient-phone')?.value?.trim();
    const email = document.getElementById('patient-email')?.value?.trim();
    const direccion = document.getElementById('patient-address')?.value?.trim();

    if (nombre) datosFormulario.nombre = nombre;
    if (apellidos) datosFormulario.apellidos = apellidos;
    if (rut) datosFormulario.rut = formatearRUT(rut);
    if (telefono) datosFormulario.telefono = telefono;
    if (email) datosFormulario.email = email;
    if (direccion) datosFormulario.direccion = direccion;

    // Sustancias
    const sustanciasChecked = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustanciasChecked.length > 0) {
        datosFormulario.sustancias = Array.from(sustanciasChecked).map(cb => cb.value);
    }

    // Otros datos clínicos
    const tiempoConsumo = document.getElementById('tiempo-consumo')?.value;
    const urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    const descripcion = document.getElementById('patient-description')?.value?.trim();
    const motivacion = document.getElementById('motivacion-range')?.value;

    if (tiempoConsumo) datosFormulario.tiempoConsumo = tiempoConsumo;
    if (urgencia) datosFormulario.urgencia = urgencia;
    if (tratamientoPrevio) datosFormulario.tratamientoPrevio = tratamientoPrevio;
    if (descripcion) datosFormulario.descripcion = descripcion;
    if (motivacion) datosFormulario.motivacion = parseInt(motivacion);

    return datosFormulario;
}

/**
 * Calcula la prioridad basada en los datos del formulario
 */
function calcularPrioridad(datos) {
    let puntaje = 0;
    
    if (datos.urgencia === 'alta') puntaje += 3;
    else if (datos.urgencia === 'media') puntaje += 2;
    else puntaje += 1;
    
    if (datos.edad) {
        if (datos.edad < 18 || datos.edad > 65) puntaje += 2;
        else puntaje += 1;
    }
    
    if (datos.sustancias && datos.sustancias.length > 2) puntaje += 2;
    else if (datos.sustancias && datos.sustancias.length > 0) puntaje += 1;
    
    if (datos.motivacion) {
        if (datos.motivacion >= 8) puntaje += 2;
        else if (datos.motivacion >= 5) puntaje += 1;
    }
    
    if (puntaje >= 8) return 'critica';
    else if (puntaje >= 6) return 'alta';
    else if (puntaje >= 4) return 'media';
    else return 'baja';
}

/**
 * Crea una alerta crítica para casos urgentes
 */
async function crearAlertaCritica(datosFormulario, solicitudId) {
    try {
        const datosAlerta = {
            id_solicitud: solicitudId,
            mensaje: `Nuevo caso crítico: ${datosFormulario.edad} años, urgencia ${datosFormulario.urgencia}`,
            prioridad: 'maxima',
            tipo_alerta: 'caso_critico_nuevo',
            estado: 'pendiente',
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            notificado: false,
            cesfam: datosFormulario.cesfam,
            datos_paciente: {
                edad: datosFormulario.edad,
                sustancias: datosFormulario.sustancias,
                urgencia: datosFormulario.urgencia,
                motivacion: datosFormulario.motivacion
            }
        };
        
        await db.collection('alertas_criticas').add(datosAlerta);
        
        console.log('Alerta crítica creada para solicitud:', solicitudId);
    } catch (error) {
        console.error('Error creando alerta crítica:', error);
    }
}

export {
    inicializarFormularios,
    resetearFormulario,
    guardarBorradorFormulario,
    cargarBorradorFormulario
};
