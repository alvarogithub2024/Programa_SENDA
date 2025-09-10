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
let currentFormStep = 1;
let formData = {};
let isDraftSaved = false;
let flowSteps = [1];
let currentStepIndex = 0;

// Chilean Regions Data (simplified)
const regionesChile = {
  "metropolitana": { nombre: "Metropolitana de Santiago", comunas: ["Santiago", "Las Condes", "Providencia", "La Florida", "Maipú", "Puente Alto"] },
  "valparaiso": { nombre: "Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana"] },
  "biobio": { nombre: "Biobío", comunas: ["Concepción", "Talcahuano", "Los Ángeles", "Chillán"] }
};

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> 
    ${message}
    <button onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => notification.remove(), duration);
}

function showModal(modalId) {
  document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function showLoading(show = true) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.toggle('hidden', !show);
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
  let sum = 0, multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  return dv === finalDV;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculatePriority(data) {
  let score = 0;
  if (data.sustancias?.includes('pasta_base')) score += 3;
  if (data.sustancias?.includes('cocaina')) score += 2;
  if (data.edad < 18) score += 2;
  if (data.urgencia === 'critica') score += 4;
  if (data.urgencia === 'alta') score += 2;
  
  if (score >= 6) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  setupEventListeners();
  loadRegionsData();
  setupFormValidation();
  loadDraftIfExists();
  showNotification('Sistema SENDA cargado', 'success', 2000);
}

function setupEventListeners() {
  // Main buttons - Using event delegation for reliability
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    switch(target.id) {
      case 'register-patient':
        e.preventDefault();
        openPatientForm();
        break;
      case 'reentry-program':
        e.preventDefault();
        openPatientForm(true);
        break;
      case 'login-professional':
        e.preventDefault();
        showModal('professional-modal');
        break;
      case 'find-center':
        e.preventDefault();
        showModal('center-modal');
        loadNearbyClinicas();
        break;
      case 'about-program':
        e.preventDefault();
        window.open('https://www.senda.gob.cl/quienes-somos/', '_blank');
        break;
      case 'next-step':
        e.preventDefault();
        nextFormStep();
        break;
      case 'prev-step':
        e.preventDefault();
        prevFormStep();
        break;
      case 'submit-form':
        e.preventDefault();
        submitPatientForm();
        break;
      case 'save-draft':
        e.preventDefault();
        saveDraft();
        break;
      case 'use-location':
        e.preventDefault();
        getCurrentLocation();
        break;
      case 'logout-btn':
        e.preventDefault();
        handleLogout();
        break;
    }
    
    // Close modals
    if (target.hasAttribute('data-close')) {
      e.preventDefault();
      closeModal(target.getAttribute('data-close'));
    }
  });
  
  // Form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    
    switch(e.target.id) {
      case 'patient-form':
        handlePatientRegistration();
        break;
      case 'login-form':
        handleProfessionalLogin();
        break;
      case 'register-form':
        handleProfessionalRegistration();
        break;
    }
  });
  
  // Tab functionality
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
      const tabGroup = e.target.closest('.tabs');
      const targetTab = e.target.dataset.tab;
      
      tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.target.classList.add('active');
      document.getElementById(targetTab + '-tab')?.classList.add('active');
    }
  });
  
  // Region change
  const regionSelect = document.getElementById('patient-region');
  if (regionSelect) {
    regionSelect.addEventListener('change', function() {
      loadCommunesData(this.value);
    });
  }
  
  // Form step type change
  document.addEventListener('change', function(e) {
    if (e.target.name === 'tipoSolicitud') {
      handleTipoSolicitudChange(e.target.value);
    }
  });
}

// ===== PATIENT FORM FUNCTIONS =====
function openPatientForm(isReentry = false) {
  formData = isReentry ? { isReentry: true } : {};
  currentFormStep = 1;
  currentStepIndex = 0;
  flowSteps = [1];
  isDraftSaved = false;
  
  showModal('patient-modal');
  updateFormProgress();
  
  if (isReentry) {
    showNotification('Formulario de reingreso activado', 'info');
  }
}

function handleTipoSolicitudChange(tipoSolicitud) {
  const phoneContainer = document.getElementById('anonymous-phone-container');
  const emailContainer = document.getElementById('info-email-container');
  
  // Hide all special fields
  if (phoneContainer) phoneContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'none';
  
  // Configure flow steps
  switch(tipoSolicitud) {
    case 'anonimo':
      flowSteps = [1, 3, 4];
      if (phoneContainer) phoneContainer.style.display = 'block';
      break;
    case 'identificado':
      flowSteps = [1, 2, 3, 4];
      break;
    case 'informacion':
      flowSteps = [1];
      if (emailContainer) emailContainer.style.display = 'block';
      break;
  }
  
  updateFormProgress();
}

