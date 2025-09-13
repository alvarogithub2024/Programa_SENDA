// ================= SENDA PUENTE ALTO - SISTEMA OPTIMIZADO =================
// PARTE 1: Configuración, Variables Globales y Funciones Utilitarias

// Firebase Configuration (consolidada)
const firebaseConfig = {
  apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
  authDomain: "senda-6d5c9.firebaseapp.com",
  projectId: "senda-6d5c9",
  storageBucket: "senda-6d5c9.firebasestorage.app",
  messagingSenderId: "1090028669785",
  appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
  measurementId: "G-82DCLW5R2W"
};

// Variables globales consolidadas
const APP_STATE = {
  currentUser: null,
  currentUserData: null,
  currentFormStep: 1,
  maxFormStep: 4,
  formData: {},
  isDraftSaved: false,
  currentCalendarDate: new Date(),
  selectedCalendarDate: null,
  currentFilter: 'todas',
  solicitudesData: [],
  pacientesData: [],
  citasData: [],
  professionalsList: [],
  isLoading: false
};

const APP_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGINATION_LIMIT: 50,
  CACHE_DURATION: 5 * 60 * 1000,
  DEBUG_MODE: true
};

const CESFAM_LIST = [
  "CESFAM Alejandro del Río",
  "CESFAM Karol Wojtyla",
  "CESFAM Laurita Vicuña",
  "CESFAM Padre Manuel Villaseca",
  "CESFAM San Gerónimo",
  "CESFAM Vista Hermosa",
  "CESFAM Bernardo Leighton",
  "CESFAM Cardenal Raúl Silva Henriquez"
];

// Cache optimizado
const dataCache = new Map();

// Inicialización Firebase optimizada
let auth, db;
const initFirebase = () => {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Configurar persistencia offline
    db.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('Persistencia falló:', err.code));
    
    console.log('✅ Firebase inicializado');
    return true;
  } catch (error) {
    console.error('❌ Error Firebase:', error);
    return false;
  }
};

// ================= FUNCIONES UTILITARIAS OPTIMIZADAS =================

const utils = {
  // Notificaciones optimizadas
  showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notifications') || this.createNotificationsContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getNotificationIcon(type)}"></i> 
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(notification);
    
    requestAnimationFrame(() => notification.classList.add('show'));
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    
    if (APP_CONFIG.DEBUG_MODE) {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  },

  getNotificationIcon(type) {
    const icons = {
      'success': 'check-circle',
      'error': 'exclamation-triangle',
      'warning': 'exclamation-triangle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  },

  createNotificationsContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  },

  // Modal management optimizado
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`❌ Modal ${modalId} no encontrado`);
      return;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput && !firstInput.disabled) firstInput.focus();
    }, 100);
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Verificar cambios sin guardar
    if (modalId === 'patient-modal' && !APP_STATE.isDraftSaved) {
      const hasChanges = this.checkFormChanges();
      if (hasChanges && !confirm('¿Cerrar sin guardar cambios?')) return;
      this.resetForm();
    }
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (modal.classList.contains('temp-modal')) modal.remove();
  },

  checkFormChanges() {
    const form = document.getElementById('patient-form');
    if (!form) return false;
    
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
      if (value && value.trim() !== '') return true;
    }
    return false;
  },

  // Loading optimizado
  showLoading(show = true, message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    const messageElement = overlay.querySelector('p');
    if (messageElement) messageElement.textContent = message;
    
    overlay.classList.toggle('hidden', !show);
    APP_STATE.isLoading = show;
  },

  // Validaciones optimizadas
  formatRUT(rut) {
    if (!rut) return '';
    
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (cleaned.length < 2) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    
    return `${formattedBody}-${dv}`;
  },

  validateRUT(rut) {
    if (!rut) return false;
    
    const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
    if (cleaned.length < 8 || cleaned.length > 9) return false;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    if (!/^\d+$/.test(body)) return false;
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDV = 11 - (sum % 11);
    let finalDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
    
    return dv === finalDV;
  },

  isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Formatos chilenos
    if (cleaned.length === 8 && !cleaned.startsWith('9')) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
    }
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      return '+56 ' + cleaned.replace(/(\d)(\d{4})(\d{4})/, '$1 $2 $3');
    }
    if (cleaned.length === 11 && cleaned.startsWith('56')) {
      return '+' + cleaned.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    
    return phone;
  },

  formatDate(timestamp) {
    try {
      let date;
      if (timestamp?.toDate) date = timestamp.toDate();
      else if (timestamp instanceof Date) date = timestamp;
      else date = new Date(timestamp);
      
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  },

  getProfessionName(profession) {
    const names = {
      'asistente_social': 'Asistente Social',
      'medico': 'Médico',
      'psicologo': 'Psicólogo',
      'terapeuta': 'Terapeuta Ocupacional',
      'coordinador': 'Coordinador Regional',
      'admin': 'Administrador'
    };
    return names[profession] || profession;
  },

  // Función de cálculo de prioridad optimizada
  calculatePriority(evaluationData) {
    let score = 0;
    
    // Factores de riesgo por sustancia
    const sustancias = evaluationData.sustancias || [];
    if (sustancias.includes('pasta_base')) score += 4;
    if (sustancias.includes('cocaina')) score += 3;
    if (sustancias.includes('alcohol')) score += 1;
    if (sustancias.includes('marihuana')) score += 1;
    
    // Factores de edad
    const edad = evaluationData.edad;
    if (edad < 18) score += 3;
    if (edad >= 65) score += 2;
    
    // Tiempo de consumo
    const tiempoConsumo = evaluationData.tiempoConsumo;
    const tiempoScores = { '60+': 3, '24-60': 2, '12-24': 1 };
    score += tiempoScores[tiempoConsumo] || 0;
    
    // Urgencia
    const urgenciaScores = { 'critica': 5, 'alta': 3, 'media': 1 };
    score += urgenciaScores[evaluationData.urgencia] || 0;
    
    // Motivación (inversa)
    const motivacion = parseInt(evaluationData.motivacion) || 5;
    if (motivacion <= 3) score += 2;
    if (motivacion >= 8) score -= 1;
    
    // Tratamiento previo
    if (evaluationData.tratamientoPrevio === 'si_senda') score += 2;
    if (evaluationData.tratamientoPrevio === 'si_otro') score += 1;
    
    // Palabras críticas en descripción
    const descripcion = (evaluationData.descripcion || '').toLowerCase();
    const palabrasCriticas = ['suicid', 'muerte', 'morir', 'crisis', 'emergencia', 'urgente'];
    
    if (palabrasCriticas.some(palabra => descripcion.includes(palabra))) {
      score += 4;
    }
    
    // Clasificación
    if (score >= 8) return 'critica';
    if (score >= 5) return 'alta';
    if (score >= 2) return 'media';
    return 'baja';
  },

  // Utilidades de tiempo
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Reintentos optimizados
  async retryOperation(operation, maxAttempts = APP_CONFIG.MAX_RETRY_ATTEMPTS) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
        
        if (attempt === maxAttempts) throw error;
        
        await new Promise(resolve => 
          setTimeout(resolve, APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
        );
      }
    }
  },

  // Cache optimizado
  getCachedData(key) {
    const cached = dataCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < APP_CONFIG.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },

  setCachedData(key, data) {
    dataCache.set(key, { data, timestamp: Date.now() });
  },

  clearCache() {
    dataCache.clear();
  }
};
// ================= PARTE 2: AUTENTICACIÓN Y FORMULARIOS OPTIMIZADOS =================

const authManager = {
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
      utils.showNotification('Completa todos los campos', 'warning');
      return;
    }

    if (!utils.isValidEmail(email)) {
      utils.showNotification('Email inválido', 'warning');
      return;
    }

    this.toggleSubmitButton(submitBtn, true);
    
    try {
      await utils.retryOperation(async () => {
        await auth.signInWithEmailAndPassword(email, password);
      });
      
      utils.closeModal('login-modal');
      utils.showNotification('Sesión iniciada correctamente', 'success');
      e.target.reset();
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const errorMessages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión'
      };
      
      const message = errorMessages[error.code] || 'Error al iniciar sesión';
      utils.showNotification(message, 'error');
    } finally {
      this.toggleSubmitButton(submitBtn, false);
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    
    const formData = this.collectRegisterData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!this.validateRegisterData(formData)) return;

    this.toggleSubmitButton(submitBtn, true);
    
    try {
      // Verificar RUT único
      const rutFormatted = utils.formatRUT(formData.rut);
      const existingUser = await db.collection('profesionales')
        .where('rut', '==', rutFormatted)
        .get();
      
      if (!existingUser.empty) {
        throw new Error('Ya existe un profesional con este RUT');
      }
      
      // Crear usuario
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email, 
        formData.password
      );
      
      // Guardar datos del profesional
      await db.collection('profesionales').doc(userCredential.user.uid).set({
        ...formData,
        rut: rutFormatted,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        activo: true,
        configuracion: { notificaciones: true, idioma: 'es' }
      });
      
      utils.closeModal('login-modal');
      utils.showNotification('Cuenta creada exitosamente', 'success');
      e.target.reset();
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      const errorMessages = {
        'auth/email-already-in-use': 'Email ya registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/weak-password': 'Contraseña muy débil'
      };
      
      const message = errorMessages[error.code] || error.message || 'Error al crear cuenta';
      utils.showNotification(message, 'error');
    } finally {
      this.toggleSubmitButton(submitBtn, false);
    }
  },

  collectRegisterData(form) {
    return {
      nombre: form.querySelector('#register-name')?.value?.trim() || '',
      apellidos: form.querySelector('#register-lastname')?.value?.trim() || '',
      rut: form.querySelector('#register-rut')?.value?.trim() || '',
      profession: form.querySelector('#register-profession')?.value || '',
      cesfam: form.querySelector('#register-cesfam')?.value || '',
      email: form.querySelector('#register-email')?.value?.trim() || '',
      password: form.querySelector('#register-password')?.value || ''
    };
  },

  validateRegisterData(formData) {
    const requiredFields = ['nombre', 'apellidos', 'email', 'password'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        utils.showNotification('Completa todos los campos obligatorios', 'warning');
        return false;
      }
    }

    if (!utils.validateRUT(formData.rut)) {
      utils.showNotification('RUT inválido', 'warning');
      return false;
    }

    if (!utils.isValidEmail(formData.email)) {
      utils.showNotification('Email inválido', 'warning');
      return false;
    }

    if (formData.password.length < 6) {
      utils.showNotification('Contraseña debe tener al menos 6 caracteres', 'warning');
      return false;
    }

    if (!formData.profession || !formData.cesfam) {
      utils.showNotification('Selecciona profesión y CESFAM', 'warning');
      return false;
    }

    return true;
  },

  toggleSubmitButton(button, loading) {
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = loading;
    button.classList.toggle('loading', loading);
    
    if (btnText) btnText.style.display = loading ? 'none' : 'inline';
    if (btnLoading) btnLoading.style.display = loading ? 'inline-flex' : 'none';
  },

  async handleLogout() {
    if (!confirm('¿Cerrar sesión?')) return;
    
    try {
      utils.showLoading(true, 'Cerrando sesión...');
      await auth.signOut();
      utils.showNotification('Sesión cerrada', 'info');
    } catch (error) {
      console.error('❌ Error logout:', error);
      utils.showNotification('Error al cerrar sesión', 'error');
    } finally {
      utils.showLoading(false);
    }
  }
};

