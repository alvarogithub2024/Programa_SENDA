
class MigracionDatos {
    constructor() {
        this.db = window.getFirestore();
        this.procesados = new Set();
        this.errores = [];
        this.exitos = 0;
    }

    async ejecutarMigracionCompleta() {
        console.log('🚀 Iniciando migración completa de datos...');
        console.log('=====================================');
        
        try {

            const rutsUnicos = await this.obtenerTodosLosRuts();
            console.log(`📋 Total de RUTs únicos encontrados: ${rutsUnicos.size}`);

            let contador = 0;
            for (let rut of rutsUnicos) {
                contador++;
                console.log(`\n🔄 Procesando ${contador}/${rutsUnicos.size}: ${rut}`);
                await this.migrarDatosPorRut(rut);

                await this.pausa(100);
            }

            this.mostrarResumen();
            
        } catch (error) {
            console.error('❌ Error en migración completa:', error);
            this.errores.push(`Error general: ${error.message}`);
        }
    }

    async obtenerTodosLosRuts() {
        const ruts = new Set();
        
        try {

            const colecciones = [
                'pacientes',
                'solicitudes_ingreso', 
                'reingresos',
                'citas',
                'atenciones'
            ];
            
            for (let coleccion of colecciones) {
                console.log(`📚 Revisando colección: ${coleccion}`);
                const snapshot = await this.db.collection(coleccion).get();
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const rutCandidatos = [
                        data.rut,
                        data.pacienteRut,
                        data.rutPaciente
                    ];
                    
                    rutCandidatos.forEach(rut => {
                        if (rut) {
                            const rutLimpio = this.limpiarRut(rut);
                            if (rutLimpio && rutLimpio.length >= 8) {
                                ruts.add(rutLimpio);
                            }
                        }
                    });
                });
            }
            
        } catch (error) {
            console.error('Error obteniendo RUTs:', error);
            this.errores.push(`Error obteniendo RUTs: ${error.message}`);
        }
        
        return ruts;
    }

    async migrarDatosPorRut(rut) {
        try {
            if (this.procesados.has(rut)) {
                console.log(`⏭️ ${rut} ya procesado, saltando...`);
                return;
            }

            const datosCompletos = await this.recopilarDatosCompletos(rut);
            
            if (!datosCompletos || Object.keys(datosCompletos).length === 0) {
                console.log(`⚠️ No se encontraron datos para ${rut}`);
                return;
            }
            
            await this.crearActualizarPacienteMaestro(rut, datosCompletos);
            await this.actualizarColeccionesRelacionadas(rut, datosCompletos);
            
            this.procesados.add(rut);
            this.exitos++;
            console.log(`✅ ${rut} migrado exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error migrando ${rut}:`, error);
            this.errores.push(`Error en ${rut}: ${error.message}`);
        }
    }

    async recopilarDatosCompletos(rut) {
        const datos = {};
        
        try {
            const pacienteQuery = await this.db.collection("pacientes")
                .where("rut", "==", rut).limit(1).get();
            if (!pacienteQuery.empty) {
                Object.assign(datos, pacienteQuery.docs[0].data());
            }

            const solicitudesQuery = await this.db.collection("solicitudes_ingreso")
                .where("rut", "==", rut).get();
            solicitudesQuery.forEach(doc => {
                this.fusionarDatos(datos, doc.data());
            });

            const reingresosQuery = await this.db.collection("reingresos")
                .where("rut", "==", rut).get();
            reingresosQuery.forEach(doc => {
                this.fusionarDatos(datos, doc.data());
            });

            const citasQuery1 = await this.db.collection("citas")
                .where("pacienteRut", "==", rut).get();
            const citasQuery2 = await this.db.collection("citas")
                .where("rut", "==", rut).get();
            
            [citasQuery1, citasQuery2].forEach(querySnapshot => {
                querySnapshot.forEach(doc => {
                    this.fusionarDatos(datos, doc.data());
                });
            });

            const atencionesQuery = await this.db.collection("atenciones")
                .where("pacienteRut", "==", rut).get();
            atencionesQuery.forEach(doc => {
                this.fusionarDatos(datos, doc.data());
            });

            datos.rut = rut;
            datos.fechaUltimaActualizacion = new Date().toISOString();
            datos.origenUltimaActualizacion = 'migracion_completa';

            return datos;

        } catch (error) {
            console.error(`Error recopilando datos para ${rut}:`, error);
            throw error;
        }
    }

    fusionarDatos(destino, origen) {
        Object.keys(origen).forEach(key => {
            const valorOrigen = origen[key];
            const valorDestino = destino[key];

            if (this.tieneContenido(valorOrigen)) {
                if (!this.tieneContenido(valorDestino)) {
                    destino[key] = valorOrigen;
                } else if (Array.isArray(valorOrigen) && Array.isArray(valorDestino)) {
                    destino[key] = [...new Set([...valorDestino, ...valorOrigen])];
                } else if (typeof valorOrigen === 'string' && valorOrigen.length > (valorDestino?.length || 0)) {
                    destino[key] = valorOrigen;
                }
            }
        });
    }

    tieneContenido(valor) {
        if (valor === null || valor === undefined || valor === '') return false;
        if (Array.isArray(valor)) return valor.length > 0;
        if (typeof valor === 'object') return Object.keys(valor).length > 0;
        return true;
    }

    async crearActualizarPacienteMaestro(rut, datosCompletos) {
        try {
            const datosPaciente = this.limpiarDatosParaPaciente(datosCompletos);
            
            const pacienteQuery = await this.db.collection("pacientes")
                .where("rut", "==", rut).limit(1).get();

            if (!pacienteQuery.empty) {
                const docId = pacienteQuery.docs[0].id;
                await this.db.collection("pacientes").doc(docId).update(datosPaciente);
                console.log(`  📝 Paciente actualizado: ${docId}`);
            } else {
                const docRef = await this.db.collection("pacientes").add(datosPaciente);
                console.log(`  ➕ Nuevo paciente creado: ${docRef.id}`);
            }

        } catch (error) {
            console.error(`Error creando/actualizando paciente para ${rut}:`, error);
            throw error;
        }
    }

    limpiarDatosParaPaciente(datos) {
        const camposPermitidos = [
            'nombre', 'apellidos', 'rut', 'telefono', 'email', 'direccion', 'cesfam', 'edad',
            'sustancias', 'tiempoConsumo', 'urgencia', 'tratamientoPrevio', 'descripcion',
            'motivacion', 'paraMi', 'fechaRegistro', 'fechaUltimaActualizacion', 'origenUltimaActualizacion'
        ];

        const datosLimpios = {};
        camposPermitidos.forEach(campo => {
            if (datos[campo] !== undefined) {
                datosLimpios[campo] = datos[campo];
            }
        });

        if (!datosLimpios.fechaRegistro) {
            datosLimpios.fechaRegistro = new Date().toISOString();
        }

        return datosLimpios;
    }

    async actualizarColeccionesRelacionadas(rut, datosCompletos) {
        try {
            await this.actualizarCitas(rut, datosCompletos);
            await this.actualizarAtenciones(rut, datosCompletos);
            
        } catch (error) {
            console.error(`Error actualizando colecciones para ${rut}:`, error);
            throw error;
        }
    }

    async actualizarCitas(rut, datosCompletos) {
        try {
            const queries = [
                this.db.collection("citas").where("pacienteRut", "==", rut).get(),
                this.db.collection("citas").where("rut", "==", rut).get()
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
                    pacienteNombre: datosCompletos.nombre || doc.data().pacienteNombre,
                    nombre: datosCompletos.nombre || doc.data().nombre,
                    apellidos: datosCompletos.apellidos || doc.data().apellidos,
                    telefono: datosCompletos.telefono || doc.data().telefono || "",
                    email: datosCompletos.email || doc.data().email || "",
                    direccion: datosCompletos.direccion || doc.data().direccion || "",
                    cesfam: datosCompletos.cesfam || doc.data().cesfam,
                    pacienteRut: rut,
                    rut: rut
                };

                return this.db.collection("citas").doc(doc.id).update(datosActualizacion);
            });

            await Promise.all(actualizaciones);
            console.log(`  📅 ${actualizaciones.length} citas actualizadas`);

        } catch (error) {
            console.error(`Error actualizando citas para ${rut}:`, error);
        }
    }

    async actualizarAtenciones(rut, datosCompletos) {
        try {
            const atencionesQuery = await this.db.collection("atenciones")
                .where("pacienteRut", "==", rut).get();

            const actualizaciones = atencionesQuery.docs.map(doc => {
                const datosActualizacion = {
                    pacienteNombre: datosCompletos.nombre || doc.data().pacienteNombre,
                    telefono: datosCompletos.telefono || doc.data().telefono || "",
                    email: datosCompletos.email || doc.data().email || "",
                    direccion: datosCompletos.direccion || doc.data().direccion || "",
                    cesfam: datosCompletos.cesfam || doc.data().cesfam
                };

                return this.db.collection("atenciones").doc(doc.id).update(datosActualizacion);
            });

            await Promise.all(actualizaciones);
            console.log(`  🏥 ${actualizaciones.length} atenciones actualizadas`);

        } catch (error) {
            console.error(`Error actualizando atenciones para ${rut}:`, error);
        }
    }

    limpiarRut(rut) {
        if (!rut) return "";
        return rut.toString().replace(/[.\-\s]/g, "").toUpperCase().trim();
    }

    async pausa(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    mostrarResumen() {
        console.log('\n🎉 MIGRACIÓN COMPLETADA');
        console.log('========================');
        console.log(`✅ Exitosos: ${this.exitos}`);
        console.log(`❌ Errores: ${this.errores.length}`);
        console.log(`📊 Total procesados: ${this.procesados.size}`);
        
        if (this.errores.length > 0) {
            console.log('\n❌ Errores encontrados:');
            this.errores.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\n✨ La migración ha finalizado');
    }

    // Método para migrar un RUT específico
    async migrarRutEspecifico(rut) {
        console.log(`🎯 Migrando RUT específico: ${rut}`);
        const rutLimpio = this.limpiarRut(rut);
        await this.migrarDatosPorRut(rutLimpio);
        console.log(`✅ Migración de ${rutLimpio} completada`);
    }
}


window.ejecutarMigracionCompleta = async function() {
    const migracion = new MigracionDatos();
    await migracion.ejecutarMigracionCompleta();
};

window.migrarRutEspecifico = async function(rut) {
    const migracion = new MigracionDatos();
    await migracion.migrarRutEspecifico(rut);
};

window.verificarConsistenciaDatos = async function() {
    console.log('🔍 Verificando consistencia de datos...');
    
    const db = window.getFirestore();
    const inconsistencias = [];
    
    try {
        const pacientesQuery = await db.collection("pacientes").get();
        
        pacientesQuery.forEach(doc => {
            const data = doc.data();
            if (!data.telefono && !data.email) {
                inconsistencias.push(`Paciente ${data.rut} sin datos de contacto`);
            }
        });
        
        console.log(`📊 Inconsistencias encontradas: ${inconsistencias.length}`);
        inconsistencias.forEach(inc => console.log(`  ⚠️ ${inc}`));
        
        return inconsistencias;
        
    } catch (error) {
        console.error('Error verificando consistencia:', error);
        return [];
    }
};

console.log('🛠️ Script de migración cargado');
console.log('📝 Funciones disponibles:');
console.log('   - window.ejecutarMigracionCompleta()');
console.log('   - window.migrarRutEspecifico("12345678-9")');
console.log('   - window.verificarConsistenciaDatos()');
console.log('⚠️ IMPORTANTE: Ejecutar en horarios de bajo tráfico');
