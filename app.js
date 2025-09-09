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
    console.log('Modal abierto:', modalId);
  } else {
    console.error('Modal no encontrado:', modalId);
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

// Wait for DOM to be fully loaded
window.addEventListener('load', function() {
  console.log('Página completamente cargada, inicializando...');
  initializeApp();
});

function initializeApp() {
  console.log('Inicializando aplicación...');
  
  try {
    // Verificar que los elementos existen
    const registerBtn = document.getElementById('register-patient');
    const loginBtn = document.getElementById('login-professional');
    const aboutBtn = document.getElementById('about-program');
    
    console.log('Elementos encontrados:');
    console.log('- Botón registrar:', registerBtn ? 'SÍ' : 'NO');
    console.log('- Botón login:', loginBtn ? 'SÍ' : 'NO');
    console.log('- Botón about:', aboutBtn ? 'SÍ' : 'NO');
    
    if (registerBtn) {
      registerBtn.addEventListener('click', function() {
        console.log('Click en registro de paciente');
        showModal('patient-modal');
      });
    }
    
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        console.log('Click en login profesional');
        showModal('professional-modal');
      });
    }
    
    if (aboutBtn) {
      aboutBtn.addEventListener('click', function() {
        showNotification('Redirigiendo al sitio oficial de SENDA...', 'info');
        setTimeout(() => {
          window.open('https://www.senda.gob.cl', '_blank');
        }, 1000);
      });
    }
    
    // Setup modal controls
    setupModalControls();
    setupTabFunctionality();
    setupFormValidation();
    setupFormSubmissions();
    
    console.log('Aplicación inicializada correctamente');
    showNotification('Sistema SENDA cargado', 'success');
    
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    showNotification('Error al cargar el sistema', 'error');
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

function setupFormSubmissions() {
  // Patient form
  const patientForm = document.getElementById('patient-form');
  if (patientForm) {
    patientForm.addEventListener('submit', handlePatientRegistration);
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleProfessionalLogin);
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleProfessionalRegistration);
  }
}

// Patient Registration Handler
async function handlePatientRegistration(e) {
  e.preventDefault();
  console.log('Procesando registro de paciente...');
  
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
    showNotification('Inscripción enviada exitosamente', 'success');
    closeModal('patient-modal');
    document.getElementById('patient-form').reset();
  } catch (error) {
    console.error('Error enviando inscripción:', error);
    showNotification('Error al enviar la inscripción: ' + error.message, 'error');
  }
}

// Professional Login Handler
async function handleProfessionalLogin(e) {
  e.preventDefault();
  console.log('Procesando login...');
  
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
    console.error('Error de login:', error);
    let errorMessage = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    }
    showNotification(errorMessage, 'error');
  }
}

// Professional Registration Handler
async function handleProfessionalRegistration(e) {
  e.preventDefault();
  console.log('Procesando registro de profesional...');
  
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

    showNotification('Registro exitoso', 'success');
    
    // Switch to login tab
    const loginTab = document.querySelector('[data-tab="login"]');
    if (loginTab) {
      loginTab.click();
    }
    
    document.getElementById('register-form').reset();
    document.getElementById('login-email').value = formData.email;
    
  } catch (error) {
    console.error('Error de registro:', error);
    let errorMessage = 'Error al registrar';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'El correo ya está registrado';
    }
    showNotification(errorMessage, 'error');
  }
}

// Professional Panel
function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  
  if (userName) userName.textContent = userData.nombre;
  if (userRole) userRole.textContent = getProfessionName(userData.profesion);
  if (userAvatar) userAvatar.textContent = userData.nombre.substring(0, 2).toUpperCase();

  setupPanelNavigation(userData);
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const panel = item.dataset.panel;
      if (panel) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.panel-content').forEach(p => {
          p.classList.add('hidden');
          p.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(panel + '-panel');
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
          targetPanel.classList.add('active');
        }
      }
    });
  });
}

async function handleLogout() {
  if (confirm('¿Cerrar sesión?')) {
    try {
      await auth.signOut();
      closeModal('panel-modal');
      showNotification('Sesión cerrada', 'success');
    } catch (error) {
      showNotification('Error al cerrar sesión', 'error');
    }
  }
}

// Authentication Observer
auth.onAuthStateChanged(user => {
  currentUser = user;
});

console.log('Script SENDA cargado');
