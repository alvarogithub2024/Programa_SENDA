
function habilitarAutoguardadoFormulario(formId, cacheKey, intervaloMs) {
    var form = document.getElementById(formId);
    if (!form) return;
    intervaloMs = intervaloMs || 15000; 


    var guardado = window.cacheObtener ? window.cacheObtener(cacheKey) : null;
    if (guardado) {
        Object.keys(guardado).forEach(function(campo) {
            if (form[campo]) {
                form[campo].value = guardado[campo];
            }
        });
    }


    var handler = setInterval(function() {
        var datos = {};
        Array.from(form.elements).forEach(function(el) {
            if (el.name && el.type !== "button" && el.type !== "submit") {
                datos[el.name] = el.value;
            }
        });
        if (window.cacheGuardar) window.cacheGuardar(cacheKey, datos, 24 * 60 * 60 * 1000); 
    }, intervaloMs);

    window.addEventListener("beforeunload", function() {
        var datos = {};
        Array.from(form.elements).forEach(function(el) {
            if (el.name && el.type !== "button" && el.type !== "submit") {
                datos[el.name] = el.value;
            }
        });
        if (window.cacheGuardar) window.cacheGuardar(cacheKey, datos, 24 * 60 * 60 * 1000);
    });


    form.addEventListener("reset", function() {
        if (window.cacheEliminar) window.cacheEliminar(cacheKey);
    });
}


function limpiarAutoguardadoFormulario(cacheKey) {
    if (window.cacheEliminar) window.cacheEliminar(cacheKey);
}


window.habilitarAutoguardadoFormulario = habilitarAutoguardadoFormulario;
window.limpiarAutoguardadoFormulario = limpiarAutoguardadoFormulario;
