// Importar todos los módulos
import { initializeFirebase } from './configuracion/firebase.js';
import { setupAuth } from './autenticacion/sesion.js';
import { setupTabs } from './navegacion/tabs.js';
import { setupFormularios } from './formularios/formulario-paciente.js';
import { setupEventListeners } from './navegacion/eventos.js';

// Calendario
import { initCalendar } from './calendario/agenda.js';
import { setupAppointmentForm } from './calendario/citas.js';
import { initScheduleManager } from './calendario/horarios.js';

// Pacientes
import { initPatientsManager } from './pacientes/gestor-pacientes.js';
import { initPatientSearch } from './pacientes/busqueda.js';
import { initPatientRecord } from './pacientes/fichas.js';

// Seguimiento
import { initTimeline } from './seguimiento/timeline.js';
import { initAttentions } from './seguimiento/atenciones.js';
import { initUpcomingAppointments } from './seguimiento/citas-proximas.js';

// Solicitudes
import { initFilters } from './solicitudes/filtros.js';              // ← AGREGAR
import { initResponses } from './solicitudes/respuestas.js';         // ← AGREGAR

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando sistema SENDA completo...');
        
        initializeFirebase();
        setupAuth();
        setupTabs();
        setupFormularios();
        setupEventListeners();
        
        // Calendario
        initCalendar();
        setupAppointmentForm();
        initScheduleManager();
        
        // Pacientes
        initPatientsManager();
        initPatientSearch();
        initPatientRecord();
        
        // Seguimiento
        initTimeline();
        initAttentions();
        initUpcomingAppointments();
        
        // Solicitudes                  
        initFilters();
        initResponses();
        
        console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
    }
});

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
