// Ejecutar en consola del navegador para migrar datos existentes
async function ejecutarMigracionCompleta() {
    console.log('🚀 Iniciando migración completa del sistema SENDA...');
    
    if (!window.getFirestore || !window.generarIdPaciente) {
        console.error('❌ Sistema de ID unificado no está disponible');
        return;
    }

    const db = window.getFirestore();
    let contadores = {
        pacientes: 0,
        solicitudes: 0,
        citas: 0,
        atenciones: 0,
        reingresos: 0,
        solicitudesInfo: 0
    };

    try {
        // 1. Migrar pacientes existentes
        console.log('📋 Migrando pacientes...');
        const pacientesSnapshot = await db.collection('pacientes').get();
        for (const doc of pacientesSnapshot.docs) {
            const data = doc.data();
            if (data.rut && !doc.id.startsWith('paciente_')) {
                const nuevoId = window.generarIdPaciente(data.rut);
                await db.collection('pacientes').doc(nuevoId).set({
                    ...data,
                    id: nuevoId,
                    rutLimpio: data.rut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString(),
                    migradoDesde: doc.id
                });
                contadores.pacientes++;
                console.log(`✅ Paciente migrado: ${doc.id} → ${nuevoId}`);
            }
        }

        // 2. Migrar solicitudes de ingreso
        console.log('📝 Migrando solicitudes de ingreso...');
        const solicitudesSnapshot = await db.collection('solicitudes_ingreso').get();
        for (const doc of solicitudesSnapshot.docs) {
            const data = doc.data();
            if (data.rut && !data.idPaciente) {
                const idPaciente = window.generarIdPaciente(data.rut);
                await db.collection('solicitudes_ingreso').doc(doc.id).update({
                    idPaciente: idPaciente,
                    rutLimpio: data.rut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString()
                });
                contadores.solicitudes++;
                console.log(`✅ Solicitud migrada: ${doc.id} → ${idPaciente}`);
            }
        }

        // 3. Migrar citas
        console.log('📅 Migrando citas...');
        const citasSnapshot = await db.collection('citas').get();
        for (const doc of citasSnapshot.docs) {
            const data = doc.data();
            const rut = data.rut || data.pacienteRut;
            if (rut && !data.idPaciente) {
                const idPaciente = window.generarIdPaciente(rut);
                await db.collection('citas').doc(doc.id).update({
                    idPaciente: idPaciente,
                    rutLimpio: rut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString()
                });
                contadores.citas++;
                console.log(`✅ Cita migrada: ${doc.id} → ${idPaciente}`);
            }
        }

        // 4. Migrar atenciones
        console.log('🏥 Migrando atenciones...');
        const atencionesSnapshot = await db.collection('atenciones').get();
        for (const doc of atencionesSnapshot.docs) {
            const data = doc.data();
            if (data.pacienteRut && !data.idPaciente) {
                const idPaciente = window.generarIdPaciente(data.pacienteRut);
                await db.collection('atenciones').doc(doc.id).update({
                    idPaciente: idPaciente,
                    rutLimpio: data.pacienteRut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString()
                });
                contadores.atenciones++;
                console.log(`✅ Atención migrada: ${doc.id} → ${idPaciente}`);
            }
        }

        // 5. Migrar reingresos
        console.log('🔄 Migrando reingresos...');
        const reingresosSnapshot = await db.collection('reingresos').get();
        for (const doc of reingresosSnapshot.docs) {
            const data = doc.data();
            if (data.rut && !data.idPaciente) {
                const idPaciente = window.generarIdPaciente(data.rut);
                await db.collection('reingresos').doc(doc.id).update({
                    idPaciente: idPaciente,
                    rutLimpio: data.rut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString()
                });
                contadores.reingresos++;
                console.log(`✅ Reingreso migrado: ${doc.id} → ${idPaciente}`);
            }
        }

        // 6. Migrar solicitudes de información (si tienen RUT asociado)
        console.log('ℹ️ Migrando solicitudes de información...');
        const solicitudesInfoSnapshot = await db.collection('solicitudes_informacion').get();
        for (const doc of solicitudesInfoSnapshot.docs) {
            const data = doc.data();
            if (data.rut && !data.idPaciente) {
                const idPaciente = window.generarIdPaciente(data.rut);
                await db.collection('solicitudes_informacion').doc(doc.id).update({
                    idPaciente: idPaciente,
                    rutLimpio: data.rut.replace(/[.\-]/g, '').toUpperCase(),
                    fechaMigracion: new Date().toISOString()
                });
                contadores.solicitudesInfo++;
                console.log(`✅ Solicitud info migrada: ${doc.id} → ${idPaciente}`);
            }
        }

        // Crear registro de migración
        await db.collection('migraciones').add({
            fecha: new Date().toISOString(),
            tipo: 'migracion_completa_sistema_id',
            contadores: contadores,
            version: '1.0',
            completada: true
        });

        console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('📊 Resumen de migración:', contadores);
        console.log('💡 Todos los datos ahora están vinculados por ID de paciente');
        
        return contadores;

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        
        // Crear registro de error
        await db.collection('migraciones').add({
            fecha: new Date().toISOString(),
            tipo: 'migracion_completa_sistema_id',
            error: error.message,
            contadores: contadores,
            completada: false
        });
        
        throw error;
    }
}

// Función para verificar el estado de la migración
async function verificarMigracion() {
    console.log('🔍 Verificando estado de la migración...');
    
    const db = window.getFirestore();
    const collections = ['pacientes', 'solicitudes_ingreso', 'citas', 'atenciones', 'reingresos'];
    
    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).limit(5).get();
        console.log(`\n📋 ${collectionName.toUpperCase()}:`);
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const tieneIdPaciente = !!data.idPaciente;
            const tieneRutLimpio = !!data.rutLimpio;
            const rut = data.rut || data.pacienteRut;
            
            console.log(`  ${doc.id}:`, {
                rut: rut ? rut.substring(0, 8) + '...' : 'Sin RUT',
                idPaciente: tieneIdPaciente ? '✅' : '❌',
                rutLimpio: tieneRutLimpio ? '✅' : '❌'
            });
        });
    }
}

// Función para probar el historial completo de un paciente
async function probarHistorialPaciente(rut) {
    console.log(`🔍 Probando historial completo para RUT: ${rut}`);
    
    if (!window.obtenerHistorialCompletoPaciente) {
        console.error('❌ Función obtenerHistorialCompletoPaciente no disponible');
        return;
    }

    window.obtenerHistorialCompletoPaciente(rut, function(historial) {
        if (historial) {
            console.log('📋 Historial completo obtenido:', {
                paciente: historial.paciente ? '✅' : '❌',
                solicitudes: historial.solicitudes.length,
                citas: historial.citas.length,
                atenciones: historial.atenciones.length,
                reingresos: historial.reingresos.length,
                solicitudesInfo: historial.solicitudesInfo.length,
                actualizaciones: historial.actualizaciones.length;
