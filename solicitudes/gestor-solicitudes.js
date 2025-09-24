/**
 * GESTOR DE SOLICITUDES
 * Maneja la carga, visualización y gestión de solicitudes de ingreso
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerDatosUsuarioActual, tieneAccesoSolicitudes } from '../autenticacion/sesion.js';
import { APP_CONFIG, COLORES_PRIORIDAD, ICONOS_ESTADO } from '../configuracion/constantes.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha, truncarTexto } from '../utilidades/formato.js';
import { establecerCache, obtenerCache } from '../utilidades/cache.js';

let db;
let solicitudesData = [];
let filtroActual = 'todas';
let filtroPrioridadActual = '';

/**
 * Inicializa el gestor de solicitudes
 */
function inicializarGestorSolicitudes() {
    try {
        db = obtenerFirestore();
        configurarFiltrosSolicitudes();
        console.log('✅ Gestor de solicitudes inicializado');
    } catch (error) {
        console.error('❌ Error inicializando gestor de solicitudes:', error);
        throw error;
    }
}

/**
 * Configura los filtros de solicitudes
 */
function configurarFiltrosSolicitudes() {
    const filtroEstado = document.getElementById('status-filter');
    const filtroPrioridad = document.getElementById('priority-filter');

    if (filtroEstado) {
        filtroEstado.addEventListener('change', (e) => {
            filtroActual = e.target.value;
            filtrarSolicitudes();
        });
    }

    if (filtroPrioridad) {
        filtroPrioridad.addEventListener('change', (e) => {
            filtroPrioridadActual = e.target.value;
            filtrarSolicitudes();
        });
    }
}

/**
 * Carga las solicitudes desde Firestore
 */
async function cargarSolicitudes() {
    const userData = obtenerDatosUsuarioActual();
    
    if (!userData || !tieneAccesoSolicitudes()) {
        console.log('Usuario no tiene acceso a solicitudes');
        return;
    }

    try {
        mostrarCarga(true, 'Cargando solicitudes...');
        
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }

        // Verificar cache
        const cacheKey = `solicitudes_${userData.cesfam}`;
        const datosCacheados = obtenerCache(cacheKey);
        
        if (datosCacheados) {
            solicitudesData = datosCacheados;
            renderizarSolicitudes(solicitudesData);
            return;
        }

        await cargarSolicitudesDesdeFirestore();
        
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        renderizarErrorSolicitudes(error);
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Carga solicitudes directamente desde Firestore
 */
async function cargarSolicitudesDesdeFirestore() {
    const userData = obtenerDatosUsuarioActual();
    const solicitudes = [];

    console.log('Cargando solicitudes para CESFAM:', userData.cesfam);

    try {
        // Cargar solicitudes de ingreso
        const solicitudesSnapshot = await db.collection('solicitudes_ingreso')
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();

        console.log('Solicitudes_ingreso encontradas:', solicitudesSnapshot.size);

        solicitudesSnapshot.forEach(doc => {
            solicitudes.push({
                id: doc.id,
                tipo: 'solicitud',
                ...doc.data()
            });
        });

        // Cargar reingresos
        const reingresosSnapshot = await db.collection('reingresos')
            .where('cesfam', '==', userData.cesfam)
            .orderBy('fechaCreacion', 'desc')
            .limit(APP_CONFIG.PAGINATION_LIMIT)
            .get();

        console.log('Reingresos encontrados:', reingresosSnapshot.size);

        reingresosSnapshot.forEach(doc => {
            solicitudes.push({
                id: doc.id,
                tipo: 'reingreso',
                ...doc.data()
            });
        });

        // Cargar solicitudes de información (solo para asistentes sociales)
        if (userData.profession === 'asistente_social') {
            const informacionSnapshot = await db.collection('solicitudes_informacion')
                .orderBy('fechaCreacion', 'desc')
                .limit(50)
                .get();

            console.log('Solicitudes información encontradas:', informacionSnapshot.size);

            informacionSnapshot.forEach(doc => {
                solicitudes.push({
                    id: doc.id,
                    tipo: 'informacion',
                    tipoSolicitud: 'informacion',
                    ...doc.data()
                });
            });
        }

    } catch (error) {
        console.error('Error cargando desde Firestore:', error);
        throw error;
    }

    // Ordenar por fecha
    solicitudes.sort((a, b) => {
        const fechaA = a.fechaCreacion?.toDate() || new Date(0);
        const fechaB = b.fechaCreacion?.toDate() || new Date(0);
        return fechaB - fechaA;
    });

    console.log('Total solicitudes procesadas:', solicitudes.length);

    solicitudesData = solicitudes;

    // Cachear datos
    const cacheKey = `solicitudes_${userData.cesfam}`;
    establecerCache(cacheKey, solicitudes);

    renderizarSolicitudes(solicitudes);
}

/**
 * Renderiza las solicitudes en la interfaz
 */
function renderizarSolicitudes(solicitudes) {
    try {
        const container = document.getElementById('requests-container');
        if (!container) {
            console.error('Container requests-container no encontrado');
            return;
        }

        console.log('Renderizando solicitudes:', solicitudes.length);

        if (solicitudes.length === 0) {
            container.innerHTML = crearMensajeSinSolicitudes();
            return;
        }

        container.innerHTML = solicitudes.map(solicitud => crearTarjetaSolicitud(solicitud)).join('');

        // Agregar event listeners
        agregarEventListenersTarjetas(container);

        console.log(`Renderizadas ${solicitudes.length} solicitudes`);
    } catch (error) {
        console.error('Error renderizando solicitudes:', error);
    }
}

/**
 * Crea el HTML para una tarjeta de solicitud
 */
function crearTarjetaSolicitud(solicitud) {
    try {
        const
