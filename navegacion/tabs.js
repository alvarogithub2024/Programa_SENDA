/**
 * SISTEMA DE NAVEGACIÓN POR TABS
 * Maneja la navegación entre las diferentes secciones del sistema
 */

import { puedeAccederTab, obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';

let tabActiva = 'agenda';
let historialTabs = [];

/**
 * Inicializa el sistema de tabs
 */
function inicializarTabs() {
    try {
        configurarEventosNavegacion();
        establecerTabPorDefecto();
        console.log('✅ Sistema de navegación inicializado');
    } catch (error) {
        console.error('❌ Error inicializando navegación:', error);
        throw error;
    }
}

/**
 * Configura los event listeners para navegación
 */
function configurarEventosNavegacion() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = btn.dataset.tab;
            navegarATab(targetTab);
        });
    });

    // Navegación con teclado
    document.addEventListener('keydown', manejarAtajosTeclado);
}

/**
 * Navega a una tab específica
 */
function navegarATab(nombreTab) {
    try {
        // Verificar permisos
        if (!puedeAccederTab(nombreTab)) {
            mostrarNotificacion('No tienes permisos para acceder a esta sección', 'warning');
            return false;
        }

        // Verificar si la tab existe
        const tabPane = document.getElementById(`${nombreTab}-tab`);
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${nombreTab}"]`);
        
        if (!tabPane || !tabBtn) {
            console.error(`Tab no encontrada: ${nombreTab}`);
            return false;
        }

        // Desactivar tab actual
        desactivarTabActual();

        // Activar nueva tab
        activarTab(nombreTab, tabBtn, tabPane);

        // Cargar datos de la nueva tab
        cargarDatosTab(nombreTab);

        // Actualizar historial
        actualizarHistorialNavegacion(nombreTab);

        return true;

    } catch (error) {
        console.error('Error navegando a tab:', error);
        return false;
    }
}

/**
 * Desactiva la tab actualmente activa
 */
function desactivarTabActual() {
    // Desactivar botones
    const tabsActivos = document.querySelectorAll('.tab-btn.active');
    tabsActivos.forEach(tab => tab.classList.remove('active'));

    // Desactivar paneles
    const panesActivos = document.querySelectorAll('.tab-pane.active');
    panesActivos.forEach(pane => pane.classList.remove('active'));
}

/**
 * Activa una tab específica
 */
function activarTab(nombreTab, tabBtn, tabPane) {
    tabBtn.classList.add('active');
    tabPane.classList.add('active');
    tabActiva = nombreTab;

    // Actualizar título de página si es necesario
    actualizarTituloPagina(nombreTab);

    // Trigger evento personalizado
    const evento = new CustomEvent('tabChanged', {
        detail: { 
            tab: nombreTab,
            previous: historialTabs[historialTabs.length - 1] 
        }
    });
    document.dispatchEvent(evento);

    console.log(`📑 Navegado a tab: ${nombreTab}`);
}

/**
 * Carga datos específicos de la tab
 */
function cargarDatosTab(nombreTab) {
    const userData = obtenerDatosUsuarioActual();
    if (!userData) return;

    switch (nombreTab) {
        case 'solicitudes':
            import('../solicitudes/gestor-solicitudes.js')
                .then(modulo => modulo.cargarSolicitudes())
                .catch(error => console.error('Error cargando solicitudes:', error));
            break;

        case 'agenda':
            import('../calendario/calendario.js')
                .then(modulo => {
                    modulo.cargarCitasHoy();
                    modulo.renderizarCalendario();
                })
                .catch(error => console.error('Error cargando agenda:', error));
            break;

        case 'seguimiento':
            import('../seguimiento/timeline.js')
                .then(modulo => modulo.cargarSeguimiento())
                .catch(error => console.error('Error cargando seguimiento:', error));
            break;

        case 'pacientes':
            import('../pacientes/gestor-pacientes.js')
                .then(modulo => modulo.cargarPacientes())
                .catch(error => console.error('Error cargando pacientes:', error));
            break;

        default:
            console.warn(`Carga de datos no definida para tab: ${nombreTab}`);
    }
}

/**
 * Actualiza el historial de navegación
 */
function actualizarHistorialNavegacion(nombreTab) {
    if (historialTabs[historialTabs.length - 1] !== nombreTab) {
        historialTabs.push(nombreTab);
        
        // Mantener historial de máximo 10 entradas
        if (historialTabs.length > 10) {
            historialTabs.shift();
        }
    }
}

