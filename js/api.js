/**
 * api.js — Conexión con Google Apps Script (backend)
 * 
 * INSTRUCCIÓN: Reemplaza API_URL con el enlace de tu Web App de Google Apps Script.
 */

const API_URL = "https://script.google.com/macros/s/AKfycbwTj7f2_M3yZM39FW4tLte8x2JYuRFXNOfozYFOPwoPfjq-A46VYH3jBNSw1pOED6sv/exec";

/**
 * Realiza una petición GET al backend.
 * @param {string} action  - Nombre del endpoint (ej: 'getStudents')
 * @param {Object} params  - Parámetros adicionales de consulta
 */
async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append("action", action);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.append(k, v);
  }

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

/**
 * Realiza una petición POST al backend (crear/actualizar/eliminar/login).
 * @param {string} action - Nombre del endpoint
 * @param {Object} body   - Datos a enviar
 */
async function apiPost(action, body = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // Apps Script requiere text/plain en CORS
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── Exporta funciones globales para uso en todos los módulos ──────────────────
window.apiGet  = apiGet;
window.apiPost = apiPost;
