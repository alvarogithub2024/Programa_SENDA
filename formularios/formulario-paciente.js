// src/js/formularios/formulario-paciente.js
import { db } from '../configuracion/firebase.js';
import { mostrarNotificacion, mostrarCarga } from '../utilidades/notificaciones.js';
import { cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio, formatearRUT, validarRUT, esEmailValido, validarTelefono } from '../utilidades/formato.js';
import { guardarBorradorFormulario, cargarBorradorFormulario } from './autoguardado.js';
import { validarPaso } from './validaciones.js';

let pasoFormularioActual = 1;
let maxPasoFormulario = 4;
let esBorradorGuardado = false;

export function configurarFormularios() {
  configurarFormularioMultiPaso();
  configurarFormularioReingreso();
  console.log('✅ Formularios configurados');
}

function configurarFormularioMultiPaso() {
  const formulario = document.getElementById('patient-form');
  if (!formulario) return;

  configurarBotonesNavegacion();
  configurarEventosFormulario();
  configurarAutoguardado();
  cargarBorradorFormulario();
}

function configurarBotonesNavegacion() {
  const botonesNext = document.querySelectorAll('[id^="next-step"]');
  const botonesPrev = document.querySelectorAll('[id^="prev-step"]');
  
  botonesNext.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const paso = parseInt(btn.id.split('-')[2]);
      if (validarPaso(paso)) {
        const siguientePaso = obtenerSiguientePaso(paso);
        if (siguientePaso) irAPaso(siguientePaso);
      }
    });
  });

  botonesPrev.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const paso = parseInt(btn.id.split('-')[2]);
      const pasoAnterior = obtenerPasoAnterior(paso);
      if (pasoAnterior) irAPaso(pasoAnterior);
    });
  });

  const formulario = document.getElementById('patient-form');
  if (formulario) {
    formulario.addEventListener('submit', manejarEnvioFormulario);
  }
}

function configurarEventosFormulario() {
  // Tipo de solicitud
  const tiposSolicitud = document.querySelectorAll('input[name="tipoSolicitud"]');
  tiposSolicitud.forEach(input => {
    input.addEventListener('change', manejarCambioTipoSolicitud);
  });

  // Motivación
  const rangoMotivacion = document.getElementById('motivacion-range');
  const valorMotivacion = document.getElementById('motivacion-value');
  if (rangoMotivacion && valorMotivacion) {
    rangoMotivacion.addEventListener('input', () => {
      valorMotivacion.textContent = rangoMotivacion.value;
      actualizarColorMotivacion(rangoMotivacion.value);
    });
    valorMotivacion.textContent = rangoMotivacion.value;
    actualizarColorMotivacion(rangoMotivacion.value);
  }

  // Botón envío información
  const btnEnviarInfo = document.getElementById('submit-step-1');
  if (btnEnviarInfo) {
    btnEnviarInfo.addEventListener('click', (e) => {
      e.preventDefault();
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
      if (tipoSolicitud === 'informacion') {
        manejarEnvioSoloInformacion();
      }
    });
  }
}

function configurarAutoguardado() {
  const formulario = document.getElementById('patient-form');
  if (!formulario) return;
  
  let timerAutoguardado;
  
  formulario.addEventListener('input', () => {
    clearTimeout(timerAutoguardado);
    timerAutoguardado = setTimeout(guardarBorradorFormulario, 2000);
  });
}

