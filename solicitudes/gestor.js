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
                    // FECHA REAL DEL REGISTRO
                    data.fechaMostrar = data.fechaCreacion || data.fecha || "";
                    solicitudesData.push(data);
                });
                
                reingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'reingreso';
                    data.fechaMostrar = data.fechaCreacion || data.fecha || "";
                    solicitudesData.push(data);
                });
                
                infoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'informacion';
                    data.tipo = 'informacion';
                    data.fechaMostrar = data.fechaCreacion || data.fecha || "";
                    solicitudesData.push(data);
                });
                
                solicitudesData.sort((a, b) => (b.fechaMostrar ? new Date(b.fechaMostrar).getTime() : 0) - (a.fechaMostrar ? new Date(a.fechaMostrar).getTime() : 0));
                resolve();
            }).catch(error => {
                console.error('Error cargando solicitudes Firebase:', error);
                if (window.showNotification) {
                    window.showNotification('Error cargando solicitudes', 'error');
                }
                resolve();
            });
        } catch (error) {
            console.error('Error accediendo a Firestore:', error);
            resolve();
        }
    });
}

function renderSolicitudesTable() {
    try {
        const tableBody = document.getElementById('solicitudes-table-body');
        if (!tableBody) return;
        
        if (filteredSolicitudesData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:48px;">No hay solicitudes</td></tr>`;
            return;
        }
        const isAsistenteSocial = window.rolActual && window.rolActual() === "asistente_social";
        
        const rows = filteredSolicitudesData.map(solicitud => {
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

            let botones = '';
            if (isAsistenteSocial) {
                botones = `
                <button class="btn-accion btn-ver" onclick="verDetalleSolicitud('${solicitud.id}', '${solicitud.origen}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-accion btn-editar" onclick="editarSolicitud('${solicitud.id}', '${solicitud.origen}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-accion btn-exportar" onclick="exportarSolicitud('${solicitud.id}')" title="Exportar">
                    <i class="fas fa-download"></i>
                </button>
                <div class="dropdown-acciones">
                    <button class="btn-accion btn-mas" onclick="toggleAccionesSolicitud('${solicitud.id}')" title="Más acciones">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu" id="acciones-${solicitud.id}">
                        <button onclick="eliminarSolicitud('${solicitud.id}', '${solicitud.origen}')" class="accion-peligro">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
                `;
            } else {
                botones = `
                <button class="btn-accion btn-ver" onclick="verDetalleSolicitud('${solicitud.id}', '${solicitud.origen}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                `;
            }

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
                                ${solicitud.fechaMostrar ? new Date(solicitud.fechaMostrar).toLocaleDateString('es-CL') : ""}
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

// ... El resto de tu archivo sigue igual ...
