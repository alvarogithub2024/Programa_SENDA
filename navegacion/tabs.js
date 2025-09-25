/**
 * NAVEGACION/TABS.JS - VERSIÓN SIN IMPORTS
 */

let currentUserData = null;

window.setupTabs = function() {
    try {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                if (!canAccessTab(targetTab)) {
                    if (window.showNotification) {
                        window.showNotification('No tienes permisos para acceder a esta sección', 'warning');
                    }
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
};

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
                    if (window.initSolicitudesManager) {
                        window.initSolicitudesManager();
                    }
                }
                break;
            case 'agenda':
                if (window.initCalendar) {
                    window.initCalendar();
                }
                if (window.loadAppointments) {
                    window.loadAppointments();
                }
                break;
            case 'seguimiento':
                if (window.loadSeguimientoData) {
                    window.loadSeguimientoData();
                }
                break;
            case 'pacientes':
                if (window.loadPatientsData) {
                    window.loadPatientsData();
                }
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
window.loadSeguimientoData = async function() {
    try {
        console.log('📊 Cargando datos de seguimiento...');
        if (window.loadPatientTimeline) {
            await window.loadPatientTimeline();
        }
        if (window.showNotification) {
            window.showNotification('Seguimiento cargado', 'info');
        }
    } catch (error) {
        console.error('Error cargando seguimiento:', error);
        if (window.showNotification) {
            window.showNotification('Error cargando seguimiento', 'error');
        }
    }
};

window.loadPatientsData = async function() {
    try {
        console.log('👥 Cargando pacientes...');
        if (window.loadPatients) {
            await window.loadPatients();
        }
        if (window.showNotification) {
            window.showNotification('Pacientes cargados', 'info');
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        if (window.showNotification) {
            window.showNotification('Error cargando pacientes', 'error');
        }
    }
};

window.setCurrentUserData = function(userData) {
    currentUserData = userData;
    updateTabVisibility();
};

// Función para cargar solicitud específica (si se necesita)
window.loadSolicitudForResponse = function(solicitudId) {
    console.log("loadSolicitudForResponse llamada con", solicitudId);
};

console.log('🔄 Sistema de tabs cargado - Funciones disponibles en window');