function updateFormProgress() {
  const progressFill = document.getElementById('form-progress');
  const progressText = document.getElementById('progress-text');
  
  const totalSteps = flowSteps.length;
  const currentStepInFlow = currentStepIndex + 1;
  const progress = (currentStepInFlow / totalSteps) * 100;
  
  if (progressFill) progressFill.style.width = progress + '%';
  if (progressText) progressText.textContent = `Paso ${currentStepInFlow} de ${totalSteps}`;
  
  // Show/hide navigation buttons
  document.getElementById('prev-step').style.display = currentStepIndex > 0 ? 'block' : 'none';
  document.getElementById('next-step').style.display = currentStepIndex < flowSteps.length - 1 ? 'block' : 'none';
  document.getElementById('submit-form').style.display = currentStepIndex === flowSteps.length - 1 ? 'block' : 'none';
}

function nextFormStep() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    
    if (currentStepIndex < flowSteps.length - 1) {
      document.querySelector(`[data-step="${flowSteps[currentStepIndex]}"]`).classList.remove('active');
      currentStepIndex++;
      currentFormStep = flowSteps[currentStepIndex];
      document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
      updateFormProgress();
      saveDraft(false);
    }
  }
}

function prevFormStep() {
  if (currentStepIndex > 0) {
    document.querySelector(`[data-step="${flowSteps[currentStepIndex]}"]`).classList.remove('active');
    currentStepIndex--;
    currentFormStep = flowSteps[currentStepIndex];
    document.querySelector(`[data-step="${currentFormStep}"]`).classList.add('active');
    updateFormProgress();
  }
}

function validateCurrentStep() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  const requiredFields = currentStepElement.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (field.offsetParent === null) return; // Skip hidden fields
    
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  // Specific validations
  if (currentFormStep === 1) {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
    const paraMi = document.querySelector('input[name="paraMi"]:checked');
    
    if (!tipoSolicitud || !paraMi) {
      showNotification('Por favor completa todos los campos obligatorios', 'error');
      return false;
    }
    
    if (tipoSolicitud.value === 'anonimo') {
      const phone = document.getElementById('anonymous-phone')?.value;
      if (!phone) {
        showNotification('Por favor ingresa un teléfono de contacto', 'error');
        return false;
      }
    }
    
    if (tipoSolicitud.value === 'informacion') {
      const email = document.getElementById('info-email')?.value;
      if (!email || !isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
      }
    }
  }
  
  if (currentFormStep === 3 && formData.tipoSolicitud !== 'informacion') {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Por favor selecciona al menos una sustancia', 'error');
      return false;
    }
  }
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
}

function collectCurrentStepData() {
  if (currentFormStep === 1) {
    formData.tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    formData.edad = document.getElementById('patient-age').value;
    formData.region = document.getElementById('patient-region').value;
    formData.paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    
    if (formData.tipoSolicitud === 'anonimo') {
      formData.telefonoContacto = document.getElementById('anonymous-phone')?.value;
    }
    if (formData.tipoSolicitud === 'informacion') {
      formData.emailInformacion = document.getElementById('info-email')?.value;
    }
  }
  
  if (currentFormStep === 2 && formData.tipoSolicitud === 'identificado') {
    formData.nombre = document.getElementById('patient-name').value;
    formData.apellido = document.getElementById('patient-lastname').value;
    formData.rut = document.getElementById('patient-rut').value;
    formData.telefono = document.getElementById('patient-phone').value;
    formData.email = document.getElementById('patient-email').value;
    formData.comuna = document.getElementById('patient-comuna').value;
    formData.direccion = document.getElementById('patient-address').value;
  }
  
  if (currentFormStep === 3 && formData.tipoSolicitud !== 'informacion') {
    const sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value);
    formData.sustancias = sustancias;
    formData.tiempoConsumo = document.getElementById('tiempo-consumo').value;
    formData.motivacion = document.getElementById('motivacion').value;
    formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
  }
  
  if (currentFormStep === 4) {
    formData.razon = document.getElementById('patient-reason').value;
    formData.tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    formData.centroPreferencia = document.getElementById('centro-preferencia').value;
  }
}

function submitPatientForm() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    handlePatientRegistration();
  }
}

