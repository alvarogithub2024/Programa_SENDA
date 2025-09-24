// src/js/autenticacion/sesion.js
import { auth, db } from '../configuracion/firebase.js';
import { mostrarCarga, mostrarNotificacion } from '../utilidades/notificaciones.js';
import { borrarCache } from '../utilidades/cache.js';
import { PROFESIONES } from '../configuracion/constantes.js';

let usuarioActual = null;
let datosUsuario = null;

export function configurarAutenticacion() {
  if (!auth) return;
  auth.onAuthStateChanged(manejarCambioAuth);
}

async function manejarCambioAuth(usuario) {
  try {
    if (usuario) {
      usuarioActual = usuario;
      await cargarDatosUsuario();
    } else {
      limpiarSesion();
      mostrarContenidoPublico();
    }
  } catch (error) {
    console.error('Error en cambio de autenticación:', error);
    mostrarNotificacion('Error en autenticación', 'error');
  }
}

async function cargarDatosUsuario() {
  try {
    mostrarCarga(true, 'Cargando datos del usuario...');
    
    if (!usuarioActual) throw new Error('Usuario no autenticado');

    const userDoc = await db.collection('profesionales').doc(usuarioActual.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('No se encontraron datos del profesional');
    }
    
    datosUsuario = userDoc.data();
    mostrarContenidoProfesional();
    
    // Cargar datos iniciales según la pestaña activa
    const pestanaActiva = document.querySelector('.tab-btn.active')?.dataset.tab || 'agenda';
    const { cargarDatosTab } = await import('../navegacion/tabs.js');
    await cargarDatosTab(pestanaActiva);
    
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
    
    const mensajesError = {
      'permission-denied': 'Sin permisos para acceder a los datos',
      'unavailable': 'Servicio temporalmente no disponible'
    };
    
    const mensaje = mensajesError[error.code] || 
      (error.message.includes('No se encontraron datos') ? 
        'Perfil de profesional no encontrado. Contacta al administrador.' : 
        'Error al cargar datos del usuario: ' + error.message);
    
    mostrarNotificacion(mensaje, 'error');
    await cerrarSesion();
  } finally {
    mostrarCarga(false);
  }
}

function limpiarSesion() {
  usuarioActual = null;
  datosUsuario = null;
  borrarCache();
  limpiarContenedores();
}

function limpiarContenedores() {
  const contenedores = [
    'requests-container', 'patients-grid', 'appointments-list',
    'upcoming-appointments-grid', 'patients-timeline'
  ];
  
  contenedores.forEach(id => {
    const contenedor = document.getElementById(id);
    if (contenedor) contenedor.innerHTML = '';
  });
}

function mostrarContenidoPublico() {
  const cambios = [
    ['public-content', 'block'],
    ['professional-content', 'none'],
    ['professional-header', 'none'],
    ['login-professional', 'flex'],
    ['logout-btn', 'none']
  ];
  
  aplicarCambiosVisibilidad(cambios);
}

function mostrarContenidoProfesional() {
  const cambios = [
    ['public-content', 'none'],
    ['professional-content', 'block'],
    ['professional-header', 'block'],
    ['login-professional', 'none'],
    ['logout-btn', 'flex']
  ];
  
  aplicarCambiosVisibilidad(cambios);
  
  if (datosUsuario) {
    actualizarInfoProfesional();
    actualizarVisibilidadTabs();
  }
}

function aplicarCambiosVisibilidad(cambios) {
  cambios.forEach(([id, display]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.style.display = display;
  });
}

function actualizarInfoProfesional() {
  const actualizaciones = {
    'professional-name': `${datosUsuario.nombre} ${datosUsuario.apellidos}`,
    'professional-profession': PROFESIONES[datosUsuario.profession] || datosUsuario.profession,
    'professional-cesfam': datosUsuario.cesfam
  };
  
  Object.entries(actualizaciones).forEach(([id, texto]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
  });
  
  // Avatar con iniciales
  const avatar = document.querySelector('.professional-avatar');
  if (avatar) {
    const iniciales = `${datosUsuario.nombre.charAt(0)}${datosUsuario.apellidos.charAt(0)}`.toUpperCase();
    avatar.textContent = iniciales;
  }
}

function actualizarVisibilidadTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(btn => {
    const tab = btn.dataset.tab;
    const puedeAcceder = validarAccesoTab(tab);
    btn.style.display = puedeAcceder ? 'flex' : 'none';
    
    if (!puedeAcceder && btn.classList.contains('active')) {
      redirigirAAgenda(btn);
    }
  });
}

function redirigirAAgenda(btnActivo) {
  btnActivo.classList.remove('active');
  const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
  const agendaPane = document.getElementById('agenda-tab');
  
  if (agendaTab && agendaPane) {
    agendaTab.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    agendaPane.classList.add('active');
  }
}

function validarAccesoTab(tab) {
  if (!datosUsuario) return false;
  
  const accesos = {
    'solicitudes': datosUsuario.profession === 'asistente_social',
    'agenda': true,
    'seguimiento': true,
    'pacientes': true
  };
  
  return accesos[tab] || false;
}

export async function cerrarSesion() {
  try {
    mostrarCarga(true, 'Cerrando sesión...');
    
    await auth.signOut();
    limpiarSesion();
    
    mostrarNotificacion('Sesión cerrada correctamente', 'success');
    mostrarContenidoPublico();
    
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    mostrarNotificacion('Error al cerrar sesión: ' + error.message, 'error');
  } finally {
    mostrarCarga(false);
  }
}

// Funciones de acceso público
export const tieneAccesoSolicitudes = () => datosUsuario?.profession === 'asistente_social';
export const obtenerUsuarioActual = () => usuarioActual;
export const obtenerDatosUsuario = () => datosUsuario;
