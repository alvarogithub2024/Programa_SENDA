// UTILIDADES/PERMISOS.JS - Sistema de permisos para roles (VERSIÓN CORREGIDA)

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
let usuarioActual = null;
let sistemaInicializado = false;

/**
 * Inicializa el sistema de permisos
 */
function inicializarSistemaPermisos() {
    console.log('🔐 Inicializando sistema de permisos...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            usuarioActual = user;
            console.log('👤 Estado de autenticación cambiado:', user ? 'Logueado' : 'Deslogueado');
            
            if (user) {
                console.log('🔍 Obteniendo rol para usuario:', user.uid);
                obtenerRolUsuario(user.uid).then(rol => {
                    rolActual = rol;
                    console.log('🎭 Rol obtenido:', rol);
                    
                    if (!sistemaInicializado) {
                        sistemaInicializado = true;
                        console.log('🔐 Sistema de permisos inicializado');
                    }
                    
                    // Aplicar permisos a la UI con delay para asegurar que DOM esté listo
                    setTimeout(() => {
                        aplicarPermisosUI();
                    }, 100);
                    
                    // Notificar al sistema global
                    if (window.setCurrentUserData) {
                        window.setCurrentUserData({ profession: rol });
                    }
                }).catch(error => {
                    console.error('❌ Error obteniendo rol:', error);
                    rolActual = null;
                });
            } else {
                rolActual = null;
                usuarioActual = null;
                console.log('🚪 Usuario deslogueado, limpiando permisos');
                
                if (window.setCurrentUserData) {
                    window.setCurrentUserData(null);
                }
            }
        });
    } else {
        console.warn('⚠️ Firebase no está disponible para el sistema de permisos');
    }
}

/**
 * Obtiene el rol del usuario desde Firestore con reintentos
 */
