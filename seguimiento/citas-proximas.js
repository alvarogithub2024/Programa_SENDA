/**
 * GESTIÓN DE CITAS PRÓXIMAS
 * Maneja la visualización y gestión de citas próximas
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { formatearSoloFecha, formatearSoloHora } from '../utilidades/formato.js';

let db;
let citasProximas = [];

/**
 * Inicializa el gestor de citas próximas
 */
function inicializarCitasProximas() {
    try {
        db = obtenerFirestore();
        console.log('✅ Gestor de citas próximas inicializado');
    } catch (error) {
        console.error('❌ Error inicializando citas próximas:', error);
    }
}

/**
 * Carga las citas próximas
 */
async function cargarCitasProximas(diasAdelante = 7, limite = 20) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return [];

    try {
        const ahora = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + diasAdelante);
        fechaLimite.setHours(23, 59, 59, 999);

        const citasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>', ahora)
            .where('fecha', '<=', fechaLimite)
            .where('estado', 'in', ['programada', 'confirmada'])
            .orderBy('fecha', 'asc')
            .limit(limite)
            .get();

        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        citasProximas = citas;
        return citas;

    } catch (error) {
        console.error('Error cargando citas próximas:', error);
        return [];
    }
}

/**
 * Renderiza las citas próximas en un contenedor específico
 */
function renderizarCitasProximas(citas, containerId = 'upcoming-appointments-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (citas.length === 0) {
        container.innerHTML = crearMensajeSinCitasProximas();
        return;
    }

    container.innerHTML = citas.map(cita => crearTarjetaCitaProxima(cita)).join('');
}

/**
 * Crea una tarjeta para cita próxima
 */
function crearTarjetaCitaProxima(cita) {
    const fecha = cita.fecha.toDate();
    const fechaStr = formatearSoloFecha(fecha);
    const hora = formatearSoloHora(fecha);
    
    // Calcular urgencia
    const urgencia = calcularUrgenciaCita(fecha);
    
    return `
        <div class="appointment-card ${urgencia.clase}" data-id="${cita.id}" 
             onclick="mostrarDetalleCitaProxima('${cita.id}')"
             style="cursor: pointer; transition: all 0.2s ease;">
            <div class="appointment-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="appointment-date" style="color: ${urgencia.color}; font-weight: bold; font-size: 14px;">
                    <i class="fas fa-calendar"></i>
                    ${urgencia.texto}
                </span>
                <span class="appointment-time" style="color: var(--primary-blue); font-weight: bold;">
                    <i class="fas fa-clock"></i>
                    ${hora}
                </span>
            </div>
            
            <div class="appointment-card-body">
                <h4 style="margin: 0 0 8px 0; color: var(--text-dark);">${cita.pacienteNombre}</h4>
                <p style="margin: 0 0 4px 0; color: var(--gray-600); font-size: 13px;">
                    <i class="fas fa-user-md"></i> ${obtenerNombreProfesion(cita.tipoProfesional)}
                </p>
                <p style="margin: 0 0 4px 0; color: var(--gray-500); font-size: 12px;">
                    <i class="fas fa-user"></i> ${cita.profesionalNombre}
                </p>
                <small style="color: var(--gray-500);">
                    <i class="fas fa-tags"></i> ${cita.tipo || 'General'}
                </small>
            </div>
            
            <div class="appointment-card-footer" style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span class="status-badge ${cita.estado}" style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: var(--light-blue); color: var(--primary-blue);">
                    ${(cita.estado || 'programada').toUpperCase()}
                </span>
                ${urgencia.badge}
            </div>
        </div>
    `;
}

/**
 * Calcula la urgencia de una cita
 */
function calcularUrgenciaCita(fechaCita) {
    const ahora = new Date();
    const diferencia = fechaCita - ahora;
    const horasHasta = diferencia / (1000 * 60 * 60);
    const diasHasta = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    if (horasHasta <= 2) {
        return {
            texto: 'Muy pronto',
            color: '#ef4444',
            clase: 'urgente-inmediata',
            badge: '<span style="color: #ef4444; font-size: 10px; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> INMINENTE</span>'
        };
    } else if (horasHasta <= 24) {
        return {
            texto: 'Hoy',
            color: '#f59e0b',
            clase: 'urgente-hoy',
            badge: '<span style="color: #f59e0b; font-size: 10px; font-weight: bold;"><i class="fas fa-clock"></i> HOY</span>'
        };
    } else if (diasHasta === 1) {
        return {
            texto: 'Mañana',
            color: '#f59e0b',
            clase: 'urgente-mañana',
            badge: '<span style="color: #f59e0b; font-size: 10px; font-weight: bold;"><i class="fas fa-calendar-day"></i> MAÑANA</span>'
        };
    } else if (diasHasta <= 3) {
        return {
            texto: `En ${diasHasta} días`,
            color: '#3b82f6',
            clase: 'proximo',
            badge: ''
        };
    } else if (diasHasta <= 7) {
        return {
            texto: `En ${diasHasta} días`,
            color: '#10b981',
            clase: 'normal',
            badge: ''
        };
    } else {
        return {
            texto: formatearSoloFecha(fechaCita),
            color: '#6b7280',
            clase: 'futuro',
            badge: ''
        };
    }
}

/**
 * Crea mensaje cuando no hay citas próximas
 */
