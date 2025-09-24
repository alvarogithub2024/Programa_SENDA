import { getFirestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables para búsqueda avanzada
let searchCache = new Map();
let searchFilters = {};
let searchResults = [];

// Inicializar búsqueda de pacientes
export function initPatientSearch() {
    setupAdvancedSearch();
    setupQuickSearch();
    setupSearchFilters();
    console.log('🔍 Búsqueda de pacientes inicializada');
}

// Configurar búsqueda avanzada
function setupAdvancedSearch() {
    const advancedSearchBtn = document.getElementById('advanced-search-btn');
    const advancedSearchModal = document.getElementById('advanced-search-modal');
    const advancedSearchForm = document.getElementById('advanced-search-form');

    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', () => {
            advancedSearchModal.style.display = 'flex';
        });
    }

    if (advancedSearchForm) {
        advancedSearchForm.addEventListener('submit', handleAdvancedSearch);
    }
}

// Configurar búsqueda rápida
function setupQuickSearch() {
    const quickSearchInput = document.getElementById('quick-search');
    if (quickSearchInput) {
        quickSearchInput.addEventListener('input', debounce(handleQuickSearch, 300));
        quickSearchInput.addEventListener('keydown', handleSearchKeydown);
    }
}

// Manejar búsqueda rápida
async function handleQuickSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        clearSearchResults();
        return;
    }

    try {
        showSearchLoading(true);
        const results = await performQuickSearch(query);
        displayQuickSearchResults(results);
        
    } catch (error) {
        console.error('Error en búsqueda rápida:', error);
        showNotification('Error en la búsqueda', 'error');
    } finally {
        showSearchLoading(false);
    }
}

// Realizar búsqueda rápida
async function performQuickSearch(query) {
    // Verificar caché primero
    const cacheKey = `quick_${query.toLowerCase()}`;
    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    const db = getFirestore();
    const searchQuery = query.toLowerCase();
    const results = [];

    try {
        // Buscar por nombre
        const nameQuery = db.collection('pacientes')
            .where('nombre', '>=', searchQuery)
            .where('nombre', '<=', searchQuery + '\uf8ff')
            .limit(10);
        
        const nameSnapshot = await nameQuery.get();
        nameSnapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data(), matchType: 'nombre' });
        });

        // Buscar por apellido
        const lastNameQuery = db.collection('pacientes')
            .where('apellido', '>=', searchQuery)
            .where('apellido', '<=', searchQuery + '\uf8ff')
            .limit(10);
        
        const lastNameSnapshot = await lastNameQuery.get();
        lastNameSnapshot.forEach(doc => {
            const exists = results.find(r => r.id === doc.id);
            if (!exists) {
                results.push({ id: doc.id, ...doc.data(), matchType: 'apellido' });
            }
        });

        // Buscar por RUT (si el query parece un RUT)
        if (query.includes('-') || /^\d+$/.test(query)) {
            const rutQuery = db.collection('pacientes')
                .where('rut', '>=', query)
                .where('rut', '<=', query + '\uf8ff')
                .limit(5);
            
            const rutSnapshot = await rutQuery.get();
            rutSnapshot.forEach(doc => {
                const exists = results.find(r => r.id === doc.id);
                if (!exists) {
                    results.push({ id: doc.id, ...doc.data(), matchType: 'rut' });
                }
            });
        }

        // Buscar por email (si el query parece un email)
        if (query.includes('@')) {
            const emailQuery = db.collection('pacientes')
                .where('email', '>=', searchQuery)
                .where('email', '<=', searchQuery + '\uf8ff')
                .limit(5);
            
            const emailSnapshot = await emailQuery.get();
            emailSnapshot.forEach(doc => {
                const exists = results.find(r => r.id === doc.id);
                if (!exists) {
                    results.push({ id: doc.id, ...doc.data(), matchType: 'email' });
                }
            });
        }

        // Guardar en caché
        searchCache.set(cacheKey, results);
        
        return results;

    } catch (error) {
        console.error('Error en búsqueda:', error);
        return [];
    }
}

// Mostrar resultados de búsqueda rápida
function displayQuickSearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron pacientes</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    const resultsList = document.createElement('div');
    resultsList.className = 'search-results-list';

    results.forEach(patient => {
        const resultItem = createSearchResultItem(patient);
        resultsList.appendChild(resultItem);
    });

    resultsContainer.appendChild(resultsList);
    resultsContainer.style.display = 'block';
}

