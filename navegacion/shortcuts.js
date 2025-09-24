/**
 * ATAJOS DE TECLADO
 * Sistema de keyboard shortcuts para mejorar la productividad
 */

// Configuración de atajos
const KEYBOARD_SHORTCUTS = {
  // Navegación general
  'Escape': { action: 'closeModal', description: 'Cerrar modal activo' },
  'F1': { action: 'showHelp', description: 'Mostrar ayuda' },
  'F5': { action: 'refreshData', description: 'Actualizar datos', preventDefault: false },
  
  // Navegación de tabs (Alt + número)
  'Alt+1': { action: 'switchToTab', tab: 'solicitudes', description: 'Ir a Solicitudes' },
  'Alt+2': { action: 'switchToTab', tab: 'agenda', description: 'Ir a Agenda' },
  'Alt+3': { action: 'switchToTab', tab: 'seguimiento', description: 'Ir a Seguimiento' },
  'Alt+4': { action: 'switchToTab', tab: 'pacientes', description: 'Ir a Pacientes' },
  
  // Acciones rápidas (Ctrl + letra)
  'Ctrl+n': { action: 'newPatient', description: 'Nueva solicitud paciente' },
  'Ctrl+r': { action: 'newReentry', description: 'Nueva solicitud reingreso' },
  'Ctrl+c': { action: 'newAppointment', description: 'Nueva cita' },
  'Ctrl+f': { action: 'focusSearch', description: 'Enfocar búsqueda' },
  'Ctrl+s': { action: 'saveForm', description: 'Guardar formulario' },
  'Ctrl+e': { action: 'exportData', description: 'Exportar datos' },
  
  // Navegación de calendario
  'ArrowLeft': { action: 'prevMonth', context: 'calendar', description: 'Mes anterior' },
  'ArrowRight': { action: 'nextMonth', context: 'calendar', description: 'Mes siguiente' },
  'Home': { action: 'todayCalendar', context: 'calendar', description: 'Ir a hoy' },
  
  // Formularios
  'Ctrl+Enter': { action: 'submitForm', context: 'form', description: 'Enviar formulario' },
  'Shift+Tab': { action: 'prevFormStep', context: 'form', description: 'Paso anterior' },
  'Tab': { action: 'nextFormStep', context: 'form', description: 'Siguiente paso', preventDefault: false },
  
  // Filtros y búsqueda
  'Ctrl+Shift+f': { action: 'advancedSearch', description: 'Búsqueda avanzada' },
  'Ctrl+Shift+c': { action: 'clearFilters', description: 'Limpiar filtros' },
  
  // Utilidades
  'Ctrl+l': { action: 'toggleLoadingTest', description: 'Test de carga (debug)' },
  'Ctrl+Shift+d': { action: 'toggleDebugMode', description: 'Modo debug' }
};

// Estado de los atajos
let shortcutsEnabled = true;
let currentContext = 'global';
let pressedKeys = new Set();
let keySequence = [];
let sequenceTimeout = null;

/**
 * Inicializar sistema de atajos de teclado
 */
function initializeKeyboardShortcuts() {
  try {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('focus', updateContext);
    document.addEventListener('blur', updateContext);
    
    // Configurar tooltips de ayuda
    setupShortcutTooltips();
    
    console.log('✅ Sistema de atajos de teclado inicializado');
    console.log('💡 Presiona F1 para ver todos los atajos disponibles');
  } catch (error) {
    console.error('Error inicializando atajos de teclado:', error);
  }
}

/**
 * Manejar teclas presionadas
 */
