// Exportar UNA solicitud a CSV
function exportarSolicitudCSV(solicitud) {
    const dataToExport = [{
        'Nombre Completo': `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`,
        'RUT': solicitud.rut || '',
        'Edad': solicitud.edad || '',
        'Teléfono': solicitud.telefono || '',
        'Email': solicitud.email || '',
        'CESFAM': solicitud.cesfam || '',
        'Estado': solicitud.estado || '',
        'Prioridad': solicitud.prioridad || '',
        'Sustancias': Array.isArray(solicitud.sustancias) ? solicitud.sustancias.join(', ') : 'No especificado',
        'Fecha Creación': solicitud.fechaCreacion ? new Date(solicitud.fechaCreacion).toLocaleDateString('es-CL') : '',
        'Descripción': solicitud.descripcion || 'Sin descripción',
        'Motivación (1-10)': solicitud.motivacion || '',
        'Tiempo de Consumo': solicitud.tiempoConsumo || '',
        'Tratamiento Previo': solicitud.tratamientoPrevio === 'si' ? 'Sí' : 'No'
    }];
    const csvContent = convertToCSV(dataToExport);
    const filename = `solicitud_${solicitud.id}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    descargarCSV(csvContent, filename);
    window.showNotification && window.showNotification(`Solicitud exportada: ${filename}`, 'success');
}

// Exportar TODAS las solicitudes filtradas a CSV
function exportarSolicitudesCSV(solicitudes) {
    const dataToExport = solicitudes.map(solicitud => ({
        // ...igual que arriba, pero en un array
    }));
    const filename = `solicitudes_senda_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    const csvContent = convertToCSV(dataToExport);
    descargarCSV(csvContent, filename);
    window.showNotification && window.showNotification(`Solicitudes exportadas: ${filename}`, 'success');
}

function convertToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let j = 0; j < headers.length; j++) {
            if (j > 0) line += ',';
            line += `"${array[i][headers[j]]}"`;
        }
        str += line + '\r\n';
    }
    return str;
}

function descargarCSV(contenido, nombreArchivo) {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.exportarSolicitudCSV = exportarSolicitudCSV;
window.exportarSolicitudesCSV = exportarSolicitudesCSV;
