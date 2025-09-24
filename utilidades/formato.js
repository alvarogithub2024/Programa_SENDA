// src/js/utilidades/formato.js
export function formatearRUT(rut) {
  if (!rut) return '';
  
  const limpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return `${cuerpoFormateado}-${dv}`;
}

export function validarRUT(rut) {
  if (!rut) return false;
  
  const limpio = rut.replace(/[^\dKk]/g, '').toUpperCase();
  if (limpio.length < 8 || limpio.length > 9) return false;
  
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  
  if (!/^\d+$/.test(cuerpo)) return false;
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  let dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  return dv === dvFinal;
}

export function esEmailValido(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validarTelefono(telefono) {
  if (!telefono) return false;
  const limpio = telefono.replace(/\D/g, '');
  return limpio.length >= 8 && limpio.length <= 12;
}

export function formatearTelefono(telefono) {
  if (!telefono) return '';
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length === 9) {
    return `${limpio.slice(0, 1)} ${limpio.slice(1, 5)} ${limpio.slice(5)}`;
  }
  return telefono;
}

export function formatearFecha(timestamp) {
  if (!timestamp) return 'N/A';
  
  let fecha;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    fecha = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    fecha = timestamp;
  } else {
    fecha = new Date(timestamp);
  }
  
  if (isNaN(fecha.getTime())) return 'N/A';
  
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncarTexto(texto, longitud) {
  if (!texto || texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
}

export function alternarBotonEnvio(boton, cargando) {
  if (!boton) return;
  
  if (cargando) {
    boton.disabled = true;
    const textoOriginal = boton.innerHTML;
    boton.setAttribute('data-original-text', textoOriginal);
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  } else {
    boton.disabled = false;
    const textoOriginal = boton.getAttribute('data-original-text');
    if (textoOriginal) boton.innerHTML = textoOriginal;
  }
}

export function parsearFechaLocal(fechaStr) {
  const [año, mes, dia] = fechaStr.split('-').map(Number);
  return new Date(año, mes - 1, dia);
}

export function obtenerColorPrioridad(prioridad) {
  const colores = {
    'critica': '#ef4444',
    'alta': '#f59e0b',
    'media': '#3b82f6',
    'baja': '#10b981'
  };
  return colores[prioridad] || '#6b7280';
}

export function obtenerColorEstado(estado) {
  const colores = {
    'programada': '#3b82f6',
    'confirmada': '#10b981',
    'en_curso': '#f59e0b',
    'completada': '#059669',
    'cancelada': '#ef4444'
  };
  return colores[estado] || '#6b7280';
}

export function formatearNumero(numero) {
  if (numero === null || numero === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CL').format(numero);
}

export function formatearPorcentaje(valor, decimales = 1) {
  if (valor === null || valor === undefined) return 'N/A';
  return `${valor.toFixed(decimales)}%`;
}

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

export function formatearDuracion(minutos) {
  if (!minutos || minutos <= 0) return '0 min';
  
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  
  if (horas === 0) return `${minutosRestantes} min`;
  if (minutosRestantes === 0) return `${horas}h`;
  return `${horas}h ${minutosRestantes}min`;
}

export function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
}

export function generarID(prefijo = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefijo ? `${prefijo}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function esFechaPasada(fecha) {
  if (!fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaComparar = new Date(fecha);
  fechaComparar.setHours(0, 0, 0, 0);
  return fechaComparar < hoy;
}

export function esFechaHoy(fecha) {
  if (!fecha) return false;
  const hoy = new Date();
  const fechaComparar = new Date(fecha);
  return hoy.toDateString() === fechaComparar.toDateString();
}

export function formatearFechaRelativa(fecha) {
  if (!fecha) return 'N/A';
  
  const ahora = new Date();
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const diferencia = ahora - fechaObj;
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 7) {
    return formatearFecha(fecha);
  } else if (dias > 0) {
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  } else if (horas > 0) {
    return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  } else if (minutos > 0) {
    return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  } else {
    return 'Hace un momento';
  }
}

export function validarEdad(edad, minima = 12, maxima = 120) {
  const edadNum = parseInt(edad);
  return !isNaN(edadNum) && edadNum >= minima && edadNum <= maxima;
}

export function limpiarTexto(texto) {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ');
}

export function capitalizarPalabras(texto) {
  if (!texto) return '';
  return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export function formatearMoneda(cantidad, moneda = 'CLP') {
  if (cantidad === null || cantidad === undefined) return 'N/A';
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cantidad);
}
