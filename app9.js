// ================= PARTE 9: FUNCIONES AUXILIARES Y UTILIDADES FINALES =================

// Función para mostrar modal de asignación de profesionales
async function showAssignmentModal(requestId) {
  try {
    // Obtener profesionales disponibles
    const professionalsSnapshot = await db.collection('profesionales')
      .where('configuracion_sistema.activo', '==', true)
      .get();
    
    const modalHTML = `
      <div class="modal-overlay" id="assignment-modal">
        <div class="modal">
          <button class="modal-close" onclick="closeModal('assignment-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Asignar Profesional</h2>
          
          <form id="assignment-form">
            <div class="form-group">
              <label class="form-label">Seleccionar profesional *</label>
              <select class="form-select" id="assigned-professional" required>
                <option value="">Seleccionar profesional...</option>
                ${professionalsSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return `<option value="${doc.id}">${data.nombre} - ${getProfessionName(data.profesion)}</option>`;
                }).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Prioridad de asignación</label>
              <select class="form-select" id="assignment-priority">
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Notas de asignación</label>
              <textarea class="form-textarea" id="assignment-notes" 
                        placeholder="Instrucciones especiales o comentarios..."></textarea>
            </div>
            
            <div class="modal-actions" style="margin-top: 24px;">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> Asignar
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
    
    document.getElementById('assignment-form').addEventListener('submit', function(e) {
      e.preventDefault();
      processAssignment(requestId);
    });
    
  } catch (error) {
    console.error('Error showing assignment modal:', error);
    showNotification('Error al cargar modal de asignación', 'error');
  }
}

async function processAssignment(requestId) {
  try {
    showLoading(true);
    
    const professionalId = document.getElementById('assigned-professional').value;
    const priority = document.getElementById('assignment-priority').value;
    const notes = document.getElementById('assignment-notes').value;
    
    if (!professionalId) {
      showNotification('Selecciona un profesional', 'error');
      return;
    }
    
    // Actualizar solicitud con asignación
    await db.collection('solicitudes_ingreso').doc(requestId).update({
      'clasificacion.estado': 'asignada',
      'clasificacion.profesional_asignado': professionalId,
      'clasificacion.prioridad_asignacion': priority,
      'clasificacion.fecha_asignacion': firebase.firestore.FieldValue.serverTimestamp(),
      'clasificacion.notas_asignacion': notes,
      'clasificacion.asignado_por': currentUserData.uid
    });
    
    // Crear notificación para el profesional asignado
    await db.collection('notificaciones').add({
      destinatario: professionalId,
      tipo: 'nueva_asignacion',
      titulo: 'Nueva solicitud asignada',
      mensaje: `Se te ha asignado una nueva solicitud con prioridad ${priority}`,
      solicitud_id: requestId,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      leida: false
    });
    
    showNotification('Solicitud asignada correctamente', 'success');
    closeModal('assignment-modal');
    loadRequestsPanel(currentUserData);
    
  } catch (error) {
    console.error('Error processing assignment:', error);
    showNotification('Error al asignar la solicitud', 'error');
  } finally {
    showLoading(false);
  }
}

// Función para mostrar citas del día
async function showDayAppointmentsModal(selectedDate, professionalId) {
  try {
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
    
    const appointmentsSnapshot = await db.collection('citas')
      .where('profesional_id', '==', professionalId)
      .where('fecha', '>=', startOfDay)
      .where('fecha', '<=', endOfDay)
      .orderBy('fecha', 'asc')
      .get();
    
    const modalHTML = `
      <div class="modal-overlay" id="day-appointments-modal">
        <div class="modal large-modal">
          <button class="modal-close" onclick="closeModal('day-appointments-modal')">
            <i class="fas fa-times"></i>
          </button>
          <h2>Citas del ${selectedDate.toLocaleDateString('es-CL')}</h2>
          
          <div class="day-appointments-list">
            ${appointmentsSnapshot.empty ? 
              '<p style="text-align: center; color: var(--gray-600);">No hay citas programadas para este día</p>' :
              appointmentsSnapshot.docs.map(doc => {
                const data = doc.data();
                return `
                  <div class="appointment-item-detail">
                    <div class="appointment-time">
                      ${new Date(data.fecha.toDate()).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div class="appointment-info">
                      <h4>Paciente: ${data.paciente_nombre || 'Cargando...'}</h4>
                      <p>Tipo: ${data.tipo_cita || 'Consulta general'}</p>
                      <p>Modalidad: ${data.modalidad || 'Presencial'}</p>
                      <p>Duración: ${data.duracion_minutos || 60} minutos</p>
                      ${data.notas_previas ? `<p>Notas: ${data.notas_previas}</p>` : ''}
                    </div>
                    <div class="appointment-actions">
                      <button class="btn btn-sm btn-success" onclick="markAppointmentCompleted('${doc.id}')">
                        <i class="fas fa-check"></i> Completar
                      </button>
                      <button class="btn btn-sm btn-warning" onclick="rescheduleAppointment('${doc.id}')">
                        <i class="fas fa-clock"></i> Reagendar
                      </button>
                      <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${doc.id}')">
                        <i class="fas fa-times"></i> Cancelar
                      </button>
                    </div>
                  </div>
                `;
              }).join('')
            }
          </div>
          
          <div class="modal-actions" style="margin-top: 24px;">
            <button class="btn btn-primary" onclick="showNewAppointmentForDay('${selectedDate.toISOString()}', '${professionalId}')">
              <i class="fas fa-plus"></i> Nueva Cita Este Día
            </button>
            <button class="btn btn-outline" onclick="closeModal('day-appointments-modal')">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('day-appointments-modal').style.display = 'flex';
    
    // Cargar nombres de pacientes
    loadPatientNamesForAppointments(appointmentsSnapshot.docs);
    
  } catch (error) {
    console.error('Error showing day appointments:', error);
    showNotification('Error al cargar citas del día', 'error');
  }
}

