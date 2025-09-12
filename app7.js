// ================= PARTE 7: GESTIÓN DE PACIENTES Y SEGUIMIENTOS =================

async function loadPatientsPanel(userData) {
  console.log('Loading patients panel for:', userData.nombre);
  
  try {
    const patientsList = document.getElementById('patients-list');
    if (!patientsList) return;
    
    patientsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
    
    // Obtener pacientes activos
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      patientsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay pacientes registrados en el sistema.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    for (const doc of patientsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener profesional asignado si existe
      let professionalName = 'Sin asignar';
      if (data.estado_actual?.profesional_asignado) {
        try {
          const profDoc = await db.collection('profesionales').doc(data.estado_actual.profesional_asignado).get();
          if (profDoc.exists) {
            professionalName = profDoc.data().nombre;
          }
        } catch (error) {
          console.error('Error loading professional:', error);
        }
      }
      
      // Calcular última actividad
      const lastActivity = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1].fecha
        : data.metadata?.fecha_creacion;
      
      html += `
        <div class="card patient-card" data-patient-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h3>
              <p>RUT: ${data.datos_personales?.rut || 'Sin RUT'}</p>
              <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">
                ${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div style="margin-top: 8px;">
                <span class="priority-indicator priority-${data.estado_actual?.prioridad || 'media'}">
                  ${data.estado_actual?.prioridad || 'MEDIA'}
                </span>
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'No especificado'}</div>
            <div><strong>Profesional asignado:</strong> ${professionalName}</div>
            <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
            <div><strong>Comuna:</strong> ${data.datos_personales?.comuna || 'N/A'}</div>
            <div><strong>Última actividad:</strong> ${formatDate(lastActivity)}</div>
            <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'Sin teléfono'}</div>
            <div><strong>Email:</strong> ${data.contacto?.email || 'Sin email'}</div>
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${doc.id}')">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
            <button class="btn btn-secondary btn-sm" onclick="viewPatientHistory('${doc.id}')">
              <i class="fas fa-history"></i> Historial
            </button>
            <button class="btn btn-success btn-sm" onclick="addFollowupNote('${doc.id}')">
              <i class="fas fa-notes-medical"></i> Agregar Nota
            </button>
            <button class="btn btn-info btn-sm" onclick="scheduleAppointment('${doc.id}')">
              <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </div>
      `;
    }
    
    patientsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading patients:', error);
    const patientsList = document.getElementById('patients-list');
    if (patientsList) {
      patientsList.innerHTML = '<p>Error al cargar pacientes: ' + error.message + '</p>';
    }
  }
}

async function viewPatientDetail(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const data = doc.data();
    showPatientDetailModal(patientId, data);
  } catch (error) {
    console.error('Error viewing patient detail:', error);
    showNotification('Error al cargar detalle del paciente', 'error');
  }
}

