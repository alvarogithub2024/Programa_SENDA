import { db } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { formatDate } from '../utilidades/formato.js';

// Variables globales para el timeline
let timelineData = [];
let currentPatientId = null;
let timelineFilters = {
    tipo: 'todos',
    profesional: 'todos',
    fechaDesde: null,
    fechaHasta: null
};

// Inicializar timeline de atenciones
export function initTimeline() {
    setupTimelineView();
    setupTimelineFilters();
    setupTimelineEvents();
    console.log('📅 Timeline de atenciones inicializado');
}

// Configurar vista del timeline
function setupTimelineView() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = `
        <div class="timeline-header">
            <h3>Timeline de Atenciones</h3>
            <div class="timeline-controls">
                <div class="timeline-filters">
                    <select id="timeline-type-filter">
                        <option value="todos">Todos los tipos</option>
                        <option value="consulta">Consultas</option>
                        <option value="evaluacion">Evaluaciones</option>
                        <option value="terapia">Terapias</option>
                        <option value="seguimiento">Seguimientos</option>
                        <option value="nota">Notas</option>
                    </select>
                    
                    <select id="timeline-professional-filter">
                        <option value="todos">Todos los profesionales</option>
                    </select>
                    
                    <input type="date" id="timeline-date-from" placeholder="Desde">
                    <input type="date" id="timeline-date-to" placeholder="Hasta">
                    
                    <button class="btn-secondary" onclick="clearTimelineFilters()">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                </div>
                
                <div class="timeline-actions">
                    <button class="btn-primary" onclick="addTimelineEntry()">
                        <i class="fas fa-plus"></i> Agregar Entrada
                    </button>
                    <button class="btn-secondary" onclick="exportTimeline()">
                        <i class="fas fa-download"></i> Exportar
                    </button>
                </div>
            </div>
        </div>
        
        <div class="timeline-content">
            <div id="timeline-loading" class="loading-state" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i>
                Cargando timeline...
            </div>
            
            <div id="timeline-list" class="timeline-list">
                <!-- Timeline entries se cargarán aquí -->
            </div>
            
            <div id="timeline-pagination" class="pagination-controls">
                <!-- Controles de paginación -->
            </div>
        </div>
    `;
}

// Cargar timeline para un paciente
export async function loadPatientTimeline(patientId) {
    currentPatientId = patientId;
    
    try {
        showTimelineLoading(true);
        
        // Cargar todas las atenciones del paciente
        await loadTimelineData(patientId);
        
        // Renderizar timeline
        renderTimeline();
        
        console.log(`📅 Timeline cargado: ${timelineData.length} entradas`);
        
    } catch (error) {
        console.error('Error cargando timeline:', error);
        showNotification('Error al cargar el timeline de atenciones', 'error');
    } finally {
        showTimelineLoading(false);
    }
}

