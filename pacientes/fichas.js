// ========== pacientes/fichas.js - CORREGIDO PARA USAR ID DE PACIENTE ==========

(function() {
    // ... (todo el código anterior igual) ...

    window.mostrarFormularioNuevaAtencionUnificada = function(pacienteId) {
        if (!window.puedeCrearAtenciones || !window.puedeCrearAtenciones()) {
            window.mostrarMensajePermisos && window.mostrarMensajePermisos('crear nuevas atenciones');
            return;
        }

        const modalHTML = `
            <div class="modal-overlay" id="modal-nueva-atencion">
                <div class="modal-content" style="max-width:500px;">
                    <span class="close" onclick="cerrarModalNuevaAtencion()">&times;</span>
                    <h2 style="color:#2563eb; margin-bottom:1.5rem;">
                        <i class="fas fa-plus-circle"></i> Nueva Atención
                    </h2>
                    <form id="form-nueva-atencion">
                        <div class="form-group">
                            <label for="nueva-atencion-tipo">Tipo de atención *</label>
                            <select id="nueva-atencion-tipo" class="form-select" required>
                                <option value="">Selecciona tipo...</option>
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="orientacion">Orientación</option>
                                <option value="intervencion">Intervención</option>
                                <option value="derivacion">Derivación</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="nueva-atencion-descripcion">Descripción de la atención *</label>
                            <textarea id="nueva-atencion-descripcion" class="form-textarea" rows="5" 
                                      placeholder="Describe la atención realizada, observaciones, recomendaciones..." required></textarea>
                        </div>
                        <div class="form-actions" style="display:flex; gap:1rem; justify-content:flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModalNuevaAtencion()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-save"></i> Guardar Atención
                            </button>
                        </div>
                        <input type="hidden" id="nueva-atencion-paciente-id" value="${pacienteId}">
                    </form>
                </div>
            </div>
        `;

        let modalElement = document.getElementById('modal-nueva-atencion');
        if (modalElement) {
            modalElement.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('modal-nueva-atencion').style.display = 'flex';
        document.getElementById('nueva-atencion-descripcion').focus();
        document.getElementById('form-nueva-atencion').onsubmit = guardarNuevaAtencionUnificada;
    };

    async function guardarNuevaAtencionUnificada(event) {
        event.preventDefault();
        const tipo = document.getElementById('nueva-atencion-tipo').value;
        const descripcion = document.getElementById('nueva-atencion-descripcion').value.trim();
        const pacienteId = document.getElementById('nueva-atencion-paciente-id').value;

        if (!tipo || !descripcion) {
            window.showNotification && window.showNotification('Completa todos los campos obligatorios', 'warning');
            return;
        }

        try {
            const profesional = await obtenerProfesionalActual();
            if (!profesional) {
                window.showNotification && window.showNotification('Error: No se pudo obtener información del profesional', 'error');
                return;
            }

            // Obtener datos básicos del paciente
            const db = window.getFirestore();
            const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
            const pacienteData = pacienteDoc.exists ? pacienteDoc.data() : {};

            const nuevaAtencion = {
                pacienteId: pacienteId,
                pacienteNombre: pacienteData.nombre || '',
                pacienteRut: pacienteData.rut || '',
                profesional: `${profesional.nombre} ${profesional.apellidos}`,
                profesionalId: profesional.id,
                tipoAtencion: tipo,
                descripcion: descripcion,
                fechaRegistro: new Date(),
                fechaCreacion: new Date().toISOString(),
                cesfam: pacienteData.cesfam || profesional.cesfam || ''
            };

            // Usar el sistema unificado si está presente
            if (window.SISTEMA_ID_UNIFICADO && window.SISTEMA_ID_UNIFICADO.crearAtencionUnificada) {
                const resultado = await window.SISTEMA_ID_UNIFICADO.crearAtencionUnificada(nuevaAtencion);
                console.log('Atención creada con ID:', resultado.atencionId);
            } else {
                // Fallback directo
                await db.collection('atenciones').add(nuevaAtencion);
            }

            window.showNotification && window.showNotification('Atención registrada correctamente', 'success');
            cerrarModalNuevaAtencion();

            await cargarHistorialClinicoUnificado(pacienteId, window.puedeEditarHistorial());
        } catch (error) {
            console.error('Error guardando atención:', error);
            window.showNotification && window.showNotification('Error al guardar la atención: ' + error.message, 'error');
        }
    }

    window.cerrarModalNuevaAtencion = function() {
        const modal = document.getElementById('modal-nueva-atencion');
        if (modal) {
            modal.remove();
        }
    };

    async function refrescarPacientesTab() {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #pacientesGrid en el DOM");
            return;
        }
        grid.innerHTML = "<div class='loading-message'><i class='fas fa-spinner fa-spin'></i> Actualizando pacientes...</div>";
        pacientesTabData = await extraerYCrearPacientesDesdeCitas();
        renderPacientesGrid(pacientesTabData);
    }

    window.loadPatients = refrescarPacientesTab;

    function inicializarEventos() {
        crearBotonActualizarSiNoExiste();
        const buscarBtn = getBuscarBtn();
        const searchInput = getSearchInput();
        const actualizarBtn = getActualizarBtn();

        if (buscarBtn) {
            buscarBtn.onclick = function() {
                const texto = searchInput ? searchInput.value.trim() : "";
                buscarPacientesLocal(texto);
            };
        }
        if (actualizarBtn) {
            actualizarBtn.onclick = function() {
                refrescarPacientesTab();
            };
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        inicializarEventos();
        refrescarPacientesTab();
    });

    window.cerrarModalFichaCompleta = function() {
        const modal = document.getElementById('modal-ficha-paciente-completa');
        if (modal) modal.style.display = 'none';
    };

    // Mantener funciones legacy para compatibilidad
    window.verFichaPacienteSenda = window.verFichaPacienteUnificada;
    window.cerrarModalFichaPaciente = window.cerrarModalFichaCompleta;

    // Debug function
    window.debugHistorialClickeable = function() {
        const entradas = document.querySelectorAll('.historial-entry');
        entradas.forEach((entrada, index) => {
            const hasEventListener = entrada.onclick !== null;
            const cursor = window.getComputedStyle(entrada).cursor;
            console.log(`Entrada ${index + 1}:`, {
                hasEventListener,
                cursor,
                docId: entrada.dataset.entryId,
                clickeable: cursor === 'pointer'
            });
        });
        if (entradas.length > 0) {
            try {
                entradas[0].click();
            } catch (error) {
                console.error('❌ Error en click simulado:', error);
            }
        }
    };

    console.log('✅ Sistema de fichas unificado cargado correctamente');
})();
