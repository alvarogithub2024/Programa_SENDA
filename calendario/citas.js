// src/js/calendario/citas.js
import { db } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarModal, cerrarModal } from '../utilidades/modales.js';
import { mostrarNotificacion, mostrarCarga } from '../utilidades/notificaciones.js';
import { alternarBotonEnvio, formatearRUT, validarRUT, validarTelefono, parsearFechaLocal } from '../utilidades/formato.js';
import { generarHorarios, obtenerHorasOcupadas } from './horarios.js';

export async function crearModalNuevaCita(fechaEspecifica = null) {
  const modalHTML = `
    <div class="modal-overlay temp-modal" id="nueva-cita-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="window.SENDA.cerrarModal('nueva-cita-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-plus"></i> Nueva Cita</h2>
          
          <form id="nueva-cita-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Nombre del Paciente *</label>
                <input type="text" class="form-input" id="nueva-cita-nombre" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">RUT *</label>
                <input type="text" class="form-input" id="nueva-cita-rut" placeholder="12.345.678-9" required>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label">Profesional *</label>
                <select class="form-select" id="nueva-cita-professional" required>
                  <option value="">Seleccionar profesional...</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input type="date" class="form-input" id="nueva-cita-date" required>
              </div>
            </div>
            
            <div class="time-slots-container" id="nueva-cita-time-slots-container" style="display: none;">
              <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                <i class="fas fa-clock"></i> Horarios Disponibles
              </h4>
              <div class="time-slots-grid" id="nueva-cita-time-slots-grid"></div>
            </div>
            
            <div class="form-group" style="margin-top: 24px;">
              <label class="form-label">Observaciones</label>
              <textarea class="form-textarea" id="nueva-cita-notes" rows="3" 
                        placeholder="Observaciones adicionales..."></textarea>
            </div>
            
            <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" class="btn btn-outline" onclick="window.SENDA.cerrarModal('nueva-cita-modal')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button type="submit" class="btn btn-success" disabled>
                <i class="fas fa-calendar-check"></i>
                Crear Cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  mostrarModal('nueva-cita-modal');
  
  await cargarProfesionalesParaCita();
  configurarEventosNuevaCita();
  
  if (fechaEspecifica) {
    const inputFecha = document.getElementById('nueva-cita-date');
    if (inputFecha) {
      const fecha = new Date(fechaEspecifica);
      const hoy = new Date();
      
      if (fecha < hoy.setHours(0,0,0,0)) fecha.setTime(hoy.getTime());
      inputFecha.value = fecha.toISOString().split('T')[0];
    }
  }
}

async function cargarProfesionalesParaCita() {
  try {
    const selectProfesional = document.getElementById('nueva-cita-professional');
    if (!selectProfesional) return;

    const datosUsuario = obtenerDatosUsuario();
    if (!datosUsuario) return;

    const snapshot = await db.collection('profesionales')
      .where('cesfam', '==', datosUsuario.cesfam)
      .where('activo', '==', true)
      .get();
    
    selectProfesional.innerHTML = '<option value="">Seleccionar profesional...</option>';
    
    snapshot.forEach(doc => {
      const prof = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${prof.nombre} ${prof.apellidos} - ${obtenerNombreProfesion(prof.profession)}`;
      option.dataset.profession = prof.profession;
      option.dataset.nombre = `${prof.nombre} ${prof.apellidos}`;
      selectProfesional.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error cargando profesionales:', error);
    mostrarNotificacion('Error al cargar profesionales', 'error');
  }
}

function configurarEventosNuevaCita() {
  const selectProfesional = document.getElementById('nueva-cita-professional');
  const inputFecha = document.getElementById('nueva-cita-date');
  const formulario = document.getElementById('nueva-cita-form');
  const inputRut = document.getElementById('nueva-cita-rut');
  
  // Configurar fecha mínima
  if (inputFecha) {
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.min = hoy;
    if (!inputFecha.value) inputFecha.value = hoy;
  }

  // Formatear RUT mientras se escribe
  if (inputRut) {
    inputRut.addEventListener('input', (e) => {
      e.target.value = formatearRUT(e.target.value);
    });
  }

  // Cargar horarios cuando cambien profesional o fecha
  if (selectProfesional) {
    selectProfesional.addEventListener('change', cargarHorariosCita);
  }
  
  if (inputFecha) {
    inputFecha.addEventListener('change', cargarHorariosCita);
  }

  // Manejar envío del formulario
  if (formulario) {
    formulario.addEventListener('submit', manejarEnvioCita);
  }
}

