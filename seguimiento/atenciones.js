import { getFirestore } from '../configuracion/firebase.js';
import { showNotification } from '../utilidades/notificaciones.js';

// Variables globales
let currentAttention = null;
let attentionTemplates = [];

// Inicializar registro de atenciones
export function initAttentions() {
    setupAttentionForm();
    setupAttentionTemplates();
    setupAttentionSearch();
    loadAttentionTemplates();
    console.log('🩺 Registro de atenciones inicializado');
}

// Configurar formulario de atenciones
function setupAttentionForm() {
    const form = document.getElementById('attention-form');
    if (form) {
        form.addEventListener('submit', handleAttentionSubmit);
    }

    // Configurar campos dinámicos
    setupAttentionTypeSelect();
    setupProfessionalsSelect();
    setupDurationCalculator();
}

// Manejar envío del formulario de atención
async function handleAttentionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const attentionData = {
        pacienteId: formData.get('patient-id'),
        fechaAtencion: formData.get('attention-date'),
        horaInicio: formData.get('start-time'),
        horaFin: formData.get('end-time'),
        tipoAtencion: formData.get('attention-type'),
        profesional: formData.get('professional'),
        modalidad: formData.get('modality'), // presencial, virtual, telefonica
        
        // Datos clínicos
        motivoConsulta: formData.get('consultation-reason'),
        anamnesis: formData.get('anamnesis'),
        examenFisico: formData.get('physical-exam'),
        diagnostico: formData.get('diagnosis'),
        planTratamiento: formData.get('treatment-plan'),
        indicaciones: formData.get('indications'),
        observaciones: formData.get('observations'),
        
        // Escalas y evaluaciones
        escalas: collectScaleData(formData),
        
        // Estado del paciente
        estadoAnimo: formData.get('mood-state'),
        adherenciaTratamiento: formData.get('treatment-adherence'),
        
        // Seguimiento
        proximaCita: formData.get('next-appointment'),
        frecuenciaSeguimiento: formData.get('follow-up-frequency'),
        
        // Metadata
        duracionMinutos: calculateDuration(formData.get('start-time'), formData.get('end-time')),
        estado: 'completada',
        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validar campos requeridos
    if (!validateAttentionData(attentionData)) {
        return;
    }

    try {
        await saveAttention(attentionData);
        
        // Limpiar formulario
        e.target.reset();
        
        // Actualizar timeline del paciente
        if (attentionData.pacienteId) {
            await updatePatientLastAttention(attentionData.pacienteId, attentionData);
        }
        
        showNotification('Atención registrada exitosamente', 'success');
        
        // Preguntar si desea programar próxima cita
        if (attentionData.proximaCita) {
            askToScheduleNextAppointment(attentionData);
        }
        
    } catch (error) {
        console.error('Error guardando atención:', error);
        showNotification('Error al registrar la atención', 'error');
    }
}

// Validar datos de atención
function validateAttentionData(data) {
    const required = ['pacienteId', 'fechaAtencion', 'horaInicio', 'tipoAtencion', 'profesional'];
    
    for (const field of required) {
        if (!data[field]) {
            showNotification(`El campo ${getFieldLabel(field)} es requerido`, 'error');
            return false;
        }
    }

    // Validar que hora fin sea posterior a hora inicio
    if (data.horaFin && data.horaInicio >= data.horaFin) {
        showNotification('La hora de fin debe ser posterior a la hora de inicio', 'error');
        return false;
    }

    return true;
}

// Guardar atención
async function saveAttention(attentionData) {
    const db = getFirestore();
    const atencionesRef = db.collection('atenciones');
    const docRef = await atencionesRef.add(attentionData);
    
    // Agregar al historial del paciente
    await addToPatientHistory(attentionData, docRef.id);
    
    return docRef.id;
}

