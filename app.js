// ================= SISTEMA DE REINGRESO COMPLETO =================

// Función mejorada para mostrar modal de reingreso
function showReentryModal() {
  const modalHTML = `
    <div class="modal-overlay" id="reentry-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('reentry-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Solicitud de Reingreso</h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
          Complete los siguientes datos para solicitar su reingreso al programa SENDA.
        </p>
        
        <form id="reentry-form">
          <div class="form-group">
            <label class="form-label">Nombre Completo *</label>
            <input type="text" class="form-input" id="reentry-name" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">RUT *</label>
            <input type="text" class="form-input" id="reentry-rut" placeholder="12.345.678-9" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">CESFAM *</label>
            <select class="form-select" id="reentry-cesfam" required>
              <option value="">Seleccionar CESFAM...</option>
              ${cesfamPuenteAlto.map(cesfam => `<option value="${cesfam}">${cesfam}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Teléfono de Contacto *</label>
            <input type="tel" class="form-input" id="reentry-phone" placeholder="+56 9 1234 5678" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="reentry-email" placeholder="correo@email.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo del Reingreso *</label>
            <textarea class="form-textarea" id="reentry-reason" placeholder="Explique brevemente el motivo de su solicitud de reingreso..." required rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Fecha de último egreso (si la recuerda)</label>
            <input type="date" class="form-input" id="reentry-last-exit">
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de tratamiento anterior</label>
            <select class="form-select" id="reentry-previous-type">
              <option value="">Seleccionar...</option>
              <option value="ambulatorio">Ambulatorio</option>
              <option value="residencial">Residencial</option>
              <option value="hospitalizacion">Hospitalización</option>
              <option value="no_recuerda">No recuerda</option>
            </select>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('reentry-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-paper-plane"></i>
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('reentry-modal').style.display = 'flex';
  
  // Configurar validaciones
  setupReentryValidations();
  
  // Manejar envío del formulario
  document.getElementById('reentry-form').addEventListener('submit', handleReentrySubmission);
}

// Validaciones para formulario de reingreso
function setupReentryValidations() {
  const rutInput = document.getElementById('reentry-rut');
  if (rutInput) {
    rutInput.addEventListener('input', function(e) {
      e.target.value = formatRUT(e.target.value);
    });
    rutInput.addEventListener('blur', function(e) {
      const rut = e.target.value.trim();
      if (rut && !validateRUT(rut)) {
        e.target.classList.add('error');
        showNotification('El RUT ingresado no es válido', 'error');
      } else {
        e.target.classList.remove('error');
      }
    });
  }
  
  const phoneInput = document.getElementById('reentry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
}

// Manejo completo del envío de reingreso
async function handleReentrySubmission(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('reentry-name').value.trim(),
    rut: document.getElementById('reentry-rut').value.trim(),
    cesfam: document.getElementById('reentry-cesfam').value,
    phone: document.getElementById('reentry-phone').value.trim(),
    email: document.getElementById('reentry-email').value.trim(),
    reason: document.getElementById('reentry-reason').value.trim(),
    lastExit: document.getElementById('reentry-last-exit').value,
    previousType: document.getElementById('reentry-previous-type').value
  };
  
  // Validaciones
  if (!formData.name || !formData.rut || !formData.cesfam || !formData.phone || !formData.reason) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!validateRUT(formData.rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  if (formData.email && !isValidEmail(formData.email)) {
    showNotification('El email ingresado no es válido', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Verificar si ya existe una solicitud de reingreso pendiente
    const existingQuery = await db.collection('solicitudes_ingreso')
      .where('tipo_solicitud', '==', 'reingreso')
      .where('datos_contacto.rut', '==', formData.rut)
      .where('clasificacion.estado', 'in', ['pendiente', 'en_proceso'])
      .get();
    
    if (!existingQuery.empty) {
      showNotification('Ya existe una solicitud de reingreso pendiente para este RUT', 'warning');
      return;
    }
    
    // Estructura para Firebase
    const reentryData = {
      tipo_solicitud: 'reingreso',
      datos_personales: {
        nombre_completo: formData.name,
        rut: formData.rut,
        cesfam: formData.cesfam,
        edad: null,
        para_quien: 'para_mi',
        anonimo: false,
        solo_informacion: false
      },
      datos_contacto: {
        nombre_completo: formData.name,
        rut: formData.rut,
        telefono_principal: formData.phone,
        email: formData.email || null,
        direccion: null
      },
      reingreso: {
        motivo: formData.reason,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
        fecha_ultimo_egreso: formData.lastExit ? new Date(formData.lastExit) : null,
        tipo_tratamiento_anterior: formData.previousType || null,
        estado: 'pendiente'
      },
      clasificacion: {
        tipo: 'reingreso',
        estado: 'pendiente',
        prioridad: 'alta', // Los reingresos tienen prioridad alta por defecto
        categoria_riesgo: 'moderado',
        fecha_clasificacion: firebase.firestore.FieldValue.serverTimestamp(),
        profesional_asignado: null
      },
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_reingreso',
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        version_formulario: '2.0'
      }
    };
    
    console.log('Enviando datos de reingreso:', reentryData);
    
    const docRef = await db.collection('solicitudes_ingreso').add(reentryData);
    
    console.log('Reingreso guardado con ID:', docRef.id);
    
    showNotification('Solicitud de reingreso enviada correctamente. Se le contactará pronto.', 'success', 6000);
    closeModal('reentry-modal');
    
    // Limpiar formulario
    document.getElementById('reentry-form').reset();
    
  } catch (error) {
    console.error('Error al enviar solicitud de reingreso:', error);
    handleFirebaseError(error, 'reingreso');
  } finally {
    showLoading(false);
  }
}

// ================= SESIÓN DEL PROFESIONAL COMPLETA =================

// Login mejorado con consulta completa de datos del profesional
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showNotification('Por favor ingresa email y contraseña', 'error');
    return;
  }
  
  // Verificar que sea correo institucional
  if (!email.endsWith('@senda.cl')) {
    showNotification('Solo se permite acceso con correo institucional @senda.cl', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('Usuario autenticado:', user.uid);
    
    // Consultar datos completos del profesional en Firebase
    const profesionalDoc = await db.collection('profesionales').doc(user.uid).get();
    
    if (!profesionalDoc.exists) {
      await auth.signOut();
      throw new Error('Usuario no registrado como profesional SENDA');
    }
    
    const profesionalData = profesionalDoc.data();
    
    // Verificar que el usuario esté activo
    if (!profesionalData.configuracion_sistema?.activo) {
      await auth.signOut();
      throw new Error('Usuario inactivo. Contacte al administrador.');
    }
    
    // Actualizar última conexión
    await db.collection('profesionales').doc(user.uid).update({
      'configuracion_sistema.ultima_conexion': firebase.firestore.FieldValue.serverTimestamp(),
      'configuracion_sistema.dispositivo_ultima_conexion': navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
    });
    
    // Crear sesión activa
    await createActiveSession(user.uid, profesionalData);
    
    currentUser = user;
    currentUserData = { uid: user.uid, ...profesionalData };
    
    showNotification(`Bienvenido, ${profesionalData.nombre}`, 'success');
    
    closeModal('professional-modal');
    showProfessionalPanel(currentUserData);
    
    // Cargar estadísticas del profesional
    loadProfessionalStats(currentUserData);
    
  } catch (error) {
    console.error('Error de login:', error);
    handleFirebaseError(error, 'login');
  } finally {
    showLoading(false);
  }
}

// Crear sesión activa en Firebase
async function createActiveSession(userId, userData) {
  try {
    const sessionData = {
      usuario_id: userId,
      nombre_usuario: userData.nombre,
      profesion: userData.profesion,
      cesfam_asignado: userData.cesfam_asignado,
      fecha_inicio: firebase.firestore.FieldValue.serverTimestamp(),
      ip_session: 'anonimizada',
      dispositivo: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      activa: true
    };
    
    await db.collection('sesiones_activas').doc(userId).set(sessionData);
    console.log('Sesión activa creada para:', userId);
  } catch (error) {
    console.warn('Error al crear sesión activa:', error);
  }
}

// Cargar estadísticas del profesional
async function loadProfessionalStats(userData) {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Estadísticas base
    const stats = {
      totalPatients: 0,
      todayAppointments: 0,
      pendingRequests: 0,
      thisMonthFollowups: 0
    };
    
    // Contar pacientes activos del profesional
    if (userData.profesion !== 'admin') {
      const patientsQuery = userData.cesfam_asignado ? 
        db.collection('pacientes')
          .where('datos_personales.cesfam', '==', userData.cesfam_asignado)
          .where('estado_actual.activo', '==', true) :
        db.collection('pacientes').where('estado_actual.activo', '==', true);
      
      const patientsSnapshot = await patientsQuery.get();
      stats.totalPatients = patientsSnapshot.size;
    }
    
    // Contar citas de hoy
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayAppointmentsSnapshot = await db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .get();
    stats.todayAppointments = todayAppointmentsSnapshot.size;
    
    // Contar solicitudes pendientes para asistentes sociales
    if (userData.profesion === 'asistente_social' || userData.profesion === 'admin' || userData.profesion === 'coordinador') {
      let requestsQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente');
      
      if (userData.cesfam_asignado && userData.profesion !== 'admin') {
        requestsQuery = requestsQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
      }
      
      const requestsSnapshot = await requestsQuery.get();
      stats.pendingRequests = requestsSnapshot.size;
    }
    
    // Contar seguimientos del mes
    const followupsSnapshot = await db.collection('seguimientos')
      .where('profesional_id', '==', userData.uid)
      .where('fecha_creacion', '>=', startOfMonth)
      .get();
    stats.thisMonthFollowups = followupsSnapshot.size;
    
    // Actualizar UI con estadísticas
    updateProfessionalStatsUI(stats);
    
  } catch (error) {
    console.warn('Error al cargar estadísticas del profesional:', error);
  }
}

// Actualizar UI con estadísticas
function updateProfessionalStatsUI(stats) {
  const totalPatientsEl = document.getElementById('total-patients');
  const todayAppointmentsEl = document.getElementById('today-appointments');
  const pendingRequestsEl = document.getElementById('pending-requests');
  const requestsBadgeEl = document.getElementById('requests-badge');
  
  if (totalPatientsEl) totalPatientsEl.textContent = stats.totalPatients;
  if (todayAppointmentsEl) todayAppointmentsEl.textContent = stats.todayAppointments;
  if (pendingRequestsEl) pendingRequestsEl.textContent = stats.pendingRequests;
  if (requestsBadgeEl) {
    requestsBadgeEl.textContent = stats.pendingRequests;
    requestsBadgeEl.style.display = stats.pendingRequests > 0 ? 'inline' : 'none';
  }
}

// ================= CLASIFICACIÓN DE PACIENTES POR CESFAM =================

