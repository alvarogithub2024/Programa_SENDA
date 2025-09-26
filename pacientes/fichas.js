// PACIENTES/FICHAS.JS
// Sincronización y visualización de pacientes en la pestaña Pacientes
// Incluye modal para ficha, mostrando atenciones (observaciones) del paciente

(function() {
    let pacientesTabData = [];
    let pacientesCitas = [];
    let miCesfam = null;

    // Utilidades para acceso a elementos UI
    function getGrid() { return document.getElementById('patients-grid'); }
    function getSearchInput() { return document.getElementById('search-pacientes-rut'); }
    function getBuscarBtn() { return document.getElementById('buscar-paciente-btn'); }
    function getActualizarBtn() { return document.getElementById('actualizar-pacientes-btn'); }

    // Si no existe el botón de actualizar, créalo y agrégalo al header de la sección
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

    // Obtiene el CESFAM actual del profesional logueado
    function obtenerCesfamActual(callback) {
        const user = firebase.auth().currentUser;
        if (!user) return callback(null);
        const db = window.getFirestore();
        db.collection('profesionales').doc(user.uid).get().then(doc => {
            miCesfam = doc.exists ? doc.data().cesfam : null;
            callback(miCesfam);
        });
    }

    // Carga todos los pacientes desde las citas del CESFAM actual
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

    // Sincroniza pacientes: agrega los que faltan en la colección "pacientes"
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

    // Muestra la lista de pacientes en el grid
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

    // Busca pacientes usando el input/texto
    function buscarPacientesPorTexto(texto) {
        window.buscarPacientesPorTexto(texto, function(resultados) {
            const filtrados = resultados.filter(p => p.cesfam === miCesfam);
            pacientesTabData = filtrados;
            renderPacientesGrid(pacientesTabData);
        });
    }

    // MODAL FICHA PACIENTE: abre modal y carga atenciones del paciente
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

    function mostrarModalFichaPaciente(paciente) {
        const modal = document.getElementById('modal-ficha-paciente');
        const modalBody = document.getElementById('modal-ficha-paciente-body');
        if (!modal || !modalBody) return;

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

        cargarObservacionesAtencionPorRut(paciente.rut);
    }

    // Consulta a la colección atenciones usando pacienteRut
    function cargarObservacionesAtencionPorRut(rutPaciente) {
        const cont = document.getElementById('observaciones-profesional');
        if (!cont) return;
        const db = window.getFirestore();
        db.collection('atenciones').where('pacienteRut', '==', rutPaciente).orderBy('fechaRegistro', 'desc').get()
            .then(snapshot => {
                let html = '';
                if (snapshot.empty) {
                    html = "<p>No hay atenciones registradas.</p>";
                } else {
                    html = '<ul>';
                    snapshot.forEach(doc => {
                        const a = doc.data();
                        // fechaRegistro puede ser string o Timestamp
                        let fechaTexto = '';
                        if (a.fechaRegistro) {
                            if (typeof a.fechaRegistro === 'string') {
                                fechaTexto = new Date(a.fechaRegistro).toLocaleDateString('es-CL');
                            } else if (a.fechaRegistro.seconds) {
                                fechaTexto = new Date(a.fechaRegistro.seconds * 1000).toLocaleDateString('es-CL');
                            }
                        }
                        html += `<li>
                            <b>${fechaTexto}</b> -
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

    // Funciones originales para obtener/actualizar ficha desde otras partes del sistema
    window.obtenerFichaPaciente = function(pacienteId, callback) {
        var db = window.getFirestore();
        db.collection("pacientes").doc(pacienteId).get()
            .then(function(doc) {
                if (!doc.exists) {
                    window.showNotification("Paciente no encontrado", "warning");
                    if (typeof callback === "function") callback(null);
                    return;
                }
                var datos = doc.data();
                datos.id = doc.id;
                if (typeof callback === "function") callback(datos);
            })
            .catch(function(error) {
                window.showNotification("Error obteniendo ficha: " + error.message, "error");
                if (typeof callback === "function") callback(null);
            });
    };

    window.actualizarFichaPaciente = function(pacienteId, datosExtra, callback) {
        var db = window.getFirestore();
        db.collection("pacientes").doc(pacienteId).update(datosExtra)
            .then(function() {
                window.showNotification("Ficha actualizada correctamente", "success");
                if (typeof callback === "function") callback(true);
            })
            .catch(function(error) {
                window.showNotification("Error actualizando ficha: " + error.message, "error");
                if (typeof callback === "function") callback(false);
            });
    };

})();
  
