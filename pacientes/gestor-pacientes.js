/**
 * PACIENTES/GESTOR-PACIENTES.JS - VERSIÓN SIN IMPORTS
 * Sistema de gestión de pacientes
 */

// Variables globales
let allPatients = [];
let currentPatients = [];
let currentPage = 1;
const patientsPerPage = 20;

/**
 * FUNCIÓN PRINCIPAL - Inicializar gestor de pacientes
 */
window.initPatientsManager = function() {
    try {
        console.log('👥 Inicializando gestor de pacientes...');
        
        // Verificar que estamos en la pestaña correcta
        const pacientesTab = document.getElementById('pacientes-tab');
        if (!pacientesTab || !pacientesTab.classList.contains('active')) {
            console.log('⏸️ Pacientes no se inicializa - pestaña no activa');
            return;
        }
        
        setupPatientsTable();
        setupPatientsFilters();
        setupPatientsEvents();
        loadPatients();
        
        console.log('✅ Gestor de pacientes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando gestor de pacientes:', error);
    }
};

/**
 * Configurar tabla de pacientes
 */
function setupPatientsTable() {
    const table = document.getElementById('patients-table');
    if (!table) {
        // Crear tabla si no existe
        createPatientsTable();
        return;
    }

    // Crear header de tabla
    const thead = table.querySelector('thead');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th class="sortable" data-sort="nombre">
                    Nombre <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" data-sort="rut">
                    RUT <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" data-sort="edad">
                    Edad <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" data-sort="telefono">
                    Teléfono <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" data-sort="estadoPaciente">
                    Estado <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" data-sort="ultimaCita">
                    Última Cita <i class="fas fa-sort"></i>
                </th>
                <th>Acciones</th>
            </tr>
        `;
    }

    // Configurar ordenamiento
    thead.addEventListener('click', handleTableSort);
}

/**
 * Crear tabla de pacientes si no existe
 */
function createPatientsTable() {
    const grid = document.getElementById('patients-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="patients-header">
            <div class="patients-controls">
                <div class="search-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="patient-search" placeholder="Buscar paciente...">
                    </div>
                    <button class="btn btn-secondary" id="advanced-search-btn">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
                </div>
                <div class="action-controls">
                    <button class="btn btn-primary" id="new-patient-btn">
                        <i class="fas fa-plus"></i> Nuevo Paciente
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" id="export-dropdown">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                        <div class="dropdown-menu">
                            <button id="export-pdf">PDF</button>
                            <button id="export-excel">Excel</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="patients-filters" id="patients-filters" style="display: none;">
                <select id="status-filter">
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="archivado">Archivado</option>
                </select>
                
                <select id="age-filter">
                    <option value="">Todas las edades</option>
                    <option value="menor18">Menor de 18</option>
                    <option value="18-30">18-30 años</option>
                    <option value="31-50">31-50 años</option>
                    <option value="mayor50">Mayor de 50</option>
                </select>
                
                <button class="btn btn-secondary" onclick="clearFilters()">
                    <i class="fas fa-times"></i> Limpiar
                </button>
            </div>
            
            <div class="patients-stats">
                <span id="patients-count">0 pacientes</span>
            </div>
        </div>
        
        <div class="patients-table-container">
            <table class="patients-table" id="patients-table">
                <thead></thead>
                <tbody id="patients-table-body"></tbody>
            </table>
        </div>
        
        <div id="patients-loading" class="loading-state" style="display: none;">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando pacientes...
        </div>
        
        <div class="pagination-controls" id="pagination">
            <!-- Controles de paginación se generan aquí -->
        </div>
    `;
}

/**
 * Cargar pacientes desde Firebase o crear datos de ejemplo
 */