// Crear item de resultado de búsqueda
function createSearchResultItem(patient) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.dataset.patientId = patient.id;

    const matchIcon = getMatchIcon(patient.matchType);
    const age = calculateAge(patient.fechaNacimiento);

    item.innerHTML = `
        <div class="result-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="result-info">
            <div class="result-name">
                ${patient.nombre} ${patient.apellido}
                ${matchIcon}
            </div>
            <div class="result-details">
                <span>RUT: ${patient.rut}</span>
                <span>Edad: ${age} años</span>
                ${patient.telefono ? `<span>Tel: ${patient.telefono}</span>` : ''}
            </div>
        </div>
        <div class="result-actions">
            <button class="btn-sm" onclick="selectPatientFromSearch('${patient.id}')">
                Seleccionar
            </button>
        </div>
    `;

    return item;
}

// Manejar búsqueda avanzada
async function handleAdvancedSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const filters = {
        nombre: formData.get('search-name')?.trim(),
        apellido: formData.get('search-lastname')?.trim(),
        rut: formData.get('search-rut')?.trim(),
        email: formData.get('search-email')?.trim(),
        telefono: formData.get('search-phone')?.trim(),
        edadMin: formData.get('age-min'),
        edadMax: formData.get('age-max'),
        estado: formData.get('search-status'),
        fechaRegistroDesde: formData.get('date-from'),
        fechaRegistroHasta: formData.get('date-to'),
        genero: formData.get('search-gender'),
        comuna: formData.get('search-comuna'),
        profesionalAsignado: formData.get('search-professional')
    };

    // Remover campos vacíos
    Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === '') {
            delete filters[key];
        }
    });

    if (Object.keys(filters).length === 0) {
        showNotification('Debe especificar al menos un criterio de búsqueda', 'warning');
        return;
    }

    try {
        showSearchLoading(true);
        const results = await performAdvancedSearch(filters);
        displayAdvancedSearchResults(results);
        
        // Cerrar modal
        document.getElementById('advanced-search-modal').style.display = 'none';
        
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        showNotification('Error en la búsqueda avanzada', 'error');
    } finally {
        showSearchLoading(false);
    }
}

// Realizar búsqueda avanzada
async function performAdvancedSearch(filters) {
    const db = getFirestore();
    let query = db.collection('pacientes');
    
    // Aplicar filtros simples
    if (filters.estado) {
        query = query.where('estadoPaciente', '==', filters.estado);
    }
    
    if (filters.genero) {
        query = query.where('genero', '==', filters.genero);
    }
    
    if (filters.comuna) {
        query = query.where('comuna', '==', filters.comuna);
    }
    
    if (filters.profesionalAsignado) {
        query = query.where('profesionalAsignado', '==', filters.profesionalAsignado);
    }

    // Filtros de fecha
    if (filters.fechaRegistroDesde) {
        query = query.where('fechaRegistro', '>=', new Date(filters.fechaRegistroDesde));
    }
    
    if (filters.fechaRegistroHasta) {
        const endDate = new Date(filters.fechaRegistroHasta);
        endDate.setHours(23, 59, 59, 999);
        query = query.where('fechaRegistro', '<=', endDate);
    }

    try {
        const snapshot = await query.get();
        let results = [];
        
        snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });

        // Aplicar filtros que no se pueden hacer en Firestore
        results = applyClientSideFilters(results, filters);
        
        return results;

    } catch (error) {
        console.error('Error en consulta avanzada:', error);
        return [];
    }
}

// Aplicar filtros del lado del cliente
function applyClientSideFilters(results, filters) {
    return results.filter(patient => {
        // Filtro por nombre
        if (filters.nombre) {
            const nombre = patient.nombre.toLowerCase();
            if (!nombre.includes(filters.nombre.toLowerCase())) {
                return false;
            }
        }

        // Filtro por apellido
        if (filters.apellido) {
            const apellido = patient.apellido.toLowerCase();
            if (!apellido.includes(filters.apellido.toLowerCase())) {
                return false;
            }
        }

        // Filtro por RUT
        if (filters.rut) {
            if (!patient.rut.includes(filters.rut)) {
                return false;
            }
        }

        // Filtro por email
        if (filters.email && patient.email) {
            if (!patient.email.toLowerCase().includes(filters.email.toLowerCase())) {
                return false;
            }
        }

        // Filtro por teléfono
        if (filters.telefono && patient.telefono) {
            if (!patient.telefono.includes(filters.telefono)) {
                return false;
            }
        }

        // Filtros de edad
        if (filters.edadMin || filters.edadMax) {
            const age = calculateAge(patient.fechaNacimiento);
            
            if (filters.edadMin && age < parseInt(filters.edadMin)) {
                return false;
            }
            
            if (filters.edadMax && age > parseInt(filters.edadMax)) {
                return false;
            }
        }

        return true;
    });
}

