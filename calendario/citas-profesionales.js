// ========== VARIABLES GLOBALES ==========
let profesionalesProfesional = [];
let profesionesProfesional = [];
let miCesfamProfesional = null;

let profesionalesAgendarProf = [];
let profesionesAgendarProf = [];
let miCesfamAgendarProf = null;

// ========== UTILS ==========
function capitalizarProfesion(str) {
    if (!str) return "";
    str = str.replace(/_/g, " ");
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ========== CARGA DE PROFESIONALES Y PROFESIONES ==========
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

// ========== LLENAR SELECTS ==========
function llenarSelectProfesionesNuevaCitaProfesional() {
    const selProf = document.getElementById('prof-cita-profession');
    if (!selProf) return;
    selProf.innerHTML = '<option value="">Selecciona profesión...</option>';
    profesionesProfesional.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof;
        opt.textContent = capitalizarProfesion(prof);
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

// ========== MODAL NUEVA CITA PROFESIONAL ==========
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
window.abrirModalNuevaCitaProfesional = abrirModalNuevaCitaProfesional;

// ========== MODAL AGENDAR CITA PROFESIONAL DESDE SOLICITUD ==========
window.abrirModalAgendarCitaProfesional = function(solicitudId, nombre, rut, cesfam) {
    var modal = document.getElementById('modal-agendar-cita-profesional');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modal-cita-nombre-prof').textContent = nombre || '';
        document.getElementById('modal-cita-rut-prof').textContent = rut || '';
        document.getElementById('modal-cita-cesfam-prof').textContent = cesfam || '';
        document.getElementById('modal-cita-id-prof').value = solicitudId || '';
        // ...otros campos si los necesitas
    }
};

// ========== FORMULARIO AGENDAR CITA PROFESIONAL ==========
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
                estado: "agendada",
                fecha: document.getElementById('modal-cita-fecha-prof')?.value,
                hora: document.getElementById('modal-cita-hora-prof')?.value,
                profesionalId: document.getElementById('modal-cita-profesional-prof')?.value,
                profesionalNombre: document.getElementById('modal-cita-profesional-nombre-prof')?.value,
                tipo: "profesional",
                tipoProfesional: document.getElementById('modal-cita-profession-prof')?.value,
                solicitudId: document.getElementById('modal-cita-id-prof')?.value
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

// ========== FLUJO UNIFICADO para NUEVA CITA y AGENDAR CITA ==========
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
                edad: datos.edad || ""
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

// Utilidad para mostrar cualquier modal por id
function showModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

// Utilidad para cerrar cualquier modal por id
function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
