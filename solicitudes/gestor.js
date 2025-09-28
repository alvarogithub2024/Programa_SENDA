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
                    if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
                
                reingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'reingreso';
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

// ... (todo el código igual hasta renderSolicitudesTable)
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
                        ${solicitud.origen !== 'informacion' ? `
                        <button onclick="agendarCitaSolicitud('${solicitud.id}')">
                            <i class="fas fa-calendar-plus"></i> Agendar cita
                        </button>
                        ` : ''}
                        ${solicitud.origen === 'informacion' ? `
                        <button onclick="abrirModalResponder('${solicitud.email}', '${solicitud.nombre || ''}', '${solicitud.id}')">
                            <i class="fas fa-envelope"></i> Responder
                        </button>
                        ` : ''}
                        <hr>
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
// ... (resto del archivo igual)

function setupFilters() {
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
    
    fillSelectOptions('filtro-cesfam-solicitudes', ['todos', ...window.CESFAM_PUENTE_ALTO], {
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

function setupEvents() {
    const refreshBtn = document.getElementById('refresh-solicitudes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            resetFilters();
            if (window.showNotification) {
                window.showNotification('Filtros limpiados', 'info');
            }
        });
    }
}

function setupAutoRefresh() {
    if (isAutoRefreshEnabled && !autoRefreshInterval) {
        autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-actualizando solicitudes desde Firebase...');
            loadAllSolicitudes().then(applyCurrentFilters);
        }, 30000);
    }
}

function applyCurrentFilters() {
    filteredSolicitudesData = solicitudesData.filter(solicitud => {
        if (currentFilters.estado !== 'todos' && (solicitud.estado || '').toLowerCase() !== currentFilters.estado) {
            return false;
        }
        if (currentFilters.prioridad !== 'todos' && (solicitud.prioridad || '').toLowerCase() !== currentFilters.prioridad) {
            return false;
        }
        if (currentFilters.cesfam !== 'todos' && (solicitud.cesfam || '') !== currentFilters.cesfam) {
            return false;
        }
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

function updateSolicitudesCounter() {
    const counter = document.getElementById('solicitudes-counter');
    const totalCounter = document.getElementById('solicitudes-total-counter');
    if (counter) counter.textContent = filteredSolicitudesData.length;
    if (totalCounter) totalCounter.textContent = solicitudesData.length;
}

function updateSolicitudesStats() {
}

function isSameDay(date1, date2) {
    return date1 && date2 &&
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

function verDetalleSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    document.getElementById('modal-detalle-nombre').textContent = solicitud.nombre || '';
    document.getElementById('modal-detalle-rut').textContent = solicitud.rut || '';
    document.getElementById('modal-detalle-telefono').textContent = solicitud.telefono || '';
    document.getElementById('modal-detalle-email').textContent = solicitud.email || '';
    document.getElementById('modal-detalle-motivo').textContent = solicitud.descripcion || ''; // Motivo de atención (corregido)
    document.getElementById('modal-detalle-cesfam').textContent = solicitud.cesfam || '';
    document.getElementById('modal-detalle-estado').textContent = solicitud.estado || '';
    document.getElementById('modal-detalle-fecha').textContent = solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : '';
    document.getElementById('modal-detalle-sustancias').textContent = Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : '';
    
    document.getElementById('modal-detalle').style.display = 'flex';
}

function editarSolicitud(solicitudId, origen) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    document.getElementById('modal-editar-nombre').value = solicitud.nombre || '';
    document.getElementById('modal-editar-rut').value = solicitud.rut || '';
    document.getElementById('modal-editar-telefono').value = solicitud.telefono || '';
    document.getElementById('modal-editar-id').value = solicitud.id || '';
    document.getElementById('modal-editar').dataset.origen = origen || solicitud.origen || 'ingreso';
    document.getElementById('modal-editar').style.display = 'flex';
}


function agendarCitaSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    const nombreCompleto = (solicitud.nombre || "") + " " + (solicitud.apellidos || "");
    const cesfam = solicitud.cesfam || "";
    
    if (window.abrirModalAgendarCitaProfesional) {
        window.abrirModalAgendarCitaProfesional(solicitud.id, nombreCompleto, solicitud.rut, cesfam);
    } else if (window.abrirModalAgendarCita) {
        window.abrirModalAgendarCita(solicitud.id, nombreCompleto, solicitud.rut, cesfam);
    } else {
        window.showNotification && window.showNotification("No se puede abrir el modal de agendar cita.", "error");
    }
}

function eliminarSolicitud(solicitudId, origen) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return;
    const db = window.getFirestore();
    let coleccion = 'solicitudes_ingreso';
    if (origen === 'reingreso') coleccion = 'reingresos';
    if (origen === 'informacion') coleccion = 'solicitudes_informacion';

    db.collection(coleccion).doc(solicitudId).delete().then(() => {
        window.reloadSolicitudesFromFirebase && window.reloadSolicitudesFromFirebase();
        window.showNotification && window.showNotification('Solicitud eliminada correctamente', 'success');
    }).catch((error) => {
        window.showNotification && window.showNotification('Error eliminando la solicitud', 'error');
        console.error('Error eliminando solicitud:', error);
    });
}
window.eliminarSolicitud = eliminarSolicitud;

