document.addEventListener("DOMContentLoaded", function() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarHeader = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
    const nuevaCitaProfesionalBtn = document.getElementById('nueva-cita-profesional-btn');

    function chileNow() {
        return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    }
    let today = chileNow();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let citasPorDia = {};
    let profesionActual = null;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            window.getFirestore().collection('profesionales').doc(user.uid).get().then(function(doc){
                if (doc.exists) {
                    profesionActual = doc.data().profession || null;
                }
            });
        } else {
            profesionActual = null;
        }
    });

    function getMonthName(month) {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return meses[month];
    }

    function cargarCitasPorDia(callback) {
        const db = window.getFirestore();
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

        let row = document.createElement('div');
        row.className = 'calendar-row calendar-row-header';
        ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(dia => {
            let cell = document.createElement('div');
            cell.className = 'calendar-cell calendar-header-cell';
            cell.textContent = dia;
            row.appendChild(cell);
        });
        calendarGrid.appendChild(row);

        // ¡ESTE ES EL CÁLCULO CLAVE!
        // startDay: 0=lunes, 1=martes, ..., 6=domingo
        let primerDia = new Date(year, month, 1);
        let ultimoDia = new Date(year, month + 1, 0);
        let startDay = (primerDia.getDay() + 6) % 7;
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
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

                    const dayNumDiv = document.createElement('div');
                    dayNumDiv.className = 'calendar-day-number';
                    dayNumDiv.textContent = date;
                    cell.appendChild(dayNumDiv);

                    const eventos = citasPorDia[dateKey] || [];
                    if (eventos.length) {
                        const eventsDiv = document.createElement('div');
                        eventsDiv.className = 'calendar-events';

                        eventos.forEach(evt => {
                            const evDiv = document.createElement('div');
                            evDiv.className = 'calendar-event';
                            if (evt.tipo === "profesional") {
                                evDiv.textContent = evt.pacienteNombre || evt.paciente || evt.nombre || evt.profesionalNombre || "Sin nombre";
                            } else {
                                evDiv.textContent = evt.pacienteNombre || evt.paciente || evt.nombre || "Sin nombre";
                            }
                            eventsDiv.appendChild(evDiv);
                        });

                        cell.appendChild(eventsDiv);
