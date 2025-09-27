/**
 * SOLICITUDES/GESTOR.JS - Gestor de Solicitudes con Exportación PDF
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

/**
 * Inicializar gestor de solicitudes
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
            agregarBotonExportarTodas(); // Agregar botón PDF
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
 * Carga todas las solicitudes desde las 3 colecciones
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
                
                // Procesar solicitudes de ingreso
                ingresoSnap.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    data.origen = 'ingreso';
                    if (data.fecha && !(data.fecha instanceof Date)) {
                        data.fecha = new Date(data.fecha);
                    }
                    solicitudesData.push(data);
                });
                
                // Procesar reingresos
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
                
                // Procesar solicitudes de información
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

/**
 * Renderiza la tabla de solicitudes
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

            // Botones de acción
            let botones = `
                <button class="btn-accion btn-ver" onclick="verDetalleSolicitud('${solicitud.id}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-accion btn-editar" onclick="editarSolicitud('${solicitud.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-accion btn-exportar" onclick="exportarSolicitud('${solicitud.id}')" title="Exportar PDF">
                    <i class="fas fa-file-pdf"></i>
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
                        <button onclick="verRespuestasSolicitud('${solicitud.id}')">
                            <i class="fas fa-history"></i> Ver Respuestas
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

// === FUNCIONES DE EXPORTACIÓN PDF ===

function exportarSolicitud(solicitudId) {
    try {
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (!solicitud) {
            window.showNotification && window.showNotification('Solicitud no encontrada', 'error');
            return;
        }
        
        // Generar PDF individual
        generarPDFSolicitud(solicitud);
        
    } catch (error) {
        console.error('Error exportando solicitud:', error);
        window.showNotification && window.showNotification('Error al exportar solicitud', 'error');
    }
}

function generarPDFSolicitud(solicitud) {
    // Verificar si jsPDF está disponible
    if (typeof window.jsPDF === 'undefined') {
        window.showNotification && window.showNotification('Error: Librería PDF no disponible. Recarga la página.', 'error');
        return;
    }

    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    // Configuración de colores SENDA
    const azulSenda = [37, 99, 235]; // #2563eb
    const grisTexto = [75, 85, 99];  // #4b5563
    
    let yPosition = 20;
    
    // === HEADER DEL DOCUMENTO ===
    doc.setFillColor(...azulSenda);
    doc.rect(0, 0, 210, 25, 'F');
    
    // Logo y título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('PROGRAMA SENDA PUENTE ALTO', 20, 15);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Ficha de Solicitud de Ingreso', 20, 21);
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 150, 21);
    
    yPosition = 35;
    
    // === INFORMACIÓN DEL PACIENTE ===
    doc.setTextColor(...grisTexto);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL PACIENTE', 20, yPosition);
    
    yPosition += 10;
    
    // Datos personales
    const datosPersonales = [
        ['Nombre Completo:', `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`],
        ['RUT:', solicitud.rut || 'No especificado'],
        ['Edad:', `${solicitud.edad || 'No especificada'} años`],
        ['Teléfono:', solicitud.telefono || 'No especificado'],
        ['Email:', solicitud.email || 'No especificado'],
        ['Dirección:', solicitud.direccion || 'No especificada'],
        ['CESFAM:', solicitud.cesfam || 'No especificado']
    ];
    
    doc.setFontSize(11);
    datosPersonales.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPosition);
        yPosition += 7;
    });
    
    yPosition += 5;
    
    // === INFORMACIÓN CLÍNICA ===
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN CLÍNICA', 20, yPosition);
    
    yPosition += 10;
    
    // Sustancias
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Sustancias problemáticas:', 20, yPosition);
    yPosition += 5;
    
    doc.setFont(undefined, 'normal');
    const sustancias = Array.isArray(solicitud.sustancias) && solicitud.sustancias.length 
        ? solicitud.sustancias.join(', ') 
        : 'No especificado';
    
    // Dividir texto largo en múltiples líneas
    const sustanciasLines = doc.splitTextToSize(sustancias, 170);
    doc.text(sustanciasLines, 20, yPosition);
    yPosition += (sustanciasLines.length * 5) + 5;
    
    // Otros datos clínicos
    const datosClinicOS = [
        ['Tiempo de consumo:', solicitud.tiempoConsumo || 'No especificado'],
        ['Nivel de urgencia:', solicitud.urgencia || 'No especificado'],
        ['Tratamiento previo:', solicitud.tratamientoPrevio === 'si' ? 'Sí' : solicitud.tratamientoPrevio === 'no' ? 'No' : 'No especificado'],
        ['Motivación (1-10):', solicitud.motivacion || 'No especificado']
    ];
    
    datosClinicOS.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPosition);
        yPosition += 7;
    });
    
    yPosition += 5;
    
    // === DESCRIPCIÓN ADICIONAL ===
    if (solicitud.descripcion) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DESCRIPCIÓN ADICIONAL', 20, yPosition);
        
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const descripcionLines = doc.splitTextToSize(solicitud.descripcion, 170);
        doc.text(descripcionLines, 20, yPosition);
        yPosition += (descripcionLines.length * 5) + 10;
    }
    
    // === INFORMACIÓN ADMINISTRATIVA ===
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN ADMINISTRATIVA', 20, yPosition);
    
    yPosition += 10;
    
    const datosAdmin = [
        ['Estado:', solicitud.estado || 'Pendiente'],
        ['Prioridad:', solicitud.prioridad || 'No asignada'],
        ['Fecha de solicitud:', solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : 'No especificada'],
        ['Origen:', solicitud.origen || 'Web'],
        ['ID de solicitud:', solicitud.id || 'No disponible']
    ];
    
    doc.setFontSize(11);
    datosAdmin.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(value, 70, yPosition);
        yPosition += 7;
    });
    
    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Este documento es confidencial y está protegido por la Ley de Protección de Datos Personales.', 20, 280);
    doc.text('SENDA Puente Alto - Sistema de Gestión de Solicitudes', 20, 285);
    
    // Generar nombre del archivo
    const nombrePaciente = (solicitud.nombre || 'paciente').replace(/\s+/g, '_');
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `solicitud_${nombrePaciente}_${fecha}.pdf`;
    
    // Descargar PDF
    doc.save(filename);
    
    window.showNotification && window.showNotification(`PDF generado: ${filename}`, 'success');
}

function exportarTodasLasSolicitudes() {
    if (!filteredSolicitudesData.length) {
        window.showNotification && window.showNotification('No hay solicitudes para exportar', 'warning');
        return;
    }
    
    if (typeof window.jsPDF === 'undefined') {
        window.showNotification && window.showNotification('Error: Librería PDF no disponible. Recarga la página.', 'error');
        return;
    }

    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    const azulSenda = [37, 99, 235];
    const grisTexto = [75, 85, 99];
    
    // === PORTADA ===
    doc.setFillColor(...azulSenda);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('PROGRAMA SENDA', 105, 120, { align: 'center' });
    doc.text('PUENTE ALTO', 105, 135, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text('Reporte de Solicitudes de Ingreso', 105, 155, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${filteredSolicitudesData.length} solicitudes`, 105, 170, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 105, 180, { align: 'center' });
    
    // === RESUMEN ESTADÍSTICO ===
    doc.addPage();
    let yPos = 20;
    
    doc.setTextColor(...grisTexto);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN ESTADÍSTICO', 20, yPos);
    
    yPos += 15;
    
    // Calcular estadísticas
    const stats = calcularEstadisticas(filteredSolicitudesData);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    Object.entries(stats).forEach(([key, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${key}:`, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value.toString(), 80, yPos);
        yPos += 8;
    });
    
    // === LISTADO DE SOLICITUDES ===
    filteredSolicitudesData.forEach((solicitud, index) => {
        doc.addPage();
        
        // Header de página
        doc.setFillColor(...azulSenda);
        doc.rect(0, 0, 210, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`SOLICITUD ${index + 1} DE ${filteredSolicitudesData.length}`, 20, 12);
        
        // Contenido de la solicitud
        generarContenidoSolicitudEnPDF(doc, solicitud, 25);
    });
    
    // Descargar
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `reporte_solicitudes_senda_${fecha}.pdf`;
    doc.save(filename);
    
    window.showNotification && window.showNotification(`Reporte PDF generado: ${filename}`, 'success');
}

function calcularEstadisticas(solicitudes) {
    const total = solicitudes.length;
    const porEstado = {};
    const porPrioridad = {};
    const porCesfam = {};
    
    solicitudes.forEach(s => {
        // Por estado
        const estado = s.estado || 'sin_estado';
        porEstado[estado] = (porEstado[estado] || 0) + 1;
        
        // Por prioridad
        const prioridad = s.prioridad || 'sin_prioridad';
        porPrioridad[prioridad] = (porPrioridad[prioridad] || 0) + 1;
        
        // Por CESFAM
        const cesfam = s.cesfam || 'sin_cesfam';
        porCesfam[cesfam] = (porCesfam[cesfam] || 0) + 1;
    });
    
    return {
        'Total de solicitudes': total,
        'Pendientes': porEstado.pendiente || 0,
        'En proceso': porEstado.en_proceso || 0,
        'Agendadas': porEstado.agendada || 0,
        'Completadas': porEstado.completada || 0,
        'Prioridad alta': porPrioridad.alta || 0,
        'Prioridad media': porPrioridad.media || 0,
        'Prioridad baja': porPrioridad.baja || 0
    };
}

function generarContenidoSolicitudEnPDF(doc, solicitud, startY) {
    const grisTexto = [75, 85, 99];
    let yPosition = startY;
    
    doc.setTextColor(...grisTexto);
    
    // Datos básicos
    const datos = [
        ['Nombre:', `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`],
        ['RUT:', solicitud.rut || 'No especificado'],
        ['CESFAM:', solicitud.cesfam || 'No especificado'],
        ['Estado:', solicitud.estado || 'Pendiente'],
        ['Prioridad:', solicitud.prioridad || 'No asignada'],
        ['Sustancias:', Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : 'No especificado']
    ];
    
    doc.setFontSize(10);
    datos.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, 20, yPosition);
        doc.setFont(undefined, 'normal');
        const valueLines = doc.splitTextToSize(value, 120);
        doc.text(valueLines, 60, yPosition);
        yPosition += Math.max(5, valueLines.length * 4);
    });
}

function agregarBotonExportarTodas() {
    const sectionActions = document.querySelector('#solicitudes-tab .section-actions');
    if (sectionActions) {
        // Verificar si ya existe el botón
        if (!document.getElementById('export-all-solicitudes')) {
            const exportButton = document.createElement('button');
            exportButton.id = 'export-all-solicitudes';
            exportButton.className = 'btn btn-secondary btn-sm';
            exportButton.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar PDF';
            exportButton.onclick = exportarTodasLasSolicitudes;
            sectionActions.appendChild(exportButton);
        }
    }
}

// === FIN DE FUNCIONES PDF ===

// Funciones de filtros y configuración
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

    // Event listeners para filtros
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
    // Implementa según tus necesidades de estadísticas
}

// Utilidades auxiliares
function isSameDay(date1, date2) {
    return date1 && date2 &&
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// Funciones de acciones sobre solicitudes
function verDetalleSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    document.getElementById('modal-detalle-nombre').textContent = solicitud.nombre || '';
    document.getElementById('modal-detalle-rut').textContent = solicitud.rut || '';
    document.getElementById('modal-detalle-cesfam').textContent = solicitud.cesfam || '';
    document.getElementById('modal-detalle-estado').textContent = solicitud.estado || '';
    document.getElementById('modal-detalle-prioridad').textContent = solicitud.prioridad || '';
    document.getElementById('modal-detalle-telefono').textContent = solicitud.telefono || '';
    document.getElementById('modal-detalle-email').textContent = solicitud.email || '';
    
    document.getElementById('modal-detalle').style.display = 'flex';
}

function editarSolicitud(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    document.getElementById('modal-editar-nombre').value = solicitud.nombre || '';
    document.getElementById('modal-editar-rut').value = solicitud.rut || '';
    document.getElementById('modal-editar-telefono').value = solicitud.telefono || '';
    document.getElementById('modal-editar-id').value = solicitud.id || '';
    
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

function eliminarSolicitud(solicitudId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return;
    
    const db = window.getFirestore();
    db.collection('solicitudes_ingreso').doc(solicitudId).delete().then(() => {
        window.reloadSolicitudesFromFirebase && window.reloadSolicitudesFromFirebase();
        window.showNotification && window.showNotification('Solicitud eliminada correctamente', 'success');
    }).catch((error) => {
        window.showNotification && window.showNotification('Error eliminando la solicitud', 'error');
        console.error('Error eliminando solicitud:', error);
    });
}

function abrirModalResponder(email, nombre, solicitudId) {
    document.getElementById('modal-responder-email').value = email || '';
    document.getElementById('modal-responder-nombre').textContent = nombre || '';
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

function guardarEdicionSolicitud() {
    const id = document.getElementById('modal-editar-id').value;
    const nombre = document.getElementById('modal-editar-nombre').value;
    const rut = document.getElementById('modal-editar-rut').value;
    const telefono = document.getElementById('modal-editar-telefono').value;

    const db = window.getFirestore();
    db.collection('solicitudes_ingreso').doc(id).update({
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

// Event listeners globales
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-acciones')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Funciones de recarga
window.reloadSolicitudesFromFirebase = function() {
    loadAllSolicitudes().then(applyCurrentFilters);
};

// Exportar funciones globalmente
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
window.generarPDFSolicitud = generarPDFSolicitud;
window.exportarTodasLasSolicitudes = exportarTodasLasSolicitudes;
window.calcularEstadisticas = calcularEstadisticas;

console.log('📋 Gestor de solicitudes con PDF listo.');
