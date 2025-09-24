/**
 * FILTROS DE SOLICITUDES
 * Maneja el filtrado y ordenamiento de solicitudes
 */

import { mostrarNotificacion } from '../utilidades/notificaciones.js';

let solicitudesOriginales = [];
let filtrosActivos = {
    estado: 'todas',
    prioridad: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
    cesfam: ''
};

/**
 * Inicializa el sistema de filtros
 */
function inicializarFiltros(solicitudes) {
    try {
        solicitudesOriginales = [...solicitudes];
        configurarEventosFiltros();
        console.log('✅ Sistema de filtros inicializado');
    } catch (error) {
        console.error('❌ Error inicializando filtros:', error);
    }
}

/**
 * Configura los event listeners de los filtros
 */
function configurarEventosFiltros() {
    // Filtro por estado
    const estadoFilter = document.getElementById('status-filter');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', (e) => {
            aplicarFiltroEstado(e.target.value);
        });
    }

    // Filtro por prioridad
    const prioridadFilter = document.getElementById('priority-filter');
    if (prioridadFilter) {
        prioridadFilter.addEventListener('change', (e) => {
            aplicarFiltroPrioridad(e.target.value);
        });
    }

    // Filtro por tipo
    const tipoFilter = document.getElementById('type-filter');
    if (tipoFilter) {
        tipoFilter.addEventListener('change', (e) => {
            aplicarFiltroTipo(e.target.value);
        });
    }

    // Filtros por fecha
    const fechaInicioFilter = document.getElementById('fecha-inicio-filter');
    const fechaFinFilter = document.getElementById('fecha-fin-filter');
    
    if (fechaInicioFilter) {
        fechaInicioFilter.addEventListener('change', (e) => {
            aplicarFiltroFecha('inicio', e.target.value);
        });
    }

    if (fechaFinFilter) {
        fechaFinFilter.addEventListener('change', (e) => {
            aplicarFiltroFecha('fin', e.target.value);
        });
    }

    // Botón limpiar filtros
    const limpiarBtn = document.getElementById('clear-filters-btn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarTodosFiltros);
    }
}

/**
 * Aplica filtro por estado
 */
function aplicarFiltroEstado(estado) {
    filtrosActivos.estado = estado;
    aplicarTodosFiltros();
    actualizarContadorFiltros();
}

/**
 * Aplica filtro por prioridad
 */
function aplicarFiltroPrioridad(prioridad) {
    filtrosActivos.prioridad = prioridad;
    aplicarTodosFiltros();
    actualizarContadorFiltros();
}

/**
 * Aplica filtro por tipo
 */
function aplicarFiltroTipo(tipo) {
    filtrosActivos.tipo = tipo;
    aplicarTodosFiltros();
    actualizarContadorFiltros();
}

/**
 * Aplica filtro por fecha
 */
function aplicarFiltroFecha(tipoFecha, fecha) {
    if (tipoFecha === 'inicio') {
        filtrosActivos.fechaInicio = fecha;
    } else {
        filtrosActivos.fechaFin = fecha;
    }
    
    aplicarTodosFiltros();
    actualizarContadorFiltros();
}

/**
 * Aplica todos los filtros activos
 */
function aplicarTodosFiltros() {
    try {
        let solicitudesFiltradas = [...solicitudesOriginales];

        // Filtro por estado
        if (filtrosActivos.estado !== 'todas') {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => 
                s.estado === filtrosActivos.estado
            );
        }

        // Filtro por prioridad
        if (filtrosActivos.prioridad) {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => 
                s.prioridad === filtrosActivos.prioridad
            );
        }

        // Filtro por tipo
        if (filtrosActivos.tipo) {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => {
                if (filtrosActivos.tipo === 'solicitud') {
                    return s.tipo === 'solicitud' || s.tipoSolicitud === 'identificado';
                } else if (filtrosActivos.tipo === 'reingreso') {
                    return s.tipo === 'reingreso';
                } else if (filtrosActivos.tipo === 'informacion') {
                    return s.tipo === 'informacion' || s.tipoSolicitud === 'informacion';
                }
                return true;
            });
        }

        // Filtro por rango de fechas
        if (filtrosActivos.fechaInicio || filtrosActivos.fechaFin) {
            solicitudesFiltradas = solicitudesFiltradas.filter(s => {
                const fechaSolicitud = s.fechaCreacion?.toDate() || new Date(0);
                
                let cumpleFechaInicio = true;
                let cumpleFechaFin = true;

                if (filtrosActivos.fechaInicio) {
                    const fechaInicio = new Date(filtrosActivos.fechaInicio);
                    cumpleFechaInicio = fechaSolicitud >= fechaInicio;
                }

                if (filtrosActivos.fechaFin) {
                    const fechaFin = new Date(filtrosActivos.fechaFin);
                    fechaFin.setHours(23, 59, 59, 999);
                    cumpleFechaFin = fechaSolicitud <= fechaFin;
                }

                return cumpleFechaInicio && cumpleFechaFin;
            });
        }

        // Disparar evento personalizado con solicitudes filtradas
        const evento = new CustomEvent('solicitudesFiltradas', {
            detail: { solicitudes: solicitudesFiltradas }
        });
        document.dispatchEvent(evento);

        console.log(`Filtros aplicados: ${solicitudesFiltradas.length}/${solicitudesOriginales.length} solicitudes`);

    } catch (error) {
        console.error('Error aplicando filtros:', error);
        mostrarNotificacion('Error aplicando filtros', 'error');
    }
}

