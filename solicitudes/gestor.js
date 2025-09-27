// SOLICITUDES/GESTOR.JS - FRAGMENTO CORREGIDO PARA PDF

// === FUNCIONES DE EXPORTACIÓN PDF CORREGIDAS ===

function exportarSolicitud(solicitudId) {
    try {
        console.log('🔍 Intentando exportar solicitud:', solicitudId);
        
        // Verificar jsPDF
        if (typeof window.jsPDF === 'undefined') {
            console.error('❌ jsPDF no está disponible');
            
            // Mostrar información de debug
            console.log('📊 Debug jsPDF:');
            console.log('- window.jsPDF:', typeof window.jsPDF);
            console.log('- window.jspdf:', typeof window.jspdf);
            console.log('- globalThis.jsPDF:', typeof globalThis.jsPDF);
            
            window.showNotification && window.showNotification('Error: Librería PDF no disponible. Recarga la página e intenta nuevamente.', 'error');
            return;
        }
        
        const solicitud = solicitudesData.find(s => s.id === solicitudId);
        if (!solicitud) {
            console.error('❌ Solicitud no encontrada:', solicitudId);
            window.showNotification && window.showNotification('Solicitud no encontrada', 'error');
            return;
        }
        
        console.log('✅ Solicitud encontrada, generando PDF...');
        
        // Generar PDF individual
        generarPDFSolicitud(solicitud);
        
    } catch (error) {
        console.error('❌ Error exportando solicitud:', error);
        console.error('Stack trace:', error.stack);
        window.showNotification && window.showNotification('Error al exportar solicitud: ' + error.message, 'error');
    }
}

