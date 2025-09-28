class SistemaEnlaceFirebase {
    constructor() {
        this.db = window.getFirestore();
        this.cache = new Map();
    }

    async sincronizarTodo(rut, datosNuevos, origen = 'desconocido') {
        try {
            const rutLimpio = this.limpiarRut(rut);
            if (!rutLimpio) return false;

            console.log(`🔄 Sincronizando datos para RUT: ${rutLimpio}, origen: ${origen}`);

            const datosExistentes = await this.obtenerTodosLosDatos(rutLimpio);
            const datosFusionados = this.fusionarDatos(datosExistentes, datosNuevos, origen);
            await this.actualizarTodasLasColecciones(rutLimpio, datosFusionados);
            
            console.log(`✅ Sincronización completa para ${rutLimpio}`);
            return true;

        } catch (error) {
            console.error(`❌ Error en sincronización:`, error);
            return false;
        }
    }

    async obtenerTodosLosDatos(rutLimpio) {
        const datos = {
            paciente: null,
            solicitudes: [],
            citas: [],
            atenciones: [],
            reingresos: []
        };

        try {
            const pacienteQuery = await this.db.collection("pacientes")
                .where("rut", "==", rutLimpio).limit(1).get();
            if (!pacienteQuery.empty) {
                datos.paciente = { id: pacienteQuery.docs[0].id, ...pacienteQuery.docs[0].data() };
            }

            const solicitudesQuery = await this.db.collection("solicitudes_ingreso")
                .where("rut", "==", rutLimpio).get();
            solicitudesQuery.forEach(doc => {
                datos.solicitudes.push({ id: doc.id, ...doc.data() });
            });

            const reingresosQuery = await this.db.collection("reingresos")
                .where("rut", "==", rutLimpio).get();
            reingresosQuery.forEach(doc => {
                datos.reingresos.push({ id: doc.id, ...doc.data() });
            });

            const citasQuery = await this.db.collection("citas")
                .where("pacienteRut", "==", rutLimpio).get();
            citasQuery.forEach(doc => {
                datos.citas.push({ id: doc.id, ...doc.data() });
            });

            const citasQuery2 = await this.db.collection("citas")
                .where("rut", "==", rutLimpio).get();
            citasQuery2.forEach(doc => {
                const citaData = { id: doc.id, ...doc.data() };
                if (!datos.citas.find(c => c.id === citaData.id)) {
                    datos.citas.push(citaData);
                }
            });

            const atencionesQuery = await this.db.collection("atenciones")
                .where("pacienteRut", "==", rutLimpio).get();
            atencionesQuery.forEach(doc => {
                datos.atenciones.push({ id: doc.id, ...doc.data() });
            });

            return datos;

        } catch (error) {
            console.error("Error obteniendo datos:", error);
            return datos;
        }
    }

    fusionarDatos(datosExistentes, datosNuevos, origen) {
        let datosFusionados = {};

        if (datosExistentes.paciente) {
            datosFusionados = { ...datosExistentes.paciente };
        }

        const solicitudMasReciente = this.obtenerMasReciente(datosExistentes.solicitudes);
        if (solicitudMasReciente) {
            datosFusionados = this.fusionarObjetos(datosFusionados, solicitudMasReciente);
        }

        const reingresoMasReciente = this.obtenerMasReciente(datosExistentes.reingresos);
        if (reingresoMasReciente) {
            datosFusionados = this.fusionarObjetos(datosFusionados, reingresoMasReciente);
        }

        const citaMasReciente = this.obtenerMasReciente(datosExistentes.citas);
        if (citaMasReciente) {
            datosFusionados = this.fusionarObjetos(datosFusionados, citaMasReciente);
        }

        datosFusionados = this.fusionarObjetos(datosFusionados, datosNuevos);
        datosFusionados.rut = this.limpiarRut(datosFusionados.rut || datosNuevos.rut);
        datosFusionados.fechaUltimaActualizacion = new Date().toISOString();
        datosFusionados.origenUltimaActualizacion = origen;

        return this.limpiarDatosFusionados(datosFusionados);
    }

    fusionarObjetos(obj1, obj2) {
        const resultado = { ...obj1 };
        
        Object.keys(obj2).forEach(key => {
            const valor2 = obj2[key];
            const valor1 = obj1[key];
            if (this.tieneContenido(valor2)) {
                if (Array.isArray(valor2) && Array.isArray(valor1)) {
                    // Fusionar arrays únicos
                    resultado[key] = [...new Set([...valor1, ...valor2])];
                } else {
                    resultado[key] = valor2;
                }
            }
        });

        return resultado;
    }

    tieneContenido(valor) {
        if (valor === null || valor === undefined || valor === '') return false;
        if (Array.isArray(valor)) return valor.length > 0;
        if (typeof valor === 'object') return Object.keys(valor).length > 0;
        return true;
    }

    obtenerMasReciente(array) {
        if (!array || array.length === 0) return null;
        
        return array.reduce((mas_reciente, actual) => {
            const fechaActual = this.obtenerFecha(actual);
            const fechaMasReciente = this.obtenerFecha(mas_reciente);
            
            return fechaActual > fechaMasReciente ? actual : mas_reciente;
        });
    }

    obtenerFecha(objeto) {
        const fechas = [
            objeto.fechaCreacion,
            objeto.fecha,
            objeto.creado,
            objeto.fechaRegistro,
            objeto.fechaUltimaActualizacion
        ];

        for (let fecha of fechas) {
            if (fecha) {
                if (typeof fecha === 'string') return new Date(fecha);
                if (fecha.seconds) return new Date(fecha.seconds * 1000);
                if (fecha.toDate) return fecha.toDate();
            }
        }

        return new Date(0);
    }

    limpiarDatosFusionados(datos) {
        const camposTecnicos = ['id', 'solicitudId', 'profesionalId', 'hora', 'fecha', 'estado'];
        const datosLimpios = { ...datos };
        const camposImportantes = [
            'nombre', 'apellidos', 'rut', 'telefono', 'email', 'direccion', 'cesfam', 'edad',
            'sustancias', 'tiempoConsumo', 'urgencia', 'tratamientoPrevio', 'descripcion', 
            'motivacion', 'paraMi', 'fechaRegistro', 'fechaUltimaActualizacion', 'origenUltimaActualizacion'
        ];

        const resultado = {};
        camposImportantes.forEach(campo => {
            if (datosLimpios[campo] !== undefined) {
                resultado[campo] = datosLimpios[campo];
            }
        });

        if (!resultado.fechaRegistro) {
            resultado.fechaRegistro = new Date().toISOString();
        }

        return resultado;
    }

    async actualizarTodasLasColecciones(rutLimpio, datosFusionados) {
        try {
            await this.actualizarPaciente(rutLimpio, datosFusionados);
            await this.actualizarCitasExistentes(rutLimpio, datosFusionados);
            await this.actualizarAtencionesExistentes(rutLimpio, datosFusionados);

        } catch (error) {
            console.error("Error actualizando colecciones:", error);
            throw error;
        }
    }

    async actualizarPaciente(rutLimpio, datosFusionados) {
        try {
            const pacienteQuery = await this.db.collection("pacientes")
                .where("rut", "==", rutLimpio).limit(1).get();

            if (!pacienteQuery.empty) {
                const docId = pacienteQuery.docs[0].id;
                await this.db.collection("pacientes").doc(docId).update(datosFusionados);
                console.log(`✅ Paciente actualizado: ${docId}`);
            } else {
                const docRef = await this.db.collection("pacientes").add(datosFusionados);
                console.log(`✅ Nuevo paciente creado: ${docRef.id}`);
            }
        } catch (error) {
            console.error("Error actualizando paciente:", error);
            throw error;
        }
    }

    async actualizarCitasExistentes(rutLimpio, datosFusionados) {
        try {
            const queries = [
                this.db.collection("citas").where("pacienteRut", "==", rutLimpio).get(),
                this.db.collection("citas").where("rut", "==", rutLimpio).get()
            ];

            const resultados = await Promise.all(queries);
            const citasUnicas = new Map();
            resultados.forEach(querySnapshot => {
                querySnapshot.forEach(doc => {
                    citasUnicas.set(doc.id, doc);
                });
            });

            const actualizaciones = Array.from(citasUnicas.values()).map(doc => {
                const datosActualizacion = {
                    pacienteNombre: datosFusionados.nombre || doc.data().pacienteNombre,
                    nombre: datosFusionados.nombre || doc.data().nombre,
                    apellidos: datosFusionados.apellidos || doc.data().apellidos,
                    telefono: datosFusionados.telefono || doc.data().telefono || "",
                    email: datosFusionados.email || doc.data().email || "",
                    direccion: datosFusionados.direccion || doc.data().direccion || "",
                    cesfam: datosFusionados.cesfam || doc.data().cesfam,
                    pacienteRut: rutLimpio,
                    rut: rutLimpio
                };

                return this.db.collection("citas").doc(doc.id).update(datosActualizacion);
            });

            await Promise.all(actualizaciones);
            console.log(`✅ ${actualizaciones.length} citas actualizadas`);

        } catch (error) {
            console.error("Error actualizando citas:", error);
        }
    }

    async actualizarAtencionesExistentes(rutLimpio, datosFusionados) {
        try {
            const atencionesQuery = await this.db.collection("atenciones")
                .where("pacienteRut", "==", rutLimpio).get();

            const actualizaciones = atencionesQuery.docs.map(doc => {
                const datosActualizacion = {
                    pacienteNombre: datosFusionados.nombre || doc.data().pacienteNombre,
                    telefono: datosFusionados.telefono || doc.data().telefono || "",
                    email: datosFusionados.email || doc.data().email || "",
                    direccion: datosFusionados.direccion || doc.data().direccion || "",
                    cesfam: datosFusionados.cesfam || doc.data().cesfam
                };

                return this.db.collection("atenciones").doc(doc.id).update(datosActualizacion);
            });

            await Promise.all(actualizaciones);
            console.log(`✅ ${actualizaciones.length} atenciones actualizadas`);

        } catch (error) {
            console.error("Error actualizando atenciones:", error);
        }
    }

    limpiarRut(rut) {
        if (!rut) return "";
        return rut.toString().replace(/[.\-\s]/g, "").toUpperCase().trim();
    }


    async desdeSolicitudIngreso(solicitud) {
        const rut = solicitud.rut;
        await this.sincronizarTodo(rut, solicitud, 'solicitud_ingreso');
    }

    async desdeReingreso(reingreso) {
        const rut = reingreso.rut;
        await this.sincronizarTodo(rut, reingreso, 'reingreso');
    }

    async desdeCita(cita) {
        const rut = cita.pacienteRut || cita.rut;
        await this.sincronizarTodo(rut, cita, 'cita');
    }

    async desdeAtencion(atencion) {
        const rut = atencion.pacienteRut;
        await this.sincronizarTodo(rut, atencion, 'atencion');
    }

    async desdePaciente(paciente) {
        const rut = paciente.rut;
        await this.sincronizarTodo(rut, paciente, 'paciente_directo');
    }
}

const sistemaEnlace = new SistemaEnlaceFirebase();

window.sincronizarDesdeAtencion = async function(atencion) {
    return await sistemaEnlace.desdeAtencion(atencion);
};

window.sincronizarDesdeCita = async function(cita) {
    return await sistemaEnlace.desdeCita(cita);
};

window.sincronizarDesdeSolicitud = async function(solicitud) {
    return await sistemaEnlace.desdeSolicitudIngreso(solicitud);
};

window.sincronizarDesdeReingreso = async function(reingreso) {
    return await sistemaEnlace.desdeReingreso(reingreso);
};

window.sincronizarDesdePaciente = async function(paciente) {
    return await sistemaEnlace.desdePaciente(paciente);
};

window.sincronizarPaciente = async function(datos) {
    return await sistemaEnlace.sincronizarTodo(datos.rut, datos, 'legacy');
};

console.log('🔗 Sistema de enlace completo cargado');
