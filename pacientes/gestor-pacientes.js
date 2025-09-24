import { db as firestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';
import { validateRUT } from '../formularios/validaciones.js';

// Variables globales
let allPatients = [];
let currentPatients = [];
let currentPage = 1;
const patientsPerPage = 20;

// Inicializar gestor de pacientes
export function initPatientsManager() {
    setupPatientsTable();
    setupPatientsFilters();
    setupPatientsEvents();
    loadPatients();
    console.log('👥 Gestor de pacientes inicializado');
}

// Configurar tabla de pacientes
function setupPatientsTable() {
    const table = document.getElementById('patients-table');
    if (!table) return;

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

// Cargar pacientes desde Firebase
async function loadPatients() {
    try {
        showLoadingState(true);
        
        const pacientesRef = db.collection('pacientes');
        const snapshot = await pacientesRef.orderBy('fechaRegistro', 'desc').get();
        
        allPatients = [];
        snapshot.forEach(doc => {
            allPatients.push({
                id: doc.id,
                ...doc.data()
            });
        });

        currentPatients = [...allPatients];
        updatePatientsCount();
        renderPatientsTable();
        
        console.log(`👥 ${allPatients.length} pacientes cargados`);
        
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('Error al cargar la lista de pacientes', 'error');
    } finally {
        showLoadingState(false);
    }
}

// Renderizar tabla de pacientes
function renderPatientsTable() {
    const tbody = document.querySelector('#patients-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (currentPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    No se encontraron pacientes
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

// Crear fila de paciente
function createPatientRow(patient) {
    const row = document.createElement('tr');
    row.dataset.patientId = patient.id;
    
    const edad = calculateAge(patient.fechaNacimiento);
    const estadoBadge = getStatusBadge(patient.estadoPaciente || 'activo');
    const ultimaCita = patient.ultimaCita ? formatDate(patient.ultimaCita) : 'Sin citas';

    row.innerHTML = `
        <td>
            <div class="patient-name">
                <strong>${patient.nombre} ${patient.apellido}</strong>
                ${patient.email ? `<small>${patient.email}</small>` : ''}
            </div>
        </td>
        <td>${patient.rut}</td>
        <td>${edad} años</td>
        <td>${patient.telefono || '-'}</td>
        <td>${estadoBadge}</td>
        <td>${ultimaCita}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon" onclick="viewPatient('${patient.id}')" title="Ver ficha">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editPatient('${patient.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="scheduleAppointment('${patient.id}')" title="Agendar cita">
                    <i class="fas fa-calendar-plus"></i>
                </button>
                <button class="btn-icon danger" onclick="archivePatient('${patient.id}')" title="Archivar">
                    <i class="fas fa-archive"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// Configurar filtros
function setupPatientsFilters() {
    const searchInput = document.getElementById('patient-search');
    const statusFilter = document.getElementById('status-filter');
    const ageFilter = document.getElementById('age-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (ageFilter) {
        ageFilter.addEventListener('change', applyFilters);
    }
}

// Manejar búsqueda
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

// Aplicar filtros
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
        if (statusFilter && statusFilter !== 'todos') {
            passesFilter = passesFilter && (patient.estadoPaciente || 'activo') === statusFilter;
        }

        // Filtro de edad
        if (ageFilter && ageFilter !== 'todos') {
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

// Configurar eventos
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

// Manejar ordenamiento de tabla
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

// Funciones para acciones de pacientes (expuestas globalmente)
window.viewPatient = function(patientId) {
    window.location.href = `#ficha-paciente/${patientId}`;
};

window.editPatient = function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient) {
        openEditPatientModal(patient);
    }
};

window.scheduleAppointment = function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (patient) {
        openScheduleAppointmentModal(patient);
    }
};

window.archivePatient = async function(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;

    const confirmed = confirm(`¿Estás seguro de que quieres archivar a ${patient.nombre} ${patient.apellido}?`);
    if (!confirmed) return;

    try {
        await db.collection('pacientes').doc(patientId).update({
            estadoPaciente: 'archivado',
            fechaArchivo: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('Paciente archivado correctamente', 'success');
        await loadPatients();

    } catch (error) {
        console.error('Error archivando paciente:', error);
        showNotification('Error al archivar paciente', 'error');
    }
};

// Utilidades
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
        'activo': { class: 'success', text: 'Activo' },
        'inactivo': { class: 'warning', text: 'Inactivo' },
        'archivado': { class: 'danger', text: 'Archivado' },
        'suspendido': { class: 'danger', text: 'Suspendido' }
    };

    const config = statusConfig[status] || statusConfig['activo'];
    return `<span class="badge badge-${config.class}">${config.text}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function updatePatientsCount() {
    const countElement = document.getElementById('patients-count');
    if (countElement) {
        countElement.textContent = `${currentPatients.length} pacientes`;
    }
}

function showLoadingState(show) {
    const loading = document.getElementById('patients-loading');
    const table = document.getElementById('patients-table');
    
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

// Funciones de modal (se implementarán en otros archivos)
function openNewPatientModal() {
    // Implementar en formularios
    console.log('Abrir modal nuevo paciente');
}

function openEditPatientModal(patient) {
    // Implementar en formularios
    console.log('Editar paciente:', patient);
}

function openScheduleAppointmentModal(patient) {
    // Implementar en calendario
    console.log('Agendar cita para:', patient);
}

// Funciones de exportación
function exportToPDF() {
    console.log('Exportar a PDF');
    showNotification('Función de exportación en desarrollo', 'info');
}

function exportToExcel() {
    console.log('Exportar a Excel');
    showNotification('Función de exportación en desarrollo', 'info');
}

// Configurar y actualizar paginación
function setupPagination() {
    // Implementar controles de paginación
}

function updatePagination() {
    const totalPages = Math.ceil(currentPatients.length / patientsPerPage);
    const paginationElement = document.getElementById('pagination');
    
    if (!paginationElement) return;

    paginationElement.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
        <span>Página ${currentPage} de ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

window.changePage = function(page) {
    const totalPages = Math.ceil(currentPatients.length / patientsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderPatientsTable();
    }
};

// Exportar funciones principales
export { 
    loadPatients,
    renderPatientsTable,
    handleSearch,
    applyFilters
};