async function handlePatientRegistration() {
  showLoading(true);
  
  try {
    const prioridad = calculatePriority(formData);
    
    const solicitudData = {
      clasificacion: {
        tipo: formData.isReentry ? 'reingreso' : 'ingreso_voluntario',
        estado: 'pendiente',
        prioridad: prioridad
      },
      datos_personales: {
        anonimo: formData.tipoSolicitud === 'anonimo',
        solo_informacion: formData.tipoSolicitud === 'informacion',
        edad: parseInt(formData.edad),
        region: formData.region,
        para_quien: formData.paraMi
      },
      datos_contacto: {},
      evaluacion_inicial: formData.tipoSolicitud !== 'informacion' ? {
        sustancias_consumo: formData.sustancias || [],
        tiempo_consumo_meses: parseInt(formData.tiempoConsumo) || 0,
        motivacion_cambio: parseInt(formData.motivacion) || 5,
        urgencia_declarada: formData.urgencia || 'no_especificada',
        tratamiento_previo: formData.tratamientoPrevio || 'no',
        descripcion_situacion: formData.razon || ''
      } : null,
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_publica'
      }
    };
    
    // Add contact data based on type
    if (formData.tipoSolicitud === 'identificado') {
      solicitudData.datos_contacto = {
        telefono_principal: formData.telefono,
        email: formData.email,
        nombre_completo: `${formData.nombre} ${formData.apellido}`,
        rut: formData.rut
      };
    } else if (formData.tipoSolicitud === 'anonimo') {
      solicitudData.datos_contacto = {
        telefono_principal: formData.telefonoContacto,
        es_anonimo: true
      };
    } else if (formData.tipoSolicitud === 'informacion') {
      solicitudData.datos_contacto = {
        email: formData.emailInformacion,
        solo_informacion: true
      };
    }

    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    // Create critical alert if needed
    if (prioridad === 'critica') {
      await db.collection('alertas_criticas').add({
        id_solicitud: docRef.id,
        tipo_alerta: 'caso_critico_nuevo',
        prioridad: 'maxima',
        mensaje: `Nuevo caso crítico: ${formData.edad} años`,
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente'
      });
    }
    
    localStorage.removeItem('senda_draft');
    isDraftSaved = false;
    
    const trackingCode = docRef.id.substring(0, 8).toUpperCase();
    showNotification(`Solicitud enviada exitosamente. Código: ${trackingCode}`, 'success', 6000);
    
    closeModal('patient-modal');
    resetForm();
    
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error al enviar la solicitud. Intenta nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}

function saveDraft(showMessage = true) {
  collectCurrentStepData();
  localStorage.setItem('senda_draft', JSON.stringify({
    ...formData,
    currentStep: currentFormStep,
    currentStepIndex: currentStepIndex,
    flowSteps: flowSteps,
    timestamp: new Date().toISOString()
  }));
  isDraftSaved = true;
  if (showMessage) showNotification('Borrador guardado', 'success', 2000);
}

function loadDraftIfExists() {
  const draft = localStorage.getItem('senda_draft');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      const draftAge = new Date() - new Date(draftData.timestamp);
      
      if (draftAge < 24 * 60 * 60 * 1000) {
        if (confirm('Se encontró un borrador. ¿Continuar?')) {
          formData = draftData;
          currentFormStep = draftData.currentStep || 1;
          currentStepIndex = draftData.currentStepIndex || 0;
          flowSteps = draftData.flowSteps || [1];
          isDraftSaved = true;
        } else {
          localStorage.removeItem('senda_draft');
        }
      } else {
        localStorage.removeItem('senda_draft');
      }
    } catch (error) {
      localStorage.removeItem('senda_draft');
    }
  }
}

function resetForm() {
  formData = {};
  currentFormStep = 1;
  currentStepIndex = 0;
  flowSteps = [1];
  isDraftSaved = false;
  
  const form = document.getElementById('patient-form');
  if (form) {
    form.reset();
    document.querySelectorAll('.form-step').forEach((step, index) => {
      step.classList.toggle('active', index === 0);
    });
    
    // Hide conditional fields
    const phoneContainer = document.getElementById('anonymous-phone-container');
    const emailContainer = document.getElementById('info-email-container');
    if (phoneContainer) phoneContainer.style.display = 'none';
    if (emailContainer) emailContainer.style.display = 'none';
    
    updateFormProgress();
  }
}

