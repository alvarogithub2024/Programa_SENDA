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

function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, function(l) { return l.toUpperCase(); });
}

function formatFecha(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

function siglaCentro(nombre) {
    if (!nombre) return '';
    var palabras = nombre.split(' ');
    return palabras.map(function(p) { return p[0]; }).join('').toUpperCase();
}

window.formatRUT = formatRUT;
window.formatPhoneNumber = formatPhoneNumber;
window.capitalizeWords = capitalizeWords;
window.formatFecha = formatFecha;
window.siglaCentro = siglaCentro;
