// calendario/agenda.js

document.addEventListener("DOMContentLoaded", function() {
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarHeader = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  let citasPorDia = {};

  function chileNow() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Santiago"}));
  }

  function getMonthName(month) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[month];
  }

  // Cargar las citas agrupadas por fecha
  function cargarCitasPorDia(callback) {
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    db.collection("citas").get().then(function(snapshot) {
      citasPorDia = {};
      snapshot.forEach(function(doc) {
        const cita = doc.data();
        const fecha = cita.fecha;
        if (!citasPorDia[fecha]) citasPorDia[fecha] = [];
        citasPorDia[fecha].push(cita);
      });
      if (typeof callback === "function") callback();
    });
  }

  function renderCalendar(month, year) {
    calendarGrid.innerHTML = "";
    calendarHeader.textContent = `${getMonthName(month)} ${year}`;

    // Cabecera de días
    let row = document.createElement('div');
    row.className = 'calendar-row calendar-row-header';
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(dia => {
      let cell = document.createElement('div');
      cell.className = 'calendar-cell calendar-header-cell';
      cell.textContent = dia;
      row.appendChild(cell);
    });
    calendarGrid.appendChild(row);

    // Dibuja cada semana
    let primerDia = new Date(year, month, 1);
    let ultimoDia = new Date(year, month + 1, 0);
    let startDay = (primerDia.getDay() + 6) % 7; // Lunes=0, Domingo=6
    let daysInMonth = ultimoDia.getDate();

    let date = 1;
    for (let i = 0; i < 6; i++) {
      let weekRow = document.createElement('div');
      weekRow.className = 'calendar-row';
      for (let j = 0; j < 7; j++) {
        let cell = document.createElement('div');
        cell.className = 'calendar-cell';
        if (i === 0 && j < startDay) {
          cell.innerHTML = "&nbsp;";
        } else if (date > daysInMonth) {
          cell.innerHTML = "&nbsp;";
        } else {
          // Día del mes
          const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
          // Número de día
          const dayNumDiv = document.createElement('div');
          dayNumDiv.className = 'calendar-day-number';
          dayNumDiv.textContent = date;
          cell.appendChild(dayNumDiv);

          // Citas/eventos de ese día
          const eventos = citasPorDia[dateKey] || [];
          if (eventos.length) {
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'calendar-events';
            eventos.forEach(evt => {
              const evDiv = document.createElement('div');
              evDiv.className = 'calendar-event';
              evDiv.textContent = evt.paciente || evt.pacienteNombre || "Sin nombre";
              eventsDiv.appendChild(evDiv);
            });
            cell.appendChild(eventsDiv);
          }

          cell.dataset.date = dateKey;
          if (date === chileNow().getDate() && month === chileNow().getMonth() && year === chileNow().getFullYear()) {
            cell.classList.add('calendar-today');
          }
          cell.onclick = function() {
            // Abre el modal de nueva cita de PACIENTE si existe la función, sino fallback genérico
            if (window.abrirModalCitaPaciente) {
              // Si tienes IDs únicos para el campo de fecha del modal paciente
              var fechaInput = document.getElementById('pac-cita-fecha');
              if (fechaInput) fechaInput.value = cell.dataset.date;
              window.abrirModalCitaPaciente();
            } else {
              showModal('modal-nueva-cita');
              setTimeout(function() {
                const fechaInput = document.getElementById('cita-fecha');
                if (fechaInput) fechaInput.value = cell.dataset.date;
              }, 100);
            }
          }
          date++;
        }
        weekRow.appendChild(cell);
      }
      calendarGrid.appendChild(weekRow);
      if (date > daysInMonth) break;
    }
  }

  // Navegación de meses
  if (prevMonthBtn) prevMonthBtn.onclick = function() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
  };
  if (nextMonthBtn) nextMonthBtn.onclick = function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
  };

  // Inicial: cargar citas y renderizar
  cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));

  // Botón + Nueva Cita (abre el modal PACIENTE seguro)
  if (nuevaCitaBtn) {
    nuevaCitaBtn.onclick = function() {
      if (window.abrirModalCitaPaciente) {
        window.abrirModalCitaPaciente();
        setTimeout(function() {
          const fechaInput = document.getElementById('pac-cita-fecha');
          if (fechaInput) {
            const chileDate = chileNow();
            fechaInput.value = chileDate.toISOString().slice(0,10);
          }
        }, 100);
      } else {
        // fallback
        showModal('modal-nueva-cita');
        setTimeout(function() {
          const fechaInput = document.getElementById('cita-fecha');
          if (fechaInput) {
            const chileDate = chileNow();
            fechaInput.value = chileDate.toISOString().slice(0,10);
          }
        }, 100);
      }
    };
  }

  // --- Función solo para el modal legacy de "modal-nueva-cita" ---
  function cargarProfesionales() {
    const select = document.getElementById('cita-profesional');
    const nombreProf = document.getElementById('cita-profesional-nombre');
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona profesional...</option>';
    // Busca todos los profesionales activos en Firebase
    firebase.firestore().collection('profesionales').where('activo', '==', true).get().then(snapshot=>{
      snapshot.forEach(doc=>{
        let p = doc.data();
        let opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = `${p.nombre} ${p.apellidos}`;
        opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
        select.appendChild(opt);
      });
    });
    if (select) {
      select.onchange = function() {
        let selected = select.options[select.selectedIndex];
        if (nombreProf) nombreProf.value = selected.dataset.nombre || '';
      };
    }
  }
  // Sólo inicializar si existe el select legacy
  if (document.getElementById('cita-profesional')) {
    cargarProfesionales();
  }

  // --- SUBMIT para el modal legacy de "modal-nueva-cita" ---
  var formNuevaCita = document.getElementById('form-nueva-cita');
  if (formNuevaCita) {
    formNuevaCita.onsubmit = function(e) {
      e.preventDefault();
      const paciente = document.getElementById('cita-paciente-nombre').value.trim();
      const rut = document.getElementById('cita-paciente-rut').value.trim();
      const profesionalID = document.getElementById('cita-profesional').value;
      const profesionalNombre = document.getElementById('cita-profesional-nombre').value;
      const fecha = document.getElementById('cita-fecha').value;
      const hora = document.getElementById('cita-hora').value;

      if (!paciente || !rut || !profesionalID || !profesionalNombre || !fecha || !hora) {
        window.showNotification && window.showNotification("Completa todos los campos", "warning");
        return;
      }

      // Guardar cita en Firebase
      firebase.firestore().collection('citas').add({
        paciente, rut, profesionalID, profesionalNombre, fecha, hora,
        createdAt: new Date().toISOString()
      }).then(()=>{
        window.showNotification && window.showNotification("Cita agendada correctamente", "success");
        closeModal('modal-nueva-cita');
        // ACTUALIZAR: recargar citas y calendario
        cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
      }).catch(err=>{
        window.showNotification && window.showNotification("Error al agendar: "+err.message, "error");
      });
    };
  }

});
