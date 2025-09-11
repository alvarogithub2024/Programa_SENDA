// ============================================
// SENDA SYSTEM - CONFIGURACIÓN INICIAL
// ============================================

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables Globales (TODAS EN UN SOLO LUGAR)
let currentUser = null;
let currentUserData = null;
let currentFormStep = 1;
let maxFormStep = 4;
let formData = {};
let isDraftSaved = false;
let flowSteps = []; 
let currentStepIndex = 0;
let selectedPatient = null;
let currentAppointments = [];
let professionalSchedules = {};
let availableTimeSlots = {};
let currentCalendarDate = new Date();

// Datos de regiones de Chile
const regionesChile = {
  "XV": { nombre: "Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
  "I": { nombre: "Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
  "II": { nombre: "Antofagasta", comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"] },
  "III": { nombre: "Atacama", comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"] },
  "IV": { nombre: "Coquimbo", comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"] },
  "V": { nombre: "Valparaíso", comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"] },
  "RM": { nombre: "Metropolitana", comunas: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"] },
  "VI": { nombre: "O'Higgins", comunas: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"] },
  "VII": { nombre: "Maule", comunas: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"] },
  "VIII": { nombre: "Biobío", comunas: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío", "Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"] },
  "IX": { nombre: "Araucanía", comunas: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"] },
  "XIV": { nombre: "Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"] },
  "X": { nombre: "Los Lagos", comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellon", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"] },
  "XI": { nombre: "Aysén", comunas: ["Coihaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"] },
  "XII": { nombre: "Magallanes", comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"] }
};
// ============================================
// FUNCIONES DE VALIDACIÓN DE ROLES
// ============================================

function canViewRequests(userRole) {
  return ['asistente_social', 'coordinador', 'admin'].includes(userRole);
}

function canManagePatients(userRole) {
  return ['asistente_social', 'medico', 'psicologo', 'terapeuta', 'coordinador', 'admin'].includes(userRole);
}

function canScheduleAppointments(userRole) {
  return ['asistente_social', 'coordinador', 'admin'].includes(userRole);
}

function canWriteFollowups(userRole) {
  return ['medico', 'psicologo', 'terapeuta', 'asistente_social'].includes(userRole);
}

function canGenerateReports(userRole) {
  return ['asistente_social', 'medico', 'psicologo', 'coordinador', 'admin'].includes(userRole);
}

// ============================================
// FUNCIONES AUXILIARES Y UTILIDADES
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
  
  let container = document.getElementById('notifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notifications';
    document.body.appendChild(container);
  }
  
  container.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function showLoading(show = true) {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? 'flex' : 'none';
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateForData(date) {
  return date.toISOString().split('T')[0];
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getProfessionName(profession) {
  const names = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional',
    'coordinador': 'Coordinador Regional',
    'admin': 'Administrador'
  };
  return names[profession] || profession;
}

function isDateToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CL');
}

function generatePatientNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${year}${month}${random}`;
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function validateRUT(rut) {
  // Básico para validación de RUT chileno
  if (!rut) return false;
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  return cleanRUT.length >= 8 && cleanRUT.length <= 9;
}

function formatRUT(rut) {
  if (!rut) return '';
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  if (cleanRUT.length < 2) return cleanRUT;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}
// ============================================
// FUNCIONES DE MODALES Y NAVEGACIÓN
// ============================================

function showModal(modalId) {
  console.log('Attempting to show modal:', modalId);
  
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error('Modal not found:', modalId);
    return;
  }
  
  // Cerrar otros modales abiertos
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.style.display = 'none';
  });
  
  // Mostrar modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Focus en el primer elemento
  setTimeout(() => {
    const firstFocusable = modal.querySelector('input, button, select, textarea');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, 100);
  
  console.log('Modal shown successfully:', modalId);
}

function closeModal(modalId) {
  console.log('Closing modal:', modalId);
  
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error('Modal not found:', modalId);
    return;
  }
  
  // Verificar si es el modal de paciente y hay datos no guardados
  if (modalId === 'patient-modal' && !isDraftSaved) {
    const shouldClose = confirm('¿Estás seguro de que quieres cerrar? Los datos no guardados se perderán.');
    if (!shouldClose) return;
    resetForm();
  }
  
  // Cerrar modal
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Limpiar modales dinámicos
  if (modalId.includes('dynamic') || modalId.includes('request') || modalId.includes('report')) {
    modal.remove();
  }
  
  console.log('Modal closed successfully:', modalId);
}

// ============================================
// PANEL PROFESIONAL Y NAVEGACIÓN
// ============================================

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  // Actualizar información del usuario
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Configurar navegación basada en roles
  setupRoleBasedNavigation(userData);
  setupPanelNavigation(userData);
  
  // Mostrar dashboard por defecto
  showPanel('dashboard', userData);
  
  // Configurar botón de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

function setupRoleBasedNavigation(userData) {
  const role = userData.profesion;
  
  // Elementos de navegación
  const requestsNav = document.querySelector('[data-panel="requests"]');
  const patientsNav = document.querySelector('[data-panel="patients"]');
  const calendarNav = document.querySelector('[data-panel="calendar"]');
  const followupsNav = document.querySelector('[data-panel="followups"]');
  const reportsNav = document.querySelector('[data-panel="reports"]');
  const centersNav = document.querySelector('[data-panel="centers"]');
  const usersNav = document.querySelector('[data-panel="users"]');
  const analyticsNav = document.querySelector('[data-panel="analytics"]');
  
  // Ocultar todos los elementos inicialmente
  [requestsNav, patientsNav, calendarNav, followupsNav, reportsNav, centersNav, usersNav, analyticsNav]
    .forEach(nav => {
      if (nav) nav.style.display = 'none';
    });
  
  // Mostrar según permisos
  if (canViewRequests(role) && requestsNav) {
    requestsNav.style.display = 'flex';
  }
  
  if (canManagePatients(role) && patientsNav) {
    patientsNav.style.display = 'flex';
  }
  
  if (canScheduleAppointments(role) && calendarNav) {
    calendarNav.style.display = 'flex';
  }
  
  if (canWriteFollowups(role) && followupsNav) {
    followupsNav.style.display = 'flex';
  }
  
  if (canGenerateReports(role) && reportsNav) {
    reportsNav.style.display = 'flex';
  }
  
  if (['coordinador', 'admin'].includes(role) && centersNav) {
    centersNav.style.display = 'flex';
  }
  
  if (role === 'admin' && usersNav) {
    usersNav.style.display = 'flex';
  }
  
  if (['coordinador', 'admin'].includes(role) && analyticsNav) {
    analyticsNav.style.display = 'flex';
  }
}

function setupPanelNavigation(userData) {
  // Configurar navegación del sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const panelId = this.dataset.panel;
      if (panelId) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar panel
        showPanel(panelId, userData);
      }
    });
  });
}

function showPanel(panelId, userData) {
  console.log('Showing panel:', panelId, 'for user:', userData.nombre);
  
  // Ocultar todos los paneles
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  // Mostrar panel seleccionado
  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    // Cargar contenido específico según el panel
    switch (panelId) {
      case 'dashboard':
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequestsPanel(userData);
        break;
      case 'patients':
        loadPatientsPanel(userData);
        break;
      case 'calendar':
        loadCalendarPanel(userData);
        break;
      case 'followups':
        loadFollowupsPanel(userData);
        break;
      case 'reports':
        loadReportsPanel(userData);
        break;
      case 'centers':
        loadCentersPanel(userData);
        break;
      case 'users':
        loadUsersPanel(userData);
        break;
      case 'analytics':
        loadAnalyticsPanel(userData);
        break;
      default:
        console.warn('Panel desconocido:', panelId);
    }
  }
}

function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    auth.signOut().then(() => {
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada exitosamente', 'success');
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
      showNotification('Error al cerrar sesión', 'error');
    });
  }
}

// ============================================
// FUNCIONES DE FORMULARIOS BÁSICAS
// ============================================

function resetForm() {
  formData = {};
  currentFormStep = 1;
  isDraftSaved = false;
  
  const form = document.getElementById('patient-form');
  if (form) {
    form.reset();
  }
}

function updateFormProgress() {
  const progressBar = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  if (progressBar) {
    const percentage = (currentFormStep / maxFormStep) * 100;
    progressBar.style.width = percentage + '%';
  }
  
  if (progressText) {
    progressText.textContent = `Paso ${currentFormStep} de ${maxFormStep}`;
  }
}

function loadRegionsData() {
  const regionSelect = document.getElementById('patient-region');
  if (regionSelect) {
    regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
    
    Object.entries(regionesChile).forEach(([code, region]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = region.nombre;
      regionSelect.appendChild(option);
    });
    
    regionSelect.addEventListener('change', function() {
      updateComunas(this.value);
    });
  }
}

function updateComunas(regionCode) {
  const comunaSelect = document.getElementById('patient-comuna');
  if (!comunaSelect) return;
  
  comunaSelect.innerHTML = '<option value="">Seleccionar comuna...</option>';
  comunaSelect.disabled = !regionCode;
  
  if (regionCode && regionesChile[regionCode]) {
    regionesChile[regionCode].comunas.forEach(comuna => {
      const option = document.createElement('option');
      option.value = comuna;
      option.textContent = comuna;
      comunaSelect.appendChild(option);
    });
  }
}
// ============================================
// DASHBOARD PRINCIPAL
// ============================================

async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  
  try {
    // Cargar estadísticas generales
    const stats = await loadDashboardStats(userData);
    
    // Actualizar métricas
    updateDashboardMetrics(stats);
    
    // Cargar actividad reciente
    await loadRecentActivity(userData);
    
    // Cargar gráficos si es necesario
    loadDashboardCharts(stats);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

async function loadDashboardStats(userData) {
  const stats = {
    totalPatients: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    criticalCases: 0,
    weekAppointments: 0,
    monthAppointments: 0
  };
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);
    
    // Contar pacientes totales (según rol)
    if (canManagePatients(userData.profesion)) {
      const patientsQuery = userData.profesion === 'admin' 
        ? db.collection('pacientes')
        : db.collection('pacientes').where('profesional_asignado', '==', userData.uid);
      
      const patientsSnapshot = await patientsQuery.get();
      stats.totalPatients = patientsSnapshot.size;
    }
    
    // Contar citas de hoy
    if (canWriteFollowups(userData.profesion)) {
      const todayAppointmentsQuery = db.collection('citas')
        .where('profesional_id', '==', userData.uid)
        .where('fecha', '>=', startOfDay)
        .where('fecha', '<', endOfDay);
      
      const todaySnapshot = await todayAppointmentsQuery.get();
      stats.todayAppointments = todaySnapshot.size;
    }
    
    // Contar solicitudes pendientes (solo asistentes sociales)
    if (canViewRequests(userData.profesion)) {
      const pendingRequestsQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente');
      
      const pendingSnapshot = await pendingRequestsQuery.get();
      stats.pendingRequests = pendingSnapshot.size;
      
      // Contar casos críticos
      const criticalCasesQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.prioridad', '==', 'critica')
        .where('clasificacion.estado', '==', 'pendiente');
      
      const criticalSnapshot = await criticalCasesQuery.get();
      stats.criticalCases = criticalSnapshot.size;
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return stats;
  }
}

function updateDashboardMetrics(stats) {
  const elements = {
    'total-patients': stats.totalPatients,
    'today-appointments': stats.todayAppointments,
    'pending-requests': stats.pendingRequests,
    'critical-cases': stats.criticalCases
  };
  
  Object.keys(elements).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = elements[id];
    }
  });
  
  // Actualizar próxima cita
  updateNextAppointment();
}

async function updateNextAppointment() {
  try {
    if (!currentUserData) return;
    
    const now = new Date();
    const nextAppointmentQuery = db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>', now)
      .where('estado', '==', 'programada')
      .orderBy('fecha')
      .limit(1);
    
    const snapshot = await nextAppointmentQuery.get();
    const nextAppointmentElement = document.getElementById('next-appointment');
    
    if (nextAppointmentElement) {
      if (snapshot.empty) {
        nextAppointmentElement.textContent = 'Sin citas';
      } else {
        const appointment = snapshot.docs[0].data();
        const appointmentDate = appointment.fecha.toDate();
        nextAppointmentElement.textContent = appointmentDate.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
  } catch (error) {
    console.error('Error updating next appointment:', error);
  }
}

async function loadRecentActivity(userData) {
  try {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const activities = [];
    
    // Cargar seguimientos recientes
    if (canWriteFollowups(userData.profesion)) {
      const followupsQuery = db.collection('seguimientos')
        .where('profesional_id', '==', userData.uid)
        .orderBy('fecha', 'desc')
        .limit(5);
      
      const followupsSnapshot = await followupsQuery.get();
      
      for (const doc of followupsSnapshot.docs) {
        const followup = doc.data();
        activities.push({
          type: 'followup',
          date: followup.fecha.toDate(),
          patient: 'Seguimiento completado',
          description: 'Seguimiento clínico completado'
        });
      }
    }
    
    // Ordenar actividades por fecha
    activities.sort((a, b) => b.date - a.date);
    
    // Generar HTML
    if (activities.length === 0) {
      activityList.innerHTML = '<p class="no-data">No hay actividad reciente.</p>';
    } else {
      let html = '';
      activities.slice(0, 8).forEach(activity => {
        const timeAgo = getTimeAgo(activity.date);
        html += `
          <div class="activity-item">
            <div class="activity-icon activity-${activity.type}">
              <i class="fas fa-${activity.type === 'followup' ? 'notes-medical' : 'user-plus'}"></i>
            </div>
            <div class="activity-content">
              <div class="activity-description">${activity.description}</div>
              <div class="activity-patient">${activity.patient}</div>
              <div class="activity-time">${timeAgo}</div>
            </div>
          </div>
        `;
      });
      activityList.innerHTML = html;
    }
    
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      activityList.innerHTML = '<p class="error-message">Error al cargar actividad reciente.</p>';
    }
  }
}

function loadDashboardCharts(stats) {
  // Solo cargar gráficos si Chart.js está disponible
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está disponible');
    return;
  }
  
  // Cargar gráfico de tendencia mensual
  loadTrendChart(stats);
}

function loadTrendChart(stats) {
  const trendCanvas = document.getElementById('trend-chart');
  if (!trendCanvas) return;
  
  // Datos simulados para tendencia mensual
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const data = [12, 19, 15, 25, 22, stats.monthAppointments || 18];
  
  new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Citas por Mes',
        data: data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ============================================
// PANELES BÁSICOS (PLACEHOLDERS)
// ============================================

function loadRequestsPanel(userData) {
  const requestsPanel = document.getElementById('requests-panel');
  if (requestsPanel) {
    if (!canViewRequests(userData.profesion)) {
      requestsPanel.innerHTML = '<p class="access-denied">No tienes permisos para ver solicitudes.</p>';
      return;
    }
    
    requestsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Solicitudes</h1>
        <p class="panel-subtitle">Revisa y gestiona las solicitudes pendientes</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-inbox"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de solicitudes estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadPatientsPanel(userData) {
  const patientsPanel = document.getElementById('patients-panel');
  if (patientsPanel) {
    if (!canManagePatients(userData.profesion)) {
      patientsPanel.innerHTML = '<p class="access-denied">No tienes permisos para gestionar pacientes.</p>';
      return;
    }
    
    patientsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Pacientes</h1>
        <p class="panel-subtitle">Busca y gestiona fichas clínicas</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-users"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de pacientes estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (calendarPanel) {
    if (!canScheduleAppointments(userData.profesion)) {
      calendarPanel.innerHTML = '<p class="access-denied">No tienes permisos para gestionar la agenda.</p>';
      return;
    }
    
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Agenda</h1>
        <p class="panel-subtitle">Programa y gestiona citas con profesionales</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-calendar-alt"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de agenda estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (followupsPanel) {
    if (!canWriteFollowups(userData.profesion)) {
      followupsPanel.innerHTML = '<p class="access-denied">No tienes permisos para realizar seguimientos.</p>';
      return;
    }
    
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos Clínicos</h1>
        <p class="panel-subtitle">Gestiona el historial clínico de tus pacientes</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-clipboard-list"></i>
        <h3>Función en Desarrollo</h3>
        <p>Los seguimientos clínicos estarán disponibles próximamente.</p>
      </div>
    `;
  }
}

function loadReportsPanel(userData) {
  const reportsPanel = document.getElementById('reports-panel');
  if (reportsPanel) {
    if (!canGenerateReports(userData.profesion)) {
      reportsPanel.innerHTML = '<p class="access-denied">No tienes permisos para generar reportes.</p>';
      return;
    }
    
    reportsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Generación de Reportes</h1>
        <p class="panel-subtitle">Genera reportes clínicos y estadísticos del programa</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-file-medical-alt"></i>
        <h3>Función en Desarrollo</h3>
        <p>La generación de reportes estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadCentersPanel(userData) {
  const centersPanel = document.getElementById('centers-panel');
  if (centersPanel) {
    centersPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Centros</h1>
        <p class="panel-subtitle">Administra centros de salud y recursos</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-hospital"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de centros estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadUsersPanel(userData) {
  const usersPanel = document.getElementById('users-panel');
  if (usersPanel) {
    usersPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Gestión de Usuarios</h1>
        <p class="panel-subtitle">Administra profesionales y permisos del sistema</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-user-cog"></i>
        <h3>Función en Desarrollo</h3>
        <p>La gestión de usuarios estará disponible próximamente.</p>
      </div>
    `;
  }
}

function loadAnalyticsPanel(userData) {
  const analyticsPanel = document.getElementById('analytics-panel');
  if (analyticsPanel) {
    analyticsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Analytics Avanzado</h1>
        <p class="panel-subtitle">Análisis estadístico y métricas de desempeño</p>
      </div>
      <div class="placeholder-content">
        <i class="fas fa-chart-bar"></i>
        <h3>Función en Desarrollo</h3>
        <p>Las analíticas avanzadas estarán disponibles próximamente.</p>
      </div>
    `;
  }
}
// ============================================
// FUNCIONES DE AUTENTICACIÓN BÁSICAS
// ============================================

async function handleProfessionalLogin() {
  try {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }
    
    showLoading(true);
    
    // Simular login exitoso para demo
    const mockUserData = {
      uid: 'demo-user-' + Date.now(),
      nombre: 'Dr. Juan Pérez',
      correo: email,
      profesion: 'asistente_social',
      centro_salud: 'CESFAM La Florida'
    };
    
    currentUserData = mockUserData;
    closeModal('professional-modal');
    showProfessionalPanel(mockUserData);
    showNotification('Login exitoso (DEMO)', 'success');
    
  } catch (error) {
    console.error('Error en login:', error);
    showNotification('Error al iniciar sesión', 'error');
  } finally {
    showLoading(false);
  }
}

async function handleProfessionalRegister() {
  try {
    const formData = {
      nombre: document.getElementById('register-name').value,
      email: document.getElementById('register-email').value,
      password: document.getElementById('register-password').value,
      profesion: document.getElementById('register-profession').value,
      licencia: document.getElementById('register-license').value,
      centro: document.getElementById('register-center').value
    };
    
    if (!formData.nombre || !formData.email || !formData.password || !formData.profesion) {
      showNotification('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    showLoading(true);
    
    // Simular registro exitoso para demo
    setTimeout(() => {
      showLoading(false);
      showNotification('Registro exitoso (DEMO). Por favor inicia sesión.', 'success');
      
      // Cambiar a tab de login
      document.querySelector('[data-tab="login"]').click();
    }, 2000);
    
  } catch (error) {
    console.error('Error en registro:', error);
    showNotification('Error al registrar usuario', 'error');
    showLoading(false);
  }
}

async function handlePatientFormSubmit() {
  try {
    showLoading(true);
    
    // Simular envío de formulario
    setTimeout(() => {
      showLoading(false);
      showNotification('Solicitud enviada exitosamente (DEMO)', 'success');
      closeModal('patient-modal');
      resetForm();
    }, 2000);
    
  } catch (error) {
    console.error('Error enviando formulario:', error);
    showNotification('Error al enviar la solicitud', 'error');
    showLoading(false);
  }
}

// ============================================
// MODALES ADICIONALES
// ============================================

function showReentryModal() {
  const modalHTML = `
    <div class="modal-overlay" id="reentry-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('reentry-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Reingresar al Programa</h2>
        <p>Si ya has participado en el programa SENDA anteriormente, puedes reingresar proporcionando tu información.</p>
        
        <form id="reentry-form">
          <div class="form-group">
            <label class="form-label">Número de Ficha Anterior</label>
            <input type="text" class="form-input" placeholder="Ej: 202300123">
          </div>
          
          <div class="form-group">
            <label class="form-label">RUT</label>
            <input type="text" class="form-input" placeholder="12.345.678-9">
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo del Reingreso</label>
            <textarea class="form-textarea" placeholder="Describe brevemente por qué deseas reingresar al programa..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closeModal('reentry-modal')">Cancelar</button>
            <button type="submit" class="btn btn-primary">Solicitar Reingreso</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  showModal('reentry-modal');
}

function showAboutModal() {
  const modalHTML = `
    <div class="modal-overlay" id="about-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('about-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Sobre el Programa SENDA</h2>
        
        <div style="text-align: left; line-height: 1.6;">
          <h3>¿Qué es SENDA?</h3>
          <p>El Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol (SENDA) es la institución del Gobierno de Chile encargada de elaborar las políticas de prevención del consumo y tratamiento de la dependencia a sustancias.</p>
          
          <h3>Nuestros Servicios</h3>
          <ul>
            <li>Evaluación y tratamiento ambulatorio</li>
            <li>Programas de prevención comunitaria</li>
            <li>Apoyo familiar y social</li>
            <li>Seguimiento y rehabilitación</li>
            <li>Programas especializados para diferentes grupos</li>
          </ul>
          
          <h3>Confidencialidad</h3>
          <p>Todos nuestros servicios son <strong>completamente confidenciales</strong> y están protegidos por la Ley de Protección de Datos Personales.</p>
          
          <h3>Contacto</h3>
          <p><strong>Línea de Ayuda:</strong> 1412 (gratuita, 24/7)<br>
          <strong>Emergencias:</strong> 131<br>
          <strong>Sitio web oficial:</strong> www.senda.gob.cl</p>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" onclick="closeModal('about-modal')">Entendido</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  showModal('about-modal');
}

// ============================================
// CONFIGURACIÓN DE TABS
// ============================================

function setupTabFunctionality() {
  // Tabs en modal profesional
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      
      // Actualizar botones
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Actualizar contenido
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const targetTab = document.getElementById(tabName + '-tab');
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
}

// ============================================
// EVENT LISTENERS PRINCIPALES
// ============================================

function initializeEventListeners() {
  console.log('Initializing event listeners...');
  
  // Botón "Solicitar Ayuda"
  const btnRegisterPatient = document.getElementById('register-patient');
  if (btnRegisterPatient) {
    btnRegisterPatient.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Solicitar Ayuda clicked');
      showModal('patient-modal');
    });
  }
  
  // Botón "Acceso Profesional" 
  const btnLoginProfessional = document.getElementById('login-professional');
  if (btnLoginProfessional) {
    btnLoginProfessional.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Acceso Profesional clicked');
      showModal('professional-modal');
    });
  }
  
  // Botón "Encontrar Centro"
  const btnFindCenter = document.getElementById('find-center');
  if (btnFindCenter) {
    btnFindCenter.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Encontrar Centro clicked');
      showModal('center-modal');
    });
  }
  
  // Botón "Reingresar al Programa"
  const btnReentry = document.getElementById('reentry-program');
  if (btnReentry) {
    btnReentry.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Reingresar clicked');
      showReentryModal();
    });
  }
  
  // Botón "Sobre el Programa"
  const btnAbout = document.getElementById('about-program');
  if (btnAbout) {
    btnAbout.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Sobre el Programa clicked');
      showAboutModal();
    });
  }
  
  // Configurar cierres de modales
  setupModalCloseListeners();
  
  // Configurar formularios
  setupFormListeners();
  
  console.log('Event listeners initialized successfully');
}

function setupModalCloseListeners() {
  // Cerrar modales al hacer click en el overlay
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      const modalId = e.target.id;
      closeModal(modalId);
    }
  });
  
  // Cerrar modales con botones de cierre (usar delegación de eventos)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.modal-close')) {
      e.preventDefault();
      const closeBtn = e.target.closest('.modal-close');
      const modalId = closeBtn.dataset.close || closeBtn.closest('.modal-overlay').id;
      closeModal(modalId);
    }
  });
  
  // Cerrar modales con ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });
}

