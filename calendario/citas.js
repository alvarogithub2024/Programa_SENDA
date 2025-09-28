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
    // --- AGENDAR CITA (desde solicitud ingreso o reingreso) ---
    var formAgendarCita = document.getElementById('form-agendar-cita');
    if (formAgendarCita) {
        formAgendarCita.onsubmit = function(e) {
            e.preventDefault();
            const datos = {
                pacienteNombre: document.getElementById('modal-cita-nombre')?.textContent.trim(),
                pacienteApellidos: document.getElementById('modal-cita-apellidos')?.textContent.trim() || "",
                pacienteRut: document.getElementById('modal-cita-rut')?.textContent.trim(),
                cesfam: document.getElementById('modal-cita-cesfam')?.textContent.trim() || "",
                edad: document.getElementById('modal-cita-edad')?.textContent.trim() || "",
                telefono: document.getElementById('modal-cita-telefono')?.textContent.trim() || "",
                email: document.getElementById('modal-cita-email')?.textContent.trim() || "",
                direccion: document.getElementById('modal-cita-direccion')?.textContent.trim() || "",
                // ...otros campos de paciente si tienes...
                estado: "agendada",
                fecha: document.getElementById('modal-cita-fecha')?.value,
                hora: document.getElementById('modal-cita-hora')?.value,
                profesionalId: document.getElementById('modal-cita-profesional')?.value,
                profesionalNombre: document.getElementById('modal-cita-profesional-nombre')?.value,
                tipo: "profesional",
                tipoProfesional: document.getElementById('modal-cita-profession')?.value,
                solicitudId: document.getElementById('modal-cita-id')?.value // referencia a la solicitud original
            };

            if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
                window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                return;
            }

            upsertPacienteYAgendarCita(datos, function(idCita, error) {
                if (!error) closeModal('modal-cita');
            });
        };
    }
});
