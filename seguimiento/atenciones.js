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

            var datosAtencion = {
                pacienteId: cita.idPaciente || pacienteId,
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

            if (!window.crearAtencionConId) {
                window.showNotification("Sistema de ID no disponible", "error");
                return;
            }

            window.crearAtencionConId(datosAtencion, function(atencionId, idPaciente, error) {
                if (error) {
                    window.showNotification("Error guardando atención: " + error.message, "error");
                    return;
                }

                console.log(`✅ Atención creada: ${atencionId}, Paciente: ${idPaciente}`);
                window.showNotification("Atención registrada correctamente", "success");
                closeModal("modal-registrar-atencion");
                if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
                if (window.mostrarCitasRestantesHoy) window.mostrarCitasRestantesHoy();
            });
        });
    });
});

window.registrarAtencion = function(datosAtencion, callback) {
    if (!window.crearAtencionConId) {
        window.showNotification("Sistema de ID no disponible", "error");
        if (typeof callback === "function") callback(false, null);
        return;
    }

    window.crearAtencionConId(datosAtencion, function(atencionId, idPaciente, error) {
        if (error) {
            window.showNotification("Error al registrar atención: " + error.message, "error");
            if (typeof callback === "function") callback(false, null);
            return;
        }

        console.log(`✅ Atención registrada: ${atencionId}, Paciente: ${idPaciente}`);
        window.showNotification("Atención registrada correctamente", "success");
        if (typeof callback === "function") callback(true, atencionId);
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
