// calendario/agenda.js

document.addEventListener("DOMContentLoaded", function() {
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarHeader = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
  const nuevaCitaProfesionalBtn = document.getElementById('nueva-cita-profesional-btn'); // NUEVO para profesionales

  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  let citasPorDia = {};

  function chileNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
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
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(dia => {
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
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
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
              // Mostrar nombre del paciente si existe, si no, nombre profesional
              if (evt.tipo === "profesional") {
                // Mostrar profesional principal
                evDiv.textContent = evt.profesionalNombre || "Sin nombre";
              } else {
                // Mostrar paciente (por defecto)
                evDiv.textContent = evt.pacienteNombre || evt.paciente || evt.nombre || "Sin nombre";
              }
              eventsDiv.appendChild(evDiv);
            });
            cell.appendChild(eventsDiv);
          }

          cell.dataset.date = dateKey;
          if (
            date === chileNow().getDate() &&
            month === chileNow().getMonth() &&
            year === chileNow().getFullYear()
          ) {
            cell.classList.add('calendar-today');
          }

          cell.onclick = function() {
            // Decide según el tipo de cita que quieres abrir:
            // Si tienes un selector de tipo de cita, úsalo aquí.
            // Ejemplo simple: abre modal de paciente por defecto
            if (window.abrirModalCitaPaciente) {
              var fechaInput = document.getElementById('pac-cita-fecha');
              if (fechaInput) fechaInput.value = cell.dataset.date;
              window.abrirModalCitaPaciente();
            }
            // Si quieres abrir el de profesionales, puedes agregar una condición:
            // else if (window.abrirModalNuevaCitaProfesional) { ... }

            // Mostrar citas del día en el panel inferior
            mostrarCitasDelDia(cell.dataset.date);
          };
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

  // Botón + Nueva Cita (Paciente)
  if (nuevaCitaBtn) {
    nuevaCitaBtn.onclick = function() {
      if (window.abrirModalCitaPaciente) {
        window.abrirModalCitaPaciente();
        setTimeout(function() {
          const fechaInput = document.getElementById('pac-cita-fecha');
          if (fechaInput) {
            const chileDate = chileNow();
            fechaInput.value = chileDate.toISOString().slice(0, 10);
          }
        }, 100);
      } else {
        showModal('modal-nueva-cita');
        setTimeout(function() {
          const fechaInput = document.getElementById('cita-fecha');
          if (fechaInput) {
            const chileDate = chileNow();
            fechaInput.value = chileDate.toISOString().slice(0, 10);
          }
        }, 100);
      }
    };
  }

  // NUEVO: Botón + Nueva Cita Profesional 
  if (nuevaCitaProfesionalBtn && window.abrirModalNuevaCitaProfesional) {
    nuevaCitaProfesionalBtn.onclick = function() {
      window.abrirModalNuevaCitaProfesional();
      setTimeout(function() {
        const fechaInput = document.getElementById('prof-cita-fecha');
        if (fechaInput) {
          const chileDate = chileNow();
          fechaInput.value = chileDate.toISOString().slice(0, 10);
        }
      }, 100);
    };
  }

  // ==================== CITAS DEL DÍA ====================
  function mostrarCitasDelDia(fecha) {
    const appointmentsList = document.getElementById('appointments-list');
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
        citas.forEach(function(cita) {
          const div = document.createElement("div");
          div.className = "appointment-item";
          let mainName = "";
          let subName = "";
          if (cita.tipo === "profesional") {
            // Cita entre profesionales
            mainName = cita.profesionalNombre || cita.nombre || "Sin nombre";
            // Si hay otro profesional involucrado, podría estar en cita.nombre, cita.profesionalNombre, cita.pacienteNombre según tu modelo
            // Si tienes ambos profesionales, muestra los dos: principal y secundario
            subName = cita.nombre && cita.nombre !== mainName ? cita.nombre : "";
          } else {
            // Cita de paciente
            mainName = cita.pacienteNombre || cita.paciente || cita.nombre || "Sin nombre";
            subName = cita.profesionalNombre || "";
          }
          div.innerHTML = `
            <div class="appointment-time">${cita.hora || ""}</div>
            <div class="appointment-details">
              <div class="appointment-patient"><strong>${mainName}</strong></div>
              ${subName ? `<div class="appointment-professional">${subName}</div>` : ""}
            </div>
            <div class="appointment-status">
              <span class="status-badge ${cita.estado || "agendada"}">${cita.estado || "Agendada"}</span>
            </div>
          `;
          appointmentsList.appendChild(div);
        });
        // Si necesitas acceder a los pacientes citados del día desde otros scripts:
        window.citasDelDia = citas;
      })
      .catch(function(error) {
        appointmentsList.innerHTML = "<div class='no-results'>Error cargando citas.</div>";
        if (window.showNotification) window.showNotification("Error cargando citas del día: " + error.message, "error");
      });
  }

  // Mostrar citas del día actual al cargar la página
  const hoy = new Date().toISOString().slice(0, 10);
  mostrarCitasDelDia(hoy);
  window.mostrarCitasDelDia = mostrarCitasDelDia;

});