/**
 * Establece la tab por defecto al cargar
 */
function establecerTabPorDefecto() {
    const userData = obtenerDatosUsuarioActual();
    
    if (!userData) {
        // Usuario no autenticado, no hacer nada
        return;
    }

    // Determinar tab inicial basado en el rol
    let tabInicial = 'agenda'; // Por defecto

    if (userData.profession === 'asistente_social') {
        tabInicial = 'solicitudes';
    }

    // Verificar si existe parámetro en URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabUrl = urlParams.get('tab');
    
    if (tabUrl && puedeAccederTab(tabUrl)) {
        tabInicial = tabUrl;
    }

    navegarATab(tabInicial);
}

/**
 * Maneja atajos de teclado para navegación
 */
function manejarAtajosTeclado(e) {
    // Verificar si el usuario está escribiendo en un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Ctrl/Cmd + número para cambiar tabs
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        
        const tabsDisponibles = Array.from(document.querySelectorAll('.tab-btn:not([style*="display: none"])'));
        const indiceTab = parseInt(e.key) - 1;
        
        if (tabsDisponibles[indiceTab]) {
            const nombreTab = tabsDisponibles[indiceTab].dataset.tab;
            navegarATab(nombreTab);
        }
    }

    // Alt + flecha izquierda/derecha para navegar
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        
        if (e.key === 'ArrowLeft') {
            navegarTabAnterior();
        } else {
            navegarTabSiguiente();
        }
    }
}

/**
 * Navega a la tab anterior en el historial
 */
function navegarTabAnterior() {
    if (historialTabs.length < 2) return;
    
    const tabAnterior = historialTabs[historialTabs.length - 2];
    navegarATab(tabAnterior);
}

/**
 * Navega a la siguiente tab disponible
 */
function navegarTabSiguiente() {
    const tabsVisibles = Array.from(document.querySelectorAll('.tab-btn:not([style*="display: none"])'));
    const indiceActual = tabsVisibles.findIndex(tab => tab.dataset.tab === tabActiva);
    
    const siguienteIndice = (indiceActual + 1) % tabsVisibles.length;
    const siguienteTab = tabsVisibles[siguienteIndice].dataset.tab;
    
    navegarATab(siguienteTab);
}

/**
 * Actualiza el título de la página según la tab activa
 */
function actualizarTituloPagina(nombreTab) {
    const titulos = {
        'solicitudes': 'Solicitudes - SENDA Puente Alto',
        'agenda': 'Agenda - SENDA Puente Alto',
        'seguimiento': 'Seguimiento - SENDA Puente Alto',
        'pacientes': 'Pacientes - SENDA Puente Alto'
    };
    
    const titulo = titulos[nombreTab] || 'SENDA Puente Alto';
    document.title = titulo;
}

/**
 * Obtiene la tab actualmente activa
 */
function obtenerTabActiva() {
    return tabActiva;
}

/**
 * Verifica si una tab está activa
 */
function esTabActiva(nombreTab) {
    return tabActiva === nombreTab;
}

/**
 * Fuerza la actualización de una tab específica
 */
function actualizarTab(nombreTab) {
    if (nombreTab === tabActiva) {
        cargarDatosTab(nombreTab);
    }
}

/**
 * Configura indicadores de notificación en tabs
 */
function mostrarIndicadorNotificacion(nombreTab, contador = 0) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${nombreTab}"]`);
    if (!tabBtn) return;

    let indicador = tabBtn.querySelector('.notification-badge');
    
    if (contador > 0) {
        if (!indicador) {
            indicador = document.createElement('span');
            indicador.className = 'notification-badge';
            tabBtn.appendChild(indicador);
        }
        indicador.textContent = contador > 99 ? '99+' : contador.toString();
        indicador.style.display = 'block';
    } else {
        if (indicador) {
            indicador.style.display = 'none';
        }
    }
}

/**
 * Oculta indicador de notificación
 */
function ocultarIndicadorNotificacion(nombreTab) {
    mostrarIndicadorNotificacion(nombreTab, 0);
}

export {
    inicializarTabs,
    navegarATab,
    obtenerTabActiva,
    esTabActiva,
    actualizarTab,
    mostrarIndicadorNotificacion,
    ocultarIndicadorNotificacion
};
