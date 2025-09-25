// UTILIDADES/FORMATO.JS

// Formatea un RUT chileno: 12345678-5 → 12.345.678-5
function formatRUT(rut) {
    if (!rut) return '';
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length < 2) return rut;
    var cuerpo = rut.slice(0, -1);
    var dv = rut.slice(-1);
    var formatted = '';
    for (var i = cuerpo.length - 1, j = 1; i >= 0; i--, j++) {
        formatted = cuerpo[i] + formatted;
        if (j % 3 === 0 && i !== 0) {
            formatted = '.' + formatted;
        }
    }
    return formatted + '-' + dv;
}

// Formatea un teléfono chileno: 912345678 → +56 9 1234 5678
function formatPhoneNumber(phone) {
    if (!phone) return '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.length === 9) {
        return '+56 9 ' + phone.slice(1, 5) + ' ' + phone.slice(5);
    } else if (phone.length === 8) {
        return '+56 2 ' + phone.slice(0, 4) + ' ' + phone.slice(4);
    }
    return phone;
}

// Capitaliza la primera letra de cada palabra
function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, function(l) { return l.toUpperCase(); });
}

// Convierte una fecha ISO (YYYY-MM-DD) a formato DD/MM/AAAA
function formatFecha(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

// Convierte un nombre de centro a sigla (ejemplo simple)
function siglaCentro(nombre) {
    if (!nombre) return '';
    var palabras = nombre.split(' ');
    return palabras.map(function(p) { return p[0]; }).join('').toUpperCase();
}

// Exportar globalmente
window.formatRUT = formatRUT;
window.formatPhoneNumber = formatPhoneNumber;
window.capitalizeWords = capitalizeWords;
window.formatFecha = formatFecha;
window.siglaCentro = siglaCentro;
