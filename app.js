// ==========================
//  PARTE 1: CONFIGURACIÓN INICIAL
// ==========================

// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Variables globales ---
let currentUser = null;            // Usuario actual logueado
let currentUserData = null;        // Datos del usuario
let currentFormStep = 1;           // Paso actual del formulario
let maxFormStep = 4;                // Total de pasos posibles
let formData = {};                  // Datos recolectados del formulario
let isDraftSaved = false;           // Control para borradores
let flowSteps = [1];                // Flujo de pasos dinámico
let currentStepIndex = 0;           // Índice actual de flujo

// Variables para la agenda (2025)
let selectedProfessional = null;
let currentCalendarDate = new Date(2025, 0, 1); // Enero 2025

// --- Lista de CESFAM de Puente Alto ---
const cesfamPuenteAlto = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla",
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
];

// ==========================
//  FUNCIONES UTILITARIAS
// ==========================

/**
 * Selector rápido por ID
 */
const $ = (id) => document.getElementById(id);

/**
 * Muestra una notificación flotante
 */
function showNotification(message, type = 'info', duration = 4000) {
  const container = $('notifications');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
    ${message}
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Muestra o esconde el overlay de carga
 */
function showLoading(show = true) {
  const overlay = $('loading-overlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

/**
 * Formatea el RUT
 */
function formatRUT(rut) {
  const cleaned = rut.replace(/[^\dKk]/g, '');
  if (cleaned.length > 1) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
  }
  return cleaned;
}

/**
 * Valida el RUT
 */
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

/**
 * Valida un email
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Formatea número de teléfono
 */
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
  if (cleaned.length === 9 && cleaned.startsWith('9')) return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
  if (cleaned.length === 11 && cleaned.startsWith('56')) return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
  return phone;
}

/**
 * Formatea una fecha a DD-MM-YYYY HH:mm
 */
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';

  let date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Función debounce para evitar ejecuciones repetidas
 */
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ==========================
//  INICIO DE LA APLICACIÓN
// ==========================

document.addEventListener('DOMContentLoaded', () => {
  console.log('SENDA Platform loading...');
  initializeApp();
});

/**
 * Inicializa la aplicación
 */
function initializeApp() {
  try {
    initializeEventListeners();
    setupEmailValidation();
    showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
    console.log('SENDA Platform initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error al cargar el sistema', 'error');
  }
}

// ==========================
//  EVENTOS INICIALES
// ==========================

function initializeEventListeners() {
  const registerBtn = $('register-patient');
  const loginBtn = $('login-professional');

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      formData = {};
      currentFormStep = 1;
      currentStepIndex = 0;
      flowSteps = [1];
      isDraftSaved = false;
      openModal('patient-modal');
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => openModal('professional-modal'));
  }
}

/**
 * Valida el correo institucional en el formulario de registro profesional
 */
function setupEmailValidation() {
  const emailInput = $('register-email');
  if (!emailInput) return;

  emailInput.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    if (email && !email.endsWith('@senda.cl')) {
      e.target.classList.add('error');
      showNotification('El correo debe ser institucional (@senda.cl)', 'warning');
    } else if (email && isValidEmail(email)) {
      e.target.classList.remove('error');
    }
  });

  emailInput.placeholder = 'nombre@senda.cl';
}

// ==========================
//  FUNCIONES DE MODALES
// ==========================
function openModal(id) {
  const modal = $(id);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = $(id);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}
// ==========================
//  PARTE 2: FLUJO DE FORMULARIO, VALIDACIONES Y BORRADORES
// ==========================

// --- Datos de regiones (simplificado) ---
const regionesChile = {
  rm: { nombre: 'Región Metropolitana', comunas: ['Puente Alto', 'La Florida', 'Maipú', 'Providencia'] },
  valparaiso: { nombre: 'Valparaíso', comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué'] },
  bioBio: { nombre: 'Biobío', comunas: ['Concepción', 'Talcahuano'] }
};

// --- Carga dinámica de regiones y CESFAM ---
function loadRegionsData() {
  const regionSelect = $('patient-region');
  if (!regionSelect) return;

  regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
  Object.keys(regionesChile).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = regionesChile[key].nombre;
    regionSelect.appendChild(opt);
  });
}

function loadCommunesData(regionKey) {
  const comunaSelect = $('patient-comuna');
  if (!comunaSelect) return;
  comunaSelect.innerHTML = '<option value="">Seleccionar comuna...</option>';
  if (!regionKey || !regionesChile[regionKey]) {
    comunaSelect.disabled = true;
    return;
  }
  regionesChile[regionKey].comunas.forEach(comuna => {
    const opt = document.createElement('option');
    opt.value = comuna;
    opt.textContent = comuna;
    comunaSelect.appendChild(opt);
  });
  comunaSelect.disabled = false;
}

