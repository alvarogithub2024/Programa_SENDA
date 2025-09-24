// ====================================
// SISTEMA DE CACHE
// ====================================

const dataCache = new Map();

function getCachedData(key) {
  const cached = dataCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < window.SENDASystem.constants.APP_CONFIG.CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clearCache() {
  dataCache.clear();
}

async function retryOperation(operation, maxAttempts = window.SENDASystem.constants.APP_CONFIG.MAX_RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Intento ${attempt}/${maxAttempts} falló:`, error.message);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, window.SENDASystem.constants.APP_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1))
      );
    }
  }
}

function showLoading(show = true, message = 'Cargando...') {
  try {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      const messageElement = overlay.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
      
      if (show) {
        overlay.classList.remove('hidden');
        window.SENDASystem.isLoading = true;
      } else {
        overlay.classList.add('hidden');
        window.SENDASystem.isLoading = false;
      }
    }
  } catch (error) {
    console.error('Error with loading overlay:', error);
  }
}

// Exportar funciones
window.SENDASystem = window.SENDASystem || {};
window.SENDASystem.cache = {
  get: getCachedData,
  set: setCachedData,
  clear: clearCache,
  retryOperation,
  showLoading
};
