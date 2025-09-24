/**
 * ATAJOS DE TECLADO
 * Sistema avanzado de shortcuts para navegación rápida
 */

import { navegarATab } from './tabs.js';
import { mostrarModal, cerrarModal } from '../utilidades/modales.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { estaAutenticado } from '../autenticacion/sesion.js';

let shortcutsActivos = true;
let modoAyuda = false;

/**
 * Mapa de atajos de teclado
 */
const SHORTCUTS = {
    // Navegación global
    'ctrl+1': { accion: () => navegarATab('solicitudes'), descripcion: 'Ir a Solicitudes', requiereAuth: true },
    'ctrl+2': { accion: () => navegarATab('agenda'), descripcion: 'Ir a Agenda', requiereAuth: true },
    'ctrl+3': { accion: () => navegarATab('seguimiento'), descripcion: 'Ir a Seguimiento', requiereAuth: true },
    'ctrl+4': { accion: () => navegarATab('pacientes'), descripcion: 'Ir a Pacientes', requiereAuth: true },
    
    // Modales y formularios
    'ctrl+n': { accion: abrirNuevaSolicitud, descripcion: 'Nueva solicitud de paciente' },
    'ctrl+r': { accion: () => mostrarModal('reentry-modal'), descripcion: 'Nueva solicitud de reingreso' },
    'ctrl+l': { accion: () => mostrarModal('login-modal'), descripcion: 'Abrir login', requiereNoAuth: true },
    'escape': { accion: cerrarModalActual, descripcion: 'Cerrar modal actual' },
    
    // Búsqueda y filtros
    'ctrl+f': { accion: enfocarBusqueda, descripcion: 'Buscar pacientes' },
    'ctrl+shift+f': { accion: abrirBusquedaAvanzada, descripcion: 'Búsqueda avanzada', requiereAuth: true },
    'ctrl+shift+c': { accion: limpiarFiltros, descripcion: 'Limpiar filtros', requiereAuth: true },
    
    // Calendario y citas
    'ctrl+shift+n': { accion: nuevaCita, descripcion: 'Nueva cita', requiereAuth: true },
    'ctrl+t': { accion: irAHoy, descripcion: 'Ir a hoy en calendario', requiereAuth: true },
    'ctrl+left': { accion: mesAnterior, descripcion: 'Mes anterior', requiereAuth: true },
    'ctrl+right': { accion: mesSiguiente, descripcion: 'Mes siguiente', requiereAuth: true },
    
    // Utilidades
    'ctrl+p': { accion: imprimir, descripcion: 'Imprimir página actual' },
    'f1': { accion: mostrarAyuda, descripcion: 'Mostrar ayuda' },
    'ctrl+h': { accion: toggleAyudaVisual, descripcion: 'Alternar ayuda visual' },
    'ctrl+shift+k': { accion: toggleShortcuts, descripcion: 'Activar/desactivar atajos' },
    
    // Acciones rápidas
    'ctrl+s': { accion: guardarRapido, descripcion: 'Guardar rápido', requiereAuth: true },
    'ctrl+shift+r': { accion: recargarDatos, descripcion: 'Recargar datos', requiereAuth: true },
    'alt+enter': { accion: accionRapida, descripcion: 'Acción contextual rápida' }
};

/**
 * Inicializa el sistema de atajos de teclado
 */
function inicializarShortcuts() {
    try {
        document.addEventListener('keydown', manejarAtajoTeclado);
        crearIndicadorShortcuts();
        
        // Mostrar shortcuts disponibles al usuario autenticado
        if (estaAutenticado()) {
            setTimeout(() => {
                mostrarNotificacion('Presiona Ctrl+H para ver atajos de teclado disponibles', 'info', 3000);
            }, 2000);
        }
        
        console.log('✅ Atajos de teclado inicializados');
    } catch (error) {
        console.error('❌ Error inicializando atajos de teclado:', error);
    }
}

/**
 * Maneja los eventos de teclado
 */
function manejarAtajoTeclado(e) {
    if (!shortcutsActivos) return;
    
    // No procesar shortcuts si el usuario está escribiendo
    if (estaEscribiendo(e.target)) return;
    
    const shortcut = construirStringShortcut(e);
    const comando = SHORTCUTS[shortcut];
    
    if (comando) {
        // Verificar requisitos de autenticación
        if (comando.requiereAuth && !estaAutenticado()) return;
        if (comando.requiereNoAuth && estaAutenticado()) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        try {
            comando.accion();
            
            if (modoAyuda) {
                mostrarNotificacion(`Ejecutado: ${comando.descripcion}`, 'success', 2000);
            }
        } catch (error) {
            console.error('Error ejecutando shortcut:', error);
            mostrarNotificacion('Error ejecutando atajo de teclado', 'error');
        }
    }
    
    // Mostrar ayuda visual si está activa
    if (modoAyuda && !comando) {
        mostrarAyudaVisual(shortcut);
    }
}

/**
 * Construye la string del shortcut desde el evento
 */