async function loadPatientNamesForAppointments(appointmentDocs) {
  for (const doc of appointmentDocs) {
    const data = doc.data();
    if (data.paciente_id) {
      try {
        const patientDoc = await db.collection('pacientes').doc(data.paciente_id).get();
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          const appointmentElement = document.querySelector(`[data-appointment-id="${doc.id}"] .appointment-info h4`);
          if (appointmentElement) {
            appointmentElement.textContent = `Paciente: ${patientData.datos_personales?.nombre_completo || 'Sin nombre'}`;
          }
        }
      } catch (error) {
        console.error('Error loading patient name:', error);
      }
    }
  }
}

// Funciones para manejar citas
async function markAppointmentCompleted(appointmentId) {
  if (!confirm('¿Marcar esta cita como completada?')) return;
  
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'completada',
      fecha_completada: firebase.firestore.FieldValue.serverTimestamp(),
      completada_por: currentUserData.uid
    });
    
    showNotification('Cita marcada como completada', 'success');
    closeModal('day-appointments-modal');
    loadCalendarView();
    
  } catch (error) {
    console.error('Error marking appointment as completed:', error);
    showNotification('Error al completar la cita', 'error');
  }
}

async function cancelAppointment(appointmentId) {
  if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
  
  try {
    await db.collection('citas').doc(appointmentId).update({
      estado: 'cancelada',
      fecha_cancelacion: firebase.firestore.FieldValue.serverTimestamp(),
      cancelada_por: currentUserData.uid
    });
    
    showNotification('Cita cancelada correctamente', 'success');
    closeModal('day-appointments-modal');
    loadCalendarView();
    
  } catch (error) {
    console.error('Error canceling appointment:', error);
    showNotification('Error al cancelar la cita', 'error');
  }
}

