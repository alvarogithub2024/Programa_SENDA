
function buscarPacientesPorTexto(texto, callback) {
    var db = window.getFirestore();
    var pacientesRef = db.collection("pacientes");
    var resultados = [];
    texto = (texto || "").trim().toUpperCase();

    if (!texto) {
      
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

    
    var rutLimpio = texto.replace(/[.\-]/g, "");
    if (/^\d{7,8}[0-9K]$/i.test(rutLimpio)) {
        pacientesRef.where("rut", "==", rutLimpio).get()
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
        .startAt(texto)
        .endAt(texto + "\uf8ff")
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


window.buscarPacientesPorTexto = buscarPacientesPorTexto;