function manejarCambioTipoSolicitud() {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  const elementos = {
    infoEmail: document.getElementById('info-email-container'),
    infoBasica: document.getElementById('basic-info-container'),
    btnNext: document.getElementById('next-step-1'),
    btnSubmit: document.getElementById('submit-step-1')
  };
  
  if (tipoSolicitud === 'informacion') {
    maxPasoFormulario = 1;
    actualizarIndicadorProgreso(1, 1);
    
    if (elementos.infoEmail) elementos.infoEmail.style.display = 'block';
    if (elementos.infoBasica) elementos.infoBasica.style.display = 'none';
    if (elementos.btnNext) elementos.btnNext.style.display = 'none';
    if (elementos.btnSubmit) elementos.btnSubmit.style.display = 'inline-flex';
    
  } else if (tipoSolicitud === 'identificado') {
    maxPasoFormulario = 4;
    actualizarIndicadorProgreso(1, 4);
    
    if (elementos.infoEmail) elementos.infoEmail.style.display = 'none';
    if (elementos.infoBasica) elementos.infoBasica.style.display = 'block';
    if (elementos.btnNext) elementos.btnNext.style.display = 'inline-flex';
    if (elementos.btnSubmit) elementos.btnSubmit.style.display = 'none';
  }
  
  guardarBorradorFormulario();
}

function obtenerSiguientePaso(pasoActual) {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  
  if (tipoSolicitud === 'informacion') return null;
  
  switch (pasoActual) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 4;
    case 4: return null;
    default: return null;
  }
}

function obtenerPasoAnterior(pasoActual) {
  switch (pasoActual) {
    case 2: return 1;
    case 3: return 2;
    case 4: return 3;
    default: return null;
  }
}

export function irAPaso(paso) {
  if (paso < 1 || paso > maxPasoFormulario) return;

  document.querySelectorAll('.form-step').forEach(stepDiv => {
    stepDiv.classList.remove('active');
  });
  
  const pasoObjetivo = document.querySelector(`.form-step[data-step="${paso}"]`);
  if (pasoObjetivo) {
    pasoObjetivo.classList.add('active');
    
    setTimeout(() => {
      const primerInput = pasoObjetivo.querySelector('input:not([type="hidden"]), select, textarea');
      if (primerInput && !primerInput.disabled) primerInput.focus();
    }, 100);
  }

  actualizarIndicadorProgreso(paso, maxPasoFormulario);
  pasoFormularioActual = paso;
  guardarBorradorFormulario();
}

function actualizarIndicadorProgreso(actual, total) {
  const barraProgreso = document.getElementById('form-progress');
  const textoProgreso = document.getElementById('progress-text');
  
  if (barraProgreso) {
    const porcentaje = (actual / total) * 100;
    barraProgreso.style.width = `${porcentaje}%`;
  }
  
  if (textoProgreso) {
    textoProgreso.textContent = `Paso ${actual} de ${total}`;
  }
}

function actualizarColorMotivacion(valor) {
  const elementoValor = document.getElementById('motivacion-value');
  if (!elementoValor) return;
  
  const numValor = parseInt(valor);
  let color;
  
  if (numValor <= 3) {
    color = 'var(--danger-red)';
  } else if (numValor <= 6) {
    color = 'var(--warning-orange)';
  } else {
    color = 'var(--success-green)';
  }
  
  elementoValor.style.backgroundColor = color;
  elementoValor.style.color = 'white';
}

async function manejarEnvioSoloInformacion() {
  try {
    const email = document.getElementById('info-email')?.value?.trim();
    
    if (!email || !esEmailValido(email)) {
      mostrarNotificacion('Email inválido', 'error');
      return;
    }
    
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
    
    localStorage.removeItem('senda_form_draft');
    cerrarModal('patient-modal');
    reiniciarFormulario();
    
    mostrarNotificacion('Solicitud de información enviada correctamente. Te responderemos pronto.', 'success', 6000);
    
  } catch (error) {
    console.error('Error enviando información:', error);
    mostrarNotificacion('Error al enviar la solicitud: ' + error.message, 'error');
  }
}

