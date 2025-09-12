// ================= PARTE 6: PANEL DE AGENDA 2025 Y GESTIÓN DE CITAS =================

async function loadCalendarPanel(userData) {
  console.log('Loading calendar panel for:', userData.nombre);
  
  const calendarContainer = document.getElementById('calendar-panel');
  if (!calendarContainer) return;
  
  // Agregar HTML del panel de agenda si no existe
  if (!document.getElementById('professionals-list')) {
    calendarContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Agenda 2025</h1>
        <p class="panel-subtitle">Gestiona citas y horarios de profesionales - Año 2025 en adelante</p>
      </div>
      
      <div class="calendar-controls">
        <div class="calendar-navigation">
          <button class="btn btn-outline" id="prev-month">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span id="current-month-year">Enero 2025</span>
          <button class="btn btn-outline" id="next-month">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="calendar-view-controls">
          <button class="btn btn-secondary btn-sm" id="go-to-today">Ir a Hoy</button>
          <button class="btn btn-primary" id="new-appointment">
            <i class="fas fa-plus"></i> Nueva Cita
          </button>
        </div>
      </div>
      
      <div class="calendar-layout">
        <div class="professionals-sidebar">
          <h3>Profesionales Activos</h3>
          <div id="professionals-list">
            <!-- Lista de profesionales se cargará aquí -->
          </div>
        </div>
        
        <div class="calendar-main">
          <div id="calendar-grid">
            <!-- Calendario se generará aquí -->
          </div>
        </div>
      </div>
      
      <div class="appointments-summary">
        <h3>Resumen de Citas</h3>
        <div class="appointments-tabs">
          <button class="tab-btn active" data-period="today">Hoy</button>
          <button class="tab-btn" data-period="week">Esta Semana</button>
          <button class="tab-btn" data-period="month">Este Mes</button>
        </div>
        <div id="appointments-summary-list">
          <!-- Citas del período seleccionado se mostrarán aquí -->
        </div>
      </div>
    `;
  }
  
  // Asegurar que iniciamos en 2025
  currentCalendarDate = new Date(2025, 0, 1); // Enero 1, 2025
  
  setupCalendarEvents();
  await loadProfessionalsList();
  await loadCalendarView();
  await loadAppointmentsSummary('today');
}

async function loadProfessionalsList() {
  try {
    const professionalsContainer = document.getElementById('professionals-list');
    if (!professionalsContainer) return;
    
    professionalsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // CONSULTA CORREGIDA para obtener profesionales vinculados
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    let html = '';
    if (professionalsSnapshot.empty) {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay profesionales registrados</p>';
    } else {
      professionalsSnapshot.forEach(doc => {
        const data = doc.data();
        // Filtrar solo profesionales clínicos
        if (['medico', 'psicologo', 'terapeuta', 'asistente_social'].includes(data.profesion)) {
          html += `
            <div class="professional-item ${selectedProfessional === doc.id ? 'selected' : ''}" 
                 data-professional-id="${doc.id}" onclick="selectProfessional('${doc.id}')">
              <div class="professional-avatar">
                ${data.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div class="professional-info">
                <div class="professional-name">${data.nombre}</div>
                <div class="professional-role">${getProfessionName(data.profesion)}</div>
                <div class="professional-availability">
                  <span class="availability-dot available"></span>
                  Disponible
                </div>
              </div>
            </div>
          `;
        }
      });
    }
    
    if (html === '') {
      html = '<p style="text-align: center; color: var(--gray-600);">No hay profesionales clínicos disponibles</p>';
    }
    
    professionalsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading professionals:', error);
    document.getElementById('professionals-list').innerHTML = '<p>Error al cargar profesionales: ' + error.message + '</p>';
  }
}

function selectProfessional(professionalId) {
  selectedProfessional = professionalId;
  
  // Actualizar UI
  document.querySelectorAll('.professional-item').forEach(item => {
    item.classList.remove('selected');
  });
  const selectedItem = document.querySelector(`[data-professional-id="${professionalId}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
  }
  
  // Recargar calendario con las citas del profesional seleccionado
  loadCalendarView();
  showNotification(`Profesional seleccionado. Mostrando agenda.`, 'info', 2000);
}

function setupCalendarEvents() {
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
  const newAppointment = document.getElementById('new-appointment');
  const goToToday = document.getElementById('go-to-today');
  
  if (prevMonth) {
    prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      // No permitir ir antes de 2025
      if (currentCalendarDate.getFullYear() < 2025) {
        currentCalendarDate = new Date(2025, 0, 1);
        showNotification('La agenda está disponible desde enero 2025 en adelante', 'warning');
      }
      loadCalendarView();
    });
  }
  
  if (nextMonth) {
    nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      loadCalendarView();
    });
  }
  
  if (goToToday) {
    goToToday.addEventListener('click', () => {
      const today = new Date();
      // Si estamos antes de 2025, ir a enero 2025
      if (today.getFullYear() < 2025) {
        currentCalendarDate = new Date(2025, 0, 1);
        showNotification('Navegando a enero 2025 (inicio de agenda disponible)', 'info');
      } else {
        currentCalendarDate = new Date(today);
      }
      loadCalendarView();
    });
  }
  
  if (newAppointment) {
    newAppointment.addEventListener('click', () => {
      showNewAppointmentModal();
    });
  }
  
  // Configurar tabs de resumen
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadAppointmentsSummary(this.dataset.period);
    });
  });
}

