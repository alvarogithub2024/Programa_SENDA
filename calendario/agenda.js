// calendario/agenda.js

// ==== CALENDARIO LUNES A DOMINGO, MES ACTUAL ====
document.addEventListener("DOMContentLoaded", function() {
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarHeader = document.getElementById('calendar-month-year');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const nuevaCitaBtn = document.getElementById('nueva-cita-btn');

  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  // Chile timezone
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

    // Primer día del mes (Lunes es 1, Domingo es 0)
    let primerDia = new Date(year, month, 1);
    let ultimoDia = new Date(year, month + 1, 0);
    let startDay = (primerDia.getDay() + 6) % 7; // Lunes=0, Domingo=6
    let daysInMonth = ultimoDia.getDate();

    let row = document.createElement('div');
    row.className = 'calendar-row calendar-row-header';
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(dia => {
      let cell = document.createElement('div');
      cell.className = 'calendar-cell calendar-header-cell';
      cell.textContent = dia;
      row.appendChild(cell);
    });
    calendarGrid.appendChild(row);

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
          cell.textContent = date;
          cell.dataset.date = `${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`;
          if (date === chileNow().getDate() && month === chileNow().getMonth() && year === chileNow().getFullYear()) {
            cell.classList.add('calendar-today');
          }
          cell.onclick = function() {
            document.getElementById('cita-fecha').value = cell.dataset.date;
            showModal('modal-nueva-cita');
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
  };
  if (nextMonthBtn) nextMonthBtn.onclick = function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  };

  renderCalendar(currentMonth, currentYear);

  // Botón + Nueva Cita
  if (nuevaCitaBtn) {
    nuevaCitaBtn.onclick = function() {
      const chileDate = chileNow();
      document.getElementById('cita-fecha').value = chileDate.toISOString().slice(0,10);
      showModal('modal-nueva-cita');
    };
  }

  // ====== PROFESIONALES PARA CITA ======
  function cargarProfesionales() {
    const select = document.getElementById('cita-profesional');
    const nombreProf = document.getElementById('cita-profesional-nombre');
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
    select.onchange = function() {
      let selected = select.options[select.selectedIndex];
      nombreProf.value = selected.dataset.nombre || '';
    };
  }
  cargarProfesionales();

  // ====== SUBMIT NUEVA CITA ======
  document.getElementById('form-nueva-cita').onsubmit = function(e) {
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
      // Puedes aquí actualizar la agenda visual si lo deseas
    }).catch(err=>{
      window.showNotification && window.showNotification("Error al agendar: "+err.message, "error");
    });
  };

});
