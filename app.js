// ================= CORRECCIÓN: SISTEMA DE REINGRESO =================

// Función corregida para mostrar modal de reingreso
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
  
  // Configurar validación de RUT
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
  
  // Configurar formateo de teléfono
  const phoneInput = document.getElementById('reentry-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }
  
  // Manejar envío del formulario - CORREGIDO
  document.getElementById('reentry-form').addEventListener('submit', handleReentrySubmission);
}

// Función CORREGIDA para manejar envío de reingreso
async function handleReentrySubmission(e) {
  e.preventDefault();
  
  const name = document.getElementById('reentry-name').value.trim();
  const rut = document.getElementById('reentry-rut').value.trim();
  const cesfam = document.getElementById('reentry-cesfam').value;
  const phone = document.getElementById('reentry-phone').value.trim();
  const email = document.getElementById('reentry-email').value.trim();
  const reason = document.getElementById('reentry-reason').value.trim();
  
  // Validaciones mejoradas
  if (!name || !rut || !cesfam || !phone || !reason) {
    showNotification('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!validateRUT(rut)) {
    showNotification('El RUT ingresado no es válido', 'error');
    return;
  }
  
  if (email && !isValidEmail(email)) {
    showNotification('El email ingresado no es válido', 'error');
    return;
  }
  
  try {
    showLoading(true);
    
    // ESTRUCTURA CORREGIDA para Firebase - usando la misma colección que las solicitudes normales
    const reentryData = {
      // Identificador del tipo de solicitud
      tipo_solicitud: 'reingreso',
      
      // Datos personales
      datos_personales: {
        nombre_completo: name,
        rut: rut,
        cesfam: cesfam,
        edad: null, // Se puede pedir después
        para_quien: 'para_mi', // Por defecto en reingresos
        anonimo: false,
        solo_informacion: false
      },
      
      // Datos de contacto
      datos_contacto: {
        nombre_completo: name,
        rut: rut,
        telefono_principal: phone,
        email: email || null,
        direccion: null // Se puede pedir después
      },
      
      // Información específica del reingreso
      reingreso: {
        motivo: reason,
        fecha_solicitud: firebase.firestore.FieldValue.serverTimestamp(),
        estado: 'pendiente',
        tipo_anterior: null, // Se puede agregar después
        fecha_ultimo_egreso: null // Se puede agregar después
      },
      
      // Clasificación automática
      clasificacion: {
        tipo: 'reingreso',
        estado: 'pendiente',
        prioridad: 'alta', // Los reingresos tienen prioridad alta por defecto
        categoria_riesgo: 'moderado',
        fecha_clasificacion: firebase.firestore.FieldValue.serverTimestamp()
      },
      
      // Metadata del sistema
      metadata: {
        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
        canal_ingreso: 'web_reingreso',
        ip_origen: 'anonimizada',
        dispositivo_usado: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
        version_formulario: '1.0'
      }
    };
    
    // GUARDAR en Firebase - CORREGIDO
    console.log('Enviando datos de reingreso:', reentryData);
    
    const docRef = await db.collection('solicitudes_ingreso').add(reentryData);
    
    console.log('Reingreso guardado con ID:', docRef.id);
    
    showNotification('Solicitud de reingreso enviada correctamente. Se le contactará pronto.', 'success', 6000);
    closeModal('reentry-modal');
    
    // Limpiar formulario
    document.getElementById('reentry-form').reset();
    
  } catch (error) {
    console.error('Error al enviar solicitud de reingreso:', error);
    showNotification('Error al enviar la solicitud de reingreso. Intente nuevamente.', 'error');
  } finally {
    showLoading(false);
  }
}
// ================= CORRECCIÓN: CARGA DE SOLICITUDES =================

// Función CORREGIDA para cargar solicitudes
async function loadRequestsPanel(userData) {
  console.log('Cargando panel de solicitudes para:', userData.nombre);
  
  if (!userData || !userData.profesion) {
    console.error('Datos de usuario no válidos:', userData);
    showNotification('Error: Datos de usuario no válidos', 'error');
    return;
  }
  
  if (userData.profesion !== 'asistente_social' && userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Solo los asistentes sociales, coordinadores y administradores pueden ver las solicitudes de ingreso.
          </p>
        </div>
      `;
    }
    return;
  }
  
  try {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) {
      console.error('Elemento requests-list no encontrado');
      return;
    }
    
    requestsList.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando solicitudes...</div>';
    
    // CONSULTA CORREGIDA - verificar que la colección existe
    let query = db.collection('solicitudes_ingreso');
    
    // FILTRAR POR CESFAM si no es admin
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
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay solicitudes disponibles en este momento.
            ${userData.cesfam_asignado ? `<br><small>CESFAM: ${userData.cesfam_asignado}</small>` : ''}
          </p>
        </div>
      `;
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // VALIDAR DATOS antes de renderizar
      const priority = data.clasificacion?.prioridad || 'baja';
      const estado = data.clasificacion?.estado || 'pendiente';
      const isAnonymous = data.datos_personales?.anonimo || false;
      const isInfoOnly = data.datos_personales?.solo_informacion || false;
      const isReentry = data.tipo_solicitud === 'reingreso';
      
      // Obtener nombre según el tipo de solicitud
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
      
      html += `
        <div class="card patient-card" data-request-id="${doc.id}">
          <div class="card-header">
            <div>
              <h3>
                ${isReentry ? '<i class="fas fa-redo" style="color: var(--warning-orange);"></i> ' : ''}
                Solicitud ${doc.id.substring(0, 8).toUpperCase()}
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
            <div><strong>Tipo:</strong> ${isReentry ? 'Reingreso' : isAnonymous ? 'Anónimo' : isInfoOnly ? 'Solo información' : 'Identificado'}</div>
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
            <button class="btn btn-primary btn-sm" onclick="reviewRequest('${doc.id}')">
              <i class="fas fa-eye"></i> Revisar Completa
            </button>
            ${!isInfoOnly && estado === 'pendiente' ? `
            <button class="btn btn-success btn-sm" onclick="acceptRequest('${doc.id}')">
              <i class="fas fa-check"></i> Aceptar
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
    console.error('Error al cargar solicitudes:', error);
    const requestsList = document.getElementById('requests-list');
    if (requestsList) {
      requestsList.innerHTML = `
        <div class="card">
          <p style="text-align: center; color: var(--danger-red);">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
            Error al cargar las solicitudes: ${error.message}
          </p>
          <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-primary" onclick="loadRequestsPanel(currentUserData)">
              <i class="fas fa-refresh"></i> Reintentar
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Función CORREGIDA para aceptar solicitudes
async function acceptRequest(requestId) {
  if (!confirm('¿Estás seguro de aceptar esta solicitud?')) return;
  
  try {
    showLoading(true);
    
    // VERIFICAR que el usuario actual existe
    if (!currentUserData || !currentUserData.uid) {
      throw new Error('Usuario no autenticado correctamente');
    }
    
    // ACTUALIZAR la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'aceptada',
      'clasificacion.fecha_aceptacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': currentUserData.uid,
      'clasificacion.profesional_nombre': currentUserData.nombre || 'Sin nombre'
    });
    
    // OBTENER los datos de la solicitud para crear paciente
    const solicitudDoc = await db.collection('solicitudes_ingreso').doc(requestId).get();
    const solicitudData = solicitudDoc.data();
    
    // CREAR registro de paciente solo si no es anónimo ni solo información
    if (!solicitudData.datos_personales?.anonimo && !solicitudData.datos_personales?.solo_informacion) {
      await createPatientRecord(requestId, solicitudData);
    }
    
    showNotification('Solicitud aceptada correctamente', 'success');
    
    // RECARGAR el panel
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    showNotification('Error al aceptar la solicitud: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}
// ================= CORRECCIÓN: ELIMINACIÓN COMPLETA DEL DASHBOARD =================

// Función CORREGIDA para mostrar panel profesional SIN Dashboard
function showProfessionalPanel(userData) {
  showModal('panel-modal');
  
  document.getElementById('user-name').textContent = userData.nombre;
  document.getElementById('user-role').textContent = getProfessionName(userData.profesion);
  document.getElementById('user-avatar').textContent = userData.nombre.substring(0, 2).toUpperCase();

  setupRoleBasedNavigation(userData);
  setupPanelNavigation(userData);
  
  // CAMBIO: Mostrar SOLICITUDES por defecto en lugar de Dashboard
  showPanel('requests', userData);
  
  // Marcar solicitudes como activo por defecto
  const requestsNav = document.querySelector('[data-panel="requests"]');
  if (requestsNav) {
    requestsNav.classList.add('active');
  }
  
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  startRealTimeListeners(userData);
}

// Función CORREGIDA para configurar navegación (SIN Dashboard)
function setupPanelNavigation(userData) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const panel = item.dataset.panel;
      
      // BLOQUEAR acceso a dashboard (eliminado)
      if (panel === 'dashboard') {
        showNotification('El Dashboard ha sido desactivado', 'info');
        return;
      }
      
      if (panel) {
        showPanel(panel, userData);
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

// Función CORREGIDA para mostrar paneles (SIN Dashboard)
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
      default:
        console.warn('Panel no implementado:', panelId);
        showNotification('Esta sección está en desarrollo', 'info');
    }
  } else {
    console.error('Panel no encontrado:', panelId + '-panel');
    showNotification('Error: Panel no encontrado', 'error');
  }
}

// ================= CORRECCIÓN: MÓDULO DE AGENDA =================

// Función CORREGIDA para cargar panel de agenda
async function loadCalendarPanel(userData) {
  const calendarPanel = document.getElementById('calendar-panel');
  if (!calendarPanel) {
    console.error('Panel de agenda no encontrado');
    return;
  }
  
  // VALIDAR datos de usuario
  if (!userData || !userData.uid) {
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Error: Usuario no válido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar datos de usuario
        </p>
      </div>
    `;
    return;
  }
  
  calendarPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Agenda</h1>
      <p class="panel-subtitle">Gestión de citas y horarios</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-primary" onclick="showNewAppointmentModal()">
          <i class="fas fa-calendar-plus"></i> Nueva Cita
        </button>
        <button class="btn btn-outline" onclick="showTodayAppointments()">
          <i class="fas fa-calendar-day"></i> Citas de Hoy
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando agenda...</div>
  `;
  
  try {
    console.log('Cargando agenda para usuario:', userData.uid);
    
    // Fechas para consulta (próximos 7 días)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // CONSULTA CORREGIDA - verificar que los campos existen
    let appointmentsQuery = db.collection('citas')
      .where('profesional_id', '==', userData.uid)
      .where('fecha', '>=', today)
      .where('fecha', '<=', nextWeek);
    
    // Ejecutar consulta con manejo de errores
    console.log('Ejecutando consulta de citas...');
    const appointmentsSnapshot = await appointmentsQuery
      .orderBy('fecha', 'asc')
      .get();
    
    console.log('Citas encontradas:', appointmentsSnapshot.size);
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Gestión de citas y horarios - ${userData.nombre}</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary" onclick="showNewAppointmentModal()">
            <i class="fas fa-calendar-plus"></i> Nueva Cita
          </button>
          <button class="btn btn-outline" onclick="showTodayAppointments()">
            <i class="fas fa-calendar-day"></i> Citas de Hoy
          </button>
          <button class="btn btn-outline" onclick="loadCalendarPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Actualizar
          </button>
        </div>
      </div>
      
      <div class="calendar-section">
        <h2>Próximas Citas (7 días)</h2>
    `;
    
    if (appointmentsSnapshot.empty) {
      html += `
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-calendar" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No tienes citas agendadas para los próximos 7 días.
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
      const appointmentsByDay = {};
      
      appointmentsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // VALIDAR datos de la cita antes de procesar
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
      
      // Mostrar citas agrupadas por día
      Object.keys(appointmentsByDay).sort().forEach(dateKey => {
        const appointments = appointmentsByDay[dateKey];
        
        html += `
          <div class="day-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--primary-blue); margin-bottom: 12px; border-bottom: 2px solid var(--gray-200); padding-bottom: 8px;">
              ${dateKey} (${appointments.length} citas)
            </h3>
            <div class="appointments-grid" style="display: grid; gap: 12px;">
        `;
        
        // Ordenar citas del día por hora
        appointments.sort((a, b) => a.fechaObj - b.fechaObj);
        
        appointments.forEach(appointment => {
          const estado = appointment.estado || 'programada';
          const borderColor = estado === 'completada' ? 'var(--success-green)' : 
                             estado === 'cancelada' ? 'var(--danger-red)' : 'var(--primary-blue)';
          
          html += `
            <div class="card appointment-card" style="border-left: 4px solid ${borderColor};">
              <div class="card-header">
                <div>
                  <h4>${appointment.paciente_nombre || 'Paciente sin nombre'}</h4>
                  <p><i class="fas fa-clock"></i> ${formatTimeOnly(appointment.fechaObj)}</p>
                  <p><i class="fas fa-user"></i> ${appointment.tipo_cita || 'Consulta general'}</p>
                </div>
                <div style="text-align: right;">
                  <span class="status-badge status-${estado}">
                    ${estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </span>
                </div>
              </div>
              ${appointment.observaciones ? `
              <div class="appointment-info" style="margin-top: 12px;">
                <div><strong>Observaciones:</strong> ${appointment.observaciones}</div>
              </div>
              ` : ''}
              <div style="margin-top: 12px;">
                ${estado === 'programada' ? `
                <button class="btn btn-success btn-sm" onclick="startAppointment('${appointment.id}')">
                  <i class="fas fa-play"></i> Iniciar
                </button>
                ` : ''}
                <button class="btn btn-outline btn-sm" onclick="editAppointment('${appointment.id}')">
                  <i class="fas fa-edit"></i> Editar
                </button>
                ${estado !== 'completada' ? `
                <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${appointment.id}')">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                ` : ''}
              </div>
            </div>
          `;
        });
        
        html += '</div></div>';
      });
    }
    
    html += '</div>';
    calendarPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar agenda:', error);
    calendarPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda</h1>
        <p class="panel-subtitle">Error al cargar la agenda</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar la agenda: ${error.message}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="loadCalendarPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    `;
  }
}

// Función CORREGIDA para mostrar citas de hoy
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
    }
    
  } catch (error) {
    console.error('Error al cargar citas de hoy:', error);
    showNotification('Error al cargar citas de hoy: ' + error.message, 'error');
  }
}