async function cargarHorariosCita() {
  try {
    const selectProfesional = document.getElementById('nueva-cita-professional');
    const inputFecha = document.getElementById('nueva-cita-date');
    const contenedorHorarios = document.getElementById('nueva-cita-time-slots-container');
    const grillaHorarios = document.getElementById('nueva-cita-time-slots-grid');
    const botonEnvio = document.querySelector('#nueva-cita-form button[type="submit"]');
    
    if (!selectProfesional?.value || !inputFecha?.value) {
      if (contenedorHorarios) contenedorHorarios.style.display = 'none';
      if (botonEnvio) botonEnvio.disabled = true;
      return;
    }

    const fechaSeleccionada = parsearFechaLocal(inputFecha.value);
    const horariosDisponibles = generarHorarios(fechaSeleccionada);
    const horasOcupadas = await obtenerHorasOcupadas(selectProfesional.value, fechaSeleccionada);
    
    if (grillaHorarios) {
      grillaHorarios.innerHTML = horariosDisponibles.map(slot => {
        const estaOcupado = horasOcupadas.includes(slot.time);
        const esPasado = esHorarioPasado(fechaSeleccionada, slot.hour, slot.minute);
        const estaDeshabilitado = estaOcupado || esPasado;
        
        return `
          <button type="button" 
                  class="time-slot ${estaDeshabilitado ? 'disabled' : ''}" 
                  data-time="${slot.time}"
                  ${estaDeshabilitado ? 'disabled' : ''}
                  onclick="seleccionarHorarioCita(this)"
                  style="
                    padding: 12px;
                    border: 2px solid ${estaDeshabilitado ? 'var(--gray-300)' : 'var(--primary-blue)'};
                    border-radius: 8px;
                    background: ${estaDeshabilitado ? 'var(--gray-100)' : 'white'};
                    color: ${estaDeshabilitado ? 'var(--gray-400)' : 'var(--primary-blue)'};
                    cursor: ${estaDeshabilitado ? 'not-allowed' : 'pointer'};
                    font-weight: 500;
                  ">
            <i class="fas fa-clock" style="margin-right: 4px;"></i>
            ${slot.time}
            ${estaOcupado ? '<br><small>Ocupado</small>' : ''}
            ${esPasado ? '<br><small>Pasado</small>' : ''}
          </button>
        `;
      }).join('');
    }
    
    if (contenedorHorarios) contenedorHorarios.style.display = 'block';
    if (botonEnvio) botonEnvio.disabled = true;
    
  } catch (error) {
    console.error('Error cargando horarios de cita:', error);
    mostrarNotificacion('Error al cargar horarios disponibles', 'error');
  }
}

function esHorarioPasado(fecha, hora, minuto) {
  const ahora = new Date();
  const horarioCita = new Date(fecha);
  horarioCita.setHours(hora, minuto, 0, 0);

  const tiempoBuffer = new Date(ahora);
  tiempoBuffer.setMinutes(tiempoBuffer.getMinutes() + 30);

  return horarioCita <= tiempoBuffer;
}

window.seleccionarHorarioCita = function(boton) {
  try {
    document.querySelectorAll('#nueva-cita-time-slots-grid .time-slot.selected').forEach(slot => {
      slot.classList.remove('selected');
      slot.style.background = 'white';
      slot.style.color = 'var(--primary-blue)';
    });
    
    boton.classList.add('selected');
    boton.style.background = 'var(--primary-blue)';
    boton.style.color = 'white';
    
    const botonEnvio = document.querySelector('#nueva-cita-form button[type="submit"]');
    if (botonEnvio) botonEnvio.disabled = false;
    
  } catch (error) {
    console.error('Error seleccionando horario:', error);
  }
};

