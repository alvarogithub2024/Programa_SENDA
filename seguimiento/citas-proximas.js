
function getHoraActualChile() {
    let now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    let h = now.getHours();
    let m = now.getMinutes();
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}


function getFechaActualChile() {
    let now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    return now.toISOString().slice(0, 10); 
}


function mostrarPacienteActualHoy() {
    console.log('🔍 Buscando pacientes para hoy...');
    
    var db = window.getFirestore();
    if (!db) {
        console.error('❌ No se pudo acceder a Firestore');
        return;
    }

    var hoy = getFechaActualChile();
    var horaActual = getHoraActualChile();
    
    console.log(`📅 Fecha de hoy: ${hoy}`);
    console.log(`🕐 Hora actual: ${horaActual}`);

    db.collection("citas")
        .where("fecha", "==", hoy)
        .get()
        .then(function(snapshot) {
            console.log(`📋 Total de citas encontradas para hoy: ${snapshot.size}`);
            
            let citaActual = null;
            let nowMinutes = parseInt(horaActual.slice(0,2),10)*60 + parseInt(horaActual.slice(3,5),10);
            
            snapshot.forEach(function(doc) {
                let cita = doc.data();
                cita.id = doc.id;
                
                console.log(`📝 Cita encontrada: ${cita.pacienteNombre || cita.nombre} a las ${cita.hora}`);
                
                if (cita.hora) {
                    let citaMin = parseInt(cita.hora.slice(0,2),10)*60 + parseInt(cita.hora.slice(3,5),10);
                  
                    if (nowMinutes >= citaMin && nowMinutes <= citaMin + 15) {
                        citaActual = cita;
                        console.log(`✅ Paciente actual encontrado: ${cita.pacienteNombre || cita.nombre}`);
                    }
                }
            });

            let cont = document.getElementById("patients-timeline");
            if (!cont) {
                console.error('❌ No se encontró el elemento patients-timeline');
                return;
            }
            
            cont.innerHTML = "";
            
            if (!citaActual) {
                console.log('⏰ No hay paciente agendado para la hora actual');
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-user-clock"></i>
                        <p>No hay paciente agendado para la hora actual (${horaActual}).</p>
                        <small>Mostrando pacientes con citas en curso o que comenzaron hace máximo 15 minutos</small>
                    </div>
                `;
                return;
            }

            let div = document.createElement("div");
            div.className = "appointment-item";
            div.innerHTML = `
                <div class="cita-info">
                    <b>${citaActual.hora}</b> - <b>${citaActual.pacienteNombre || citaActual.nombre || "Sin nombre"}</b>
                    <br>
                    <span>
                        ${citaActual.tipoProfesional || citaActual.profesion || "Sin profesión"} | 
                        ${citaActual.cesfam || "Sin CESFAM"}
                    </span>
                    ${citaActual.rut ? `<br><span>RUT: ${citaActual.rut}</span>` : ''}
                </div>
                <div class="cita-actions">
                    <button class="btn btn-primary btn-sm" onclick="abrirModalRegistrarAtencion('${citaActual.id}')">
                        <i class="fas fa-notes-medical"></i> Registrar atención
                    </button>
                </div>
            `;
            cont.appendChild(div);
            
            console.log(`✅ Paciente actual mostrado: ${citaActual.pacienteNombre || citaActual.nombre}`);
        })
        .catch(function(error) {
            console.error('❌ Error cargando paciente de hoy:', error);
            let cont = document.getElementById("patients-timeline");
            if (cont) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando paciente de hoy: ${error.message}</p>
                    </div>
                `;
            }
        });
}

