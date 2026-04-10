/**
 * sidebar.js — Renderiza la barra de navegación lateral
 * Se incluye en todas las páginas protegidas.
 */

function renderSidebar(activePage) {
  const session = getSession();
  const isAdmin = session && session.role === "admin";

  const html = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo-icon">📚</div>
        <div class="sidebar-logo-text">
          Sistema Académico
          <small>v1.0</small>
        </div>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar" id="session-initials">?</div>
        <div class="user-info">
          <strong id="session-name">Usuario</strong>
          <span id="session-role">rol</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Principal</div>

        <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">
          <span class="nav-icon">🏠</span> Dashboard
        </a>

        ${isAdmin ? `
        <div class="nav-section-label admin-only">Administración</div>
        <a href="students.html" class="nav-link admin-only ${activePage === 'students' ? 'active' : ''}">
          <span class="nav-icon">👨‍🎓</span> Estudiantes
        </a>
        <a href="teachers.html" class="nav-link admin-only ${activePage === 'teachers' ? 'active' : ''}">
          <span class="nav-icon">👨‍🏫</span> Profesores
        </a>
        <a href="subjects.html" class="nav-link admin-only ${activePage === 'subjects' ? 'active' : ''}">
          <span class="nav-icon">📚</span> Materias
        </a>
        ` : ''}

        <div class="nav-section-label">Académico</div>
        <a href="grades.html" class="nav-link ${activePage === 'grades' ? 'active' : ''}">
          <span class="nav-icon">📝</span> Notas
        </a>
        <a href="report.html" class="nav-link ${activePage === 'report' ? 'active' : ''}">
          <span class="nav-icon">📄</span> Boletines
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-block" onclick="logout()">
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  `;

  // Insertar sidebar al inicio del app-layout
  const layout = document.getElementById("app-layout");
  if (layout) {
    layout.insertAdjacentHTML("afterbegin", html);
    populateUserUI(session);
  }
}

window.renderSidebar = renderSidebar;
