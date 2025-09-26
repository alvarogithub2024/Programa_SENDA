// PACIENTES/FICHAS.JS MODIFICADO

// Requiere: window.getFirestore, window.showNotification, window.buscarPacientesPorTexto

let pacientesDelCesfam = [];
let cesfamProfesionalActual = null;

// Carga todos los pacientes con citas en el CESFAM del profesional logueado
function cargarPacientesDelCesfam(callback) {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.showNotification && window.showNotification("Debes iniciar sesión para ver pacientes.", "warning");
        return;
    }
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();

    // Obtener CESFAM del profesional actual
    db.collection("profesionales").doc(user.uid).get().then(doc => {
        if (!doc.exists) {
            window.showNotification && window.showNotification("No se encontró tu CESFAM.", "warning");
            return;
        }
        cesfamProfesionalActual = doc.data().cesfam;

        // Buscar todas las citas en ese CESFAM
        db.collection("citas").where("cesfam", "==", cesfamProfesionalActual).get()
            .then(snapshot => {
                let pacientesMap = {};
                snapshot.forEach(doc => {
                    const cita = doc.data();
                    // Usar rut como clave única, si existe
                    let rut = cita.pacienteRut || cita.rut || cita.paciente_rut;
                    if (!rut) return;
                    pacientesMap[rut] = {
                        nombre: cita.pacienteNombre || cita.nombre || "",
                        rut: rut,
                        telefono: cita.telefono || "",
                        email: cita.email || "",
                        cesfam: cesfamProfesionalActual,
                        // Puedes agregar más campos si lo deseas
                    };
                });
                pacientesDelCesfam = Object.values(pacientesMap);
                if (typeof callback === "function") callback(pacientesDelCesfam);
                mostrarPacientesEnGrid(pacientesDelCesfam);
            });
    });
}

// Renderiza los pacientes en el grid de la pestaña
function mostrarPacientesEnGrid(pacientes) {
    const grid = document.getElementById("patients-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!pacientes || pacientes.length === 0) {
        grid.innerHTML = "<div class='no-results'>No hay pacientes registrados con citas en tu CESFAM.</div>";
        return;
    }
    pacientes.forEach(p => {
        const div = document.createElement("div");
        div.className = "patient-card";
        div.innerHTML = `
            <div class="patient-card-header">${p.nombre || ""}</div>
            <div class="patient-card-body">
                <div><b>RUT:</b> ${p.rut || ""}</div>
                <div><b>Teléfono:</b> ${p.telefono || ""}</div>
                <div><b>Email:</b> ${p.email || ""}</div>
                <div><b>CESFAM:</b> ${p.cesfam || ""}</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Búsqueda por RUT (usando pacientes/busqueda.js)
function buscarPacientePorRut() {
    const input = document.getElementById('search-pacientes-rut');
    const rut = input ? input.value.trim() : "";
    if (!rut) {
        mostrarPacientesEnGrid(pacientesDelCesfam);
        return;
    }
    window.buscarPacientesPorTexto(rut, function(resultados) {
        // Filtrar solo los del CESFAM actual y que tengan cita
        const filtrados = resultados.filter(p => p.cesfam === cesfamProfesionalActual);
        mostrarPacientesEnGrid(filtrados);
    });
}

// Botón actualizar: recarga todos los pacientes
function actualizarPacientesCesfam() {
    cargarPacientesDelCesfam();
}

// === Inicialización y listeners ===
function initPacienteTabActions() {
    // Listener para botón buscar rut
    const btnBuscar = document.getElementById('buscar-paciente-btn');
    if (btnBuscar) {
        btnBuscar.onclick = buscarPacientePorRut;
    }
    // Listener para botón actualizar (debes agregarlo al HTML)
    let btnActualizar = document.getElementById('actualizar-pacientes-btn');
    if (!btnActualizar) {
        btnActualizar = document.createElement('button');
        btnActualizar.id = 'actualizar-pacientes-btn';
        btnActualizar.className = 'btn btn-secondary btn-sm';
        btnActualizar.innerHTML = '<i class="fas fa-sync"></i> Actualizar';
        const actions = document.querySelector('#pacientes-tab .section-actions');
        if (actions) actions.appendChild(btnActualizar);
    }
    btnActualizar.onclick = actualizarPacientesCesfam;
}

// Exponer globalmente
window.cargarPacientesDelCesfam = cargarPacientesDelCesfam;
window.mostrarPacientesEnGrid = mostrarPacientesEnGrid;
window.buscarPacientePorRut = buscarPacientePorRut;
window.actualizarPacientesCesfam = actualizarPacientesCesfam;

// Inicializar cuando se muestra la pestaña de pacientes
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById('patients-grid')) {
        cargarPacientesDelCesfam();
        initPacienteTabActions();
    }
});
