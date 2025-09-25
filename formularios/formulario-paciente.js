/**
 * FORMULARIOS/FORMULARIO-PACIENTE.JS - VERSIÓN SIN IMPORTS
 */

let currentFormStep = 1;
let maxFormStep = 4;

/**
 * Función principal para configurar formularios
 */
window.setupFormularios = function() {
    try {
        console.log('📝 Configurando formularios...');
        
        initPatientForm();
        setupAutoSave();
        
        console.log('✅ Formularios configurados');
    } catch (error) {
        console.error('❌ Error configurando formularios:', error);
    }
};

/**
 * Inicializa el formulario de paciente
 */
function initPatientForm() {
    try {
        setupFormSteps();
        setupValidationListeners();
        setupPatientFormEvents();
        loadSavedData();
        
        console.log('✅ Formulario de paciente inicializado');
    } catch (error) {
        console.error('Error inicializando formulario:', error);
    }
}

/**
 * Configura los pasos del formulario
 */
function setupFormSteps() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    
    nextButtons.forEach(button => {
        button.addEventListener('click', handleNextStep);
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', handlePrevStep);
    });

    // Configurar botones específicos del formulario
    const nextStep1 = document.getElementById('next-step-1');
    const nextStep2 = document.getElementById('next-step-2');
    const nextStep3 = document.getElementById('next-step-3');
    const submitStep1 = document.getElementById('submit-step-1');
    const submitForm = document.getElementById('submit-form');

    if (nextStep1) {
        nextStep1.addEventListener('click', () => handleStepNavigation(2));
    }
    if (nextStep2) {
        nextStep2.addEventListener('click', () => handleStepNavigation(3));
    }
    if (nextStep3) {
        nextStep3.addEventListener('click', () => handleStepNavigation(4));
    }
    if (submitStep1) {
        submitStep1.addEventListener('click', handleFormSubmit);
    }
    if (submitForm) {
        submitForm.addEventListener('click', handleFormSubmit);
    }
}

/**
 * Configura eventos específicos del formulario de paciente
 */
function setupPatientFormEvents() {
    // Radio buttons para tipo de solicitud
    const tipoSolicitudRadios = document.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudRadios.forEach(radio => {
        radio.addEventListener('change', handleTipoSolicitudChange);
    });

    // Slider de motivación
    const motivacionRange = document.getElementById('motivacion-range');
    const motivacionValue = document.getElementById('motivacion-value');
    
    if (motivacionRange && motivacionValue) {
        motivacionRange.addEventListener('input', (e) => {
            const value = e.target.value;
            motivacionValue.textContent = value;
            
            // Cambiar color según el valor
            let color = '#ef4444'; // rojo por defecto
            if (value >= 7) color = '#10b981'; // verde
            else if (value >= 4) color = '#f59e0b'; // amarillo
            
            motivacionValue.style.backgroundColor = color;
        });
    }
}

/**
 * Maneja el cambio de tipo de solicitud
 */
