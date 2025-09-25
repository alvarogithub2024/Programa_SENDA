// AUTENTICACION/LOGIN.JS

// Requiere: window.getAuth, window.showNotification

// Realiza login con email y password
function loginProfesional(email, password) {
    var auth = window.getAuth();
    if (!auth) {
        window.showNotification && window.showNotification("No se pudo inicializar autenticación", "error");
        return;
    }
    window.showNotification && window.showNotification("Iniciando sesión...", "info");

    return auth.signInWithEmailAndPassword(email, password)
        .then(function(cred) {
            window.showNotification && window.showNotification("¡Bienvenido, sesión iniciada!", "success");
            return cred.user;
        })
        .catch(function(error) {
            var msg = "Error de inicio de sesión";
            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
                msg = "Correo o contraseña incorrectos";
            } else if (error.code === "auth/too-many-requests") {
                msg = "Demasiados intentos fallidos. Intenta más tarde.";
            }
            window.showNotification && window.showNotification(msg, "error");
            throw error;
        });
}

// Permite login con Google (si está habilitado)
function loginProfesionalGoogle() {
    var auth = window.getAuth();
    if (!auth || !firebase.auth.GoogleAuthProvider) {
        window.showNotification && window.showNotification("No se pudo inicializar autenticación Google", "error");
        return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider)
        .then(function(result) {
            window.showNotification && window.showNotification("¡Sesión iniciada con Google!", "success");
            return result.user;
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error con Google: " + error.message, "error");
            throw error;
        });
}

// Recuperación de contraseña
function recuperarPassword(email) {
    var auth = window.getAuth();
    if (!auth) {
        window.showNotification && window.showNotification("No se pudo inicializar autenticación", "error");
        return;
    }
    return auth.sendPasswordResetEmail(email)
        .then(function() {
            window.showNotification && window.showNotification("Correo de recuperación enviado", "success");
        })
        .catch(function(error) {
            window.showNotification && window.showNotification("Error enviando recuperación: " + error.message, "error");
            throw error;
        });
}

// Asignar eventos a formularios en la página
function setupLoginForm() {
    var form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        var email = form.email.value.trim();
        var password = form.password.value;
        loginProfesional(email, password);
    });

    var googleBtn = document.getElementById("login-google-btn");
    if (googleBtn) {
        googleBtn.addEventListener("click", function(e) {
            e.preventDefault();
            loginProfesionalGoogle();
        });
    }

    var recuperarBtn = document.getElementById("recuperar-password-btn");
    if (recuperarBtn) {
        recuperarBtn.addEventListener("click", function(e) {
            e.preventDefault();
            var email = form.email.value.trim();
            if (!window.validarEmail || !window.validarEmail(email)) {
                window.showNotification && window.showNotification("Ingresa un correo válido", "warning");
                return;
            }
            recuperarPassword(email);
        });
    }
}

// Exportar globalmente
window.loginProfesional = loginProfesional;
window.loginProfesionalGoogle = loginProfesionalGoogle;
window.recuperarPassword = recuperarPassword;
window.setupLoginForm = setupLoginForm;