// Cargar pacientes filtrados por CESFAM del profesional
async function loadPatientsPanel(userData) {
  const patientsPanel = document.getElementById('patients-panel');
  if (!patientsPanel) {
    console.error('Panel de pacientes no encontrado');
    return;
  }
  
  // Validar datos de usuario
  if (!userData || !userData.uid) {
    showErrorInPanel(patientsPanel, 'Error: Usuario no válido');
    return;
  }
  
  // Mostrar loading
  patientsPanel.innerHTML = createPanelHeader('Pacientes', 'Cargando pacientes...', userData) + '<div class="loading"><div class="spinner"></div> Cargando pacientes...</div>';
  
  try {
    console.log('Cargando pacientes para usuario:', userData.uid, 'CESFAM:', userData.cesfam_asignado);
    
    // Construir consulta según rol y CESFAM
    let patientsQuery = db.collection('pacientes');
    
    if (userData.profesion === 'admin') {
      // Admin ve todos los pacientes activos
      patientsQuery = patientsQuery.where('estado_actual.activo', '==', true);
    } else if (userData.cesfam_asignado) {
      // Otros profesionales ven pacientes de su CESFAM
      patientsQuery = patientsQuery
        .where('datos_personales.cesfam', '==', userData.cesfam_asignado)
        .where('estado_actual.activo', '==', true);
    } else {
      throw new Error('Usuario sin CESFAM asignado');
    }
    
    // Ordenar y limitar
    patientsQuery = patientsQuery.orderBy('metadata.fecha_creacion', 'desc').limit(100);
    
    console.log('Ejecutando consulta de pacientes...');
    const patientsSnapshot = await patientsQuery.get();
    console.log('Pacientes encontrados:', patientsSnapshot.size);
    
    // Renderizar pacientes
    renderPatientsPanel(patientsSnapshot, userData);
    
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
    showErrorInPanel(patientsPanel, `Error al cargar pacientes: ${error.message}`);
    handleFirebaseError(error, 'carga de pacientes');
  }
}

// Renderizar panel de pacientes
function renderPatientsPanel(patientsSnapshot, userData) {
  const patientsPanel = document.getElementById('patients-panel');
  
  if (patientsSnapshot.empty) {
    patientsPanel.innerHTML = createPanelHeader('Pacientes', 'Gestión de casos activos', userData) + `
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
          No hay pacientes activos en este momento.
          ${userData.cesfam_asignado ? `<br><small>CESFAM: ${userData.cesfam_asignado}</small>` : ''}
        </p>
      </div>
    `;
    return;
  }
  
  let html = createPanelHeader('Pacientes', `Gestión de casos activos (${patientsSnapshot.size} pacientes)`, userData);
  html += '<div class="patients-grid">';
  
  patientsSnapshot.forEach(doc => {
    const data = doc.data();
    html += createPatientCard(doc.id, data, userData);
  });
  
  html += '</div>';
  patientsPanel.innerHTML = html;
  
  // Configurar búsqueda en tiempo real
  setupPatientSearch();
}

// Crear tarjeta de paciente
function createPatientCard(patientId, data, userData) {
  const fechaIngreso = data.estado_actual?.fecha_ingreso ? 
    (data.estado_actual.fecha_ingreso.toDate ? data.estado_actual.fecha_ingreso.toDate() : new Date(data.estado_actual.fecha_ingreso)) : 
    new Date();
  
  const profesionalAsignado = data.estado_actual?.profesional_asignado || 'Sin asignar';
  const programa = data.estado_actual?.programa || 'ambulatorio';
  
  return `
    <div class="card patient-card" data-patient-id="${patientId}" data-rut="${data.datos_personales?.rut || ''}">
      <div class="card-header">
        <div>
          <h4>${data.datos_personales?.nombre_completo || 'Sin nombre'}</h4>
          <p><i class="fas fa-id-card"></i> ${data.datos_personales?.rut || 'Sin RUT'}</p>
          <p><i class="fas fa-birthday-cake"></i> ${data.datos_personales?.edad || 'Sin edad'} años</p>
          <p><i class="fas fa-hospital"></i> ${data.datos_personales?.cesfam || 'Sin CESFAM'}</p>
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${data.estado_actual?.activo ? 'activo' : 'inactivo'}">
            ${data.estado_actual?.activo ? 'ACTIVO' : 'INACTIVO'}
          </span>
          <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
            ${programa.toUpperCase()}
          </div>
        </div>
      </div>
      <div class="patient-info">
        <div><strong>Fecha ingreso:</strong> ${formatDate(fechaIngreso)}</div>
        <div><strong>Profesional:</strong> ${profesionalAsignado === userData.uid ? 'Yo' : profesionalAsignado}</div>
        ${data.contacto?.telefono ? `<div><strong>Teléfono:</strong> ${data.contacto.telefono}</div>` : ''}
        ${data.contacto?.email ? `<div><strong>Email:</strong> ${data.contacto.email}</div>` : ''}
        ${data.historial_clinico?.length ? `<div><strong>Sesiones:</strong> ${data.historial_clinico.length}</div>` : ''}
      </div>
      <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
        <button class="btn btn-primary btn-sm" onclick="viewPatientDetail('${patientId}')">
          <i class="fas fa-eye"></i> Ver Detalle
        </button>
        <button class="btn btn-outline btn-sm" onclick="addFollowup('${patientId}')">
          <i class="fas fa-plus"></i> Seguimiento
        </button>
        <button class="btn btn-outline btn-sm" onclick="scheduleAppointment('${patientId}')">
          <i class="fas fa-calendar-plus"></i> Agendar
        </button>
      </div>
    </div>
  `;
}

// ================= GESTIÓN DE SOLICITUDES COMPLETA =================

// Cargar solicitudes con filtros avanzados
async function loadRequestsPanel(userData) {
  console.log('Cargando panel de solicitudes para:', userData.nombre);
  
  if (!userData || !userData.profesion) {
    console.error('Datos de usuario no válidos:', userData);
    showNotification('Error: Datos de usuario no válidos', 'error');
    return;
  }
  
  // Verificar permisos
  if (userData.profesion !== 'asistente_social' && userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    showAccessDeniedForRequests();
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) {
      console.error('Elemento requests-list no encontrado');
      return;
    }
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // Construir consulta base
    let query = db.collection('solicitudes_ingreso');
    
    // Aplicar filtros según rol
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      console.log('Filtrando por CESFAM:', userData.cesfam_asignado);
      query = query.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    // Ordenar y limitar
    query = query.orderBy('metadata.fecha_creacion', 'desc').limit(50);
    
    console.log('Ejecutando consulta de solicitudes...');
    const snapshot = await query.get();
    console.log('Solicitudes encontradas:', snapshot.size);
    
    if (snapshot.empty) {
      showEmptyRequestsState(userData);
      return;
    }
    
    renderRequestsList(snapshot, userData);
    
    // Configurar filtros avanzados
    setupRequestFilters(userData);
    
  } catch (error) {
    console.error('Error al cargar solicitudes:', error);
    showRequestsError(error);
    handleFirebaseError(error, 'carga de solicitudes');
  }
}

// Renderizar lista de solicitudes
function renderRequestsList(snapshot, userData) {
  const requestsList = document.getElementById('requests-list');
  
  let html = `
    <div class="requests-filters" style="margin-bottom: 24px;">
      <div class="filter-row">
        <select class="form-select" id="filter-priority" onchange="applyRequestFilters()">
          <option value="">Todas las prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        
        <select class="form-select" id="filter-status" onchange="applyRequestFilters()">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aceptada">Aceptada</option>
          <option value="en_proceso">En Proceso</option>
          <option value="completada">Completada</option>
        </select>
        
        <select class="form-select" id="filter-type" onchange="applyRequestFilters()">
          <option value="">Todos los tipos</option>
          <option value="identificado">Identificado</option>
          <option value="anonimo">Anónimo</option>
          <option value="informacion">Solo información</option>
          <option value="reingreso">Reingreso</option>
        </select>
        
        <button class="btn btn-outline" onclick="clearRequestFilters()">
          <i class="fas fa-times"></i> Limpiar filtros
        </button>
      </div>
    </div>
  `;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    html += createRequestCard(doc.id, data);
  });
  
  requestsList.innerHTML = html;
}

