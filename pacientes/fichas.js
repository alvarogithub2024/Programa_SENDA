// PACIENTES/FICHAS.JS
// Muestra pacientes únicos agendados en 'citas'.
// Grid: nombre + apellidos, rut, teléfono, correo.
// Modal: nombre + apellidos, rut, teléfono, correo, dirección, historial clínico (profesional, fecha, hora, descripción).

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

    // Extrae pacientes desde todas las citas y los crea en 'pacientes' si no existen. Usa el id de la cita como referencia.
    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        const citasSnap = await db.collection('citas').get();
        const pacientesMap = {};

        citasSnap.forEach(doc => {
            const cita = doc.data();
            // Log de campos usados
            console.log(`[CITA] id: ${doc.id} rut:`, cita.rut, "nombre:", cita.nombre, "apellidos:", cita.apellidos);

            const rut = (cita.rut || '').replace(/[.\-]/g, "").toUpperCase();
            const nombre = cita.nombre || '';
            const apellidos = cita.apellidos || '';
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
                <div style="display:flex; gap:24px; align-items:center;">
                  <div style="font-weight:600; min-width:170px;">${p.nombre} ${p.apellidos || ''}</div>
                  <div>RUT: ${p.rut}</div>
                  <div>Tel: ${p.telefono || ''}</div>
                  <div>Email: ${p.email || ''}</div>
                  <button class="btn btn-outline btn-sm" style="margin-left:18px;" onclick="verFichaPacienteSenda('${p.rut}')"><i class="fas fa-file-medical"></i> Ver Ficha</button>
                </div>
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
            ((p.nombre + ' ' + (p.apellidos || '')).toUpperCase().includes(texto))
        );
        renderPacientesGrid(filtrados);
    }

    // Modal ficha paciente (completa + historial clínico)
    window.verFichaPacienteSenda = function(rut) {
        const db = window.getFirestore();
        db.collection('pacientes').where('rut', '==', rut).limit(1).get().then(function(snapshot) {
            if (snapshot.empty) {
                window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
                return;
            }
            const pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());

            // Crea el modal si no existe
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

            // Historial clínico: muestra las atenciones ordenadas por fecha desc, filtrando por rut
            cargarHistorialClinicoPacientePorRut(pacienteData.rut);
        });
    };

    window.cerrarModalFichaPaciente = function() {
        const modal = document.getElementById('modal-ficha-paciente');
        if (modal) modal.style.display = 'none';
    };

function cargarHistorialClinicoPacientePorRut(rutPaciente) {
    // Limpia el rut para asegurar coincidencia
    rutPaciente = (rutPaciente || '').replace(/[.\-]/g, '').trim();
    const cont = document.getElementById('historial-clinico');
    if (!cont) return;
    const db = window.getFirestore();
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
                  if (a.fechaRegistro) {
                      let fechaObj = new Date(a.fechaRegistro);
                      fechaTexto = fechaObj.toLocaleDateString('es-CL');
                      horaTexto = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                  }
                  html += `<li style="margin-bottom:8px;">
                      <b>Profesional:</b> ${a.profesional || ''} <br>
                      <b>Fecha:</b> ${fechaTexto} <b>Hora:</b> ${horaTexto}<br>
                      <span>${a.descripcion || ''}</span>
                  </li>`;
              });
              html += '</ul>';
          }
          cont.innerHTML = `<b>Historial clínico:</b> ${html}`;
      })
      .catch(error => {
          cont.innerHTML = "<p>Error cargando historial clínico.</p>";
      });
}
    // Refresca la pestaña: extrae pacientes desde citas y los muestra
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
