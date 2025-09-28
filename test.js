// EJECUTAR EN CONSOLA PARA VERIFICAR PERMISOS
async function testPermisosFIREBASE() {
    console.log('🔥 TESTING PERMISOS DE FIREBASE');
    console.log('==============================');
    
    try {
        // 1. Verificar usuario
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('❌ NO HAY USUARIO AUTENTICADO');
            console.log('🔑 HAZ LOGIN PRIMERO');
            return;
        }
        
        console.log(`✅ Usuario: ${user.email}`);
        
        // 2. Test básico de lectura
        const db = window.getFirestore();
        
        console.log('📖 Probando lectura de citas...');
        const citasTest = await db.collection('citas').limit(1).get();
        console.log(`✅ Citas leídas: ${citasTest.size}`);
        
        console.log('📖 Probando lectura de profesionales...');
        const profTest = await db.collection('profesionales').limit(1).get();
        console.log(`✅ Profesionales leídos: ${profTest.size}`);
        
        // 3. Test de escritura
        console.log('✍️ Probando escritura...');
        const testDoc = await db.collection('test_permisos').add({
            timestamp: new Date(),
            test: 'permisos_ok'
        });
        
        // Eliminar el documento de prueba
        await db.collection('test_permisos').doc(testDoc.id).delete();
        console.log('✅ Escritura OK');
        
        console.log('🎉 TODOS LOS PERMISOS FUNCIONAN CORRECTAMENTE');
        
        // Intentar cargar citas
        console.log('🔄 Intentando cargar citas...');
        if (window.mostrarCitasRestantesHoy) {
            window.mostrarCitasRestantesHoy();
        }
        if (window.mostrarPacienteActualHoy) {
            window.mostrarPacienteActualHoy();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR DE PERMISOS:', error);
        
        if (error.code === 'permission-denied') {
            console.log('🚨 SOLUCIÓN:');
            console.log('1. Ve a Firebase Console');
            console.log('2. Firestore Database > Rules');
            console.log('3. Cambia a: allow read, write: if true;');
            console.log('4. Haz clic en Publish');
        }
        
        return false;
    }
}

// Función para re-autenticar si es necesario
async function reAutenticar() {
    console.log('🔄 Re-autenticando...');
    
    try {
        await firebase.auth().signOut();
        console.log('✅ Sesión cerrada');
        
        // Abrir modal de login
        setTimeout(() => {
            const loginBtn = document.getElementById('login-professional');
            if (loginBtn) {
                loginBtn.click();
                console.log('🔑 Modal de login abierto');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error re-autenticando:', error);
    }
}

// Ejecutar test automáticamente
console.log('🚀 Ejecutando test de permisos...');
testPermisosFIREBASE().then(success => {
    if (!success) {
        console.log('💡 Intentando re-autenticación...');
        reAutenticar();
    }
});

// Exportar para uso manual
window.FIREBASE_TEST = {
    testPermisos: testPermisosFIREBASE,
    reAuth: reAutenticar
};
