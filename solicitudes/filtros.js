import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales para filtros
let availableFilters = {
    estados: [],
    tipos: [],
    profesionales: [],
    fechas: {
        min: null,
        max: null
    },
    prioridades: ['baja', 'media', 'alta', 'urgente']
};

let activeFilters = {
    estado: 'todos',
    tipo: 'todos',
    profesional: 'todos',
    fechaDesde: null,
    fechaHasta: null,
    prioridad: 'todos',
    busqueda: ''
};

// Inicializar sistema de filtros
export function initFilters() {
    setupFilterControls();
    loadFilterOptions();
    setupFilterEvents();
    console.log('🔍 Sistema de filtros inicializado');
}

// Configurar controles de filtros
function setupFilterControls() {
    const filtersContainer = document.getElementById('solicitudes-filters');
    if (!filtersContainer) return;

    filtersContainer.innerHTML = `
        <div class="filters-header">
            <h4><i class="fas fa-filter"></i> Filtros</h4>
            <button class="btn-sm secondary" onclick="clearAllFilters()">
                <i class="fas fa-times"></i> Limpiar Filtros
            </button>
        </div>
        
        <div class="filters-grid">
            <div class="filter-group">
                <label for="filter-search">Búsqueda</label>
                <div class="search-input">
                    <i class="fas fa-search"></i>
                    <input type="text" 
                           id="filter-search" 
                           placeholder="Buscar por nombre, RUT, descripción..."
                           autocomplete="off">
                </div>
            </div>

            <div class="filter-group">
                <label for="filter-estado">Estado</label>
                <select id="filter-estado">
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="filter-tipo">Tipo de Solicitud</label>
                <select id="filter-tipo">
                    <option value="todos">Todos los tipos</option>
                    <option value="ayuda">Solicitud de Ayuda</option>
                    <option value="reingreso">Solicitud de Reingreso</option>
                    <option value="informacion">Solicitud de Información</option>
                    <option value="cita">Solicitud de Cita</option>
                    <option value="derivacion">Derivación</option>
                    <option value="seguimiento">Seguimiento</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="filter-profesional">Profesional Asignado</label>
                <select id="filter-profesional">
                    <option value="todos">Todos los profesionales</option>
                    <!-- Se cargan dinámicamente -->
                </select>
            </div>

            <div class="filter-group">
                <label for="filter-prioridad">Prioridad</label>
                <select id="filter-prioridad">
                    <option value="todos">Todas las prioridades</option>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="filter-fecha-desde">Fecha Desde</label>
                <input type="date" id="filter-fecha-desde">
            </div>

            <div class="filter-group">
                <label for="filter-fecha-hasta">Fecha Hasta</label>
                <input type="date" id="filter-fecha-hasta">
            </div>

            <div class="filter-group full-width">
                <div class="filter-tags" id="active-filters-tags">
                    <!-- Tags de filtros activos -->
                </div>
            </div>
        </div>

        <div class="filters-actions">
            <button class="btn-primary" onclick="applyFilters()">
                <i class="fas fa-search"></i> Aplicar Filtros
            </button>
            <button class="btn-secondary" onclick="exportFilteredResults()">
                <i class="fas fa-download"></i> Exportar Resultados
            </button>
        </div>

        <div class="filters-stats" id="filter-stats">
            <div class="stat-item">
                <span class="stat-label">Total:</span>
                <span class="stat-value" id="total-solicitudes">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Filtradas:</span>
                <span class="stat-value" id="filtered-solicitudes">0</span>
            </div>
        </div>
    `;
}

// Cargar opciones de filtros
async function loadFilterOptions() {
    try {
        // Cargar profesionales
        await loadProfessionalsFilter();
        
        // Cargar estadísticas generales
        await loadFilterStats();
        
    } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
    }
}

