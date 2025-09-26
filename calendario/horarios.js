// CALENDARIO/HORARIOS2.JS

// CONFIGURACIÓN DE HORARIOS DE ATENCIÓN
window.HORARIOS_CONFIG = {
    semana: {
        diasSemana: [1, 2, 3, 4, 5], // Lunes (1) a Viernes (5)
        horaInicio: 8,         // 08:00
        minutoInicio: 0,
        horaFin: 16,           // 16:30
        minutoFin: 30,
        intervaloMinutos: 30
    },
    sabado: {
        diasSemana: [6],       // Sábado (6)
        horaInicio: 9,         // 09:00
        minutoInicio: 0,
        horaFin: 12,           // 12:30
        minutoFin: 30,
        intervaloMinutos: 30
    },
    domingo: {
        diasSemana: [0],       // Domingo (0)
        horaInicio: 9,         // 09:00
        minutoInicio: 0,
        horaFin: 12,           // 12:30
        minutoFin: 30,
        intervaloMinutos: 30
    }
};

// Requiere: window.getFirestore, window.showNotification, window.HORARIOS_CONFIG

// Carga los horarios disponibles para un día y profesional
function cargarHorariosDisponibles(fecha, profesionalId, callback) {
    var db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    var horarios = [];
    var dia = new Date(fecha).getDay(); // 0 = domingo, 6 = sábado
    let cfg = null;

    // Determina la config según el día
    if (window.HORARIOS_CONFIG.semana.diasSemana.includes(dia)) {
        cfg = window.HORARIOS_CONFIG.semana;
    } else if (window.HORARIOS_CONFIG.sabado.diasSemana.includes(dia)) {
        cfg = window.HORARIOS_CONFIG.sabado;
    } else if (window.HORARIOS_CONFIG.domingo.diasSemana.includes(dia)) {
        cfg = window.HORARIOS_CONFIG.domingo;
    }

    if (!cfg) {
        if (typeof callback === "function") callback([]);
        return;
    }

    var hora = cfg.horaInicio, minuto = cfg.minutoInicio;
    while (hora < cfg.horaFin || (hora === cfg.horaFin && minuto <= cfg.minutoFin)) {
        var slot = (hora < 10 ? "0" : "") + hora + ":" + (minuto < 10 ? "0" : "") + minuto;
        horarios.push(slot);
        minuto += cfg.intervaloMinutos;
        if (minuto >= 60) { minuto = 0; hora++; }
    }

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
            var disponibles = horarios.filter(h => !ocupados.includes(h));
            if (typeof callback === "function") callback(disponibles);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error cargando horarios: " + error.message, "error");
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

// Solo debes llamar a estos listeners cuando el modal y sus campos existen en el DOM
function inicializarListenersNuevaCitaPaciente() {
    var fechaInput = document.getElementById('pac-cita-fecha');
    var profSelect = document.getElementById('pac-cita-profesional');
    if (fechaInput && profSelect) {
        fechaInput.addEventListener('change', actualizarHorasPaciente);
        profSelect.addEventListener('change', actualizarHorasPaciente);
    }
}

// Llama a esta función AL ABRIR el modal de cita paciente
function actualizarHorasPaciente() {
    const fecha = document.getElementById('pac-cita-fecha')?.value;
    const profesionalId = document.getElementById('pac-cita-profesional')?.value;
    const selectHora = document.getElementById('pac-cita-hora');
    if (!selectHora) return;
    selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
    if (!fecha || !profesionalId) return;
    cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
        if (!horariosDisponibles.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Sin horarios disponibles';
            selectHora.appendChild(opt);
        } else {
            horariosDisponibles.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                selectHora.appendChild(opt);
            });
        }
    });
}

// Exportar globalmente
window.cargarHorariosDisponibles = cargarHorariosDisponibles;
window.mostrarHorariosDisponibles = mostrarHorariosDisponibles;
window.inicializarListenersNuevaCitaPaciente = inicializarListenersNuevaCitaPaciente;
window.actualizarHorasPaciente = actualizarHorasPaciente;
