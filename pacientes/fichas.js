// PACIENTES/FICHAS.JS
// Muestra en la pestaña Pacientes TODOS los pacientes únicos agendados en la colección 'citas' del CESFAM logueado.
// Los crea automáticamente en la colección 'pacientes' si no existen, y los muestra directamente aunque no estén allí.
// Incluye logs de depuración para verificar ruts y nombres extraídos de las citas.

(function() {
    let pacientesTabData = [];
    let miCesfam = null;

    // Helpers para UI
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

    // Extrae pacientes desde las citas y los crea en 'pacientes' si no existen. Incluye logs para depuración.
    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        if (!miCesfam) return [];
        const citasSnap = await db.collection('citas').where('cesfam', '==', miCesfam).get();
        const pacientesMap = {};

        citasSnap.forEach(doc => {
            const cita = doc.data();
            // Depuración: log de campos usados
            console.log(`[CITA] id: ${doc.id} rut:`, cita.pacienteRut, cita.rut, cita.rutPaciente, "nombre:", cita.pacienteNombre, cita.nombre);

            const rut = (cita.pacienteRut || cita.rut || cita.rutPaciente || '').replace(/[.\-]/g, "").toUpperCase();
            const nombre = cita.pacienteNombre || cita.nombre || '';
            if (!rut) {
                console.warn('Cita sin rut, id:', doc.id, cita);
                return;
            }
            if (!nombre) {
                console.warn('Cita sin nombre, id:', doc.id, cita);
            }
            if (!pacientesMap[rut]) {
                pacientesMap[rut] = {
                    rut: rut,
                    nombre: nombre,
                    cesfam: miCesfam,
                    telefono: cita.pacienteTelefono || cita.telefono || '',
                    email: cita.pacienteEmail || cita.email || '',
                    direccion: cita.pacienteDireccion || cita.direccion || '',
                    edad: cita.pacienteEdad || cita.edad || '',
                };
            }
        });

        // Sincroniza con colección 'pacientes'
        for (const rut in pacientesMap) {
            const paciente = pacientesMap[rut];
            const snap = await db.collection('pacientes').where('rut', '==', rut).limit(1).get();
            if (snap.empty) {
                await db.collection('pacientes').add(Object.assign({}, paciente, {
                    fechaRegistro: new Date().toISOString()
                }));
            }
        }

        // Retorna array para mostrar directamente
        return Object.values(pacientesMap);
    }

    // Renderiza pacientes en el grid
    function renderPacientesGrid(pacientes) {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #patients-grid en el DOM");
            return;
        }
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes agendados en este CESFAM.</div>";
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

    // Filtro local sobre los pacientes extraídos de citas
    function buscarPacientesLocal(texto) {
        texto = (texto || '').trim().toUpperCase();
        if (!texto) {
            renderPacientesGrid(pacientesTabData);
            return;
        }
        const filtrados = pacientesTabData.filter(p =>
            (p.rut && p.rut.includes(texto)) ||
            (p.nombre && p.nombre.toUpperCase().includes(texto))
        );
        renderPacientesGrid(filtrados);
    }

    // Modal ficha paciente (con observaciones desde atenciones)
    window.verFichaPacienteSenda = function(rut) {
        const db = window.getFirestore();
        const rutLimpio = rut.replace(/[.\-]/g, "").toUpperCase();
        db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get().then(snapshot => {
            if (!snapshot.empty) {
                const data = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
                mostrarModalFichaPaciente(data);
            } else {
                // Si el paciente no existe en 'pacientes', muestra con los datos del grid
                const pacienteData = pacientesTabData.find(p => p.rut === rutLimpio);
                if (pacienteData) {
                    mostrarModalFichaPaciente(pacienteData);
                } else {
                    window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                }
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

    // Refresca la pestaña: extrae pacientes desde citas y los muestra
    async function refrescarPacientesTab() {
        const grid = getGrid();
        if (!grid) {
            console.error("No se encontró el elemento #patients-grid en el DOM");
            return;
        }
        grid.innerHTML = "<div class='loading-message'><i class='fas fa-spinner fa-spin'></i> Actualizando pacientes...</div>";
        await obtenerCesfamActual(async function() {
            pacientesTabData = await extraerYCrearPacientesDesdeCitas();
            renderPacientesGrid(pacientesTabData);
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
        if (document.getElementById('pacientes-tab')?.classList.contains('active')) {
            refrescarPacientesTab();
        }
    });

})();