function obtenerRolUsuario(uid) {
    return new Promise((resolve, reject) => {
        if (!window.getFirestore) {
            console.error('❌ getFirestore no está disponible');
            resolve(null);
            return;
        }
        
        const db = window.getFirestore();
        console.log('📊 Consultando Firestore para UID:', uid);
        
        db.collection('profesionales').doc(uid).get()
            .then(doc => {
                if (doc.exists) {
                    const profesional = doc.data();
                    const rol = profesional.profession;
                    console.log('✅ Datos del profesional obtenidos:', profesional);
                    console.log('🎭 Rol detectado:', rol);
                    resolve(rol || null);
                } else {
                    console.warn('⚠️ No se encontró documento del profesional en Firestore');
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('❌ Error consultando Firestore:', error);
                
                // Reintentar una vez después de 1 segundo
                setTimeout(() => {
                    console.log('🔄 Reintentando obtener rol...');
                    db.collection('profesionales').doc(uid).get()
                        .then(doc => {
                            if (doc.exists) {
                                const profesional = doc.data();
                                const rol = profesional.profession;
                                console.log('✅ Rol obtenido en segundo intento:', rol);
                                resolve(rol || null);
                            } else {
                                console.warn('⚠️ Usuario no encontrado en segundo intento');
                                resolve(null);
                            }
                        })
                        .catch(error2 => {
                            console.error('❌ Error en segundo intento:', error2);
                            resolve(null);
                        });
                }, 1000);
            });
    });
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
function tienePermiso(permiso) {
    if (!rolActual || !PERMISOS_POR_ROL[rolActual]) {
        console.log(`🚫 Sin permiso "${permiso}" - Rol actual: ${rolActual}`);
        return false;
    }
    const tiene = PERMISOS_POR_ROL[rolActual][permiso] === true;
    console.log(`${tiene ? '✅' : '❌'} Permiso "${permiso}" para rol "${rolActual}": ${tiene}`);
    return tiene;
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
    console.log('🎨 Aplicando permisos a la UI...');
    
    // Aplicar permisos a elementos del historial clínico
    aplicarPermisosHistorial();
    
    // Aplicar permisos a navegación
    aplicarPermisosNavegacion();
    
    // Aplicar permisos a botones de acción
    aplicarPermisosBotones();
    
    console.log('✅ Permisos UI aplicados');
}

/**
 * Aplica permisos específicos al historial clínico
 */
function aplicarPermisosHistorial() {
    const historialContainer = document.getElementById('historial-clinico');
    if (historialContainer) {
        if (!puedeEditarHistorial()) {
            historialContainer.classList.add('historial-readonly');
            console.log('🔒 Historial marcado como solo lectura');
        } else {
            historialContainer.classList.remove('historial-readonly');
            console.log('✏️ Historial marcado como editable');
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
    
    console.log(`📝 Encontrados ${botonesAgregar.length} botones de agregar entrada`);
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
            console.log('📋 Pestaña solicitudes habilitada');
        } else {
            tabSolicitudes.style.display = 'none';
            console.log('📋 Pestaña solicitudes oculta');
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
    
    console.log(`🔧 Procesados ${botonesEdicion.length} botones de edición`);
}

/**
 * Muestra mensaje de permisos insuficientes
 */
function mostrarMensajePermisos(accion) {
    const rolesPermitidos = obtenerRolesConPermiso(accion);
    const mensaje = `No tienes permisos para ${accion}. Esta función está restringida a: ${rolesPermitidos.join(', ')}`;
    
    console.warn('🚫 Permiso denegado:', mensaje);
    
    if (window.showNotification) {
        window.showNotification(mensaje, 'warning');
    } else {
        alert(mensaje);
    }
}

/**
 * Obtiene los roles que tienen un permiso específico
 */
function obtenerRolesConPermiso(accionOPermiso) {
    const roles = [];
    const traduccionRoles = {
        'medico': 'Médicos',
        'psicologo': 'Psicólogos', 
        'terapeuta': 'Terapeutas Ocupacionales',
        'asistente_social': 'Asistentes Sociales'
    };
    
    // Mapear acciones a permisos
    const mapeoPermisos = {
        'editar atenciones del historial clínico': 'editarHistorial',
        'eliminar atenciones del historial clínico': 'eliminarHistorial',
        'crear nuevas atenciones': 'crearAtenciones',
        'gestionar solicitudes': 'gestionarSolicitudes'
    };
    
    const permiso = mapeoPermisos[accionOPermiso] || accionOPermiso;
    
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
 * Función para forzar recarga de permisos
 */
function recargarPermisos() {
    console.log('🔄 Forzando recarga de permisos...');
    if (usuarioActual) {
        obtenerRolUsuario(usuarioActual.uid).then(rol => {
            rolActual = rol;
            console.log('🔄 Rol recargado:', rol);
            aplicarPermisosUI();
        });
    }
}

/**
 * Debug y diagnóstico
 */
function diagnosticarPermisos() {
    console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE PERMISOS');
    console.log('=====================================');
    console.log('Usuario actual:', usuarioActual);
    console.log('UID:', usuarioActual?.uid || 'Sin UID');
    console.log('Rol actual:', rolActual);
    console.log('Sistema inicializado:', sistemaInicializado);
    console.log('Firebase disponible:', typeof firebase !== 'undefined');
    console.log('getFirestore disponible:', typeof window.getFirestore !== 'undefined');
    console.log('Permisos:');
    console.log('- Editar historial:', puedeEditarHistorial());
    console.log('- Eliminar historial:', puedeEliminarHistorial());
    console.log('- Crear atenciones:', puedeCrearAtenciones());
    console.log('- Gestionar solicitudes:', puedeGestionarSolicitudes());
    console.log('=====================================');
    
    if (usuarioActual && !rolActual) {
        console.log('🔄 Intentando recargar rol...');
        recargarPermisos();
    }
}

// Exportar funciones globalmente
window.inicializarSistemaPermisos = inicializarSistemaPermisos;
window.tienePermiso = tienePermiso;
window.puedeEditarHistorial = puedeEditarHistorial;
window.puedeEliminarHistorial = puedeEliminarHistorial;
window.puedeCrearAtenciones = puedeCrearAtenciones;
window.puedeGestionarSolicitudes = puedeGestionarSolicitudes;
window.aplicarPermisosUI = aplicarPermisosUI;
window.mostrarMensajePermisos = mostrarMensajePermisos;
window.recargarPermisos = recargarPermisos;
window.diagnosticarPermisos = diagnosticarPermisos;
window.rolActual = function() { return rolActual; };

// Funciones de debug mejoradas
window.SENDA_PERMISOS_DEBUG = {
    getRol: () => rolActual,
    getUsuario: () => usuarioActual,
    isInicializado: () => sistemaInicializado,
    diagnosticar: diagnosticarPermisos,
    recargar: recargarPermisos,
    testPermiso: (permiso) => {
        console.log(`Testing permiso "${permiso}":`, tienePermiso(permiso));
        return tienePermiso(permiso);
    }
};

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando permisos...');
    inicializarSistemaPermisos();
    
    // Debug automático después de 3 segundos
    setTimeout(() => {
        if (!rolActual && usuarioActual) {
            console.log('⚠️ No se pudo obtener el rol después de 3 segundos, ejecutando diagnóstico...');
            diagnosticarPermisos();
        }
    }, 3000);
});

console.log('🔐 Sistema de permisos cargado correctamente');
