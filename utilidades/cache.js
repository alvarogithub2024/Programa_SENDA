/**
 * UTILIDADES/CACHE.JS
 * Sistema de cache para optimizar rendimiento
 */

import { APP_CONFIG } from '../configuracion/constantes.js';

// Cache en memoria
const dataCache = new Map();

/**
 * Obtiene datos del cache
 * @param {string} key - Clave del cache
 * @returns {*} Datos cacheados o null
 */
export function getCachedData(key) {
    try {
        const cached = dataCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < APP_CONFIG.CACHE_DURATION) {
            if (APP_CONFIG.DEBUG_MODE) {
                console.log(`💾 Cache HIT para: ${key}`);
            }
            return cached.data;
        }
        
        if (cached) {
            dataCache.delete(key);
            if (APP_CONFIG.DEBUG_MODE) {
                console.log(`🗑️ Cache expirado removido: ${key}`);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting cached data:', error);
        return null;
    }
}

/**
 * Guarda datos en el cache
 * @param {string} key - Clave del cache
 * @param {*} data - Datos a cachear
 */
export function setCachedData(key, data) {
    try {
        if (data === null || data === undefined) {
            dataCache.delete(key);
            return;
        }
        
        dataCache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`💾 Datos cacheados: ${key}`);
        }
        
        // Limitar tamaño del cache
        if (dataCache.size > 100) {
            cleanupCache();
        }
        
    } catch (error) {
        console.error('Error setting cached data:', error);
    }
}

/**
 * Invalida un elemento específico del cache
 * @param {string} key - Clave a invalidar
 */
export function invalidateCache(key) {
    try {
        const deleted = dataCache.delete(key);
        if (deleted && APP_CONFIG.DEBUG_MODE) {
            console.log(`🗑️ Cache invalidado: ${key}`);
        }
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
}

/**
 * Invalida todo el cache del usuario
 */
export function clearUserCache() {
    try {
        const keysToDelete = [];
        
        dataCache.forEach((value, key) => {
            if (key.startsWith('user_') || 
                key.includes('solicitudes_') || 
                key.includes('pacientes_') ||
                key.includes('citas_')) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => {
            dataCache.delete(key);
        });
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`🗑️ Cache de usuario limpiado: ${keysToDelete.length} elementos`);
        }
        
    } catch (error) {
        console.error('Error clearing user cache:', error);
    }
}

/**
 * Limpia todo el cache
 */
export function clearAllCache() {
    try {
        const size = dataCache.size;
        dataCache.clear();
        
        if (APP_CONFIG.DEBUG_MODE) {
            console.log(`🗑️ Todo el cache limpiado: ${size} elementos`);
        }
        
    } catch (error) {
        console.error('Error clearing all cache:', error);
    }
}

/**
 * Limpia elementos expirados del cache
 */
export function cleanupCache() {
    try {
        const now = Date.now();
        const keysToDelete = [];
        
        dataCache.forEach((value, key) => {
            if ((now - value.timestamp) >= APP_CONFIG.CACHE_DURATION) {
                keysToDelete.push(key);
            }
        });
        
        // Eliminar los más antiguos si hay demasiados elementos
        if (dataCache.size > 100) {
            const sortedEntries = Array.from(dataCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = sortedEntries.slice(0, 20);
            toRemove.forEach(([key]) => keysToDelete.push(key));
        }
        
        keysToDelete.forEach(key => {
            dataCache.delete(key);
        });
        
        if (keysToDelete.length > 0 && APP_CONFIG.DEBUG_MODE) {
            console.log(`🧹 Cache cleanup: ${keysToDelete.length} elementos removidos`);
        }
        
    } catch (error) {
        console.error('Error cleaning up cache:', error);
    }
}

/**
 * Obtiene estadísticas del cache
 * @returns {Object} Estadísticas del cache
 */
export function getCacheStats() {
    try {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        
        dataCache.forEach((value) => {
            if ((now - value.timestamp) < APP_CONFIG.CACHE_DURATION) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        });
        
        return {
            totalEntries: dataCache.size,
            validEntries,
            expiredEntries,
            cacheHitRate: calculateCacheHitRate()
        };
        
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return {
            totalEntries: 0,
            validEntries: 0,
            expiredEntries: 0,
            cacheHitRate: 0
        };
    }
}

/**
 * Cache para localStorage con expiración
 */
export class LocalStorageCache {
    constructor(prefix = 'senda_cache_') {
        this.prefix = prefix;
    }
    
    set(key, data, ttl = APP_CONFIG.CACHE_DURATION) {
        try {
            const item = {
                data,
                timestamp: Date.now(),
                ttl
            };
            
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
            
        } catch (error) {
            console.error('Error setting localStorage cache:', error);
        }
    }
    
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            const now = Date.now();
            
            if ((now - parsed.timestamp) >= parsed.ttl) {
                localStorage.removeItem(this.prefix + key);
                return null;
            }
            
            return parsed.data;
            
        } catch (error) {
            console.error('Error getting localStorage cache:', error);
            return null;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.error('Error removing localStorage cache:', error);
        }
    }
    
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing localStorage cache:', error);
        }
    }
}

// Variables para estadísticas (simplificadas)
let cacheHits = 0;
let cacheMisses = 0;

function calculateCacheHitRate() {
    const total = cacheHits + cacheMisses;
    return total > 0 ? (cacheHits / total) * 100 : 0;
}

// Limpiar cache automáticamente cada 10 minutos
setInterval(cleanupCache, 10 * 60 * 1000);

// Instancia global de LocalStorageCache
export const localCache = new LocalStorageCache();
