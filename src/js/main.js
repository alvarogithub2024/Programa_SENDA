// ====================================
// ARCHIVO PRINCIPAL DE INICIALIZACIÓN
// ====================================

// Importar todos los módulos necesarios
import './configuracion/firebase.js';
import './configuracion/constantes.js';
import './utilidades/notificaciones.js';
import './utilidades/modales.js';
import './utilidades/formato.js';
import './utilidades/cache.js';
import './autenticacion/sesion.js';
import './navegacion/tabs.js';
import './navegacion/eventos.js';
import './navegacion/shortcuts.js';
import './formularios/formulario-paciente.js';
import './formularios/formulario-reingreso.js';
import './calendario/calendario.js';
import './solicitudes/gestor-solicitudes.js';
import './pacientes/gestor-pacientes.js';
import './seguimiento/timeline.js';

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('🚀 Iniciando sistema SENDA completo...');
    
    // Configurar Firebase
    window.SENDASystem.firebase.init();
    
    // Configurar formularios
    window.SENDASystem.formularios.setupMultiStepForm();
    window.SENDASystem.formularios.setupAuthForms();
    
    // Configurar event listeners
    window.SENDASystem.eventos.init();
    
    // Configurar funcionalidades
    window.SENDASystem.navegacion.setupTabs();
    window.SENDASystem.calendario.setup();
    
    // Configurar autenticación
    window.SENDASystem.auth.init();
    
    // Configurar actualización periódica
    setInterval(() => {
      if (window.SENDASystem.currentUserData) {
        // Recargar slots de tiempo si están visibles
        const timeSlotsContainer = document.getElementById('nueva-cita-time-slots-container');
        if (timeSlotsContainer && timeSlotsContainer.style.display !== 'none') {
          window.SENDASystem.calendario.loadTimeSlots();
        }
      }
    }, 60000);
    
    console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    window.SENDASystem.notifications.show('Error inicializando el sistema', 'error');
  }
});

// Sistema global SENDA
window.SENDASystem = {
  currentUser: null,
  currentUserData: null,
  solicitudesData: [],
  pacientesData: [],
  citasData: [],
  professionalsList: []
};

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
