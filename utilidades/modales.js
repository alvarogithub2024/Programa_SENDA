/**
 * SISTEMA DE MODALES
 * Maneja la apertura, cierre y gestión de modales
 */

import { APP_CONFIG } from '../configuracion/constantes.js';
import { mostrarAdvertencia } from './notificaciones.js';

let modalStack = [];
let overlayLoading = null;

/**
 * Inicializa el sistema de modales
 */
function inicializarModales() {
    try {
        configurarEventosGlobales();
        crearOverlayLoading();
        console.log('✅ Sistema de modales inicializado');
    } catch (error) {
        console.error('❌ Error inicializando modales:', error);
    }
}

/**
 * Configura eventos globales para manejo de modales
 */
function configurarEventosGlobales() {
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalStack.length > 0) {
            const modalActivo = modalStack[modalStack.length - 1];
            cerrarModal(modalActivo);
        }
    });

    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay') && modalStack.length > 0) {
            const modalActivo = modalStack[modalStack.length - 1];
            cerrarModal(modalActivo);
        }
    });
}

/**
 * Muestra un modal
 */
function mostrarModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal no encontrado:', modalId);
            return false;
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Agregar al stack de modales
        if (!modalStack.includes(modalId)) {
            modalStack.push(modalId);
        }

        // Enfocar el primer campo de entrada
        setTimeout(() => {
            const primerInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
            if (primerInput && !primerInput.disabled) {
                primerInput.focus();
            }
        }, 100);

        if (APP_CONFIG.DEBUG_MODE) {
            console.log('🔧 Modal abierto:', modalId);
        }

        return true;

    } catch (error) {
        console.error('Error mostrando modal:', error);
        return false;
    }
}

/**
 * Cierra un modal
 */
function cerrarModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal no encontrado:', modalId);
            return false;
        }

        // Verificar si hay cambios sin guardar en formularios
        if (modalId === 'patient-modal') {
            if (!verificarCambiosFormulario(modal)) {
                return false;
            }
        }

        modal.style.display = 'none';

        // Remover del stack
        const index = modalStack.indexOf(modalId);
        if (index > -1) {
            modalStack.splice(index, 1);
        }

        // Restaurar scroll solo si no hay más modales
        if (modalStack.length === 0) {
            document.body.style.overflow = 'auto';
        }

        // Eliminar modales temporales
        if (modal.classList.contains('temp-modal')) {
            modal.remove();
        }

        if (APP_CONFIG.DEBUG_MODE) {
            console.log('🔧 Modal cerrado:', modalId);
        }

        return true;

    } catch (error) {
        console.error('Error cerrando modal:', error);
        return false;
    }
}

/**
 * Verifica si hay cambios sin guardar en formularios
 */
function verificarCambiosFormulario(modal) {
    try {
        const form = modal.querySelector('form');
        if (!form) return true;

        const formData = new FormData(form);
        let hayDatos = false;

        for (let [key, value] of formData.entries()) {
            if (value && value.toString().trim() !== '') {
                hayDatos = true;
                break;
            }
        }

        if (hayDatos) {
            const confirmar = confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.');
            if (!confirmar) {
                return false;
            }
        }

        return true;

    } catch (error) {
        console.error('Error verificando cambios en formulario:', error);
        return true;
    }
}

/**
 * Crea el overlay de loading
 */
function crearOverlayLoading() {
    if (overlayLoading) return;

    overlayLoading = document.createElement('div');
    overlayLoading.id = 'loading-overlay';
    overlayLoading.className = 'loading-overlay hidden';
    overlayLoading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-message">Cargando...</p>
        </div>
    `;

    document.body.appendChild(overlayLoading);
}

/**
 * Muestra u oculta el overlay de loading
 */
function mostrarCarga(mostrar = true, mensaje = 'Cargando...') {
    try {
        if (!overlayLoading) {
            crearOverlayLoading();
        }

        const mensajeElement = overlayLoading.querySelector('.loading-message');
        if (mensajeElement) {
            mensajeElement.textContent = mensaje;
        }

        if (mostrar) {
            overlayLoading.classList.remove('hidden');
        } else {
            overlayLoading.classList.add('hidden');
        }

    } catch (error) {
        console.error('Error con overlay de loading:', error);
    }
}

/**
 * Cierra todos los modales abiertos
 */
function cerrarTodosLosModales() {
    try {
        const modalesAbiertos = [...modalStack];
        modalesAbiertos.forEach(modalId => {
            cerrarModal(modalId);
        });

        modalStack = [];
        document.body.style.overflow = 'auto';

    } catch (error) {
        console.error('Error cerrando todos los modales:', error);
    }
}

/**
 * Verifica si hay modales abiertos
 */
function hayModalesAbiertos() {
    return modalStack.length > 0;
}

/**
 * Obtiene el modal activo
 */
function obtenerModalActivo() {
    if (modalStack.length === 0) return null;
    return modalStack[modalStack.length - 1];
}

/**
 * Crea un modal temporal
 */
function crearModalTemporal(contenidoHtml, clases = '') {
    try {
        const modalId = `temp-modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = `modal-overlay temp-modal ${clases}`;
        modal.innerHTML = contenidoHtml;

        // Agregar botón de cierre automático
        const botonCerrar = modal.querySelector('.modal-close');
        if (botonCerrar) {
            botonCerrar.addEventListener('click', () => {
                cerrarModal(modalId);
            });
        }

        document.body.appendChild(modal);
        return modalId;

    } catch (error) {
        console.error('Error creando modal temporal:', error);
        return null;
    }
}

/**
 * Redimensiona modales según el contenido
 */
function redimensionarModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const contenidoModal = modal.querySelector('.modal');
        if (!contenidoModal) return;

        const alturaVentana = window.innerHeight;
        const alturaContenido = contenidoModal.scrollHeight;

        if (alturaContenido > alturaVentana * 0.9) {
            contenidoModal.style.height = `${alturaVentana * 0.9}px`;
            contenidoModal.style.overflowY = 'auto';
        }

    } catch (error) {
        console.error('Error redimensionando modal:', error);
    }
}

export {
    inicializarModales,
    mostrarModal,
    cerrarModal,
    mostrarCarga,
    cerrarTodosLosModales,
    hayModalesAbiertos,
    obtenerModalActivo,
    crearModalTemporal,
    redimensionarModal
};