// Agregar al historial del paciente
async function addToPatientHistory(attentionData, attentionId) {
    const db = getFirestore();
    const historialRef = db.collection('historial_pacientes');
    await historialRef.add({
        pacienteId: attentionData.pacienteId,
        tipo: 'Atención',
        subtipo: attentionData.tipoAtencion,
        fecha: attentionData.fechaAtencion,
        hora: attentionData.horaInicio,
        titulo: `${attentionData.tipoAtencion} - ${attentionData.profesional}`,
        descripcion: attentionData.motivoConsulta || attentionData.observaciones || '',
        profesional: attentionData.profesional,
        referenciaId: attentionId,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Actualizar última atención del paciente
async function updatePatientLastAttention(patientId, attentionData) {
    const db = getFirestore();
    const pacienteRef = db.collection('pacientes').doc(patientId);
    await pacienteRef.update({
        ultimaAtencion: attentionData.fechaAtencion,
        ultimoProfesional: attentionData.profesional,
        fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Configurar selector de tipo de atención
function setupAttentionTypeSelect() {
    const select = document.getElementById('attention-type');
    if (!select) return;

    const attentionTypes = [
        { value: 'consulta_inicial', label: 'Consulta Inicial' },
        { value: 'consulta_control', label: 'Consulta de Control' },
        { value: 'evaluacion_psicologica', label: 'Evaluación Psicológica' },
        { value: 'terapia_individual', label: 'Terapia Individual' },
        { value: 'terapia_grupal', label: 'Terapia Grupal' },
        { value: 'intervencion_familiar', label: 'Intervención Familiar' },
        { value: 'seguimiento_telefonico', label: 'Seguimiento Telefónico' },
        { value: 'visita_domiciliaria', label: 'Visita Domiciliaria' },
        { value: 'derivacion', label: 'Derivación' },
        { value: 'alta_medica', label: 'Alta Médica' }
    ];

    select.innerHTML = '<option value="">Seleccionar tipo de atención</option>';
    
    attentionTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        select.appendChild(option);
    });

    // Event listener para mostrar campos específicos según tipo
    select.addEventListener('change', handleAttentionTypeChange);
}

// Manejar cambio de tipo de atención
function handleAttentionTypeChange(e) {
    const selectedType = e.target.value;
    showRelevantFields(selectedType);
}

// Mostrar campos relevantes según tipo de atención
function showRelevantFields(type) {
    // Ocultar todos los campos opcionales primero
    const optionalSections = document.querySelectorAll('.attention-section.optional');
    optionalSections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar campos relevantes según el tipo
    const fieldMapping = {
        'consulta_inicial': ['anamnesis', 'physical-exam', 'diagnosis', 'treatment-plan'],
        'consulta_control': ['physical-exam', 'treatment-adherence', 'observations'],
        'evaluacion_psicologica': ['anamnesis', 'scales', 'diagnosis'],
        'terapia_individual': ['mood-state', 'treatment-adherence', 'observations'],
        'terapia_grupal': ['mood-state', 'observations'],
        'seguimiento_telefonico': ['treatment-adherence', 'mood-state', 'next-appointment'],
        'derivacion': ['consultation-reason', 'diagnosis', 'indications']
    };

    const fieldsToShow = fieldMapping[type] || [];
    fieldsToShow.forEach(fieldName => {
        const section = document.querySelector(`[data-field="${fieldName}"]`);
        if (section) {
            section.style.display = 'block';
        }
    });
}

/**
 * Configura el selector de profesionales
 */
async function setupProfessionalsSelect() {
    try {
        const db = getFirestore();
        if (!db) {
            console.warn('Base de datos no inicializada');
            return;
        }

        const profRef = db.collection('profesionales');
        const snapshot = await profRef.where('activo', '==', true).get();
        
        const select = document.getElementById('professional-select') || document.getElementById('professional');
        if (!select) {
            console.warn('Elemento professional-select o professional no encontrado');
            return;
        }

        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar profesional</option>';

        // Agregar profesionales
        snapshot.forEach(doc => {
            const prof = doc.data();
            const option = document.createElement('option');
            option.value = prof.id || doc.id;
            option.textContent = `${prof.nombre} - ${prof.especialidad || 'Sin especialidad'}`;
            select.appendChild(option);
        });

        console.log(`✅ ${snapshot.size} profesionales cargados en selector`);

    } catch (error) {
        console.error('❌ Error cargando profesionales para selector:', error);
        
        // Fallback: crear opción por defecto
        const select = document.getElementById('professional-select') || document.getElementById('professional');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar profesional</option>';
        }
    }
}

// Configurar calculador de duración
function setupDurationCalculator() {
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const durationDisplay = document.getElementById('duration-display');

    if (startTimeInput && endTimeInput && durationDisplay) {
        const updateDuration = () => {
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            
            if (startTime && endTime) {
                const duration = calculateDuration(startTime, endTime);
                durationDisplay.textContent = `Duración: ${duration} minutos`;
            } else {
                durationDisplay.textContent = '';
            }
        };

        startTimeInput.addEventListener('change', updateDuration);
        endTimeInput.addEventListener('change', updateDuration);
    }
}

// Calcular duración en minutos
function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    const diffMs = end - start;
    return Math.round(diffMs / (1000 * 60));
}

// Recopilar datos de escalas
function collectScaleData(formData) {
    const scales = {};
    
    // Escalas comunes en salud mental
    const commonScales = [
        'beck-depression',
        'beck-anxiety', 
        'hamilton-depression',
        'hamilton-anxiety',
        'phq9',
        'gad7',
        'audit',
        'cage'
    ];

    commonScales.forEach(scale => {
        const value = formData.get(`scale-${scale}`);
        if (value) {
            scales[scale] = {
                valor: parseInt(value),
                fecha: formData.get('attention-date'),
                interpretacion: getScaleInterpretation(scale, parseInt(value))
            };
        }
    });

    return scales;
}

// Obtener interpretación de escalas
function getScaleInterpretation(scale, value) {
    const interpretations = {
        'phq9': {
            ranges: [
                { min: 0, max: 4, text: 'Mínima depresión' },
                { min: 5, max: 9, text: 'Depresión leve' },
                { min: 10, max: 14, text: 'Depresión moderada' },
                { min: 15, max: 19, text: 'Depresión moderadamente severa' },
                { min: 20, max: 27, text: 'Depresión severa' }
            ]
        },
        'gad7': {
            ranges: [
                { min: 0, max: 4, text: 'Ansiedad mínima' },
                { min: 5, max: 9, text: 'Ansiedad leve' },
                { min: 10, max: 14, text: 'Ansiedad moderada' },
                { min: 15, max: 21, text: 'Ansiedad severa' }
            ]
        }
    };

    const scaleData = interpretations[scale];
    if (!scaleData) return 'Sin interpretación disponible';

    const range = scaleData.ranges.find(r => value >= r.min && value <= r.max);
    return range ? range.text : 'Valor fuera de rango';
}

// Configurar plantillas de atención
function setupAttentionTemplates() {
    const templateSelect = document.getElementById('attention-template');
    if (templateSelect) {
        templateSelect.addEventListener('change', handleTemplateSelect);
    }
}

// Cargar plantillas de atención
async function loadAttentionTemplates() {
    try {
        const db = getFirestore();
        const templatesRef = db.collection('plantillas_atencion');
        const snapshot = await templatesRef.where('activa', '==', true).get();
        
        attentionTemplates = [];
        snapshot.forEach(doc => {
            attentionTemplates.push({
                id: doc.id,
                ...doc.data()
            });
        });

        populateTemplateSelect();

    } catch (error) {
        console.error('Error cargando plantillas:', error);
    }
}

// Poblar selector de plantillas
function populateTemplateSelect() {
    const select = document.getElementById('attention-template');
    if (!select) return;

    select.innerHTML = '<option value="">Usar plantilla...</option>';
    
    attentionTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.nombre;
        select.appendChild(option);
    });
}