async function manejarEnvioFormulario(e) {
  e.preventDefault();
  
  const btnEnvio = document.getElementById('submit-form');
  
  try {
    alternarBotonEnvio(btnEnvio, true);
    
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (tipoSolicitud !== 'identificado') {
      mostrarNotificacion('Tipo de solicitud no válido para este flujo', 'error');
      return;
    }

    if (!validarDatosCompletos()) return;
    
    const datosSolicitud = recopilarDatosFormulario();
    datosSolicitud.prioridad = calcularPrioridad(datosSolicitud);
    
    mostrarCarga(true, 'Enviando solicitud...');
    
    const docRef = await db.collection('solicitudes_ingreso').add(datosSolicitud);
    
    if (datosSolicitud.prioridad === 'critica') {
      await crearAlertaCritica(datosSolicitud, docRef.id);
    }
    
    localStorage.removeItem('senda_form_draft');
    cerrarModal('patient-modal');
    reiniciarFormulario();
    
    mostrarNotificacion('Solicitud enviada correctamente. Te contactaremos pronto.', 'success', 6000);
    
  } catch (error) {
    console.error('Error enviando solicitud:', error);
    mostrarNotificacion('Error al enviar la solicitud: ' + error.message, 'error');
  } finally {
    alternarBotonEnvio(btnEnvio, false);
    mostrarCarga(false);
  }
}

function validarDatosCompletos() {
  const camposRequeridos = [
    { id: 'patient-age', nombre: 'Edad' },
    { id: 'patient-cesfam', nombre: 'CESFAM' },
    { id: 'patient-name', nombre: 'Nombre' },
    { id: 'patient-lastname', nombre: 'Apellidos' },
    { id: 'patient-rut', nombre: 'RUT' },
    { id: 'patient-phone', nombre: 'Teléfono' }
  ];
  
  for (const campo of camposRequeridos) {
    const elemento = document.getElementById(campo.id);
    if (!elemento?.value?.trim()) {
      mostrarNotificacion(`${campo.nombre} es obligatorio`, 'warning');
      return false;
    }
  }
  
  const rut = document.getElementById('patient-rut').value.trim();
  if (!validarRUT(rut)) {
    mostrarNotificacion('RUT inválido', 'warning');
    return false;
  }
  
  const telefono = document.getElementById('patient-phone').value.trim();
  if (!validarTelefono(telefono)) {
    mostrarNotificacion('Teléfono inválido', 'warning');
    return false;
  }
  
  return true;
}

function recopilarDatosFormulario() {
  const datos = {
    tipoSolicitud: 'identificado',
    nombre: document.getElementById('patient-name')?.value?.trim(),
    apellidos: document.getElementById('patient-lastname')?.value?.trim(),
    rut: formatearRUT(document.getElementById('patient-rut')?.value?.trim()),
    telefono: document.getElementById('patient-phone')?.value?.trim(),
    email: document.getElementById('patient-email')?.value?.trim(),
    edad: parseInt(document.getElementById('patient-age')?.value) || null,
    cesfam: document.getElementById('patient-cesfam')?.value || '',
    paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || '',
    direccion: document.getElementById('patient-address')?.value?.trim(),
    descripcion: document.getElementById('patient-description')?.value?.trim(),
    urgencia: document.querySelector('input[name="urgencia"]:checked')?.value,
    tratamientoPrevio: document.querySelector('input[name="tratamientoPrevio"]:checked')?.value,
    tiempoConsumo: document.getElementById('tiempo-consumo')?.value,
    motivacion: parseInt(document.getElementById('motivacion-range')?.value),
    fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
    estado: 'pendiente',
    origen: 'web_publica',
    version: '2.0'
  };

  // Sustancias seleccionadas
  const sustanciasSeleccionadas = document.querySelectorAll('input[name="sustancias"]:checked');
  if (sustanciasSeleccionadas.length > 0) {
    datos.sustancias = Array.from(sustanciasSeleccionadas).map(cb => cb.value);
  }

  return datos;
}

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

