(function setupReentryForm() {
    try {
        console.log('🔧 Configurando formulario de reingreso...');
        
        const reentryForm = document.getElementById('reentry-form');
        if (reentryForm) {
            reentryForm.addEventListener('submit', handleReentrySubmit);
            setupReentryFormValidation();
            console.log('✅ Formulario de reingreso configurado');
        } else {
            console.warn('⚠️ Formulario de reingreso no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error configurando formulario de reingreso:', error);
    }
}

/**
 * Configura la validación en tiempo real del formulario
 */
function setupReentryFormValidation() {
    try {
        const form = document.getElementById('reentry-form');
        if (!form) return;

        // Formateo de RUT
        const rutInput = document.getElementById('reentry-rut');
        if (rutInput) {
            rutInput.addEventListener('input', (e) => {
                e.target.value = formatRUT(e.target.value);
            });

            rutInput.addEventListener('blur', (e) => {
                const rut = e.target.value.trim();
                if (rut && !validateRUT(rut)) {
                    e.target.classList.add('error');
                    showValidationError(e.target, 'RUT inválido');
                } else {
                    e.target.classList.remove('error');
                    clearValidationError(e.target);
                }
            });
        }

        // Formateo de teléfono
        const phoneInput = document.getElementById('reentry-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
            });

            phoneInput.addEventListener('blur', (e) => {
                const phone = e.target.value.trim();
                if (phone && !validatePhoneNumberString(phone)) {
                    e.target.classList.add('error');
                    showValidationError(e.target, 'Teléfono inválido');
                } else {
                    e.target.classList.remove('error');
                    clearValidationError(e.target);
                }
            });
        }

        // Validación de campos requeridos
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', (e) => {
                validateRequiredField(e.target);
            });
        });

        console.log('✅ Validación en tiempo real configurada');
        
    } catch (error) {
        console.error('Error configurando validación:', error);
    }
}

/**
 * Valida un campo requerido
 */
function validateRequiredField(field) {
    const value = field.value.trim();
    const fieldName = getFieldName(field);
    
    if (!value) {
        field.classList.add('error');
        showValidationError(field, `${fieldName} es obligatorio`);
        return false;
    } else {
        field.classList.remove('error');
        clearValidationError(field);
        return true;
    }
}

/**
 * Muestra error de validación
 */
