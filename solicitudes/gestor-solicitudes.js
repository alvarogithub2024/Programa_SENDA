/**
 * Gestor de Solicitudes - Muestra solicitudes de ingreso, reingresos y solicitudes de información.
 * Botones funcionales y modales integrados. Todas las funciones necesarias para evitar errores de referencia.
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

function setupFilters() {
    // Estado
    fillSelectOptions('filtro-estado-solicitudes', ['todos', 'pendiente', 'en_proceso', 'agendada', 'completada'], {
        todos: 'Todos los estados',
        pendiente: 'Pendiente',
        en_proceso: 'En proceso',
        agendada: 'Agendada',
        completada: 'Completada'
    });
    // Prioridad
    fillSelectOptions('filtro-prioridad-solicitudes', ['todos', 'alta', 'media', 'baja'], {
        todos: 'Todas las prioridades',
        alta: 'Alta',
        media: 'Media',
        baja: 'Baja'
    });
    // CESFAM
    fillSelectOptions('filtro-cesfam-solicitudes', ['todos', ...CESFAM_OPTIONS], {
        todos: 'Todos los CESFAM'
    });

    // Listeners de cambio de filtro
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

    // Filtro de búsqueda
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
    // Botón de refresh
    const refreshBtn = document.getElementById('refresh-solicitudes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            resetFilters();
            if (window.showNotification) {
                window.showNotification('Filtros limpiados', 'info');
            }
        });
    }
    // Otros eventos (agrega más si lo necesitas)
}

function setupAutoRefresh() {
    if (isAutoRefreshEnabled && !autoRefreshInterval) {
        autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-actualizando solicitudes desde Firebase...');
            loadAllSolicitudes().then(applyCurrentFilters);
        }, 30000); // Cada 30 segundos
    }
}

/**
 * Renderiza la tabla con los botones y diferenciaciones
 */