function handleKeyDown(e) {
  if (!shortcutsEnabled) return;
  
  // Evitar atajos en campos de texto (excepto algunos específicos)
  if (isInputElement(e.target) && !isAllowedInInput(e)) {
    return;
  }
  
  pressedKeys.add(e.key);
  const shortcut = getShortcutString(e);
  
  // Agregar a secuencia
  keySequence.push(e.key);
  if (keySequence.length > 3) {
    keySequence = keySequence.slice(-3);
  }
  
  // Limpiar secuencia después de 2 segundos
  clearTimeout(sequenceTimeout);
  sequenceTimeout = setTimeout(() => {
    keySequence = [];
  }, 2000);
  
  // Buscar y ejecutar atajo
  const shortcutConfig = KEYBOARD_SHORTCUTS[shortcut];
  if (shortcutConfig) {
    // Verificar contexto
    if (shortcutConfig.context && shortcutConfig.context !== currentContext) {
      return;
    }
    
    // Prevenir comportamiento por defecto si es necesario
    if (shortcutConfig.preventDefault !== false) {
      e.preventDefault();
    }
    
    executeShortcut(shortcutConfig, e);
    
    // Mostrar notificación visual del atajo ejecutado
    if (APP_CONFIG && APP_CONFIG.DEBUG_MODE) {
      showShortcutFeedback(shortcut, shortcutConfig.description);
    }
  }
  
  // Atajos especiales de secuencia
  handleSequenceShortcuts();
}

/**
 * Manejar teclas liberadas
 */
function handleKeyUp(e) {
  pressedKeys.delete(e.key);
}

/**
 * Generar string del atajo
 */
function getShortcutString(e) {
  const parts = [];
  
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');
  
  // Agregar la tecla principal
  if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
    parts.push(e.key);
  }
  
  return parts.join('+');
}

/**
 * Verificar si es elemento de input
 */
function isInputElement(element) {
  const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
  return inputTypes.includes(element.tagName) || element.contentEditable === 'true';
}

/**
 * Verificar si el atajo está permitido en inputs
 */
function isAllowedInInput(e) {
  const allowedShortcuts = [
    'Escape',
    'F1',
    'Ctrl+s',
    'Ctrl+Enter',
    'Shift+Tab'
  ];
  
  const shortcut = getShortcutString(e);
  return allowedShortcuts.includes(shortcut);
}

/**
 * Actualizar contexto basado en el elemento enfocado
 */
function updateContext(e) {
  const activeElement = document.activeElement;
  
  if (!activeElement) {
    currentContext = 'global';
    return;
  }
  
  // Detectar contexto por clases o IDs
  if (activeElement.closest('.calendar-container')) {
    currentContext = 'calendar';
  } else if (activeElement.closest('form')) {
    currentContext = 'form';
  } else if (activeElement.closest('.modal')) {
    currentContext = 'modal';
  } else {
    currentContext = 'global';
  }
}

/**
 * Ejecutar acción del atajo
 */
function executeShortcut(shortcutConfig, event) {
  try {
    switch (shortcutConfig.action) {
      case 'closeModal':
        closeTopModal();
        break;
        
      case 'showHelp':
        showKeyboardShortcutsHelp();
        break;
        
      case 'refreshData':
        refreshCurrentTabData();
        break;
        
      case 'switchToTab':
        switchToTab(shortcutConfig.tab);
        break;
        
      case 'newPatient':
        if (typeof window.resetForm === 'function') {
          window.resetForm();
        }
        showModal('patient-modal');
        break;
        
      case 'newReentry':
        showModal('reentry-modal');
        break;
        
      case 'newAppointment':
        if (typeof window.createNuevaCitaModal === 'function') {
          window.createNuevaCitaModal();
        }
        break;
        
      case 'focusSearch':
        focusSearchField();
        break;
        
      case 'saveForm':
        saveCurrentForm();
        break;
        
      case 'exportData':
        exportCurrentData();
        break;
        
      case 'prevMonth':
        navigateCalendar(-1);
        break;
        
      case 'nextMonth':
        navigateCalendar(1);
        break;
        
      case 'todayCalendar':
        goToToday();
        break;
        
      case 'submitForm':
        submitCurrentForm();
        break;
        
      case 'prevFormStep':
        navigateFormStep(-1);
        break;
        
      case 'nextFormStep':
        navigateFormStep(1);
        break;
        
      case 'advancedSearch':
        showAdvancedSearchModal();
        break;
        
      case 'clearFilters':
        clearAllFilters();
        break;
        
      case 'toggleLoadingTest':
        toggleLoadingTest();
        break;
        
      case 'toggleDebugMode':
        toggleDebugMode();
        break;
        
      default:
        console.warn('Acción de atajo no implementada:', shortcutConfig.action);
    }
  } catch (error) {
    console.error('Error ejecutando atajo:', error);
    showNotification('Error ejecutando atajo de teclado', 'error');
  }
}

