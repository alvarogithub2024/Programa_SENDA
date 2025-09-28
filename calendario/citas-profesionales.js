
let profesionalesProfesional = [];
let profesionesProfesional = [];
let miCesfamProfesional = null;

let profesionalesAgendarProf = [];
let profesionesAgendarProf = [];
let miCesfamAgendarProf = null;

function cargarProfesionalesNuevaCitaProfesional(callback) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    
    db.collection('profesionales').doc(user.uid).get().then(doc => {
        if (!doc.exists) return;
        miCesfamProfesional = doc.data().cesfam;
        
        db.collection('profesionales')
            .where('activo', '==', true)
            .where('cesfam', '==', miCesfamProfesional)
            .get()
            .then(snapshot => {
                profesionalesProfesional = [];
                profesionesProfesional = [];
                
                snapshot.forEach(docu => {
                    const p = docu.data();
                    p.uid = docu.id;
                    profesionalesProfesional.push(p);
                    
                    if (p.profession && !profesionesProfesional.includes(p.profession)) {
                        profesionesProfesional.push(p.profession);
                    }
                });
                
                if (typeof callback === 'function') callback();
            });
    });
}

function capitalizarProfesionProfesional(str) {
    if (!str) return "";
    str = str.replace(/_/g, " ");
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesNuevaCitaProfesional() {
    const selProf = document.getElementById('prof-cita-profession');
    if (!selProf) return;
    
    selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
    profesionesProfesional.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof;
        opt.textContent = capitalizarProfesionProfesional(prof);
        selProf.appendChild(opt);
    });
}

function llenarSelectProfesionalesNuevaCitaProfesional() {
    const selProfesion = document.getElementById('prof-cita-profession');
    const selProfesional = document.getElementById('prof-cita-profesional');
    if (!selProfesion || !selProfesional) return;
    
    selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
    const filtro = selProfesion.value;
    
    profesionalesProfesional
        .filter(p => p.profession === filtro)
        .forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.uid;
            opt.textContent = `${p.nombre} ${p.apellidos}`;
            opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
            selProfesional.appendChild(opt);
        });
        
    const nombreInput = document.getElementById('prof-cita-profesional-nombre');
    if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesionalNuevaCitaProfesional() {
    const selProfesional = document.getElementById('prof-cita-profesional');
    const nombreInput = document.getElementById('prof-cita-profesional-nombre');
    if (!selProfesional || !nombreInput) return;
    
    const selected = selProfesional.options[selProfesional.selectedIndex];
    nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

function actualizarHorasNuevaCitaProfesional() {
    const fecha = document.getElementById('prof-cita-fecha')?.value;
    const profesionalId = document.getElementById('prof-cita-profesional')?.value;
    const selectHora = document.getElementById('prof-cita-hora');
    if (!selectHora) return;
    
    selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
    if (!fecha || !profesionalId) return;
    
    window.cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
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

function abrirModalNuevaCitaProfesional() {
    cargarProfesionalesNuevaCitaProfesional(function() {
        llenarSelectProfesionesNuevaCitaProfesional();
        llenarSelectProfesionalesNuevaCitaProfesional();
        autocompletarNombreProfesionalNuevaCitaProfesional();

        const selProf = document.getElementById('prof-cita-profession');
        if (selProf) {
            selProf.onchange = function() {
                llenarSelectProfesionalesNuevaCitaProfesional();
                autocompletarNombreProfesionalNuevaCitaProfesional();
                actualizarHorasNuevaCitaProfesional();
            };
        }
        
        const selPro = document.getElementById('prof-cita-profesional');
        if (selPro) {
            selPro.onchange = function() {
                autocompletarNombreProfesionalNuevaCitaProfesional();
                actualizarHorasNuevaCitaProfesional();
            };
        }
        
        const fechaInput = document.getElementById('prof-cita-fecha');
        const profSelect = document.getElementById('prof-cita-profesional');
        if (fechaInput && profSelect) {
            fechaInput.addEventListener('change', actualizarHorasNuevaCitaProfesional);
            profSelect.addEventListener('change', actualizarHorasNuevaCitaProfesional);
        }

        showModal('modal-nueva-cita-profesional');

        setTimeout(function() {
            const form = document.getElementById('form-nueva-cita-profesional');
            if (form && !form._onsubmitSet) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    
                    const cita = {
                        profesion: document.getElementById('prof-cita-profession').value,
                        profesionalId: document.getElementById('prof-cita-profesional').value,
                        profesionalNombre: document.getElementById('prof-cita-profesional-nombre').value,
                        fecha: document.getElementById('prof-cita-fecha').value,
                        hora: document.getElementById('prof-cita-hora').value,
                        creado: new Date().toISOString(),
                        tipo: "profesional"
                    };

                    if (!cita.profesion || !cita.profesionalId || !cita.fecha || !cita.hora) {
                        window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                        return;
                    }
                    
                    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
                    db.collection("citas").add(cita)
                        .then(function(docRef) {
                            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
                            closeModal('modal-nueva-cita-profesional');
                        })
                        .catch(function(error) {
                            window.showNotification && window.showNotification("Error al guardar la cita: " + error, "error");
                        });
                };
                form._onsubmitSet = true;
            }
        }, 100);
    });
}

