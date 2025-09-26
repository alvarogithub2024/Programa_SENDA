// ===================================================================
// FIX ESPECÍFICO PARA MOSTRAR BOTONES DE EDITAR/ELIMINAR
// Reemplaza la función cargarHistorialClinicoPacientePorRut en tu código
// ===================================================================

function cargarHistorialClinicoPacientePorRut(rutPaciente) {
    const cont = document.getElementById('historial-clinico');
    if (!cont) return;
    
    const db = window.getFirestore();
    rutPaciente = (rutPaciente || '').replace(/[.\-]/g, '').trim();
    
    db.collection('atenciones')
      .where('pacienteRut', '==', rutPaciente)
      .orderBy('fechaRegistro', 'desc')
      .get()
      .then(snapshot => {
          let html = '';
          
          if (snapshot.empty) {
              html = "<p>No hay atenciones registradas.</p>";
          } else {
              html = '<ul style="margin-top:8px;">';
              
              snapshot.forEach(doc => {
                  const a = doc.data();
                  let fechaTexto = '';
                  let horaTexto = '';
                  
                  // Formatear fecha y hora
                  if (a.fechaRegistro) {
                      let fechaObj;
                      if (typeof a.fechaRegistro === 'string') {
                          fechaObj = new Date(a.fechaRegistro);
                      } else if (a.fechaRegistro.seconds) {
                          fechaObj = new Date(a.fechaRegistro.seconds * 1000);
                      }
                      fechaTexto = fechaObj.toLocaleDateString('es-CL');
                      horaTexto = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                  }
                  
                  // AQUÍ ESTÁ EL FIX: Mostrar botones SIEMPRE para roles permitidos
                  let acciones = '';
                  console.log('Profesión actual:', profesionActual); // Para debug
                  
                  // Verificar si el profesional puede editar (más permisivo)
                  if (profesionActual && ['medico', 'psicologo', 'terapeuta'].includes(profesionActual)) {
                      acciones = `
                          <div style="margin-top:10px; display:flex; gap:8px;">
                              <button class="btn btn-outline btn-sm" 
                                      onclick="window.mostrarModalEditarAtencionDesdeFicha('${doc.id}', '${encodeURIComponent(a.descripcion || '')}', '${a.tipoAtencion || ''}', '${rutPaciente}')"
                                      style="background:#fff; color:#2563eb; border:1px solid #2563eb; padding:4px 8px; border-radius:4px; font-size:0.8rem;">
                                  <i class="fas fa-edit"></i> Editar
                              </button>
                              <button class="btn btn-danger btn-sm" 
                                      onclick="window.eliminarAtencionDesdeFicha('${doc.id}', '${rutPaciente}')"
                                      style="background:#ef4444; color:white; border:1px solid #ef4444; padding:4px 8px; border-radius:4px; font-size:0.8rem;">
                                  <i class="fas fa-trash"></i> Eliminar
                              </button>
                          </div>
                      `;
                  } else {
                      // Solo mostrar mensaje si no hay permisos
                      acciones = `<div style="margin-top:8px; color:#6b7280; font-size:0.8rem; font-style:italic;">
                          Solo médicos, psicólogos y terapeutas pueden editar el historial
                      </div>`;
                  }
                  
                  html += `
                      <li style="margin-bottom:12px; padding:12px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px;">
                          <div style="margin-bottom:8px;">
                              <b style="color:#2563eb;">Profesional:</b> ${a.profesional || ''}<br>
                              <b style="color:#059669;">Fecha:</b> ${fechaTexto} <b>Hora:</b> ${horaTexto}<br>
                              <b style="color:#f59e0b;">Tipo:</b> ${formatearTipoAtencion(a.tipoAtencion || 'consulta')}
                          </div>
                          <div style="color:#374151; line-height:1.5; margin:8px 0;">
                              ${a.descripcion || 'Sin descripción'}
                          </div>
                          ${acciones}
                      </li>
                  `;
              });
              
              html += '</ul>';
              
              // Agregar botón para nueva atención si tiene permisos
              if (profesionActual && ['medico', 'psicologo', 'terapeuta'].includes(profesionActual)) {
                  html = `
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                          <b>Historial clínico:</b>
                          <button onclick="window.mostrarFormularioNuevaAtencion('${rutPaciente}')" 
                                  style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; font-size:0.8rem; cursor:pointer;">
                              <i class="fas fa-plus"></i> Agregar Atención
                          </button>
                      </div>
                      ${html}
                  `;
              } else {
                  html = `<b>Historial clínico:</b> ${html}`;
              }
          }
          
          cont.innerHTML = html;
      })
      .catch(error => {
          console.error('Error completo:', error);
          
          if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
              cont.innerHTML = `
                <b>Historial clínico:</b>
                <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:8px; padding:1rem; color:#dc2626; margin-top:10px;">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error de Configuración</h4>
                    <p>Firestore requiere un índice compuesto para esta consulta.</p>
                    <p><small>Revisa la consola de Firebase para crear el índice necesario.</small></p>
                </div>
              `;
              console.error("Firestore necesita índice compuesto para atenciones.pacienteRut + fechaRegistro", error);
          } else {
              cont.innerHTML = `
                <b>Historial clínico:</b>
                <div style="background:#fee2e2; border-radius:8px; padding:1rem; color:#dc2626; margin-top:10px;">
                    <p><i class="fas fa-exclamation-circle"></i> Error al cargar historial clínico</p>
                    <p><small>Error: ${error.message}</small></p>
                </div>
              `;
              console.error("Error Firestore:", error);
          }
      });
}

