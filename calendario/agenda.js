// calendario/agenda.js

document.addEventListener("DOMContentLoaded", function() {
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarHeader = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
  const appointmentsList = document.getElementById('appointments-list');

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

  // Cargar las citas agrupadas por fecha (para el calendario visual)
  function cargarCitasPorDia(callback) {
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    db.collection("citas").get().then(function(snapshot) {
      citasPorDia = {};
      snapshot.forEach(function(doc) {
        const cita = doc.data();
        const fecha = cita.fecha;
        if (!citasPorDia[fecha]) citasPorDia[fecha] = [];
        citasPorDia[fecha].push(Object.assign({id: doc.id}, cita));
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

          // Citas/eventos de ese día (para mostrar badges en el calendario)
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
            mostrarCitasDelDia(dateKey);
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
    const fechaKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
    mostrarCitasDelDia(fechaKey);
  };
  if (nextMonthBtn) nextMonthBtn.onclick = function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
    const fechaKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
    mostrarCitasDelDia(fechaKey);
  };

  // Inicial: cargar citas y renderizar calendario y citas del día actual
  cargarCitasPorDia(() => {
    renderCalendar(currentMonth, currentYear);
    mostrarCitasDelDia(chileNow().toISOString().slice(0,10));
  });

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

  // ==================== CITAS DEL DÍA ====================

  // Cargar y mostrar todas las citas agendadas para una fecha específica (yyyy-mm-dd)
  function mostrarCitasDelDia(fecha) {
    if (!appointmentsList) return;
    appointmentsList.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>`;
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    db.collection("citas")
      .where("fecha", "==", fecha)
      .orderBy("hora", "asc")
      .get()
      .then(function(snapshot) {
        const citas = [];
        snapshot.forEach(function(doc) {
          const cita = doc.data();
          cita.id = doc.id;
          citas.push(cita);
        });
        appointmentsList.innerHTML = "";
        if (!citas.length) {
          appointmentsList.innerHTML = "<div class='no-results'>No hay citas agendadas para este día.</div>";
          return;
        }
        // Almacenar el array para uso adicional
        window.citasDelDia = citas;
        citas.forEach(function(cita) {
          const div = document.createElement("div");
          div.className = "appointment-item";
          div.innerHTML = `
            <div class="appointment-time">${cita.hora || ""}</div>
            <div class="appointment-details">
              <div class="appointment-patient">${cita.pacienteNombre || cita.paciente || ""}</div>
              <div class="appointment-professional">${cita.profesionalNombre || ""}</div>
            </div>
            <div class="appointment-status">
              <span class="status-badge ${cita.estado || "agendada"}">${cita.estado || "Agendada"}</span>
            </div>
          `;
          appointmentsList.appendChild(div);
        });
      })
      .catch(function(error) {
        appointmentsList.innerHTML = "<div class='no-results'>Error cargando citas.</div>";
        if (window.showNotification) window.showNotification("Error cargando citas del día: " + error.message, "error");
      });
  }

  // Permitir que otros scripts llamen mostrarCitasDelDia(fecha)
  window.mostrarCitasDelDia = mostrarCitasDelDia;

  // Cargar citas del día actual al iniciar (para panel "Citas del Día")
  (function cargarCitasHoy() {
    const hoy = chileNow().toISOString().slice(0,10);
    mostrarCitasDelDia(hoy);
  })();
});
