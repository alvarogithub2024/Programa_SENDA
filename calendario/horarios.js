/**
 * MANEJO DE HORARIOS
 * Gestiona la generación y validación de horarios de atención
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { HORARIOS_CONFIG } from '../configuracion/constantes.js';

let db;

/**
 * Inicializa el sistema de horarios
 */
function inicializarHorarios() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de horarios inicializado');
    } catch (error) {
        console.error('❌ Error inicializando horarios:', error);
        throw error;
    }
}

/**
 * Genera slots de tiempo para una fecha específica
 */
function generarSlots(fecha) {
    const fechaLocal = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const diaSemana = fechaLocal.getDay();
    const slots = [];
    let config;

/**
 * MANEJO DE HORARIOS
 * Gestiona la generación y validación de horarios de atención
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { HORARIOS_CONFIG } from '../configuracion/constantes.js';

let db;

/**
 * Inicializa el sistema de horarios
 */
function inicializarHorarios() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de horarios inicializado');
    } catch (error) {
        console.error('❌ Error inicializando horarios:', error);
        throw error;
    }
}

/**
 * Genera slots de tiempo para una fecha específica
 */
function generarSlots(fecha) {
    const fechaLocal = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const diaSemana = fechaLocal.getDay();
    const slots = [];
    let config;

    // Determinar configuración según el día
    if (diaSemana >= 1 && diaSemana <= 5) {
        config = HORARIOS_CONFIG.semana;
    } else if (diaSemana === 0 || diaSemana === 6) {
        config = HORARIOS_CONFIG.finSemana;
    } else {
        return [];
    }

    let horaActual = config.horaInicio;
    let minutoActual = 0;

    while (horaActual < config.horaFin || (horaActual === config.horaFin && minutoActual <= config.minutoFin)) {
        const horaString = `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`;
        slots.push({
            time: horaString,
            hour: horaActual,
            minute: minutoActual
        });

        minutoActual += config.intervaloMinutos;
        if (minutoActual >= 60) {
            horaActual += Math.floor(minutoActual / 60);
            minutoActual = minutoActual % 60;
        }
        if (horaActual > config.horaFin + 1) {
            break;
        }
    }

    console.log(`Día ${diaSemana} (${fechaLocal.toLocaleDateString()}): ${slots.length} slots generados`);
    return slots;
}

/**
 * Obtiene slots ocupados para un profesional en una fecha
 */
async function obtenerSlotsOcupados(profesionalId, fecha) {
    try {
        const userData = obtenerDatosUsuarioActual();
        if (!userData) return [];
        
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
        
        const slotsOcupados = [];
        snapshot.forEach(doc => {
            const cita = doc.data();
            const fechaCita = cita.fecha.toDate();
            const horaString = fechaCita.toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            slotsOcupados.push(horaString);
        });
        
        return slotsOcupados;
        
    } catch (error) {
        console.error('Error obteniendo slots ocupados:', error);
        return [];
    }
}

/**
 * Verifica si un horario está disponible
 */
async function verificarDisponibilidadSlot(profesionalId, fecha, hora) {
    try {
        const fechaCompleta = new Date(`${fecha}T${hora}:00`);
        
        const snapshot = await db.collection('citas')
            .where('profesionalId', '==', profesionalId)
            .where('fecha', '==', fechaCompleta)
            .where('estado', '!=', 'cancelada')
            .get();
        
        return snapshot.empty;
        
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        return false;
    }
}

/**
 * Obtiene configuración de horarios para un día específico
 */
function obtenerConfiguracionDia(fecha) {
    const diaSemana = fecha.getDay();
    
    if (diaSemana >= 1 && diaSemana <= 5) {
        return {
            ...HORARIOS_CONFIG.semana,
            tipo: 'semana',
            nombre: 'Lunes a Viernes'
        };
    } else if (diaSemana === 0 || diaSemana === 6) {
        return {
            ...HORARIOS_CONFIG.finSemana,
            tipo: 'finSemana',
            nombre: diaSemana === 0 ? 'Domingo' : 'Sábado'
        };
    } else {
        return null;
    }
}

