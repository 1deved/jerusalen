/**
 * ui.js — Utilidades de interfaz: toasts, modales, loaders, helpers
 */

// ── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn .25s ease reverse";
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add("open");
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove("open");
}

// Cerrar modal al hacer clic en el overlay
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
  if (e.target.closest(".modal-close")) {
    e.target.closest(".modal-overlay").classList.remove("open");
  }
});

// ── LOADER EN TABLA ──────────────────────────────────────────────────────────
function showTableLoading(tbodyId, cols = 5) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${cols}">
        <div class="table-loading">
          <div class="spinner spinner-lg"></div>
          <span>Cargando datos...</span>
        </div>
      </td>
    </tr>
  `;
}

function showTableEmpty(tbodyId, cols = 5, msg = "No hay registros todavía") {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${cols}">
        <div class="table-empty">
          <div class="empty-icon">📭</div>
          <p>${msg}</p>
        </div>
      </td>
    </tr>
  `;
}

// ── BOTÓN CON LOADER ─────────────────────────────────────────────────────────
function setButtonLoading(btn, loading, originalText, loadingText = "Guardando...") {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div> ${loadingText}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ── FORMATEAR PROMEDIO CON COLOR ─────────────────────────────────────────────
function formatGrade(avg) {
  const n = parseFloat(avg);
  if (isNaN(n)) return `<span class="text-muted">—</span>`;
  const cls = n >= 6 ? "badge-green" : n >= 4 ? "badge-amber" : "badge-red";
  return `<span class="badge ${cls}">${n.toFixed(1)}</span>`;
}

// ── INICIALES PARA AVATAR ────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
}

// ── CONFIRMAR ELIMINACIÓN ─────────────────────────────────────────────────────
function confirmDelete(message = "¿Eliminar este registro?") {
  return window.confirm(message);
}

// ── FILTRO DE BÚSQUEDA EN TABLA ──────────────────────────────────────────────
function setupTableSearch(inputId, tbodyId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  });
}

// ── MENÚ MÓVIL ────────────────────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Cerrar al navegar
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => sidebar.classList.remove("open"));
  });
}

// Exponer globalmente
window.showToast       = showToast;
window.openModal       = openModal;
window.closeModal      = closeModal;
window.showTableLoading = showTableLoading;
window.showTableEmpty  = showTableEmpty;
window.setButtonLoading = setButtonLoading;
window.formatGrade     = formatGrade;
window.getInitials     = getInitials;
window.confirmDelete   = confirmDelete;
window.setupTableSearch = setupTableSearch;
window.initMobileMenu  = initMobileMenu;
