/**
 * auth.js — Autenticación, sesión y control de acceso
 */

const SESSION_KEY = "academic_session";

// ── Guardar sesión ───────────────────────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// ── Obtener sesión activa ────────────────────────────────────────────────────
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Cerrar sesión ────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

// ── Verificar si el usuario está autenticado ─────────────────────────────────
// Llama a esta función al inicio de cada página protegida.
function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

// ── Verificar si ya está logueado (para el login) ────────────────────────────
function redirectIfLoggedIn() {
  const session = getSession();
  if (session) {
    window.location.href = "dashboard.html";
  }
}

// ── Verificar permisos de admin ──────────────────────────────────────────────
function requireAdmin() {
  const session = requireAuth();
  if (session && session.role !== "admin") {
    showToast("No tienes permisos para esta sección.", "error");
    window.location.href = "dashboard.html";
    return null;
  }
  return session;
}

// ── Poblar UI con datos del usuario ─────────────────────────────────────────
function populateUserUI(session) {
  if (!session) return;

  // Nombre en sidebar
  const nameEl = document.getElementById("session-name");
  const roleEl = document.getElementById("session-role");
  const initEl = document.getElementById("session-initials");

  if (nameEl) nameEl.textContent = session.username;
  if (roleEl) roleEl.textContent = session.role === "admin" ? "Administrador" : "Profesor";
  if (initEl) initEl.textContent = session.username.charAt(0).toUpperCase();

  // Ocultar secciones de admin si es profesor
  if (session.role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.classList.add("hidden"));
  }
}

// ── Proceso de LOGIN ─────────────────────────────────────────────────────────
async function doLogin(username, password) {
  const data = await apiPost("login", { username, password });
  if (data.success) {
    saveSession(data.user);
    window.location.href = "dashboard.html";
  } else {
    throw new Error(data.message || "Credenciales incorrectas");
  }
}

// ── Marcar enlace activo en la sidebar ──────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href && href === page) link.classList.add("active");
  });
}

window.saveSession    = saveSession;
window.getSession     = getSession;
window.logout         = logout;
window.requireAuth    = requireAuth;
window.redirectIfLoggedIn = redirectIfLoggedIn;
window.requireAdmin   = requireAdmin;
window.populateUserUI = populateUserUI;
window.doLogin        = doLogin;
window.setActiveNav   = setActiveNav;