/**
 * Verifica si una fecha es día laboral
 */
function esDiaLaboral(fecha) {
    const config = obtenerConfiguracionDia(fecha);
    return config !== null;
}

/**
 * Obtiene el próximo día laboral
 */
function obtenerProximoDiaLaboral(fecha = new Date()) {
    const proximaFecha = new Date(fecha);
    proximaFecha.setDate(proximaFecha.getDate() + 1);
    
    let intentos = 0;
    while (!esDiaLaboral(proximaFecha) && intentos < 7) {
        proximaFecha.setDate(proximaFecha.getDate() + 1);
        intentos++;
    }
    
    return proximaFecha;
}

/**
 * Calcula la duración entre dos slots
 */
function calcularDuracionSlots(horaInicio, horaFin) {
    const [horasInicio, minutosInicio] = horaInicio.split(':').map(Number);
    const [horasFin, minutosFin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = horasInicio * 60 + minutosInicio;
    const finMinutos = horasFin * 60 + minutosFin;
    
    const duracionMinutos = finMinutos - inicioMinutos;
    
    if (duracionMinutos < 0) {
        return duracionMinutos + (24 * 60); // Para casos que cruzan medianoche
    }
    
    return duracionMinutos;
}

/**
 * Valida si un horario está dentro del rango permitido
 */
function validarHorarioEnRango(fecha, hora) {
    const config = obtenerConfiguracionDia(fecha);
    if (!config) return false;
    
    const [horas, minutos] = hora.split(':').map(Number);
    const minutosTotal = horas * 60 + minutos;
    const inicioMinutos = config.horaInicio * 60;
    const finMinutos = config.horaFin * 60 + config.minutoFin;
    
    return minutosTotal >= inicioMinutos && minutosTotal <= finMinutos;
}

/**
 * Obtiene horarios de trabajo para mostrar en interfaz
 */
function obtenerHorariosTexto(fecha) {
    const config = obtenerConfiguracionDia(fecha);
    
    if (!config) {
        return {
            inicio: 'Cerrado',
            fin: 'Cerrado',
            estado: 'cerrado'
        };
    }
    
    return {
        inicio: `${config.horaInicio.toString().padStart(2, '0')}:00`,
        fin: `${config.horaFin.toString().padStart(2, '0')}:${config.minutoFin.toString().padStart(2, '0')}`,
        estado: 'abierto',
        tipo: config.tipo,
        intervalo: config.intervaloMinutos
    };
}

/**
 * Genera slots para una semana completa
 */
function generarSlotsSemana(fechaInicio) {
    const slotsSemana = {};
    
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fecha.getDate() + i);
        
        const fechaString = fecha.toISOString().split('T')[0];
        slotsSemana[fechaString] = {
            fecha: fecha,
            slots: generarSlots(fecha),
            config: obtenerConfiguracionDia(fecha),
            esLaboral: esDiaLaboral(fecha)
        };
    }
    
    return slotsSemana;
}

/**
 * Encuentra el primer slot disponible después de una fecha
 */
