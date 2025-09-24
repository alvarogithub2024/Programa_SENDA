/**
 * SISTEMA SENDA PUENTE ALTO - ARCHIVO PRINCIPAL
 * Inicializa y coordina todos los módulos del sistema
 */

import { APP_CONFIG } from './configuracion/constantes.js';
import { inicializarFormularios } from './formularios/formulario-paciente.js';
import { inicializarFormularioReingreso } from './formularios/formulario-reingreso.js';
import { inicializarGestorSolicitudes } from './solicitudes/gestor-solicitudes.js';
import { inicializarCalendario } from './calendario/calendario.js';
import { inicializarGestorPacientes } from './pacientes/gestor-pacientes.js';
import { inicializarSeguimiento } from './seguimiento/timeline.js';
import { inicializarTabs } from './navegacion/tabs.js';
import { inicializarEventos } from './navegacion/eventos.js';
import { inicializarNotificaciones } from './utilidades/notificaciones.js';
import { inicializarModales } from './utilidades/modales.js';
import { verificarFirebase, inicializarFirebase } from './configuracion/firebase.js';
import { inicializarAutenticacion, manejarCambioAutenticacion } from './autenticacion/sesion.js';
import { inicializarRegistro } from './autenticacion/registro.js';

// Variables globales del sistema
window.SENDASystem = {
    currentUser: null,
    currentUserData: null,
    isInitialized: false
};

/**
 * Función principal de inicialización
 */
async function inicializarSistema() {
    try {
        console.log('🚀 Iniciando Sistema SENDA Puente Alto...');
        
        // Verificar Firebase
        if (!verificarFirebase()) {
            console.error('❌ Firebase no está disponible');
            return;
        }

        // Inicializar Firebase
        await inicializarFirebase(); // inicializa Firebase primero
        inicializarAutenticacion(); // luego inicializa autenticación
        
        // Inicializar utilidades básicas
        inicializarNotificaciones();
        inicializarModales();
        
        // Inicializar autenticación
        inicializarAutenticacion();
        
        // Inicializar formularios
        inicializarFormularios();
        inicializarFormularioReingreso();
        
        // Inicializar gestores de datos
        inicializarGestorSolicitudes();
        inicializarGestorPacientes();
        inicializarSeguimiento();
        
        // Inicializar interfaz
        inicializarCalendario();
        inicializarTabs();
        
        // Inicializar eventos globales
        inicializarEventos();
        
        inicializarRegistro();
        // Marcar sistema como inicializado
        window.SENDASystem.isInitialized = true;
        
        console.log('✅ Sistema SENDA inicializado correctamente');
        
        // Debug info
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('📋 Configuración del sistema:', APP_CONFIG);
        }
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        
        // Mostrar error al usuario
        const errorContainer = document.createElement('div');
        errorContainer.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
            ">
                <h4>Error del Sistema</h4>
                <p>No se pudo inicializar el sistema SENDA. Por favor, recarga la página.</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #ef4444;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 8px;
                ">
                    Recargar
                </button>
            </div>
        `;
        document.body.appendChild(errorContainer);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializa tu sistema
    inicializarSistema();

    // Escucha el botón "Sobre el Programa"
    const aboutBtn = document.getElementById('about-program');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', function() {
            showModal('about-program-modal');
        });
    }

    // Escucha el formulario de paciente
    const patientForm = document.getElementById('patient-form');
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            mostrarExito('¡Solicitud enviada correctamente!');
            document.getElementById('patient-modal').style.display = 'none';
            patientForm.reset();
        });
    }
});

/**
 * Exportar funciones globales para compatibilidad
 */
export { inicializarSistema };

// Mensaje de bienvenida
console.log(`
   ====================================
   SISTEMA SENDA PUENTE ALTO v2.0
   Arquitectura Modular
   ====================================
`);
