}
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

        const rutSpanProf = document.getElementById('modal-cita-rut-prof');
        if (rutSpanProf) rutSpanProf.textContent = rut;

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

window.abrirModalNuevaCitaProfesional = abrirModalNuevaCitaProfesional;
window.abrirModalAgendarCitaProfesional = abrirModalAgendarCitaProfesional;
window.cargarProfesionalesAgendarCitaProfesional = cargarProfesionalesAgendarCitaProfesional;
