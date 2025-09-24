/**
 * EVENTOS GLOBALES DEL SISTEMA
 * Maneja todos los event listeners y atajos de teclado globales
 */

import { mostrarModal, cerrarModal } from '../utilidades/modales.js';
import { cerrarSesion } from '../autenticacion/sesion.js';
import { cambiarTabLogin } from '../autenticacion/login.js';
import { resetearFormulario } from '../formularios/formulario-paciente.js';

/**
 * Inicializa todos los event listeners globales
 */
function inicializarEventos() {
    try {
        configurarEventosAutenticacion();
        configurarEventosFormularios();
        configurarEventosNavegacion();
        configurarEventosTeclado();
        configurarEventosModales();
        
        console.log('✅ Eventos globales inicializados');
    } catch (error) {
        console.error('❌ Error inicializando eventos globales:', error);
        throw error;
    }
}

/**
 * Configura eventos relacionados con autenticación
 */
function configurarEventosAutenticacion() {
    // Botón de login
    const loginBtn = document.getElementById('login-professional');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Click en botón login detectado');
            mostrarModal('login-modal');
        });
    }

    // Botón de logout
    const logoutBtn = document.getElementById('logout-professional');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', cerrarSesion);
    }

    console.log('✅ Eventos de autenticación configurados');
}

/**
 * Configura eventos de formularios públicos
 */
function configurarEventosFormularios() {
    // Botón de registro de pacientes
    const registerPatientBtn = document.getElementById('register-patient');
    if (registerPatientBtn) {
        registerPatientBtn.addEventListener('click', () => {
            resetearFormulario();
            mostrarModal('patient-modal');
        });
    }

    // Botón de reingreso
    const reentryBtn = document.getElementById('reentry-program');
    if (reentryBtn) {
        reentryBtn.addEventListener('click', () => {
            mostrarModal('reentry-modal');
        });
    }

    // Botón de información del programa
    const aboutBtn = document.getElementById('about-program');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', mostrarInformacionPrograma);
    }

    console.log('✅ Eventos de formularios configurados');
}

/**
 * Configura eventos de navegación profesional
 */
function configurarEventosNavegacion() {
    // Botón de nueva cita
    const nuevaCitaBtn = document.getElementById('nueva-cita-btn');
    if (nuevaCitaBtn) {
        nuevaCitaBtn.addEventListener('click', () => {
            import('../calendario/citas.js')
                .then(modulo => modulo.crearModalNuevaCita())
                .catch(error => console.error('Error cargando módulo de citas:', error));
        });
    }

    // Navegación de calendario
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            import('../calendario/calendario.js')
                .then(modulo => modulo.navegarMesAnterior())
                .catch(error => console.error('Error navegando mes anterior:', error));
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            import('../calendario/calendario.js')
                .then(modulo => modulo.navegarMesSiguiente())
                .catch(error => console.error('Error navegando mes siguiente:', error));
        });
    }

    console.log('✅ Eventos de navegación configurados');
}

/**
 * Configura atajos de teclado globales
 */
function configurarEventosTeclado() {
    document.addEventListener('keydown', manejarAtajosTeclado);
    console.log('✅ Atajos de teclado configurados');
}

/**
 * Maneja los atajos de teclado
 */
function manejarAtajosTeclado(e) {
    // Verificar si el usuario está escribiendo
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
    }

    // ESC para cerrar modales
    if (e.key === 'Escape') {
        const modalAbierto = document.querySelector('.modal-overlay[style*="flex"]');
        if (modalAbierto) {
            cerrarModal(modalAbierto.id);
        }
    }

    // Ctrl/Cmd + N para nueva solicitud (solo si está autenticado)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const publicContent = document.getElementById('public-content');
        if (publicContent && publicContent.style.display !== 'none') {
            resetearFormulario();
            mostrarModal('patient-modal');
        }
    }

    // Ctrl/Cmd + L para login
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        const loginBtn = document.getElementById('login-professional');
        if (loginBtn && loginBtn.style.display !== 'none') {
            mostrarModal('login-modal');
        }
    }

    // F1 para ayuda/información
    if (e.key === 'F1') {
        e.preventDefault();
        mostrarInformacionPrograma();
    }
}

/**
 * Configura eventos específicos de modales
 */
function configurarEventosModales() {
    // Cerrar modales haciendo clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            cerrarModal(e.target.id);
        }
    });

    // Cambio entre tabs de login/registro
    window.switchLoginTab = cambiarTabLogin;

    console.log('✅ Eventos de modales configurados');
}

