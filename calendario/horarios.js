// CALENDARIO/HORARIOS.JS

// Requiere: window.getFirestore, window.showNotification, window.HORARIOS_CONFIG

// Carga los horarios disponibles para un día y profesional
function cargarHorariosDisponibles(fecha, profesionalId, callback) {
    var db = window.getFirestore();
    var horarios = [];
    var dia = new Date(fecha).getDay(); // 0 = Domingo ... 6 = Sábado

    // Determinar configuración por día
    var cfg = window.HORARIOS_CONFIG && (
        window.HORARIOS_CONFIG.semana.diasSemana.includes(dia)
            ? window.HORARIOS_CONFIG.semana
            : window.HORARIOS_CONFIG.finSemana
    );

    // Generar slots de horario
    var hora = cfg.horaInicio, minuto = 0;
    while (
        hora < cfg.horaFin ||
        (hora === cfg.horaFin && minuto <= cfg.minutoFin)
    ) {
        var slot = (hora < 10 ? "0" : "") + hora + ":" + (minuto < 10 ? "0" : "") + minuto;
        horarios.push(slot);
        minuto += cfg.intervaloMinutos;
        if (minuto >= 60) {
            minuto = 0;
            hora++;
        }
    }

    // Quitar horarios ya reservados para ese profesional y fecha
    db.collection("citas")
        .where("fecha", "==", fecha)
        .where("profesionalId", "==", profesionalId)
        .get()
        .then(function(snapshot) {
            var ocupados = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                if (data.hora) ocupados.push(data.hora);
            });
            var disponibles = horarios.filter(function(h) {
                return ocupados.indexOf(h) === -1;
            });
            if (typeof callback === "function") callback(disponibles);
        })
        .catch(function(error) {
            window.showNotification("Error cargando horarios: " + error.message, "error");
            if (typeof callback === "function") callback([]);
        });
}

// Muestra horarios disponibles en la UI (ejemplo)
function mostrarHorariosDisponibles(horarios, selectId) {
    var select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = "";
    if (horarios.length === 0) {
        var opt = document.createElement("option");
        opt.textContent = "No hay horarios disponibles";
        select.appendChild(opt);
        return;
    }
    horarios.forEach(function(horario) {
        var opt = document.createElement("option");
        opt.value = horario;
        opt.textContent = horario;
        select.appendChild(opt);
    });
}

// Exportar globalmente
window.cargarHorariosDisponibles = cargarHorariosDisponibles;
window.mostrarHorariosDisponibles = mostrarHorariosDisponibles;