// ===== PROFESSIONAL FUNCTIONS =====
async function handleProfessionalRegistration() {
  const formData = {
    name: document.getElementById('register-name').value.trim(),
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value,
    profession: document.getElementById('register-profession').value,
    license: document.getElementById('register-license').value.trim(),
    center: document.getElementById('register-center').value
  };

  if (!formData.name || !formData.email || !formData.password || !formData.profession || !formData.license) {
    showNotification('Completa todos los campos obligatorios', 'error');
    return;
  }

  if (!isValidEmail(formData.email)) {
    showNotification('Email inválido', 'error');
    return;
  }

  if (formData.password.length < 8) {
    showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
    return;
  }

  showLoading(true);

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
    const user = userCredential.user;
    
    await user.updateProfile({ displayName: formData.name });
    
    await db.collection('profesionales').doc(user.uid).set({
      nombre: formData.name,
      correo: formData.email,
      profesion: formData.profession,
      licencia: formData.license,
      id_centro_asignado: formData.center || null,
      configuracion_sistema: {
        rol: formData.profession,
        permisos: getDefaultPermissions(formData.profession),
        activo: true
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
      }
    });

    showNotification('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
    
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('register-form').reset();
    document.getElementById('login-email').value = formData.email;
    
    await auth.signOut();
    
  } catch (error) {
    let errorMessage = 'Error al registrar';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'El correo ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Contraseña muy débil';
    }
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

async function handleProfessionalLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showNotification('Ingresa email y contraseña', 'error');
    return;
  }

  showLoading(true);

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const doc = await db.collection('profesionales').doc(user.uid).get();
    if (!doc.exists) {
      showNotification('Usuario profesional no encontrado', 'error');
      await auth.signOut();
      return;
    }
    
    const userData = doc.data();
    if (!userData.configuracion_sistema?.activo) {
      showNotification('Cuenta desactivada', 'error');
      await auth.signOut();
      return;
    }
    
    currentUserData = { uid: user.uid, ...userData };
    
    await db.collection('profesionales').doc(user.uid).update({
      'metadata.ultima_actividad': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification(`Bienvenido, ${userData.nombre}`, 'success', 3000);
    closeModal('professional-modal');
    showProfessionalPanel(userData);
    
  } catch (error) {
    let errorMessage = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta';
    }
    showNotification(errorMessage, 'error');
  } finally {
    showLoading(false);
  }
}

function getDefaultPermissions(profession) {
  const permissions = {
    'asistente_social': ['ver_casos', 'asignar_casos', 'seguimiento'],
    'medico': ['ver_casos', 'atencion_medica', 'seguimiento'],
    'psicologo': ['ver_casos', 'atencion_psicologica', 'seguimiento'],
    'terapeuta': ['ver_casos', 'terapia_ocupacional', 'seguimiento'],
    'coordinador': ['ver_casos', 'asignar_casos', 'reportes', 'supervision'],
    'admin': ['ver_casos', 'asignar_casos', 'reportes', 'usuarios', 'configuracion']
  };
  return permissions[profession] || ['ver_casos'];
}

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = userData.profesion;
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  // Load dashboard data
  loadDashboard();
}

async function loadDashboard() {
  try {
    const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    document.getElementById('pending-requests').textContent = solicitudesSnapshot.size;
    
    const criticalSnapshot = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .get();
    
    document.getElementById('critical-cases').textContent = criticalSnapshot.size;
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function handleLogout() {
  if (confirm('¿Cerrar sesión?')) {
    try {
      await auth.signOut();
      currentUser = null;
      currentUserData = null;
      closeModal('panel-modal');
      showNotification('Sesión cerrada', 'success');
    } catch (error) {
      showNotification('Error al cerrar sesión', 'error');
    }
  }
}

// ===== UTILITY FUNCTIONS =====
function loadRegionsData() {
  const regionSelect = document.getElementById('patient-region');
  if (regionSelect) {
    regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
    Object.keys(regionesChile).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = regionesChile[key].nombre;
      regionSelect.appendChild(option);
    });
  }
}

function loadCommunesData(regionKey) {
  const comunaSelect = document.getElementById('patient-comuna');
  if (comunaSelect && regionKey && regionesChile[regionKey]) {
    comunaSelect.innerHTML = '<option value="">Seleccionar comuna...</option>';
    regionesChile[regionKey].comunas.forEach(comuna => {
      const option = document.createElement('option');
      option.value = comuna.toLowerCase().replace(/\s+/g, '_');
      option.textContent = comuna;
      comunaSelect.appendChild(option);
    });
    comunaSelect.disabled = false;
  }
}

function setupFormValidation() {
  // RUT validation
  const rutInput = document.getElementById('patient-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