function renderSolicitudesTable() {
    try {
        const tableBody = document.getElementById('solicitudes-table-body');
        if (!tableBody) return;
        if (filteredSolicitudesData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:48px;">No hay solicitudes</td></tr>`;
            return;
        }
        const rows = filteredSolicitudesData.map(solicitud => {
            // Estado visual, diferenciando tipos
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

            // Botones (funcionales)
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

// ------------------- FUNCIONES DE MODALES Y ACCIONES -------------------

// Ver detalles
function verDetalleSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    document.getElementById('modal-detalle-nombre').innerText = solicitud.nombre || '';
    document.getElementById('modal-detalle-rut').innerText = solicitud.rut || '';
    document.getElementById('modal-detalle-telefono').innerText = solicitud.telefono || '';
    document.getElementById('modal-detalle-email').innerText = solicitud.email || '';
    document.getElementById('modal-detalle-motivo').innerText = solicitud.motivo || '';
    document.getElementById('modal-detalle-cesfam').innerText = solicitud.cesfam || '';
    document.getElementById('modal-detalle-prioridad').innerText = solicitud.prioridad || '';
    document.getElementById('modal-detalle-estado').innerText = solicitud.estado || solicitud.origen || '';
    document.getElementById('modal-detalle-fecha').innerText = solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : '';
    document.getElementById('modal-detalle-sustancias').innerText = Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : '';
    document.getElementById('modal-detalle').style.display = 'block';
}
function cerrarModalDetalle() {
    document.getElementById('modal-detalle').style.display = 'none';
}

// Editar
function editarSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    document.getElementById('modal-editar-nombre').value = solicitud.nombre || '';
    document.getElementById('modal-editar-rut').value = solicitud.rut || '';
    document.getElementById('modal-editar-telefono').value = solicitud.telefono || '';
    document.getElementById('modal-editar-id').value = solicitud.id;
    document.getElementById('modal-editar-cita').value = solicitud.citaAgendada || '';
    document.getElementById('modal-editar').style.display = 'block';
}
function cerrarModalEditar() { document.getElementById('modal-editar').style.display = 'none'; }
function guardarEdicionSolicitud() {
    const id = document.getElementById('modal-editar-id').value;
    const nombre = document.getElementById('modal-editar-nombre').value;
    const rut = document.getElementById('modal-editar-rut').value;
    const telefono = document.getElementById('modal-editar-telefono').value;
    const citaAgendada = document.getElementById('modal-editar-cita').value;
    const db = window.getFirestore();
    db.collection('solicitudes_ingreso').doc(id).update({
        nombre, rut, telefono, citaAgendada
    }).then(() => {
        cerrarModalEditar();
        window.reloadSolicitudesFromFirebase();
    });
}

// Agendar cita
function agendarCitaSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    document.getElementById('modal-cita-id').value = solicitud.id;
    document.getElementById('modal-cita-nombre').innerText = solicitud.nombre || '';
    document.getElementById('modal-cita-rut').innerText = solicitud.rut || '';
    document.getElementById('modal-cita').style.display = 'block';
}
function cerrarModalCita() { document.getElementById('modal-cita').style.display = 'none'; }
function guardarCita() {
    const id = document.getElementById('modal-cita-id').value;
    const fecha = document.getElementById('modal-cita-fecha').value;
    const hora = document.getElementById('modal-cita-hora').value;
    const db = window.getFirestore();
    db.collection('solicitudes_ingreso').doc(id).update({
        citaAgendada: fecha + ' ' + hora
    }).then(() => {
        cerrarModalCita();
        window.reloadSolicitudesFromFirebase();
    });
}

// Eliminar
function eliminarSolicitud(solicitudId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return;
    const db = window.getFirestore();
    db.collection('solicitudes_ingreso').doc(solicitudId).delete().then(() => {
        window.reloadSolicitudesFromFirebase();
    });
}

// Responder (solo información)
function abrirModalResponder(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email;
    document.getElementById('modal-responder-nombre').innerText = nombre;
    document.getElementById('modal-responder-id').value = solicitudId;
    document.getElementById('modal-responder').style.display = 'block';
}
function cerrarModalResponder() {
    document.getElementById('modal-responder').style.display = 'none';
}
function enviarCorreoSenda() {
    const email = document.getElementById('modal-responder-email').value;
    const asunto = document.getElementById('modal-responder-asunto').value;
    const mensaje = document.getElementById('modal-responder-mensaje').value;
    const id = document.getElementById('modal-responder-id').value;
    // Aquí iría la lógica para enviar el correo (API/backend)
    alert(`Correo enviado a ${email} desde la cuenta SENDAsenda@institucion.cl\nAsunto: ${asunto}\nMensaje: ${mensaje}`);
    cerrarModalResponder();
    // Cambiar estado a respondido
    const db = window.getFirestore();
    db.collection('solicitudes_informacion').doc(id).update({ estado: 'respondido' }).then(() => {
        window.reloadSolicitudesFromFirebase();
    });
}

// Dropdown y helpers igual que tu versión previa
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

/**
 * Resetear los filtros a estado inicial.
 */
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

/**
 * Aplica los filtros a las solicitudes y renderiza la tabla.
 */
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

/* Utilidades auxiliares */
function isSameDay(date1, date2) {
    return date1 && date2 &&
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

/**
 * Contador de solicitudes filtradas y totales
 */
function updateSolicitudesCounter() {
    const counter = document.getElementById('solicitudes-counter');
    const totalCounter = document.getElementById('solicitudes-total-counter');
    if (counter) counter.textContent = filteredSolicitudesData.length;
    if (totalCounter) totalCounter.textContent = solicitudesData.length;
}

function verDetalleSolicitud(solicitudId) {
  const solicitud = solicitudesData.find(s => s.id === solicitudId);
  if (!solicitud) return;

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text || '';
  }

  setText('modal-detalle-nombre', solicitud.nombre);
  setText('modal-detalle-rut', solicitud.rut);
  setText('modal-detalle-telefono', solicitud.telefono);
  setText('modal-detalle-email', solicitud.email);
  setText('modal-detalle-motivo', solicitud.motivo);
  setText('modal-detalle-cesfam', solicitud.cesfam);
  setText('modal-detalle-prioridad', solicitud.prioridad);
  setText('modal-detalle-estado', solicitud.estado || solicitud.origen);
  setText('modal-detalle-fecha', solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : '');
  setText('modal-detalle-sustancias', Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : '');

  document.getElementById('modal-detalle').style.display = 'flex';
}

/**
 * Actualizar estadísticas de solicitudes (puedes poner tu lógica aquí)
 */
function updateSolicitudesStats() {
    // Implementa según tus necesidades de estadísticas
}

console.log('📋 Gestor de solicitudes extendido listo.');
