//**
 * NAVEGACION/EVENTOS.JS - VERSIÓN SIN IMPORTS
 * Configuración de eventos globales
 */

window.setupEventListeners = function() {
    try {
        console.log('🔧 Configurando event listeners globales...');
        
        setupHeaderEventListeners();
        setupModalEventListeners();
        setupFormEventListeners();
        setupKeyboardEventListeners();
        setupGlobalClickHandlers();
        
        console.log('✅ Event listeners globales configurados');
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
};

/**
 * Configura los event listeners del header
 */
function setupHeaderEventListeners() {
    try {
        // Botón de login profesional
        const loginProfessionalBtn = document.getElementById('login-professional');
        if (loginProfessionalBtn) {
            loginProfessionalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Click en botón login detectado');
                if (window.switchLoginTab) {
                    window.switchLoginTab('login');
                }
                if (window.showModal) {
                    window.showModal('login-modal');
                }
            });
            console.log('✅ Event listener agregado al botón login');
        } else {
            console.warn('⚠️ Botón login-professional no encontrado');
        }

        // Botón de logout
        const logoutBtn = document.getElementById('logout-professional');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.handleLogout) {
                    window.handleLogout();
                }
            });
        }

        // Botón de registro de paciente - múltiples IDs posibles
        const registerPatientBtns = [
            document.getElementById('register-patient'),
            document.getElementById('registro-paciente'),
            ...document.querySelectorAll('[data-modal="patient-modal"]')
        ].filter(Boolean);

        registerPatientBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Click en botón registro paciente detectado');
                if (window.resetForm) {
                    window.resetForm();
                }
                if (window.showModal) {
                    window.showModal('patient-modal');
                }
            });
        });

        // Botón de reingreso - múltiples IDs posibles
        const reentryProgramBtns = [
            document.getElementById('reentry-program'),
            document.getElementById('reingreso-programa'),
            ...document.querySelectorAll('[data-modal="reentry-modal"]')
        ].filter(Boolean);

        reentryProgramBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Click en botón reingreso detectado');
                if (window.showModal) {
                    window.showModal('reentry-modal');
                }
            });
        });

        // Botón de información del programa
        const aboutProgramBtns = [
            document.getElementById('about-program'),
            document.getElementById('sobre-programa'),
            ...document.querySelectorAll('[data-action="show-about"]')
        ].filter(Boolean);

        aboutProgramBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showAboutProgram();
            });
        });
        
    } catch (error) {
        console.error('Error setting up header event listeners:', error);
    }
}

/**
 * Configura los event listeners específicos de modales
 */
function setupModalEventListeners() {
    try {
        // Event listeners para cerrar modales con clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modalId = e.target.id;
                if (modalId && window.closeModal) {
                    window.closeModal(modalId);
                }
            }
        });

        // Event listeners para botones de cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal && modal.id && window.closeModal) {
                    window.closeModal(modal.id);
                }
            });
        });
        
    } catch (error) {
        console.error('Error setting up modal event listeners:', error);
    }
}

/**
 * Configura los event listeners de formularios
 */
function setupFormEventListeners() {
    try {
        setupLoginForm();
        setupRegisterForm();
        setupReentryForm();
        
        // Event listeners para tabs de login
        setupLoginTabSwitching();
        
    } catch (error) {
        console.error('Error setting up form event listeners:', error);
    }
}

/**
 * Configura el login form
 */
function setupLoginForm() {
    try {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginSubmit);
            setupLoginValidation();
            console.log('✅ Formulario de login configurado');
        } else {
            console.warn('⚠️ Formulario de login no encontrado');
        }
    } catch (error) {
        console.error('Error configurando login form:', error);
    }
}

