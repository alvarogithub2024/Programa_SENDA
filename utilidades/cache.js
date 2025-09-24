// src/js/utilidades/cache.js
import { CONFIG_APP } from '../configuracion/constantes.js';

const cache = new Map();

export function obtenerDatosCache(clave) {
  const datos = cache.get(clave);
  if (datos && (Date.now() - datos.timestamp) < CONFIG_APP.duracionCache) {
    return datos.data;
  }
  cache.delete(clave);
  return null;
}

export function establecerDatosCache(clave, datos) {
  cache.set(clave, { data: datos, timestamp: Date.now() });
}

export function borrarCache(clave = null) {
  clave ? cache.delete(clave) : cache.clear();
}

export async function operacionConReintentos(operacion, maxIntentos = CONFIG_APP.maxReintentos) {
  for (let i = 1; i <= maxIntentos; i++) {
    try {
      return await operacion();
    } catch (error) {
      if (i === maxIntentos) throw error;
      await new Promise(r => setTimeout(r, CONFIG_APP.retrasoReintento * Math.pow(2, i - 1)));
    }
  }
}

export function debounce(func, espera) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), espera);
  };
}

// Auto-limpieza cada 5 minutos
setInterval(() => {
  const ahora = Date.now();
  for (const [clave, datos] of cache.entries()) {
    if (ahora - datos.timestamp > CONFIG_APP.duracionCache) {
      cache.delete(clave);
    }
  }
}, 300000);
