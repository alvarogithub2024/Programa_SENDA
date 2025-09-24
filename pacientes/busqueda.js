/**
 * BÚSQUEDA DE PACIENTES
 * Funciones para búsqueda y filtrado de pacientes
 */

// Variables globales para búsqueda
let currentSearchResults = [];
let searchCache = new Map();

/**
 * Busca un paciente por RUT
 */
async function buscarPacientePorRUT() {
  try {
    const rutInput = document.getElementById('search-pacientes-rut');
    const resultsContainer = document.getElementById('pacientes-search-results');
    
    if (!rutInput || !resultsContainer) {
      console.error('Elementos de búsqueda no encontrados');
      return;
    }
    
    const rut = rutInput.value.trim();
    
    if (!rut) {
      showNotification('Ingresa un RUT para buscar', 'warning');
      return;
    }
    
    if (!validateRUT(rut)) {
      showNotification('RUT inválido', 'error');
      return;
    }
    
    showLoading(true, 'Buscando paciente...');
    
    const rutFormatted = formatRUT(rut);
    
    // Verificar cache primero
    const cacheKey = `search_${rutFormatted}`;
    if (searchCache.has(cacheKey)) {
      const cachedResult = searchCache.get(cacheKey);
      if (Date.now() - cachedResult.timestamp < 300000) { // 5 minutos
        displaySearchResults(cachedResult.data, resultsContainer, rutFormatted);
        showLoading(false);
        return;
      }
    }
    
    const snapshot = await db.collection('pacientes')
      .where('rut', '==', rutFormatted)
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    const pacientes = [];
    snapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Guardar en cache
    searchCache.set(cacheKey, {
      data: pacientes,
      timestamp: Date.now()
    });
    
    currentSearchResults = pacientes;
    displaySearchResults(pacientes, resultsContainer, rutFormatted);
    
  } catch (error) {
    console.error('Error buscando paciente:', error);
    showNotification('Error al buscar paciente: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Muestra los resultados de búsqueda
 */
function displaySearchResults(pacientes, container, rutBuscado) {
  if (pacientes.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-user-slash"></i>
        <h3>Paciente no encontrado</h3>
        <p>No se encontró ningún paciente con el RUT ${rutBuscado} en tu CESFAM</p>
        <button class="btn btn-outline btn-sm mt-3" onclick="clearSearchResults()">
          <i class="fas fa-times"></i>
          Limpiar búsqueda
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="search-results-header">
        <h4>
          <i class="fas fa-search"></i>
          Resultados de búsqueda (${pacientes.length})
        </h4>
        <button class="btn btn-outline btn-sm" onclick="clearSearchResults()">
          <i class="fas fa-times"></i>
          Limpiar
        </button>
      </div>
      <div class="patients-grid">
        ${pacientes.map(createPatientCard).join('')}
      </div>
    `;
  }
}

/**
 * Búsqueda por nombre
 */
async function buscarPacientePorNombre(nombre) {
  try {
    if (!nombre || nombre.length < 3) {
      showNotification('Ingresa al menos 3 caracteres', 'warning');
      return;
    }
    
    showLoading(true, 'Buscando pacientes...');
    
    // Búsqueda por nombre (case insensitive)
    const nombreLower = nombre.toLowerCase();
    
    const snapshot = await db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam)
      .get();
    
    const pacientes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const nombreCompleto = `${data.nombre} ${data.apellidos || ''}`.toLowerCase();
      
      if (nombreCompleto.includes(nombreLower)) {
        pacientes.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    currentSearchResults = pacientes;
    
    const resultsContainer = document.getElementById('pacientes-search-results');
    if (resultsContainer) {
      displaySearchResults(pacientes, resultsContainer, nombre);
    }
    
  } catch (error) {
    console.error('Error buscando por nombre:', error);
    showNotification('Error en la búsqueda: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Búsqueda avanzada con filtros múltiples
 */
async function busquedaAvanzada(filtros) {
  try {
    showLoading(true, 'Realizando búsqueda avanzada...');
    
    let query = db.collection('pacientes')
      .where('cesfam', '==', currentUserData.cesfam);
    
    // Aplicar filtros
    if (filtros.estado && filtros.estado !== 'todos') {
      query = query.where('estado', '==', filtros.estado);
    }
    
    if (filtros.prioridad && filtros.prioridad !== 'todas') {
      query = query.where('prioridad', '==', filtros.prioridad);
    }
    
    const snapshot = await query.get();
    
    let pacientes = [];
    snapshot.forEach(doc => {
      pacientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filtros adicionales en memoria
    if (filtros.edadMin || filtros.edadMax) {
      pacientes = pacientes.filter(p => {
        const edad = p.edad || 0;
        const min = filtros.edadMin || 0;
        const max = filtros.edadMax || 999;
        return edad >= min && edad <= max;
      });
    }
    
    if (filtros.fechaDesde || filtros.fechaHasta) {
      pacientes = pacientes.filter(p => {
        if (!p.fechaCreacion) return false;
        
        const fechaPaciente = p.fechaCreacion.toDate();
        let incluir = true;
        
        if (filtros.fechaDesde) {
          incluir = incluir && fechaPaciente >= new Date(filtros.fechaDesde);
        }
        
        if (filtros.fechaHasta) {
          const fechaHasta = new Date(filtros.fechaHasta);
          fechaHasta.setHours(23, 59, 59, 999);
          incluir = incluir && fechaPaciente <= fechaHasta;
        }
        
        return incluir;
      });
    }
    
    // Ordenar resultados
    pacientes.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate() || new Date(0);
      return fechaB - fechaA;
    });
    
    currentSearchResults = pacientes;
    
    const resultsContainer = document.getElementById('pacientes-search-results');
    if (resultsContainer) {
      displayAdvancedSearchResults(pacientes, filtros);
    }
    
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    showNotification('Error en la búsqueda: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Muestra resultados de búsqueda avanzada
 */
function displayAdvancedSearchResults(pacientes, filtros) {
  const container = document.getElementById('pacientes-search-results');
  if (!container) return;
  
  const filtrosAplicados = Object.entries(filtros)
    .filter(([key, value]) => value && value !== '' && value !== 'todos' && value !== 'todas')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  if (pacientes.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search-minus"></i>
        <h3>Sin resultados</h3>
        <p>No se encontraron pacientes con los criterios especificados</p>
        <small>Filtros aplicados: ${filtrosAplicados}</small>
        <button class="btn btn-outline btn-sm mt-3" onclick="clearSearchResults()">
          <i class="fas fa-times"></i>
          Limpiar búsqueda
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="search-results-header">
        <h4>
          <i class="fas fa-filter"></i>
          Búsqueda avanzada: ${pacientes.length} resultado(s)
        </h4>
        <div class="search-filters-applied">
          <small>Filtros: ${filtrosAplicados}</small>
        </div>
        <button class="btn btn-outline btn-sm" onclick="clearSearchResults()">
          <i class="fas fa-times"></i>
          Limpiar
        </button>
      </div>
      <div class="patients-grid">
        ${pacientes.map(createPatientCard).join('')}
      </div>
    `;
  }
}

/**
 * Limpia los resultados de búsqueda
 */
function clearSearchResults() {
  const resultsContainer = document.getElementById('pacientes-search-results');
  const searchInput = document.getElementById('search-pacientes-rut');
  const nameSearchInput = document.getElementById('search-pacientes-nombre');
  
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }
  
  if (searchInput) {
    searchInput.value = '';
  }
  
  if (nameSearchInput) {
    nameSearchInput.value = '';
  }
  
  currentSearchResults = [];
  
  // Recargar lista completa de pacientes
  loadPacientes();
}

/**
 * Búsqueda en tiempo real (debounced)
 */
function setupLiveSearch() {
  const searchInput = document.getElementById('search-pacientes-nombre');
  if (!searchInput) return;
  
  let searchTimeout;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length === 0) {
      clearSearchResults();
      return;
    }
    
    if (query.length < 3) {
      return; // Esperar al menos 3 caracteres
    }
    
    searchTimeout = setTimeout(() => {
      buscarPacientePorNombre(query);
    }, 500); // Debounce de 500ms
  });
}

