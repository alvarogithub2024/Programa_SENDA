// ============================================
// SENDA SYSTEM - JAVASCRIPT FUNCIONAL
// ============================================

// Variables globales
let currentUser = null;
let currentUserData = null;

// ============================================
// FUNCIONES BÁSICAS DE MODAL
// ============================================

function showModal(modalId) {
  console.log('Abriendo modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus en el primer elemento focuseable
    setTimeout(() => {
      const firstInput = modal.querySelector('input, button, select, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  } else {
    console.error('Modal no encontrado:', modalId);
  }
}

function closeModal(modalId) {
  console.log('Cerrando modal:', modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const container = document.getElementById('notifications');
  if (container) {
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
}

// ============================================
// MANEJO DE TABS
// ============================================

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.style.display = 'none');
      
      // Activar el tab seleccionado
      this.classList.add('active');
      const targetContent = document.getElementById(targetTab + '-tab');
      if (targetContent) {
        targetContent.style.display = 'block';
      }
    });
  });
}

// ============================================
// PANEL PROFESIONAL
// ============================================

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  // Actualizar información del usuario
  document.getElementById('user-name').textContent = userData.nombre || 'Usuario';
  document.getElementById('user-role').textContent = userData.profesion || 'Profesional';
  document.getElementById('user-avatar').textContent = (userData.nombre || 'US').substring(0, 2).toUpperCase();

  // Configurar navegación del panel
  setupPanelNavigation();
  
  showNotification('Bienvenido al panel profesional', 'success');
}

function setupPanelNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const panelContents = document.querySelectorAll('.panel-content');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const panelId = this.dataset.panel;
      
      // Remover clase active de todos los nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Ocultar todos los paneles
      panelContents.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
      });
      
      // Activar el nav item y panel seleccionado
      this.classList.add('active');
      const targetPanel = document.getElementById(panelId + '-panel');
      if (targetPanel) {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
      }
      
      // Cargar contenido del panel
      loadPanelContent(panelId);
    });
  });
}

function loadPanelContent(panelId) {
  console.log('Cargando contenido del panel:', panelId);
  
  switch (panelId) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'requests':
      loadRequests();
      break;
    case 'patients':
      loadPatients();
      break;
    case 'calendar':
      loadCalendar();
      break;
    case 'followups':
      loadFollowups();
      break;
    case 'reports':
      loadReports();
      break;
    default:
      console.log('Panel no implementado:', panelId);
  }
}

// ============================================
// CARGA DE CONTENIDO DE PANELES (PLACEHOLDER)
// ============================================

function loadDashboard() {
  console.log('Cargando dashboard...');
  // Aquí irá la lógica real del dashboard
  showNotification('Dashboard cargado', 'success', 2000);
}

function loadRequests() {
  console.log('Cargando solicitudes...');
  const requestsList = document.getElementById('requests-list');
  if (requestsList) {
    requestsList.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-inbox"></i>
        <h3>Solicitudes</h3>
        <p>Las solicitudes aparecerán aquí cuando estén disponibles.</p>
      </div>
    `;
  }
}

function loadPatients() {
  console.log('Cargando pacientes...');
  const patientsList = document.getElementById('patients-list');
  if (patientsList) {
    patientsList.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-users"></i>
        <h3>Pacientes</h3>
        <p>La lista de pacientes aparecerá aquí cuando esté disponible.</p>
      </div>
    `;
  }
}

function loadCalendar() {
  console.log('Cargando calendario...');
  const calendarContent = document.getElementById('calendar-content');
  if (calendarContent) {
    calendarContent.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-calendar-alt"></i>
        <h3>Agenda</h3>
        <p>El calendario aparecerá aquí cuando esté disponible.</p>
      </div>
    `;
  }
}

function loadFollowups() {
  console.log('Cargando seguimientos...');
  const followupsContent = document.getElementById('followups-content');
  if (followupsContent) {
    followupsContent.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-clipboard-list"></i>
        <h3>Seguimientos</h3>
        <p>Los seguimientos clínicos aparecerán aquí cuando estén disponibles.</p>
      </div>
    `;
  }
}

function loadReports() {
  console.log('Cargando reportes...');
  const reportsContent = document.getElementById('reports-content');
  if (reportsContent) {
    reportsContent.innerHTML = `
      <div class="placeholder-content">
        <i class="fas fa-file-medical-alt"></i>
        <h3>Reportes</h3>
        <p>Los reportes aparecerán aquí cuando estén disponibles.</p>
      </div>
    `;
  }
}

// ============================================
// FORMULARIOS
// ============================================

function handleLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      console.log('Intento de login:', email);
      
      // Simulación de login exitoso
      setTimeout(() => {
        const userData = {
          nombre: 'Usuario Demo',
          profesion: 'asistente_social',
          email: email
        };
        
        currentUserData = userData;
        closeModal('professional-modal');
        showProfessionalPanel(userData);
      }, 1000);
      
      showNotification('Iniciando sesión...', 'info');
    });
  }
}

function handleRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const profession = document.getElementById('register-profession').value;
      
      console.log('Intento de registro:', { name, email, profession });
      
      showNotification('Registro en proceso...', 'info');
      
      // Simulación de registro exitoso
      setTimeout(() => {
        showNotification('Registro exitoso. Puedes iniciar sesión ahora.', 'success');
        
        // Cambiar a tab de login
        const loginTab = document.querySelector('[data-tab="login"]');
        if (loginTab) {
          loginTab.click();
        }
      }, 1500);
    });
  }
}

function handlePatientForm() {
  const patientForm = document.getElementById('patient-form');
  if (patientForm) {
    patientForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      console.log('Enviando solicitud de paciente...');
      
      showNotification('Enviando solicitud...', 'info');
      
      // Simulación de envío exitoso
      setTimeout(() => {
        showNotification('Solicitud enviada exitosamente. Te contactaremos pronto.', 'success');
        closeModal('patient-modal');
        
        // Limpiar formulario
        this.reset();
      }, 2000);
    });
  }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function showLoading(show = true) {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    currentUserData = null;
    closeModal('panel-modal');
    showNotification('Sesión cerrada exitosamente', 'success');
  }
}

// ============================================
// FUNCIÓN DEMO PARA PRUEBAS
// ============================================

function startDemo() {
  showNotification('Sistema SENDA Demo iniciado', 'info');
  
  // Simular login automático después de 2 segundos
  setTimeout(() => {
    const demoUser = {
      nombre: 'Dr. Demo SENDA',
      profesion: 'asistente_social',
      email: 'demo@senda.cl'
    };
    
    currentUserData = demoUser;
    showProfessionalPanel(demoUser);
  }, 2000);
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('Inicializando Sistema SENDA...');
  
  // Configurar botones principales
  const btnRegisterPatient = document.getElementById('register-patient');
  if (btnRegisterPatient) {
    btnRegisterPatient.addEventListener('click', function() {
      console.log('Botón Solicitar Ayuda clickeado');
      showModal('patient-modal');
    });
  }

  const btnLoginProfessional = document.getElementById('login-professional');
  if (btnLoginProfessional) {
    btnLoginProfessional.addEventListener('click', function() {
      console.log('Botón Acceso Profesional clickeado');
      showModal('professional-modal');
    });
  }

  const btnFindCenter = document.getElementById('find-center');
  if (btnFindCenter) {
    btnFindCenter.addEventListener('click', function() {
      console.log('Botón Encontrar Centro clickeado');
      showModal('center-modal');
    });
  }

  const btnAboutProgram = document.getElementById('about-program');
  if (btnAboutProgram) {
    btnAboutProgram.addEventListener('click', function() {
      console.log('Botón Sobre el Programa clickeado');
      showModal('about-modal');
    });
  }

  const btnReentryProgram = document.getElementById('reentry-program');
  if (btnReentryProgram) {
    btnReentryProgram.addEventListener('click', function() {
      console.log('Botón Reingresar clickeado');
      showModal('reentry-modal');
    });
  }

  // Configurar botón de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Configurar tabs
  setupTabs();
  
  // Configurar formularios
  handleLoginForm();
  handleRegisterForm();
  handlePatientForm();
  
  // Cerrar modales al hacer click fuera de ellos
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        const modalId = this.id;
        closeModal(modalId);
      }
    });
  });
  
  // Cerrar modales con tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const visibleModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (visibleModal) {
        closeModal(visibleModal.id);
      }
    }
  });

  console.log('Sistema SENDA inicializado correctamente');
  showNotification('Sistema SENDA cargado correctamente', 'success', 3000);
});

// ============================================
// FUNCIONES GLOBALES PARA DEBUG Y TESTING
// ============================================

// Función para probar el sistema sin firebase
window.testSenda = function() {
  console.log('Iniciando test del sistema SENDA...');
  startDemo();
};

// Función para abrir modal específico
window.openModal = function(modalId) {
  showModal(modalId);
};

// Función para simular login
window.simulateLogin = function(profession = 'asistente_social') {
  const userData = {
    nombre: 'Usuario de Prueba',
    profesion: profession,
    email: 'test@senda.cl'
  };
  
  currentUserData = userData;
  showProfessionalPanel(userData);
};

console.log('SENDA System JavaScript cargado');
console.log('Para probar el sistema, usa: window.testSenda()');
console.log('Para abrir un modal específico, usa: window.openModal("modal-id")');
console.log('Para simular login, usa: window.simulateLogin("asistente_social")');
