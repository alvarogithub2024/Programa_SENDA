// src/js/autenticacion/login.js
import { auth } from '../configuracion/firebase.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { cerrarModal } from '../utilidades/modales.js';
import { alternarBotonEnvio } from '../utilidades/formato.js';

export function configurarLogin() {
  const formularioLogin = document.getElementById('login-form');
  if (formularioLogin) {
    formularioLogin.addEventListener('submit', manejarEnvioLogin);
  }
}

async function manejarEnvioLogin(e) {
  e.preventDefault();
  
  try {
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value?.trim();
    
    if (!email || !password) {
      mostrarNotificacion('Completa todos los campos', 'warning');
      return;
    }
    
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    alternarBotonEnvio(botonEnvio, true);
    
    await auth.signInWithEmailAndPassword(email, password);
    
    cerrarModal('login-modal');
    mostrarNotificacion('Sesión iniciada correctamente', 'success');
    e.target.reset();
    
  } catch (error) {
    const mensajesError = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
    };
    
    const mensaje = mensajesError[error.code] || error.message;
    mostrarNotificacion(`Error al iniciar sesión: ${mensaje}`, 'error');
  } finally {
    const botonEnvio = e.target.querySelector('button[type="submit"]');
    if (botonEnvio) alternarBotonEnvio(botonEnvio, false);
  }
}

export function alternarTabLogin(tab) {
  const elementos = {
    loginTab: document.querySelector('.modal-tab[onclick*="login"]'),
    registerTab: document.querySelector('.modal-tab[onclick*="register"]'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form')
  };
  
  if (tab === 'login') {
    elementos.loginTab?.classList.add('active');
    elementos.registerTab?.classList.remove('active');
    elementos.loginForm?.classList.add('active');
    elementos.registerForm?.classList.remove('active');
  } else if (tab === 'register') {
    elementos.registerTab?.classList.add('active');
    elementos.loginTab?.classList.remove('active');
    elementos.registerForm?.classList.add('active');
    elementos.loginForm?.classList.remove('active');
  }
}
