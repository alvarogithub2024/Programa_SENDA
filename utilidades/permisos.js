// UTILIDADES/PERMISOS.JS - Sistema de permisos para roles

// Configuración de permisos por rol
const PERMISOS_POR_ROL = {
    'medico': {
        editarHistorial: true,
        eliminarHistorial: true,
        crearAtenciones: true,
        verPacientes: true,
        agendarCitas: true,
        gestionarSolicitudes: false
    },
    'psicologo': {
        editarHistorial: true,
        eliminarHistorial: true,
        crearAtenciones: true,
        verPacientes: true,
        agendarCitas: true,
        gestionarSolicitudes: false
    },
    'terapeuta': {
        editarHistorial: true,
        eliminarHistorial: true,
        crearAtenciones: true,
        verPacientes: true,
        agendarCitas: true,
        gestionarSolicitudes: false
    },
    'asistente_social': {
        editarHistorial: false,
        eliminarHistorial: false,
        crearAtenciones: false,
        verPacientes: true,
        agendarCitas: true,
        gestionarSolicitudes: true
    }
};

// Variable global para almacenar el rol actual
let rolActual = null;

/**
 * Inicializa el sistema de permisos
 */
function inicializarSistemaPermisos() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                obtenerRolUsuario(user.uid).then(rol => {
                    rolActual = rol;
                    console.log('🔐 Rol detectado:', rol);
                    // Aplicar permisos a la UI
                    aplicarPermisosUI();
                });
            } else {
                rolActual = null;
            }
        });
    }
}

/**
 * Obtiene el rol del usuario desde Firestore
 */
function obtenerRolUsuario(uid) {
    return new Promise((resolve) => {
        if (!window.getFirestore) {
            resolve(null);
            return;
        }
        
        const db = window.getFirestore();
        db.collection('profesionales').doc(uid).get()
            .then(doc => {
                if (doc.exists) {
                    const profesional = doc.data();
                    resolve(profesional.profession || null);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('Error obteniendo rol del usuario:', error);
                resolve(null);
            });
    });
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
function tienePermiso(permiso) {
    if (!rolActual || !PERMISOS_POR_ROL[rolActual]) {
        return false;
    }
    return PERMISOS_POR_ROL[rolActual][permiso] === true;
}

/**
 * Verifica permisos específicos para historial clínico
 */
function puedeEditarHistorial() {
    return tienePermiso('editarHistorial');
}

function puedeEliminarHistorial() {
    return tienePermiso('eliminarHistorial');
}

function puedeCrearAtenciones() {
    return tienePermiso('crearAtenciones');
}

function puedeGestionarSolicitudes() {
    return tienePermiso('gestionarSolicitudes');
}

/**
 * Aplica los permisos a la interfaz de usuario
 */
function aplicarPermisosUI() {
    // Aplicar permisos a elementos del historial clínico
    aplicarPermisosHistorial();
    
    // Aplicar permisos a navegación
    aplicarPermisosNavegacion();
    
    // Aplicar permisos a botones de acción
    aplicarPermisosBotones();
}

/**
 * Aplica permisos específicos al historial clínico
 */
function aplicarPermisosHistorial() {
    const historialContainer = document.getElementById('historial-clinico');
    if (historialContainer) {
        if (!puedeEditarHistorial()) {
            historialContainer.classList.add('historial-readonly');
        } else {
            historialContainer.classList.remove('historial-readonly');
        }
    }
    
    // Ocultar/mostrar botones de agregar atención
    const botonesAgregar = document.querySelectorAll('.btn-add-entry');
    botonesAgregar.forEach(btn => {
        if (puedeCrearAtenciones()) {
            btn.style.display = 'inline-flex';
        } else {
            btn.style.display = 'none';
        }
    });
}

/**
 * Aplica permisos a la navegación
 */
function aplicarPermisosNavegacion() {
    // Mostrar/ocultar pestaña de solicitudes
    const tabSolicitudes = document.querySelector('.tab-btn[data-tab="solicitudes"]');
    if (tabSolicitudes) {
        if (puedeGestionarSolicitudes()) {
            tabSolicitudes.style.display = 'flex';
        } else {
            tabSolicitudes.style.display = 'none';
        }
    }
}

/**
 * Aplica permisos a botones específicos
 */
function aplicarPermisosBotones() {
    // Botones de editar/eliminar en historial
    const botonesEdicion = document.querySelectorAll('.btn-entry-action.edit, .btn-entry-action.delete');
    botonesEdicion.forEach(btn => {
        if (btn.classList.contains('edit') && !puedeEditarHistorial()) {
            btn.style.display = 'none';
        }
        if (btn.classList.contains('delete') && !puedeEliminarHistorial()) {
            btn.style.display = 'none';
        }
    });
}

/**
 * Muestra mensaje de permisos insuficientes
 */
function mostrarMensajePermisos(accion) {
    const mensaje = `No tienes permisos para ${accion}. Esta función está restringida a: ${
        obtenerRolesConPermiso(accion).join(', ')
    }`;
    
    if (window.showNotification) {
        window.showNotification(mensaje, 'warning');
    } else {
        alert(mensaje);
    }
}

/**
 * Obtiene los roles que tienen un permiso específico
 */
function obtenerRolesConPermiso(permiso) {
    const roles = [];
    const traduccionRoles = {
        'medico': 'Médicos',
        'psicologo': 'Psicólogos', 
        'terapeuta': 'Terapeutas Ocupacionales',
        'asistente_social': 'Asistentes Sociales'
    };
    
    Object.keys(PERMISOS_POR_ROL).forEach(rol => {
        if (PERMISOS_POR_ROL[rol][permiso]) {
            roles.push(traduccionRoles[rol] || rol);
        }
    });
    
    return roles;
}

/**
 * Wrapper para funciones que requieren permisos
 */
function conPermiso(permiso, funcion, mensajeError) {
    return function(...args) {
        if (tienePermiso(permiso)) {
            return funcion.apply(this, args);
        } else {
            mostrarMensajePermisos(mensajeError || permiso);
            return false;
        }
    };
}

/**
 * Decorador para métodos que requieren permisos específicos
 */
function requierePermiso(permiso, mensajeError) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function(...args) {
            if (tienePermiso(permiso)) {
                return originalMethod.apply(this, args);
            } else {
                mostrarMensajePermisos(mensajeError || permiso);
                return false;
            }
        };
        
        return descriptor;
    };
}

