// AUTENTICACION/SESION.JS

// Estado actual de usuario
var usuarioActual = null;

// Llama a este método tras inicializar Firebase
function setupAuth() {
    if (!window.getAuth) {
        console.error("Firebase Auth no está disponible");
        return;
    }
    var auth = window.getAuth();

    // Escuchar cambios de sesión
    auth.onAuthStateChanged(function(user) {
        usuarioActual = user;
        window.usuarioActual = user;

        if (user) {
            // Usuario autenticado
            document.body.classList.add("usuario-logueado");
            document.body.classList.remove("usuario-desconectado");
            if (window.onUsuarioLogueado) window.onUsuarioLogueado(user);
        } else {
            // Usuario no autenticado
            document.body.classList.remove("usuario-logueado");
            document.body.classList.add("usuario-desconectado");
            if (window.onUsuarioDesconectado) window.onUsuarioDesconectado();
        }
    });
}

// Obtiene el usuario actual (sincronizado)
function getUsuarioActual() {
    return usuarioActual;
}

// Cierra la sesión
function cerrarSesion() {
    var auth = window.getAuth();
    return auth.signOut().then(function() {
        window.showNotification && window.showNotification("Sesión cerrada", "info");
    }).catch(function(error) {
        window.showNotification && window.showNotification("Error al cerrar sesión", "error");
    });
}

// Permite otras funciones reaccionar a login/logout
window.onUsuarioLogueado = null; // function(user) { ... }
window.onUsuarioDesconectado = null; // function() { ... }

// Exportar globalmente
window.setupAuth = setupAuth;
window.getUsuarioActual = getUsuarioActual;
window.cerrarSesion = cerrarSesion;
