// ================= CONFIGURACIÓN FIREBASE =================

const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  measurementId: "G-82DCLW5R2W"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar Firestore para trabajar offline
db.enablePersistence().catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia fallida: múltiples pestañas abiertas');
  } else if (err.code == 'unimplemented') {
    console.warn('Persistencia no soportada en este navegador');
  }
});

console.log('Firebase inicializado correctamente para SENDA Puente Alto');

// ================= VARIABLES GLOBALES =================

let currentUser = null;
let currentUserData = null;
let formData = {};
let currentFormStep = 1;
let currentStepIndex = 0;
let flowSteps = [1];
let isDraftSaved = false;

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
  
  console.log('Datos de CESFAM cargados:', cesfamPuenteAlto.length, 'centros');
}

// ================= SISTEMA DE MODALES =================

function showModal(modalId) {
  console.log('Mostrando modal:', modalId);
  
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.style.display = 'none';
  });
  
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    if (modalId === 'patient-modal') {
      resetForm();
    }
  } else {
    console.error('Modal no encontrado:', modalId);
    createBasicModal(modalId);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    
    if (modalId.includes('detail') || modalId.includes('search') || modalId.includes('reentry')) {
      modal.remove();
    }
  }
}

function createBasicModal(modalId) {
  const modalContent = {
    'info-modal': {
      title: 'Sobre el Programa SENDA',
      content: `
        <p>El programa SENDA Puente Alto ofrece atención integral para personas con problemas de consumo de alcohol y otras drogas.</p>
        <h3>Servicios disponibles:</h3>
        <ul>
          <li>Evaluación y diagnóstico</li>
          <li>Tratamiento ambulatorio</li>
          <li>Terapia individual y grupal</li>
          <li>Apoyo familiar</li>
          <li>Seguimiento post-tratamiento</li>
        </ul>
        <p><strong>Teléfono:</strong> 1412 (gratuito)</p>
        <p><strong>Emergencias:</strong> 131</p>
      `
    }
  };
  
  const modal = modalContent[modalId];
  if (modal) {
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal">
          <button class="modal-close">
            <i class="fas fa-times"></i>
          </button>
          <h2>${modal.title}</h2>
          ${modal.content}
          <div style="margin-top: 24px; text-align: center;">
            <button class="btn btn-outline" onclick="closeModal('${modalId}')">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById(modalId).style.display = 'flex';
  }
}

// ================= SISTEMA DE REINGRESO =================

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
  
  setupReentryValidations();
  document.getElementById('reentry-form').addEventListener('submit', handleReentrySubmission);
}