function mostrarCitasRestantesHoy() {
    console.log('🔍 Buscando próximas citas del día...');
    
    var db = window.getFirestore();
    if (!db) {
        console.error('❌ No se pudo acceder a Firestore');
        return;
    }

    var hoy = getFechaActualChile();
    var horaActual = getHoraActualChile();
    
    console.log(`📅 Buscando citas para: ${hoy} después de las ${horaActual}`);

    db.collection("citas")
        .where("fecha", "==", hoy)
        .get()
        .then(function(snapshot) {
            console.log(`📋 Total de citas encontradas para hoy: ${snapshot.size}`);
            
            let citas = [];
            snapshot.forEach(function(doc) {
                let cita = doc.data();
                cita.id = doc.id;
                
                if (cita.hora && cita.hora > horaActual) {
                    citas.push(cita);
                    console.log(`⏰ Próxima cita: ${cita.pacienteNombre || cita.nombre} a las ${cita.hora}`);
                }
            });

 
            citas.sort((a, b) => a.hora.localeCompare(b.hora));

            let cont = document.getElementById("upcoming-appointments-grid");
            if (!cont) {
                console.error('❌ No se encontró el elemento upcoming-appointments-grid');
                return;
            }
            
            cont.innerHTML = "";
            
            if (!citas.length) {
                console.log('📭 No hay próximas citas para hoy');
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-calendar-check"></i>
                        <p>No hay próximas citas para hoy después de las ${horaActual}.</p>
                    </div>
                `;
                return;
            }
            
            console.log(`✅ Mostrando ${citas.length} próximas citas`);
            
            citas.forEach(function(cita) {
                let div = document.createElement("div");
                div.className = "appointment-item";
                div.innerHTML = `
                    <div class="cita-info">
                        <b>${cita.hora}</b> - <b>${cita.pacienteNombre || cita.nombre || "Sin nombre"}</b>
                        <br>
                        <span>
                            ${cita.tipoProfesional || cita.profesion || "Sin profesión"} | 
                            ${cita.cesfam || "Sin CESFAM"}
                        </span>
                        ${cita.rut ? `<br><span>RUT: ${cita.rut}</span>` : ''}
                    </div>
                    <div class="cita-actions">
                        <span class="status-badge programada">
                            <i class="fas fa-clock"></i> Programada
                        </span>
                    </div>
                `;
                cont.appendChild(div);
            });
        })
        .catch(function(error) {
            console.error('❌ Error cargando próximas citas:', error);
            let cont = document.getElementById("upcoming-appointments-grid");
            if (cont) {
                cont.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error cargando próximas citas: ${error.message}</p>
                    </div>
                `;
            }
        });
}

window.abrirModalRegistrarAtencion = function(citaId) {
    var db = window.getFirestore();
    db.collection("citas").doc(citaId).get().then(function(doc) {
        if (!doc.exists) {
            window.showNotification && window.showNotification("Cita no encontrada", "error");
            return;
        }
        var cita = doc.data();
        cita.id = doc.id;

        
        console.log('📋 Datos de la cita:', cita);
        
        var pacienteInfo = `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #2563eb; margin-bottom: 0.5rem;">
                    <i class="fas fa-user"></i> Información del Paciente
                </h4>
                <p><b>Paciente:</b> ${cita.pacienteNombre || cita.nombre || "Sin nombre"}</p>
                <p><b>RUT:</b> ${cita.pacienteRut || cita.rut || "Sin RUT"}</p>
                <p><b>CESFAM:</b> ${cita.cesfam || "Sin CESFAM"}</p>
                <p><b>Fecha y Hora:</b> ${cita.fecha || ""} ${cita.hora || ""}</p>
                <p><b>Profesional:</b> ${cita.profesionalNombre || "Sin profesional asignado"}</p>
            </div>
        `;
        
       document.getElementById("atencion-cita-id").value = cita.id || "";
document.getElementById("atencion-paciente-id").value = cita.pacienteId || "";
document.getElementById("atencion-descripcion").value = "";
document.getElementById("atencion-tipo").value = "";

        showModal("modal-registrar-atencion");
    })
    .catch(function(error) {
        console.error('❌ Error obteniendo cita:', error);
        window.showNotification && window.showNotification("Error al cargar datos de la cita", "error");
    });
};

function initUpcomingAppointments() {
    console.log('🚀 Inicializando seguimiento de citas...');
    

    mostrarPacienteActualHoy();
    mostrarCitasRestantesHoy();
    
 
    const intervalo = setInterval(function() {
        console.log('🔄 Actualizando citas automáticamente...');
        mostrarPacienteActualHoy();
        mostrarCitasRestantesHoy();
    }, 60 * 1000); 
    
    console.log('✅ Seguimiento de citas inicializado. Actualizando cada minuto.');
    

    return function cleanup() {
        clearInterval(intervalo);
        console.log('🧹 Cleanup del seguimiento de citas completado');
    };
}


document.addEventListener("DOMContentLoaded", function() {
    setTimeout(initUpcomingAppointments, 2000);
});


window.mostrarPacienteActualHoy = mostrarPacienteActualHoy;
window.mostrarCitasRestantesHoy = mostrarCitasRestantesHoy;
window.initUpcomingAppointments = initUpcomingAppointments;
window.initUpcomingAppointmentsFromSeguimiento = initUpcomingAppointments;