function loadCesfamData() {
  const cesfamSelect = $('patient-cesfam');
  if (!cesfamSelect) return;
  cesfamSelect.innerHTML = '<option value="">Seleccionar CESFAM...</option>';
  cesfamPuenteAlto.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    cesfamSelect.appendChild(opt);
  });
}

// --- Multi-step form setup ---
function setupMultiStepForm() {
  // motivacion slider
  const motivacionSlider = $('motivacion');
  const motivacionValue = $('motivacion-value');
  if (motivacionSlider && motivacionValue) {
    motivacionSlider.addEventListener('input', () => motivacionValue.textContent = motivacionSlider.value);
  }

  // tipo solicitud change
  document.querySelectorAll('input[name="tipoSolicitud"]').forEach(r => {
    r.addEventListener('change', (e) => {
      formData.tipoSolicitud = e.target.value;
      handleTipoSolicitudChange(e.target.value);
    });
  });

  // paraMi default radio binding (keeps formData updated)
  document.querySelectorAll('input[name="paraMi"]').forEach(r => {
    r.addEventListener('change', (e) => formData.paraMi = e.target.value);
  });

  // region -> load communes
  $('patient-region')?.addEventListener('change', (e) => {
    formData.region = e.target.value;
    loadCommunesData(e.target.value);
  });

  // navigation buttons
  $('next-step')?.addEventListener('click', nextFormStep);
  $('prev-step')?.addEventListener('click', prevFormStep);
  $('save-draft')?.addEventListener('click', () => saveDraft(true));
  $('submit-form')?.addEventListener('click', submitPatientForm);

  // form submit prevention
  $('patient-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPatientForm();
  });
}

