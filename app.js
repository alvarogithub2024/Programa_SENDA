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

// Global Variables
let currentUser = null;
let currentUserData = null;

// Utility Functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
  
  document.getElementById('notifications').appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function formatRUT(rut) {
  const cleaned = rut.replace(/[^\dKk]/g, '');
  if (cleaned.length > 1) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
  }
  return cleaned;
}

function validateRUT(rut) {
  const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
  if (cleaned.length < 8) return false;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return dv === finalDV;
}

function formatPhoneNumber(phone) {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Chilean phone numbers
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
  } else if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 11 && cleaned.startsWith('56')) {
    return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  
  return phone;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getProfessionName(profession) {
  const names = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional'
  };
  return names[profession] || profession;
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

// Authentication State Observer
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    loadUserData(user.uid);
  }
});

async function loadUserData(uid) {
  try {
    const doc = await db.collection('profesionales').doc(uid).get();
    if (doc.exists) {
      currentUserData = { uid, ...doc.data() };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  setupFormValidation();
});

function initializeEventListeners() {
  // Modal controls
  document.getElementById('register-patient').addEventListener('click', () => showModal('patient-modal'));
  document.getElementById('login-professional').addEventListener('click', () => showModal('professional-modal'));
  
  // About program button
  document.getElementById('about-program').addEventListener('click', () => {
    showNotification('Redirigiendo al sitio oficial de SENDA...', 'info');
    setTimeout(() => {
      window.open('https://www.senda.gob.cl', '_blank');
    }, 1000);
  });

  // Close modal buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.target.closest('[data-close]').dataset.close);
    });
  });

  // Close modals when clicking outside
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Tab functionality
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tabs');
      const targetTab = btn.dataset.tab;
      
      // Remove active from all tabs and contents
      tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active to clicked tab and corresponding content
      btn.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
    });
  });

  // Form submissions
  document.getElementById('patient-form').addEventListener('submit', handlePatientRegistration);
  document.getElementById('login-form').addEventListener('submit', handleProfessionalLogin);
  document.getElementById('register-form').addEventListener('submit', handleProfessionalRegistration);
}

function setupFormValidation() {
  // RUT formatting and validation
  const rutInput = document.getElementById('patient-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });

    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        showNotification('El RUT ingresado no es válido', 'error');
        e.target.focus();
      }
    });
  }

  // Phone number formatting
  const phoneInput = document.getElementById('patient-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }

  // Email validation
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function(e) {
      const email = e.target.value.trim();
      if (email && !isValidEmail(email)) {
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
        e.target.focus();
      }
    });
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Patient Registration Handler
async function handlePatientRegistration(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('patient-name').value.trim(),
    lastname: document.getElementById('patient-lastname').value.trim(),
    rut: document.getElementById('patient-rut').value.trim(),
    phone: document.getElementById('patient-phone').value.trim(),
    email: document.getElementById('patient-email').value.trim(),
    comuna: document.getElementById('patient-comuna').value.trim(),
    address: document.getElementById('patient-address').value.trim(),
    reason: document.getElementById('patient-reason').value.trim(),
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    derivacion: 'pendiente'
  };

  // Validate required fields
  if (!formData.name || !formData.lastname || !formData.rut || !formData.phone || !formData.email) {
    showNotification('Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  // Validate RUT
  if (!validateRUT(formData.rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }

  // Validate email
  if (!isValidEmail(formData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    return;
  }

  try {
    // Check if RUT already exists
    const existingPatient = await db.collection('solicitudes')
      .where('rut', '==', formData.rut)
      .get();

    if (!existingPatient.empty) {
      showNotification('Ya existe un paciente registrado con este RUT', 'warning');
      return;
    }

    await db.collection('solicitudes').add(formData);
    showNotification('Inscripción enviada exitosamente. Recibirás una confirmación por correo.', 'success');
    closeModal('patient-modal');
    document.getElementById('patient-form').reset();
  } catch (error) {
    console.error('Error submitting patient registration:', error);
    showNotification('Error al enviar la inscripción: ' + error.message, 'error');
  }
}

// Professional Login Handler
async function handleProfessionalLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showNotification('Por favor ingresa tu correo y contraseña', 'error');
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    if (doc.exists) {
      const userData = doc.data();
      currentUserData = { uid: user.uid, ...userData };
      showNotification('Bienvenido, ' + userData.nombre, 'success');
      closeModal('professional-modal');
      showProfessionalPanel(userData);
    } else {
      showNotification('No se encontraron datos de usuario profesional', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe un usuario con este correo electrónico';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido';
    }
    showNotification(errorMessage, 'error');
  }
}

// Professional Registration Handler
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('register-name').value.trim(),
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value,
    profession: document.getElementById('register-profession').value,
    license: document.getElementById('register-license').value.trim()
  };

  // Validate required fields
  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Por favor completa todos los campos', 'error');
    return;
  }

  // Validate email
  if (!isValidEmail(formData.email)) {
    showNotification('Por favor ingresa un correo electrónico válido', 'error');
    return;
  }

  // Validate password strength
  if (formData.password.length < 6) {
    showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    await db.collection('profesionales').doc(user.uid).set({
      nombre: formData.name,
      correo: formData.email,
      profesion: formData.profession,
      licencia: formData.license,
      creado: firebase.firestore.FieldValue.serverTimestamp(),
      activo: true
    });

    showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
    // Switch to login tab
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('register-form').reset();
    
    // Pre-fill login email
    document.getElementById('login-email').value = formData.email;
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Error al registrar';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'El correo ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido';
    }
    showNotification(errorMessage, 'error');
  }
}

