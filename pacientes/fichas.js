/**
 * FICHAS DETALLADAS DE PACIENTES
 * Maneja la creación, edición y visualización de fichas clínicas detalladas
 */

import { obtenerFirestore } from '../configuracion/firebase.js';
import { obtenerUsuarioActual, obtenerDatosUsuarioActual } from '../autenticacion/sesion.js';
import { mostrarNotificacion, mostrarExito } from '../utilidades/notificaciones.js';
import { mostrarModal, cerrarModal, mostrarCarga } from '../utilidades/modales.js';
import { formatearFecha, alternarBotonEnvio } from '../utilidades/formato.js';

let db;

/**
 * Inicializa el sistema de fichas
 */
function inicializarFichas() {
    try {
        db = obtenerFirestore();
        console.log('✅ Sistema de fichas inicializado');
    } catch (error) {
        console.error('❌ Error inicializando fichas:', error);
    }
}

/**
 * Crea una nueva ficha clínica
 */
async function crearFichaClinica(pacienteId) {
    try {
        mostrarCarga(true, 'Cargando información del paciente...');
        
        const pacienteDoc = await db.collection('pacientes').doc(pacienteId).get();
        if (!pacienteDoc.exists) {
            mostrarNotificacion('Paciente no encontrado', 'error');
            return;
        }
        
        const paciente = { id: pacienteDoc.id, ...pacienteDoc.data() };
        mostrarModalFichaClinica(paciente);
        
    } catch (error) {
        console.error('Error creando ficha clínica:', error);
        mostrarNotificacion('Error al abrir ficha clínica', 'error');
    } finally {
        mostrarCarga(false);
    }
}

/**
 * Muestra el modal de ficha clínica
 */
