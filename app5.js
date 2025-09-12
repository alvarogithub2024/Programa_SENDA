// ================= PARTE 5: PANEL DE GESTIÓN Y DASHBOARD =================

function showPanel(panelId, userData) {
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(panelId + '-panel');
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');

    switch (panelId) {
      case 'dashboard':
        loadDashboard(userData);
        break;
      case 'requests':
        loadRequestsPanel(userData);
        break;
      case 'patients':
        loadPatientsPanel(userData);
        break;
      case 'calendar':
        loadCalendarPanel(userData);
        break;
      case 'followups':
        loadFollowupsPanel(userData);
        break;
      case 'reports':
        loadReportsPanel(userData);
        break;
    }
  }
}

async function loadDashboard(userData) {
  console.log('Loading dashboard for:', userData.nombre);
  
  try {
    // Cargar estadísticas del dashboard
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Contar solicitudes pendientes
    const pendingRequests = await db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    // Contar casos críticos
    const criticalCases = await db.collection('solicitudes_ingreso')
      .where('clasificacion.prioridad', '==', 'critica')
      .where('clasificacion.estado', '==', 'pendiente')
      .get();
    
    // Contar pacientes activos
    const activePatients = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    // Actualizar métricas en el dashboard
    const totalPatientsElement = document.getElementById('total-patients');
    const pendingRequestsElement = document.getElementById('pending-requests');
    const criticalCasesElement = document.getElementById('critical-cases');
    
    if (totalPatientsElement) totalPatientsElement.textContent = activePatients.size;
    if (pendingRequestsElement) pendingRequestsElement.textContent = pendingRequests.size;
    if (criticalCasesElement) criticalCasesElement.textContent = criticalCases.size;
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ================= PANEL DE SOLICITUDES CORREGIDO PARA ASISTENTES SOCIALES =================

async function loadRequestsPanel(userData) {
  console.log('Loading requests panel for:', userData.nombre);
  
  // Verificar si es asistente social o admin
  if (userData.profesion !== 'asistente_social' && userData.profesion !== 'admin') {
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Solo los asistentes sociales pueden ver las solicitudes de ingreso.
          </p>
        </div>
      `;
    }
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // CONSULTA CORREGIDA - Obtener TODAS las solicitudes sin filtros de fecha
    let query = db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(100); // Aumentamos el límite para ver más solicitudes
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes disponibles en este momento.
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      const isAnonymous = data.datos_personales?.anonimo || false;
      const isInfoOnly = data.datos_personales?.solo_informacion || false;
      
      html += `
        <div class="card patient-card" data-request-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>Solicitud ${doc.id.substring(0, 8).toUpperCase()}</h3>
              <p>
                ${isInfoOnly ? 'Solo información' : 
                  isAnonymous ? 'Solicitud anónima' : 
                  (data.datos_contacto?.nombre_completo || 'Sin nombre')}
              </p>
              <p>Edad: ${data.datos_personales?.edad || 'N/A'} años</p>
            </div>
            <div style="text-align: right;">
              <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
              <div style="margin-top: 8px;">
                <span class="status-badge status-${estado}">${estado}</span>
              </div>
            </div>
          </div>
          <div class="patient-info">
            <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion)}</div>
            <div><strong>Para:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>
            ${data.evaluacion_inicial?.sustancias_consumo ? 
              `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
            ${data.evaluacion_inicial?.urgencia_declarada ? 
              `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
            ${data.datos_contacto?.telefono_principal ? 
              `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
            ${data.datos_contacto?.email ? 
              `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
          </div>
          <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
            <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}')">
              <i class="fas fa-eye"></i> Revisar Completa
            </button>
            ${!isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
            </button>
            <button class="btn btn-secondary btn-sm" onclick="assignRequest('${doc.id}')">
              <i class="fas fa-user-plus"></i> Asignar a Profesional
            </button>
            ` : ''}
            ${isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="sendInformation('${doc.id}')">
              <i class="fas fa-envelope"></i> Enviar Información
            </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    requestsList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading requests:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = '<p>Error al cargar las solicitudes: ' + error.message + '</p>';
    }
  }
}

// Funciones para manejar solicitudes
async function reviewRequest(requestId) {
  try {
    const doc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    if (!doc.exists) {
      showNotification('Solicitud no encontrada', 'error');
      return;
    }
    
    const data = doc.data();
    showRequestDetailModal(requestId, data);
  } catch (error) {
    console.error('Error reviewing request:', error);
    showNotification('Error al cargar la solicitud', 'error');
  }
}

function showRequestDetailModal(requestId, data) {
  const isAnonymous = data.datos_personales?.anonimo || false;
  const isInfoOnly = data.datos_personales?.solo_informacion || false;
  
  const modalHTML = `
    <div class="modal-overlay" id="request-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('request-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Detalle de Solicitud ${requestId.substring(0, 8).toUpperCase()}</h2>
        
        <div class="request-detail-content">
          <div class="detail-section">
            <h3>Información Personal</h3>
            <div class="info-grid">
              ${!isAnonymous && data.datos_contacto?.nombre_completo ? 
                `<div><strong>Nombre:</strong> ${data.datos_contacto.nombre_completo}</div>` : ''}
              ${!isAnonymous && data.datos_contacto?.rut ? 
                `<div><strong>RUT:</strong> ${data.datos_contacto.rut}</div>` : ''}
              <div><strong>Edad:</strong> ${data.datos_personales?.edad || 'N/A'} años</div>
              <div><strong>Región:</strong> ${data.datos_personales?.region || 'N/A'}</div>
              <div><strong>Para quien:</strong> ${data.datos_personales?.para_quien || 'N/A'}</div>
              <div><strong>Tipo:</strong> ${isInfoOnly ? 'Solo información' : isAnonymous ? 'Anónimo' : 'Identificado'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Datos de Contacto</h3>
            <div class="info-grid">
              ${data.datos_contacto?.telefono_principal ? 
                `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
              ${data.datos_contacto?.email ? 
                `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
              ${data.datos_contacto?.direccion ? 
                `<div><strong>Dirección:</strong> ${data.datos_contacto.direccion}</div>` : ''}
            </div>
          </div>
          
          ${data.evaluacion_inicial ? `
          <div class="detail-section">
            <h3>Evaluación Inicial</h3>
            <div class="info-grid">
              ${data.evaluacion_inicial.sustancias_consumo ? 
                `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
              ${data.evaluacion_inicial.tiempo_consumo_meses ? 
                `<div><strong>Tiempo de consumo:</strong> ${data.evaluacion_inicial.tiempo_consumo_meses} meses</div>` : ''}
              ${data.evaluacion_inicial.motivacion_cambio ? 
                `<div><strong>Motivación al cambio:</strong> ${data.evaluacion_inicial.motivacion_cambio}/10</div>` : ''}
              ${data.evaluacion_inicial.urgencia_declarada ? 
                `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
              ${data.evaluacion_inicial.tratamiento_previo ? 
                `<div><strong>Tratamiento previo:</strong> ${data.evaluacion_inicial.tratamiento_previo}</div>` : ''}
            </div>
            ${data.evaluacion_inicial.descripcion_situacion ? `
            <div style="margin-top: 12px;">
              <strong>Descripción de la situación:</strong>
              <p style="margin-top: 8px; padding: 12px; background: var(--gray-50); border-radius: 4px;">
                ${data.evaluacion_inicial.descripcion_situacion}
              </p>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="detail-section">
            <h3>Estado de la Solicitud</h3>
            <div class="info-grid">
              <div><strong>Estado:</strong> <span class="status-badge status-${data.clasificacion?.estado || 'pendiente'}">${data.clasificacion?.estado || 'pendiente'}</span></div>
              <div><strong>Prioridad:</strong> <span class="priority-indicator priority-${data.clasificacion?.prioridad || 'baja'}">${data.clasificacion?.prioridad || 'baja'}</span></div>
              <div><strong>Fecha solicitud:</strong> ${formatDate(data.metadata?.fecha_creacion)}</div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          ${!isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="acceptRequest('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-check"></i> Aceptar Solicitud
          </button>
          <button class="btn btn-secondary" onclick="assignRequest('${requestId}')">
            <i class="fas fa-user-plus"></i> Asignar a Profesional
          </button>
          ` : ''}
          ${isInfoOnly && data.clasificacion?.estado === 'pendiente' ? `
          <button class="btn btn-success" onclick="sendInformation('${requestId}'); closeModal('request-detail-modal');">
            <i class="fas fa-envelope"></i> Enviar Información
          </button>
          ` : ''}
          <button class="btn btn-outline" onclick="closeModal('request-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('request-detail-modal').style.display = 'flex';
}

async function acceptRequest(requestId) {
  if (!confirm('¿Estás seguro de aceptar esta solicitud?')) return;
  
  try {
    showLoading(true);
    
    // Actualizar estado de la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
      'clasificacion.fecha_aceptacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': currentUserData.uid
    });
    
    // Crear entrada en pacientes si no existe
    const solicitud = await db.collection('solicitudes_ingreso').doc(requestId).get();
    const data = solicitud.data();
    
    if (!data.datos_personales.anonimo && !data.datos_personales.solo_informacion) {
      await createPatientRecord(requestId, data);
    }
    
    showNotification('Solicitud aceptada correctamente', 'success');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error accepting request:', error);
    showNotification('Error al aceptar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

async function assignRequest(requestId) {
  try {
    showAssignmentModal(requestId);
  } catch (error) {
    console.error('Error in assign request:', error);
    showNotification('Error al asignar solicitud', 'error');
  }
}

async function sendInformation(requestId) {
  if (!confirm('¿Enviar información del programa al email proporcionado?')) return;
  
  try {
    showLoading(true);
    
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'informacion_enviada',
      'clasificacion.fecha_respuesta': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_responsable': currentUserData.uid
    });
    
    showNotification('Información enviada correctamente', 'success');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error sending information:', error);
    showNotification('Error al enviar información', 'error');
  } finally {
    showLoading(false);
  }
}

async function createPatientRecord(solicitudId, solicitudData) {
  const patientData = {
    solicitud_origen: solicitudId,
    datos_personales: {
      nombre_completo: solicitudData.datos_contacto?.nombre_completo || '',
      rut: solicitudData.datos_contacto?.rut || '',
      edad: solicitudData.datos_personales?.edad || 0,
      region: solicitudData.datos_personales?.region || '',
      comuna: solicitudData.datos_personales?.id_comuna_residencia || '',
      direccion: solicitudData.datos_contacto?.direccion || ''
    },
    contacto: {
      telefono: solicitudData.datos_contacto?.telefono_principal || '',
      email: solicitudData.datos_contacto?.email || ''
    },
    historial_clinico: [{
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      tipo: 'ingreso_inicial',
      profesional: currentUserData.uid,
      evaluacion_inicial: solicitudData.evaluacion_inicial || {},
      observaciones: 'Paciente ingresado desde solicitud web'
    }],
    estado_actual: {
      activo: true,
      programa: 'ambulatorio',
      profesional_asignado: null,
      fecha_ingreso: firebase.firestore.FieldValue.serverTimestamp()
    },
    metadata: {
      fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
      creado_por: currentUserData.uid
    }
  };
  
  await db.collection('pacientes').add(patientData);
}