async function manejarEnvioCita(e) {
  e.preventDefault();
  
  try {
    const datosCita = {
      nombre: document.getElementById('nueva-cita-nombre')?.value?.trim(),
      rut: document.getElementById('nueva-cita-rut')?.value?.trim(),
      profesionalId: document.getElementById('nueva-cita-professional')?.value,
      fecha: document.getElementById('nueva-cita-date')?.value,
      hora: document.querySelector('#nueva-cita-time-slots-grid .time-slot.selected')?.dataset.time,
      observaciones: document.getElementById('nueva-cita-notes')?.value?.trim() || ''
    };
    
    // Validaciones
    if (!datosCita.nombre || !datosCita.rut || !datosCita.profesionalId || !datosCita.fecha || !datosCita.hora) {
      mostrarNotificacion('Completa todos los campos obligatorios', 'warning');
      return;
    }
    
    if (!validarRUT(datosCita.rut)) {
      mostrarNotificacion('RUT inválido', 'warning');
      return;
    }
    
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    alternarBotonEnvio(botonEnvio, true);
    
    // Obtener datos del profesional seleccionado
    const selectProfesional = document.getElementById('nueva-cita-professional');
    const opcionSeleccionada = selectProfesional.options[selectProfesional.selectedIndex];
    const nombreProfesional = opcionSeleccionada.dataset.nombre;
    const tipoProfesional = opcionSeleccionada.dataset.profession;
    
    const fechaCompleta = new Date(`${datosCita.fecha}T${datosCita.hora}:00`);
    const datosUsuario = obtenerDatosUsuario();
    const usuarioActual = obtenerUsuarioActual();
    
    const datosGuardar = {
      profesionalId: datosCita.profesionalId,
      profesionalNombre: nombreProfesional,
      tipoProfesional: tipoProfesional,
      pacienteNombre: datosCita.nombre,
      pacienteRut: formatearRUT(datosCita.rut),
      fecha: fechaCompleta,
      estado: 'programada',
      tipo: 'cita_directa',
      cesfam: datosUsuario.cesfam,
      observaciones: datosCita.observaciones,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: usuarioActual.uid
    };
    
    const refCita = await db.collection('citas').add(datosGuardar);
    
    // Registrar paciente automáticamente si no existe
    await registrarPacienteAutomatico(datosCita, refCita.id);
    
    cerrarModal('nueva-cita-modal');
    mostrarNotificacion(`Cita creada exitosamente para ${fechaCompleta.toLocaleDateString('es-CL')} a las ${datosCita.hora}`, 'success', 5000);
    
    // Actualizar calendario
    const { renderizarCalendario, cargarCitasDia } = await import('./calendario.js');
    renderizarCalendario();
    if (document.querySelector('.calendar-day.selected')) {
      cargarCitasDia(new Date(fechaCompleta));
    }
    
  } catch (error) {
    console.error('Error creando cita:', error);
    mostrarNotificacion('Error al crear cita: ' + error.message, 'error');
  } finally {
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    if (botonEnvio) alternarBotonEnvio(botonEnvio, false);
  }
}

async function registrarPacienteAutomatico(datosCita, citaId) {
  try {
    const datosUsuario = obtenerDatosUsuario();
    const rutFormateado = formatearRUT(datosCita.rut);
    
    // Verificar si ya existe el paciente
    const pacienteExistente = await db.collection('pacientes')
      .where('rut', '==', rutFormateado)
      .where('cesfam', '==', datosUsuario.cesfam)
      .get();
    
    if (!pacienteExistente.empty) return;
    
    const datosPaciente = {
      nombre: datosCita.nombre,
      apellidos: '',
      rut: rutFormateado,
      cesfam: datosUsuario.cesfam,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaPrimeraAtencion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'activo',
      citaInicialId: citaId,
      origen: 'cita_directa',
      prioridad: 'media'
    };

    await db.collection('pacientes').add(datosPaciente);
    
  } catch (error) {
    console.error('Error registrando paciente automático:', error);
  }
}

export function mostrarInfoCitaPaciente(cita) {
  const fecha = cita.fecha.toDate();
  const fechaStr = fecha.toLocaleDateString('es-CL');
  const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  const modalInfo = `
    <div class="modal-overlay temp-modal" id="patient-appointment-info-modal">
      <div class="modal">
        <button class="modal-close" onclick="window.SENDA.cerrarModal('patient-appointment-info-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-calendar-check"></i> Información de Cita</h2>
          
          <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px;">
            <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
              ${cita.pacienteNombre}
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div><strong>RUT:</strong> ${cita.pacienteRut || 'No disponible'}</div>
              <div><strong>Fecha:</strong> ${fechaStr}</div>
              <div><strong>Hora:</strong> ${horaStr}</div>
              <div><strong>Profesional:</strong> ${cita.profesionalNombre}</div>
              <div><strong>Tipo:</strong> ${obtenerNombreProfesion(cita.tipoProfesional)}</div>
              <div><strong>Estado:</strong> <span style="font-weight: bold;">${(cita.estado || 'programada').toUpperCase()}</span></div>
            </div>
            
            ${cita.observaciones ? 
              `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                <strong>Observaciones:</strong>
                <p style="margin: 8px 0 0 0; font-style: italic;">${cita.observaciones}</p>
              </div>` : ''
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="window.SENDA.cerrarModal('patient-appointment-info-modal')">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalInfo);
  mostrarModal('patient-appointment-info-modal');
}

function obtenerNombreProfesion(profesion) {
  const profesiones = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional'
  };
  return profesiones[profesion] || profesion;
}