function handleTipoSolicitudChange(tipo) {
  const phoneContainer = $('anonymous-phone-container');
  const emailContainer = $('info-email-container');

  if (phoneContainer) phoneContainer.style.display = 'none';
  if (emailContainer) emailContainer.style.display = 'none';

  if (tipo === 'anonimo') {
    flowSteps = [1, 3, 4];
    if (phoneContainer) phoneContainer.style.display = 'block';
  } else if (tipo === 'identificado') {
    flowSteps = [1, 2, 3, 4];
  } else if (tipo === 'informacion') {
    flowSteps = [1];
    if (emailContainer) emailContainer.style.display = 'block';
  } else {
    flowSteps = [1];
  }

  currentStepIndex = 0;
  currentFormStep = flowSteps[currentStepIndex];
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-step="${currentFormStep}"]`)?.classList.add('active');
  updateFormProgress();
}

function updateFormProgress() {
  const progressFill = $('form-progress');
  const progressText = $('progress-text');

  const total = flowSteps.length || 1;
  const current = currentStepIndex + 1;
  const percent = Math.round((current / total) * 100);

  if (progressFill) progressFill.style.width = percent + '%';
  if (progressText) progressText.textContent = `Paso ${current} de ${total}`;

  $('prev-step').style.display = currentStepIndex > 0 ? 'block' : 'none';
  $('next-step').style.display = currentStepIndex < total - 1 ? 'block' : 'none';
  $('submit-form').style.display = currentStepIndex === total - 1 ? 'inline-flex' : 'none';
}

function nextFormStep() {
  if (!validateCurrentStep()) return;
  collectCurrentStepData();

  if (currentStepIndex < flowSteps.length - 1) {
    const current = flowSteps[currentStepIndex];
    document.querySelector(`[data-step="${current}"]`)?.classList.remove('active');

    currentStepIndex++;
    currentFormStep = flowSteps[currentStepIndex];

    document.querySelector(`[data-step="${currentFormStep}"]`)?.classList.add('active');
    updateFormProgress();
    saveDraft(false);
  }
}

function prevFormStep() {
  if (currentStepIndex === 0) return;

  const current = flowSteps[currentStepIndex];
  document.querySelector(`[data-step="${current}"]`)?.classList.remove('active');

  currentStepIndex--;
  currentFormStep = flowSteps[currentStepIndex];

  document.querySelector(`[data-step="${currentFormStep}"]`)?.classList.add('active');
  updateFormProgress();
}

// --- Validaciones por paso ---
function validateCurrentStep() {
  const currentStepEl = document.querySelector(`[data-step="${currentFormStep}"]`);
  if (!currentStepEl) return true;

  // campos requeridos visibles
  const required = currentStepEl.querySelectorAll('[required]');
  let ok = true;

  required.forEach(field => {
    if (field.offsetParent === null) return; // hidden
    if (!field.value || field.value.toString().trim() === '') {
      field.classList.add('error');
      ok = false;
    } else {
      field.classList.remove('error');
    }
  });

  // validaciones específicas por paso
  if (currentFormStep === 1) ok = ok && validateStep1();
  if (currentFormStep === 2) ok = ok && validateStep2();
  if (currentFormStep === 3) ok = ok && validateStep3();

  if (!ok) showNotification('Corrige los errores antes de continuar', 'error');
  return ok;
}

function validateStep1() {
  const tipo = document.querySelector('input[name="tipoSolicitud"]:checked');
  const paraMi = document.querySelector('input[name="paraMi"]:checked');

  if (!tipo || !paraMi) {
    showNotification('Completa los campos obligatorios del Paso 1', 'error');
    return false;
  }

  if (tipo.value === 'anonimo') {
    const phone = $('anonymous-phone')?.value || '';
    if (!phone.trim()) {
      showNotification('Ingresa un teléfono de contacto para solicitudes anónimas', 'error');
      return false;
    }
  }

  if (tipo.value === 'informacion') {
    const email = $('info-email')?.value || '';
    if (!email.trim() || !isValidEmail(email)) {
      showNotification('Ingresa un email válido para recibir información', 'error');
      return false;
    }
  }

  // store minimal for next steps
  formData.tipoSolicitud = tipo.value;
  formData.paraMi = paraMi.value;
  formData.edad = $('patient-age')?.value || '';
  formData.region = $('patient-region')?.value || '';

  return true;
}

function validateStep2() {
  if (formData.tipoSolicitud !== 'identificado') return true;

  const rut = $('patient-rut')?.value || '';
  const email = $('patient-email')?.value || '';
  const telefono = $('patient-phone')?.value || '';

  if (!rut || !validateRUT(rut)) {
    showNotification('RUT inválido o vacío', 'error');
    return false;
  }

  if (email && !isValidEmail(email)) {
    showNotification('Email inválido', 'error');
    return false;
  }

  if (!telefono) {
    showNotification('Por favor ingresa un teléfono', 'error');
    return false;
  }

  return true;
}

function validateStep3() {
  if (formData.tipoSolicitud === 'informacion') return true;

  const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
  if (!sustancias || sustancias.length === 0) {
    showNotification('Selecciona al menos una sustancia', 'error');
    return false;
  }

  return true;
}

// --- Recolección de datos por paso ---
function collectCurrentStepData() {
  if (currentFormStep === 1) {
    formData.tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    formData.edad = $('patient-age')?.value || '';
    formData.region = $('patient-region')?.value || '';
    formData.paraMi = document.querySelector('input[name="paraMi"]:checked')?.value || '';

    if (formData.tipoSolicitud === 'anonimo') {
      formData.telefonoContacto = $('anonymous-phone')?.value || '';
    }
    if (formData.tipoSolicitud === 'informacion') {
      formData.emailInformacion = $('info-email')?.value || '';
    }
  }

  if (currentFormStep === 2 && formData.tipoSolicitud === 'identificado') {
    formData.nombre = $('patient-name')?.value || '';
    formData.apellido = $('patient-lastname')?.value || '';
    formData.rut = $('patient-rut')?.value || '';
    formData.telefono = $('patient-phone')?.value || '';
    formData.email = $('patient-email')?.value || '';
    formData.comuna = $('patient-comuna')?.value || '';
    formData.direccion = $('patient-address')?.value || '';
  }

  if (currentFormStep === 3) {
    if (formData.tipoSolicitud !== 'informacion') {
      formData.sustancias = Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(i => i.value);
      formData.tiempoConsumo = $('tiempo-consumo')?.value || '';
      formData.motivacion = $('motivacion')?.value || '';
      formData.urgencia = document.querySelector('input[name="urgencia"]:checked')?.value || '';
    }
  }

  if (currentFormStep === 4) {
    formData.razon = $('patient-reason')?.value || '';
    formData.tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked')?.value || '';
    formData.centroPreferencia = $('centro-preferencia')?.value || '';
    formData.cesfam = $('patient-cesfam')?.value || '';
  }
}

// --- Guardado y carga de borrador ---
function saveDraft(showMessage = true) {
  collectCurrentStepData();
  const draft = {
    formData,
    currentFormStep,
    currentStepIndex,
    flowSteps,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('senda_draft', JSON.stringify(draft));
  isDraftSaved = true;
  if (showMessage) showNotification('Borrador guardado', 'success', 2000);
}

function loadDraftIfExists() {
  const raw = localStorage.getItem('senda_draft');
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    const age = Date.now() - new Date(draft.timestamp).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('senda_draft');
      return;
    }

    if (confirm('Se encontró un borrador. ¿Deseas recuperar los datos?')) {
      formData = draft.formData || {};
      currentFormStep = draft.currentFormStep || 1;
      currentStepIndex = draft.currentStepIndex || 0;
      flowSteps = draft.flowSteps || [1];
      restoreFormData();
      isDraftSaved = true;
      showNotification('Borrador cargado', 'info', 2000);
    }
  } catch (err) {
    console.error('Error al cargar borrador', err);
    localStorage.removeItem('senda_draft');
  }
}

function restoreFormData() {
  // Cargar valores básicos por ID
  Object.keys(formData).forEach(key => {
    const elById = $(`patient-${key}`);
    const elByName = document.querySelector(`[name="${key}"]`);

    if (elById) {
      if (elById.type === 'checkbox' || elById.type === 'radio') {
        elById.checked = !!formData[key];
      } else {
        elById.value = formData[key];
      }
    } else if (elByName) {
      if (elByName.type === 'radio') {
        const radio = document.querySelector(`[name="${key}"][value="${formData[key]}"]`);
        if (radio) radio.checked = true;
      } else if (elByName.type === 'checkbox') {
        if (Array.isArray(formData[key])) {
          formData[key].forEach(val => {
            const cb = document.querySelector(`[name="${key}"][value="${val}"]`);
            if (cb) cb.checked = true;
          });
        }
      } else {
        elByName.value = formData[key];
      }
    }
  });

  if (formData.tipoSolicitud) handleTipoSolicitudChange(formData.tipoSolicitud);
  if (formData.region) {
    loadCommunesData(formData.region);
    setTimeout(() => {
      if (formData.comuna) $('patient-comuna').value = formData.comuna;
    }, 150);
  }

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-step="${currentFormStep}"]`)?.classList.add('active');
  updateFormProgress();
}