async function loadPatients() {
    try {
        showLoadingState(true);
        
        // Intentar cargar desde Firebase
        const db = window.getFirestore && window.getFirestore();
        if (db) {
            await loadPatientsFromFirebase();
        } else {
            // Crear datos de ejemplo si Firebase no está disponible
            createSamplePatients();
        }

        currentPatients = [...allPatients];
        updatePatientsCount();
        renderPatientsTable();
        
        console.log(`👥 ${allPatients.length} pacientes cargados`);
        
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        if (window.showNotification) {
            window.showNotification('Error al cargar la lista de pacientes', 'error');
        }
        
        // Fallback a datos de ejemplo
        createSamplePatients();
        currentPatients = [...allPatients];
        renderPatientsTable();
    } finally {
        showLoadingState(false);
    }
}

/**
 * Cargar pacientes desde Firebase
 */
async function loadPatientsFromFirebase() {
    try {
        const db = window.getFirestore();
        const pacientesRef = db.collection('pacientes');
        const snapshot = await pacientesRef.orderBy('fechaRegistro', 'desc').get();
        
        allPatients = [];
        snapshot.forEach(doc => {
            allPatients.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        throw error;
    }
}

/**
 * Crear pacientes de ejemplo
 */
function createSamplePatients() {
    console.log('👥 Creando pacientes de ejemplo...');
    
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    allPatients = [
        {
            id: 'patient_001',
            nombre: 'Ana María',
            apellido: 'González López',
            rut: '12.345.678-9',
            fechaNacimiento: new Date(1985, 5, 15),
            telefono: '9 1234 5678',
            email: 'ana.gonzalez@email.com',
            direccion: 'Los Aromos 123, Puente Alto',
            comuna: 'Puente Alto',
            estadoPaciente: 'activo',
            fechaRegistro: lastMonth,
            ultimaCita: lastWeek,
            profesionalAsignado: 'Dr. García',
            genero: 'femenino',
            estadoCivil: 'soltera'
        },
        {
            id: 'patient_002',
            nombre: 'Carlos Alberto',
            apellido: 'Martínez Silva',
            rut: '98.765.432-1',
            fechaNacimiento: new Date(1978, 8, 22),
            telefono: '9 8765 4321',
            email: 'carlos.martinez@email.com',
            direccion: 'Las Rosas 456, Puente Alto',
            comuna: 'Puente Alto',
            estadoPaciente: 'activo',
            fechaRegistro: lastWeek,
            ultimaCita: today,
            profesionalAsignado: 'Dra. López',
            genero: 'masculino',
            estadoCivil: 'casado'
        },
        {
            id: 'patient_003',
            nombre: 'María Elena',
            apellido: 'Rodríguez Pérez',
            rut: '15.678.432-5',
            fechaNacimiento: new Date(1992, 2, 10),
            telefono: '9 5432 1098',
            email: 'maria.rodriguez@email.com',
            direccion: 'Los Pinos 789, Puente Alto',
            comuna: 'Puente Alto',
            estadoPaciente: 'inactivo',
            fechaRegistro: lastMonth,
            ultimaCita: lastMonth,
            profesionalAsignado: 'Dr. Morales',
            genero: 'femenino',
            estadoCivil: 'casada'
        }
    ];
    
    console.log(`✅ ${allPatients.length} pacientes de ejemplo creados`);
}

/**
 * Renderizar tabla de pacientes
 */
function renderPatientsTable() {
    const tbody = document.querySelector('#patients-table tbody');
    if (!tbody) {
        console.warn('⚠️ Tbody de tabla de pacientes no encontrado');
        return;
    }

    tbody.innerHTML = '';

    if (currentPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No se encontraron pacientes</h3>
                        <p>No hay pacientes que coincidan con los filtros aplicados</p>
                        <button class="btn btn-primary" onclick="openNewPatientModal()">
                            <i class="fas fa-plus"></i> Agregar Primer Paciente
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Paginación
    const startIndex = (currentPage - 1) * patientsPerPage;
    const endIndex = Math.min(startIndex + patientsPerPage, currentPatients.length);
    const patientsToShow = currentPatients.slice(startIndex, endIndex);

    patientsToShow.forEach(patient => {
        const row = createPatientRow(patient);
        tbody.appendChild(row);
    });

    updatePagination();
}

/**
 * Crear fila de paciente
 */
function createPatientRow(patient) {
    const row = document.createElement('tr');
    row.dataset.patientId = patient.id;
    row.className = 'patient-row';
    
    const edad = calculateAge(patient.fechaNacimiento);
    const estadoBadge = getStatusBadge(patient.estadoPaciente || 'activo');
    const ultimaCita = patient.ultimaCita ? window.formatDate(patient.ultimaCita) : 'Sin citas';

    row.innerHTML = `
        <td>
            <div class="patient-info">
                <div class="patient-avatar">
                    ${window.getInitials ? window.getInitials(patient.nombre, patient.apellido) : patient.nombre.charAt(0)}
                </div>
                <div class="patient-details">
                    <div class="patient-name">
                        <strong>${patient.nombre} ${patient.apellido}</strong>
                    </div>
                    ${patient.email ? `<div class="patient-email">${patient.email}</div>` : ''}
                </div>
            </div>
        </td>
        <td><span class="rut-display">${patient.rut}</span></td>
        <td><span class="age-display">${edad} años</span></td>
        <td>${patient.telefono || '-'}</td>
        <td>${estadoBadge}</td>
        <td><span class="date-display">${ultimaCita}</span></td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-primary" onclick="viewPatient('${patient.id}')" title="Ver ficha">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-secondary" onclick="editPatient('${patient.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-success" onclick="scheduleAppointment('${patient.id}')" title="Agendar cita">
                    <i class="fas fa-calendar-plus"></i>
                </button>
                <div class="dropdown">
                    <button class="btn-icon btn-secondary dropdown-toggle" title="Más opciones">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <button onclick="contactPatient('${patient.id}')">
                            <i class="fas fa-phone"></i> Contactar
                        </button>
                        <button onclick="viewHistory('${patient.id}')">
                            <i class="fas fa-history"></i> Historial
                        </button>
                        <button onclick="generateReport('${patient.id}')">
                            <i class="fas fa-file-alt"></i> Generar Reporte
                        </button>
                        <hr>
                        <button onclick="archivePatient('${patient.id}')" class="danger">
                            <i class="fas fa-archive"></i> Archivar
                        </button>
                    </div>
                </div>
            </div>
        </td>
    `;

    return row;
}

/**
 * Configurar filtros
 */
function setupPatientsFilters() {
    const searchInput = document.getElementById('patient-search');
    const statusFilter = document.getElementById('status-filter');
    const ageFilter = document.getElementById('age-filter');
    const advancedBtn = document.getElementById('advanced-search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (ageFilter) {
        ageFilter.addEventListener('change', applyFilters);
    }

    if (advancedBtn) {
        advancedBtn.addEventListener('click', toggleAdvancedFilters);
    }
}

/**
 * Manejar búsqueda
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm.length === 0) {
        currentPatients = [...allPatients];
    } else {
        currentPatients = allPatients.filter(patient => {
            return (
                patient.nombre.toLowerCase().includes(searchTerm) ||
                patient.apellido.toLowerCase().includes(searchTerm) ||
                patient.rut.includes(searchTerm) ||
                (patient.email && patient.email.toLowerCase().includes(searchTerm))
            );
        });
    }

    currentPage = 1;
    renderPatientsTable();
    updatePatientsCount();
}

/**
 * Aplicar filtros
 */
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const ageFilter = document.getElementById('age-filter').value;
    const searchTerm = document.getElementById('patient-search').value.toLowerCase().trim();

    currentPatients = allPatients.filter(patient => {
        let passesFilter = true;

        // Filtro de búsqueda
        if (searchTerm) {
            passesFilter = passesFilter && (
                patient.nombre.toLowerCase().includes(searchTerm) ||
                patient.apellido.toLowerCase().includes(searchTerm) ||
                patient.rut.includes(searchTerm) ||
                (patient.email && patient.email.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro de estado
        if (statusFilter) {
            passesFilter = passesFilter && (patient.estadoPaciente || 'activo') === statusFilter;
        }

        // Filtro de edad
        if (ageFilter) {
            const edad = calculateAge(patient.fechaNacimiento);
            switch (ageFilter) {
                case 'menor18':
                    passesFilter = passesFilter && edad < 18;
                    break;
                case '18-30':
                    passesFilter = passesFilter && edad >= 18 && edad <= 30;
                    break;
                case '31-50':
                    passesFilter = passesFilter && edad >= 31 && edad <= 50;
                    break;
                case 'mayor50':
                    passesFilter = passesFilter && edad > 50;
                    break;
            }
        }

        return passesFilter;
    });

    currentPage = 1;
    renderPatientsTable();
    updatePatientsCount();
}

/**
 * Alternar filtros avanzados
 */
function toggleAdvancedFilters() {
    const filtersDiv = document.getElementById('patients-filters');
    if (filtersDiv) {
        filtersDiv.style.display = filtersDiv.style.display === 'none' ? 'flex' : 'none';
    }
}

/**
 * Limpiar filtros
 */
window.clearFilters = function() {
    document.getElementById('patient-search').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('age-filter').value = '';
    
    currentPatients = [...allPatients];
    currentPage = 1;
    renderPatientsTable();
    updatePatientsCount();
    
    if (window.showNotification) {
        window.showNotification('Filtros limpiados', 'info');
    }
};

/**
 * Configurar eventos
 */
function setupPatientsEvents() {
    // Botón nuevo paciente
    const newPatientBtn = document.getElementById('new-patient-btn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', openNewPatientModal);
    }

    // Botones de exportar
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportExcelBtn = document.getElementById('export-excel');

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }

    // Configurar paginación
    setupPagination();
}

/**
 * Manejar ordenamiento de tabla
 */
function handleTableSort(e) {
    const th = e.target.closest('th');
    if (!th || !th.dataset.sort) return;

    const sortField = th.dataset.sort;
    const currentSort = th.classList.contains('sort-asc') ? 'asc' : 
                       th.classList.contains('sort-desc') ? 'desc' : null;

    // Limpiar ordenamiento anterior
    document.querySelectorAll('th.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    // Aplicar nuevo ordenamiento
    let newSort = 'asc';
    if (currentSort === 'asc') newSort = 'desc';
    
    th.classList.add(`sort-${newSort}`);

    // Ordenar datos
    currentPatients.sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';

        // Tratamiento especial para fechas y números
        if (sortField === 'edad') {
            aValue = calculateAge(a.fechaNacimiento);
            bValue = calculateAge(b.fechaNacimiento);
        } else if (sortField === 'ultimaCita') {
            aValue = a.ultimaCita ? new Date(a.ultimaCita) : new Date(0);
            bValue = b.ultimaCita ? new Date(b.ultimaCita) : new Date(0);
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return newSort === 'asc' ? -1 : 1;
        if (aValue > bValue) return newSort === 'asc' ? 1 : -1;
        return 0;
    });

    renderPatientsTable();
}

/**
 * Funciones para acciones de pacientes (expuestas globalmente)
 */
window.viewPatient = function(patientId) {
    console.log('Ver paciente:', patientId);
    if (window.showNotification) {
        window.showNotification('Función de vista de paciente en desarrollo', 'info');
    }
};

window.editPatient = function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient) {
        console.log('Editar paciente:', patient);
        if (window.showNotification) {
            window.showNotification('Función de edición en desarrollo', 'info');
        }
    }
};

window.scheduleAppointment = function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient) {
        console.log('Agendar cita para:', patient);
        if (window.showNotification) {
            window.showNotification('Función de agendamiento en desarrollo', 'info');
        }
    }
};

