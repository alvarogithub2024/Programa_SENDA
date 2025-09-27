/**
 * Sincroniza la información del paciente en la colección "pacientes".
 * Llama a esta función cada vez que guardes/edites solicitudes, reingresos, citas o atenciones.
 */
function sincronizarPaciente(datosPaciente) {
    const db = window.getFirestore ? window.getFirestore() : null;
    if (!db) return;

    // Normaliza el RUT
    const rutLimpio = (datosPaciente.rut || '').replace(/[.\-]/g, '').trim();

    // Construye el objeto del paciente
    const pacienteData = {
        nombre: datosPaciente.nombre || "",
        apellidos: datosPaciente.apellidos || "",
        rut: rutLimpio,
        telefono: datosPaciente.telefono || "",
        email: datosPaciente.email || "",
        cesfam: datosPaciente.cesfam || "",
        direccion: datosPaciente.direccion || "",
        fechaRegistro: datosPaciente.fechaRegistro || datosPaciente.fecha || new Date().toISOString(),
        edad: datosPaciente.edad || "",
        // Puedes agregar más campos si lo necesitas
    };

    // Busca el paciente por RUT y actualiza/crea el documento
    db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                db.collection("pacientes").doc(snapshot.docs[0].id).set(pacienteData, { merge: true });
            } else {
                db.collection("pacientes").add(pacienteData);
            }
        });
}

window.sincronizarPaciente = sincronizarPaciente;
