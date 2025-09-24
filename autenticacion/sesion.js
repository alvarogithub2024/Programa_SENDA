/**
 * AUTENTICACION/SESION.JS
 * Sistema completo de manejo de sesión de usuario - VERSIÓN CORREGIDA
 */

import { getAuth, getFirestore, retryFirestoreOperation } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { getCachedData, setCachedData, clearUserCache } from '../utilidades/cache.js';
import { setCurrentUserData } from '../navegacion/tabs.js';

let currentUser = null;
let currentUserData = null;
let authInitialized = false;

/**
 * Configura el sistema de autenticación
 */
export function setupAuth() {
    try {
        console.log('🔧 Configurando sistema de autenticación...');
        
        const auth = getAuth();
        if (!auth) {
            throw new Error('Firebase Auth no inicializado');
        }
        
        // Configurar observer de estado de autenticación
        auth.onAuthStateChanged(onAuthStateChanged);
        
        // Configurar listeners de sesión
        setupSessionListeners();
        
        authInitialized = true;
        console.log('✅ Sistema de autenticación configurado');
        
    } catch (error) {
        console.error('❌ Error configurando autenticación:', error);
        showNotification('Error en configuración de autenticación', 'error');
    }
}

/**
 * Maneja los cambios en el estado de autenticación
 */
async function onAuthStateChanged(user) {
    try {
        console.log('🔄 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
        
        // Mostrar indicador de carga
        showAuthLoading(true);
        
        if (user) {
            currentUser = user;
            await handleUserAuthenticated(user);
        } else {
            await handleUserLoggedOut();
        }
        
    } catch (error) {
        console.error('❌ Error en cambio de estado de autenticación:', error);
        showNotification('Error en autenticación: ' + error.message, 'error');
        
        // En caso de error, mostrar contenido público
        await handleUserLoggedOut();
    } finally {
        showAuthLoading(false);
    }
}

/**
 * Maneja cuando el usuario está autenticado
 */
async function handleUserAuthenticated(user) {
    try {
        console.log('👤 Usuario autenticado, cargando datos...');
        
        // Verificar email verificado (opcional)
        if (!user.emailVerified && user.email && user.email.includes('@senda.cl')) {
            console.warn('⚠️ Email no verificado para:', user.email);
            // Continúar de todas formas para desarrollo
        }
        
        // Cargar datos del profesional
        const userData = await loadProfessionalData(user.uid);
        
        if (!userData) {
            throw new Error('No se encontraron datos del profesional');
        }
        
        currentUserData = userData;
        
        // Mostrar contenido profesional
        showProfessionalContent();
        
        // Actualizar información en la UI
        updateProfessionalInfo();
        
        // Configurar tabs según permisos
        if (typeof setCurrentUserData === 'function') {
            setCurrentUserData(userData);
        }
        
        console.log('✅ Usuario autenticado correctamente:', userData.nombre);
        
    } catch (error) {
        console.error('❌ Error manejando usuario autenticado:', error);
        
        let errorMessage = 'Error cargando datos del usuario';
        if (error.message.includes('No se encontraron datos')) {
            errorMessage = 'Perfil de profesional no encontrado. Contacta al administrador.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Sin permisos para acceder a los datos';
        }
        
        showNotification(errorMessage, 'error');
        
        // Cerrar sesión en caso de error crítico
        await handleLogout();
    }
}

/**
 * Maneja cuando el usuario no está autenticado
 */
async function handleUserLoggedOut() {
    try {
        console.log('🚪 Usuario no autenticado');
        
        // Limpiar datos de usuario
        currentUser = null;
        currentUserData = null;
        
        // Limpiar cache
        clearUserCache();
        
        // Mostrar contenido público
        showPublicContent();
        
        console.log('✅ Sesión limpiada correctamente');
        
    } catch (error) {
        console.error('❌ Error manejando logout:', error);
    }
}

/**
 * Carga los datos del profesional desde Firestore
 */
async function loadProfessionalData(userId) {
    try {
        // Verificar cache primero
        const cacheKey = `professional_${userId}`;
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
            console.log('📦 Datos cargados desde cache');
            return cachedData;
        }
        
        // Cargar desde Firestore con reintentos
        const userData = await retryFirestoreOperation(async () => {
            const db = getFirestore();
            const userDoc = await db.collection('profesionales').doc(userId).get();
            
            if (!userDoc.exists) {
                throw new Error(`Profesional no encontrado: ${userId}`);
            }
            
            return {
                uid: userId,
                ...userDoc.data()
            };
        });
        
        // Guardar en cache
        setCachedData(cacheKey, userData);
        
        console.log('📊 Datos del profesional cargados:', userData.nombre);
        return userData;
        
    } catch (error) {
        console.error('❌ Error cargando datos del profesional:', error);
        throw error;
    }
}

