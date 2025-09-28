(function() {
    let pacientesTabData = [];

    function puedeEditarHistorial() {
        return window.puedeEditarHistorial ? window.puedeEditarHistorial() : false;
    }

    function getGrid() { return document.getElementById('patients-grid'); }
    function getSearchInput() { return document.getElementById('search-pacientes-rut'); }
    function getBuscarBtn() { return document.getElementById('buscar-paciente-btn'); }
    function getActualizarBtn() { return document.getElementById('actualizar-pacientes-btn'); }

    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        const citasSnap = await db.collection('citas').get();
        const pacientesMap = {};

        citasSnap.forEach(doc => {
            const cita = doc.data();
            const rut = (cita.rut || cita.pacienteRut || '').replace(/[.\-]/g, "").trim();
            const nombre = cita.nombre || cita.pacienteNombre || '';
            const apellidos = cita.apellidos || '';
            if (!rut) return;
            if (!pacientesMap[rut]) {
                pacientesMap[rut] = {
                    rut: rut,
                    nombre: nombre,
                    apellidos: apellidos,
                    citaId: doc.id,
                    profesion: cita.profesion || cita.tipoProfesional || '',
                    fecha: cita.fecha || '',
                    telefono: cita.telefono || '',
                    email: cita.email || '',
                    direccion: cita.direccion || '',
                    edad: cita.edad || '',
                    cesfam: cita.cesfam || '',
                    fechaRegistro: cita.creado || cita.fechaCreacion || new Date().toISOString(),
                };
            }
        });

        const pacientesSnap = await db.collection('pacientes').get();
        pacientesSnap.forEach(doc => {
            const paciente = doc.data();
            paciente.id = doc.id;
            if (paciente.rut) {
                const rutLimpio = paciente.rut.replace(/[.\-]/g, "").trim();
                if (!pacientesMap[rutLimpio]) {
                    pacientesMap[rutLimpio] = paciente;
                }
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
            div.innerHTML = `
                <div style="display:flex; gap:24px; align-items:center;">
                  <div style="font-weight:600; min-width:170px;">${p.nombre} ${p.apellidos || ''}</div>
                  <div>RUT: ${window.formatRUT ? window.formatRUT(p.rut) : (p.rut || '')}</div>
                  <div>Tel: ${p.telefono || 'No disponible'}</div>
                  <div>Email: ${p.email || 'No disponible'}</div>
                  <button class="btn btn-outline btn-sm" style="margin-left:18px;" onclick="verFichaPacienteSenda('${p.rut}')">
                    <i class="fas fa-file-medical"></i> Ver Ficha
                  </button>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    window.verFichaPacienteSenda = async function(rut) {
        const db = window.getFirestore();
        const rutLimpio = (rut || '').replace(/[.\-]/g, '').trim();
        try {
            let pacienteData = null;
            const snapshot = await db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get();
            if (!snapshot.empty) {
                pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
            } else {
                const citasSnap = await db.collection('citas').where('rut', '==', rutLimpio).limit(1).get();
                if (!citasSnap.empty) {
                    const cita = citasSnap.docs[0].data();
                    pacienteData = {
                        id: 'desde_cita_' + citasSnap.docs[0].id,
                        rut: rutLimpio,
                        nombre: cita.nombre || cita.pacienteNombre || '',
                        apellidos: cita.apellidos || '',
                        telefono: cita.telefono || '',
                        email: cita.email || '',
                        direccion: cita.direccion || '',
                        cesfam: cita.cesfam || ''
                    };
                }
            }

            if (!pacienteData) {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                return;
            }

            const puedeEditar = puedeEditarHistorial();

            let modal = document.getElementById('modal-ficha-paciente');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-ficha-paciente';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:700px; max-height:90vh; overflow-y:auto;">
                        <span class="close" onclick="cerrarModalFichaPaciente()">&times;</span>
                        <div id="modal-ficha-paciente-body"></div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            modal.style.display = 'flex';

            const modalBody = document.getElementById('modal-ficha-paciente-body');
            const html = construirHTMLFichaMejorada(pacienteData, puedeEditar);
            modalBody.innerHTML = html;

            await cargarHistorialClinicoMejorado(pacienteData.rut, puedeEditar);

        } catch (error) {
            console.error('Error al mostrar ficha:', error);
            window.showNotification && window.showNotification('Error al cargar ficha del paciente', 'error');
        }
    };

    function construirHTMLFichaMejorada(paciente, puedeEditar) {
        return `
            <h3 style="color: #2563eb; margin-bottom:15px; font-size:1.4rem; font-weight:700;">
                <i class="fas fa-user-circle"></i> ${paciente.nombre || ''} ${paciente.apellidos || ''}
            </h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                <p><i class="fas fa-id-card" style="color:#6366f1; margin-right:8px;"></i><b>RUT:</b> ${window.formatRUT ? window.formatRUT(paciente.rut) : (paciente.rut || '')}</p>
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
                    ` : `
                        <span style="color:#6b7280; font-size:0.9rem; font-style:italic;">
                            <i class="fas fa-eye"></i> Solo lectura
                        </span>
                    `}
                </div>
                <div id="historial-contenido">
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i> Cargando historial...
                    </div>
                </div>
            </div>
        `;
    }

    async function cargarHistorialClinicoMejorado(rutPaciente, puedeEditar) {
        const cont = document.getElementById('historial-contenido');
        if (!cont) return;
        const db = window.getFirestore();
        const rutLimpio = (rutPaciente || '').replace(/[.\-]/g, '').trim();

        try {
            // TRAZABILIDAD: buscar por pacienteRut Y idPaciente
            const idPaciente = window.generarIdPaciente(rutPaciente);
            const [snapPorRut, snapPorId] = await Promise.all([
                db.collection('atenciones').where('pacienteRut', '==', rutLimpio).orderBy('fechaRegistro', 'desc').get(),
                db.collection('atenciones').where('idPaciente', '==', idPaciente).orderBy('fechaRegistro', 'desc').get()
            ]);
            let docs = [];
            snapPorRut.forEach(doc => docs.push(doc));
            snapPorId.forEach(doc => {
                if (!docs.some(d => d.id === doc.id)) docs.push(doc);
            });

            if (docs.length === 0) {
                cont.innerHTML = `
                    <div class="no-historial" style="text-align:center; padding:2rem; color:#6b7280;">
                        <i class="fas fa-clipboard" style="font-size:2rem; margin-bottom:1rem; color:#d1d5db;"></i>
                        <p>No hay atenciones registradas en el historial clínico</p>
                    </div>
                `;
                return;
            }
            cont.innerHTML = '';
            docs
                .sort((a, b) => {
                    const dA = a.data().fechaRegistro instanceof Date ? a.data().fechaRegistro : new Date(a.data().fechaRegistro);
                    const dB = b.data().fechaRegistro instanceof Date ? b.data().fechaRegistro : new Date(b.data().fechaRegistro);
                    return dB - dA;
                })
                .forEach(doc => {
                    const atencion = doc.data();
                    const entradaElement = crearEntradaHistorialConEventos(doc.id, atencion, puedeEditar, rutLimpio);
                    cont.appendChild(entradaElement);
                });
        } catch (error) {
            cont.innerHTML = `
                <div style="background:#fee2e2; border-radius:8px; padding:1rem; color:#dc2626;">
                    <p><i class="fas fa-exclamation-circle"></i> Error al cargar historial clínico</p>
                </div>
            `;
            console.error("Error Firestore:", error);
        }
    }

    function crearEntradaHistorialConEventos(docId, atencion, puedeEditar, rutPaciente) {
        let fechaTexto = '';
        let horaTexto = '';
        if (atencion && atencion.fechaRegistro) {
            let fechaObj;
            if (typeof atencion.fechaRegistro === 'string') {
                fechaObj = new Date(atencion.fechaRegistro);
            } else if (atencion.fechaRegistro && atencion.fechaRegistro.seconds) {
                fechaObj = new Date(atencion.fechaRegistro.seconds * 1000);
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
                abrirModalEditarAtencion(docId, descripcion, atencion?.tipoAtencion || "", rutPaciente);
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

    window.cerrarModalFichaPaciente = function() {
        const modal = document.getElementById('modal-ficha-paciente');
        if (modal) modal.style.display = 'none';
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
})();