function showValidationError(field, message) {
    clearValidationError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

/**
 * Limpia error de validación
 */
function clearValidationError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Obtiene el nombre del campo
 */
function getFieldName(field) {
    const label = field.closest('.form-group')?.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : 'Campo';
}

/**
 * Valida número de teléfono
 */
function validatePhoneNumberString(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Maneja el envío del formulario de reingreso
 */
async function handleReentrySubmit(e) {
    e.preventDefault();
    
    console.log('🔄 Iniciando proceso de reingreso...');
    
    try {
        const formData = extractReentryFormData();
        
        if (!validateReentryForm(formData)) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleSubmitButton(submitBtn, true);
        
        // Verificar si ya existe una solicitud pendiente
        const existingRequest = await checkExistingReentryRequest(formData.rut);
        if (existingRequest) {
            showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
            return;
        }
        
        const db = getFirestore();
        const reingresoData = createReingresoData(formData);
        
        const docRef = await retryFirestoreOperation(async () => {
            return await db.collection('reingresos').add(reingresoData);
        });
        
        console.log('✅ Solicitud de reingreso guardada con ID:', docRef.id);
        
        showNotification(
            `Solicitud de reingreso enviada correctamente. Te contactaremos pronto al ${formData.telefono}.`,
            'success',
            6000
        );
        
        // Limpiar formulario y cerrar modal
        e.target.reset();
        clearAllValidationErrors();
        closeModal('reentry-modal');
        
    } catch (error) {
        console.error('❌ Error enviando solicitud de reingreso:', error);
        
        const errorMessage = getReentryErrorMessage(error);
        showNotification(errorMessage, 'error');
        
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Extrae los datos del formulario de reingreso
 */
function extractReentryFormData() {
    return {
        nombre: document.getElementById('reentry-name')?.value?.trim() || '',
        rut: document.getElementById('reentry-rut')?.value?.trim() || '',
        telefono: document.getElementById('reentry-phone')?.value?.trim() || '',
        cesfam: document.getElementById('reentry-cesfam')?.value || '',
        motivo: document.getElementById('reentry-reason')?.value?.trim() || ''
    };
}

/**
 * Valida el formulario de reingreso
 */
function validateReentryForm(formData) {
    console.log('🔍 Validando formulario de reingreso...', { ...formData, motivo: formData.motivo.substring(0, 50) + '...' });
    
    const requiredFields = [
        { field: 'nombre', name: 'Nombre completo' },
        { field: 'rut', name: 'RUT' },
        { field: 'telefono', name: 'Teléfono' },
        { field: 'cesfam', name: 'CESFAM' },
        { field: 'motivo', name: 'Motivo del reingreso' }
    ];

    // Validar campos requeridos
    for (const { field, name } of requiredFields) {
        if (!formData[field]) {
            showNotification(`El campo ${name} es obligatorio`, 'warning');
            focusField(`reentry-${field === 'nombre' ? 'name' : field === 'motivo' ? 'reason' : field}`);
            return false;
        }
    }

    // Validar RUT
    if (!validateRUT(formData.rut)) {
        showNotification('RUT inválido', 'warning');
        focusField('reentry-rut');
        return false;
    }

    // Validar teléfono
    if (!validatePhoneNumberString(formData.telefono)) {
        showNotification('Teléfono inválido', 'warning');
        focusField('reentry-phone');
        return false;
    }

    // Validar longitud del motivo
    if (formData.motivo.length < 10) {
        showNotification('El motivo debe tener al menos 10 caracteres', 'warning');
        focusField('reentry-reason');
        return false;
    }

    console.log('✅ Formulario de reingreso validado correctamente');
    return true;
}

/**
 * Enfoca un campo específico
 */
function focusField(fieldId) {
    setTimeout(() => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.focus();
            field.classList.add('error');
        }
    }, 100);
}

/**
 * Verifica si ya existe una solicitud de reingreso pendiente
 */
async function checkExistingReentryRequest(rut) {
    try {
        const db = getFirestore();
        const rutFormatted = formatRUT(rut);
        
        const query = db.collection('reingresos')
            .where('rut', '==', rutFormatted)
            .where('estado', '==', 'pendiente')
            .limit(1);
            
        const snapshot = await query.get();
        return !snapshot.empty;
        
    } catch (error) {
        console.warn('⚠️ Error verificando solicitudes existentes:', error);
        return false;
    }
}

/**
 * Crea el objeto de datos para el reingreso
 */
function createReingresoData(formData) {
    return {
        // Datos del solicitante
        nombre: formData.nombre,
        rut: formatRUT(formData.rut),
        telefono: formatPhoneNumber(formData.telefono),
        cesfam: formData.cesfam,
        
        // Solicitud
        motivo: formData.motivo,
        tipo: 'reingreso',
        
        // Estado y clasificación
        estado: 'pendiente',
        prioridad: calculateReentryPriority(formData),
        
        // Metadata
        origen: 'web_publica',
        version: '2.0',
        fechaCreacion: getServerTimestamp(),
        fechaUltimaActualizacion: getServerTimestamp(),
        
        // Campos opcionales inicializados
        profesionalAsignado: null,
        fechaRespuesta: null,
        observaciones: null,
        documentosAdjuntos: []
    };
}

/**
 * Calcula la prioridad del reingreso
 */
function calculateReentryPriority(formData) {
    let score = 0;
    
    // Análisis del motivo
    const motivoLower = formData.motivo.toLowerCase();
    const palabrasUrgentes = ['urgente', 'crisis', 'emergencia', 'recaída', 'peligro'];
    const palabrasAlta = ['problema', 'necesito', 'ayuda', 'difícil', 'complicado'];
    
    if (palabrasUrgentes.some(palabra => motivoLower.includes(palabra))) {
        score += 3;
    } else if (palabrasAlta.some(palabra => motivoLower.includes(palabra))) {
        score += 2;
    } else {
        score += 1;
    }
    
    // Longitud del motivo (más detalle = más urgencia percibida)
    if (formData.motivo.length > 200) score += 2;
    else if (formData.motivo.length > 100) score += 1;
    
    // Determinar prioridad
    if (score >= 5) return 'alta';
    else if (score >= 3) return 'media';
    else return 'baja';
}

/**
 * Obtiene el mensaje de error apropiado
 */
function getReentryErrorMessage(error) {
    let errorMessage = 'Error al enviar la solicitud de reingreso';
    
    if (error.code === 'permission-denied') {
        errorMessage += ': Sin permisos para crear solicitudes de reingreso';
    } else if (error.code === 'network-request-failed') {
        errorMessage += ': Problema de conexión. Verifica tu internet';
    } else if (error.code === 'unavailable') {
        errorMessage += ': Servicio temporalmente no disponible';
    } else if (error.message) {
        errorMessage += ': ' + error.message;
    } else {
        errorMessage += '. Intenta nuevamente en unos momentos';
    }
    
    return errorMessage;
}

/**
 * Limpia todos los errores de validación
 */
function clearAllValidationErrors() {
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
}

/**
 * Muestra información sobre el proceso de reingreso
 */
function showReentryInfo() {
    const infoContent = `
        <div class="reentry-info">
            <h3>¿Qué es el reingreso?</h3>
            <p>El reingreso es para personas que ya estuvieron en tratamiento en SENDA y desean volver al programa.</p>
            
            <h4>¿Cuándo puedes solicitar reingreso?</h4>
            <ul>
                <li>Si completaste un tratamiento previo pero necesitas apoyo adicional</li>
                <li>Si abandonaste el tratamiento y quieres retomarlo</li>
                <li>Si ha pasado tiempo desde tu último tratamiento y necesitas ayuda nuevamente</li>
            </ul>
            
            <h4>¿Qué necesitas?</h4>
            <ul>
                <li>RUT válido</li>
                <li>Teléfono de contacto</li>
                <li>Explicar detalladamente tu motivo para el reingreso</li>
            </ul>
            
            <h4>¿Qué pasa después?</h4>
            <p>Un profesional de SENDA se contactará contigo en un plazo máximo de 48 horas para coordinar una evaluación y determinar el mejor plan de tratamiento.</p>
            
            <div class="contact-emergency">
                <strong>En caso de emergencia:</strong><br>
                SENDA: 1412 (gratuito)<br>
                SAPU: 131<br>
                Emergencias: 132
            </div>
        </div>
    `;
    
    // Mostrar modal con información
    const { createModal, showModal } = require('../utilidades/modales.js');
    const modal = createModal('reentry-info-modal', 'Información sobre Reingreso', infoContent);
    if (modal) {
        showModal('reentry-info-modal');
    }
}

/**
 * Resetea el formulario de reingreso
 */
function resetReentryForm() {
    try {
        const form = document.getElementById('reentry-form');
        if (form) {
            form.reset();
            clearAllValidationErrors();
        }
        console.log('Formulario de reingreso reseteado');
    } catch (error) {
        console.error('Error reseteando formulario de reingreso:', error);
    }
}

/**
 * Pre-llena el formulario con datos conocidos (si aplica)
 */
 function prefillReentryForm(userData) {
    try {
        if (!userData) return;
        
        const fields = {
            'reentry-name': userData.nombre,
            'reentry-rut': userData.rut,
            'reentry-phone': userData.telefono,
            'reentry-cesfam': userData.cesfam
        };
        
        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && fields[fieldId]) {
                field.value = fields[fieldId];
            }
        });
        
        console.log('Formulario de reingreso pre-llenado');
        
    } catch (error) {
        console.error('Error pre-llenando formulario:', error);
    }
}

/**
 * Valida y formatea datos en tiempo real
 */
function setupRealtimeFormatting() {
    try {
        const rutField = document.getElementById('reentry-rut');
        const phoneField = document.getElementById('reentry-phone');
        
        if (rutField) {
            rutField.addEventListener('input', (e) => {
                e.target.value = formatRUT(e.target.value);
            });
        }
        
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
        
    } catch (error) {
        console.error('Error configurando formateo en tiempo real:', error);
    }
}
    window.setupReentryForm = setupReentryForm;
    window.resetReentryForm = resetReentryForm;
    window.prefillReentryForm = prefillReentryForm;
    window.showReentryInfo = showReentryInfo;
    window.setupRealtimeFormatting = setupRealtimeFormatting;
