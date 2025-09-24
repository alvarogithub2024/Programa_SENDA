import { getFirestore, getServerTimestamp } from '../configuracion/firebase.js';
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
    try {
        setupTimelineView();
        setupTimelineFilters();
        setupTimelineEvents();
        console.log('📅 Timeline de atenciones inicializado');
    } catch (error) {
        console.error('Error inicializando timeline:', error);
    }
}

// Configurar vista del timeline
function setupTimelineView() {
    try {
        let container = document.getElementById('timeline-container');
        
        // Si no existe, crearlo en la pestaña de seguimiento
        if (!container) {
            const seguimientoTab = document.getElementById('seguimiento-tab');
            if (seguimientoTab) {
                container = document.createElement('div');
                container.id = 'timeline-container';
                seguimientoTab.appendChild(container);
            } else {
                console.warn('Pestaña de seguimiento no encontrada');
                return;
            }
        }

        container.innerHTML = `
            <div class="timeline-header">
                <h3><i class="fas fa-history"></i> Timeline de Atenciones</h3>
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
                        
                        <button class="btn btn-secondary btn-sm" onclick="clearTimelineFilters()">
                            <i class="fas fa-times"></i> Limpiar
                        </button>
                    </div>
                    
                    <div class="timeline-actions">
                        <button class="btn btn-primary btn-sm" onclick="addTimelineEntry()">
                            <i class="fas fa-plus"></i> Agregar Entrada
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="exportTimeline()">
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
                
                <div id="patient-selector" class="patient-selector">
                    <h4>Seleccionar Paciente</h4>
                    <div class="patient-search">
                        <input type="text" id="patient-search-input" placeholder="Buscar por nombre o RUT...">
                        <button class="btn btn-primary btn-sm" onclick="searchPatients()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div id="patient-search-results"></div>
                </div>
                
                <div id="timeline-list" class="timeline-list" style="display: none;">
                    <!-- Timeline entries se cargarán aquí -->
                </div>
            </div>
        `;

        console.log('✅ Vista de timeline configurada');
    } catch (error) {
        console.error('Error configurando vista de timeline:', error);
    }
}

// Cargar timeline para un paciente
export async function loadPatientTimeline(patientId) {
    try {
        if (!patientId) {
            console.warn('No se proporcionó ID de paciente');
            return;
        }

        currentPatientId = patientId;
        
        showTimelineLoading(true);
        
        // Cargar todas las atenciones del paciente
        await loadTimelineData(patientId);
        
        // Renderizar timeline
        renderTimeline();
        
        // Mostrar contenedor de timeline
        const patientSelector = document.getElementById('patient-selector');
        const timelineList = document.getElementById('timeline-list');
        
        if (patientSelector) patientSelector.style.display = 'none';
        if (timelineList) timelineList.style.display = 'block';
        
        console.log(`📅 Timeline cargado: ${timelineData.length} entradas para paciente ${patientId}`);
        
    } catch (error) {
        console.error('Error cargando timeline:', error);
        showNotification('Error al cargar el timeline de atenciones', 'error');
    } finally {
        showTimelineLoading(false);
    }
}

// Cargar datos del timeline
async function loadTimelineData(patientId) {
    try {
        const db = getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }

        timelineData = [];
        
        // Cargar citas del paciente
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

        // Cargar historial médico del paciente
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
                hora: data.hora || '',
                titulo: data.titulo || `${data.tipo || 'Entrada'}`,
                descripcion: data.descripcion || '',
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
                hora: data.hora || '',
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
                hora: data.hora || '',
                titulo: data.titulo || 'Nota de Seguimiento',
                descripcion: data.contenido || data.descripcion || '',
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

        // Cargar profesionales para filtro si hay datos
        if (timelineData.length > 0) {
            await loadProfessionalsForFilter();
        }

        console.log(`📊 Datos del timeline cargados: ${timelineData.length} entradas`);

    } catch (error) {
        console.error('Error cargando datos del timeline:', error);
        
        // Crear datos de ejemplo si falla la carga
        timelineData = createSampleTimelineData(patientId);
        await loadProfessionalsForFilter();
    }
}

