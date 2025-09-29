(function() {
    let pacientesTabData = [];

    function puedeEditarHistorial() {
        return window.puedeEditarHistorial ? window.puedeEditarHistorial() : false;
    }

    function obtenerProfesionalActual() {
        return new Promise((resolve) => {
            const user = firebase.auth().currentUser;
            if (!user) {
                resolve(null);
                return;
            }
            window.getFirestore()
                .collection('profesionales')
                .doc(user.uid)
                .get()
                .then(doc => {
                    if (doc.exists) {
                        resolve({
                            id: doc.id,
                            ...doc.data()
                        });
                    } else {
                        resolve(null);
                    }
                })
                .catch(() => resolve(null));
        });
    }
    function getGrid() { return document.getElementById('pacientesGrid'); }
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
        const pacientesSnap = await db.collection('pacientes').get();
        const pacientesMap = {};

        pacientesSnap.forEach(doc => {
            const paciente = doc.data();
            const pacienteConId = {
                id: doc.id,
                pacienteId: doc.id,
                ...paciente
            };
            const rutLimpio = (paciente.rut || '').replace(/[.\-]/g, "").trim();
            if (rutLimpio) {
                pacientesMap[rutLimpio] = pacienteConId;
            }
        });
        const citasSnap = await db.collection('citas').get();
        citasSnap.forEach(doc => {
            const cita = doc.data();
            const rut = (cita.rut || cita.pacienteRut || '').replace(/[.\-]/g, "").trim();
            if (rut && !pacientesMap[rut]) {
                pacientesMap[rut] = {
                    id: cita.pacienteId || doc.id,
                    pacienteId: cita.pacienteId || doc.id,
                    rut: rut,
                    nombre: cita.nombre || cita.pacienteNombre || '',
                    apellidos: cita.apellidos || '',
                    telefono: cita.telefono || '',
                    email: cita.email || '',
                    direccion: cita.direccion || '',
                    edad: cita.edad || '',
                    cesfam: cita.cesfam || '',
                    fechaRegistro: cita.creado || cita.fechaCreacion || new Date().toISOString(),
                    esTemporalDesdeCita: true,
                    profesionalOrigenId: cita.profesionalId,
                    profesionalOrigenNombre: cita.profesionalNombre,
                    profesionOrigen: cita.profesion || cita.tipoProfesional,
                    prioridad: cita.prioridad || 'media'
                };
            } else if (rut && pacientesMap[rut]) {
                const pacienteExistente = pacientesMap[rut];
                pacientesMap[rut] = {
                    ...pacienteExistente,
                    telefono: pacienteExistente.telefono || cita.telefono || '',
                    email: pacienteExistente.email || cita.email || '',
                    cesfam: pacienteExistente.cesfam || cita.cesfam || '',
                    prioridad: pacienteExistente.prioridad || cita.prioridad || 'media'
                };
            }
        });

        return Object.values(pacientesMap);
    }

    function renderPacientesGrid(pacientes) {
        const grid = getGrid();
        if (!grid) return;
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes registrados aún.</div>";
            return;
        }
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'patient-card';
            let telefonoHtml = p.telefono
                ? `<a href="tel:${p.telefono}" style="color:inherit;text-decoration:underline;">${p.telefono}</a>`
                : 'No disponible';

            let emailHtml = p.email
                ? `<a href="mailto:${p.email}" style="color:inherit;text-decoration:underline;">${p.email}</a>`
                : 'No disponible';
            let prioridadHtml = '';
            if (p.prioridad) {
                let color = "#f59e0b", texto = "Media";
                if (p.prioridad === "alta") { color = "#dc2626"; texto = "Alta"; }
                else if (p.prioridad === "baja") { color = "#10b981"; texto = "Baja"; }
                prioridadHtml = `<span style="margin-left:12px; font-size:0.95rem; font-weight:600; color:${color}; border:1.5px solid ${color}70; border-radius:7px; padding:2px 10px 2px 7px; background:${color}10;">
                    <i class="fas fa-exclamation-triangle"></i> ${texto}
                </span>`;
            }

            const pacienteIdParaFicha = p.id || p.pacienteId;
            div.innerHTML = `
                <div style="display:flex; gap:24px; align-items:center;">
                    <div style="font-weight:600; min-width:170px;">${p.nombre} ${p.apellidos || ''}</div>
                    <div>RUT: ${window.formatRUT ? window.formatRUT(p.rut) : (p.rut || '')}</div>
                    <div>Tel: ${telefonoHtml}</div>
                    <div>Email: ${emailHtml}</div>
                    ${prioridadHtml}
                    <button class="btn btn-outline btn-sm" style="margin-left:18px;" onclick="verFichaPacienteUnificada('${pacienteIdParaFicha}')">
                        <i class="fas fa-file-medical"></i> Ver Ficha
                    </button>
                    ${p.esTemporalDesdeCita ? '<span style="font-size:0.8rem;color:#f59e0b;">*Temporal</span>' : ''}
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
        const textoSinPuntosGuion = texto.replace(/[.\-]/g, '');
        const filtrados = pacientesTabData.filter(p => {
            const rutLimpio = (p.rut || '').replace(/[.\-]/g, '').toUpperCase();
            const nombreCompleto = (p.nombre + ' ' + (p.apellidos || '')).toUpperCase();
            return (
                (rutLimpio && rutLimpio.includes(textoSinPuntosGuion)) ||
                nombreCompleto.includes(texto)
            );
        });
        renderPacientesGrid(filtrados);
    }

    window.verFichaPacienteUnificada = async function(pacienteId) {
        try {
            const db = window.getFirestore();
            const doc = await db.collection('pacientes').doc(pacienteId).get();
            if (doc.exists) {
                const pacienteData = { id: doc.id, ...doc.data() };
                mostrarModalFichaCompleta(pacienteData, pacienteId, false);
            } else {
                const pacienteTemp = pacientesTabData.find(p => (p.id === pacienteId || p.pacienteId === pacienteId));
                if (pacienteTemp) {
                    mostrarModalFichaCompleta(pacienteTemp, pacienteId, true);
                } else {
                    window.showNotification && window.showNotification('Paciente no encontrado en la base de datos', 'warning');
                }
            }
        } catch (error) {
            window.showNotification && window.showNotification('Error al cargar ficha del paciente: ' + error.message, 'error');
        }
    };

    function mostrarModalFichaCompleta(paciente, pacienteId, esTemporal) {
        let modal = document.getElementById('modal-ficha-paciente-completa');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-ficha-paciente-completa';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:900px; max-height:90vh; overflow-y:auto;">
                    <span class="close" onclick="cerrarModalFichaCompleta()">&times;</span>
                    <div id="modal-ficha-completa-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        const modalBody = document.getElementById('modal-ficha-completa-body');
        let fichaHtml = construirHTMLFichaCompleta(paciente, pacienteId);
        let restriccion = '';
        if (esTemporal && paciente.profesionalOrigenId) {
            const user = firebase.auth().currentUser;
            if (!user || paciente.profesionalOrigenId !== user.uid) {
                restriccion = `
                    <div style="color:#dc2626; margin-bottom:12px;">
                        <i class="fas fa-lock"></i>
                        Solo el profesional original <b>${paciente.profesionalOrigenNombre || paciente.profesionOrigen || "profesional asignado"}</b>
                        puede completar o editar esta ficha.
                    </div>
                `;
                fichaHtml = restriccion + fichaHtml;
                window.puedeCrearAtenciones = function() { return false; };
            } else {
                restriccion = `
                    <div style="color:#16a34a; margin-bottom:12px;">
                        <i class="fas fa-user-check"></i>
                        Eres el profesional original (<b>${paciente.profesionalOrigenNombre || paciente.profesionOrigen}</b>) y puedes completar la ficha.
                    </div>
                `;
                fichaHtml = restriccion + fichaHtml;
                window.puedeCrearAtenciones = function() { return true; };
            }
        } else {
            window.puedeCrearAtenciones = undefined;
        }

        modalBody.innerHTML = fichaHtml;
        cargarHistorialClinicoUnificado(pacienteId, puedeEditarHistorial());
    }

    function construirHTMLFichaCompleta(paciente, pacienteId) {
        return `
            <h3 style="color: #2563eb; margin-bottom:20px; font-size:1.5rem; font-weight:700;">
                <i class="fas fa-user-circle"></i> ${paciente.nombre || ''} ${paciente.apellidos || ''}
                <span style="font-size:0.8rem; color:#6b7280; font-weight:normal;">ID: ${pacienteId}</span>
            </h3>
            <div style="background:#f8fafc; padding:1rem; border-radius:8px; margin-bottom:1.5rem;">
                <h4 style="color:#1f2937; margin-bottom:1rem;"><i class="fas fa-user"></i> Información Personal</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <p><i class="fas fa-id-card" style="color:#6366f1; margin-right:8px;"></i><b>RUT:</b> ${window.formatRUT ? window.formatRUT(paciente.rut) : (paciente.rut || '')}</p>
                    <p><i class="fas fa-phone" style="color:#10b981; margin-right:8px;"></i><b>Teléfono:</b> ${paciente.telefono || 'No disponible'}</p>
                    <p><i class="fas fa-envelope" style="color:#f59e0b; margin-right:8px;"></i><b>Email:</b> ${paciente.email || 'No disponible'}</p>
                    <p><i class="fas fa-map-marker-alt" style="color:#ef4444; margin-right:8px;"></i><b>Dirección:</b> ${paciente.direccion || 'No disponible'}</p>
                    <p><i class="fas fa-hospital" style="color:#8b5cf6; margin-right:8px;"></i><b>CESFAM:</b> ${paciente.cesfam || 'No disponible'}</p>
                    <p><i class="fas fa-calendar" style="color:#06b6d4; margin-right:8px;"></i><b>Edad:</b> ${paciente.edad || 'No disponible'}</p>
                </div>
            </div>
            <div id="historial-clinico" class="${puedeEditarHistorial() ? '' : 'historial-readonly'}" data-paciente-id="${pacienteId}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="color:#2563eb; margin:0; font-size:1.2rem; font-weight:600;">
                        <i class="fas fa-clipboard-list"></i> Historial Clínico de Atenciones
                    </h4>
                    <!-- Botón Agregar Atención eliminado -->
                </div>
                <div id="historial-contenido">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Cargando historial clínico...
                    </div>
                </div>
            </div>
        `;
    }

    async function cargarHistorialClinicoUnificado(pacienteId, puedeEditar) {
        const cont = document.getElementById('historial-contenido');
        if (!cont) return;
        const db = window.getFirestore();
        try {
            const snapshot = await db.collection('atenciones')
                .where('pacienteId', '==', pacienteId)
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
            cont.innerHTML = '';
            snapshot.forEach(doc => {
                const atencion = doc.data();
                const entradaElement = crearEntradaHistorialConEventos(doc.id, atencion, puedeEditar, pacienteId);
                cont.appendChild(entradaElement);
            });
        } catch (error) {
            cont.innerHTML = `
                <div style="background:#fee2e2; border-radius:8px; padding:1rem; color:#dc2626;">
                    <p><i class="fas fa-exclamation-circle"></i> Error al cargar historial clínico: ${error.message}</p>
                </div>
            `;
        }
    }

    function crearEntradaHistorialConEventos(docId, atencion, puedeEditar, pacienteId) {
        let fechaTexto = '';
        let horaTexto = '';
        if (atencion && atencion.fechaRegistro) {
            let fechaObj;
            if (typeof atencion.fechaRegistro === 'string') {
                fechaObj = new Date(atencion.fechaRegistro);
            } else if (atencion.fechaRegistro && atencion.fechaRegistro.seconds) {
                fechaObj = new Date(atencion.fechaRegistro.seconds * 1000);
            } else if (atencion.fechaRegistro && atencion.fechaRegistro.toDate) {
                fechaObj = atencion.fechaRegistro.toDate();
            }
            if (fechaObj && !isNaN(fechaObj)) {
                fechaTexto = fechaObj.toLocaleDateString('es-CL');
                horaTexto = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            }
        }
        const tipoFormateado = formatearTipoAtencion(atencion?.tipoAtencion || "");
        const descripcion = atencion?.descripcion || "Sin descripción";
        const profesionalNombre = atencion?.profesional || "Profesional no especificado";
        const puedeEditarRealmente = window.puedeEditarHistorial ? window.puedeEditarHistorial() : false;
        const entradaDiv = document.createElement('div');
        entradaDiv.className = 'historial-entry';
        entradaDiv.dataset.entryId = docId;
        entradaDiv.style.cssText = `
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: ${puedeEditarRealmente ? 'pointer' : 'default'};
            transition: all 0.2s ease;
        `;
        entradaDiv.innerHTML = `
            <div style="font-weight:600; color:#2563eb; margin-bottom:4px; font-size:1rem;">
                ${fechaTexto} ${horaTexto} - ${tipoFormateado}
            </div>
            <div style="font-style:italic; color:#6b7280; margin-bottom:8px; font-size:0.9rem;">
                <i class="fas fa-user-md"></i> ${profesionalNombre}
            </div>
            <div style="color:#374151; line-height:1.5; margin-bottom:${puedeEditarRealmente ? '8px' : '0'};">
                ${descripcion}
            </div>
            ${puedeEditarRealmente ? `
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:0.8rem; color:#6b7280; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-edit"></i> 
                    <span>Haz clic para editar</span>
                </div>
            ` : `
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:0.8rem; color:#9ca3af; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-eye"></i> 
                    <span>Solo lectura</span>
                </div>
            `}
        `;
        if (puedeEditarRealmente) {
            entradaDiv.addEventListener('click', function() {
                abrirModalEditarAtencion(docId, descripcion, atencion?.tipoAtencion || "", pacienteId);
            });
            entradaDiv.addEventListener('mouseenter', function() {
                this.style.background = '#f1f5f9';
                this.style.borderColor = '#2563eb';
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.15)';
            });
            entradaDiv.addEventListener('mouseleave', function() {
                this.style.background = '#f8fafc';
                this.style.borderColor = '#e5e7eb';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            entradaDiv.title = 'Haz clic para editar esta atención';
        }
        return entradaDiv;
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

    function abrirModalEditarAtencion(atencionId, descripcion, tipoAtencion, pacienteId) {
        if (!window.puedeEditarHistorial || !window.puedeEditarHistorial()) {
            if (window.mostrarMensajePermisos) {
                window.mostrarMensajePermisos('editar atenciones del historial clínico');
            } else {
                alert('No tienes permisos para editar el historial clínico');
            }
            return;
        }
        const fichaModal = document.getElementById('modal-ficha-paciente-completa');
        if (fichaModal) {
            fichaModal.style.display = 'none';
        }
        let modal = document.getElementById('modal-editar-atencion');
        if (modal) {
            modal.remove();
        }
        modal = document.createElement('div');
        modal.id = 'modal-editar-atencion';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <span class="close" onclick="cerrarModalEditarAtencion()">&times;</span>
                <h2 style="color:#2563eb; display:flex; align-items:center; gap:8px; margin-bottom:1.5rem;">
                    <i class="fas fa-edit"></i> Editar Atención
                </h2>
                <form id="form-editar-atencion">
                    <div class="form-group">
                        <label for="editar-atencion-tipo">Tipo de atención *</label>
                        <select id="editar-atencion-tipo" class="form-select" required>
                            <option value="">Selecciona tipo...</option>
                            <option value="consulta">Consulta</option>
                            <option value="seguimiento">Seguimiento</option>
                            <option value="orientacion">Orientación</option>
                            <option value="intervencion">Intervención</option>
                            <option value="derivacion">Derivación</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editar-atencion-descripcion">Descripción *</label>
                        <textarea id="editar-atencion-descripcion" class="form-textarea" rows="5" required 
                                  placeholder="Describe la atención realizada..."></textarea>
                    </div>
                    <div class="form-actions" style="display:flex; gap:1rem; justify-content:space-between; margin-top:1.5rem;">
                        <button type="button" class="btn btn-danger" id="btn-eliminar-atencion">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                        <div style="display:flex; gap:1rem;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModalEditarAtencion()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('editar-atencion-descripcion').value = descripcion || "";
        document.getElementById('editar-atencion-tipo').value = tipoAtencion || "";
        const form = document.getElementById('form-editar-atencion');
        form.onsubmit = async function(e) {
            e.preventDefault();
            const nuevaDescripcion = document.getElementById('editar-atencion-descripcion').value.trim();
            const nuevoTipo = document.getElementById('editar-atencion-tipo').value;
            if (!nuevaDescripcion || !nuevoTipo) {
                if (window.showNotification) {
                    window.showNotification('Completa todos los campos', 'warning');
                } else {
                    alert('Completa todos los campos');
                }
                return;
            }
            try {
                const db = window.getFirestore();
                await db.collection("atenciones").doc(atencionId).update({
                    descripcion: nuevaDescripcion,
                    tipoAtencion: nuevoTipo,
                    fechaActualizacion: new Date().toISOString()
                });
                if (window.showNotification) {
                    window.showNotification("Atención editada correctamente", "success");
                } else {
                    alert("Atención editada correctamente");
                }
                cerrarModalEditarAtencion();
                await cargarHistorialClinicoUnificado(pacienteId, window.puedeEditarHistorial());
            } catch (error) {
                if (window.showNotification) {
                    window.showNotification("Error al editar atención: " + error.message, "error");
                } else {
                    alert("Error al editar atención: " + error.message);
                }
            }
        };
        document.getElementById('btn-eliminar-atencion').onclick = function() {
            eliminarAtencion(atencionId, pacienteId);
        };
    }

    async function eliminarAtencion(atencionId, pacienteId) {
        if (!confirm('¿Seguro que deseas eliminar esta atención? Esta acción no se puede deshacer.')) return;
        try {
            const db = window.getFirestore();
            await db.collection('atenciones').doc(atencionId).delete();
            if (window.showNotification) {
                window.showNotification("Atención eliminada correctamente", "success");
            } else {
                alert("Atención eliminada correctamente");
            }
            cerrarModalEditarAtencion();
            await cargarHistorialClinicoUnificado(pacienteId, window.puedeEditarHistorial());
        } catch (error) {
            if (window.showNotification) {
                window.showNotification("Error al eliminar atención: " + error.message, "error");
            } else {
                alert("Error al eliminar atención: " + error.message);
            }
        }
    }

    window.cerrarModalEditarAtencion = function() {
        const modal = document.getElementById('modal-editar-atencion');
        if (modal) modal.remove();
        const fichaModal = document.getElementById('modal-ficha-paciente-completa');
        if (fichaModal) fichaModal.style.display = 'flex';
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
                const searchInput = getSearchInput();
                if (searchInput) searchInput.value = "";
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

    window.verFichaPacienteSenda = window.verFichaPacienteUnificada;
    window.cerrarModalFichaPaciente = window.cerrarModalFichaCompleta;
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

    window.crearBotonActualizarSiNoExiste = crearBotonActualizarSiNoExiste;

    console.log('✅ Sistema de fichas unificado cargado correctamente');
})();
