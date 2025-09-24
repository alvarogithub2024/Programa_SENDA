/**
 * TIMELINE DE SEGUIMIENTO
 * Maneja la visualización del timeline de pacientes y citas próximas
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearSoloFecha, formatearSoloHora } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el sistema de seguimiento
 */
function inicializarSeguimiento() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de seguimiento inicializado');
    } catch (error) {
        console.error('❌ Error inicializando seguimiento:', error);
        throw error;
    }
}

/**
 * Carga el seguimiento completo
 */
async function cargarSeguimiento() {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;
    
    try {
        mostrarCarga(true, 'Cargando seguimiento...');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);
        
        // Cargar citas de hoy para el timeline
        const citasHoySnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', hoy)
            .where('fecha', '<', mañana)
            .orderBy('fecha', 'asc')
            .get();
        
        renderizarTimelinePacientes(citasHoySnapshot);
        
        // Cargar próximas citas
        const proximasCitasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', mañana)
            .orderBy('fecha', 'asc')
            .limit(10)
            .get();
        
        renderizarProximasCitas(proximasCitasSnapshot);
        
    } catch (error) {
        console.error('Error cargando seguimiento:', error);
        mostrarNotificacion('Error al cargar seguimiento: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Renderiza el timeline de pacientes de hoy
 */
function renderizarTimelinePacientes(citasSnapshot) {
    try {
        const timeline = document.getElementById('patients-timeline');
        if (!timeline) return;
        
        if (citasSnapshot.empty) {
            timeline.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-calendar-day"></i>
                    <h3>No hay pacientes agendados para hoy</h3>
                    <p>No se encontraron citas programadas para hoy</p>
                </div>
            `;
            return;
        }
        
        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        timeline.innerHTML = citas.map(cita => crearElementoTimeline(cita)).join('');
        
    } catch (error) {
        console.error('Error renderizando timeline de pacientes:', error);
    }
}

/**
 * Crea un elemento del timeline
 */
function crearElementoTimeline(cita) {
    const fecha = cita.fecha.toDate();
    const hora = formatearSoloHora(fecha);
    const estado = cita.estado || 'programada';
    
    const iconosEstado = {
        'programada': 'fa-clock',
        'confirmada': 'fa-check',
        'en_curso': 'fa-play',
        'completada': 'fa-check-circle',
        'cancelada': 'fa-times-circle'
    };

    const coloresEstado = {
        'programada': '#3b82f6',
        'confirmada': '#10b981',
        'en_curso': '#f59e0b',
        'completada': '#059669',
        'cancelada': '#ef4444'
    };
    
    return `
        <div class="timeline-item" onclick="registrarAtencionRapida('${cita.pacienteRut}', '${cita.pacienteNombre}')" 
             style="cursor: pointer; border-left: 4px solid ${coloresEstado[estado]}; padding: 16px; margin-bottom: 16px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;">
            <div class="timeline-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div class="timeline-time" style="font-weight: bold; font-size: 18px; color: var(--primary-blue);">
                    <i class="fas fa-clock" style="margin-right: 8px;"></i>
                    ${hora}
                </div>
                <span class="timeline-status ${estado}" style="background: ${coloresEstado[estado]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    <i class="fas ${iconosEstado[estado]}"></i>
                    ${estado.toUpperCase()}
                </span>
            </div>
            
            <div class="timeline-patient">
                <h4 style="margin: 0 0 4px 0; color: var(--text-dark);">${cita.pacienteNombre}</h4>
                <p style="margin: 0 0 4px 0; color: var(--gray-600); font-size: 14px;">
                    <i class="fas fa-user-md" style="margin-right: 4px;"></i>
                    ${obtenerNombreProfesion(cita.tipoProfesional)} - ${cita.profesionalNombre}
                </p>
                <small style="color: var(--gray-500);">
                    <i class="fas fa-tag" style="margin-right: 4px;"></i>
                    Tipo: ${cita.tipo || 'General'}
                </small>
            </div>
            
            ${cita.observaciones ? 
                `<div class="timeline-notes" style="margin-top: 12px; padding: 8px; background: var(--light-blue); border-radius: 4px; font-size: 13px;">
                    <i class="fas fa-sticky-note" style="margin-right: 4px; color: var(--primary-blue);"></i>
                    ${cita.observaciones}
                </div>` : ''
            }
        </div>
    `;
}

/**
 * Renderiza las próximas citas
 */
function renderizarProximasCitas(citasSnapshot) {
    try {
        const grid = document.getElementById('upcoming-appointments-grid');
        const noUpcomingSection = document.getElementById('no-upcoming-section');
        
        if (!grid) return;
        
        if (citasSnapshot.empty) {
            if (noUpcomingSection) noUpcomingSection.style.display = 'block';
            grid.innerHTML = '';
            return;
        }
        
        if (noUpcomingSection) noUpcomingSection.style.display = 'none';
        
        const citas = [];
        citasSnapshot.forEach(doc => {
            citas.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        grid.innerHTML = citas.map(cita => crearTarjetaCitaProxima(cita)).join('');
        
    } catch (error) {
        console.error('Error renderizando próximas citas:', error);
    }
}

/**
 * Crea una tarjeta para cita próxima
 */
function crearTarjetaCitaProxima(cita) {
    const fecha = cita.fecha.toDate();
    const fechaStr = formatearSoloFecha(fecha);
    const hora = formatearSoloHora(fecha);
    const estado = cita.estado || 'programada';
    
    // Calcular días hasta la cita
    const hoy = new
