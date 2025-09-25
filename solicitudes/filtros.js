import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales para filtros
const currentFilters = {
  estado: 'todos',
  prioridad: 'todos',
  cesfam: 'todos',
  fecha: 'todos',
  busqueda: ''
};

// Este array debe tener TODAS las solicitudes (cárgalo desde tu backend o Firebase)
let solicitudesData = []; // Debes llenar este array en otro archivo o al inicio
let filteredSolicitudesData = [];

// Función para aplicar los filtros y renderizar la tabla
function applyCurrentFilters() {
  filteredSolicitudesData = solicitudesData.filter(solicitud => {
    // Estado
    if (currentFilters.estado !== 'todos' && solicitud.estado !== currentFilters.estado) {
      return false;
    }
    // Prioridad
    if (currentFilters.prioridad !== 'todos' && solicitud.prioridad !== currentFilters.prioridad) {
      return false;
    }
    // CESFAM
    if (currentFilters.cesfam !== 'todos' && solicitud.cesfam !== currentFilters.cesfam) {
      return false;
    }
    // Fecha
    if (currentFilters.fecha !== 'todos') {
      const today = new Date();
      const solicitudDate = new Date(solicitud.fechaCreacion);
      switch (currentFilters.fecha) {
        case 'hoy':
          if (!isSameDay(solicitudDate, today)) return false;
          break;
        case 'semana':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (solicitudDate < weekAgo) return false;
          break;
        case 'mes':
        case 'este mes':
        case 'este_mes':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (solicitudDate < monthAgo) return false;
          break;
      }
    }
    // Buscar (RUT, nombre, email, etc)
    if (currentFilters.busqueda) {
      const search = currentFilters.busqueda.trim().toLowerCase();
      const buscable = `
        ${solicitud.nombre || ''}
        ${solicitud.apellidos || ''}
        ${solicitud.rut || ''}
        ${solicitud.email || ''}
        ${solicitud.telefono || ''}
        ${solicitud.cesfam || ''}
        ${solicitud.descripcion || ''}
      `.toLowerCase();
      if (!buscable.includes(search)) return false;
    }
    return true;
  });
  renderSolicitudesTable();
  if (typeof updateSolicitudesCounter === "function") updateSolicitudesCounter();
}

// Función para comparar días iguales
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

// Listeners para los filtros
document.getElementById('filtro-estado-solicitudes').addEventListener('change', function(e) {
  currentFilters.estado = e.target.value;
  applyCurrentFilters();
});
document.getElementById('filtro-prioridad-solicitudes').addEventListener('change', function(e) {
  currentFilters.prioridad = e.target.value;
  applyCurrentFilters();
});
document.getElementById('filtro-cesfam-solicitudes').addEventListener('change', function(e) {
  currentFilters.cesfam = e.target.value;
  applyCurrentFilters();
});
document.getElementById('filtro-fecha-solicitudes').addEventListener('change', function(e) {
  currentFilters.fecha = e.target.value;
  applyCurrentFilters();
});
document.getElementById('buscar-solicitudes').addEventListener('input', function(e) {
  currentFilters.busqueda = e.target.value;
  applyCurrentFilters();
});

// Limpieza de filtros al actualizar
document.getElementById('refresh-solicitudes').addEventListener('click', function() {
  // Resetear todos los filtros en memoria
  currentFilters.estado = 'todos';
  currentFilters.prioridad = 'todos';
  currentFilters.cesfam = 'todos';
  currentFilters.fecha = 'todos';
  currentFilters.busqueda = '';

  // Limpiar los selects y el input en el DOM
  document.getElementById('filtro-estado-solicitudes').value = 'todos';
  document.getElementById('filtro-prioridad-solicitudes').value = 'todos';
  document.getElementById('filtro-cesfam-solicitudes').value = 'todos';
  document.getElementById('filtro-fecha-solicitudes').value = 'todos';
  document.getElementById('buscar-solicitudes').value = '';

  // Mostrar todas las solicitudes
  applyCurrentFilters();
});
