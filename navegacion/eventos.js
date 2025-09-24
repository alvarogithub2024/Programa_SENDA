// src/js/navegacion/eventos.js
import { mostrarModal } from '../utilidades/modales.js';
import { cerrarSesion } from '../autenticacion/sesion.js';
import { configurarLogin } from '../autenticacion/login.js';
import { configurarRegistro } from '../autenticacion/registro.js';

export function configurarEventos() {
  configurarEventosAutenticacion();
  configurarEventosFormularios();
  configurarEventosNavegacion();
  configurarEventosCalendario();
  configurarEventosPacientes();
  
  // Configurar formularios de auth
  configurarLogin();
  configurarRegistro();
  
  console.log('✅ Eventos globales configurados');
}

function configurarEventosAutenticacion() {
  const btnLogin = document.getElementById('login-professional');
  const btnLogout = document.getElementById('logout-professional');
  
  if (btnLogin) {
    btnLogin.addEventListener('click', () => mostrarModal('login-modal'));
  }
  
  if (btnLogout) {
    btnLogout.addEventListener('click', cerrarSesion);
  }
}

function configurarEventosFormularios() {
  const btnRegistrarPaciente = document.getElementById('register-patient');
  const btnReingreso = document.getElementById('reentry-program');
  const btnAcerca = document.getElementById('about-program');
  
  if (btnRegistrarPaciente) {
    btnRegistrarPaciente.addEventListener('click', async () => {
      const { reiniciarFormulario } = await import('../formularios/formulario-paciente.js');
      reiniciarFormulario();
      mostrarModal('patient-modal');
    });
  }
  
  if (btnReingreso) {
    btnReingreso.addEventListener('click', () => mostrarModal('reentry-modal'));
  }
  
  if (btnAcerca) {
    btnAcerca.addEventListener('click', mostrarModalAcerca);
  }
}

function configurarEventosNavegacion() {
  const btnPrevMes = document.getElementById('prev-month');
  const btnNextMes = document.getElementById('next-month');
  
  if (btnPrevMes) {
    btnPrevMes.addEventListener('click', async () => {
      const { navegarMes } = await import('../calendario/calendario.js');
      navegarMes(-1);
    });
  }
  
  if (btnNextMes) {
    btnNextMes.addEventListener('click', async () => {
      const { navegarMes } = await import('../calendario/calendario.js');
      navegarMes(1);
    });
  }
}

function configurarEventosCalendario() {
  const btnNuevaCita = document.getElementById('nueva-cita-btn');
  
  if (btnNuevaCita) {
    btnNuevaCita.addEventListener('click', async () => {
      const { crearModalNuevaCita } = await import('../calendario/citas.js');
      crearModalNuevaCita();
    });
  }
}

function configurarEventosPacientes() {
  const campoBusqueda = document.getElementById('search-pacientes-rut');
  const btnBuscar = document.getElementById('buscar-paciente-btn');
  
  if (btnBuscar) {
    btnBuscar.addEventListener('click', async () => {
      const { buscarPacientePorRUT } = await import('../pacientes/busqueda.js');
      buscarPacientePorRUT();
    });
  }
  
  if (campoBusqueda) {
    campoBusqueda.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const { buscarPacientePorRUT } = await import('../pacientes/busqueda.js');
        buscarPacientePorRUT();
      }
    });
    
    campoBusqueda.addEventListener('input', (e) => {
      const { formatearRUT } = import('../utilidades/formato.js').then(m => {
        e.target.value = m.formatearRUT(e.target.value);
      });
    });
  }
}

async function mostrarModalAcerca() {
  const modalAcerca = `
    <div class="modal-overlay temp-modal" id="about-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="SENDA.cerrarModal('about-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
          
          <div style="line-height: 1.6; color: var(--text-dark);">
            <p><strong>SENDA</strong> es el organismo del Gobierno de Chile encargado de las políticas de prevención del consumo de drogas y alcohol, así como de tratamiento y rehabilitación.</p>
            
            <h3 style="color: var(--primary-blue);">Servicios</h3>
            <ul>
              <li>Tratamiento ambulatorio básico e intensivo</li>
              <li>Programas de reinserción social</li>
              <li>Apoyo familiar y comunitario</li>
              <li>Prevención educacional</li>
            </ul>
            
            <h3 style="color: var(--primary-blue);">Horarios</h3>
            <ul>
              <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
              <li><strong>Fines de Semana:</strong> 09:00 - 12:30</li>
            </ul>
            
            <h3 style="color: var(--primary-blue);">Contacto</h3>
            <ul>
              <li><strong>Teléfono:</strong> 1412 (gratuito)</li>
              <li><strong>Emergencias:</strong> 131</li>
            </ul>
            
            <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px; text-align: center; font-style: italic;">
              "Tu recuperación es posible. Estamos aquí para acompañarte."
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <button class="btn btn-primary" onclick="SENDA.cerrarModal('about-modal')">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalAcerca);
  mostrarModal('about-modal');
}