function showPatientDetailModal(patientId, data) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle del Paciente</h2>
        
        <div class="patient-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              <div><strong>Nombre completo:</strong> ${data.datos_personales?.nombre_completo || 'N/A'}</div>
              <div><strong>RUT:</strong> ${data.datos_personales?.rut || 'N/A'}</div>
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
              <div><strong>Comuna:</strong> ${data.datos_personales?.comuna || 'N/A'}</div>
              <div><strong>Dirección:</strong> ${data.datos_personales?.direccion || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos de Contacto</h3>
            <div class="info-grid">
              <div><strong>Teléfono:</strong> ${data.contacto?.telefono || 'N/A'}</div>
              <div><strong>Email:</strong> ${data.contacto?.email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Estado Actual</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">${data.estado_actual?.activo ? 'Activo' : 'Inactivo'}</span></div>
              <div><strong>Programa:</strong> ${data.estado_actual?.programa || 'N/A'}</div>
              <div><strong>Fecha de ingreso:</strong> ${formatDate(data.estado_actual?.fecha_ingreso)}</div>
            </div>
          </div>
          
          ${data.historial_clinico && data.historial_clinico.length > 0 ? `
          <div class="detail-section">
            <h3>Última Evaluación</h3>
            <div class="info-grid">
              ${data.historial_clinico[0].evaluacion_inicial ? `
                <div><strong>Sustancias:</strong> ${data.historial_clinico[0].evaluacion_inicial.sustancias_consumo?.join(', ') || 'N/A'}</div>
                <div><strong>Tiempo de consumo:</strong> ${data.historial_clinico[0].evaluacion_inicial.tiempo_consumo_meses || 'N/A'} meses</div>
                <div><strong>Motivación:</strong> ${data.historial_clinico[0].evaluacion_inicial.motivacion_cambio || 'N/A'}/10</div>
                <div><strong>Urgencia:</strong> ${data.historial_clinico[0].evaluacion_inicial.urgencia_declarada || 'N/A'}</div>
              ` : ''}
            </div>
          </div>
          ` : ''}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-success" onclick="addFollowupNote('${patientId}')">
            <i class="fas fa-notes-medical"></i> Agregar Nota de Seguimiento
          </button>
          <button class="btn btn-secondary" onclick="viewPatientHistory('${patientId}')">
            <i class="fas fa-history"></i> Ver Historial Completo
          </button>
          <button class="btn btn-info" onclick="generatePatientReport('${patientId}')">
            <i class="fas fa-file-alt"></i> Generar Reporte
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-detail-modal').style.display = 'flex';
}

async function viewPatientHistory(patientId) {
  try {
    const doc = await db.collection('pacientes').doc(patientId).get();
    if (!doc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const data = doc.data();
    showPatientHistoryModal(patientId, data);
  } catch (error) {
    console.error('Error viewing patient history:', error);
    showNotification('Error al cargar historial del paciente', 'error');
  }
}

function showPatientHistoryModal(patientId, data) {
  const historial = data.historial_clinico || [];
  
  const modalHTML = `
    <div class="modal-overlay" id="patient-history-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-history-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Historial Clínico - ${data.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
        
        <div class="history-timeline">
          ${historial.length > 0 ? historial.map((entry, index) => `
            <div class="timeline-item">
              <div class="timeline-marker">
                <i class="fas fa-${entry.tipo === 'ingreso_inicial' ? 'user-plus' : 
                                   entry.tipo === 'seguimiento' ? 'notes-medical' : 
                                   entry.tipo === 'cita' ? 'calendar-check' : 'file-medical'}"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h4>${entry.tipo?.replace('_', ' ').toUpperCase() || 'Registro'}</h4>
                  <span class="timeline-date">${formatDate(entry.fecha)}</span>
                </div>
                <div class="timeline-body">
                  ${entry.observaciones ? `<p><strong>Observaciones:</strong> ${entry.observaciones}</p>` : ''}
                  ${entry.evaluacion_inicial ? `
                    <div class="evaluation-details">
                      <p><strong>Evaluación Inicial:</strong></p>
                      <ul>
                        ${entry.evaluacion_inicial.sustancias_consumo ? 
                          `<li>Sustancias: ${entry.evaluacion_inicial.sustancias_consumo.join(', ')}</li>` : ''}
                        ${entry.evaluacion_inicial.tiempo_consumo_meses ? 
                          `<li>Tiempo de consumo: ${entry.evaluacion_inicial.tiempo_consumo_meses} meses</li>` : ''}
                        ${entry.evaluacion_inicial.motivacion_cambio ? 
                          `<li>Motivación al cambio: ${entry.evaluacion_inicial.motivacion_cambio}/10</li>` : ''}
                      </ul>
                    </div>
                  ` : ''}
                  ${entry.notas_seguimiento ? `<p><strong>Notas:</strong> ${entry.notas_seguimiento}</p>` : ''}
                </div>
              </div>
            </div>
          `).join('') : '<p style="text-align: center; color: var(--gray-600);">No hay registros en el historial</p>'}
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-primary" onclick="addFollowupNote('${patientId}')">
            <i class="fas fa-plus"></i> Agregar Nueva Nota
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-history-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-history-modal').style.display = 'flex';
}

function addFollowupNote(patientId) {
  const modalHTML = `
    <div class="modal-overlay" id="followup-note-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('followup-note-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agregar Nota de Seguimiento</h2>
        
        <form id="followup-note-form">
          <div class="form-group">
            <label class="form-label">Tipo de registro *</label>
            <select class="form-select" id="followup-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="seguimiento">Seguimiento general</option>
              <option value="cita">Registro de cita</option>
              <option value="evaluacion">Evaluación</option>
              <option value="crisis">Intervención en crisis</option>
              <option value="derivacion">Derivación</option>
              <option value="alta">Alta del programa</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas y observaciones *</label>
            <textarea class="form-textarea" id="followup-notes" rows="6" required
                      placeholder="Describe la situación, intervenciones realizadas, evolución del paciente, plan de seguimiento, etc."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado del paciente</label>
            <select class="form-select" id="patient-status">
              <option value="estable">Estable</option>
              <option value="mejoria">En mejoría</option>
              <option value="deterioro">En deterioro</option>
              <option value="crisis">En crisis</option>
              <option value="alta_voluntaria">Alta voluntaria</option>
              <option value="abandono">Abandono de tratamiento</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Próxima cita programada</label>
            <input type="datetime-local" class="form-input" id="next-appointment" min="2025-01-01T08:00">
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Guardar Nota
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('followup-note-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('followup-note-modal').style.display = 'flex';
  
  document.getElementById('followup-note-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveFollowupNote(patientId);
  });
}

async function saveFollowupNote(patientId) {
  try {
    showLoading(true);
    
    const noteData = {
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: document.getElementById('followup-type').value,
      profesional: currentUserData.uid,
      notas_seguimiento: document.getElementById('followup-notes').value,
      estado_paciente: document.getElementById('patient-status').value,
      observaciones: `Nota de seguimiento registrada por ${currentUserData.nombre}`
    };
    
    const nextAppointment = document.getElementById('next-appointment').value;
    if (nextAppointment) {
      noteData.proxima_cita = new Date(nextAppointment);
    }
    
    // Agregar al historial del paciente
    await db.collection('pacientes').doc(patientId).update({
      historial_clinico: firebase.firestore.FieldValue.arrayUnion(noteData),
      'metadata.ultima_actualizacion': firebase.firestore.FieldValue.serverTimestamp(),
      'metadata.actualizado_por': currentUserData.uid
    });
    
    showNotification('Nota de seguimiento agregada correctamente', 'success');
    closeModal('followup-note-modal');
    
    // Recargar panel de pacientes si está visible
    if (document.getElementById('patients-panel').classList.contains('active')) {
      loadPatientsPanel(currentUserData);
    }
    
  } catch (error) {
    console.error('Error saving followup note:', error);
    showNotification('Error al guardar la nota de seguimiento', 'error');
  } finally {
    showLoading(false);
  }
}

async function loadFollowupsPanel(userData) {
  console.log('Loading followups panel for:', userData.nombre);
  
  try {
    const followupsList = document.getElementById('followups-list');
    if (!followupsList) return;
    
    followupsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>';
    
    // Obtener pacientes con sus historiales más recientes
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .orderBy('metadata.ultima_actualizacion', 'desc')
      .limit(50)
      .get();
    
    if (patientsSnapshot.empty) {
      followupsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos registrados.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const lastEntry = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1] 
        : null;
      
      if (lastEntry) {
        html += `
          <div class="card followup-card">
            <div class="card-header">
              <div>
                <h3>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h3>
                <p>RUT: ${data.datos_personales?.rut || 'Sin RUT'}</p>
              </div>
              <div style="text-align: right;">
                <span class="followup-type">${lastEntry.tipo?.replace('_', ' ').toUpperCase()}</span>
                <div style="margin-top: 4px;">
                  <small style="color: var(--gray-600);">${formatDate(lastEntry.fecha)}</small>
                </div>
              </div>
            </div>
            <div class="followup-content">
              <p><strong>Último registro:</strong> ${lastEntry.notas_seguimiento || lastEntry.observaciones || 'Sin notas'}</p>
              ${lastEntry.estado_paciente ? `<p><strong>Estado:</strong> ${lastEntry.estado_paciente}</p>` : ''}
              ${lastEntry.proxima_cita ? `<p><strong>Próxima cita:</strong> ${formatDate(lastEntry.proxima_cita)}</p>` : ''}
            </div>
            <div class="card-actions" style="margin-top: 12px;">
              <button class="btn btn-primary btn-sm" onclick="addFollowupNote('${doc.id}')">
                <i class="fas fa-plus"></i> Nueva Nota
              </button>
              <button class="btn btn-secondary btn-sm" onclick="viewPatientHistory('${doc.id}')">
                <i class="fas fa-history"></i> Ver Historial
              </button>
            </div>
          </div>
        `;
      }
    });
    
    if (html === '') {
      html = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            No hay seguimientos recientes para mostrar.
          </p>
        </div>
      `;
    }
    
    followupsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading followups:', error);
    const followupsList = document.getElementById('followups-list');
    if (followupsList) {
      followupsList.innerHTML = '<p>Error al cargar seguimientos: ' + error.message + '</p>';
    }
  }
}
