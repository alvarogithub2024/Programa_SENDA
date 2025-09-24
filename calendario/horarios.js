// src/js/calendario/horarios.js
import { db } from '../configuracion/firebase.js';
import { HORARIOS_ATENCION } from '../configuracion/constantes.js';
import { obtenerDatosUsuario } from '../autenticacion/sesion.js';

export function generarHorarios(fecha) {
  const fechaLocal = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diaSemana = fechaLocal.getDay();
  let config;

  if (diaSemana >= 1 && diaSemana <= 5) {
    config = HORARIOS_ATENCION.semana;
  } else if (diaSemana === 0 || diaSemana === 6) {
    config = HORARIOS_ATENCION.finSemana;
  } else {
    return [];
  }

  const slots = [];
  let horaActual = config.inicio;
  let minutoActual = 0;

  while (horaActual < config.fin || (horaActual === config.fin && minutoActual <= config.minFin)) {
    const horaString = `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`;
    slots.push({
      time: horaString,
      hour: horaActual,
      minute: minutoActual
    });

    minutoActual += config.intervalo;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }
    if (horaActual > config.fin + 1) break;
  }

  return slots;
}

export async function obtenerHorasOcupadas(profesionalId, fecha) {
  try {
    const datosUsuario = obtenerDatosUsuario();
    if (!datosUsuario) return [];
    
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', profesionalId)
      .where('fecha', '>=', inicioDia)
      .where('fecha', '<=', finDia)
      .where('estado', '!=', 'cancelada')
      .get();
    
    const horasOcupadas = [];
    snapshot.forEach(doc => {
      const cita = doc.data();
      const fechaCita = cita.fecha.toDate();
      const horaString = fechaCita.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      horasOcupadas.push(horaString);
    });
    
    return horasOcupadas;
    
  } catch (error) {
    console.error('Error obteniendo horas ocupadas:', error);
    return [];
  }
}

export function obtenerHorariosTrabajo(fecha) {
  const diaSemana = fecha.getDay();
  
  if (HORARIOS_ATENCION.semana.dias.includes(diaSemana)) {
    return {
      inicio: `${HORARIOS_ATENCION.semana.inicio}:00`,
      fin: `${HORARIOS_ATENCION.semana.fin}:${HORARIOS_ATENCION.semana.minFin.toString().padStart(2, '0')}`
    };
  } else if (HORARIOS_ATENCION.finSemana.dias.includes(diaSemana)) {
    return {
      inicio: `${HORARIOS_ATENCION.finSemana.inicio}:00`,
      fin: `${HORARIOS_ATENCION.finSemana.fin}:${HORARIOS_ATENCION.finSemana.minFin.toString().padStart(2, '0')}`
    };
  } else {
    return { inicio: 'Cerrado', fin: 'Cerrado' };
  }
}
