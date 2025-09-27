
window.HORARIOS_CONFIG = {
    semana: {
        diasSemana: [1, 2, 3, 4, 5], 
        horaInicio: 8,         
        minutoInicio: 0,
        horaFin: 16,           
        minutoFin: 30,
        intervaloMinutos: 30
    },
    sabado: {
        diasSemana: [6],     
        horaInicio: 9,         
        minutoInicio: 0,
        horaFin: 12,           
        minutoFin: 30,
        intervaloMinutos: 30
    },
    domingo: {
        diasSemana: [0],       
        horaInicio: 9,         
        minutoInicio: 0,
        horaFin: 12,          
        minutoFin: 30,
        intervaloMinutos: 30
    }
};

function cargarHorariosDisponibles(fecha, profesionalId, callback) {
    var db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    var horarios = [];
    var dia = new Date(fecha).getDay(); 
    let cfg = null;

   
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


function inicializarListenersNuevaCitaPaciente() {
    var fechaInput = document.getElementById('pac-cita-fecha');
    var profSelect = document.getElementById('pac-cita-profesional');
    if (fechaInput && profSelect) {
        fechaInput.addEventListener('change', actualizarHorasPaciente);
        profSelect.addEventListener('change', actualizarHorasPaciente);
    }
}


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


window.cargarHorariosDisponibles = cargarHorariosDisponibles;
window.mostrarHorariosDisponibles = mostrarHorariosDisponibles;
window.inicializarListenersNuevaCitaPaciente = inicializarListenersNuevaCitaPaciente;
window.actualizarHorasPaciente = actualizarHorasPaciente;