// Función para programar cita directamente para un paciente
function scheduleAppointment(patientId) {
  showNewAppointmentModal();
  
  // Pre-seleccionar el paciente
  setTimeout(() => {
    const patientSelect = document.getElementById('appointment-patient');
    if (patientSelect) {
      patientSelect.value = patientId;
    }
  }, 500);
}

// Función para generar reporte de paciente individual
async function generatePatientReport(patientId) {
  try {
    showLoading(true);
    
    const patientDoc = await db.collection('pacientes').doc(patientId).get();
    if (!patientDoc.exists) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }
    
    const patientData = patientDoc.data();
    
    // Obtener citas del paciente
    const appointmentsSnapshot = await db.collection('citas')
      .where('paciente_id', '==', patientId)
      .orderBy('fecha', 'desc')
      .get();
    
    const reportContent = generatePatientReportHTML(patientData, appointmentsSnapshot.docs);
    showPatientReportModal(reportContent);
    
  } catch (error) {
    console.error('Error generating patient report:', error);
    showNotification('Error al generar reporte del paciente', 'error');
  } finally {
    showLoading(false);
  }
}

function generatePatientReportHTML(patientData, appointments) {
  return `
    <div class="patient-report">
      <div class="report-header">
        <h1>Reporte de Paciente</h1>
        <h2>${patientData.datos_personales?.nombre_completo || 'Sin nombre'}</h2>
        <p>RUT: ${patientData.datos_personales?.rut || 'Sin RUT'}</p>
        <p>Generado el: ${new Date().toLocaleDateString('es-CL')}</p>
      </div>
      
      <div class="report-section">
        <h3>Información Personal</h3>
        <table class="report-table">
          <tr><td><strong>Edad:</strong></td><td>${patientData.datos_personales?.edad || 'N/A'} años</td></tr>
          <tr><td><strong>Región:</strong></td><td>${patientData.datos_personales?.region || 'N/A'}</td></tr>
          <tr><td><strong>Comuna:</strong></td><td>${patientData.datos_personales?.comuna || 'N/A'}</td></tr>
          <tr><td><strong>Dirección:</strong></td><td>${patientData.datos_personales?.direccion || 'N/A'}</td></tr>
          <tr><td><strong>Teléfono:</strong></td><td>${patientData.contacto?.telefono || 'N/A'}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${patientData.contacto?.email || 'N/A'}</td></tr>
        </table>
      </div>
      
      <div class="report-section">
        <h3>Estado del Tratamiento</h3>
        <table class="report-table">
          <tr><td><strong>Estado:</strong></td><td>${patientData.estado_actual?.activo ? 'Activo' : 'Inactivo'}</td></tr>
          <tr><td><strong>Programa:</strong></td><td>${patientData.estado_actual?.programa || 'N/A'}</td></tr>
          <tr><td><strong>Fecha de ingreso:</strong></td><td>${formatDate(patientData.estado_actual?.fecha_ingreso)}</td></tr>
        </table>
      </div>
      
      ${patientData.historial_clinico && patientData.historial_clinico.length > 0 ? `
      <div class="report-section">
        <h3>Historial Clínico</h3>
        ${patientData.historial_clinico.map(entry => `
          <div class="history-entry">
            <h4>${entry.tipo?.replace('_', ' ').toUpperCase()} - ${formatDate(entry.fecha)}</h4>
            <p>${entry.observaciones || entry.notas_seguimiento || 'Sin observaciones'}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${appointments.length > 0 ? `
      <div class="report-section">
        <h3>Historial de Citas</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Modalidad</th>
            </tr>
          </thead>
          <tbody>
            ${appointments.map(doc => {
              const data = doc.data();
              return `
                <tr>
                  <td>${formatDate(data.fecha)}</td>
                  <td>${data.tipo_cita || 'Consulta'}</td>
                  <td>${data.estado || 'Programada'}</td>
                  <td>${data.modalidad || 'Presencial'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    </div>
  `;
}

function showPatientReportModal(reportContent) {
  const modalHTML = `
    <div class="modal-overlay" id="patient-report-preview-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('patient-report-preview-modal')">
          <i class="fas fa-times"></i>
        </button>
        <div class="modal-header">
          <h2>Vista previa del reporte</h2>
          <button class="btn btn-primary" onclick="printPatientReport()">
            <i class="fas fa-print"></i> Imprimir
          </button>
        </div>
        
        <div class="report-preview" id="report-content">
          ${reportContent}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('patient-report-preview-modal').style.display = 'flex';
}

function printPatientReport() {
  const reportContent = document.getElementById('report-content').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de Paciente</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; }
          .report-table th { background-color: #f5f5f5; }
          .report-section { margin: 20px 0; }
          .history-entry { margin: 10px 0; padding: 10px; border-left: 3px solid #2563eb; }
        </style>
      </head>
      <body>
        ${reportContent}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Función para obtener ubicación del usuario
function getCurrentLocation() {
  if (!navigator.geolocation) {
    showNotification('La geolocalización no está soportada en este navegador', 'error');
    return;
  }
  
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    async function(position) {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Aquí podrías hacer una llamada a una API de geocodificación inversa
        // Por simplicidad, solo mostramos las coordenadas
        showNotification(`Ubicación obtenida: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
        
        // Buscar centros cercanos (simulado)
        await loadNearbyClinics(lat, lng);
        
      } catch (error) {
        console.error('Error processing location:', error);
        showNotification('Error al procesar la ubicación', 'error');
      } finally {
        showLoading(false);
      }
    },
    function(error) {
      showLoading(false);
      let errorMessage = 'Error al obtener la ubicación';
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de geolocalización denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Información de ubicación no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado para obtener la ubicación';
          break;
      }
      
      showNotification(errorMessage, 'error');
    }
  );
}

// Función para cargar centros cercanos
async function loadNearbyClinics(lat = null, lng = null) {
  try {
    const centersList = document.getElementById('centers-list');
    if (!centersList) return;
    
    // Simular centros SENDA (en un caso real, esto vendría de una base de datos)
    const centers = [
      {
        name: 'Centro SENDA Santiago Centro',
        address: 'Moneda 1180, Santiago, Región Metropolitana',
        phone: '+56 2 2690 4000',
        type: 'Ambulatorio',
        distance: lat && lng ? '2.5 km' : null
      },
      {
        name: 'Centro SENDA Maipú',
        address: 'Av. Pajaritos 3201, Maipú, Región Metropolitana',
        phone: '+56 2 2690 4100',
        type: 'Residencial',
        distance: lat && lng ? '8.3 km' : null
      },
      {
        name: 'Centro SENDA Las Condes',
        address: 'Av. Apoquindo 4499, Las Condes, Región Metropolitana',
        phone: '+56 2 2690 4200',
        type: 'Ambulatorio',
        distance: lat && lng ? '12.1 km' : null
      }
    ];
    
    let html = '';
    centers.forEach(center => {
      html += `
        <div class="center-card">
          <h3>${center.name}</h3>
          <p><i class="fas fa-map-marker-alt"></i> ${center.address}</p>
          <p><i class="fas fa-phone"></i> ${center.phone}</p>
          <p><i class="fas fa-hospital"></i> Tipo: ${center.type}</p>
          ${center.distance ? `<p><i class="fas fa-route"></i> Distancia: ${center.distance}</p>` : ''}
          <div class="center-actions">
            <button class="btn btn-sm btn-primary" onclick="selectCenter('${center.name}')">
              <i class="fas fa-check"></i> Seleccionar
            </button>
          </div>
        </div>
      `;
    });
    
    centersList.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading centers:', error);
    const centersList = document.getElementById('centers-list');
    if (centersList) {
      centersList.innerHTML = '<p>Error al cargar centros: ' + error.message + '</p>';
    }
  }
}

function selectCenter(centerName) {
  const centerInput = document.getElementById('centro-preferencia');
  if (centerInput) {
    centerInput.value = centerName;
  }
  
  showNotification(`Centro seleccionado: ${centerName}`, 'success');
  closeModal('center-modal');
}

// Función para generar reporte de seguimientos
async function generateFollowupsReport() {
  try {
    showLoading(true);
    
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Paciente,RUT,Último Seguimiento,Tipo,Profesional,Estado\n";
    
    for (const doc of patientsSnapshot.docs) {
      const data = doc.data();
      const lastEntry = data.historial_clinico && data.historial_clinico.length > 0 
        ? data.historial_clinico[data.historial_clinico.length - 1] 
        : null;
      
      if (lastEntry) {
        // Obtener nombre del profesional
        let professionalName = 'N/A';
        if (lastEntry.profesional) {
          try {
            const profDoc = await db.collection('profesionales').doc(lastEntry.profesional).get();
            if (profDoc.exists) {
              professionalName = profDoc.data().nombre;
            }
          } catch (error) {
            console.error('Error loading professional name:', error);
          }
        }
        
        const row = [
          `"${data.datos_personales?.nombre_completo || 'Sin nombre'}"`,
          `"${data.datos_personales?.rut || 'Sin RUT'}"`,
          `"${formatDate(lastEntry.fecha)}"`,
          `"${lastEntry.tipo || 'N/A'}"`,
          `"${professionalName}"`,
          `"${lastEntry.estado_paciente || 'N/A'}"`
        ].join(',');
        
        csvContent += row + "\n";
      }
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seguimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Reporte de seguimientos generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating followups report:', error);
    showNotification('Error al generar el reporte de seguimientos', 'error');
  } finally {
    showLoading(false);
  }
}

// Función para validar archivos adjuntos
function validateFileUpload(fileInput, maxSize = 5 * 1024 * 1024) { // 5MB por defecto
  const file = fileInput.files[0];
  if (!file) return false;
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  
  if (!allowedTypes.includes(file.type)) {
    showNotification('Tipo de archivo no permitido. Solo se permiten imágenes, PDF y archivos de texto.', 'error');
    fileInput.value = '';
    return false;
  }
  
  if (file.size > maxSize) {
    showNotification(`El archivo es demasiado grande. Máximo permitido: ${maxSize / (1024 * 1024)}MB`, 'error');
    fileInput.value = '';
    return false;
  }
  
  return true;
}

// Función para limpiar datos sensibles del localStorage al cerrar
window.addEventListener('beforeunload', function() {
  localStorage.removeItem('senda_draft');
  // Limpiar otros datos sensibles si es necesario
});

// Función para manejar errores de red
function handleNetworkError(error) {
  console.error('Network error:', error);
  
  if (!navigator.onLine) {
    showNotification('Sin conexión a internet. Verifica tu conexión.', 'error', 10000);
  } else {
    showNotification('Error de conexión. Intenta nuevamente.', 'error');
  }
}

// Listener para estado de la conexión
window.addEventListener('online', function() {
  showNotification('Conexión restablecida', 'success', 3000);
});

window.addEventListener('offline', function() {
  showNotification('Sin conexión a internet', 'warning', 10000);
});

// Función para exportar datos del sistema (solo admins)
async function exportSystemData() {
  if (currentUserData?.profesion !== 'admin') {
    showNotification('Solo los administradores pueden exportar datos del sistema', 'error');
    return;
  }
  
  if (!confirm('¿Estás seguro de exportar todos los datos del sistema? Esta operación puede tomar varios minutos.')) {
    return;
  }
  
  try {
    showLoading(true);
    
    // Exportar todas las colecciones principales
    const collections = ['pacientes', 'solicitudes_ingreso', 'profesionales', 'citas'];
    const exportData = {};
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      exportData[collection] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `senda_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Datos exportados correctamente', 'success');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Error al exportar los datos del sistema', 'error');
  } finally {
    showLoading(false);
  }
}