async function loadCalendarView() {
  try {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('current-month-year');
    
    if (!calendarGrid || !monthYearSpan) return;
    
    // Actualizar título del mes
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    monthYearSpan.textContent = `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Generar calendario
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Obtener citas del mes si hay profesional seleccionado
    let appointments = {};
    if (selectedProfessional) {
      try {
        const appointmentsSnapshot = await db.collection('citas')
          .where('profesional_id', '==', selectedProfessional)
          .where('fecha', '>=', firstDay)
          .where('fecha', '<=', lastDay)
          .get();
        
        appointmentsSnapshot.forEach(doc => {
          const data = doc.data();
          const date = data.fecha.toDate();
          const dateKey = date.toDateString();
          if (!appointments[dateKey]) appointments[dateKey] = [];
          appointments[dateKey].push({...data, id: doc.id});
        });
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    }
    
    let html = `
      <div class="calendar-header">
        <div class="calendar-day-header">Dom</div>
        <div class="calendar-day-header">Lun</div>
        <div class="calendar-day-header">Mar</div>
        <div class="calendar-day-header">Mié</div>
        <div class="calendar-day-header">Jue</div>
        <div class="calendar-day-header">Vie</div>
        <div class="calendar-day-header">Sáb</div>
      </div>
      <div class="calendar-days">
    `;
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === currentCalendarDate.getMonth();
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const dateKey = currentDate.toDateString();
      const dayAppointments = appointments[dateKey] || [];
      const isPast = currentDate < new Date().setHours(0,0,0,0);
      
      html += `
        <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}"
             onclick="selectCalendarDay('${currentDate.toISOString()}')">
          <div class="day-number">${currentDate.getDate()}</div>
          <div class="appointments-container">
            ${dayAppointments.slice(0, 3).map(apt => `
              <div class="appointment-item" 
                   style="background: var(--primary-blue); color: white; font-size: 10px; padding: 2px 4px; margin: 1px 0; border-radius: 2px; cursor: pointer;"
                   onclick="event.stopPropagation(); viewAppointment('${apt.id}')">
                ${new Date(apt.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
              </div>
            `).join('')}
            ${dayAppointments.length > 3 ? `<div class="more-appointments">+${dayAppointments.length - 3} más</div>` : ''}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    calendarGrid.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading calendar view:', error);
    document.getElementById('calendar-grid').innerHTML = '<p>Error al cargar el calendario</p>';
  }
}

function selectCalendarDay(dateISO) {
  if (!selectedProfessional) {
    showNotification('Selecciona un profesional primero para ver su agenda', 'warning');
    return;
  }
  
  const selectedDate = new Date(dateISO);
  
  // Verificar que no sea una fecha anterior a 2025
  if (selectedDate.getFullYear() < 2025) {
    showNotification('No se pueden agendar citas antes del año 2025', 'warning');
    return;
  }
  
  showDayAppointmentsModal(selectedDate, selectedProfessional);
}

