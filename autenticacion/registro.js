// src/js/autenticacion/registro.js
import { auth, db } from '../configuracion/firebase.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

export function configurarRegistro() {
  const formularioRegistro = document.getElementById('register-form');
  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', manejarEnvioRegistro);
  }
}

async function manejarEnvioRegistro(e) {
  e.preventDefault();
  
  try {
    const datosFormulario = recopilarDatosFormulario();
    
    if (!validarDatosRegistro(datosFormulario)) return;
    
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    alternarBotonEnvio(botonEnvio, true);
    
    // Crear usuario en Firebase Auth
    const credencialUsuario = await auth.createUserWithEmailAndPassword(
      datosFormulario.email, 
      datosFormulario.password
    );
    
    // Guardar datos del profesional en Firestore
    const datosProfesional = {
      nombre: datosFormulario.nombre,
      apellidos: datosFormulario.apellidos,
      email: datosFormulario.email,
      profession: datosFormulario.profession,
      cesfam: datosFormulario.cesfam,
      activo: true,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      uid: credencialUsuario.user.uid
    };
    
    await db.collection('profesionales').doc(credencialUsuario.user.uid).set(datosProfesional);
    
    cerrarModal('login-modal');
    mostrarNotificacion('Registro exitoso. Bienvenido al sistema SENDA', 'success');
    e.target.reset();
    
  } catch (error) {
    const mensajesError = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'Email inválido',
      'auth/operation-not-allowed': 'Registro no permitido',
      'auth/weak-password': 'Contraseña muy débil',
      'permission-denied': 'Sin permisos para crear el perfil profesional'
    };
    
    const mensaje = mensajesError[error.code] || error.message;
    mostrarNotificacion(`Error al registrarse: ${mensaje}`, 'error');
  } finally {
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    if (botonEnvio) alternarBotonEnvio(botonEnvio, false);
  }
}

function recopilarDatosFormulario() {
  return {
    nombre: document.getElementById('register-nombre')?.value?.trim(),
    apellidos: document.getElementById('register-apellidos')?.value?.trim(),
    email: document.getElementById('register-email')?.value?.trim(),
    password: document.getElementById('register-password')?.value?.trim(),
    profession: document.getElementById('register-profession')?.value,
    cesfam: document.getElementById('register-cesfam')?.value
  };
}

function validarDatosRegistro(datos) {
  const camposObligatorios = ['nombre', 'apellidos', 'email', 'password', 'profession', 'cesfam'];
  
  for (const campo of camposObligatorios) {
    if (!datos[campo]) {
      mostrarNotificacion(`El campo ${campo} es obligatorio`, 'warning');
      return false;
    }
  }
  
  if (!datos.email.endsWith('@senda.cl')) {
    mostrarNotificacion('Solo se permiten emails @senda.cl', 'warning');
    return false;
  }
  
  if (datos.password.length < 6) {
    mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'warning');
    return false;
  }
  
  return true;
}
