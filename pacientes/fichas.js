(function() {
    let pacientesTabData = [];

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

    // Extrae pacientes desde las citas y los crea en 'pacientes' si no existen. Usa el id de la cita como referencia.
    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        const citasSnap = await db.collection('citas').get();
        const pacientesMap = {};

        citasSnap.forEach(doc => {
            const cita = doc.data();
            // Usa los campos que SI existen en tus citas (según tu screenshot)
            const rut = (cita.rut || '').replace(/[.\-]/g, "").toUpperCase();
            const nombre = cita.nombre || '';
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
                    citaId: doc.id, // Usamos el id de la cita
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

        // Sincroniza con colección 'pacientes'
        for (const rut in pacientesMap) {
            const paciente = pacientesMap[rut];
            const snap = await db.collection('pacientes').where('rut', '==', rut).limit(1).get();
            if (snap.empty) {
                await db.collection('pacientes').add(paciente);
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
            grid.innerHTML = "<div class='no-results'>No hay pacientes agendados aún.</div>";
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
                <div>Profesión: ${p.profesion || ''}</div>
                <div>Fecha de cita: ${p.fecha || ''}</div>
                <div>ID de cita: ${p.citaId || ''}</div>
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

    window.verFichaPacienteSenda = function(rut) {
        // Muestra un alert simple (puedes mejorar con modal)
        const pacienteData = pacientesTabData.find(p => p.rut === rut);
        if (pacienteData) {
            alert(
                `Paciente: ${pacienteData.nombre}\nRUT: ${pacienteData.rut}\nEdad: ${pacienteData.edad}\nProfesión: ${pacienteData.profesion}\nFecha de cita: ${pacienteData.fecha}\nID de cita: ${pacienteData.citaId}`
            );
        } else {
            window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
        }
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
