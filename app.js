// ================= CONFIGURACIÓN FIREBASE =================

// Configuración de Firebase para SENDA Puente Alto
  const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Inicializar servicios de Firebase
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const analytics = firebase.analytics ? firebase.analytics() : null;

// Configurar Firestore para trabajar offline
db.enablePersistence().catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia fallida: múltiples pestañas abiertas');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistencia no soportada en este navegador');
  }
});

console.log('🔥 Firebase inicializado correctamente para SENDA Puente Alto');

// ================= VARIABLES GLOBALES =================

// Estado de la aplicación
let currentUser = null;
let currentUserData = null;
let formData = {};
let currentFormStep = 1;
let currentStepIndex = 0;
let flowSteps = [1];
let isDraftSaved = false;

// CESFAM de Puente Alto (datos oficiales)
const cesfamPuenteAlto = [
  'CESFAM Alejandro del Río',
  'CESFAM Cardenal Raúl Silva Henríquez',
  'CESFAM Cordillera Andina',
  'CESFAM Dr. Steeger',
  'CESFAM El Volcán',
  'CESFAM Gabriela Mistral',
  'CESFAM Karol Wojtyla',
  'CESFAM La Obra',
  'CESFAM Padre Manuel Villaseca',
  'CESFAM Puente Alto',
  'CESFAM San Gerónimo',
  'CESFAM San Luis',
  'CESFAM Santa Julia',
  'CESFAM Sostenes Fernández'
];

// Datos de sustancias para el formulario
const sustanciasData = [
  { id: 'alcohol', name: 'Alcohol' },
  { id: 'marihuana', name: 'Marihuana' },
  { id: 'cocaina', name: 'Cocaína' },
  { id: 'pasta_base', name: 'Pasta Base' },
  { id: 'anfetaminas', name: 'Anfetaminas' },
  { id: 'heroina', name: 'Heroína' },
  { id: 'medicamentos', name: 'Medicamentos sin receta' },
  { id: 'inhalantes', name: 'Inhalantes' },
  { id: 'otras', name: 'Otras sustancias' }
];

// Configuración de roles y permisos
const rolesConfig = {
  admin: {
    name: 'Administrador',
    permissions: ['ver_casos', 'crear_casos', 'editar_casos', 'eliminar_casos', 'reportes', 'configuracion', 'usuarios'],
    access_all_cesfam: true
  },
  coordinador: {
    name: 'Coordinador',
    permissions: ['ver_casos', 'crear_casos', 'editar_casos', 'reportes', 'agenda'],
    access_all_cesfam: false
  },
  asistente_social: {
    name: 'Asistente Social',
    permissions: ['ver_casos', 'crear_casos', 'editar_casos', 'agenda', 'seguimientos'],
    access_all_cesfam: false
  },
  medico: {
    name: 'Médico',
    permissions: ['ver_casos', 'editar_casos', 'agenda', 'seguimientos'],
    access_all_cesfam: false
  },
  psicologo: {
    name: 'Psicólogo',
    permissions: ['ver_casos', 'editar_casos', 'agenda', 'seguimientos'],
    access_all_cesfam: false
  },
  terapeuta: {
    name: 'Terapeuta Ocupacional',
    permissions: ['ver_casos', 'editar_casos', 'agenda', 'seguimientos'],
    access_all_cesfam: false
  }
};

// ================= FUNCIONES DE INICIALIZACIÓN =================

function loadCesfamData() {
  const cesfamSelect = document.getElementById('patient-cesfam');
  const reentryCesfamSelect = document.getElementById('reentry-cesfam');
  
  if (cesfamSelect) {
    cesfamSelect.innerHTML = '<option value="">Seleccionar CESFAM...</option>';
    cesfamPuenteAlto.forEach(cesfam => {
      cesfamSelect.innerHTML += `<option value="${cesfam}">${cesfam}</option>`;
    });
  }
  
  if (reentryCesfamSelect) {
    reentryCesfamSelect.innerHTML = '<option value="">Seleccionar CESFAM...</option>';
    cesfamPuenteAlto.forEach(cesfam => {
      reentryCesfamSelect.innerHTML += `<option value="${cesfam}">${cesfam}</option>`;
    });
  }
  
  console.log('✅ Datos de CESFAM cargados:', cesfamPuenteAlto.length, 'centros');
}

function initializeEventListeners() {
  // Event listeners para formularios de autenticación
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Event listeners para navegación de formulario
  const nextBtn = document.getElementById('next-step');
  const prevBtn = document.getElementById('prev-step');
  const submitBtn = document.getElementById('submit-form');
  
  if (nextBtn) {
    nextBtn.addEventListener('click', nextFormStep);
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', prevFormStep);
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', submitPatientForm);
  }
  
  // Event listeners para botones principales
  const patientBtn = document.getElementById('patient-btn');
  const reentrybtn = document.getElementById('reentry-btn');
  const infobtn = document.getElementById('info-btn');
  const loginBtn = document.getElementById('login-btn');
  
  if (patientBtn) {
    patientBtn.addEventListener('click', () => showModal('patient-modal'));
  }
  
  if (reentrybtn) {
    reentrybtn.addEventListener('click', showReentryModal);
  }
  
  if (infobtn) {
    infobtn.addEventListener('click', () => showModal('info-modal'));
  }
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => showModal('auth-modal'));
  }
  
  console.log('✅ Event listeners inicializados');
}

// ================= FUNCIONES DE MODAL =================

function showModal(modalId) {
  console.log('Mostrando modal:', modalId);
  
  // Ocultar todos los modales primero
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.style.display = 'none';
  });
  
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    // Si es el modal de paciente, resetear formulario
    if (modalId === 'patient-modal') {
      resetForm();
    }
  } else {
    console.error('Modal no encontrado:', modalId);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    
    // Limpiar modales dinámicos
    if (modalId.includes('detail') || modalId.includes('search') || modalId.includes('reentry')) {
      modal.remove();
    }
  }
}

