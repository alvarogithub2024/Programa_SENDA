/**
 * GESTIÓN DE SESIÓN Y AUTENTICACIÓN
 * Maneja el estado de autenticación del usuario
 */

import { obtenerAuth, obtenerFirestore } from '../configuracion/firebase.js';
import { APP_CONFIG, CACHE_KEYS } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga, mostrarModal } from '../utilidades/modales.js';
import { limpiarCache, obtenerCache, establecerCache } from '../utilidades/cache.js';

let auth, db;
let currentUser = null;
let currentUserData = null;

/**
 * Inicializa el sistema de autenticación
 */
function inicializarAutenticacion() {
    try {
        auth = obtenerAuth();
        db = obtenerFirestore();

        // Escuchar cambios en el estado de autenticación
        auth.onAuthStateChanged(manejarCambioAutenticacion);

        console.log('✅ Sistema de autenticación inicializado');
    } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        throw error;
    }
}

/**
 * Maneja los cambios en el estado de autenticación
 */
async function manejarCambioAutenticacion(user) {
    try {
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('🔄 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
        }

        if (user) {
            currentUser = user;
            await cargarDatosUsuario(); // Carga datos del usuario desde Firestore
            mostrarContenidoProfesional(); // Muestra la interfaz profesional
            
            // Actualizar variables globales
            if (window.SENDASystem) {
                window.SENDASystem.currentUser = currentUser;
                window.SENDASystem.currentUserData = currentUserData;
            }
        } else {
            currentUser = null;
            currentUserData = null;
            limpiarCacheUsuario();
            mostrarContenidoPublico(); // Muestra la interfaz pública
        
            // Limpiar variables globales
            if (window.SENDASystem) {
                window.SENDASystem.currentUser = null;
                window.SENDASystem.currentUserData = null;
            }
        }
    } catch (error) {
        console.error('❌ Error en cambio de estado de autenticación:', error);
        mostrarNotificacion('Error en autenticación', 'error');
    }
}

/**
 * Carga los datos del usuario autenticado
 */
