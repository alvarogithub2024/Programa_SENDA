// ========== SISTEMA DE ID UNIFICADO PARA PACIENTES - SENDA ==========
// Este archivo debe ir en: utilidades/sistema-id-unificado.js

/**
 * Sistema para mantener consistencia de IDs entre todas las colecciones
 * Todas las colecciones usarán la misma ID del paciente para garantizar trazabilidad
 */

// ========== CONFIGURACIÓN DE COLECCIONES ==========
const COLECCIONES_SISTEMA = {
    PACIENTES: "pacientes",
    CITAS: "citas", 
    ATENCIONES: "atenciones",
    SOLICITUDES_INGRESO: "solicitudes_ingreso",
    REINGRESOS: "reingresos",
    SOLICITUDES_INFO: "solicitudes_informacion",
    ACTUALIZACION_DATOS: "actualizacion_datos"
};

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Crea o obtiene un ID de paciente basado en RUT
 * Este será el ID maestro usado en todas las colecciones
 */
async function obtenerIdPaciente(rut, nombre = '', apellidos = '') {
    if (!rut) {
        throw new Error('RUT es requerido para obtener ID del paciente');
    }
    
    const rutLimpio = limpiarRUT(rut);
    const db = window.getFirestore();
    
    try {
        // Buscar si ya existe un paciente con este RUT
        const querySnapshot = await db.collection(COLECCIONES_SISTEMA.PACIENTES)
            .where("rut", "==", rutLimpio)
            .limit(1)
            .get();
        
        if (!querySnapshot.empty) {
            // Paciente ya existe, retornar su ID
            const pacienteDoc = querySnapshot.docs[0];
            const pacienteId = pacienteDoc.id;
            console.log(`✅ Paciente existente encontrado: ${pacienteId} (RUT: ${rutLimpio})`);
            return pacienteId;
        } else {
            // Crear nuevo paciente y retornar su ID
            const nuevoPaciente = {
                rut: rutLimpio,
                nombre: nombre || '',
                apellidos: apellidos || '',
                fechaCreacion: new Date().toISOString(),
                fechaRegistro: window.getServerTimestamp ? window.getServerTimestamp() : new Date(),
                estado: 'activo'
            };
            
            const docRef = await db.collection(COLECCIONES_SISTEMA.PACIENTES).add(nuevoPaciente);
            console.log(`✅ Nuevo paciente creado: ${docRef.id} (RUT: ${rutLimpio})`);
            return docRef.id;
        }
    } catch (error) {
        console.error('❌ Error obteniendo ID del paciente:', error);
        throw error;
    }
}

/**
 * Actualiza o crea registro en la colección pacientes con datos completos
 */
