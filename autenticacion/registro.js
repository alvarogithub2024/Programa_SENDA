// AUTENTICACION/REGISTRO.JS

// Requiere: window.getAuth, window.showNotification, window.validarEmail, window.validarPassword

// Registra un nuevo profesional con email y password
function registrarProfesional(email, password, nombre, apellidos, cesfam, profesion) {
    var auth = window.getAuth();
    if (!auth) {
        window.showNotification && window.showNotification("No se pudo inicializar autenticación", "error");
        return Promise.reject("No se pudo inicializar autenticación");
    }
    if (!window.validarEmail(email)) {
        window.showNotification && window.showNotification("Correo inválido", "warning");
        return Promise.reject("Correo inválido");
    }
    if (!window.validarPassword(password)) {
        window.showNotification && window.showNotification("La contraseña no cumple requisitos", "warning");
        return Promise.reject("Contraseña inválida");
    }
    if (!nombre || !apellidos || !cesfam || !profesion) {
        window.showNotification && window.showNotification("Completa todos los campos", "warning");
        return Promise.reject("Campos incompletos");
    }

    return auth.createUserWithEmailAndPassword(email, password)
        .then(function(cred) {
            var db = window.getFirestore();
            return db.collection("profesionales").doc(cred.user.uid).set({
                email: email,
                nombre: nombre,
                apellidos: apellidos,
                cesfam: cesfam,
                profession: profesion,
                fechaRegistro: new Date().toISOString()
            }).then(function() {
                window.showNotification && window.showNotification("Registro exitoso. Revisa tu correo.", "success");
                // Opcional: enviar email de verificación
                if (cred.user && cred.user.sendEmailVerification) {
                    cred.user.sendEmailVerification();
                }
                return cred.user;
            });
        })
        .catch(function(error) {
            var msg = "Error en el registro";
            if (error.code === "auth/email-already-in-use") {
                msg = "El correo ya está registrado";
            } else if (error.code === "auth/weak-password") {
                msg = "Contraseña muy débil";
            }
            window.showNotification && window.showNotification(msg, "error");
            throw error;
        });
}

// Asignar eventos a formularios en la página
function setupRegistroForm() {
    var form = document.getElementById("registro-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        var email = form.email.value.trim();
        var password = form.password.value;
        var password2 = form.password2.value;
        var nombre = form.nombre.value.trim();
        var apellidos = form.apellidos.value.trim();
        var cesfam = form.cesfam.value;
        var profesion = form.profesion.value;

        if (password !== password2) {
            window.showNotification && window.showNotification("Las contraseñas no coinciden", "warning");
            return;
        }
        registrarProfesional(email, password, nombre, apellidos, cesfam, profesion);
    });
}

// Exportar globalmente
window.registrarProfesional = registrarProfesional;
window.setupRegistroForm = setupRegistroForm;
