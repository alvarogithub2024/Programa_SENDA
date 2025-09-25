window.loadSolicitudForResponse = function(solicitudId) { ... }

let currentUserData = null;

function setupTabs() {
    try {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                if (!canAccessTab(targetTab)) {
                    showNotification('No tienes permisos para acceder a esta sección', 'warning');
                    return;
                }

                // Cambiar estado activo
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(`${targetTab}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                    loadTabData(targetTab);
                }
            });
        });

        console.log('✅ Sistema de tabs configurado');
    } catch (error) {
        console.error('Error configurando tabs:', error);
    }
}

 function updateTabVisibility() {
    try {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            const tabName = btn.dataset.tab;
            if (canAccessTab(tabName)) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    // Cambiar a tab por defecto
                    const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
                    const agendaPane = document.getElementById('agenda-tab');
                    if (agendaTab && agendaPane) {
                        agendaTab.classList.add('active');
                        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                        agendaPane.classList.add('active');
                        loadTabData('agenda');
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error actualizando visibilidad de tabs:', error);
    }
}

function loadTabData(tabName) {
    try {
        if (!currentUserData) return;

        switch (tabName) {
            case 'solicitudes':
                if (hasAccessToSolicitudes()) {
                    loadSolicitudesData(); // ✅ CORREGIDO
                }
                break;
            case 'agenda':
                initCalendar();
                loadAppointments();
                break;
            case 'seguimiento':
                loadSeguimientoData(); // ✅ CORREGIDO
                break;
            case 'pacientes':
                loadPatientsData(); // ✅ CORREGIDO
                break;
        }
    } catch (error) {
        console.error('Error cargando datos del tab:', error);
    }
}

function canAccessTab(tabName) {
    if (!currentUserData) return false;
    
    switch (tabName) {
        case 'solicitudes':
            return currentUserData.profession === 'asistente_social';
        case 'agenda':
        case 'seguimiento':
        case 'pacientes':
            return true;
        default:
            return false;
    }
}

function hasAccessToSolicitudes() {
    if (!currentUserData) return false;
    return currentUserData.profession === 'asistente_social';
}

// ✅ FUNCIONES AGREGADAS
async function loadSeguimientoData() {
    try {
        console.log('📊 Cargando datos de seguimiento...');
        if (typeof loadPatientTimeline === 'function') {
            await loadPatientTimeline();
        }
        showNotification('Seguimiento cargado', 'info');
    } catch (error) {
        console.error('Error cargando seguimiento:', error);
        showNotification('Error cargando seguimiento', 'error');
    }
}

async function loadPatientsData() {
    try {
        console.log('👥 Cargando pacientes...');
        if (typeof loadPatients === 'function') {
            await loadPatients();
        }
        showNotification('Pacientes cargados', 'info');
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showNotification('Error cargando pacientes', 'error');
    }
}

function setCurrentUserData(userData) {
    currentUserData = userData;
    updateTabVisibility();
}
