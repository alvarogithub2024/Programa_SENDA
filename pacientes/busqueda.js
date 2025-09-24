// busqueda.js
import { showNotification } from "../utilidades/notificaciones.js";
import { loadPacientes } from "./gestor-pacientes.js";

let pacientesData = [];

/**
 * Inicializa la búsqueda de pacientes
 */
export function setupBusquedaPacientes(data) {
  pacientesData = data;

  const input = document.getElementById("search-pacientes");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    buscarPacientes(query);
  });
}

/**
 * Buscar pacientes por nombre, rut o cesfam
 */
export function buscarPacientes(query) {
  const container = document.getElementById("patients-grid");
  if (!container) return;

  if (!query) {
    loadPacientes(false); // recarga todos
    return;
  }

  const resultados = pacientesData.filter(p => {
    return (
      (p.nombre && p.nombre.toLowerCase().includes(query)) ||
      (p.rut && p.rut.toLowerCase().includes(query)) ||
      (p.cesfam && p.cesfam.toLowerCase().includes(query))
    );
  });

  if (resultados.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>Sin resultados</h3>
        <p>No se encontraron pacientes con "${query}"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = resultados.map(p => `
    <div class="patient-card">
      <h3>${p.nombre || "Sin nombre"}</h3>
      <p><strong>RUT:</strong> ${p.rut || "N/A"}</p>
      <p><strong>CESFAM:</strong> ${p.cesfam || "N/A"}</p>
    </div>
  `).join("");
}
