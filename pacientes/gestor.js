
function guardarPaciente(datosPaciente, callback) {
    var db = window.getFirestore();
    var pacientesRef = db.collection("pacientes");
    var rut = datosPaciente.rut.replace(/[.\-]/g, "").toUpperCase();


    pacientesRef.where("rut", "==", rut).limit(1).get()
        .then(function(snapshot) {
            if (!snapshot.empty) {
           
                var docId = snapshot.docs[0].id;
                return pacientesRef.doc(docId).update(
                    Object.assign({}, datosPaciente, {
                        fechaActualizacion: window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString()
                    })
                ).then(function() {
                    window.showNotification("Paciente actualizado correctamente", "success");
                    if (typeof callback === "function") callback("actualizado");
                });
            } else {
              
                return pacientesRef.add(
                    Object.assign({}, datosPaciente, {
                        rut: rut,
                        fechaRegistro: window.getServerTimestamp ? window.getServerTimestamp() : new Date().toISOString()
                    })
                ).then(function() {
                    window.showNotification("Paciente guardado correctamente", "success");
                    if (typeof callback === "function") callback("nuevo");
                });
            }
        })
        .catch(function(error) {
            window.showNotification("Error al guardar paciente: " + error.message, "error");
            if (typeof callback === "function") callback(null);
        });
}


function buscarPacientes(filtro, callback) {
    var db = window.getFirestore();
    var pacientesRef = db.collection("pacientes");
    var resultados = [];
    filtro = (filtro || "").trim().toUpperCase();

    if (!filtro) {
        
        pacientesRef.orderBy("nombre").limit(20).get()
            .then(function(snapshot) {
                snapshot.forEach(function(doc) {
                    resultados.push(Object.assign({ id: doc.id }, doc.data()));
                });
                if (typeof callback === "function") callback(resultados);
            })
            .catch(function(error) {
                window.showNotification("Error buscando pacientes: " + error.message, "error");
                if (typeof callback === "function") callback([]);
            });
        return;
    }

 
    if (/^\d{7,8}[0-9K]$/i.test(filtro)) {
        pacientesRef.where("rut", "==", filtro).get()
            .then(function(snapshot) {
                snapshot.forEach(function(doc) {
                    resultados.push(Object.assign({ id: doc.id }, doc.data()));
                });
                if (typeof callback === "function") callback(resultados);
            })
            .catch(function(error) {
                window.showNotification("Error buscando pacientes: " + error.message, "error");
                if (typeof callback === "function") callback([]);
            });
        return;
    }


    pacientesRef
        .orderBy("nombre")
        .startAt(filtro)
        .endAt(filtro + "\uf8ff")
        .limit(20)
        .get()
        .then(function(snapshot) {
            snapshot.forEach(function(doc) {
                resultados.push(Object.assign({ id: doc.id }, doc.data()));
            });
            if (typeof callback === "function") callback(resultados);
        })
        .catch(function(error) {
            window.showNotification("Error buscando pacientes: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}


function obtenerPacientePorId(pacienteId, callback) {
    var db = window.getFirestore();
    db.collection("pacientes").doc(pacienteId).get()
        .then(function(doc) {
            if (!doc.exists) {
                window.showNotification("Paciente no encontrado", "warning");
                if (typeof callback === "function") callback(null);
                return;
            }
            var data = doc.data();
            data.id = doc.id;
            if (typeof callback === "function") callback(data);
        })
        .catch(function(error) {
            window.showNotification("Error obteniendo paciente: " + error.message, "error");
            if (typeof callback === "function") callback(null);
        });
}


window.guardarPaciente = guardarPaciente;
window.buscarPacientes = buscarPacientes;
window.obtenerPacientePorId = obtenerPacientePorId;

