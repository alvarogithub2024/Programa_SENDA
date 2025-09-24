/**
 * AUTENTICACION/SESION.JS
 * Manejo de la sesión de usuario y estados de autenticación
 */

import { getAuth, getFirestore } from '../configuracion/firebase.js';
import { showNotification, showLoading } from '../utilidades/notificaciones.js';
import { getCachedData, setCachedData, clearUserCache } from '../utilidades/cache.js';
import { retryOperation } from '../utilidades/validaciones.js';
import { setCurrentUserData } from '../navegacion/tabs.js';

let currentUser = null;
let currentUserData = null;

/**
 * Configura el sistema de autenticación
 */
export function setupAuth() {
    try {
        const auth = getAuth();
        auth.onAuthStateChanged(onAuthStateChanged);
        console.log('✅ Sistema de autenticación configurado');
    } catch (error) {
        console.error('❌ Error configurando autenticación:', error);
    }
}

/**
 * Maneja los cambios en el estado de autenticación
 * @param {Object} user - Usuario autenticado o null
 */
async function onAuthStateChanged(user) {
    try {
        console.log('🔧 Estado de autenticación cambió:', user ? user.email : 'No autenticado');
        
        if (user) {
            currentUser = user;
            await loadUserData();
        } else {
            currentUser = null;
            currentUserData = null;
            clearUserCache();
            showPublicContent();
        }
    } catch (error) {
        console.error('❌ Error en cambio de estado de autenticación:', error);
        showNotification('Error en autenticación', 'error');
    }
}

/**
 * Carga los datos del usuario autenticado
 */
async function loadUserData() {
    try {
        showLoading(true, 'Cargando datos del usuario...');
        
        if (!currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const cacheKey = `user_${currentUser.uid}`;
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
            currentUserData = cachedData;
            showProfessionalContent();
            return;
        }

        const userData = await retryOperation(async () => {
            const db = getFirestore();
            const userDoc = await db.collection('profesionales').doc(currentUser.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('No se encontraron datos del profesional');
            }
            
            return userDoc.data();
        });
        
        currentUserData = userData;
        setCachedData(cacheKey, userData);
        
        showProfessionalContent();
        
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        
        if (error.code === 'permission-denied') {
            showNotification('Sin permisos para acceder a los datos', 'error');
        } else if (error.message.includes('No se encontraron datos')) {
            showNotification('Perfil de profesional no encontrado. Contacta al administrador.', 'error');
        } else {
            showNotification('Error al cargar datos del usuario: ' + error.message, 'error');
        }
        
        await handleLogout();
    } finally {
        showLoading(false);
    }
}

/**
 * Muestra el contenido público (no autenticado)
 */
function showPublicContent() {
    try {
        const publicContent = document.getElementById('public-content');
        const professionalContent = document.getElementById('professional-content');
        const professionalHeader = document.getElementById('professional-header');
        const loginBtn = document.getElementById('login-professional');
        const logoutBtn = document.getElementById('logout-btn');

        if (publicContent) publicContent.style.display = 'block';
        if (professionalContent) professionalContent.style.display = 'none';
        if (professionalHeader) professionalHeader.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        console.log('📄 Mostrando contenido público');
    } catch (error) {
        console.error('Error mostrando contenido público:', error);
    }
}

/**
 * Muestra el contenido profesional (autenticado)
 */
function showProfessionalContent() {
    try {
        const publicContent = document.getElementById('public-content');
        const professionalContent = document.getElementById('professional-content');
        const professionalHeader = document.getElementById('professional-header');
        const loginBtn = document.getElementById('login-professional');
        const logoutBtn = document.getElementById('logout-btn');

        if (publicContent) publicContent.style.display = 'none';
        if (professionalContent) professionalContent.style.display = 'block';
        if (professionalHeader) professionalHeader.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
        if (currentUserData) {
            updateProfessionalInfo();
            setCurrentUserData(currentUserData);
        }
        
        console.log('👨‍⚕️ Mostrando contenido profesional');
    } catch (error) {
        console.error('Error mostrando contenido profesional:', error);
    }
}

/**
 * Actualiza la información del profesional en la interfaz
 */
function updateProfessionalInfo() {
    try {
        const professionalName = document.getElementById('professional-name');
        const professionalProfession = document.getElementById('professional-profession');
        const professionalCesfam = document.getElementById('professional-cesfam');

        if (professionalName) {
            professionalName.textContent = `${currentUserData.nombre} ${currentUserData.apellidos}`;
        }
        
        if (professionalProfession) {
            professionalProfession.textContent = getProfessionName(currentUserData.profession);
        }
        
        if (professionalCesfam) {
            professionalCesfam.textContent = currentUserData.cesfam;
        }
        
        const avatar = document.querySelector('.professional-avatar');
        if (avatar) {
            const initials = `${currentUserData.nombre.charAt(0)}${currentUserData.apellidos.charAt(0)}`.toUpperCase();
            avatar.textContent = initials;
        }
        
    } catch (error) {
        console.error('Error updating professional info:', error);
    }
}

/**
 * Obtiene el nombre completo de la profesión
 * @param {string} profession - Código de la profesión
 * @returns {string} Nombre completo de la profesión
 */
function getProfessionName(profession) {
    const names = {
        'asistente_social': 'Asistente Social',
        'medico': 'Médico',
        'psicologo': 'Psicólogo',
        'terapeuta': 'Terapeuta Ocupacional'
    };
    return names[profession] || profession;
}

/**
 * Cierra la sesión del usuario
 */
export async function handleLogout() {
    try {
        console.log('🔐 Cerrando sesión...');
        
        showLoading(true, 'Cerrando sesión...');
        
        const auth = getAuth();
        await auth.signOut();
        
        currentUser = null;
        currentUserData = null;
        clearUserCache();
        
        showNotification('Sesión cerrada correctamente', 'success');
        showPublicContent();
        
        console.log('✅ Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error during logout:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Obtiene los datos del usuario actual
 * @returns {Object|null} Datos del usuario actual
 */
export function getCurrentUserData() {
    return currentUserData;
}

/**
 * Obtiene el usuario actual
 * @returns {Object|null} Usuario actual
 */
export function getCurrentUser() {
    return currentUser;
}