// ================= CORRECCIÓN: MÓDULO DE SEGUIMIENTOS =================

// Función CORREGIDA para cargar seguimientos
async function loadFollowupsPanel(userData) {
  const followupsPanel = document.getElementById('followups-panel');
  if (!followupsPanel) {
    console.error('Panel de seguimientos no encontrado');
    return;
  }
  
  // VALIDAR datos de usuario
  if (!userData || !userData.uid) {
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Error: Usuario no válido</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar datos de usuario
        </p>
      </div>
    `;
    return;
  }
  
  followupsPanel.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">Seguimientos</h1>
      <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
          <i class="fas fa-refresh"></i> Actualizar
        </button>
      </div>
    </div>
    <div class="loading"><div class="spinner"></div> Cargando seguimientos...</div>
  `;
  
  try {
    console.log('Cargando seguimientos para usuario:', userData.uid, 'CESFAM:', userData.cesfam_asignado);
    
    // CONSULTA CORREGIDA con validaciones
    let followupsQuery = db.collection('seguimientos');
    
    // Filtrar por profesional o por CESFAM según el rol
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
    
    if (followupsSnapshot.empty) {
      followupsPanel.innerHTML = `
        <div class="panel-header">
          <h1 class="panel-title">Seguimientos</h1>
          <p class="panel-subtitle">Historial de seguimientos de pacientes</p>
          <div style="margin-top: 16px;">
            <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
              <i class="fas fa-refresh"></i> Actualizar
            </button>
          </div>
        </div>
        <div class="card">
          <p style="text-align: center; color: var(--gray-600);">
            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block; opacity: 0.5;"></i>
            No hay seguimientos registrados.
            ${userData.profesion !== 'admin' ? '<br><small>Solo ves tus propios seguimientos</small>' : ''}
          </p>
        </div>
      `;
      return;
    }
    
    let html = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Historial de seguimientos de pacientes (${followupsSnapshot.size} registros)</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-outline" onclick="loadFollowupsPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Actualizar
          </button>
        </div>
      </div>
    `;
    
    followupsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // VALIDAR datos antes de renderizar
      const fechaCreacion = data.fecha_creacion ? 
        (data.fecha_creacion.toDate ? data.fecha_creacion.toDate() : new Date(data.fecha_creacion)) : 
        new Date();
      
      const proximaCita = data.proxima_cita ? 
        (data.proxima_cita.toDate ? data.proxima_cita.toDate() : new Date(data.proxima_cita)) : 
        null;
      
      html += `
        <div class="card followup-card" style="margin-bottom: 16px;">
          <div class="card-header">
            <div>
              <h4>${data.paciente_nombre || 'Paciente sin nombre'}</h4>
              <p><i class="fas fa-calendar"></i> ${formatDate(fechaCreacion)}</p>
              <p><i class="fas fa-user-md"></i> ${data.profesional_nombre || 'Sin profesional'}</p>
              <p><i class="fas fa-tags"></i> ${data.tipo_seguimiento || 'General'}</p>
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
            </div>
          </div>
          <div class="followup-content" style="margin: 16px 0;">
            <div><strong>Observaciones:</strong></div>
            <p style="margin: 8px 0; padding: 12px; background: var(--gray-50); border-radius: 8px;">
              ${data.observaciones || 'Sin observaciones registradas'}
            </p>
            ${proximaCita ? `
            <div style="margin-top: 12px;">
              <strong>Próxima cita:</strong> 
              <span style="color: var(--primary-blue);">${formatDate(proximaCita)}</span>
            </div>
            ` : ''}
            ${data.paciente_id ? `
            <div style="margin-top: 12px;">
              <button class="btn btn-outline btn-sm" onclick="viewPatientDetail('${data.paciente_id}')">
                <i class="fas fa-user"></i> Ver Paciente
              </button>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    followupsPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar seguimientos:', error);
    followupsPanel.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Seguimientos</h1>
        <p class="panel-subtitle">Error al cargar seguimientos</p>
      </div>
      <div class="card">
        <p style="text-align: center; color: var(--danger-red);">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar seguimientos: ${error.message}
        </p>
        <div style="text-align: center; margin-top: 16px;">
          <button class="btn btn-primary" onclick="loadFollowupsPanel(currentUserData)">
            <i class="fas fa-refresh"></i> Reintentar
          </button>
        </div>
      </div>
    `;
  }
}
// ================= FUNCIONES AUXILIARES CORREGIDAS =================

// Función CORREGIDA para formatear fechas
function formatDate(timestamp) {
  if (!timestamp) return 'Sin fecha';
  
  try {
    let date;
    if (timestamp.toDate) {
      // Firebase Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Fecha inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
}

// Función CORREGIDA para formatear solo fecha
function formatDateOnly(timestamp) {
  if (!timestamp) return 'Sin fecha';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Fecha inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
}

// Función CORREGIDA para formatear solo hora
function formatTimeOnly(timestamp) {
  if (!timestamp) return 'Sin hora';
  
  try {
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Hora inválida';
    }
    
    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }
    
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando hora:', error);
    return 'Error en hora';
  }
}

// Función CORREGIDA para validar RUT chileno
function validateRUT(rut) {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar RUT
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
  
  if (cleanRUT.length < 8 || cleanRUT.length > 9) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Verificar que el cuerpo sea numérico
  if (!/^\d+$/.test(body)) return false;
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
  
  return dv === calculatedDV;
}

// Función CORREGIDA para formatear RUT
function formatRUT(rut) {
  if (!rut) return '';
  
  // Limpiar RUT
  let cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRUT.length <= 1) return cleanRUT;
  
  // Separar cuerpo y dígito verificador
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Formatear cuerpo con puntos
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return formattedBody + '-' + dv;
}

// Función CORREGIDA para validar email
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Función CORREGIDA para formatear teléfono
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Limpiar número
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Si no empieza con +56, agregarlo
  if (cleanPhone.length > 0 && !cleanPhone.startsWith('+56') && !cleanPhone.startsWith('56')) {
    if (cleanPhone.startsWith('9')) {
      cleanPhone = '+56 9 ' + cleanPhone.substring(1);
    } else {
      cleanPhone = '+56 ' + cleanPhone;
    }
  } else if (cleanPhone.startsWith('56') && !cleanPhone.startsWith('+56')) {
    cleanPhone = '+' + cleanPhone;
  }
  
  // Formatear con espacios
  if (cleanPhone.startsWith('+56')) {
    const number = cleanPhone.substring(3);
    if (number.length > 1) {
      cleanPhone = '+56 ' + number.substring(0, 1) + ' ' + number.substring(1);
    }
  }
  
  return cleanPhone;
}

