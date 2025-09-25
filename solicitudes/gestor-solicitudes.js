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
    'CESFAM Santa Teresa de Los Andes',
    'CESFAM El Volcán',
    'CESFAM Recreo',
    'CESFAM Alejandro del Río',
    'CESFAM Hospital Sotero del Río'
];

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
                                  : 'No hay solicitudes de ingreso registradas'}
                            </p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        const rows = filteredSolicitudesData.map(solicitud => {
            const estadoConfig = solicitud.estadoConfig;
            const prioridadConfig = solicitud.prioridadConfig;
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
                        <span class="estado-badge" style="background-color: ${estadoConfig.color}20; color: ${estadoConfig.color}; border: 1px solid ${estadoConfig.color}40;">
                            ${estadoConfig.icon} ${estadoConfig.label}
                        </span>
                    </td>
                    <td>
                        <span class="prioridad-badge" style="background-color: ${prioridadConfig.color}20; color: ${prioridadConfig.color}; border: 1px solid ${prioridadConfig.color}40;">
                            ${prioridadConfig.icon} ${prioridadConfig.label}
                        </span>
                    </td>
                    <td>
                        <div class="fecha-info">
                            <div class="fecha-principal">
                                ${solicitud.fechaCreacion ? new Date(solicitud.fechaCreacion).toLocaleDateString('es-CL') : ""}
                            </div>
                            <div class="tiempo-transcurrido">
                                ${solicitud.tiempoTranscurrido || ""}
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
                                    <button onclick="exportarSolicitud('${solicitud.id}')">
                                        <i class="fas fa-download"></i> Exportar
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
        if (counter) {
            counter.textContent = filteredSolicitudesData.length;
        }
        if (totalCounter) {
            totalCounter.textContent = solicitudesData.length;
        }
        const tabButton = document.querySelector('[data-tab="solicitudes"]');
        if (tabButton) {
            const badge = tabButton.querySelector('.tab-badge');
            if (badge) {
                badge.textContent = filteredSolicitudesData.length;
            }
        }
    } catch (error) {
        console.error('❌ Error actualizando contador:', error);
    }
}

/**
 * Actualizar estadísticas de solicitudes
 */
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

/**
 * Calcular estadísticas de solicitudes
 */
function calculateSolicitudesStats() {
    const today = new Date();
    return {
        total: solicitudesData.length,
        pendientes: solicitudesData.filter(s => s.estado === 'pendiente').length,
        altaPrioridad: solicitudesData.filter(s => s.prioridad === 'alta').length,
        completadas: solicitudesData.filter(s => s.estado === 'completada').length,
        hoy: solicitudesData.filter(s => isSameDay(s.fechaCreacion, today)).length,
        enProceso: solicitudesData.filter(s => s.estado === 'en_proceso').length,
        agendadas: solicitudesData.filter(s => s.estado === 'agendada').length
    };
}

/**
 * Crear solicitudes de ejemplo
 */
function createSampleSolicitudes() {
    console.log('📝 Creando datos de ejemplo...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    solicitudesData = [
        {
            id: 'sample_001',
            nombre: 'Juan Carlos',
            apellidos: 'Pérez García',
            rut: '12.345.678-9',
            edad: 28,
            email: 'juan.perez@email.com',
            telefono: '9 1234 5678',
            direccion: 'Los Aromos 123, Puente Alto',
            cesfam: 'CESFAM Karol Wojtyla',
            descripcion: 'Solicito ayuda para tratamiento de adicción al alcohol. He intentado dejarlo varias veces pero no he podido solo.',
            prioridad: 'media',
            urgencia: 'media',
            motivacion: 7,
            sustancias: ['alcohol'],
            tiempoConsumo: '3_5_años',
            tratamientoPrevio: 'no',
            paraMi: 'si',
            estado: 'pendiente',
            tipoSolicitud: 'identificado',
            origen: 'web_publica',
            version: '2.0',
            fechaCreacion: today,
            fechaAgenda: null,
            tiempoTranscurrido: 'Hace menos de 1 hora',
            prioridadNumerica: 2,
            estadoConfig: ESTADOS_SOLICITUDES['pendiente'],
            prioridadConfig: PRIORIDADES_SOLICITUDES['media']
        },
        {
            id: 'sample_002',
            nombre: 'María Elena',
            apellidos: 'González López',
            rut: '98.765.432-1',
            edad: 35,
            email: 'maria.gonzalez@email.com',
            telefono: '9 8765 4321',
            direccion: 'Las Rosas 456, Puente Alto',
            cesfam: 'CESFAM Vista Hermosa',
            descripcion: 'Necesito ayuda urgente. Mi hijo está consumiendo drogas y la situación familiar se está volviendo insostenible.',
            prioridad: 'alta',
            urgencia: 'alta',
            motivacion: 9,
            sustancias: ['marihuana', 'cocaina'],
            tiempoConsumo: '1_3_años',
            tratamientoPrevio: 'si',
            paraMi: 'no',
            estado: 'pendiente',
            tipoSolicitud: 'identificado',
            origen: 'web_publica',
            version: '2.0',
            fechaCreacion: yesterday,
            fechaAgenda: null,
            tiempoTranscurrido: 'Hace 1 día',
            prioridadNumerica: 3,
            estadoConfig: ESTADOS_SOLICITUDES['pendiente'],
            prioridadConfig: PRIORIDADES_SOLICITUDES['alta']
        },
        {
            id: 'sample_003',
            nombre: 'Pedro',
            apellidos: 'Martínez Silva',
            rut: '15.678.432-5',
            edad: 42,
            email: 'pedro.martinez@email.com',
            telefono: '9 5432 1098',
            direccion: 'Los Pinos 789, Puente Alto',
            cesfam: 'CESFAM Padre Manuel Villaseca',
            descripcion: 'Llevo varios años luchando contra la adicción al alcohol y necesito apoyo profesional.',
            prioridad: 'media',
            urgencia: 'media',
            motivacion: 8,
            sustancias: ['alcohol'],
            tiempoConsumo: 'mas_5_años',
            tratamientoPrevio: 'si',
            paraMi: 'si',
            estado: 'en_proceso',
            tipoSolicitud: 'identificado',
            origen: 'web_publica',
            version: '2.0',
            fechaCreacion: lastWeek,
            fechaAgenda: null,
            tiempoTranscurrido: 'Hace 1 semana',
            prioridadNumerica: 2,
            estadoConfig: ESTADOS_SOLICITUDES['en_proceso'],
            prioridadConfig: PRIORIDADES_SOLICITUDES['media']
        }
    ];
    console.log(`✅ ${solicitudesData.length} solicitudes de ejemplo creadas`);
}