function crearMensajeSinCitasProximas() {
    return `
        <div class="no-upcoming-appointments">
            <i class="fas fa-calendar-check" style="font-size: 48px; color: var(--gray-400); margin-bottom: 16px;"></i>
            <h3>No hay citas próximas</h3>
            <p>No se encontraron citas programadas para los próximos días</p>
        </div>
    `;
}

/**
 * Obtiene citas para un día específico
 */
async function obtenerCitasDelDia(fecha) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return [];

    try {
        const inicioDia = new Date(fecha);
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(fecha);
        finDia.setHours(23, 59, 59, 999);

        const citasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', inicioDia)
            .where('fecha', '<', finDia)
            .orderBy('fecha', 'asc')
            .get();

        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return citas;

    } catch (error) {
        console.error('Error obteniendo citas del día:', error);
        return [];
    }
}

/**
 * Confirma una cita próxima
 */
async function confirmarCitaProxima(citaId) {
    try {
        await db.collection('citas').doc(citaId).update({
            estado: 'confirmada',
            fechaConfirmacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar en memoria
        const cita = citasProximas.find(c => c.id === citaId);
        if (cita) {
            cita.estado = 'confirmada';
        }

        mostrarNotificacion('Cita confirmada correctamente', 'success');
        
        // Recargar citas próximas
        const citasActualizadas = await cargarCitasProximas();
        renderizarCitasProximas(citasActualizadas);

    } catch (error) {
        console.error('Error confirmando cita:', error);
        mostrarNotificacion('Error al confirmar cita', 'error');
    }
}

/**
 * Cancela una cita próxima
 */
async function cancelarCitaProxima(citaId, motivo = '') {
    try {
        const datosActualizacion = {
            estado: 'cancelada',
            fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (motivo) {
            datosActualizacion.motivoCancelacion = motivo;
        }

        await db.collection('citas').doc(citaId).update(datosActualizacion);

        // Remover de memoria
        citasProximas = citasProximas.filter(c => c.id !== citaId);

        mostrarNotificacion('Cita cancelada correctamente', 'success');
        
        // Recargar citas próximas
        const citasActualizadas = await cargarCitasProximas();
        renderizarCitasProximas(citasActualizadas);

    } catch (error) {
        console.error('Error cancelando cita:', error);
        mostrarNotificacion('Error al cancelar cita', 'error');
    }
}

/**
 * Obtiene estadísticas de citas próximas
 */
function obtenerEstadisticasCitasProximas(citas) {
    const stats = {
        total: citas.length,
        hoy: 0,
        mañana: 0,
        estaSemana: 0,
        porEstado: {},
        porProfesional: {},
        porTipo: {}
    };

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);

    citas.forEach(cita => {
        const fechaCita = cita.fecha.toDate();
        const fechaCitaDate = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());

        // Contar por tiempo
        if (fechaCitaDate.getTime() === hoy.getTime()) {
            stats.hoy++;
        } else if (fechaCitaDate.getTime() === mañana.getTime()) {
            stats.mañana++;
        }

        if (fechaCita <= finSemana) {
            stats.estaSemana++;
        }

        // Por estado
        const estado = cita.estado || 'programada';
        stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;

        // Por profesional
        const profesional = cita.profesionalNombre || 'Sin asignar';
        stats.porProfesional[profesional] = (stats.porProfesional[profesional] || 0) + 1;

        // Por tipo
        const tipo = cita.tipo || 'General';
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
    });

    return stats;
}

/**
 * Obtiene notificaciones de citas próximas
 */
function obtenerNotificacionesCitasProximas(citas) {
    const notificaciones = [];
    const ahora = new Date();

    citas.forEach(cita => {
        const fechaCita = cita.fecha.toDate();
        const diferencia = fechaCita - ahora;
        const horasHasta = diferencia / (1000 * 60 * 60);

        if (horasHasta <= 2 && horasHasta > 0) {
            notificaciones.push({
                tipo: 'urgente',
                mensaje: `Cita con ${cita.pacienteNombre} en ${Math.round(horasHasta * 60)} minutos`,
                citaId: cita.id,
                tiempo: horasHasta
            });
        } else if (horasHasta <= 24 && horasHasta > 0) {
            notificaciones.push({
                tipo: 'hoy',
                mensaje: `Cita con ${cita.pacienteNombre} hoy a las ${formatearSoloHora(fechaCita)}`,
                citaId: cita.id,
                tiempo: horasHasta
            });
        }
    });

    return notificaciones.sort((a, b) => a.tiempo - b.tiempo);
}

/**
 * Función auxiliar para obtener nombre de profesión
 */
function obtenerNombreProfesion(profession) {
    const nombres = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional',
        'coordinador': 'Coordinador Regional',
        'admin': 'Administrador'
    };
    return nombres[profession] || profession;
}

// Funciones globales
window.confirmarCitaProxima = confirmarCitaProxima;
window.cancelarCitaProxima = cancelarCitaProxima;
window.mostrarDetalleCitaProxima = function(citaId) {
    // Importar dinámicamente el módulo de timeline
    import('./timeline.js')
        .then(modulo => modulo.mostrarDetalleCitaProxima(citaId))
        .catch(error => console.error('Error mostrando detalle:', error));
};

export {
    inicializarCitasProximas,
    cargarCitasProximas,
    renderizarCitasProximas,
    obtenerCitasDelDia,
    confirmarCitaProxima,
    cancelarCitaProxima,
    obtenerEstadisticasCitasProximas,
    obtenerNotificacionesCitasProximas
};