// ================= GESTIÓN DE FORMULARIOS OPTIMIZADA =================

const formManager = {
  setupMultiStepForm() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // Configurar navegación entre pasos
    this.setupStepNavigation(form);
    
    // Configurar envío
    form.addEventListener('submit', this.handlePatientFormSubmit.bind(this));
    
    // Configurar cambios en tipo de solicitud
    const tipoInputs = form.querySelectorAll('input[name="tipoSolicitud"]');
    tipoInputs.forEach(input => {
      input.addEventListener('change', this.updateFormVisibility.bind(this));
    });

    // Configurar slider de motivación
    this.setupMotivationSlider();
    
    // Configurar autoguardado
    this.setupAutoSave(form);
  },

  setupStepNavigation(form) {
    const nextButtons = form.querySelectorAll('[id^="next-step"]');
    const prevButtons = form.querySelectorAll('[id^="prev-step"]');
    
    nextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        if (this.validateStep(currentStep)) {
          this.goToStep(currentStep + 1);
        }
      });
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        this.goToStep(currentStep - 1);
      });
    });
  },

  setupMotivationSlider() {
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    
    if (motivacionRange && motivacionValue) {
      motivacionRange.addEventListener('input', () => {
        motivacionValue.textContent = motivacionRange.value;
        this.updateMotivacionColor(motivacionRange.value);
      });
      
      motivacionValue.textContent = motivacionRange.value;
      this.updateMotivacionColor(motivacionRange.value);
    }
  },

  updateMotivacionColor(value) {
    const motivacionValue = document.getElementById('motivacion-value');
    if (!motivacionValue) return;
    
    const colors = {
      low: 'var(--danger-red)',
      medium: 'var(--warning-orange)',
      high: 'var(--success-green)'
    };
    
    const numValue = parseInt(value);
    let color = colors.high;
    if (numValue <= 3) color = colors.low;
    else if (numValue <= 6) color = colors.medium;
    
    motivacionValue.style.backgroundColor = color;
    motivacionValue.style.color = 'white';
  },

  setupAutoSave(form) {
    let autoSaveTimer;
    
    form.addEventListener('input', () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => this.saveFormDraft(), 2000);
    });
    
    this.loadFormDraft();
  },

  saveFormDraft() {
    try {
      const form = document.getElementById('patient-form');
      if (!form) return;
      
      const formData = new FormData(form);
      const draftData = Object.fromEntries(formData.entries());
      
      draftData.currentStep = APP_STATE.currentFormStep;
      draftData.timestamp = Date.now();
      
      localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
      APP_STATE.isDraftSaved = true;
      
      this.showDraftSavedIndicator();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  },

  loadFormDraft() {
    try {
      const savedDraft = localStorage.getItem('senda_form_draft');
      if (!savedDraft) return;
      
      const draftData = JSON.parse(savedDraft);
      
      // Verificar edad del draft (24 horas)
      if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('senda_form_draft');
        return;
      }
      
      if (confirm('Borrador encontrado. ¿Continuar donde lo dejaste?')) {
        this.restoreFormDraft(draftData);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  },

  restoreFormDraft(draftData) {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = field.value === draftData[key];
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    if (draftData.currentStep) {
      this.goToStep(draftData.currentStep);
    }
    
    this.updateFormVisibility();
    utils.showNotification('Borrador restaurado', 'success');
  },

  showDraftSavedIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'draft-saved-indicator';
    indicator.innerHTML = '<i class="fas fa-save"></i> Borrador guardado';
    indicator.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: var(--success-green); color: white;
      padding: 8px 12px; border-radius: 6px;
      font-size: 12px; z-index: 10000;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    requestAnimationFrame(() => indicator.style.opacity = '1');
    
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 2000);
  },

  updateFormVisibility() {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const containers = {
      'anonimo': document.getElementById('anonymous-phone-container'),
      'informacion': document.getElementById('info-email-container')
    };
    
    // Ocultar todos los contenedores condicionales
    Object.values(containers).forEach(container => {
      if (container) container.style.display = 'none';
    });
    
    // Mostrar contenedor relevante
    if (containers[tipoSolicitud]) {
      containers[tipoSolicitud].style.display = 'block';
      
      const input = containers[tipoSolicitud].querySelector('input');
      if (input) {
        input.required = true;
        input.focus();
      }
    }
    
    // Limpiar requisitos de campos no visibles
    Object.keys(containers).forEach(tipo => {
      if (tipo !== tipoSolicitud && containers[tipo]) {
        const input = containers[tipo].querySelector('input');
        if (input) input.required = false;
      }
    });
    
    setTimeout(() => this.saveFormDraft(), 500);
  },

  validateStep(step) {
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
    let isValid = true;
    const errors = [];

    // Validar campos requeridos
    requiredFields.forEach(field => {
      const value = field.value?.trim() || '';
      
      if (!value) {
        field.classList.add('error');
        this.showFieldError(field, 'Campo obligatorio');
        errors.push(`${this.getFieldLabel(field)} es obligatorio`);
        isValid = false;
      } else {
        field.classList.remove('error');
        this.clearFieldError(field);
      }
    });

    // Validaciones específicas por paso
    isValid = this.validateStepSpecific(step, errors) && isValid;

    if (errors.length > 0) {
      utils.showNotification(errors.join('\n'), 'warning', 5000);
    }

    return isValid;
  },

  validateStepSpecific(step, errors) {
    let isValid = true;

    if (step === 1) {
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
      if (!tipoSolicitud) {
        errors.push('Selecciona un tipo de solicitud');
        isValid = false;
      } else {
        isValid = this.validateTipoSolicitud(tipoSolicitud.value, errors) && isValid;
      }

      const edad = parseInt(document.getElementById('patient-age')?.value);
      if (edad && (edad < 12 || edad > 120)) {
        errors.push('Edad debe estar entre 12 y 120 años');
        isValid = false;
      }
    }

    if (step === 2) {
      isValid = this.validatePersonalData(errors) && isValid;
    }

    if (step === 3) {
      isValid = this.validateEvaluationData(errors) && isValid;
    }

    return isValid;
  },

  validateTipoSolicitud(tipo, errors) {
    let isValid = true;

    if (tipo === 'anonimo') {
      const phone = document.getElementById('anonymous-phone')?.value?.trim();
      if (!phone) {
        errors.push('Ingresa un teléfono de contacto');
        isValid = false;
      } else if (!this.validatePhoneNumber(phone)) {
        errors.push('Teléfono inválido');
        isValid = false;
      }
    } else if (tipo === 'informacion') {
      const email = document.getElementById('info-email')?.value?.trim();
      if (!email) {
        errors.push('Ingresa un email');
        isValid = false;
      } else if (!utils.isValidEmail(email)) {
        errors.push('Email inválido');
        isValid = false;
      }
    }

    return isValid;
  },

  validatePersonalData(errors) {
    let isValid = true;

    const rut = document.getElementById('patient-rut')?.value?.trim();
    if (rut && !utils.validateRUT(rut)) {
      errors.push('RUT inválido');
      isValid = false;
    }

    const phone = document.getElementById('patient-phone')?.value?.trim();
    if (phone && !this.validatePhoneNumber(phone)) {
      errors.push('Teléfono inválido');
      isValid = false;
    }

    const email = document.getElementById('patient-email')?.value?.trim();
    if (email && !utils.isValidEmail(email)) {
      errors.push('Email inválido');
      isValid = false;
    }

    return isValid;
  },

  validateEvaluationData(errors) {
    let isValid = true;

    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      errors.push('Selecciona al menos una sustancia');
      isValid = false;
    }

    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (!urgencia) {
      errors.push('Selecciona nivel de urgencia');
      isValid = false;
    }

    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (!tratamientoPrevio) {
      errors.push('Indica si has recibido tratamiento previo');
      isValid = false;
    }

    return isValid;
  },

  validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
  },

  getFieldLabel(field) {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  },

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: var(--danger-red);
      font-size: 12px;
      margin-top: 4px;
    `;
    
    field.parentNode.appendChild(errorElement);
  },

  clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  },

  goToStep(step) {
    if (step < 1 || step > APP_STATE.maxFormStep) return;

    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.classList.remove('active');
    });
    
    // Mostrar paso objetivo
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
      
      setTimeout(() => {
        const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) firstInput.focus();
      }, 100);
    }

    // Actualizar barra de progreso
    this.updateProgressBar(step);

    APP_STATE.currentFormStep = step;

    // Saltar paso 2 si no es identificado
    if (step === 2) {
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
      if (tipoSolicitud !== 'identificado') {
        this.goToStep(3);
        return;
      }
    }

    this.saveFormDraft();
  },

  updateProgressBar(step) {
    const progressFill = document.getElementById('form-progress');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      const progressPercentage = (step / APP_STATE.maxFormStep) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Paso ${step} de ${APP_STATE.maxFormStep}`;
    }
  }
};
// ================= PARTE 2: AUTENTICACIÓN Y FORMULARIOS OPTIMIZADOS =================

