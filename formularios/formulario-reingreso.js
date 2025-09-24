/**
 * FORMULARIOS/FORMULARIO-REINGRESO.JS
 * Manejo del formulario de reingreso al programa
 */

import { getFirestore } from '../configuracion/firebase.js';
import { showNotification, showLoading } from '../utilidades/notificaciones.js';
import { closeModal, toggleSubmitButton } from '../utilidades/modales.js';
import { validateRUT, formatRUT, formatPhoneNumber } from '../utilidades/formato.js';

/**
 * Configura el formulario de reingreso
 */
export function setupReentryForm() {
    try {
        const reentryForm = document.getElementById('reentry-form');
        if (reentryForm) {
            reentryForm.addEventListener('submit', handleReentrySubmit);
            setupReentryFormValidation();
            console.log('✅ Formulario de reingreso configurado');
        }
    } catch (error) {
        console.error('Error configurando formulario de reingreso:', error);
    }
}

/**
 * Configura la validación en tiempo real del formulario de reingreso
 */
function setupReentryFormValidation() {
    const rutInput = document.getElementById('reentry-rut');
    if (rutInput) {
        rutInput.addEventListener('input', (e) => {
            e.target.value = formatRUT(e.target.value);
        });
    }
}

/**
 * Maneja el envío del formulario de reingreso
 * @param {Event} e - Evento de submit
 */
async function handleReentrySubmit(e) {
    e.preventDefault();
    console.log('Iniciando envío de reingreso...');
    
    const formData = extractReentryFormData();
    
    if (!validateReentryForm(formData)) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        toggleSubmitButton(submitBtn, true);
        showLoading(true, 'Enviando solicitud de reingreso...');
        
        const db = getFirestore();
        if (!db) {
            throw new Error('No hay conexión a Firebase');
        }
        
        const rutFormatted = formatRUT(formData.rut);
        
        // Verificar si ya existe una solicitud pendiente
        try {
            const existingReingreso = await db.collection('reingresos')
                .where('rut', '==', rutFormatted)
                .where('estado', '==', 'pendiente')
                .get();
            
            if (!existingReingreso.empty) {
                showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
                return;
            }
        } catch (queryError) {
            console.warn('Error verificando reingresos existentes:', queryError);
        }
        
        const reingresoData = createReingresoData(formData);
        
        await db.collection('reingresos').add(reingresoData);
        
        closeModal('reentry-modal');
        e.target.reset();
        showNotification('Solicitud de reingreso enviada correctamente. Te contactaremos pronto.', 'success', 5000);
        
    } catch (error) {
        console.error('Error enviando reingreso:', error);
        
        const errorMessage = getReentryErrorMessage(error);
        showNotification(errorMessage, 'error', 8000);
        
    } finally {
        showLoading(false);
        toggleSubmitButton(submitBtn, false);
    }
}

/**
 * Extrae los datos del formulario de reingreso
 * @returns {Object} Datos del formulario
 */
function extractReentryFormData() {
    return {
        nombre: document.getElementById('reentry-name')?.value?.trim() || '',
        rut: document.getElementById('reentry-rut')?.value?.trim() || '',
        cesfam: document.getElementById('reentry-cesfam')?.value || '',
        motivo: document.getElementById('reentry-reason')?.value?.trim() || '',
        telefono: document.getElementById('reentry-phone')?.value?.trim() || ''
    };
}

/**
 * Valida el formulario de reingreso
 * @param {Object} formData - Datos del formulario
 * @returns {boolean} True si es válido
 */
function validateReentryForm(formData) {
    const requiredFields = [
        { field: 'nombre', name: 'Nombre' },
        { field: 'rut', name: 'RUT' },
        { field: 'cesfam', name: 'CESFAM' },
        { field: 'motivo', name: 'Motivo' },
        { field: 'telefono', name: 'Teléfono' }
    ];

    for (const { field, name } of requiredFields) {
        if (!formData[field]) {
            showNotification(`El campo ${name} es obligatorio`, 'warning');
            return false;
        }
    }

    if (!validateRUT(formData.rut)) {
        showNotification('RUT inválido', 'warning');
        return false;
    }

    const phoneClean = formData.telefono.replace(/\D/g, '');
    if (phoneClean.length < 8) {
        showNotification('Teléfono inválido', 'warning');
        return false;
    }

    return true;
}

/**
 * Crea el objeto de datos para el reingreso
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Datos estructurados para Firestore
 */
function createReingresoData(formData) {
    return {
        nombre: formData.nombre,
        rut: formatRUT(formData.rut),
        telefono: formatPhoneNumber(formData.telefono),
        cesfam: formData.cesfam,
        motivo: formData.motivo,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        prioridad: 'media',
        tipo: 'reingreso',
        origen: 'web_publica',
        version: '2.0'
    };
}

/**
 * Obtiene el mensaje de error apropiado
 * @param {Error} error - Error ocurrido
 * @returns {string} Mensaje de error
 */
function getReentryErrorMessage(error) {
    let errorMessage = 'Error al enviar la solicitud de reingreso: ';
    
    if (error.code === 'permission-denied') {
        errorMessage += 'Sin permisos para crear reingresos.';
    } else if (error.code === 'network-request-failed') {
        errorMessage += 'Problema de conexión. Verifica tu internet.';
    } else {
        errorMessage += error.message || 'Intenta nuevamente.';
    }
    
    return errorMessage;
}
