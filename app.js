
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
  
  const container = document.getElementById('notifications');
  if (container) {
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  try {
    // Initialize all event listeners
    initializeEventListeners();
    setupFormValidation();
    setupTabFunctionality();
    setupModalControls();
    
    console.log('App initialized successfully');
    showNotification('Sistema SENDA cargado correctamente', 'success');
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

function initializeEventListeners() {
  // Main action buttons
  const registerBtn = document.getElementById('register-patient');
  const loginBtn = document.getElementById('login-professional');
  const aboutBtn = document.getElementById('about-program');

  if (registerBtn) {
    registerBtn.addEventListener('click', function() {
      console.log('Register patient button clicked');
      showModal('patient-modal');
    });
  } else {
    console.error('Register patient button not found');
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      console.log('Login professional button clicked');
      showModal('professional-modal');
    });
  } else {
    console.error('Login professional button not found');
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', function() {
      showNotification('Redirigiendo al sitio oficial de SENDA...', 'info');
      setTimeout(() => {
        window.open('https://www.senda.gob.cl', '_blank');
      }, 1000);
    });
  }

  // Form submissions
  const patientForm = document.getElementById('patient-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (patientForm) {
    patientForm.addEventListener('submit', handlePatientRegistration);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleProfessionalLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleProfessionalRegistration);
  }
}

function setupModalControls() {
  // Close modal buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const modalId = e.target.closest('[data-close]').dataset.close;
      closeModal(modalId);
    });
  });

  // Close modals when clicking outside
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

function setupTabFunctionality() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabGroup = btn.closest('.tabs');
      const targetTab = btn.dataset.tab;
      
      if (tabGroup) {
        // Remove active from all tabs and contents
        tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active to clicked tab and corresponding content
        btn.classList.add('active');
        const tabContent = document.getElementById(targetTab + '-tab');
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    });
  });
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

// Patient Registration Handler
async function handlePatientRegistration(e) {
  e.preventDefault();
  console.log('Handling patient registration...');
  
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
  console.log('Handling professional login...');
  
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
  console.log('Handling professional registration...');
  
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
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) {
      loginTab.click();
    }
    
    document.getElementById('register-form').reset();
    
    // Pre-fill login email
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) {
      loginEmail.value = formData.email;
    }
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
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  
  if (userName) userName.textContent = userData.nombre;
  if (userRole) userRole.textContent = getProfessionName(userData.profesion);
  if (userAvatar) userAvatar.textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Setup navigation
  setupPanelNavigation(userData);
  
  // Load initial panel
  showPanel('dashboard', userData);

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Load requests badge
  updateRequestsBadge();
}

function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
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
    }
  }
}

async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  // Dashboard loading logic here
}

async function loadRequests(userData) {
  console.log('Loading requests for:', userData.nombre);
  // Requests loading logic here
}

function setupPatientSearch(userData) {
  console.log('Setting up patient search for:', userData.nombre);
  // Patient search logic here
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
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();
      
      // Reset to login tab
      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab) loginTab.click();
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
  }
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

// Error handling
window.addEventListener('error', function(e) {
  console.error('JavaScript error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});

// Export functions for debugging
window.sendaApp = {
  showNotification,
  showModal,
  closeModal,
  formatRUT,
  validateRUT,
  getProfessionName
};

console.log('SENDA App script loaded');
