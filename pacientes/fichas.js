// PACIENTES/PACIENTES-TAB.JS
// Este archivo gestiona la carga, sincronización y filtrado de pacientes desde las citas para la pestaña de pacientes.
// Depende de pacientes/fichas.js y pacientes/busqueda.js

(function() {
    // Variables
    let pacientesTabData = []; // Pacientes mostrados actualmente
    let pacientesCitas = [];   // Pacientes extraídos de citas
    let miCesfam = null;       // CESFAM actual (del profesional logueado)

    // Elementos UI
    const grid = document.getElementById('patients-grid');
    const searchInput = document.getElementById('search-pacientes-rut');
    const buscarBtn = document.getElementById('buscar-paciente-btn');
    let actualizarBtn = document.getElementById('actualizar-pacientes-btn');

    // Si no existe el botón de actualizar, créalo y agrégalo al header de la sección
    (function crearBotonActualizarSiNoExiste() {
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
    })();

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
        // Buscar citas del cesfam actual
        const snapshot = await db.collection('citas').where('cesfam', '==', miCesfam).get();
        const pacientesMap = {};
        snapshot.forEach(doc => {
            const cita = doc.data();
            // RUT y nombre pueden variar según esquema, ajusta según tu campo
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
                    // Puedes agregar otros campos según tu esquema
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
            // Verifica si existe en la colección
            const rutLimpio = paciente.rut.replace(/[.\-]/g, "").toUpperCase();
            const snap = await db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get();
            if (snap.empty) {
                // No existe, lo creamos
                await db.collection('pacientes').add(Object.assign({}, paciente, {
                    rut: rutLimpio,
                    fechaRegistro: new Date().toISOString()
                }));
            }
        }
    }

    // Muestra la lista de pacientes en el grid
    function renderPacientesGrid(pacientes) {
        if (!grid) return;
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes registrados en este CESFAM.</div>";
            return;
        }
        // Renderizar cada paciente (puedes mejorar el HTML)
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
            // Filtrar solo los del CESFAM actual
            const filtrados = resultados.filter(p => p.cesfam === miCesfam);
            pacientesTabData = filtrados;
            renderPacientesGrid(pacientesTabData);
        });
    }

    // Muestra la ficha al hacer clic
    window.verFichaPacienteSenda = function(rut) {
        // Buscar paciente por RUT en la colección
        const db = window.getFirestore();
        const rutLimpio = rut.replace(/[.\-]/g, "").toUpperCase();
        db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get().then(snapshot => {
            if (!snapshot.empty) {
                const data = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());
                // Aquí abre tu modal o sección de ficha, ejemplo:
                window.obtenerFichaPaciente && window.obtenerFichaPaciente(data.id, function(datos) {
                    alert(`Ficha de ${datos.nombre}\nRUT: ${datos.rut}\nEdad: ${datos.edad}\nTeléfono: ${datos.telefono}\nCESFAM: ${datos.cesfam}`);
                });
            } else {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
            }
        });
    };

    // Refresca todo: recarga, sincroniza, muestra todo
    async function refrescarPacientesTab() {
        grid.innerHTML = "<div class='loading-message'><i class='fas fa-spinner fa-spin'></i> Actualizando pacientes...</div>";
        await obtenerCesfamActual(async function() {
            await cargarPacientesDesdeCitas();
            await sincronizarPacientesConColeccion();
            // Finalmente cargar TODOS los pacientes del cesfam para mostrar
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

    // Inicialización al cargar pestaña
    window.loadPatients = refrescarPacientesTab;

    // Buscar
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

    // Actualizar
    if (actualizarBtn) {
        actualizarBtn.onclick = function() {
            refrescarPacientesTab();
        };
    }

    // Refresca automáticamente al cambiar de tab (si lo deseas)
    document.addEventListener('DOMContentLoaded', function() {
        // Si la pestaña pacientes está activa al entrar, refresca (ajusta selector si tu sistema de tabs lo requiere)
        if (document.getElementById('pacientes-tab')?.classList.contains('active')) {
            refrescarPacientesTab();
        }
    });

})();
