<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SENDA Puente Alto - Sistema de Gestión</title>
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="configuracion/constantes.js"></script>
<script src="configuracion/firebase.js"></script>
<script src="utilidades/notificaciones.js"></script>
<script src="utilidades/modales.js"></script>
<script src="utilidades/validaciones.js"></script>
<script src="formularios/formulario-paciente.js"></script>
<script src="formularios/formulario-reingreso.js"></script>
<script src="formularios/autoguardado.js"></script>
<script src="navegacion/tabs.js"></script>
<script src="navegacion/eventos.js"></script>
<script src="navegacion/shortcuts.js"></script>
<script src="solicitudes/gestor-solicitudes.js"></script>
<script src="solicitudes/filtros.js"></script>
<script src="solicitudes/respuestas.js"></script>
<script src="calendario/agenda.js"></script>
<script src="calendario/citas.js"></script>
<script src="calendario/horarios.js"></script>
<script src="pacientes/gestor-pacientes.js"></script>
<script src="pacientes/busqueda.js"></script>
<script src="pacientes/fichas.js"></script>
<script src="seguimiento/timeline.js"></script>
<script src="seguimiento/atenciones.js"></script>
<script src="seguimiento/citas-proximas.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,">
<!-- Modularizada autenticación -->
<script src="autenticacion/registro.js"></script>
<script src="autenticacion/login.js"></script>
<script src="autenticacion/sesion.js"></script>
</head>
<body>
<header class="header">
<div class="header-content">
<div class="logo">
<i class="fas fa-heartbeat"></i>
<span>SENDA Puente Alto</span>
</div>
<div class="header-actions">
<button class="btn btn-professional" id="login-professional">
<i class="fas fa-user-md"></i>
Acceso Profesionales
</button>
</div>
</div>
</header>
<div class="professional-header" id="professional-header" style="display: none;">
<div class="header-content">
<div class="professional-info">
<div class="professional-avatar">PA</div>
<div class="professional-details">
<h3 id="professional-name">Profesional SENDA</h3>
<p id="professional-profession">Cargando...</p>
<small id="professional-cesfam">CESFAM</small>
</div>
</div>
<div class="professional-actions">
<button class="btn btn-danger btn-sm" id="logout-professional">
<i class="fas fa-sign-out-alt"></i>
Cerrar Sesión
</button>
</div>
</div>
</div>
<main class="main-content">
<div id="public-content">
<div class="hero-card">
<h1>Programa SENDA</h1>
<p class="subtitle">Servicio Nacional para la Prevención y Rehabilitación</p>
<p class="description">
Ofrecemos tratamiento y apoyo integral para la prevención y recuperación 
del consumo problemático de drogas y alcohol. Tu bienestar es nuestra prioridad.
</p>
<div class="stats-grid">
<div class="stat-item">
<span class="stat-number">1,200+</span>
<span class="stat-label">Personas atendidas</span>
</div>
<div class="stat-item">
<span class="stat-number">8</span>
<span class="stat-label">CESFAM activos</span>
</div>
<div class="stat-item">
<span class="stat-number">24/7</span>
<span class="stat-label">Línea de ayuda</span>
</div>
<div class="stat-item">
<span class="stat-number">85%</span>
<span class="stat-label">Tasa de éxito</span>
</div>
</div>
<div class="btn-group">
<button class="btn btn-primary" id="register-patient">
<i class="fas fa-user-plus"></i>
Solicitar Ayuda
</button>
<button class="btn btn-secondary" id="reentry-program">
<i class="fas fa-redo"></i>
Reingreso al Programa
</button>
<button class="btn btn-outline" id="about-program">
<i class="fas fa-info-circle"></i>
Sobre el Programa
</button>
</div>
<div class="features">
<span><i class="fas fa-shield-alt"></i> Confidencial</span>
<span><i class="fas fa-heart"></i> Apoyo integral</span>
<span><i class="fas fa-clock"></i> Horarios flexibles</span>
<span><i class="fas fa-users"></i> Equipo especializado</span>
</div>
</div>
<div class="emergency-info">
<div class="emergency-title">
<i class="fas fa-phone-alt"></i>
En caso de emergencia
</div>
<div class="emergency-numbers">
<span><strong>SENDA:</strong> 1412</span>
<span><strong>SAPU:</strong> 131</span>
<span><strong>Emergencias:</strong> 132</span>
</div>
</div>
</div>
<div id="professional-content" style="display: none;">
<nav class="tab-navigation">
<button class="tab-btn active" data-tab="agenda">
<i class="fas fa-calendar-alt"></i>
Agenda
</button>
<button class="tab-btn" data-tab="solicitudes">
<i class="fas fa-inbox"></i>
Solicitudes
</button>
<button class="tab-btn" data-tab="pacientes">
<i class="fas fa-users"></i>
Pacientes
</button>
<button class="tab-btn" data-tab="seguimiento">
<i class="fas fa-chart-line"></i>
Seguimiento
</button>
</nav>
<div class="tab-pane" id="solicitudes-tab">
<div class="section-header">
<h2>Solicitudes de Ingreso</h2>
<div class="section-actions">
<button id="refresh-solicitudes" class="btn btn-secondary">
<i class="fas fa-sync"></i> Actualizar
</button>
<button id="export-solicitudes" class="btn btn-primary">
<i class="fas fa-download"></i> Exportar
</button>
</div>
</div>
<div class="filters-container">
<div class="filter-group"><label>Estado:</label><select id="filtro-estado-solicitudes"><option value="todos">Todos los estados</option></select></div>
<div class="filter-group"><label>Prioridad:</label><select id="filtro-prioridad-solicitudes"><option value="todos">Todas las prioridades</option></select></div>
<div class="filter-group"><label>CESFAM:</label><select id="filtro-cesfam-solicitudes"><option value="todos">Todos los CESFAM</option></select></div>
<div class="filter-group"><label>Fecha:</label><select id="filtro-fecha-solicitudes"><option value="todos">Todas las fechas</option><option value="hoy">Hoy</option><option value="semana">Esta semana</option><option value="mes">Este mes</option></select></div>
<div class="filter-group"><label>Buscar:</label><input type="text" id="buscar-solicitudes" placeholder="Nombre, RUT, email..."></div>
</div>
<div id="solicitudes-stats" class="stats-container"></div>
<div class="counter-info">Mostrando <span id="solicitudes-counter">0</span> de <span id="solicitudes-total-counter">0</span> solicitudes</div>
<div id="solicitudes-table-container">
<table class="solicitudes-table">
<thead>
<tr>
<th>Paciente</th>
<th>Contacto</th>
<th>CESFAM</th>
<th>Estado</th>
<th>Prioridad</th>
<th>Fecha</th>
<th>Sustancias</th>
<th>Acciones</th>
</tr>
</thead>
<tbody id="solicitudes-table-body"></tbody>
</table>
</div>
</div>
<div class="tab-pane active" id="agenda-tab">
<div class="section-header">
<h2>Gestión de Agenda</h2>
</div>
<div class="appointments-stats">
<span>Hoy: <span id="today-count">0</span></span>
<span>Próximas: <span id="upcoming-count">0</span></span>
<span>Vencidas: <span id="overdue-count">0</span></span>
<span>Pendientes: <span id="pending-count">0</span></span>
</div>
<div class="calendar-container">
<div class="calendar-header">
<h3 id="calendar-month-year">Cargando...</h3>
<div>
<button class="btn btn-outline btn-sm" id="prev-month"><i class="fas fa-chevron-left"></i></button>
<button class="btn btn-outline btn-sm" id="next-month"><i class="fas fa-chevron-right"></i></button>
<button class="btn btn-success btn-sm" id="nueva-cita-btn"><i class="fas fa-plus"></i> Nueva Cita</button>
</div>
</div>
<div class="calendar-grid" id="calendar-grid"></div>
</div>
<div class="daily-appointments">
<h3>Citas del Día</h3>
<div class="appointments-list" id="appointments-list">
<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>
</div>
</div>
</div>
<div class="tab-pane" id="pacientes-tab">
<div class="section-header">
<h2>Pacientes</h2>
<div class="section-actions">
<div class="search-box">
<i class="fas fa-search"></i>
<input type="text" id="search-pacientes-rut" placeholder="Buscar por RUT...">
</div>
<button class="btn btn-primary btn-sm" id="buscar-paciente-btn">
<i class="fas fa-search"></i>
Buscar
</button>
</div>
</div>
<div class="patients-grid" id="patients-grid">
<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando pacientes...</div>
</div>
<div id="pacientes-search-results"></div>
</div>
<div class="tab-pane" id="seguimiento-tab">
<div class="section-header">
<h2>Seguimiento y Control</h2>
</div>
<div class="daily-appointments">
<h3>Pacientes de Hoy</h3>
<div class="patients-timeline" id="patients-timeline">
<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando seguimiento...</div>
</div>
</div>
<div class="daily-appointments" style="margin-top: 2rem;">
<h3>Próximas Citas</h3>
<div class="appointments-grid" id="upcoming-appointments-grid"></div>
<div id="no-upcoming-section" style="display: none;">
<div class="no-results">
<i class="fas fa-calendar-check"></i>
<p>No hay citas próximas programadas</p>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- ================= MODAL LOGIN ================= -->
<div class="modal-overlay" id="login-modal" style="display:none;">
<div class="modal">
<button class="modal-close" onclick="closeModal('login-modal')"><i class="fas fa-times"></i></button>
<h2>Acceso Profesionales</h2>
<p class="modal-description">Ingresa con tu cuenta autorizada para acceder al sistema.</p>
<div class="modal-tabs">
<button class="modal-tab active" onclick="switchLoginTab('login')">Iniciar Sesión</button>
<button class="modal-tab" onclick="switchLoginTab('register')">Registrarse</button>
</div>
<form class="auth-form active" id="login-form">
<div class="form-group">
<label class="form-label">Email</label>
<input type="email" class="form-input" id="login-email" required>
</div>
<div class="form-group">
<label class="form-label">Contraseña</label>
<input type="password" class="form-input" id="login-password" required>
</div>
<div class="form-actions">
<button type="submit" class="btn btn-primary btn-full"><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</button>
</div>
</form>
<form class="auth-form" id="register-form">
<div class="form-row">
<div class="form-group">
<label class="form-label">Nombre</label>
<input type="text" class="form-input" id="register-nombre" required>
</div>
<div class="form-group">
<label class="form-label">Apellidos</label>
<input type="text" class="form-input" id="register-apellidos" required>
</div>
</div>
<div class="form-group">
<label class="form-label">Email</label>
<input type="email" class="form-input" id="register-email" pattern=".*@senda\.cl$" title="Solo se permiten emails @senda.cl" placeholder="usuario@senda.cl" required>
</div>
<div class="form-group">
<label class="form-label">Contraseña</label>
<input type="password" class="form-input" id="register-password" required>
</div>
<div class="form-group">
<label class="form-label">Profesión</label>
<select class="form-select" id="register-profession" required>
<option value="">Seleccionar profesión...</option>
<option value="asistente_social">Asistente Social</option>
<option value="medico">Médico</option>
<option value="psicologo">Psicólogo</option>
<option value="terapeuta">Terapeuta Ocupacional</option>
</select>
</div>
<div class="form-group">
<label class="form-label">CESFAM</label>
<select class="form-select" id="register-cesfam" required>
<option value="">Seleccionar CESFAM...</option>
<option value="CESFAM Alejandro del Río">CESFAM Alejandro del Río</option>
<option value="CESFAM Karol Wojtyla">CESFAM Karol Wojtyla</option>
<option value="CESFAM Laurita Vicuña">CESFAM Laurita Vicuña</option>
<option value="CESFAM Padre Manuel Villaseca">CESFAM Padre Manuel Villaseca</option>
<option value="CESFAM San Gerónimo">CESFAM San Gerónimo</option>
<option value="CESFAM Vista Hermosa">CESFAM Vista Hermosa</option>
<option value="CESFAM Bernardo Leighton">CESFAM Bernardo Leighton</option>
<option value="CESFAM Cardenal Raúl Silva Henríquez">CESFAM Cardenal Raúl Silva Henríquez</option>
</select>
</div>
<div class="form-actions">
<button type="submit" class="btn btn-success btn-full"><i class="fas fa-user-plus"></i> Registrarse</button>
</div>
</form>
</div>
</div>
<!-- ================= MODAL SOLICITUD PACIENTE ================= -->
<div class="modal-overlay" id="patient-modal" style="display:none;">
<div class="modal large-modal">
<button class="modal-close" onclick="closeModal('patient-modal')"><i class="fas fa-times"></i></button>
<h2>Solicitud de Ayuda</h2>
<div class="form-progress">
<div class="progress-bar"><div class="progress-fill" id="form-progress"></div></div>
<span class="progress-text" id="progress-text">Paso 1 de 4</span>
</div>
<form id="patient-form">
<!-- ... (resto del formulario de paciente) ... -->
</form>
</div>
</div>
<!-- ================= MODAL REINGRESO ================= -->
<div class="modal-overlay" id="reentry-modal" style="display:none;">
<div class="modal">
<button class="modal-close" onclick="closeModal('reentry-modal')"><i class="fas fa-times"></i></button>
<h2>Reingreso al Programa</h2>
<!-- ... (resto del formulario de reingreso) ... -->
</div>
</div>
<footer class="footer">
<div class="footer-content">
<p>&copy; 2024 SENDA Puente Alto. Todos los derechos reservados.</p>
<p>Desarrollado para el bienestar de nuestra comunidad</p>
<a href="https://www.senda.gob.cl" target="_blank" class="footer-link"><i class="fas fa-external-link-alt"></i> Sitio oficial SENDA</a>
</div>
<!-- ========== MODAL SOBRE EL PROGRAMA ========== -->
<div class="modal-overlay" id="about-modal" style="display:none;">
  <div class="modal large-modal">
    <button class="modal-close" onclick="closeModal('about-modal')">
      <i class="fas fa-times"></i>
    </button>
    <h2>Sobre el Programa</h2>
    <div class="modal-description">
      <p>
        El <strong>Programa SENDA Puente Alto</strong> es un esfuerzo conjunto con los 8 CESFAM de la comuna,
        enfocado en la prevención y tratamiento del consumo problemático de alcohol y otras drogas.<br><br>
        <strong>¿Qué hacemos?</strong>
        <ul>
          <li>Atención y derivación de personas que requieran apoyo en consumo de sustancias.</li>
          <li>Orientación familiar y psicoeducación.</li>
          <li>Gestión de casos y acompañamiento continuo.</li>
          <li>Trabajo conjunto con equipos de salud y comunidad.</li>
        </ul>
        <strong>¿A quiénes atendemos?</strong>
        <ul>
          <li>Niños, niñas y adolescentes</li>
          <li>Personas adultas</li>
          <li>Familias y cuidadores</li>
        </ul>
        <strong>Confidencialidad y calidad:</strong> Todo el proceso es confidencial, voluntario y realizado por profesionales capacitados.<br><br>
        <strong>Más info:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a>
      </p>
    </div>
  </div>
