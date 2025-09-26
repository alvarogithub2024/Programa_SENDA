// PACIENTES/LISTA-PACIENTES.JS

// Requiere: window.getFirestore, window.showNotification, window.buscarPacientesPorTexto, window.obtenerFichaPaciente, window.actualizarFichaPaciente

// Sincroniza pacientes desde "citas" y los guarda en "pacientes" si no existen
async function sincronizarPacientesDesdeCitas(cesfam) {
    const db = window.getFirestore();
    // 1. Obtener todas las citas del cesfam actual
    const citasSnap = await db.collection("citas").where("cesfam", "==", cesfam).get();
    const pacientesMap = {}; // Rut como key

    citasSnap.forEach(doc => {
        const cita = doc.data();
        if (cita.pacienteRut && cita.pacienteNombre) {
            pacientesMap[cita.pacienteRut] = {
                rut: cita.pacienteRut,
                nombre: cita.pacienteNombre,
                cesfam: cesfam,
                // Puedes agregar más campos si los tienes en la cita
            };
        }
    });

    // 2. Obtener todos los pacientes actuales de la coleccion "pacientes"
    const pacientesSnap = await db.collection("pacientes").where("cesfam", "==", cesfam).get();
    const existentes = {};
    pacientesSnap.forEach(doc => {
        existentes[doc.data().rut] = true;
    });

    // 3. Guardar solo los que no existen
    const promesas = [];
    for (const rut in pacientesMap) {
        if (!existentes[rut]) {
            promesas.push(db.collection("pacientes").add(pacientesMap[rut]));
        }
    }
    await Promise.all(promesas);
    return Object.values(pacientesMap);
}

// Renderiza la lista de pacientes en el grid
function renderizarPacientes(pacientes) {
    const grid = document.getElementById("patients-grid");
    if (!grid) return;
    if (!pacientes.length) {
        grid.innerHTML = "<div class='no-results'>No hay pacientes registrados en este CESFAM.</div>";
        return;
    }
    grid.innerHTML = pacientes.map(p =>
        `<div class='patient-card'>
            <div><strong>${p.nombre || ""}</strong></div>
            <div>RUT: ${p.rut || ""}</div>
            <div>CESFAM: ${p.cesfam || ""}</div>
        </div>`
    ).join("");
}

// Carga y muestra todos los pacientes del CESFAM del usuario logueado
async function cargarPacientesDeCesfam() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const db = window.getFirestore();
    const profSnap = await db.collection("profesionales").doc(user.uid).get();
    if (!profSnap.exists) return;
    const cesfam = profSnap.data().cesfam;
    await sincronizarPacientesDesdeCitas(cesfam);
    // Ahora obtener todos los pacientes de ese CESFAM y mostrarlos
    db.collection("pacientes").where("cesfam", "==", cesfam).get().then(snap => {
        const pacientes = [];
        snap.forEach(doc => pacientes.push(doc.data()));
        renderizarPacientes(pacientes);
    });
}

// Filtra pacientes por RUT usando búsqueda parcial
function buscarPacientePorRut() {
    const input = document.getElementById("search-pacientes-rut");
    if (!input) return;
    const rut = input.value.trim();
    if (!rut) return cargarPacientesDeCesfam();
    window.buscarPacientesPorTexto(rut, function(resultados) {
        renderizarPacientes(resultados);
    });
}

// Evento para botón "Actualizar"
document.addEventListener("DOMContentLoaded", function() {
    const btnActualizar = document.getElementById("actualizar-pacientes-btn");
    if (btnActualizar) {
        btnActualizar.onclick = cargarPacientesDeCesfam;
    }
    const btnBuscar = document.getElementById("buscar-paciente-btn");
    if (btnBuscar) {
        btnBuscar.onclick = buscarPacientePorRut;
    }
    // Carga inicial
    cargarPacientesDeCesfam();
});

// Exportar globalmente
window.cargarPacientesDeCesfam = cargarPacientesDeCesfam;
window.buscarPacientePorRut = buscarPacientePorRut;