async function sincronizarDatosPaciente(pacienteId, datosPaciente) {
    const db = window.getFirestore();
    
    try {
        const datosLimpios = {
            ...datosPaciente,
            rut: limpiarRUT(datosPaciente.rut || ''),
            fechaUltimaActualizacion: new Date().toISOString()
        };
        
        // Usar merge para no sobrescribir datos existentes
        await db.collection(COLECCIONES_SISTEMA.PACIENTES).doc(pacienteId).set(datosLimpios, { merge: true });
        
        console.log(`✅ Datos del paciente sincronizados: ${pacienteId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sincronizando datos del paciente:', error);
        throw error;
    }
}

// ========== FUNCIONES PARA CADA COLECCIÓN ==========

/**
 * Crear solicitud de ingreso con ID unificado
 */
async function crearSolicitudIngreso(datosSolicitud) {
    const pacienteId = await obtenerIdPaciente(
        datosSolicitud.rut, 
        datosSolicitud.nombre, 
        datosSolicitud.apellidos
    );
    
    // Sincronizar datos completos del paciente
    await sincronizarDatosPaciente(pacienteId, datosSolicitud);
    
    // Crear solicitud con referencia al paciente
    const db = window.getFirestore();
    const solicitudConId = {
        ...datosSolicitud,
        pacienteId: pacienteId,
        rut: limpiarRUT(datosSolicitud.rut),
        fechaCreacion: new Date().toISOString(),
        estado: datosSolicitud.estado || 'pendiente'
    };
    
    const docRef = await db.collection(COLECCIONES_SISTEMA.SOLICITUDES_INGRESO).add(solicitudConId);
    console.log(`✅ Solicitud de ingreso creada: ${docRef.id} para paciente: ${pacienteId}`);
    
    return { solicitudId: docRef.id, pacienteId: pacienteId };
}

/**
 * Crear cita con ID unificado
 */
async function crearCitaUnificada(datosCita) {
    const pacienteId = await obtenerIdPaciente(
        datosCita.pacienteRut || datosCita.rut, 
        datosCita.pacienteNombre || datosCita.nombre,
        datosCita.apellidos
    );
    
    // Sincronizar datos del paciente
    await sincronizarDatosPaciente(pacienteId, {
        nombre: datosCita.pacienteNombre || datosCita.nombre,
        apellidos: datosCita.apellidos || '',
        rut: datosCita.pacienteRut || datosCita.rut,
        telefono: datosCita.telefono || '',
        email: datosCita.email || '',
        direccion: datosCita.direccion || '',
        cesfam: datosCita.cesfam || '',
        edad: datosCita.edad || ''
    });
    
    const db = window.getFirestore();
    const citaConId = {
        ...datosCita,
        pacienteId: pacienteId,
        pacienteRut: limpiarRUT(datosCita.pacienteRut || datosCita.rut),
        fechaCreacion: new Date().toISOString(),
        estado: datosCita.estado || 'agendada'
    };
    
    const docRef = await db.collection(COLECCIONES_SISTEMA.CITAS).add(citaConId);
    console.log(`✅ Cita creada: ${docRef.id} para paciente: ${pacienteId}`);
    
    return { citaId: docRef.id, pacienteId: pacienteId };
}

/**
 * Crear atención con ID unificado
 */
async function crearAtencionUnificada(datosAtencion) {
    let pacienteId;
    
    // Si ya viene el pacienteId, usarlo; si no, obtenerlo por RUT
    if (datosAtencion.pacienteId) {
        pacienteId = datosAtencion.pacienteId;
    } else {
        pacienteId = await obtenerIdPaciente(
            datosAtencion.pacienteRut || datosAtencion.rut,
            datosAtencion.pacienteNombre || datosAtencion.nombre,
            ''
        );
    }
    
    // Sincronizar datos del paciente
    await sincronizarDatosPaciente(pacienteId, {
        nombre: datosAtencion.pacienteNombre || datosAtencion.nombre,
        rut: datosAtencion.pacienteRut || datosAtencion.rut,
        cesfam: datosAtencion.cesfam || ''
    });
    
    const db = window.getFirestore();
    const atencionConId = {
        ...datosAtencion,
        pacienteId: pacienteId,
        pacienteRut: limpiarRUT(datosAtencion.pacienteRut || datosAtencion.rut),
        fechaRegistro: datosAtencion.fechaRegistro || new Date().toISOString()
    };
    
    const docRef = await db.collection(COLECCIONES_SISTEMA.ATENCIONES).add(atencionConId);
    console.log(`✅ Atención creada: ${docRef.id} para paciente: ${pacienteId}`);
    
    return { atencionId: docRef.id, pacienteId: pacienteId };
}

/**
 * Crear reingreso con ID unificado
 */
async function crearReingresoUnificado(datosReingreso) {
    const pacienteId = await obtenerIdPaciente(
        datosReingreso.rut,
        datosReingreso.nombre,
        ''
    );
    
    // Sincronizar datos del paciente
    await sincronizarDatosPaciente(pacienteId, {
        nombre: datosReingreso.nombre,
        rut: datosReingreso.rut,
        telefono: datosReingreso.telefono,
        cesfam: datosReingreso.cesfam
    });
    
    const db = window.getFirestore();
    const reingresoConId = {
        ...datosReingreso,
        pacienteId: pacienteId,
        rut: limpiarRUT(datosReingreso.rut),
        fechaCreacion: datosReingreso.fechaCreacion || new Date().toISOString(),
        estado: datosReingreso.estado || 'pendiente'
    };
    
    const docRef = await db.collection(COLECCIONES_SISTEMA.REINGRESOS).add(reingresoConId);
    console.log(`✅ Reingreso creado: ${docRef.id} para paciente: ${pacienteId}`);
    
    return { reingresoId: docRef.id, pacienteId: pacienteId };
}

// ========== FUNCIONES DE CONSULTA ==========

/**
 * Obtener todos los registros de un paciente en todas las colecciones
 */
async function obtenerHistorialCompletoPaciente(pacienteId) {
    const db = window.getFirestore();
    
    try {
        const [
            solicitudesSnap,
            citasSnap,
            atencionesSnap,
            reingresosSnap
        ] = await Promise.all([
            db.collection(COLECCIONES_SISTEMA.SOLICITUDES_INGRESO).where("pacienteId", "==", pacienteId).get(),
            db.collection(COLECCIONES_SISTEMA.CITAS).where("pacienteId", "==", pacienteId).get(),
            db.collection(COLECCIONES_SISTEMA.ATENCIONES).where("pacienteId", "==", pacienteId).get(),
            db.collection(COLECCIONES_SISTEMA.REINGRESOS).where("pacienteId", "==", pacienteId).get()
        ]);
        
        const historial = {
            pacienteId: pacienteId,
            solicitudes: [],
            citas: [],
            atenciones: [],
            reingresos: []
        };
        
        solicitudesSnap.forEach(doc => {
            historial.solicitudes.push({ id: doc.id, ...doc.data() });
        });
        
        citasSnap.forEach(doc => {
            historial.citas.push({ id: doc.id, ...doc.data() });
        });
        
        atencionesSnap.forEach(doc => {
            historial.atenciones.push({ id: doc.id, ...doc.data() });
        });
        
        reingresosSnap.forEach(doc => {
            historial.reingresos.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Historial completo obtenido para paciente: ${pacienteId}`);
        return historial;
        
    } catch (error) {
        console.error('❌ Error obteniendo historial del paciente:', error);
        throw error;
    }
}