/**
 * Limpia todos los filtros
 */
function limpiarTodosFiltros() {
    try {
        // Resetear filtros activos
        filtrosActivos = {
            estado: 'todas',
            prioridad: '',
            tipo: '',
            fechaInicio: '',
            fechaFin: '',
            cesfam: ''
        };

        // Resetear elementos de interfaz
        const elementos = [
            { id: 'status-filter', valor: 'todas' },
            { id: 'priority-filter', valor: '' },
            { id: 'type-filter', valor: '' },
            { id: 'fecha-inicio-filter', valor: '' },
            { id: 'fecha-fin-filter', valor: '' }
        ];

        elementos.forEach(({ id, valor }) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.value = valor;
            }
        });

        // Aplicar filtros (mostrará todas las solicitudes)
        aplicarTodosFiltros();
        actualizarContadorFiltros();

        mostrarNotificacion('Filtros limpiados', 'info');

    } catch (error) {
        console.error('Error limpiando filtros:', error);
    }
}

/**
 * Actualiza el contador de filtros activos
 */
function actualizarContadorFiltros() {
    const contador = contarFiltrosActivos();
    const badge = document.getElementById('filters-badge');
    
    if (badge) {
        if (contador > 0) {
            badge.textContent = contador;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Cuenta cuántos filtros están activos
 */
function contarFiltrosActivos() {
    let contador = 0;
    
    if (filtrosActivos.estado !== 'todas') contador++;
    if (filtrosActivos.prioridad) contador++;
    if (filtrosActivos.tipo) contador++;
    if (filtrosActivos.fechaInicio) contador++;
    if (filtrosActivos.fechaFin) contador++;
    
    return contador;
}

/**
 * Ordena solicitudes por diferentes criterios
 */
function ordenarSolicitudes(solicitudes, criterio = 'fecha', orden = 'desc') {
    try {
        const solicitudesOrdenadas = [...solicitudes];

        solicitudesOrdenadas.sort((a, b) => {
            let valorA, valorB;

            switch (criterio) {
                case 'fecha':
                    valorA = a.fechaCreacion?.toDate() || new Date(0);
                    valorB = b.fechaCreacion?.toDate() || new Date(0);
                    break;
                    
                case 'prioridad':
                    const prioridades = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1 };
                    valorA = prioridades[a.prioridad] || 0;
                    valorB = prioridades[b.prioridad] || 0;
                    break;
                    
                case 'nombre':
                    valorA = (a.nombre || '').toLowerCase();
                    valorB = (b.nombre || '').toLowerCase();
                    break;
                    
                case 'estado':
                    valorA = a.estado || '';
                    valorB = b.estado || '';
                    break;
                    
                default:
                    return 0;
            }

            if (valorA < valorB) return orden === 'asc' ? -1 : 1;
            if (valorA > valorB) return orden === 'asc' ? 1 : -1;
            return 0;
        });

        return solicitudesOrdenadas;

    } catch (error) {
        console.error('Error ordenando solicitudes:', error);
        return solicitudes;
    }
}

/**
 * Busca solicitudes por texto
 */
function buscarSolicitudes(solicitudes, termino) {
    if (!termino || termino.trim() === '') {
        return solicitudes;
    }

    const terminoLower = termino.toLowerCase().trim();

    return solicitudes.filter(solicitud => {
        return (
            (solicitud.nombre && solicitud.nombre.toLowerCase().includes(terminoLower)) ||
            (solicitud.apellidos && solicitud.apellidos.toLowerCase().includes(terminoLower)) ||
            (solicitud.rut && solicitud.rut.includes(terminoLower)) ||
            (solicitud.email && solicitud.email.toLowerCase().includes(terminoLower)) ||
            (solicitud.descripcion && solicitud.descripcion.toLowerCase().includes(terminoLower)) ||
            (solicitud.motivo && solicitud.motivo.toLowerCase().includes(terminoLower))
        );
    });
}

/**
 * Actualiza las solicitudes originales
 */
function actualizarSolicitudesOriginales(solicitudes) {
    solicitudesOriginales = [...solicitudes];
    aplicarTodosFiltros();
}

/**
 * Obtiene estadísticas de las solicitudes filtradas
 */
function obtenerEstadisticasFiltros(solicitudes) {
    const stats = {
        total: solicitudes.length,
        porEstado: {},
        porPrioridad: {},
        porTipo: {}
    };

    solicitudes.forEach(solicitud => {
        // Por estado
        const estado = solicitud.estado || 'pendiente';
        stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;

        // Por prioridad
        const prioridad = solicitud.prioridad || 'media';
        stats.porPrioridad[prioridad] = (stats.porPrioridad[prioridad] || 0) + 1;

        // Por tipo
        const tipo = solicitud.tipo || 'solicitud';
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
    });

    return stats;
}

export {
    inicializarFiltros,
    aplicarFiltroEstado,
    aplicarFiltroPrioridad,
    aplicarFiltroTipo,
    aplicarFiltroFecha,
    limpiarTodosFiltros,
    ordenarSolicitudes,
    buscarSolicitudes,
    actualizarSolicitudesOriginales,
    obtenerEstadisticasFiltros
};
