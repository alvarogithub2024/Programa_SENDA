// ===================================================================
// SCRIPT DE TEST PARA SISTEMA DE PERMISOS
// Ejecutar en la consola del navegador después de loguearse
// ===================================================================

// Función principal de test
function testearSistemaPermisos() {
    console.log('🧪 INICIANDO TEST DEL SISTEMA DE PERMISOS');
    console.log('==========================================');
    
    // Test 1: Verificar que Firebase esté funcionando
    console.log('\n📊 TEST 1: Estado de Firebase');
    console.log('- Firebase disponible:', typeof firebase !== 'undefined');
    console.log('- Auth disponible:', typeof firebase.auth !== 'undefined');
    console.log('- Usuario logueado:', firebase.auth().currentUser !== null);
    console.log('- UID del usuario:', firebase.auth().currentUser?.uid || 'Sin UID');
    
    // Test 2: Verificar que las funciones de permisos estén disponibles
    console.log('\n🔧 TEST 2: Funciones de permisos disponibles');
    console.log('- inicializarSistemaPermisos:', typeof window.inicializarSistemaPermisos);
    console.log('- puedeEditarHistorial:', typeof window.puedeEditarHistorial);
    console.log('- puedeEliminarHistorial:', typeof window.puedeEliminarHistorial);
    console.log('- puedeCrearAtenciones:', typeof window.puedeCrearAtenciones);
    console.log('- diagnosticarPermisos:', typeof window.diagnosticarPermisos);
    
    // Test 3: Estado actual del sistema
    console.log('\n📋 TEST 3: Estado actual del sistema');
    if (window.diagnosticarPermisos) {
        window.diagnosticarPermisos();
    } else {
        console.log('❌ Función diagnosticarPermisos no disponible');
    }
    
    // Test 4: Forzar recarga de permisos
    console.log('\n🔄 TEST 4: Forzando recarga de permisos...');
    if (window.recargarPermisos) {
        window.recargarPermisos();
        
        // Verificar después de 2 segundos
        setTimeout(() => {
            console.log('\n✅ RESULTADO DESPUÉS DE RECARGA:');
            if (window.diagnosticarPermisos) {
                window.diagnosticarPermisos();
            }
            
            // Test final
            testearPermisosFinales();
        }, 2000);
    } else {
        console.log('❌ Función recargarPermisos no disponible');
        testearPermisosFinales();
    }
}

function testearPermisosFinales() {
    console.log('\n🎯 TEST FINAL: Verificación de permisos específicos');
    
    const tests = [
        { nombre: 'Editar historial', funcion: window.puedeEditarHistorial },
        { nombre: 'Eliminar historial', funcion: window.puedeEliminarHistorial },
        { nombre: 'Crear atenciones', funcion: window.puedeCrearAtenciones },
        { nombre: 'Gestionar solicitudes', funcion: window.puedeGestionarSolicitudes }
    ];
    
    tests.forEach(test => {
        if (test.funcion) {
            const resultado = test.funcion();
            console.log(`${resultado ? '✅' : '❌'} ${test.nombre}: ${resultado}`);
        } else {
            console.log(`❓ ${test.nombre}: Función no disponible`);
        }
    });
    
    // Test de UI
    console.log('\n🎨 TEST DE INTERFAZ:');
    testearElementosUI();
    
    console.log('\n🏁 TEST COMPLETADO');
    console.log('==================');
}

function testearElementosUI() {
    // Verificar elementos del historial
    const historialContainer = document.getElementById('historial-clinico');
    if (historialContainer) {
        console.log('✅ Contenedor historial encontrado');
        console.log('- Clases:', historialContainer.className);
        console.log('- Es solo lectura:', historialContainer.classList.contains('historial-readonly'));
    } else {
        console.log('❌ Contenedor historial NO encontrado (normal si no hay ficha abierta)');
    }
    
    // Verificar botones de agregar
    const botonesAgregar = document.querySelectorAll('.btn-add-entry');
    console.log(`📝 Botones "Agregar atención" encontrados: ${botonesAgregar.length}`);
    botonesAgregar.forEach((btn, index) => {
        console.log(`  - Botón ${index + 1}: ${btn.style.display !== 'none' ? 'Visible' : 'Oculto'}`);
    });
    
    // Verificar pestaña de solicitudes
    const tabSolicitudes = document.querySelector('.tab-btn[data-tab="solicitudes"]');
    if (tabSolicitudes) {
        console.log('✅ Pestaña solicitudes encontrada');
        console.log('- Visible:', tabSolicitudes.style.display !== 'none');
    } else {
        console.log('❌ Pestaña solicitudes NO encontrada');
    }
}

// Función para simular diferentes roles (solo para test)
function simularRol(rol) {
    console.log(`🎭 Simulando rol: ${rol}`);
    
    // Temporalmente sobrescribir el rol
    const rolOriginal = window.rolActual ? window.rolActual() : null;
    
    // Simular el cambio
    if (window.SENDA_PERMISOS_DEBUG) {
        // Esto es solo para debug, no funciona en producción
        console.log('⚠️ Esto es solo una simulación para testing');
        console.log('En producción, el rol se obtiene desde Firestore');
    }
    
    return rolOriginal;
}

// Función para obtener rol manualmente desde Firestore
async function verificarRolEnFirestore() {
    console.log('🔍 Verificando rol directamente en Firestore...');
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('❌ No hay usuario logueado');
        return null;
    }
    
    try {
        const db = window.getFirestore();
        const doc = await db.collection('profesionales').doc(user.uid).get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Documento encontrado en Firestore:');
            console.log('- Datos completos:', data);
            console.log('- Rol/Profesión:', data.profession);
            console.log('- Nombre:', data.nombre, data.apellidos);
            console.log('- Activo:', data.activo);
            return data.profession;
        } else {
            console.log('❌ No se encontró documento para el usuario en Firestore');
            return null;
        }
    } catch (error) {
        console.error('❌ Error consultando Firestore:', error);
        return null;
    }
}

// Función de ayuda para forzar refrescar todo
function refrescarTodoElSistema() {
    console.log('🔄 Refrescando todo el sistema...');
    
    // Forzar recarga de permisos
    if (window.recargarPermisos) {
        window.recargarPermisos();
    }
    
    // Aplicar permisos UI
    setTimeout(() => {
        if (window.aplicarPermisosUI) {
            window.aplicarPermisosUI();
        }
    }, 1000);
    
    console.log('✅ Sistema refrescado');
}

// Exportar funciones para uso en consola
window.testearSistemaPermisos = testearSistemaPermisos;
window.verificarRolEnFirestore = verificarRolEnFirestore;
window.refrescarTodoElSistema = refrescarTodoElSistema;
window.simularRol = simularRol;

console.log('🧪 Funciones de test cargadas. Ejecuta:');
console.log('- testearSistemaPermisos() - Para test completo');
console.log('- verificarRolEnFirestore() - Para verificar Firestore directamente');
console.log('- refrescarTodoElSistema() - Para forzar refresh');
console.log('- window.SENDA_DEBUG.testPermisos() - Para test rápido');