// --- Reset formulario ---
function resetForm() {
  formData = {};
  currentFormStep = 1;
  currentStepIndex = 0;
  flowSteps = [1];
  isDraftSaved = false;
  const form = $('patient-form');
  if (form) form.reset();

  document.querySelectorAll('.form-step').forEach((step, idx) => {
    step.classList.toggle('active', idx === 0);
  });

  const comunaSelect = $('patient-comuna');
  if (comunaSelect) {
    comunaSelect.innerHTML = '<option value="">Primero selecciona una región</option>';
    comunaSelect.disabled = true;
  }

  updateFormProgress();
}

// --- Envío del formulario completo ---
async function submitPatientForm(e) {
  if (e) e.preventDefault();
  if (!validateCurrentStep()) return;

  collectCurrentStepData();
  showLoading(true);

  try {
    // Calcular prioridad simple (ejemplo)
    const prioridad = calculatePriority(formData);

    const payload = {
      datos_personales: {
        anonimo: formData.tipoSolicitud === 'anonimo',
        solo_informacion: formData.tipoSolicitud === 'informacion',
        nombre: formData.nombre || null,
        apellido: formData.apellido || null,
        edad: parseInt(formData.edad) || null,
        region: formData.region || null,
        comuna: formData.comuna || null,
        cesfam: formData.cesfam || null,
        para_quien: formData.paraMi || null
      },
      contacto: {},
      evaluacion_inicial: formData.tipoSolicitud !== 'informacion' ? {
        sustancias: formData.sustancias || [],
        tiempo_consumo: formData.tiempoConsumo || null,
        motivacion: parseInt(formData.motivacion) || null,
        urgencia: formData.urgencia || null,
        descripcion: formData.razon || ''
      } : null,
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal: 'web_publica'
      },
      clasificacion: {
        prioridad
      }
    };

    if (formData.tipoSolicitud === 'identificado') {
      payload.contacto = {
        nombre_completo: `${formData.nombre || ''} ${formData.apellido || ''}`.trim(),
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        rut: formData.rut || null
      };
    } else if (formData.tipoSolicitud === 'anonimo') {
      payload.contacto = { telefono: formData.telefonoContacto || null, anonimo: true };
    } else if (formData.tipoSolicitud === 'informacion') {
      payload.contacto = { email: formData.emailInformacion || null, solo_informacion: true };
    }

    const docRef = await db.collection('solicitudes_ingreso').add(payload);

    // Si es crítica, crear alerta
    if (prioridad === 'critica') {
      await createCriticalCaseAlert(docRef.id, payload);
    }

    localStorage.removeItem('senda_draft');
    isDraftSaved = false;
    showSuccessMessage(docRef.id, formData.tipoSolicitud);
    resetForm();
    closeModal('patient-modal');

  } catch (err) {
    console.error('Error al enviar solicitud:', err);
    showNotification('Error al enviar la solicitud. Intenta nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}

// --- Mensajes de éxito y alertas críticas ---
function showSuccessMessage(id, tipoSolicitud) {
  const codigo = id.substring(0, 8).toUpperCase();
  if (tipoSolicitud === 'anonimo') {
    showNotification(`Solicitud enviada. Código: ${codigo}. Te contactaremos por teléfono.`, 'success', 7000);
  } else if (tipoSolicitud === 'informacion') {
    showNotification(`Solicitud enviada. Recibirás info por email. Código: ${codigo}`, 'success', 6000);
  } else {
    showNotification(`Solicitud enviada correctamente. Código: ${codigo}`, 'success', 6000);
  }
}

async function createCriticalCaseAlert(solicitudId, payload) {
  try {
    await db.collection('alertas_criticas').add({
      id_solicitud: solicitudId,
      tipo: 'caso_critico',
      prioridad: 'maxima',
      mensaje: `Caso crítico: Urgencia ${payload.evaluacion_inicial?.urgencia || 'no especificada'}`,
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente'
    });
  } catch (err) {
    console.error('Error creando alerta crítica', err);
  }
}

// --- Función simple de prioridad (puedes refinarla) ---
function calculatePriority(data) {
  let score = 0;
  if (!data) return 'baja';
  if (data.sustancias?.includes('pasta_base')) score += 3;
  if (data.sustancias?.includes('cocaina')) score += 2;
  if (parseInt(data.edad) < 18) score += 2;
  if (data.urgencia === 'critica') score += 4;
  if (data.urgencia === 'alta') score += 2;
  if ((parseInt(data.motivacion) || 0) >= 8) score += 1;
  if (score >= 6) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

// ==========================
//  INICIALIZAR ESTA PARTE
// ==========================
loadRegionsData();
loadCesfamData();
setupMultiStepForm();
loadDraftIfExists();
updateFormProgress();
// ==========================
//  PARTE 3: PANEL PROFESIONAL Y GESTIÓN DE CASOS
// ==========================

// --- Variables específicas para el panel profesional ---
let professionalCases = [];
let filteredCases = [];
let professionalsList = [];
let activeFilters = { cesfam: '', prioridad: '', estado: '' };

// ==========================
//  AUTENTICACIÓN PROFESIONALES
// ==========================

/**
 * Inicia sesión con email y password
 */
async function professionalLogin(e) {
  e.preventDefault();

  const email = $('login-email')?.value.trim();
  const password = $('login-password')?.value.trim();

  if (!email || !password) {
    showNotification('Ingresa email y contraseña', 'error');
    return;
  }

  showLoading(true);
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;

    // Obtener datos del profesional desde Firestore
    const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();
    currentUserData = userDoc.exists ? userDoc.data() : null;

    if (!currentUserData) {
      showNotification('Perfil profesional no encontrado', 'error');
      await auth.signOut();
      currentUser = null;
      return;
    }

    showNotification(`Bienvenido, ${currentUserData.nombre}`, 'success');
    closeModal('professional-modal');
    openProfessionalPanel();
    loadProfessionalCases();

  } catch (err) {
    console.error('Error login profesional:', err);
    showNotification('Error de autenticación: revisa tus credenciales', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Cerrar sesión profesional
 */
async function professionalLogout() {
  try {
    await auth.signOut();
    currentUser = null;
    currentUserData = null;
    professionalCases = [];
    filteredCases = [];
    closeProfessionalPanel();
    showNotification('Sesión cerrada correctamente', 'info');
  } catch (err) {
    console.error('Error al cerrar sesión', err);
  }
}

// ==========================
//  PANEL PROFESIONAL
// ==========================

function openProfessionalPanel() {
  $('professional-dashboard').style.display = 'block';
  document.body.classList.add('dashboard-active');
}

function closeProfessionalPanel() {
  $('professional-dashboard').style.display = 'none';
  document.body.classList.remove('dashboard-active');
}

/**
 * Cargar casos de Firestore
 */
async function loadProfessionalCases() {
  showLoading(true);
  try {
    const snapshot = await db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .get();

    professionalCases = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    filteredCases = [...professionalCases];
    renderCasesTable();
    updateDashboardStats();

  } catch (err) {
    console.error('Error cargando casos:', err);
    showNotification('No se pudieron cargar los casos', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Renderizar tabla de casos
 */
function renderCasesTable() {
  const tableBody = $('cases-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (filteredCases.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">No hay casos registrados</td></tr>`;
    return;
  }

  filteredCases.forEach(caso => {
    const fecha = formatDate(caso.metadata?.fecha_creacion);
    const prioridad = caso.clasificacion?.prioridad || 'N/A';
    const estado = caso.estado || 'pendiente';
    const cesfam = caso.datos_personales?.cesfam || 'No especificado';
    const nombre = caso.datos_personales?.nombre || 'Anonimo';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${nombre}</td>
      <td>${cesfam}</td>
      <td>${prioridad}</td>
      <td>${estado}</td>
      <td>
        <button class="btn-small" onclick="viewCaseDetail('${caso.id}')">
          <i class="fas fa-eye"></i> Ver
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/**
 * Actualizar estadísticas del panel
 */
function updateDashboardStats() {
  const total = professionalCases.length;
  const criticos = professionalCases.filter(c => c.clasificacion?.prioridad === 'critica').length;
  const pendientes = professionalCases.filter(c => c.estado === 'pendiente').length;
  const atendidos = professionalCases.filter(c => c.estado === 'atendido').length;

  $('stat-total').textContent = total;
  $('stat-criticos').textContent = criticos;
  $('stat-pendientes').textContent = pendientes;
  $('stat-atendidos').textContent = atendidos;
}

/**
 * Filtro de casos por prioridad, estado o CESFAM
 */
function filterCases() {
  const cesfamFilter = $('filter-cesfam')?.value || '';
  const prioridadFilter = $('filter-prioridad')?.value || '';
  const estadoFilter = $('filter-estado')?.value || '';

  activeFilters = { cesfam: cesfamFilter, prioridad: prioridadFilter, estado: estadoFilter };

  filteredCases = professionalCases.filter(caso => {
    if (cesfamFilter && caso.datos_personales?.cesfam !== cesfamFilter) return false;
    if (prioridadFilter && caso.clasificacion?.prioridad !== prioridadFilter) return false;
    if (estadoFilter && caso.estado !== estadoFilter) return false;
    return true;
  });

  renderCasesTable();
}

/**
 * Ver detalle de un caso
 */
function viewCaseDetail(caseId) {
  const caso = professionalCases.find(c => c.id === caseId);
  if (!caso) {
    showNotification('Caso no encontrado', 'error');
    return;
  }

  $('case-detail-modal').style.display = 'flex';

  $('case-detail-content').innerHTML = `
    <h3>Detalle Caso</h3>
    <p><strong>Fecha:</strong> ${formatDate(caso.metadata?.fecha_creacion)}</p>
    <p><strong>Nombre:</strong> ${caso.datos_personales?.nombre || 'Anónimo'}</p>
    <p><strong>Edad:</strong> ${caso.datos_personales?.edad || 'N/A'}</p>
    <p><strong>Comuna:</strong> ${caso.datos_personales?.comuna || 'N/A'}</p>
    <p><strong>CESFAM:</strong> ${caso.datos_personales?.cesfam || 'No especificado'}</p>
    <p><strong>Prioridad:</strong> ${caso.clasificacion?.prioridad || 'N/A'}</p>
    <p><strong>Estado:</strong> ${caso.estado || 'pendiente'}</p>
    <p><strong>Sustancias:</strong> ${(caso.evaluacion_inicial?.sustancias || []).join(', ') || 'N/A'}</p>
    <p><strong>Motivación:</strong> ${caso.evaluacion_inicial?.motivacion || 'N/A'}</p>
    <p><strong>Urgencia:</strong> ${caso.evaluacion_inicial?.urgencia || 'N/A'}</p>
    <p><strong>Descripción:</strong> ${caso.evaluacion_inicial?.descripcion || ''}</p>
    <div class="modal-actions">
      <button onclick="assignCase('${caso.id}')">Asignar</button>
      <button onclick="updateCaseStatus('${caso.id}', 'atendido')">Marcar como Atendido</button>
      <button onclick="closeModal('case-detail-modal')">Cerrar</button>
    </div>
  `;
}

/**
 * Asignar caso a profesional
 */
async function assignCase(caseId) {
  if (!currentUser) {
    showNotification('Debes iniciar sesión', 'error');
    return;
  }

  try {
    await db.collection('solicitudes_ingreso').doc(caseId).update({
      profesional_asignado: currentUser.uid,
      nombre_profesional: currentUserData.nombre,
      estado: 'asignado'
    });
    showNotification('Caso asignado correctamente', 'success');
    closeModal('case-detail-modal');
    loadProfessionalCases();
  } catch (err) {
    console.error('Error asignando caso', err);
    showNotification('Error al asignar el caso', 'error');
  }
}

/**
 * Actualizar estado de caso
 */
async function updateCaseStatus(caseId, newStatus) {
  try {
    await db.collection('solicitudes_ingreso').doc(caseId).update({
      estado: newStatus,
      fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    showNotification('Estado actualizado', 'success');
    closeModal('case-detail-modal');
    loadProfessionalCases();
  } catch (err) {
    console.error('Error actualizando estado', err);
    showNotification('Error al actualizar estado', 'error');
  }
}

// ==========================
//  AGENDA DE CITAS
// ==========================

/**
 * Cargar citas del profesional logueado
 */
async function loadProfessionalAppointments() {
  if (!currentUser) return;
  showLoading(true);

  try {
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', currentUser.uid)
      .orderBy('fecha', 'asc')
      .get();

    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderAppointments(appointments);
  } catch (err) {
    console.error('Error cargando citas:', err);
    showNotification('No se pudieron cargar las citas', 'error');
  } finally {
    showLoading(false);
  }
}

function renderAppointments(appointments) {
  const container = $('appointments-list');
  if (!container) return;

  container.innerHTML = '';

  if (appointments.length === 0) {
    container.innerHTML = '<p>No hay citas programadas</p>';
    return;
  }

  appointments.forEach(app => {
    const fecha = formatDate(app.fecha);
    const paciente = app.pacienteNombre || 'Paciente sin nombre';

    const div = document.createElement('div');
    div.className = 'appointment-card';
    div.innerHTML = `
      <p><strong>${fecha}</strong></p>
      <p>${paciente}</p>
      <p>Motivo: ${app.motivo || 'No especificado'}</p>
      <button onclick="markAppointmentCompleted('${app.id}')">Marcar como completada</button>
    `;
    container.appendChild(div);
  });
}

async function markAppointmentCompleted(appointmentId) {
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'completada',
      fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    showNotification('Cita marcada como completada', 'success');
    loadProfessionalAppointments();
  } catch (err) {
    console.error('Error completando cita', err);
    showNotification('No se pudo actualizar la cita', 'error');
  }
}

// ==========================
//  REPORTES Y ESTADÍSTICAS
// ==========================

async function loadCesfamStats() {
  try {
    const snapshot = await db.collection('solicitudes_ingreso').get();
    const data = {};

    snapshot.docs.forEach(doc => {
      const cesfam = doc.data().datos_personales?.cesfam || 'Sin asignar';
      if (!data[cesfam]) {
        data[cesfam] = { total: 0, criticos: 0 };
      }
      data[cesfam].total++;
      if (doc.data().clasificacion?.prioridad === 'critica') {
        data[cesfam].criticos++;
      }
    });

    renderCesfamStats(data);

  } catch (err) {
    console.error('Error cargando estadísticas CESFAM:', err);
    showNotification('No se pudieron cargar las estadísticas', 'error');
  }
}

function renderCesfamStats(data) {
  const container = $('cesfam-stats');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(data).forEach(cesfam => {
    const div = document.createElement('div');
    div.className = 'cesfam-stat-card';
    div.innerHTML = `
      <h4>${cesfam}</h4>
      <p>Total casos: ${data[cesfam].total}</p>
      <p>Casos críticos: ${data[cesfam].criticos}</p>
    `;
    container.appendChild(div);
  });
}

// ==========================
//  INICIALIZACIÓN PANEL PROFESIONAL
// ==========================
$('login-form')?.addEventListener('submit', professionalLogin);
$('logout-btn')?.addEventListener('click', professionalLogout);
$('filter-cesfam')?.addEventListener('change', filterCases);
$('filter-prioridad')?.addEventListener('change', filterCases);
$('filter-estado')?.addEventListener('change', filterCases);

// Cargar datos iniciales del panel
loadCesfamStats();
loadProfessionalAppointments();
// ==========================
//  PARTE 4: EXPORTACIÓN DE REPORTES (EXCEL Y PDF)
// ==========================

// --- Librerías necesarias ---
// Para Excel: SheetJS (xlsx.full.min.js)
// Para PDF: jsPDF + autotable
// Asegúrate de que estas librerías estén cargadas en tu index.html

/**
 * Exportar casos a Excel
 */
function exportCasesToExcel() {
  if (!filteredCases || filteredCases.length === 0) {
    showNotification('No hay casos para exportar', 'error');
    return;
  }

  const data = filteredCases.map(caso => ({
    Fecha: formatDate(caso.metadata?.fecha_creacion),
    Nombre: caso.datos_personales?.nombre || 'Anónimo',
    Edad: caso.datos_personales?.edad || 'N/A',
    Comuna: caso.datos_personales?.comuna || 'N/A',
    CESFAM: caso.datos_personales?.cesfam || 'No especificado',
    Prioridad: caso.clasificacion?.prioridad || 'N/A',
    Estado: caso.estado || 'pendiente',
    Sustancias: (caso.evaluacion_inicial?.sustancias || []).join(', '),
    Motivación: caso.evaluacion_inicial?.motivacion || '',
    Urgencia: caso.evaluacion_inicial?.urgencia || '',
    ProfesionalAsignado: caso.nombre_profesional || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Casos');
  XLSX.writeFile(wb, `Casos_SENDA_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exportar casos a PDF
 */
function exportCasesToPDF() {
  if (!filteredCases || filteredCases.length === 0) {
    showNotification('No hay casos para exportar', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const title = 'Reporte de Casos - SENDA';
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  const headers = [
    ['Fecha', 'Nombre', 'Comuna', 'CESFAM', 'Prioridad', 'Estado']
  ];

  const rows = filteredCases.map(caso => [
    formatDate(caso.metadata?.fecha_creacion),
    caso.datos_personales?.nombre || 'Anónimo',
    caso.datos_personales?.comuna || 'N/A',
    caso.datos_personales?.cesfam || 'No especificado',
    caso.clasificacion?.prioridad || 'N/A',
    caso.estado || 'pendiente'
  ]);

  doc.autoTable({
    head: headers,
    body: rows,
    startY: 25,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2
    }
  });

  doc.save(`Casos_SENDA_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Exportar estadísticas CESFAM a Excel
 */
function exportCesfamStatsToExcel() {
  const statsContainer = $('cesfam-stats');
  if (!statsContainer || statsContainer.children.length === 0) {
    showNotification('No hay estadísticas para exportar', 'error');
    return;
  }

  const data = [];
  statsContainer.querySelectorAll('.cesfam-stat-card').forEach(card => {
    const name = card.querySelector('h4')?.textContent || 'Desconocido';
    const total = card.querySelector('p:nth-of-type(1)')?.textContent.replace('Total casos: ', '') || '0';
    const criticos = card.querySelector('p:nth-of-type(2)')?.textContent.replace('Casos críticos: ', '') || '0';

    data.push({ CESFAM: name, Total: total, Criticos: criticos });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Estadisticas_CESFAM');
  XLSX.writeFile(wb, `Estadisticas_CESFAM_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exportar agenda de citas a PDF
 */
async function exportAppointmentsToPDF() {
  if (!currentUser) {
    showNotification('Debes iniciar sesión como profesional', 'error');
    return;
  }

  showLoading(true);

  try {
    const snapshot = await db.collection('citas')
      .where('profesionalId', '==', currentUser.uid)
      .orderBy('fecha', 'asc')
      .get();

    const appointments = snapshot.docs.map(doc => ({
      fecha: formatDate(doc.data().fecha),
      paciente: doc.data().pacienteNombre || 'Desconocido',
      motivo: doc.data().motivo || '',
      estado: doc.data().estado || 'pendiente'
    }));

    if (appointments.length === 0) {
      showNotification('No hay citas para exportar', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const title = `Agenda de Citas - ${currentUserData?.nombre || 'Profesional'}`;
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    const headers = [
      ['Fecha', 'Paciente', 'Motivo', 'Estado']
    ];

    const rows = appointments.map(app => [app.fecha, app.paciente, app.motivo, app.estado]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 25,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 2 }
    });

    doc.save(`Agenda_Citas_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Error exportando citas:', err);
    showNotification('Error al exportar la agenda', 'error');
  } finally {
    showLoading(false);
  }
}

// ==========================
//  BOTONES DE EXPORTACIÓN
// ==========================

// Botones para exportar casos
$('export-excel-btn')?.addEventListener('click', exportCasesToExcel);
$('export-pdf-btn')?.addEventListener('click', exportCasesToPDF);

// Botones para exportar estadísticas
$('export-cesfam-excel-btn')?.addEventListener('click', exportCesfamStatsToExcel);

// Botón para exportar agenda
$('export-agenda-pdf-btn')?.addEventListener('click', exportAppointmentsToPDF);


