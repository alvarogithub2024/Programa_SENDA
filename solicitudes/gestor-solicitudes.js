/**
 * SOLICITUDES/GESTOR-SOLICITUDES.JS
 * Sistema completo de gestión de solicitudes de ingreso
 */

import { getFirestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { formatDate, formatTime, formatRUT, formatPhoneNumber } from '../utilidades/formato.js';
import { createModal, showModal, closeModal } from '../utilidades/mordales.js';

// Variables globales
let solicitudesData = [];
let filteredSolicitudes = [];
let currentFilters = {};

/**
 * Inicializa el gestor de solicitudes
 */
export function initSolicitudesManager() {
    try {
        setupSolicitudesFilters();
        setupSolicitudesSearch();
        setupSolicitudesTable();
        loadSolicitudesData();
        console.log('🗂️ Gestor de solicitudes inicializado');
    } catch (error) {
        console.error('Error inicializando gestor de solicitudes:', error);
    }
}

/**
 * Carga las solicitudes desde Firebase
 */
async function loadSolicitudesData() {
    try {
        showLoadingState(true);
        
        const db = getFirestore();
        const solicitudesRef = db.collection('solicitudes_ingreso');
        const snapshot = await solicitudesRef.orderBy('fechaCreacion', 'desc').get();
        
        solicitudesData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            solicitudesData.push({
                id: doc.id,
                ...data,
                // Asegurar que las fechas sean objetos Date
                fechaCreacion: data.fechaCreacion?.toDate ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion),
                fechaAgenda: data.fechaAgenda?.toDate ? data.fechaAgenda.toDate() : new Date(data.fechaAgenda)
            });
        });

        // Aplicar filtros si existen
        applyCurrentFilters();
        
        updateSolicitudesCounter();
        renderSolicitudesTable();
        
        console.log(`✅ ${solicitudesData.length} solicitudes cargadas`);
        showNotification(`${solicitudesData.length} solicitudes cargadas`, 'success');

    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        showNotification('Error cargando solicitudes', 'error');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Configura los filtros de solicitudes
 */