</div>
<!-- ========== FIN MODAL SOBRE EL PROGRAMA ========== -->

<script>
document.addEventListener("DOMContentLoaded", function() {
  var btnSobre = document.getElementById("about-program");
  if (btnSobre) {
    btnSobre.addEventListener("click", function() {
      if(typeof showModal==='function'){
        showModal('about-modal');
      } else {
        document.getElementById('about-modal').style.display = 'flex';
      }
    });
  }
});
</script>
</footer>
</body>
</html>

// ====== DIAGNÓSTICO DEL SISTEMA EN CONSOLA ======
console.log('🔍 Información del Sistema:');
console.log('   Navegador:', navigator.userAgent);
console.log('   Idioma:', navigator.language);
console.log('   Conexión:', navigator.onLine ? 'Online' : 'Offline');
console.log('   Local Storage:', typeof Storage !== 'undefined' ? 'Disponible' : 'No disponible');
console.log('   Service Worker:', 'serviceWorker' in navigator ? 'Disponible' : 'No disponible');

window.addEventListener('online', function() {
    console.log('🌐 Conexión restaurada');
    window.showNotification && window.showNotification('Conexión a Internet restaurada', 'success');
});
window.addEventListener('offline', function() {
    console.log('📴 Conexión perdida');
    window.showNotification && window.showNotification('Sin conexión a Internet. Algunas funciones pueden no estar disponibles.', 'warning', 5000);
});
window.addEventListener('error', function(event) {
    console.error('❌ Error no capturado:', event.error);
    if (event.error && event.error.message && 
        (event.error.message.includes('Firebase') || 
         event.error.message.includes('network') ||
         event.error.message.includes('auth'))) {
        window.showNotification && window.showNotification('Error del sistema detectado. Si persiste, recarga la página.', 'error');
    }
});
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesa rechazada no capturada:', event.reason);
    event.preventDefault();
    if (event.reason && typeof event.reason === 'object' && event.reason.code) {
        console.warn('Código de error: ' + event.reason.code);
    }
});

if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    console.log('🔄 Página recargada por el usuario');
} else {
    console.log('🆕 Primera carga de la página');
}

console.log('\n📝 Sistema SENDA listo para inicialización...\n');