function handleTipoSolicitudChange(e) {
    const value = e.target.value;
    const infoEmailContainer = document.getElementById('info-email-container');
    const basicInfoContainer = document.getElementById('basic-info-container');
    const nextBtn = document.getElementById('next-step-1');
    const submitBtn = document.getElementById('submit-step-1');
    
    if (value === 'informacion') {
        // Solo información - mostrar email y botón enviar
        if (infoEmailContainer) infoEmailContainer.style.display = 'block';
        if (basicInfoContainer) basicInfoContainer.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-flex';
    } else {
        // Solicitud completa - mostrar campos básicos y siguiente
        if (infoEmailContainer) infoEmailContainer.style.display = 'none';
        if (basicInfoContainer) basicInfoContainer.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

/**
 * Maneja la navegación entre pasos
 */
function handleStepNavigation(targetStep) {
    if (validateCurrentStep()) {
        goToStep(targetStep);
    }
}

/**
 * Maneja el paso siguiente del formulario
 */
function handleNextStep() {
    if (validateCurrentStep()) {
        if (currentFormStep < maxFormStep) {
            currentFormStep++;
            showFormStep(currentFormStep);
        }
    }
}

/**
 * Maneja el paso anterior del formulario
 */
function handlePrevStep() {
    if (currentFormStep > 1) {
        currentFormStep--;
        showFormStep(currentFormStep);
    }
}

/**
 * Navega a un paso específico del formulario
 */
window.goToStep = function(step) {
    if (step >= 1 && step <= maxFormStep) {
        currentFormStep = step;
        showFormStep(step);
        updateProgressIndicator(step);
    } else {
        console.error(`Paso inválido: ${step}. Debe estar entre 1 y ${maxFormStep}`);
    }
};

/**
 * Muestra un paso específico del formulario
 */
function showFormStep(step) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(stepDiv => {
        stepDiv.style.display = 'none';
    });
    
    // Mostrar el paso actual
    const currentStepDiv = document.querySelector(`[data-step="${step}"]`);
    if (currentStepDiv) {
        currentStepDiv.style.display = 'block';
    }
    
    // Actualizar indicador de progreso
    updateProgressIndicator(step);
    updateProgressText(step);
}

/**
 * Actualiza el indicador de progreso
 */
function updateProgressIndicator(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((progressStep, index) => {
        if (index + 1 <= step) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    });

    // Actualizar barra de progreso
    const progressFill = document.getElementById('form-progress');
    if (progressFill) {
        const percentage = (step / maxFormStep) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

/**
 * Actualiza el texto de progreso
 */
function updateProgressText(step) {
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `Paso ${step} de ${maxFormStep}`;
    }
}

/**
 * Valida el paso actual del formulario
 */
function validateCurrentStep() {
    const currentStepDiv = document.querySelector(`[data-step="${currentFormStep}"]`);
    if (!currentStepDiv) return false;
    
    const requiredFields = currentStepDiv.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Validaciones específicas por paso
    if (currentFormStep === 2) {
        isValid = validatePersonalData() && isValid;
    }
    
    if (!isValid && window.showNotification) {
        window.showNotification('Por favor completa todos los campos obligatorios', 'warning');
    }
    
    return isValid;
}

/**
 * Valida los datos personales
 */
function validatePersonalData() {
    let isValid = true;
    
    const rutField = document.getElementById('patient-rut');
    if (rutField && rutField.value.trim()) {
        if (!window.validateRUT || !window.validateRUT(rutField.value.trim())) {
            rutField.classList.add('error');
            if (window.showNotification) {
                window.showNotification('RUT inválido', 'error');
            }
            isValid = false;
        } else {
            rutField.classList.remove('error');
        }
    }
    
    const emailField = document.getElementById('patient-email');
    if (emailField && emailField.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
            emailField.classList.add('error');
            if (window.showNotification) {
                window.showNotification('Email inválido', 'error');
            }
            isValid = false;
        } else {
            emailField.classList.remove('error');
        }
    }
    
    return isValid;
}

/**
 * Configura los listeners de validación
 */
function setupValidationListeners() {
    // Validación de RUT en tiempo real
    const rutField = document.getElementById('patient-rut');
    if (rutField) {
        rutField.addEventListener('input', function(e) {
            if (window.formatRUT) {
                e.target.value = window.formatRUT(e.target.value);
            }
        });

        rutField.addEventListener('blur', function() {
            if (this.value.trim() && window.validateRUT && !window.validateRUT(this.value.trim())) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }

    // Validación de teléfono
    const phoneField = document.getElementById('patient-phone');
    if (phoneField) {
        phoneField.addEventListener('input', function(e) {
            if (window.formatPhoneNumber) {
                e.target.value = window.formatPhoneNumber(e.target.value);
            }
        });
    }
}

/**
 * Auto-guardado de formulario
 */
function setupAutoSave() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return;
        
        setInterval(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem('patient-form-data', JSON.stringify(data));
        }, 30000); // Auto-guardar cada 30 segundos
        
        console.log('✅ Auto-guardado configurado');
    } catch (error) {
        console.error('Error configurando auto-guardado:', error);
    }
}

