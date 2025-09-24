// ====================================
// CONSTANTES Y CONFIGURACIONES
// ====================================

// Lista de CESFAM
const CESFAM_PUENTE_ALTO = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla", 
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
];

// Configuración de horarios
const HORARIOS_CONFIG = {
  semana: {
    horaInicio: 8,
    horaFin: 16,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [1, 2, 3, 4, 5]
  },
  finSemana: {
    horaInicio: 9,
    horaFin: 12,
    minutoFin: 30,
    intervaloMinutos: 30,
    diasSemana: [0, 6]
  }
};

// Configuración de la aplicación
const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 100,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true
};

// Tipos de profesiones
const PROFESIONES = {
  'asistente_social': 'Asistente Social',
  'medico': 'Médico',
  'psicologo': 'Psicólogo',
  'terapeuta': 'Terapeuta Ocupacional'
};

// Estados de solicitudes
const ESTADOS_SOLICITUD = {
  'pendiente': 'Pendiente',
  'en_proceso': 'En Proceso',
  'agendada': 'Agendada',
  'completada': 'Completada',
  'cancelada': 'Cancelada',
  'pendiente_respuesta': 'Pendiente Respuesta'
};

// Prioridades
const PRIORIDADES = {
  'baja': 'Baja',
  'media': 'Media',
  'alta': 'Alta',
  'critica': 'Crítica'
};

// Exportar constantes
window.SENDASystem = window.SENDASystem || {};
window.SENDASystem.constants = {
  CESFAM_PUENTE_ALTO,
  HORARIOS_CONFIG,
  APP_CONFIG,
  PROFESIONES,
  ESTADOS_SOLICITUD,
  PRIORIDADES
};