// Cargar datos del timeline
async function loadTimelineData(patientId) {
    timelineData = [];
    
    try {
        // Cargar citas
        const citasRef = db.collection('citas');
        const citasQuery = citasRef
            .where('pacienteId', '==', patientId)
            .orderBy('fecha', 'desc');
        
        const citasSnapshot = await citasQuery.get();
        citasSnapshot.forEach(doc => {
            const data = doc.data();
            timelineData.push({
                id: doc.id,
                tipo: 'cita',
                subtipo: data.tipo || 'consulta',
                fecha: data.fecha,
                hora: data.hora,
                titulo: `Cita - ${data.tipo || 'Consulta'}`,
                descripcion: data.motivo || data.notas || '',
                profesional: data.profesional,
                estado: data.estado,
                datos: data
            });
        });

        // Cargar historial médico
        const historialRef = db.collection('historial_pacientes');
        const historialQuery = historialRef
            .where('pacienteId', '==', patientId)
            .orderBy('fecha', 'desc');
        
        const historialSnapshot = await historialQuery.get();
        historialSnapshot.forEach(doc => {
            const data = doc.data();
            timelineData.push({
                id: doc.id,
                tipo: 'historial',
                subtipo: data.tipo || 'nota',
                fecha: data.fecha,
                titulo: data.titulo || `${data.tipo || 'Entrada'}`,
                descripcion: data.descripcion,
                profesional: data.profesional,
                datos: data
            });
        });

        // Cargar evaluaciones
        const evaluacionesRef = db.collection('evaluaciones');
        const evaluacionesQuery = evaluacionesRef
            .where('pacienteId', '==', patientId)
            .orderBy('fecha', 'desc');
        
        const evaluacionesSnapshot = await evaluacionesQuery.get();
        evaluacionesSnapshot.forEach(doc => {
            const data = doc.data();
            timelineData.push({
                id: doc.id,
                tipo: 'evaluacion',
                subtipo: data.tipoEvaluacion || 'evaluacion',
                fecha: data.fecha,
                titulo: `Evaluación - ${data.tipoEvaluacion || 'General'}`,
                descripcion: data.observaciones || data.resumen || '',
                profesional: data.profesional,
                datos: data
            });
        });

        // Cargar notas de seguimiento
        const notasRef = db.collection('notas_seguimiento');
        const notasQuery = notasRef
            .where('pacienteId', '==', patientId)
            .orderBy('fecha', 'desc');
        
        const notasSnapshot = await notasQuery.get();
        notasSnapshot.forEach(doc => {
            const data = doc.data();
            timelineData.push({
                id: doc.id,
                tipo: 'nota',
                subtipo: 'seguimiento',
                fecha: data.fecha,
                titulo: data.titulo || 'Nota de Seguimiento',
                descripcion: data.contenido,
                profesional: data.profesional,
                datos: data
            });
        });

        // Ordenar por fecha (más reciente primero)
        timelineData.sort((a, b) => {
            const dateA = new Date(a.fecha + (a.hora ? ` ${a.hora}` : ''));
            const dateB = new Date(b.fecha + (b.hora ? ` ${b.hora}` : ''));
            return dateB - dateA;
        });

        // Cargar profesionales para filtro
        await loadProfessionalsForFilter();

    } catch (error) {
        console.error('Error en carga de datos del timeline:', error);
        throw error;
    }
}

// Renderizar timeline
function renderTimeline() {
    const timelineList = document.getElementById('timeline-list');
    if (!timelineList) return;

    // Aplicar filtros
    const filteredData = applyTimelineFilters();

    if (filteredData.length === 0) {
        timelineList.innerHTML = `
            <div class="timeline-empty">
                <i class="fas fa-calendar-times"></i>
                <h4>No hay entradas en el timeline</h4>
                <p>No se encontraron atenciones que coincidan con los filtros seleccionados.</p>
                <button class="btn-primary" onclick="addTimelineEntry()">
                    <i class="fas fa-plus"></i> Agregar Primera Entrada
                </button>
            </div>
        `;
        return;
    }

    // Agrupar por mes
    const groupedData = groupTimelineByMonth(filteredData);
    
    let timelineHTML = '';
    
    Object.keys(groupedData).forEach(monthKey => {
        const entries = groupedData[monthKey];
        
        timelineHTML += `
            <div class="timeline-month">
                <div class="timeline-month-header">
                    <h4>${formatMonthYear(monthKey)}</h4>
                    <span class="entries-count">${entries.length} ${entries.length === 1 ? 'entrada' : 'entradas'}</span>
                </div>
                <div class="timeline-entries">
                    ${entries.map(entry => createTimelineEntry(entry)).join('')}
                </div>
            </div>
        `;
    });

    timelineList.innerHTML = timelineHTML;
}

