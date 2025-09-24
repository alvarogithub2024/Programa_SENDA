/**
 * SISTEMA DE CALENDARIO
 * Maneja la visualización y navegación del calendario
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { APP_CONFIG, HORARIOS_CONFIG } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { formatearSoloFecha, formatearSoloHora } from '../utilidades/formato.js';
import { establecerCache, obtenerCache } from '../utilidades/cache.js';

let db;
let fechaCalendarioActual = new Date();
let fechaSeleccionada = null;
let citasDelMes = [];

/**
 * Inicializa el sistema de calendario
 */
function inicializarCalendario() {
    try {
        db = obtenerFirestore();
        fechaCalendarioActual = new Date();
        fechaSeleccionada = new Date();
        
        renderizarCalendario();
        cargarCitasHoy();
        
        console.log('✅ Calendario inicializado');
    } catch (error) {
        console.error('❌ Error inicializando calendario:', error);
        throw error;
    }
}

/**
 * Renderiza el calendario completo
 */
function renderizarCalendario() {
    try {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearElement = document.getElementById('calendar-month-year');
        
        if (!calendarGrid || !monthYearElement) {
            console.warn('Elementos del calendario no encontrados');
            return;
        }

        const año = fechaCalendarioActual.getFullYear();
        const mes = fechaCalendarioActual.getMonth();
        
        const nombresmes = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        monthYearElement.textContent = `${nombresmes[mes]} ${año}`;
        
        // Limpiar grid
        calendarGrid.innerHTML = '';
        
        // Agregar headers de días
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        diasSemana.forEach(dia => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = dia;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Calcular fechas del calendario
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0);
        
        // Ajustar para que la semana comience en lunes
        const fechaInicio = new Date(primerDia);
        const primerDiaSemana = (primerDia.getDay() + 6) % 7;
        fechaInicio.setDate(fechaInicio.getDate() - primerDiaSemana);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaActual = new Date(fechaInicio);
        
        // Renderizar 42 días (6 semanas)
        for (let i = 0; i < 42; i++) {
            const elementoDia = crearElementoDiaCalendario(fechaActual, mes, hoy);
            calendarGrid.appendChild(elementoDia);
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
        
        // Cargar citas del mes
        cargarCitasDelMes(año, mes);
        
    } catch (error) {
        console.error('Error renderizando calendario:', error);
    }
}

/**
 * Crea un elemento de día del calendario
 */
function crearElementoDiaCalendario(fecha, mesActual, hoy) {
    const elementoDia = document.createElement('div');
    elementoDia.className = 'calendar-day';
    
    const esMesActual = fecha.getMonth() === mesActual;
    const esHoy = fecha.toDateString() === hoy.toDateString();
    const esPasado = fecha < hoy;
    const diaSemana = fecha.getDay();
    const esFinSemana = diaSemana === 0 || diaSemana === 6;
    
    // Aplicar clases
    if (!esMesActual) elementoDia.classList.add('other-month');
    if (esHoy) elementoDia.classList.add('today');
    if (esFinSemana) {
        elementoDia.classList.add('weekend');
        elementoDia.style.backgroundColor = '#f8f9ff';
    }
    
    elementoDia.innerHTML = `
        <div class="calendar-day-number">${fecha.getDate()}</div>
        <div class="calendar-appointments" id="appointments-${fecha.toISOString().split('T')[0]}"></div>
    `;
    
    // Event listener para seleccionar día
    if (esMesActual && !esPasado) {
        elementoDia.addEventListener('click', () => seleccionarDiaCalendario(new Date(fecha)));
        elementoDia.style.cursor = 'pointer';
    }
    
    return elementoDia;
}

/**
 * Selecciona un día específico del calendario
 */
function seleccionarDiaCalendario(fecha) {
    try {
        // Remover selección anterior
        document.querySelectorAll('.calendar-day.selected').forEach(dia => {
            dia.classList.remove('selected');
        });
        
        // Seleccionar nuevo día
        const elementos = document.querySelectorAll('.calendar-day');
        elementos.forEach(elemento => {
            const numeroDia = elemento.querySelector('.calendar-day-number').textContent;
            if (parseInt(numeroDia) === fecha.getDate() && !elemento.classList.contains('other-month')) {
                elemento.classList.add('selected');
            }
        });
        
        fechaSeleccionada = fecha;
        cargarCitasDelDia(fecha);
        
        console.log('Día seleccionado:', formatearSoloFecha(fecha));
    } catch (error) {
        console.error('Error seleccionando día:', error);
    }
}

/**
 * Carga las citas del mes actual
 */
async function cargarCitasDelMes(año, mes) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;
    
    try {
        console.log(`Cargando citas para ${mes + 1}/${año} - CESFAM: ${userData.cesfam}`);
        
        const inicioMes = new Date(año, mes, 1);
        const finMes = new Date(año, mes + 1, 0);
        finMes.setHours(23, 59, 59, 999);
        
        const citasSnapshot = await db.collection('citas')
            .where('cesfam', '==', userData.cesfam)
            .where('fecha', '>=', inicioMes)
            .where('fecha', '<=', finMes)
            .get();
        
        console.log(`Citas encontradas en ${mes + 1}/${año}: ${citasSnapshot.size}`);
        
        // Limpiar appointments anteriores
        document.querySelectorAll('.calendar-appointments').forEach(contenedor => {
            contenedor.innerHTML = '';
        });
        
        const citasPorFecha = {};
        
        citasSnapshot.forEach(doc => {
            const cita = doc.data();
            const fechaCita = cita.fecha.toDate();
            const fechaString = fechaCita.toISOString().split('T')[0];
            
            if (!citasPorFecha[fechaString]) {
                citasPorFecha[fechaString] = [];
            }
            
            citasPorFecha[fechaString].push({
                id: doc.id,
                ...cita
            });
        });
        
        citasDelMes = citasPorFecha;
        
        // Renderizar citas en el calendario
        Object.keys(citasPorFecha).forEach(fechaString => {
            renderizarCitasEnDia(fechaString, citasPorFecha[fechaString]);
        });
        
        console.log(`Citas del mes cargadas: ${citasSnapshot.size}`);
        
    } catch (error) {
        console.error('Error cargando citas del mes:', error);
    }
}

