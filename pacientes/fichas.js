(function() {
    let pacientesTabData = [];
    let profesionActual = null;

    // Detecta profesión actual
    if (window.getCurrentUser && window.getFirestore && typeof firebase !== "undefined") {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                window.getFirestore().collection('profesionales').doc(user.uid).get().then(function(doc){
                    if (doc.exists) {
                        profesionActual = (doc.data().profession || "").trim().toLowerCase();
                        console.log("Profesión cargada:", profesionActual);
                    }
                });
            } else {
                profesionActual = null;
            }
        });
    }

    function puedeEditarHistorial() {
        // Ajusta los valores a lo que realmente tienes en Firestore
        const rolesPermitidos = ['medico', 'psicologo', 'terapeuta', 'terapeuta ocupacional'];
        return profesionActual && rolesPermitidos.includes(profesionActual);
    }

    // ... resto igual ...

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

            esperarProfesionYRenderizar(pacienteData.rut);
        });
    };

    function esperarProfesionYRenderizar(rutPaciente) {
        if (profesionActual === null) {
            setTimeout(() => esperarProfesionYRenderizar(rutPaciente), 200);
            return;
        }
        cargarHistorialClinicoPacientePorRut(rutPaciente);
    }

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
                      // DEBUG:
                      console.log("Renderizando historial - profesionActual:", profesionActual, "¿Puede editar?", puedeEditarHistorial());
                      let acciones = '';
                      if (puedeEditarHistorial()) {
                          acciones = `
                              <button class="btn btn-outline btn-sm" onclick="window.mostrarModalEditarAtencionDesdeFicha('${doc.id}', '${encodeURIComponent(a.descripcion || '')}', '${a.tipoAtencion || ''}', '${rutPaciente}')">
                                  <i class="fas fa-edit"></i> Editar
                              </button>
                              <button class="btn btn-danger btn-sm" onclick="window.eliminarAtencionDesdeFicha('${doc.id}', '${rutPaciente}')">
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
                  console.error("Firestore necesita índice compuesto para atenciones.pacienteRut + fechaRegistro", error);
              } else {
                  cont.innerHTML = "<p>Error cargando historial clínico.</p>";
                  console.error("Error Firestore:", error);
              }
          });
    }

    // ... resto igual ...
})();