/**
 * Carga datos guardados previamente
 */
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('patient-form-data');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'radio' || field.type === 'checkbox') {
                    field.checked = field.value === data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
        
        console.log('📦 Datos guardados cargados');
    } catch (error) {
        console.error('Error cargando datos guardados:', error);
    }
}

/**
 * Limpia los datos guardados
 */
function clearSavedData() {
    localStorage.removeItem('patient-form-data');
}

/**
 * Resetea el formulario completamente
 */
window.resetForm = function() {
    try {
        const form = document.getElementById('patient-form');
        if (form) {
            form.reset();
            currentFormStep = 1;
            showFormStep(1);
            clearSavedData();
            
            // Limpiar clases de error
            const errorFields = form.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));

            // Resetear elementos específicos
            const infoEmailContainer = document.getElementById('info-email-container');
            const basicInfoContainer = document.getElementById('basic-info-container');
            const nextBtn = document.getElementById('next-step-1');
            const submitBtn = document.getElementById('submit-step-1');
            
            if (infoEmailContainer) infoEmailContainer.style.display = 'none';
            if (basicInfoContainer) basicInfoContainer.style.display = 'block';
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (submitBtn) submitBtn.style.display = 'none';

            // Resetear slider de motivación
            const motivacionRange = document.getElementById('motivacion-range');
            const motivacionValue = document.getElementById('motivacion-value');
            if (motivacionRange && motivacionValue) {
                motivacionRange.value = 5;
                motivacionValue.textContent = '5';
                motivacionValue.style.backgroundColor = '#f59e0b';
            }
        }
        
        console.log('🔄 Formulario reseteado');
    } catch (error) {
        console.error('Error resetting form:', error);
    }
};

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(e) {
    if (e) e.preventDefault();
    
    try {
        console.log('📤 Enviando formulario...');
        
        const form = document.getElementById('patient-form');
        if (!form) {
            throw new Error('Formulario no encontrado');
        }

        const formData = collectFormData(form);
        
        // Validar según el tipo de solicitud
        const tipoSolicitud = formData.tipoSolicitud;
        
        if (tipoSolicitud === 'informacion') {
            await handleInfoRequest(formData);
        } else {
            // Validar formulario completo
            if (!validateCompleteForm()) {
                return false;
            }
            await handleFullRequest(formData);
        }
        
        console.log('✅ Formulario enviado exitosamente');
        
    } catch (error) {
        console.error('❌ Error enviando formulario:', error);
        if (window.showNotification) {
            window.showNotification('Error al enviar formulario: ' + error.message, 'error');
        }
    }
}

/**
 * Recolecta todos los datos del formulario
 */
function collectFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Manejar checkboxes múltiples (sustancias)
    const sustancias = [];
    const sustanciaInputs = form.querySelectorAll('input[name="sustancias"]:checked');
    sustanciaInputs.forEach(input => {
        sustancias.push(input.value);
    });
    data.sustancias = sustancias;
    
    return data;
}

/**
 * Maneja solicitud solo de información
 */
async function handleInfoRequest(formData) {
    const email = formData['info-email'] || formData.email;
    
    if (!email) {
        if (window.showNotification) {
            window.showNotification('Por favor ingresa un email válido', 'warning');
        }
        return;
    }
    
    // Simular envío de información
    if (window.showNotification) {
        window.showNotification('Información enviada a tu email. Revisa tu bandeja de entrada.', 'success');
    }
    
    setTimeout(() => {
        window.resetForm();
        if (window.closeModal) {
            window.closeModal('patient-modal');
        }
    }, 2000);
}

