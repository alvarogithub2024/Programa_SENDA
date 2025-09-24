// src/js/seguimiento/timeline.js
import { db } from '../configuracion/firebase.js';
import { obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarCarga, mostrarNotificacion } from '../utilidades/notificaciones.js';
import { PROFESIONES, ESTADOS_CITA } from '../configuracion/constantes.js';

export async function cargarSeguimiento() {
  const datosUsuario = obtenerDatosUsuario();
  if (!datosUsuario) return;
  
  try {
    mostrarCarga(true, 'Cargando seguimiento...');
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    // Cargar citas de hoy
    const citasHoySnapshot = await db.collection('citas')
      .where('cesfam', '==', datosUsuario.cesfam)
      .where('fecha', '>=', hoy)
      .where('fecha', '<', manana)
      .orderBy('fecha', 'asc')
      .get();
    
    renderizarTimelinePacientes(citasHoySnapshot);
    
    // Cargar próximas citas
    const proximasCitasSnapshot = await db.collection('citas')
      .where('cesfam', '==', datosUsuario.cesfam)
      .where('fecha', '>=', manana)
      .orderBy('fecha', 'asc')
      .limit(10)
      .get();
    
    renderizarProximasCitas(proximasCitasSnapshot);
    
  } catch (error) {
    console.error('Error cargando seguimiento:', error);
    mostrarNotificacion('Error al cargar seguimiento: ' + error.message, 'error');
  } finally {
    mostrarCarga(false);
  }
}

function renderizarTimelinePacientes(citasSnapshot) {
  const timeline = document.getElementById('patients-timeline');
  if (!timeline) return;
  
  if (citasSnapshot.empty) {
    timeline.innerHTML = `
      <div class="no-results">
        <i class="fas fa-calendar-day"></i>
        <h3>No hay pacientes agendados para hoy</h3>
        <p>No se encontraron citas programadas para hoy</p>
      </div>
    `;
    return;
  }
  
  const citas = [];
  citasSnapshot.forEach(doc => {
    citas.push({ id: doc.id, ...doc.data() });
  });
  
  timeline.innerHTML = citas.map(cita => {
    const fecha = cita.fecha.toDate();
    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const estado = cita.estado || 'programada';
    const estadoInfo = ESTADOS_CITA[estado];
    
    return `
      <div class="timeline-item" onclick="window.SENDA.registrarAtencion('${cita.pacienteRut}', '${cita.pacienteNombre}')">
        <div class="timeline-time">${hora}</div>
        <div class="timeline-patient">
          <h4>${cita.pacienteNombre}</h4>
          <p>${PROFESIONES[cita.tipoProfesional] || cita.tipoProfesional} - ${cita.profesionalNombre}</p>
          <small>Tipo: ${cita.tipo || 'General'}</small>
        </div>
        <span class="timeline-status ${estado}" style="color: ${estadoInfo?.color || '#6b7280'}">
          <i class="fas fa-${estadoInfo?.icon || 'circle'}"></i>
          ${estado.toUpperCase()}
        </span>
      </div>
    `;
  }).join('');
}

function renderizarProximasCitas(citasSnapshot) {
  const grilla = document.getElementById('upcoming-appointments-grid');
  const seccionSinProximas = document.getElementById('no-upcoming-section');
  
  if (!grilla) return;
  
  if (citasSnapshot.empty) {
    if (seccionSinProximas) seccionSinProximas.style.display = 'block';
    grilla.innerHTML = '';
    return;
  }
  
  if (seccionSinProximas) seccionSinProximas.style.display = 'none';
  
  const citas = [];
  citasSnapshot.forEach(doc => {
    citas.push({ id: doc.id, ...doc.data() });
  });
  
  grilla.innerHTML = citas.map(cita => {
    const fecha = cita.fecha.toDate();
    const fechaStr = fecha.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    
    return `
      <div class="appointment-card">
        <div class="appointment-card-header">
          <span class="appointment-date">
            <i class="fas fa-calendar"></i>
            ${fechaStr}
          </span>
          <span class="appointment-time">
            <i class="fas fa-clock"></i>
            ${hora}
          </span>
        </div>
        <div class="appointment-card-body">
          <h4>${cita.pacienteNombre}</h4>
          <p><i class="fas fa-user-md"></i> ${PROFESIONES[cita.tipoProfesional] || cita.tipoProfesional}</p>
          <p><i class="fas fa-tags"></i> ${cita.tipo || 'General'}</p>
        </div>
        <div class="appointment-card-footer">
          <span class="status-badge ${cita.estado || 'programada'}">
            ${(cita.estado || 'programada').toUpperCase()}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
