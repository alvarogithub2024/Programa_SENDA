function generarIdPaciente(rut) {
    if (!rut) return null;
    const rutLimpio = rut.replace(/[.\-]/g, '').toUpperCase();
    return `paciente_${rutLimpio}`;
}

function extraerRutDeId(idPaciente) {
    if (!idPaciente || !idPaciente.startsWith('paciente_')) return null;
    return idPaciente.replace('paciente_', '');
}

function crearOActualizarPaciente(datos, callback) {
    const db = window.getFirestore();
    if (!datos.rut) {
        console.error('No se puede crear paciente sin RUT');
        if (callback) callback(null, new Error('RUT requerido'));
        return;
    }

    const idPaciente = generarIdPaciente(datos.rut);
    const rutLimpio = datos.rut.replace(/[.\-]/g, '').toUpperCase();
    
    const pacienteData = {
        id: idPaciente,
        nombre: datos.nombre || "",
        apellidos: datos.apellidos || "",
        rut: rutLimpio,
        telefono: datos.telefono || "",
        email: datos.email || "",
        direccion: datos.direccion || "",
        cesfam: datos.cesfam || "",
        edad: datos.edad || "",
        sustancias: datos.sustancias || [],
        tiempoConsumo: datos.tiempoConsumo || "",
        urgencia: datos.urgencia || "",
        tratamientoPrevio: datos.tratamientoPrevio || "",
        descripcion: datos.descripcion || "",
        motivacion: datos.motivacion || "",
        paraMi: datos.paraMi || "",
        fechaRegistro: datos.fechaRegistro || datos.fecha || datos.fechaCreacion || new Date().toISOString(),
        fechaUltimaActualizacion: new Date().toISOString(),
        activo: true
    };

    db.collection('pacientes').doc(idPaciente).set(pacienteData, { merge: true })
        .then(() => {
            console.log(`✅ Paciente ${idPaciente} creado/actualizado`);
            if (callback) callback(idPaciente);
        })
        .catch(error => {
            console.error(`❌ Error creando/actualizando paciente ${idPaciente}:`, error);
            if (callback) callback(null, error);
        });
}

function obtenerPacientePorRut(rut, callback) {
    const idPaciente = generarIdPaciente(rut);
    const db = window.getFirestore();
    
    db.collection('pacientes').doc(idPaciente).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                data.id = doc.id;
                callback(data);
            } else {
                callback(null);
            }
        })
        .catch(error => {
            console.error('Error obteniendo paciente:', error);
            callback(null);
        });
}

function crearSolicitudConId(datos, callback) {
    const db = window.getFirestore();
    const idPaciente = generarIdPaciente(datos.rut);
    
    const solicitudData = {
        ...datos,
        idPaciente: idPaciente,
        rutLimpio: datos.rut.replace(/[.\-]/g, '').toUpperCase(),
        fechaCreacion: datos.fecha || new Date().toISOString()
    };

    db.collection('solicitudes_ingreso').add(solicitudData)
        .then(docRef => {
            solicitudData.id = docRef.id;
            
            db.collection('solicitudes_ingreso').doc(docRef.id).update({ 
                id: docRef.id,
                idPaciente: idPaciente 
            });

            crearOActualizarPaciente(datos, (pacienteId, error) => {
                if (error) {
                    console.error('Error creando paciente desde solicitud:', error);
                }
                if (callback) callback(docRef.id, idPaciente);
            });
        })
        .catch(error => {
            console.error('Error creando solicitud:', error);
            if (callback) callback(null, null, error);
        });
}