/**
 * Maneja solicitud completa
 */
async function handleFullRequest(formData) {
    try {
        // Preparar datos para guardar
        const solicitudData = {
            ...formData,
            timestamp: new Date().toISOString(),
            status: 'pendiente',
            prioridad: calculatePriority(formData),
            origen: 'web_publica',
            version: '2.0'
        };
        
        // Intentar guardar en Firebase si está disponible
        if (window.getFirestore) {
            const db = window.getFirestore();
            if (db) {
                await saveToFirebase(solicitudData);
            } else {
                // Guardar localmente como fallback
                saveToLocalStorage(solicitudData);
            }
        } else {
            saveToLocalStorage(solicitudData);
        }
        
        if (window.showNotification) {
            window.showNotification('Solicitud enviada correctamente. Te contactaremos pronto.', 'success');
        }
        
        setTimeout(() => {
            window.resetForm();
            if (window.closeModal) {
                window.closeModal('patient-modal');
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error processing full request:', error);
        throw error;
    }
}

/**
 * Calcula la prioridad de la solicitud
 */
function calculatePriority(formData) {
    let score = 0;
    
    // Nivel de urgencia
    if (formData.urgencia === 'alta') score += 3;
    else if (formData.urgencia === 'media') score += 2;
    else score += 1;
    
    // Motivación alta
    const motivacion = parseInt(formData.motivacion) || 5;
    if (motivacion >= 8) score += 2;
    else if (motivacion >= 6) score += 1;
    
    // Múltiples sustancias
    if (Array.isArray(formData.sustancias) && formData.sustancias.length > 1) {
        score += 1;
    }
    
    // Determinar prioridad final
    if (score >= 5) return 'alta';
    else if (score >= 3) return 'media';
    else return 'baja';
}

/**
 * Guarda en Firebase
 */
async function saveToFirebase(data) {
    try {
        const db = window.getFirestore();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        
        const timestamp = window.getServerTimestamp ? window.getServerTimestamp() : new Date();
        
        const docRef = await db.collection('solicitudes').add({
            ...data,
            fechaCreacion: timestamp,
            fechaUltimaActualizacion: timestamp
        });
        
        console.log('✅ Solicitud guardada en Firebase:', docRef.id);
        clearSavedData();
        
    } catch (error) {
        console.error('❌ Error guardando en Firebase:', error);
        throw error;
    }
}

/**
 * Guarda en localStorage como fallback
 */
function saveToLocalStorage(data) {
    try {
        const solicitudes = JSON.parse(localStorage.getItem('solicitudes_locales') || '[]');
        solicitudes.push({
            ...data,
            id: 'local_' + Date.now(),
            fechaCreacion: new Date().toISOString()
        });
        localStorage.setItem('solicitudes_locales', JSON.stringify(solicitudes));
        clearSavedData();
        
        console.log('💾 Solicitud guardada localmente');
    } catch (error) {
        console.error('Error guardando localmente:', error);
        throw error;
    }
}

/**
 * Valida el formulario completo
 */
function validateCompleteForm() {
    // Validar todos los pasos
    for (let step = 1; step <= maxFormStep; step++) {
        currentFormStep = step;
        if (!validateCurrentStep()) {
            showFormStep(step);
            return false;
        }
    }
    return true;
}

/**
 * Verifica si hay cambios sin guardar
 */
window.hasUnsavedChanges = function() {
    try {
        const form = document.getElementById('patient-form');
        if (!form) return false;
        
        const formData = new FormData(form);
        let hasData = false;
        
        for (let [key, value] of formData.entries()) {
            if (value && value.toString().trim() !== '') {
                hasData = true;
                break;
            }
        }
        
        return hasData;
    } catch (error) {
        console.error('Error checking unsaved changes:', error);
        return false;
    }
};

console.log('📝 Sistema de formularios cargado - Funciones disponibles en window');