/**
 * Muestra el contenido público
 */
function showPublicContent() {
    try {
        const elements = {
            publicContent: document.getElementById('public-content'),
            professionalContent: document.getElementById('professional-content'),
            professionalHeader: document.getElementById('professional-header'),
            loginBtn: document.getElementById('login-professional'),
            logoutBtn: document.getElementById('logout-professional')
        };

        // Mostrar elementos públicos
        if (elements.publicContent) {
            elements.publicContent.style.display = 'block';
        }
        
        if (elements.loginBtn) {
            elements.loginBtn.style.display = 'flex';
        }

        // Ocultar elementos profesionales
        if (elements.professionalContent) {
            elements.professionalContent.style.display = 'none';
        }
        
        if (elements.professionalHeader) {
            elements.professionalHeader.style.display = 'none';
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.style.display = 'none';
        }
        
        console.log('🏠 Contenido público mostrado');
        
    } catch (error) {
        console.error('❌ Error mostrando contenido público:', error);
    }
}

/**
 * Muestra el contenido profesional
 */
function showProfessionalContent() {
    try {
        const elements = {
            publicContent: document.getElementById('public-content'),
            professionalContent: document.getElementById('professional-content'),
            professionalHeader: document.getElementById('professional-header'),
            loginBtn: document.getElementById('login-professional'),
            logoutBtn: document.getElementById('logout-professional')
        };

        // Ocultar elementos públicos
        if (elements.publicContent) {
            elements.publicContent.style.display = 'none';
        }
        
        if (elements.loginBtn) {
            elements.loginBtn.style.display = 'none';
        }

        // Mostrar elementos profesionales
        if (elements.professionalContent) {
            elements.professionalContent.style.display = 'block';
        }
        
        if (elements.professionalHeader) {
            elements.professionalHeader.style.display = 'block';
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.style.display = 'flex';
        }
        
        console.log('👨‍⚕️ Contenido profesional mostrado');
        
    } catch (error) {
        console.error('❌ Error mostrando contenido profesional:', error);
    }
}

/**
 * Actualiza la información del profesional en la interfaz
 */
function updateProfessionalInfo() {
    try {
        if (!currentUserData) {
            console.warn('⚠️ No hay datos de usuario para mostrar');
            return;
        }

        const elements = {
            name: document.getElementById('professional-name'),
            profession: document.getElementById('professional-profession'),
            cesfam: document.getElementById('professional-cesfam'),
            avatar: document.querySelector('.professional-avatar')
        };

        // Actualizar nombre
        if (elements.name) {
            elements.name.textContent = `${currentUserData.nombre || ''} ${currentUserData.apellidos || ''}`.trim();
        }
        
        // Actualizar profesión
        if (elements.profession) {
            elements.profession.textContent = getProfessionDisplayName(currentUserData.profession);
        }
        
        // Actualizar CESFAM
        if (elements.cesfam) {
            elements.cesfam.textContent = currentUserData.cesfam || 'CESFAM no asignado';
        }
        
        // Actualizar avatar con iniciales
        if (elements.avatar && currentUserData.nombre && currentUserData.apellidos) {
            const initials = `${currentUserData.nombre.charAt(0)}${currentUserData.apellidos.charAt(0)}`.toUpperCase();
            elements.avatar.textContent = initials;
        }
        
        console.log('✅ Información del profesional actualizada');
        
    } catch (error) {
        console.error('❌ Error actualizando información del profesional:', error);
    }
}

/**
 * Obtiene el nombre de display de la profesión
 */
function getProfessionDisplayName(profession) {
    const professionNames = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional',
        'enfermero': 'Enfermero/a',
        'nutricionista': 'Nutricionista'
    };
    
    return professionNames[profession] || profession || 'Profesional de la Salud';
}

/**
 * Configura listeners para eventos de sesión
 */
function setupSessionListeners() {
    try {
        // Listener para botón de logout
        const logoutBtn = document.getElementById('logout-professional');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Detectar cuando la pestaña se oculta/muestra para refrescar sesión
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Detectar foco de ventana para validar sesión
        window.addEventListener('focus', handleWindowFocus);
        
        console.log('✅ Session listeners configurados');
        
    } catch (error) {
        console.error('❌ Error configurando session listeners:', error);
    }
}

/**
 * Maneja el cambio de visibilidad de la pestaña
 */
function handleVisibilityChange() {
    try {
        if (!document.hidden && currentUser) {
            // Validar que la sesión sigue activa
            validateCurrentSession();
        }
    } catch (error) {
        console.error('Error en handleVisibilityChange:', error);
    }
}

/**
 * Maneja cuando la ventana recibe el foco
 */
function handleWindowFocus() {
    try {
        if (currentUser) {
            validateCurrentSession();
        }
    } catch (error) {
        console.error('Error en handleWindowFocus:', error);
    }
}

