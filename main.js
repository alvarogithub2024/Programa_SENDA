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

// Solicitudes - COMENTADOS TEMPORALMENTE PARA EVITAR ERRORES
// import { initFilters } from './solicitudes/filtros.js';
// import { initResponses } from './solicitudes/respuestas.js';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 SISTEMA SENDA PUENTE ALTO v2.0');
        console.log('=====================================');
        console.log('🔄 Iniciando sistema SENDA completo...');
        
        // Paso 1: Inicializar Firebase PRIMERO
        console.log('🔧 Inicializando Firebase...');
        initializeFirebase();
        
        // Paso 2: Configurar autenticación
        console.log('🔧 Configurando autenticación...');
        setupAuth();
        
        // Paso 3: Configurar navegación
        console.log('🔧 Configurando navegación...');
        setupTabs();
        
        // Paso 4: Configurar formularios
        console.log('🔧 Configurando formularios...');
        setupFormularios(); 
        
        // Paso 5: Configurar eventos
        console.log('🔧 Configurando eventos...');
        setupEventListeners();
        
        // Paso 6: Inicializar módulos (con verificaciones)
        console.log('🔧 Inicializando módulos...');
        
        // Calendario
        try {
            initCalendar();
            setupAppointmentForm();
            initScheduleManager();
        } catch (error) {
            console.warn('⚠️ Error inicializando calendario:', error);
        }
        
        // Pacientes
        try {
            initPatientsManager();
            initPatientSearch();
            initPatientRecord();
        } catch (error) {
            console.warn('⚠️ Error inicializando pacientes:', error);
        }
        
        // Seguimiento
        try {
            initTimeline();
            initAttentions();
            initUpcomingAppointments();
        } catch (error) {
            console.warn('⚠️ Error inicializando seguimiento:', error);
        }
        
        // Solicitudes (comentado temporalmente)
        // try {
        //     initFilters();
        //     initResponses();
        // } catch (error) {
        //     console.warn('⚠️ Error inicializando solicitudes:', error);
        // }
        
        console.log('✅ Sistema SENDA inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        
        // Mostrar mensaje de error al usuario
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #ef4444; color: white; padding: 16px; border-radius: 8px;
            max-width: 300px; font-family: system-ui;
        `;
        errorDiv.innerHTML = `
            <strong>Error de inicialización</strong><br>
            Por favor, recarga la página.<br>
            <small>${error.message}</small>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => errorDiv.remove(), 10000);
    }
});

// Mensaje de bienvenida en consola
console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
   Estado: Inicializando...
   Fecha: ${new Date().toLocaleString('es-CL')}
`);

// Importar y configurar funciones globales para modales
import { closeModal, showModal } from './utilidades/modales.js';

window.closeModal = closeModal;
window.showModal = showModal;

// Función para cambiar entre tabs de login/registro
window.switchLoginTab = function(tab) {
    try {
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
    } catch (error) {
        console.error('Error switching login tab:', error);
    }
};