// Función CORREGIDA para obtener nombre de profesión
function getProfessionName(profession) {
  const professions = {
    'asistente_social': 'Asistente Social',
    'medico': 'Médico',
    'psicologo': 'Psicólogo',
    'terapeuta': 'Terapeuta Ocupacional',
    'coordinador': 'Coordinador',
    'admin': 'Administrador'
  };
  
  return professions[profession] || 'Profesional';
}

// Función CORREGIDA para calcular prioridad automática
function calculatePriority(data) {
  if (!data) return 'baja';
  
  let score = 0;
  
  // Edad (menores y adultos mayores = mayor prioridad)
  if (data.edad) {
    if (data.edad < 18 || data.edad > 65) score += 2;
  }
  
  // Sustancias de alto riesgo
  const highRiskSubstances = ['heroína', 'cocaína', 'pasta_base', 'fentanilo'];
  if (data.sustancias && Array.isArray(data.sustancias)) {
    const hasHighRisk = data.sustancias.some(s => highRiskSubstances.includes(s));
    if (hasHighRisk) score += 3;
  }
  
  // Tiempo de consumo
  if (data.tiempoConsumo) {
    if (data.tiempoConsumo > 60) score += 2; // Más de 5 años
  }
  
  // Urgencia declarada
  if (data.urgencia === 'alta') score += 3;
  if (data.urgencia === 'media') score += 1;
  
  // Motivación baja
  if (data.motivacion && data.motivacion < 5) score += 1;
  
  // Tratamiento previo fallido
  if (data.tratamientoPrevio === 'si') score += 1;
  
  // Palabras clave en descripción
  if (data.razon && typeof data.razon === 'string') {
    const urgentKeywords = ['urgente', 'emergencia', 'crisis', 'suicidio', 'violencia'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      data.razon.toLowerCase().includes(keyword)
    );
    if (hasUrgentKeywords) score += 3;
  }
  
  // Determinar prioridad basada en puntaje
  if (score >= 7) return 'critica';
  if (score >= 4) return 'alta';
  if (score >= 2) return 'media';
  return 'baja';
}