// Mostrar resultados de búsqueda avanzada
function displayAdvancedSearchResults(results) {
    const resultsSection = document.getElementById('advanced-search-results');
    if (!resultsSection) return;

    resultsSection.innerHTML = `
        <div class="search-results-header">
            <h3>Resultados de Búsqueda</h3>
            <span class="results-count">${results.length} pacientes encontrados</span>
            <button class="btn-secondary" onclick="clearAdvancedSearchResults()">
                Limpiar Resultados
            </button>
        </div>
        <div class="search-results-table">
            ${createAdvancedResultsTable(results)}
        </div>
    `;

    resultsSection.style.display = 'block';
}

// Crear tabla de resultados avanzados
function createAdvancedResultsTable(results) {
    if (results.length === 0) {
        return '<div class="no-results">No se encontraron pacientes que coincidan con los criterios de búsqueda</div>';
    }

    let tableHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Edad</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(patient => {
        const age = calculateAge(patient.fechaNacimiento);
        tableHTML += `
            <tr>
                <td>${patient.nombre} ${patient.apellido}</td>
                <td>${patient.rut}</td>
                <td>${age} años</td>
                <td>${patient.telefono || '-'}</td>
                <td>${patient.estadoPaciente || 'Activo'}</td>
                <td>
                    <button class="btn-sm" onclick="viewPatient('${patient.id}')">Ver</button>
                    <button class="btn-sm" onclick="editPatient('${patient.id}')">Editar</button>
                </td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
}

// Configurar filtros de búsqueda
function setupSearchFilters() {
    // Cargar comunas para el filtro
    loadComunasFilter();
    
    // Cargar profesionales para el filtro
    loadProfessionalsFilter();
}

// Cargar comunas para filtro
async function loadComunasFilter() {
    const comunasSelect = document.getElementById('search-comuna');
    if (!comunasSelect) return;

    try {
        const db = getFirestore();
        const pacientesRef = db.collection('pacientes');
        const snapshot = await pacientesRef.get();
        const comunas = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.comuna) {
                comunas.add(data.comuna);
            }
        });

        comunasSelect.innerHTML = '<option value="">Todas las comunas</option>';
        Array.from(comunas).sort().forEach(comuna => {
            const option = document.createElement('option');
            option.value = comuna;
            option.textContent = comuna;
            comunasSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando comunas:', error);
    }
}

/**
 * Carga profesionales para el filtro de búsqueda
 */
export async function loadProfessionalsFilter() {
    try {
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no inicializada');
            return;
        }

        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();
        
        const select = document.getElementById('professional-filter');
        if (!select) {
            console.warn('Elemento professional-filter no encontrado');
            return;
        }

        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Todos los profesionales</option>';

        // Agregar profesionales
        snapshot.forEach(doc => {
            const prof = doc.data();
            const option = document.createElement('option');
            option.value = prof.id || doc.id;
            option.textContent = `${prof.nombre} - ${prof.especialidad || 'Sin especialidad'}`;
            select.appendChild(option);
        });

        console.log(`✅ ${snapshot.size} profesionales cargados en filtro`);

    } catch (error) {
        console.error('❌ Error cargando profesionales para filtro:', error);
        
        // Fallback: crear opción por defecto
        const select = document.getElementById('professional-filter');
        if (select) {
            select.innerHTML = '<option value="">Todos los profesionales</option>';
        }
    }
}

// Funciones utilitarias
function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
        clearSearchResults();
        e.target.value = '';
    }
}

function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
}

window.clearAdvancedSearchResults = function() {
    const resultsSection = document.getElementById('advanced-search-results');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
};

window.selectPatientFromSearch = function(patientId) {
    // Implementar selección de paciente
    console.log('Paciente seleccionado:', patientId);
    clearSearchResults();
};

function getMatchIcon(matchType) {
    const icons = {
        'nombre': '<i class="fas fa-user" title="Coincidencia por nombre"></i>',
        'apellido': '<i class="fas fa-user-tag" title="Coincidencia por apellido"></i>',
        'rut': '<i class="fas fa-id-card" title="Coincidencia por RUT"></i>',
        'email': '<i class="fas fa-envelope" title="Coincidencia por email"></i>'
    };
    return icons[matchType] || '';
}

function showSearchLoading(show) {
    const loadingElement = document.getElementById('search-loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones principales
export { 
    performQuickSearch,
    performAdvancedSearch,
    displayQuickSearchResults,
    clearSearchResults
};