/**
 * Exportar solicitudes a Excel
 */
function exportSolicitudesToExcel() {
    try {
        console.log('📊 Exportando solicitudes a Excel...');
        const dataToExport = filteredSolicitudesData.map(solicitud => ({
            'Nombre Completo': `${solicitud.nombre} ${solicitud.apellidos}`,
            'RUT': solicitud.rut,
            'Edad': solicitud.edad,
            'Teléfono': solicitud.telefono,
            'Email': solicitud.email,
            'CESFAM': solicitud.cesfam,
            'Estado': solicitud.estadoConfig.label,
            'Prioridad': solicitud.prioridadConfig.label,
            'Sustancias': Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : 'No especificado',
            'Fecha Creación': solicitud.fechaCreacion.toLocaleDateString('es-CL'),
            'Descripción': solicitud.descripcion || 'Sin descripción',
            'Motivación (1-10)': solicitud.motivacion || 'No especificado',
            'Tiempo de Consumo': solicitud.tiempoConsumo || 'No especificado',
            'Tratamiento Previo': solicitud.tratamientoPrevio === 'si' ? 'Sí' : 'No'
        }));
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `solicitudes_senda_${timestamp}.xlsx`;
        const csvContent = convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename.replace('.xlsx', '.csv'));
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        showNotification(`Solicitudes exportadas: ${filename}`, 'success');
    } catch (error) {
        console.error('❌ Error exportando solicitudes:', error);
        showNotification('Error al exportar solicitudes', 'error');
    }
}

/**
 * Utilidades auxiliares
 */
function calculateTimeElapsed(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return 'Hace menos de 1 minuto';
    }
}
function getPriorityOrder(priority) {
    const order = { 'alta': 3, 'media': 2, 'baja': 1 };
    return order[priority] || 2;
}
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
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

/**
 * Funciones globales para acciones de solicitudes
 */
window.verDetalleSolicitud = function(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (solicitud) {
            console.log('Ver detalles de solicitud:', solicitud);
            showNotification('Función de detalles en desarrollo', 'info');
        }
    } catch (error) {
        console.error('Error viendo detalles:', error);
    }
};
window.editarSolicitud = function(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (solicitud) {
            console.log('Editar solicitud:', solicitud);
            showNotification('Función de edición en desarrollo', 'info');
        }
    } catch (error) {
        console.error('Error editando solicitud:', error);
    }
};
window.cambiarEstadoSolicitud = function(solicitudId, nuevoEstado) {
    try {
        console.log(`Cambiar estado de ${solicitudId} a ${nuevoEstado}`);
        showNotification('Función de cambio de estado en desarrollo', 'info');
    } catch (error) {
        console.error('Error cambiando estado:', error);
    }
};
window.agendarCitaSolicitud = function(solicitudId) {
    try {
        console.log('Agendar cita para solicitud:', solicitudId);
        showNotification('Función de agendamiento en desarrollo', 'info');
    } catch (error) {
        console.error('Error agendando cita:', error);
    }
};
window.exportarSolicitud = function(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (solicitud) {
            exportSolicitudesToExcel();
        }
    } catch (error) {
        console.error('Error exportando solicitud:', error);
    }
};
window.eliminarSolicitud = function(solicitudId) {
    try {
        if (confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
            console.log('Eliminar solicitud:', solicitudId);
            showNotification('Función de eliminación en desarrollo', 'warning');
        }
    } catch (error) {
        console.error('Error eliminando solicitud:', error);
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