// ================= MANEJO DE ERRORES GLOBAL =================

// Función CORREGIDA para manejo de errores de Firebase
function handleFirebaseError(error, context = '') {
  console.error('Firebase Error:', error, 'Context:', context);
  
  let userMessage = 'Error en el sistema';
  
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        userMessage = 'No tienes permisos para realizar esta acción';
        break;
      case 'unavailable':
        userMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
        break;
      case 'deadline-exceeded':
        userMessage = 'Tiempo de espera agotado. Verifica tu conexión.';
        break;
      case 'resource-exhausted':
        userMessage = 'Límite de consultas excedido. Intenta más tarde.';
        break;
      case 'unauthenticated':
        userMessage = 'Sesión expirada. Inicia sesión nuevamente.';
        break;
      case 'invalid-argument':
        userMessage = 'Datos inválidos en la consulta';
        break;
      default:
        userMessage = `Error: ${error.message}`;
    }
  } else if (error.message) {
    userMessage = error.message;
  }
  
  showNotification(userMessage, 'error');
  return userMessage;
}

// Función CORREGIDA para validaciones de formulario
function validateFormData(data, requiredFields = []) {
  const errors = [];
  
  // Verificar campos requeridos
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`El campo ${field} es requerido`);
    }
  });
  
  // Validaciones específicas
  if (data.rut && !validateRUT(data.rut)) {
    errors.push('El RUT ingresado no es válido');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('El email ingresado no es válido');
  }
  
  if (data.edad && (isNaN(data.edad) || data.edad < 12 || data.edad > 120)) {
    errors.push('La edad debe estar entre 12 y 120 años');
  }
  
  if (data.telefono && data.telefono.length < 8) {
    errors.push('El teléfono debe tener al menos 8 dígitos');
  }
  
  return errors;
}

