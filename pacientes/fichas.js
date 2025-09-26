

(function() {
    let pacientesTabData = [];
    let profesionActual = null;

    // Detecta profesión actual (tu código existente)
    if (window.getCurrentUser && window.getFirestore && typeof firebase !== "undefined") {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                window.getFirestore().collection('profesionales').doc(user.uid).get().then(function(doc){
                    if (doc.exists) {
                        profesionActual = doc.data().profession || null;
                    }
                });
            } else {
                profesionActual = null;
            }
        });
    }

    // ===== FUNCIONES AUXILIARES PARA PERMISOS =====
    
    /**
     * Verifica si el profesional actual puede editar historial
     */
    function puedeEditarHistorial() {
        const rolesPermitidos = ['medico', 'psicologo', 'terapeuta'];
        return profesionActual && rolesPermitidos.includes(profesionActual);
    }

    /**
     * Obtiene información del profesional actual
     */
    function obtenerProfesionalActual() {
        return new Promise((resolve) => {
            if (profesionActual) {
                firebase.auth().currentUser && window.getFirestore()
                    .collection('profesionales')
                    .doc(firebase.auth().currentUser.uid)
                    .get()
                    .then(doc => {
                        if (doc.exists) {
                            resolve({
                                id: doc.id,
                                ...doc.data(),
                                profession: profesionActual
                            });
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(() => resolve(null));
            } else {
                resolve(null);
            }
        });
    }

    // ===== TUS FUNCIONES EXISTENTES (mantenidas) =====
    
    function getGrid() { return document.getElementById('patients-grid'); }
    function getSearchInput() { return document.getElementById('search-pacientes-rut'); }
    function getBuscarBtn() { return document.getElementById('buscar-paciente-btn'); }
    function getActualizarBtn() { return document.getElementById('actualizar-pacientes-btn'); }

    function crearBotonActualizarSiNoExiste() {
        let actualizarBtn = getActualizarBtn();
        if (!actualizarBtn) {
            const header = document.querySelector('#pacientes-tab .section-actions');
            if (header) {
                actualizarBtn = document.createElement('button');
                actualizarBtn.id = 'actualizar-pacientes-btn';
                actualizarBtn.className = 'btn btn-secondary btn-sm';
                actualizarBtn.innerHTML = '<i class="fas fa-sync"></i> Actualizar';
                header.appendChild(actualizarBtn);
            }
        }
    }

    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        const citasSnap = await db.collection('citas').get();
        const pacientesMap = {};

        citasSnap.forEach(doc => {
            const cita = doc.data();
            const rut = (cita.rut || '').replace(/[.\-]/g, "").trim();
            const nombre = cita.nombre || '';
            const apellidos = cita.apellidos || '';
            if (!rut) return;
            if (!pacientesMap[rut]) {
                pacientesMap[rut] = {
                    rut: rut,
                    nombre: nombre,
                    apellidos: apellidos,
                    citaId: doc.id,
                    profesion: cita.profesion || '',
                    fecha: cita.fecha || '',
                    telefono: cita.telefono || '',
                    email: cita.email || '',
                    direccion: cita.direccion || '',
                    edad: cita.edad || '',
                    fechaRegistro: cita.creado || new Date().toISOString(),
                };
            }
        });

        for (const rut in pacientesMap) {
            const paciente = pacientesMap[rut];
            const snap = await db.collection('pacientes').where('rut', '==', rut).limit(1).get();
            if (snap.empty) {
                await db.collection('pacientes').add(paciente);
            }
        }
        return Object.values(pacientesMap);
    }

    function renderPacientesGrid(pacientes) {
        const grid = getGrid();
        if (!grid) return;
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes agendados aún.</div>";
            return;
        }
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'patient-card';
            div.innerHTML = `
                <div style="display:flex; gap:24px; align-items:center;">
                  <div style="font-weight:600; min-width:170px;">${p.nombre} ${p.apellidos || ''}</div>
                  <div>RUT: ${p.rut}</div>
                  <div>Tel: ${p.telefono || ''}</div>
                  <div>Email: ${p.email || ''}</div>
                  <button class="btn btn-outline btn-sm" style="margin-left:18px;" onclick="verFichaPacienteSenda('${p.rut}')">
                    <i class="fas fa-file-medical"></i> Ver Ficha
                  </button>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    function buscarPacientesLocal(texto) {
        texto = (texto || '').trim().toUpperCase();
        if (!texto) {
            renderPacientesGrid(pacientesTabData);
            return;
        }
        const filtrados = pacientesTabData.filter(p =>
            (p.rut && p.rut.includes(texto)) ||
            ((p.nombre + ' ' + (p.apellidos || '')).toUpperCase().includes(texto))
        );
        renderPacientesGrid(filtrados);
    }

    // ===== FUNCIÓN PRINCIPAL MEJORADA PARA VER FICHA =====
    
    window.verFichaPacienteSenda = async function(rut) {
        const db = window.getFirestore();
        const rutLimpio = (rut || '').replace(/[.\-]/g, '').trim();
        
        try {
            const snapshot = await db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get();
            
            if (snapshot.empty) {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                return;
            }
            
            const pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
            const profesional = await obtenerProfesionalActual();
            const puedeEditar = puedeEditarHistorial();

            // Crear o mostrar modal
            let modal = document.getElementById('modal-ficha-paciente');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-ficha-paciente';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:600px;">
                        <span class="close" onclick="cerrarModalFichaPaciente()">&times;</span>
                        <div id="modal-ficha-paciente-body"></div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            modal.style.display = 'flex';

            // Construir HTML mejorado de la ficha
            const modalBody = document.getElementById('modal-ficha-paciente-body');
            const html = construirHTMLFichaMejorada(pacienteData, puedeEditar, profesional);
            modalBody.innerHTML = html;

            // Cargar historial clínico
            await cargarHistorialClinicoMejorado(pacienteData.rut, puedeEditar, profesional);

        } catch (error) {
            console.error('Error al mostrar ficha:', error);
            window.showNotification && window.showNotification('Error al cargar ficha del paciente', 'error');
        }
    };

    /**
     * Construye HTML mejorado para la ficha del paciente
     */
    function construirHTMLFichaMejorada(paciente, puedeEditar, profesional) {
        return `
            <h3 style="color: #2563eb; margin-bottom:15px; font-size:1.4rem; font-weight:700;">
                <i class="fas fa-user-circle"></i> ${paciente.nombre || ''} ${paciente.apellidos || ''}
            </h3>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                <p><i class="fas fa-id-card" style="color:#6366f1; margin-right:8px;"></i><b>RUT:</b> ${paciente.rut || ''}</p>
                <p><i class="fas fa-phone" style="color:#10b981; margin-right:8px;"></i><b>Teléfono:</b> ${paciente.telefono || 'No disponible'}</p>
                <p><i class="fas fa-envelope" style="color:#f59e0b; margin-right:8px;"></i><b>Email:</b> ${paciente.email || 'No disponible'}</p>
                <p><i class="fas fa-map-marker-alt" style="color:#ef4444; margin-right:8px;"></i><b>Dirección:</b> ${paciente.direccion || 'No disponible'}</p>
            </div>
            
            <hr style="margin:20px 0; border:1px solid #e5e7eb;">
            
            <div id="historial-clinico" class="${puedeEditar ? '' : 'historial-readonly'}" data-paciente-rut="${paciente.rut}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="color:#2563eb; margin:0; font-size:1.2rem; font-weight:600;">
                        <i class="fas fa-clipboard-list"></i> Historial Clínico
                    </h4>
                    ${puedeEditar ? `
                        <button class="btn-add-entry" onclick="mostrarFormularioNuevaAtencion('${paciente.rut}')">
                            <i class="fas fa-plus"></i> Agregar Atención
                        </button>
                    ` : ''}
                </div>
                <div id="historial-contenido">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Cargando historial...
                    </div>
                </div>
            </div>
        `;
    }

    // ===== FUNCIÓN MEJORADA PARA CARGAR HISTORIAL =====
    
    async function cargarHistorialClinicoMejorado(rutPaciente, puedeEditar, profesional) {
        const cont = document.getElementById('historial-contenido');
        if (!cont) return;
        
        const db = window.getFirestore();
        const rutLimpio = (rutPaciente || '').replace(/[.\-]/g, '').trim();
        
        try {
            const snapshot = await db.collection('atenciones')
                .where('pacienteRut', '==', rutLimpio)
                .orderBy('fechaRegistro', 'desc')
                .get();
            
            if (snapshot.empty) {
                cont.innerHTML = `
                    <div class="no-historial" style="text-align:center; padding:2rem; color:#6b7280;">
                        <i class="fas fa-clipboard" style="font-size:2rem; margin-bottom:1rem; color:#d1d5db;"></i>
                        <p>No hay atenciones registradas en el historial clínico</p>
                    </div>
                `;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const atencion = doc.data();
                html += construirEntradaHistorial(doc.id, atencion, puedeEditar, profesional, rutLimpio);
            });
            
            cont.innerHTML = html;

        } catch (error) {
            if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
                cont.innerHTML = `
                    <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:8px; padding:1rem; color:#dc2626;">
                        <h4><i class="fas fa-exclamation-triangle"></i> Error de Configuración</h4>
                        <p>Firestore requiere un índice compuesto para esta consulta.</p>
                        <p><small>Contacta al administrador del sistema para crear el índice necesario.</small></p>
                    </div>
                `;
                console.error("Firestore necesita índice compuesto para atenciones.pacienteRut + fechaRegistro", error);
            } else {
                cont.innerHTML = `
                    <div style="background:#fee2e2; border-radius:8px; padding:1rem; color:#dc2626;">
                        <p><i class="fas fa-exclamation-circle"></i> Error al cargar historial clínico</p>
                    </div>
                `;
                console.error("Error Firestore:", error);
            }
        }
    }

    /**
     * Construye HTML para una entrada del historial
     */
    function construirEntradaHistorial(docId, atencion, puedeEditar, profesional, rutPaciente) {
        // Formatear fecha y hora
        let fechaTexto = '';
        let horaTexto = '';
        if (atencion.fechaRegistro) {
            let fechaObj;
            if (typeof atencion.fechaRegistro === 'string') {
                fechaObj = new Date(atencion.fechaRegistro);
            } else if (atencion.fechaRegistro.seconds) {
                fechaObj = new Date(atencion.fechaRegistro.seconds * 1000);
            }
            fechaTexto = fechaObj.toLocaleDateString('es-CL');
            horaTexto = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        }

        // Determinar si puede editar esta entrada específica
        const puedeEditarEsta = puedeEditar && (
            !profesional || 
            atencion.profesionalId === profesional.id || 
            profesional.profession === 'medico' // Los médicos pueden editar todo
        );

        // Botones de acción
        let acciones = '';
        if (puedeEditarEsta) {
            acciones = `
                <div class="entry-actions" style="display:flex; gap:8px; margin-top:8px;">
                    <button class="btn-entry-action edit" 
                            onclick="mostrarModalEditarAtencionDesdeFicha('${docId}', '${encodeURIComponent(atencion.descripcion || '')}', '${atencion.tipoAtencion || ''}', '${rutPaciente}')"
                            title="Editar atención">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-entry-action delete" 
                            onclick="confirmarEliminarAtencion('${docId}', '${rutPaciente}')"
                            title="Eliminar atención">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
        }

        // Formatear tipo de atención
        const tipoFormateado = formatearTipoAtencion(atencion.tipoAtencion);

        return `
            <div class="historial-entry" data-entry-id="${docId}" style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:1rem; margin-bottom:1rem; transition:all 0.2s;">
                <div class="entry-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div class="entry-info">
                        <div class="entry-professional" style="font-weight:600; color:#2563eb; font-size:0.95rem;">
                            <i class="fas fa-user-md"></i> ${atencion.profesional || 'Profesional no especificado'}
                        </div>
                        <div class="entry-datetime" style="color:#6b7280; font-size:0.85rem; margin-top:2px;">
                            <i class="fas fa-calendar"></i> ${fechaTexto} - <i class="fas fa-clock"></i> ${horaTexto}
                        </div>
                        <div class="entry-type" style="color:#059669; font-size:0.85rem; margin-top:2px;">
                            <i class="fas fa-stethoscope"></i> ${tipoFormateado}
                        </div>
                    </div>
                </div>
                
                <div class="entry-content" style="color:#374151; line-height:1.5; margin:8px 0;">
                    ${atencion.descripcion || 'Sin descripción'}
                </div>
                
                ${acciones}
            </div>
        `;
    }

    /**
     * Formatea el tipo de atención para mostrar
     */
    function formatearTipoAtencion(tipo) {
        const tipos = {
            'consulta': 'Consulta General',
            'seguimiento': 'Seguimiento',
            'orientacion': 'Orientación',
            'intervencion': 'Intervención',
            'derivacion': 'Derivación'
        };
        return tipos[tipo] || 'Consulta General';
    }

    // ===== NUEVA FUNCIÓN PARA AGREGAR ATENCIÓN =====
    
    window.mostrarFormularioNuevaAtencion = function(rutPaciente) {
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
                        <input type="hidden" id="nueva-atencion-rut" value="${rutPaciente}">
                    </form>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        let modalElement = document.getElementById('modal-nueva-atencion');
        if (modalElement) {
            modalElement.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal
        document.getElementById('modal-nueva-atencion').style.display = 'flex';
        document.getElementById('nueva-atencion-descripcion').focus();

        // Configurar evento submit
        document.getElementById('form-nueva-atencion').onsubmit = guardarNuevaAtencion;
    };

    async function guardarNuevaAtencion(event) {
        event.preventDefault();
        
        const tipo = document.getElementById('nueva-atencion-tipo').value;
        const descripcion = document.getElementById('nueva-atencion-descripcion').value.trim();
        const rutPaciente = document.getElementById('nueva-atencion-rut').value;
        
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

            const db = window.getFirestore();
            const nuevaAtencion = {
                pacienteRut: rutPaciente,
                profesional: `${profesional.nombre} ${profesional.apellidos}`,
                profesionalId: profesional.id,
                tipoAtencion: tipo,
                descripcion: descripcion,
                fechaRegistro: new Date(),
                fechaCreacion: new Date().toISOString()
            };

            await db.collection('atenciones').add(nuevaAtencion);
            
            window.showNotification && window.showNotification('Atención registrada correctamente', 'success');
            cerrarModalNuevaAtencion();
            
            // Recargar historial
            const profesionalActualizado = await obtenerProfesionalActual();
            await cargarHistorialClinicoMejorado(rutPaciente, puedeEditarHistorial(), profesionalActualizado);

        } catch (error) {
            console.error('Error al guardar atención:', error);
            window.showNotification && window.showNotification('Error al guardar la atención: ' + error.message, 'error');
        }
    }

    window.cerrarModalNuevaAtencion = function() {
        const modal = document.getElementById('modal-nueva-atencion');
        if (modal) {
            modal.remove();
        }
    };

    // ===== FUNCIÓN MEJORADA PARA CONFIRMAR ELIMINACIÓN =====
    
    window.confirmarEliminarAtencion = function(atencionId, rutPaciente) {
        const confirmModal = `
            <div class="modal-overlay" id="modal-confirm-delete-atencion">
                <div class="modal-content" style="max-width:400px;">
                    <h2 style="color:#ef4444; margin-bottom:1rem;">
                        <i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación
                    </h2>
                    <p>¿Está seguro de que desea eliminar esta atención del historial clínico?</p>
                    <p style="color:#ef4444; font-weight:600;">Esta acción no se puede deshacer.</p>
                    <div class="form-actions" style="display:flex; gap:1rem; justify-content:flex-end; margin-top:1.5rem;">
                        <button class="btn btn-outline" onclick="cerrarModalConfirmDelete()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button class="btn btn-danger" onclick="eliminarAtencionConfirmada('${atencionId}', '${rutPaciente}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', confirmModal);
        document.getElementById('modal-confirm-delete-atencion').style.display = 'flex';
    };

    window.cerrarModalConfirmDelete = function() {
        const modal = document.getElementById('modal-confirm-delete-atencion');
        if (modal) {
            modal.remove();
        }
    };

    window.eliminarAtencionConfirmada = async function(atencionId, rutPaciente) {
        try {
            const db = window.getFirestore();
            await db.collection('atenciones').doc(atencionId).delete();
            
            window.showNotification && window.showNotification("Atención eliminada correctamente", "success");
            cerrarModalConfirmDelete();
            
            // Recargar historial
            const profesional = await obtenerProfesionalActual();
            await cargarHistorialClinicoMejorado(rutPaciente, puedeEditarHistorial(), profesional);

        } catch (error) {
            console.error('Error al eliminar:', error);
            window.showNotification && window.showNotification("Error al eliminar atención: " + error.message, "error");
        }
    };

    // ===== TUS FUNCIONES EXISTENTES MANTENIDAS =====
    
    window.cerrarModalFichaPaciente = function() {
        const modal = document.getElementById('modal-ficha-paciente');
        if (modal) modal.style.display = 'none';
    };

    // Mantener tu función de editar existente pero mejorada
    window.mostrarModalEditarAtencionDesdeFicha = function(atencionId, descripcionEnc, tipoAtencion, rutPaciente) {
        const descripcion = decodeURIComponent(descripcionEnc);
        
        let modal = document.getElementById('modal-editar-atencion-ficha');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-editar-atencion-ficha';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:500px;">
                    <span class="close" onclick="cerrarModalEditarAtencionFicha()">&times;</span>
                    <h2 style="color:#2563eb;">
                        <i class="fas fa-edit"></i> Editar Atención
                    </h2>
                    <form id="form-editar-atencion-ficha">
                        <div class="form-group">
                            <label for="editar-atencion-descripcion-ficha">Descripción *</label>
                            <textarea id="editar-atencion-descripcion-ficha" class="form-textarea" rows="5" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="editar-atencion-tipo-ficha">Tipo de atención *</label>
                            <select id="editar-atencion-tipo-ficha" class="form-select" required>
                                <option value="">Selecciona tipo...</option>
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="orientacion">Orientación</option>
                                <option value="intervencion">Intervención</option>
                                <option value="derivacion">Derivación</option>
                            </select>
                        </div>
                        <div class="form-actions" style="display:flex; gap:1rem; justify-content:flex-end;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModalEditarAtencionFicha()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                        </div>
                        <input type="hidden" id="editar-atencion-id-ficha">
                        <input type="hidden" id="editar-atencion-rut-ficha">
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'flex';
        document.getElementById('editar-atencion-id-ficha').value = atencionId;
        document.getElementById('editar-atencion-descripcion-ficha').value = descripcion || "";
        document.getElementById('editar-atencion-tipo-ficha').value = tipoAtencion || "";
        document.getElementById('editar-atencion-rut-ficha').value = rutPaciente;

        // Configurar evento submit
        const form = document.getElementById('form-editar-atencion-ficha');
        if (form) {
            form.onsubmit = async function(e) {
                e.preventDefault();
                
                const id = document.getElementById('editar-atencion-id-ficha').value;
                const nuevaDescripcion = document.getElementById('editar-atencion-descripcion-ficha').value.trim();
                const nuevoTipo = document.getElementById('editar-atencion-tipo-ficha').value;
                const rutPaciente = document.getElementById('editar-atencion-rut-ficha').value;
                
                if (!nuevaDescripcion || !nuevoTipo) {
                    window.showNotification && window.showNotification('Completa todos los campos', 'warning');
                    return;
                }

                try {
                    const db = window.getFirestore();
                    await db.collection("atenciones").doc(id).update({
                        descripcion: nuevaDescripcion,
                        tipoAtencion: nuevoTipo,
                        fechaActualizacion: new Date().toISOString()
                    });
                    
                    window.showNotification && window.showNotification("Atención editada correctamente", "success");
                    cerrarModalEditarAtencionFicha();
                    
                    // Recargar historial
                    const profesional = await obtenerProfesionalActual();
                    await cargarHistorialClinicoMejorado(rutPaciente, puedeEditarHistorial(), profesional);

                } catch (error) {
                    console.error('Error al editar:', error);
                    window.showNotification && window.showNotification("Error al editar atención: " + error.message, "error");
                }
            };
        }
    };

    window.cerrarModalEditarAtencionFicha = function() {
        let modal = document.getElementById('modal-editar-atencion-ficha');
        if (modal) modal.style.display = 'none';
    };

    // Mantener tu función de eliminar existente (ya mejorada arriba)
    window.eliminarAtencionDesdeFicha = function(atencionId, rutPaciente) {
        window.confirmarEliminarAtencion(atencionId, rutPaciente);
    };

    // ===== FUNCIONES DE TU SISTEMA ORIGINAL MANTENIDAS =====

    async function refrescarPacientesTab() {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #patients-grid en el DOM");
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

    // ===== INICIALIZACIÓN =====
    document.addEventListener('DOMContentLoaded', function() {
        inicializarEventos();
        refrescarPacientesTab();
    });

})();