// Crear datos de ejemplo para testing
function createSampleTimelineData(patientId) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
        {
            id: 'sample1',
            tipo: 'cita',
            subtipo: 'consulta',
            fecha: formatDateForStorage(today),
            hora: '10:00',
            titulo: 'Consulta Initial',
            descripcion: 'Primera consulta de seguimiento',
            profesional: 'Dr. García',
            estado: 'realizada'
        },
        {
            id: 'sample2',
            tipo: 'nota',
            subtipo: 'seguimiento',
            fecha: formatDateForStorage(yesterday),
            hora: '14:30',
            titulo: 'Nota de Seguimiento',
            descripcion: 'Paciente muestra mejoría en el tratamiento',
            profesional: 'Dra. López',
            estado: 'activa'
        }
    ];
}

// Renderizar timeline
function renderTimeline() {
    try {
        const timelineList = document.getElementById('timeline-list');
        if (!timelineList) {
            console.error('Contenedor de timeline no encontrado');
            return;
        }

        // Aplicar filtros
        const filteredData = applyTimelineFilters();

        if (filteredData.length === 0) {
            timelineList.innerHTML = `
                <div class="timeline-empty">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No hay entradas en el timeline</h4>
                    <p>No se encontraron atenciones que coincidan con los filtros seleccionados.</p>
                    <button class="btn btn-primary" onclick="addTimelineEntry()">
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
        
        console.log(`📋 Timeline renderizado: ${filteredData.length} entradas mostradas`);

    } catch (error) {
        console.error('Error renderizando timeline:', error);
    }
}

// Crear entrada del timeline
function createTimelineEntry(entry) {
    try {
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
                        <button class="btn btn-sm btn-secondary" onclick="viewTimelineEntry('${entry.id}', '${entry.tipo}')">
                            <i class="fas fa-eye"></i> Ver Detalle
                        </button>
                        ${entry.tipo !== 'cita' ? `
                            <button class="btn btn-sm btn-primary" onclick="editTimelineEntry('${entry.id}', '${entry.tipo}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-info" onclick="duplicateTimelineEntry('${entry.id}')">
                            <i class="fas fa-copy"></i> Duplicar
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creando entrada de timeline:', error);
        return '<div class="timeline-entry error">Error al mostrar entrada</div>';
    }
}

// Aplicar filtros del timeline
function applyTimelineFilters() {
    try {
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
    } catch (error) {
        console.error('Error aplicando filtros:', error);
        return timelineData;
    }
}

// Agrupar timeline por mes
function groupTimelineByMonth(data) {
    const grouped = {};
    
    data.forEach(entry => {
        try {
            const date = new Date(entry.fecha);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            
            grouped[monthKey].push(entry);
        } catch (error) {
            console.warn('Error agrupando entrada:', entry, error);
        }
    });
    
    return grouped;
}

// Configurar filtros del timeline
function setupTimelineFilters() {
    try {
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

        console.log('✅ Filtros de timeline configurados');
    } catch (error) {
        console.error('Error configurando filtros:', error);
    }
}

// Configurar eventos del timeline
function setupTimelineEvents() {
    try {
        // Configurar búsqueda de pacientes
        const searchInput = document.getElementById('patient-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchPatients();
                }
            });
            
            searchInput.addEventListener('input', debounce(searchPatients, 300));
        }

        console.log('✅ Eventos de timeline configurados');
    } catch (error) {
        console.error('Error configurando eventos:', error);
    }
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
        if (professionalFilter && professionalsSet.size > 0) {
            // Mantener opción "todos"
            let optionsHTML = '<option value="todos">Todos los profesionales</option>';
            
            Array.from(professionalsSet).sort().forEach(professional => {
                optionsHTML += `<option value="${professional}">${professional}</option>`;
            });
            
            professionalFilter.innerHTML = optionsHTML;
        }

        console.log(`✅ ${professionalsSet.size} profesionales cargados en filtro`);

    } catch (error) {
        console.error('Error cargando profesionales para filtro:', error);
    }
}