async function encontrarPrimerSlotDisponible(profesionalId, fechaInicio = new Date()) {
    try {
        let fechaActual = new Date(fechaInicio);
        let intentos = 0;
        
        while (intentos < 14) { // Buscar hasta 2 semanas
            if (esDiaLaboral(fechaActual)) {
                const slots = generarSlots(fechaActual);
                const slotsOcupados = await obtenerSlotsOcupados(profesionalId, fechaActual);
                
                for (const slot of slots) {
                    if (!slotsOcupados.includes(slot.time) && 
                        !esPasadoSlot(fechaActual, slot.hour, slot.minute)) {
                        return {
                            fecha: new Date(fechaActual),
                            hora: slot.time,
                            disponible: true
                        };
                    }
                }
            }
            
            fechaActual.setDate(fechaActual.getDate() + 1);
            intentos++;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error encontrando primer slot disponible:', error);
        return null;
    }
}

/**
 * Verifica si un slot ya pasó
 */
function esPasadoSlot(fecha, hora, minuto) {
    const ahora = new Date();
    const horaSlot = new Date(fecha);
    horaSlot.setHours(hora, minuto, 0, 0);

    // Buffer de 30 minutos para evitar agendar muy cerca
    const tiempoBuffer = new Date(ahora);
    tiempoBuffer.setMinutes(tiempoBuffer.getMinutes() + 30);

    return horaSlot <= tiempoBuffer;
}

/**
 * Obtiene estadísticas de ocupación para un profesional
 */
async function obtenerEstadisticasOcupacion(profesionalId, fechaInicio, fechaFin) {
    try {
        const snapshot = await db.collection('citas')
            .where('profesionalId', '==', profesionalId)
            .where('fecha', '>=', fechaInicio)
            .where('fecha', '<=', fechaFin)
            .where('estado', '!=', 'cancelada')
            .get();
        
        const citasPorDia = {};
        const totalDias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
        
        snapshot.forEach(doc => {
            const cita = doc.data();
            const fechaCita = cita.fecha.toDate();
            const fechaString = fechaCita.toISOString().split('T')[0];
            
            if (!citasPorDia[fechaString]) {
                citasPorDia[fechaString] = 0;
            }
            citasPorDia[fechaString]++;
        });
        
        const diasConCitas = Object.keys(citasPorDia).length;
        const totalCitas = snapshot.size;
        const promedioCitasPorDia = diasConCitas > 0 ? totalCitas / diasConCitas : 0;
        
        return {
            totalCitas,
            diasConCitas,
            totalDias,
            promedioCitasPorDia: Math.round(promedioCitasPorDia * 100) / 100,
            citasPorDia
        };
        
    } catch (error) {
        console.error('Error obteniendo estadísticas de ocupación:', error);
        return null;
    }
}

/**
 * Sugiere mejores horarios basado en patrones históricos
 */
async function sugerirMejoresHorarios(profesionalId, fecha) {
    try {
        // Obtener citas históricas del mismo día de la semana
        const diaSemana = fecha.getDay();
        const haceTresMeses = new Date(fecha);
        haceTresMeses.setMonth(haceTresMeses.getMonth() - 3);
        
        const snapshot = await db.collection('citas')
            .where('profesionalId', '==', profesionalId)
            .where('fecha', '>=', haceTresMeses)
            .where('fecha', '<', fecha)
            .where('estado', 'in', ['completada', 'programada'])
            .get();
        
        const horariosPopulares = {};
        
        snapshot.forEach(doc => {
            const cita = doc.data();
            const fechaCita = cita.fecha.toDate();
            
            if (fechaCita.getDay() === diaSemana) {
                const hora = fechaCita.toLocaleTimeString('es-CL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                });
                horariosPopulares[hora] = (horariosPopulares[hora] || 0) + 1;
            }
        });
        
        // Ordenar por popularidad
        const horariosOrdenados = Object.entries(horariosPopulares)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([hora, cantidad]) => ({ hora, cantidad }));
        
        return horariosOrdenados;
        
    } catch (error) {
        console.error('Error sugiriendo mejores horarios:', error);
        return [];
    }
}

export {
    inicializarHorarios,
    generarSlots,
    obtenerSlotsOcupados,
    verificarDisponibilidadSlot,
    obtenerConfiguracionDia,
    esDiaLaboral,
    obtenerProximoDiaLaboral,
    calcularDuracionSlots,
    validarHorarioEnRango,
    obtenerHorariosTexto,
    generarSlotsSemana,
    encontrarPrimerSlotDisponible,
    esPasadoSlot,
    obtenerEstadisticasOcupacion,
    sugerirMejoresHorarios
};