function setupFormListeners() {
  // Usar delegación de eventos para formularios dinámicos
  document.addEventListener('submit', function(e) {
    const formId = e.target.id;
    
    switch (formId) {
      case 'patient-form':
        e.preventDefault();
        console.log('Patient form submitted');
        handlePatientFormSubmit();
        break;
        
      case 'login-form':
        e.preventDefault();
        console.log('Login form submitted');
        handleProfessionalLogin();
        break;
        
      case 'register-form':
        e.preventDefault();
        console.log('Register form submitted');
        handleProfessionalRegister();
        break;
        
      case 'reentry-form':
        e.preventDefault();
        console.log('Reentry form submitted');
        showNotification('Solicitud de reingreso enviada (DEMO)', 'success');
        closeModal('reentry-modal');
        break;
    }
  });
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

function initializeApp() {
  try {
    console.log('SENDA Platform initializing...');
    
    // Verificar Firebase
    if (typeof firebase === 'undefined') {
      console.error('Firebase no está cargado');
      showNotification('Error: Firebase no disponible', 'error');
      return;
    }
    
    // Inicializar componentes
    initializeEventListeners();
    setupTabFunctionality();
    loadRegionsData();
    
    console.log('SENDA Platform initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

// ============================================
// FUNCIONES DE DEBUG Y TESTING
// ============================================

window.sendaDebug = {
  // Funciones básicas
  showModal,
  closeModal,
  showNotification,
  showLoading,
  
  // Estado de la aplicación
  getCurrentUser: () => currentUserData,
  getFormData: () => formData,
  
  // Testing
  testModals: function() {
    console.log('Testing modals...');
    showModal('patient-modal');
  },
  
  simulateLogin: function(profession = 'asistente_social') {
    const mockUser = {
      uid: 'test-user-' + Math.random(),
      nombre: 'Usuario de Prueba',
      profesion: profession,
      correo: 'test@senda.cl',
      centro_salud: 'Centro de Prueba'
    };
    
    currentUserData = mockUser;
    showProfessionalPanel(mockUser);
    console.log('Login simulado como:', profession);
  },
  
  testNotifications: function() {
    showNotification('Notificación de prueba - Info', 'info');
    setTimeout(() => showNotification('Notificación de prueba - Success', 'success'), 1000);
    setTimeout(() => showNotification('Notificación de prueba - Warning', 'warning'), 2000);
    setTimeout(() => showNotification('Notificación de prueba - Error', 'error'), 3000);
  },
  
  resetApp: function() {
    currentUser = null;
    currentUserData = null;
    formData = {};
    
    // Cerrar todos los modales
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
    
    document.body.style.overflow = 'auto';
    console.log('Aplicación reiniciada');
    showNotification('Aplicación reiniciada', 'info');
  }
};

// ============================================
// INICIALIZACIÓN CUANDO DOM ESTÉ LISTO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing SENDA Platform...');
  initializeApp();
});

// Logs finales
console.log('SENDA Platform JavaScript loaded successfully');
console.log('Para testing, usa:');
console.log('- window.sendaDebug.testModals()');
console.log('- window.sendaDebug.simulateLogin("asistente_social")');
console.log('- window.sendaDebug.testNotifications()');
console.log('- window.sendaDebug.resetApp()');