// Manejar selección de plantilla
function handleTemplateSelect(e) {
    const templateId = e.target.value;
    if (!templateId) return;

    const template = attentionTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Aplicar plantilla al formulario
    applyTemplateToForm(template);
}

// Aplicar plantilla al formulario
function applyTemplateToForm(template) {
    // Llenar campos con datos de la plantilla
    if (template.tipoAtencion) {
        const typeSelect = document.getElementById('attention-type');
        if (typeSelect) typeSelect.value = template.tipoAtencion;
    }

    if (template.duracionDefecto) {
        // Calcular hora fin basada en duración
        const startTime = document.getElementById('start-time').value;
        if (startTime) {
            const endTime = addMinutesToTime(startTime, template.duracionDefecto);
            document.getElementById('end-time').value = endTime;
        }
    }

    // Plantillas de texto
    const textFields = [
        'anamnesis', 'physical-exam', 'diagnosis', 
        'treatment-plan', 'indications', 'observations'
    ];

    textFields.forEach(field => {
        if (template[field]) {
            const element = document.getElementById(field);
            if (element) {
                element.value = template[field];
            }
        }
    });

    showNotification(`Plantilla "${template.nombre}" aplicada`, 'success');
}

// Configurar búsqueda de atenciones
function setupAttentionSearch() {
    const searchInput = document.getElementById('attention-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleAttentionSearch, 300));
    }
}