/**
 * Muestra información sobre el programa SENDA
 */
function mostrarInformacionPrograma() {
    const modalHTML = `
        <div class="modal-overlay temp-modal" id="about-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('about-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-info-circle"></i> Sobre el Programa SENDA</h2>
                    
                    <div style="line-height: 1.6; color: var(--text-dark);">
                        <p><strong>SENDA (Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol)</strong> es el organismo del Gobierno de Chile encargado de elaborar las políticas de prevención del consumo de drogas y alcohol, así como de tratamiento, rehabilitación e integración social de las personas afectadas por estas sustancias.</p>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Nuestros Servicios</h3>
                        <ul style="margin-left: 20px;">
                            <li>Tratamiento ambulatorio básico e intensivo</li>
                            <li>Tratamiento residencial</li>
                            <li>Programas de reinserción social</li>
                            <li>Apoyo familiar y comunitario</li>
                            <li>Prevención en establecimientos educacionales</li>
                            <li>Capacitación a profesionales</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Horarios de Atención</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Lunes a Viernes:</strong> 08:00 - 16:30</li>
                            <li><strong>Sábados y Domingos:</strong> 09:00 - 12:30</li>
                        </ul>
                        
                        <h3 style="color: var(--primary-blue); margin-top: 24px;">Contacto</h3>
                        <ul style="margin-left: 20px;">
                            <li><strong>Teléfono:</strong> 1412 (gratuito)</li>
                            <li><strong>Emergencias:</strong> 131</li>
                            <li><strong>Web:</strong> <a href="https://www.senda.gob.cl" target="_blank">www.senda.gob.cl</a></li>
                        </ul>
                        
                        <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-top: 24px;">
                            <p style="margin: 0; font-style: italic; text-align: center;">
                                "Tu recuperación es posible. Estamos aquí para acompañarte en cada paso del camino."
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <button class="btn btn-primary" onclick="cerrarModal('about-modal')">
                            <i class="fas fa-check"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('about-modal');
}

/**
 * Configura eventos específicos para búsqueda de pacientes
 */
function configurarEventosBusqueda() {
    const searchInput = document.getElementById('search-pacientes-rut');
    const searchBtn = document.getElementById('buscar-paciente-btn');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPaciente();
            }
        });
        
        searchInput.addEventListener('input', (e) => {
            import('../utilidades/formato.js')
                .then(modulo => {
                    e.target.value = modulo.formatearRUT(e.target.value);
                })
                .catch(error => console.error('Error formateando RUT:', error));
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', buscarPaciente);
    }
}

/**
 * Función auxiliar para búsqueda de pacientes
 */
function buscarPaciente() {
    import('../pacientes/busqueda.js')
        .then(modulo => modulo.buscarPacientePorRUT())
        .catch(error => console.error('Error en búsqueda de pacientes:', error));
}

/**
 * Configura eventos de filtros en solicitudes
 */
function configurarEventosFiltros() {
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            import('../solicitudes/filtros.js')
                .then(modulo => modulo.aplicarFiltroEstado(statusFilter.value))
                .catch(error => console.error('Error aplicando filtro de estado:', error));
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', () => {
            import('../solicitudes/filtros.js')
                .then(modulo => modulo.aplicarFiltroPrioridad(priorityFilter.value))
                .catch(error => console.error('Error aplicando filtro de prioridad:', error));
        });
    }
}

/**
 * Configura eventos de impresión y exportación
 */
function configurarEventosExportacion() {
    // Ctrl/Cmd + P para imprimir
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            manejarImpresion();
        }
    });
}

/**
 * Maneja la impresión de la página actual
 */
function manejarImpresion() {
    // Determinar qué contenido imprimir según la tab activa
    import('../navegacion/tabs.js')
        .then(modulo => {
            const tabActiva = modulo.obtenerTabActiva();
            
            switch (tabActiva) {
                case 'solicitudes':
                    imprimirListaSolicitudes();
                    break;
                case 'agenda':
                    imprimirCalendario();
                    break;
                case 'pacientes':
                    imprimirListaPacientes();
                    break;
                default:
                    window.print();
            }
        })
        .catch(error => {
            console.error('Error determinando contenido a imprimir:', error);
            window.print();
        });
}

/**
 * Funciones auxiliares de impresión
 */
function imprimirListaSolicitudes() {
    const contenido = document.getElementById('requests-container');
    if (contenido) {
        imprimirContenido(contenido, 'Lista de Solicitudes');
    }
}

function imprimirCalendario() {
    const contenido = document.getElementById('calendar-container');
    if (contenido) {
        imprimirContenido(contenido, 'Calendario de Citas');
    }
}

function imprimirListaPacientes() {
    const contenido = document.getElementById('patients-grid');
    if (contenido) {
        imprimirContenido(contenido, 'Lista de Pacientes');
    }
}

function imprimirContenido(elemento, titulo) {
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .no-print { display: none !important; }
                    @media print {
                        body { margin: 0; }
                        .page-break { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <p>Generado el: ${new Date().toLocaleDateString('es-CL')}</p>
                ${elemento.innerHTML}
            </body>
        </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    ventanaImpresion.print();
    ventanaImpresion.close();
}

/**
 * Configura eventos de drag and drop para archivos
 */
function configurarEventosDragDrop() {
    const dropZone = document.body;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        
        const archivos = Array.from(e.dataTransfer.files);
        if (archivos.length > 0) {
            manejarArchivosSubidos(archivos);
        }
    });
}

/**
 * Maneja archivos subidos por drag and drop
 */
function manejarArchivosSubidos(archivos) {
    archivos.forEach(archivo => {
        console.log('Archivo subido:', archivo.name, archivo.type);
        
        if (archivo.type.includes('image')) {
            // Manejar imágenes
            mostrarNotificacion(`Imagen recibida: ${archivo.name}`, 'info');
        } else if (archivo.type.includes('pdf')) {
            // Manejar PDFs
            mostrarNotificacion(`PDF recibido: ${archivo.name}`, 'info');
        } else {
            mostrarNotificacion(`Tipo de archivo no soportado: ${archivo.name}`, 'warning');
        }
    });
}

/**
 * Configura eventos para detección de pérdida de conexión
 */
function configurarEventosConexion() {
    window.addEventListener('online', () => {
        import('../utilidades/notificaciones.js')
            .then(modulo => {
                modulo.mostrarExito('Conexión restaurada');
                // Recargar datos si es necesario
                recargarDatosDespuesReconexion();
            });
    });

    window.addEventListener('offline', () => {
        import('../utilidades/notificaciones.js')
            .then(modulo => {
                modulo.mostrarAdvertencia('Sin conexión a internet. Trabajando en modo offline.');
            });
    });
}

/**
 * Recarga datos después de reconexión
 */
function recargarDatosDespuesReconexion() {
    import('../navegacion/tabs.js')
        .then(modulo => {
            const tabActiva = modulo.obtenerTabActiva();
            modulo.actualizarTab(tabActiva);
        })
        .catch(error => console.error('Error recargando datos:', error));
}

/**
 * Configura eventos de visibilidad de página
 */
function configurarEventosVisibilidad() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // La página volvió a ser visible, verificar actualizaciones
            verificarActualizacionesEnSegundoPlano();
        }
    });
}

/**
 * Verifica actualizaciones cuando la página vuelve a ser visible
 */
function verificarActualizacionesEnSegundoPlano() {
    // Solo verificar si hay un usuario autenticado
    import('../autenticacion/sesion.js')
        .then(modulo => {
            if (modulo.estaAutenticado()) {
                // Verificar actualizaciones según la tab activa
                import('../navegacion/tabs.js')
                    .then(tabsModulo => {
                        const tabActiva = tabsModulo.obtenerTabActiva();
                        if (tabActiva === 'solicitudes') {
                            // Verificar nuevas solicitudes
                            verificarNuevasSolicitudes();
                        } else if (tabActiva === 'agenda') {
                            // Verificar cambios en citas
                            verificarCambiosCitas();
                        }
                    });
            }
        });
}

/**
 * Funciones auxiliares de verificación
 */
async function verificarNuevasSolicitudes() {
    // Implementar lógica de verificación
    console.log('Verificando nuevas solicitudes...');
}

async function verificarCambiosCitas() {
    // Implementar lógica de verificación
    console.log('Verificando cambios en citas...');
}

// Inicializar todos los eventos adicionales
function inicializarEventosAdicionales() {
    configurarEventosBusqueda();
    configurarEventosFiltros();
    configurarEventosExportacion();
    configurarEventosDragDrop();
    configurarEventosConexion();
    configurarEventosVisibilidad();
}

// Hacer funciones disponibles globalmente
window.cerrarModal = cerrarModal;
window.mostrarModal = mostrarModal;

export {
    inicializarEventos,
    inicializarEventosAdicionales,
    mostrarInformacionPrograma
};