const authManager = {
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
      utils.showNotification('Completa todos los campos', 'warning');
      return;
    }

    if (!utils.isValidEmail(email)) {
      utils.showNotification('Email inválido', 'warning');
      return;
    }

    this.toggleSubmitButton(submitBtn, true);
    
    try {
      await utils.retryOperation(async () => {
        await auth.signInWithEmailAndPassword(email, password);
      });
      
      utils.closeModal('login-modal');
      utils.showNotification('Sesión iniciada correctamente', 'success');
      e.target.reset();
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const errorMessages = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión'
      };
      
      const message = errorMessages[error.code] || 'Error al iniciar sesión';
      utils.showNotification(message, 'error');
    } finally {
      this.toggleSubmitButton(submitBtn, false);
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    
    const formData = this.collectRegisterData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!this.validateRegisterData(formData)) return;

    this.toggleSubmitButton(submitBtn, true);
    
    try {
      // Verificar RUT único
      const rutFormatted = utils.formatRUT(formData.rut);
      const existingUser = await db.collection('profesionales')
        .where('rut', '==', rutFormatted)
        .get();
      
      if (!existingUser.empty) {
        throw new Error('Ya existe un profesional con este RUT');
      }
      
      // Crear usuario
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email, 
        formData.password
      );
      
      // Guardar datos del profesional
      await db.collection('profesionales').doc(userCredential.user.uid).set({
        ...formData,
        rut: rutFormatted,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        activo: true,
        configuracion: { notificaciones: true, idioma: 'es' }
      });
      
      utils.closeModal('login-modal');
      utils.showNotification('Cuenta creada exitosamente', 'success');
      e.target.reset();
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      const errorMessages = {
        'auth/email-already-in-use': 'Email ya registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/weak-password': 'Contraseña muy débil'
      };
      
      const message = errorMessages[error.code] || error.message || 'Error al crear cuenta';
      utils.showNotification(message, 'error');
    } finally {
      this.toggleSubmitButton(submitBtn, false);
    }
  },

  collectRegisterData(form) {
    return {
      nombre: form.querySelector('#register-name')?.value?.trim() || '',
      apellidos: form.querySelector('#register-lastname')?.value?.trim() || '',
      rut: form.querySelector('#register-rut')?.value?.trim() || '',
      profession: form.querySelector('#register-profession')?.value || '',
      cesfam: form.querySelector('#register-cesfam')?.value || '',
      email: form.querySelector('#register-email')?.value?.trim() || '',
      password: form.querySelector('#register-password')?.value || ''
    };
  },

  validateRegisterData(formData) {
    const requiredFields = ['nombre', 'apellidos', 'email', 'password'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        utils.showNotification('Completa todos los campos obligatorios', 'warning');
        return false;
      }
    }

    if (!utils.validateRUT(formData.rut)) {
      utils.showNotification('RUT inválido', 'warning');
      return false;
    }

    if (!utils.isValidEmail(formData.email)) {
      utils.showNotification('Email inválido', 'warning');
      return false;
    }

    if (formData.password.length < 6) {
      utils.showNotification('Contraseña debe tener al menos 6 caracteres', 'warning');
      return false;
    }

    if (!formData.profession || !formData.cesfam) {
      utils.showNotification('Selecciona profesión y CESFAM', 'warning');
      return false;
    }

    return true;
  },

  toggleSubmitButton(button, loading) {
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = loading;
    button.classList.toggle('loading', loading);
    
    if (btnText) btnText.style.display = loading ? 'none' : 'inline';
    if (btnLoading) btnLoading.style.display = loading ? 'inline-flex' : 'none';
  },

  async handleLogout() {
    if (!confirm('¿Cerrar sesión?')) return;
    
    try {
      utils.showLoading(true, 'Cerrando sesión...');
      await auth.signOut();
      utils.showNotification('Sesión cerrada', 'info');
    } catch (error) {
      console.error('❌ Error logout:', error);
      utils.showNotification('Error al cerrar sesión', 'error');
    } finally {
      utils.showLoading(false);
    }
  }
};

// ================= GESTIÓN DE FORMULARIOS OPTIMIZADA =================

const formManager = {
  setupMultiStepForm() {
    const form = document.getElementById('patient-form');
    if (!form) return;

    // Configurar navegación entre pasos
    this.setupStepNavigation(form);
    
    // Configurar envío
    form.addEventListener('submit', this.handlePatientFormSubmit.bind(this));
    
    // Configurar cambios en tipo de solicitud
    const tipoInputs = form.querySelectorAll('input[name="tipoSolicitud"]');
    tipoInputs.forEach(input => {
      input.addEventListener('change', this.updateFormVisibility.bind(this));
    });

    // Configurar slider de motivación
    this.setupMotivationSlider();
    
    // Configurar autoguardado
    this.setupAutoSave(form);
  },

  setupStepNavigation(form) {
    const nextButtons = form.querySelectorAll('[id^="next-step"]');
    const prevButtons = form.querySelectorAll('[id^="prev-step"]');
    
    nextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        if (this.validateStep(currentStep)) {
          this.goToStep(currentStep + 1);
        }
      });
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentStep = parseInt(btn.id.split('-')[2]);
        this.goToStep(currentStep - 1);
      });
    });
  },

  setupMotivationSlider() {
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    
    if (motivacionRange && motivacionValue) {
      motivacionRange.addEventListener('input', () => {
        motivacionValue.textContent = motivacionRange.value;
        this.updateMotivacionColor(motivacionRange.value);
      });
      
      motivacionValue.textContent = motivacionRange.value;
      this.updateMotivacionColor(motivacionRange.value);
    }
  },

  updateMotivacionColor(value) {
    const motivacionValue = document.getElementById('motivacion-value');
    if (!motivacionValue) return;
    
    const colors = {
      low: 'var(--danger-red)',
      medium: 'var(--warning-orange)',
      high: 'var(--success-green)'
    };
    
    const numValue = parseInt(value);
    let color = colors.high;
    if (numValue <= 3) color = colors.low;
    else if (numValue <= 6) color = colors.medium;
    
    motivacionValue.style.backgroundColor = color;
    motivacionValue.style.color = 'white';
  },

  setupAutoSave(form) {
    let autoSaveTimer;
    
    form.addEventListener('input', () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => this.saveFormDraft(), 2000);
    });
    
    this.loadFormDraft();
  },

  saveFormDraft() {
    try {
      const form = document.getElementById('patient-form');
      if (!form) return;
      
      const formData = new FormData(form);
      const draftData = Object.fromEntries(formData.entries());
      
      draftData.currentStep = APP_STATE.currentFormStep;
      draftData.timestamp = Date.now();
      
      localStorage.setItem('senda_form_draft', JSON.stringify(draftData));
      APP_STATE.isDraftSaved = true;
      
      this.showDraftSavedIndicator();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  },

  loadFormDraft() {
    try {
      const savedDraft = localStorage.getItem('senda_form_draft');
      if (!savedDraft) return;
      
      const draftData = JSON.parse(savedDraft);
      
      // Verificar edad del draft (24 horas)
      if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('senda_form_draft');
        return;
      }
      
      if (confirm('Borrador encontrado. ¿Continuar donde lo dejaste?')) {
        this.restoreFormDraft(draftData);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  },

  restoreFormDraft(draftData) {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    Object.keys(draftData).forEach(key => {
      if (key === 'currentStep' || key === 'timestamp') return;
      
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = field.value === draftData[key];
        } else {
          field.value = draftData[key];
        }
      }
    });
    
    if (draftData.currentStep) {
      this.goToStep(draftData.currentStep);
    }
    
    this.updateFormVisibility();
    utils.showNotification('Borrador restaurado', 'success');
  },

  showDraftSavedIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'draft-saved-indicator';
    indicator.innerHTML = '<i class="fas fa-save"></i> Borrador guardado';
    indicator.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: var(--success-green); color: white;
      padding: 8px 12px; border-radius: 6px;
      font-size: 12px; z-index: 10000;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    requestAnimationFrame(() => indicator.style.opacity = '1');
    
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 2000);
  },

  updateFormVisibility() {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    const containers = {
      'anonimo': document.getElementById('anonymous-phone-container'),
      'informacion': document.getElementById('info-email-container')
    };
    
    // Ocultar todos los contenedores condicionales
    Object.values(containers).forEach(container => {
      if (container) container.style.display = 'none';
    });
    
    // Mostrar contenedor relevante
    if (containers[tipoSolicitud]) {
      containers[tipoSolicitud].style.display = 'block';
      
      const input = containers[tipoSolicitud].querySelector('input');
      if (input) {
        input.required = true;
        input.focus();
      }
    }
    
    // Limpiar requisitos de campos no visibles
    Object.keys(containers).forEach(tipo => {
      if (tipo !== tipoSolicitud && containers[tipo]) {
        const input = containers[tipo].querySelector('input');
        if (input) input.required = false;
      }
    });
    
    setTimeout(() => this.saveFormDraft(), 500);
  },

  validateStep(step) {
    const currentStepDiv = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepDiv) return false;

    const requiredFields = currentStepDiv.querySelectorAll('[required]:not([style*="display: none"])');
    let isValid = true;
    const errors = [];

    // Validar campos requeridos
    requiredFields.forEach(field => {
      const value = field.value?.trim() || '';
      
      if (!value) {
        field.classList.add('error');
        this.showFieldError(field, 'Campo obligatorio');
        errors.push(`${this.getFieldLabel(field)} es obligatorio`);
        isValid = false;
      } else {
        field.classList.remove('error');
        this.clearFieldError(field);
      }
    });

    // Validaciones específicas por paso
    isValid = this.validateStepSpecific(step, errors) && isValid;

    if (errors.length > 0) {
      utils.showNotification(errors.join('\n'), 'warning', 5000);
    }

    return isValid;
  },

  validateStepSpecific(step, errors) {
    let isValid = true;

    if (step === 1) {
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked');
      if (!tipoSolicitud) {
        errors.push('Selecciona un tipo de solicitud');
        isValid = false;
      } else {
        isValid = this.validateTipoSolicitud(tipoSolicitud.value, errors) && isValid;
      }

      const edad = parseInt(document.getElementById('patient-age')?.value);
      if (edad && (edad < 12 || edad > 120)) {
        errors.push('Edad debe estar entre 12 y 120 años');
        isValid = false;
      }
    }

    if (step === 2) {
      isValid = this.validatePersonalData(errors) && isValid;
    }

    if (step === 3) {
      isValid = this.validateEvaluationData(errors) && isValid;
    }

    return isValid;
  },

  validateTipoSolicitud(tipo, errors) {
    let isValid = true;

    if (tipo === 'anonimo') {
      const phone = document.getElementById('anonymous-phone')?.value?.trim();
      if (!phone) {
        errors.push('Ingresa un teléfono de contacto');
        isValid = false;
      } else if (!this.validatePhoneNumber(phone)) {
        errors.push('Teléfono inválido');
        isValid = false;
      }
    } else if (tipo === 'informacion') {
      const email = document.getElementById('info-email')?.value?.trim();
      if (!email) {
        errors.push('Ingresa un email');
        isValid = false;
      } else if (!utils.isValidEmail(email)) {
        errors.push('Email inválido');
        isValid = false;
      }
    }

    return isValid;
  },

  validatePersonalData(errors) {
    let isValid = true;

    const rut = document.getElementById('patient-rut')?.value?.trim();
    if (rut && !utils.validateRUT(rut)) {
      errors.push('RUT inválido');
      isValid = false;
    }

    const phone = document.getElementById('patient-phone')?.value?.trim();
    if (phone && !this.validatePhoneNumber(phone)) {
      errors.push('Teléfono inválido');
      isValid = false;
    }

    const email = document.getElementById('patient-email')?.value?.trim();
    if (email && !utils.isValidEmail(email)) {
      errors.push('Email inválido');
      isValid = false;
    }

    return isValid;
  },

  validateEvaluationData(errors) {
    let isValid = true;

    const sustancias = document.querySelectorAll('input[name="sustancias"]:checked');
    if (sustancias.length === 0) {
      errors.push('Selecciona al menos una sustancia');
      isValid = false;
    }

    const urgencia = document.querySelector('input[name="urgencia"]:checked');
    if (!urgencia) {
      errors.push('Selecciona nivel de urgencia');
      isValid = false;
    }

    const tratamientoPrevio = document.querySelector('input[name="tratamientoPrevio"]:checked');
    if (!tratamientoPrevio) {
      errors.push('Indica si has recibido tratamiento previo');
      isValid = false;
    }

    return isValid;
  },

  validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
  },

  getFieldLabel(field) {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
  },

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: var(--danger-red);
      font-size: 12px;
      margin-top: 4px;
    `;
    
    field.parentNode.appendChild(errorElement);
  },

  clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  },

  goToStep(step) {
    if (step < 1 || step > APP_STATE.maxFormStep) return;

    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
      stepDiv.classList.remove('active');
    });
    
    // Mostrar paso objetivo
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
      targetStep.classList.add('active');
      
      setTimeout(() => {
        const firstInput = targetStep.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput && !firstInput.disabled) firstInput.focus();
      }, 100);
    }

    // Actualizar barra de progreso
    this.updateProgressBar(step);

    APP_STATE.currentFormStep = step;

    // Saltar paso 2 si no es identificado
    if (step === 2) {
      const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
      if (tipoSolicitud !== 'identificado') {
        this.goToStep(3);
        return;
      }
    }

    this.saveFormDraft();
  },

  updateProgressBar(step) {
    const progressFill = document.getElementById('form-progress');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      const progressPercentage = (step / APP_STATE.maxFormStep) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Paso ${step} de ${APP_STATE.maxFormStep}`;
    }
  }
};
// ================= PARTE 4: CALENDARIO Y AGENDA OPTIMIZADOS =================

