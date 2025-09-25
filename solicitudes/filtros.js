let currentSolicitud = null;
let responseTemplates = [];
let responseHistory = [];
let solicitudesData = []; // Array global de solicitudes
let filteredSolicitudesData = []; // Array filtrado

function initResponses() {
    setupResponseInterface();
    loadResponseTemplates();
    setupResponseEvents();
    console.log('📝 Sistema de respuestas inicializado');
}

// Funciones auxiliares del sistema de respuestas
function setupResponseInterface() {
    console.log('🔧 Configurando interfaz de respuestas');
}

function loadResponseTemplates() {
    console.log('📄 Cargando plantillas de respuesta');
}

function setupResponseEvents() {
    console.log('⚡ Configurando eventos de respuestas');
}

// CONSTANTES PARA FILTROS
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

// Objeto global para filtros actuales
const currentFilters = {
    estado: 'todos',
    prioridad: 'todos',
    cesfam: 'todos',
    fecha: 'todos',
    busqueda: ''
};

/**
 * Llena las opciones de un select
 */
function fillSelectOptions(id, options, labelMap = {}) {
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

/**
 * Verifica si dos fechas son del mismo día
 */
function isSameDay(date1, date2) {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

/**
 * Aplica los filtros actuales a los datos
 */
function applyCurrentFilters() {
    filteredSolicitudesData = solicitudesData.filter(solicitud => {
        // Filtro por Estado
        if (currentFilters.estado !== 'todos' && (solicitud.estado || '').toLowerCase() !== currentFilters.estado) {
            return false;
        }
        
        // Filtro por Prioridad
        if (currentFilters.prioridad !== 'todos' && (solicitud.prioridad || '').toLowerCase() !== currentFilters.prioridad) {
            return false;
        }
        
        // Filtro por CESFAM
        if (currentFilters.cesfam !== 'todos' && (solicitud.cesfam || '') !== currentFilters.cesfam) {
            return false;
        }
        
        // Filtro por Fecha
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
        
        // Filtro por Búsqueda (solo RUT)
        if (currentFilters.busqueda) {
            const rut = (solicitud.rut || '').replace(/\./g, '').toLowerCase();
            const q = currentFilters.busqueda.replace(/\./g, '').toLowerCase();
            if (!rut.includes(q)) return false;
        }
        
        return true;
    });
    
    // Actualizar tabla y contador si existen las funciones
    if (typeof renderSolicitudesTable === "function") renderSolicitudesTable();
    if (typeof updateSolicitudesCounter === "function") updateSolicitudesCounter();
}

/**
 * Inicializar sistema de filtros cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', () => {
    // Llenar opciones de los selectores
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
    
    // Aplicar filtros iniciales
    applyCurrentFilters();

    // Event Listeners para cada filtro
    const estadoSelect = document.getElementById('filtro-estado-solicitudes');
    if (estadoSelect) {
        estadoSelect.addEventListener('change', function(e) {
            currentFilters.estado = e.target.value;
            applyCurrentFilters();
        });
    }

    const prioridadSelect = document.getElementById('filtro-prioridad-solicitudes');
    if (prioridadSelect) {
        prioridadSelect.addEventListener('change', function(e) {
            currentFilters.prioridad = e.target.value;
            applyCurrentFilters();
        });
    }

    const cesfamSelect = document.getElementById('filtro-cesfam-solicitudes');
    if (cesfamSelect) {
        cesfamSelect.addEventListener('change', function(e) {
            currentFilters.cesfam = e.target.value;
            applyCurrentFilters();
        });
    }

    const fechaSelect = document.getElementById('filtro-fecha-solicitudes');
    if (fechaSelect) {
        fechaSelect.addEventListener('change', function(e) {
            currentFilters.fecha = e.target.value;
            applyCurrentFilters();
        });
    }

    const busquedaInput = document.getElementById('buscar-solicitudes');
    if (busquedaInput) {
        busquedaInput.addEventListener('input', function(e) {
            currentFilters.busqueda = e.target.value;
            applyCurrentFilters();
        });
    }

    // Botón de refresh/limpiar filtros
    const refreshBtn = document.getElementById('refresh-solicitudes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Resetear filtros
            currentFilters.estado = 'todos';
            currentFilters.prioridad = 'todos';
            currentFilters.cesfam = 'todos';
            currentFilters.fecha = 'todos';
            currentFilters.busqueda = '';
            
            // Resetear valores en la interfaz
            if (estadoSelect) estadoSelect.value = 'todos';
            if (prioridadSelect) prioridadSelect.value = 'todos';
            if (cesfamSelect) cesfamSelect.value = 'todos';
            if (fechaSelect) fechaSelect.value = 'todos';
            if (busquedaInput) busquedaInput.value = '';
            
            // Aplicar filtros reseteados
            applyCurrentFilters();
        });
    }
});

/**
 * Función auxiliar para resetear filtros programáticamente
 */
function resetFilters() {
    currentFilters.estado = 'todos';
    currentFilters.prioridad = 'todos';
    currentFilters.cesfam = 'todos';
    currentFilters.fecha = 'todos';
    currentFilters.busqueda = '';
    
    const elements = {
        estado: document.getElementById('filtro-estado-solicitudes'),
        prioridad: document.getElementById('filtro-prioridad-solicitudes'),
        cesfam: document.getElementById('filtro-cesfam-solicitudes'),
        fecha: document.getElementById('filtro-fecha-solicitudes'),
        busqueda: document.getElementById('buscar-solicitudes')
    };
    
    Object.entries(elements).forEach(([key, element]) => {
        if (element) {
            element.value = key === 'busqueda' ? '' : 'todos';
        }
    });
    
    applyCurrentFilters();
}

/**
 * Función para obtener el estado actual de los filtros
 */
function getCurrentFilters() {
    return { ...currentFilters };
}

/**
 * Función para aplicar filtros específicos
 */
function setFilters(filters) {
    Object.assign(currentFilters, filters);
    applyCurrentFilters();
}
