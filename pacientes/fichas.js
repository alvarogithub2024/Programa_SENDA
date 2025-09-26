window.verFichaPacienteSenda = function(rut) {
    const db = window.getFirestore();
    const rutLimpio = (rut || '').replace(/[.\-]/g, '').trim();
    db.collection('pacientes').where('rut', '==', rutLimpio).limit(1).get().then(function(snapshot) {
        if (snapshot.empty) {
            window.showNotification && window.showNotification('Paciente no encontrado', 'warning');
            return;
        }
        const pacienteData = Object.assign({ id: snapshot.docs[0].id }, snapshot.docs[0].data());

        let modal = document.getElementById('modal-ficha-paciente');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-ficha-paciente';
            modal.className = 'modal-overlay';
            modal.style.display = 'flex';
            modal.innerHTML = `<div class="modal-content" style="max-width:500px;">
                <span class="close" onclick="cerrarModalFichaPaciente()">&times;</span>
                <div id="modal-ficha-paciente-body"></div>
            </div>`;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }

        const modalBody = document.getElementById('modal-ficha-paciente-body');
        let html = `
            <h3 style="margin-bottom:10px;">${pacienteData.nombre || ''} ${pacienteData.apellidos || ''}</h3>
            <p><b>RUT:</b> ${pacienteData.rut || ''}</p>
            <p><b>Teléfono:</b> ${pacienteData.telefono || ''}</p>
            <p><b>Email:</b> ${pacienteData.email || ''}</p>
            <p><b>Dirección:</b> ${pacienteData.direccion || ''}</p>
            <hr>
            <div id="historial-clinico"><b>Historial clínico:</b><div class="loading-message">Cargando...</div></div>
        `;
        modalBody.innerHTML = html;

        // Espera a que la profesión esté lista antes de renderizar el historial
        esperarProfesionYRenderizar(pacienteData.rut);
    });
};

// Polling para esperar profesionActual
function esperarProfesionYRenderizar(rutPaciente) {
    if (profesionActual === null) {
        setTimeout(() => esperarProfesionYRenderizar(rutPaciente), 200);
        return;
    }
    cargarHistorialClinicoPacientePorRut(rutPaciente);
}
