// src/js/configuracion/constantes.js
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

export const CESFAMS_PUENTE_ALTO = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla", 
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
];

export const HORARIOS_ATENCION = {
  semana: { inicio: 8, fin: 16, minFin: 30, intervalo: 30, dias: [1,2,3,4,5] },
  finSemana: { inicio: 9, fin: 12, minFin: 30, intervalo: 30, dias: [0,6] }
};

export const CONFIG_APP = {
  maxReintentos: 3,
  retrasoReintento: 1000,
  limitePaginacion: 100,
  duracionCache: 300000, // 5 minutos
  modoDebug: false
};

export const PROFESIONES = {
  asistente_social: 'Asistente Social',
  medico: 'Médico',
  psicologo: 'Psicólogo',
  terapeuta: 'Terapeuta Ocupacional'
};

export const PRIORIDADES = {
  critica: { color: '#ef4444', label: 'CRÍTICA' },
  alta: { color: '#f59e0b', label: 'ALTA' },
  media: { color: '#3b82f6', label: 'MEDIA' },
  baja: { color: '#10b981', label: 'BAJA' }
};

export const ESTADOS_CITA = {
  programada: { icon: 'fa-clock', color: '#3b82f6' },
  confirmada: { icon: 'fa-check', color: '#10b981' },
  en_curso: { icon: 'fa-play', color: '#f59e0b' },
  completada: { icon: 'fa-check-circle', color: '#059669' },
  cancelada: { icon: 'fa-times-circle', color: '#ef4444' }
};

export const TIPOS_NOTIFICACION = {
  success: 'check-circle',
  error: 'exclamation-triangle',
  warning: 'exclamation-triangle',
  info: 'info-circle'
};

export const COLECCIONES_DB = {
  profesionales: 'profesionales',
  solicitudes: 'solicitudes_ingreso',
  reingresos: 'reingresos',
  informacion: 'solicitudes_informacion',
  pacientes: 'pacientes',
  citas: 'citas',
  atenciones: 'atenciones',
  alertas: 'alertas_criticas'
};

export const VALIDACIONES = {
  rut: { min: 8, max: 9 },
  telefono: { min: 8, max: 12 },
  edad: { min: 12, max: 120 },
  password: { min: 6 }
};

export const ESTADOS_SOLICITUD = [
  'pendiente',
  'en_proceso', 
  'agendada',
  'completada',
  'pendiente_respuesta',
  'respondida'
];

export const SUSTANCIAS_DISPONIBLES = [
  'alcohol',
  'marihuana',
  'cocaina',
  'pasta_base',
  'benzodiacepinas',
  'otras'
];

export const TIEMPOS_CONSUMO = [
  { value: 'menos_6_meses', label: 'Menos de 6 meses' },
  { value: '6_12_meses', label: '6 meses a 1 año' },
  { value: '1_3_anos', label: '1 a 3 años' },
  { value: '3_5_anos', label: '3 a 5 años' },
  { value: 'mas_5_anos', label: 'Más de 5 años' }
];

export const NIVELES_URGENCIA = ['baja', 'media', 'alta'];

export const MENSAJES_ERROR = {
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Usuario deshabilitado',
  'auth/too-many-requests': 'Demasiados intentos',
  'auth/email-already-in-use': 'Email ya registrado',
  'auth/weak-password': 'Contraseña muy débil',
  'permission-denied': 'Sin permisos',
  'unavailable': 'Servicio no disponible',
  'network-request-failed': 'Error de conexión'
};