// ================= SISTEMA DE AUTENTICACIÓN =================

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showNotification('Por favor ingresa email y contraseña', 'error');
    return;
  }
  
  // Verificar que sea correo institucional
  if (!email.endsWith('@senda.cl')) {
    showNotification('Solo se permite acceso con correo institucional @senda.cl', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('Usuario autenticado:', user.uid);
    
    // Verificar si el usuario existe en la colección de profesionales
    const profesionalDoc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!profesionalDoc.exists) {
      await auth.signOut();
      throw new Error('Usuario no registrado como profesional SENDA');
    }
    
    const profesionalData = profesionalDoc.data();
    
    // Verificar que el usuario esté activo
    if (!profesionalData.configuracion_sistema?.activo) {
      await auth.signOut();
      throw new Error('Usuario inactivo. Contacte al administrador.');
    }
    
    currentUserData = { uid: user.uid, ...profesionalData };
    showNotification(`Bienvenido, ${profesionalData.nombre}`, 'success');
    
    closeModal('auth-modal');
    showProfessionalPanel(currentUserData);
    
  } catch (error) {
    console.error('Error de login:', error);
    handleFirebaseError(error, 'login');
  } finally {
    showLoading(false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  showNotification('El registro de nuevos usuarios debe ser realizado por el administrador del sistema', 'info', 8000);
}

// ================= SISTEMA DE REINGRESO CORREGIDO =================

function showReentryModal() {
  const modalHTML = `
    <div class="modal-overlay" id="reentry-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('reentry-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Solicitud de Reingreso</h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
          Complete los siguientes datos para solicitar su reingreso al programa SENDA.
        </p>
        
        <form id="reentry-form">
          <div class="form-group">
            <label class="form-label">Nombre Completo *</label>
            <input type="text" class="form-input" id="reentry-name" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">RUT *</label>
            <input type="text" class="form-input" id="reentry-rut" placeholder="12.345.678-9" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">CESFAM *</label>
            <select class="form-select" id="reentry-cesfam" required>
              <option value="">Seleccionar CESFAM...</option>
              ${cesfamPuenteAlto.map(cesfam => `<option value="${cesfam}">${cesfam}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Teléfono de Contacto *</label>
            <input type="tel" class="form-input" id="reentry-phone" placeholder="+56 9 1234 5678" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="reentry-email" placeholder="correo@email.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo del Reingreso *</label>
            <textarea class="form-textarea" id="reentry-reason" placeholder="Explique brevemente el motivo de su solicitud de reingreso..." required rows="4"></textarea>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('reentry-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-paper-plane"></i>
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('reentry-modal').style.display = 'flex';
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('reentry-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }
  
  // Configurar formateo de teléfono
  const phoneInput = document.getElementById('reentry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  // Manejar envío del formulario
  document.getElementById('reentry-form').addEventListener('submit', handleReentrySubmission);
}

async function handleReentrySubmission(e) {
  e.preventDefault();
  
  const name = document.getElementById('reentry-name').value.trim();
  const rut = document.getElementById('reentry-rut').value.trim();
  const cesfam = document.getElementById('reentry-cesfam').value;
  const phone = document.getElementById('reentry-phone').value.trim();
  const email = document.getElementById('reentry-email').value.trim();
  const reason = document.getElementById('reentry-reason').value.trim();
  
  // Validaciones
  if (!name || !rut || !cesfam || !phone || !reason) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  if (email && !isValidEmail(email)) {
    showNotification('El email ingresado no es válido', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Estructura corregida para Firebase
    const reentryData = {
      tipo_solicitud: 'reingreso',
      datos_personales: {
        nombre_completo: name,
        rut: rut,
        cesfam: cesfam,
        edad: null,
        para_quien: 'para_mi',
        anonimo: false,
        solo_informacion: false
      },
      datos_contacto: {
        nombre_completo: name,
        rut: rut,
        telefono_principal: phone,
        email: email || null,
        direccion: null
      },
      reingreso: {
        motivo: reason,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        tipo_anterior: null,
        fecha_ultimo_egreso: null
      },
      clasificacion: {
        tipo: 'reingreso',
        estado: 'pendiente',
        prioridad: 'alta',
        categoria_riesgo: 'moderado',
        fecha_clasificacion: firebase.firestore.FieldValue.serverTimestamp()
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_reingreso',
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        version_formulario: '1.0'
      }
    };
    
    console.log('Enviando datos de reingreso:', reentryData);
    
    const docRef = await db.collection('solicitudes_ingreso').add(reentryData);
    
    console.log('Reingreso guardado con ID:', docRef.id);
    
    showNotification('Solicitud de reingreso enviada correctamente. Se le contactará pronto.', 'success', 6000);
    closeModal('reentry-modal');
    
    // Limpiar formulario
    document.getElementById('reentry-form').reset();
    
  } catch (error) {
    console.error('Error al enviar solicitud de reingreso:', error);
    handleFirebaseError(error, 'reingreso');
  } finally {
    showLoading(false);
  }
}
// Continúa desde la PARTE 1...

// ================= SISTEMA DE FORMULARIO MULTI-PASO =================

function setupFormValidation() {
  const rutInput = document.getElementById('patient-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });

    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }

  const phoneInputs = document.querySelectorAll('#patient-phone, #anonymous-phone');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  });

  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function(e) {
      const email = e.target.value.trim();
      if (email && !isValidEmail(email)) {
        e.target.classList.add('error');
        showNotification('Por favor ingresa un correo electrónico válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  });

  const ageInput = document.getElementById('patient-age');
  if (ageInput) {
    ageInput.addEventListener('blur', function(e) {
      const age = parseInt(e.target.value);
      if (age && (age < 12 || age > 120)) {
        e.target.classList.add('error');
        showNotification('Por favor ingresa una edad válida (12-120 años)', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }
}

function setupModalControls() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        closeModal(modal.id);
      }
    }
    
    // Cerrar modal al hacer clic en el overlay
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target.id);
    }
  });
}

function setupTabFunctionality() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
      const tabGroup = e.target.closest('.tabs');
      const targetTab = e.target.dataset.tab;
      
      if (tabGroup && targetTab) {
        tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        tabGroup.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        const tabContent = document.getElementById(targetTab + '-tab');
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    }
  });
}

function setupMultiStepForm() {
  const motivacionSlider = document.getElementById('motivacion');
  const motivacionValue = document.getElementById('motivacion-value');
  
  if (motivacionSlider && motivacionValue) {
    motivacionSlider.addEventListener('input', function() {
      motivacionValue.textContent = this.value;
    });
  }

  document.addEventListener('change', function(e) {
    if (e.target.name === 'tipoSolicitud') {
      handleTipoSolicitudChange(e.target.value);
    }
  });
}

function handleTipoSolicitudChange(tipoSolicitud) {
  const phoneContainer = document.getElementById('anonymous-phone-container');
  const emailContainer = document.getElementById('info-email-container');
  
  if (phoneContainer) phoneContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'none';
  
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
  
  const prevBtn = document.getElementById('prev-step');
  const nextBtn = document.getElementById('next-step');
  const submitBtn = document.getElementById('submit-form');
  
  if (prevBtn) prevBtn.style.display = currentStepIndex > 0 ? 'block' : 'none';
  if (nextBtn) nextBtn.style.display = currentStepIndex < flowSteps.length - 1 ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = currentStepIndex === flowSteps.length - 1 ? 'block' : 'none';
}

function nextFormStep() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    
    if (currentStepIndex < flowSteps.length - 1) {
      const currentStepNumber = flowSteps[currentStepIndex];
      const currentStepElement = document.querySelector(`[data-step="${currentStepNumber}"]`);
      if (currentStepElement) currentStepElement.classList.remove('active');
      
      currentStepIndex++;
      const nextStepNumber = flowSteps[currentStepIndex];
      currentFormStep = nextStepNumber;
      
      const nextStepElement = document.querySelector(`[data-step="${nextStepNumber}"]`);
      if (nextStepElement) nextStepElement.classList.add('active');
      
      updateFormProgress();
      saveDraft(false);
    }
  }
}

function prevFormStep() {
  if (currentStepIndex > 0) {
    const currentStepNumber = flowSteps[currentStepIndex];
    const currentStepElement = document.querySelector(`[data-step="${currentStepNumber}"]`);
    if (currentStepElement) currentStepElement.classList.remove('active');
    
    currentStepIndex--;
    const prevStepNumber = flowSteps[currentStepIndex];
    currentFormStep = prevStepNumber;
    
    const prevStepElement = document.querySelector(`[data-step="${prevStepNumber}"]`);
    if (prevStepElement) prevStepElement.classList.add('active');
    
    updateFormProgress();
  }
}

// ================= VALIDACIÓN DE FORMULARIOS =================

function validateCurrentStep() {
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  if (!currentStepElement) return false;
  
  const requiredFields = currentStepElement.querySelectorAll('[required]:not([style*="display: none"] [required])');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (field.offsetParent === null) return;
    
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  if (currentFormStep === 1) {
    isValid = validateStep1() && isValid;
  } else if (currentFormStep === 2) {
    isValid = validateStep2() && isValid;
  } else if (currentFormStep === 3) {
    isValid = validateStep3() && isValid;
  }
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
}

function validateStep1() {
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
  
  return true;
}

function validateStep2() {
  if (formData.tipoSolicitud !== 'identificado') return true;
  
  const rut = document.getElementById('patient-rut')?.value;
  const email = document.getElementById('patient-email')?.value;
  
  if (rut && !validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return false;
  }
  
  if (email && !isValidEmail(email)) {
    showNotification('El email ingresado no es válido', 'error');
    return false;
  }
  
  return true;
}

function validateStep3() {
  if (formData.tipoSolicitud !== 'informacion') {
    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      showNotification('Por favor selecciona al menos una sustancia', 'error');
      return false;
    }
  }
  
  return true;
}

function collectCurrentStepData() {
  if (currentFormStep === 1) {
    formData.tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    formData.edad = document.getElementById('patient-age')?.value;
    formData.cesfam = document.getElementById('patient-cesfam')?.value;
    formData.paraMi = document.querySelector('input[name="paraMi"]:checked')?.value;
    
    if (formData.tipoSolicitud === 'anonimo') {
      formData.telefonoContacto = document.getElementById('anonymous-phone')?.value;
    }
    
    if (formData.tipoSolicitud === 'informacion') {
      formData.emailInformacion = document.getElementById('info-email')?.value;
    }
  }
  
  if (currentFormStep === 2 && formData.tipoSolicitud === 'identificado') {
    formData.nombre = document.getElementById('patient-name')?.value;
    formData.apellido = document.getElementById('patient-lastname')?.value;
    formData.rut = document.getElementById('patient-rut')?.value;
    formData.telefono = document.getElementById('patient-phone')?.value;
    formData.email = document.getElementById('patient-email')?.value;
    formData.direccion = document.getElementById('patient-address')?.value;
  }
  
  if (currentFormStep === 3) {
    if (formData.tipoSolicitud !== 'informacion') {
      const sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked'))
        .map(cb => cb.value);
      formData.sustancias = sustancias;
      formData.tiempoConsumo = document.getElementById('tiempo-consumo')?.value;
      formData.motivacion = document.getElementById('motivacion')?.value;
      formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value;
    }
  }
  
  if (currentFormStep === 4) {
    formData.razon = document.getElementById('patient-reason')?.value;
    formData.tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value;
    formData.centroPreferencia = document.getElementById('centro-preferencia')?.value;
  }
}

