// src/js/navegacion/tabs.js
import { obtenerDatosUsuario, tieneAccesoSolicitudes } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';

export function configurarTabs() {
  const pestanasBtn = document.querySelectorAll('.tab-btn');
  const panelesPestana = document.querySelectorAll('.tab-pane');

  pestanasBtn.forEach(btn => {
    btn.addEventListener('click', () => {
      const pestanaObjetivo = btn.dataset.tab;
      
      if (!puedeAccederPestana(pestanaObjetivo)) {
        mostrarNotificacion('No tienes permisos para acceder a esta sección', 'warning');
        return;
      }

      pestanasBtn.forEach(b => b.classList.remove('active'));
      panelesPestana.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panelObjetivo = document.getElementById(`${pestanaObjetivo}-tab`);
      if (panelObjetivo) {
        panelObjetivo.classList.add('active');
        cargarDatosTab(pestanaObjetivo);
      }
    });
  });

  console.log('✅ Sistema de tabs configurado');
}

export async function cargarDatosTab(nombrePestana) {
  try {
    const datosUsuario = obtenerDatosUsuario();
    if (!datosUsuario) return;

    switch (nombrePestana) {
      case 'solicitudes':
        if (tieneAccesoSolicitudes()) {
          const { cargarSolicitudes } = await import('../solicitudes/gestor-solicitudes.js');
          await cargarSolicitudes();
        }
        break;
      case 'agenda':
        const { cargarCitasHoy } = await import('../calendario/calendario.js');
        await cargarCitasHoy();
        break;
      case 'seguimiento':
        const { cargarSeguimiento } = await import('../seguimiento/timeline.js');
        await cargarSeguimiento();
        break;
      case 'pacientes':
        const { cargarPacientes } = await import('../pacientes/gestor-pacientes.js');
        await cargarPacientes();
        break;
    }
  } catch (error) {
    console.error('Error cargando datos de la pestaña:', error);
    mostrarNotificacion('Error cargando datos de la sección', 'error');
  }
}

function puedeAccederPestana(pestana) {
  const datosUsuario = obtenerDatosUsuario();
  if (!datosUsuario) return false;
  
  switch (pestana) {
    case 'solicitudes':
      return datosUsuario.profession === 'asistente_social';
    case 'agenda':
    case 'seguimiento':
    case 'pacientes':
      return true;
    default:
      return false;
  }
}