// Professional Panel Functions
function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  // Update user info
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Setup navigation
  setupPanelNavigation(userData);
  
  // Load initial panel
  showPanel('dashboard', userData);

  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Load requests badge
  updateRequestsBadge();
}

function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    // Remove existing event listeners
    item.replaceWith(item.cloneNode(true));
  });

  // Re-add event listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      if (panel) {
        showPanel(panel, userData);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function showPanel(panelId, userData) {
  // Hide all panels
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  // Show selected panel
  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    // Load panel-specific content
    switch (panelId) {
      case 'dashboard':
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequests(userData);
        break;
      case 'patients':
        setupPatientSearch(userData);
        break;
      case 'calendar':
        loadCalendar(userData);
        break;
      case 'reports':
        loadReports(userData);
        break;
      case 'settings':
        loadSettings(userData);
        break;
    }
  }
}

async function loadDashboard(userData) {
  try {
    // Load dashboard statistics
    const stats = await loadDashboardStats(userData);
    updateDashboardCards(stats);
    
    // Load recent activity
    loadRecentActivity();
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
    completedThisMonth: 0
  };

  try {
    // Total patients
    const patientsSnapshot = await db.collection('solicitudes').get();
    stats.totalPatients = patientsSnapshot.size;

    // Pending requests
    const pendingSnapshot = await db.collection('solicitudes')
      .where('derivacion', '==', 'pendiente')
      .get();
    stats.pendingRequests = pendingSnapshot.size;

    // Today's appointments (mock data for now)
    stats.todayAppointments = Math.floor(Math.random() * 12) + 3;

    // Completed this month (mock data for now)
    stats.completedThisMonth = Math.floor(Math.random() * 50) + 20;

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }

  return stats;
}

function updateDashboardCards(stats) {
  // Update the dashboard cards with real data
  const cards = document.querySelectorAll('#dashboard-panel .card');
  if (cards.length >= 3) {
    cards[0].querySelector('div:nth-child(2)').textContent = stats.totalPatients;
    cards[1].querySelector('div:nth-child(2)').textContent = stats.todayAppointments;
    cards[2].querySelector('div:nth-child(2)').textContent = stats.pendingRequests;
  }
}

async function loadRecentActivity() {
  const activityContainer = document.getElementById('recent-activity');
  if (!activityContainer) return;

  try {
    const recentSolicitudes = await db.collection('solicitudes')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    let html = '';
    recentSolicitudes.forEach(doc => {
      const data = doc.data();
      const color = data.derivacion === 'pendiente' ? 'var(--warning-orange)' : 
                   data.derivacion === 'medico' ? 'var(--secondary-blue)' : 'var(--success-green)';
      
      html += `
        <div style="padding: 16px; border-left: 3px solid ${color}; margin-bottom: 16px; background: var(--gray-50); border-radius: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${data.derivacion === 'pendiente' ? 'Nueva solicitud' : 
              data.derivacion === 'medico' ? 'Solicitud derivada' : 'Atención completada'}
          </div>
          <div style="color: var(--gray-600); font-size: 14px;">
            ${data.name} ${data.lastname} - ${formatDate(data.createdAt)}
          </div>
        </div>
      `;
    });

    activityContainer.innerHTML = html || '<p>No hay actividad reciente.</p>';
  } catch (error) {
    console.error('Error loading recent activity:', error);
    activityContainer.innerHTML = '<p>Error al cargar actividad reciente.</p>';
  }
}

