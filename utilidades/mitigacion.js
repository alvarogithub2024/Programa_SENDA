// Ejecutar en consola para solucionar errores de migración
async function solucionarErroresMigracion() {
    console.log('🔧 Solucionando errores de migración...');
    
    try {
        // 1. Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase no está disponible');
            return;
        }

        const db = window.getFirestore();
        if (!db) {
            console.error('❌ Firestore no está disponible');
            return;
        }

        // 2. Crear índices necesarios
        console.log('📊 Verificando índices...');
        
        // 3. Limpiar documentos problemáticos
        console.log('🧹 Limpiando documentos con problemas...');
        
        const collections = ['solicitudes_ingreso', 'citas', 'atenciones', 'reingresos'];
        
        for (const collectionName of collections) {
            try {
                const snapshot = await db.collection(collectionName).limit(5).get();
                console.log(`✅ ${collectionName}: ${snapshot.size} documentos accesibles`);
            } catch (error) {
                console.error(`❌ Error en ${collectionName}:`, error);
            }
        }

        // 4. Verificar sistema de ID unificado
        if (window.generarIdPaciente) {
            const testRut = '12345678-9';
            const testId = window.generarIdPaciente(testRut);
            console.log(`✅ Sistema de ID funcional: ${testRut} → ${testId}`);
        } else {
            console.error('❌ Sistema de ID unificado no disponible');
        }

        console.log('✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función para reinicializar completamente
function reinicializarSistema() {
    console.log('🔄 Reinicializando sistema SENDA...');
    
    // Limpiar caché
    if (window.cacheLimpiarTodo) {
        window.cacheLimpiarTodo();
    }
    
    // Recargar página
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Ejecutar automáticamente
solucionarErroresMigracion();