/**
 * Exporta resultados de búsqueda a CSV
 */
function exportarResultadosBusqueda() {
  try {
    if (currentSearchResults.length === 0) {
      showNotification('No hay resultados para exportar', 'warning');
      return;
    }
    
    const headers = [
      'Nombre',
      'RUT',
      'Edad',
      'Teléfono',
      'Email',
      'Estado',
      'Prioridad',
      'CESFAM',
      'Fecha Registro'
    ];
    
    const csvData = currentSearchResults.map(paciente => [
      `${paciente.nombre} ${paciente.apellidos || ''}`,
      paciente.rut,
      paciente.edad || '',
      paciente.telefono || '',
      paciente.email || '',
      paciente.estado || 'activo',
      paciente.prioridad || 'media',
      paciente.cesfam,
      paciente.fechaCreacion ? 
        paciente.fechaCreacion.toDate().toLocaleDateString('es-CL') : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `busqueda_pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Resultados exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exportando resultados:', error);
    showNotification('Error al exportar: ' + error.message, 'error');
  }
}

/**
 * Configura los event listeners para búsqueda
 */
function setupSearchEventListeners() {
  const searchButton = document.getElementById('buscar-paciente-btn');
  const rutInput = document.getElementById('search-pacientes-rut');
  
  if (searchButton) {
    searchButton.addEventListener('click', buscarPacientePorRUT);
  }
  
  if (rutInput) {
    rutInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarPacientePorRUT();
      }
    });
    
    rutInput.addEventListener('input', (e) => {
      e.target.value = formatRUT(e.target.value);
    });
  }
  
  setupLiveSearch();
}

// Exportar funciones
if (typeof window !== 'undefined') {
  window.buscarPacientePorRUT = buscarPacientePorRUT;
  window.buscarPacientePorNombre = buscarPacientePorNombre;
  window.busquedaAvanzada = busquedaAvanzada;
  window.clearSearchResults = clearSearchResults;
  window.exportarResultadosBusqueda = exportarResultadosBusqueda;
  window.setupSearchEventListeners = setupSearchEventListeners;
}

console.log('✅ Módulo de búsqueda de pacientes cargado');
