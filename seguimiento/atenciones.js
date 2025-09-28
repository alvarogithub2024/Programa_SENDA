
document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("form-registrar-atencion");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var citaId = document.getElementById("atencion-cita-id").value;
        var pacienteId = document.getElementById("atencion-paciente-id").value;
        var descripcion = document.getElementById("atencion-descripcion").value.trim();
        var tipoAtencion = document.getElementById("atencion-tipo").value;

        if (!descripcion || !tipoAtencion) {
            window.showNotification("Completa los campos obligatorios", "warning");
            return;
        }

        var db = window.getFirestore();
        var user = firebase.auth().currentUser;

        db.collection("citas").doc(citaId).get().then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Cita no encontrada", "error");
                return;
            }
            var cita = doc.data();

            // Ejemplo al registrar atención:
var datosAtencion = {
    pacienteId: cita.pacienteId, // Usa el id del paciente
    pacienteNombre: cita.pacienteNombre || cita.nombre || "",
    pacienteRut: cita.pacienteRut || cita.rut || "",
    cesfam: cita.cesfam || "",
    fecha: cita.fecha || "",
    hora: cita.hora || "",
    descripcion: descripcion,
    tipoAtencion: tipoAtencion,
    profesional: cita.profesionalNombre || (user ? user.email : ""),
    profesionalId: cita.profesionalId || (user ? user.uid : ""),
    fechaRegistro: new Date().toISOString(),
    citaId: citaId
};
db.collection("atenciones").add(datosAtencion)
  .then(function(docRef) {
    // etc...
  });
            db.collection("atenciones").add(datosAtencion)
            .then(function(docRef) {
    
                if (datosAtencion.pacienteId || datosAtencion.pacienteRut) {
                    let pacientesRef = db.collection("pacientes");
                    let query;
                    if (datosAtencion.pacienteId) {
                        query = pacientesRef.doc(datosAtencion.pacienteId).get();
                    } else if (datosAtencion.pacienteRut) {
                        query = pacientesRef.where("rut", "==", datosAtencion.pacienteRut).limit(1).get();
                    }
                    Promise.resolve(query)
                    .then(function(snap) {
                        let pacienteData = {
                            nombre: datosAtencion.pacienteNombre || "",
                            rut: datosAtencion.pacienteRut || "",
                            cesfam: datosAtencion.cesfam || "",
                            telefono: cita.telefono || "",
                            email: cita.email || "",
                            direccion: cita.direccion || "",
                            fechaRegistro: datosAtencion.fechaRegistro || new Date().toISOString(),
                        };
                        if (snap && snap.exists) {
                            pacientesRef.doc(snap.id || datosAtencion.pacienteId).set(pacienteData, { merge: true });
                        } else if (snap && snap.docs && snap.docs.length) {
                            pacientesRef.doc(snap.docs[0].id).set(pacienteData, { merge: true });
                        } else {
                            pacientesRef.add(pacienteData);
                        }
                    });
                }
                window.showNotification("Atención registrada correctamente", "success");
                closeModal("modal-registrar-atencion");
                if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
                if (window.mostrarCitasRestantesHoy) window.mostrarCitasRestantesHoy();
            })
            .catch(function(error) {
                window.showNotification("Error guardando atención: " + error.message, "error");
            });
        });
    });
});


