// src/js/seguimiento/atenciones.js
import { db } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarModal, cerrarModal } from '../utilidades/modales.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

export function mostrarModalAtencion(pacienteRut, pacienteNombre) {
  const modal = `
    <div class="modal-overlay temp-modal" id="atencion-modal">
      <div class="modal">
        <button class="modal-close" onclick="window.SENDA.cerrarModal('atencion-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div style="padding:24px;">
          <h2>Registrar Atención</h2>
          <p><strong>Paciente:</strong> ${pacienteNombre} (${pacienteRut})</p>
          <form id="atencion-form">
            <div class="form-group">
              <label class="form-label">Detalle de la atención *</label>
              <textarea id="atencion-detalle" class="form-textarea" rows="5" required 
                        placeholder="Describe los aspectos más relevantes de la atención brindada..."></textarea>
            </div>
            <div style="text-align:right;margin-top:16px;">
              <button type="button" class="btn btn-outline" onclick="window.SENDA.cerrarModal('atencion-modal')" style="margin-right: 8px;">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Guardar Atención
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  mostrarModal('atencion-modal');
  
  document.getElementById('atencion-form').addEventListener('submit', async function(e) {
    await manejarEnvioAtencion(e, pacienteRut, pacienteNombre);
  });
}

async function manejarEnvioAtencion(e, pacienteRut, pacienteNombre) {
  e.preventDefault();
  
  const detalle = document.getElementById('atencion-detalle').value.trim();
  if (!detalle) {
    mostrarNotificacion('Debes escribir el detalle de la atención', 'warning');
    return;
  }
  
  const botonEnvio = e.target.querySelector('button[type="submit"]');
  
  try {
    alternarBotonEnvio(botonEnvio, true);
    
    const usuarioActual = obtenerUsuarioActual();
    const datosUsuario = obtenerDatosUsuario();
    
    const datosAtencion = {
      pacienteRut,
      pacienteNombre,
      detalle,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      profesional: datosUsuario ? `${datosUsuario.nombre} ${datosUsuario.apellidos}` : '',
      profesionalId: usuarioActual ? usuarioActual.uid : '',
      cesfam: datosUsuario ? datosUsuario.cesfam : '',
      tipo: 'seguimiento',
      estado: 'completada'
    };
    
    await db.collection('atenciones').add(datosAtencion);
    
    mostrarNotificacion('Atención registrada exitosamente', 'success');
    cerrarModal('atencion-modal');
    
  } catch (error) {
    console.error('Error guardando atención:', error);
    mostrarNotificacion('Error guardando atención: ' + error.message, 'error');
  } finally {
    alternarBotonEnvio(botonEnvio, false);
  }
}

// Función global para compatibilidad
window.SENDA = {
  ...window.SENDA,
  registrarAtencion: mostrarModalAtencion
};