/**
 * Manejar atajos de secuencia especiales
 */
function handleSequenceShortcuts() {
  const sequence = keySequence.join('').toLowerCase();
  
  // Secuencia de desarrollador: "dev"
  if (sequence.includes('dev')) {
    showDeveloperConsole();
    keySequence = [];
  }
  
  // Secuencia de ayuda: "help"
  if (sequence.includes('help')) {
    showKeyboardShortcutsHelp();
    keySequence = [];
  }
}

/**
 * Cerrar modal superior
 */
function closeTopModal() {
  const openModals = document.querySelectorAll('.modal-overlay[style*="flex"]');
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    closeModal(topModal.id);
  }
}

/**
 * Cambiar a tab específico
 */
function switchToTab(tabName) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (tabBtn && tabBtn.style.display !== 'none') {
    tabBtn.click();
  }
}

/**
 * Enfocar campo de búsqueda
 */
function focusSearchField() {
  const searchFields = [
    '#search-pacientes-rut',
    '#search-pacientes-nombre',
    '.search-input'
  ];
  
  for (let selector of searchFields) {
    const field = document.querySelector(selector);
    if (field && field.style.display !== 'none') {
      field.focus();
      field.select();
      break;
    }
  }
}

/**
 * Guardar formulario actual
 */
function saveCurrentForm() {
  if (currentContext === 'form' && typeof saveFormDraft === 'function') {
    saveFormDraft();
    showNotification('Borrador guardado', 'success', 2000);
  }
}

/**
 * Exportar datos actuales
 */
function exportCurrentData() {
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  
  switch (activeTab) {
    case 'pacientes':
      if (typeof window.exportarResultadosBusqueda === 'function') {
        window.exportarResultadosBusqueda();
      }
      break;
    default:
      showNotification('Exportación no disponible en esta sección', 'info');
  }
}

/**
 * Navegar calendario
 */
function navigateCalendar(direction) {
  if (currentContext === 'calendar') {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (direction < 0 && prevBtn) {
      prevBtn.click();
    } else if (direction > 0 && nextBtn) {
      nextBtn.click();
    }
  }
}

/**
 * Ir a hoy en el calendario
 */
function goToToday() {
  if (currentContext === 'calendar' && typeof loadTodayAppointments === 'function') {
    currentCalendarDate = new Date();
    renderCalendar();
    loadTodayAppointments();
  }
}

/**
 * Enviar formulario actual
 */
function submitCurrentForm() {
  const activeForm = document.querySelector('form:focus-within');
  if (activeForm) {
    const submitBtn = activeForm.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
    }
  }
}

/**
 * Navegar pasos del formulario
 */
function navigateFormStep(direction) {
  if (currentContext === 'form') {
    if (direction > 0) {
      const nextBtn = document.querySelector('[id^="next-step"]:not([style*="none"])');
      if (nextBtn) nextBtn.click();
    } else {
      const prevBtn = document.querySelector('[id^="prev-step"]:not([style*="none"])');
      if (prevBtn) prevBtn.click();
    }
  }
}

/**
 * Mostrar modal de búsqueda avanzada
 */
function showAdvancedSearchModal() {
  // Implementar modal de búsqueda avanzada
  showNotification('Búsqueda avanzada no implementada aún', 'info');
}

/**
 * Limpiar todos los filtros
 */
function clearAllFilters() {
  // Limpiar filtros de prioridad
  const priorityFilter = document.getElementById('priority-filter');
  if (priorityFilter) {
    priorityFilter.value = '';
    priorityFilter.dispatchEvent(new Event('change'));
  }
  
  // Limpiar búsquedas
  if (typeof window.clearSearchResults === 'function') {
    window.clearSearchResults();
  }
  
  showNotification('Filtros limpiados', 'success', 2000);
}

