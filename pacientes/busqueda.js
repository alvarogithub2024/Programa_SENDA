/**
 * BÚSQUEDA DE PACIENTES
 * Gestiona la búsqueda de pacientes por RUT y otros criterios
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatRUT, limpiarTexto } from '../utilidades/formato.js';
import { validarRUT } from '../utilidades/validaciones.js';

let db;

/**
 * Inicializa el sistema de búsqueda de pacientes
 */
function inicializarBusquedaPacientes() {
    try {
        db = obtenerFirestore();
        configurarFormularioBusqueda();
        console.log('✅ Sistema de búsqueda de pacientes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando búsqueda de pacientes:', error);
        throw error;
    }
}

/**
 * Configura el formulario de búsqueda
 */
function configurarFormularioBusqueda() {
    const searchInput = document.getElementById('search-pacientes-rut');
    const buscarBtn = document.getElementById('buscar-paciente-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', manejarEnterBusqueda);
        searchInput.addEventListener('input', formatearRUTInput);
        console.log('✅ Input de búsqueda configurado');
    }
    
    if (buscarBtn) {
        buscarBtn.addEventListener('click', ejecutarBusquedaPorRUT);
        console.log('✅ Botón de búsqueda configurado');
    }
}

/**
 * Maneja el evento Enter en el input de búsqueda
 */
function manejarEnterBusqueda(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        ejecutarBusquedaPorRUT();
    }
}

/**
 * Formatea el RUT mientras se escribe
 */
function formatearRUTInput(e) {
    e.target.value = formatRUT(e.target.value);
}

/**
 * Ejecuta la búsqueda de paciente por RUT
 */
async function ejecutarBusquedaPorRUT() {
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (!rutInput || !resultsContainer) {
        mostrarNotificacion('Error: Elementos de búsqueda no encontrados', 'error');
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
    
    try {
        mostrarCarga(true, 'Buscando paciente...');
        
        const pacientes = await buscarPacientePorRUT(rut);
        renderizarResultadosBusqueda(pacientes, resultsContainer, rut);
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarNotificacion('Error al buscar paciente: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Busca paciente por RUT
 */
async function buscarPacientePorRUT(rut) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) {
        throw new Error('Usuario no autenticado');
    }
    
    const rutFormateado = formatRUT(rut);
    
    const snapshot = await db.collection('pacientes')
        .where('rut', '==', rutFormateado)
        .where('cesfam', '==', userData.cesfam)
        .get();
    
    const pacientes = [];
    snapshot.forEach(doc => {
        pacientes.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    return pacientes;
}

/**
 * Busca pacientes por nombre (búsqueda parcial)
 */
async function buscarPacientesPorNombre(nombre, limite = 20) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) {
        throw new Error('Usuario no autenticado');
    }
    
    const nombreLimpio = limpiarTexto(nombre);
    
    let consulta = db.collection('pacientes')
        .where('cesfam', '==', userData.cesfam);
    
    if (nombreLimpio) {
        consulta = consulta
            .where('nombre', '>=', nombreLimpio)
            .where('nombre', '<=', nombreLimpio + '\uf8ff')
            .limit(limite);
    }
    
    const snapshot = await consulta.get();
    
    const pacientes = [];
    snapshot.forEach(doc => {
        pacientes.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    return pacientes;
}

/**
 * Renderiza los resultados de búsqueda
 */
function renderizarResultadosBusqueda(pacientes, container, rutBuscado) {
    if (pacientes.length === 0) {
        container.innerHTML = crearMensajeNoEncontrado(rutBuscado);
        return;
    }
    
    container.innerHTML = `
        <h4 style="margin: 16px 0; color: var(--primary-blue);">
            <i class="fas fa-search"></i> 
            Resultados de búsqueda (${pacientes.length})
        </h4>
        <div class="patients-grid">
            ${pacientes.map(crearTarjetaPaciente).join('')}
        </div>
    `;
}

/**
 * Crea el mensaje cuando no se encuentra el paciente
 */
function crearMensajeNoEncontrado(rut) {
    return `
        <div class="no-results" style="text-align: center; padding: 40px 20px; color: var(--gray-600);">
            <i class="fas fa-user-slash" style="font-size: 48px; color: var(--gray-400); margin-bottom: 16px;"></i>
            <h3 style="color: var(--text-dark); margin-bottom: 8px;">Paciente no encontrado</h3>
            <p>No se encontró ningún paciente con el RUT <strong>${rut}</strong> en tu CESFAM</p>
            <small style="color: var(--gray-500);">
                Verifica que el RUT esté correcto o que el paciente esté registrado en tu centro
            </small>
        </div>
    `;
}

/**
 * Crea una tarjeta de paciente para los resultados
 */
function crearTarjetaPaciente(paciente) {
    const fechaCreacion = paciente.fechaCreacion ? 
        paciente.fechaCreacion.toDate().toLocaleDateString('es-CL') : 
        'No disponible';
    
    const estado = paciente.estado || 'activo';
    
    return `
        <div class="patient-card" style="border: 1px solid var(--gray-300); border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div class="patient-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div class="patient-info">
                    <h3 style="margin: 0; color: var(--primary-blue); font-size: 18px;">
                        ${paciente.nombre} ${paciente.apellidos || ''}
                    </h3>
                    <p style="margin: 4px 0; color: var(--gray-600); font-weight: 500;">
                        RUT: ${paciente.rut}
                    </p>
                </div>
                <span class="patient-status ${estado}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: var(--success-green); color: white;">
                    ${estado.toUpperCase()}
                </span>
            </div>
            
            <div class="patient-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; color: var(--gray-600); margin-bottom: 16px;">
                <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                <div><strong>Teléfono:</strong> ${paciente.telefono || 'No disponible'}</div>
                <div><strong>Email:</strong> ${paciente.email || 'No disponible'}</div>
                <div><strong>Registrado:</strong> ${fechaCreacion}</div>
            </div>
            
            <div class="patient-actions" style="text-align: right;">
                <button class="btn btn-sm btn-primary" onclick="mostrarDetallePaciente('${paciente.id}')" 
                        style="padding: 6px 12px; background: var(--primary-blue); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-eye"></i>
                    Ver Ficha
                </button>
            </div>
        </div>
    `;
}

/**
 * Limpia los resultados de búsqueda
 */
function limpiarResultadosBusqueda() {
    const resultsContainer = document.getElementById('pacientes-search-results');
    const rutInput = document.getElementById('search-pacientes-rut');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    if (rutInput) {
        rutInput.value = '';
    }
}

/**
 * Obtiene estadísticas de búsqueda
 */
function obtenerEstadisticasBusqueda(pacientes) {
    return {
        total: pacientes.length,
        porEstado: pacientes.reduce((acc, p) => {
            const estado = p.estado || 'activo';
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
        }, {}),
        conTelefono: pacientes.filter(p => p.telefono).length,
        conEmail: pacientes.filter(p => p.email).length
    };
}

export {
    inicializarBusquedaPacientes,
    buscarPacientePorRUT,
    buscarPacientesPorNombre,
    limpiarResultadosBusqueda,
    obtenerEstadisticasBusqueda
};
