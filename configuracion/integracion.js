// ==================== SCRIPT DE MIGRACIÓN DE DATOS ====================
// Ejecutar este script para arreglar datos existentes en Firebase

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
            // 1. Obtener todos los RUTs únicos
            const rutsUnicos = await this.obtenerTodosLosRuts();
            console.log(`📋 Total de RUTs únicos encontrados: ${rutsUnicos.size}`);
            
            // 2. Procesar cada RUT
            let contador = 0;
            for (let rut of rutsUnicos) {
                contador++;
                console.log(`\n🔄 Procesando ${contador}/${rutsUnicos.size}: ${rut}`);
                await this.migrarDatosPorRut(rut);
                
                // Pausa pequeña para no sobrecargar Firebase
                await this.pausa(100);
            }
            
            // 3. Mostrar resumen
            this.mostrarResumen();
            
        } catch (error) {
            console.error('❌ Error en migración completa:', error);
            this.errores.push(`Error general: ${error.message}`);
        }
    }

    async obtenerTodosLosRuts() {
        const ruts = new Set();