async function cargarDatosUsuario() {
    try {
        mostrarCarga(true, 'Cargando datos del usuario...');

        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar cache
        const cacheKey = `${CACHE_KEYS.USER_DATA}_${currentUser.uid}`;
        const datosCache = obtenerCache(cacheKey);
        
        if (datosCache) {
            currentUserData = datosCache;
            return;
        }

        // Cargar desde Firestore
        const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();

        if (!userDoc.exists) {
            throw new Error('No se encontraron datos del profesional');
        }

        currentUserData = userDoc.data();
        establecerCache(cacheKey, currentUserData);

        console.log('✅ Datos de usuario cargados:', currentUserData.nombre);

    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        
        if (error.code === 'permission-denied') {
            mostrarNotificacion('Sin permisos para acceder a los datos', 'error');
        } else if (error.message.includes('No se encontraron datos')) {
            mostrarNotificacion('Perfil de profesional no encontrado. Contacta al administrador.', 'error');
        } else {
            mostrarNotificacion('Error al cargar datos del usuario: ' + error.message, 'error');
        }

        await cerrarSesion();
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Cierra la sesión del usuario
 */
async function cerrarSesion() {
    try {
        console.log('🚪 Cerrando sesión...');
        
        mostrarCarga(true, 'Cerrando sesión...');
        
        await auth.signOut();
        
        currentUser = null;
        currentUserData = null;
        limpiarCacheUsuario();
        
        mostrarNotificacion('Sesión cerrada correctamente', 'success');
        mostrarContenidoPublico();
        
        console.log('✅ Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante logout:', error);
        mostrarNotificacion('Error al cerrar sesión: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Limpia el cache del usuario
 */
function limpiarCacheUsuario() {
    try {
        // Limpiar datos específicos del usuario
        const keysToDelete = [
            CACHE_KEYS.USER_DATA,
            CACHE_KEYS.SOLICITUDES,
            CACHE_KEYS.PACIENTES,
            CACHE_KEYS.PROFESIONALES,
            CACHE_KEYS.CITAS
        ];

        keysToDelete.forEach(key => limpiarCache(key));

        // Limpiar contenedores de la interfaz
        const containers = [
            'requests-container',
            'patients-grid',
            'appointments-list',
            'upcoming-appointments-grid',
            'patients-timeline'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        });

    } catch (error) {
        console.error('Error limpiando cache del usuario:', error);
    }
}

/**
 * Muestra el contenido público (no autenticado)
 */
function mostrarContenidoPublico() {
    try {
        const publicContent = document.getElementById('public-content');
        const professionalContent = document.getElementById('professional-content');
        const professionalHeader = document.getElementById('professional-header');
        const loginBtn = document.getElementById('login-professional');
        const logoutBtn = document.getElementById('logout-btn');

        if (publicContent) publicContent.style.display = 'block';
        if (professionalContent) professionalContent.style.display = 'none';
        if (professionalHeader) professionalHeader.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';

        console.log('📄 Mostrando contenido público');
    } catch (error) {
        console.error('Error mostrando contenido público:', error);
    }
}

/**
 * Muestra el contenido profesional (autenticado)
 */
function mostrarContenidoProfesional() {
    try {
        const publicContent = document.getElementById('public-content');
        const professionalContent = document.getElementById('professional-content');
        const professionalHeader = document.getElementById('professional-header');
        const loginBtn = document.getElementById('login-professional');
        const logoutBtn = document.getElementById('logout-btn');

        if (publicContent) publicContent.style.display = 'none';
        if (professionalContent) professionalContent.style.display = 'block';
        if (professionalHeader) professionalHeader.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';

        if (currentUserData) {
            actualizarInfoProfesional();
            actualizarVisibilidadTabs();
        }

        console.log('👨‍⚕️ Mostrando contenido profesional');
    } catch (error) {
        console.error('Error mostrando contenido profesional:', error);
    }
}

/**
 * Actualiza la información del profesional en la interfaz
 */
function actualizarInfoProfesional() {
    try {
        const professionalName = document.getElementById('professional-name');
        const professionalProfession = document.getElementById('professional-profession');
        const professionalCesfam = document.getElementById('professional-cesfam');

        if (professionalName) {
            professionalName.textContent = `${currentUserData.nombre} ${currentUserData.apellidos}`;
        }

        if (professionalProfession) {
            professionalProfession.textContent = obtenerNombreProfesion(currentUserData.profession);
        }

        if (professionalCesfam) {
            professionalCesfam.textContent = currentUserData.cesfam;
        }

        const avatar = document.querySelector('.professional-avatar');
        if (avatar) {
            const initials = `${currentUserData.nombre.charAt(0)}${currentUserData.apellidos.charAt(0)}`.toUpperCase();
            avatar.textContent = initials;
        }

    } catch (error) {
        console.error('Error actualizando información del profesional:', error);
    }
}

/**
 * Actualiza la visibilidad de las tabs según los permisos del usuario
 */
function actualizarVisibilidadTabs() {
    try {
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => {
            const tabName = btn.dataset.tab;
            if (puedeAccederTab(tabName)) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    // Activar tab por defecto
                    const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
                    const agendaPane = document.getElementById('agenda-tab');
                    if (agendaTab && agendaPane) {
                        agendaTab.classList.add('active');
                        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                        agendaPane.classList.add('active');
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error actualizando visibilidad de tabs:', error);
    }
}

/**
 * Verifica si el usuario tiene acceso a solicitudes
 */
function tieneAccesoSolicitudes() {
    if (!currentUserData) return false;
    return currentUserData.profession === 'asistente_social';
}

/**
 * Verifica si el usuario puede acceder a una tab específica
 */
function puedeAccederTab(tabName) {
    if (!currentUserData) return false;

    switch (tabName) {
        case 'solicitudes':
            return currentUserData.profession === 'asistente_social';
        case 'agenda':
        case 'seguimiento':
        case 'pacientes':
            return true;
        default:
            return false;
    }
}

/**
 * Obtiene el nombre legible de la profesión
 */
function obtenerNombreProfesion(profession) {
    const nombres = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional',
        'coordinador': 'Coordinador Regional',
        'admin': 'Administrador'
    };
    return nombres[profession] || profession;
}

/**
 * Obtiene el usuario actual
 */
function obtenerUsuarioActual() {
    return currentUser;
}

/**
 * Obtiene los datos del usuario actual
 */
function obtenerDatosUsuarioActual() {
    return currentUserData;
}

/**
 * Verifica si el usuario está autenticado
 */
function estaAutenticado() {
    return currentUser !== null;
}

export {
    inicializarAutenticacion,
    cerrarSesion,
    obtenerUsuarioActual,
    obtenerDatosUsuarioActual,
    estaAutenticado,
    tieneAccesoSolicitudes,
    puedeAccederTab,
    obtenerNombreProfesion,
    mostrarContenidoPublico,
    mostrarContenidoProfesional
};
