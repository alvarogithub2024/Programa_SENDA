// FORMULARIOS/FORMULARIO-PACIENTE.JS

function setupFormularioPaciente() {
    const form = document.getElementById("patient-form");
    if (!form) return;

    const steps = Array.from(form.querySelectorAll(".form-step"));
    let currentStep = 0;

    function mostrarPaso(idx) {
        steps.forEach((step, i) => {
            step.classList.toggle("active", i === idx);
        });
        document.getElementById("progress-text").textContent = `Paso ${idx+1} de 4`;
        document.getElementById("form-progress").style.width = ((idx+1)/steps.length*100)+"%";
        currentStep = idx;
    }

    function mostrarSoloInfo() {
        steps.forEach((step, i) => {
            step.classList.toggle("active", i === 0);
        });
        document.getElementById("progress-text").textContent = `Paso 1 de 1`;
        document.getElementById("form-progress").style.width = "100%";
        currentStep = 0;
        form.querySelector("#next-step-1").style.display = "none";
        form.querySelector("#info-email-container").style.display = "";
        form.querySelector("#basic-info-container").style.display = "none";
        form.querySelector("#enviar-solo-info").style.display = "";
    }

    function mostrarIdentificado() {
        mostrarPaso(0);
        form.querySelector("#next-step-1").style.display = "";
        form.querySelector("#info-email-container").style.display = "none";
        form.querySelector("#basic-info-container").style.display = "";
        form.querySelector("#enviar-solo-info").style.display = "none";
    }

    mostrarIdentificado();

    form.querySelector("#next-step-1").onclick = function() {
        const tipo = form.querySelector('input[name="tipoSolicitud"]:checked');
        if (!tipo) return window.showNotification("Selecciona tipo de solicitud","warning");
        if (tipo.value === "informacion") {
            return;
        }
        const edad = form.querySelector("#patient-age").value;
        const cesfam = form.querySelector("#patient-cesfam").value;
        if (!edad || isNaN(edad) || edad < 12) return window.showNotification("Edad mínima 12 años","warning");
        if (!cesfam) return window.showNotification("Selecciona un CESFAM","warning");
        mostrarPaso(1);
    };
    form.querySelector("#next-step-2").onclick = function() {
        const nombre = form.querySelector("#patient-name").value.trim();
        const apellidos = form.querySelector("#patient-lastname").value.trim();
        let rut = form.querySelector("#patient-rut").value.trim();
        rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
        let tel = form.querySelector("#patient-phone").value.trim();
        tel = limpiarTelefonoChileno(tel);
        if (!nombre || !apellidos) return window.showNotification("Nombre y apellidos requeridos", "warning");
        if (!window.validarRut || !window.validarRut(rut)) return window.showNotification("RUT inválido", "warning");
        if (!validarTelefonoChileno(tel)) return window.showNotification("Teléfono inválido","warning");
        mostrarPaso(2);
    };
    form.querySelector("#next-step-3").onclick = function() {
        const su = form.querySelectorAll('input[name="sustancias"]:checked');
        const urg = form.querySelector('input[name="urgencia"]:checked');
        const trat = form.querySelector('input[name="tratamientoPrevio"]:checked');
        if (!su.length) return window.showNotification("Selecciona al menos una sustancia","warning");
        if (!urg) return window.showNotification("Selecciona nivel de urgencia","warning");
        if (!trat) return window.showNotification("Indica si hubo tratamiento previo","warning");
        mostrarPaso(3);
    };
    ["#prev-step-2","#prev-step-3","#prev-step-4"].forEach((sel,idx) => {
        const btn = form.querySelector(sel);
        if (btn) btn.onclick = ()=>mostrarPaso(idx);
    });

    // Mostrar campo correo y botón enviar "solo info"
    const tipoSolicitudRadios = form.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudRadios.forEach(radio=>{
        radio.addEventListener("change",function(){
            if (radio.value === "informacion" && radio.checked) {
                mostrarSoloInfo();
            } else if (radio.value === "identificado" && radio.checked) {
                mostrarIdentificado();
            }
        });
    });

    // BOTÓN ENVIAR para solo información (guarda SOLO en solicitudes_informacion)
    const btnSoloInfo = form.querySelector("#enviar-solo-info");
    if (btnSoloInfo) {
        btnSoloInfo.onclick = function(e) {
            const email = form.querySelector("#info-email").value.trim();
            if (!window.validarEmail || !window.validarEmail(email)) {
                return window.showNotification("Ingresa un correo válido para recibir información", "warning");
            }
            guardarSolicitudInformacion({
                tipo: "solo_informacion",
                email: email,
                fecha: new Date().toISOString()
            });
        }
    }

    // Submit final (solo identificado)
    form.onsubmit = function(e) {
        e.preventDefault();
        const tipo = form.querySelector('input[name="tipoSolicitud"]:checked');
        if (!tipo || tipo.value !== "identificado") return;
        let rut = form.querySelector("#patient-rut").value.trim().replace(/[^0-9kK]/g, '').toUpperCase();
        let telefono = limpiarTelefonoChileno(form.querySelector("#patient-phone").value.trim());
        const datos = {
            tipo: "identificado",
            edad: form.querySelector("#patient-age").value,
            cesfam: form.querySelector("#patient-cesfam").value,
            paraMi: form.querySelector('input[name="paraMi"]:checked')?.value || "",
            nombre: form.querySelector("#patient-name").value.trim(),
            apellidos: form.querySelector("#patient-lastname").value.trim(),
            rut: rut,
            telefono: telefono,
            email: form.querySelector("#patient-email").value.trim(),
            direccion: form.querySelector("#patient-address").value.trim(),
            sustancias: Array.from(form.querySelectorAll('input[name="sustancias"]:checked')).map(x=>x.value),
            tiempoConsumo: form.querySelector("#tiempo-consumo").value,
            urgencia: form.querySelector('input[name="urgencia"]:checked')?.value || "",
            tratamientoPrevio: form.querySelector('input[name="tratamientoPrevio"]:checked')?.value || "",
            descripcion: form.querySelector("#patient-description").value.trim(),
            motivacion: form.querySelector("#motivacion-range").value,
            fecha: new Date().toISOString()
        };
        if (!datos.nombre || !datos.apellidos || !datos.rut || !datos.telefono) {
            return window.showNotification("Completa todos los campos obligatorios", "warning");
        }
        if (!window.validarRut || !window.validarRut(datos.rut)) return window.showNotification("RUT inválido", "warning");
        if (!validarTelefonoChileno(datos.telefono)) return window.showNotification("Teléfono inválido", "warning");
        guardarSolicitudAyuda(datos);
    };

    // Actualiza valor motivación
    const motivacionRange = form.querySelector("#motivacion-range");
    const motivacionValue = form.querySelector("#motivacion-value");
    if (motivacionRange && motivacionValue) {
        motivacionRange.addEventListener("input",function(){
            motivacionValue.textContent = this.value;
        });
    }
}