function cargarProfesionalesAgendarCitaProfesional(callback) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    
    db.collection('profesionales').doc(user.uid).get().then(doc => {
        if (!doc.exists) return;
        miCesfamAgendarProf = doc.data().cesfam;
        
        db.collection('profesionales')
            .where('activo', '==', true)
            .where('cesfam', '==', miCesfamAgendarProf)
            .get()
            .then(snapshot => {
                profesionalesAgendarProf = [];
                profesionesAgendarProf = [];
                
                snapshot.forEach(docu => {
                    const p = docu.data();
                    p.uid = docu.id;
                    profesionalesAgendarProf.push(p);
                    
                    if (p.profession && !profesionesAgendarProf.includes(p.profession)) {
                        profesionesAgendarProf.push(p.profession);
                    }
                });
                
                if (typeof callback === 'function') callback();
            });
    });
}

function capitalizarProfesionAgendarProf(str) {
    if (!str) return "";
    str = str.replace(/_/g, " ");
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function llenarSelectProfesionesAgendarCitaProfesional() {
    const selProf = document.getElementById('modal-cita-profession-prof');
    if (!selProf) return;
    
    selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
    profesionesAgendarProf.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof;
        opt.textContent = capitalizarProfesionAgendarProf(prof);
        selProf.appendChild(opt);
    });
}

function llenarSelectProfesionalesAgendarCitaProfesional() {
    const selProfesion = document.getElementById('modal-cita-profession-prof');
    const selProfesional = document.getElementById('modal-cita-profesional-prof');
    if (!selProfesion || !selProfesional) return;
    
    selProfesional.innerHTML = '<option value="">Selecciona profesional...</option>';
    const filtro = selProfesion.value;
    
    profesionalesAgendarProf
        .filter(p => p.profession === filtro)
        .forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.uid;
            opt.textContent = `${p.nombre} ${p.apellidos}`;
            opt.dataset.nombre = `${p.nombre} ${p.apellidos}`;
            selProfesional.appendChild(opt);
        });
        
    const nombreInput = document.getElementById('modal-cita-profesional-nombre-prof');
    if (nombreInput) nombreInput.value = '';
}

function autocompletarNombreProfesionalAgendarCitaProfesional() {
    const selProfesional = document.getElementById('modal-cita-profesional-prof');
    const nombreInput = document.getElementById('modal-cita-profesional-nombre-prof');
    if (!selProfesional || !nombreInput) return;
    
    const selected = selProfesional.options[selProfesional.selectedIndex];
    nombreInput.value = selected && selected.dataset.nombre ? selected.dataset.nombre : '';
}

