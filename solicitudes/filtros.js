let currentSolicitud = null;
let responseTemplates = [];
let responseHistory = [];

function initResponses() {
    setupResponseInterface();
    loadResponseTemplates();
    setupResponseEvents();
    console.log('📝 Sistema de respuestas inicializado');

  
const ESTADOS = ['todos', 'agendado', 'pendiente', 'respondido'];
const PRIORIDADES = ['todos', 'baja', 'media', 'alta'];
const CESFAM = [
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

const currentFilters = {
  estado: 'todos',
  prioridad: 'todos',
  cesfam: 'todos',
  fecha: 'todos',
  busqueda: ''
};

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

function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

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
  if (typeof renderSolicitudesTable === "function") renderSolicitudesTable();
  if (typeof updateSolicitudesCounter === "function") updateSolicitudesCounter();
}

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
  fillSelectOptions('filtro-cesfam-solicitudes', CESFAM, {
    todos: 'Todos los CESFAM'
  });
  applyCurrentFilters();

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
