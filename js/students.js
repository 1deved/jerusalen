/**
 * students.js — Gestión de estudiantes (CRUD)
 */

let allStudents = [];

// ── Cargar y renderizar lista ────────────────────────────────────────────────
async function loadStudents() {
  showTableLoading("students-tbody", 5);
  try {
    const data = await apiGet("getStudents");
    allStudents = data.students || [];
    renderStudents(allStudents);
  } catch (err) {
    showTableEmpty("students-tbody", 5, "Error al cargar estudiantes: " + err.message);
    showToast("Error al cargar estudiantes", "error");
  }
}

function renderStudents(list) {
  const tbody = document.getElementById("students-tbody");
  if (!tbody) return;

  if (!list.length) {
    showTableEmpty("students-tbody", 5, "No hay estudiantes registrados.");
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td>
        <div class="name-cell">
          <div class="avatar">${getInitials(s.nombre)}</div>
          <div>
            <div class="font-bold text-sm">${s.nombre}</div>
            <div class="text-xs text-muted">Doc: ${s.documento}</div>
          </div>
        </div>
      </td>
      <td>${s.documento}</td>
      <td><span class="badge badge-blue">${s.grado}</span></td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline" onclick="openEditStudent('${s.id}')">✏️ Editar</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteStudent('${s.id}')">🗑️</button>
      </td>
    </tr>
  `).join("");
}

// ── Abrir modal de creación ──────────────────────────────────────────────────
function openCreateStudent() {
  document.getElementById("student-form").reset();
  document.getElementById("student-id").value = "";
  document.getElementById("student-modal-title").textContent = "Nuevo Estudiante";
  openModal("student-modal");
}

// ── Abrir modal de edición ───────────────────────────────────────────────────
function openEditStudent(id) {
  const s = allStudents.find(x => x.id === id);
  if (!s) return;

  document.getElementById("student-id").value       = s.id;
  document.getElementById("student-nombre").value   = s.nombre;
  document.getElementById("student-doc").value      = s.documento;
  document.getElementById("student-grado").value    = s.grado;
  document.getElementById("student-modal-title").textContent = "Editar Estudiante";
  openModal("student-modal");
}

// ── Guardar (crear o actualizar) ─────────────────────────────────────────────
async function saveStudent() {
  const id       = document.getElementById("student-id").value;
  const nombre   = document.getElementById("student-nombre").value.trim();
  const documento = document.getElementById("student-doc").value.trim();
  const grado    = document.getElementById("student-grado").value.trim();
  const btn      = document.getElementById("btn-save-student");

  if (!nombre || !documento || !grado) {
    showToast("Todos los campos son obligatorios.", "warning");
    return;
  }

  // Validar duplicado (solo en creación)
  if (!id && allStudents.some(s => s.documento === documento)) {
    showToast("Ya existe un estudiante con ese documento.", "error");
    return;
  }

  const originalText = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    if (id) {
      await apiPost("updateStudent", { id, nombre, documento, grado });
      showToast("Estudiante actualizado correctamente.", "success");
    } else {
      await apiPost("createStudent", { nombre, documento, grado });
      showToast("Estudiante registrado correctamente.", "success");
    }
    closeModal("student-modal");
    loadStudents();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

// ── Eliminar ─────────────────────────────────────────────────────────────────
async function deleteStudent(id) {
  if (!confirmDelete("¿Eliminar este estudiante y todas sus notas?")) return;
  try {
    await apiPost("deleteStudent", { id });
    showToast("Estudiante eliminado.", "info");
    loadStudents();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

// ── Buscar estudiante existente por documento (para usar en otros módulos) ───
async function searchStudentByDoc(doc) {
  return allStudents.find(s => s.documento === doc) || null;
}

// ── Obtener todos los estudiantes (caché) ─────────────────────────────────────
function getAllStudents() { return allStudents; }

// Exponer
window.loadStudents     = loadStudents;
window.renderStudents   = renderStudents;
window.openCreateStudent = openCreateStudent;
window.openEditStudent  = openEditStudent;
window.saveStudent      = saveStudent;
window.deleteStudent    = deleteStudent;
window.searchStudentByDoc = searchStudentByDoc;
window.getAllStudents    = getAllStudents;

// Función para actualizar la caché de estudiantes (usada por otros módulos)
function setAllStudents(students) {
  allStudents = students;
}
window.setAllStudents = setAllStudents;