/**
 * Maneja el envío del formulario de login
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('🔑 Iniciando proceso de login...');
        
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value?.trim();
        
        // Validaciones básicas
        if (!email || !password) {
            if (window.showNotification) {
                window.showNotification('Completa todos los campos', 'warning');
            }
            return;
        }
        
        if (!email.endsWith('@senda.cl')) {
            if (window.showNotification) {
                window.showNotification('Solo se permiten emails @senda.cl', 'warning');
            }
            return;
        }
        
        if (password.length < 6) {
            if (window.showNotification) {
                window.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            }
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        toggleSubmitButton(submitBtn, true);
        
        console.log('🔐 Autenticando usuario:', email);
        
        // Intentar login con Firebase Auth
        const auth = window.getAuth();
        if (!auth) {
            throw new Error('Sistema de autenticación no disponible');
        }
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        console.log('✅ Login exitoso para:', userCredential.user.uid);
        
        // Limpiar formulario
        e.target.reset();
        
        // Cerrar modal
        if (window.closeModal) {
            window.closeModal('login-modal');
        }
        
        if (window.showNotification) {
            window.showNotification('¡Bienvenido al sistema SENDA!', 'success');
        }
        
        // La actualización de la UI se maneja automáticamente por onAuthStateChanged
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        const errorMessage = getLoginErrorMessage(error.code);
        if (window.showNotification) {
            window.showNotification(errorMessage, 'error');
        }
        
        // Enfocar campo apropiado según el error
        if (error.code === 'auth/user-not-found') {
            document.getElementById('login-email')?.focus();
        } else if (error.code === 'auth/wrong-password') {
            document.getElementById('login-password')?.focus();
        }
        
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Configura validación de login
 */
function setupLoginValidation() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (emailInput) {
        emailInput.addEventListener('input', (e) => {
            validateEmailField(e.target);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            validatePasswordField(e.target);
        });
    }
}

/**
 * Valida campo de email
 */
function validateEmailField(input) {
    const email = input.value.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (email && !isValidEmail) {
        input.classList.add('error');
        showFieldError(input, 'Email inválido');
    } else if (email && !email.endsWith('@senda.cl')) {
        input.classList.add('error');
        showFieldError(input, 'Debe ser un email @senda.cl');
    } else {
        input.classList.remove('error');
        clearFieldError(input);
    }
}

/**
 * Valida campo de contraseña
 */
function validatePasswordField(input) {
    const password = input.value;
    
    if (password && password.length < 6) {
        input.classList.add('error');
        showFieldError(input, 'Mínimo 6 caracteres');
    } else {
        input.classList.remove('error');
        clearFieldError(input);
    }
}

/**
 * Muestra error en campo
 */
function showFieldError(input, message) {
    let errorElement = input.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

/**
 * Limpia error del campo
 */
function clearFieldError(input) {
    const errorElement = input.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Configura el register form
 */
function setupRegisterForm() {
    try {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegisterSubmit);
            setupRegisterValidation();
            console.log('✅ Formulario de registro configurado');
        } else {
            console.warn('⚠️ Formulario de registro no encontrado');
        }
    } catch (error) {
        console.error('Error configurando register form:', error);
    }
}

/**
 * Maneja el envío del formulario de registro
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    console.log('🔧 Iniciando proceso de registro...');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        // Extraer datos del formulario
        const formData = extractFormData();
        
        // Validar datos
        if (!validateFormData(formData)) {
            return;
        }
        
        // Mostrar loading
        toggleSubmitButton(submitBtn, true);
        if (window.showNotification) {
            window.showNotification('Registrando usuario...', 'info');
        }
        
        console.log('👤 Creando usuario en Firebase Auth...');
        
        // Crear usuario en Firebase Auth
        const auth = window.getAuth();
        if (!auth) {
            throw new Error('Sistema de autenticación no disponible');
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const user = userCredential.user;
        
        console.log('✅ Usuario creado en Auth:', user.uid);
        
        // Actualizar perfil del usuario
        await user.updateProfile({
            displayName: `${formData.nombre} ${formData.apellidos}`
        });
        
        // Guardar datos del profesional en Firestore
        await saveProfessionalData(user.uid, formData);
        
        console.log('✅ Usuario registrado exitosamente');
        
        // Éxito
        if (window.showNotification) {
            window.showNotification('Registro exitoso. Bienvenido al sistema SENDA', 'success');
        }
        
        // Limpiar formulario y cerrar modal
        e.target.reset();
        if (window.closeModal) {
            window.closeModal('login-modal');
        }
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        const errorMessage = getRegisterErrorMessage(error.code || error.message);
        if (window.showNotification) {
            window.showNotification(errorMessage, 'error');
        }
        
    } finally {
        toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Extrae datos del formulario de registro
 */
function extractFormData() {
    return {
        nombre: document.getElementById('register-nombre')?.value?.trim() || '',
        apellidos: document.getElementById('register-apellidos')?.value?.trim() || '',
        email: document.getElementById('register-email')?.value?.trim() || '',
        password: document.getElementById('register-password')?.value || '',
        profession: document.getElementById('register-profession')?.value || '',
        cesfam: document.getElementById('register-cesfam')?.value || ''
    };
}

/**
 * Valida los datos del formulario
 */
