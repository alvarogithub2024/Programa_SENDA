(function() {
    let pacientesTabData = [];
    let profesionActual = null;

    // Detecta profesión actual
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

    // Solo médicos, psicólogos y terapeutas (o terapeuta_ocupacional) pueden editar
    function puedeEditarHistorial() {
        const rolesPermitidos = ['medico', 'psicologo', 'terapeuta', 'terapeuta_ocupacional'];
        return profesionActual && rolesPermitidos.includes(profesionActual);
    }

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
            div.dataset.pacienteRut = p.rut;
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
            ((p.nombre + ' ' + (p.apellidos || '')).toUpperCase().includes(texto)
        ));
        renderPacientesGrid(filtrados);
    }

    // Cambiado: ahora busca por ID del paciente
    window.verFichaPacienteSenda = function(rut) {
        const db = window.getFirestore();
        const rutLimpio = (rut || '').replace(/[.\-]/g, '').trim();
        db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get().then(function(snapshot) {
            if (snapshot.empty) {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                return;
            }
            const pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());

            let modal = document.getElementById('modal-ficha-paciente');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-ficha-paciente';
                modal.className = 'modal-overlay';
                modal.style.display = 'flex';
                modal.innerHTML = `<div class="modal-content" style="max-width:500px;">
                    <span class="close" onclick="cerrarModalFichaPaciente()">&times;</span>
                    <div id="modal-ficha-paciente-body"></div>
                </div>`;
                document.body.appendChild(modal);
            } else {
                modal.style.display = 'flex';
            }

            const modalBody = document.getElementById('modal-ficha-paciente-body');
            let html = `
                <h3 style="margin-bottom:10px;">${pacienteData.nombre || ''} ${pacienteData.apellidos || ''}</h3>
                <p><b>RUT:</b> ${pacienteData.rut || ''}</p>
                <p><b>Teléfono:</b> ${pacienteData.telefono || ''}</p>
                <p><b>Email:</b> ${pacienteData.email || ''}</p>
                <p><b>Dirección:</b> ${pacienteData.direccion || ''}</p>
                <hr>
                <div id="historial-clinico"><b>Historial clínico:</b><div class="loading-message">Cargando...</div></div>
            `;
            modalBody.innerHTML = html;

            cargarHistorialClinicoPacientePorId(pacienteData.id);
        });
    };

    window.cerrarModalFichaPaciente = function() {
        const modal = document.getElementById('modal-ficha-paciente');
        if (modal) modal.style.display = 'none';
    };

    // Cambiado: buscar por pacienteId
    function cargarHistorialClinicoPacientePorId(pacienteId) {
        const cont = document.getElementById('historial-clinico');
        if (!cont) return;
        const db = window.getFirestore();
        db.collection('atenciones')
          .where('pacienteId', '==', pacienteId)
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
                      let acciones = '';
                      if (puedeEditarHistorial()) {
                          acciones = `
                              <button class="btn btn-outline btn-sm" onclick="window.mostrarModalEditarAtencionDesdeFicha('${doc.id}', '${encodeURIComponent(a.descripcion || '')}', '${a.tipoAtencion || ''}', '${pacienteId}')">
                                  <i class="fas fa-edit"></i> Editar
                              </button>
                              <button class="btn btn-danger btn-sm" onclick="window.eliminarAtencionDesdeFicha('${doc.id}', '${pacienteId}')">
                                  <i class="fas fa-trash"></i> Eliminar
                              </button>
                          `;
                      }
                      html += `<li style="margin-bottom:8px;">
                          <b>Profesional:</b> ${a.profesional || ''} <br>
                          <b>Fecha:</b> ${fechaTexto} <b>Hora:</b> ${horaTexto}<br>
                          <span>${a.descripcion || ''}</span>
                          <div>${acciones}</div>
                      </li>`;
                  });
                  html += '</ul>';
              }
              cont.innerHTML = `<b>Historial clínico:</b> ${html}`;
          })
          .catch(error => {
              if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
                  cont.innerHTML = `
                    <p>Error cargando historial clínico. Firestore requiere un índice compuesto para esta consulta.</p>
                    <p>Sigue el enlace en la consola de Firebase para crearlo.</p>
                  `;
                  console.error("Firestore necesita índice compuesto para atenciones.pacienteId + fechaRegistro", error);
              } else {
                  cont.innerHTML = "<p>Error cargando historial clínico.</p>";
                  console.error("Error Firestore:", error);
              }
          });
    }

    // MODAL DE EDICIÓN DE ATENCIÓN DESDE FICHA
    window.mostrarModalEditarAtencionDesdeFicha = function(atencionId, descripcionEnc, tipoAtencion, pacienteId) {
        const descripcion = decodeURIComponent(descripcionEnc);
        window.cerrarModalFichaPaciente();

        let modal = document.getElementById('modal-editar-atencion-ficha');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-editar-atencion-ficha';
            modal.className = 'modal-overlay';
            modal.style.display = 'flex';
            modal.innerHTML = `<div class="modal-content" style="max-width:400px;">
                <span class="close" onclick="cerrarModalEditarAtencionFicha()">&times;</span>
                <h2>Editar atención</h2>
                <form id="form-editar-atencion-ficha">
                    <div class="form-group">
                      <label for="editar-atencion-descripcion-ficha">Descripción</label>
                      <textarea id="editar-atencion-descripcion-ficha" class="form-textarea" required></textarea>
                    </div>
                    <div class="form-group">
                      <label for="editar-atencion-tipo-ficha">Tipo de atención</label>
                      <select id="editar-atencion-tipo-ficha" class="form-select" required>
                        <option value="">Selecciona tipo...</option>
                        <option value="consulta">Consulta</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="orientacion">Orientación</option>
                        <option value="intervencion">Intervención</option>
                        <option value="derivacion">Derivación</option>
                      </select>
                    </div>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary">Guardar cambios</button>
                    </div>
                    <input type="hidden" id="editar-atencion-id-ficha">
                    <input type="hidden" id="editar-atencion-paciente-id-ficha">
                </form>
            </div>`;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }
        document.getElementById('editar-atencion-id-ficha').value = atencionId;
        document.getElementById('editar-atencion-descripcion-ficha').value = descripcion || "";
        document.getElementById('editar-atencion-tipo-ficha').value = tipoAtencion || "";
        document.getElementById('editar-atencion-paciente-id-ficha').value = pacienteId;

        var form = document.getElementById('form-editar-atencion-ficha');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                const id = document.getElementById('editar-atencion-id-ficha').value;
                const nuevaDescripcion = document.getElementById('editar-atencion-descripcion-ficha').value.trim();
                const nuevoTipo = document.getElementById('editar-atencion-tipo-ficha').value;
                const pacienteId = document.getElementById('editar-atencion-paciente-id-ficha').value;
                const db = window.getFirestore();
                db.collection("atenciones").doc(id).update({
                    descripcion: nuevaDescripcion,
                    tipoAtencion: nuevoTipo,
                    fechaActualizacion: new Date().toISOString()
                })
                .then(function() {
                    window.showNotification("Atención editada correctamente", "success");
                    cerrarModalEditarAtencionFicha();
                    cargarHistorialClinicoPacientePorId(pacienteId);
                })
                .catch(function(error) {
                    window.showNotification("Error al editar atención: " + error.message, "error");
                });
            };
        }
    };

    window.cerrarModalEditarAtencionFicha = function() {
        let modal = document.getElementById('modal-editar-atencion-ficha');
        if (modal) modal.style.display = 'none';
        let fichaModal = document.getElementById('modal-ficha-paciente');
        if (fichaModal) fichaModal.style.display = 'flex';
    };

    window.eliminarAtencionDesdeFicha = function(atencionId, pacienteId) {
        if (!puedeEditarHistorial()) return;
        if (!confirm("¿Seguro que deseas eliminar esta atención?")) return;
        const db = window.getFirestore();
        db.collection('atenciones').doc(atencionId).delete()
          .then(() => {
              window.showNotification && window.showNotification("Atención eliminada correctamente", "success");
              cargarHistorialClinicoPacientePorId(pacienteId);
          })
          .catch(error => {
              window.showNotification && window.showNotification("Error al eliminar atención: " + error.message, "error");
          });
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

    document.addEventListener('DOMContentLoaded', function() {
        inicializarEventos();
        refrescarPacientesTab();
    });

})();
