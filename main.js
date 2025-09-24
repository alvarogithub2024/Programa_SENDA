// src/js/main.js - Archivo principal de inicialización
import { inicializarFirebase } from './configuracion/firebase.js';
import { configurarEventos } from './navegacion/eventos.js';
import { configurarTabs } from './navegacion/tabs.js';
import { configurarCalendario } from './calendario/calendario.js';
import { configurarFormularios } from './formularios/formulario-paciente.js';
import { configurarAutenticacion } from './autenticacion/sesion.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Iniciando sistema SENDA...');
    
    // Inicializar Firebase
    await inicializarFirebase();
    
    // Configurar componentes principales
    configurarFormularios();
    configurarAutenticacion();
    configurarEventos();
    configurarTabs();
    configurarCalendario();
    
    console.log('🎉 Sistema SENDA inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    mostrarNotificacion('Error inicializando el sistema', 'error');
  }
});

// Exportar funciones globales necesarias
window.SENDA = {
  mostrarModal: (modalId) => import('./utilidades/modales.js').then(m => m.mostrarModal(modalId)),
  cerrarModal: (modalId) => import('./utilidades/modales.js').then(m => m.cerrarModal(modalId)),
  mostrarNotificacion: (msg, tipo) => import('./utilidades/notificaciones.js').then(m => m.mostrarNotificacion(msg, tipo))
};
