/**
 * GESTOR DE PACIENTES
 * Maneja la carga, visualización y gestión de pacientes
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { APP_CONFIG, COLORES_PRIORIDAD } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha } from '../utilidades/formato.js';
import { establecerCache, obtenerCache } from '../utilidades/cache.js';

let db;
let pacientesData = [];
let filtroActual = '';

/**
 * Inicializa el gestor de pacientes
 */
function inicializarGestorPacientes() {
    try {
        db = obtenerFirestore();
        console.log('✅ Gestor de pacientes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando gestor de pacientes:', error);
        throw error;
    }
}

/**
 * Carga los pacientes desde Firestore
 */
async function cargarPacientes() {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;

    try {
        mostrarCarga(true, 'Cargando pacientes...');
        
        const cacheKey = `pacientes_${userData.cesfam}`;
        const datosCacheados = obtenerCache(cacheKey);
        
        if (datosCacheados) {
            pacientesData = datosCacheados;
            renderizarPacientes(pacientesData);
            return;
        }

        console.log('Cargando pacientes para CESFAM:', userData.cesfam);
        
        const pacientesSnapshot = await db.collection('pacientes')
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();
        
        console.log('Pacientes encontrados:', pacientesSnapshot.size);
        
        const pacientes = [];
        pacientesSnapshot.forEach(doc => {
            pacientes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        pacientesData = pacientes;
        establecerCache(cacheKey, pacientes);
        renderizarPacientes(pacientes);
        
        console.log(`Total pacientes cargados: ${pacientes.length}`);
        
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        mostrarNotificacion('Error al cargar pacientes: ' + error.message, 'error');
        renderizarErrorPacientes(error);
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Renderiza los pacientes en la interfaz
 */
function renderizarPacientes(pacientes) {
    try {
        const grid = document.getElementById('patients-grid');
        if (!grid) {
            console.error('Grid de pacientes no encontrado');
            return;
        }

        console.log('Renderizando pacientes:', pacientes.length);

        if (pacientes.length === 0) {
            grid.innerHTML = crearMensajeSinPacientes();
            return;
        }

        grid.innerHTML = pacientes.map(paciente => crearTarjetaPaciente(paciente)).join('');
        
        console.log(`Renderizados ${pacientes.length} pacientes`);
    } catch (error) {
        console.error('Error renderizando pacientes:', error);
    }
}

/**
 * Crea una tarjeta de paciente
 */
function crearTarjetaPaciente(paciente) {
    const fecha = formatearFecha(paciente.fechaCreacion);
    const estado = paciente.estado || 'activo';
    const prioridad = paciente.prioridad || 'media';
    
    return `
        <div class="patient-card" data-id="${paciente.id}">
            <div class="patient-header">
                <div class="patient-info">
                    <h3>${paciente.nombre} ${paciente.apellidos || ''}</h3>
                    <p>RUT: ${paciente.rut}</p>
                </div>
                <div class="patient-badges">
                    <span class="patient-status ${estado}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        ${estado.toUpperCase()}
                    </span>
                    <span class="priority-badge ${prioridad}" style="background-color: ${COLORES_PRIORIDAD[prioridad]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 4px;">
                        ${prioridad.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div class="patient-details">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: var(--gray-600);">
                    <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                    <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
                    <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                    <div><strong>Registrado:</strong> ${formatearFecha(paciente.fechaCreacion)}</div>
                </div>
                
                ${paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0 ? 
                    `<div class="patient-substances" style="margin-top: 12px;">
                        <strong>Sustancias:</strong>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
                            ${paciente.sustanciasProblematicas.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${s}</span>`).join('')}
                        </div>
                    </div>` : ''
                }
            </div>
            
            <div class="patient-actions" style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="btn btn-sm btn-primary" onclick="mostrarFichaPaciente('${paciente.id}')" title="Ver ficha completa">
                    <i class="fas fa-eye"></i>
                    Ver Ficha
                </button>
                <button class="btn btn-sm btn-success" onclick="agendarCitaPaciente('${paciente.id}')" title="Agendar nueva cita">
                    <i class="fas fa-calendar-plus"></i>
                    Agendar
                </button>
                <button class="btn btn-sm btn-outline" onclick="exportarFichaPDF('${paciente.id}')" title="Exportar ficha a PDF">
                    <i class="fas fa-file-pdf"></i>
                    PDF
                </button>
            </div>
        </div>
    `;
}

/**
 * Crea mensaje cuando no hay pacientes
 */
function crearMensajeSinPacientes() {
    return `
        <div class="no-results">
            <i class="fas fa-users"></i>
            <h3>No hay pacientes registrados</h3>
            <p>No se encontraron pacientes en este CESFAM</p>
            <button class="btn btn-primary" onclick="cargarPacientes()">
                <i class="fas fa-redo"></i>
                Actualizar
            </button>
        </div>
    `;
}

/**
 * Renderiza error al cargar pacientes
 */
function renderizarErrorPacientes(error) {
    const grid = document.getElementById('patients-grid');
    if (!grid) return;
    
    let mensajeError = 'Error al cargar pacientes';
    let detallesError = '';
    
    if (error.code === 'permission-denied') {
        mensajeError = 'Sin permisos de acceso';
        detallesError = 'No tienes permisos para ver los pacientes de este CESFAM';
    } else if (error.code === 'unavailable') {
        mensajeError = 'Servicio no disponible';
        detallesError = 'El servicio está temporalmente no disponible';
    } else {
        detallesError = error.message;
    }
    
    grid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-red);"></i>
            <h3>${mensajeError}</h3>
            <p>${detallesError}</p>
            <div class="mt-4">
                <button class="btn btn-primary" onclick="cargarPacientes()">
                    <i class="fas fa-redo"></i>
                    Reintentar
                </button>
            </div>
        </div>
    `;
}

/**
 * Muestra la ficha detallada de un paciente
 */
async function mostrarFichaPaciente(pacienteId) {
    try {
        mostrarCarga(true, 'Cargando ficha del paciente...');
        
        const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
        
        if (!pacienteDoc.exists) {
            mostrarNotificacion('Paciente no encontrado', 'error');
            return;
        }
        
        const paciente = {
            id: pacienteDoc.id,
            ...pacienteDoc.data()
        };
        
        import('../utilidades/modales.js')
            .then(modulo => {
                const modalHTML = crearModalFichaPaciente(paciente);
                const modalId = modulo.crearModalTemporal(modalHTML);
                modulo.mostrarModal(modalId);
                
                // Cargar atenciones del paciente
                setTimeout(() => {
                    cargarAtencionesPaciente(paciente.rut, `atenciones-list-${paciente.id}`);
                }, 500);
            });
        
    } catch (error) {
        console.error('Error cargando ficha del paciente:', error);
        mostrarNotificacion('Error al cargar ficha del paciente: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Crea el modal con la ficha del paciente
 */
function crearModalFichaPaciente(paciente) {
    const fechaCreacion = formatearFecha(paciente.fechaCreacion);
    const fechaPrimeraAtencion = paciente.fechaPrimeraAtencion ? 
        formatearFecha(paciente.fechaPrimeraAtencion) : 'No registrada';
    
    return `
        <div class="modal large-modal">
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="padding: 24px;">
                <h2><i class="fas fa-user-md"></i> Ficha del Paciente</h2>
                
                <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                        <div>
                            <h3 style="margin: 0; color: var(--primary-blue);">
                                ${paciente.nombre} ${paciente.apellidos || ''}
                            </h3>
                            <p style="margin: 4px 0; font-weight: 500;">RUT: ${paciente.rut}</p>
                        </div>
                        <span class="patient-status ${paciente.estado || 'activo'}" style="padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                            ${(paciente.estado || 'activo').toUpperCase()}
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Datos Personales</h4>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                                <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
                                <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                                <div><strong>Dirección:</strong> ${paciente.direccion || 'No disponible'}</div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Información Clínica</h4>
                            <div style="font-size: 14px; line-height: 1.6;">
                                <div><strong>CESFAM:</strong> ${paciente.cesfam}</div>
                                <div><strong>Prioridad:</strong> <span style="color: ${COLORES_PRIORIDAD[paciente.prioridad || 'media']}; font-weight: bold;">${(paciente.prioridad || 'media').toUpperCase()}</span></div>
                                <div><strong>Origen:</strong> ${paciente.origen || 'No especificado'}</div>
                                <div><strong>Motivación inicial:</strong> ${paciente.motivacionInicial || 'No registrada'}/10</div>
                            </div>
                        </div>
                    </div>
                    
                    ${paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0 ? 
                        `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                            <h4 style="color: var(--primary-blue); margin-bottom: 8px;">Sustancias Problemáticas</h4>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                ${paciente.sustanciasProblematicas.map(s => `<span class="substance-tag" style="background: var(--primary-blue); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${s}</span>`).join('')}
                            </div>
                        </div>` : ''
                    }
                    
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5); font-size: 12px; color: var(--gray-600);">
                        <div><strong>Fecha de registro:</strong> ${fechaCreacion}</div>
                        <div><strong>Primera atención:</strong> ${fechaPrimeraAtencion}</div>
                        ${paciente.citaInicialId ? `<div><strong>Cita inicial ID:</strong> ${paciente.citaInicialId}</div>` : ''}
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 16px; color: var(--primary-blue);">
                        <i class="fas fa-history"></i> Historial de Atenciones
                    </h4>
                    <div id="atenciones-list-${paciente.id}" class="atenciones-container">
                        <div class="loading-message">Cargando atenciones...</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                        Cerrar
                    </button>
                    <button class="btn btn-success" onclick="registrarNuevaAtencion('${paciente.rut}', '${paciente.nombre} ${paciente.apellidos || ''}')">
                        <i class="fas fa-plus"></i>
                        Nueva Atención
                    </button>
                    <button class="btn btn-primary" onclick="exportarFichaPDF('${paciente.id}')">
                        <i class="fas fa-file-pdf"></i>
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Carga las atenciones de un paciente
 */
async function cargarAtencionesPaciente(rut, containerId) {
    try {
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return;

        const atencionesSnapshot = await db.collection('atenciones')
            .where('pacienteRut', '==', rut)
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fecha', 'desc')
            .limit(20)
            .get();

        const container = document.getElementById(containerId);
        if (!container) return;

        if (atencionesSnapshot.empty) {
            container.innerHTML = `
                <div class="no-results" style="padding: 20px; text-align: center; color: var(--gray-600);">
                    <i class="fas fa-file-medical"></i>
                    <p>Sin atenciones registradas</p>
                </div>
            `;
            return;
        }

        const atenciones = [];
        atencionesSnapshot.forEach(doc => {
            atenciones.push({
                id: doc.id,
                ...doc.data()
            });
        });

        container.innerHTML = atenciones.map(atencion => {
            const fecha = atencion.fecha && atencion.fecha.toDate
                ? formatearFecha(atencion.fecha.toDate())
                : 'Fecha no disponible';
            
            return `
                <div class="atencion-item" style="margin-bottom: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <strong style="color: var(--primary-blue);">${atencion.profesional || 'Profesional no especificado'}</strong>
                            <div style="font-size: 12px; color: var(--gray-600);">${fecha}</div>
                        </div>
                        <span style="background: var(--success-green); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                            ATENCIÓN
                        </span>
                    </div>
                    <div style="line-height: 1.5; color: var(--gray-700);">
                        ${atencion.detalle || 'Sin detalles registrados'}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando atenciones:', error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--danger-red);">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar atenciones</p>
                </div>
            `;
        }
    }
}

/**
 * Exporta la ficha del paciente a PDF
 */
async function exportarFichaPDF(pacienteId) {
    try {
        mostrarCarga(true, 'Generando PDF...');
        
        const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
        
        if (!pacienteDoc.exists) {
            mostrarNotificacion('Paciente no encontrado', 'error');
            return;
        }
        
        const paciente = pacienteDoc.data();
        
        // Verificar si jsPDF está disponible
        if (typeof window.jsPDF === 'undefined') {
            mostrarNotificacion('Generando PDF... Esto puede tomar un momento.', 'info');
            
            // Cargar jsPDF dinámicamente
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                setTimeout(() => exportarFichaPDF(pacienteId), 500);
            };
            script.onerror = () => {
                mostrarNotificacion('Error cargando generador PDF. Intenta nuevamente.', 'error');
            };
            document.head.appendChild(script);
            return;
        }
        
        generarPDFPaciente(paciente);
        
    } catch (error) {
        console.error('Error exportando PDF:', error);
        mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Genera el PDF del paciente
 */
function generarPDFPaciente(paciente) {
    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF();
    
    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('FICHA PACIENTE - PROGRAMA SENDA', 20, 30);
    
    // Información del sistema
    const userData = obtenerDatosUsuarioActual();
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`CESFAM: ${paciente.cesfam}`, 20, 50);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CL')}`, 20, 60);
    doc.text(`Profesional: ${userData.nombre} ${userData.apellidos}`, 20, 70);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80);
    
    // Datos del paciente
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('DATOS DEL PACIENTE', 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let yPos = 110;
    
    doc.text(`Nombre: ${paciente.nombre} ${paciente.apellidos || ''}`, 20, yPos);
    yPos += 10;
    doc.text(`RUT: ${paciente.rut}`, 20, yPos);
    yPos += 10;
    doc.text(`Edad: ${paciente.edad || 'No especificada'} años`, 20, yPos);
    yPos += 10;
    doc.text(`Teléfono: ${paciente.telefono || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`Email: ${paciente.email || 'No disponible'}`, 20, yPos);
    yPos += 10;
    doc.text(`Dirección: ${paciente.direccion || 'No disponible'}`, 20, yPos);
    yPos += 15;
    
    // Información clínica
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('INFORMACIÓN CLÍNICA', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Estado: ${(paciente.estado || 'Activo').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Prioridad: ${(paciente.prioridad || 'Media').toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Motivación inicial: ${paciente.motivacionInicial || 'No registrada'}/10`, 20, yPos);
    yPos += 10;
    doc.text(`Origen: ${paciente.origen || 'No especificado'}`, 20, yPos);
    yPos += 10;
    
    if (paciente.sustanciasProblematicas && paciente.sustanciasProblematicas.length > 0) {
        doc.text(`Sustancias problemáticas: ${paciente.sustanciasProblematicas.join(', ')}`, 20, yPos);
        yPos += 10;
    }
    
    yPos += 10;
    doc.text(`Fecha de registro: ${formatearFecha(paciente.fechaCreacion)}`, 20, yPos);
    yPos += 10;
    
    if (paciente.fechaPrimeraAtencion) {
        doc.text(`Primera atención: ${formatearFecha(paciente.fechaPrimeraAtencion)}`, 20, yPos);
    }
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Documento generado por Sistema SENDA Puente Alto', 20, 280);
    doc.text('Información confidencial - Uso exclusivo profesional', 20, 290);
 
    const fileName = `ficha_${paciente.nombre.replace(/\s+/g, '_')}_${paciente.rut.replace(/[.-]/g, '')}.pdf`;
    doc.save(fileName);
    
    mostrarNotificacion('PDF generado y descargado correctamente', 'success');
}

/**
 * Filtra pacientes por término de búsqueda
 */
function filtrarPacientes(termino) {
    if (!termino) {
        renderizarPacientes(pacientesData);
        return;
    }
    
    const pacientesFiltrados = pacientesData.filter(paciente => {
        return paciente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
               (paciente.apellidos && paciente.apellidos.toLowerCase().includes(termino.toLowerCase())) ||
               paciente.rut.includes(termino);
    });
    
    renderizarPacientes(pacientesFiltrados);
}

// Funciones globales para los botones
window.mostrarFichaPaciente = mostrarFichaPaciente;
window.agendarCitaPaciente = function(pacienteId) {
    import('../calendario/citas.js')
        .then(modulo => modulo.crearCitaDesdePaciente(pacienteId))
        .catch(error => console.error('Error agendando cita:', error));
};

window.exportarFichaPDF = exportarFichaPDF;

window.registrarNuevaAtencion = function(rut, nombrePaciente) {
    import('../seguimiento/atenciones.js')
        .then(modulo => modulo.mostrarModalAtencion(rut, nombrePaciente))
        .catch(error => console.error('Error registrando atención:', error));
};

export {
    inicializarGestorPacientes,
    cargarPacientes,
    mostrarFichaPaciente,
    filtrarPacientes,
    exportarFichaPDF
};
