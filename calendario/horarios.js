// CALENDARIO/HORARIOS.JS

// CONFIGURACIÓN DE HORARIOS DE ATENCIÓN
window.HORARIOS_CONFIG = {
    semana: {
        diasSemana: [1, 2, 3, 4, 5, 6], // Lunes (1) a Sábado (6)
        horaInicio: 8,         // 08:00
        minutoInicio: 0,
        horaFin: 16,           // 16:30
        minutoFin: 30,
        intervaloMinutos: 30
    },
    finSemana: {
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

    // Determina la config
    var cfg = (dia >= 1 && dia <= 5)
        ? { horaInicio: 8, minutoInicio: 0, horaFin: 16, minutoFin: 30, intervaloMinutos: 30 }
        : { horaInicio: 9, minutoInicio: 0, horaFin: 12, minutoFin: 30, intervaloMinutos: 30 };

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
function cargarProfesionalesParaCita() {
    const selectProf = document.getElementById('cita-profesional');
    selectProf.innerHTML = '<option value="">Selecciona profesional...</option>';
    firebase.firestore().collection('profesionales').where('activo', '==', true).get().then(snapshot=>{
        snapshot.forEach(doc=>{
            let p = doc.data();
            let opt = document.createElement('option');
            opt.value = doc.id; // ¡IMPORTANTE! Este valor es el UID
            opt.textContent = `${p.nombre} ${p.apellidos}`;
            selectProf.appendChild(opt);
        });
    });
}

function actualizarSelectHoras() {
  const fecha = document.getElementById('cita-fecha').value;
  const profesionalId = document.getElementById('cita-profesional').value;
  const selectHora = document.getElementById('cita-hora');
  selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
  if (!fecha || !profesionalId) return;
  // Llama a tu función existente que calcula horarios y descarta ocupados
  cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
    horariosDisponibles.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      selectHora.appendChild(opt);
    });
    if (horariosDisponibles.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin horarios disponibles';
      selectHora.appendChild(opt);
    }
  });
}
// Exportar globalmente
window.cargarHorariosDisponibles = cargarHorariosDisponibles;
window.mostrarHorariosDisponibles = mostrarHorariosDisponibles;
