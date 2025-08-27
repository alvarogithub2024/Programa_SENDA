window.onload = function() {
  // --- Inicializar Firebase ---
  const firebaseConfig = {
    apiKey: "AIzaSyDEjlDOYhHrnavXOKWjdHO0HXILWQhUXv8",
    authDomain: "senda-6d5c9.firebaseapp.com",
    projectId: "senda-6d5c9",
    storageBucket: "senda-6d5c9.firebasestorage.app",
    messagingSenderId: "1090028669785",
    appId: "1:1090028669785:web:d4e1c1b9945fc2fddc1a48",
    measurementId: "G-82DCLW5R2W"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // --- MODALES BÁSICOS ---
  document.getElementById('abrir-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'flex';
  };
  document.getElementById('cerrar-modal').onclick = function() {
    document.getElementById('modal-bg').style.display = 'none';
  };
  document.getElementById('modal-bg').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-modal-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-login-profesional').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
  };
  document.getElementById('modal-bg-login-profesional').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-form-ingresar').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
    document.getElementById('modal-bg-ingresar').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-ingresar').onclick = function() {
    document.getElementById('modal-bg-ingresar').style.display = 'none';
  };
  document.getElementById('modal-bg-ingresar').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  document.getElementById('abrir-form-registrar').onclick = function() {
    document.getElementById('modal-bg-login-profesional').style.display = 'none';
    document.getElementById('modal-bg-registrar').style.display = 'flex';
  };
  document.getElementById('cerrar-modal-registrar').onclick = function() {
    document.getElementById('modal-bg-registrar').style.display = 'none';
  };
  document.getElementById('modal-bg-registrar').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };

  // --- INSCRIPCIÓN PACIENTE ---
  document.getElementById('form-inscripcion').onsubmit = function(e) {
    e.preventDefault();
    const datos = {
      nombre: document.getElementById('nombre-insc').value.trim(),
      apellido: document.getElementById('apellido-insc').value.trim(),
      rut: document.getElementById('rut-insc').value.trim(),
      telefono: document.getElementById('telefono-insc').value.trim(),
      correo: document.getElementById('correo-insc').value.trim(),
      comuna: document.getElementById('comuna-insc').value.trim(),
      direccion: document.getElementById('direccion-insc').value.trim(),
      fecha: new Date().toLocaleString(),
      derivacion: "pendiente"
    };
    db.collection("solicitudes").add(datos)
      .then(() => {
        alert("¡Inscripción enviada!");
        document.getElementById('modal-bg').style.display = 'none';
        document.getElementById('form-inscripcion').reset();
      })
      .catch(error => alert("Error al enviar inscripción: " + error.message));
  };

  // --- REGISTRO PROFESIONAL ---
  document.getElementById('form-registrar-profesional').onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-completo').value.trim();
    const correo = document.getElementById('correo-registrar').value.trim();
    const clave = document.getElementById('clave-registrar').value;
    const profesion = document.getElementById('profesion-registrar').value;

    if (!nombre || !correo || !clave || !profesion) {
      alert("Completa todos los campos.");
      return;
    }
    auth.createUserWithEmailAndPassword(correo, clave)
      .then(userCredential => {
        const user = userCredential.user;
        return db.collection("profesionales").doc(user.uid).set({
          nombre: nombre,
          correo: correo,
          profesion: profesion,
          creado: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        alert("¡Registro exitoso! Ahora puedes ingresar.");
        document.getElementById('modal-bg-registrar').style.display = 'none';
        document.getElementById('form-registrar-profesional').reset();
      })
      .catch(error => {
        if (error.code === "auth/email-already-in-use") {
          alert("El correo ya está registrado.");
        } else {
          alert("Error al registrar: " + error.message);
        }
      });
  };

  // --- LOGIN PROFESIONAL Y PANEL CON TABS ---
  document.getElementById('form-login-profesional').onsubmit = function(e) {
    e.preventDefault();
    const correo = document.getElementById('correo-login').value.trim();
    const clave = document.getElementById('clave-login').value;
    auth.signInWithEmailAndPassword(correo, clave)
      .then(userCredential => {
        const user = userCredential.user;
        db.collection("profesionales").doc(user.uid).get()
          .then(doc => {
            if (doc.exists) {
              const data = doc.data();
              document.getElementById('modal-bg-ingresar').style.display = 'none';
              mostrarPanelProfesional({
                uid: user.uid,
                nombre: data.nombre,
                correo: data.correo,
                profesion: data.profesion
              });
            } else {
              alert("No se encontraron datos de usuario profesional");
            }
          });
      })
      .catch(err => {
        alert("Error al ingresar: " + err.message);
      });
  };

  // --- PANEL PROFESIONAL CON TABS ---
  window.mostrarPanelProfesional = function(usuario) {
    document.getElementById('modal-bg-profesional-panel').style.display = 'flex';
    // Mis Datos
    document.getElementById('tab-mis-datos').innerHTML = `
      <h3>${usuario.nombre}</h3>
      <p><b>Correo:</b> ${usuario.correo}</p>
      <p><b>Profesión:</b> ${usuario.profesion === "asistente_social" ? "Asistente Social" : "Médico"}</p>
    `;
    // Tabs handler
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      };
    });
    // Solicitudes (solo asistente social)
    if (usuario.profesion === "asistente_social") {
      cargarSolicitudesAsistente(usuario);
      document.getElementById("btn-derivaciones").style.display = "none";
    } else {
      document.getElementById('tab-solicitudes').innerHTML = "<p>Solo los asistentes sociales pueden ver solicitudes para derivar.</p>";
      // Si es médico, mostrar pestaña de derivaciones
      if (usuario.profesion === "medico") {
        document.getElementById("btn-derivaciones").style.display = "inline-block";
        cargarDerivacionesMedico(usuario);
      } else {
        document.getElementById("btn-derivaciones").style.display = "none";
      }
    }
    // Buscar ficha
    document.getElementById('form-buscar-ficha').onsubmit = function(e) {
      e.preventDefault();
      const query = document.getElementById('buscar-rut').value.trim();
      buscarFichaPaciente(query);
    };
  };

  // --- CARGAR SOLICITUDES Y DERIVAR (solo asistente social) ---
  window.cargarSolicitudesAsistente = function(usuario) {
    db.collection("solicitudes").where("derivacion", "==", "pendiente").get().then(snap => {
      let html = "";
      snap.forEach(doc => {
        const sol = doc.data();
        html += `
          <div class="solicitud-item" style="margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid #eee;">
            <p><b>${sol.nombre} ${sol.apellido}</b> - ${sol.rut}</p>
            <p><b>Comuna:</b> ${sol.comuna} <b>Tel:</b> ${sol.telefono}</p>
            <textarea placeholder="Observación para derivar" id="obs-${doc.id}" class="obs-derivar"></textarea>
            <button onclick="derivarSolicitud('${doc.id}', '${usuario.nombre}')">Derivar al médico</button>
          </div>
        `;
      });
      document.getElementById('tab-solicitudes').innerHTML = html || "<p>No hay solicitudes pendientes.</p>";
    });
  };

  // --- DERIVAR SOLICITUD ---
  window.derivarSolicitud = function(idSolicitud, nombreProfesional) {
    const obs = document.getElementById('obs-' + idSolicitud).value.trim();
    if (!obs) { alert("Debes ingresar una observación."); return; }
    db.collection("solicitudes").doc(idSolicitud).update({
      derivacion: "medico",
      observacion_derivacion: obs,
      derivado_por: nombreProfesional
    })
    .then(() => {
      alert("Solicitud derivada con observación.");
      auth.onAuthStateChanged(user => {
        if (user) {
          db.collection("profesionales").doc(user.uid).get().then(doc => {
            if (doc.exists) mostrarPanelProfesional({uid: user.uid, ...doc.data()});
          });
        }
      });
    });
  };

  // --- CARGAR DERIVACIONES (solo médico) ---
  window.cargarDerivacionesMedico = function(usuario) {
    const tabDiv = document.getElementById('tab-derivaciones');
    tabDiv.innerHTML = "Cargando derivaciones...";
    db.collection("solicitudes").where("derivacion", "==", "medico").get().then(snap => {
      let html = "";
      snap.forEach(doc => {
        const sol = doc.data();
        html += `
          <div class="derivacion-item" style="margin-bottom:18px;padding-bottom:8px;border-bottom:1px solid #eee;">
            <b>${sol.nombre} ${sol.apellido}</b> - ${sol.rut}<br>
            <b>Comuna:</b> ${sol.comuna}<br>
            <b>Observación de derivación:</b> ${sol.observacion_derivacion || ''}<br>
            <b>Derivado por:</b> ${sol.derivado_por || ''}<br>
            <textarea placeholder="Información de la atención" id="atencion-${doc.id}" style="width:100%;margin:7px 0;"></textarea>
            <button onclick="registrarAtencion('${doc.id}', '${usuario.nombre}')">Registrar atención</button>
            <div id="info-atencion-${doc.id}">
              ${sol.atencion_medica ? `<b>Atendido por:</b> ${sol.atendido_por}<br><b>Información:</b> ${sol.atencion_medica}` : ''}
            </div>
          </div>
        `;
      });
      tabDiv.innerHTML = html || "<p>No hay derivaciones pendientes.</p>";
    });
  };

  // --- REGISTRAR ATENCIÓN (médico) ---
  window.registrarAtencion = function(idSolicitud, nombreProfesional) {
    const info = document.getElementById('atencion-' + idSolicitud).value.trim();
    if (!info) { alert("Debes ingresar la información de la atención."); return; }
    db.collection("solicitudes").doc(idSolicitud).update({
      atencion_medica: info,
      atendido_por: nombreProfesional,
      atencion_fecha: new Date().toLocaleString()
    })
    .then(() => {
      alert("Atención registrada.");
      auth.onAuthStateChanged(user => {
        if (user) {
          db.collection("profesionales").doc(user.uid).get().then(doc => {
            if (doc.exists) mostrarPanelProfesional({uid: user.uid, ...doc.data()});
          });
        }
      });
    });
  };

  // --- BUSCAR FICHA CON RESULTADO CLICKEABLE ---
  window.buscarFichaPaciente = function(query) {
    const resultadosDiv = document.getElementById('resultados-busqueda');
    if (!query) {
      resultadosDiv.innerHTML = "<p>Ingrese RUT o nombre.</p>";
      return;
    }
    db.collection("solicitudes")
      .where("rut", "==", query).get()
      .then(snap => {
        let html = "";
        snap.forEach(doc => {
          const sol = doc.data();
          html += `
            <div class="ficha-paciente ficha-clickeable" onclick="mostrarFichaCompleta('${doc.id}')" style="margin-bottom:16px;">
              <b>${sol.nombre} ${sol.apellido}</b> - ${sol.rut}<br>
              <b>Comuna:</b> ${sol.comuna}<br>
              <b>Dirección:</b> ${sol.direccion}<br>
              <b>Teléfono:</b> ${sol.telefono}<br>
              <b>Correo:</b> ${sol.correo}<br>
              ${sol.atencion_medica ? `<b>Última atención médica:</b> ${sol.atencion_medica} <br><b>Por:</b> ${sol.atendido_por || ''}<br>` : ""}
              <p style="margin-top: 10px; color: #1976d2; font-weight: 600;">→ Hacer clic para ver ficha completa</p>
            </div>
          `;
        });
        resultadosDiv.innerHTML = html || "<p>No se encontró ficha.</p>";
      });
  };

  // --- MOSTRAR FICHA COMPLETA DEL PACIENTE CON PESTAÑAS ---
  window.mostrarFichaCompleta = function(idPaciente) {
    db.collection("solicitudes").doc(idPaciente).get().then(doc => {
      if (doc.exists) {
        const paciente = doc.data();
        
        // Cambiar a la pestaña de ficha del paciente
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelector('[data-tab="ficha-paciente"]').classList.add('active');
        document.getElementById('tab-ficha-paciente').classList.add('active');

        // Mostrar la información completa con pestañas horizontales
        const contenidoFicha = document.getElementById('contenido-ficha-paciente');
        contenidoFicha.innerHTML = `
          <div class="ficha-completa">
            <h4>📋 Ficha del Paciente</h4>
            
            <!-- Pestañas horizontales -->
            <div class="ficha-tabs-horizontal">
              <button class="ficha-tab-btn active" data-ficha-tab="personal">👤 Personal</button>
              <button class="ficha-tab-btn" data-ficha-tab="contacto">📞 Contacto</button>
              <button class="ficha-tab-btn" data-ficha-tab="medica">🏥 Médica</button>
            </div>

            <!-- Contenido de las pestañas -->
            <div class="ficha-tab-content active" id="ficha-tab-personal">
              <h5>👤 Información Personal</h5>
              <div class="info-row">
                <strong>Nombre:</strong>
                <span>${paciente.nombre} ${paciente.apellido}</span>
              </div>
              <div class="info-row">
                <strong>RUT:</strong>
                <span>${paciente.rut}</span>
              </div>
              <div class="info-row">
                <strong>Fecha inscripción:</strong>
                <span>${paciente.fecha}</span>
              </div>
            </div>

            <div class="ficha-tab-content" id="ficha-tab-contacto">
              <h5>📞 Información de Contacto</h5>
              <div class="info-row">
                <strong>Teléfono:</strong>
                <span>${paciente.telefono}</span>
              </div>
              <div class="info-row">
                <strong>Correo:</strong>
                <span>${paciente.correo}</span>
              </div>
              <div class="info-row">
                <strong>Comuna:</strong>
                <span>${paciente.comuna}</span>
              </div>
              <div class="info-row">
                <strong>Dirección:</strong>
                <span>${paciente.direccion}</span>
              </div>
            </div>

            <div class="ficha-tab-content" id="ficha-tab-medica">
              <h5>🏥 Información Médica</h5>
              <div class="info-row">
                <strong>Estado derivación:</strong>
                <span>${paciente.derivacion === 'pendiente' ? '⏳ Pendiente' : 
                       paciente.derivacion === 'medico' ? '👨‍⚕️ Derivado al médico' : 
                       '✅ Atendido'}</span>
              </div>
              ${paciente.observacion_derivacion ? `
              <div class="info-row">
                <strong>Observación derivación:</strong>
                <span>${paciente.observacion_derivacion}</span>
              </div>
              <div class="info-row">
                <strong>Derivado por:</strong>
                <span>${paciente.derivado_por || 'N/A'}</span>
              </div>
              ` : ''}
              
              <!-- Historial de atenciones -->
              <div id="historial-atenciones-${idPaciente}">
                <h6 style="color: #0d47a1; margin: 20px 0 15px 0; font-weight: 700;">📝 Historial de Atenciones:</h6>
              </div>
            </div>

            <!-- Sección para nueva atención -->
            <div class="nueva-atencion">
              <h5>✍️ Registrar Nueva Atención</h5>
              <textarea id="nueva-atencion-${idPaciente}" placeholder="Describe la atención realizada al paciente..."></textarea>
              <button onclick="guardarAtencion('${idPaciente}')">💾 Guardar Atención</button>
            </div>
          </div>
        `;

        // Configurar pestañas horizontales
        document.querySelectorAll('.ficha-tab-btn').forEach(btn => {
          btn.onclick = function() {
            document.querySelectorAll('.ficha-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ficha-tab-content').forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('ficha-tab-' + this.dataset.fichaTab).classList.add('active');
          };
        });

        // Cargar historial de atenciones
        cargarHistorialAtenciones(idPaciente);

      } else {
        alert("No se pudo cargar la información del paciente.");
      }
    }).catch(error => {
      alert("Error al cargar ficha: " + error.message);
    });
  };

  // --- CARGAR HISTORIAL DE ATENCIONES ---
  window.cargarHistorialAtenciones = function(idPaciente) {
    db.collection("atenciones")
      .where("pacienteId", "==", idPaciente)
      .orderBy("fecha", "desc")
      .get()
      .then(snap => {
        let html = "";
        if (snap.empty) {
          html = "<p style='color: #90a4ae; font-style: italic;'>No hay atenciones registradas aún.</p>";
        } else {
          snap.forEach(doc => {
            const atencion = doc.data();
            html += `
              <div class="atencion-item">
                <div class="atencion-fecha">📅 ${atencion.fecha}</div>
                <div class="atencion-profesional">👨‍⚕️ Atendido por: ${atencion.profesional}</div>
                <div class="atencion-texto">${atencion.descripcion}</div>
              </div>
            `;
          });
        }
        document.getElementById(`historial-atenciones-${idPaciente}`).innerHTML += 
          `<div class="historial-atenciones">${html}</div>`;
      })
      .catch(error => {
        console.error("Error al cargar historial:", error);
        document.getElementById(`historial-atenciones-${idPaciente}`).innerHTML += 
          "<p style='color: #f44336;'>Error al cargar el historial de atenciones.</p>";
      });
  };

  // --- GUARDAR NUEVA ATENCIÓN ---
  window.guardarAtencion = function(idPaciente) {
    const descripcion = document.getElementById(`nueva-atencion-${idPaciente}`).value.trim();
    
    if (!descripcion) {
      alert("Debes escribir una descripción de la atención.");
      return;
    }

    // Obtener información del profesional actual
    auth.onAuthStateChanged(user => {
      if (user) {
        db.collection("profesionales").doc(user.uid).get().then(doc => {
          if (doc.exists) {
            const profesional = doc.data();
            
            // Guardar la atención en la colección "atenciones"
            db.collection("atenciones").add({
              pacienteId: idPaciente,
              descripcion: descripcion,
              profesional: profesional.nombre,
              profesionalId: user.uid,
              fecha: new Date().toLocaleString(),
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
              alert("✅ Atención guardada correctamente.");
              // Limpiar el textarea
              document.getElementById(`nueva-atencion-${idPaciente}`).value = "";
              // Recargar historial
              cargarHistorialAtenciones(idPaciente);
            })
            .catch(error => {
              alert("❌ Error al guardar la atención: " + error.message);
            });
          }
        });
      } else {
        alert("❌ Error: No se pudo identificar al profesional.");
      }
    });
  };

  // --- Cerrar panel profesional ---
  document.getElementById('cerrar-modal-prof-panel').onclick = function() {
    document.getElementById('modal-bg-profesional-panel').style.display = 'none';
  };
  document.getElementById('modal-bg-profesional-panel').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };
};
