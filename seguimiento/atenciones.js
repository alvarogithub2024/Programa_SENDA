// ========== seguimiento/atenciones.js - ACTUALIZADO ==========

// ========== NUEVA FUNCIÓN CON SISTEMA UNIFICADO ==========
window.registrarAtencionUnificada = function(datosAtencion, callback) {
    if (!window.SISTEMA_ID_UNIFICADO) {
        window.showNotification && window.showNotification("Sistema no inicializado", "error");
        if (typeof callback === "function") callback(false, null);
        return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        window.showNotification && window.showNotification("Usuario no autenticado", "error");
        if (typeof callback === "function") callback(false, null);
        return;
    }
    
    const datosCompletos = {
        ...datosAtencion,
        profesionalId: user.uid,
        profesional: user.email,
        fechaRegistro: new Date().toISOString()
    };
    
    window.SISTEMA_ID_UNIFICADO.crearAtencionUnificada(datosCompletos)
        .then(function(resultado) {
            window.showNotification && window.showNotification("Atención registrada correctamente", "success");
            if (typeof callback === "function") callback(true, resultado.atencionId, resultado.pacienteId);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error al registrar atención: " + error.message, "error");
            if (typeof callback === "function") callback(false, null);
        });
};

// ========== EVENTO DEL FORMULARIO ACTUALIZADO ==========
document.addEventListener("DOMContentLoaded", function() {
    var form = document.getElementById("form-registrar-atencion");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const citaId = document.getElementById("atencion-cita-id").value;
            const descripcion = document.getElementById("atencion-descripcion").value.trim();
            const tipoAtencion = document.getElementById("atencion-tipo").value;

            if (!descripcion || !tipoAtencion) {
                window.showNotification("Completa los campos obligatorios", "warning");
                return;
            }

            const db = window.getFirestore();
            db.collection("citas").doc(citaId).get().then(function(doc) {
                if (!doc.exists) {
                    window.showNotification("Cita no encontrada", "error");
                    return;
                }
                
                const cita = doc.data();
                const datosAtencion = {
                    pacienteId: cita.pacienteId, // ⭐ AHORA USA EL PACIENTE ID UNIFICADO
                    pacienteNombre: cita.pacienteNombre || cita.nombre || "",
                    pacienteRut: cita.pacienteRut || cita.rut || "",
                    cesfam: cita.cesfam || "",
                    descripcion: descripcion,
                    tipoAtencion: tipoAtencion,
                    citaId: citaId
                };

                window.registrarAtencionUnificada(datosAtencion, function(exito) {
                    if (exito) {
                        closeModal("modal-registrar-atencion");
                        if (window.mostrarPacienteActualHoy) window.mostrarPacienteActualHoy();
                        if (window.mostrarCitasRestantesHoy) window.mostrarCitasRestantesHoy();
                    }
                });
            });
        });
    }
});

// ========== FUNCIÓN LEGACY (mantener para compatibilidad) ==========
window.registrarAtencion = function(datosAtencion, callback) {
    var db = window.getFirestore();
    if (!datosAtencion.pacienteId) {
        window.showNotification("Error: Faltó el pacienteId al guardar la atención.", "error");
        if (typeof callback === "function") callback(false, null);
        return;
    }
    var datos = Object.assign({}, datosAtencion, {
        fechaRegistro: new Date().toISOString()
    });

    db.collection("atenciones")
        .add(datos)
        .then(function(docRef) {
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