/**
 * Renderiza las citas en un día específico del calendario
 */
function renderizarCitasEnDia(fechaString, citas) {
    const contenedor = document.getElementById(`appointments-${fechaString}`);
    if (!contenedor) return;
    
    // Mostrar máximo 3 citas + indicador si hay más
    citas.slice(0, 3).forEach((cita, index) => {
        const elementoCita = document.createElement('div');
        elementoCita.className = 'calendar-appointment';
        elementoCita.textContent = cita.pacienteNombre || 'Cita';
        elementoCita.title = `${cita.pacienteNombre} - ${formatearSoloHora(cita.fecha.toDate())}`;
        
        elementoCita.style.cssText = `
            background: var(--primary-blue);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            transition: background 0.2s ease;
        `;
        
        elementoCita.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarInformacionCita(cita);
        });
        
        elementoCita.addEventListener('mouseenter', () => {
            elementoCita.style.background = 'var(--health-green)';
        });
        
        elementoCita.addEventListener('mouseleave', () => {
            elementoCita.style.background = 'var(--primary-blue)';
        });
        
        contenedor.appendChild(elementoCita);
    });
    
    if (citas.length > 3) {
        const elementoMas = document.createElement('div');
        elementoMas.className = 'calendar-appointment more';
        elementoMas.textContent = `+${citas.length - 3} más`;
        elementoMas.style.cssText = `
            background: var(--gray-400);
            color: white;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 3px;
            font-size: 9px;
            text-align: center;
            cursor: pointer;
        `;
        
        elementoMas.addEventListener('click', (e) => {
            e.stopPropagation();
            const fecha = new Date(fechaString);
            seleccionarDiaCalendario(fecha);
        });
        
        contenedor.appendChild(elementoMas);
    }
}

/**
 * Muestra información detallada de una cita
 */
function mostrarInformacionCita(cita) {
    import('../utilidades/modales.js')
        .then(modulo => {
            const modalHTML = crearModalInformacionCita(cita);
            const modalId = modulo.crearModalTemporal(modalHTML);
            modulo.mostrarModal(modalId);
        })
        .catch(error => console.error('Error mostrando información de cita:', error));
}

/**
 * Crea el HTML para el modal de información de cita
 */
