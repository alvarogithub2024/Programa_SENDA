/**
 * NAVEGACION/TABS.JS - VERSIÓN CORREGIDA
 */

import { showNotification } from '../utilidades/notificaciones.js';

let currentUserData = null;

export function setupTabs() {
    try {
        console.log('🔧 Configurando sistema de tabs...');
        
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        if (tabBtns.length === 0) {
            console.warn('⚠️ No se encontraron botones de tab');
            return;
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = btn.dataset.tab;
                
                if (!targetTab) {
                    console.warn('⚠️ Tab button sin data-tab:', btn);
                    return;
                }
                
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
                    
                    // Emitir evento personalizado para carga lazy
                    document.dispatchEvent(new CustomEvent('tabChanged', {
                        detail: { tabName: targetTab }
                    }));
                    
                    loadTabData(targetTab);
                } else {
                    console.warn('⚠️ No se encontró el pane para tab:', targetTab);
                }
            });
        });

        console.log('✅ Sistema de tabs configurado');
    } catch (error) {
        console.error('❌ Error configurando tabs:', error);
    }
}

export function updateTabVisibility() {
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
                    showDefaultTab();
                }
            }
        });
        
        console.log('✅ Visibilidad de tabs actualizada');
        
    } catch (error) {
        console.error('❌ Error actualizando visibilidad de tabs:', error);
    }
}

function showDefaultTab() {
    const agendaTab = document.querySelector('.tab-btn[data-tab="agenda"]');
    const agendaPane = document.getElementById('agenda-tab');
    
    if (agendaTab && agendaPane) {
        // Limpiar tabs activos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Activar tab por defecto
        agendaTab.classList.add('active');
        agendaPane.classList.add('active');
        
        loadTabData('agenda');
    }
}

async function loadTabData(tabName) {
    try {
        if (!currentUserData) {
            console.warn('⚠️ No hay datos de usuario para cargar tab:', tabName);
            return;
        }

        console.log(`📋 Cargando datos para tab: ${tabName}`);

        switch (tabName) {
            case 'solicitudes':
                if (hasAccessToSolicitudes()) {
                    await loadSolicitudesModule();
                }
                break;
                
            case 'agenda':
                await loadCalendarioModule();
                break;
                
            case 'seguimiento':
                await loadSeguimientoModule();
                break;
                
            case 'pacientes':
                await loadPacientesModule();
                break;
                
            default:
                console.warn('⚠️ Tab no reconocido:', tabName);
        }
    } catch (error) {
        console.error('❌ Error cargando datos del tab:', error);
        showNotification('Error cargando la sección', 'error');
    }
}

// Funciones de carga lazy de módulos
async function loadSolicitudesModule() {
    try {
        const module = await import('../solicitudes/gestor-solicitudes.js');
        if (module.initSolicitudesManager) {
            module.initSolicitudesManager();
        } else if (module.loadSolicitudesData) {
            module.loadSolicitudesData();
        }
        console.log('✅ Módulo de solicitudes cargado');
    } catch (error) {
        console.error('❌ Error cargando módulo de solicitudes:', error);
    }
}

async function loadCalendarioModule() {
    try {
        const module = await import('../calendario/agenda.js');
        if (module.initCalendar) {
            module.initCalendar();
        }
        console.log('✅ Módulo de calendario cargado');
    } catch (error) {
        console.error('❌ Error cargando módulo de calendario:', error);
    }
}

async function loadSeguimientoModule() {
    try {
        const module = await import('../seguimiento/timeline.js');
        if (module.initTimeline) {
            module.initTimeline();
        }
        console.log('✅ Módulo de seguimiento cargado');
    } catch (error) {
        console.error('❌ Error cargando módulo de seguimiento:', error);
    }
}

async function loadPacientesModule() {
    try {
        const module = await import('../pacientes/gestor-pacientes.js');
        if (module.initPatientsManager) {
            module.initPatientsManager();
        }
        console.log('✅ Módulo de pacientes cargado');
    } catch (error) {
        console.error('❌ Error cargando módulo de pacientes:', error);
    }
}

function canAccessTab(tabName) {
    // Si no hay usuario, no puede acceder a tabs profesionales
    if (!currentUserData) return false;
    
    switch (tabName) {
        case 'solicitudes':
            return hasAccessToSolicitudes();
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

export function setCurrentUserData(userData) {
    currentUserData = userData;
    console.log('👤 Datos de usuario actualizados para tabs:', userData?.nombre);
    updateTabVisibility();
}

export function getCurrentUserData() {
    return currentUserData;
}