function guardarSolicitudAyuda(datos) {
    const db = window.getFirestore ? window.getFirestore() : null;
    if (!db) {
        window.showNotification && window.showNotification("No se pudo acceder a la base de datos","error");
        return;
    }
    db.collection("solicitudes_ingreso").add(datos)
        .then(function() {
            window.showNotification && window.showNotification("Solicitud enviada correctamente","success");
            document.getElementById("patient-form").reset();
            document.getElementById("patient-modal").style.display = "none";
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error guardando solicitud: "+error.message,"error");
        });
}

function guardarSolicitudInformacion(datos) {
    const db = window.getFirestore ? window.getFirestore() : null;
    if (!db) {
        window.showNotification && window.showNotification("No se pudo acceder a la base de datos","error");
        return;
    }
    db.collection("solicitudes_informacion").add(datos)
        .then(function() {
            window.showNotification && window.showNotification("Solicitud de información enviada correctamente","success");
            document.getElementById("patient-form").reset();
            document.getElementById("patient-modal").style.display = "none";
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error guardando solicitud de información: "+error.message,"error");
        });
}

// Validación RUT robusta (ya está arriba)
function validarRut(rut) {
    if (!rut) return false;
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length < 8 || rut.length > 9) return false;
    let cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1);
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    let dvEsperado = 11 - (suma % 11);
    dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    return dv === dvEsperado;
}
window.validarRut = window.validarRut || validarRut;

// Validación de teléfono chileno robusta (9 dígitos, empieza con 9)
function limpiarTelefonoChileno(tel) {
    tel = tel.replace(/\D/g, '');
    if (tel.startsWith("56")) tel = tel.slice(2);
    if (tel.length === 11 && tel.startsWith("569")) tel = tel.slice(2);
    return tel;
}
function validarTelefonoChileno(telefono) {
    telefono = limpiarTelefonoChileno(telefono);
    return telefono.length === 9 && telefono[0] === "9";
}
window.validarTelefono = validarTelefonoChileno;

window.setupFormularioPaciente = setupFormularioPaciente;
window.guardarSolicitudAyuda = guardarSolicitudAyuda;
window.guardarSolicitudInformacion = guardarSolicitudInformacion;

document.addEventListener("DOMContentLoaded", setupFormularioPaciente);