/**
 * Refrescar datos del tab actual
 */
function refreshCurrentTabData() {
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  
  if (typeof loadTabData === 'function') {
    loadTabData(activeTab);
    showNotification('Datos actualizados', 'success', 2000);
  }
}

/**
 * Test de loading (debug)
 */
function toggleLoadingTest() {
  if (typeof showLoading === 'function') {
    showLoading(true, 'Test de carga - Presiona Ctrl+L nuevamente para cerrar');
    
    setTimeout(() => {
      showLoading(false);
    }, 3000);
  }
}

/**
 * Toggle modo debug
 */
function toggleDebugMode() {
  if (typeof APP_CONFIG !== 'undefined') {
    APP_CONFIG.DEBUG_MODE = !APP_CONFIG.DEBUG_MODE;
    showNotification(
      `Modo debug: ${APP_CONFIG.DEBUG_MODE ? 'activado' : 'desactivado'}`, 
      'info'
    );
  }
}

/**
 * Mostrar consola de desarrollador
 */
function showDeveloperConsole() {
  const devInfo = {
    shortcuts: KEYBOARD_SHORTCUTS,
    context: currentContext,
    pressedKeys: Array.from(pressedKeys),
    sequence: keySequence,
    userData: typeof currentUserData !== 'undefined' ? currentUserData : null
  };
  
  console.log('🔧 SENDA Developer Console', devInfo);
  showNotification('Información de debug enviada a consola', 'info');
}

/**
 * Mostrar ayuda de atajos de teclado
 */
function showKeyboardShortcutsHelp() {
  const helpModal = createShortcutsHelpModal();
  document.body.insertAdjacentHTML('beforeend', helpModal);
  showModal('keyboard-shortcuts-help');
}

/**
 * Crear modal de ayuda
 */
function createShortcutsHelpModal() {
  const shortcuts = Object.entries(KEYBOARD_SHORTCUTS)
    .filter(([key, config]) => !key.includes('Shift+') || key === 'Shift+Tab')
    .sort(([a], [b]) => a.localeCompare(b));
  
  const shortcutsByCategory = {
    'Navegación': shortcuts.filter(([key]) => key.includes('Alt+') || ['Escape', 'F1'].includes(key)),
    'Acciones': shortcuts.filter(([key]) => key.includes('Ctrl+') && !key.includes('Shift')),
    'Calendario': shortcuts.filter(([_, config]) => config.context === 'calendar'),
    'Formularios': shortcuts.filter(([_, config]) => config.context === 'form'),
    'Avanzadas': shortcuts.filter(([key]) => key.includes('Shift+') && key.includes('Ctrl+'))
  };
  
  let categoriesHtml = '';
  
  Object.entries(shortcutsByCategory).forEach(([category, categoryShortcuts]) => {
    if (categoryShortcuts.length > 0) {
      categoriesHtml += `
        <div class="shortcuts-category">
          <h4>${category}</h4>
          <div class="shortcuts-list">
            ${categoryShortcuts.map(([key, config]) => `
              <div class="shortcut-item">
                <kbd class="keyboard-key">${key.replace(/\+/g, ' + ')}</kbd>
                <span class="shortcut-description">${config.description}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });
  
  return `
    <div class="modal-overlay temp-modal" id="keyboard-shortcuts-help">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('keyboard-shortcuts-help')">
          <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 24px;">
          <h2><i class="fas fa-keyboard"></i> Atajos de Teclado</h2>
          
          <div class="shortcuts-help-content" style="max-height: 400px; overflow-y: auto;">
            ${categoriesHtml}
            
            <div class="shortcuts-category">
              <h4>Secuencias Especiales</h4>
              <div class="shortcuts-list">
                <div class="shortcut-item">
                  <kbd class="keyboard-key">d-e-v</kbd>
                  <span class="shortcut-description">Abrir consola de desarrollador</span>
                </div>
                <div class="shortcut-item">
                  <kbd class="keyboard-key">h-e-l-p</kbd>
                  <span class="shortcut-description">Mostrar esta ayuda</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background: var(--light-blue); border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">
              <i class="fas fa-info-circle"></i> Consejos
            </h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Los atajos funcionan en contextos específicos (global, calendario, formulario)</li>
              <li>Algunos atajos están deshabilitados en campos de texto</li>
              <li>Las secuencias se detectan escribiendo las letras seguidas</li>
              <li>Presiona F5 para recargar la página sin usar atajos</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <button class="btn btn-primary" onclick="closeModal('keyboard-shortcuts-help')">
              <i class="fas fa-check"></i>
              Entendido
            </button>
            <button class="btn btn-outline ml-2" onclick="toggleKeyboardShortcuts()">
              <i class="fas fa-power-off"></i>
              Desactivar Atajos
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Configurar tooltips de ayuda
 */
function setupShortcutTooltips() {
  // Agregar tooltips a botones principales
  const buttonsWithShortcuts = [
    { id: 'register-patient', shortcut: 'Ctrl+N' },
    { id: 'reentry-program', shortcut: 'Ctrl+R' },
    { id: 'nueva-cita-btn', shortcut: 'Ctrl+C' },
    { id: 'buscar-paciente-btn', shortcut: 'Ctrl+F' }
  ];
  
  buttonsWithShortcuts.forEach(({ id, shortcut }) => {
    const button = document.getElementById(id);
    if (button) {
      const originalTitle = button.title || button.textContent.trim();
      button.title = `${originalTitle} (${shortcut})`;
      
      // Agregar badge visual
      if (!button.querySelector('.shortcut-badge')) {
        const badge = document.createElement('span');
        badge.className = 'shortcut-badge';
        badge.textContent = shortcut;
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--primary-blue);
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 3px;
          opacity: 0.7;
          pointer-events: none;
        `;
        
        if (button.style.position !== 'absolute' && button.style.position !== 'relative') {
          button.style.position = 'relative';
        }
        
        button.appendChild(badge);
      }
    }
  });
}