/**
 * Buscar paciente por RUT y obtener su ID
 */
async function buscarPacientePorRUT(rut) {
    const rutLimpio = limpiarRUT(rut);
    const db = window.getFirestore();
    
    try {
        const querySnapshot = await db.collection(COLECCIONES_SISTEMA.PACIENTES)
            .where("rut", "==", rutLimpio)
            .limit(1)
            .get();
        
        if (!querySnapshot.empty) {
            const pacienteDoc = querySnapshot.docs[0];
            return {
                id: pacienteDoc.id,
                ...pacienteDoc.data()
            };
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error buscando paciente por RUT:', error);
        throw error;
    }
}

// ========== FUNCIONES DE UTILIDAD ==========

function limpiarRUT(rut) {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

function validarDatosMinimos(datos) {
    if (!datos.rut) {
        throw new Error('RUT es requerido');
    }
    
    if (!datos.nombre && !datos.pacienteNombre) {
        throw new Error('Nombre es requerido');
    }
    
    return true;
}

// ========== FUNCIONES DE MIGRACIÓN ==========

/**
 * Migrar registros existentes al sistema unificado
 * USAR SOLO UNA VEZ PARA MIGRAR DATOS EXISTENTES
 */
async function migrarDatosExistentes() {
    console.log('🔄 Iniciando migración de datos existentes...');
    
    const db = window.getFirestore();
    let migracionesExitosas = 0;
    let errores = 0;
    
    try {
        // Migrar solicitudes de ingreso
        const solicitudesSnap = await db.collection(COLECCIONES_SISTEMA.SOLICITUDES_INGRESO).get();
        
        for (const solicitudDoc of solicitudesSnap.docs) {
            try {
                const solicitud = solicitudDoc.data();
                
                if (!solicitud.pacienteId && solicitud.rut) {
                    const pacienteId = await obtenerIdPaciente(
                        solicitud.rut,
                        solicitud.nombre || '',
                        solicitud.apellidos || ''
                    );
                    
                    await sincronizarDatosPaciente(pacienteId, solicitud);
                    
                    await db.collection(COLECCIONES_SISTEMA.SOLICITUDES_INGRESO)
                        .doc(solicitudDoc.id)
                        .update({ pacienteId: pacienteId });
                    
                    migracionesExitosas++;
                    console.log(`✅ Solicitud migrada: ${solicitudDoc.id} -> Paciente: ${pacienteId}`);
                }
            } catch (error) {
                errores++;
                console.error(`❌ Error migrando solicitud ${solicitudDoc.id}:`, error);
            }
        }
        
        console.log(`🎉 Migración completada: ${migracionesExitosas} exitosas, ${errores} errores`);
        
    } catch (error) {
        console.error('❌ Error general en migración:', error);
    }
}

// ========== EXPORTS ==========

// Hacer funciones disponibles globalmente
window.SISTEMA_ID_UNIFICADO = {
    obtenerIdPaciente,
    sincronizarDatosPaciente,
    crearSolicitudIngreso,
    crearCitaUnificada,
    crearAtencionUnificada,
    crearReingresoUnificado,
    obtenerHistorialCompletoPaciente,
    buscarPacientePorRUT,
    migrarDatosExistentes
};

// Exports individuales
window.obtenerIdPaciente = obtenerIdPaciente;
window.sincronizarDatosPaciente = sincronizarDatosPaciente;
window.crearSolicitudIngreso = crearSolicitudIngreso;
window.crearCitaUnificada = crearCitaUnificada;
window.crearAtencionUnificada = crearAtencionUnificada;
window.crearReingresoUnificado = crearReingresoUnificado;
window.obtenerHistorialCompletoPaciente = obtenerHistorialCompletoPaciente;
window.buscarPacientePorRUT = buscarPacientePorRUT;

console.log('🔗 Sistema de ID unificado cargado correctamente');