function crearCitaConId(datos, callback) {
    const db = window.getFirestore();
    const idPaciente = generarIdPaciente(datos.rut || datos.pacienteRut);
    
    const citaData = {
        ...datos,
        idPaciente: idPaciente,
        rutLimpio: (datos.rut || datos.pacienteRut || '').replace(/[.\-]/g, '').toUpperCase(),
        fechaCreacion: datos.fechaCreacion || new Date().toISOString()
    };

    db.collection('citas').add(citaData)
        .then(docRef => {
            citaData.id = docRef.id;
            
            db.collection('citas').doc(docRef.id).update({ 
                id: docRef.id,
                idPaciente: idPaciente 
            });

            crearOActualizarPaciente(datos, (pacienteId, error) => {
                if (error) {
                    console.error('Error actualizando paciente desde cita:', error);
                }
                if (callback) callback(docRef.id, idPaciente);
            });
        })
        .catch(error => {
            console.error('Error creando cita:', error);
            if (callback) callback(null, null, error);
        });
}

function crearAtencionConId(datos, callback) {
    const db = window.getFirestore();
    const idPaciente = generarIdPaciente(datos.pacienteRut);
    
    const atencionData = {
        ...datos,
        idPaciente: idPaciente,
        rutLimpio: datos.pacienteRut.replace(/[.\-]/g, '').toUpperCase(),
        fechaRegistro: datos.fechaRegistro || new Date().toISOString()
    };

    db.collection('atenciones').add(atencionData)
        .then(docRef => {
            atencionData.id = docRef.id;
            
            db.collection('atenciones').doc(docRef.id).update({ 
                id: docRef.id,
                idPaciente: idPaciente 
            });

            if (callback) callback(docRef.id, idPaciente);
        })
        .catch(error => {
            console.error('Error creando atención:', error);
            if (callback) callback(null, null, error);
        });
}

function obtenerHistorialCompletoPaciente(rut, callback) {
    const idPaciente = generarIdPaciente(rut);
    const db = window.getFirestore();
    
    const promises = [
        db.collection('pacientes').doc(idPaciente).get(),
        db.collection('solicitudes_ingreso').where('idPaciente', '==', idPaciente).get(),
        db.collection('citas').where('idPaciente', '==', idPaciente).get(),
        db.collection('atenciones').where('idPaciente', '==', idPaciente).get(),
        db.collection('reingresos').where('idPaciente', '==', idPaciente).get(),
        db.collection('solicitudes_informacion').where('idPaciente', '==', idPaciente).get(),
        db.collection('actualizacion_datos').where('idPaciente', '==', idPaciente).get()
    ];

    Promise.all(promises)
        .then(([pacienteDoc, solicitudesSnap, citasSnap, atencionesSnap, reingresosSnap, infoSnap, actualizacionesSnap]) => {
            const historial = {
                paciente: pacienteDoc.exists ? { id: pacienteDoc.id, ...pacienteDoc.data() } : null,
                solicitudes: [],
                citas: [],
                atenciones: [],
                reingresos: [],
                solicitudesInfo: [],
                actualizaciones: []
            };

            solicitudesSnap.forEach(doc => historial.solicitudes.push({ id: doc.id, ...doc.data() }));
            citasSnap.forEach(doc => historial.citas.push({ id: doc.id, ...doc.data() }));
            atencionesSnap.forEach(doc => historial.atenciones.push({ id: doc.id, ...doc.data() }));
            reingresosSnap.forEach(doc => historial.reingresos.push({ id: doc.id, ...doc.data() }));
            infoSnap.forEach(doc => historial.solicitudesInfo.push({ id: doc.id, ...doc.data() }));
            actualizacionesSnap.forEach(doc => historial.actualizaciones.push({ id: doc.id, ...doc.data() }));

            callback(historial);
        })
        .catch(error => {
            console.error('Error obteniendo historial completo:', error);
            callback(null);
        });
}

window.generarIdPaciente = generarIdPaciente;
window.extraerRutDeId = extraerRutDeId;
window.crearOActualizarPaciente = crearOActualizarPaciente;
window.obtenerPacientePorRut = obtenerPacientePorRut;
window.crearSolicitudConId = crearSolicitudConId;
window.crearCitaConId = crearCitaConId;
window.crearAtencionConId = crearAtencionConId;
window.obtenerHistorialCompletoPaciente = obtenerHistorialCompletoPaciente;
