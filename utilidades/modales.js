// src/js/utilidades/modales.js
export function mostrarModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const primerInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (primerInput && !primerInput.disabled) primerInput.focus();
    }, 100);
    
    console.log(`Modal abierto: ${modalId}`);
  } catch (error) {
    console.error('Error mostrando modal:', error);
  }
}

export function cerrarModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Verificar cambios no guardados para modales específicos
    if (modalId === 'patient-modal' && !esBorradorGuardado()) {
      const tieneCambios = verificarCambiosFormulario();
      if (tieneCambios && !confirm('¿Estás seguro de cerrar? Los cambios no guardados se perderán.')) {
        return;
      }
      import('../formularios/formulario-paciente.js').then(m => m.reiniciarFormulario());
    }
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (modal.classList.contains('temp-modal')) modal.remove();
    
    console.log(`Modal cerrado: ${modalId}`);
  } catch (error) {
    console.error('Error cerrando modal:', error);
  }
}

function verificarCambiosFormulario() {
  try {
    const formulario = document.getElementById('patient-form');
    if (!formulario) return false;
    
    const datosFormulario = new FormData(formulario);
    for (let [clave, valor] of datosFormulario.entries()) {
      if (valor && valor.trim() !== '') return true;
    }
    return false;
  } catch (error) {
    console.error('Error verificando cambios del formulario:', error);
    return false;
  }
}

function esBorradorGuardado() {
  // Implementar lógica de verificación de borrador guardado
  return localStorage.getItem('senda_form_draft') !== null;
}

// Manejar escape para cerrar modales
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalAbierto = document.querySelector('.modal-overlay[style*="flex"]');
    if (modalAbierto) cerrarModal(modalAbierto.id);
  }
});