/**
 * Valida la sesión actual
 */
async function validateCurrentSession() {
    try {
        if (!currentUser) return;
        
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
            console.warn('⚠️ Usuario ya no autenticado, limpiando sesión');
            await handleUserLoggedOut();
            return;
        }
        
        // Verificar token (opcional)
        try {
            await user.getIdToken(true); // Forzar refresh del token
        } catch (tokenError) {
            console.warn('⚠️ Error validando token:', tokenError);
            if (tokenError.code === 'auth/user-token-expired') {
                showNotification('Sesión expirada, por favor inicia sesión nuevamente', 'warning');
                await handleLogout();
                return;
            }
        }
        
    } catch (error) {
        console.error('❌ Error validando sesión:', error);
    }
}

/**
 * Cierra la sesión del usuario
 */
export async function handleLogout() {
    try {
        console.log('🚪 Iniciando cierre de sesión...');
        
        showAuthLoading(true, 'Cerrando sesión...');
        
        const auth = getAuth();
        await auth.signOut();
        
        // Limpiar datos locales
        currentUser = null;
        currentUserData = null;
        
        // Limpiar cache
        clearUserCache();
        
        // Limpiar localStorage
        localStorage.clear();
        
        // Mostrar contenido público
        showPublicContent();
        
        showNotification('Sesión cerrada correctamente', 'success');
        
        console.log('✅ Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
        
        // Forzar limpieza aunque haya error
        currentUser = null;
        currentUserData = null;
        clearUserCache();
        showPublicContent();
        
    } finally {
        showAuthLoading(false);
    }
}

/**
 * Muestra/oculta el loading de autenticación
 */
function showAuthLoading(show, message = 'Autenticando...') {
    try {
        let loadingElement = document.getElementById('auth-loading');
        
        if (show) {
            if (!loadingElement) {
                loadingElement = document.createElement('div');
                loadingElement.id = 'auth-loading';
                loadingElement.className = 'auth-loading-overlay';
                loadingElement.innerHTML = `
                    <div class="auth-loading-content">
                        <div class="spinner"></div>
                        <p>${message}</p>
                    </div>
                `;
                document.body.appendChild(loadingElement);
            }
            loadingElement.style.display = 'flex';
        } else {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error mostrando loading de auth:', error);
    }
}

/**
 * Verifica si el usuario tiene permisos para una acción
 */
export function hasPermission(permission) {
    try {
        if (!currentUserData) return false;
        
        const userRole = currentUserData.profession;
        
        switch (permission) {
            case 'view_solicitudes':
                return userRole === 'asistente_social';
            case 'manage_patients':
                return ['asistente_social', 'medico', 'psicologo'].includes(userRole);
            case 'schedule_appointments':
                return true; // Todos los profesionales
            case 'view_statistics':
                return userRole === 'asistente_social';
            default:
                return false;
        }
        
    } catch (error) {
        console.error('Error verificando permisos:', error);
        return false;
    }
}

/**
 * Obtiene los datos del usuario actual
 */
export function getCurrentUserData() {
    return currentUserData;
}

/**
 * Obtiene el usuario actual de Firebase Auth
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Verifica si hay un usuario autenticado
 */
export function isAuthenticated() {
    return !!(currentUser && currentUserData);
}

/**
 * Obtiene el nombre completo del usuario actual
 */
export function getCurrentUserFullName() {
    if (!currentUserData) return null;
    return `${currentUserData.nombre || ''} ${currentUserData.apellidos || ''}`.trim();
}

/**
 * Obtiene el CESFAM del usuario actual
 */
export function getCurrentUserCesfam() {
    return currentUserData?.cesfam || null;
}

/**
 * Obtiene la profesión del usuario actual
 */
export function getCurrentUserProfession() {
    return currentUserData?.profession || null;
}

/**
 * Refresca los datos del usuario actual
 */
export async function refreshUserData() {
    try {
        if (!currentUser) return null;
        
        console.log('🔄 Refrescando datos del usuario...');
        
        // Limpiar cache
        const cacheKey = `professional_${currentUser.uid}`;
        setCachedData(cacheKey, null);
        
        // Recargar datos
        const userData = await loadProfessionalData(currentUser.uid);
        currentUserData = userData;
        
        // Actualizar UI
        updateProfessionalInfo();
        
        if (typeof setCurrentUserData === 'function') {
            setCurrentUserData(userData);
        }
        
        console.log('✅ Datos del usuario refrescados');
        return userData;
        
    } catch (error) {
        console.error('❌ Error refrescando datos del usuario:', error);
        return null;
    }
}

/**
 * Verifica la inicialización de autenticación
 */
export function isAuthInitialized() {
    return authInitialized;
}

// Exportar handleAuthStateChange para testing
export { onAuthStateChanged as handleAuthStateChange };
