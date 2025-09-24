/**
 * SISTEMA DE CACHE
 * Maneja el almacenamiento en memoria y localStorage para optimizar rendimiento
 */

import { APP_CONFIG, CACHE_KEYS } from '../configuracion/constantes.js';

// Cache en memoria
const memoriaCache = new Map();

/**
 * Establece un valor en el cache
 */
function establecerCache(clave, datos) {
    try {
        const entradaCache = {
            datos,
            timestamp: Date.now()
        };
        
        memoriaCache.set(clave, entradaCache);
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('💾 Datos guardados en cache:', clave);
        }
        
    } catch (error) {
        console.error('Error estableciendo cache:', error);
    }
}

/**
 * Obtiene un valor del cache si no ha expirado
 */
function obtenerCache(clave) {
    try {
        const entrada = memoriaCache.get(clave);
        
        if (!entrada) {
            return null;
        }
        
        const tiempoTranscurrido = Date.now() - entrada.timestamp;
        
        if (tiempoTranscurrido > APP_CONFIG.CACHE_DURATION) {
            memoriaCache.delete(clave);
            return null;
        }
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('📦 Datos obtenidos del cache:', clave);
        }
        
        return entrada.datos;
        
    } catch (error) {
        console.error('Error obteniendo cache:', error);
        return null;
    }
}

/**
 * Elimina una entrada específica del cache
 */
function limpiarCache(clave) {
    try {
        if (clave) {
            memoriaCache.delete(clave);
        } else {
            memoriaCache.clear();
        }
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log('🗑️ Cache limpiado:', clave || 'todo');
        }
        
    } catch (error) {
        console.error('Error limpiando cache:', error);
    }
}

/**
 * Verifica si una clave existe en el cache y no ha expirado
 */
function existeEnCache(clave) {
    const entrada = memoriaCache.get(clave);
    
    if (!entrada) {
        return false;
    }
    
    const tiempoTranscurrido = Date.now() - entrada.timestamp;
    
    if (tiempoTranscurrido > APP_CONFIG.CACHE_DURATION) {
        memoriaCache.delete(clave);
        return false;
    }
    
    return true;
}

/**
 * Obtiene estadísticas del cache
 */
function obtenerEstadisticasCache() {
    const entradas = Array.from(memoriaCache.entries());
    const ahora = Date.now();
    
    const estadisticas = {
        totalEntradas: entradas.length,
        entradasExpiradas: 0,
        entradasValidas: 0,
        tamañoAproximado: 0
    };
    
    entradas.forEach(([clave, entrada]) => {
        const tiempoTranscurrido = ahora - entrada.timestamp;
        
        if (tiempoTranscurrido > APP_CONFIG.CACHE_DURATION) {
            estadisticas.entradasExpiradas++;
        } else {
            estadisticas.entradasValidas++;
        }
        
        // Estimación aproximada del tamaño
        try {
            estadisticas.tamañoAproximado += JSON.stringify(entrada).length;
        } catch (e) {
            // Ignorar errores de serialización circular
        }
    });
    
    return estadisticas;
}

/**
 * Limpia entradas expiradas del cache
 */
function limpiarEntradasExpiradas() {
    try {
        const ahora = Date.now();
        const clavesAEliminar = [];
        
        memoriaCache.forEach((entrada, clave) => {
            const tiempoTranscurrido = ahora - entrada.timestamp;
            if (tiempoTranscurrido > APP_CONFIG.CACHE_DURATION) {
                clavesAEliminar.push(clave);
            }
        });
        
        clavesAEliminar.forEach(clave => {
            memoriaCache.delete(clave);
        });
        
        if (APP_CONFIG.DEBUG_MODE && clavesAEliminar.length > 0) {
            console.log(`🧹 ${clavesAEliminar.length} entradas expiradas eliminadas del cache`);
        }
        
        return clavesAEliminar.length;
        
    } catch (error) {
        console.error('Error limpiando entradas expiradas:', error);
        return 0;
    }
}

/**
 * GESTIÓN DE LOCALSTORAGE
 */

/**
 * Guarda datos en localStorage con expiración
 */
function guardarEnLocalStorage(clave, datos, duracion = APP_CONFIG.CACHE_DURATION) {
    try {
        const elemento = {
            datos,
            timestamp: Date.now(),
            expiracion: Date.now() + duracion
        };
        
        localStorage.setItem(clave, JSON.stringify(elemento));
        
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        // Si localStorage está lleno, intentar limpiar y reintentar
        if (error.name === 'QuotaExceededError') {
            limpiarLocalStorageExpirado();
            try {
                localStorage.setItem(clave, JSON.stringify(elemento));
            } catch (e) {
                console.error('Error después de limpiar localStorage:', e);
            }
        }
    }
}

/**
 * Obtiene datos de localStorage verificando expiración
 */
function obtenerDeLocalStorage(clave) {
    try {
        const item = localStorage.getItem(clave);
        
        if (!item) {
            return null;
        }
        
        const elemento = JSON.parse(item);
        
        if (Date.now() > elemento.expiracion) {
            localStorage.removeItem(clave);
            return null;
        }
        
        return elemento.datos;
        
    } catch (error) {
        console.error('Error obteniendo de localStorage:', error);
        // Si hay error de parsing, eliminar el item corrupto
        localStorage.removeItem(clave);
        return null;
    }
}

/**
 * Limpia elementos expirados de localStorage
 */
function limpiarLocalStorageExpirado() {
    try {
        const clavesAEliminar = [];
        const ahora = Date.now();
        
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            
            if (clave && clave.startsWith('senda_')) {
                try {
                    const item = localStorage.getItem(clave);
                    const elemento = JSON.parse(item);
                    
                    if (elemento.expiracion && ahora > elemento.expiracion) {
                        clavesAEliminar.push(clave);
                    }
                } catch (e) {
                    // Item corrupto, marcarlo para eliminación
                    clavesAEliminar.push(clave);
                }
            }
        }
        
        clavesAEliminar.forEach(clave => {
            localStorage.removeItem(clave);
        });
        
        if (APP_CONFIG.DEBUG_MODE && clavesAEliminar.length > 0) {
            console.log(`🧹 ${clavesAEliminar.length} elementos expirados eliminados de localStorage`);
        }
        
        return clavesAEliminar.length;
        
    } catch (error) {
        console.error('Error limpiando localStorage:', error);
        return 0;
    }
}

/**
 * Elimina un elemento específico de localStorage
 */
function eliminarDeLocalStorage(clave) {
    try {
        localStorage.removeItem(clave);
    } catch (error) {
        console.error('Error eliminando de localStorage:', error);
    }
}

/**
 * Inicializa el sistema de cache
 */
function inicializarCache() {
    try {
        // Limpiar entradas expiradas al inicializar
        limpiarEntradasExpiradas();
        limpiarLocalStorageExpirado();
        
        // Configurar limpieza automática cada 5 minutos
        setInterval(() => {
            limpiarEntradasExpiradas();
            limpiarLocalStorageExpirado();
        }, 5 * 60 * 1000);
        
        console.log('✅ Sistema de cache inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando cache:', error);
    }
}

export {
    establecerCache,
    obtenerCache,
    limpiarCache,
    existeEnCache,
    obtenerEstadisticasCache,
    limpiarEntradasExpiradas,
    guardarEnLocalStorage,
    obtenerDeLocalStorage,
    limpiarLocalStorageExpirado,
    eliminarDeLocalStorage,
    inicializarCache
};
