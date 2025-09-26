(function() {
    let pacientesTabData = [];
    let miCesfam = null;

    async function obtenerCesfamActual() {
        const user = firebase.auth().currentUser;
        if (!user) return null;
        const db = window.getFirestore();
        const doc = await db.collection('profesionales').doc(user.uid).get();
        return doc.exists ? doc.data().cesfam : null;
    }

    async function extraerYCrearPacientesDesdeCitas() {
        const db = window.getFirestore();
        if (!miCesfam) return [];
        const citasSnap = await db.collection('citas').where('cesfam', '==', miCesfam).get();
        const pacientesMap = {};
        citasSnap.forEach(doc => {
            const cita = doc.data();
            const rut = (cita.pacienteRut || cita.rut || cita.rutPaciente || '').replace(/[.\-]/g, "").toUpperCase();
            const nombre = cita.pacienteNombre || cita.nombre || '';
            if (rut && nombre) {
                pacientesMap[rut] = {
                    rut: rut,
                    nombre: nombre,
                    cesfam: miCesfam,
                    telefono: cita.pacienteTelefono || cita.telefono || '',
                    email: cita.pacienteEmail || cita.email || '',
                    direccion: cita.pacienteDireccion || cita.direccion || '',
                    edad: cita.pacienteEdad || cita.edad || '',
                };
            }
        });

        // Sincroniza con colección 'pacientes'
        for (const rut in pacientesMap) {
            const paciente = pacientesMap[rut];
            const snap = await db.collection('pacientes').where('rut', '==', rut).limit(1).get();
            if (snap.empty) {
                await db.collection('pacientes').add(Object.assign({}, paciente, {
                    fechaRegistro: new Date().toISOString()
                }));
            }
        }
        return Object.values(pacientesMap);
    }

    function renderPacientesGrid(pacientes) {
        const grid = document.getElementById('patients-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (!pacientes.length) {
            grid.innerHTML = "<div class='no-results'>No hay pacientes agendados en este CESFAM.</div>";
            return;
        }
        pacientes.forEach(p => {
            const div = document.createElement('div');
            div.className = 'patient-card';
            div.innerHTML = `
                <div><strong>${p.nombre}</strong></div>
                <div>RUT: ${p.rut}</div>
                <div>Edad: ${p.edad || 'N/A'}</div>
                <div>Tel: ${p.telefono || ''}</div>
                <div>Email: ${p.email || ''}</div>
                <div>Dirección: ${p.direccion || ''}</div>
                <div>CESFAM: ${p.cesfam}</div>
            `;
            grid.appendChild(div);
        });
    }

    async function refrescarPacientesTab() {
        const grid = document.getElementById('patients-grid');
        if (!grid) return;
        grid.innerHTML = "<div class='loading-message'><i class='fas fa-spinner fa-spin'></i> Actualizando pacientes...</div>";
        miCesfam = await obtenerCesfamActual();
        if (!miCesfam) {
            grid.innerHTML = "<div class='no-results'>No tienes CESFAM asignado.</div>";
            return;
        }
        pacientesTabData = await extraerYCrearPacientesDesdeCitas();
        renderPacientesGrid(pacientesTabData);
    }

    document.addEventListener('DOMContentLoaded', refrescarPacientesTab);
    window.loadPatients = refrescarPacientesTab;
})();