function validateFormData(formData) {
    console.log('🔍 Validando datos del formulario...', { ...formData, password: '***' });
    
    // Campos requeridos
    const requiredFields = [
        { field: 'nombre', name: 'Nombre' },
        { field: 'apellidos', name: 'Apellidos' },
        { field: 'email', name: 'Email' },
        { field: 'password', name: 'Contraseña' },
        { field: 'profession', name: 'Profesión' },
        { field: 'cesfam', name: 'CESFAM' }
    ];
    
    for (const { field, name } of requiredFields) {
        if (!formData[field]) {
            if (window.showNotification) {
                window.showNotification(`El campo ${name} es obligatorio`, 'warning');
            }
            focusField(`register-${field === 'profession' ? 'profession' : field === 'cesfam' ? 'cesfam' : field}`);
            return false;
        }
    }
    
    // Validar email
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!isValidEmail) {
        if (window.showNotification) {
            window.showNotification('Email inválido', 'warning');
        }
        focusField('register-email');
        return false;
    }
    
    if (!formData.email.endsWith('@senda.cl')) {
        if (window.showNotification) {
            window.showNotification('Solo se permiten emails @senda.cl', 'warning');
        }
        focusField('register-email');
        return false;
    }
    
    // Validar contraseña
    if (formData.password.length < 6) {
        if (window.showNotification) {
            window.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        }
        focusField('register-password');
        return false;
    }
    
    return true;
}

/**
 * Guarda datos del profesional en Firestore
 */
async function saveProfessionalData(userId, formData) {
    console.log('💾 Guardando datos del profesional en Firestore...');
    
    const db = window.getFirestore();
    if (!db) {
        throw new Error('Base de datos no disponible');
    }
    
    const professionalData = {
        uid: userId,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        profession: formData.profession,
        especialidad: getProfessionName(formData.profession),
        cesfam: formData.cesfam,
        activo: true,
        fechaCreacion: window.getServerTimestamp(),
        fechaUltimaActividad: window.getServerTimestamp(),
        permisos: {
            solicitudes: formData.profession === 'asistente_social',
            agenda: true,
            pacientes: true,
            seguimiento: true
        },
        configuracion: {
            notificaciones: true,
            alertasCriticas: formData.profession === 'asistente_social',
            horariosDisponibles: []
        }
    };
    
    try {
        if (window.retryFirestoreOperation) {
            await window.retryFirestoreOperation(async () => {
                await db.collection('profesionales').doc(userId).set(professionalData);
            });
        } else {
            await db.collection('profesionales').doc(userId).set(professionalData);
        }
        
        console.log('✅ Profesional guardado en Firestore');
        
    } catch (error) {
        console.error('❌ Error guardando profesional:', error);
        throw error;
    }
}

/**
 * Obtiene el nombre completo de la profesión
 */
function getProfessionName(professionCode) {
    const professions = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional'
    };
    
    return professions[professionCode] || professionCode;
}

/**
 * Enfoca un campo específico
 */
function focusField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.focus();
        field.classList.add('error');
    }
}

/**
 * Configura validación de registro
 */
function setupRegisterValidation() {
    // Implementación básica de validación
}

/**
 * Configura el reentry form
 */
function setupReentryForm() {
    try {
        const reentryForm = document.getElementById('reentry-form');
        if (reentryForm) {
            reentryForm.addEventListener('submit', handleReentrySubmit);
            console.log('✅ Formulario de reingreso configurado');
        } else {
            console.warn('⚠️ Formulario de reingreso no encontrado');
        }
    } catch (error) {
        console.error('Error configurando reentry form:', error);
    }
}

/**
 * Maneja el envío del formulario de reingreso
 */
async function handleReentrySubmit(e) {
    e.preventDefault();
    
    if (window.showNotification) {
        window.showNotification('Función de reingreso en desarrollo', 'info');
    }
}

/**
 * Configura el cambio entre tabs de login
 */
function setupLoginTabSwitching() {
    try {
        const loginTab = document.querySelector('.modal-tab[onclick*="login"]');
        const registerTab = document.querySelector('.modal-tab[onclick*="register"]');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => {
                if (window.switchLoginTab) {
                    window.switchLoginTab('login');
                }
            });
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => {
                if (window.switchLoginTab) {
                    window.switchLoginTab('register');
                }
            });
        }
        
    } catch (error) {
        console.error('Error setting up login tab switching:', error);
    }
}

/**
 * Configura los atajos de teclado
 */