function generarPDFSolicitud(solicitud) {
    try {
        console.log('📄 Iniciando generación de PDF para:', solicitud.nombre);
        
        // Verificar jsPDF con múltiples métodos
        let jsPDFClass = null;
        
        if (window.jsPDF && window.jsPDF.jsPDF) {
            jsPDFClass = window.jsPDF.jsPDF;
            console.log('✅ Usando window.jsPDF.jsPDF');
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
            console.log('✅ Usando window.jsPDF directamente');
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFClass = jsPDF;
            console.log('✅ Usando variable global jsPDF');
        } else {
            throw new Error('jsPDF no está disponible en ninguna forma');
        }
        
        // Crear documento PDF
        const doc = new jsPDFClass({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        console.log('📝 Documento PDF creado');
        
        // Configuración de colores SENDA
        const azulSenda = [37, 99, 235]; // #2563eb
        const grisTexto = [75, 85, 99];  // #4b5563
        
        let yPosition = 20;
        
        // === HEADER DEL DOCUMENTO ===
        doc.setFillColor(...azulSenda);
        doc.rect(0, 0, 210, 25, 'F');
        
        // Logo y título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('PROGRAMA SENDA PUENTE ALTO', 20, 15);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Ficha de Solicitud de Ingreso', 20, 21);
        
        // Fecha de generación
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 150, 21);
        
        yPosition = 35;
        
        // === INFORMACIÓN DEL PACIENTE ===
        doc.setTextColor(...grisTexto);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN DEL PACIENTE', 20, yPosition);
        
        yPosition += 10;
        
        // Datos personales
        const datosPersonales = [
            ['Nombre Completo:', `${solicitud.nombre || ''} ${solicitud.apellidos || ''}`],
            ['RUT:', solicitud.rut || 'No especificado'],
            ['Edad:', `${solicitud.edad || 'No especificada'} años`],
            ['Teléfono:', solicitud.telefono || 'No especificado'],
            ['Email:', solicitud.email || 'No especificado'],
            ['Dirección:', solicitud.direccion || 'No especificada'],
            ['CESFAM:', solicitud.cesfam || 'No especificado']
        ];
        
        doc.setFontSize(11);
        datosPersonales.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont(undefined, 'normal');
            
            // Limitar longitud del texto para evitar desbordamiento
            const maxLength = 50;
            const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
            doc.text(displayValue, 70, yPosition);
            yPosition += 7;
        });
        
        yPosition += 5;
        
        // === INFORMACIÓN CLÍNICA ===
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN CLÍNICA', 20, yPosition);
        
        yPosition += 10;
        
        // Sustancias
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Sustancias problemáticas:', 20, yPosition);
        yPosition += 5;
        
        doc.setFont(undefined, 'normal');
        const sustancias = Array.isArray(solicitud.sustancias) && solicitud.sustancias.length 
            ? solicitud.sustancias.join(', ') 
            : 'No especificado';
        
        // Dividir texto largo en múltiples líneas
        const sustanciasLines = doc.splitTextToSize(sustancias, 170);
        doc.text(sustanciasLines, 20, yPosition);
        yPosition += (sustanciasLines.length * 5) + 5;
        
        // Otros datos clínicos
        const datosClinicOS = [
            ['Tiempo de consumo:', solicitud.tiempoConsumo || 'No especificado'],
            ['Nivel de urgencia:', solicitud.urgencia || 'No especificado'],
            ['Tratamiento previo:', solicitud.tratamientoPrevio === 'si' ? 'Sí' : solicitud.tratamientoPrevio === 'no' ? 'No' : 'No especificado'],
            ['Motivación (1-10):', solicitud.motivacion || 'No especificado']
        ];
        
        datosClinicOS.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont(undefined, 'normal');
            doc.text(value, 70, yPosition);
            yPosition += 7;
        });
        
        yPosition += 5;
        
        // === DESCRIPCIÓN ADICIONAL ===
        if (solicitud.descripcion) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DESCRIPCIÓN ADICIONAL', 20, yPosition);
            
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            const descripcionLines = doc.splitTextToSize(solicitud.descripcion, 170);
            doc.text(descripcionLines, 20, yPosition);
            yPosition += (descripcionLines.length * 5) + 10;
        }
        
        // === INFORMACIÓN ADMINISTRATIVA ===
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN ADMINISTRATIVA', 20, yPosition);
        
        yPosition += 10;
        
        const datosAdmin = [
            ['Estado:', solicitud.estado || 'Pendiente'],
            ['Prioridad:', solicitud.prioridad || 'No asignada'],
            ['Fecha de solicitud:', solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString('es-CL') : 'No especificada'],
            ['Origen:', solicitud.origen || 'Web'],
            ['ID de solicitud:', solicitud.id || 'No disponible']
        ];
        
        doc.setFontSize(11);
        datosAdmin.forEach(([label, value]) => {
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont(undefined, 'normal');
            doc.text(value, 70, yPosition);
            yPosition += 7;
        });
        
        // === FOOTER ===
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Este documento es confidencial y está protegido por la Ley de Protección de Datos Personales.', 20, 280);
        doc.text('SENDA Puente Alto - Sistema de Gestión de Solicitudes', 20, 285);
        
        // Generar nombre del archivo
        const nombrePaciente = (solicitud.nombre || 'paciente').replace(/[^a-zA-Z0-9]/g, '_');
        const fecha = new Date().toISOString().slice(0, 10);
        const filename = `solicitud_${nombrePaciente}_${fecha}.pdf`;
        
        console.log('💾 Intentando descargar PDF:', filename);
        
        // Intentar descargar con múltiples métodos
        try {
            // Método 1: save() directo
            doc.save(filename);
            console.log('✅ PDF descargado usando save()');
            window.showNotification && window.showNotification(`PDF generado: ${filename}`, 'success');
        } catch (saveError) {
            console.warn('⚠️ Error con save(), intentando método alternativo:', saveError);
            
            try {
                // Método 2: blob + manual download
                const pdfBlob = doc.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('✅ PDF descargado usando blob');
                window.showNotification && window.showNotification(`PDF generado: ${filename}`, 'success');
            } catch (blobError) {
                console.error('❌ Error con blob download:', blobError);
                
                // Método 3: abrir en nueva ventana
                try {
                    const pdfDataUri = doc.output('datauristring');
                    const newWindow = window.open();
                    newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
                    
                    console.log('✅ PDF abierto en nueva ventana');
                    window.showNotification && window.showNotification('PDF abierto en nueva ventana', 'info');
                } catch (windowError) {
                    console.error('❌ Error abriendo en ventana:', windowError);
                    window.showNotification && window.showNotification('Error generando PDF: ' + windowError.message, 'error');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error crítico generando PDF:', error);
        console.error('Stack trace:', error.stack);
        window.showNotification && window.showNotification('Error crítico al generar PDF: ' + error.message, 'error');
    }
}

// === FUNCIÓN DE DIAGNÓSTICO PARA PDF ===
function diagnosticarPDF() {
    console.log('🔍 DIAGNÓSTICO DEL SISTEMA PDF');
    console.log('==============================');
    console.log('window.jsPDF:', typeof window.jsPDF);
    console.log('window.jsPDF.jsPDF:', typeof window.jsPDF?.jsPDF);
    console.log('jsPDF global:', typeof jsPDF);
    console.log('Solicitudes disponibles:', solicitudesData.length);
    
    if (window.jsPDF) {
        console.log('📄 Intentando crear PDF de prueba...');
        try {
            const testDoc = new (window.jsPDF.jsPDF || window.jsPDF)();
            testDoc.text('Test PDF', 20, 20);
            console.log('✅ PDF de prueba creado exitosamente');
            
            // Intentar descarga de prueba
            try {
                testDoc.save('test_senda.pdf');
                console.log('✅ Descarga de prueba exitosa');
            } catch (downloadError) {
                console.error('❌ Error en descarga de prueba:', downloadError);
            }
        } catch (createError) {
            console.error('❌ Error creando PDF de prueba:', createError);
        }
    }
    console.log('==============================');
}

// Exportar función de diagnóstico
window.diagnosticarPDF = diagnosticarPDF;

// Auto-diagnóstico al cargar
setTimeout(() => {
    console.log('🔧 Ejecutando auto-diagnóstico PDF...');
    diagnosticarPDF();
}, 2000);