function crearModalInformacionCita(cita) {
    const fecha = cita.fecha.toDate();
    const fechaStr = formatearSoloFecha(fecha);
    const horaStr = formatearSoloHora(fecha);
    
    return `
        <div class="modal">
            <button class="modal-close">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="padding: 24px;">
                <h2><i class="fas fa-calendar-check"></i> Información de Cita</h2>
                
                <div class="patient-info" style="background: var(--light-blue); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: var(--primary-blue);">
                        ${cita.pacienteNombre}
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                        <div><strong>RUT:</strong> ${cita.pacienteRut || 'No disponible'}</div>
                        <div><strong>Teléfono:</strong> ${cita.pacienteTelefono || 'No disponible'}</div>
                        <div><strong>Fecha:</strong> ${fechaStr}</div>
                        <div><strong>Hora:</strong> ${horaStr}</div>
                        <div><strong>Profesional:</strong> ${cita.profesionalNombre}</div>
                        <div><strong>Tipo:</strong> ${obtenerNombreProfesion(cita.tipoProfesional)}</div>
                        <div><strong>Estado:</strong> <span style="color: ${obtenerColorEstado(cita.estado)}; font-weight: bold;">${(cita.estado || 'programada').toUpperCase()}</span></div>
                        <div><strong>Tipo cita:</strong> ${cita.tipo || 'General'}</div>
                    </div>
                    
                    ${cita.observaciones ? 
                        `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.5);">
                            <strong>Observaciones:</strong>
                            <p style="margin: 8px 0 0 0; font-style: italic;">${cita.observaciones}</p>
                        </div>` : ''
                    }
                </div>
                
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-check"></i>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Carga y muestra las citas de hoy
 */
async function cargarCitasHoy() {
    const hoy = new Date();
    await cargarCitasDelDia(hoy);
    seleccionarDiaCalendario(hoy);
}

/**
 * Carga las citas de un día específico
 */
async function cargarCitasDelDia(fecha) {
    const listaAppointments = document.getElementById('appointments-list');
    if (!listaAppointments) return;
    
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;
    
    try {
        listaAppointments.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>';
        
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
        
        if (citasSnapshot.empty) {
            const nombreDia = fecha.toLocaleDateString('es-CL', { weekday: 'long' });
            const horariosTrabajo = obtenerHorariosTrabajo(fecha);
            
            listaAppointments.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-calendar-day"></i>
                    <p>No hay citas programadas para ${formatearSoloFecha(fecha)}</p>
                    <p><small>${nombreDia} - Horario: ${horariosTrabajo.inicio} a ${horariosTrabajo.fin}</small></p>
                    <button class="btn btn-primary btn-sm mt-2" onclick="crearCitaParaFecha('${fecha.toISOString()}')">
                        <i class="fas fa-plus"></i>
                        Agregar Cita
                    </button>
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
        
        listaAppointments.innerHTML = citas.map(cita => crearElementoCita(cita)).join('');
        
    } catch (error) {
        console.error('Error cargando citas del día:', error);
        listaAppointments.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las citas</p>
                <button class="btn btn-outline btn-sm" onclick="cargarCitasDelDia(new Date('${fecha.toISOString()}'))">
                    <i class="fas fa-redo"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Crea el elemento HTML para una cita
 */
function crearElementoCita(cita) {
    const hora = formatearSoloHora(cita.fecha.toDate());
    const iconosEstado = {
        'programada': 'fa-clock',
        'confirmada': 'fa-check',
        'en_curso': 'fa-play',
        'completada': 'fa-check-circle',
        'cancelada': 'fa-times-circle'
    };
    
    return `
        <div class="appointment-item" data-id="${cita.id}">
            <div class="appointment-time">${hora}</div>
            <div class="appointment-details">
                <div class="appointment-patient" onclick="mostrarInformacionCita(${JSON.stringify(cita).replace(/"/g, '&quot;')})" 
                     style="cursor: pointer; color: var(--primary-blue); text-decoration: underline;">
                    ${cita.pacienteNombre}
                </div>
                <div class="appointment-professional">${cita.profesionalNombre}</div>
                <div class="appointment-type">${obtenerNombreProfesion(cita.tipoProfesional)}</div>
            </div>
            <div class="appointment-status">
                <span class="status-badge ${cita.estado || 'programada'}">
                    <i class="fas ${iconosEstado[cita.estado] || 'fa-circle'}"></i>
                    ${(cita.estado || 'programada').toUpperCase()}
                </span>
            </div>
        </div>
    `;
}

/**
 * Navega al mes anterior
 */
function navegarMesAnterior() {
    fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() - 1);
    renderizarCalendario();
}

/**
 * Navega al mes siguiente
 */
function navegarMesSiguiente() {
    fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() + 1);
    renderizarCalendario();
}

/**
 * Obtiene los horarios de trabajo para una fecha
 */
function obtenerHorariosTrabajo(fecha) {
    const diaSemana = fecha.getDay();
    
    if (HORARIOS_CONFIG.semana.diasSemana.includes(diaSemana)) {
        return {
            inicio: `${HORARIOS_CONFIG.semana.horaInicio}:00`,
            fin: `${HORARIOS_CONFIG.semana.horaFin}:${HORARIOS_CONFIG.semana.minutoFin.toString().padStart(2, '0')}`
        };
    } else if (HORARIOS_CONFIG.finSemana.diasSemana.includes(diaSemana)) {
        return {
            inicio: `${HORARIOS_CONFIG.finSemana.horaInicio}:00`,
            fin: `${HORARIOS_CONFIG.finSemana.horaFin}:${HORARIOS_CONFIG.finSemana.minutoFin.toString().padStart(2, '0')}`
        };
    } else {
        return {
            inicio: 'Cerrado',
            fin: 'Cerrado'
        };
    }
}

/**
 * Funciones auxiliares
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

function obtenerColorEstado(estado) {
    const colores = {
        'programada': '#3b82f6',
        'confirmada': '#10b981',
        'en_curso': '#f59e0b',
        'completada': '#059669',
        'cancelada': '#ef4444'
    };
    return colores[estado] || '#6b7280';
}

// Funciones globales
window.crearCitaParaFecha = function(fechaIso) {
    import('./citas.js')
        .then(modulo => modulo.crearModalNuevaCitaParaFecha(fechaIso))
        .catch(error => console.error('Error creando cita:', error));
};

window.mostrarInformacionCita = mostrarInformacionCita;

export {
    inicializarCalendario,
    renderizarCalendario,
    navegarMesAnterior,
    navegarMesSiguiente,
    cargarCitasHoy,
    cargarCitasDelDia,
    seleccionarDiaCalendario
};
