/**
 * Gestor de Solicitudes - Muestra solicitudes de ingreso, reingresos y solicitudes de información.
 */

// Variables globales
let solicitudesData = [];
let filteredSolicitudesData = [];
let currentFilters = {
    estado: 'todos',
    prioridad: 'todos',
    cesfam: 'todos',
    fecha: 'todos',
    busqueda: ''
};
let isAutoRefreshEnabled = true;
let autoRefreshInterval = null;

// Configuración de estados y prioridades
const ESTADOS_SOLICITUDES = {
    'pendiente': { label: 'Pendiente', color: '#f59e0b', icon: '⏳' },
    'en_proceso': { label: 'En Proceso', color: '#3b82f6', icon: '🔄' },
    'agendada': { label: 'Agendada', color: '#10b981', icon: '📅' },
    'completada': { label: 'Completada', color: '#059669', icon: '✅' },
    'cancelada': { label: 'Cancelada', color: '#ef4444', icon: '❌' },
    'rechazada': { label: 'Rechazada', color: '#dc2626', icon: '🚫' }
};

const PRIORIDADES_SOLICITUDES = {
    'alta': { label: 'Alta', color: '#dc2626', icon: '🔴' },
    'media': { label: 'Media', color: '#f59e0b', icon: '🟡' },
    'baja': { label: 'Baja', color: '#10b981', icon: '🟢' }
};

const CESFAM_OPTIONS = [
    'CESFAM Karol Wojtyla',
    'CESFAM Padre Manuel Villaseca',
    'CESFAM Vista Hermosa',
    'CESFAM San Gerónimo',
    'CESFAM Cardenal Raul Silva Henriquez',
    'CESFAM Laurita Vicuña',
    'CESFAM Alejandro del Río',
    'CESFAM Bernardo Leighton'
];

/**
 * FUNCIÓN PRINCIPAL - Inicializar gestor de solicitudes
 */
window.initSolicitudesManager = function() {
    try {
        console.log('📋 Inicializando gestor de solicitudes...');
        const solicitudesTab = document.getElementById('solicitudes-tab');
        if (!solicitudesTab || !solicitudesTab.classList.contains('active')) {
            console.log('⏸️ Solicitudes no se inicializa - pestaña no activa');
            return;
        }
        loadAllSolicitudes().then(() => {
            resetFilters();
            applyCurrentFilters();
            setupFilters();
            setupEvents();
            setupAutoRefresh();
            renderSolicitudesTable();
            updateSolicitudesCounter();
            updateSolicitudesStats();
            console.log('✅ Gestor de solicitudes inicializado');
        });
    } catch (error) {
        console.error('❌ Error inicializando gestor de solicitudes:', error);
        if (window.showNotification) {
            window.showNotification('Error inicializando solicitudes', 'error');
        }
    }
};

/**
 * Carga todas las solicitudes desde las 3 colecciones y las une
 */
function loadAllSolicitudes() {
    return new Promise((resolve, reject) => {
        try {
            const db = window.getFirestore();
            const ingresoPromise = db.collection('solicitudes_ingreso').get();
            const reingresoPromise = db.collection('reingresos').get();
            const infoPromise = db.collection('solicitudes_informacion').get();

            Promise.all([ingresoPromise, reingresoPromise, infoPromise]).then(([ingresoSnap, reingresoSnap, infoSnap]) => {
                solicitudesData = [];
                // solicitudes_ingreso
                ingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'ingreso';
                    if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
                // reingresos
                reingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'reingreso';
                    // Usa fechaCreacion como fecha principal si existe
                    if (data.fechaCreacion && !(data.fechaCreacion instanceof Date)) {
                        data.fecha = new Date(data.fechaCreacion);
                    } else if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
                // solicitudes_informacion
                infoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'informacion';
                    data.tipo = 'informacion';
                    if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
                // Ordenar por fecha descendente
                solicitudesData.sort((a, b) => (b.fecha?.getTime?.() || 0) - (a.fecha?.getTime?.() || 0));
                resolve();
            }).catch(error => {
                console.error('Error cargando solicitudes Firebase:', error);
                if (window.showNotification) {
                    window.showNotification('Error cargando solicitudes (ingreso, reingreso, info)', 'error');
                }
                resolve();
            });
        } catch (error) {
            console.error('Error accediendo a Firestore:', error);
            resolve();
        }
    });
}