window.registrarAtencion = function(datosAtencion, callback) {
    var db = window.getFirestore();
    var datos = Object.assign({}, datosAtencion, {
        fechaRegistro: new Date().toISOString()
    });

    db.collection("atenciones")
        .add(datos)
        .then(function(docRef) {
        
            if (datos.pacienteId || datos.pacienteRut) {
                let pacientesRef = db.collection("pacientes");
                let query;
                if (datos.pacienteId) {
                    query = pacientesRef.doc(datos.pacienteId).get();
                } else if (datos.pacienteRut) {
                    query = pacientesRef.where("rut", "==", datos.pacienteRut).limit(1).get();
                }
                Promise.resolve(query)
                .then(function(snap) {
                    let pacienteData = {
                        nombre: datos.pacienteNombre || "",
                        rut: datos.pacienteRut || "",
                        cesfam: datos.cesfam || "",
                        telefono: datos.telefono || "",
                        email: datos.email || "",
                        direccion: datos.direccion || "",
                        fechaRegistro: datos.fechaRegistro || new Date().toISOString(),
                    };
                    if (snap && snap.exists) {
                        pacientesRef.doc(snap.id || datos.pacienteId).set(pacienteData, { merge: true });
                    } else if (snap && snap.docs && snap.docs.length) {
                        pacientesRef.doc(snap.docs[0].id).set(pacienteData, { merge: true });
                    } else {
                        pacientesRef.add(pacienteData);
                    }
                });
            }
            window.showNotification("Atención registrada correctamente", "success");
            if (typeof callback === "function") callback(true, docRef.id);
        })
        .catch(function(error) {
            window.showNotification("Error al registrar atención: " + error.message, "error");
            if (typeof callback === "function") callback(false, null);
        });
};


window.mostrarModalEditarAtencion = function(atencion) {
    let modal = document.getElementById('modal-editar-atencion');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-editar-atencion';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `<div class="modal-content" style="max-width:400px;">
            <span class="close" onclick="cerrarModalEditarAtencion()">&times;</span>
            <h2>Editar atención</h2>
            <form id="form-editar-atencion">
                <div class="form-group">
                  <label for="editar-atencion-descripcion">Descripción</label>
                  <textarea id="editar-atencion-descripcion" class="form-textarea" required></textarea>
                </div>
                <div class="form-group">
                  <label for="editar-atencion-tipo">Tipo de atención</label>
                  <select id="editar-atencion-tipo" class="form-select" required>
                    <option value="">Selecciona tipo...</option>
                    <option value="consulta">Consulta</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="orientacion">Orientación</option>
                    <option value="intervencion">Intervención</option>
                  </select>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Guardar cambios</button>
                </div>
                <input type="hidden" id="editar-atencion-id">
            </form>
        </div>`;
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
    document.getElementById('editar-atencion-id').value = atencion.id;
    document.getElementById('editar-atencion-descripcion').value = atencion.descripcion || '';
    document.getElementById('editar-atencion-tipo').value = atencion.tipoAtencion || '';

    var form = document.getElementById('form-editar-atencion');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            window.editarAtencion(
                document.getElementById('editar-atencion-id').value,
                {
                    descripcion: document.getElementById('editar-atencion-descripcion').value.trim(),
                    tipoAtencion: document.getElementById('editar-atencion-tipo').value
                }
            );
        };
    }
};

window.cerrarModalEditarAtencion = function() {
    let modal = document.getElementById('modal-editar-atencion');
    if (modal) modal.style.display = 'none';
};

window.editarAtencion = function(atencionId, nuevosDatos) {
    var db = window.getFirestore();
    db.collection("atenciones").doc(atencionId).update({
        descripcion: nuevosDatos.descripcion,
        tipoAtencion: nuevosDatos.tipoAtencion,
        fechaActualizacion: new Date().toISOString()
    })
    .then(function() {
        window.showNotification("Atención editada correctamente", "success");
        window.cerrarModalEditarAtencion();
        if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
        if (window.mostrarTimeline) window.mostrarTimeline();
    })
    .catch(function(error) {
        window.showNotification("Error al editar atención: " + error.message, "error");
    });
};

window.mostrarTimeline = function(atenciones, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = "";
    if (!atenciones.length) {
        cont.innerHTML = "<p>No hay atenciones registradas.</p>";
        return;
    }
    atenciones.forEach(function(a) {
        var div = document.createElement("div");
        div.className = "timeline-item";
        div.innerHTML = `
            <div class="timeline-fecha">${window.formatFecha ? window.formatFecha(a.fecha) : a.fecha}</div>
            <div class="timeline-detalle">
                <strong>${a.tipoAtencion || "Atención"}</strong>
                <p>${a.descripcion || ""}</p>
                <small>${a.profesional || ""}</small>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="window.mostrarModalEditarAtencion(${JSON.stringify(a)})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
        cont.appendChild(div);
    });
};