function construirStringShortcut(e) {
    const partes = [];
    
    if (e.ctrlKey || e.metaKey) partes.push('ctrl');
    if (e.altKey) partes.push('alt');
    if (e.shiftKey) partes.push('shift');
    
    // Manejar teclas especiales
    if (e.key === 'Escape') {
        partes.push('escape');
    } else if (e.key === 'F1') {
        partes.push('f1');
    } else if (e.key === 'ArrowLeft') {
        partes.push('left');
    } else if (e.key === 'ArrowRight') {
        partes.push('right');
    } else if (e.key === 'Enter') {
        partes.push('enter');
    } else if (e.key.length === 1) {
        partes.push(e.key.toLowerCase());
    }
    
    return partes.join('+');
}

/**
 * Verifica si el usuario está escribiendo
 */
function estaEscribiendo(elemento) {
    const tags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return tags.includes(elemento.tagName) || 
           elemento.contentEditable === 'true' ||
           elemento.isContentEditable;
}

/**
 * FUNCIONES DE ACCIÓN PARA SHORTCUTS
 */

function abrirNuevaSolicitud() {
    import('../formularios/formulario-paciente.js')
        .then(modulo => {
            modulo.resetearFormulario();
            mostrarModal('patient-modal');
        })
        .catch(error => console.error('Error abriendo nueva solicitud:', error));
}

function cerrarModalActual() {
    const modalAbierto = document.querySelector('.modal-overlay[style*="flex"]');
    if (modalAbierto) {
        cerrarModal(modalAbierto.id);
    }
}

function enfocarBusqueda() {
    const campoBusqueda = document.getElementById('search-pacientes-rut');
    if (campoBusqueda) {
        campoBusqueda.focus();
        campoBusqueda.select();
    }
}

function abrirBusquedaAvanzada() {
    import('../pacientes/busqueda.js')
        .then(modulo => modulo.mostrarBusquedaAvanzada())
        .catch(error => console.error('Error abriendo búsqueda avanzada:', error));
}

function limpiarFiltros() {
    import('../solicitudes/filtros.js')
        .then(modulo => modulo.limpiarTodosFiltros())
        .catch(error => console.error('Error limpiando filtros:', error));
}

function nuevaCita() {
    import('../calendario/citas.js')
        .then(modulo => modulo.crearModalNuevaCita())
        .catch(error => console.error('Error creando nueva cita:', error));
}

function irAHoy() {
    import('../calendario/calendario.js')
        .then(modulo => modulo.cargarCitasHoy())
        .catch(error => console.error('Error yendo a hoy:', error));
}

function mesAnterior() {
    import('../calendario/calendario.js')
        .then(modulo => modulo.navegarMesAnterior())
        .catch(error => console.error('Error navegando mes anterior:', error));
}

function mesSiguiente() {
    import('../calendario/calendario.js')
        .then(modulo => modulo.navegarMesSiguiente())
        .catch(error => console.error('Error navegando mes siguiente:', error));
}

function imprimir() {
    window.print();
}

function guardarRapido() {
    // Buscar formularios activos y guardar borradores
    const formularios = ['patient-form', 'reentry-form'];
    let guardado = false;
    
    formularios.forEach(id => {
        const form = document.getElementById(id);
        if (form && form.offsetParent !== null) {
            // Formulario visible, intentar guardar
            const evento = new Event('input');
            form.dispatchEvent(evento);
            guardado = true;
        }
    });
    
    if (guardado) {
        mostrarNotificacion('Borrador guardado', 'success', 2000);
    } else {
        mostrarNotificacion('No hay formularios activos para guardar', 'info', 2000);
    }
}

function recargarDatos() {
    import('./tabs.js')
        .then(modulo => {
            const tabActiva = modulo.obtenerTabActiva();
            modulo.actualizarTab(tabActiva);
            mostrarNotificacion('Datos recargados', 'success', 2000);
        })
        .catch(error => console.error('Error recargando datos:', error));
}

function accionRapida() {
    // Acción contextual según donde esté el usuario
    import('./tabs.js')
        .then(modulo => {
            const tabActiva = modulo.obtenerTabActiva();
            switch (tabActiva) {
                case 'solicitudes':
                    limpiarFiltros();
                    break;
                case 'agenda':
                    nuevaCita();
                    break;
                case 'pacientes':
                    enfocarBusqueda();
                    break;
                default:
                    mostrarAyuda();
            }
        });
}

/**
 * FUNCIONES DE AYUDA
 */

function mostrarAyuda() {
    const modalHTML = crearModalAyuda();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('shortcuts-help-modal');
}

function crearModalAyuda() {
    const shortcuts = Object.entries(SHORTCUTS);
    const shortcutsHTML = shortcuts
        .filter(([_, comando]) => {
            if (comando.requiereAuth && !estaAutenticado()) return false;
            if (comando.requiereNoAuth && estaAutenticado()) return false;
            return true;
        })
        .map(([shortcut, comando]) => `
            <tr>
                <td><code>${shortcut.replace(/ctrl/g, 'Ctrl').replace(/shift/g, 'Shift').replace(/alt/g, 'Alt')}</code></td>
                <td>${comando.descripcion}</td>
            </tr>
        `).join('');

    return `
        <div class="modal-overlay temp-modal" id="shortcuts-help-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('shortcuts-help-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-keyboard"></i> Atajos de Teclado</h2>
                    
                    <div style="margin-bottom: 20px;">
                        <p>Usa estos atajos para navegar más rápido por el sistema:</p>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--light-blue);">
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Atajo</th>
                                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Acción</th>
                            </tr>
                        </thead>
