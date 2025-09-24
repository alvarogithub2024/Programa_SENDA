// src/js/formularios/autoguardado.js
export function guardarBorradorFormulario() {
  try {
    const formulario = document.getElementById('patient-form');
    if (!formulario) return;
    
    const datosFormulario = new FormData(formulario);
    const datosBorrador = {};
    
    for (let [clave, valor] of datosFormulario.entries()) {
      datosBorrador[clave] = valor;
    }
    
    // Agregar metadatos
    datosBorrador.pasoActual = obtenerPasoActual();
    datosBorrador.maxPaso = obtenerMaxPaso();
    datosBorrador.timestamp = Date.now();
    
    localStorage.setItem('senda_form_draft', JSON.stringify(datosBorrador));
    console.log('💾 Borrador guardado automáticamente');
    
  } catch (error) {
    console.error('Error guardando borrador:', error);
  }
}

export function cargarBorradorFormulario() {
  try {
    const borradorGuardado = localStorage.getItem('senda_form_draft');
    if (!borradorGuardado) return;
    
    const datosBorrador = JSON.parse(borradorGuardado);
    
    // Verificar que el borrador no sea muy antiguo (24 horas)
    if (Date.now() - datosBorrador.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('senda_form_draft');
      return;
    }
    
    restaurarBorradorFormulario(datosBorrador);
    
  } catch (error) {
    console.error('Error cargando borrador:', error);
    localStorage.removeItem('senda_form_draft');
  }
}

function restaurarBorradorFormulario(datosBorrador) {
  try {
    const formulario = document.getElementById('patient-form');
    if (!formulario) return;
    
    // Restaurar valores de los campos
    Object.keys(datosBorrador).forEach(clave => {
      if (['pasoActual', 'maxPaso', 'timestamp'].includes(clave)) return;
      
      const campo = formulario.querySelector(`[name="${clave}"]`);
      if (campo) {
        if (campo.type === 'radio' || campo.type === 'checkbox') {
          campo.checked = campo.value === datosBorrador[clave];
        } else {
          campo.value = datosBorrador[clave];
        }
      }
    });
    
    // Restaurar estado del formulario
    if (datosBorrador.maxPaso) {
      setMaxPaso(datosBorrador.maxPaso);
    }
    
    if (datosBorrador.pasoActual) {
      const { irAPaso } = import('./formulario-paciente.js');
      irAPaso.then(fn => fn(datosBorrador.pasoActual));
    }
    
    // Disparar eventos de cambio para actualizar la UI
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    if (tipoSolicitud) {
      tipoSolicitud.dispatchEvent(new Event('change'));
    }
    
    console.log('📋 Borrador restaurado');
    
  } catch (error) {
    console.error('Error restaurando borrador:', error);
  }
}

function obtenerPasoActual() {
  const pasoActivo = document.querySelector('.form-step.active');
  return pasoActivo ? parseInt(pasoActivo.dataset.step) : 1;
}

function obtenerMaxPaso() {
  const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
  return tipoSolicitud === 'informacion' ? 1 : 4;
}

function setMaxPaso(maxPaso) {
  // Esta función sería llamada desde el formulario principal
  window.maxPasoFormulario = maxPaso;
}
