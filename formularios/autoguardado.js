// FORMULARIOS/AUTOGUARDADO.JS

// Requiere: window.cacheGuardar, window.cacheObtener, window.cacheEliminar

// Autoguarda el contenido de un formulario en cache local cada cierto tiempo
function habilitarAutoguardadoFormulario(formId, cacheKey, intervaloMs) {
    var form = document.getElementById(formId);
    if (!form) return;
    intervaloMs = intervaloMs || 15000; // 15 segundos por defecto

    // Cargar campos desde cache si existe
    var guardado = window.cacheObtener(cacheKey);
    if (guardado) {
        Object.keys(guardado).forEach(function(campo) {
            if (form[campo]) {
                form[campo].value = guardado[campo];
            }
        });
    }

    // Guardar automáticamente cada intervalo
    var handler = setInterval(function() {
        var datos = {};
        Array.from(form.elements).forEach(function(el) {
            if (el.name && el.type !== "button" && el.type !== "submit") {
                datos[el.name] = el.value;
            }
        });
        window.cacheGuardar(cacheKey, datos, 24 * 60 * 60 * 1000); // 1 día
    }, intervaloMs);

    // Guardar también al salir de la página
    window.addEventListener("beforeunload", function() {
        var datos = {};
        Array.from(form.elements).forEach(function(el) {
            if (el.name && el.type !== "button" && el.type !== "submit") {
                datos[el.name] = el.value;
            }
        });
        window.cacheGuardar(cacheKey, datos, 24 * 60 * 60 * 1000);
    });

    // Permite limpiar el autoguardado (ej: al guardar exitosamente)
    form.addEventListener("reset", function() {
        window.cacheEliminar(cacheKey);
    });
}

// Limpia el autoguardado de un formulario
function limpiarAutoguardadoFormulario(cacheKey) {
    window.cacheEliminar(cacheKey);
}

// Exportar globalmente
window.habilitarAutoguardadoFormulario = habilitarAutoguardadoFormulario;
window.limpiarAutoguardadoFormulario = limpiarAutoguardadoFormulario;