// ================= MANEJO DE BORRADORES =================

function saveDraft(showMessage = true) {
  collectCurrentStepData();
  
  const draftData = {
    ...formData,
    currentStep: currentFormStep,
    currentStepIndex: currentStepIndex,
    flowSteps: flowSteps,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('senda_draft', JSON.stringify(draftData));
  isDraftSaved = true;
  
  if (showMessage) {
    showNotification('Borrador guardado correctamente', 'success', 2000);
  }
}

function loadDraftIfExists() {
  const draft = localStorage.getItem('senda_draft');
  if (draft) {
    try {
      const draftData = JSON.parse(draft);
      const draftAge = new Date() - new Date(draftData.timestamp);
      
      if (draftAge < 24 * 60 * 60 * 1000) {
        const loadDraft = confirm('Se encontró un borrador guardado. ¿Deseas continuar donde lo dejaste?');
        if (loadDraft) {
          formData = draftData;
          currentFormStep = draftData.currentStep || 1;
          currentStepIndex = draftData.currentStepIndex || 0;
          flowSteps = draftData.flowSteps || [1];
          restoreFormData();
          isDraftSaved = true;
        } else {
          localStorage.removeItem('senda_draft');
        }
      } else {
        localStorage.removeItem('senda_draft');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      localStorage.removeItem('senda_draft');
    }
  }
}

function restoreFormData() {
  Object.keys(formData).forEach(key => {
    const element = document.getElementById(`patient-${key}`) || 
                   document.querySelector(`input[name="${key}"]`) ||
                   document.querySelector(`select[name="${key}"]`);
    
    if (element && formData[key]) {
      if (element.type === 'radio' || element.type === 'checkbox') {
        if (Array.isArray(formData[key])) {
          formData[key].forEach(value => {
            const checkbox = document.querySelector(`input[name="${key}"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
          });
        } else {
          const radio = document.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
          if (radio) radio.checked = true;
        }
      } else {
        element.value = formData[key];
      }
    }
  });
  
  if (formData.tipoSolicitud) {
    handleTipoSolicitudChange(formData.tipoSolicitud);
  }
  
  document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
  const currentStepElement = document.querySelector(`[data-step="${currentFormStep}"]`);
  if (currentStepElement) currentStepElement.classList.add('active');
  
  updateFormProgress();
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
    
    const phoneContainer = document.getElementById('anonymous-phone-container');
    const emailContainer = document.getElementById('info-email-container');
    if (phoneContainer) phoneContainer.style.display = 'none';
    if (emailContainer) emailContainer.style.display = 'none';
    
    updateFormProgress();
  }
}

// ================= ENVÍO DE FORMULARIO PRINCIPAL =================

function submitPatientForm() {
  if (validateCurrentStep()) {
    collectCurrentStepData();
    handlePatientRegistration();
  }
}

async function handlePatientRegistration(e) {
  if (e) e.preventDefault();
  
  try {
    showLoading(true);
    collectCurrentStepData();
    
    // Crear estructura de datos para Firebase
    const solicitudData = {
      datos_personales: {
        edad: parseInt(formData.edad) || 0,
        cesfam: formData.cesfam || '',
        para_quien: formData.paraMi || '',
        anonimo: formData.tipoSolicitud === 'anonimo',
        solo_informacion: formData.tipoSolicitud === 'informacion'
      },
      datos_contacto: {},
      evaluacion_inicial: {},
      clasificacion: {
        estado: 'pendiente',
        prioridad: 'baja',
        categoria_riesgo: 'bajo'
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_publica',
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      }
    };
    
    // Datos de contacto según tipo de solicitud
    if (formData.tipoSolicitud === 'identificado') {
      solicitudData.datos_contacto = {
        nombre_completo: `${formData.nombre || ''} ${formData.apellido || ''}`.trim(),
        rut: formData.rut || '',
        telefono_principal: formData.telefono || '',
        email: formData.email || '',
        direccion: formData.direccion || ''
      };
    } else if (formData.tipoSolicitud === 'anonimo') {
      solicitudData.datos_contacto.telefono_principal = formData.telefonoContacto || '';
    } else if (formData.tipoSolicitud === 'informacion') {
      solicitudData.datos_contacto.email = formData.emailInformacion || '';
    }
    
    // Evaluación inicial (solo para solicitudes no informativas)
    if (formData.tipoSolicitud !== 'informacion') {
      solicitudData.evaluacion_inicial = {
        sustancias_consumo: formData.sustancias || [],
        tiempo_consumo_meses: parseInt(formData.tiempoConsumo) || 0,
        motivacion_cambio: parseInt(formData.motivacion) || 5,
        urgencia_declarada: formData.urgencia || 'baja',
        tratamiento_previo: formData.tratamientoPrevio || 'no',
        descripcion_situacion: formData.razon || '',
        centro_preferencia: formData.centroPreferencia || ''
      };
      
      // Calcular prioridad automáticamente
      const prioridad = calculatePriority({
        sustancias: formData.sustancias,
        edad: parseInt(formData.edad),
        tiempoConsumo: parseInt(formData.tiempoConsumo),
        urgencia: formData.urgencia,
        motivacion: parseInt(formData.motivacion),
        tratamientoPrevio: formData.tratamientoPrevio,
        razon: formData.razon
      });
      
      solicitudData.clasificacion.prioridad = prioridad;
      solicitudData.clasificacion.categoria_riesgo = prioridad === 'critica' ? 'alto' : prioridad === 'alta' ? 'moderado' : 'bajo';
    }
    
    // Guardar en Firebase
    console.log('Enviando solicitud:', solicitudData);
    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    // Limpiar formulario
    localStorage.removeItem('senda_draft');
    resetForm();
    closeModal('patient-modal');
    
    // Mostrar mensaje de éxito
    if (formData.tipoSolicitud === 'informacion') {
      showNotification('Solicitud de información enviada correctamente. Te contactaremos pronto.', 'success', 6000);
    } else {
      showNotification('Solicitud de ingreso enviada correctamente. Un profesional la revisará pronto.', 'success', 6000);
    }
    
    console.log('Solicitud creada con ID:', docRef.id);
    
  } catch (error) {
    console.error('Error al registrar solicitud:', error);
    handleFirebaseError(error, 'registro de solicitud');
  } finally {
    showLoading(false);
  }
}
// Continúa desde la PARTE 2...

// ================= PANEL DE PROFESIONALES CORREGIDO (SIN DASHBOARD) =================

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  setupRoleBasedNavigation(userData);
  setupPanelNavigation(userData);
  
  // CAMBIO: Mostrar SOLICITUDES por defecto en lugar de Dashboard
  showPanel('requests', userData);
  
  // Marcar solicitudes como activo por defecto
  const requestsNav = document.querySelector('[data-panel="requests"]');
  if (requestsNav) {
    requestsNav.classList.add('active');
  }
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  startRealTimeListeners(userData);
}

function setupRoleBasedNavigation(userData) {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const panel = item.dataset.panel;
    let hasAccess = true;
    
    // Verificar permisos según el rol
    switch (panel) {
      case 'dashboard':
        // Dashboard eliminado completamente
        hasAccess = false;
        break;
      case 'requests':
        hasAccess = userData.profesion === 'asistente_social' || 
                   userData.profesion === 'admin' || 
                   userData.profesion === 'coordinador';
        break;
      case 'patients':
        hasAccess = rolesConfig[userData.profesion]?.permissions.includes('ver_casos');
        break;
      case 'calendar':
        hasAccess = rolesConfig[userData.profesion]?.permissions.includes('agenda');
        break;
      case 'followups':
        hasAccess = rolesConfig[userData.profesion]?.permissions.includes('seguimientos');
        break;
      case 'reports':
        hasAccess = userData.profesion === 'admin' || 
                   userData.profesion === 'coordinador' ||
                   rolesConfig[userData.profesion]?.permissions.includes('reportes');
        break;
    }
    
    if (!hasAccess) {
      item.style.display = 'none';
    } else {
      item.style.display = 'flex';
    }
  });
}

function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const panel = item.dataset.panel;
      
      // BLOQUEAR acceso a dashboard (eliminado)
      if (panel === 'dashboard') {
        showNotification('El Dashboard ha sido desactivado', 'info');
        return;
      }
      
      if (panel) {
        showPanel(panel, userData);
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function showPanel(panelId, userData) {
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    switch (panelId) {
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
      default:
        console.warn('Panel no implementado:', panelId);
        showNotification('Esta sección está en desarrollo', 'info');
    }
  } else {
    console.error('Panel no encontrado:', panelId + '-panel');
    showNotification('Error: Panel no encontrado', 'error');
  }
}

// ================= CARGA DE SOLICITUDES CORREGIDA =================

async function loadRequestsPanel(userData) {
  console.log('Cargando panel de solicitudes para:', userData.nombre);
  
  if (!userData || !userData.profesion) {
    console.error('Datos de usuario no válidos:', userData);
    showNotification('Error: Datos de usuario no válidos', 'error');
    return;
  }
  
  if (userData.profesion !== 'asistente_social' && userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Solo los asistentes sociales, coordinadores y administradores pueden ver las solicitudes de ingreso.
          </p>
        </div>
      `;
    }
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) {
      console.error('Elemento requests-list no encontrado');
      return;
    }
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // CONSULTA CORREGIDA - verificar que la colección existe
    let query = db.collection('solicitudes_ingreso');
    
    // FILTRAR POR CESFAM si no es admin
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      console.log('Filtrando por CESFAM:', userData.cesfam_asignado);
      query = query.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    // Ordenar y limitar
    query = query.orderBy('metadata.fecha_creacion', 'desc').limit(50);
    
    console.log('Ejecutando consulta de solicitudes...');
    const snapshot = await query.get();
    console.log('Solicitudes encontradas:', snapshot.size);
    
    if (snapshot.empty) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes disponibles en este momento.
            ${userData.cesfam_asignado ? `<br><small>CESFAM: ${userData.cesfam_asignado}</small>` : ''}
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // VALIDAR DATOS antes de renderizar
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      const isAnonymous = data.datos_personales?.anonimo || false;
      const isInfoOnly = data.datos_personales?.solo_informacion || false;
      const isReentry = data.tipo_solicitud === 'reingreso';
      
      // Obtener nombre según el tipo de solicitud
      let nombreCompleto = 'Sin nombre';
      if (isReentry) {
        nombreCompleto = data.datos_personales?.nombre_completo || data.datos_contacto?.nombre_completo || 'Reingreso';
      } else if (isAnonymous) {
        nombreCompleto = 'Solicitud anónima';
      } else if (isInfoOnly) {
        nombreCompleto = 'Solo información';
      } else {
        nombreCompleto = data.datos_contacto?.nombre_completo || 'Sin nombre';
      }
      
      html += `
        <div class="card patient-card" data-request-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>
                ${isReentry ? '<i class="fas fa-redo" style="color: var(--warning-orange);"></i> ' : ''}
                Solicitud ${doc.id.substring(0, 8).toUpperCase()}
              </h3>
              <p><strong>${nombreCompleto}</strong></p>
              ${!isReentry && data.datos_personales?.edad ? `<p>Edad: ${data.datos_personales.edad} años</p>` : ''}
              ${isReentry && data.datos_contacto?.rut ? `<p>RUT: ${data.datos_contacto.rut}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
              <div style="margin-top: 8px;">
                <span class="status-badge status-${estado}">${estado}</span>
              </div>
              ${isReentry ? '<div style="margin-top: 4px; font-size: 12px; color: var(--warning-orange);">REINGRESO</div>' : ''}
            </div>
          </div>
          <div class="patient-info">
            <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${isReentry ? 'Reingreso' : isAnonymous ? 'Anónimo' : isInfoOnly ? 'Solo información' : 'Identificado'}</div>
            <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
            ${!isReentry && data.datos_personales?.para_quien ? `<div><strong>Para:</strong> ${data.datos_personales.para_quien}</div>` : ''}
            ${data.evaluacion_inicial?.sustancias_consumo ? 
              `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
            ${data.evaluacion_inicial?.urgencia_declarada ? 
              `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
            ${data.datos_contacto?.telefono_principal ? 
              `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
            ${data.datos_contacto?.email ? 
              `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
            ${isReentry && data.reingreso?.motivo ? 
              `<div><strong>Motivo reingreso:</strong> ${data.reingreso.motivo.substring(0, 100)}...</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}')">
              <i class="fas fa-eye"></i> Revisar Completa
            </button>
            ${!isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
            </button>
            ` : ''}
            ${isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="sendInformation('${doc.id}')">
              <i class="fas fa-envelope"></i> Enviar Información
            </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar solicitudes:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--danger-red);">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Error al cargar las solicitudes: ${error.message}
          </p>
          <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-primary" onclick="loadRequestsPanel(currentUserData)">
              <i class="fas fa-refresh"></i> Reintentar
            </button>
          </div>
        </div>
      `;
    }
    handleFirebaseError(error, 'carga de solicitudes');
  }
}

// ================= FUNCIONES DE SOLICITUDES =================

async function reviewRequest(requestId) {
  try {
    const doc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    if (!doc.exists) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const data = doc.data();
    showRequestDetailModal(requestId, data);
  } catch (error) {
    console.error('Error reviewing request:', error);
    handleFirebaseError(error, 'revisión de solicitud');
  }
}

function showRequestDetailModal(requestId, data) {
  const isAnonymous = data.datos_personales?.anonimo || false;
  const isInfoOnly = data.datos_personales?.solo_informacion || false;
  const isReentry = data.tipo_solicitud === 'reingreso';
  
  const modalHTML = `
    <div class="modal-overlay" id="request-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('request-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>${isReentry ? 'Solicitud de Reingreso' : 'Detalle de Solicitud'} ${requestId.substring(0, 8).toUpperCase()}</h2>
        
        <div class="request-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              ${!isAnonymous && (data.datos_contacto?.nombre_completo || data.datos_personales?.nombre_completo) ? 
                `<div><strong>Nombre:</strong> ${data.datos_contacto?.nombre_completo || data.datos_personales?.nombre_completo}</div>` : ''}
              ${!isAnonymous && (data.datos_contacto?.rut || data.datos_personales?.rut) ? 
                `<div><strong>RUT:</strong> ${data.datos_contacto?.rut || data.datos_personales?.rut}</div>` : ''}
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
              ${!isReentry ? `<div><strong>Para quien:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>` : ''}
              <div><strong>Tipo:</strong> ${isReentry ? 'Reingreso' : isInfoOnly ? 'Solo información' : isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos de Contacto</h3>
            <div class="info-grid">
              ${data.datos_contacto?.telefono_principal ? 
                `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
              ${data.datos_contacto?.email ? 
                `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
              ${data.datos_contacto?.direccion ? 
                `<div><strong>Dirección:</strong> ${data.datos_contacto.direccion}</div>` : ''}
            </div>
          </div>
          
          ${isReentry && data.reingreso ? `
          <div class="detail-section">
            <h3>Información del Reingreso</h3>
            <div class="info-grid">
              <div><strong>Fecha solicitud:</strong> ${formatDate(data.reingreso.fecha_solicitud)}</div>
              <div><strong>Estado:</strong> ${data.reingreso.estado || 'pendiente'}</div>
            </div>
            <div style="margin-top: 12px;">
              <strong>Motivo del reingreso:</strong>
              <p style="margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 4px;">
                ${data.reingreso.motivo || 'No especificado'}
              </p>
            </div>
          </div>
          ` : ''}
          
          ${data.evaluacion_inicial && !isInfoOnly ? `
          <div class="detail-section">
            <h3>Evaluación Inicial</h3>
            <div class="info-grid">
              ${data.evaluacion_inicial.sustancias_consumo ? 
                `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
              ${data.evaluacion_inicial.tiempo_consumo_meses ? 
                `<div><strong>Tiempo de consumo:</strong> ${data.evaluacion_inicial.tiempo_consumo_meses} meses</div>` : ''}
              ${data.evaluacion_inicial.motivacion_cambio ? 
                `<div><strong>Motivación al cambio:</strong> ${data.evaluacion_inicial.motivacion_cambio}/10</div>` : ''}
              ${data.evaluacion_inicial.urgencia_declarada ? 
                `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
              ${data.evaluacion_inicial.tratamiento_previo ? 
                `<div><strong>Tratamiento previo:</strong> ${data.evaluacion_inicial.tratamiento_previo}</div>` : ''}
            </div>
            ${data.evaluacion_inicial.descripcion_situacion ? `
            <div style="margin-top: 12px;">
              <strong>Descripción de la situación:</strong>
              <p style="margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 4px;">
                ${data.evaluacion_inicial.descripcion_situacion}
              </p>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="detail-section">
            <h3>Estado de la Solicitud</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.clasificacion?.estado || 'pendiente'}">${data.clasificacion?.estado || 'pendiente'}</span></div>
              <div><strong>Prioridad:</strong> <span class="priority-indicator priority-${data.clasificacion?.prioridad || 'baja'}">${(data.clasificacion?.prioridad || 'baja').toUpperCase()}</span></div>
              <div><strong>Fecha solicitud:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          ${!isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="acceptRequest('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-check"></i> Aceptar Solicitud
          </button>
          ` : ''}
          ${isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="sendInformation('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-envelope"></i> Enviar Información
          </button>
          ` : ''}
          <button class="btn btn-outline" onclick="closeModal('request-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('request-detail-modal').style.display = 'flex';
}

async function acceptRequest(requestId) {
  if (!confirm('¿Estás seguro de aceptar esta solicitud?')) return;
  
  try {
    showLoading(true);
    
    // VERIFICAR que el usuario actual existe
    if (!currentUserData || !currentUserData.uid) {
      throw new Error('Usuario no autenticado correctamente');
    }
    
    // ACTUALIZAR la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
      'clasificacion.fecha_aceptacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': currentUserData.uid,
      'clasificacion.profesional_nombre': currentUserData.nombre || 'Sin nombre'
    });
    
    // OBTENER los datos de la solicitud para crear paciente
    const solicitudDoc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    const solicitudData = solicitudDoc.data();
    
    // CREAR registro de paciente solo si no es anónimo ni solo información
    if (!solicitudData.datos_personales?.anonimo && !solicitudData.datos_personales?.solo_informacion) {
      await createPatientRecord(requestId, solicitudData);
    }
    
    showNotification('Solicitud aceptada correctamente', 'success');
    
    // RECARGAR el panel
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    handleFirebaseError(error, 'aceptación de solicitud');
  } finally {
    showLoading(false);
  }
}

async function sendInformation(requestId) {
  if (!confirm('¿Enviar información del programa al email proporcionado?')) return;
  
  try {
    showLoading(true);
    
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'informacion_enviada',
      'clasificacion.fecha_respuesta': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_responsable': currentUserData.uid
    });
    
    showNotification('Información enviada correctamente', 'success');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error sending information:', error);
    handleFirebaseError(error, 'envío de información');
  } finally {
    showLoading(false);
  }
}

async function createPatientRecord(solicitudId, solicitudData) {
  const patientData = {
    solicitud_origen: solicitudId,
    datos_personales: {
      nombre_completo: solicitudData.datos_contacto?.nombre_completo || solicitudData.datos_personales?.nombre_completo || '',
      rut: solicitudData.datos_contacto?.rut || solicitudData.datos_personales?.rut || '',
      edad: solicitudData.datos_personales?.edad || 0,
      cesfam: solicitudData.datos_personales?.cesfam || '',
      direccion: solicitudData.datos_contacto?.direccion || ''
    },
    contacto: {
      telefono: solicitudData.datos_contacto?.telefono_principal || '',
      email: solicitudData.datos_contacto?.email || ''
    },
    historial_clinico: [{
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: 'ingreso_inicial',
      profesional: currentUserData.uid,
      evaluacion_inicial: solicitudData.evaluacion_inicial || {},
      observaciones: 'Paciente ingresado desde solicitud web'
    }],
    estado_actual: {
      activo: true,
      programa: 'ambulatorio',
      profesional_asignado: null,
      fecha_ingreso: firebase.firestore.FieldValue.serverTimestamp()
    },
    metadata: {
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      creado_por: currentUserData.uid
    }
  };
  
  await db.collection('pacientes').add(patientData);
}
// Continúa desde la PARTE 3...

// ================= PANEL DE PACIENTES CORREGIDO =================

async function loadPatientsPanel(userData) {
  const patientsPanel = document.getElementById('patients-panel');
  if (!patientsPanel) {
    console.error('Panel de pacientes no encontrado');
    return;
  }
  
  // VALIDAR datos de usuario
  if (!userData || !userData.uid) {
    patientsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Pacientes</h1>
        <p class="panel-subtitle">Error: Usuario no válido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar datos de usuario
        </p>
      </div>
    `;
    return;
  }
  
  patientsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Pacientes</h1>
      <p class="panel-subtitle">Gestión de casos activos</p>
      <div style="margin-top: 16px;">
        <input type="text" class="form-input" id="patient-search" placeholder="Buscar por nombre, RUT o CESFAM..." style="max-width: 300px; display: inline-block;">
        <button class="btn btn-outline" onclick="loadPatientsPanel(currentUserData)" style="margin-left: 8px;">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando pacientes...</div>
  `;
  
  try {
    console.log('Cargando pacientes para usuario:', userData.uid, 'CESFAM:', userData.cesfam_asignado);
    
    // CONSULTA CORREGIDA con validaciones
    let patientsQuery = db.collection('pacientes');
    
    // Filtrar según rol y CESFAM
    if (userData.profesion === 'admin') {
      // Admin ve todos los pacientes
      patientsQuery = patientsQuery.where('estado_actual.activo', '==', true);
    } else if (userData.cesfam_asignado) {
      // Otros profesionales ven pacientes de su CESFAM
      patientsQuery = patientsQuery
        .where('datos_personales.cesfam', '==', userData.cesfam_asignado)
        .where('estado_actual.activo', '==', true);
    } else {
      throw new Error('Usuario sin CESFAM asignado');
    }
    
    // Ordenar y limitar
    patientsQuery = patientsQuery.orderBy('metadata.fecha_creacion', 'desc').limit(100);
    
    console.log('Ejecutando consulta de pacientes...');
    const patientsSnapshot = await patientsQuery.get();
    console.log('Pacientes encontrados:', patientsSnapshot.size);
    
    if (patientsSnapshot.empty) {
      patientsPanel.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Pacientes</h1>
          <p class="panel-subtitle">Gestión de casos activos</p>
          <div style="margin-top: 16px;">
            <input type="text" class="form-input" id="patient-search" placeholder="Buscar por nombre, RUT o CESFAM..." style="max-width: 300px; display: inline-block;">
            <button class="btn btn-outline" onclick="loadPatientsPanel(currentUserData)" style="margin-left: 8px;">
              <i class="fas fa-refresh"></i> Actualizar
            </button>
          </div>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes activos en este momento.
            ${userData.cesfam_asignado ? `<br><small>CESFAM: ${userData.cesfam_asignado}</small>` : ''}
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Pacientes</h1>
        <p class="panel-subtitle">Gestión de casos activos (${patientsSnapshot.size} pacientes)</p>
        <div style="margin-top: 16px;">
          <input type="text" class="form-input" id="patient-search" placeholder="Buscar por nombre, RUT o CESFAM..." style="max-width: 300px; display: inline-block;">
          <button class="btn btn-outline" onclick="loadPatientsPanel(currentUserData)" style="margin-left: 8px;">
            <i class="fas fa-refresh"></i> Actualizar
          </button>
        </div>
      </div>
      <div class="patients-grid">
    `;
    
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // VALIDAR datos antes de renderizar
      const fechaIngreso = data.estado_actual?.fecha_ingreso ? 
        (data.estado_actual.fecha_ingreso.toDate ? data.estado_actual.fecha_ingreso.toDate() : new Date(data.estado_actual.fecha_ingreso)) : 
        new Date();
      
      const profesionalAsignado = data.estado_actual?.profesional_asignado || 'Sin asignar';
      const programa = data.estado_actual?.programa || 'ambulatorio';
      
      html += `
        <div class="card patient-card" data-patient-id="${doc.id}">
          <div class="card-header">
            <div>
              <h4>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h4>
              <p><i class="fas fa-id-card"></i> ${data.datos_personales?.rut || 'Sin RUT'}</p>
              <p><i class="fas fa-birthday-cake"></i> ${data.datos_personales?.edad || 'Sin edad'} años</p>
              <p><i class="fas fa-hospital"></i> ${data.datos_personales?.cesfam || 'Sin CESFAM'}</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">
                ${data.estado_actual?.activo ? 'ACTIVO' : 'INACTIVO'}
              </span>
              <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
                ${programa.toUpperCase()}
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Fecha ingreso:</strong> ${formatDate(fechaIngreso)}</div>
            <div><strong>Profesional:</strong> ${profesionalAsignado === currentUserData.uid ? 'Yo' : profesionalAsignado}</div>
            ${data.contacto?.telefono ? `<div><strong>Teléfono:</strong> ${data.contacto.telefono}</div>` : ''}
            ${data.contacto?.email ? `<div><strong>Email:</strong> ${data.contacto.email}</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
            <button class="btn btn-outline btn-sm" onclick="addFollowup('${doc.id}')">
              <i class="fas fa-plus"></i> Seguimiento
            </button>
            <button class="btn btn-outline btn-sm" onclick="scheduleAppointment('${doc.id}')">
              <i class="fas fa-calendar-plus"></i> Agendar
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    patientsPanel.innerHTML = html;
    
    // Configurar búsqueda en tiempo real
    const searchInput = document.getElementById('patient-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        filterPatients(this.value);
      });
    }
    
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
    patientsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Pacientes</h1>
        <p class="panel-subtitle">Error al cargar pacientes</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar pacientes: ${error.message}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="loadPatientsPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    `;
    handleFirebaseError(error, 'carga de pacientes');
  }
}

function filterPatients(searchTerm) {
  const patientCards = document.querySelectorAll('.patient-card');
  const searchLower = searchTerm.toLowerCase();
  
  patientCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const shouldShow = text.includes(searchLower);
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

// ================= AGENDA CORREGIDA =================

async function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (!calendarPanel) {
    console.error('Panel de agenda no encontrado');
    return;
  }
  
  // VALIDAR datos de usuario
  if (!userData || !userData.uid) {
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Error: Usuario no válido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar datos de usuario
        </p>
      </div>
    `;
    return;
  }
  
  calendarPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Agenda</h1>
      <p class="panel-subtitle">Gestión de citas y horarios</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-primary" onclick="showNewAppointmentModal()">
          <i class="fas fa-calendar-plus"></i> Nueva Cita
        </button>
        <button class="btn btn-outline" onclick="showTodayAppointments()">
          <i class="fas fa-calendar-day"></i> Citas de Hoy
        </button>
        <button class="btn btn-outline" onclick="loadCalendarPanel(currentUserData)">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando agenda...</div>
  `;
  
  try {
    console.log('Cargando agenda para usuario:', userData.uid);
    
    // Fechas para consulta (próximos 7 días)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // CONSULTA CORREGIDA - verificar que los campos existen
    let appointmentsQuery = db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', today)
      .where('fecha', '<=', nextWeek);
    
    // Ejecutar consulta con manejo de errores
    console.log('Ejecutando consulta de citas...');
    const appointmentsSnapshot = await appointmentsQuery
      .orderBy('fecha', 'asc')
      .get();
    
    console.log('Citas encontradas:', appointmentsSnapshot.size);
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Gestión de citas y horarios - ${userData.nombre}</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" onclick="showNewAppointmentModal()">
            <i class="fas fa-calendar-plus"></i> Nueva Cita
          </button>
          <button class="btn btn-outline" onclick="showTodayAppointments()">
            <i class="fas fa-calendar-day"></i> Citas de Hoy
          </button>
          <button class="btn btn-outline" onclick="loadCalendarPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Actualizar
          </button>
        </div>
      </div>
      
      <div class="calendar-section">
        <h2>Próximas Citas (7 días)</h2>
    `;
    
    if (appointmentsSnapshot.empty) {
      html += `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-calendar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No tienes citas agendadas para los próximos 7 días.
          </p>
          <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-primary" onclick="showNewAppointmentModal()">
              <i class="fas fa-calendar-plus"></i> Agendar Primera Cita
            </button>
          </div>
        </div>
      `;
    } else {
      // Agrupar citas por día
      const appointmentsByDay = {};
      
      appointmentsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // VALIDAR datos de la cita antes de procesar
        if (!data.fecha) {
          console.warn('Cita sin fecha encontrada:', doc.id);
          return;
        }
        
        const fecha = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
        const dateKey = formatDateOnly(fecha);
        
        if (!appointmentsByDay[dateKey]) {
          appointmentsByDay[dateKey] = [];
        }
        appointmentsByDay[dateKey].push({ id: doc.id, ...data, fechaObj: fecha });
      });
      
      // Mostrar citas agrupadas por día
      Object.keys(appointmentsByDay).sort().forEach(dateKey => {
        const appointments = appointmentsByDay[dateKey];
        
        html += `
          <div class="day-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--primary-blue); margin-bottom: 12px; border-bottom: 2px solid var(--gray-200); padding-bottom: 8px;">
              ${dateKey} (${appointments.length} citas)
            </h3>
            <div class="appointments-grid" style="display: grid; gap: 12px;">
        `;
        
        // Ordenar citas del día por hora
        appointments.sort((a, b) => a.fechaObj - b.fechaObj);
        
        appointments.forEach(appointment => {
          const estado = appointment.estado || 'programada';
          const borderColor = estado === 'completada' ? 'var(--success-green)' : 
                             estado === 'cancelada' ? 'var(--danger-red)' : 'var(--primary-blue)';
          
          html += `
            <div class="card appointment-card" style="border-left: 4px solid ${borderColor};">
              <div class="card-header">
                <div>
                  <h4>${appointment.paciente_nombre || 'Paciente sin nombre'}</h4>
                  <p><i class="fas fa-clock"></i> ${formatTimeOnly(appointment.fechaObj)}</p>
                  <p><i class="fas fa-user"></i> ${appointment.tipo_cita || 'Consulta general'}</p>
                </div>
                <div style="text-align: right;">
                  <span class="status-badge status-${estado}">
                    ${estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </span>
                </div>
              </div>
              ${appointment.observaciones ? `
              <div class="appointment-info" style="margin-top: 12px;">
                <div><strong>Observaciones:</strong> ${appointment.observaciones}</div>
              </div>
              ` : ''}
              <div style="margin-top: 12px;">
                ${estado === 'programada' ? `
                <button class="btn btn-success btn-sm" onclick="startAppointment('${appointment.id}')">
                  <i class="fas fa-play"></i> Iniciar
                </button>
                ` : ''}
                <button class="btn btn-outline btn-sm" onclick="editAppointment('${appointment.id}')">
                  <i class="fas fa-edit"></i> Editar
                </button>
                ${estado !== 'completada' ? `
                <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${appointment.id}')">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                ` : ''}
              </div>
            </div>
          `;
        });
        
        html += '</div></div>';
      });
    }
    
    html += '</div>';
    calendarPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar agenda:', error);
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Error al cargar la agenda</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar la agenda: ${error.message}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="loadCalendarPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    `;
    handleFirebaseError(error, 'carga de agenda');
  }
}

// ================= SEGUIMIENTOS CORREGIDOS =================

async function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (!followupsPanel) {
    console.error('Panel de seguimientos no encontrado');
    return;
  }
  
  // VALIDAR datos de usuario
  if (!userData || !userData.uid) {
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Error: Usuario no válido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar datos de usuario
        </p>
      </div>
    `;
    return;
  }
  
  followupsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos</h1>
      <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>
  `;
  
  try {
    console.log('Cargando seguimientos para usuario:', userData.uid, 'CESFAM:', userData.cesfam_asignado);
    
    // CONSULTA CORREGIDA con validaciones
    let followupsQuery = db.collection('seguimientos');
    
    // Filtrar por profesional o por CESFAM según el rol
    if (userData.profesion === 'admin') {
      // Admin ve todos los seguimientos
      followupsQuery = followupsQuery.orderBy('fecha_creacion', 'desc').limit(100);
    } else if (userData.profesion === 'coordinador' && userData.cesfam_asignado) {
      // Coordinador ve seguimientos de su CESFAM
      followupsQuery = followupsQuery
        .where('metadata.cesfam', '==', userData.cesfam_asignado)
        .orderBy('fecha_creacion', 'desc')
        .limit(50);
    } else {
      // Otros profesionales ven solo sus seguimientos
      followupsQuery = followupsQuery
        .where('profesional_id', '==', userData.uid)
        .orderBy('fecha_creacion', 'desc')
        .limit(50);
    }
    
    console.log('Ejecutando consulta de seguimientos...');
    const followupsSnapshot = await followupsQuery.get();
    console.log('Seguimientos encontrados:', followupsSnapshot.size);
    
    if (followupsSnapshot.empty) {
      followupsPanel.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Seguimientos</h1>
          <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
          <div style="margin-top: 16px;">
            <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
              <i class="fas fa-refresh"></i> Actualizar
            </button>
          </div>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos registrados.
            ${userData.profesion !== 'admin' ? '<br><small>Solo ves tus propios seguimientos</small>' : ''}
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Historial de seguimientos de pacientes (${followupsSnapshot.size} registros)</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Actualizar
          </button>
        </div>
      </div>
    `;
    
    followupsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // VALIDAR datos antes de renderizar
      const fechaCreacion = data.fecha_creacion ? 
        (data.fecha_creacion.toDate ? data.fecha_creacion.toDate() : new Date(data.fecha_creacion)) : 
        new Date();
      
      const proximaCita = data.proxima_cita ? 
        (data.proxima_cita.toDate ? data.proxima_cita.toDate() : new Date(data.proxima_cita)) : 
        null;
      
      html += `
        <div class="card followup-card" style="margin-bottom: 16px;">
          <div class="card-header">
            <div>
              <h4>${data.paciente_nombre || 'Paciente sin nombre'}</h4>
              <p><i class="fas fa-calendar"></i> ${formatDate(fechaCreacion)}</p>
              <p><i class="fas fa-user-md"></i> ${data.profesional_nombre || 'Sin profesional'}</p>
              <p><i class="fas fa-tags"></i> ${data.tipo_seguimiento || 'General'}</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado_paciente || 'estable'}">
                ${(data.estado_paciente || 'estable').charAt(0).toUpperCase() + (data.estado_paciente || 'estable').slice(1)}
              </span>
              ${data.metadata?.cesfam ? `
              <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
                ${data.metadata.cesfam}
              </div>
              ` : ''}
            </div>
          </div>
          <div class="followup-content" style="margin: 16px 0;">
            <div><strong>Observaciones:</strong></div>
            <p style="margin: 8px 0; padding: 12px; background: var(--gray-50); border-radius: 8px;">
              ${data.observaciones || 'Sin observaciones registradas'}
            </p>
            ${proximaCita ? `
            <div style="margin-top: 12px;">
              <strong>Próxima cita:</strong> 
              <span style="color: var(--primary-blue);">${formatDate(proximaCita)}</span>
            </div>
            ` : ''}
            ${data.paciente_id ? `
            <div style="margin-top: 12px;">
              <button class="btn btn-outline btn-sm" onclick="viewPatientDetail('${data.paciente_id}')">
                <i class="fas fa-user"></i> Ver Paciente
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    followupsPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar seguimientos:', error);
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Error al cargar seguimientos</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar seguimientos: ${error.message}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="loadFollowupsPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    `;
    handleFirebaseError(error, 'carga de seguimientos');
  }
}

// ================= FUNCIONES DE CITAS =================

async function showTodayAppointments() {
  if (!currentUserData || !currentUserData.uid) {
    showNotification('Error: Usuario no autenticado', 'error');
    return;
  }
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todaySnapshot = await db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (todaySnapshot.empty) {
      showNotification('No tienes citas programadas para hoy', 'info');
    } else {
      showNotification(`Tienes ${todaySnapshot.size} cita(s) programada(s) para hoy`, 'success');
    }
    
  } catch (error) {
    console.error('Error al cargar citas de hoy:', error);
    handleFirebaseError(error, 'carga de citas de hoy');
  }
}

function showNewAppointmentModal() {
  showNotification('Función de nueva cita en desarrollo', 'info');
}

function startAppointment(appointmentId) {
  showNotification('Función de iniciar cita en desarrollo', 'info');
}

function editAppointment(appointmentId) {
  showNotification('Función de editar cita en desarrollo', 'info');
}

function cancelAppointment(appointmentId) {
  if (confirm('¿Estás seguro de cancelar esta cita?')) {
    showNotification('Función de cancelar cita en desarrollo', 'info');
  }
}

// ================= FUNCIONES DE PACIENTES =================

function viewPatientDetail(patientId) {
  showNotification('Función de detalle de paciente en desarrollo', 'info');
}

function addFollowup(patientId) {
  showNotification('Función de agregar seguimiento en desarrollo', 'info');
}

function scheduleAppointment(patientId) {
  showNotification('Función de agendar cita en desarrollo', 'info');
}
// Continúa desde la PARTE 4...

// ================= FUNCIONES AUXILIARES CORREGIDAS =================

// Función CORREGIDA para formatear fechas
function formatDate(timestamp) {
  if (!timestamp) return 'Sin fecha';
  
  try {
    let date;
    if (timestamp.toDate) {
      // Firebase Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Fecha inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
}

// Función CORREGIDA para formatear solo fecha
function formatDateOnly(timestamp) {
  if (!timestamp) return 'Sin fecha';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Fecha inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
}

// Función CORREGIDA para formatear solo hora
function formatTimeOnly(timestamp) {
  if (!timestamp) return 'Sin hora';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Hora inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }
    
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando hora:', error);
    return 'Error en hora';
  }
}

// Función CORREGIDA para validar RUT chileno
function validateRUT(rut) {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar RUT
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Verificar que el cuerpo sea numérico
  if (!/^\d+$/.test(body)) return false;
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
  
  return dv === calculatedDV;
}

// Función CORREGIDA para formatear RUT
function formatRUT(rut) {
  if (!rut) return '';
  
  // Limpiar RUT
  let cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRUT.length <= 1) return cleanRUT;
  
  // Separar cuerpo y dígito verificador
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Formatear cuerpo con puntos
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return formattedBody + '-' + dv;
}

// Función CORREGIDA para validar email
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Función CORREGIDA para formatear teléfono
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Limpiar número
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Si no empieza con +56, agregarlo
  if (cleanPhone.length > 0 && !cleanPhone.startsWith('+56') && !cleanPhone.startsWith('56')) {
    if (cleanPhone.startsWith('9')) {
      cleanPhone = '+56 9 ' + cleanPhone.substring(1);
    } else {
      cleanPhone = '+56 ' + cleanPhone;
    }
  } else if (cleanPhone.startsWith('56') && !cleanPhone.startsWith('+56')) {
    cleanPhone = '+' + cleanPhone;
  }
  
  // Formatear con espacios
  if (cleanPhone.startsWith('+56')) {
    const number = cleanPhone.substring(3);
    if (number.length > 1) {
      cleanPhone = '+56 ' + number.substring(0, 1) + ' ' + number.substring(1);
    }
  }
  
  return cleanPhone;
}

// Función CORREGIDA para obtener nombre de profesión
function getProfessionName(profession) {
  const professions = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional',
    'coordinador': 'Coordinador',
    'admin': 'Administrador'
  };
  
  return professions[profession] || 'Profesional';
}

// Función CORREGIDA para calcular prioridad automática
function calculatePriority(data) {
  if (!data) return 'baja';
  
  let score = 0;
  
  // Edad (menores y adultos mayores = mayor prioridad)
  if (data.edad) {
    if (data.edad < 18 || data.edad > 65) score += 2;
  }
  
  // Sustancias de alto riesgo
  const highRiskSubstances = ['heroína', 'cocaína', 'pasta_base', 'fentanilo'];
  if (data.sustancias && Array.isArray(data.sustancias)) {
    const hasHighRisk = data.sustancias.some(s => highRiskSubstances.includes(s));
    if (hasHighRisk) score += 3;
  }
  
  // Tiempo de consumo
  if (data.tiempoConsumo) {
    if (data.tiempoConsumo > 60) score += 2; // Más de 5 años
  }
  
  // Urgencia declarada
  if (data.urgencia === 'alta') score += 3;
  if (data.urgencia === 'media') score += 1;
  
  // Motivación baja
  if (data.motivacion && data.motivacion < 5) score += 1;
  
  // Tratamiento previo fallido
  if (data.tratamientoPrevio === 'si') score += 1;
  
  // Palabras clave en descripción
  if (data.razon && typeof data.razon === 'string') {
    const urgentKeywords = ['urgente', 'emergencia', 'crisis', 'suicidio', 'violencia'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      data.razon.toLowerCase().includes(keyword)
    );
    if (hasUrgentKeywords) score += 3;
  }
  
  // Determinar prioridad basada en puntaje
  if (score >= 7) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

// ================= MANEJO DE ERRORES GLOBAL =================

// Función CORREGIDA para manejo de errores de Firebase
function handleFirebaseError(error, context = '') {
  console.error('Firebase Error:', error, 'Context:', context);
  
  let userMessage = 'Error en el sistema';
  
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        userMessage = 'No tienes permisos para realizar esta acción';
        break;
      case 'unavailable':
        userMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
        break;
      case 'deadline-exceeded':
        userMessage = 'Tiempo de espera agotado. Verifica tu conexión.';
        break;
      case 'resource-exhausted':
        userMessage = 'Límite de consultas excedido. Intenta más tarde.';
        break;
      case 'unauthenticated':
        userMessage = 'Sesión expirada. Inicia sesión nuevamente.';
        handleLogout();
        break;
      case 'invalid-argument':
        userMessage = 'Datos inválidos en la consulta';
        break;
      case 'not-found':
        userMessage = 'Documento no encontrado';
        break;
      case 'already-exists':
        userMessage = 'El documento ya existe';
        break;
      default:
        userMessage = `Error: ${error.message}`;
    }
  } else if (error.message) {
    userMessage = error.message;
  }
  
  showNotification(userMessage, 'error');
  return userMessage;
}

// Función CORREGIDA para validaciones de formulario
function validateFormData(data, requiredFields = []) {
  const errors = [];
  
  // Verificar campos requeridos
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`El campo ${field} es requerido`);
    }
  });
  
  // Validaciones específicas
  if (data.rut && !validateRUT(data.rut)) {
    errors.push('El RUT ingresado no es válido');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('El email ingresado no es válido');
  }
  
  if (data.edad && (isNaN(data.edad) || data.edad < 12 || data.edad > 120)) {
    errors.push('La edad debe estar entre 12 y 120 años');
  }
  
  if (data.telefono && data.telefono.length < 8) {
    errors.push('El teléfono debe tener al menos 8 dígitos');
  }
  
  return errors;
}

// ================= FUNCIONES DE NOTIFICACIONES MEJORADAS =================

// Variable global para almacenar notificaciones activas
window.activeNotifications = window.activeNotifications || [];

// Función CORREGIDA para mostrar notificaciones
function showNotification(message, type = 'info', duration = 5000) {
  if (!message) return;
  
  // Limpiar notificaciones anteriores del mismo tipo
  window.activeNotifications.forEach(notification => {
    if (notification.type === type && notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
  });
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = {
    'success': 'fas fa-check-circle',
    'error': 'fas fa-exclamation-circle',
    'warning': 'fas fa-exclamation-triangle',
    'info': 'fas fa-info-circle'
  }[type] || 'fas fa-info-circle';
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Estilos en línea para asegurar que se vean
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
    ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
    ${type === 'warning' ? 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
    ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
  `;
  
  notification.querySelector('.notification-content').style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.querySelector('.notification-close').style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    margin-left: auto;
    opacity: 0.7;
  `;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Almacenar referencia
  const notificationObj = { element: notification, type: type };
  window.activeNotifications.push(notificationObj);
  
  // Auto-remover después del tiempo especificado
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
          // Remover de la lista activa
          const index = window.activeNotifications.indexOf(notificationObj);
          if (index > -1) {
            window.activeNotifications.splice(index, 1);
          }
        }, 300);
      }
    }, duration);
  }
}

// Función CORREGIDA para mostrar/ocultar loading
function showLoading(show = true) {
  let loadingOverlay = document.getElementById('loading-overlay');
  
  if (show) {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      `;
      
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      
      loadingOverlay.querySelector('.loading-content').style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      
      document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'flex';
  } else {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// ================= SISTEMA DE REPORTES =================

async function loadReportsPanel(userData) {
  const reportsPanel = document.getElementById('reports-panel');
  if (!reportsPanel) {
    console.error('Panel de reportes no encontrado');
    return;
  }
  
  // Verificar permisos
  if (userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    reportsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes</h1>
        <p class="panel-subtitle">Acceso restringido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
          Solo coordinadores y administradores pueden acceder a los reportes.
        </p>
      </div>
    `;
    return;
  }
  
  reportsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Reportes</h1>
      <p class="panel-subtitle">Estadísticas y análisis del programa</p>
    </div>
    <div class="card">
      <p style="text-align: center; color: var(--gray-600);">
        <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
        Módulo de reportes en desarrollo
      </p>
    </div>
  `;
}

// ================= FUNCIONES DE LOGOUT Y LIMPIEZA =================

async function handleLogout() {
  try {
    await auth.signOut();
    currentUser = null;
    currentUserData = null;
    
    // Limpiar listeners de tiempo real
    if (window.sendaUnsubscribers) {
      window.sendaUnsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error al limpiar listener:', error);
        }
      });
      window.sendaUnsubscribers = [];
    }
    
    // Cerrar modales
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
    
    showNotification('Sesión cerrada correctamente', 'success');
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

// ================= LISTENERS DE TIEMPO REAL =================

function startRealTimeListeners(userData) {
  // Inicializar array de unsubscribers
  window.sendaUnsubscribers = window.sendaUnsubscribers || [];
  
  try {
    // Listener para solicitudes nuevas (solo para roles autorizados)
    if (userData.profesion === 'asistente_social' || userData.profesion === 'admin' || userData.profesion === 'coordinador') {
      let solicitudesQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente');
      
      if (userData.cesfam_asignado && userData.profesion !== 'admin') {
        solicitudesQuery = solicitudesQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
      }
      
      const unsubscribeSolicitudes = solicitudesQuery.onSnapshot(
        snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const isReentry = data.tipo_solicitud === 'reingreso';
              showNotification(
                `Nueva solicitud ${isReentry ? 'de reingreso' : 'de ingreso'} recibida`, 
                'info', 
                5000
              );
            }
          });
        },
        error => {
          console.warn('Error en listener de solicitudes:', error);
        }
      );
      
      window.sendaUnsubscribers.push(unsubscribeSolicitudes);
    }
    
    console.log('✅ Listeners de tiempo real iniciados');
    
  } catch (error) {
    console.error('Error iniciando listeners de tiempo real:', error);
  }
}

// ================= FUNCIÓN DE INICIALIZACIÓN FINAL =================

function initializeApp() {
  console.log('🚀 Inicializando aplicación SENDA...');
  
  try {
    // Verificar que Firebase esté cargado
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase no está cargado');
    }
    
    // Verificar configuración de Firebase
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    if (!auth) {
      throw new Error('Auth no está inicializado');
    }
    
    // Cargar datos de CESFAM
    loadCesfamData();
    
    // Configurar event listeners
    initializeEventListeners();
    
    // Configurar validaciones de formulario
    setupFormValidation();
    
    // Configurar controles de modal
    setupModalControls();
    
    // Configurar funcionalidad de tabs
    setupTabFunctionality();
    
    // Configurar formulario multi-paso
    setupMultiStepForm();
    
    // Cargar borrador si existe
    loadDraftIfExists();
    
    // Configurar listener de estado de autenticación
    auth.onAuthStateChanged(user => {
      if (user) {
        console.log('Usuario autenticado detectado:', user.uid);
      } else {
        console.log('Usuario no autenticado');
        currentUser = null;
        currentUserData = null;
      }
    });
    
    console.log('✅ Aplicación SENDA inicializada correctamente');
    
    // Mostrar notificación de bienvenida
    showNotification('Sistema SENDA Puente Alto cargado correctamente', 'success', 3000);
    
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error);
    showNotification('Error al cargar el sistema: ' + error.message, 'error', 10000);
  }
}

// ================= LISTENER FINAL DE CARGA =================

// Asegurar que todo se ejecute cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Listener de estado de conexión
window.addEventListener('online', () => {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', () => {
  showNotification('Sin conexión a internet. Algunas funciones pueden no estar disponibles.', 'warning', 8000);
});

// Limpiar recursos al cerrar la ventana
window.addEventListener('beforeunload', () => {
  // Limpiar listeners de Firebase
  if (window.sendaUnsubscribers) {
    window.sendaUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error al limpiar listener:', error);
      }
    });
  }
  
  // Limpiar notificaciones activas
  if (window.activeNotifications) {
    window.activeNotifications.forEach(notification => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
    });
  }
});

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
  showNotification('Error inesperado en la aplicación', 'error');
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada:', event.reason);
  event.preventDefault();
});

console.log('📄 app.js cargado completamente - Sistema SENDA Puente Alto v1.0');

// ================= FIN DEL ARCHIVO app.js =================
