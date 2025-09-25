/**
 * CONFIGURACION/CONSTANTES.JS
 * Constantes y configuraciones del sistema
 */

// Configuración de Firebase
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

// Lista de CESFAM de Puente Alto
window.CESFAM_PUENTE_ALTO = [
    "CESFAM Alejandro del Río",
    "CESFAM Karol Wojtyla", 
    "CESFAM Laurita Vicuña",
    "CESFAM Padre Manuel Villaseca",
    "CESFAM San Gerónimo",
    "CESFAM Vista Hermosa",
    "CESFAM Bernardo Leighton",
    "CESFAM Cardenal Raúl Silva Henríquez"
];

// Configuración de horarios
window.HORARIOS_CONFIG = {
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

// Configuración general de la app
window.APP_CONFIG = {
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    PAGINATION_LIMIT: 100,
    CACHE_DURATION: 5 * 60 * 1000,
    DEBUG_MODE: true
};

// Profesiones
window.PROFESIONES = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional'
};


// Rutas de colecciones principales Firestore
window.COLLECTIONS = {
    PROFESIONALES: "profesionales",
    PACIENTES: "pacientes",
    SOLICITUDES_INGRESO: "solicitudes_ingreso",
    REINGRESOS: "reingresos",
    SOLICITUDES_INFO: "solicitudes_informacion",
    CITAS: "citas",
    HISTORIAL_PACIENTES: "historial_pacientes",
    CENTROS: "centros",
    CONFIGURACION: "configuracion"
};

// Estados de solicitudes
window.ESTADOS_SOLICITUD = [
    "pendiente",
    "aceptada",
    "rechazada",
    "anulada",
    "finalizada"
];