function setupKeyboardEventListeners() {
    try {
        document.addEventListener('keydown', (e) => {
            // ESC para cerrar modales
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay[style*="flex"]');
                if (openModal && openModal.id && window.closeModal) {
                    window.closeModal(openModal.id);
                }
            }
            
            // Ctrl/Cmd + K para abrir login (solo en página pública)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                const publicContent = document.getElementById('public-content');
                if (publicContent && publicContent.style.display !== 'none') {
                    e.preventDefault();
                    if (window.showModal) {
                        window.showModal('login-modal');
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error setting up keyboard event listeners:', error);
    }
}

/**
 * Configura manejadores de clicks globales
 */
function setupGlobalClickHandlers() {
    try {
        // Prevenir comportamiento por defecto en enlaces con href="#"
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="#"]');
            if (link) {
                e.preventDefault();
            }
        });

        // Manejo de botones con data-action
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                handleDataAction(action, actionBtn);
            }
        });
        
    } catch (error) {
        console.error('Error setting up global click handlers:', error);
    }
}

/**
 * Maneja acciones basadas en data-action
 */
function handleDataAction(action, element) {
    try {
        switch (action) {
            case 'close-modal':
                const modal = element.closest('.modal-overlay');
                if (modal && modal.id && window.closeModal) {
                    window.closeModal(modal.id);
                }
                break;
                
            case 'show-login':
                if (window.showModal) {
                    window.showModal('login-modal');
                }
                break;
                
            case 'show-register':
                if (window.switchLoginTab) {
                    window.switchLoginTab('register');
                }
                if (window.showModal) {
                    window.showModal('login-modal');
                }
                break;
                
            case 'logout':
                if (window.handleLogout) {
                    window.handleLogout();
                }
                break;
                
            default:
                console.warn(`Acción no reconocida: ${action}`);
        }
    } catch (error) {
        console.error('Error handling data action:', error);
    }
}

/**
 * Muestra información sobre el programa
 */
function showAboutProgram() {
    try {
        const aboutModal = createAboutProgramModal();
        document.body.insertAdjacentHTML('beforeend', aboutModal);
        if (window.showModal) {
            window.showModal('about-modal');
        }
    } catch (error) {
        console.error('Error showing about program:', error);
    }
}

/**
 * Crea el modal de información del programa
 */
function createAboutProgramModal() {
    return `
        <div class="modal-overlay temp-modal" id="about-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="closeModal('about-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
                    
                    <div style="line-height: 1.6; color: var(--text-dark);">
                        <p><strong>SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)</strong> es el organismo del Gobierno de Chile encargado de elaborar las políticas de prevención del consumo de drogas y alcohol, así como de tratamiento, rehabilitación e integración social de las personas afectadas por estas sustancias.</p>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Nuestros Servicios</h3>
                        <ul style="margin-left: 20px;">
                            <li>Tratamiento ambulatorio básico e intensivo</li>
                            <li>Tratamiento residencial</li>
                            <li>Programas de reinserción social</li>
                            <li>Apoyo familiar y comunitario</li>
                            <li>Prevención en establecimientos educacionales</li>
                            <li>Capacitación a profesionales</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Horarios de Atención</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
                            <li><strong>Sábados y Domingos:</strong> 09:00 - 12:30</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Contacto</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Teléfono:</strong> 1412 (gratuito)</li>
                            <li><strong>Emergencias:</strong> 131</li>
                            <li><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a></li>
                        </ul>
                        
                        <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px;">
                            <p style="margin: 0; font-style: italic; text-align: center;">
                                "Tu recuperación es posible. Estamos aquí para acompañarte en cada paso del camino."
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="closeModal('about-modal')">
                            <i class="fas fa-check"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Alterna el estado de un botón de envío
 */
function toggleSubmitButton(button, isLoading) {
    if (!button) return;
    
    try {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
                button.removeAttribute('data-original-text');
            }
        }
    } catch (error) {
        console.error('Error toggling submit button:', error);
    }
}

/**
 * Obtiene mensaje de error de login apropiado
 */
function getLoginErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No existe una cuenta con este email',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/invalid-credential': 'Credenciales inválidas'
    };
    
    return errorMessages[errorCode] || 'Error al iniciar sesión. Intenta nuevamente.';
}

/**
 * Obtiene mensaje de error apropiado para registro
 */
function getRegisterErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Registro no permitido',
        'auth/weak-password': 'Contraseña muy débil',
        'permission-denied': 'Sin permisos para crear el perfil profesional',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
    };
    
    return `Error al registrarse: ${errorMessages[errorCode] || 'Error desconocido'}`;
}

console.log('⚡ Sistema de eventos cargado - Funciones disponibles en window');
