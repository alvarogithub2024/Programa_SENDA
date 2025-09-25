// CALENDARIO/AGENDA.JS

// Requiere: window.getFirestore, window.showNotification, window.formatFecha

// Carga las citas del día desde Firestore y las muestra en la agenda
function cargarAgenda(fecha, callback) {
    var db = window.getFirestore();
    var citas = [];
    db.collection("citas")
        .where("fecha", "==", fecha)
        .orderBy("hora")
        .get()
        .then(function(snapshot) {
            snapshot.forEach(function(doc) {
                var data = doc.data();
                citas.push({
                    id: doc.id,
                    ...data
                });
            });
            mostrarAgenda(citas);
            if (typeof callback === "function") callback(citas);
        })
        .catch(function(error) {
            window.showNotification("Error cargando agenda: " + error.message, "error");
        });
}

// Muestra las citas en la tabla de la agenda
function mostrarAgenda(citas) {
    var tabla = document.getElementById("tabla-agenda");
    if (!tabla) return;
    tabla.innerHTML = ""; // Limpiar tabla

    if (citas.length === 0) {
        var filaVacia = document.createElement("tr");
        var celda = document.createElement("td");
        celda.colSpan = 5;
        celda.textContent = "No hay citas para esta fecha";
        filaVacia.appendChild(celda);
        tabla.appendChild(filaVacia);
        return;
    }

    citas.forEach(function(cita) {
        var fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${cita.hora || ""}</td>
            <td>${cita.paciente || ""}</td>
            <td>${cita.profesional || ""}</td>
            <td>${window.formatFecha ? window.formatFecha(cita.fecha) : cita.fecha}</td>
            <td>
                <button class="btn-ver-cita" data-id="${cita.id}">Ver</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    // Asignar eventos a botones "Ver"
    var btns = tabla.querySelectorAll(".btn-ver-cita");
    btns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var id = btn.getAttribute("data-id");
            if (window.verDetalleCita) {
                window.verDetalleCita(id);
            }
        });
    });
}

// Inicializa la agenda para la fecha actual
function initCalendar() {
    var fechaInput = document.getElementById("agenda-fecha");
    var hoy = new Date().toISOString().slice(0, 10);
    if (fechaInput) {
        fechaInput.value = hoy;
        fechaInput.addEventListener("change", function() {
            cargarAgenda(fechaInput.value);
        });
    }
    cargarAgenda(hoy);
}

// Exportar globalmente
window.cargarAgenda = cargarAgenda;
window.mostrarAgenda = mostrarAgenda;
window.initCalendar = initCalendar;
