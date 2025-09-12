// ================= PARTE 8: REPORTES Y ESTADÍSTICAS =================

async function loadReportsPanel(userData) {
  console.log('Loading reports panel for:', userData.nombre);
  
  const reportsContainer = document.getElementById('reports-panel');
  if (!reportsContainer) return;
  
  // Verificar permisos
  if (!userData.configuracion_sistema?.permisos?.includes('reportes') && 
      userData.profesion !== 'admin' && userData.profesion !== 'coordinador') {
    reportsContainer.innerHTML = `
      <div class="card">
        <p style="text-align: center; color: var(--gray-600);">
          <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
          No tienes permisos para acceder a los reportes.
        </p>
      </div>
    `;
    return;
  }
  
  // Cargar estadísticas y métricas
  try {
    const stats = await loadSystemStatistics();
    
    reportsContainer.innerHTML = `
      <div class="panel-header">
        <h1 class="panel-title">Reportes y Estadísticas</h1>
        <p class="panel-subtitle">Métricas del sistema y reportes generales</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-content">
            <h3>${stats.totalPatients}</h3>
            <p>Pacientes Activos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
          <div class="stat-content">
            <h3>${stats.pendingRequests}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-content">
            <h3>${stats.criticalCases}</h3>
            <p>Casos Críticos</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
          <div class="stat-content">
            <h3>${stats.appointmentsToday}</h3>
            <p>Citas Hoy</p>
          </div>
        </div>
      </div>
      
      <div class="reports-section">
        <h2>Generar Reportes</h2>
        <div class="reports-grid">
          <div class="report-card">
            <h3>Reporte de Pacientes</h3>
            <p>Lista completa de pacientes activos con sus datos básicos</p>
            <button class="btn btn-primary" onclick="generatePatientsReport()">
              <i class="fas fa-file-excel"></i> Generar Excel
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Solicitudes</h3>
            <p>Historial de solicitudes de ingreso por período</p>
            <button class="btn btn-primary" onclick="generateRequestsReport()">
              <i class="fas fa-file-pdf"></i> Generar PDF
            </button>
          </div>
          
          <div class="report-card">
            <h3>Estadísticas Regionales</h3>
            <p>Distribución de casos por región y comuna</p>
            <button class="btn btn-primary" onclick="generateRegionalReport()">
              <i class="fas fa-chart-bar"></i> Ver Estadísticas
            </button>
          </div>
          
          <div class="report-card">
            <h3>Reporte de Seguimientos</h3>
            <p>Actividad de seguimiento por profesional</p>
            <button class="btn btn-primary" onclick="generateFollowupsReport()">
              <i class="fas fa-notes-medical"></i> Generar Reporte
            </button>
          </div>
        </div>
      </div>
      
      <div class="monthly-stats">
        <h2>Estadísticas del Mes - ${new Date().toLocaleDateString('es-CL', {month: 'long', year: 'numeric'})}</h2>
        <div class="monthly-grid">
          <div class="monthly-item">
            <strong>Nuevas solicitudes:</strong> ${stats.monthlyRequests}
          </div>
          <div class="monthly-item">
            <strong>Pacientes ingresados:</strong> ${stats.monthlyPatients}
          </div>
          <div class="monthly-item">
            <strong>Seguimientos realizados:</strong> ${stats.monthlyFollowups}
          </div>
          <div class="monthly-item">
            <strong>Citas programadas:</strong> ${stats.monthlyAppointments}
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading reports panel:', error);
    reportsContainer.innerHTML = '<p>Error al cargar estadísticas: ' + error.message + '</p>';
  }
}

async function loadSystemStatistics() {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Obtener estadísticas en paralelo
    const [
      totalPatientsSnapshot,
      pendingRequestsSnapshot,
      criticalCasesSnapshot,
      appointmentsTodaySnapshot,
      monthlyRequestsSnapshot,
      monthlyPatientsSnapshot,
      monthlyFollowupsSnapshot,
      monthlyAppointmentsSnapshot
    ] = await Promise.all([
      db.collection('pacientes').where('estado_actual.activo', '==', true).get(),
      db.collection('solicitudes_ingreso').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('solicitudes_ingreso').where('clasificacion.prioridad', '==', 'critica').where('clasificacion.estado', '==', 'pendiente').get(),
      db.collection('citas').where('fecha', '>=', startOfDay).where('fecha', '<=', endOfDay).get(),
      db.collection('solicitudes_ingreso').where('metadata.fecha_creacion', '>=', startOfMonth).get(),
      db.collection('pacientes').where('metadata.fecha_creacion', '>=', startOfMonth).get(),
      db.collection('pacientes').where('metadata.ultima_actualizacion', '>=', startOfMonth).get(),
      db.collection('citas').where('fecha_creacion', '>=', startOfMonth).get()
    ]);
    
    return {
      totalPatients: totalPatientsSnapshot.size,
      pendingRequests: pendingRequestsSnapshot.size,
      criticalCases: criticalCasesSnapshot.size,
      appointmentsToday: appointmentsTodaySnapshot.size,
      monthlyRequests: monthlyRequestsSnapshot.size,
      monthlyPatients: monthlyPatientsSnapshot.size,
      monthlyFollowups: monthlyFollowupsSnapshot.size,
      monthlyAppointments: monthlyAppointmentsSnapshot.size
    };
  } catch (error) {
    console.error('Error loading statistics:', error);
    return {
      totalPatients: 0,
      pendingRequests: 0,
      criticalCases: 0,
      appointmentsToday: 0,
      monthlyRequests: 0,
      monthlyPatients: 0,
      monthlyFollowups: 0,
      monthlyAppointments: 0
    };
  }
}

async function generatePatientsReport() {
  try {
    showLoading(true);
    
    const patientsSnapshot = await db.collection('pacientes')
      .where('estado_actual.activo', '==', true)
      .get();
    
    if (patientsSnapshot.empty) {
      showNotification('No hay pacientes para generar el reporte', 'warning');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nombre,RUT,Edad,Región,Comuna,Teléfono,Email,Programa,Fecha Ingreso\n";
    
    patientsSnapshot.forEach(doc => {
      const data = doc.data();
      const row = [
        `"${data.datos_personales?.nombre_completo || 'Sin nombre'}"`,
        `"${data.datos_personales?.rut || 'Sin RUT'}"`,
        data.datos_personales?.edad || 0,
        `"${data.datos_personales?.region || 'N/A'}"`,
        `"${data.datos_personales?.comuna || 'N/A'}"`,
        `"${data.contacto?.telefono || 'Sin teléfono'}"`,
        `"${data.contacto?.email || 'Sin email'}"`,
        `"${data.estado_actual?.programa || 'N/A'}"`,
        `"${formatDate(data.estado_actual?.fecha_ingreso)}"`
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Reporte de pacientes generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating patients report:', error);
    showNotification('Error al generar el reporte de pacientes', 'error');
  } finally {
    showLoading(false);
  }
}

async function generateRequestsReport() {
  try {
    showLoading(true);
    
    const requestsSnapshot = await db.collection('solicitudes_ingreso')
      .orderBy('metadata.fecha_creacion', 'desc')
      .limit(1000)
      .get();
    
    if (requestsSnapshot.empty) {
      showNotification('No hay solicitudes para generar el reporte', 'warning');
      return;
    }
    
    // Crear contenido del reporte
    let reportContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Reporte de Solicitudes SENDA</h1>
        <p style="text-align: center; color: #666;">Generado el ${new Date().toLocaleDateString('es-CL')}</p>
        <hr style="margin: 30px 0;">
        
        <h2>Resumen Ejecutivo</h2>
        <p>Total de solicitudes: <strong>${requestsSnapshot.size}</strong></p>
        
        <h2>Detalle de Solicitudes</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Fecha</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Prioridad</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Región</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    requestsSnapshot.forEach(doc => {
      const data = doc.data();
      const tipo = data.datos_personales?.anonimo ? 'Anónimo' : 
                   data.datos_personales?.solo_informacion ? 'Información' : 'Identificado';
      
      reportContent += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${doc.id.substring(0, 8).toUpperCase()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(data.metadata?.fecha_creacion)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${tipo}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.clasificacion?.estado || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.clasificacion?.prioridad || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${data.datos_personales?.region || 'N/A'}</td>
        </tr>
      `;
    });
    
    reportContent += `
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            Este reporte fue generado automáticamente por el Sistema SENDA el ${new Date().toLocaleString('es-CL')}.
            Para más información, contacta al equipo de soporte técnico.
          </p>
        </div>
      </div>
    `;
    
    // Crear y descargar PDF (simulado con HTML)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.print();
    
    showNotification('Reporte de solicitudes generado correctamente', 'success');
    
  } catch (error) {
    console.error('Error generating requests report:', error);
    showNotification('Error al generar el reporte de solicitudes', 'error');
  } finally {
    showLoading(false);
  }
}

