var memoriaCache = {};

function cacheGuardar(clave, valor, duracionMs) {
    var ahora = Date.now();
    memoriaCache[clave] = { valor: valor, expiracion: duracionMs ? ahora + duracionMs : null };
    try {
        var obj = { valor: valor, expiracion: duracionMs ? ahora + duracionMs : null };
        localStorage.setItem("cache_" + clave, JSON.stringify(obj));
    } catch (e) {
    }
}

function cacheObtener(clave) {
    var ahora = Date.now();
    if (memoriaCache[clave]) {
        var dato = memoriaCache[clave];
        if (!dato.expiracion || dato.expiracion > ahora) {
            return dato.valor;
        } else {
            delete memoriaCache[clave];
        }
    }
    
    try {
        var guardado = localStorage.getItem("cache_" + clave);
        if (guardado) {
            var obj = JSON.parse(guardado);
            if (!obj.expiracion || obj.expiracion > ahora) {
                memoriaCache[clave] = obj;
                return obj.valor;
            } else {
                localStorage.removeItem("cache_" + clave);
            }
        }
    } catch (e) { }
    return null;
}

function cacheEliminar(clave) {
    delete memoriaCache[clave];
    try { localStorage.removeItem("cache_" + clave); } catch (e) {}
}

function cacheLimpiarTodo() {
    memoriaCache = {};
    try {
        Object.keys(localStorage)
            .filter(function(clave) { return clave.startsWith("cache_"); })
            .forEach(function(clave) { localStorage.removeItem(clave); });
    } catch (e) {}
}

window.cacheGuardar = cacheGuardar;
window.cacheObtener = cacheObtener;
window.cacheEliminar = cacheEliminar;
window.cacheLimpiarTodo = cacheLimpiarTodo;
