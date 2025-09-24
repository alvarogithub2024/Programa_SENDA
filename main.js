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

import { closeModal, showModal } from './utilidades/modales.js';


window.closeModal = closeModal;
window.showModal = showModal;


window.switchLoginTab = function(tab) {
    const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
    const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
    } else {
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
    }
};