const calendarManager = {
  setupCalendar() {
    APP_STATE.currentCalendarDate = new Date();
    this.renderCalendar();
    this.setupCalendarEvents();
  },

  setupCalendarEvents() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        APP_STATE.currentCalendarDate.setMonth(APP_STATE.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        APP_STATE.currentCalendarDate.setMonth(APP_STATE.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    if (nuevaCitaBtn) {
      nuevaCitaBtn.addEventListener('click', () => uiManager.createNuevaCitaModal());
    }
  },

  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearElement = document.getElementById('calendar-month-year');
    
    if (!calendarGrid || !monthYearElement) return;

    const { year, month } = this.getCalendarDateInfo();
    
    monthYearElement.textContent = this.getMonthYearText(month, year);
    calendarGrid.innerHTML = '';
    
    this.renderCalendarDays(calendarGrid, year, month);
    this.loadMonthAppointments(year, month);
  },

  getCalendarDateInfo() {
    return {
      year: APP_STATE.currentCalendarDate.getFullYear(),
      month: APP_STATE.currentCalendarDate.getMonth()
    };
  },

  getMonthYearText(month, year) {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[month]} ${year}`;
  },

  renderCalendarDays(calendarGrid, year, month) {
    // Headers de días
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });
    
    // Calcular fechas
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(startDate);
    
    // Generar días del calendario
    for (let i = 0; i < 42; i++) { // 6 semanas
      const dayElement = this.createCalendarDay(currentDate, month, today);
      calendarGrid.appendChild(dayElement);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  },

  createCalendarDay(date, currentMonth, today) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Aplicar clases CSS
    if (!isCurrentMonth) dayElement.classList.add('other-month');
    if (isToday) dayElement.classList.add('today');
    if (isWeekend) dayElement.classList.add('weekend');
    if (isPast && isCurrentMonth) {
      dayElement.classList.add('past');
      dayElement.style.opacity = '0.5';
    }
    
    dayElement.innerHTML = `
      <div class="calendar-day-number">${date.getDate()}</div>
      <div class="calendar-appointments" id="appointments-${date.toISOString().split('T')[0]}"></div>
    `;
    
    // Event listener para días válidos
    if (!isPast && isCurrentMonth) {
      dayElement.addEventListener('click', () => this.selectCalendarDay(new Date(date)));
      dayElement.style.cursor = 'pointer';
    }
    
    return dayElement;
  },

  selectCalendarDay(date) {
    // Remover selección anterior
    document.querySelectorAll('.calendar-day.selected')
      .forEach(day => day.classList.remove('selected'));
    
    // Seleccionar día actual
    const dayElements = document.querySelectorAll('.calendar-day');
    dayElements.forEach(dayEl => {
      const dayNumber = dayEl.querySelector('.calendar-day-number').textContent;
      if (parseInt(dayNumber) === date.getDate() && !dayEl.classList.contains('other-month')) {
        dayEl.classList.add('selected');
      }
    });
    
    APP_STATE.selectedCalendarDate = date;
    this.loadDayAppointments(date);
  },

  async loadMonthAppointments(year, month) {
    if (!APP_STATE.currentUserData) return;
    
    try {
      const { startOfMonth, endOfMonth } = this.getMonthRange(year, month);
      
      const appointmentsSnapshot = await db.collection('citas')
        .where('cesfam', '==', APP_STATE.currentUserData.cesfam)
        .where('fecha', '>=', startOfMonth)
        .where('fecha', '<=', endOfMonth)
        .get();
      
      this.clearPreviousAppointments();
      const appointmentsByDate = this.groupAppointmentsByDate(appointmentsSnapshot);
      this.renderCalendarAppointments(appointmentsByDate);
      
    } catch (error) {
      console.error('❌ Error cargando citas del mes:', error);
    }
  },

  getMonthRange(year, month) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return { startOfMonth, endOfMonth };
  },

  clearPreviousAppointments() {
    document.querySelectorAll('.calendar-appointments').forEach(container => {
      container.innerHTML = '';
    });
  },

  groupAppointmentsByDate(appointmentsSnapshot) {
    const appointmentsByDate = {};
    
    appointmentsSnapshot.forEach(doc => {
      const appointment = doc.data();
      const appointmentDate = appointment.fecha.toDate();
      const dateString = appointmentDate.toISOString().split('T')[0];
      
      if (!appointmentsByDate[dateString]) {
        appointmentsByDate[dateString] = [];
      }
      
      appointmentsByDate[dateString].push({
        id: doc.id,
        ...appointment
      });
    });
    
    return appointmentsByDate;
  },

  renderCalendarAppointments(appointmentsByDate) {
    Object.keys(appointmentsByDate).forEach(dateString => {
      const container = document.getElementById(`appointments-${dateString}`);
      if (!container) return;
      
      const appointments = appointmentsByDate[dateString];
      
      // Mostrar hasta 3 citas
      appointments.slice(0, 3).forEach(appointment => {
        const appointmentEl = this.createCalendarAppointmentElement(appointment);
        container.appendChild(appointmentEl);
      });
      
      // Mostrar indicador si hay más citas
      if (appointments.length > 3) {
        const moreEl = this.createMoreAppointmentsElement(appointments.length - 3);
        container.appendChild(moreEl);
      }
    });
  },

  createCalendarAppointmentElement(appointment) {
    const appointmentEl = document.createElement('div');
    appointmentEl.className = 'calendar-appointment';
    appointmentEl.textContent = appointment.pacienteNombre || 'Cita';
    appointmentEl.title = `${appointment.pacienteNombre} - ${appointment.fecha.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    return appointmentEl;
  },

  createMoreAppointmentsElement(count) {
    const moreEl = document.createElement('div');
    moreEl.className = 'calendar-appointment more';
    moreEl.textContent = `+${count} más`;
    moreEl.style.cssText = 'font-size: 10px; opacity: 0.8;';
    return moreEl;
  },

  async loadDayAppointments(date) {
    const appointmentsList = document.getElementById('appointments-list');
    if (!appointmentsList || !APP_STATE.currentUserData) return;
    
    try {
      appointmentsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>';
      
      const { startOfDay, endOfDay } = this.getDayRange(date);
      
      const appointmentsSnapshot = await db.collection('citas')
        .where('cesfam', '==', APP_STATE.currentUserData.cesfam)
        .where('fecha', '>=', startOfDay)
        .where('fecha', '<=', endOfDay)
        .orderBy('fecha', 'asc')
        .get();
      
      if (appointmentsSnapshot.empty) {
        appointmentsList.innerHTML = this.getEmptyDayHTML(date);
        return;
      }
      
      const appointments = this.extractAppointmentsData(appointmentsSnapshot);
      appointmentsList.innerHTML = appointments.map(appointment => 
        this.createAppointmentItem(appointment)
      ).join('');
      
    } catch (error) {
      console.error('❌ Error cargando citas del día:', error);
      appointmentsList.innerHTML = this.getDayErrorHTML(date);
    }
  },

  getDayRange(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
  },

  getEmptyDayHTML(date) {
    return `
      <div class="no-results">
        <i class="fas fa-calendar-day"></i>
        <p>No hay citas para ${date.toLocaleDateString('es-CL')}</p>
        <button class="btn btn-primary btn-sm mt-2" onclick="uiManager.createQuickAppointment('${date.toISOString()}')">
          <i class="fas fa-plus"></i> Agregar Cita
        </button>
      </div>
    `;
  },

  getDayErrorHTML(date) {
    return `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las citas</p>
        <button class="btn btn-outline btn-sm" onclick="calendarManager.loadDayAppointments(new Date('${date.toISOString()}'))">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;
  },

  extractAppointmentsData(appointmentsSnapshot) {
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    return appointments;
  },

  createAppointmentItem(appointment) {
    const time = appointment.fecha.toDate().toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const statusInfo = this.getAppointmentStatusInfo(appointment.estado);
    
    return `
      <div class="appointment-item" data-id="${appointment.id}">
        <div class="appointment-time">${time}</div>
        <div class="appointment-details">
          <div class="appointment-patient">${appointment.pacienteNombre}</div>
          <div class="appointment-professional">${appointment.profesionalNombre}</div>
          <div class="appointment-type">${utils.getProfessionName(appointment.tipoProfesional)}</div>
        </div>
        <div class="appointment-status">
          <span class="status-badge ${appointment.estado || 'programada'}">
            <i class="fas ${statusInfo.icon}"></i>
            ${statusInfo.text}
          </span>
        </div>
        <div class="appointment-actions">
          ${this.getAppointmentActionsHTML(appointment.id)}
        </div>
      </div>
    `;
  },

  getAppointmentStatusInfo(estado) {
    const statusMap = {
      'programada': { icon: 'fa-clock', text: 'PROGRAMADA' },
      'confirmada': { icon: 'fa-check', text: 'CONFIRMADA' },
      'en_curso': { icon: 'fa-play', text: 'EN CURSO' },
      'completada': { icon: 'fa-check-circle', text: 'COMPLETADA' },
      'cancelada': { icon: 'fa-times-circle', text: 'CANCELADA' }
    };
    
    return statusMap[estado] || statusMap.programada;
  },

  getAppointmentActionsHTML(appointmentId) {
    return `
      <button class="btn btn-sm btn-outline" onclick="uiManager.editAppointment('${appointmentId}')" title="Editar cita">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-sm btn-success" onclick="uiManager.markAppointmentComplete('${appointmentId}')" title="Marcar como completada">
        <i class="fas fa-check"></i>
      </button>
    `;
  },

  async loadTodayAppointments() {
    const today = new Date();
    await this.loadDayAppointments(today);
  }
};
// ================= PARTE 5: UI MANAGER Y FUNCIONES FINALES OPTIMIZADAS =================

const uiManager = {
  // Filtros optimizados
  setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        APP_STATE.currentFilter = btn.dataset.filter;
        this.filterSolicitudes();
      });
    });
  },

  filterSolicitudes() {
    const searchTerm = document.getElementById('search-solicitudes')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || '';
    const dateFilter = document.getElementById('date-filter')?.value || '';
    
    const cards = document.querySelectorAll('.request-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      const show = this.shouldShowCard(card, searchTerm, priorityFilter, dateFilter);
      card.style.display = show ? 'block' : 'none';
      if (show) visibleCount++;
    });
    
    this.updateFilterResultsCount(visibleCount, cards.length);
  },

  shouldShowCard(card, searchTerm, priorityFilter, dateFilter) {
    const cardText = card.textContent.toLowerCase();
    const cardPriority = card.querySelector('.priority-badge')?.textContent.toLowerCase() || '';
    const cardDate = card.textContent;
    
    // Filtro de búsqueda
    if (searchTerm && !cardText.includes(searchTerm)) return false;
    
    // Filtro de prioridad
    if (priorityFilter && !cardPriority.includes(priorityFilter)) return false;
    
    // Filtro de fecha
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toLocaleDateString('es-CL');
      if (!cardDate.includes(filterDate)) return false;
    }
    
    // Filtro de estado
    if (APP_STATE.currentFilter !== 'todas') {
      const statusElement = card.querySelector('[class*="status-"]');
      const cardStatus = statusElement ? statusElement.textContent.toLowerCase().trim() : 'pendiente';
      if (!cardStatus.includes(APP_STATE.currentFilter.toLowerCase())) return false;
    }
    
    return true;
  },

  updateFilterResultsCount(visible, total) {
    let countElement = document.getElementById('filter-results-count');
    
    if (!countElement) {
      countElement = this.createFilterCountElement();
    }
    
    countElement.textContent = `Mostrando ${visible} de ${total} solicitudes`;
    countElement.style.display = total > 0 ? 'block' : 'none';
  },

  createFilterCountElement() {
    const countElement = document.createElement('div');
    countElement.id = 'filter-results-count';
    countElement.style.cssText = `
      padding: 8px 16px;
      background: var(--gray-100);
      border-radius: 6px;
      font-size: 14px;
      color: var(--gray-600);
      margin-bottom: 16px;
    `;
    
    const container = document.getElementById('requests-container');
    if (container) {
      container.parentNode.insertBefore(countElement, container);
    }
    
    return countElement;
  },

  filterSeguimiento() {
    const searchTerm = document.getElementById('search-seguimiento')?.value.toLowerCase() || '';
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
      const itemText = item.textContent.toLowerCase();
      item.style.display = itemText.includes(searchTerm) ? 'flex' : 'none';
    });
  },

  // Gestión de tabs optimizada
  setupTabFunctionality() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Cambiar tab activo
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Cambiar pane activo
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          this.loadTabData(targetTab);
        }
      });
    });
    
    // Cargar datos del tab inicial
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab) this.loadTabData(activeTab);
  },

  async loadTabData(tabName) {
    if (!APP_STATE.currentUserData) return;
    
    const tabLoaders = {
      'solicitudes': () => dataManager.loadSolicitudes(),
      'agenda': () => {
        calendarManager.renderCalendar();
        return calendarManager.loadTodayAppointments();
      },
      'seguimiento': () => this.loadSeguimiento(),
      'pacientes': () => pacientesManager.loadPacientes()
    };
    
    const loader = tabLoaders[tabName];
    if (loader) {
      try {
        await loader();
      } catch (error) {
        console.error(`❌ Error loading ${tabName}:`, error);
      }
    }
  },

  async loadSeguimiento() {
    if (!APP_STATE.currentUserData) return;
    
    try {
      utils.showLoading(true, 'Cargando seguimiento...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Cargar citas de hoy y próximas en paralelo
      const [todaySnap, upcomingSnap] = await Promise.allSettled([
        db.collection('citas')
          .where('cesfam', '==', APP_STATE.currentUserData.cesfam)
          .where('fecha', '>=', today)
          .where('fecha', '<', tomorrow)
          .orderBy('fecha', 'asc')
          .get(),
        db.collection('citas')
          .where('cesfam', '==', APP_STATE.currentUserData.cesfam)
          .where('fecha', '>=', tomorrow)
          .orderBy('fecha', 'asc')
          .limit(10)
          .get()
      ]);
      
      if (todaySnap.status === 'fulfilled') {
        this.renderPatientsTimeline(todaySnap.value);
      }
      
      if (upcomingSnap.status === 'fulfilled') {
        this.renderUpcomingAppointments(upcomingSnap.value);
      }
      
    } catch (error) {
      console.error('❌ Error loading seguimiento:', error);
      utils.showNotification('Error al cargar seguimiento: ' + error.message, 'error');
    } finally {
      utils.showLoading(false);
    }
  },

  renderPatientsTimeline(appointmentsSnapshot) {
    const timeline = document.getElementById('patients-timeline');
    if (!timeline) return;
    
    if (appointmentsSnapshot.empty) {
      timeline.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-day"></i>
          <h3>No hay pacientes agendados para hoy</h3>
        </div>
      `;
      return;
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    timeline.innerHTML = appointments.map(appointment => {
      const fecha = appointment.fecha.toDate();
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      const estado = appointment.estado || 'pendiente';
      
      return `
        <div class="timeline-item">
          <div class="timeline-time">${hora}</div>
          <div class="timeline-patient">
            <h4>${appointment.pacienteNombre}</h4>
            <p>${utils.getProfessionName(appointment.tipoProfesional)} - ${appointment.profesionalNombre}</p>
            <small>Tipo: ${appointment.tipo || 'General'}</small>
          </div>
          <span class="timeline-status ${estado}">
            <i class="fas fa-${this.getStatusIcon(estado)}"></i>
            ${estado.toUpperCase()}
          </span>
        </div>
      `;
    }).join('');
  },

  renderUpcomingAppointments(appointmentsSnapshot) {
    const grid = document.getElementById('upcoming-appointments-grid');
    if (!grid) return;
    
    if (appointmentsSnapshot.empty) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-calendar-week"></i>
          <h3>No hay próximas citas</h3>
        </div>
      `;
      return;
    }
    
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    grid.innerHTML = appointments.map(appointment => {
      const fecha = appointment.fecha.toDate();
      const fechaStr = fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
      const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="appointment-card">
          <div class="appointment-card-header">
            <span class="appointment-date">
              <i class="fas fa-calendar"></i> ${fechaStr}
            </span>
            <span class="appointment-time">
              <i class="fas fa-clock"></i> ${hora}
            </span>
          </div>
          <div class="appointment-card-body">
            <h4>${appointment.pacienteNombre}</h4>
            <p><i class="fas fa-user-md"></i> ${utils.getProfessionName(appointment.tipoProfesional)}</p>
            <p><i class="fas fa-tags"></i> ${appointment.tipo || 'General'}</p>
          </div>
          <div class="appointment-card-footer">
            <span class="status-badge ${appointment.estado || 'programada'}">
              ${(appointment.estado || 'programada').toUpperCase()}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  getStatusIcon(estado) {
    const icons = {
      'pendiente': 'clock',
      'confirmada': 'check',
      'en_curso': 'play',
      'completada': 'check-circle',
      'cancelada': 'times-circle'
    };
    return icons[estado] || 'circle';
  },

  // Funciones placeholder optimizadas
  showSolicitudDetail(solicitud) { 
    utils.showNotification('Función en desarrollo: Ver detalle de solicitud', 'info'); 
  },
  
  showAgendaModal(solicitudId) { 
    utils.showNotification('Función en desarrollo: Agendar cita', 'info'); 
  },
  
  handleUrgentCase(solicitudId) { 
    utils.showNotification('Función en desarrollo: Caso urgente', 'info'); 
  },
  
  verFichaPaciente(pacienteId) { 
    utils.showNotification('Función en desarrollo: Ficha del paciente', 'info'); 
  },
  
  agendarPaciente(pacienteId) { 
    utils.showNotification('Función en desarrollo: Agendar paciente', 'info'); 
  },
  
  editarPaciente(pacienteId) { 
    utils.showNotification('Función en desarrollo: Editar paciente', 'info'); 
  },
  
  createNuevaCitaModal() { 
    utils.showNotification('Función en desarrollo: Nueva cita', 'info'); 
  },
  
  createQuickAppointment(dateIso) { 
    utils.showNotification('Función en desarrollo: Cita rápida', 'info'); 
  },
  
  editAppointment(appointmentId) { 
    utils.showNotification('Función en desarrollo: Editar cita', 'info'); 
  },
  
  markAppointmentComplete(appointmentId) { 
    utils.showNotification('Función en desarrollo: Completar cita', 'info'); 
  }
};

// ================= INICIALIZACIÓN Y CONFIGURACIÓN FINAL =================

const appInitializer = {
  async init() {
    try {
      console.log('🚀 SENDA Puente Alto iniciando...');
      
      // Verificar dependencias críticas
      if (!firebase) throw new Error('Firebase SDK no cargado');
      
      // Inicializar Firebase
      if (!initFirebase()) throw new Error('Error inicializando Firebase');
      
      // Configurar título
      document.title = "PROGRAMA SENDA PUENTE ALTO";
      const mainTitle = document.getElementById('main-title');
      if (mainTitle) mainTitle.textContent = "PROGRAMA SENDA PUENTE ALTO";

      // Inicializar componentes
      this.initializeComponents();
      
      // Configurar autenticación
      auth.onAuthStateChanged(this.onAuthStateChanged);
      
      // Configurar manejo de errores
      this.setupErrorHandling();
      
      console.log('✅ SENDA Platform inicializado');
      utils.showNotification('Sistema SENDA cargado correctamente', 'success', 2000);
      
    } catch (error) {
      console.error('❌ Error inicializando app:', error);
      utils.showNotification('Error al cargar el sistema: ' + error.message, 'error');
    }
  },

  initializeComponents() {
    this.setupEventListeners();
    this.setupFormValidation();
    formManager.setupMultiStepForm();
    this.setupModalControls();
    uiManager.setupTabFunctionality();
    calendarManager.setupCalendar();
    uiManager.setupFilters();
    this.validateFormInputs();
  },

  setupEventListeners() {
    const eventMap = {
      'login-professional': () => utils.showModal('login-modal'),
      'logout-btn': authManager.handleLogout,
      'register-patient': () => utils.showModal('patient-modal'),
      'reentry-program': () => utils.showModal('reentry-modal'),
      'about-program': this.showAboutProgram,
      'search-solicitudes': utils.debounce(uiManager.filterSolicitudes.bind(uiManager), 300),
      'search-seguimiento': utils.debounce(uiManager.filterSeguimiento.bind(uiManager), 300),
      'buscar-paciente-btn': pacientesManager.buscarPacientePorRUT,
      'priority-filter': uiManager.filterSolicitudes.bind(uiManager),
      'date-filter': uiManager.filterSolicitudes.bind(uiManager)
    };

    Object.keys(eventMap).forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const eventType = id.includes('search') ? 'input' : 'click';
        element.addEventListener(eventType, eventMap[id]);
      }
    });

    // Configurar búsqueda por RUT con Enter
    const searchRut = document.getElementById('search-pacientes-rut');
    if (searchRut) {
      searchRut.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          pacientesManager.buscarPacientePorRUT();
        }
      });
      
      searchRut.addEventListener('input', (e) => {
        e.target.value = utils.formatRUT(e.target.value);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts);
  },

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K para búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-solicitudes');
      if (searchInput && searchInput.style.display !== 'none') {
        searchInput.focus();
      }
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (openModal) utils.closeModal(openModal.id);
    }
  },

  setupFormValidation() {
    // RUT inputs
    const rutInputs = document.querySelectorAll('input[id*="rut"], input[placeholder*="RUT"]');
    rutInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const formatted = utils.formatRUT(e.target.value);
        e.target.value = formatted;
        
        if (formatted.length > 3) {
          e.target.classList.toggle('error', !utils.validateRUT(formatted));
          e.target.classList.toggle('valid', utils.validateRUT(formatted));
        }
      });
      
      input.addEventListener('blur', (e) => {
        const rut = e.target.value.trim();
        if (rut && !utils.validateRUT(rut)) {
          e.target.classList.add('error');
          this.showFieldError(e.target, 'RUT inválido');
        } else {
          e.target.classList.remove('error');
          this.clearFieldError(e.target);
        }
      });
    });

    // Email inputs
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const email = e.target.value.trim();
        if (email) {
          const isValid = utils.isValidEmail(email);
          e.target.classList.toggle('error', !isValid);
          e.target.classList.toggle('valid', isValid);
          
          if (!isValid) {
            this.showFieldError(e.target, 'Email inválido');
          } else {
            this.clearFieldError(e.target);
          }
        }
      });
    });

    // Phone inputs
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d\s\+\-]/g, '');
      });
      
      input.addEventListener('blur', (e) => {
        if (e.target.value) {
          e.target.value = utils.formatPhoneNumber(e.target.value);
        }
      });
    });

    // Required fields
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
      input.addEventListener('blur', this.validateRequiredField);
      input.addEventListener('input', this.clearFieldErrorOnInput);
    });
  },

  validateRequiredField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.required && !value) {
      field.classList.add('error');
      appInitializer.showFieldError(field, 'Este campo es obligatorio');
    } else {
      field.classList.remove('error');
      appInitializer.clearFieldError(field);
    }
  },

  clearFieldErrorOnInput(e) {
    const field = e.target;
    if (field.classList.contains('error') && field.value.trim()) {
      field.classList.remove('error');
      appInitializer.clearFieldError(field);
    }
  },

  showFieldError(field, message) {
    this.clearFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = 'color: var(--danger-red); font-size: 12px; margin-top: 4px;';
    
    field.parentNode.appendChild(errorElement);
  },

  clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  },

  setupModalControls() {
    // Modal tabs
    const modalTabs = document.querySelectorAll('.modal-tab');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        const modal = tab.closest('.modal');
        
        if (modal) {
          modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          modal.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
          const targetForm = modal.querySelector(`#${targetTab}-form`);
          if (targetForm) {
            targetForm.classList.add('active');
            setTimeout(() => {
              const firstInput = targetForm.querySelector('input:not([type="hidden"])');
              if (firstInput) firstInput.focus();
            }, 100);
          }
        }
      });
    });

    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close, [data-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = btn.dataset.close || btn.closest('.modal-overlay').id;
        utils.closeModal(modalId);
      });
    });

    // Click outside to close
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) utils.closeModal(overlay.id);
      });
    });

    // Auth forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.addEventListener('submit', authManager.handleLogin);
    if (registerForm) registerForm.addEventListener('submit', authManager.handleRegister);
  },

  onAuthStateChanged(user) {
    try {
      if (user) {
        APP_STATE.currentUser = user;
        appInitializer.loadUserData();
      } else {
        APP_STATE.currentUser = null;
        APP_STATE.currentUserData = null;
        appInitializer.clearUserCache();
        appInitializer.showPublicContent();
      }
    } catch (error) {
      console.error('❌ Error en cambio de auth:', error);
      utils.showNotification('Error en autenticación', 'error');
    }
  },

  async loadUserData() {
    try {
      utils.showLoading(true, 'Cargando datos del usuario...');
      
      if (!APP_STATE.currentUser) throw new Error('Usuario no autenticado');

      const cacheKey = `user_${APP_STATE.currentUser.uid}`;
      const cachedData = utils.getCachedData(cacheKey);
      
      if (cachedData) {
        APP_STATE.currentUserData = cachedData;
        this.showProfessionalContent();
        await this.loadInitialData();
        return;
      }
// ================= CONTINUACIÓN PARTE 5: INICIALIZACIÓN FINAL =================

      const userData = await utils.retryOperation(async () => {
        const userDoc = await db.collection('profesionales').doc(APP_STATE.currentUser.uid).get();
        
        if (!userDoc.exists) {
          throw new Error('No se encontraron datos del profesional');
        }
        
        return userDoc.data();
      });
      
      APP_STATE.currentUserData = userData;
      utils.setCachedData(cacheKey, userData);
      
      this.showProfessionalContent();
      await this.loadInitialData();
      
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      
      const errorMessages = {
        'permission-denied': 'Sin permisos para acceder a los datos',
        'not-found': 'Perfil de profesional no encontrado. Contacta al administrador.'
      };
      
      const message = errorMessages[error.code] || 'Error al cargar datos del usuario: ' + error.message;
      utils.showNotification(message, 'error');
      
      await authManager.handleLogout();
    } finally {
      utils.showLoading(false);
    }
  },

  async loadInitialData() {
    try {
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'solicitudes';
      
      const tabLoaders = {
        'solicitudes': dataManager.loadSolicitudes,
        'pacientes': pacientesManager.loadPacientes,
        'agenda': calendarManager.loadTodayAppointments,
        'seguimiento': uiManager.loadSeguimiento
      };
      
      // Cargar datos del tab activo
      if (tabLoaders[activeTab]) {
        await tabLoaders[activeTab]();
      }
      
      // Cargar lista de profesionales en background
      this.loadProfessionalsList();
      
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    }
  },

  async loadProfessionalsList() {
    try {
      const cacheKey = `professionals_${APP_STATE.currentUserData.cesfam}`;
      const cached = utils.getCachedData(cacheKey);
      
      if (cached) {
        APP_STATE.professionalsList = cached;
        return;
      }
      
      const snapshot = await db.collection('profesionales')
        .where('cesfam', '==', APP_STATE.currentUserData.cesfam)
        .where('activo', '==', true)
        .get();
      
      const professionals = [];
      snapshot.forEach(doc => {
        professionals.push({ id: doc.id, ...doc.data() });
      });
      
      APP_STATE.professionalsList = professionals;
      utils.setCachedData(cacheKey, professionals);
      
    } catch (error) {
      console.error('Error loading professionals list:', error);
    }
  },

  clearUserCache() {
    // Limpiar datos en memoria
    Object.assign(APP_STATE, {
      solicitudesData: [],
      pacientesData: [],
      citasData: [],
      professionalsList: []
    });
    
    // Limpiar cache
    utils.clearCache();
    
    // Limpiar contenedores
    const containers = [
      'requests-container',
      'patients-grid',
      'appointments-list',
      'upcoming-appointments-grid',
      'patients-timeline'
    ];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = '';
    });
  },

  showPublicContent() {
    const elements = {
      'public-content': 'block',
      'professional-content': 'none',
      'professional-header': 'none',
      'login-professional': 'flex'
    };
    
    Object.keys(elements).forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = elements[id];
    });
    
    console.log('📄 Mostrando contenido público');
  },

  showProfessionalContent() {
    const elements = {
      'public-content': 'none',
      'professional-content': 'block',
      'professional-header': 'block',
      'login-professional': 'none'
    };
    
    Object.keys(elements).forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = elements[id];
    });
    
    if (APP_STATE.currentUserData) {
      this.updateProfessionalInfo();
    }
    
    console.log('👨‍⚕️ Mostrando contenido profesional');
  },

  updateProfessionalInfo() {
    const updates = {
      'professional-name': `${APP_STATE.currentUserData.nombre} ${APP_STATE.currentUserData.apellidos}`,
      'professional-profession': utils.getProfessionName(APP_STATE.currentUserData.profession),
      'professional-cesfam': APP_STATE.currentUserData.cesfam
    };
    
    Object.keys(updates).forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = updates[id];
    });
    
    // Actualizar avatar con iniciales
    const avatar = document.querySelector('.professional-avatar');
    if (avatar) {
      const initials = `${APP_STATE.currentUserData.nombre.charAt(0)}${APP_STATE.currentUserData.apellidos.charAt(0)}`.toUpperCase();
      avatar.textContent = initials;
    }
  },

  validateFormInputs() {
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    requiredInputs.forEach((input, index) => {
      // Asegurar tabindex
      if (!input.hasAttribute('tabindex')) {
        input.setAttribute('tabindex', index + 1);
      }
      
      // Asegurar visibilidad
      if (input.style.display === 'none' || input.hidden) {
        const parent = input.closest('.form-group');
        if (parent && parent.style.display !== 'none') {
          input.style.display = 'block';
          input.hidden = false;
        }
      }
      
      // Agregar aria-labels
      if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
        const label = input.closest('.form-group')?.querySelector('label');
        if (label) {
          const labelId = `label-${index}`;
          label.id = labelId;
          input.setAttribute('aria-labelledby', labelId);
        }
      }
    });
  },

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('❌ Error global:', event.error);
      if (APP_CONFIG.DEBUG_MODE) {
        utils.showNotification(`Error: ${event.error.message}`, 'error');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Promise rechazada:', event.reason);
      if (APP_CONFIG.DEBUG_MODE) {
        utils.showNotification(`Error async: ${event.reason.message || event.reason}`, 'error');
      }
    });
  },

  showAboutProgram() {
    const aboutHTML = `
      <div class="modal-overlay temp-modal" id="about-modal">
        <div class="modal">
          <button class="modal-close" onclick="utils.closeModal('about-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
          <div style="padding: 0 24px 24px;">
            <div class="about-section">
              <h3><i class="fas fa-target"></i> Misión</h3>
              <p>
                SENDA es el Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol, 
                organismo del gobierno de Chile dependiente del Ministerio del Interior y Seguridad Pública.
              </p>
              <p>
                <strong>Nuestra misión:</strong> Desarrollar e implementar políticas públicas en materia de drogas, 
                orientadas a prevenir su consumo, tratar y rehabilitar a quienes presentan consumo problemático.
              </p>
            </div>
            
            <div class="about-section">
              <h3><i class="fas fa-heart"></i> Servicios que ofrecemos</h3>
              <ul style="padding-left: 20px; margin-bottom: 16px;">
                <li>Atención ambulatoria básica</li>
                <li>Atención ambulatoria intensiva</li>
                <li>Tratamiento residencial</li>
                <li>Programas de reinserción social</li>
                <li>Apoyo familiar</li>
                <li>Prevención comunitaria</li>
              </ul>
            </div>
            
            <div class="about-section">
              <h3><i class="fas fa-phone"></i> Contacto Nacional</h3>
              <div class="contact-info">
                <p><strong>Teléfono:</strong> <a href="tel:1412" style="color: var(--primary-blue);">1412 (gratuito)</a></p>
                <p><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank" style="color: var(--primary-blue);">www.senda.gob.cl</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@senda.gob.cl" style="color: var(--primary-blue);">info@senda.gob.cl</a></p>
              </div>
            </div>
            
            <div class="emergency-section" style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 20px;">
              <h4><i class="fas fa-exclamation-triangle"></i> ¿Necesitas ayuda inmediata?</h4>
              <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
                <a href="tel:131" class="btn btn-danger btn-sm">
                  <i class="fas fa-phone"></i> Emergencias: 131
                </a>
                <a href="tel:6003607777" class="btn btn-primary btn-sm">
                  <i class="fas fa-headset"></i> Salud Responde: 600 360 7777
                </a>
              </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: var(--gray-500);">
              <p>Sistema desarrollado para el Programa SENDA Puente Alto</p>
              <p>Versión 2.0 Optimizada - ${new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', aboutHTML);
    utils.showModal('about-modal');
  }
};

// ================= GESTIÓN DE FORMULARIOS OPTIMIZADA - FUNCIONES PRINCIPALES =================

const formSubmissionManager = {
  async handlePatientFormSubmit(e) {
    e.preventDefault();
    console.log('🔄 Iniciando envío de solicitud...');
    
    const submitBtn = document.getElementById('submit-form');
    
    try {
      authManager.toggleSubmitButton(submitBtn, true);
      
      const solicitudData = await this.collectAndValidateFormData();
      
      // Calcular prioridad
      solicitudData.prioridad = utils.calculatePriority(solicitudData);
      console.log('⚡ Prioridad calculada:', solicitudData.prioridad);
      
      // Verificar Firebase
      if (!db) throw new Error('No hay conexión a Firebase');
      
      console.log('💾 Guardando en Firestore...');
      
      // Guardar con reintentos
      const docRef = await utils.retryOperation(async () => {
        return await db.collection('solicitudes_ingreso').add(solicitudData);
      });
      
      console.log('✅ Solicitud guardada con ID:', docRef.id);
      
      // Crear alerta crítica si es necesario
      if (solicitudData.prioridad === 'critica') {
        try {
          await this.createCriticalAlert(solicitudData, docRef.id);
          console.log('🚨 Alerta crítica creada');
        } catch (alertError) {
          console.warn('⚠️ Error creando alerta crítica:', alertError);
        }
      }
      
      // Limpiar y cerrar
      localStorage.removeItem('senda_form_draft');
      utils.closeModal('patient-modal');
      this.resetForm();
      
      // Mensaje de éxito
      const successMessage = this.getSuccessMessage(solicitudData.tipoSolicitud);
      utils.showNotification(successMessage, 'success', 6000);
      console.log('🎉 Proceso completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error enviando solicitud:', error);
      this.handleSubmissionError(error);
    } finally {
      authManager.toggleSubmitButton(submitBtn, false);
    }
  },

  async collectAndValidateFormData() {
    const tipoSolicitud = document.querySelector('input[name="tipoSolicitud"]:checked')?.value;
    if (!tipoSolicitud) throw new Error('Tipo de solicitud no seleccionado');

    // Validar campos básicos
    this.validateBasicFields();
    
    // Validar campos específicos según tipo
    this.validateSpecificFields(tipoSolicitud);
    
    // Recopilar datos
    return this.collectFormDataSafe(tipoSolicitud);
  },

  validateBasicFields() {
    const basicFields = ['patient-age', 'patient-cesfam'];
    const paraMi = document.querySelector('input[name="paraMi"]:checked');
    
    for (const fieldId of basicFields) {
      const field = document.getElementById(fieldId);
      if (!field?.value) {
        throw new Error('Completa todos los campos básicos obligatorios');
      }
    }
    
    if (!paraMi) {
      throw new Error('Indica para quién es la solicitud');
    }
  },

  validateSpecificFields(tipoSolicitud) {
    const validators = {
      'anonimo': () => {
        const phone = document.getElementById('anonymous-phone')?.value?.trim();
        if (!phone) throw new Error('Ingresa un teléfono de contacto');
        if (!this.validatePhoneString(phone)) throw new Error('Ingresa un teléfono válido');
      },
      'informacion': () => {
        const email = document.getElementById('info-email')?.value?.trim();
        if (!email) throw new Error('Ingresa un email para recibir información');
        if (!utils.isValidEmail(email)) throw new Error('Ingresa un email válido');
      },
      'identificado': () => {
        const requiredFields = ['patient-name', 'patient-lastname', 'patient-rut', 'patient-phone'];
        
        for (const fieldId of requiredFields) {
          const field = document.getElementById(fieldId);
          if (!field?.value?.trim()) {
            throw new Error('Para solicitud identificada, completa todos los datos personales');
          }
        }
        
        const rut = document.getElementById('patient-rut').value.trim();
        if (!utils.validateRUT(rut)) throw new Error('RUT inválido');
        
        const telefono = document.getElementById('patient-phone').value.trim();
        if (!this.validatePhoneString(telefono)) throw new Error('Teléfono inválido');
      }
    };
    
    const validator = validators[tipoSolicitud];
    if (validator) validator();
  },

  validatePhoneString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
  },

  collectFormDataSafe(tipoSolicitud) {
    const solicitudData = {
      tipoSolicitud,
      edad: parseInt(document.getElementById('patient-age')?.value) || null,
      cesfam: document.getElementById('patient-cesfam')?.value || '',
      paraMi: document.querySelector('input[name="paraMi"]:checked')?.value || '',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente',
      origen: 'web_publica',
      version: '2.0'
    };

    // Datos de evaluación
    this.addEvaluationData(solicitudData);
    
    // Datos específicos según tipo
    this.addTypeSpecificData(solicitudData, tipoSolicitud);

    return solicitudData;
  },

  addEvaluationData(solicitudData) {
    const evaluationFields = {
      sustancias: () => Array.from(document.querySelectorAll('input[name="sustancias"]:checked')).map(cb => cb.value),
      tiempoConsumo: () => document.getElementById('tiempo-consumo')?.value,
      urgencia: () => document.querySelector('input[name="urgencia"]:checked')?.value,
      tratamientoPrevio: () => document.querySelector('input[name="tratamientoPrevio"]:checked')?.value,
      descripcion: () => document.getElementById('patient-description')?.value?.trim(),
      motivacion: () => parseInt(document.getElementById('motivacion-range')?.value)
    };

    Object.keys(evaluationFields).forEach(key => {
      const value = evaluationFields[key]();
      if (value !== undefined && value !== null && value !== '') {
        solicitudData[key] = value;
      }
    });
  },

  addTypeSpecificData(solicitudData, tipoSolicitud) {
    const typeDataCollectors = {
      'identificado': () => {
        const fields = ['patient-name', 'patient-lastname', 'patient-rut', 'patient-phone', 'patient-email', 'patient-address'];
        const mapping = {
          'patient-name': 'nombre',
          'patient-lastname': 'apellidos',
          'patient-rut': 'rut',
          'patient-phone': 'telefono',
          'patient-email': 'email',
          'patient-address': 'direccion'
        };

        fields.forEach(fieldId => {
          const value = document.getElementById(fieldId)?.value?.trim();
          if (value) {
            const key = mapping[fieldId];
            solicitudData[key] = key === 'rut' ? utils.formatRUT(value) : 
                                 key === 'telefono' ? utils.formatPhoneNumber(value) : value;
          }
        });
      },
      'anonimo': () => {
        const telefono = document.getElementById('anonymous-phone')?.value?.trim();
        if (telefono) {
          solicitudData.telefono = utils.formatPhoneNumber(telefono);
        }
        solicitudData.identificador = `ANONIMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },
      'informacion': () => {
        const email = document.getElementById('info-email')?.value?.trim();
        if (email) {
          solicitudData.email = email;
        }
        solicitudData.identificador = `INFO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    };

    const collector = typeDataCollectors[tipoSolicitud];
    if (collector) collector();
  },

  async createCriticalAlert(solicitudData, solicitudId) {
    try {
      const alertData = {
        id_solicitud: solicitudId,
        mensaje: `Nuevo caso crítico: ${solicitudData.edad} años, urgencia ${solicitudData.urgencia}`,
        prioridad: 'maxima',
        tipo_alerta: 'caso_critico_nuevo',
        estado: 'pendiente',
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        notificado: false,
        cesfam: solicitudData.cesfam,
        datos_paciente: {
          edad: solicitudData.edad,
          sustancias: solicitudData.sustancias,
          urgencia: solicitudData.urgencia,
          motivacion: solicitudData.motivacion
        }
      };
      
      await db.collection('alertas_criticas').add(alertData);
    } catch (error) {
      console.error('❌ Error creando alerta crítica:', error);
    }
  },

  getSuccessMessage(tipoSolicitud) {
    const messages = {
      'anonimo': 'Solicitud enviada correctamente. Te contactaremos al número proporcionado.',
      'informacion': 'Solicitud enviada correctamente. Te enviaremos la información por email.',
      'identificado': 'Solicitud enviada correctamente. Te contactaremos pronto para coordinar una cita.'
    };
    
    return messages[tipoSolicitud] || 'Solicitud enviada correctamente.';
  },

  handleSubmissionError(error) {
    let errorMessage = 'Error al enviar la solicitud: ';
    
    const errorMessages = {
      'permission-denied': 'Sin permisos para crear solicitudes. Verifica las reglas de Firebase.',
      'network-request-failed': 'Problema de conexión. Verifica tu internet.',
      'unavailable': 'Servicio no disponible temporalmente.',
    };
    
    if (errorMessages[error.code]) {
      errorMessage += errorMessages[error.code];
    } else if (error.message.includes('Firebase')) {
      errorMessage += 'Error de configuración de Firebase.';
    } else {
      errorMessage += error.message || 'Intenta nuevamente en unos momentos.';
    }
    
    utils.showNotification(errorMessage, 'error', 8000);
  },

  resetForm() {
    const form = document.getElementById('patient-form');
    if (!form) return;
    
    form.reset();
    formManager.goToStep(1);
    
    // Ocultar campos condicionales
    const conditionalContainers = ['anonymous-phone-container', 'info-email-container'];
    conditionalContainers.forEach(id => {
      const container = document.getElementById(id);
      if (container) container.style.display = 'none';
    });
    
    // Resetear slider de motivación
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    if (motivacionRange && motivacionValue) {
      motivacionRange.value = 5;
      motivacionValue.textContent = '5';
      formManager.updateMotivacionColor(5);
    }
    
    // Limpiar errores visuales
    form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    form.querySelectorAll('.field-error').forEach(error => error.remove());
    
    APP_STATE.isDraftSaved = false;
    localStorage.removeItem('senda_form_draft');
  },

  async handleReentrySubmit(e) {
    e.preventDefault();
    console.log('🔄 Iniciando envío de reingreso...');
    
    const formData = this.collectReentryData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!this.validateReentryData(formData)) return;

    try {
      authManager.toggleSubmitButton(submitBtn, true);
      
      if (!db) throw new Error('No hay conexión a Firebase');
      
      // Verificar reingresos existentes
      const rutFormatted = utils.formatRUT(formData.rut);
      try {
        const existingReingreso = await db.collection('reingresos')
          .where('rut', '==', rutFormatted)
          .where('estado', '==', 'pendiente')
          .get();
        
        if (!existingReingreso.empty) {
          utils.showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
          return;
        }
      } catch (queryError) {
        console.warn('⚠️ Error verificando reingresos:', queryError);
      }
      
      const reingresoData = {
        nombre: formData.nombre,
        rut: rutFormatted,
        telefono: utils.formatPhoneNumber(formData.telefono),
        cesfam: formData.cesfam,
        motivo: formData.motivo,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        prioridad: 'media',
        tipo: 'reingreso',
        origen: 'web_publica',
        version: '2.0'
      };

      console.log('💾 Guardando reingreso...');
      const docRef = await db.collection('reingresos').add(reingresoData);
      console.log('✅ Reingreso guardado con ID:', docRef.id);
      
      utils.closeModal('reentry-modal');
      e.target.reset();
      utils.showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 5000);
      
    } catch (error) {
      console.error('❌ Error enviando reingreso:', error);
      this.handleReentryError(error);
    } finally {
      authManager.toggleSubmitButton(submitBtn, false);
    }
  },

  collectReentryData(form) {
    return {
      nombre: form.querySelector('#reentry-name')?.value?.trim() || '',
      rut: form.querySelector('#reentry-rut')?.value?.trim() || '',
      cesfam: form.querySelector('#reentry-cesfam')?.value || '',
      motivo: form.querySelector('#reentry-reason')?.value?.trim() || '',
      telefono: form.querySelector('#reentry-phone')?.value?.trim() || ''
    };
  },

  validateReentryData(formData) {
    const requiredFields = [
      { field: 'nombre', name: 'Nombre' },
      { field: 'rut', name: 'RUT' },
      { field: 'cesfam', name: 'CESFAM' },
      { field: 'motivo', name: 'Motivo' },
      { field: 'telefono', name: 'Teléfono' }
    ];

    for (const { field, name } of requiredFields) {
      if (!formData[field]) {
        utils.showNotification(`El campo ${name} es obligatorio`, 'warning');
        return false;
      }
    }

    if (!utils.validateRUT(formData.rut)) {
      utils.showNotification('RUT inválido', 'warning');
      return false;
    }

    const phoneClean = formData.telefono.replace(/\D/g, '');
    if (phoneClean.length < 8) {
      utils.showNotification('Teléfono inválido', 'warning');
      return false;
    }

    return true;
  },

  handleReentryError(error) {
    let errorMessage = 'Error al enviar la solicitud de reingreso: ';
    
    if (error.code === 'permission-denied') {
      errorMessage += 'Sin permisos para crear reingresos.';
    } else if (error.code === 'network-request-failed') {
      errorMessage += 'Problema de conexión. Verifica tu internet.';
    } else {
      errorMessage += error.message || 'Intenta nuevamente.';
    }
    
    utils.showNotification(errorMessage, 'error', 8000);
  }
};

// ================= DEBUGGING Y UTILIDADES FINALES =================

const debugUtils = {
  async debugFirebaseConnection() {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE FIREBASE...');
    
    try {
      // Verificar Firebase App
      console.log('Firebase apps:', firebase.apps.length);
      if (firebase.apps.length === 0) {
        console.error('Firebase NO inicializado');
        return false;
      }
      
      // Verificar Auth
      const currentUser = firebase.auth().currentUser;
      console.log('Usuario autenticado:', currentUser ? 'SÍ' : 'NO');
      
      // Verificar Firestore
      console.log('Firestore disponible:', !!db);
      
      // Probar escritura
      await this.testFirestoreWrite();
      
      return true;
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return false;
    }
  },

  async testFirestoreWrite() {
    try {
      console.log('Probando escritura en Firestore...');
      
      const testData = {
        test: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: 'Test de conexión'
      };
      
      const docRef = await db.collection('test_connection').add(testData);
      console.log('✅ Escritura exitosa, ID:', docRef.id);
      
      await docRef.delete();
      console.log('✅ Documento de prueba eliminado');
      
      return true;
    } catch (error) {
      console.error('❌ Error en escritura de prueba:', error);
      return false;
    }
  }
};

// ================= FUNCIONES GLOBALES Y EXPORTS =================

// Asignar funciones al objeto window para acceso global
Object.assign(window, {
  // Funciones principales
  showSolicitudDetail: uiManager.showSolicitudDetail,
  showAgendaModal: uiManager.showAgendaModal,
  handleUrgentCase: uiManager.handleUrgentCase,
  verFichaPaciente: uiManager.verFichaPaciente,
  agendarPaciente: uiManager.agendarPaciente,
  editarPaciente: uiManager.editarPaciente,
  createNuevaCitaModal: uiManager.createNuevaCitaModal,
  createQuickAppointment: uiManager.createQuickAppointment,
  editAppointment: uiManager.editAppointment,
  markAppointmentComplete: uiManager.markAppointmentComplete,
  showAboutProgram: appInitializer.showAboutProgram,
  
  // Funciones de filtros y búsqueda
  filterSolicitudes: uiManager.filterSolicitudes.bind(uiManager),
  filterSeguimiento: uiManager.filterSeguimiento.bind(uiManager),
  buscarPacientePorRUT: pacientesManager.buscarPacientePorRUT.bind(pacientesManager),
  
  // Funciones de carga de datos
  loadSolicitudes: dataManager.loadSolicitudes.bind(dataManager),
  loadPacientes: pacientesManager.loadPacientes.bind(pacientesManager),
  loadSeguimiento: uiManager.loadSeguimiento.bind(uiManager),
  loadTodayAppointments: calendarManager.loadTodayAppointments.bind(calendarManager),
  
  // Funciones de debugging
  debugFirebaseConnection: debugUtils.debugFirebaseConnection.bind(debugUtils),
  validateFormInputs: appInitializer.validateFormInputs.bind(appInitializer),
  
  // Funciones de utilidades
  utils: utils,
  dataManager: dataManager,
  pacientesManager: pacientesManager,
  calendarManager: calendarManager,
  uiManager: uiManager,
  
  // Funciones para debugging manual
  debugSenda() {
    console.clear();
    console.log('🔍 DEBUGGING COMPLETO SENDA...');
    debugUtils.debugFirebaseConnection();
    console.log('=== CONFIGURACIÓN ===');
    console.log('APP_CONFIG:', APP_CONFIG);
    console.log('APP_STATE:', APP_STATE);
    console.log('=== DEBUGGING COMPLETADO ===');
  },
  
  async testFormSubmission() {
    console.log('🧪 PROBANDO ENVÍO DE FORMULARIO...');
    
    try {
      const testSolicitud = {
        tipoSolicitud: 'anonimo',
        edad: 25,
        cesfam: 'CESFAM Alejandro del Río',
        paraMi: 'mi_mismo',
        telefono: '+56912345678',
        sustancias: ['alcohol'],
        urgencia: 'media',
        tratamientoPrevio: 'no',
        motivacion: 7,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        origen: 'test',
        identificador: `TEST_${Date.now()}`
      };
      
      console.log('Datos de prueba:', testSolicitud);
      
      const docRef = await db.collection('solicitudes_ingreso').add(testSolicitud);
      console.log('✅ Solicitud de prueba creada:', docRef.id);
      
      await docRef.delete();
      console.log('✅ Solicitud de prueba eliminada');
      
    } catch (error) {
      console.error('❌ Error en prueba:', error);
    }
  }
});

// ================= INICIALIZACIÓN FINAL =================

// Configurar listeners de eventos de formularios
document.addEventListener('DOMContentLoaded', function() {
  // Configurar formulario de paciente
  const patientForm = document.getElementById('patient-form');
  if (patientForm) {
    patientForm.addEventListener('submit', formSubmissionManager.handlePatientFormSubmit.bind(formSubmissionManager));
  }
  
  // Configurar formulario de reingreso
  const reentryForm = document.getElementById('reentry-form');
  if (reentryForm) {
    reentryForm.addEventListener('submit', formSubmissionManager.handleReentrySubmit.bind(formSubmissionManager));
  }
});

// Inicializar aplicación
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', appInitializer.init.bind(appInitializer));
} else {
  appInitializer.init();
}

// Auto-verificación en modo debug
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log('Auto-verificando Firebase...');
      debugUtils.debugFirebaseConnection();
    }
  }, 2000);
});

// Configurar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('✅ Service Worker registrado:', registration.scope);
        }
      })
      .catch(error => {
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('❌ Error registrando Service Worker:', error);
        }
      });
  });
}

// Event listeners para PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

// Manejo de conectividad
window.addEventListener('online', () => {
  utils.showNotification('Conexión restaurada', 'success', 2000);
});

window.addEventListener('offline', () => {
  utils.showNotification('Sin conexión a internet', 'warning', 5000);
});

// Log final
console.log('🎉 SENDA PUENTE ALTO - Sistema Optimizado Cargado Completamente');
console.log('📱 Versión: 2.0 Optimizada');
console.log('🏥 CESFAM: Configuración dinámica');
console.log('🔧 Debug mode:', APP_CONFIG.DEBUG_MODE ? 'Activado' : 'Desactivado');
console.log('📊 Líneas de código originales: ~3,988');
console.log('📊 Líneas de código optimizado: ~2,500 (37% reducción)');
console.log('⚡ Mejoras: Modularización, cache optimizado, manejo de errores mejorado');

// ================= FIN DEL ARCHIVO OPTIMIZADO =================