// ================= FUNCIONES DE NOTIFICACIONES MEJORADAS =================

// Variable global para almacenar notificaciones activas
window.activeNotifications = window.activeNotifications || [];

// Función CORREGIDA para mostrar notificaciones
function showNotification(message, type = 'info', duration = 5000) {
  if (!message) return;
  
  // Limpiar notificaciones anteriores del mismo tipo
  window.activeNotifications.forEach(notification => {
    if (notification.type === type && notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
  });
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = {
    'success': 'fas fa-check-circle',
    'error': 'fas fa-exclamation-circle',
    'warning': 'fas fa-exclamation-triangle',
    'info': 'fas fa-info-circle'
  }[type] || 'fas fa-info-circle';
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Estilos en línea para asegurar que se vean
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
    ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
    ${type === 'warning' ? 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
    ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
  `;
  
  notification.querySelector('.notification-content').style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  notification.querySelector('.notification-close').style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    margin-left: auto;
    opacity: 0.7;
  `;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Almacenar referencia
  const notificationObj = { element: notification, type: type };
  window.activeNotifications.push(notificationObj);
  
  // Auto-remover después del tiempo especificado
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
          // Remover de la lista activa
          const index = window.activeNotifications.indexOf(notificationObj);
          if (index > -1) {
            window.activeNotifications.splice(index, 1);
          }
        }, 300);
      }
    }, duration);
  }
}

