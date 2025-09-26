(function() {
    let pacientesTabData = [];
    let profesionActual = null;

    // Detecta profesión actual con mejores logs para debug
    if (window.getCurrentUser && window.getFirestore && typeof firebase !== "undefined") {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('Usuario autenticado:', user.uid);
                window.getFirestore().collection('profesionales').doc(user.uid).get().then(function(doc){
                    if (doc.exists) {
                        const data = doc.data();
                        profesionActual = data.profession || null;
                        console.log('Profesión encontrada:', profesionActual);
                        console.log('Datos del profesional:', data);
                    } else {
                        console.warn('Documento de profesional no encontrado para UID:', user.uid);
                        profesionActual = null;
                    }
                }).catch(function(error) {
                    console.error('Error al obtener datos del profesional:', error);
                    profesionActual = null;
                });
            } else {
                console.log('Usuario no autenticado');
                profesionActual = null;
            }
        });
    }

    // Función auxiliar para verificar permisos
    function puedeEditarHistorial() {
        const rolesPermitidos = ['medico', 'psicologo', 'terapeuta'];
        const resultado = profesionActual && rolesPermitidos.includes(profesionActual);
        console.log('Verificando permisos - profesionActual:', profesionActual, 'puedeEditar:', resultado);
        return resultado;
    }

    // Función para obtener profesional actual con más detalle
    function obtenerProfesionalActual() {
        return new Promise((resolve) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log('No hay usuario autenticado');
                resolve(null);
                return;
            }

            window.getFirestore()
                .collection('profesionales')
                .doc(user.uid)
                .get()
                .then(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        const profesional = {
                            id: doc.id,
                            ...data,
                            profession: profesionActual || data.profession
                        };
                        console.log('Profesional obtenido:', profesional);
                        resolve(profesional);
                    } else {
                        console.warn('Documento de profesional no encontrado');
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Error al obtener profesional:', error);
                    resolve(null);
                });
        });
    }

    // Funciones básicas del sistema
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

    // FUNCIÓN PRINCIPAL PARA VER FICHA (CORREGIDA)
    window.verFichaPacienteSenda = async function(rut) {
        console.log('=== ABRIENDO FICHA DE PACIENTE ===');
        console.log('Usuario actual:', firebase.auth().currentUser);
        console.log('profesionActual al abrir ficha:', profesionActual);
        
        const db = window.getFirestore();
        const rutLimpio = (rut || '').replace(/[.\-]/g, '').trim();
        
        try {
            const snapshot = await db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get();
            
            if (snapshot.empty) {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                return;
            }
            
            const pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
            
            // Esperar un poco si profesionActual aún es null
            if (profesionActual === null && firebase.auth().currentUser) {
                console.log('Esperando profesionActual...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const profesional = await obtenerProfesionalActual();
            const puedeEditar = puedeEditarHistorial();
            
            console.log('Estado final - profesional:', profesional, 'puedeEditar:', puedeEditar);

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

            // Construir HTML de la ficha
            const modalBody = document.getElementById('modal-ficha-paciente-body');
            modalBody.innerHTML = construirHTMLFicha(pacienteData, puedeEditar, profesional);

            // Cargar historial clínico
            await cargarHistorialClinico(pacienteData.rut, puedeEditar, profesional);

        } catch (error) {
            console.error('Error al mostrar ficha:', error);
            window.showNotification && window.showNotification('Error al cargar ficha del paciente', 'error');
        }
    };

    function construirHTMLFicha(paciente, puedeEditar, profesional) {
        console.log('Construyendo HTML - puedeEditar:', puedeEditar);
        
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
            
            <div id="historial-clinico" data-paciente-rut="${paciente.rut}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="color:#2563eb; margin:0; font-size:1.2rem; font-weight:600;">
                        <i class="fas fa-clipboard-list"></i> Historial Clínico
                    </h4>
                    ${puedeEditar ? `
                        <button class="btn btn-success btn-sm" onclick="mostrarFormularioNuevaAtencion('${paciente.rut}')" style="background:#10b981; color:white; border:none; padding:8px 12px; border-radius:6px; font-size:0.85rem; cursor:pointer;">
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

    async function cargarHistorialClinico(rutPaciente, puedeEditar, profesional) {
        const cont = document.getElementById('historial-contenido');
        if (!cont) return;
        
        const db = window.getFirestore();
        const rutLimpio = (rutPaciente || '').replace(/[.\-]/g, '').trim();
        
        console.log('Cargando historial - puedeEditar:', puedeEditar, 'profesional:', profesional);
        
        try {
            const snapshot = await db.collection('atenciones')
                .where('pacienteRut', '==', rutLimpio)
                .orderBy('fechaRegistro', 'desc')
                .get();
            
            if (snapshot.empty) {
                cont.innerHTML = `
                    <div style="text-align:center; padding:2rem; color:#6b7280;">
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
        
        console.log(`Entrada ${docId} - puedeEditar: ${puedeEditar}, puedeEditarEsta: ${puedeEditarEsta}`);

        // Botones de acción
        let acciones = '';
        if (puedeEditarEsta) {
            acciones = `
                <div style="display:flex; gap:8px; margin-top:8px;">
                    <button onclick="mostrarModalEditarAtencionDesdeFicha('${docId}', '${encodeURIComponent(atencion.descripcion || '')}', '${atencion.tipoAtencion || ''}', '${rutPaciente}')"
                            style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                            title="Editar atención">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="confirmarEliminarAtencion('${docId}', '${rutPaciente}')"
                            style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:0.85rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                            title="Eliminar atención">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
        }

        // Formatear tipo de atención
        const tipoFormateado = formatearTipoAtencion(atencion.tipoAtencion);

        return `
            <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:1rem; margin-bottom:1rem;">
                <div style="margin-bottom:8px;">
                    <div style="font-weight:600; color:#2563eb; font-size:0.95rem;">
                        <i class="fas fa-user-md"></i> ${atencion.profesional || 'Profesional no especificado'}
                    </div>
                    <div style="color:#6b7280; font-size:0.85rem; margin-top:2px;">
                        <i class="fas fa-calendar"></i> ${fechaTexto} - <i class="fas fa-clock"></i> ${horaTexto}
                    </div>
                    <div style="color:#059669; font-size:0.85rem; margin-top:2px;">
                        <i class="fas fa-stethoscope"></i> ${tipoFormateado}
                    </div>
                </div>
                
                <div style="color:#374151; line-height:1.5; margin:8px 0;">
                    ${atencion.descripcion || 'Sin descripción'}
                </div>
                
                ${acciones}
            </div>
        `;
    }

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

    // Función para agregar nueva atención
    window.mostrarFormularioNuevaAtencion = function(rutPaciente) {
        const modalHTML = `
            <div class="modal-overlay" id="modal-nueva-atencion" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;">
                <div class="modal-content" style="background:white; border-radius:12px; padding:2rem; max-width:500px; width:90%;">
                    <h2 style="color:#2563eb; margin-bottom:1.5rem;">
                        <i class="fas fa-plus-circle"></i> Nueva Atención
                    </h2>
                    <form id="form-nueva-atencion">
                        <div style="margin-bottom:1rem;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Tipo de atención *</label>
                            <select id="nueva-atencion-tipo" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px;" required>
                                <option value="">Selecciona tipo...</option>
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="orientacion">Orientación</option>
                                <option value="intervencion">Intervención</option>
                                <option value="derivacion">Derivación</option>
                            </select>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Descripción *</label>
                            <textarea id="nueva-atencion-descripcion" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; min-height:100px;" 
                                      placeholder="Describe la atención realizada..." required></textarea>
                        </div>
                        <div style="display:flex; gap:1rem; justify-content:flex-end;">
                            <button type="button" onclick="cerrarModalNuevaAtencion()" style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                Cancelar
                            </button>
                            <button type="submit" style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                Guardar Atención
                            </button>
                        </div>
                        <input type="hidden" id="nueva-atencion-rut" value="${rutPaciente}">
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('form-nueva-atencion').onsubmit = guardarNuevaAtencion;
    };

    async function guardarNuevaAtencion(event) {
        event.preventDefault();
        
        const tipo = document.getElementById('nueva-atencion-tipo').value;
        const descripcion = document.getElementById('nueva-atencion-descripcion').value.trim();
        const rutPaciente = document.getElementById('nueva-atencion-rut').value;
        
        if (!tipo || !descripcion) {
            alert('Completa todos los campos obligatorios');
            return;
        }

        try {
            const profesional = await obtenerProfesionalActual();
            if (!profesional) {
                alert('Error: No se pudo obtener información del profesional');
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
            await cargarHistorialClinico(rutPaciente, puedeEditarHistorial(), profesionalActualizado);

        } catch (error) {
            console.error('Error al guardar atención:', error);
            alert('Error al guardar la atención: ' + error.message);
        }
    }

    window.cerrarModalNuevaAtencion = function() {
        const modal = document.getElementById('modal-nueva-atencion');
        if (modal) modal.remove();
    };

    // Función para confirmar eliminación
    window.confirmarEliminarAtencion = function(atencionId, rutPaciente) {
        if (confirm('¿Está seguro de que desea eliminar esta atención del historial clínico?\n\nEsta acción no se puede deshacer.')) {
            eliminarAtencionConfirmada(atencionId, rutPaciente);
        }
    };

    async function eliminarAtencionConfirmada(atencionId, rutPaciente) {
        try {
            const db = window.getFirestore();
            await db.collection('atenciones').doc(atencionId).delete();
            
            window.showNotification && window.showNotification("Atención eliminada correctamente", "success");
            
            // Recargar historial
            const profesional = await obtenerProfesionalActual();
            await cargarHistorialClinico(rutPaciente, puedeEditarHistorial(), profesional);

        } catch (error) {
            console.error('Error al eliminar:', error);
            alert("Error al eliminar atención: " + error.message);
        }
    }

    // Función para editar atención
    window.mostrarModalEditarAtencionDesdeFicha = function(atencionId, descripcionEnc, tipoAtencion, rutPaciente) {
        const descripcion = decodeURIComponent(descripcionEnc);
        
        const modalHTML = `
            <div class="modal-overlay" id="modal-editar-atencion" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;">
                <div class="modal-content" style="background:white; border-radius:12px; padding:2rem; max-width:500px; width:90%;">
                    <h2 style="color:#2563eb; margin-bottom:1.5rem;">
                        <i class="fas fa-edit"></i> Editar Atención
                    </h2>
                    <form id="form-editar-atencion">
                        <div style="margin-bottom:1rem;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Tipo de atención *</label>
                            <select id="editar-atencion-tipo" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px;" required>
                                <option value="">Selecciona tipo...</option>
                                <option value="consulta" ${tipoAtencion === 'consulta' ? 'selected' : ''}>Consulta</option>
                                <option value="seguimiento" ${tipoAtencion === 'seguimiento' ? 'selected' : ''}>Seguimiento</option>
                                <option value="orientacion" ${tipoAtencion === 'orientacion' ? 'selected' : ''}>Orientación</option>
                                <option value="intervencion" ${tipoAtencion === 'intervencion' ? 'selected' : ''}>Intervención</option>
                                <option value="derivacion" ${tipoAtencion === 'derivacion' ? 'selected' : ''}>Derivación</option>
                            </select>
                        </div>
                        <div style="margin-bottom:1rem;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Descripción *</label>
                            <textarea id="editar-atencion-descripcion" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; min-height:100px;" required>${descripcion}</textarea>
                        </div>
                        <div style="display:flex; gap:1rem; justify-content:flex-end;">
                            <button type="button" onclick="cerrarModalEditarAtencion()" style="background:#6b7280; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                Cancelar
                            </button>
                            <button type="submit" style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                Guardar Cambios
                            </button>
                        </div>
                        <input type="hidden" id="editar-atencion-id" value="${atencionId}">
                        <input type="hidden" id="editar-atencion-rut" value="${rutPaciente}">
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('form-editar-atencion').onsubmit = async function(e) {
            e.preventDefault();
            
            const id = document.getElementById('editar-atencion-id').value;
            const nuevaDescripcion = document.getElementById('editar-atencion-descripcion').value.trim();
            const nuevoTipo = document.getElementById('editar-atencion-tipo').value;
            const rutPaciente = document.getElementById('editar-atencion-rut').value;
            
            if (!nuevaDescripcion || !nuevoTipo) {
                alert('Completa todos los campos');
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
                cerrarModalEditarAtencion();
                
                // Recargar historial
                const profesional = await obtenerProfesionalActual();
                await cargarHistorialClinico(rutPaciente, puedeEditarHistorial(), profesional);

            } catch (error) {
                console.error('Error al editar:', error);
                alert("Error al editar atención: " + error.message);
            }
        };
    };

    window.cerrarModalEditarAtencion = function() {
        const modal = document.getElementById('modal-editar-atencion');
        if (modal) modal.remove();
    };

    // Funciones del sistema original
    window.cerrarModalFichaPaciente = function() {
        const modal = document.getElementById('modal-ficha-paciente');
        if (modal) modal.style.display = 'none';
    };

    // Mantener compatibilidad con funciones existentes
    window.eliminarAtencionDesdeFicha = function(atencionId, rutPaciente) {
        window.confirmarEliminarAtencion(atencionId, rutPaciente);
    };

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

    // Inicialización
    document.addEventListener('DOMContentLoaded', function() {
        inicializarEventos();
        refrescarPacientesTab();
    });

})();