function setupReentryValidations() {
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
  
  const phoneInput = document.getElementById('reentry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
}

async function handleReentrySubmission(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('reentry-name').value.trim(),
    rut: document.getElementById('reentry-rut').value.trim(),
    cesfam: document.getElementById('reentry-cesfam').value,
    phone: document.getElementById('reentry-phone').value.trim(),
    email: document.getElementById('reentry-email').value.trim(),
    reason: document.getElementById('reentry-reason').value.trim()
  };
  
  if (!formData.name || !formData.rut || !formData.cesfam || !formData.phone || !formData.reason) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!validateRUT(formData.rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  if (formData.email && !isValidEmail(formData.email)) {
    showNotification('El email ingresado no es válido', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    const reentryData = {
      tipo_solicitud: 'reingreso',
      datos_personales: {
        nombre_completo: formData.name,
        rut: formData.rut,
        cesfam: formData.cesfam,
        edad: null,
        para_quien: 'para_mi',
        anonimo: false,
        solo_informacion: false
      },
      datos_contacto: {
        nombre_completo: formData.name,
        rut: formData.rut,
        telefono_principal: formData.phone,
        email: formData.email || null,
        direccion: null
      },
      reingreso: {
        motivo: formData.reason,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente'
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
    
    const docRef = await db.collection('solicitudes_ingreso').add(reentryData);
    
    showNotification('Solicitud de reingreso enviada correctamente. Se le contactará pronto.', 'success', 6000);
    closeModal('reentry-modal');
    
    document.getElementById('reentry-form').reset();
    
  } catch (error) {
    console.error('Error al enviar solicitud de reingreso:', error);
    handleFirebaseError(error, 'reingreso');
  } finally {
    showLoading(false);
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
  
  if (!email.endsWith('@senda.cl')) {
    showNotification('Solo se permite acceso con correo institucional @senda.cl', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const profesionalDoc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!profesionalDoc.exists) {
      await auth.signOut();
      throw new Error('Usuario no registrado como profesional SENDA');
    }
    
    const profesionalData = profesionalDoc.data();
    
    if (!profesionalData.configuracion_sistema?.activo) {
      await auth.signOut();
      throw new Error('Usuario inactivo. Contacte al administrador.');
    }
    
    currentUserData = { uid: user.uid, ...profesionalData };
    showNotification(`Bienvenido, ${profesionalData.nombre}`, 'success');
    
    closeModal('professional-modal');
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
// ================= FORMULARIO DE SOLICITUD DE AYUDA =================

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
  
  if (!isValid) {
    showNotification('Por favor corrige los errores antes de continuar', 'error');
  }
  
  return isValid;
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

async function handlePatientRegistration(e) {
  if (e) e.preventDefault();
  
  try {
    showLoading(true);
    collectCurrentStepData();
    
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
    
    const docRef = await db.collection('solicitudes_ingreso').add(solicitudData);
    
    localStorage.removeItem('senda_draft');
    resetForm();
    closeModal('patient-modal');
    
    if (formData.tipoSolicitud === 'informacion') {
      showNotification('Solicitud de información enviada correctamente. Te contactaremos pronto.', 'success', 6000);
    } else {
      showNotification('Solicitud de ingreso enviada correctamente. Un profesional la revisará pronto.', 'success', 6000);
    }
    
  } catch (error) {
    console.error('Error al registrar solicitud:', error);
    handleFirebaseError(error, 'registro de solicitud');
  } finally {
    showLoading(false);
  }
}

// ================= PANEL DE PROFESIONALES =================

function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  showPanel('requests', userData);
  
  const requestsNav = document.querySelector('[data-panel="requests"]');
  if (requestsNav) {
    requestsNav.classList.add('active');
  }
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
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
      default:
        showNotification('Esta sección está en desarrollo', 'info');
    }
  }
}

async function loadRequestsPanel(userData) {
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
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    let query = db.collection('solicitudes_ingreso');
    
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      query = query.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    query = query.orderBy('metadata.fecha_creacion', 'desc').limit(50);
    
    const snapshot = await query.get();
    
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
      html += createRequestCard(doc.id, data);
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar solicitudes:', error);
    handleFirebaseError(error, 'carga de solicitudes');
  }
}

function createRequestCard(requestId, data) {
  const priority = data.clasificacion?.prioridad || 'baja';
  const estado = data.clasificacion?.estado || 'pendiente';
  const isAnonymous = data.datos_personales?.anonimo || false;
  const isInfoOnly = data.datos_personales?.solo_informacion || false;
  const isReentry = data.tipo_solicitud === 'reingreso';
  
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
  
  return `
    <div class="card patient-card" data-request-id="${requestId}">
      <div class="card-header">
        <div>
          <h3>
            ${isReentry ? '<i class="fas fa-redo" style="color: var(--warning-orange);"></i> ' : ''}
            Solicitud ${requestId.substring(0, 8).toUpperCase()}
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
        </div>
      </div>
      <div class="patient-info">
        <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
        <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
        ${data.datos_contacto?.telefono_principal ? 
          `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
      </div>
    </div>
  `;
}

async function loadPatientsPanel(userData) {
  showNotification('Función de pacientes en desarrollo', 'info');
}

async function handleLogout() {
  try {
    await auth.signOut();
    currentUser = null;
    currentUserData = null;
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
    
    showNotification('Sesión cerrada correctamente', 'success');
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

// ================= FUNCIONES AUXILIARES =================

function formatDate(timestamp) {
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Error en fecha';
  }
}

function validateRUT(rut) {
  if (!rut || typeof rut !== 'string') return false;
  
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  if (!/^\d+$/.test(body)) return false;
  
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

function formatRUT(rut) {
  if (!rut) return '';
  
  let cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRUT.length <= 1) return cleanRUT;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return formattedBody + '-' + dv;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  if (cleanPhone.length > 0 && !cleanPhone.startsWith('+56') && !cleanPhone.startsWith('56')) {
    if (cleanPhone.startsWith('9')) {
      cleanPhone = '+56 9 ' + cleanPhone.substring(1);
    } else {
      cleanPhone = '+56 ' + cleanPhone;
    }
  } else if (cleanPhone.startsWith('56') && !cleanPhone.startsWith('+56')) {
    cleanPhone = '+' + cleanPhone;
  }
  
  if (cleanPhone.startsWith('+56')) {
    const number = cleanPhone.substring(3);
    if (number.length > 1) {
      cleanPhone = '+56 ' + number.substring(0, 1) + ' ' + number.substring(1);
    }
  }
  
  return cleanPhone;
}

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

function calculatePriority(data) {
  if (!data) return 'baja';
  
  let score = 0;
  
  if (data.edad) {
    if (data.edad < 18 || data.edad > 65) score += 2;
  }
  
  const highRiskSubstances = ['heroína', 'cocaína', 'pasta_base', 'fentanilo'];
  if (data.sustancias && Array.isArray(data.sustancias)) {
    const hasHighRisk = data.sustancias.some(s => highRiskSubstances.includes(s));
    if (hasHighRisk) score += 3;
  }
  
  if (data.tiempoConsumo) {
    if (data.tiempoConsumo > 60) score += 2;
  }
  
  if (data.urgencia === 'alta') score += 3;
  if (data.urgencia === 'media') score += 1;
  
  if (data.motivacion && data.motivacion < 5) score += 1;
  
  if (data.tratamientoPrevio === 'si') score += 1;
  
  if (data.razon && typeof data.razon === 'string') {
    const urgentKeywords = ['urgente', 'emergencia', 'crisis', 'suicidio', 'violencia'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      data.razon.toLowerCase().includes(keyword)
    );
    if (hasUrgentKeywords) score += 3;
  }
  
  if (score >= 7) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

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
      case 'unauthenticated':
        userMessage = 'Sesión expirada. Inicia sesión nuevamente.';
        handleLogout();
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

window.activeNotifications = window.activeNotifications || [];

function showNotification(message, type = 'info', duration = 5000) {
  if (!message) return;
  
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
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }
}

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

// ================= INICIALIZACIÓN =================

function initializeEventListeners() {
  console.log('Configurando event listeners...');
  
  const registerPatientBtn = document.getElementById('register-patient');
  if (registerPatientBtn) {
    registerPatientBtn.addEventListener('click', function() {
      showModal('patient-modal');
    });
  }
  
  const reentryBtn = document.getElementById('reentry-program');
  if (reentryBtn) {
    reentryBtn.addEventListener('click', function() {
      showReentryModal();
    });
  }
  
  const aboutBtn = document.getElementById('about-program');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', function() {
      showModal('info-modal');
    });
  }
  
  const loginBtn = document.getElementById('login-professional');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      showModal('professional-modal');
    });
  }
  
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
    submitBtn.addEventListener('click', handlePatientRegistration);
  }
  
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        closeModal(modal.id);
      }
    }
    
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target.id);
    }
  });
  
  document.addEventListener('change', function(e) {
    if (e.target.name === 'tipoSolicitud') {
      handleTipoSolicitudChange(e.target.value);
    }
  });
  
  console.log('Event listeners configurados');
}

function initializeApp() {
  console.log('Inicializando aplicación SENDA...');
  
  try {
    loadCesfamData();
    initializeEventListeners();
    setupFormValidation();
    
    const motivacionSlider = document.getElementById('motivacion');
    const motivacionValue = document.getElementById('motivacion-value');
    
    if (motivacionSlider && motivacionValue) {
      motivacionSlider.addEventListener('input', function() {
        motivacionValue.textContent = this.value;
      });
    }
    
    auth.onAuthStateChanged(user => {
      if (user) {
        console.log('Usuario autenticado detectado:', user.uid);
      } else {
        console.log('Usuario no autenticado');
        currentUser = null;
        currentUserData = null;
      }
    });
    
    console.log('Aplicación SENDA inicializada correctamente');
    showNotification('Sistema SENDA Puente Alto cargado correctamente', 'success', 3000);
    
  } catch (error) {
    console.error('Error al inicializar aplicación:', error);
    showNotification('Error al cargar el sistema: ' + error.message, 'error', 10000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

console.log('app.js cargado completamente - Sistema SENDA Puente Alto v1.0');