/**
 * Mostrar feedback visual del atajo ejecutado
 */
function showShortcutFeedback(shortcut, description) {
  const feedback = document.createElement('div');
  feedback.className = 'shortcut-feedback';
  feedback.innerHTML = `
    <div class="shortcut-feedback-content">
      <kbd>${shortcut}</kbd>
      <span>${description}</span>
    </div>
  `;
  
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 10000;
    animation: shortcutFadeInOut 2s ease-in-out;
    pointer-events: none;
  `;
  
  // Agregar animación CSS si no existe
  if (!document.querySelector('#shortcut-animations')) {
    const style = document.createElement('style');
    style.id = 'shortcut-animations';
    style.textContent = `
      @keyframes shortcutFadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
      
      .shortcut-feedback kbd {
        background: #333;
        border: 1px solid #666;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: monospace;
        margin-right: 8px;
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 2000);
}

/**
 * Toggle activación/desactivación de atajos
 */
function toggleKeyboardShortcuts() {
  shortcutsEnabled = !shortcutsEnabled;
  
  const status = shortcutsEnabled ? 'activados' : 'desactivados';
  showNotification(`Atajos de teclado ${status}`, 'info');
  
  // Actualizar botón en modal de ayuda
  const toggleBtn = document.querySelector('#keyboard-shortcuts-help button[onclick*="toggleKeyboardShortcuts"]');
  if (toggleBtn) {
    toggleBtn.innerHTML = shortcutsEnabled 
      ? '<i class="fas fa-power-off"></i> Desactivar Atajos'
      : '<i class="fas fa-power-on"></i> Activar Atajos';
  }
  
  console.log(`🎹 Atajos de teclado ${status}`);
}

/**
 * Registrar atajo personalizado
 */
function registerCustomShortcut(shortcut, config) {
  try {
    if (KEYBOARD_SHORTCUTS[shortcut]) {
      console.warn(`Atajo ${shortcut} ya existe, será sobrescrito`);
    }
    
    KEYBOARD_SHORTCUTS[shortcut] = {
      ...config,
      custom: true
    };
    
    console.log(`✅ Atajo personalizado registrado: ${shortcut}`);
    return true;
  } catch (error) {
    console.error('Error registrando atajo personalizado:', error);
    return false;
  }
}

