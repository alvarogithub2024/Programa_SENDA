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

  function chileNow() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Santiago"}));
  }

  function getMonthName(month) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return meses[month];
  }

  function renderCalendar(month, year) {
    calendarGrid.innerHTML = "";
    calendarHeader.textContent = `${getMonthName(month)} ${year}`;

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
          const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
          const dayNumDiv = document.createElement('div');
          dayNumDiv.className = 'calendar-day-number';
          dayNumDiv.textContent = date;
          cell.appendChild(dayNumDiv);

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
    renderCalendar(currentMonth, currentYear);
    // Mostrar citas del primer día del nuevo mes
    const fechaKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
    mostrarCitasDelDia(fechaKey);
  };
  if (nextMonthBtn) nextMonthBtn.onclick = function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
    const fechaKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
    mostrarCitasDelDia(fechaKey);
  };

  // Inicial: renderiza el calendario y muestra las citas de hoy
  renderCalendar(currentMonth, currentYear);
  mostrarCitasDelDia(chileNow().toISOString().slice(0,10));

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
          appointmentsList.innerHTML = "<div class='no-results'>No hay citas agendadas para este día.";
          return;
        }
        // Mostrar todos los pacientes agendados en el día
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
        // Guardar el listado global si lo necesitas
        window.citasDelDia = citas;
      })
      .catch(function(error) {
        appointmentsList.innerHTML = "<div class='no-results'>Error cargando citas.</div>";
        if (window.showNotification) window.showNotification("Error cargando citas del día: " + error.message, "error");
      });
  }

  window.mostrarCitasDelDia = mostrarCitasDelDia;
});