window.contactPatient = function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient && patient.telefono) {
        window.open(`tel:${patient.telefono}`);
    }
};

window.viewHistory = function(patientId) {
    console.log('Ver historial:', patientId);
    if (window.showNotification) {
        window.showNotification('Función de historial en desarrollo', 'info');
    }
};

window.generateReport = function(patientId) {
    console.log('Generar reporte:', patientId);
    if (window.showNotification) {
        window.showNotification('Función de reportes en desarrollo', 'info');
    }
};

window.archivePatient = async function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;

    const confirmed = confirm(`¿Estás seguro de que quieres archivar a ${patient.nombre} ${patient.apellido}?`);
    if (!confirmed) return;

    try {
        // Intentar actualizar en Firebase si está disponible
        const db = window.getFirestore && window.getFirestore();
        if (db) {
            await db.collection('pacientes').doc(patientId).update({
                estadoPaciente: 'archivado',
                fechaArchivo: window.getServerTimestamp ? window.getServerTimestamp() : new Date()
            });
        }

        // Actualizar localmente
        const patientIndex = allPatients.findIndex(p => p.id === patientId);
        if (patientIndex !== -1) {
            allPatients[patientIndex].estadoPaciente = 'archivado';
        }

        if (window.showNotification) {
            window.showNotification('Paciente archivado correctamente', 'success');
        }
        
        applyFilters(); // Recargar con filtros actuales

    } catch (error) {
        console.error('Error archivando paciente:', error);
        if (window.showNotification) {
            window.showNotification('Error al archivar paciente', 'error');
        }
    }
};

