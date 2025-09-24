// src/js/calendario/calendario.js
import { db } from '../configuracion/firebase.js';
import { obtenerDatosUsuario } from '../autenticacion/sesion.js';
import { mostrarCarga } from '../utilidades/notificaciones.js';
import { formatearFecha } from '../utilidades/formato.js';
import { CONFIG_APP } from '../configuracion/constantes.js';

let fechaCalendarioActual = new Date();
let fechaCalendarioSeleccionada = null;

export function configurarCalendario() {
  fechaCalendarioActual = new Date();
  fechaCalendarioSeleccionada = new Date();
  
  renderizarCalendario();
  
  const datosUsuario = obtenerDatosUsuario();
  if (datosUsuario) {
    cargarCitasHoy();
  }
  
  console.log('✅ Calendario configurado');
}

export function renderizarCalendario() {
  try {
    const grilla = document.getElementById('calendar-grid');
    const elementoMesAño = document.getElementById('calendar-month-year');
    
    if (!grilla || !elementoMesAño) return;
    
    const año = fechaCalendarioActual.getFullYear();
    const mes = fechaCalendarioActual.getMonth();
    
    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    elementoMesAño.textContent = `${nombresMeses[mes]} ${año}`;
    
    grilla.innerHTML = '';
    
    // Headers de días
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    diasSemana.forEach(dia => {
      const headerDia = document.createElement('div');
      headerDia.className = 'calendar-day-header';
      headerDia.textContent = dia;
      grilla.appendChild(headerDia);
    });
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const fechaInicio = new Date(primerDia);
    const primerDiaSemana = (primerDia.getDay() + 6) % 7;
    fechaInicio.setDate(fechaInicio.getDate() - primerDiaSemana);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaActual = new Date(fechaInicio);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const elementoDia = crearDiaCalendario(fechaActual, mes, hoy);
      grilla.appendChild(elementoDia);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    const datosUsuario = obtenerDatosUsuario();
    if (datosUsuario) {
      cargarCitasMes(año, mes);
    }
    
  } catch (error) {
    console.error('Error renderizando calendario:', error);
  }
}

function crearDiaCalendario(fecha, mesActual, hoy) {
  const elementoDia = document.createElement('div');
  elementoDia.className = 'calendar-day';
  
  const esMesActual = fecha.getMonth() === mesActual;
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const esPasado = fecha < hoy;
  const diaSemana = fecha.getDay();
  const esFinSemana = diaSemana === 0 || diaSemana === 6;
  
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
  
  if (esMesActual && !esPasado) {
    elementoDia.addEventListener('click', () => seleccionarDiaCalendario(new Date(fecha)));
    elementoDia.style.cursor = 'pointer';
  }
  
  return elementoDia;
}

export function seleccionarDiaCalendario(fecha) {
  try {
    document.querySelectorAll('.calendar-day.selected').forEach(dia => {
      dia.classList.remove('selected');
    });
    
    const elementosDia = document.querySelectorAll('.calendar-day');
    elementosDia.forEach(diaEl => {
      const numeroDia = diaEl.querySelector('.calendar-day-number').textContent;
      if (parseInt(numeroDia) === fecha.getDate() && !diaEl.classList.contains('other-month')) {
        diaEl.classList.add('selected');
      }
    });
    
    fechaCalendarioSeleccionada = fecha;
    cargarCitasDia(fecha);
    
  } catch (error) {
    console.error('Error seleccionando día del calendario:', error);
  }
}