async function generateRegionalReport() {
  try {
    showLoading(true);
    
    const requestsSnapshot = await db.collection('solicitudes_ingreso').get();
    const patientsSnapshot = await db.collection('pacientes').get();
    
    // Analizar distribución por región
    const regionalStats = {};
    
    requestsSnapshot.forEach(doc => {
      const region = doc.data().datos_personales?.region || 'Sin región';
      if (!regionalStats[region]) {
        regionalStats[region] = { solicitudes: 0, pacientes: 0 };
      }
      regionalStats[region].solicitudes++;
    });
    
    patientsSnapshot.forEach(doc => {
      const region = doc.data().datos_personales?.region || 'Sin región';
      if (!regionalStats[region]) {
        regionalStats[region] = { solicitudes: 0, pacientes: 0 };
      }
      regionalStats[region].pacientes++;
    });
    
    showRegionalStatsModal(regionalStats);
    
  } catch (error) {
    console.error('Error generating regional report:', error);
    showNotification('Error al generar estadísticas regionales', 'error');
  } finally {
    showLoading(false);
  }
}

function showRegionalStatsModal(stats) {
  const modalHTML = `
    <div class="modal-overlay" id="regional-stats-modal">
      <div class="modal large-modal">
        <button class="modal-close" onclick="closeModal('regional-stats-modal')">
          <i class="fas fa-times"></i>
        </button>
        <h2>Estadísticas Regionales</h2>
        
        <div class="regional-stats">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Región</th>
                <th>Solicitudes</th>
                <th>Pacientes Activos</th>
                <th>Conversión</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats).map(([region, data]) => `
                <tr>
                  <td><strong>${regionesChile[region]?.nombre || region}</strong></td>
                  <td>${data.solicitudes}</td>
                  <td>${data.pacientes}</td>
                  <td>${data.solicitudes > 0 ? Math.round((data.pacientes / data.solicitudes) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn btn-outline" onclick="closeModal('regional-stats-modal')">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('regional-stats-modal').style.display = 'flex';
}