function mostrarModalFichaClinica(paciente, fichaExistente = null) {
    const modalHTML = `
        <div class="modal-overlay temp-modal" id="ficha-clinica-modal">
            <div class="modal large-modal">
                <button class="modal-close" onclick="cerrarModal('ficha-clinica-modal')">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 24px;">
                    <h2><i class="fas fa-file-medical"></i> Ficha Clínica - ${paciente.nombre} ${paciente.apellidos || ''}</h2>
                    
                    <div style="background: var(--light-blue); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 14px;">
                            <div><strong>RUT:</strong> ${paciente.rut}</div>
                            <div><strong>Edad:</strong> ${paciente.edad || 'No especificada'} años</div>
                            <div><strong>CESFAM:</strong> ${paciente.cesfam}</div>
                        </div>
                    </div>
                    
                    <form id="ficha-clinica-form">
                        <input type="hidden" id="ficha-paciente-id" value="${paciente.id}">
                        <input type="hidden" id="ficha-id" value="${fichaExistente ? fichaExistente.id : ''}">
                        
                        <div class="form-sections">
                            <!-- Sección Anamnesis -->
                            <div class="form-section">
                                <h3 style="color: var(--primary-blue); margin-bottom: 16px;">
                                    <i class="fas fa-user-md"></i> Anamnesis
                                </h3>
                                
                                <div class="form-group">
                                    <label class="form-label">Motivo de consulta *</label>
                                    <textarea class="form-textarea" id="motivo-consulta" rows="3" required
                                              placeholder="Describa el motivo principal de la consulta...">${fichaExistente?.motivoConsulta || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Historia de la enfermedad actual</label>
                                    <textarea class="form-textarea" id="historia-actual" rows="4"
                                              placeholder="Evolución y características del problema actual...">${fichaExistente?.historiaActual || ''}</textarea>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label">Tiempo de evolución</label>
                                        <select class="form-select" id="tiempo-evolucion">
                                            <option value="">Seleccionar...</option>
                                            <option value="menos-1-mes" ${fichaExistente?.tiempoEvolucion === 'menos-1-mes' ? 'selected' : ''}>Menos de 1 mes</option>
                                            <option value="1-3-meses" ${fichaExistente?.tiempoEvolucion === '1-3-meses' ? 'selected' : ''}>1-3 meses</option>
                                            <option value="3-6-meses" ${fichaExistente?.tiempoEvolucion === '3-6-meses' ? 'selected' : ''}>3-6 meses</option>
                                            <option value="6-12-meses" ${fichaExistente?.tiempoEvolucion === '6-12-meses' ? 'selected' : ''}>6-12 meses</option>
                                            <option value="mas-1-ano" ${fichaExistente?.tiempoEvolucion === 'mas-1-ano' ? 'selected' : ''}>Más de 1 año</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Frecuencia de consumo actual</label>
                                        <select class="form-select" id="frecuencia-consumo">
                                            <option value="">Seleccionar...</option>
                                            <option value="diario" ${fichaExistente?.frecuenciaConsumo === 'diario' ? 'selected' : ''}>Diario</option>
                                            <option value="varios-por-semana" ${fichaExistente?.frecuenciaConsumo === 'varios-por-semana' ? 'selected' : ''}>Varios días por semana</option>
                                            <option value="semanal" ${fichaExistente?.frecuenciaConsumo === 'semanal' ? 'selected' : ''}>Semanal</option>
                                            <option value="ocasional" ${fichaExistente?.frecuenciaConsumo === 'ocasional' ? 'selected' : ''}>Ocasional</option>
                                            <option value="sin-consumo" ${fichaExistente?.frecuenciaConsumo === 'sin-consumo' ? 'selected' : ''}>Sin consumo actual</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sección Antecedentes -->
                            <div class="form-section">
                                <h3 style="color: var(--primary-blue); margin-bottom: 16px;">
                                    <i class="fas fa-history"></i> Antecedentes
                                </h3>
                                
                                <div class="form-group">
                                    <label class="form-label">Antecedentes médicos relevantes</label>
                                    <textarea class="form-textarea" id="antecedentes-medicos" rows="3"
                                              placeholder="Enfermedades, cirugías, hospitalizaciones...">${fichaExistente?.antecedentesMedicos || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Antecedentes psiquiátricos</label>
                                    <textarea class="form-textarea" id="antecedentes-psiquiatricos" rows="3"
                                              placeholder="Diagnósticos previos, tratamientos, hospitalizaciones...">${fichaExistente?.antecedentesPsiquiatricos || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Tratamientos previos por consumo de sustancias</label>
                                    <textarea class="form-textarea" id="tratamientos-previos" rows="3"
                                              placeholder="Detalle tratamientos anteriores, duración, resultados...">${fichaExistente?.tratamientosPrevios || ''}</textarea>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label">Antecedentes familiares de consumo</label>
                                        <select class="form-select" id="antecedentes-familiares">
                                            <option value="">Seleccionar...</option>
                                            <option value="si" ${fichaExistente?.antecedentesFamiliares === 'si' ? 'selected' : ''}>Sí</option>
                                            <option value="no" ${fichaExistente?.antecedentesFamiliares === 'no' ? 'selected' : ''}>No</option>
                                            <option value="desconoce" ${fichaExistente?.antecedentesFamiliares === 'desconoce' ? 'selected' : ''}>Desconoce</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Medicación actual</label>
                                        <input type="text" class="form-input" id="medicacion-actual" 
                                               placeholder="Medicamentos que toma actualmente"
                                               value="${fichaExistente?.medicacionActual || ''}">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sección Examen Mental -->
                            <div class="form-section">
                                <h3 style="color: var(--primary-blue); margin-bottom: 16px;">
                                    <i class="fas fa-brain"></i> Examen Mental
                                </h3>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label">Presentación personal</label>
                                        <select class="form-select" id="presentacion-personal">
                                            <option value="">Seleccionar...</option>
                                            <option value="adecuada" ${fichaExistente?.presentacionPersonal === 'adecuada' ? 'selected' : ''}>Adecuada</option>
                                            <option value="descuidada" ${fichaExistente?.presentacionPersonal === 'descuidada' ? 'selected' : ''}>Descuidada</option>
                                            <option value="inadecuada" ${fichaExistente?.presentacionPersonal === 'inadecuada' ? 'selected' : ''}>Inadecuada</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Estado de conciencia</label>
                                        <select class="form-select" id="estado-conciencia">
                                            <option value="">Seleccionar...</option>
                                            <option value="alerta" ${fichaExistente?.estadoConciencia === 'alerta' ? 'selected' : ''}>Alerta</option>
                                            <option value="somnoliento" ${fichaExistente?.estadoConciencia === 'somnoliento' ? 'selected' : ''}>Somnoliento</option>
                                            <option value="confuso" ${fichaExistente?.estadoConciencia === 'confuso' ? 'selected' : ''}>Confuso</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Estado de ánimo</label>
                                    <textarea class="form-textarea" id="estado-animo" rows="2"
                                              placeholder="Describa el estado de ánimo observado...">${fichaExistente?.estadoAnimo || ''}</textarea>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label">Pensamiento</label>
                                        <select class="form-select" id="pensamiento">
                                            <option value="">Seleccionar...</option>
                                            <option value="coherente" ${fichaExistente?.pensamiento === 'coherente' ? 'selected' : ''}>Coherente</option>
                                            <option value="incoherente" ${fichaExistente?.pensamiento === 'incoherente' ? 'selected' : ''}>Incoherente</option>
                                            <option value="tangencial" ${fichaExistente?.pensamiento === 'tangencial' ? 'selected' : ''}>Tangencial</option>
                                            <option value="circunstancial" ${fichaExistente?.pensamiento === 'circunstancial' ? 'selected' : ''}>Circunstancial</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Nivel de insight</label>
                                        <select class="form-select" id="insight">
                                            <option value="">Seleccionar...</option>
                                            <option value="adecuado" ${fichaExistente?.insight === 'adecuado' ? 'selected' : ''}>Adecuado</option>
                                            <option value="parcial" ${fichaExistente?.insight === 'parcial' ? 'selected' : ''}>Parcial</option>
                                            <option value="ausente" ${fichaExistente?.insight === 'ausente' ? 'selected' : ''}>Ausente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sección Evaluación -->
                            <div class="form-section">
                                <h3 style="color: var(--primary-blue); margin-bottom: 16px;">
                                    <i class="fas fa-clipboard-check"></i> Evaluación y Plan
                                </h3>
                                
                                <div class="form-group">
                                    <label class="form-label">Impresión diagnóstica</label>
                                    <textarea class="form-textarea" id="impresion-diagnostica" rows="3"
                                              placeholder="Impresión diagnóstica según criterios...">${fichaExistente?.impresionDiagnostica || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Plan de tratamiento propuesto</label>
                                    <textarea class="form-textarea" id="plan-tratamiento" rows="4"
                                              placeholder="Objetivos, intervenciones, frecuencia...">${fichaExistente?.planTratamiento || ''}</textarea>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label">Nivel de riesgo</label>
                                        <select class="form-select" id="nivel-riesgo">
                                            <option value="">Seleccionar...</option>
                                            <option value="bajo" ${fichaExistente?.nivelRiesgo === 'bajo' ? 'selected' : ''}>Bajo</option>
                                            <option value="medio" ${fichaExistente?.nivelRiesgo === 'medio' ? 'selected' : ''}>Medio</option>
                                            <option value="alto" ${fichaExistente?.nivelRiesgo === 'alto' ? 'selected' : ''}>Alto</option>
                                            <option value="critico" ${fichaExistente?.nivelRiesgo === 'critico' ? 'selected' : ''}>Crítico</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Próxima cita sugerida</label>
                                        <input type="date" class="form-input" id="proxima-cita" 
                                               value="${fichaExistente?.proximaCita || ''}">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Observaciones adicionales</label>
                                    <textarea class="form-textarea" id="observaciones" rows="3"
                                              placeholder="Observaciones, recomendaciones especiales...">${fichaExistente?.observaciones || ''}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 32px; display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <button type="button" class="btn btn-outline" onclick="cerrarModal('ficha-clinica-modal')">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="guardarBorradorFicha()">
                                <i class="fas fa-save"></i>
                                Guardar Borrador
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i>
                                ${fichaExistente ? 'Actualizar' : 'Crear'} Ficha
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    mostrarModal('ficha-clinica-modal');

    // Configurar formulario
    document.getElementById('ficha-clinica-form').addEventListener('submit', manejarGuardadoFicha);
}

/**
 * Maneja el guardado de la ficha clínica
 */
async function manejarGuardadoFicha(e) {
    e.preventDefault();
    
    try {
        const pacienteId = document.getElementById('ficha-paciente-id').value;
        const fichaId = document.getElementById('ficha-id').value;
        const esActualizacion = !!fichaId;
        
        const datosFicha = recopilarDatosFicha();
        
        if (!validarDatosFicha(datosFicha)) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        alternarBotonEnvio(submitBtn, true);
        mostrarCarga(true, esActualizacion ? 'Actualizando ficha...' : 'Creando ficha...');
        
        const userData = obtenerDatosUsuarioActual();
        const currentUser = obtenerUsuarioActual();
        
        const fichaCompleta = {
            ...datosFicha,
            pacienteId,
            profesionalId: currentUser.uid,
            profesionalNombre: `${userData.nombre} ${userData.apellidos}`,
            profesionalProfession: userData.profession,
            cesfam: userData.cesfam,
            fechaCreacion: esActualizacion ? undefined : firebase.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        let fichaRef;
        if (esActualizacion) {
            await db.collection('fichas_clinicas').doc(fichaId).update(fichaCompleta);
            fichaRef = { id: fichaId };
        } else {
            fichaRef = await db.collection('fichas_clinicas').add(fichaCompleta);
        }
        
        // Actualizar información del paciente si es necesario
        if (datosFicha.nivelRiesgo) {
            await db.collection('pacientes').doc(pacienteId).update({
                nivelRiesgo: datosFicha.nivelRiesgo,
                fechaUltimaFicha: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        cerrarModal('ficha-clinica-modal');
        mostrarExito(esActualizacion ? 'Ficha actualizada correctamente' : 'Ficha clínica creada correctamente');
        
        // Disparar evento
        const evento = new CustomEvent('fichaGuardada', {
            detail: { pacienteId, fichaId: fichaRef.id }
        });
        document.dispatchEvent(evento);
        
    } catch (error) {
        console.error('Error guardando ficha:', error);
        mostrarNotificacion('Error al guardar ficha: ' + error.message, 'error');
    } finally {
        mostrarCarga(false);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) alternarBotonEnvio(submitBtn, false);
    }
}

/**
 * Recopila los datos del formulario de ficha
 */
function recopilarDatosFicha() {
    return {
        motivoConsulta: document.getElementById('motivo-consulta')?.value?.trim(),
        historiaActual: document.getElementById('historia-actual')?.value?.trim(),
        tiempoEvolucion: document.getElementById('tiempo-evolucion')?.value,
        frecuenciaConsumo: document.getElementById('frecuencia-consumo')?.value,
        antecedentesMedicos: document.getElementById('antecedentes-medicos')?.value?.trim(),
        antecedentesPsiquiatricos: document.getElementById('antecedentes-psiquiatricos')?.value?.trim(),
        tratamientosPrevios: document.getElementById('tratamientos-previos')?.value?.trim(),
        antecedentesFamiliares: document.getElementById('antecedentes-familiares')?.value,
        medicacionActual: document.getElementById('medicacion-actual')?.value?.trim(),
        presentacionPersonal: document.getElementById('presentacion-personal')?.value,
        estadoConciencia: document.getElementById('estado-conciencia')?.value,
        estadoAnimo: document.getElementById('estado-animo')?.value?.trim(),
        pensamiento: document.getElementById('pensamiento')?.value,
        insight: document.getElementById('insight')?.value,
        impresionDiagnostica: document.getElementById('impresion-diagnostica')?.value?.trim(),
        planTratamiento: document.getElementById('plan-tratamiento')?.value?.trim(),
        nivelRiesgo: document.getElementById('nivel-riesgo')?.value,
        proximaCita: document.getElementById('proxima-cita')?.value,
        observaciones: document.getElementById('observaciones')?.value?.trim()
    };
}

/**
 * Valida los datos de la ficha
 */
function validarDatosFicha(datos) {
    if (!datos.motivoConsulta) {
        mostrarNotificacion('El motivo de consulta es obligatorio', 'warning');
        return false;
    }
    
    return true;
}

/**
 * Guarda un borrador de la ficha
 */
async function guardarBorradorFicha() {
    try {
        const pacienteId = document.getElementById('ficha-paciente-id').value;
        const datosFicha = recopilarDatosFicha();
        
        const borradorData = {
            pacienteId,
            datosFicha,
            fechaGuardado: firebase.firestore.FieldValue.serverTimestamp(),
            guardadoPor: obtenerUsuarioActual().uid
        };
        
        await db.collection('borradores_fichas').doc(pacienteId).set(borradorData);
        mostrarNotificacion('Borrador guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarNotificacion('Error al guardar borrador', 'error');
    }
}

/**
 * Carga fichas clínicas de un paciente
 */
async function cargarFichasClinicas(pacienteId) {
    try {
        const fichasSnapshot = await db.collection('fichas_clinicas')
            .where('pacienteId', '==', pacienteId)
            .orderBy('fechaCreacion', 'desc')
            .get();

        const fichas = [];
        fichasSnapshot.forEach(doc => {
            fichas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return fichas;

    } catch (error) {
        console.error('Error cargando fichas clínicas:', error);
        return [];
    }
}

// Funciones globales
window.crearFichaClinica = crearFichaClinica;
window.guardarBorradorFicha = guardarBorradorFicha;

export {
    inicializarFichas,
    crearFichaClinica,
    cargarFichasClinicas,
    mostrarModalFichaClinica
};