function setupSolicitudesFilters() {
    // Filtro por estado
    const estadoFilter = document.getElementById('filter-estado');
    if (estadoFilter) {
        estadoFilter.innerHTML = `
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="agendada">Agendada</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
            <option value="rechazada">Rechazada</option>
        `;
        estadoFilter.addEventListener('change', handleFilterChange);
    }

    // Filtro por prioridad
    const prioridadFilter = document.getElementById('filter-prioridad');
    if (prioridadFilter) {
        prioridadFilter.innerHTML = `
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
        `;
        prioridadFilter.addEventListener('change', handleFilterChange);
    }

    // Filtro por urgencia
    const urgenciaFilter = document.getElementById('filter-urgencia');
    if (urgenciaFilter) {
        urgenciaFilter.innerHTML = `
            <option value="">Todas las urgencias</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
        `;
        urgenciaFilter.addEventListener('change', handleFilterChange);
    }

    // Filtro por CESFAM
    const cesfamFilter = document.getElementById('filter-cesfam');
    if (cesfamFilter) {
        loadCesfamOptions();
        cesfamFilter.addEventListener('change', handleFilterChange);
    }

    // Filtro por tipo de solicitud
    const tipoFilter = document.getElementById('filter-tipo');
    if (tipoFilter) {
        tipoFilter.innerHTML = `
            <option value="">Todos los tipos</option>
            <option value="identificado">Identificado</option>
            <option value="anonimo">Anónimo</option>
            <option value="familiar">Familiar</option>
        `;
        tipoFilter.addEventListener('change', handleFilterChange);
    }

    // Filtro por origen
    const origenFilter = document.getElementById('filter-origen');
    if (origenFilter) {
        origenFilter.innerHTML = `
            <option value="">Todos los orígenes</option>
            <option value="web_publica">Web Pública</option>
            <option value="telefonica">Telefónica</option>
            <option value="presencial">Presencial</option>
            <option value="derivacion">Derivación</option>
        `;
        origenFilter.addEventListener('change', handleFilterChange);
    }

    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

/**
 * Carga las opciones de CESFAM
 */
async function loadCesfamOptions() {
    try {
        const db = getFirestore();
        const cesfamsRef = db.collection('centros');
        const snapshot = await cesfamsRef.get();
        
        const cesfamFilter = document.getElementById('filter-cesfam');
        if (!cesfamFilter) return;

        cesfamFilter.innerHTML = '<option value="">Todos los CESFAM</option>';
        
        const cesfams = new Set();
        solicitudesData.forEach(solicitud => {
            if (solicitud.cesfam) {
                cesfams.add(solicitud.cesfam);
            }
        });

        Array.from(cesfams).sort().forEach(cesfam => {
            const option = document.createElement('option');
            option.value = cesfam;
            option.textContent = cesfam;
            cesfamFilter.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando CESFAM:', error);
    }
}

/**
 * Configura la búsqueda de solicitudes
 */
function setupSolicitudesSearch() {
    const searchInput = document.getElementById('solicitudes-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    }
}

/**
 * Maneja cambios en los filtros
 */
function handleFilterChange(e) {
    const filterId = e.target.id.replace('filter-', '');
    currentFilters[filterId] = e.target.value;
    
    applyCurrentFilters();
    renderSolicitudesTable();
    updateSolicitudesCounter();
}

/**
 * Maneja la entrada de búsqueda
 */
function handleSearchInput(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    currentFilters.search = searchTerm;
    
    applyCurrentFilters();
    renderSolicitudesTable();
    updateSolicitudesCounter();
}

/**
 * Aplica los filtros actuales
 */
function applyCurrentFilters() {
    filteredSolicitudes = solicitudesData.filter(solicitud => {
        // Filtro por estado
        if (currentFilters.estado && solicitud.estado !== currentFilters.estado) {
            return false;
        }

        // Filtro por prioridad
        if (currentFilters.prioridad && solicitud.prioridad !== currentFilters.prioridad) {
            return false;
        }

        // Filtro por urgencia
        if (currentFilters.urgencia && solicitud.urgencia !== currentFilters.urgencia) {
            return false;
        }

        // Filtro por CESFAM
        if (currentFilters.cesfam && solicitud.cesfam !== currentFilters.cesfam) {
            return false;
        }

        // Filtro por tipo
        if (currentFilters.tipo && solicitud.tipoSolicitud !== currentFilters.tipo) {
            return false;
        }

        // Filtro por origen
        if (currentFilters.origen && solicitud.origen !== currentFilters.origen) {
            return false;
        }

        // Filtro de búsqueda
        if (currentFilters.search) {
            const searchFields = [
                solicitud.nombre,
                solicitud.apellidos,
                solicitud.rut,
                solicitud.email,
                solicitud.telefono,
                solicitud.descripcion,
                solicitud.direccion
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchFields.includes(currentFilters.search)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Limpia todos los filtros
 */
function clearAllFilters() {
    currentFilters = {};
    
    // Limpiar selects
    document.querySelectorAll('.filters select').forEach(select => {
        select.value = '';
    });

    // Limpiar búsqueda
    const searchInput = document.getElementById('solicitudes-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Aplicar filtros (vacíos)
    applyCurrentFilters();
    renderSolicitudesTable();
    updateSolicitudesCounter();

    showNotification('Filtros limpiados', 'info');
}

/**
 * Configura la tabla de solicitudes
 */
function setupSolicitudesTable() {
    // Configurar ordenamiento por columnas
    const headers = document.querySelectorAll('.solicitudes-table th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => handleColumnSort(header.dataset.sort));
        header.style.cursor = 'pointer';
    });
}

/**
 * Maneja el ordenamiento por columnas
 */
function handleColumnSort(column) {
    const currentSort = filteredSolicitudes.sort || {};
    const isAsc = currentSort.column === column && currentSort.direction === 'asc';
    
    filteredSolicitudes.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Manejo especial para fechas
        if (column.includes('fecha')) {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }
        
        // Manejo para números
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return isAsc ? aVal - bVal : bVal - aVal;
        }

        // Manejo para strings
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
        
        if (isAsc) {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });

    // Guardar estado del ordenamiento
    filteredSolicitudes.sort = {
        column: column,
        direction: isAsc ? 'desc' : 'asc'
    };

    renderSolicitudesTable();
    updateSortIndicators(column, isAsc ? 'desc' : 'asc');
}

/**
 * Actualiza los indicadores de ordenamiento
 */
function updateSortIndicators(column, direction) {
    // Limpiar indicadores existentes
    document.querySelectorAll('.solicitudes-table th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });

    // Agregar indicador actual
    const header = document.querySelector(`[data-sort="${column}"]`);
    if (header) {
        header.classList.add(`sort-${direction}`);
    }
}

/**
 * Renderiza la tabla de solicitudes
 */
function renderSolicitudesTable() {
    const tableBody = document.getElementById('solicitudes-table-body');
    if (!tableBody) return;

    if (filteredSolicitudes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="12" class="no-data">
                    <div class="no-data-message">
                        <i class="fas fa-inbox"></i>
                        <p>No se encontraron solicitudes</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredSolicitudes.map(solicitud => `
        <tr class="solicitud-row ${getPriorityClass(solicitud.prioridad)}" data-id="${solicitud.id}">
            <td class="solicitud-info">
                <div class="patient-name">${solicitud.nombre} ${solicitud.apellidos}</div>
                <div class="patient-details">
                    <span class="rut">${formatRUT(solicitud.rut)}</span>
                    <span class="edad">${solicitud.edad} años</span>
                </div>
            </td>
            <td class="contact-info">
                <div class="email">${solicitud.email}</div>
                <div class="phone">${formatPhoneNumber(solicitud.telefono)}</div>
            </td>
            <td class="status-info">
                <span class="status-badge ${getStatusClass(solicitud.estado)}">${getStatusText(solicitud.estado)}</span>
            </td>
            <td class="priority-info">
                <span class="priority-badge ${getPriorityClass(solicitud.prioridad)}">${getPriorityText(solicitud.prioridad)}</span>
                <span class="urgency-badge ${getUrgencyClass(solicitud.urgencia)}">${getUrgencyText(solicitud.urgencia)}</span>
            </td>
            <td class="substances-info">
                ${solicitud.sustancias ? solicitud.sustancias.map(sustancia => 
                    `<span class="substance-tag">${getSustanciaText(sustancia)}</span>`
                ).join('') : ''}
            </td>
            <td class="date-info">
                <div class="creation-date">
                    <small>Creada:</small><br>
                    ${formatDate(solicitud.fechaCreacion)}
                </div>
                ${solicitud.fechaAgenda ? `
                    <div class="schedule-date">
                        <small>Agendada:</small><br>
                        ${formatDate(solicitud.fechaAgenda)}
                    </div>
                ` : ''}
            </td>
            <td class="description-info">
                <div class="description-preview" title="${solicitud.descripcion}">
                    ${truncateText(solicitud.descripcion, 50)}
                </div>
            </td>
            <td class="cesfam-info">
                <small>${solicitud.cesfam}</small>
            </td>
            <td class="motivation-info">
                <div class="motivation-score">
                    <span class="score">${solicitud.motivacion}/10</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${solicitud.motivacion * 10}%"></div>
                    </div>
                </div>
            </td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="viewSolicitudDetails('${solicitud.id}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${solicitud.estado === 'pendiente' ? `
                        <button class="btn-sm btn-success" onclick="scheduleFromSolicitud('${solicitud.id}')" title="Agendar cita">
                            <i class="fas fa-calendar-plus"></i>
                        </button>
                    ` : ''}
                    ${solicitud.citaId ? `
                        <button class="btn-sm btn-info" onclick="viewAssociatedAppointment('${solicitud.citaId}')" title="Ver cita">
                            <i class="fas fa-calendar-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-warning" onclick="updateSolicitudStatus('${solicitud.id}')" title="Cambiar estado">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza el contador de solicitudes
 */
function updateSolicitudesCounter() {
    const counter = document.getElementById('solicitudes-counter');
    if (counter) {
        const total = solicitudesData.length;
        const filtered = filteredSolicitudes.length;
        
        counter.innerHTML = `
            <span class="count-info">
                Mostrando ${filtered} de ${total} solicitudes
            </span>
            ${getCountByStatus()}
        `;
    }
}

/**
 * Obtiene el conteo por estado
 */
function getCountByStatus() {
    const counts = {
        pendiente: 0,
        agendada: 0,
        en_proceso: 0,
        completada: 0,
        cancelada: 0,
        rechazada: 0
    };

    filteredSolicitudes.forEach(solicitud => {
        if (counts.hasOwnProperty(solicitud.estado)) {
            counts[solicitud.estado]++;
        }
    });

    return `
        <div class="status-counts">
            <span class="count-item">
                <span class="status-dot pendiente"></span>
                Pendientes: ${counts.pendiente}
            </span>
            <span class="count-item">
                <span class="status-dot agendada"></span>
                Agendadas: ${counts.agendada}
            </span>
            <span class="count-item">
                <span class="status-dot en_proceso"></span>
                En Proceso: ${counts.en_proceso}
            </span>
        </div>
    `;
}

/**
 * Ver detalles completos de una solicitud
 */
window.viewSolicitudDetails = function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const modalContent = `
        <div class="solicitud-details">
            <div class="detail-header">
                <h3>${solicitud.nombre} ${solicitud.apellidos}</h3>
                <span class="status-badge ${getStatusClass(solicitud.estado)}">${getStatusText(solicitud.estado)}</span>
            </div>
            
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>Información Personal</h4>
                    <div class="detail-row">
                        <label>RUT:</label>
                        <span>${formatRUT(solicitud.rut)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Edad:</label>
                        <span>${solicitud.edad} años</span>
                    </div>
                    <div class="detail-row">
                        <label>Email:</label>
                        <span>${solicitud.email}</span>
                    </div>
                    <div class="detail-row">
                        <label>Teléfono:</label>
                        <span>${formatPhoneNumber(solicitud.telefono)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Dirección:</label>
                        <span>${solicitud.direccion}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Información de Solicitud</h4>
                    <div class="detail-row">
                        <label>CESFAM:</label>
                        <span>${solicitud.cesfam}</span>
                    </div>
                    <div class="detail-row">
                        <label>Prioridad:</label>
                        <span class="priority-badge ${getPriorityClass(solicitud.prioridad)}">${getPriorityText(solicitud.prioridad)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Urgencia:</label>
                        <span class="urgency-badge ${getUrgencyClass(solicitud.urgencia)}">${getUrgencyText(solicitud.urgencia)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Motivación:</label>
                        <span>${solicitud.motivacion}/10</span>
                    </div>
                    <div class="detail-row">
                        <label>¿Es para usted?:</label>
                        <span>${solicitud.paraMi === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Consumo y Tratamiento</h4>
                    <div class="detail-row">
                        <label>Sustancias:</label>
                        <span>${solicitud.sustancias ? solicitud.sustancias.map(s => getSustanciaText(s)).join(', ') : 'No especificadas'}</span>
                    </div>
                    <div class="detail-row">
                        <label>Tiempo de consumo:</label>
                        <span>${getTiempoConsumoText(solicitud.tiempoConsumo)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Tratamiento previo:</label>
                        <span>${solicitud.tratamientoPrevio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                </div>

                <div class="detail-section full-width">
                    <h4>Descripción</h4>
                    <p class="description-full">${solicitud.descripcion}</p>
                </div>

                <div class="detail-section">
                    <h4>Fechas</h4>
                    <div class="detail-row">
                        <label>Fecha de creación:</label>
                        <span>${formatDateTime(solicitud.fechaCreacion)}</span>
                    </div>
                    ${solicitud.fechaAgenda ? `
                        <div class="detail-row">
                            <label>Fecha de agenda:</label>
                            <span>${formatDateTime(solicitud.fechaAgenda)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="detail-section">
                    <h4>Información Técnica</h4>
                    <div class="detail-row">
                        <label>Origen:</label>
                        <span>${getOrigenText(solicitud.origen)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Tipo:</label>
                        <span>${getTipoSolicitudText(solicitud.tipoSolicitud)}</span>
                    </div>
                    <div class="detail-row">
                        <label>Versión:</label>
                        <span>${solicitud.version}</span>
                    </div>
                    ${solicitud.citaId ? `
                        <div class="detail-row">
                            <label>ID Cita:</label>
                            <span>${solicitud.citaId}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-actions">
                ${solicitud.estado === 'pendiente' ? `
                    <button class="btn btn-success" onclick="scheduleFromSolicitud('${solicitud.id}'); closeModal('solicitud-details-modal');">
                        <i class="fas fa-calendar-plus"></i>
                        Agendar Cita
                    </button>
                ` : ''}
                <button class="btn btn-warning" onclick="updateSolicitudStatus('${solicitud.id}')">
                    <i class="fas fa-edit"></i>
                    Cambiar Estado
                </button>
                ${solicitud.citaId ? `
                    <button class="btn btn-info" onclick="viewAssociatedAppointment('${solicitud.citaId}')">
                        <i class="fas fa-calendar-check"></i>
                        Ver Cita Asociada
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // Crear y mostrar modal
    const modal = createModal('solicitud-details-modal', 'Detalles de Solicitud', modalContent, { large: true });
    showModal('solicitud-details-modal');
};

/**
 * Programa una cita desde una solicitud
 */
window.scheduleFromSolicitud = function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;

    // Redirigir al calendario con datos pre-cargados
    const params = new URLSearchParams({
        from: 'solicitud',
        solicitudId: solicitudId,
        patientName: `${solicitud.nombre} ${solicitud.apellidos}`,
        patientRut: solicitud.rut,
        patientEmail: solicitud.email,
        patientPhone: solicitud.telefono,
        cesfam: solicitud.cesfam,
        priority: solicitud.prioridad,
        urgency: solicitud.urgencia,
        description: solicitud.descripcion
    });

    window.location.hash = `#calendario?${params.toString()}`;
};

/**
 * Actualiza el estado de una solicitud
 */
window.updateSolicitudStatus = function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const modalContent = `
        <form id="update-status-form">
            <input type="hidden" name="solicitudId" value="${solicitudId}">
            
            <div class="form-group">
                <label for="nuevo-estado">Nuevo Estado:</label>
                <select id="nuevo-estado" name="estado" required>
                    <option value="">Seleccionar estado</option>
                    <option value="pendiente" ${solicitud.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="agendada" ${solicitud.estado === 'agendada' ? 'selected' : ''}>Agendada</option>
                    <option value="en_proceso" ${solicitud.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="completada" ${solicitud.estado === 'completada' ? 'selected' : ''}>Completada</option>
                    <option value="cancelada" ${solicitud.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    <option value="rechazada" ${solicitud.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
                </select>
            </div>

            <div class="form-group">
                <label for="observaciones">Observaciones (opcional):</label>
                <textarea id="observaciones" name="observaciones" rows="3" placeholder="Agregar observaciones sobre el cambio de estado..."></textarea>
            </div>

            <div class="form-actions">
                <button type="button" onclick="closeModal('update-status-modal')" class="btn btn-secondary">
                    Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i>
                    Actualizar Estado
                </button>
            </div>
        </form>
    `;

    const modal = createModal('update-status-modal', 'Actualizar Estado', modalContent);
    showModal('update-status-modal');

    // Configurar envío del formulario
    const form = document.getElementById('update-status-form');
    if (form) {
        form.addEventListener('submit', handleStatusUpdate);
    }
};

/**
 * Maneja la actualización de estado
 */
async function handleStatusUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const solicitudId = formData.get('solicitudId');
    const nuevoEstado = formData.get('estado');
    const observaciones = formData.get('observaciones');

    try {
        const db = getFirestore();
        const solicitudRef = db.collection('solicitudes_ingreso').doc(solicitudId);

        const updateData = {
            estado: nuevoEstado,
            fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (observaciones) {
            updateData.observaciones = observaciones;
        }

        await solicitudRef.update(updateData);

        // Actualizar datos locales
        const solicitudIndex = solicitudesData.findIndex(s => s.id === solicitudId);
        if (solicitudIndex !== -1) {
            solicitudesData[solicitudIndex].estado = nuevoEstado;
            if (observaciones) {
                solicitudesData[solicitudIndex].observaciones = observaciones;
            }
        }

        // Re-renderizar tabla
        applyCurrentFilters();
        renderSolicitudesTable();
        updateSolicitudesCounter();

        closeModal('update-status-modal');
        showNotification('Estado actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error actualizando estado:', error);
        showNotification('Error actualizando estado', 'error');
    }
}

/**
 * Ver cita asociada
 */
window.viewAssociatedAppointment = function(citaId) {
    // Redirigir a la vista de citas con el ID específico
    window.location.hash = `#citas?view=${citaId}`;
};

/**
 * Exportar solicitudes a Excel
 */
export async function exportSolicitudesToExcel() {
    try {
        const workbook = XLSX.utils.book_new();
        
        const dataToExport = filteredSolicitudes.map(solicitud => ({
            'Nombre': `${solicitud.nombre} ${solicitud.apellidos}`,
            'RUT': solicitud.rut,
            'Edad': solicitud.edad,
            'Email': solicitud.email,
            'Teléfono': solicitud.telefono,
            'Dirección': solicitud.direccion,
            'CESFAM': solicitud.cesfam,
            'Estado': getStatusText(solicitud.estado),
            'Prioridad': getPriorityText(solicitud.prioridad),
            'Urgencia': getUrgencyText(solicitud.urgencia),
            'Sustancias': solicitud.sustancias ? solicitud.sustancias.join(', ') : '',
            'Tiempo Consumo': getTiempoConsumoText(solicitud.tiempoConsumo),
            'Tratamiento Previo': solicitud.tratamientoPrevio === 'si' ? 'Sí' : 'No',
            'Para Mí': solicitud.paraMi === 'si' ? 'Sí' : 'No',
            'Motivación': `${solicitud.motivacion}/10`,
            'Descripción': solicitud.descripcion,
            'Fecha Creación': formatDateTime(solicitud.fechaCreacion),
            'Fecha Agenda': solicitud.fechaAgenda ? formatDateTime(solicitud.fechaAgenda) : '',
            'Origen': getOrigenText(solicitud.origen),
            'Tipo': getTipoSolicitudText(solicitud.tipoSolicitud),
            'ID Cita': solicitud.citaId || '',
            'Versión': solicitud.version
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes');

        const filename = `solicitudes_ingreso_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);

        showNotification(`Archivo exportado: ${filename}`, 'success');

    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showNotification('Error exportando archivo', 'error');
    }
}

// Funciones de utilidad para formateo y display
function getStatusClass(status) {
    const classes = {
        'pendiente': 'status-pending',
        'agendada': 'status-scheduled', 
        'en_proceso': 'status-in-progress',
        'completada': 'status-completed',
        'cancelada': 'status-cancelled',
        'rechazada': 'status-rejected'
    };
    return classes[status] || 'status-unknown';
}

function getStatusText(status) {
    const texts = {
        'pendiente': 'Pendiente',
        'agendada': 'Agendada',
        'en_proceso': 'En Proceso', 
        'completada': 'Completada',
        'cancelada': 'Cancelada',
        'rechazada': 'Rechazada'
    };
    return texts[status] || status;
}

function getPriorityClass(priority) {
    const classes = {
        'alta': 'priority-high',
        'media': 'priority-medium',
        'baja': 'priority-low'
    };
    return classes[priority] || 'priority-unknown';
}

function getPriorityText(priority) {
    const texts = {
        'alta': 'Alta',
        'media': 'Media', 
        'baja': 'Baja'
    };
    return texts[priority] || priority;
}

function getUrgencyClass(urgency) {
    const classes = {
        'alta': 'urgency-high',
        'media': 'urgency-medium',
        'baja': 'urgency-low'
    };
    return classes[urgency] || 'urgency-unknown';
}

function getUrgencyText(urgency) {
    const texts = {
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja'
    };
    return texts[urgency] || urgency;
}

function getSustanciaText(sustancia) {
    const texts = {
        'alcohol': 'Alcohol',
        'marihuana': 'Marihuana',
        'cocaina': 'Cocaína',
        'pasta_base': 'Pasta Base',
        'benzodiacepinas': 'Benzodiacepinas',
        'otros': 'Otros'
    };
    return texts[sustancia] || sustancia;
}

function getTiempoConsumoText(tiempo) {
    const texts = {
        'menos_1_año': 'Menos de 1 año',
        '1_3_años': '1 a 3 años',
        '3_5_años': '3 a 5 años',
        'mas_5_años': 'Más de 5 años'
    };
    return texts[tiempo] || tiempo;
}

function getOrigenText(origen) {
    const texts = {
        'web_publica': 'Web Pública',
        'telefonica': 'Telefónica',
        'presencial': 'Presencial',
        'derivacion': 'Derivación'
    };
    return texts[origen] || origen;
}

function getTipoSolicitudText(tipo) {
    const texts = {
        'identificado': 'Identificado',
        'anonimo': 'Anónimo',
        'familiar': 'Familiar'
    };
    return texts[tipo] || tipo;
}

function formatDateTime(date) {
    if (!date) return '';
    
    return new Date(date).toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago'
    });
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function showLoadingState(show) {
    const loadingElement = document.getElementById('solicitudes-loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }

    const tableContainer = document.getElementById('solicitudes-table-container');
    if (tableContainer) {
        tableContainer.style.opacity = show ? '0.5' : '1';
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
    loadSolicitudesData,
    applyCurrentFilters,
    renderSolicitudesTable,
    clearAllFilters
};