/**
 * Configurar filtros
 */
function setupFilters() {
    try {
        fillSelectOptions('filtro-estado-solicitudes', ['todos', 'pendiente', 'en_proceso', 'agendada', 'completada'], {
            todos: 'Todos los estados',
            pendiente: 'Pendiente',
            en_proceso: 'En proceso',
            agendada: 'Agendada',
            completada: 'Completada'
        });
        fillSelectOptions('filtro-prioridad-solicitudes', ['todos', 'alta', 'media', 'baja'], {
            todos: 'Todas las prioridades',
            alta: 'Alta',
            media: 'Media',
            baja: 'Baja'
        });
        fillSelectOptions('filtro-cesfam-solicitudes', ['todos', ...CESFAM_OPTIONS], {
            todos: 'Todos los CESFAM'
        });

        const filters = [
            { id: 'filtro-estado-solicitudes', prop: 'estado' },
            { id: 'filtro-prioridad-solicitudes', prop: 'prioridad' },
            { id: 'filtro-cesfam-solicitudes', prop: 'cesfam' },
            { id: 'filtro-fecha-solicitudes', prop: 'fecha' }
        ];
        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element) {
                element.addEventListener('change', function(e) {
                    currentFilters[filter.prop] = e.target.value;
                    applyCurrentFilters();
                });
            }
        });

        const searchInput = document.getElementById('buscar-solicitudes');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                currentFilters.busqueda = e.target.value;
                applyCurrentFilters();
            });
        }
    } catch (error) {
        console.error('Error configurando filtros:', error);
    }
}

/**
 * Configurar eventos
 */
function setupEvents() {
    try {
        const refreshBtn = document.getElementById('refresh-solicitudes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                resetFilters();
                if (window.showNotification) {
                    window.showNotification('Filtros limpiados', 'info');
                }
            });
        }
        const exportBtn = document.getElementById('export-solicitudes');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportSolicitudesToExcel);
        }
    } catch (error) {
        console.error('Error configurando eventos:', error);
    }
}

/**
 * Configurar auto-actualización
 */
function setupAutoRefresh() {
    if (isAutoRefreshEnabled && !autoRefreshInterval) {
        autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-actualizando solicitudes desde Firebase...');
            loadAllSolicitudes().then(applyCurrentFilters);
        }, 30000); // Cada 30 segundos
    }
}