// Crear entrada del timeline
function createTimelineEntry(entry) {
    const icon = getTimelineIcon(entry.tipo, entry.subtipo);
    const color = getTimelineColor(entry.tipo);
    const datetime = entry.hora ? `${formatDate(entry.fecha)} ${entry.hora}` : formatDate(entry.fecha);
    
    return `
        <div class="timeline-entry" data-entry-id="${entry.id}" data-type="${entry.tipo}">
            <div class="timeline-marker" style="background-color: ${color}">
                <i class="${icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <h5 class="timeline-title">${entry.titulo}</h5>
                    <div class="timeline-meta">
                        <span class="timeline-date">
                            <i class="fas fa-clock"></i>
                            ${datetime}
                        </span>
                        ${entry.profesional ? `
                            <span class="timeline-professional">
                                <i class="fas fa-user-md"></i>
                                ${entry.profesional}
                            </span>
                        ` : ''}
                        ${entry.estado ? `
                            <span class="timeline-status ${entry.estado}">
                                ${getStatusText(entry.estado)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                ${entry.descripcion ? `
                    <div class="timeline-description">
                        ${entry.descripcion}
                    </div>
                ` : ''}
                
                <div class="timeline-actions">
                    <button class="btn-sm" onclick="viewTimelineEntry('${entry.id}', '${entry.tipo}')">
                        <i class="fas fa-eye"></i> Ver Detalle
                    </button>
                    ${entry.tipo !== 'cita' ? `
                        <button class="btn-sm" onclick="editTimelineEntry('${entry.id}', '${entry.tipo}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    ` : ''}
                    <button class="btn-sm" onclick="duplicateTimelineEntry('${entry.id}')">
                        <i class="fas fa-copy"></i> Duplicar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Aplicar filtros del timeline
function applyTimelineFilters() {
    let filtered = [...timelineData];

    // Filtro por tipo
    if (timelineFilters.tipo !== 'todos') {
        filtered = filtered.filter(entry => entry.subtipo === timelineFilters.tipo);
    }

    // Filtro por profesional
    if (timelineFilters.profesional !== 'todos') {
        filtered = filtered.filter(entry => entry.profesional === timelineFilters.profesional);
    }

    // Filtro por fecha desde
    if (timelineFilters.fechaDesde) {
        filtered = filtered.filter(entry => entry.fecha >= timelineFilters.fechaDesde);
    }

    // Filtro por fecha hasta
    if (timelineFilters.fechaHasta) {
        filtered = filtered.filter(entry => entry.fecha <= timelineFilters.fechaHasta);
    }

    return filtered;
}

// Agrupar timeline por mes
function groupTimelineByMonth(data) {
    const grouped = {};
    
    data.forEach(entry => {
        const date = new Date(entry.fecha);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        
        grouped[monthKey].push(entry);
    });
    
    return grouped;
}

// Configurar filtros del timeline
function setupTimelineFilters() {
    const typeFilter = document.getElementById('timeline-type-filter');
    const professionalFilter = document.getElementById('timeline-professional-filter');
    const dateFromFilter = document.getElementById('timeline-date-from');
    const dateToFilter = document.getElementById('timeline-date-to');

    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            timelineFilters.tipo = e.target.value;
            renderTimeline();
        });
    }

    if (professionalFilter) {
        professionalFilter.addEventListener('change', (e) => {
            timelineFilters.profesional = e.target.value;
            renderTimeline();
        });
    }

    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', (e) => {
            timelineFilters.fechaDesde = e.target.value;
            renderTimeline();
        });
    }

    if (dateToFilter) {
        dateToFilter.addEventListener('change', (e) => {
            timelineFilters.fechaHasta = e.target.value;
            renderTimeline();
        });
    }
}

// Configurar eventos del timeline
function setupTimelineEvents() {
    // Los eventos se configuran mediante onclick en el HTML
    // debido a la naturaleza dinámica del contenido
}

