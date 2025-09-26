// ===================================================================
// MEJORAS PARA TU CÓDIGO EXISTENTE DE FICHAS DE PACIENTES
// Integra con tu sistema actual manteniendo la funcionalidad
// ===================================================================

(function () {
    let pacientesTabData = [];
    let profesionActual = null;

    // Detecta profesión actual (tu código existente)
    if (window.getCurrentUser && window.getFirestore && typeof firebase !== "undefined") {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                window.getFirestore().collection('profesionales').doc(user.uid).get().then(function (doc) {
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

    window.verFichaPacienteSenda = async function (rut) {
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

    // Esta función no estaba definida, se agrega para evitar error de referencia
    async function cargarHistorialClinicoMejorado(rutPaciente, puedeEditar, profesional) {
        await cargarHistorialClinicoPacientePorRut(rutPaciente);
    }

    // ===================================================================
    // HISTORIAL CLÍNICO DE PACIENTE POR RUT
    // ===================================================================

    function cargarHistorialClinicoPacientePorRut(rutPaciente) {
        const cont = document.getElementById('historial-clinico');
        if (!cont) return;

        const db = window.getFirestore();
        rutPaciente = (rutPaciente || '').replace(/[.\-]/g, '').trim();

        db.collection('atenciones')
            .where('pacienteRut', '==', rutPaciente)
            .orderBy('fechaRegistro', 'desc')
            .get()
            .then(snapshot => {
                let html = '';

                if (snapshot.empty) {
                    html = "<p>No hay atenciones registradas.</p>";
                } else {
                    html = '<ul style="margin-top:8px;">';

                    snapshot.forEach(doc => {
                        const a = doc.data();
                        let fechaTexto = '';
                        let horaTexto = '';

                        // Formatear fecha y hora
                        if (a.fechaRegistro) {
                            let fechaObj;
                            if (typeof a.fechaRegistro === 'string') {
                                fechaObj = new Date(a.fechaRegistro);
                            } else if (a.fechaRegistro.seconds) {
                                fechaObj = new Date(a.fechaRegistro.seconds * 1000);
                            }
                            fechaTexto = fechaObj.toLocaleDateString('es-CL');
                            horaTexto = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                        }

                        // AQUÍ ESTÁ EL FIX: Mostrar botones SIEMPRE para roles permitidos
                        let acciones = '';
                        // console.log('Profesión actual:', profesionActual); // Para debug

                        // Verificar si el profesional puede editar (más permisivo)
                        if (profesionActual && ['medico', 'psicologo', 'terapeuta'].includes(profesionActual)) {
                            acciones = `
                                <div style="margin-top:10px; display:flex; gap:8px;">
                                    <button class="btn btn-outline btn-sm" 
                                            onclick="window.mostrarModalEditarAtencionDesdeFicha('${doc.id}', '${encodeURIComponent(a.descripcion || '')}', '${a.tipoAtencion || ''}', '${rutPaciente}')"
                                            style="background:#fff; color:#2563eb; border:1px solid #2563eb; padding:4px 8px; border-radius:4px; font-size:0.8rem;">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button class="btn btn-danger btn-sm" 
                                            onclick="window.eliminarAtencionDesdeFicha('${doc.id}', '${rutPaciente}')"
                                            style="background:#ef4444; color:white; border:1px solid #ef4444; padding:4px 8px; border-radius:4px; font-size:0.8rem;">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            `;
                        } else {
                            // Solo mostrar mensaje si no hay permisos
                            acciones = `<div style="margin-top:8px; color:#6b7280; font-size:0.8rem; font-style:italic;">
                                Solo médicos, psicólogos y terapeutas pueden editar el historial
                            </div>`;
                        }

                        html += `
                            <li style="margin-bottom:12px; padding:12px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px;">
                                <div style="margin-bottom:8px;">
                                    <b style="color:#2563eb;">Profesional:</b> ${a.profesional || ''}<br>
                                    <b style="color:#059669;">Fecha:</b> ${fechaTexto} <b>Hora:</b> ${horaTexto}<br>
                                    <b style="color:#f59e0b;">Tipo:</b> ${formatearTipoAtencion(a.tipoAtencion || 'consulta')}
                                </div>
                                <div style="color:#374151; line-height:1.5; margin:8px 0;">
                                    ${a.descripcion || 'Sin descripción'}
                                </div>
                                ${acciones}
                            </li>
                        `;
                    });

                    html += '</ul>';

                    // Agregar botón para nueva atención si tiene permisos
                    if (profesionActual && ['medico', 'psicologo', 'terapeuta'].includes(profesionActual)) {
                        html = `
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                                <b>Historial clínico:</b>
                                <button onclick="window.mostrarFormularioNuevaAtencion('${rutPaciente}')" 
                                        style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:0.8rem; cursor:pointer;">
                                    <i class="fas fa-plus"></i> Agregar Atención
                                </button>
                            </div>
                            ${html}
                        `;
                    } else {
                        html = `<b>Historial clínico:</b> ${html}`;
                    }
                }

                cont.innerHTML = html;
            })
            .catch(error => {
                console.error('Error completo:', error);

                if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
                    cont.innerHTML = `
                        <b>Historial clínico:</b>
                        <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:8px; padding:1rem; color:#dc2626; margin-top:10px;">
                            <h4><i class="fas fa-exclamation-triangle"></i> Error de Configuración</h4>
                            <p>Firestore requiere un índice compuesto para esta consulta.</p>
                            <p><small>Revisa la consola de Firebase para crear el índice necesario.</small></p>
                        </div>
                    `;
                    console.error("Firestore necesita índice compuesto para atenciones.pacienteRut + fechaRegistro", error);
                } else {
                    cont.innerHTML = `
                        <b>Historial clínico:</b>
                        <div style="background:#fee2e2; border-radius:8px; padding:1rem; color:#dc2626; margin-top:10px;">
                            <p><i class="fas fa-exclamation-circle"></i> Error al cargar historial clínico</p>
                            <p><small>Error: ${error.message}</small></p>
                        </div>
                    `;
                    console.error("Error Firestore:", error);
                }
            });
    }

    // Función auxiliar para formatear tipo de atención
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

    // ===================================================================
    // FUNCIÓN PARA AGREGAR NUEVA ATENCIÓN (si no existe)
    // ===================================================================

    window.mostrarFormularioNuevaAtencion = function (rutPaciente) {
        // Cerrar ficha actual temporalmente
        const fichaModal = document.getElementById('modal-ficha-paciente');
        if (fichaModal) fichaModal.style.display = 'none';

        const modalHTML = `
            <div class="modal-overlay" id="modal-nueva-atencion" style="display:flex; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
                <div style="background:white; border-radius:12px; padding:2rem; max-width:500px; width:90%; max-height:90vh; overflow-y:auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h2 style="color:#2563eb; margin:0;">
                            <i class="fas fa-plus-circle"></i> Nueva Atención
                        </h2>
                        <button onclick="cerrarModalNuevaAtencion()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#6b7280;">&times;</button>
                    </div>
                    
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
                        
                        <div style="margin-bottom:1.5rem;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Descripción de la atención *</label>
                            <textarea id="nueva-atencion-descripcion" 
                                      style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; min-height:100px; resize:vertical;" 
                                      placeholder="Describe la atención realizada, observaciones, recomendaciones..." required></textarea>
                        </div>
                        
                        <div style="display:flex; gap:1rem; justify-content:flex-end;">
                            <button type="button" onclick="cerrarModalNuevaAtencion()" 
                                    style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" 
                                    style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                                <i class="fas fa-save"></i> Guardar Atención
                            </button>
                        </div>
                        
                        <input type="hidden" id="nueva-atencion-rut" value="${rutPaciente}">
                    </form>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modal-nueva-atencion');
        if (modalAnterior) modalAnterior.remove();

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Enfocar textarea
        setTimeout(() => {
            document.getElementById('nueva-atencion-descripcion').focus();
        }, 100);

        // Configurar evento submit
        document.getElementById('form-nueva-atencion').onsubmit = async function (event) {
            event.preventDefault();

            const tipo = document.getElementById('nueva-atencion-tipo').value;
            const descripcion = document.getElementById('nueva-atencion-descripcion').value.trim();
            const rutPaciente = document.getElementById('nueva-atencion-rut').value;

            if (!tipo || !descripcion) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }

            try {
                // Obtener datos del profesional actual
                const user = firebase.auth().currentUser;
                if (!user) {
                    alert('Error: No hay usuario autenticado');
                    return;
                }

                const profesionalDoc = await window.getFirestore().collection('profesionales').doc(user.uid).get();
                if (!profesionalDoc.exists) {
                    alert('Error: No se encontraron datos del profesional');
                    return;
                }

                const profesionalData = profesionalDoc.data();
                const db = window.getFirestore();

                const nuevaAtencion = {
                    pacienteRut: rutPaciente,
                    profesional: `${profesionalData.nombre} ${profesionalData.apellidos}`,
                    profesionalId: user.uid,
                    tipoAtencion: tipo,
                    descripcion: descripcion,
                    fechaRegistro: new Date(),
                    fechaCreacion: new Date().toISOString()
                };

                await db.collection('atenciones').add(nuevaAtencion);

                window.showNotification && window.showNotification('Atención registrada correctamente', 'success');
                cerrarModalNuevaAtencion();

                // Recargar historial
                cargarHistorialClinicoPacientePorRut(rutPaciente);

                // Mostrar ficha nuevamente
                if (fichaModal) fichaModal.style.display = 'flex';

            } catch (error) {
                console.error('Error al guardar atención:', error);
                alert('Error al guardar la atención: ' + error.message);
            }
        };
    };

    window.cerrarModalNuevaAtencion = function () {
        const modal = document.getElementById('modal-nueva-atencion');
        if (modal) modal.remove();

        // Mostrar ficha nuevamente
        const fichaModal = document.getElementById('modal-ficha-paciente');
        if (fichaModal) fichaModal.style.display = 'flex';
    };

    // Si quieres exponer otras funciones, hazlo aquí:
    // window.tuFuncion = tuFuncion;

})();
