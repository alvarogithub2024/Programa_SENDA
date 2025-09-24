/**
 * NAVEGACION/TABS.JS
 * Sistema de pestañas para la navegación del panel profesional
 */

import { loadSolicitudes } from '../solicitudes/gestor-solicitudes.js';
import { loadPacientes } from '../pacientes/gestor-pacientes.js';
import { loadTodayAppointments, renderCalendar } from '../calendario/calendario.js';
import { loadSeguimiento } from '../seguimiento/timeline.js';
import { showNotification } from '../utilidades/notificaciones.js';

let currentUserData = null;

export function setupTabs() {
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
                    loadSolicitudes();
                }
                break;
            case 'agenda':
                loadTodayAppointments();
                renderCalendar();
                break;
            case 'seguimiento':
                loadSeguimiento();
                break;
            case 'pacientes':
                loadPacientes();
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

export function setCurrentUserData(userData) {
    currentUserData = userData;
    updateTabVisibility();
}
