/**
 * CONSTANTES Y CONFIGURACIÓN DEL SISTEMA
 * Define todas las constantes utilizadas en la aplicación
 */

// Configuración principal de la aplicación
export const APP_CONFIG = {
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    PAGINATION_LIMIT: 100,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    DEBUG_MODE: true
};

// Lista de CESFAM de Puente Alto
export const CESFAM_PUENTE_ALTO = [
    "CESFAM Alejandro del Río",
    "CESFAM Karol Wojtyla", 
    "CESFAM Laurita Vicuña",
    "CESFAM Padre Manuel Villaseca",
    "CESFAM San Gerónimo",
    "CESFAM Vista Hermosa",
    "CESFAM Bernardo Leighton",
    "CESFAM Cardenal Raúl Silva Henríquez"
];

// Configuración de horarios de atención
export const HORARIOS_CONFIG = {
    semana: {
        horaInicio: 8,
        horaFin: 16,
        minutoFin: 30,
        intervaloMinutos: 30,
        diasSemana: [1, 2, 3, 4, 5] // Lunes a Viernes
    },
    finSemana: {
        horaInicio: 9,
        horaFin: 12,
        minutoFin: 30,
        intervaloMinutos: 30,
        diasSemana: [0, 6] // Domingo y Sábado
    }
};

// Estados de solicitudes
export const ESTADOS_SOLICITUD = {
    PENDIENTE: 'pendiente',
    EN_PROCESO: 'en_proceso',
    AGENDADA: 'agendada',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
    PENDIENTE_RESPUESTA: 'pendiente_respuesta',
    RESPONDIDA: 'respondida'
};

// Niveles de prioridad
export const NIVELES_PRIORIDAD = {
    CRITICA: 'critica',
    ALTA: 'alta',
    MEDIA: 'media',
    BAJA: 'baja'
};

// Colores de prioridad
export const COLORES_PRIORIDAD = {
    critica: '#ef4444',
    alta: '#f59e0b',
    media: '#3b82f6',
    baja: '#10b981'
};

// Estados de citas
export const ESTADOS_CITA = {
    PROGRAMADA: 'programada',
    CONFIRMADA: 'confirmada',
    EN_CURSO: 'en_curso',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada'
};

// Tipos de profesionales
export const TIPOS_PROFESIONAL = {
    asistente_social: 'Asistente Social',
    medico: 'Médico',
    psicologo: 'Psicólogo',
    terapeuta: 'Terapeuta Ocupacional',
};

// Iconos para tipos de notificación
export const ICONOS_NOTIFICACION = {
    success: 'check-circle',
    error: 'exclamation-triangle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
};

// Iconos para estados de solicitud
export const ICONOS_ESTADO = {
    pendiente: 'fa-clock',
    en_proceso: 'fa-spinner',
    agendada: 'fa-calendar-check',
    completada: 'fa-check-circle',
    cancelada: 'fa-times-circle',
    pendiente_respuesta: 'fa-reply'
};

// Iconos para estados de cita
export const ICONOS_ESTADO_CITA = {
    programada: 'fa-clock',
    confirmada: 'fa-check',
    en_curso: 'fa-play',
    completada: 'fa-check-circle',
    cancelada: 'fa-times-circle'
};

// Colores para estados
export const COLORES_ESTADO = {
    programada: '#3b82f6',
    confirmada: '#10b981',
    en_curso: '#f59e0b',
    completada: '#059669',
    cancelada: '#ef4444'
};

// Tipos de solicitud
export const TIPOS_SOLICITUD = {
    IDENTIFICADO: 'identificado',
    INFORMACION: 'informacion',
    REINGRESO: 'reingreso'
};

// Sustancias problemáticas predefinidas
export const SUSTANCIAS_DISPONIBLES = [
    'Alcohol',
    'Marihuana',
    'Cocaína',
    'Pasta Base',
    'Benzodiacepinas',
    'Anfetaminas',
    'Heroína',
    'Fentanilo',
    'Otras'
];

// Configuración de validaciones
export const VALIDACIONES = {
    RUT: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 12
    },
    TELEFONO: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 12
    },
    EDAD: {
        MIN: 12,
        MAX: 120
    },
    PASSWORD: {
        MIN_LENGTH: 6
    }
};

// Mensajes de error comunes
export const MENSAJES_ERROR = {
    FIREBASE: {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/weak-password': 'Contraseña muy débil',
        'permission-denied': 'Sin permisos para realizar esta acción',
        'network-request-failed': 'Problema de conexión. Verifica tu internet',
        'unavailable': 'Servicio no disponible temporalmente'
    },
    VALIDACION: {
        CAMPO_REQUERIDO: 'Este campo es obligatorio',
        RUT_INVALIDO: 'RUT inválido',
        EMAIL_INVALIDO: 'Email inválido',
        TELEFONO_INVALIDO: 'Teléfono inválido',
        EDAD_INVALIDA: 'La edad debe estar entre 12 y 120 años'
    }
};

// Configuración de cache
export const CACHE_KEYS = {
    USER_DATA: 'user_data',
    SOLICITUDES: 'solicitudes',
    PACIENTES: 'pacientes',
    PROFESIONALES: 'profesionales',
    CITAS: 'citas'
};

// URLs de recursos externos
export const URLS_EXTERNAS = {
    SENDA_WEB: 'https://www.senda.gob.cl',
    TELEFONO_EMERGENCIA: '131',
    TELEFONO_INFO: '1412'
};

// Configuración de formularios
export const FORMULARIO_CONFIG = {
    AUTOSAVE_DELAY: 2000, // 2 segundos
    MAX_DRAFT_AGE: 24 * 60 * 60 * 1000, // 24 horas
    STEPS: {
        PACIENTE: {
            MAX: 4,
            INFORMACION: 1
        }
    }
};

export default {
    APP_CONFIG,
    CESFAM_PUENTE_ALTO,
    HORARIOS_CONFIG,
    ESTADOS_SOLICITUD,
    NIVELES_PRIORIDAD,
    COLORES_PRIORIDAD,
    ESTADOS_CITA,
    TIPOS_PROFESIONAL,
    ICONOS_NOTIFICACION,
    ICONOS_ESTADO,
    ICONOS_ESTADO_CITA,
    COLORES_ESTADO,
    TIPOS_SOLICITUD,
    SUSTANCIAS_DISPONIBLES,
    VALIDACIONES,
    MENSAJES_ERROR,
    CACHE_KEYS,
    URLS_EXTERNAS,
    FORMULARIO_CONFIG
};
