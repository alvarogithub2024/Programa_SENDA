/**
 * FUNCIONES DE FORMATO
 * Utilidades para formatear datos, fechas, RUT, teléfonos, etc.
 */

import { VALIDACIONES } from '../configuracion/constantes.js';

/**
 * Formatea un RUT chileno
 */
function formatearRUT(rut) {
    try {
        if (!rut) return '';
        
        const limpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
        
        if (limpio.length < 2) return limpio;
        
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        
        const cuerpoFormateado = cuerpo.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        return `${cuerpoFormateado}-${dv}`;
    } catch (error) {
        console.error('Error formateando RUT:', error);
        return rut;
    }
}

/**
 * Valida un RUT chileno
 */
function validarRUT(rut) {
    try {
        if (!rut) return false;
        
        const limpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
        if (limpio.length < VALIDACIONES.RUT.MIN_LENGTH || limpio.length > VALIDACIONES.RUT.MAX_LENGTH) {
            return false;
        }
        
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        
        if (!/^\d+$/.test(cuerpo)) return false;
        
        let suma = 0;
        let multiplicador = 2;
        
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo[i]) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const dvEsperado = 11 - (suma % 11);
        let dvFinal;
        
        if (dvEsperado === 11) {
            dvFinal = '0';
        } else if (dvEsperado === 10) {
            dvFinal = 'K';
        } else {
            dvFinal = dvEsperado.toString();
        }
        
        return dv === dvFinal;
    } catch (error) {
        console.error('Error validando RUT:', error);
        return false;
    }
}

/**
 * Formatea un número de teléfono chileno
 */
function formatearTelefono(telefono) {
    if (!telefono) return '';
    
    const limpio = telefono.replace(/\D/g, '');
    
    if (limpio.length === 9) {
        return `${limpio.slice(0, 1)} ${limpio.slice(1, 5)} ${limpio.slice(5)}`;
    } else if (limpio.length === 8) {
        return `${limpio.slice(0, 4)} ${limpio.slice(4)}`;
    }
    
    return telefono;
}

/**
 * Valida un número de teléfono
 */
function validarTelefono(telefono) {
    if (!telefono) return false;
    const limpio = telefono.replace(/\D/g, '');
    return limpio.length >= VALIDACIONES.TELEFONO.MIN_LENGTH && 
           limpio.length <= VALIDACIONES.TELEFONO.MAX_LENGTH;
}

/**
 * Valida un email
 */
function validarEmail(email) {
    try {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    } catch (error) {
        console.error('Error validando email:', error);
        return false;
    }
}

/**
 * Formatea una fecha desde timestamp de Firebase
 */
function formatearFecha(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let fecha;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            fecha = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            fecha = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            fecha = new Date(timestamp);
        } else {
            return 'N/A';
        }
        
        if (isNaN(fecha.getTime())) return 'N/A';
        
        return fecha.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'N/A';
    }
}

/**
 * Formatea solo la fecha sin hora
 */
function formatearSoloFecha(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let fecha;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            fecha = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            fecha = timestamp;
        } else {
            fecha = new Date(timestamp);
        }
        
        if (isNaN(fecha.getTime())) return 'N/A';
        
        return fecha.toLocaleDateString('es-CL');
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'N/A';
    }
}

/**
 * Formatea solo la hora
 */
function formatearSoloHora(timestamp) {
    try {
        if (!timestamp) return 'N/A';
        
        let fecha;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            fecha = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            fecha = timestamp;
        } else {
            fecha = new Date(timestamp);
        }
        
        if (isNaN(fecha.getTime())) return 'N/A';
        
        return fecha.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formateando hora:', error);
        return 'N/A';
    }
}

/**
 * Parsea una fecha local desde input de fecha
 */
function parsearFechaLocal(fechaStr) {
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    return new Date(año, mes - 1, dia);
}

/**
 * Trunca texto a una longitud específica
 */
function truncarTexto(texto, longitudMaxima) {
    if (!texto || texto.length <= longitudMaxima) return texto;
    return texto.substring(0, longitudMaxima) + '...';
}

/**
 * Capitaliza la primera letra de una cadena
 */
function capitalizarPrimeraLetra(cadena) {
    if (!cadena) return '';
    return cadena.charAt(0).toUpperCase() + cadena.slice(1).toLowerCase();
}

/**
 * Formatea un nombre completo
 */
function formatearNombreCompleto(nombre, apellidos) {
    const nombreLimpio = (nombre || '').trim();
    const apellidosLimpio = (apellidos || '').trim();
    
    if (!nombreLimpio && !apellidosLimpio) return 'Sin nombre';
    if (!apellidosLimpio) return nombreLimpio;
    if (!nombreLimpio) return apellidosLimpio;
    
    return `${nombreLimpio} ${apellidosLimpio}`;
}

/**
 * Alterna el estado de un botón de envío
 */
function alternarBotonEnvio(boton, cargando) {
    if (!boton) return;
    
    if (cargando) {
        boton.disabled = true;
        const textoOriginal = boton.innerHTML;
        boton.setAttribute('data-original-text', textoOriginal);
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    } else {
        boton.disabled = false;
        const textoOriginal = boton.getAttribute('data-original-text');
        if (textoOriginal) {
            boton.innerHTML = textoOriginal;
            boton.removeAttribute('data-original-text');
        }
    }
}

/**
 * Formatea un número con separadores de miles
 */
function formatearNumero(numero) {
    if (numero === null || numero === undefined) return '0';
    return Number(numero).toLocaleString('es-CL');
}

/**
 * Valida un rango de edad
 */
function validarEdad(edad) {
    const edadNum = parseInt(edad);
    return !isNaN(edadNum) && 
           edadNum >= VALIDACIONES.EDAD.MIN && 
           edadNum <= VALIDACIONES.EDAD.MAX;
}

/**
 * Genera iniciales desde un nombre completo
 */
function generarIniciales(nombre, apellidos) {
    const nombreLimpio = (nombre || '').trim();
    const apellidosLimpio = (apellidos || '').trim();
    
    let iniciales = '';
    
    if (nombreLimpio) {
        iniciales += nombreLimpio.charAt(0).toUpperCase();
    }
    
    if (apellidosLimpio) {
        iniciales += apellidosLimpio.charAt(0).toUpperCase();
    }
    
    return iniciales || '??';
}

/**
 * Convierte texto a formato de URL amigable
 */
function convertirASlug(texto) {
    return texto
        .toLowerCase()
        .replace(/[áàäâã]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöôõ]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

export {
    formatearRUT,
    validarRUT,
    formatearTelefono,
    validarTelefono,
    validarEmail,
    formatearFecha,
    formatearSoloFecha,
    formatearSoloHora,
    parsearFechaLocal,
    truncarTexto,
    capitalizarPrimeraLetra,
    formatearNombreCompleto,
    alternarBotonEnvio,
    formatearNumero,
    validarEdad,
    generarIniciales,
    convertirASlug
};