function abrirModalResponder(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email || '';
    document.getElementById('modal-responder-id').value = solicitudId || '';
    document.getElementById('modal-responder').style.display = 'flex';
}

function cerrarModalDetalle() {
    document.getElementById('modal-detalle').style.display = 'none';
}

function cerrarModalResponder() {
    document.getElementById('modal-responder').style.display = 'none';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
}

function toggleAccionesSolicitud(solicitudId) {
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
}

function exportarSolicitud(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (!solicitud) {
            window.showNotification && window.showNotification('Solicitud no encontrada', 'error');
            return;
        }
        
        const dataToExport = [{
            'Nombre Completo': `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`,
            'RUT': solicitud.rut || '',
            'Edad': solicitud.edad || '',
            'Teléfono': solicitud.telefono || '',
            'Email': solicitud.email || '',
            'CESFAM': solicitud.cesfam || '',
            'Estado': solicitud.estado || '',
            'Prioridad': solicitud.prioridad || '',
            'Sustancias': Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : 'No especificado',
            'Fecha Creación': solicitud.fechaCreacion ? new Date(solicitud.fechaCreacion).toLocaleDateString('es-CL') : '',
            'Descripción': solicitud.descripcion || 'Sin descripción',
            'Motivación (1-10)': solicitud.motivacion || '',
            'Tiempo de Consumo': solicitud.tiempoConsumo || '',
            'Tratamiento Previo': solicitud.tratamientoPrevio === 'si' ? 'Sí' : 'No'
        }];

        const csvContent = convertToCSV(dataToExport);
        const filename = `solicitud_${solicitudId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
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
        
        window.showNotification && window.showNotification(`Solicitud exportada: ${filename}`, 'success');
    } catch (error) {
        console.error('Error exportando solicitud:', error);
        window.showNotification && window.showNotification('Error al exportar solicitud', 'error');
    }
}

function convertToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';
    
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let j = 0; j < headers.length; j++) {
            if (j > 0) line += ',';
            line += `"${array[i][headers[j]]}"`;
        }
        str += line + '\r\n';
    }
    return str;
}

function guardarEdicionSolicitud() {
    const id = document.getElementById('modal-editar-id').value;
    const nombre = document.getElementById('modal-editar-nombre').value;
    const rut = document.getElementById('modal-editar-rut').value;
    const telefono = document.getElementById('modal-editar-telefono').value;
    const origen = document.getElementById('modal-editar').dataset.origen || 'ingreso';

    const db = window.getFirestore();
    let coleccion = 'solicitudes_ingreso';
    if (origen === 'reingreso') coleccion = 'reingresos';
    if (origen === 'informacion') coleccion = 'solicitudes_informacion';

    db.collection(coleccion).doc(id).update({
        nombre: nombre,
        rut: rut,
        telefono: telefono
    }).then(() => {
        db.collection('actualizacion_datos').add({
            solicitudId: id,
            nombre_nuevo: nombre,
            rut_nuevo: rut,
            telefono_nuevo: telefono,
            actualizadoPor: firebase.auth().currentUser?.email || "",
            fecha: new Date().toISOString()
        });
        window.showNotification && window.showNotification('Datos actualizados correctamente', 'success');
        cerrarModalEditar();
        window.reloadSolicitudesFromFirebase && window.reloadSolicitudesFromFirebase();
    }).catch((error) => {
        window.showNotification && window.showNotification('Error al actualizar datos', 'error');
        console.error('Error actualizando datos:', error);
    });
}


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

window.verDetalleSolicitud = verDetalleSolicitud;
window.editarSolicitud = editarSolicitud;
window.agendarCitaSolicitud = agendarCitaSolicitud;
window.eliminarSolicitud = eliminarSolicitud;
window.cerrarModalDetalle = cerrarModalDetalle;
window.abrirModalResponder = abrirModalResponder;
window.cerrarModalResponder = cerrarModalResponder;
window.guardarEdicionSolicitud = guardarEdicionSolicitud;
window.cerrarModalEditar = cerrarModalEditar;
window.exportarSolicitud = exportarSolicitud;

console.log('📋 Gestor de solicitudes listo.');