// Crear tarjeta de solicitud
function createRequestCard(requestId, data) {
  // Determinar tipo y estado
  const priority = data.clasificacion?.prioridad || 'baja';
  const estado = data.clasificacion?.estado || 'pendiente';
  const isAnonymous = data.datos_personales?.anonimo || false;
  const isInfoOnly = data.datos_personales?.solo_informacion || false;
  const isReentry = data.tipo_solicitud === 'reingreso';
  
  // Obtener nombre según el tipo
  let nombreCompleto = 'Sin nombre';
  if (isReentry) {
    nombreCompleto = data.datos_personales?.nombre_completo || data.datos_contacto?.nombre_completo || 'Reingreso';
  } else if (isAnonymous) {
    nombreCompleto = 'Solicitud anónima';
  } else if (isInfoOnly) {
    nombreCompleto = 'Solo información';
  } else {
    nombreCompleto = data.datos_contacto?.nombre_completo || 'Sin nombre';
  }
  
  return `
    <div class="card request-card" data-request-id="${requestId}" data-priority="${priority}" data-status="${estado}" data-type="${getRequestType(data)}">
      <div class="card-header">
        <div>
          <h3>
            ${isReentry ? '<i class="fas fa-redo" style="color: var(--warning-orange);"></i> ' : ''}
            Solicitud ${requestId.substring(0, 8).toUpperCase()}
          </h3>
          <p><strong>${nombreCompleto}</strong></p>
          ${!isReentry && data.datos_personales?.edad ? `<p>Edad: ${data.datos_personales.edad} años</p>` : ''}
          ${isReentry && data.datos_contacto?.rut ? `<p>RUT: ${data.datos_contacto.rut}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="priority-indicator priority-${priority}">${priority.toUpperCase()}</span>
          <div style="margin-top: 8px;">
            <span class="status-badge status-${estado}">${estado}</span>
          </div>
          ${isReentry ? '<div style="margin-top: 4px; font-size: 12px; color: var(--warning-orange);">REINGRESO</div>' : ''}
        </div>
      </div>
      <div class="patient-info">
        <div><strong>CESFAM:</strong> ${data.datos_personales?.cesfam || 'N/A'}</div>
        <div><strong>Tipo:</strong> ${getRequestTypeLabel(data)}</div>
        <div><strong>Fecha:</strong> ${formatDate(data.metadata?.fecha_creacion || data.reingreso?.fecha_solicitud)}</div>
        ${!isReentry && data.datos_personales?.para_quien ? `<div><strong>Para:</strong> ${data.datos_personales.para_quien}</div>` : ''}
        ${data.evaluacion_inicial?.sustancias_consumo ? 
          `<div><strong>Sustancias:</strong> ${data.evaluacion_inicial.sustancias_consumo.join(', ')}</div>` : ''}
        ${data.evaluacion_inicial?.urgencia_declarada ? 
          `<div><strong>Urgencia:</strong> ${data.evaluacion_inicial.urgencia_declarada}</div>` : ''}
        ${data.datos_contacto?.telefono_principal ? 
          `<div><strong>Teléfono:</strong> ${data.datos_contacto.telefono_principal}</div>` : ''}
        ${data.datos_contacto?.email ? 
          `<div><strong>Email:</strong> ${data.datos_contacto.email}</div>` : ''}
        ${isReentry && data.reingreso?.motivo ? 
          `<div><strong>Motivo reingreso:</strong> ${data.reingreso.motivo.substring(0, 100)}...</div>` : ''}
      </div>
      <div class="card-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
        <button class="btn btn-primary btn-sm" onclick="reviewRequest('${requestId}')">
          <i class="fas fa-eye"></i> Revisar Completa
        </button>
        ${!isInfoOnly && estado === 'pendiente' ? `
        <button class="btn btn-success btn-sm" onclick="acceptRequest('${requestId}')">
          <i class="fas fa-check"></i> Aceptar
        </button>
        ` : ''}
        ${isInfoOnly && estado === 'pendiente' ? `
        <button class="btn btn-success btn-sm" onclick="sendInformation('${requestId}')">
          <i class="fas fa-envelope"></i> Enviar Información
        </button>
        ` : ''}
        ${estado === 'pendiente' ? `
        <button class="btn btn-warning btn-sm" onclick="updateRequestPriority('${requestId}')">
          <i class="fas fa-flag"></i> Cambiar Prioridad
        </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Funciones auxiliares para solicitudes
function getRequestType(data) {
  if (data.tipo_solicitud === 'reingreso') return 'reingreso';
  if (data.datos_personales?.solo_informacion) return 'informacion';
  if (data.datos_personales?.anonimo) return 'anonimo';
  return 'identificado';
}

function getRequestTypeLabel(data) {
  const type = getRequestType(data);
  const labels = {
    'reingreso': 'Reingreso',
    'informacion': 'Solo información',
    'anonimo': 'Anónimo',
    'identificado': 'Identificado'
  };
  return labels[type] || 'Desconocido';
}

// Funciones auxiliares para crear headers de panel
function createPanelHeader(title, subtitle, userData) {
  return `
    <div class="panel-header">
      <h1 class="panel-title">${title}</h1>
      <p class="panel-subtitle">${subtitle}</p>
      <div style="margin-top: 16px;">
        <input type="text" class="form-input" id="search-input" placeholder="Buscar..." style="max-width: 300px; display: inline-block;">
        <button class="btn btn-outline" onclick="refreshCurrentPanel()" style="margin-left: 8px;">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
  `;
}

function showErrorInPanel(panel, message) {
  panel.innerHTML = `
    <div class="card">
      <p style="text-align: center; color: var(--danger-red);">
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      </p>
      <div style="text-align: center; margin-top: 16px;">
        <button class="btn btn-primary" onclick="refreshCurrentPanel()">
          <i class="fas fa-refresh"></i> Reintentar
        </button>
      </div>
    </div>
  `;
}

// Función para refrescar el panel actual
function refreshCurrentPanel() {
  if (currentUserData) {
    const activePanel = document.querySelector('.nav-item.active');
    if (activePanel) {
      const panelId = activePanel.dataset.panel;
      showPanel(panelId, currentUserData);
    }
  }
}
// ================= SISTEMA DE AGENDA COMPLETO =================

// Cargar panel de agenda con todas las funcionalidades
async function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (!calendarPanel) {
    console.error('Panel de agenda no encontrado');
    return;
  }
  
  if (!userData || !userData.uid) {
    showErrorInPanel(calendarPanel, 'Error: Usuario no válido');
    return;
  }
  
  calendarPanel.innerHTML = createCalendarHeader(userData) + '<div class="loading"><div class="spinner"></div> Cargando agenda...</div>';
  
  try {
    console.log('Cargando agenda para usuario:', userData.uid);
    
    // Fechas para consulta (próximos 14 días)
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    // Consultar citas del profesional
    const appointmentsQuery = db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', today)
      .where('fecha', '<=', twoWeeksFromNow)
      .orderBy('fecha', 'asc');
    
    console.log('Ejecutando consulta de citas...');
    const appointmentsSnapshot = await appointmentsQuery.get();
    console.log('Citas encontradas:', appointmentsSnapshot.size);
    
    // Renderizar agenda
    renderCalendarPanel(appointmentsSnapshot, userData);
    
    // Configurar listeners para agenda
    setupCalendarListeners(userData);
    
  } catch (error) {
    console.error('Error al cargar agenda:', error);
    showCalendarError(calendarPanel, error);
    handleFirebaseError(error, 'carga de agenda');
  }
}

// Crear header del calendario
function createCalendarHeader(userData) {
  return `
    <div class="panel-header">
      <h1 class="panel-title">Agenda</h1>
      <p class="panel-subtitle">Gestión de citas y horarios - ${userData.nombre}</p>
      <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="showNewAppointmentModal()">
          <i class="fas fa-calendar-plus"></i> Nueva Cita
        </button>
        <button class="btn btn-outline" onclick="showTodayAppointments()">
          <i class="fas fa-calendar-day"></i> Citas de Hoy
        </button>
        <button class="btn btn-outline" onclick="showWeekView()">
          <i class="fas fa-calendar-week"></i> Vista Semanal
        </button>
        <button class="btn btn-outline" onclick="exportCalendar()">
          <i class="fas fa-download"></i> Exportar
        </button>
        <button class="btn btn-outline" onclick="loadCalendarPanel(currentUserData)">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
  `;
}

// Renderizar panel del calendario
function renderCalendarPanel(appointmentsSnapshot, userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  
  let html = createCalendarHeader(userData);
  
  if (appointmentsSnapshot.empty) {
    html += `
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-calendar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
          No tienes citas agendadas para los próximos 14 días.
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="showNewAppointmentModal()">
            <i class="fas fa-calendar-plus"></i> Agendar Primera Cita
          </button>
        </div>
      </div>
    `;
  } else {
    // Agrupar citas por día
    const appointmentsByDay = groupAppointmentsByDay(appointmentsSnapshot);
    
    html += '<div class="calendar-section">';
    html += `<h2>Próximas Citas (${appointmentsSnapshot.size} total)</h2>`;
    
    // Mostrar citas agrupadas por día
    Object.keys(appointmentsByDay).sort().forEach(dateKey => {
      const appointments = appointmentsByDay[dateKey];
      html += createDaySection(dateKey, appointments, userData);
    });
    
    html += '</div>';
  }
  
  calendarPanel.innerHTML = html;
}

// Agrupar citas por día
function groupAppointmentsByDay(appointmentsSnapshot) {
  const appointmentsByDay = {};
  
  appointmentsSnapshot.forEach(doc => {
    const data = doc.data();
    
    if (!data.fecha) {
      console.warn('Cita sin fecha encontrada:', doc.id);
      return;
    }
    
    const fecha = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
    const dateKey = formatDateOnly(fecha);
    
    if (!appointmentsByDay[dateKey]) {
      appointmentsByDay[dateKey] = [];
    }
    appointmentsByDay[dateKey].push({ id: doc.id, ...data, fechaObj: fecha });
  });
  
  return appointmentsByDay;
}

// Crear sección de día
function createDaySection(dateKey, appointments, userData) {
  // Ordenar citas del día por hora
  appointments.sort((a, b) => a.fechaObj - b.fechaObj);
  
  const isToday = dateKey === formatDateOnly(new Date());
  const dayClass = isToday ? 'day-section today' : 'day-section';
  
  let html = `
    <div class="${dayClass}" style="margin-bottom: 24px;">
      <h3 style="color: var(--primary-blue); margin-bottom: 12px; border-bottom: 2px solid var(--gray-200); padding-bottom: 8px;">
        ${dateKey} ${isToday ? '(HOY)' : ''} (${appointments.length} citas)
      </h3>
      <div class="appointments-grid" style="display: grid; gap: 12px;">
  `;
  
  appointments.forEach(appointment => {
    html += createAppointmentCard(appointment, userData);
  });
  
  html += '</div></div>';
  return html;
}

// Crear tarjeta de cita
function createAppointmentCard(appointment, userData) {
  const estado = appointment.estado || 'programada';
  const borderColor = {
    'completada': 'var(--success-green)',
    'cancelada': 'var(--danger-red)',
    'en_progreso': 'var(--warning-orange)',
    'programada': 'var(--primary-blue)'
  }[estado] || 'var(--primary-blue)';
  
  const estadoIcon = {
    'completada': 'fas fa-check-circle',
    'cancelada': 'fas fa-times-circle',
    'en_progreso': 'fas fa-clock',
    'programada': 'fas fa-calendar-check'
  }[estado] || 'fas fa-calendar-check';
  
  return `
    <div class="card appointment-card" style="border-left: 4px solid ${borderColor};" data-appointment-id="${appointment.id}">
      <div class="card-header">
        <div>
          <h4>${appointment.paciente_nombre || 'Paciente sin nombre'}</h4>
          <p><i class="fas fa-clock"></i> ${formatTimeOnly(appointment.fechaObj)}</p>
          <p><i class="fas fa-user"></i> ${appointment.tipo_cita || 'Consulta general'}</p>
          ${appointment.paciente_rut ? `<p><i class="fas fa-id-card"></i> ${appointment.paciente_rut}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${estado}">
            <i class="${estadoIcon}"></i> ${estado.charAt(0).toUpperCase() + estado.slice(1)}
          </span>
          ${appointment.duracion_minutos ? `
          <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
            ${appointment.duracion_minutos} min
          </div>
          ` : ''}
        </div>
      </div>
      ${appointment.observaciones ? `
      <div class="appointment-info" style="margin-top: 12px;">
        <div><strong>Observaciones:</strong> ${appointment.observaciones}</div>
      </div>
      ` : ''}
      <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
        ${estado === 'programada' ? `
        <button class="btn btn-success btn-sm" onclick="startAppointment('${appointment.id}')">
          <i class="fas fa-play"></i> Iniciar
        </button>
        ` : ''}
        ${estado === 'en_progreso' ? `
        <button class="btn btn-warning btn-sm" onclick="completeAppointment('${appointment.id}')">
          <i class="fas fa-check"></i> Completar
        </button>
        ` : ''}
        <button class="btn btn-outline btn-sm" onclick="editAppointment('${appointment.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        ${estado !== 'completada' && estado !== 'cancelada' ? `
        <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${appointment.id}')">
          <i class="fas fa-times"></i> Cancelar
        </button>
        ` : ''}
        ${appointment.paciente_id ? `
        <button class="btn btn-info btn-sm" onclick="viewPatientDetail('${appointment.paciente_id}')">
          <i class="fas fa-user"></i> Ver Paciente
        </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Modal para nueva cita
function showNewAppointmentModal() {
  const modalHTML = `
    <div class="modal-overlay" id="new-appointment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('new-appointment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Agendar Nueva Cita</h2>
        
        <form id="appointment-form">
          <div class="form-group">
            <label class="form-label">Buscar Paciente por RUT *</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="patient-rut-search" placeholder="12.345.678-9" required>
              <button type="button" class="btn btn-outline" onclick="searchPatientForAppointment()">
                <i class="fas fa-search"></i> Buscar
              </button>
            </div>
            <div id="patient-search-result" style="margin-top: 8px;"></div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Fecha y Hora *</label>
            <input type="datetime-local" class="form-input" id="appointment-datetime" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Cita *</label>
            <select class="form-select" id="appointment-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="primera_consulta">Primera Consulta</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="evaluacion">Evaluación</option>
              <option value="terapia_individual">Terapia Individual</option>
              <option value="terapia_grupal">Terapia Grupal</option>
              <option value="revision_medicamentos">Revisión de Medicamentos</option>
              <option value="alta_medica">Alta Médica</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Duración (minutos)</label>
            <select class="form-select" id="appointment-duration">
              <option value="30">30 minutos</option>
              <option value="45" selected>45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea class="form-textarea" id="appointment-notes" placeholder="Notas adicionales para la cita..." rows="3"></textarea>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('new-appointment-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-calendar-plus"></i> Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('new-appointment-modal').style.display = 'flex';
  
  // Configurar fecha mínima (hoy)
  const datetimeInput = document.getElementById('appointment-datetime');
  const now = new Date();
  const minDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  datetimeInput.min = minDate;
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('patient-rut-search');
  rutInput.addEventListener('input', function(e) {
    e.target.value = formatRUT(e.target.value);
  });
  
  // Manejar envío
  document.getElementById('appointment-form').addEventListener('submit', handleAppointmentSubmission);
}

// Buscar paciente para cita
async function searchPatientForAppointment() {
  const rut = document.getElementById('patient-rut-search').value.trim();
  const resultDiv = document.getElementById('patient-search-result');
  
  if (!rut || !validateRUT(rut)) {
    resultDiv.innerHTML = '<p style="color: var(--danger-red);">Por favor ingresa un RUT válido</p>';
    return;
  }
  
  try {
    resultDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Buscando paciente...</p>';
    
    const patientQuery = await db.collection('pacientes')
      .where('datos_personales.rut', '==', rut)
      .where('estado_actual.activo', '==', true)
      .get();
    
    if (patientQuery.empty) {
      resultDiv.innerHTML = '<p style="color: var(--warning-orange);">No se encontró un paciente activo con ese RUT</p>';
      return;
    }
    
    const patientDoc = patientQuery.docs[0];
    const patientData = patientDoc.data();
    
    resultDiv.innerHTML = `
      <div class="patient-found" style="padding: 12px; background: var(--success-light); border-radius: 8px; border: 1px solid var(--success-green);">
        <p><strong>${patientData.datos_personales.nombre_completo}</strong></p>
        <p>RUT: ${patientData.datos_personales.rut}</p>
        <p>CESFAM: ${patientData.datos_personales.cesfam}</p>
        <input type="hidden" id="selected-patient-id" value="${patientDoc.id}">
        <input type="hidden" id="selected-patient-name" value="${patientData.datos_personales.nombre_completo}">
      </div>
    `;
    
  } catch (error) {
    console.error('Error buscando paciente:', error);
    resultDiv.innerHTML = '<p style="color: var(--danger-red);">Error al buscar paciente</p>';
  }
}

// Manejar envío de nueva cita
async function handleAppointmentSubmission(e) {
  e.preventDefault();
  
  const patientId = document.getElementById('selected-patient-id')?.value;
  const patientName = document.getElementById('selected-patient-name')?.value;
  const datetime = document.getElementById('appointment-datetime').value;
  const type = document.getElementById('appointment-type').value;
  const duration = document.getElementById('appointment-duration').value;
  const notes = document.getElementById('appointment-notes').value.trim();
  
  if (!patientId || !datetime || !type) {
    showNotification('Por favor complete todos los campos requeridos', 'error');
    return;
  }
  
  // Verificar que la fecha no sea en el pasado
  const appointmentDate = new Date(datetime);
  if (appointmentDate <= new Date()) {
    showNotification('La fecha de la cita debe ser en el futuro', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // Verificar disponibilidad (no permitir citas en el mismo horario)
    const startTime = new Date(appointmentDate.getTime() - 15 * 60 * 1000); // 15 min antes
    const endTime = new Date(appointmentDate.getTime() + 15 * 60 * 1000); // 15 min después
    
    const conflictQuery = await db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>=', startTime)
      .where('fecha', '<=', endTime)
      .where('estado', '!=', 'cancelada')
      .get();
    
    if (!conflictQuery.empty) {
      showNotification('Ya tienes una cita programada cerca de esa hora', 'warning');
      return;
    }
    
    // Crear cita
    const appointmentData = {
      profesional_id: currentUserData.uid,
      profesional_nombre: currentUserData.nombre,
      paciente_id: patientId,
      paciente_nombre: patientName,
      paciente_rut: document.getElementById('patient-rut-search').value.trim(),
      fecha: appointmentDate,
      tipo_cita: type,
      duracion_minutos: parseInt(duration),
      observaciones: notes,
      estado: 'programada',
      metadata: {
        creado_por: currentUserData.uid,
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        cesfam: currentUserData.cesfam_asignado
      }
    };
    
    await db.collection('citas').add(appointmentData);
    
    showNotification('Cita agendada correctamente', 'success');
    closeModal('new-appointment-modal');
    loadCalendarPanel(currentUserData);
    
  } catch (error) {
    console.error('Error al agendar cita:', error);
    handleFirebaseError(error, 'agendamiento de cita');
  } finally {
    showLoading(false);
  }
}

// ================= SISTEMA DE SEGUIMIENTOS COMPLETO =================

// Cargar panel de seguimientos
async function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (!followupsPanel) {
    console.error('Panel de seguimientos no encontrado');
    return;
  }
  
  if (!userData || !userData.uid) {
    showErrorInPanel(followupsPanel, 'Error: Usuario no válido');
    return;
  }
  
  followupsPanel.innerHTML = createFollowupsHeader(userData) + '<div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>';
  
  try {
    console.log('Cargando seguimientos para usuario:', userData.uid, 'CESFAM:', userData.cesfam_asignado);
    
    // Construir consulta según rol
    let followupsQuery = db.collection('seguimientos');
    
    if (userData.profesion === 'admin') {
      // Admin ve todos los seguimientos
      followupsQuery = followupsQuery.orderBy('fecha_creacion', 'desc').limit(100);
    } else if (userData.profesion === 'coordinador' && userData.cesfam_asignado) {
      // Coordinador ve seguimientos de su CESFAM
      followupsQuery = followupsQuery
        .where('metadata.cesfam', '==', userData.cesfam_asignado)
        .orderBy('fecha_creacion', 'desc')
        .limit(50);
    } else {
      // Otros profesionales ven solo sus seguimientos
      followupsQuery = followupsQuery
        .where('profesional_id', '==', userData.uid)
        .orderBy('fecha_creacion', 'desc')
        .limit(50);
    }
    
    console.log('Ejecutando consulta de seguimientos...');
    const followupsSnapshot = await followupsQuery.get();
    console.log('Seguimientos encontrados:', followupsSnapshot.size);
    
    renderFollowupsPanel(followupsSnapshot, userData);
    setupFollowupsListeners(userData);
    
  } catch (error) {
    console.error('Error al cargar seguimientos:', error);
    showFollowupsError(followupsPanel, error);
    handleFirebaseError(error, 'carga de seguimientos');
  }
}

// Crear header de seguimientos
function createFollowupsHeader(userData) {
  return `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos</h1>
      <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
      <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="showNewFollowupModal()">
          <i class="fas fa-plus"></i> Nuevo Seguimiento
        </button>
        <select class="form-select" id="followup-filter-type" onchange="filterFollowups()" style="max-width: 200px;">
          <option value="">Todos los tipos</option>
          <option value="primera_consulta">Primera Consulta</option>
          <option value="seguimiento_rutinario">Seguimiento Rutinario</option>
          <option value="crisis">Crisis</option>
          <option value="alta">Alta</option>
          <option value="derivacion">Derivación</option>
        </select>
        <button class="btn btn-outline" onclick="exportFollowups()">
          <i class="fas fa-download"></i> Exportar
        </button>
        <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
  `;
}

// Renderizar panel de seguimientos
function renderFollowupsPanel(followupsSnapshot, userData) {
  const followupsPanel = document.getElementById('followups-panel');
  
  let html = createFollowupsHeader(userData);
  
  if (followupsSnapshot.empty) {
    html += `
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
          No hay seguimientos registrados.
          ${userData.profesion !== 'admin' ? '<br><small>Solo ves tus propios seguimientos</small>' : ''}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="showNewFollowupModal()">
            <i class="fas fa-plus"></i> Crear Primer Seguimiento
          </button>
        </div>
      </div>
    `;
  } else {
    html += '<div class="followups-list">';
    
    followupsSnapshot.forEach(doc => {
      const data = doc.data();
      html += createFollowupCard(doc.id, data, userData);
    });
    
    html += '</div>';
  }
  
  followupsPanel.innerHTML = html;
}

// Crear tarjeta de seguimiento
function createFollowupCard(followupId, data, userData) {
  const fechaCreacion = data.fecha_creacion ? 
    (data.fecha_creacion.toDate ? data.fecha_creacion.toDate() : new Date(data.fecha_creacion)) : 
    new Date();
  
  const proximaCita = data.proxima_cita ? 
    (data.proxima_cita.toDate ? data.proxima_cita.toDate() : new Date(data.proxima_cita)) : 
    null;
  
  const tipoColor = {
    'primera_consulta': 'var(--primary-blue)',
    'seguimiento_rutinario': 'var(--success-green)',
    'crisis': 'var(--danger-red)',
    'alta': 'var(--warning-orange)',
    'derivacion': 'var(--info-blue)'
  }[data.tipo_seguimiento] || 'var(--gray-500)';
  
  return `
    <div class="card followup-card" style="margin-bottom: 16px; border-left: 4px solid ${tipoColor};" data-followup-id="${followupId}" data-type="${data.tipo_seguimiento || ''}">
      <div class="card-header">
        <div>
          <h4>${data.paciente_nombre || 'Paciente sin nombre'}</h4>
          <p><i class="fas fa-calendar"></i> ${formatDate(fechaCreacion)}</p>
          <p><i class="fas fa-user-md"></i> ${data.profesional_nombre || 'Sin profesional'}</p>
          <p><i class="fas fa-tags"></i> ${data.tipo_seguimiento || 'General'}</p>
          ${data.paciente_rut ? `<p><i class="fas fa-id-card"></i> ${data.paciente_rut}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${data.estado_paciente || 'estable'}">
            ${(data.estado_paciente || 'estable').charAt(0).toUpperCase() + (data.estado_paciente || 'estable').slice(1)}
          </span>
          ${data.metadata?.cesfam ? `
          <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
            ${data.metadata.cesfam}
          </div>
          ` : ''}
          ${data.duracion_minutos ? `
          <div style="margin-top: 4px; font-size: 12px; color: var(--gray-600);">
            Duración: ${data.duracion_minutos} min
          </div>
          ` : ''}
        </div>
      </div>
      <div class="followup-content" style="margin: 16px 0;">
        <div><strong>Observaciones:</strong></div>
        <p style="margin: 8px 0; padding: 12px; background: var(--gray-50); border-radius: 8px;">
          ${data.observaciones || 'Sin observaciones registradas'}
        </p>
        ${data.plan_tratamiento ? `
        <div style="margin-top: 12px;">
          <strong>Plan de tratamiento:</strong>
          <p style="margin: 8px 0; padding: 12px; background: var(--info-light); border-radius: 8px;">
            ${data.plan_tratamiento}
          </p>
        </div>
        ` : ''}
        ${proximaCita ? `
        <div style="margin-top: 12px;">
          <strong>Próxima cita:</strong> 
          <span style="color: var(--primary-blue);">${formatDate(proximaCita)}</span>
        </div>
        ` : ''}
        <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${data.paciente_id ? `
          <button class="btn btn-outline btn-sm" onclick="viewPatientDetail('${data.paciente_id}')">
            <i class="fas fa-user"></i> Ver Paciente
          </button>
          ` : ''}
          ${data.profesional_id === userData.uid || userData.profesion === 'admin' ? `
          <button class="btn btn-outline btn-sm" onclick="editFollowup('${followupId}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          ` : ''}
          ${data.paciente_id ? `
          <button class="btn btn-success btn-sm" onclick="scheduleAppointmentFromFollowup('${data.paciente_id}', '${data.paciente_nombre}')">
            <i class="fas fa-calendar-plus"></i> Agendar Cita
          </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Modal para nuevo seguimiento
function showNewFollowupModal() {
  const modalHTML = `
    <div class="modal-overlay" id="new-followup-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('new-followup-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Nuevo Seguimiento</h2>
        
        <form id="followup-form">
          <div class="form-group">
            <label class="form-label">Buscar Paciente por RUT *</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="followup-patient-rut" placeholder="12.345.678-9" required>
              <button type="button" class="btn btn-outline" onclick="searchPatientForFollowup()">
                <i class="fas fa-search"></i> Buscar
              </button>
            </div>
            <div id="followup-patient-result" style="margin-top: 8px;"></div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Seguimiento *</label>
            <select class="form-select" id="followup-type" required>
              <option value="">Seleccionar tipo...</option>
              <option value="primera_consulta">Primera Consulta</option>
              <option value="seguimiento_rutinario">Seguimiento Rutinario</option>
              <option value="crisis">Manejo de Crisis</option>
              <option value="evaluacion_progreso">Evaluación de Progreso</option>
              <option value="alta">Proceso de Alta</option>
              <option value="derivacion">Derivación</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado del Paciente *</label>
            <select class="form-select" id="followup-patient-status" required>
              <option value="estable">Estable</option>
              <option value="mejorando">Mejorando</option>
              <option value="empeorando">Empeorando</option>
              <option value="crisis">En Crisis</option>
              <option value="alta">Para Alta</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Duración de la Sesión (minutos)</label>
            <input type="number" class="form-input" id="followup-duration" min="15" max="180" value="45">
          </div>
          
          <div class="form-group">
            <label class="form-label">Observaciones de la Sesión *</label>
            <textarea class="form-textarea" id="followup-observations" placeholder="Describe lo observado en la sesión, evolución del paciente, temas tratados..." required rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Plan de Tratamiento</label>
            <textarea class="form-textarea" id="followup-treatment-plan" placeholder="Plan de tratamiento actualizado, objetivos, próximos pasos..." rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Próxima Cita</label>
            <input type="datetime-local" class="form-input" id="followup-next-appointment">
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('new-followup-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-save"></i> Guardar Seguimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('new-followup-modal').style.display = 'flex';
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('followup-patient-rut');
  rutInput.addEventListener('input', function(e) {
    e.target.value = formatRUT(e.target.value);
  });
  
  // Configurar fecha mínima para próxima cita
  const nextAppointmentInput = document.getElementById('followup-next-appointment');
  const now = new Date();
  const minDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  nextAppointmentInput.min = minDate;
  
  // Manejar envío
  document.getElementById('followup-form').addEventListener('submit', handleFollowupSubmission);
}

// ================= BUSCADOR DE PACIENTES POR RUT =================

// Función principal de búsqueda de pacientes
async function searchPatientByRUT(rut, containerId = null) {
  if (!rut || !validateRUT(rut)) {
    if (containerId) {
      document.getElementById(containerId).innerHTML = '<p style="color: var(--danger-red);">RUT inválido</p>';
    }
    return null;
  }
  
  try {
    console.log('Buscando paciente con RUT:', rut);
    
    // Buscar en pacientes activos
    const patientQuery = await db.collection('pacientes')
      .where('datos_personales.rut', '==', rut)
      .get();
    
    if (patientQuery.empty) {
      if (containerId) {
        document.getElementById(containerId).innerHTML = '<p style="color: var(--warning-orange);">No se encontró paciente con ese RUT</p>';
      }
      return null;
    }
    
    const patientDoc = patientQuery.docs[0];
    const patientData = patientDoc.data();
    
    // Mostrar resultado si se especifica contenedor
    if (containerId) {
      displayPatientSearchResult(patientDoc.id, patientData, containerId);
    }
    
    return { id: patientDoc.id, data: patientData };
    
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    if (containerId) {
      document.getElementById(containerId).innerHTML = '<p style="color: var(--danger-red);">Error en la búsqueda</p>';
    }
    return null;
  }
}

// Mostrar resultado de búsqueda de paciente
function displayPatientSearchResult(patientId, patientData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const activo = patientData.estado_actual?.activo;
  const borderColor = activo ? 'var(--success-green)' : 'var(--warning-orange)';
  
  container.innerHTML = `
    <div class="patient-search-result" style="padding: 16px; background: white; border: 2px solid ${borderColor}; border-radius: 8px; margin-top: 8px;">
      <div style="display: flex; justify-content: between; align-items: start;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; color: var(--primary-blue);">${patientData.datos_personales.nombre_completo}</h4>
          <p style="margin: 4px 0;"><strong>RUT:</strong> ${patientData.datos_personales.rut}</p>
          <p style="margin: 4px 0;"><strong>Edad:</strong> ${patientData.datos_personales.edad} años</p>
          <p style="margin: 4px 0;"><strong>CESFAM:</strong> ${patientData.datos_personales.cesfam}</p>
          <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'No registrado'}</p>
          ${patientData.contacto?.email ? `<p style="margin: 4px 0;"><strong>Email:</strong> ${patientData.contacto.email}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${activo ? 'activo' : 'inactivo'}">
            ${activo ? 'ACTIVO' : 'INACTIVO'}
          </span>
          <div style="margin-top: 8px; font-size: 12px; color: var(--gray-600);">
            ${patientData.estado_actual?.programa || 'Sin programa'}
          </div>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="viewCompletePatientDetail('${patientId}')">
            <i class="fas fa-eye"></i> Ver Ficha Completa
          </button>
          <button class="btn btn-outline btn-sm" onclick="viewPatientHistory('${patientId}')">
            <i class="fas fa-history"></i> Historial Clínico
          </button>
          ${activo ? `
          <button class="btn btn-success btn-sm" onclick="addFollowupToPatient('${patientId}', '${patientData.datos_personales.nombre_completo}')">
            <i class="fas fa-plus"></i> Nuevo Seguimiento
          </button>
          <button class="btn btn-outline btn-sm" onclick="scheduleAppointmentForPatient('${patientId}', '${patientData.datos_personales.nombre_completo}')">
            <i class="fas fa-calendar-plus"></i> Agendar Cita
          </button>
          ` : ''}
        </div>
      </div>
      
      <input type="hidden" id="selected-patient-id" value="${patientId}">
      <input type="hidden" id="selected-patient-name" value="${patientData.datos_personales.nombre_completo}">
      <input type="hidden" id="selected-patient-rut" value="${patientData.datos_personales.rut}">
    </div>
  `;
}

// Modal de búsqueda avanzada de pacientes
function showPatientSearchModal() {
  const modalHTML = `
    <div class="modal-overlay" id="patient-search-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-search-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Búsqueda de Pacientes</h2>
        
        <div class="search-filters" style="margin-bottom: 24px;">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Buscar por RUT</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="form-input" id="search-rut" placeholder="12.345.678-9">
                <button type="button" class="btn btn-primary" onclick="searchByRUT()">
                  <i class="fas fa-search"></i> Buscar
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Buscar por Nombre</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="form-input" id="search-name" placeholder="Nombre del paciente">
                <button type="button" class="btn btn-primary" onclick="searchByName()">
                  <i class="fas fa-search"></i> Buscar
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Filtrar por CESFAM</label>
              <select class="form-select" id="search-cesfam" onchange="filterByCesfam()">
                <option value="">Todos los CESFAM</option>
                ${cesfamPuenteAlto.map(cesfam => `<option value="${cesfam}">${cesfam}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-select" id="search-status" onchange="filterByStatus()">
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
          
          <button type="button" class="btn btn-outline" onclick="clearPatientSearch()">
            <i class="fas fa-times"></i> Limpiar búsqueda
          </button>
        </div>
        
        <div id="patient-search-results">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            Utiliza los filtros de arriba para buscar pacientes
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-search-modal').style.display = 'flex';
  
  // Configurar validación de RUT
  const rutInput = document.getElementById('search-rut');
  rutInput.addEventListener('input', function(e) {
    e.target.value = formatRUT(e.target.value);
  });
}

// Búsquedas específicas para el modal
async function searchByRUT() {
  const rut = document.getElementById('search-rut').value.trim();
  await searchPatientByRUT(rut, 'patient-search-results');
}

async function searchByName() {
  const name = document.getElementById('search-name').value.trim().toLowerCase();
  if (!name || name.length < 3) {
    document.getElementById('patient-search-results').innerHTML = '<p style="color: var(--warning-orange);">Ingresa al menos 3 caracteres para buscar por nombre</p>';
    return;
  }
  
  try {
    document.getElementById('patient-search-results').innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Buscando...</p>';
    
    // Buscar pacientes por nombre (esto requiere un índice en Firebase)
    const patientsQuery = await db.collection('pacientes')
      .orderBy('datos_personales.nombre_completo')
      .startAt(name.toUpperCase())
      .endAt(name.toUpperCase() + '\uf8ff')
      .limit(20)
      .get();
    
    displayMultiplePatientResults(patientsQuery);
    
  } catch (error) {
    console.error('Error buscando por nombre:', error);
    document.getElementById('patient-search-results').innerHTML = '<p style="color: var(--danger-red);">Error en la búsqueda por nombre</p>';
  }
}

// Mostrar múltiples resultados de pacientes
function displayMultiplePatientResults(querySnapshot) {
  const container = document.getElementById('patient-search-results');
  
  if (querySnapshot.empty) {
    container.innerHTML = '<p style="color: var(--warning-orange);">No se encontraron pacientes</p>';
    return;
  }
  
  let html = `<h3>Resultados encontrados (${querySnapshot.size}):</h3>`;
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    const activo = data.estado_actual?.activo;
    
    html += `
      <div class="card patient-result" style="margin-bottom: 12px; border-left: 4px solid ${activo ? 'var(--success-green)' : 'var(--warning-orange)'};">
        <div class="card-header">
          <div>
            <h4>${data.datos_personales.nombre_completo}</h4>
            <p>RUT: ${data.datos_personales.rut}</p>
            <p>CESFAM: ${data.datos_personales.cesfam}</p>
          </div>
          <div style="text-align: right;">
            <span class="status-badge status-${activo ? 'activo' : 'inactivo'}">
              ${activo ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <button class="btn btn-primary btn-sm" onclick="viewCompletePatientDetail('${doc.id}'); closeModal('patient-search-modal');">
            <i class="fas fa-eye"></i> Ver Detalle
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ================= FUNCIONES AUXILIARES PARA SISTEMA COMPLETO =================

// Configurar listeners para calendarios
function setupCalendarListeners(userData) {
  // Búsqueda en tiempo real para appointments
  const searchInput = document.querySelector('#calendar-panel input[placeholder*="Buscar"]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterAppointments(this.value);
    });
  }
}

// Configurar listeners para seguimientos
function setupFollowupsListeners(userData) {
  // No listeners específicos adicionales por ahora
}

// Configurar búsqueda de pacientes
function setupPatientSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterPatients(this.value);
    });
  }
}

// Función para mostrar citas de hoy
async function showTodayAppointments() {
  if (!currentUserData || !currentUserData.uid) {
    showNotification('Error: Usuario no autenticado', 'error');
    return;
  }
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todaySnapshot = await db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    if (todaySnapshot.empty) {
      showNotification('No tienes citas programadas para hoy', 'info');
    } else {
      showNotification(`Tienes ${todaySnapshot.size} cita(s) programada(s) para hoy`, 'success');
      
      // Mostrar detalles de las citas de hoy
      showTodayAppointmentsModal(todaySnapshot);
    }
    
  } catch (error) {
    console.error('Error al cargar citas de hoy:', error);
    handleFirebaseError(error, 'carga de citas de hoy');
  }
}

// Modal para mostrar citas de hoy
function showTodayAppointmentsModal(appointmentsSnapshot) {
  let appointmentsHtml = '';
  
  appointmentsSnapshot.forEach(doc => {
    const data = doc.data();
    const fecha = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
    
    appointmentsHtml += `
      <div class="today-appointment" style="padding: 12px; margin-bottom: 8px; background: var(--gray-50); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${data.paciente_nombre}</strong><br>
            <span style="color: var(--gray-600);">${formatTimeOnly(fecha)} - ${data.tipo_cita}</span>
          </div>
          <span class="status-badge status-${data.estado}">${data.estado}</span>
        </div>
      </div>
    `;
  });
  
  const modalHTML = `
    <div class="modal-overlay" id="today-appointments-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('today-appointments-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Citas de Hoy</h2>
        <div style="max-height: 400px; overflow-y: auto;">
          ${appointmentsHtml}
        </div>
        <div style="margin-top: 16px; text-align: center;">
          <button class="btn btn-outline" onclick="closeModal('today-appointments-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('today-appointments-modal').style.display = 'flex';
}

// Implementar otras funciones faltantes básicas
function startAppointment(appointmentId) {
  if (confirm('¿Iniciar esta cita?')) {
    updateAppointmentStatus(appointmentId, 'en_progreso');
  }
}

function completeAppointment(appointmentId) {
  if (confirm('¿Marcar esta cita como completada?')) {
    updateAppointmentStatus(appointmentId, 'completada');
  }
}

function cancelAppointment(appointmentId) {
  if (confirm('¿Estás seguro de cancelar esta cita?')) {
    updateAppointmentStatus(appointmentId, 'cancelada');
  }
}

async function updateAppointmentStatus(appointmentId, newStatus) {
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: newStatus,
      fecha_actualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification(`Cita ${newStatus} correctamente`, 'success');
    loadCalendarPanel(currentUserData);
  } catch (error) {
    console.error('Error actualizando cita:', error);
    handleFirebaseError(error, 'actualización de cita');
  }
}

// ================= FUNCIONES DE INTEGRACIÓN RÁPIDA =================

// Función para buscar paciente en formularios (reutilizable)
async function searchPatientForFollowup() {
  const rut = document.getElementById('followup-patient-rut').value.trim();
  await searchPatientByRUT(rut, 'followup-patient-result');
}

// Función genérica para manejo de envío de seguimientos
async function handleFollowupSubmission(e) {
  e.preventDefault();
  
  const patientId = document.getElementById('selected-patient-id')?.value;
  const patientName = document.getElementById('selected-patient-name')?.value;
  const patientRut = document.getElementById('selected-patient-rut')?.value;
  
  if (!patientId) {
    showNotification('Debe seleccionar un paciente válido', 'error');
    return;
  }
  
  const followupData = {
    profesional_id: currentUserData.uid,
    profesional_nombre: currentUserData.nombre,
    paciente_id: patientId,
    paciente_nombre: patientName,
    paciente_rut: patientRut,
    tipo_seguimiento: document.getElementById('followup-type').value,
    estado_paciente: document.getElementById('followup-patient-status').value,
    duracion_minutos: parseInt(document.getElementById('followup-duration').value) || null,
    observaciones: document.getElementById('followup-observations').value.trim(),
    plan_tratamiento: document.getElementById('followup-treatment-plan').value.trim() || null,
    proxima_cita: document.getElementById('followup-next-appointment').value ? 
      new Date(document.getElementById('followup-next-appointment').value) : null,
    fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
    metadata: {
      cesfam: currentUserData.cesfam_asignado,
      version: '2.0'
    }
  };
  
  try {
    showLoading(true);
    
    await db.collection('seguimientos').add(followupData);
    
    showNotification('Seguimiento registrado correctamente', 'success');
    closeModal('new-followup-modal');
    loadFollowupsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error guardando seguimiento:', error);
    handleFirebaseError(error, 'registro de seguimiento');
  } finally {
    showLoading(false);
  }
}

console.log('🔥 Sistema SENDA - Funcionalidades Firebase PARTE 2 cargadas correctamente');
// ================= FUNCIONES FALTANTES IMPLEMENTADAS COMPLETAMENTE =================

// Función completa para ver detalle de paciente
async function viewPatientDetail(patientId) {
  try {
    showLoading(true);
    
    // Obtener datos del paciente
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    
    // Obtener historial de seguimientos
    const followupsQuery = await db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha_creacion', 'desc')
      .limit(10)
      .get();
    
    // Obtener citas próximas
    const upcomingAppointmentsQuery = await db.collection('citas')
      .where('paciente_id', '==', patientId)
      .where('fecha', '>=', new Date())
      .orderBy('fecha', 'asc')
      .limit(5)
      .get();
    
    showPatientDetailModal(patientId, patientData, followupsQuery, upcomingAppointmentsQuery);
    
  } catch (error) {
    console.error('Error al cargar detalle del paciente:', error);
    handleFirebaseError(error, 'carga de detalle de paciente');
  } finally {
    showLoading(false);
  }
}

// Modal de detalle completo del paciente
function showPatientDetailModal(patientId, patientData, followupsQuery, appointmentsQuery) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-detail-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-detail-modal')">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="patient-detail-header">
          <h2>${patientData.datos_personales.nombre_completo}</h2>
          <span class="status-badge status-${patientData.estado_actual?.activo ? 'activo' : 'inactivo'}">
            ${patientData.estado_actual?.activo ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
        
        <div class="tabs">
          <div class="tab-list">
            <button class="tab-button active" data-tab="info">Información Personal</button>
            <button class="tab-button" data-tab="clinical">Historial Clínico</button>
            <button class="tab-button" data-tab="appointments">Citas</button>
            <button class="tab-button" data-tab="followups">Seguimientos</button>
          </div>
        </div>
        
        <!-- Tab: Información Personal -->
        <div class="tab-content active" id="info-tab">
          <div class="info-grid">
            <div class="info-section">
              <h3>Datos Personales</h3>
              <div class="info-item"><strong>RUT:</strong> ${patientData.datos_personales.rut}</div>
              <div class="info-item"><strong>Edad:</strong> ${patientData.datos_personales.edad} años</div>
              <div class="info-item"><strong>CESFAM:</strong> ${patientData.datos_personales.cesfam}</div>
              <div class="info-item"><strong>Dirección:</strong> ${patientData.datos_personales.direccion || 'No registrada'}</div>
            </div>
            
            <div class="info-section">
              <h3>Contacto</h3>
              <div class="info-item"><strong>Teléfono:</strong> ${patientData.contacto?.telefono || 'No registrado'}</div>
              <div class="info-item"><strong>Email:</strong> ${patientData.contacto?.email || 'No registrado'}</div>
            </div>
            
            <div class="info-section">
              <h3>Estado Actual</h3>
              <div class="info-item"><strong>Programa:</strong> ${patientData.estado_actual?.programa || 'No asignado'}</div>
              <div class="info-item"><strong>Profesional asignado:</strong> ${patientData.estado_actual?.profesional_asignado || 'Sin asignar'}</div>
              <div class="info-item"><strong>Fecha de ingreso:</strong> ${formatDate(patientData.estado_actual?.fecha_ingreso)}</div>
            </div>
          </div>
        </div>
        
        <!-- Tab: Historial Clínico -->
        <div class="tab-content" id="clinical-tab">
          <div class="clinical-history">
            ${patientData.historial_clinico ? renderClinicalHistory(patientData.historial_clinico) : '<p>No hay historial clínico registrado</p>'}
          </div>
        </div>
        
        <!-- Tab: Citas -->
        <div class="tab-content" id="appointments-tab">
          <div class="appointments-section">
            <h3>Próximas Citas</h3>
            ${renderUpcomingAppointments(appointmentsQuery)}
          </div>
        </div>
        
        <!-- Tab: Seguimientos -->
        <div class="tab-content" id="followups-tab">
          <div class="followups-section">
            <h3>Últimos Seguimientos</h3>
            ${renderPatientFollowups(followupsQuery)}
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
          ${patientData.estado_actual?.activo ? `
          <button class="btn btn-success" onclick="addFollowupToPatient('${patientId}', '${patientData.datos_personales.nombre_completo}')">
            <i class="fas fa-plus"></i> Nuevo Seguimiento
          </button>
          <button class="btn btn-primary" onclick="scheduleAppointmentForPatient('${patientId}', '${patientData.datos_personales.nombre_completo}')">
            <i class="fas fa-calendar-plus"></i> Agendar Cita
          </button>
          <button class="btn btn-outline" onclick="editPatientInfo('${patientId}')">
            <i class="fas fa-edit"></i> Editar Información
          </button>
          ` : ''}
          <button class="btn btn-outline" onclick="exportPatientData('${patientId}')">
            <i class="fas fa-download"></i> Exportar Datos
          </button>
          <button class="btn btn-outline" onclick="closeModal('patient-detail-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-detail-modal').style.display = 'flex';
  
  // Configurar funcionalidad de tabs
  setupModalTabs();
}

// Renderizar historial clínico
function renderClinicalHistory(historial) {
  if (!historial || historial.length === 0) {
    return '<p>No hay registros en el historial clínico</p>';
  }
  
  let html = '';
  historial.forEach(registro => {
    const fecha = registro.fecha ? (registro.fecha.toDate ? registro.fecha.toDate() : new Date(registro.fecha)) : new Date();
    
    html += `
      <div class="clinical-record" style="padding: 16px; margin-bottom: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid var(--primary-blue);">
        <div class="record-header">
          <h4>${registro.tipo || 'Consulta'}</h4>
          <span style="color: var(--gray-600);">${formatDate(fecha)}</span>
        </div>
        <div class="record-content">
          <p><strong>Profesional:</strong> ${registro.profesional || 'No especificado'}</p>
          ${registro.evaluacion_inicial ? `
          <div style="margin-top: 8px;">
            <strong>Evaluación inicial:</strong>
            <ul>
              ${registro.evaluacion_inicial.sustancias_consumo ? `<li>Sustancias: ${registro.evaluacion_inicial.sustancias_consumo.join(', ')}</li>` : ''}
              ${registro.evaluacion_inicial.motivacion_cambio ? `<li>Motivación: ${registro.evaluacion_inicial.motivacion_cambio}/10</li>` : ''}
              ${registro.evaluacion_inicial.urgencia_declarada ? `<li>Urgencia: ${registro.evaluacion_inicial.urgencia_declarada}</li>` : ''}
            </ul>
          </div>
          ` : ''}
          ${registro.observaciones ? `<p><strong>Observaciones:</strong> ${registro.observaciones}</p>` : ''}
        </div>
      </div>
    `;
  });
  
  return html;
}

// Renderizar citas próximas
function renderUpcomingAppointments(appointmentsQuery) {
  if (appointmentsQuery.empty) {
    return '<p>No hay citas próximas programadas</p>';
  }
  
  let html = '';
  appointmentsQuery.forEach(doc => {
    const data = doc.data();
    const fecha = data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha);
    
    html += `
      <div class="appointment-item" style="padding: 12px; margin-bottom: 8px; background: var(--info-light); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${formatDate(fecha)}</strong><br>
            <span>${data.tipo_cita} - ${data.profesional_nombre}</span>
          </div>
          <span class="status-badge status-${data.estado}">${data.estado}</span>
        </div>
      </div>
    `;
  });
  
  return html;
}

// Renderizar seguimientos del paciente
function renderPatientFollowups(followupsQuery) {
  if (followupsQuery.empty) {
    return '<p>No hay seguimientos registrados</p>';
  }
  
  let html = '';
  followupsQuery.forEach(doc => {
    const data = doc.data();
    const fecha = data.fecha_creacion ? (data.fecha_creacion.toDate ? data.fecha_creacion.toDate() : new Date(data.fecha_creacion)) : new Date();
    
    html += `
      <div class="followup-item" style="padding: 12px; margin-bottom: 8px; background: var(--success-light); border-radius: 8px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${data.tipo_seguimiento || 'Seguimiento'}</strong>
            <span style="color: var(--gray-600);">${formatDate(fecha)}</span>
          </div>
          <p style="margin: 8px 0;"><strong>Profesional:</strong> ${data.profesional_nombre}</p>
          <p style="margin: 4px 0;"><strong>Estado:</strong> ${data.estado_paciente}</p>
          ${data.observaciones ? `<p style="margin: 4px 0;"><strong>Observaciones:</strong> ${data.observaciones.substring(0, 100)}...</p>` : ''}
        </div>
      </div>
    `;
  });
  
  return html;
}

// ================= FUNCIONES DE SEGUIMIENTOS AVANZADAS =================

// Agregar seguimiento a paciente específico
function addFollowupToPatient(patientId, patientName) {
  // Pre-llenar el modal de seguimiento con datos del paciente
  showNewFollowupModal();
  
  // Esperar a que el modal se cargue y luego pre-llenar
  setTimeout(() => {
    document.getElementById('followup-patient-result').innerHTML = `
      <div class="patient-found" style="padding: 12px; background: var(--success-light); border-radius: 8px; border: 1px solid var(--success-green);">
        <p><strong>${patientName}</strong> (Seleccionado)</p>
        <input type="hidden" id="selected-patient-id" value="${patientId}">
        <input type="hidden" id="selected-patient-name" value="${patientName}">
      </div>
    `;
  }, 100);
}

// Agendar cita para paciente específico
function scheduleAppointmentForPatient(patientId, patientName, patientRut = '') {
  showNewAppointmentModal();
  
  // Pre-llenar datos del paciente
  setTimeout(() => {
    if (patientRut) {
      document.getElementById('patient-rut-search').value = patientRut;
    }
    document.getElementById('patient-search-result').innerHTML = `
      <div class="patient-found" style="padding: 12px; background: var(--success-light); border-radius: 8px; border: 1px solid var(--success-green);">
        <p><strong>${patientName}</strong> (Seleccionado)</p>
        <input type="hidden" id="selected-patient-id" value="${patientId}">
        <input type="hidden" id="selected-patient-name" value="${patientName}">
      </div>
    `;
  }, 100);
}

// ================= SISTEMA DE FILTROS AVANZADOS =================

// Filtros para solicitudes
function applyRequestFilters() {
  const priority = document.getElementById('filter-priority').value;
  const status = document.getElementById('filter-status').value;
  const type = document.getElementById('filter-type').value;
  
  const cards = document.querySelectorAll('.request-card');
  
  cards.forEach(card => {
    const cardPriority = card.dataset.priority;
    const cardStatus = card.dataset.status;
    const cardType = card.dataset.type;
    
    const priorityMatch = !priority || cardPriority === priority;
    const statusMatch = !status || cardStatus === status;
    const typeMatch = !type || cardType === type;
    
    card.style.display = (priorityMatch && statusMatch && typeMatch) ? 'block' : 'none';
  });
}

// Limpiar filtros de solicitudes
function clearRequestFilters() {
  document.getElementById('filter-priority').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-type').value = '';
  
  document.querySelectorAll('.request-card').forEach(card => {
    card.style.display = 'block';
  });
}

// Filtrar citas en el calendario
function filterAppointments(searchTerm) {
  const appointmentCards = document.querySelectorAll('.appointment-card');
  const searchLower = searchTerm.toLowerCase();
  
  appointmentCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const shouldShow = text.includes(searchLower);
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

// Filtrar seguimientos
function filterFollowups() {
  const type = document.getElementById('followup-filter-type').value;
  const cards = document.querySelectorAll('.followup-card');
  
  cards.forEach(card => {
    const cardType = card.dataset.type;
    const shouldShow = !type || cardType === type;
    card.style.display = shouldShow ? 'block' : 'none';
  });
}

// ================= SISTEMA DE ACTUALIZACIÓN DE PRIORIDADES =================

// Modal para cambiar prioridad de solicitud
function updateRequestPriority(requestId) {
  const modalHTML = `
    <div class="modal-overlay" id="priority-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('priority-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Cambiar Prioridad</h2>
        
        <form id="priority-form">
          <div class="form-group">
            <label class="form-label">Nueva Prioridad *</label>
            <select class="form-select" id="new-priority" required>
              <option value="">Seleccionar prioridad...</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Motivo del cambio</label>
            <textarea class="form-textarea" id="priority-reason" placeholder="Explique por qué cambia la prioridad..." rows="3"></textarea>
          </div>
          
          <div class="form-navigation" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" onclick="closeModal('priority-modal')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-warning">
              <i class="fas fa-flag"></i> Actualizar Prioridad
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('priority-modal').style.display = 'flex';
  
  // Manejar envío
  document.getElementById('priority-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPriority = document.getElementById('new-priority').value;
    const reason = document.getElementById('priority-reason').value.trim();
    
    try {
      showLoading(true);
      
      await db.collection('solicitudes_ingreso').doc(requestId).update({
        'clasificacion.prioridad': newPriority,
        'clasificacion.fecha_cambio_prioridad': firebase.firestore.FieldValue.serverTimestamp(),
        'clasificacion.motivo_cambio_prioridad': reason,
        'clasificacion.profesional_cambio': currentUserData.uid
      });
      
      showNotification('Prioridad actualizada correctamente', 'success');
      closeModal('priority-modal');
      loadRequestsPanel(currentUserData);
      
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
      handleFirebaseError(error, 'actualización de prioridad');
    } finally {
      showLoading(false);
    }
  });
}

// ================= SISTEMA DE EXPORTACIONES =================

// Exportar datos del paciente
async function exportPatientData(patientId) {
  try {
    showLoading(true);
    
    // Obtener datos completos del paciente
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    const patientData = patientDoc.data();
    
    // Obtener seguimientos
    const followupsQuery = await db.collection('seguimientos')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha_creacion', 'desc')
      .get();
    
    // Obtener citas
    const appointmentsQuery = await db.collection('citas')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc')
      .get();
    
    // Crear objeto de exportación
    const exportData = {
      paciente: patientData,
      seguimientos: [],
      citas: []
    };
    
    followupsQuery.forEach(doc => {
      exportData.seguimientos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    appointmentsQuery.forEach(doc => {
      exportData.citas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `paciente_${patientData.datos_personales.rut}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Datos del paciente exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exportando datos:', error);
    handleFirebaseError(error, 'exportación de datos');
  } finally {
    showLoading(false);
  }
}

// Exportar calendario
async function exportCalendar() {
  try {
    showLoading(true);
    
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
    
    const appointmentsQuery = await db.collection('citas')
      .where('profesional_id', '==', currentUserData.uid)
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha', 'asc')
      .get();
    
    let csvContent = "Fecha,Hora,Paciente,Tipo,Estado,Observaciones\n";
    
    appointmentsQuery.forEach(doc => {
      const data = doc.data();
      const fecha = data.fecha.toDate();
      
      csvContent += `"${formatDateOnly(fecha)}","${formatTimeOnly(fecha)}","${data.paciente_nombre}","${data.tipo_cita}","${data.estado}","${data.observaciones || ''}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agenda_${currentUserData.nombre}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Agenda exportada correctamente', 'success');
    
  } catch (error) {
    console.error('Error exportando agenda:', error);
    handleFirebaseError(error, 'exportación de agenda');
  } finally {
    showLoading(false);
  }
}

// Exportar seguimientos
async function exportFollowups() {
  try {
    showLoading(true);
    
    const followupsQuery = await db.collection('seguimientos')
      .where('profesional_id', '==', currentUserData.uid)
      .orderBy('fecha_creacion', 'desc')
      .limit(100)
      .get();
    
    let csvContent = "Fecha,Paciente,Tipo,Estado,Observaciones,Plan de Tratamiento\n";
    
    followupsQuery.forEach(doc => {
      const data = doc.data();
      const fecha = data.fecha_creacion.toDate();
      
      csvContent += `"${formatDate(fecha)}","${data.paciente_nombre}","${data.tipo_seguimiento}","${data.estado_paciente}","${data.observaciones || ''}","${data.plan_tratamiento || ''}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seguimientos_${currentUserData.nombre}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Seguimientos exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exportando seguimientos:', error);
    handleFirebaseError(error, 'exportación de seguimientos');
  } finally {
    showLoading(false);
  }
}

// ================= SISTEMA DE EDICIÓN =================

// Editar información del paciente
function editPatientInfo(patientId) {
  showNotification('Función de edición de paciente en desarrollo', 'info');
  // TODO: Implementar modal de edición con validaciones
}

// Editar cita
function editAppointment(appointmentId) {
  showNotification('Función de edición de cita en desarrollo', 'info');
  // TODO: Implementar modal de edición de cita
}

// Editar seguimiento
function editFollowup(followupId) {
  showNotification('Función de edición de seguimiento en desarrollo', 'info');
  // TODO: Implementar modal de edición de seguimiento
}

// ================= FUNCIONES DE CONFIGURACIÓN DE TABS =================

// Configurar funcionalidad de tabs en modales
function setupModalTabs() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
      const tabGroup = e.target.closest('.tabs');
      const targetTab = e.target.dataset.tab;
      
      if (tabGroup && targetTab) {
        // Remover clase active de todos los botones y contenidos
        tabGroup.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        const parentModal = tabGroup.closest('.modal');
        if (parentModal) {
          parentModal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        }
        
        // Agregar clase active al botón clickeado y su contenido
        e.target.classList.add('active');
        const tabContent = document.getElementById(targetTab + '-tab');
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    }
  });
}

// ================= SISTEMA DE VALIDACIONES AVANZADAS =================

// Validación avanzada de formularios
function validateAdvancedForm(formData, formType) {
  const errors = [];
  
  switch (formType) {
    case 'appointment':
      if (!formData.patientId) {
        errors.push('Debe seleccionar un paciente válido');
      }
      if (!formData.datetime) {
        errors.push('Debe especificar fecha y hora');
      } else {
        const appointmentDate = new Date(formData.datetime);
        if (appointmentDate <= new Date()) {
          errors.push('La fecha debe ser en el futuro');
        }
        
        // Validar horario laboral (ejemplo: 8:00 - 18:00)
        const hour = appointmentDate.getHours();
        if (hour < 8 || hour >= 18) {
          errors.push('Las citas solo pueden agendarse entre 8:00 y 18:00');
        }
        
        // Validar días laborales (no fines de semana)
        const dayOfWeek = appointmentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          errors.push('No se pueden agendar citas los fines de semana');
        }
      }
      break;
      
    case 'followup':
      if (!formData.patientId) {
        errors.push('Debe seleccionar un paciente válido');
      }
      if (!formData.observations || formData.observations.length < 10) {
        errors.push('Las observaciones deben tener al menos 10 caracteres');
      }
      if (formData.duration && (formData.duration < 15 || formData.duration > 180)) {
        errors.push('La duración debe estar entre 15 y 180 minutos');
      }
      break;
      
    case 'patient':
      if (formData.rut && !validateRUT(formData.rut)) {
        errors.push('El RUT ingresado no es válido');
      }
      if (formData.email && !isValidEmail(formData.email)) {
        errors.push('El email ingresado no es válido');
      }
      if (formData.age && (formData.age < 12 || formData.age > 120)) {
        errors.push('La edad debe estar entre 12 y 120 años');
      }
      break;
  }
  
  return errors;
}

// ================= SISTEMA DE NOTIFICACIONES EN TIEMPO REAL =================

// Configurar listeners de notificaciones en tiempo real
function setupRealTimeNotifications(userData) {
  // Listener para nuevas solicitudes
  if (userData.profesion === 'asistente_social' || userData.profesion === 'admin' || userData.profesion === 'coordinador') {
    let solicitudesQuery = db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente');
    
    if (userData.cesfam_asignado && userData.profesion !== 'admin') {
      solicitudesQuery = solicitudesQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
    }
    
    const unsubscribeSolicitudes = solicitudesQuery.onSnapshot(
      snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const isReentry = data.tipo_solicitud === 'reingreso';
            const priority = data.clasificacion?.prioridad || 'baja';
            
            // Mostrar notificación diferente según prioridad
            const notificationType = priority === 'critica' ? 'error' : priority === 'alta' ? 'warning' : 'info';
            
            showNotification(
              `Nueva solicitud ${isReentry ? 'de reingreso' : 'de ingreso'} (${priority.toUpperCase()})`, 
              notificationType, 
              8000
            );
            
            // Actualizar badge de solicitudes
            updateRequestsBadge();
          }
        });
      },
      error => {
        console.warn('Error en listener de solicitudes:', error);
      }
    );
    
    // Agregar a unsubscribers
    if (!window.sendaUnsubscribers) window.sendaUnsubscribers = [];
    window.sendaUnsubscribers.push(unsubscribeSolicitudes);
  }
  
  // Listener para citas próximas (recordatorios)
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  const citasQuery = db.collection('citas')
    .where('profesional_id', '==', userData.uid)
    .where('fecha', '>=', today)
    .where('fecha', '<=', tomorrow)
    .where('estado', '==', 'programada');
  
  const unsubscribeCitas = citasQuery.onSnapshot(
    snapshot => {
      if (!snapshot.empty) {
        const citasHoy = snapshot.docs.filter(doc => {
          const fecha = doc.data().fecha.toDate();
          return fecha.toDateString() === today.toDateString();
        });
        
        if (citasHoy.length > 0) {
          showNotification(
            `Tienes ${citasHoy.length} cita(s) programada(s) para hoy`, 
            'info', 
            10000
          );
        }
      }
    },
    error => {
      console.warn('Error en listener de citas:', error);
    }
  );
  
  if (!window.sendaUnsubscribers) window.sendaUnsubscribers = [];
  window.sendaUnsubscribers.push(unsubscribeCitas);
}

// Actualizar badge de solicitudes pendientes
async function updateRequestsBadge() {
  try {
    if (!currentUserData) return;
    
    let query = db.collection('solicitudes_ingreso')
      .where('clasificacion.estado', '==', 'pendiente');
    
    if (currentUserData.cesfam_asignado && currentUserData.profesion !== 'admin') {
      query = query.where('datos_personales.cesfam', '==', currentUserData.cesfam_asignado);
    }
    
    const snapshot = await query.get();
    const count = snapshot.size;
    
    const badge = document.getElementById('requests-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
    
  } catch (error) {
    console.warn('Error actualizando badge de solicitudes:', error);
  }
}

// ================= SISTEMA DE ESTADOS Y TRANSICIONES =================

// Gestionar transiciones de estado de solicitudes
async function updateRequestStatus(requestId, newStatus, reason = '') {
  try {
    const updateData = {
      'clasificacion.estado': newStatus,
      'clasificacion.fecha_actualizacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_actualizacion': currentUserData.uid
    };
    
    if (reason) {
      updateData['clasificacion.motivo_actualizacion'] = reason;
    }
    
    await db.collection('solicitudes_ingreso').doc(requestId).update(updateData);
    
    return true;
  } catch (error) {
    console.error('Error actualizando estado de solicitud:', error);
    return false;
  }
}

// ================= FUNCIONES DE UTILIDADES ADICIONALES =================

// Función para limpiar datos antes de enviar a Firebase
function sanitizeFirebaseData(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        sanitized[key] = sanitizeFirebaseData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// Función para obtener estadísticas en tiempo real
async function getRealtimeStats(userData) {
  try {
    const stats = {
      totalPatients: 0,
      todayAppointments: 0,
      pendingRequests: 0,
      thisWeekFollowups: 0,
      criticalRequests: 0
    };
    
    // Ejecutar consultas en paralelo para mejor rendimiento
    const promises = [];
    
    // Pacientes activos
    if (userData.profesion === 'admin') {
      promises.push(
        db.collection('pacientes')
          .where('estado_actual.activo', '==', true)
          .get()
      );
    } else if (userData.cesfam_asignado) {
      promises.push(
        db.collection('pacientes')
          .where('datos_personales.cesfam', '==', userData.cesfam_asignado)
          .where('estado_actual.activo', '==', true)
          .get()
      );
    } else {
      promises.push(Promise.resolve({ size: 0 }));
    }
    
    // Citas de hoy
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    promises.push(
      db.collection('citas')
        .where('profesional_id', '==', userData.uid)
        .where('fecha', '>=', startOfDay)
        .where('fecha', '<=', endOfDay)
        .get()
    );
    
    // Solicitudes pendientes
    if (userData.profesion === 'asistente_social' || userData.profesion === 'admin' || userData.profesion === 'coordinador') {
      let requestsQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente');
      
      if (userData.cesfam_asignado && userData.profesion !== 'admin') {
        requestsQuery = requestsQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
      }
      
      promises.push(requestsQuery.get());
      
      // Solicitudes críticas
      let criticalQuery = db.collection('solicitudes_ingreso')
        .where('clasificacion.estado', '==', 'pendiente')
        .where('clasificacion.prioridad', '==', 'critica');
      
      if (userData.cesfam_asignado && userData.profesion !== 'admin') {
        criticalQuery = criticalQuery.where('datos_personales.cesfam', '==', userData.cesfam_asignado);
      }
      
      promises.push(criticalQuery.get());
    } else {
      promises.push(Promise.resolve({ size: 0 }));
      promises.push(Promise.resolve({ size: 0 }));
    }
    
    // Seguimientos de esta semana
    const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    promises.push(
      db.collection('seguimientos')
        .where('profesional_id', '==', userData.uid)
        .where('fecha_creacion', '>=', startOfWeek)
        .get()
    );
    
    // Ejecutar todas las consultas
    const results = await Promise.all(promises);
    
    stats.totalPatients = results[0].size;
    stats.todayAppointments = results[1].size;
    stats.pendingRequests = results[2].size;
    stats.criticalRequests = results[3].size;
    stats.thisWeekFollowups = results[4].size;
    
    return stats;
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

// ================= SISTEMA DE RESPALDO Y RECUPERACIÓN =================

// Función para crear respaldo local
function createLocalBackup() {
  const backupData = {
    timestamp: new Date().toISOString(),
    user: currentUserData?.uid,
    drafts: localStorage.getItem('senda_draft'),
    preferences: localStorage.getItem('senda_preferences') || '{}',
    version: '2.0'
  };
  
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `senda_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showNotification('Respaldo local creado correctamente', 'success');
}

// ================= INICIALIZACIÓN DE FUNCIONES COMPLEMENTARIAS =================

// Función para inicializar todas las funcionalidades complementarias
function initializeComplementaryFeatures() {
  console.log('🔧 Inicializando funcionalidades complementarias...');
  
  // Configurar tabs globalmente
  setupModalTabs();
  
  // Configurar listeners de teclado para navegación rápida
  document.addEventListener('keydown', function(e) {
    // Ctrl + F para búsqueda rápida de pacientes
    if (e.ctrlKey && e.key === 'f' && !e.defaultPrevented) {
      e.preventDefault();
      if (currentUserData) {
        showPatientSearchModal();
      }
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
      const visibleModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (visibleModal) {
        closeModal(visibleModal.id);
      }
    }
  });
  
  // Configurar auto-guardado de borradores cada 2 minutos
  setInterval(() => {
    if (isDraftSaved === false && Object.keys(formData).length > 0) {
      saveDraft(false);
    }
  }, 120000); // 2 minutos
  
  // Configurar actualización automática de estadísticas cada 5 minutos
  setInterval(() => {
    if (currentUserData) {
      updateRequestsBadge();
    }
  }, 300000); // 5 minutos
  
  console.log('✅ Funcionalidades complementarias inicializadas');
}

// Ejecutar inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeComplementaryFeatures);
} else {
  initializeComplementaryFeatures();
}

console.log('🔥 Sistema SENDA - Funcionalidades Complementarias PARTE 3 cargadas correctamente');
