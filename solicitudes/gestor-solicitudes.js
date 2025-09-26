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
    // Elimina 'identificado' si existía
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
                ingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'ingreso';
                    if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
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
 * Renderiza la tabla, diferenciando tipos y botones
 */
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
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        const rows = filteredSolicitudesData.map(solicitud => {
            // Diferencia cada tipo para la columna Estado
            let estadoHtml;
            if (solicitud.origen === 'informacion') {
                estadoHtml = `<span class="estado-badge" style="background-color: #4f46e5; color: #fff; border: 1px solid #818cf8;">
                                <i class="fas fa-info-circle"></i> Información
                              </span>`;
            } else if (solicitud.origen === 'reingreso') {
                estadoHtml = `<span class="estado-badge" style="background-color: #059669; color: #fff; border: 1px solid #34d399;">
                                <i class="fas fa-retweet"></i> Reingreso
                              </span>`;
            } else {
                // Estado normal
                const estadoConfig = ESTADOS_SOLICITUDES[solicitud.estado] || ESTADOS_SOLICITUDES['pendiente'];
                estadoHtml = `<span class="estado-badge" style="background-color: ${estadoConfig.color}20; color: ${estadoConfig.color}; border: 1px solid ${estadoConfig.color}40;">
                                ${estadoConfig.icon} ${estadoConfig.label}
                              </span>`;
            }

            // Prioridad
            const prioridadConfig = PRIORIDADES_SOLICITUDES[solicitud.prioridad] || PRIORIDADES_SOLICITUDES['media'];

            // Botones: todos menos Exportar
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
                        <div class="cesfam-badge">${solicitud.cesfam || ""}</div>
                    </td>
                    <td>${estadoHtml}</td>
                    <td>
                        <span class="prioridad-badge" style="background-color: ${prioridadConfig.color}20; color: ${prioridadConfig.color}; border: 1px solid ${prioridadConfig.color}40;">
                            ${prioridadConfig.icon} ${prioridadConfig.label}
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
                            <button class="btn-accion btn-editar" onclick="editarSolicitud('${solicitud.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <div class="dropdown-acciones">
                                <button class="btn-accion btn-mas" onclick="toggleAccionesSolicitud('${solicitud.id}')" title="Más acciones">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-menu" id="acciones-${solicitud.id}">
                                    <button onclick="cambiarEstadoSolicitud('${solicitud.id}', 'en_proceso')">
                                        <i class="fas fa-clock"></i> Marcar en proceso
                                    </button>
                                    <button onclick="agendarCitaSolicitud('${solicitud.id}')">
                                        <i class="fas fa-calendar-plus"></i> Agendar cita
                                    </button>
                                    <hr>
                                    <button onclick="eliminarSolicitud('${solicitud.id}')" class="accion-peligro">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
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

// ... código anterior ...

function renderSolicitudesTable() {
    try {
        const tableBody = document.getElementById('solicitudes-table-body');
        if (!tableBody) return;
        if (filteredSolicitudesData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:48px;">No hay solicitudes</td></tr>`;
            return;
        }
        const rows = filteredSolicitudesData.map(solicitud => {
            // Estado visual
            let estadoHtml;
            if (solicitud.origen === 'informacion') {
                estadoHtml = `<span class="estado-badge" style="background-color:#4f46e5;color:#fff;border:1px solid #818cf8;">
                                <i class="fas fa-info-circle"></i> Información
                              </span>`;
            } else if (solicitud.origen === 'reingreso') {
                estadoHtml = `<span class="estado-badge" style="background-color:#059669;color:#fff;border:1px solid #34d399;">
                                <i class="fas fa-retweet"></i> Reingreso
                              </span>`;
            } else {
                const estadoConfig = ESTADOS_SOLICITUDES[solicitud.estado] || ESTADOS_SOLICITUDES['pendiente'];
                estadoHtml = `<span class="estado-badge" style="background-color:${estadoConfig.color}20;color:${estadoConfig.color};border:1px solid ${estadoConfig.color}40;">
                                ${estadoConfig.icon} ${estadoConfig.label}
                              </span>`;
            }
            const prioridadConfig = PRIORIDADES_SOLICITUDES[solicitud.prioridad] || PRIORIDADES_SOLICITUDES['media'];

            // Botones (diferenciados)
            let botones = `
                <button class="btn-accion btn-ver" onclick="verDetalleSolicitud('${solicitud.id}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-accion btn-editar" onclick="editarSolicitud('${solicitud.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <div class="dropdown-acciones">
                    <button class="btn-accion btn-mas" onclick="toggleAccionesSolicitud('${solicitud.id}')" title="Más acciones">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu" id="acciones-${solicitud.id}">
                        <button onclick="cambiarEstadoSolicitud('${solicitud.id}', 'en_proceso')">
                            <i class="fas fa-clock"></i> Marcar en proceso
                        </button>
                        ${solicitud.origen !== 'informacion' ? `
                        <button onclick="agendarCitaSolicitud('${solicitud.id}')">
                            <i class="fas fa-calendar-plus"></i> Agendar cita
                        </button>
                        ` : ''}
                        ${solicitud.origen === 'informacion' ? `
                        <button onclick="abrirModalResponder('${solicitud.email}', '${solicitud.nombre || ''}')">
                            <i class="fas fa-envelope"></i> Responder
                        </button>
                        ` : ''}
                        <hr>
                        <button onclick="eliminarSolicitud('${solicitud.id}')" class="accion-peligro">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;

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
                        <div class="cesfam-badge">${solicitud.cesfam || ""}</div>
                    </td>
                    <td>${estadoHtml}</td>
                    <td>
                        <span class="prioridad-badge" style="background-color:${prioridadConfig.color}20;color:${prioridadConfig.color};border:1px solid ${prioridadConfig.color}40;">
                            ${prioridadConfig.icon} ${prioridadConfig.label}
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
                    <td><div class="acciones-solicitud">${botones}</div></td>
                </tr>
            `;
        }).join('');
        tableBody.innerHTML = rows;
    } catch (error) {
        console.error('❌ Error renderizando tabla:', error);
    }
}

// Modal responder (puedes ponerlo en tu HTML principal)
function abrirModalResponder(email, nombre) {
    const modal = document.getElementById('modal-responder');
    if (!modal) return;
    document.getElementById('modal-responder-email').value = email;
    document.getElementById('modal-responder-nombre').innerText = nombre;
    modal.style.display = 'block';
}
function cerrarModalResponder() {
    const modal = document.getElementById('modal-responder');
    if (modal) modal.style.display = 'none';
}
function enviarCorreoSenda() {
    const email = document.getElementById('modal-responder-email').value;
    const asunto = document.getElementById('modal-responder-asunto').value;
    const mensaje = document.getElementById('modal-responder-mensaje').value;
    // Aquí iría la lógica para enviar el correo usando el correo de Senda (API o backend propio)
    alert(`Correo enviado a ${email} desde la cuenta de Senda.\nAsunto: ${asunto}\nMensaje: ${mensaje}`);
    cerrarModalResponder();
}


console.log('📋 Gestor de solicitudes extendido listo.');