// Función auxiliar para formatear tipo de atención
function formatearTipoAtencion(tipo) {
    const tipos = {
        'consulta': 'Consulta General',
        'seguimiento': 'Seguimiento',
        'orientacion': 'Orientación',
        'intervencion': 'Intervención',
        'derivacion': 'Derivación'
    };
    return tipos[tipo] || 'Consulta General';
}

// ===================================================================
// FUNCIÓN PARA AGREGAR NUEVA ATENCIÓN (si no existe)
// ===================================================================

window.mostrarFormularioNuevaAtencion = function(rutPaciente) {
    // Cerrar ficha actual temporalmente
    const fichaModal = document.getElementById('modal-ficha-paciente');
    if (fichaModal) fichaModal.style.display = 'none';
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-nueva-atencion" style="display:flex; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:12px; padding:2rem; max-width:500px; width:90%; max-height:90vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2 style="color:#2563eb; margin:0;">
                        <i class="fas fa-plus-circle"></i> Nueva Atención
                    </h2>
                    <button onclick="cerrarModalNuevaAtencion()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#6b7280;">&times;</button>
                </div>
                
                <form id="form-nueva-atencion">
                    <div style="margin-bottom:1rem;">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Tipo de atención *</label>
                        <select id="nueva-atencion-tipo" style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px;" required>
                            <option value="">Selecciona tipo...</option>
                            <option value="consulta">Consulta</option>
                            <option value="seguimiento">Seguimiento</option>
                            <option value="orientacion">Orientación</option>
                            <option value="intervencion">Intervención</option>
                            <option value="derivacion">Derivación</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Descripción de la atención *</label>
                        <textarea id="nueva-atencion-descripcion" 
                                  style="width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; min-height:100px; resize:vertical;" 
                                  placeholder="Describe la atención realizada, observaciones, recomendaciones..." required></textarea>
                    </div>
                    
                    <div style="display:flex; gap:1rem; justify-content:flex-end;">
                        <button type="button" onclick="cerrarModalNuevaAtencion()" 
                                style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; padding:8px 16px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" 
                                style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-save"></i> Guardar Atención
                        </button>
                    </div>
                    
                    <input type="hidden" id="nueva-atencion-rut" value="${rutPaciente}">
                </form>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modal-nueva-atencion');
    if (modalAnterior) modalAnterior.remove();
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Enfocar textarea
    setTimeout(() => {
        document.getElementById('nueva-atencion-descripcion').focus();
    }, 100);

    // Configurar evento submit
    document.getElementById('form-nueva-atencion').onsubmit = async function(event) {
        event.preventDefault();
        
        const tipo = document.getElementById('nueva-atencion-tipo').value;
        const descripcion = document.getElementById('nueva-atencion-descripcion').value.trim();
        const rutPaciente = document.getElementById('nueva-atencion-rut').value;
        
        if (!tipo || !descripcion) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            // Obtener datos del profesional actual
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('Error: No hay usuario autenticado');
                return;
            }

            const profesionalDoc = await window.getFirestore().collection('profesionales').doc(user.uid).get();
            if (!profesionalDoc.exists) {
                alert('Error: No se encontraron datos del profesional');
                return;
            }

            const profesionalData = profesionalDoc.data();
            const db = window.getFirestore();
            
            const nuevaAtencion = {
                pacienteRut: rutPaciente,
                profesional: `${profesionalData.nombre} ${profesionalData.apellidos}`,
                profesionalId: user.uid,
                tipoAtencion: tipo,
                descripcion: descripcion,
                fechaRegistro: new Date(),
                fechaCreacion: new Date().toISOString()
            };

            await db.collection('atenciones').add(nuevaAtencion);
            
            window.showNotification && window.showNotification('Atención registrada correctamente', 'success');
            cerrarModalNuevaAtencion();
            
            // Recargar historial
            cargarHistorialClinicoPacientePorRut(rutPaciente);
            
            // Mostrar ficha nuevamente
            if (fichaModal) fichaModal.style.display = 'flex';

        } catch (error) {
            console.error('Error al guardar atención:', error);
            alert('Error al guardar la atención: ' + error.message);
        }
    };
};

window.cerrarModalNuevaAtencion = function() {
    const modal = document.getElementById('modal-nueva-atencion');
    if (modal) modal.remove();
    
    // Mostrar ficha nuevamente
    const fichaModal = document.getElementById('modal-ficha-paciente');
    if (fichaModal) fichaModal.style.display = 'flex';
};

// ===================================================================
// DEBUG: Función para verificar el estado actual
// ===================================================================

window.debugPermisos = function() {
    console.log('=== DEBUG PERMISOS ===');
    console.log('profesionActual:', profesionActual);
    console.log('Usuario autenticado:', firebase.auth().currentUser ? 'Sí' : 'No');
    
    if (firebase.auth().currentUser) {
        window.getFirestore().collection('profesionales').doc(firebase.auth().currentUser.uid).get()
            .then(doc => {
                if (doc.exists) {
                    console.log('Datos del profesional:', doc.data());
                } else {
                    console.log('No se encontró documento del profesional');
                }
            });
    }
    
    const tienePermisos = profesionActual && ['medico', 'psicologo', 'terapeuta'].includes(profesionActual);
    console.log('Puede editar historial:', tienePermisos);
    console.log('=== FIN DEBUG ===');
};

// Ejecutar debug automáticamente
setTimeout(() => {
    window.debugPermisos();
}, 2000);
