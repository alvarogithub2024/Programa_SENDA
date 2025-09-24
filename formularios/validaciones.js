// src/js/formularios/validaciones.js
import { validarRUT, validarTelefono, esEmailValido } from '../utilidades/formato.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';

export function validarPaso(paso) {
  try {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const pasoActual = document.querySelector(`.form-step[data-step="${paso}"]`);
    
    if (!pasoActual) return false;

    const camposRequeridos = pasoActual.querySelectorAll('[required]:not([style*="display: none"])');
    let esValido = true;
    const errores = [];

    // Validar campos requeridos
    camposRequeridos.forEach(campo => {
      const valor = campo.value?.trim() || '';
      
      if (!valor) {
        campo.classList.add('error');
        errores.push(`${obtenerEtiquetaCampo(campo)} es obligatorio`);
        esValido = false;
      } else {
        campo.classList.remove('error');
      }
    });

    // Validaciones específicas por paso
    if (paso === 1) {
      if (!validarPaso1(tipoSolicitud, errores)) esValido = false;
    } else if (paso === 2) {
      if (!validarPaso2(errores)) esValido = false;
    } else if (paso === 3) {
      if (!validarPaso3(errores)) esValido = false;
    }

    if (errores.length > 0) {
      mostrarNotificacion(errores.join('\n'), 'warning', 5000);
    }

    return esValido;
  } catch (error) {
    console.error('Error validando paso:', error);
    return false;
  }
}

function validarPaso1(tipoSolicitud, errores) {
  let esValido = true;

  if (!tipoSolicitud) {
    errores.push('Selecciona un tipo de solicitud');
    esValido = false;
  } else if (tipoSolicitud === 'informacion') {
    const email = document.getElementById('info-email');
    if (!email?.value?.trim()) {
      errores.push('Ingresa un email para recibir información');
      esValido = false;
    } else if (!esEmailValido(email.value.trim())) {
      errores.push('Ingresa un email válido');
      esValido = false;
    }
  } else if (tipoSolicitud === 'identificado') {
    const edad = parseInt(document.getElementById('patient-age')?.value);
    if (!edad || edad < 12 || edad > 120) {
      errores.push('La edad debe estar entre 12 y 120 años');
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
  }

  return esValido;
}

function validarPaso2(errores) {
  let esValido = true;

  const rut = document.getElementById('patient-rut');
  if (rut?.value?.trim() && !validarRUT(rut.value.trim())) {
    errores.push('RUT inválido');
    esValido = false;
  }

  const telefono = document.getElementById('patient-phone');
  if (telefono?.value?.trim() && !validarTelefono(telefono.value.trim())) {
    errores.push('Teléfono inválido');
    esValido = false;
  }

  const email = document.getElementById('patient-email');
  if (email?.value?.trim() && !esEmailValido(email.value.trim())) {
    errores.push('Email inválido');
    esValido = false;
  }

  return esValido;
}

function validarPaso3(errores) {
  let esValido = true;

  const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
  if (sustancias.length === 0) {
    errores.push('Selecciona al menos una sustancia');
    esValido = false;
  }

  const urgencia = document.querySelector('input[name="urgencia"]:checked');
  if (!urgencia) {
    errores.push('Selecciona el nivel de urgencia');
    esValido = false;
  }

  const tratamiento = document.querySelector('input[name="tratamientoPrevio"]:checked');
  if (!tratamiento) {
    errores.push('Indica si has recibido tratamiento previo');
    esValido = false;
  }

  return esValido;
}

function obtenerEtiquetaCampo(campo) {
  try {
    const etiqueta = campo.closest('.form-group')?.querySelector('label');
    return etiqueta ? etiqueta.textContent.replace('*', '').trim() : 'Campo';
  } catch (error) {
    return 'Campo';
  }
}

export function validarFormularioCompleto() {
  for (let paso = 1; paso <= 4; paso++) {
    if (!validarPaso(paso)) return false;
  }
  return true;
}