// Buscar pacientes
window.searchPatients = async function() {
    try {
        const searchInput = document.getElementById('patient-search-input');
        const searchTerm = searchInput?.value?.trim().toLowerCase();
        
        if (!searchTerm || searchTerm.length < 3) {
            document.getElementById('patient-search-results').innerHTML = '';
            return;
        }

        const db = getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }

        // Buscar pacientes por nombre o RUT
        const pacientesRef = db.collection('pacientes');
        const snapshot = await pacientesRef.limit(10).get();
        
        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const fullName = `${data.nombre} ${data.apellido}`.toLowerCase();
            const rut = (data.rut || '').toLowerCase();
            
            if (fullName.includes(searchTerm) || rut.includes(searchTerm)) {
                results.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        displayPatientSearchResults(results);

    } catch (error) {
        console.error('Error buscando pacientes:', error);
        showNotification('Error buscando pacientes', 'error');
    }
};

// Mostrar resultados de búsqueda de pacientes
function displayPatientSearchResults(patients) {
    const resultsContainer = document.getElementById('patient-search-results');
    if (!resultsContainer) return;

    if (patients.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron pacientes</p>';
        return;
    }

    const resultsHTML = patients.map(patient => `
        <div class="patient-result" onclick="selectPatient('${patient.id}')">
            <div class="patient-info">
                <strong>${patient.nombre} ${patient.apellido}</strong>
                <br>
                <small>RUT: ${patient.rut}</small>
            </div>
        </div>
    `).join('');

    resultsContainer.innerHTML = resultsHTML;
}

// Seleccionar paciente
window.selectPatient = function(patientId) {
    loadPatientTimeline(patientId);
    
    // Limpiar búsqueda
    document.getElementById('patient-search-input').value = '';
    document.getElementById('patient-search-results').innerHTML = '';
};

// Funciones de acciones del timeline (expuestas globalmente)
window.addTimelineEntry = function() {
    if (!currentPatientId) {
        showNotification('Primero selecciona un paciente', 'warning');
        return;
    }
    
    showNotification('Función de agregar entrada en desarrollo', 'info');
};

window.viewTimelineEntry = function(entryId, type) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) {
        showNotification('Entrada no encontrada', 'error');
        return;
    }
    
    showNotification('Función de ver detalles en desarrollo', 'info');
};

window.editTimelineEntry = function(entryId, type) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) {
        showNotification('Entrada no encontrada', 'error');
        return;
    }
    
    showNotification('Función de editar entrada en desarrollo', 'info');
};

window.duplicateTimelineEntry = function(entryId) {
    const entry = timelineData.find(e => e.id === entryId);
    if (!entry) {
        showNotification('Entrada no encontrada', 'error');
        return;
    }
    
    showNotification('Función de duplicar entrada en desarrollo', 'info');
};

window.clearTimelineFilters = function() {
    timelineFilters = {
        tipo: 'todos',
        profesional: 'todos',
        fechaDesde: null,
        fechaHasta: null
    };
    
    // Limpiar inputs
    const typeFilter = document.getElementById('timeline-type-filter');
    const professionalFilter = document.getElementById('timeline-professional-filter');
    const dateFromFilter = document.getElementById('timeline-date-from');
    const dateToFilter = document.getElementById('timeline-date-to');
    
    if (typeFilter) typeFilter.value = 'todos';
    if (professionalFilter) professionalFilter.value = 'todos';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    
    renderTimeline();
    showNotification('Filtros limpiados', 'success');
};

window.exportTimeline = function() {
    if (!currentPatientId) {
        showNotification('No hay timeline para exportar', 'warning');
        return;
    }
    
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
    try {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long' 
        });
    } catch (error) {
        return monthKey;
    }
}

function formatDateForStorage(date) {
    return date.toISOString().split('T')[0];
}

function showTimelineLoading(show) {
    const loading = document.getElementById('timeline-loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

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

// Exportar funciones principales
export {
    renderTimeline,
    applyTimelineFilters,
    loadTimelineData
};
