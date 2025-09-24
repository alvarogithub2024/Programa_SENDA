// src/js/utilidades/cache.js
import { CONFIG_APP } from '../configuracion/constantes.js';

const cacheData = new Map();

export function obtenerDatosCache(clave) {
  const datos = cacheData.get(clave);
  if (datos && (Date.now() - datos.timestamp) < CONFIG_APP.duracionCache) {
    return datos.data;
  }
  cacheData.delete(clave);
  return null;
}

export function establecerDatosCache(clave, datos) {
  cacheData.set(clave, { data: datos, timestamp: Date.now() });
}

export function borrarCache(clave = null) {
  clave ? cacheData.delete(clave) : cacheData.clear();
}

export async function operacionConReintentos(operacion, maxIntentos = CONFIG_APP.maxReintentos) {
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      if (intento === maxIntentos) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, CONFIG_APP.retrasoReintento * Math.pow(2, intento - 1))
      );
    }
  }
}

export function debounce(func, espera) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), espera);
  };
}

export function limpiarCacheExpirado() {
  const ahora = Date.now();
  for (const [clave, datos] of cacheData.entries()) {
    if (ahora - datos.timestamp > CONFIG_APP.duracionCache) {
      cacheData.delete(clave);
    }
  }
}

// Limpiar cache expirado cada 5 minutos
setInterval(limpiarCacheExpirado, 5 * 60 * 1000);