// Manejar búsqueda de atenciones
async function handleAttentionSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length < 3) {
        clearSearchResults();
        return;
    }

    try {
        const results = await searchAttentions(query);
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Error en búsqueda de atenciones:', error);
    }
}

// Buscar atenciones
async function searchAttentions(query) {
    const db = getFirestore();
    const atencionesRef = db.collection('atenciones');
    
    // Buscar por diferentes campos
    const queries = [
        atencionesRef.where('motivoConsulta', '>=', query).where('motivoConsulta', '<=', query + '\uf8ff'),
        atencionesRef.where('diagnostico', '>=', query).where('diagnostico', '<=', query + '\uf8ff'),
        atencionesRef.where('profesional', '>=', query).where('profesional', '<=', query + '\uf8ff')
    ];

    const results = [];
    
    for (const queryRef of queries) {
        const snapshot = await queryRef.limit(10).get();
        snapshot.forEach(doc => {
            const exists = results.find(r => r.id === doc.id);
            if (!exists) {
                results.push({ id: doc.id, ...doc.data() });
            }
        });
    }

    return results;
}

// Preguntar si programar próxima cita
function askToScheduleNextAppointment(attentionData) {
    if (!attentionData.proximaCita) return;

    const shouldSchedule = confirm(
        `¿Desea programar la próxima cita para el ${formatDate(attentionData.proximaCita)}?`
    );

    if (shouldSchedule) {
        // Redirigir al calendario o abrir modal de citas
        window.location.hash = `#calendario?patient=${attentionData.pacienteId}&date=${attentionData.proximaCita}`;
    }
}

// Funciones utilitarias
function getFieldLabel(field) {
    const labels = {
        'pacienteId': 'Paciente',
        'fechaAtencion': 'Fecha de atención',
        'horaInicio': 'Hora de inicio',
        'tipoAtencion': 'Tipo de atención',
        'profesional': 'Profesional'
    };
    return labels[field] || field;
}

function addMinutesToTime(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().slice(0, 5);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function clearSearchResults() {
    // Implementar limpieza de resultados de búsqueda
}

function displaySearchResults(results) {
    // Implementar visualización de resultados
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones principales
export {
    handleAttentionSubmit,
    saveAttention,
    loadAttentionTemplates,
    searchAttentions,
    setupProfessionalsSelect
};