async function loadRequests(userData) {
  const requestsList = document.getElementById('requests-list');
  requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';

  try {
    const snapshot = await db.collection('solicitudes')
      .where('derivacion', '==', 'pendiente')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      requestsList.innerHTML = '<div class="card"><p>No hay solicitudes pendientes.</p></div>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += createRequestCard(doc.id, data, userData);
    });

    requestsList.innerHTML = html;

    // Add event listeners for derive buttons
    document.querySelectorAll('.derive-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const requestId = e.target.dataset.requestId;
        deriveRequest(requestId, userData);
      });
    });

  } catch (error) {
    console.error('Error loading requests:', error);
    requestsList.innerHTML = '<div class="card"><p style="color: var(--danger-red);">Error al cargar solicitudes: ' + error.message + '</p></div>';
  }
}

function createRequestCard(id, data, userData) {
  const canDerive = userData.profesion === 'asistente_social';
  
  return `
    <div class="card patient-card">
      <div class="patient-header">
        <div>
          <div class="patient-name">${data.name} ${data.lastname}</div>
          <div class="patient-id">RUT: ${data.rut}</div>
        </div>
        <span class="status-badge status-pending">Pendiente</span>
      </div>
      
      <div class="patient-info">
        <div><strong>Comuna:</strong> ${data.comuna}</div>
        <div><strong>Teléfono:</strong> ${data.phone}</div>
        <div><strong>Email:</strong> ${data.email}</div>
        <div><strong>Dirección:</strong> ${data.address}</div>
        <div><strong>Fecha solicitud:</strong> ${formatDate(data.createdAt)}</div>
      </div>
      
      ${data.reason ? `<div style="margin-top: 16px;"><strong>Motivo:</strong> ${data.reason}</div>` : ''}
      
      ${canDerive ? `
        <div style="margin-top: 20px;">
          <textarea placeholder="Observación para derivación (obligatorio)..." id="obs-${id}" class="form-textarea" style="margin-bottom: 12px;" required></textarea>
          <button class="btn btn-primary derive-btn" data-request-id="${id}">
            <i class="fas fa-paper-plane"></i>
            Derivar al Médico
          </button>
        </div>
      ` : '<div style="margin-top: 16px; color: var(--gray-600); font-style: italic;">Solo los asistentes sociales pueden derivar solicitudes.</div>'}
    </div>
  `;
}

async function deriveRequest(requestId, userData) {
  const observation = document.getElementById('obs-' + requestId).value.trim();
  
  if (!observation) {
    showNotification('Debes ingresar una observación para la derivación', 'warning');
    document.getElementById('obs-' + requestId).focus();
    return;
  }

  if (observation.length < 10) {
    showNotification('La observación debe tener al menos 10 caracteres', 'warning');
    return;
  }

  try {
    await db.collection('solicitudes').doc(requestId).update({
      derivacion: 'medico',
      observacion_derivacion: observation,
      derivado_por: userData.nombre,
      fecha_derivacion: firebase.firestore.FieldValue.serverTimestamp(),
      derivado_por_uid: userData.uid
    });

    showNotification('Solicitud derivada exitosamente', 'success');
    loadRequests(userData); // Reload requests
    updateRequestsBadge(); // Update badge count
  } catch (error) {
    console.error('Error deriving request:', error);
    showNotification('Error al derivar solicitud: ' + error.message, 'error');
  }
}

function setupPatientSearch(userData) {
  const searchInput = document.getElementById('patient-search');
  const patientsList = document.getElementById('patients-list');

  // Clear previous event listeners
  searchInput.replaceWith(searchInput.cloneNode(true));
  const newSearchInput = document.getElementById('patient-search');

  newSearchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length < 3) {
      patientsList.innerHTML = '<div class="card"><p>Ingresa al menos 3 caracteres para buscar.</p></div>';
      return;
    }

    patientsList.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando pacientes...</div>';

    try {
      const snapshot = await db.collection('solicitudes').get();
      
      const results = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const searchText = `${data.name} ${data.lastname} ${data.rut} ${data.comuna}`.toLowerCase();
        
        if (searchText.includes(query)) {
          results.push({ id: doc.id, ...data });
        }
      });

      if (results.length === 0) {
        patientsList.innerHTML = '<div class="card"><p>No se encontraron pacientes con ese criterio de búsqueda.</p></div>';
        return;
      }

      // Sort by creation date (newest first)
      results.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      let html = '';
      results.forEach(patient => {
        html += createPatientCard(patient.id, patient);
      });

      patientsList.innerHTML = html;

      // Add click listeners for patient cards
      document.querySelectorAll('.patient-card').forEach(card => {
        card.addEventListener('click', () => {
          const patientId = card.dataset.patientId;
          showPatientDetails(patientId, userData);
        });
      });

    } catch (error) {
      console.error('Error searching patients:', error);
      patientsList.innerHTML = '<div class="card"><p style="color: var(--danger-red);">Error en la búsqueda: ' + error.message + '</p></div>';
    }
  }, 500));
}

