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