// Cargar profesionales para filtro
async function loadProfessionalsForFilter() {
    try {
        const professionalsSet = new Set();
        
        timelineData.forEach(entry => {
            if (entry.profesional) {
                professionalsSet.add(entry.profesional);
            }
        });

        const professionalFilter = document.getElementById('timeline-professional-filter');
        if (professionalFilter) {
            // Mantener opción "todos"
            const currentHTML = professionalFilter.innerHTML;
            let optionsHTML = '<option value="todos">Todos los profesionales</option>';
            
            Array.from(professionalsSet).sort().forEach(professional => {
                optionsHTML += `<option value="${professional}">${professional}</option>`;
            });
            
            professionalFilter.innerHTML = optionsHTML;
        }

    } catch (error) {
        console.error('Error cargando profesionales para filtro:', error);
    }
}

// Funciones de acciones del timeline (expuestas globalmente)
window.addTimelineEntry = function() {
    if (!currentPatientId) {
        showNotification('No hay paciente seleccionado', 'warning');
        return;
    }
    
    const modal = document.getElementById('timeline-entry-modal');
    if (modal) {
        // Limpiar formulario
        const form = document.getElementById('timeline-entry-form');
        if (form) form.reset();
        
        modal.style.display = 'flex';
    }
};

window.viewTimelineEntry = function(entryId, type) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) return;
    
    // Mostrar modal con detalles completos
    showTimelineEntryDetails(entry);
};

window.editTimelineEntry = function(entryId, type) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) return;
    
    // Abrir modal de edición
    openEditTimelineModal(entry);
};

window.duplicateTimelineEntry = function(entryId) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) return;
    
    // Crear copia de la entrada
    duplicateEntry(entry);
};

window.clearTimelineFilters = function() {
    timelineFilters = {
        tipo: 'todos',
        profesional: 'todos',
        fechaDesde: null,
        fechaHasta: null
    };
    
    // Limpiar inputs
    document.getElementById('timeline-type-filter').value = 'todos';
    document.getElementById('timeline-professional-filter').value = 'todos';
    document.getElementById('timeline-date-from').value = '';
    document.getElementById('timeline-date-to').value = '';
    
    renderTimeline();
};

window.exportTimeline = function() {
    if (!currentPatientId) return;
    
    // Implementar exportación
    showNotification('Función de exportación en desarrollo', 'info');
};

// Funciones utilitarias
function getTimelineIcon(type, subtype) {
    const icons = {
        'cita': {
            'consulta': 'fas fa-stethoscope',
            'evaluacion': 'fas fa-clipboard-check',
            'terapia': 'fas fa-hands-helping',
            'seguimiento': 'fas fa-eye'
        },
        'historial': {
            'consulta': 'fas fa-notes-medical',
            'diagnostico': 'fas fa-diagnosis',
            'tratamiento': 'fas fa-pills'
        },
        'evaluacion': 'fas fa-clipboard-list',
        'nota': 'fas fa-sticky-note'
    };
    
    if (icons[type] && typeof icons[type] === 'object') {
        return icons[type][subtype] || icons[type]['consulta'] || 'fas fa-circle';
    }
    
    return icons[type] || 'fas fa-circle';
}

function getTimelineColor(type) {
    const colors = {
        'cita': '#3498db',
        'historial': '#2ecc71',
        'evaluacion': '#f39c12',
        'nota': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
}

function getStatusText(status) {
    const texts = {
        'programada': 'Programada',
        'confirmada': 'Confirmada', 
        'realizada': 'Realizada',
        'cancelada': 'Cancelada',
        'no_asistio': 'No asistió'
    };
    return texts[status] || status;
}

function formatMonthYear(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: 'long' 
    });
}

function showTimelineLoading(show) {
    const loading = document.getElementById('timeline-loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Funciones auxiliares (implementar según necesidad)
function showTimelineEntryDetails(entry) {
    console.log('Mostrar detalles de entrada:', entry);
}

function openEditTimelineModal(entry) {
    console.log('Editar entrada:', entry);
}

function duplicateEntry(entry) {
    console.log('Duplicar entrada:', entry);
}


export {
    renderTimeline,
    applyTimelineFilters
};