// Función CORREGIDA para mostrar/ocultar loading
function showLoading(show = true) {
  let loadingOverlay = document.getElementById('loading-overlay');
  
  if (show) {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Cargando...</p>
        </div>
      `;
      
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      
      loadingOverlay.querySelector('.loading-content').style.cssText = `
        background: white;
        padding: 32px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      
      document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'flex';
  } else {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// ================= FUNCIÓN DE INICIALIZACIÓN FINAL =================

// Función CORREGIDA de inicialización completa
function initializeApp() {
  console.log('🚀 Inicializando aplicación SENDA...');
  
  try {
    // Verificar que Firebase esté cargado
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase no está cargado');
    }
    
    // Verificar configuración de Firebase
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    if (!auth) {
      throw new Error('Auth no está inicializado');
    }
    
    // Cargar datos de CESFAM
    loadCesfamData();
    
    // Configurar event listeners
    initializeEventListeners();
    
    // Configurar validaciones de formulario
    setupFormValidation();
    
    // Configurar controles de modal
    setupModalControls();
    
    // Configurar funcionalidad de tabs
    setupTabFunctionality();
    
    // Configurar formulario multi-paso
    setupMultiStepForm();
    
    // Cargar borrador si existe
    loadDraftIfExists();
    
    console.log('✅ Aplicación SENDA inicializada correctamente');
    
    // Mostrar notificación de bienvenida
    showNotification('Sistema SENDA Puente Alto cargado correctamente', 'success', 3000);
    
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error);
    showNotification('Error al cargar el sistema: ' + error.message, 'error', 10000);
  }
}

// ================= LISTENER FINAL DE CARGA =================

// Asegurar que todo se ejecute cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Listener de estado de conexión
window.addEventListener('online', () => {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', () => {
  showNotification('Sin conexión a internet. Algunas funciones pueden no estar disponibles.', 'warning', 8000);
});

// Limpiar recursos al cerrar la ventana
window.addEventListener('beforeunload', () => {
  // Limpiar listeners de Firebase
  if (window.sendaUnsubscribers) {
    window.sendaUnsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error al limpiar listener:', error);
      }
    });
  }
  
  // Limpiar notificaciones activas
  if (window.activeNotifications) {
    window.activeNotifications.forEach(notification => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
    });
  }
});

console.log('📄 app.js cargado completamente - Sistema SENDA Puente Alto v1.0');

// FIN DEL ARCHIVO app.js
