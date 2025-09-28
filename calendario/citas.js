// ========== FLUJO UNIFICADO para NUEVA CITA y AGENDAR CITA ==========

// 1. Central: Buscar/crear paciente y agendar cita con pacienteId
function upsertPacienteYAgendarCita(datosCita, callback) {
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    const datos = Object.assign({}, datosCita);
    datos.fechaCreacion = datos.fechaCreacion || new Date().toISOString();
    const rutLimpio = datos.pacienteRut ? datos.pacienteRut.replace(/[.\-]/g, "").toUpperCase() : datos.rut ? datos.rut.replace(/[.\-]/g, "").toUpperCase() : "";

    if (!rutLimpio) {
        window.showNotification && window.showNotification("Error: El paciente no tiene RUT, no se puede crear en la colección pacientes.", "error");
        if (typeof callback === "function") callback(null, "RUT vacío");
        return;
    }

    db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
        .then(function(snapshot) {
            let pacienteId;
            const pacienteData = {
                apellidos: datos.pacienteApellidos || datos.apellidos || "",
                cesfam: datos.cesfam || "",
                descripcion: datos.descripcion || "",
                direccion: datos.direccion || "",
                edad: datos.edad || "",
                email: datos.email || "",
                estado: datos.estado || "agendada",
                fecha: datos.fechaCreacion,
                motivacion: datos.motivacion || "",
                nombre: datos.pacienteNombre || datos.nombre || "",
                paraMi: datos.paraMi || "",
                rut: rutLimpio,
                sustancias: datos.sustancias || [],
                telefono: datos.telefono || "",
                tiempoConsumo: datos.tiempoConsumo || "",
                tipo: datos.tipo || "",
                tratamientoPrevio: datos.tratamientoPrevio || "",
                urgencia: datos.urgencia || "",
                profesionalDescripcion: datos.profesionalDescripcion || "",
            };
            if (!snapshot.empty) {
                pacienteId = snapshot.docs[0].id;
                pacienteData.id = pacienteId;
                db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true })
                    .then(() => {
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    }).catch(function(error) {
                        window.showNotification && window.showNotification("Error actualizando paciente: "+error.message, "error");
                    });
            } else {
                db.collection("pacientes").add(pacienteData)
                    .then(function(docRef) {
                        pacienteId = docRef.id;
                        pacienteData.id = pacienteId;
                        db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true });
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    })
                    .catch(function(error) {
                        window.showNotification && window.showNotification("Error creando paciente: "+error.message, "error");
                    });
            }
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error buscando paciente: "+error.message, "error");
        });
}

// 2. Guardar la cita (siempre debe tener pacienteId)
function crearCitaConPacienteId(db, datos, callback) {
    if (!datos.pacienteId) {
        window.showNotification && window.showNotification("Error: No se pudo vincular la cita a un paciente válido.", "error");
        if (typeof callback === "function") callback(null, "pacienteId vacío");
        return;
    }
    db.collection("citas").add(datos)
        .then(function(docRef) {
            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
            if (typeof callback === "function") callback(docRef.id);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
            if (typeof callback === "function") callback(null, error);
        });
}
document.addEventListener("DOMContentLoaded", function() {
    // --- NUEVA CITA ---
    var formNuevaCita = document.getElementById('form-nueva-cita-paciente');
    if (formNuevaCita) {
        formNuevaCita.onsubmit = function(e) {
            e.preventDefault();
            const datos = {
                pacienteNombre: document.getElementById('pac-cita-paciente-nombre')?.value.trim(),
                pacienteApellidos: document.getElementById('pac-cita-paciente-apellidos')?.value.trim() || "",
                pacienteRut: document.getElementById('pac-cita-paciente-rut')?.value.trim(),
                cesfam: document.getElementById('pac-cita-cesfam')?.value,
                edad: document.getElementById('pac-cita-edad')?.value || "",
                telefono: document.getElementById('pac-cita-telefono')?.value || "",
                email: document.getElementById('pac-cita-email')?.value || "",
                direccion: document.getElementById('pac-cita-direccion')?.value || "",
                sustancias: Array.from(document.querySelectorAll('[name="pac-cita-sustancias"]:checked')).map(x=>x.value),
                tiempoConsumo: document.getElementById('pac-cita-tiempo-consumo')?.value || "",
                urgencia: document.querySelector('[name="pac-cita-urgencia"]:checked')?.value || "",
                tratamientoPrevio: document.querySelector('[name="pac-cita-tratamiento-previo"]:checked')?.value || "",
                descripcion: document.getElementById('pac-cita-descripcion')?.value || "",
                motivacion: document.getElementById('pac-cita-motivacion')?.value || "",
                paraMi: document.querySelector('[name="pac-cita-para-mi"]:checked')?.value || "",
                estado: "agendada",
                fecha: document.getElementById('pac-cita-fecha')?.value,
                hora: document.getElementById('pac-cita-hora')?.value,
                profesionalId: document.getElementById('pac-cita-profesional')?.value,
                profesionalNombre: document.getElementById('pac-cita-profesional-nombre')?.value,
                tipo: "paciente",
                tipoProfesional: document.getElementById('pac-cita-profession')?.value,
                profesionalDescripcion: document.getElementById('pac-cita-profesional-descripcion')?.value || ""
            };
            if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
                window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                return;
            }
            upsertPacienteYAgendarCita(datos, function(idCita, error) {
                if (!error) closeModal('modal-nueva-cita-paciente');
            });
        };
    }

