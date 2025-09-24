// Importar todos los módulos
import { initializeFirebase, isFirebaseInitialized } from './configuracion/firebase.js';
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

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    // Timeout de seguridad
    const initTimeout = setTimeout(() => {
        console.error('❌ Timeout: La inicialización está tomando demasiado tiempo');
        document.body.innerHTML += `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 20px; border: 2px solid #ef4444; border-radius: 8px; 
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; z-index: 10000;">
                <h3 style="color: #ef4444;">⚠️ Cargando...</h3>
                <p>La aplicación está tomando más tiempo del esperado.</p>
                <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Recargar página
                </button>
            </div>
        `;
    }, 10000);

    try {
        console.log('🚀 SISTEMA SENDA PUENTE ALTO v2.0');
        console.log('=====================================');
        console.log('🔄 Iniciando sistema SENDA completo...');
        
        // Paso 1: Inicializar Firebase PRIMERO
        console.log('🔧 Inicializando Firebase...');
        initializeFirebase();
        
        // Verificar que Firebase se inicializó correctamente
        if (!isFirebaseInitialized()) {
            throw new Error('Firebase no se pudo inicializar correctamente');
        }
        console.log('✅ Firebase verificado y listo');
        
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
        
        console.log('✅ Sistema SENDA inicializado correctamente');
        clearTimeout(initTimeout);
        
    } catch (error) {
        clearTimeout(initTimeout);
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
   Desarrollado por: CamiMoralesM
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
