// src/js/pacientes/busqueda.js
import { db } from '../configuracion/firebase.js';
import { obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarCarga, mostrarNotificacion } from '../utilidades/notificaciones.js';
import { formatearRUT, validarRUT } from '../utilidades/formato.js';

export async function buscarPacientePorRUT() {
  try {
    const inputRut = document.getElementById('search-pacientes-rut');
    const contenedorResultados = document.getElementById('pacientes-search-results');
    
    if (!inputRut || !contenedorResultados) return;
    
    const rut = inputRut.value.trim();
    
    if (!rut) {
      mostrarNotificacion('Ingresa un RUT para buscar', 'warning');
      return;
    }
    
    if (!validarRUT(rut)) {
      mostrarNotificacion('RUT inválido', 'error');
      return;
    }
    
    mostrarCarga(true, 'Buscando paciente...');
    
    const datosUsuario = obtenerDatosUsuario();
    const rutFormateado = formatearRUT(rut);
    
    const snapshot = await db.collection('pacientes')
      .where('rut', '==', rutFormateado)
      .where('cesfam', '==', datosUsuario.cesfam)
      .get();
    
    if (snapshot.empty) {
      contenedorResultados.innerHTML = `
        <div class="no-results">
          <i class="fas fa-user-slash"></i>
          <h3>Paciente no encontrado</h3>
          <p>No se encontró ningún paciente con el RUT ${rutFormateado} en tu CESFAM</p>
        </div>
      `;
    } else {
      const pacientes = [];
      snapshot.forEach(doc => {
        pacientes.push({ id: doc.id, ...doc.data() });
      });
      
      contenedorResultados.innerHTML = `
        <h4>Resultados de búsqueda:</h4>
        <div class="patients-grid">
          ${pacientes.map(crearTarjetaPacienteBusqueda).join('')}
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error buscando paciente:', error);
    mostrarNotificacion('Error al buscar paciente: ' + error.message, 'error');
  } finally {
    mostrarCarga(false);
  }
}

function crearTarjetaPacienteBusqueda(paciente) {
  const { formatearFecha } = import('../utilidades/formato.js');
  const fecha = formatearFecha(paciente.fechaCreacion);
  const estado = paciente.estado || 'activo';
  
  return `
    <div class="patient-card">
      <div class="patient-header">
        <div class="patient-info">
          <h3>${paciente.nombre} ${paciente.apellidos || ''}</h3>
          <p>RUT: ${paciente.rut}</p>
        </div>
        <span class="patient-status ${estado}">
          ${estado.toUpperCase()}
        </span>
      </div>
      <div class="patient-details">
        <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
        <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
        <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
        <div><strong>Registrado:</strong> ${fecha}</div>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-primary" onclick="window.SENDA.mostrarDetallePaciente('${paciente.id}')">
          <i class="fas fa-eye"></i>
          Ver Ficha
        </button>
      </div>
    </div>
  `;
}
