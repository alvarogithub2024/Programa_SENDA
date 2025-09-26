// SEGUIMIENTO/CITAS-PROXIMAS.JS

// Requiere: window.getFirestore, window.showNotification, window.registrarAtencion, window.obtenerAtencionPorId

// Carga las citas próximas de un paciente (por ID) ordenadas por fecha futura
function cargarCitasProximas(pacienteId, callback) {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);

    db.collection("citas")
        .where("pacienteId", "==", pacienteId)
        .where("fecha", ">=", hoy)
        .orderBy("fecha", "asc")
        .get()
        .then(function(snapshot) {
            var citas = [];
            snapshot.forEach(function(doc) {
                citas.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(citas);
        })
        .catch(function(error) {
            window.showNotification("Error cargando citas próximas: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// NUEVO: Carga todas las citas próximas del día
function cargarCitasDelDia(callback) {
    var db = window.getFirestore();
    var hoy = new Date().toISOString().slice(0, 10);

    db.collection("citas")
        .where("fecha", "==", hoy)
        .orderBy("hora", "asc")
        .get()
        .then(function(snapshot) {
            var citas = [];
            snapshot.forEach(function(doc) {
                citas.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(citas);
        })
        .catch(function(error) {
            window.showNotification("Error cargando citas del día: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// Renderiza la lista de próximas citas y atenciones del día
function mostrarCitasProximas(citas, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = "";
    if (!citas.length) {
        cont.innerHTML = "<p>No hay citas próximas.</p>";
        return;
    }
    var ul = document.createElement("ul");
    citas.forEach(function(c) {
        var li = document.createElement("li");
        li.innerHTML = `
            <strong>${window.formatFecha ? window.formatFecha(c.fecha) : c.fecha}</strong>
            &mdash; ${c.hora || ""} (${c.pacienteNombre || c.paciente || "Paciente"}) 
            <button class="btn btn-sm btn-outline" onclick="abrirModalAtencionPaciente('${c.pacienteId}', '${c.pacienteNombre || c.paciente || ""}', '${c.id}')">Registrar atención</button>
            <div id="atenciones-paciente-${c.pacienteId}-${c.fecha}" class="atenciones-list"></div>
        `;
        ul.appendChild(li);

        // Cargar y mostrar atenciones del día para ese paciente
        cargarAtencionesDelDia(c.pacienteId, c.fecha, function(atenciones) {
            var atencionesDiv = document.getElementById(`atenciones-paciente-${c.pacienteId}-${c.fecha}`);
            if (atencionesDiv) {
                if (!atenciones.length) {
                    atencionesDiv.innerHTML = "<div class='no-results'>Sin atenciones registradas hoy</div>";
                } else {
                    atencionesDiv.innerHTML = atenciones.map(a=>`
                        <div class="atencion-item">
                            <b>${window.formatFecha ? window.formatFecha(a.fechaRegistro) : a.fechaRegistro}</b> - <b>${a.profesional}</b>
                            <p>${a.descripcion || a.texto || ""}</p>
                        </div>
                    `).join("");
                }
            }
        });
    });
    cont.appendChild(ul);
}

// NUEVO: Cargar atenciones del paciente en el día
function cargarAtencionesDelDia(pacienteId, fecha, callback) {
    var db = window.getFirestore();
    db.collection("atenciones")
        .where("pacienteId", "==", pacienteId)
        .where("fecha", "==", fecha)
        .orderBy("fechaRegistro", "desc")
        .get()
        .then(function(snapshot) {
            var atenciones = [];
            snapshot.forEach(function(doc) {
                atenciones.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(atenciones);
        })
        .catch(function(error) {
            if (typeof callback === "function") callback([]);
        });
}

// Modal para registrar atención de paciente
window.abrirModalAtencionPaciente = function(pacienteId, pacienteNombre, citaId) {
    // Crear modal si no existe
    var modalId = "modal-atencion-paciente";
    var modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement("div");
        modal.id = modalId;
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('${modalId}')">&times;</span>
                <h2>Registrar atención de paciente</h2>
                <div id="atencion-paciente-info"></div>
                <form id="form-atencion-paciente">
                    <div class="form-group">
                        <label>Observación / Atención:</label>
                        <textarea id="atencion-descripcion" class="form-textarea" required rows="4"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Guardar atención</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Mostrar info del paciente (puedes cargar más datos si lo deseas)
    var infoDiv = modal.querySelector("#atencion-paciente-info");
    infoDiv.innerHTML = `
        <b>Paciente:</b> ${pacienteNombre}<br>
        <b>ID:</b> ${pacienteId}
    `;

    // Guardar atención al enviar
    var form = modal.querySelector("#form-atencion-paciente");
    form.onsubmit = function(e) {
        e.preventDefault();
        var descripcion = modal.querySelector("#atencion-descripcion").value.trim();
        if (!descripcion) {
            window.showNotification && window.showNotification("Escribe la atención/observación", "warning");
            return;
        }
        // Obtener profesional actual
        var user = firebase.auth().currentUser;
        var profesional = window.getCurrentUser && window.getCurrentUser();
        var profesionalNombre = profesional?.displayName || profesional?.nombre || (user ? user.email : "Desconocido");
        var fecha = new Date().toISOString().slice(0, 10);
        var atencion = {
            pacienteId: pacienteId,
            citaId: citaId,
            descripcion: descripcion,
            profesional: profesionalNombre,
            fecha: fecha,
            fechaRegistro: new Date().toISOString()
        };
        window.registrarAtencion(atencion, function(ok, docId) {
            if (ok) {
                window.showNotification && window.showNotification("Atención guardada", "success");
                closeModal(modalId);
                // Opcional: recargar citas y atenciones
            }
        });
    };

    modal.style.display = "flex";
};

// Exportar globalmente
window.cargarCitasProximas = cargarCitasProximas;
window.mostrarCitasProximas = mostrarCitasProximas;
window.cargarCitasDelDia = cargarCitasDelDia;
window.cargarAtencionesDelDia = cargarAtencionesDelDia;
