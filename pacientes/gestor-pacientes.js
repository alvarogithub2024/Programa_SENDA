// src/js/pacientes/gestor-pacientes.js
import { db } from '../configuracion/firebase.js';
import { obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarCarga, mostrarNotificacion } from '../utilidades/notificaciones.js';
import { formatearFecha } from '../utilidades/formato.js';
import { mostrarModal } from '../utilidades/modales.js';
import { CONFIG_APP, PRIORIDADES } from '../configuracion/constantes.js';

let datosPacientes = [];

export async function cargarPacientes() {
  const datosUsuario = obtenerDatosUsuario();
  if (!datosUsuario) return;

  try {
    mostrarCarga(true);
    
    const snapshot = await db.collection('pacientes')
      .where('cesfam', '==', datosUsuario.cesfam)
      .orderBy('fechaCreacion', 'desc')
      .limit(CONFIG_APP.limitePaginacion)
      .get();
    
    datosPacientes = [];
    snapshot.forEach(doc => datosPacientes.push({ id: doc.id, ...doc.data() }));
    renderizarPacientes();
    
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar pacientes', 'error');
    renderizarError(error.message);
  } finally {
    mostrarCarga(false);
  }
}

function renderizarPacientes() {
  const grilla = document.getElementById('patients-grid');
  if (!grilla) return;

  if (!datosPacientes.length) {
    grilla.innerHTML = `
      <div class="no-results">
        <i class="fas fa-users"></i>
        <h3>No hay pacientes</h3>
        <p>No se encontraron pacientes en este CESFAM</p>
      </div>`;
    return;
  }

  grilla.innerHTML = datosPacientes.map(p => `
    <div class="patient-card">
      <div class="patient-header">
        <div>
          <h3>${p.nombre} ${p.apellidos || ''}</h3>
          <p>RUT: ${p.rut}</p>
        </div>
        <span class="patient-status ${p.estado || 'activo'}">${(p.estado || 'activo').toUpperCase()}</span>
      </div>
      <div class="patient-details">
        <div><strong>Edad:</strong> ${p.edad || 'N/A'} años</div>
        <div><strong>Teléfono:</strong> ${p.telefono || 'N/A'}</div>
        <div><strong>Email:</strong> ${p.email || 'N/A'}</div>
        <div><strong>Registrado:</strong> ${formatearFecha(p.fechaCreacion)}</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-primary" onclick="window.SENDA.mostrarDetallePaciente('${p.id}')">
          <i class="fas fa-eye"></i> Ver Ficha
        </button>
      </div>
    </div>
  `).join('');
}

export async function mostrarDetallePaciente(id) {
  try {
    mostrarCarga(true);
    
    const doc = await db.collection('pacientes').doc(id).get();
    if (!doc.exists) {
      mostrarNotificacion('Paciente no encontrado', 'error');
      return;
    }
    
    const p = { id: doc.id, ...doc.data() };
    crearModalDetalle(p);
    mostrarModal('patient-detail-modal');
    cargarAtenciones(p.rut);
    
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar ficha', 'error');
  } finally {
    mostrarCarga(false);
  }
}

function crearModalDetalle(p) {
  const prioridad = PRIORIDADES[p.prioridad || 'media'];
  const modal = `
    <div class="modal-overlay temp-modal" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="window.SENDA.cerrarModal('patient-detail-modal')">×</button>
        <div style="padding:24px">
          <h2><i class="fas fa-user-md"></i> ${p.nombre} ${p.apellidos || ''}</h2>
          
          <div style="background:#f0f8ff;padding:20px;border-radius:12px;margin:20px 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:16px">
              <div>
                <h3 style="margin:0;color:#1e40af">RUT: ${p.rut}</h3>
                <p>CESFAM: ${p.cesfam}</p>
              </div>
              <span style="color:${prioridad.color};font-weight:bold">${prioridad.label}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px">
              <div>
                <h4>Datos Personales</h4>
                <div>Edad: ${p.edad || 'N/A'} años</div>
                <div>Teléfono: ${p.telefono || 'N/A'}</div>
                <div>Email: ${p.email || 'N/A'}</div>
                <div>Dirección: ${p.direccion || 'N/A'}</div>
              </div>
              <div>
                <h4>Información Clínica</h4>
                <div>Estado: ${(p.estado || 'activo').toUpperCase()}</div>
                <div>Origen: ${p.origen || 'N/A'}</div>
                <div>Motivación: ${p.motivacionInicial || 'N/A'}/10</div>
                <div>Registrado: ${formatearFecha(p.fechaCreacion)}</div>
              </div>
            </div>
            
            ${p.sustanciasProblematicas?.length ? `
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.5)">
                <h4>Sustancias Problemáticas</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${p.sustanciasProblematicas.map(s => `<span style="background:#1e40af;color:white;padding:4px 8px;border-radius:4px;font-size:12px">${s}</span>`).join('')}
                </div>
              </div>` : ''}
          </div>
          
          <div>
            <h4>Historial de Atenciones</h4>
            <div id="atenciones-${p.rut}">Cargando...</div>
          </div>
          
          <div style="text-align:right;margin-top:24px">
            <button class="btn btn-outline" onclick="window.SENDA.cerrarModal('patient-detail-modal')">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function cargarAtenciones(rut) {
  try {
    const datosUsuario = obtenerDatosUsuario();
    const snapshot = await db.collection('atenciones')
      .where('pacienteRut', '==', rut)
      .where('cesfam', '==', datosUsuario.cesfam)
      .orderBy('fecha', 'desc')
      .get();

    const contenedor = document.getElementById(`atenciones-${rut}`);
    if (!contenedor) return;

    if (snapshot.empty) {
      contenedor.innerHTML = '<p style="color:gray">Sin atenciones registradas</p>';
      return;
    }

    const atenciones = [];
    snapshot.forEach(doc => atenciones.push(doc.data()));

    contenedor.innerHTML = atenciones.map(a => `
      <div style="margin-bottom:12px;padding:10px;border:1px solid #ddd;border-radius:8px">
        <div><strong>Fecha:</strong> ${a.fecha?.toDate?.() ? a.fecha.toDate().toLocaleString('es-CL') : 'N/A'}</div>
        <div><strong>Profesional:</strong> ${a.profesional || 'N/A'}</div>
        <div><strong>Detalle:</strong> ${a.detalle || 'N/A'}</div>
      </div>
    `).join('');

  } catch (error) {
    const contenedor = document.getElementById(`atenciones-${rut}`);
    if (contenedor) contenedor.innerHTML = '<p style="color:red">Error cargando atenciones</p>';
  }
}

function renderizarError(mensaje) {
  const grilla = document.getElementById('patients-grid');
  if (!grilla) return;
  
  grilla.innerHTML = `
    <div class="no-results">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Error</h3>
      <p>${mensaje}</p>
      <button class="btn btn-primary" onclick="window.SENDA.cargarPacientes()">
        <i class="fas fa-redo"></i> Reintentar
      </button>
    </div>
  `;
}

// Exportar funciones globales
window.SENDA = { ...window.SENDA, cargarPacientes, mostrarDetallePaciente };