async function crearAlertaCritica(datos, solicitudId) {
  try {
    const datosAlerta = {
      id_solicitud: solicitudId,
      mensaje: `Nuevo caso crítico: ${datos.edad} años, urgencia ${datos.urgencia}`,
      prioridad: 'maxima',
      tipo_alerta: 'caso_critico_nuevo',
      estado: 'pendiente',
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      notificado: false,
      cesfam: datos.cesfam,
      datos_paciente: {
        edad: datos.edad,
        sustancias: datos.sustancias,
        urgencia: datos.urgencia,
        motivacion: datos.motivacion
      }
    };
    
    await db.collection('alertas_criticas').add(datosAlerta);
  } catch (error) {
    console.error('Error creando alerta crítica:', error);
  }
}

function configurarFormularioReingreso() {
  const formularioReingreso = document.getElementById('reentry-form');
  if (formularioReingreso) {
    formularioReingreso.addEventListener('submit', manejarEnvioReingreso);
  }
}

async function manejarEnvioReingreso(e) {
  e.preventDefault();
  
  const datos = {
    nombre: document.getElementById('reentry-name')?.value?.trim(),
    rut: document.getElementById('reentry-rut')?.value?.trim(),
    cesfam: document.getElementById('reentry-cesfam')?.value,
    motivo: document.getElementById('reentry-reason')?.value?.trim(),
    telefono: document.getElementById('reentry-phone')?.value?.trim()
  };
  
  // Validaciones
  const camposRequeridos = ['nombre', 'rut', 'cesfam', 'motivo', 'telefono'];
  for (const campo of camposRequeridos) {
    if (!datos[campo]) {
      mostrarNotificacion(`${campo} es obligatorio`, 'warning');
      return;
    }
  }

  if (!validarRUT(datos.rut)) {
    mostrarNotificacion('RUT inválido', 'warning');
    return;
  }

  const btnEnvio = e.target.querySelector('button[type="submit"]');
  
  try {
    alternarBotonEnvio(btnEnvio, true);
    
    // Verificar reingresos existentes
    const rutFormateado = formatearRUT(datos.rut);
    const reingresoExistente = await db.collection('reingresos')
      .where('rut', '==', rutFormateado)
      .where('estado', '==', 'pendiente')
      .get();
    
    if (!reingresoExistente.empty) {
      mostrarNotificacion('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
      return;
    }
    
    const datosReingreso = {
      ...datos,
      rut: rutFormateado,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      prioridad: 'media',
      tipo: 'reingreso',
      origen: 'web_publica',
      version: '2.0'
    };

    await db.collection('reingresos').add(datosReingreso);
    
    cerrarModal('reentry-modal');
    e.target.reset();
    mostrarNotificacion('Solicitud de reingreso enviada correctamente.', 'success', 5000);
    
  } catch (error) {
    console.error('Error enviando reingreso:', error);
    mostrarNotificacion('Error al enviar la solicitud: ' + error.message, 'error');
  } finally {
    alternarBotonEnvio(btnEnvio, false);
  }
}

export function reiniciarFormulario() {
  const formulario = document.getElementById('patient-form');
  if (formulario) {
    formulario.reset();
    irAPaso(1);
    
    const motivacion = document.getElementById('motivacion-range');
    const valorMotivacion = document.getElementById('motivacion-value');
    if (motivacion && valorMotivacion) {
      motivacion.value = 5;
      valorMotivacion.textContent = '5';
      actualizarColorMotivacion(5);
    }
    
    formulario.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });
    
    maxPasoFormulario = 4;
    actualizarIndicadorProgreso(1, 4);
    
    // Resetear visibilidad de containers
    const elementos = {
      infoEmail: document.getElementById('info-email-container'),
      infoBasica: document.getElementById('basic-info-container'),
      btnNext: document.getElementById('next-step-1'),
      btnSubmit: document.getElementById('submit-step-1')
    };
    
    if (elementos.infoEmail) elementos.infoEmail.style.display = 'none';
    if (elementos.infoBasica) elementos.infoBasica.style.display = 'block';
    if (elementos.btnNext) elementos.btnNext.style.display = 'inline-flex';
    if (elementos.btnSubmit) elementos.btnSubmit.style.display = 'none';
  }
  
  esBorradorGuardado = false;
  localStorage.removeItem('senda_form_draft');
}
