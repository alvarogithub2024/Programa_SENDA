/**
 * BÚSQUEDA DE PACIENTES
 * Sistema de búsqueda avanzada de pacientes por diferentes criterios
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearRUT, validarRUT } from '../utilidades/formato.js';

let db;
let resultadosBusqueda = [];

/**
 * Inicializa el sistema de búsqueda
 */
function inicializarBusquedaPacientes() {
    try {
        db = obtenerFirestore();
        configurarFormularioBusqueda();
        console.log('✅ Sistema de búsqueda de pacientes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando búsqueda de pacientes:', error);
    }
}

/**
 * Configura el formulario de búsqueda
 */
function configurarFormularioBusqueda() {
    const searchInput = document.getElementById('search-pacientes-rut');
    const searchBtn = document.getElementById('buscar-paciente-btn');
    const advancedSearchBtn = document.getElementById('advanced-search-btn');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPacientePorRUT();
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            e.target.value = formatearRUT(e.target.value);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', buscarPacientePorRUT);
    }

    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', mostrarBusquedaAvanzada);
    }
}

/**
 * Búsqueda principal por RUT
 */
async function buscarPacientePorRUT() {
    try {
        const rutInput = document.getElementById('search-pacientes-rut');
        const resultsContainer = document.getElementById('pacientes-search-results');
        
        if (!rutInput || !resultsContainer) {
            console.error('Elementos de búsqueda no encontrados');
            return;
        }
        
        const rut = rutInput.value.trim();
        
        if (!rut) {
            mostrarNotificacion('Ingresa un RUT para buscar', 'warning');
            return;
        }
        
        if (!validarRUT(rut)) {
            mostrarNotificacion('RUT inválido', 'error');
            return;
        }
        
        mostrarCarga(true, 'Buscando paciente...');
        
        const userData = obtenerDatosUsuarioActual();
        if (!userData) {
            mostrarNotificacion('Error de autenticación', 'error');
            return;
        }
        
        const rutFormateado = formatearRUT(rut);
        
        const snapshot = await db.collection('pacientes')
            .where('rut', '==', rutFormateado)
            .where('cesfam', '==', userData.cesfam)
            .get();
        
        if (snapshot.empty) {
            resultsContainer.innerHTML = crearMensajeSinResultados(rutFormateado);
        } else {
            const pacientes = [];
            snapshot.forEach(doc => {
                pacientes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            resultadosBusqueda = pacientes;
            renderizarResultadosBusqueda(pacientes, resultsContainer);
        }
        
    } catch (error) {
        console.error('Error buscando paciente:', error);
        mostrarNotificacion('Error al buscar paciente: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Búsqueda avanzada con múltiples criterios
 */
async function busquedaAvanzada(criterios) {
    try {
        mostrarCarga(true, 'Realizando búsqueda avanzada...');
        
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return [];
        
        let query = db.collection('pacientes')
            .where('cesfam', '==', userData.cesfam);
        
        // Aplicar filtros según criterios
        if (criterios.rut && validarRUT(criterios.rut)) {
            query = query.where('rut', '==', formatearRUT(criterios.rut));
        }
        
        if (criterios.estado) {
            query = query.where('estado', '==', criterios.estado);
        }
        
        if (criterios.prioridad) {
            query = query.where('prioridad', '==', criterios.prioridad);
        }
        
        // Agregar ordenamiento
        query = query.orderBy('fechaCreacion', 'desc').limit(50);
        
        const snapshot = await query.get();
        
        let pacientes = [];
        snapshot.forEach(doc => {
            pacientes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Filtros adicionales que no se pueden hacer en Firestore
        pacientes = aplicarFiltrosAdicionales(pacientes, criterios);
        
        resultadosBusqueda = pacientes;
        return pacientes;
        
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        mostrarNotificacion('Error en búsqueda avanzada', 'error');
        return [];
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Aplica filtros adicionales que no se pueden hacer en Firestore
 */
function aplicarFiltrosAdicionales(pacientes, criterios) {
    let pacientesFiltrados = [...pacientes];
    
    // Filtro por nombre
    if (criterios.nombre) {
        const nombreBusqueda = criterios.nombre.toLowerCase();
        pacientesFiltrados = pacientesFiltrados.filter(p => {
            const nombreCompleto = `${p.nombre} ${p.apellidos || ''}`.toLowerCase();
            return nombreCompleto.includes(nombreBusqueda);
        });
    }
    
    // Filtro por edad
    if (criterios.edadMin || criterios.edadMax) {
        pacientesFiltrados = pacientesFiltrados.filter(p => {
            if (!p.edad) return false;
            
            let cumpleMin = true;
            let cumpleMax = true;
            
            if (criterios.edadMin) {
                cumpleMin = p.edad >= parseInt(criterios.edadMin);
            }
            
            if (criterios.edadMax) {
                cumpleMax = p.edad <= parseInt(criterios.edadMax);
            }
            
            return cumpleMin && cumpleMax;
        });
    }
    
    // Filtro por sustancias
    if (criterios.sustancias && criterios.sustancias.length > 0) {
        pacientesFiltrados = pacientesFiltrados.filter(p => {
            if (!p.sustanciasProblematicas || p.sustanciasProblematicas.length === 0) {
                return false;
            }
            
            return criterios.sustancias.some(sustancia => 
                p.sustanciasProblematicas.includes(sustancia)
            );
        });
    }
    
    // Filtro por fecha de registro
    if (criterios.fechaInicio || criterios.fechaFin) {
        pacientesFiltrados = pacientesFiltrados.filter(p => {
            if (!p.fechaCreacion) return false;
            
            const fechaPaciente = p.fechaCreacion.toDate();
            let cumpleFechaInicio = true;
            let cumpleFechaFin = true;
            
            if (criterios.fechaInicio) {
                const fechaInicio = new Date(criterios.fechaInicio);
                cumpleFechaInicio = fechaPaciente >= fechaInicio;
            }
            
            if (criterios.fechaFin) {
                const fechaFin = new Date(criterios.fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
                cumpleFechaFin = fechaPaciente <= fechaFin;
            }
            
            return cumpleFechaInicio && cumpleFechaFin;
        });
    }
    
    return pacientesFiltrados;
}

/**
 * Muestra el modal de búsqueda avanzada
 */
function mostrarBusquedaAvanzada() {
    const modalHTML = crearModalBusquedaAvanzada();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    import('../utilidades/modales.js')
        .then(modulo => {
            modulo.mostrarModal('advanced-search-modal');
            configurarFormularioAvanzado();
        });
}

/**
 * Crea el modal de búsqueda avanzada
 */
function crearModalBusquedaAvanzada() {
    return `
        <div class="modal-overlay temp-modal" id="advanced-search-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('advanced-search-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-search-plus"></i> Búsqueda Avanzada de Pacientes</h2>
                    
                    <form id="advanced-search-form">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label class="form-label">Nombre</label>
                                <input type="text" class="form-input" id="search-nombre" placeholder="Nombre o apellidos">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">RUT</label>
                                <input type="text" class="form-input" id="search-rut" placeholder="12.345.678-9">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label class="form-label">Estado</label>
                                <select class="form-select" id="search-estado">
                                    <option value="">Todos</option>
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                    <option value="alta">Alta</option>
                                    <option value="derivado">Derivado</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Prioridad</label>
                                <select class="form-select" id="search-prioridad">
                                    <option value="">Todas</option>
                                    <option value="critica">Crítica</option>
                                    <option value="alta">Alta</option>
                                    <option value="media">Media</option>
                                    <option value="baja">Baja</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Origen</label>
                                <select class="form-select" id="search-origen">
                                    <option value="">Todos</option>
                                    <option value="web_publica">Web Pública</option>
                                    <option value="derivacion">Derivación</option>
                                    <option value="cita_directa">Cita Directa</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label class="form-label">Edad Mínima</label>
                                <input type="number" class="form-input" id="search-edad-min" min="12" max="120">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Edad Máxima</label>
                                <input type="number" class="form-input" id="search-edad-max" min="12" max="120">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label class="form-label">Fecha Registro - Desde</label>
                                <input type="date" class="form-input" id="search-fecha-inicio">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fecha Registro - Hasta</label>
                                <input type="date" class="form-input" id="search-fecha-fin">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Sustancias Problemáticas</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
                                <label><input type="checkbox" value="Alcohol"> Alcohol</label>
                                <label><input type="checkbox" value="Marihuana"> Marihuana</label>
                                <label><input type="checkbox" value="Cocaína"> Cocaína</label>
                                <label><input type="checkbox" value="Pasta Base"> Pasta Base</label>
                                <label><input type="checkbox" value="Benzodiacepinas"> Benzodiacepinas</label>
                                <label><input type="checkbox" value="Otras"> Otras</label>
                            </div>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline" onclick="limpiarBusquedaAvanzada()">
                                <i class="fas fa-eraser"></i>
                                Limpiar
                            </button>
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('advanced-search-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-search"></i>
                                Buscar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

/**
 * Configura el formulario de búsqueda avanzada
 */
function configurarFormularioAvanzado() {
    const form = document.getElementById('advanced-search-form');
    const rutInput = document.getElementById('search-rut');
    
    if (rutInput) {
        rutInput.addEventListener('input', (e) => {
            e.target.value = formatearRUT(e.target.value);
        });
    }
    
    if (form) {
        form.addEventListener('submit', manejarBusquedaAvanzada);
    }
}

/**
 * Maneja el envío del formulario de búsqueda avanzada
 */
async function manejarBusquedaAvanzada(e) {
    e.preventDefault();
    
    try {
        const criterios = {
            nombre: document.getElementById('search-nombre')?.value?.trim(),
            rut: document.getElementById('search-rut')?.value?.trim(),
            estado: document.getElementById('search-estado')?.value,
            prioridad: document.getElementById('search-prioridad')?.value,
            origen: document.getElementById('search-origen')?.value,
            edadMin: document.getElementById('search-edad-min')?.value,
            edadMax: document.getElementById('search-edad-max')?.value,
            fechaInicio: document.getElementById('search-fecha-inicio')?.value,
            fechaFin: document.getElementById('search-fecha-fin')?.value,
            sustancias: Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
        };
        
        // Validar al menos un criterio
        const tieneCriterios = Object.values(criterios).some(valor => {
            if (Array.isArray(valor)) return valor.length > 0;
            return valor && valor.toString().trim() !== '';
        });
        
        if (!tieneCriterios) {
            mostrarNotificacion('Debe especificar al menos un criterio de búsqueda', 'warning');
            return;
        }
        
        const pacientes = await busquedaAvanzada(criterios);
        
        import('../utilidades/modales.js')
            .then(modulo => modulo.cerrarModal('advanced-search-modal'));
        
        const resultsContainer = document.getElementById('pacientes-search-results');
        if (resultsContainer) {
            if (pacientes.length === 0) {
                resultsContainer.innerHTML = crearMensajeSinResultadosAvanzada();
            } else {
                renderizarResultadosBusqueda(pacientes, resultsContainer);
                mostrarNotificacion(`Se encontraron ${pacientes.length} pacientes`, 'success');
            }
        }
        
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        mostrarNotificacion('Error realizando búsqueda', 'error');
    }
}

/**
 * Renderiza los resultados de búsqueda
 */
function renderizarResultadosBusqueda(pacientes, container) {
    container.innerHTML = `
        <h4>Resultados de búsqueda (${pacientes.length}):</h4>
        <div class="patients-grid">
            ${pacientes.map(paciente => crearTarjetaPacienteBasica(paciente)).join('')}
        </div>
    `;
}

/**
 * Crea una tarjeta básica de paciente
 */
function crearTarjetaPacienteBasica(paciente) {
    return `
        <div class="patient-card" onclick="mostrarFichaPaciente('${paciente.id}')">
            <div class="patient-header">
                <h3>${paciente.nombre} ${paciente.apellidos || ''}</h3>
                <p>RUT: ${paciente.rut}</p>
            </div>
            <div class="patient-details">
                <p>Edad: ${paciente.edad || 'No especificada'} años</p>
                <p>Estado: ${(paciente.estado || 'activo').toUpperCase()}</p>
                <p>Teléfono: ${paciente.telefono || 'No disponible'}</p>
            </div>
        </div>
    `;
}

/**
 * Crea mensaje cuando no hay resultados por RUT
 */
function crearMensajeSinResultados(rut) {
    return `
        <div class="no-results">
            <i class="fas fa-user-slash"></i>
            <h3>Paciente no encontrado</h3>
            <p>No se encontró ningún paciente con el RUT ${rut} en tu CESFAM</p>
        </div>
    `;
}

/**
 * Crea mensaje cuando no hay resultados en búsqueda avanzada
 */
function crearMensajeSinResultadosAvanzada() {
    return `
        <div class="no-results">
            <i class="fas fa-search"></i>
            <h3>Sin resultados</h3>
            <p>No se encontraron pacientes que coincidan con los criterios especificados</p>
            <button class="btn btn-primary btn-sm" onclick="mostrarBusquedaAvanzada()">
                <i class="fas fa-search-plus"></i>
                Modificar búsqueda
            </button>
        </div>
    `;
}

/**
 * Limpia el formulario de búsqueda avanzada
 */
function limpiarBusquedaAvanzada() {
    const form = document.getElementById('advanced-search-form');
    if (form) {
        form.reset();
        // Limpiar checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
}

// Funciones globales
window.buscarPacientePorRUT = buscarPacientePorRUT;
window.mostrarBusquedaAvanzada = mostrarBusquedaAvanzada;
window.limpiarBusquedaAvanzada = limpiarBusquedaAvanzada;

export {
    inicializarBusquedaPacientes,
    buscarPacientePorRUT,
    busquedaAvanzada,
    mostrarBusquedaAvanzada
};