async function cargarCitasMes(año, mes) {
  const datosUsuario = obtenerDatosUsuario();
  if (!datosUsuario) return;
  
  try {
    const inicioDeMes = new Date(año, mes, 1);
    const finDeMes = new Date(año, mes + 1, 0);
    finDeMes.setHours(23, 59, 59, 999);
    
    const snapshotCitas = await db.collection('citas')
      .where('cesfam', '==', datosUsuario.cesfam)
      .where('fecha', '>=', inicioDeMes)
      .where('fecha', '<=', finDeMes)
      .get();
    
    // Limpiar citas existentes
    document.querySelectorAll('.calendar-appointments').forEach(contenedor => {
      contenedor.innerHTML = '';
    });
    
    const citasPorFecha = {};
    
    snapshotCitas.forEach(doc => {
      const cita = doc.data();
      const fechaCita = cita.fecha.toDate();
      const fechaString = fechaCita.toISOString().split('T')[0];
      
      if (!citasPorFecha[fechaString]) {
        citasPorFecha[fechaString] = [];
      }
      
      citasPorFecha[fechaString].push({ id: doc.id, ...cita });
    });
    
    Object.keys(citasPorFecha).forEach(fechaString => {
      const contenedor = document.getElementById(`appointments-${fechaString}`);
      if (contenedor) {
        const citas = citasPorFecha[fechaString];
        
        citas.slice(0, 3).forEach((cita) => {
          const elementoCita = document.createElement('div');
          elementoCita.className = 'calendar-appointment';
          elementoCita.textContent = cita.pacienteNombre || 'Cita';
          elementoCita.title = `${cita.pacienteNombre} - ${cita.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
          
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
          `;
          
          elementoCita.addEventListener('click', (e) => {
            e.stopPropagation();
            import('./citas.js').then(m => m.mostrarInfoCitaPaciente(cita));
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
    });
    
  } catch (error) {
    console.error('Error cargando citas del mes:', error);
  }
}

export async function cargarCitasDia(fecha) {
  const listaCitas = document.getElementById('appointments-list');
  const datosUsuario = obtenerDatosUsuario();
  
  if (!listaCitas || !datosUsuario) return;
  
  try {
    listaCitas.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>';
    
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);
    
    const snapshotCitas = await db.collection('citas')
      .where('cesfam', '==', datosUsuario.cesfam)
      .where('fecha', '>=', inicioDia)
      .where('fecha', '<', finDia)
      .orderBy('fecha', 'asc')
      .get();
    
    if (snapshotCitas.empty) {
      const nombreDia = fecha.toLocaleDateString('es-CL', { weekday: 'long' });
      
      listaCitas.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <p>No hay citas programadas para ${fecha.toLocaleDateString('es-CL')}</p>
          <p><small>${nombreDia}</small></p>
          <button class="btn btn-primary btn-sm mt-2" onclick="window.SENDA.crearCitaParaFecha('${fecha.toISOString()}')">
            <i class="fas fa-plus"></i>
            Agregar Cita
          </button>
        </div>
      `;
      return;
    }
    
    const citas = [];
    snapshotCitas.forEach(doc => {
      citas.push({ id: doc.id, ...doc.data() });
    });
    
    listaCitas.innerHTML = citas.map(cita => crearElementoCita(cita)).join('');
    
  } catch (error) {
    console.error('Error cargando citas del día:', error);
    listaCitas.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las citas</p>
        <button class="btn btn-outline btn-sm" onclick="window.SENDA.cargarCitasDia('${fecha.toISOString()}')">
          <i class="fas fa-redo"></i>
          Reintentar
        </button>
      </div>
    `;
  }
}

function crearElementoCita(cita) {
  const hora = cita.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="appointment-item" data-id="${cita.id}">
      <div class="appointment-time">${hora}</div>
      <div class="appointment-details">
        <div class="appointment-patient" onclick="window.SENDA.mostrarInfoCita('${cita.id}')" 
             style="cursor: pointer; color: var(--primary-blue); text-decoration: underline;">
          ${cita.pacienteNombre}
        </div>
        <div class="appointment-professional">${cita.profesionalNombre}</div>
        <div class="appointment-type">${obtenerNombreProfesion(cita.tipoProfesional)}</div>
      </div>
      <div class="appointment-status">
        <span class="status-badge ${cita.estado || 'programada'}">
          <i class="fas fa-${obtenerIconoEstado(cita.estado)}"></i>
          ${(cita.estado || 'programada').toUpperCase()}
        </span>
      </div>
    </div>
  `;
}

function obtenerIconoEstado(estado) {
  const iconos = {
    'programada': 'clock',
    'confirmada': 'check',
    'en_curso': 'play',
    'completada': 'check-circle',
    'cancelada': 'times-circle'
  };
  return iconos[estado] || 'circle';
}

function obtenerNombreProfesion(profesion) {
  const { PROFESIONES } = import('../configuracion/constantes.js');
  return PROFESIONES[profesion] || profesion;
}

export async function cargarCitasHoy() {
  try {
    const hoy = new Date();
    await cargarCitasDia(hoy);
    
    fechaCalendarioSeleccionada = hoy;
    seleccionarDiaCalendario(hoy);
    
  } catch (error) {
    console.error('Error cargando citas de hoy:', error);
  }
}

export function navegarMes(direccion) {
  fechaCalendarioActual.setMonth(fechaCalendarioActual.getMonth() + direccion);
  renderizarCalendario();
}
