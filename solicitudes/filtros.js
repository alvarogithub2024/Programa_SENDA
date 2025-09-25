import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
// Opciones para tus filtros
const ESTADOS = ['todos', 'agendado', 'pendiente', 'respondido'];
const PRIORIDADES = ['todos', 'baja', 'media', 'alta'];
const CESFAMS = [
  'todos',
  'CESFAM Karol Wojtyla',
  'CESFAM Padre Manuel Villaseca',
  'CESFAM Vista Hermosa',
  'CESFAM Cardenal Raul Silva Henriquez',
  'CESFAM San Gerónimo',
  'CESFAM Laurita Vicuña',
  'CESFAM Alejandro del Río',
  'CESFAM Bernardo Leighton'
];

// Llenar selects si quieres hacerlo dinámico (opcional)
function fillSelectOptions(id, options, labelMap={}) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = '';
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = labelMap[opt] || (opt === 'todos' ? 'Todos' : opt.charAt(0).toUpperCase() + opt.slice(1));
    sel.appendChild(o);
  });
}

// Puedes llamar a esto en tu inicialización:
fillSelectOptions('filtro-estado-solicitudes', ESTADOS, {
  todos: 'Todos los estados',
  agendado: 'Agendado/a',
  pendiente: 'Pendiente',
  respondido: 'Respondido'
});
fillSelectOptions('filtro-prioridad-solicitudes', PRIORIDADES, {
  todos: 'Todas las prioridades',
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta'
});
fillSelectOptions('filtro-cesfam-solicitudes', CESFAMS, {
  todos: 'Todos los CESFAM'
});

// Filtros globales
const currentFilters = {
  estado: 'todos',
  prioridad: 'todos',
  cesfam: 'todos',
  fecha: 'todos',
  busqueda: ''
};

// Tus datos deben estar en solicitudesData y deberías tener renderSolicitudesTable()
let solicitudesData = []; // Llena esto con tus datos
let filteredSolicitudesData = [];

function applyCurrentFilters() {
  filteredSolicitudesData = solicitudesData.filter(solicitud => {
    // Estado
    if (currentFilters.estado !== 'todos' && (solicitud.estado || '').toLowerCase() !== currentFilters.estado) {
      return false;
    }
    // Prioridad
    if (currentFilters.prioridad !== 'todos' && (solicitud.prioridad || '').toLowerCase() !== currentFilters.prioridad) {
      return false;
    }
    // CESFAM
    if (currentFilters.cesfam !== 'todos' && (solicitud.cesfam || '') !== currentFilters.cesfam) {
      return false;
    }
    // Fecha
    if (currentFilters.fecha !== 'todos') {
      const today = new Date();
      const solicitudDate = solicitud.fechaCreacion ? new Date(solicitud.fechaCreacion) : null;
      if (!solicitudDate) return false;
      switch (currentFilters.fecha) {
        case 'hoy':
          if (!isSameDay(solicitudDate, today)) return false;
          break;
        case 'semana':
        case 'esta semana':
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
    // Buscar solo por RUT
    if (currentFilters.busqueda) {
      const rut = (solicitud.rut || '').replace(/\./g, '').toLowerCase();
      const q = currentFilters.busqueda.replace(/\./g, '').toLowerCase();
      if (!rut.includes(q)) return false;
    }
    return true;
  });
  renderSolicitudesTable();
  if (typeof updateSolicitudesCounter === "function") updateSolicitudesCounter();
}

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

// Botón actualizar limpia todos los filtros
document.getElementById('refresh-solicitudes').addEventListener('click', function() {
  currentFilters.estado = 'todos';
  currentFilters.prioridad = 'todos';
  currentFilters.cesfam = 'todos';
  currentFilters.fecha = 'todos';
  currentFilters.busqueda = '';

  document.getElementById('filtro-estado-solicitudes').value = 'todos';
  document.getElementById('filtro-prioridad-solicitudes').value = 'todos';
  document.getElementById('filtro-cesfam-solicitudes').value = 'todos';
  document.getElementById('filtro-fecha-solicitudes').value = 'todos';
  document.getElementById('buscar-solicitudes').value = '';

  applyCurrentFilters();
});

// Puedes llamar a fillSelectOptions() y applyCurrentFilters() al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  fillSelectOptions('filtro-estado-solicitudes', ESTADOS, {
    todos: 'Todos los estados',
    agendado: 'Agendado/a',
    pendiente: 'Pendiente',
    respondido: 'Respondido'
  });
  fillSelectOptions('filtro-prioridad-solicitudes', PRIORIDADES, {
    todos: 'Todas las prioridades',
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  });
  fillSelectOptions('filtro-cesfam-solicitudes', CESFAMS, {
    todos: 'Todos los CESFAM'
  });
  applyCurrentFilters();
});
