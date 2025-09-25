// FORMULARIOS/FORMULARIO-PACIENTE.JS

// ---- Multi-step del formulario ----
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
    mostrarPaso(0);

    // Navegación
    form.querySelector("#next-step-1").onclick = function() {
        // Validar primer paso
        const tipo = form.querySelector('input[name="tipoSolicitud"]:checked');
        const edad = form.querySelector("#patient-age").value;
        const cesfam = form.querySelector("#patient-cesfam").value;
        if (!tipo) return window.showNotification("Selecciona tipo de solicitud","warning");
        if (tipo.value === "informacion") {
            const email = form.querySelector("#info-email").value.trim();
            if (!window.validarEmail || !window.validarEmail(email)) {
                return window.showNotification("Ingresa un correo válido para recibir información", "warning");
            }
        } else {
            if (!edad || isNaN(edad) || edad < 12) return window.showNotification("Edad mínima 12 años","warning");
            if (!cesfam) return window.showNotification("Selecciona un CESFAM","warning");
        }
        mostrarPaso(1);
    };
    form.querySelector("#next-step-2").onclick = function() {
        // Validar segundo paso
        const nombre = form.querySelector("#patient-name").value.trim();
        const apellidos = form.querySelector("#patient-lastname").value.trim();
        const rut = form.querySelector("#patient-rut").value.trim();
        const tel = form.querySelector("#patient-phone").value.trim();
        if (!nombre || !apellidos) return window.showNotification("Nombre y apellidos requeridos", "warning");
        if (!window.validarRut || !window.validarRut(rut)) return window.showNotification("RUT inválido", "warning");
        if (!window.validarTelefono || !window.validarTelefono(tel)) return window.showNotification("Teléfono inválido","warning");
        mostrarPaso(2);
    };
    form.querySelector("#next-step-3").onclick = function() {
        // Validar tercer paso (mínimo una sustancia seleccionada)
        const su = form.querySelectorAll('input[name="sustancias"]:checked');
        const urg = form.querySelector('input[name="urgencia"]:checked');
        const trat = form.querySelector('input[name="tratamientoPrevio"]:checked');
        if (!su.length) return window.showNotification("Selecciona al menos una sustancia","warning");
        if (!urg) return window.showNotification("Selecciona nivel de urgencia","warning");
        if (!trat) return window.showNotification("Indica si hubo tratamiento previo","warning");
        mostrarPaso(3);
    };

    // Previos
    ["#prev-step-2","#prev-step-3","#prev-step-4"].forEach((sel,idx) => {
        const btn = form.querySelector(sel);
        if (btn) btn.onclick = ()=>mostrarPaso(idx);
    });

    // Mostrar campo correo en "Solo información"
    const tipoSolicitudRadios = form.querySelectorAll('input[name="tipoSolicitud"]');
    tipoSolicitudRadios.forEach(radio=>{
        radio.addEventListener("change",function(){
            const infoContainer = form.querySelector("#info-email-container");
            const basicInfo = form.querySelector("#basic-info-container");
            if (radio.value === "informacion" && radio.checked) {
                infoContainer.style.display = "";
                basicInfo.style.display = "none";
            } else if (radio.value === "identificado" && radio.checked) {
                infoContainer.style.display = "none";
                basicInfo.style.display = "";
            }
        });
    });

    // Submit final
    form.onsubmit = function(e) {
        e.preventDefault();

        // Recolectar datos según tipo de solicitud
        const tipo = form.querySelector('input[name="tipoSolicitud"]:checked');
        if (!tipo) return window.showNotification("Selecciona un tipo de solicitud","warning");

        // Solo información
        if (tipo.value === "informacion") {
            const email = form.querySelector("#info-email").value.trim();
            if (!window.validarEmail || !window.validarEmail(email)) {
                return window.showNotification("Ingresa un correo válido para recibir información", "warning");
            }
            // Guardar en Firebase
            guardarSolicitudAyuda({
                tipo: "solo_informacion",
                email: email,
                fecha: new Date().toISOString()
            });
            return;
        }

        // Solicitud identificada
        const datos = {
            tipo: "identificado",
            edad: form.querySelector("#patient-age").value,
            cesfam: form.querySelector("#patient-cesfam").value,
            paraMi: form.querySelector('input[name="paraMi"]:checked')?.value || "",
            nombre: form.querySelector("#patient-name").value.trim(),
            apellidos: form.querySelector("#patient-lastname").value.trim(),
            rut: form.querySelector("#patient-rut").value.trim(),
            telefono: form.querySelector("#patient-phone").value.trim(),
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
        // Validaciones mínimas
        if (!datos.nombre || !datos.apellidos || !datos.rut || !datos.telefono) {
            return window.showNotification("Completa todos los campos obligatorios", "warning");
        }
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

// Guarda la solicitud en Firebase
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

// Exportar globalmente
window.setupFormularioPaciente = setupFormularioPaciente;
window.guardarSolicitudAyuda = guardarSolicitudAyuda;

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", setupFormularioPaciente);
