function guardarCitaPaciente(datosCita, callback) {
  const datos = Object.assign({}, datosCita);
  datos.telefono = limpiarTelefonoChileno(datos.telefono || "");
  datos.email = datos.email ? datos.email.trim() : "";
  datos.direccion = datos.direccion ? datos.direccion.trim() : "";

  if (datos.email && !validarEmail(datos.email)) {
    window.showNotification && window.showNotification("Email inválido", "warning");
    if (typeof callback === "function") callback(null, new Error("Email inválido"));
    return;
  }

  // Vinculación fuerte: CREAMOS/ACTUALIZAMOS paciente ANTES de guardar la cita
  const idPaciente = window.generarIdPaciente(datos.rut || datos.pacienteRut);
  window.crearOActualizarPaciente(datos, function(pacienteId, error) {
    if (error) {
      window.showNotification && window.showNotification("Error actualizando paciente: " + error.message, "error");
      if (typeof callback === "function") callback(null, error);
      return;
    }
    const db = window.getFirestore();
    db.collection('citas').add({ ...datos, idPaciente })
      .then(function(docRef) {
        window.showNotification && window.showNotification("Cita agendada correctamente", "success");
        if (typeof callback === "function") callback(docRef.id);
      })
      .catch(function(error) {
        window.showNotification && window.showNotification("Error agendando cita: " + error.message, "error");
        if (typeof callback === "function") callback(null, error);
      });
  });
}

window.guardarCitaPaciente = guardarCitaPaciente;