// Funciones wrapper para acciones específicas
const editarAtencionConPermiso = conPermiso('editarHistorial', function(atencionId, descripcion, tipo, rutPaciente) {
    if (window.abrirModalEditarAtencion) {
        window.abrirModalEditarAtencion(atencionId, descripcion, tipo, rutPaciente);
    }
}, 'editar atenciones del historial clínico');

const eliminarAtencionConPermiso = conPermiso('eliminarHistorial', function(atencionId, rutPaciente) {
    if (window.eliminarAtencionDesdeModal) {
        window.eliminarAtencionDesdeModal(atencionId, rutPaciente);
    }
}, 'eliminar atenciones del historial clínico');

const crearAtencionConPermiso = conPermiso('crearAtenciones', function(rutPaciente) {
    if (window.mostrarFormularioNuevaAtencion) {
        window.mostrarFormularioNuevaAtencion(rutPaciente);
    }
}, 'crear nuevas atenciones');

// Exportar funciones globalmente
window.inicializarSistemaPermisos = inicializarSistemaPermisos;
window.tienePermiso = tienePermiso;
window.puedeEditarHistorial = puedeEditarHistorial;
window.puedeEliminarHistorial = puedeEliminarHistorial;
window.puedeCrearAtenciones = puedeCrearAtenciones;
window.puedeGestionarSolicitudes = puedeGestionarSolicitudes;
window.aplicarPermisosUI = aplicarPermisosUI;
window.mostrarMensajePermisos = mostrarMensajePermisos;
window.editarAtencionConPermiso = editarAtencionConPermiso;
window.eliminarAtencionConPermiso = eliminarAtencionConPermiso;
window.crearAtencionConPermiso = crearAtencionConPermiso;
window.rolActual = function() { return rolActual; };

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistemaPermisos();
});

console.log('🔐 Sistema de permisos cargado correctamente');
