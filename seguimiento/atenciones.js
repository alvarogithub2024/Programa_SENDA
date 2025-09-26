window.registrarAtencion = function(datosAtencion, callback) {
    var db = window.getFirestore();
    var datos = Object.assign({}, datosAtencion, {
        fechaRegistro: new Date().toISOString()
    });

    // 1. Guardar atención en "atenciones"
    db.collection("atenciones")
        .add(datos)
        .then(function(docRef) {
            // 2. Vincular/actualizar paciente en "pacientes"
            if (datos.pacienteId || datos.pacienteRut) {
                // Buscar paciente por pacienteId, si existe, actualizar. Si no existe, crear.
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
                        // Puedes agregar otros campos relevantes aquí
                    };

                    if (snap && snap.exists) {
                        // Actualiza el paciente
                        pacientesRef.doc(snap.id || datos.pacienteId).set(pacienteData, { merge: true });
                    } else if (snap && snap.docs && snap.docs.length) {
                        // Actualiza por RUT
                        pacientesRef.doc(snap.docs[0].id).set(pacienteData, { merge: true });
                    } else {
                        // Crea nuevo paciente
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
