/**
 * report.js — Generación de boletines académicos
 */

let reportData = null;

// ── Inicializar página de reportes ───────────────────────────────────────────
async function initReportPage() {
  const studentSel = document.getElementById("report-student");
  try {
    const data = await apiGet("getStudents");
    const students = data.students || [];

    studentSel.innerHTML = '<option value="">— Seleccionar estudiante —</option>';
    students.forEach(s => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = `${s.nombre} — ${s.grado}`;
      studentSel.appendChild(o);
    });
  } catch (err) {
    showToast("Error cargando estudiantes: " + err.message, "error");
  }
}

// ── Generar boletín ───────────────────────────────────────────────────────────
async function generateReport() {
  const studentId = document.getElementById("report-student").value;
  const periodo   = document.getElementById("report-period").value;
  const btn       = document.getElementById("btn-generate");

  if (!studentId) {
    showToast("Selecciona un estudiante.", "warning");
    return;
  }

  const originalText = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    const data = await apiGet("getStudentReport", { studentId });
    reportData = data;
    renderBulletin(data, periodo);
    document.getElementById("bulletin-container").classList.remove("hidden");
    document.getElementById("report-actions").classList.remove("hidden");
    document.getElementById("bulletin-container").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast("Error generando boletín: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

// ── Renderizar el boletín en HTML ─────────────────────────────────────────────
function renderBulletin(data, periodo = "Año Escolar") {
  const { student, grades } = data;
  const year = new Date().getFullYear();

  // Calcular promedio global
  const validGrades = grades.filter(g => g.promedio && !isNaN(parseFloat(g.promedio)));
  const globalAvg = validGrades.length
    ? (validGrades.reduce((sum, g) => sum + parseFloat(g.promedio), 0) / validGrades.length).toFixed(2)
    : "—";

  const isApproved = !isNaN(parseFloat(globalAvg)) && parseFloat(globalAvg) >= 6;
  const statusClass = isApproved ? "approved" : "failed";
  const statusLabel = isApproved ? "✅ Aprobado" : "❌ Reprobado";

  // Materias aprobadas / reprobadas
  const approvedCount = validGrades.filter(g => parseFloat(g.promedio) >= 6).length;
  const failedCount   = validGrades.length - approvedCount;

  const container = document.getElementById("bulletin-container");
  container.innerHTML = `
    <div class="bulletin">
      <div class="bulletin-header">
        <div class="bulletin-school">
          <h2>📚 Instituto Académico</h2>
          <p>Sistema de Gestión Académica</p>
        </div>
        <div class="bulletin-year">
          <strong>${year}</strong>
          <span>${periodo}</span>
        </div>
      </div>

      <div class="bulletin-student">
        <div class="bulletin-field">
          <label>Estudiante</label>
          <strong>${student.nombre}</strong>
        </div>
        <div class="bulletin-field">
          <label>Documento</label>
          <strong>${student.documento}</strong>
        </div>
        <div class="bulletin-field">
          <label>Grado / Curso</label>
          <strong>${student.grado}</strong>
        </div>
      </div>

      <div class="bulletin-body">
        <div class="bulletin-table-title">Calificaciones por Materia</div>
        <table class="bulletin-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Profesor</th>
              <th>Corte 1</th>
              <th>Corte 2</th>
              <th>Corte 3</th>
              <th>Promedio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${grades.length ? grades.map(g => {
              const avg = parseFloat(g.promedio);
              const statusBadge = !isNaN(avg)
                ? (avg >= 6 ? '<span class="badge badge-green">Aprobado</span>' : '<span class="badge badge-red">Reprobado</span>')
                : '<span class="badge badge-gray">—</span>';

              return `
              <tr>
                <td><strong>${g.subjectName || "—"}</strong></td>
                <td>${g.teacherName || "—"}</td>
                <td style="text-align:center">${g.nota1 || "—"}</td>
                <td style="text-align:center">${g.nota2 || "—"}</td>
                <td style="text-align:center">${g.nota3 || "—"}</td>
                <td style="text-align:center">${!isNaN(avg) ? `<strong>${avg.toFixed(1)}</strong>` : "—"}</td>
                <td>${statusBadge}</td>
              </tr>`;
            }).join("") : `
              <tr>
                <td colspan="7" style="text-align:center; color: var(--gray-400); padding: 24px">
                  No hay notas registradas para este estudiante.
                </td>
              </tr>`}
          </tbody>
        </table>

        <div class="bulletin-summary">
          <div class="summary-box approved">
            <strong>${approvedCount}</strong>
            <span>Materias Aprobadas</span>
          </div>
          <div class="summary-box failed">
            <strong>${failedCount}</strong>
            <span>Materias Reprobadas</span>
          </div>
        </div>
      </div>

      <div class="bulletin-footer-area">
        <div>
          <div style="font-size:.75rem; color: var(--gray-500); margin-bottom: 4px">PROMEDIO GENERAL</div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--gray-900)">${globalAvg}</div>
        </div>
        <span class="bulletin-status-badge ${statusClass}">${statusLabel}</span>
        <div style="text-align:right">
          <div style="font-size:.72rem; color: var(--gray-500)">Generado el</div>
          <div style="font-size:.85rem; font-weight:600; color: var(--gray-700)">${new Date().toLocaleDateString("es-CO", { year:"numeric", month:"long", day:"numeric" })}</div>
        </div>
      </div>
    </div>
  `;
}

// ── Imprimir ──────────────────────────────────────────────────────────────────
function printBulletin() {
  window.print();
}

// ── Exportar PDF (usando la API del navegador) ────────────────────────────────
function exportPDF() {
  if (!reportData) {
    showToast("Primero genera el boletín.", "warning");
    return;
  }
  showToast("Usa Ctrl+P → Guardar como PDF para exportar.", "info", 5000);
  setTimeout(() => window.print(), 800);
}

window.initReportPage  = initReportPage;
window.generateReport  = generateReport;
window.renderBulletin  = renderBulletin;
window.printBulletin   = printBulletin;
window.exportPDF       = exportPDF;
