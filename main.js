// Importar todos los módulos
import { initializeFirebase } from './configuracion/firebase.js';
import { setupAuth } from './autenticacion/sesion.js';
import { setupTabs } from './navegacion/tabs.js';
import { setupFormularios } from './formularios/formulario-paciente.js';
import { setupEventListeners } from './navegacion/eventos.js';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Iniciando sistema SENDA completo...');
        
        // Inicializar Firebase
        initializeFirebase();
        
        // Configurar autenticación
        setupAuth();
        
        // Configurar navegación
        setupTabs();
        
        // Configurar formularios
        setupFormularios();
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log('🎉 SENDA Puente Alto - Sistema completo inicializado');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        showNotification('Error inicializando el sistema', 'error');
    }
});

console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   ====================================
`);