function actualizarHorasAgendarProfesional() {
    const fecha = document.getElementById('modal-cita-fecha-prof')?.value;
    const profesionalId = document.getElementById('modal-cita-profesional-prof')?.value;
    const selectHora = document.getElementById('modal-cita-hora-prof');
    if (!selectHora) return;
    
    selectHora.innerHTML = '<option value="">Selecciona hora...</option>';
    if (!fecha || !profesionalId) return;
    
    window.cargarHorariosDisponibles(fecha, profesionalId, function(horariosDisponibles) {
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

function abrirModalAgendarCitaProfesional(solicitudId, nombre, rut) {
    cargarProfesionalesAgendarCitaProfesional(function() {
        llenarSelectProfesionesAgendarCitaProfesional();
        llenarSelectProfesionalesAgendarCitaProfesional();
        autocompletarNombreProfesionalAgendarCitaProfesional();

        const inputIdProf = document.getElementById('modal-cita-id-prof');
        if (inputIdProf) inputIdProf.value = solicitudId;

        const nombreSpanProf = document.getElementById('modal-cita-nombre-prof');
        if (nombreSpanProf) nombreSpanProf.textContent = nombre;

        const rutSpanProf = document.getElementById('modal-cita-rut-prof').textContent = window.formatRUT ? 
            window.formatRUT(rut) : rut;

        const selProf = document.getElementById('modal-cita-profession-prof');
        if (selProf) {
            selProf.onchange = function() {
                llenarSelectProfesionalesAgendarCitaProfesional();
                autocompletarNombreProfesionalAgendarCitaProfesional();
                actualizarHorasAgendarProfesional();
            };
        }
        
        const selPro = document.getElementById('modal-cita-profesional-prof');
        if (selPro) {
            selPro.onchange = function() {
                autocompletarNombreProfesionalAgendarCitaProfesional();
                actualizarHorasAgendarProfesional();
            };
        }
        
        const fechaInput = document.getElementById('modal-cita-fecha-prof');
        const profSelect = document.getElementById('modal-cita-profesional-prof');
        if (fechaInput && profSelect) {
            fechaInput.addEventListener('change', actualizarHorasAgendarProfesional);
            profSelect.addEventListener('change', actualizarHorasAgendarProfesional);
        }

        showModal('modal-agendar-cita-profesional');


        setTimeout(function() {
            const form = document.getElementById('form-agendar-cita-profesional');
            if (form && !form._onsubmitSet) {
                form.addEventListener('submit', function(e){
                    e.preventDefault();
                    
                    const cita = {
                        solicitudId: document.getElementById('modal-cita-id-prof').value,
                        nombre: document.getElementById('modal-cita-nombre-prof').textContent,
                        rut: document.getElementById('modal-cita-rut-prof').textContent,
                        profesion: document.getElementById('modal-cita-profession-prof').value,
                        profesionalId: document.getElementById('modal-cita-profesional-prof').value,
                        profesionalNombre: document.getElementById('modal-cita-profesional-nombre-prof').value,
                        fecha: document.getElementById('modal-cita-fecha-prof').value,
                        hora: document.getElementById('modal-cita-hora-prof').value,
                        creado: new Date().toISOString(),
                        tipo: "profesional"
                    };

                    if (!cita.nombre || !cita.rut || !cita.profesion || !cita.profesionalId || !cita.fecha || !cita.hora) {
                        window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                        return;
                    }

                    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
                    db.collection("citas").add(cita)
                        .then(function(docRef) {
                            const solicitudId = cita.solicitudId;
                            
    
                            db.collection("solicitudes_ingreso").doc(solicitudId).update({ estado: "agendada" })
                                .catch(() => {})
                                .finally(() => {
                                    // Actualizar estado en reingresos
                                    db.collection("reingresos").doc(solicitudId).update({ estado: "agendada" })
                                        .catch(() => {})
                                        .finally(() => {
                                            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
                                            closeModal('modal-agendar-cita-profesional');
                                            if (window.reloadSolicitudesFromFirebase) window.reloadSolicitudesFromFirebase();
                                        });
                                });
                        })
                        .catch(function(error) {
                            window.showNotification && window.showNotification("Error al guardar la cita: " + error, "error");
                        });
                });
                form._onsubmitSet = true;
            }
        }, 100);
    });
}
function upsertPacienteYAgendarCita(datosCita, callback) {
    const db = window.getFirestore ? window.getFirestore() : firebase.firestore();
    const datos = Object.assign({}, datosCita);
    datos.fechaCreacion = datos.fechaCreacion || new Date().toISOString();
    const rutLimpio = datos.pacienteRut ? datos.pacienteRut.replace(/[.\-]/g, "").toUpperCase() : datos.rut ? datos.rut.replace(/[.\-]/g, "").toUpperCase() : "";

    if (!rutLimpio) {
        window.showNotification && window.showNotification("Error: El paciente no tiene RUT, no se puede crear en la colección pacientes.", "error");
        if (typeof callback === "function") callback(null, "RUT vacío");
        return;
    }

    db.collection("pacientes").where("rut", "==", rutLimpio).limit(1).get()
        .then(function(snapshot) {
            let pacienteId;
            const pacienteData = {
                apellidos: datos.pacienteApellidos || datos.apellidos || "",
                cesfam: datos.cesfam || "",
                nombre: datos.pacienteNombre || datos.nombre || "",
                rut: rutLimpio,
                telefono: datos.telefono || "",
                email: datos.email || "",
                direccion: datos.direccion || "",
                edad: datos.edad || "",
                // ...otros campos...
            };
            if (!snapshot.empty) {
                pacienteId = snapshot.docs[0].id;
                db.collection("pacientes").doc(pacienteId).set(pacienteData, { merge: true })
                    .then(() => {
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    });
            } else {
                db.collection("pacientes").add(pacienteData)
                    .then(function(docRef) {
                        pacienteId = docRef.id;
                        db.collection("pacientes").doc(pacienteId).set(Object.assign({}, pacienteData, { id: pacienteId }), { merge: true });
                        datos.pacienteId = pacienteId;
                        crearCitaConPacienteId(db, datos, callback);
                    });
            }
        });
}

function crearCitaConPacienteId(db, datos, callback) {
    if (!datos.pacienteId) {
        window.showNotification && window.showNotification("Error: No se pudo vincular la cita a un paciente válido.", "error");
        if (typeof callback === "function") callback(null, "pacienteId vacío");
        return;
    }
    db.collection("citas").add(datos)
        .then(function(docRef) {
            window.showNotification && window.showNotification("Cita agendada correctamente", "success");
            if (typeof callback === "function") callback(docRef.id);
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error al agendar cita: " + error.message, "error");
            if (typeof callback === "function") callback(null, error);
        });
}

document.addEventListener("DOMContentLoaded", function() {
    var formAgendarCitaProf = document.getElementById('form-agendar-cita-profesional');
    if (formAgendarCitaProf) {
        formAgendarCitaProf.onsubmit = function(e) {
            e.preventDefault();
            const datos = {
                pacienteNombre: document.getElementById('modal-cita-nombre-prof')?.textContent.trim(),
                pacienteApellidos: document.getElementById('modal-cita-apellidos-prof')?.textContent.trim() || "",
                pacienteRut: document.getElementById('modal-cita-rut-prof')?.textContent.trim(),
                cesfam: document.getElementById('modal-cita-cesfam-prof')?.textContent.trim() || "",
                edad: document.getElementById('modal-cita-edad-prof')?.textContent.trim() || "",
                telefono: document.getElementById('modal-cita-telefono-prof')?.textContent.trim() || "",
                email: document.getElementById('modal-cita-email-prof')?.textContent.trim() || "",
                direccion: document.getElementById('modal-cita-direccion-prof')?.textContent.trim() || "",
                // ...otros campos de paciente si tienes...
                estado: "agendada",
                fecha: document.getElementById('modal-cita-fecha-prof')?.value,
                hora: document.getElementById('modal-cita-hora-prof')?.value,
                profesionalId: document.getElementById('modal-cita-profesional-prof')?.value,
                profesionalNombre: document.getElementById('modal-cita-profesional-nombre-prof')?.value,
                tipo: "profesional",
                tipoProfesional: document.getElementById('modal-cita-profession-prof')?.value,
                solicitudId: document.getElementById('modal-cita-id-prof')?.value // referencia a la solicitud original
            };

            if (!datos.pacienteNombre || !datos.pacienteRut || !datos.profesionalId || !datos.fecha || !datos.hora) {
                window.showNotification && window.showNotification("Completa todos los campos obligatorios", "warning");
                return;
            }

            upsertPacienteYAgendarCita(datos, function(idCita, error) {
                if (!error) closeModal('modal-agendar-cita-profesional');
            });
        };
    }
});
window.abrirModalNuevaCitaProfesional = abrirModalNuevaCitaProfesional;
window.abrirModalAgendarCitaProfesional = abrirModalAgendarCitaProfesional;
window.cargarProfesionalesAgendarCitaProfesional = cargarProfesionalesAgendarCitaProfesional;
