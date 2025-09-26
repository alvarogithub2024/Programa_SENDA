// PACIENTES/FICHAS.JS
(function() {
    let pacientesTabData = [];
    let pacientesCitas = [];
    let miCesfam = null;

    function getGrid() { return document.getElementById('patients-grid'); }
    function getSearchInput() { return document.getElementById('search-pacientes-rut'); }
    function getBuscarBtn() { return document.getElementById('buscar-paciente-btn'); }
    function getActualizarBtn() { return document.getElementById('actualizar-pacientes-btn'); }
    function getFichaModal() { return document.getElementById('modal-ficha-paciente'); }
    function getFichaModalBody() { return document.getElementById('modal-ficha-paciente-body'); }

    // Botón de actualizar si no existe
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

    function obtenerCesfamActual(callback) {
        const user = firebase.auth().currentUser;
        if (!user) return callback(null);
        const db = window.getFirestore();
        db.collection('profesionales').doc(user.uid).get().then(doc => {
            miCesfam = doc.exists ? doc.data().cesfam : null;
            callback(miCesfam);
        });
    }

    async function cargarPacientesDesdeCitas() {
        const db = window.getFirestore();
        if (!miCesfam) return [];
        const snapshot = await db.collection('citas').where('cesfam', '==', miCesfam).get();
        const pacientesMap = {};
        snapshot.forEach(doc => {
            const cita = doc.data();
            const rut = cita.pacienteRut || cita.rut || cita.rutPaciente || '';
            if (!rut) return;
            if (!pacientesMap[rut]) {
                pacientesMap[rut] = {
                    rut: rut,
                    nombre: cita.pacienteNombre || cita.nombre || '',
                    cesfam: miCesfam,
                    telefono: cita.pacienteTelefono || cita.telefono || '',
                    email: cita.pacienteEmail || cita.email || '',
                    direccion: cita.pacienteDireccion || cita.direccion || '',
                    edad: cita.pacienteEdad || cita.edad || '',
                };
            }
        });
        pacientesCitas = Object.values(pacientesMap);
        return pacientesCitas;
    }

    async function sincronizarPacientesConColeccion() {
        const db = window.getFirestore();
        for (let paciente of pacientesCitas) {
            const rutLimpio = paciente.rut.replace(/[.\-]/g, "").toUpperCase();
            const snap = await db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get();
            if (snap.empty) {
                await db.collection('pacientes').add(Object.assign({}, paciente, {
                    rut: rutLimpio,
                    fechaRegistro: new Date().toISOString()
                }));
            }
        }
    }

    function renderPacientesGrid(pacientes) {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #patients-grid en el DOM");
            return;
        }
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes registrados en este CESFAM.</div>";
            return;
        }
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'patient-card';
            div.innerHTML = `
                <div><strong>${p.nombre}</strong></div>
                <div>RUT: ${p.rut}</div>
                <div>Edad: ${p.edad || 'N/A'}</div>
                <div>Tel: ${p.telefono || ''}</div>
                <div>Email: ${p.email || ''}</div>
                <div>Dirección: ${p.direccion || ''}</div>
                <div>CESFAM: ${p.cesfam}</div>
                <button class="btn btn-outline btn-sm" onclick="verFichaPacienteSenda('${p.rut}')"><i class="fas fa-file-medical"></i> Ver Ficha</button>
            `;
            grid.appendChild(div);
        });
    }

    function buscarPacientesPorTexto(texto) {
        window.buscarPacientesPorTexto(texto, function(resultados) {
            const filtrados = resultados.filter(p => p.cesfam === miCesfam);
            pacientesTabData = filtrados;
            renderPacientesGrid(pacientesTabData);
        });
    }

    // MODAL FICHA PACIENTE
    window.verFichaPacienteSenda = function(rut) {
        const db = window.getFirestore();
        const rutLimpio = rut.replace(/[.\-]/g, "").toUpperCase();
        db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get().then(snapshot => {
            if (!snapshot.empty) {
                const data = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
                mostrarModalFichaPaciente(data);
            } else {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
            }
        });
    };

    // Muestra el modal con la ficha y observaciones del profesional
    function mostrarModalFichaPaciente(paciente) {
        const modal = getFichaModal();
        const modalBody = getFichaModalBody();
        if (!modal || !modalBody) return;

        // Info principal
        let html = `
            <h3>${paciente.nombre || ''}</h3>
            <p><b>RUT:</b> ${paciente.rut || ''}</p>
            <p><b>Edad:</b> ${paciente.edad || ''}</p>
            <p><b>Teléfono:</b> ${paciente.telefono || ''}</p>
            <p><b>Email:</b> ${paciente.email || ''}</p>
            <p><b>Dirección:</b> ${paciente.direccion || ''}</p>
            <p><b>CESFAM:</b> ${paciente.cesfam || ''}</p>
            <hr>
            <div id="observaciones-profesional"><b>Observaciones y atención profesional:</b><div class="loading-message">Cargando...</div></div>
        `;
        modalBody.innerHTML = html;
        modal.style.display = 'flex';

        // Cargar observaciones/atenciones
        cargarObservacionesAtencion(paciente.id);
    }

    // Cargar las observaciones/agregado del profesional (puedes mejorar el query según tu modelo)
    function cargarObservacionesAtencion(pacienteId) {
        const cont = document.getElementById('observaciones-profesional');
        if (!cont) return;
        const db = window.getFirestore();
        // Ejemplo: buscar atenciones del paciente
        db.collection('atenciones').where('pacienteId', '==', pacienteId).orderBy('fechaRegistro', 'desc').get()
            .then(snapshot => {
                let html = '';
                if (snapshot.empty) {
                    html = "<p>No hay atenciones registradas.</p>";
                } else {
                    html = '<ul>';
                    snapshot.forEach(doc => {
                        const a = doc.data();
                        html += `<li>
                            <b>${a.fechaRegistro ? new Date(a.fechaRegistro.seconds ? a.fechaRegistro.seconds*1000 : a.fechaRegistro).toLocaleDateString('es-CL') : ''}</b> -
                            <b>${a.tipoAtencion || 'Atención'}</b><br>
                            <span>${a.descripcion || ''}</span>
                            <div><small>Profesional: ${a.profesional || ''}</small></div>
                        </li>`;
                    });
                    html += '</ul>';
                }
                cont.innerHTML = `<b>Observaciones y atención profesional:</b> ${html}`;
            })
            .catch(error => {
                cont.innerHTML = "<p>Error cargando observaciones.</p>";
            });
    }

    // Cerrar modal ficha paciente (agrega al HTML el botón de cerrar que llama esta función)
    window.cerrarModalFichaPaciente = function() {
        const modal = getFichaModal();
        if (modal) modal.style.display = 'none';
    };

    async function refrescarPacientesTab() {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #patients-grid en el DOM");
            return;
        }
        grid.innerHTML = "<div class='loading-message'><i class='fas fa-spinner fa-spin'></i> Actualizando pacientes...</div>";
        await obtenerCesfamActual(async function() {
            await cargarPacientesDesdeCitas();
            await sincronizarPacientesConColeccion();
            const db = window.getFirestore();
            db.collection('pacientes').where('cesfam', '==', miCesfam).get().then(snapshot => {
                const lista = [];
                snapshot.forEach(doc => {
                    lista.push(Object.assign({ id: doc.id }, doc.data()));
                });
                pacientesTabData = lista;
                renderPacientesGrid(pacientesTabData);
            });
        });
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
                if (!texto) {
                    refrescarPacientesTab();
                } else {
                    buscarPacientesPorTexto(texto);
                }
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
        if (document.getElementById('pacientes-tab')?.classList.contains('active')) {
            refrescarPacientesTab();
        }
    });

})();
