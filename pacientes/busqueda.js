/**
 * BÚSQUEDA DE PACIENTES
 * Módulo para búsqueda avanzada por RUT y nombre
 */

import { db } from '../configuracion/firebase.js';
import { mostrarNotificacion } from '../utilidades/notificaciones.js';
import { formatRUT, limpiarTexto } from '../utilidades/formato.js';

/**
 * Busca paciente por RUT en el CESFAM actual
 * @param {string} rut
 * @param {string} cesfam
 * @returns {Promise<Array>}
 */
async function buscarPacientePorRUT(rut, cesfam) {
    try {
        const rutFormateado = formatRUT(rut);
        const snapshot = await db.collection('pacientes')
            .where('rut', '==', rutFormateado)
            .where('cesfam', '==', cesfam)
            .get();

        if (snapshot.empty) {
            mostrarNotificacion(`No se encontró paciente con RUT ${rutFormateado}`, 'warning');
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        mostrarNotificacion('Error en búsqueda de paciente: ' + error.message, 'error');
        return [];
    }
}

/**
 * Busca pacientes por nombre parcial y CESFAM
 * @param {string} nombre
 * @param {string} cesfam
 * @returns {Promise<Array>}
 */
async function buscarPacientesPorNombre(nombre, cesfam) {
    try {
        const nombreLimpo = limpiarTexto(nombre);
        let consulta = db.collection('pacientes').where('cesfam', '==', cesfam);

        if (nombreLimpo) {
            consulta = consulta.where('nombre', '>=', nombreLimpo)
                .where('nombre', '<=', nombreLimpo + '\uf8ff');
        }

        const snapshot = await consulta.limit(20).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        mostrarNotificacion('Error buscando pacientes: ' + error.message, 'error');
        return [];
    }
}

export {
    buscarPacientePorRUT,
    buscarPacientesPorNombre
};