function renderSolicitudesTable() {
    try {
        const tableBody = document.getElementById('solicitudes-table-body');
        if (!tableBody) {
            console.warn('⚠️ Elemento solicitudes-table-body no encontrado');
            return;
        }
        if (filteredSolicitudesData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 48px;">
                        <div class="empty-state">
                            <div style="font-size: 3rem; margin-bottom: 16px;">📋</div>
                            <h3 style="margin-bottom: 8px; color: #6b7280;">No hay solicitudes</h3>
                            <p style="color: #9ca3af;">
                                ${currentFilters.busqueda || 
                                  currentFilters.estado !== 'todos' || 
                                  currentFilters.prioridad !== 'todos' || 
                                  currentFilters.cesfam !== 'todos' 
                                  ? 'No se encontraron solicitudes con los filtros aplicados' 
                                  : 'No hay solicitudes registradas'}
                            </p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        const rows = filteredSolicitudesData.map(solicitud => {
            return `
                <tr class="solicitud-row" data-solicitud-id="${solicitud.id}">
                    <td>
                        <div class="paciente-info">
                            <div class="paciente-nombre">
                                ${solicitud.nombre || ""} ${solicitud.apellidos || ""}
                            </div>
                            <div class="paciente-detalles">
                                RUT: ${solicitud.rut || ""}<br>
                                Edad: ${solicitud.edad || ""} años
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="contacto-info">
                            <div><i class="fas fa-phone"></i> ${solicitud.telefono || ""}</div>
                            <div><i class="fas fa-envelope"></i> ${solicitud.email || ""}</div>
                        </div>
                    </td>
                    <td>
                        <div class="cesfam-badge">
                            ${solicitud.cesfam || ""}
                        </div>
                    </td>
                    <td>
                        <span class="estado-badge">
                            ${solicitud.estado || solicitud.tipo || solicitud.origen || ""}
                        </span>
                    </td>
                    <td>
                        <span class="prioridad-badge">
                            ${solicitud.prioridad || solicitud.urgencia || ""}
                        </span>
                    </td>
                    <td>
                        <div class="fecha-info">
                            <div class="fecha-principal">
                                ${solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : ""}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="sustancias-info">
                            ${Array.isArray(solicitud.sustancias) 
                                ? solicitud.sustancias.slice(0, 2).map(s => 
                                    `<span class="sustancia-tag">${s}</span>`
                                  ).join(' ')
                                : '<span class="sustancia-tag">No especificado</span>'
                            }
                            ${Array.isArray(solicitud.sustancias) && solicitud.sustancias.length > 2 
                                ? `<span class="sustancia-tag">+${solicitud.sustancias.length - 2}</span>` 
                                : ''
                            }
                        </div>
                    </td>
                    <td>
                        <div class="acciones-solicitud">
                            <button class="btn-accion btn-ver" onclick="verDetalleSolicitud('${solicitud.id}')" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        tableBody.innerHTML = rows;
        console.log(`✅ Tabla renderizada con ${filteredSolicitudesData.length} solicitudes`);
    } catch (error) {
        console.error('❌ Error renderizando tabla:', error);
        const tableBody = document.getElementById('solicitudes-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 48px;">
                        <div style="color: #ef4444;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px;"></i>
                            <h3>Error cargando solicitudes</h3>
                            <p>Ha ocurrido un error al mostrar las solicitudes.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function updateSolicitudesCounter() {
    try {
        const counter = document.getElementById('solicitudes-counter');
        const totalCounter = document.getElementById('solicitudes-total-counter');
        if (counter) counter.textContent = filteredSolicitudesData.length;
        if (totalCounter) totalCounter.textContent = solicitudesData.length;
        const tabButton = document.querySelector('[data-tab="solicitudes"]');
        if (tabButton) {
            const badge = tabButton.querySelector('.tab-badge');
            if (badge) badge.textContent = filteredSolicitudesData.length;
        }
    } catch (error) {
        console.error('❌ Error actualizando contador:', error);
    }
}

function updateSolicitudesStats() {
    try {
        const stats = calculateSolicitudesStats();
        const statsContainer = document.getElementById('solicitudes-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #f59e0b20; color: #f59e0b;">
                        ⏳
                    </div>
                    <div class="stat-info">
                        <div class="stat-number">${stats.pendientes}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #dc262620; color: #dc2626;">
                        🔴
                    </div>
                    <div class="stat-info">
                        <div class="stat-number">${stats.altaPrioridad}</div>
                        <div class="stat-label">Alta Prioridad</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #10b98120; color: #10b981;">
                        ✅
                    </div>
                    <div class="stat-info">
                        <div class="stat-number">${stats.completadas}</div>
                        <div class="stat-label">Completadas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #3b82f620; color: #3b82f6;">
                        📅
                    </div>
                    <div class="stat-info">
                        <div class="stat-number">${stats.hoy}</div>
                        <div class="stat-label">Hoy</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
    }
}

function calculateSolicitudesStats() {
    const today = new Date();
    return {
        total: solicitudesData.length,
        pendientes: solicitudesData.filter(s => s.estado === 'pendiente').length,
        altaPrioridad: solicitudesData.filter(s => s.prioridad === 'alta' || s.urgencia === 'alta').length,
        completadas: solicitudesData.filter(s => s.estado === 'completada').length,
        hoy: solicitudesData.filter(s => isSameDay(s.fecha, today)).length,
        enProceso: solicitudesData.filter(s => s.estado === 'en_proceso').length,
        agendadas: solicitudesData.filter(s => s.estado === 'agendada').length
    };
}

function applyCurrentFilters() {
    filteredSolicitudesData = solicitudesData.filter(solicitud => {
        if (currentFilters.estado !== 'todos' && (solicitud.estado || '').toLowerCase() !== currentFilters.estado) return false;
        if (currentFilters.prioridad !== 'todos' && ((solicitud.prioridad || solicitud.urgencia || '').toLowerCase() !== currentFilters.prioridad)) return false;
        if (currentFilters.cesfam !== 'todos' && (solicitud.cesfam || '') !== currentFilters.cesfam) return false;
        if (currentFilters.fecha !== 'todos') {
            const today = new Date();
            const solicitudDate = solicitud.fecha ? new Date(solicitud.fecha) : null;
            if (!solicitudDate) return false;
            switch (currentFilters.fecha) {
                case 'hoy':
                    if (!isSameDay(solicitudDate, today)) return false;
                    break;
                case 'semana':
                case 'esta_semana':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (solicitudDate < weekAgo) return false;
                    break;
                case 'mes':
                case 'este_mes':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (solicitudDate < monthAgo) return false;
                    break;
            }
        }
        if (currentFilters.busqueda) {
            const rut = (solicitud.rut || '').replace(/\./g, '').toLowerCase();
            const nombre = (solicitud.nombre || '').toLowerCase();
            const apellidos = (solicitud.apellidos || '').toLowerCase();
            const email = (solicitud.email || '').toLowerCase();
            const q = currentFilters.busqueda.replace(/\./g, '').toLowerCase();
            if (!rut.includes(q) && !nombre.includes(q) && !apellidos.includes(q) && !email.includes(q)) return false;
        }
        return true;
    });
    renderSolicitudesTable();
    updateSolicitudesCounter();
    updateSolicitudesStats();
}

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

function isSameDay(date1, date2) {
    return date1 && date2 &&
           date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function resetFilters() {
    currentFilters = {
        estado: 'todos',
        prioridad: 'todos',
        cesfam: 'todos',
        fecha: 'todos',
        busqueda: ''
    };
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

function exportSolicitudesToExcel() {
    try {
        console.log('📊 Exportando solicitudes a Excel...');
        const dataToExport = filteredSolicitudesData.map(solicitud => ({
            'Nombre Completo': `${solicitud.nombre || ""} ${solicitud.apellidos || ""}`,
            'RUT': solicitud.rut || "",
            'Edad': solicitud.edad || "",
            'Teléfono': solicitud.telefono || "",
            'Email': solicitud.email || "",
            'CESFAM': solicitud.cesfam || "",
            'Estado': solicitud.estado || solicitud.tipo || solicitud.origen || "",
            'Prioridad': solicitud.prioridad || solicitud.urgencia || "",
            'Sustancias': Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : 'No especificado',
            'Fecha': solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : '',
            'Descripción': solicitud.descripcion || 'Sin descripción'
        }));
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `solicitudes_senda_${timestamp}.csv`;
        const csvContent = convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        if (window.showNotification) {
            window.showNotification(`Solicitudes exportadas: ${filename}`, 'success');
        }
    } catch (error) {
        console.error('❌ Error exportando solicitudes:', error);
        if (window.showNotification) {
            window.showNotification('Error al exportar solicitudes', 'error');
        }
    }
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
}

window.verDetalleSolicitud = function(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (solicitud) {
            console.log('Ver detalles de solicitud:', solicitud);
            if (window.showNotification) {
                window.showNotification('Función de detalles en desarrollo', 'info');
            }
        }
    } catch (error) {
        console.error('Error viendo detalles:', error);
    }
};

window.toggleAccionesSolicitud = function(solicitudId) {
    try {
        const dropdown = document.getElementById(`acciones-${solicitudId}`);
        if (dropdown) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu.id !== `acciones-${solicitudId}`) {
                    menu.classList.remove('show');
                }
            });
            dropdown.classList.toggle('show');
        }
    } catch (error) {
        console.error('Error toggle acciones:', error);
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-acciones')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

window.reloadSolicitudesFromFirebase = function() {
    loadAllSolicitudes().then(applyCurrentFilters);
};

console.log('📋 Gestor de solicitudes extendido listo.');