/**
 * Remover atajo personalizado
 */
function removeCustomShortcut(shortcut) {
  try {
    if (KEYBOARD_SHORTCUTS[shortcut] && KEYBOARD_SHORTCUTS[shortcut].custom) {
      delete KEYBOARD_SHORTCUTS[shortcut];
      console.log(`🗑️ Atajo personalizado removido: ${shortcut}`);
      return true;
    } else {
      console.warn(`Atajo ${shortcut} no existe o no es personalizado`);
      return false;
    }
  } catch (error) {
    console.error('Error removiendo atajo personalizado:', error);
    return false;
  }
}

/**
 * Obtener atajos activos
 */
function getActiveShortcuts() {
  return {
    enabled: shortcutsEnabled,
    context: currentContext,
    shortcuts: KEYBOARD_SHORTCUTS,
    pressedKeys: Array.from(pressedKeys),
    sequence: keySequence
  };
}

/**
 * Configurar atajos específicos del usuario
 */
function setupUserSpecificShortcuts() {
  // Atajos específicos para asistente social
  if (currentUserData && currentUserData.profession === 'asistente_social') {
    registerCustomShortcut('Ctrl+Shift+s', {
      action: 'switchToTab',
      tab: 'solicitudes',
      description: 'Ir a Solicitudes (Asistente Social)'
    });
  }
  
  // Atajos específicos para coordinadores
  if (currentUserData && currentUserData.profession === 'coordinador') {
    registerCustomShortcut('Ctrl+Shift+r', {
      action: 'generateReport',
      description: 'Generar reporte (Coordinador)'
    });
  }
}

/**
 * Limpiar estado de atajos
 */
function cleanupKeyboardShortcuts() {
  pressedKeys.clear();
  keySequence = [];
  clearTimeout(sequenceTimeout);
  currentContext = 'global';
}

/**
 * Exportar configuración de atajos
 */
function exportShortcutsConfig() {
  const config = {
    shortcuts: KEYBOARD_SHORTCUTS,
    enabled: shortcutsEnabled,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `senda_shortcuts_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification('Configuración de atajos exportada', 'success');
}

/**
 * Importar configuración de atajos
 */
function importShortcutsConfig(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result);
      
      if (config.shortcuts) {
        // Sobrescribir solo atajos personalizados
        Object.entries(config.shortcuts).forEach(([key, shortcutConfig]) => {
          if (shortcutConfig.custom) {
            KEYBOARD_SHORTCUTS[key] = shortcutConfig;
          }
        });
        
        showNotification('Configuración de atajos importada', 'success');
      }
    } catch (error) {
      showNotification('Error importando configuración', 'error');
    }
  };
  reader.readAsText(file);
}

// Exportar funciones principales
if (typeof window !== 'undefined') {
  window.initializeKeyboardShortcuts = initializeKeyboardShortcuts;
  window.toggleKeyboardShortcuts = toggleKeyboardShortcuts;
  window.showKeyboardShortcutsHelp = showKeyboardShortcutsHelp;
  window.registerCustomShortcut = registerCustomShortcut;
  window.removeCustomShortcut = removeCustomShortcut;
  window.getActiveShortcuts = getActiveShortcuts;
  window.setupUserSpecificShortcuts = setupUserSpecificShortcuts;
  window.cleanupKeyboardShortcuts = cleanupKeyboardShortcuts;
  window.exportShortcutsConfig = exportShortcutsConfig;
  window.importShortcutsConfig = importShortcutsConfig;
  
  // Variables globales para debugging
  window.KEYBOARD_SHORTCUTS = KEYBOARD_SHORTCUTS;
}

// Auto-inicializar cuando se carga el DOM
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardShortcuts);
  } else {
    initializeKeyboardShortcuts();
  }
}

console.log('✅ Módulo de atajos de teclado cargado');
console.log('💡 Atajos disponibles:', Object.keys(KEYBOARD_SHORTCUTS).length);
