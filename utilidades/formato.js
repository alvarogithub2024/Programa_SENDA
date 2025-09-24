/**
 * UTILIDADES/FORMATO.JS
 * Funciones de formateo de datos y textos
 */

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado
 */
export function formatRUT(rut) {
    try {
        if (!rut) return '';
        
        const cleaned = rut.replace(/[^\dKk]/g, '').toUpperCase();
        
        if (cleaned.length < 2) return cleaned;
        
        const body = cleaned.slice(0, -1);
        const dv = cleaned.slice(-1);
        
        const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        return `${formattedBody}-${dv}`;
    } catch (error) {
        console.error('Error formatting RUT:', error);
        return rut;
    }
}

/**
 * Formatea un número de teléfono chileno
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Formatea una fecha de Firestore
 * @param {Object} timestamp - Timestamp de Firestore
 * @returns {string} Fecha formateada
 */
export function formatDate(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }
        
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
}

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un nombre completo
 * @param {string} nombre - Nombre
 * @param {string} apellidos - Apellidos
 * @returns {string} Nombre completo formateado
 */
export function formatFullName(nombre, apellidos) {
    const nombreCapitalized = capitalize(nombre || '');
    const apellidosCapitalized = capitalize(apellidos || '');
    return `${nombreCapitalized} ${apellidosCapitalized}`.trim();
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} nombre - Nombre
 * @param {string} apellidos - Apellidos
 * @returns {string} Iniciales
 */
export function getInitials(nombre, apellidos) {
    const n = (nombre || '').charAt(0).toUpperCase();
    const a = (apellidos || '').charAt(0).toUpperCase();
    return `${n}${a}`;
}

/**
 * Formatea un precio en pesos chilenos
 * @param {number} amount - Cantidad
 * @returns {string} Precio formateado
 */
export function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(amount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `$${amount}`;
    }
}

/**
 * Convierte una fecha de input local a Date
 * @param {string} dateStr - String de fecha (YYYY-MM-DD)
 * @returns {Date} Objeto Date
 */
export function parseLocalDateFromInput(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha para input HTML
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
    if (!date || !(date instanceof Date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Formatea una hora para mostrar
 * @param {Date} date - Fecha con hora
 * @returns {string} Hora formateada (HH:MM)
 */
export function formatTime(date) {
    if (!date || !(date instanceof Date)) return '';
    
    return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}