/**
 * Abrir modal de nuevo paciente
 */
function openNewPatientModal() {
    console.log('Abrir modal nuevo paciente');
    if (window.showNotification) {
        window.showNotification('Función de nuevo paciente en desarrollo', 'info');
    }
}

/**
 * Utilidades
 */
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

function getStatusBadge(status) {
    const statusConfig = {
        'activo': { class: 'success', text: 'Activo', icon: '✅' },
        'inactivo': { class: 'warning', text: 'Inactivo', icon: '⚠️' },
        'archivado': { class: 'danger', text: 'Archivado', icon: '📁' },
        'suspendido': { class: 'danger', text: 'Suspendido', icon: '🚫' }
    };

    const config = statusConfig[status] || statusConfig['activo'];
    return `<span class="badge badge-${config.class}" title="${config.text}">
        ${config.icon} ${config.text}
    </span>`;
}

function updatePatientsCount() {
    const countElement = document.getElementById('patients-count');
    if (countElement) {
        const showing = currentPatients.length;
        const total = allPatients.length;
        countElement.textContent = showing === total ? 
            `${total} pacientes` : 
            `${showing} de ${total} pacientes`;
    }
}

function showLoadingState(show) {
    const loading = document.getElementById('patients-loading');
    const table = document.querySelector('.patients-table-container');
    
    if (loading) loading.style.display = show ? 'block' : 'none';
    if (table) table.style.opacity = show ? '0.5' : '1';
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

// Funciones de exportación
function exportToPDF() {
    console.log('Exportar a PDF');
    if (window.showNotification) {
        window.showNotification('Función de exportación a PDF en desarrollo', 'info');
    }
}

function exportToExcel() {
    console.log('Exportar a Excel');
    if (window.showNotification) {
        window.showNotification('Función de exportación a Excel en desarrollo', 'info');
    }
}

// Configurar y actualizar paginación
function setupPagination() {
    // Implementar controles de paginación
}

function updatePagination() {
    const totalPages = Math.ceil(currentPatients.length / patientsPerPage);
    const paginationElement = document.getElementById('pagination');
    
    if (!paginationElement || totalPages <= 1) return;

    paginationElement.innerHTML = `
        <div class="pagination-info">
            Página ${currentPage} de ${totalPages}
        </div>
        <div class="pagination-buttons">
            <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(currentPatients.length / patientsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderPatientsTable();
    }
};

console.log('👥 Gestor de pacientes cargado - Función principal disponible en window.initPatientsManager');