async function loadAppointmentsSummary(period) {
  try {
    const summaryContainer = document.getElementById('appointments-summary-list');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }
    
    // Si estamos antes de 2025, mostrar desde 2025
    if (startDate.getFullYear() < 2025) {
      startDate = new Date(2025, 0, 1);
      if (period === 'today') {
        endDate = new Date(2025, 0, 1, 23, 59, 59);
      }
    }
    
    let query = db.collection('citas')
      .where('fecha', '>=', startDate)
      .where('fecha', '<=', endDate)
      .orderBy('fecha', 'asc');
    
    if (selectedProfessional) {
      query = query.where('profesional_id', '==', selectedProfessional);
    }
    
    const appointmentsSnapshot = await query.get();
    
    if (appointmentsSnapshot.empty) {
      summaryContainer.innerHTML = `<p style="color: var(--gray-600); text-align: center;">No hay citas programadas para ${period === 'today' ? 'hoy' : period === 'week' ? 'esta semana' : 'este mes'}</p>`;
      return;
    }
    
    let html = '';
    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener datos del profesional
      const professionalDoc = await db.collection('profesionales').doc(data.profesional_id).get();
      const professionalData = professionalDoc.exists ? professionalDoc.data() : null;
      
      // Obtener datos del paciente
      const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
      const patientData = patientDoc.exists ? patientDoc.data() : null;
      
      const appointmentDate = data.fecha.toDate();
      const isToday = appointmentDate.toDateString() === new Date().toDateString();
      
      html += `
        <div class="appointment-summary-item ${isToday ? 'today-appointment' : ''}">
          <div class="appointment-time">
            <div class="time">${appointmentDate.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</div>
            <div class="date">${appointmentDate.toLocaleDateString('es-CL')}</div>
          </div>
          <div class="appointment-details">
            <div class="appointment-patient">${patientData?.datos_personales?.nombre_completo || 'Paciente sin nombre'}</div>
            <div class="appointment-professional">${professionalData?.nombre || 'Profesional'} - ${getProfessionName(professionalData?.profesion)}</div>
            <div class="appointment-type">${data.tipo_cita || 'Consulta general'}</div>
            <div class="appointment-status">
              <span class="status-badge status-${data.estado || 'programado'}">${data.estado || 'Programado'}</span>
            </div>
          </div>
          <div class="appointment-actions">
            <button class="btn btn-sm btn-outline" onclick="viewAppointment('${doc.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editAppointment('${doc.id}')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    summaryContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading appointments summary:', error);
    document.getElementById('appointments-summary-list').innerHTML = '<p>Error al cargar el resumen de citas</p>';
  }
}

function showAssignmentModal(requestId) {
  const modalHTML = `
    <div class="modal-overlay" id="assignment-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('assignment-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Asignar Solicitud a Profesional</h2>
        
        <form id="assignment-form">
          <div class="form-group">
            <label class="form-label">Seleccionar Profesional *</label>
            <select class="form-select" id="assign-professional" required>
              <option value="">Seleccionar profesional...</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Notas de asignación</label>
            <textarea class="form-textarea" id="assignment-notes" placeholder="Notas adicionales sobre la asignación..."></textarea>
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-user-check"></i> Asignar
            </button>
            <button type="button" class="btn btn-outline" onclick="closeModal('assignment-modal')">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('assignment-modal').style.display = 'flex';
  
  // Cargar lista de profesionales
  loadProfessionalsForAssignment();
  
  // Manejar envío del formulario
  document.getElementById('assignment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    processAssignment(requestId);
  });
}

async function loadProfessionalsForAssignment() {
  try {
    const professionalSelect = document.getElementById('assign-professional');
    if (!professionalSelect) return;
    
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .where('profesion', 'in', ['medico', 'psicologo', 'terapeuta', 'asistente_social'])
      .get();
    
    professionalSelect.innerHTML = '<option value="">Seleccionar profesional...</option>';
    professionalsSnapshot.forEach(doc => {
      const data = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${data.nombre} - ${getProfessionName(data.profesion)}`;
      professionalSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading professionals for assignment:', error);
  }
}

async function processAssignment(requestId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('assign-professional').value;
    const notes = document.getElementById('assignment-notes').value;
    
    if (!professionalId) {
      showNotification('Por favor selecciona un profesional', 'error');
      return;
    }
    
    // Actualizar la solicitud
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'asignada',
      'clasificacion.fecha_asignacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.profesional_asignado': professionalId,
      'clasificacion.notas_asignacion': notes,
      'clasificacion.asignado_por': currentUserData.uid
    });
    
    showNotification('Solicitud asignada correctamente', 'success');
    closeModal('assignment-modal');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error processing assignment:', error);
    showNotification('Error al asignar solicitud', 'error');
  } finally {
    showLoading(false);
  }
}
