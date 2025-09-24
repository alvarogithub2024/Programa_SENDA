/**
 * CONFIGURACION/CONSTANTES.JS
 * Constantes y configuraciones del sistema
 */

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

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

export const HORARIOS_CONFIG = {
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

export const APP_CONFIG = {
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    PAGINATION_LIMIT: 100,
    CACHE_DURATION: 5 * 60 * 1000,
    DEBUG_MODE: true
};

export const PROFESIONES = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional'
};