// Cargar profesionales para filtro
async function loadProfessionalsFilter() {
    try {
        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();
        
        const select = document.getElementById('filter-profesional');
        if (!select) return;

        // Mantener opción "todos"
        select.innerHTML = '<option value="todos">Todos los profesionales</option>';

        snapshot.forEach(doc => {
            const prof = doc.data();
            const option = document.createElement('option');
            option.value = prof.nombre;
            option.textContent = `${prof.nombre} - ${prof.especialidad}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando profesionales:', error);
    }
}

// Cargar estadísticas de filtros
async function loadFilterStats() {
    try {
        const solicitudesRef = db.collection('solicitudes');
        const snapshot = await solicitudesRef.get();
        
        updateFilterStats(snapshot.size, snapshot.size);
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Configurar eventos de filtros
function setupFilterEvents() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearchFilter, 300));
    }

    // Filtros de selección
    const selectFilters = [
        'filter-estado',
        'filter-tipo', 
        'filter-profesional',
        'filter-prioridad'
    ];

    selectFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', handleFilterChange);
        }
    });

    // Filtros de fecha
    const dateFilters = ['filter-fecha-desde', 'filter-fecha-hasta'];
    dateFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', handleDateFilterChange);
        }
    });
}

// Manejar filtro de búsqueda
function handleSearchFilter(e) {
    activeFilters.busqueda = e.target.value.trim().toLowerCase();
    updateActiveFiltersDisplay();
    triggerFilterUpdate();
}

// Manejar cambio de filtros
function handleFilterChange(e) {
    const filterId = e.target.id.replace('filter-', '');
    activeFilters[filterId] = e.target.value;
    updateActiveFiltersDisplay();
    triggerFilterUpdate();
}

// Manejar filtros de fecha
function handleDateFilterChange(e) {
    const filterId = e.target.id.replace('filter-fecha-', '');
    const dateKey = filterId === 'desde' ? 'fechaDesde' : 'fechaHasta';
    activeFilters[dateKey] = e.target.value;
    updateActiveFiltersDisplay();
    triggerFilterUpdate();
}

// Aplicar filtros a una lista de solicitudes
export function applyFiltersToSolicitudes(solicitudes) {
    if (!solicitudes || solicitudes.length === 0) {
        return [];
    }

    return solicitudes.filter(solicitud => {
        // Filtro por búsqueda
        if (activeFilters.busqueda) {
            const searchTerm = activeFilters.busqueda;
            const searchableText = `${solicitud.nombreSolicitante} ${solicitud.rut} ${solicitud.tipoSolicitud} ${solicitud.descripcion || ''}`.toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Filtro por estado
        if (activeFilters.estado !== 'todos' && solicitud.estado !== activeFilters.estado) {
            return false;
        }

        // Filtro por tipo
        if (activeFilters.tipo !== 'todos' && solicitud.tipoSolicitud !== activeFilters.tipo) {
            return false;
        }

        // Filtro por profesional
        if (activeFilters.profesional !== 'todos' && solicitud.profesionalAsignado !== activeFilters.profesional) {
            return false;
        }

        // Filtro por prioridad
        if (activeFilters.prioridad !== 'todos' && solicitud.prioridad !== activeFilters.prioridad) {
            return false;
        }

        // Filtros de fecha
        if (activeFilters.fechaDesde) {
            const solicitudDate = new Date(solicitud.fechaSolicitud);
            const filterDate = new Date(activeFilters.fechaDesde);
            if (solicitudDate < filterDate) {
                return false;
            }
        }

        if (activeFilters.fechaHasta) {
            const solicitudDate = new Date(solicitud.fechaSolicitud);
            const filterDate = new Date(activeFilters.fechaHasta);
            filterDate.setHours(23, 59, 59, 999); // Final del día
            if (solicitudDate > filterDate) {
                return false;
            }
        }

        return true;
    });
}

// Actualizar visualización de filtros activos
function updateActiveFiltersDisplay() {
    const tagsContainer = document.getElementById('active-filters-tags');
    if (!tagsContainer) return;

    tagsContainer.innerHTML = '';

    // Crear tags para filtros activos
    Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== 'todos' && value !== '') {
            const tag = createFilterTag(key, value);
            tagsContainer.appendChild(tag);
        }
    });

    // Mostrar mensaje si no hay filtros activos
    if (tagsContainer.children.length === 0) {
        tagsContainer.innerHTML = '<span class="no-filters">No hay filtros activos</span>';
    }
}

// Crear tag de filtro
function createFilterTag(key, value) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
        <span class="tag-label">${getFilterLabel(key)}:</span>
        <span class="tag-value">${getFilterDisplayValue(key, value)}</span>
        <button class="tag-remove" onclick="removeFilter('${key}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    return tag;
}

// Obtener etiqueta del filtro
function getFilterLabel(key) {
    const labels = {
        'busqueda': 'Búsqueda',
        'estado': 'Estado',
        'tipo': 'Tipo',
        'profesional': 'Profesional',
        'prioridad': 'Prioridad',
        'fechaDesde': 'Desde',
        'fechaHasta': 'Hasta'
    };
    return labels[key] || key;
}

// Obtener valor de visualización del filtro
function getFilterDisplayValue(key, value) {
    if (key === 'fechaDesde' || key === 'fechaHasta') {
        return new Date(value).toLocaleDateString('es-CL');
    }
    
    if (key === 'busqueda' && value.length > 20) {
        return value.substring(0, 20) + '...';
    }
    
    return value;
}

// Disparar actualización de filtros
function triggerFilterUpdate() {
    // Emitir evento personalizado para que otros componentes puedan escuchar
    const filterEvent = new CustomEvent('filtersUpdated', {
        detail: { filters: activeFilters }
    });
    document.dispatchEvent(filterEvent);
}

// Actualizar estadísticas de filtros
function updateFilterStats(total, filtered) {
    const totalElement = document.getElementById('total-solicitudes');
    const filteredElement = document.getElementById('filtered-solicitudes');
    
    if (totalElement) totalElement.textContent = total;
    if (filteredElement) filteredElement.textContent = filtered;
}

// Funciones expuestas globalmente
window.applyFilters = function() {
    triggerFilterUpdate();
    showNotification('Filtros aplicados', 'success');
};

window.clearAllFilters = function() {
    activeFilters = {
        estado: 'todos',
        tipo: 'todos',
        profesional: 'todos',
        fechaDesde: null,
        fechaHasta: null,
        prioridad: 'todos',
        busqueda: ''
    };

    // Limpiar inputs
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-estado').value = 'todos';
    document.getElementById('filter-tipo').value = 'todos';
    document.getElementById('filter-profesional').value = 'todos';
    document.getElementById('filter-prioridad').value = 'todos';
    document.getElementById('filter-fecha-desde').value = '';
    document.getElementById('filter-fecha-hasta').value = '';

    updateActiveFiltersDisplay();
    triggerFilterUpdate();
    showNotification('Filtros limpiados', 'success');
};

window.removeFilter = function(filterKey) {
    if (filterKey === 'fechaDesde' || filterKey === 'fechaHasta') {
        activeFilters[filterKey] = null;
        document.getElementById(`filter-fecha-${filterKey.replace('fecha', '').toLowerCase()}`).value = '';
    } else if (filterKey === 'busqueda') {
        activeFilters[filterKey] = '';
        document.getElementById('filter-search').value = '';
    } else {
        activeFilters[filterKey] = 'todos';
        document.getElementById(`filter-${filterKey}`).value = 'todos';
    }

    updateActiveFiltersDisplay();
    triggerFilterUpdate();
};

window.exportFilteredResults = function() {
    // Implementar exportación de resultados filtrados
    showNotification('Función de exportación en desarrollo', 'info');
};

// Obtener filtros activos
export function getActiveFilters() {
    return { ...activeFilters };
}

// Establecer filtros desde código
export function setFilters(filters) {
    activeFilters = { ...activeFilters, ...filters };
    updateActiveFiltersDisplay();
    triggerFilterUpdate();
}

// Restablecer filtros a valores por defecto
export function resetFilters() {
    window.clearAllFilters();
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Escuchar cambios en las solicitudes para actualizar estadísticas
document.addEventListener('solicitudesLoaded', (event) => {
    const { total, filtered } = event.detail;
    updateFilterStats(total, filtered);
});

// Exportar funciones principales
export {
    applyFiltersToSolicitudes,
    updateFilterStats
};
