document.addEventListener("DOMContentLoaded", function() {
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarHeader = document.getElementById('calendar-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
    const nuevaCitaProfesionalBtn = document.getElementById('nueva-cita-profesional-btn');

    // CAMBIO: Usa chileNow() para la fecha inicial
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

        // CAMBIO: Usa chileNow() para primerDia (para que getDay sea Chile)
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
                    }

                    cell.dataset.date = dateKey;

                    // CAMBIO: Usa chileNow() para el día actual (hoy)
                    let nowChile = chileNow();
                    if (date === nowChile.getDate() &&
                        month === nowChile.getMonth() &&
                        year === nowChile.getFullYear()) {
                        cell.classList.add('calendar-today');
                    }

                    cell.onclick = function() {
                        window.mostrarCitasDelDia(cell.dataset.date);
                    };

                    date++;
                }

                weekRow.appendChild(cell);
            }

            calendarGrid.appendChild(weekRow);
            if (date > daysInMonth) break;
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.onclick = function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
        };
    }

    if (nextMonthBtn) {
        nextMonthBtn.onclick = function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
        };
    }

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
            }
        };
    }

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

    function mostrarCitasDelDia(fecha) {
        const appointmentsList = document.getElementById('appointments-list');
        if (!appointmentsList) return;

        appointmentsList.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando citas...</div>`;
        const db = window.getFirestore();

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
                        mainName = cita.pacienteNombre || cita.paciente || cita.nombre || cita.profesionalNombre || "Sin nombre";
                        subName = (cita.profesionalNombre && cita.profesionalNombre !== mainName) ? cita.profesionalNombre : "";
                    } else {
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
                        ${profesionActual && profesionActual !== 'asistente_social'
                            ? `<button class="btn btn-danger btn-sm" onclick="eliminarCita('${cita.id}', '${fecha}')">
                                <i class="fas fa-trash"></i> Eliminar
                              </button>`
                            : ''
                        }
                    `;

                    appointmentsList.appendChild(div);
                });

                window.citasDelDia = citas;
            })
            .catch(function(error) {
                appointmentsList.innerHTML = "<div class='no-results'>Error cargando citas.</div>";
                if (window.showNotification) {
                    window.showNotification("Error cargando citas del día: " + error.message, "error");
                }
            });
    }

    window.eliminarCita = function(citaId, fecha) {
        if (!confirm("¿Seguro que deseas eliminar la cita?")) return;

        const db = window.getFirestore();
        db.collection("citas").doc(citaId).delete()
            .then(function() {
                window.showNotification && window.showNotification("Cita eliminada correctamente", "success");
                window.mostrarCitasDelDia(fecha);
            })
            .catch(function(error) {
                window.showNotification && window.showNotification("Error al eliminar cita: " + error.message, "error");
            });
    };

    // CAMBIO: Usa chileNow() para el día actual en mostrarCitasDelDia
    const hoy = chileNow().toISOString().slice(0, 10);
    mostrarCitasDelDia(hoy);
    window.mostrarCitasDelDia = mostrarCitasDelDia;

    cargarCitasPorDia(() => renderCalendar(currentMonth, currentYear));
});