function createPatientCard(id, data) {
  const statusClass = data.derivacion === 'pendiente' ? 'status-pending' : 
                     data.derivacion === 'medico' ? 'status-in-progress' : 'status-completed';
  const statusText = data.derivacion === 'pendiente' ? 'Pendiente' : 
                    data.derivacion === 'medico' ? 'Derivado' : 'Atendido';

  return `
    <div class="card patient-card" data-patient-id="${id}" style="cursor: pointer;">
      <div class="patient-header">
        <div>
          <div class="patient-name">${data.name} ${data.lastname}</div>
          <div class="patient-id">RUT: ${data.rut}</div>
        </div>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      
      <div class="patient-info">
        <div><strong>Comuna:</strong> ${data.comuna}</div>
        <div><strong>Teléfono:</strong> ${data.phone}</div>
        <div><strong>Email:</strong> ${data.email}</div>
        <div><strong>Fecha registro:</strong> ${formatDate(data.createdAt)}</div>
      </div>
      
      ${data.observacion_derivacion ? `
        <div style="margin-top: 12px; padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 3px solid var(--secondary-blue);">
          <strong>Observación derivación:</strong> ${data.observacion_derivacion}
        </div>
      ` : ''}
      
      <div style="margin-top: 16px; color: var(--secondary-blue); font-weight: 500;">
        <i class="fas fa-arrow-right"></i> Hacer clic para ver ficha completa
      </div>
    </div>
  `;
}

async function showPatientDetails(patientId, userData) {
  try {
    const doc = await db.collection('solicitudes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('No se encontró la información del paciente', 'error');
      return;
    }

    const patientData = doc.data();
    
    // Create a detailed modal or redirect to a detailed view
    // For now, we'll show an enhanced notification with patient details
    const detailsMessage = `
      Paciente: ${patientData.name} ${patientData.lastname}
      RUT: ${patientData.rut}
      Estado: ${patientData.derivacion}
      Comuna: ${patientData.comuna}
      Teléfono: ${patientData.phone}
    `;
    
    showNotification('Ficha del paciente cargada. Funcionalidad detallada en desarrollo.', 'info');
    
    // TODO: Implement detailed patient view
    console.log('Patient details:', patientData);
    
  } catch (error) {
    console.error('Error loading patient details:', error);
    showNotification('Error al cargar los detalles del paciente', 'error');
  }
}

function loadCalendar(userData) {
  // TODO: Implement calendar functionality
  console.log('Loading calendar for user:', userData);
}

function loadReports(userData) {
  // TODO: Implement reports functionality
  console.log('Loading reports for user:', userData);
}

function loadSettings(userData) {
  // TODO: Implement settings functionality
  console.log('Loading settings for user:', userData);
}

async function updateRequestsBadge() {
  try {
    const snapshot = await db.collection('solicitudes')
      .where('derivacion', '==', 'pendiente')
      .get();
    
    const badge = document.getElementById('requests-badge');
    if (badge) {
      const count = snapshot.size;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Error updating requests badge:', error);
  }
}

async function handleLogout() {
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    try {
      await auth.signOut();
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada correctamente', 'success');
      
      // Clear forms
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
      
      // Reset to login tab
      document.querySelector('[data-tab="login"]').click();
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
  }
}

// Initialize real-time listeners
function initializeRealtimeListeners() {
  if (!currentUser) return;

  // Listen for new requests
  db.collection('solicitudes')
    .where('derivacion', '==', 'pendiente')
    .onSnapshot(snapshot => {
      updateRequestsBadge();
      
      // If we're currently viewing requests, reload them
      const requestsPanel = document.getElementById('requests-panel');
      if (requestsPanel && !requestsPanel.classList.contains('hidden')) {
        loadRequests(currentUserData);
      }
    });
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification('Ha ocurrido un error inesperado', 'error');
});

// Export functions for potential external use
window.sendaApp = {
  showNotification,
  formatRUT,
  validateRUT,
  formatPhoneNumber,
  getProfessionName
};
