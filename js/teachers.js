/**
 * teachers.js — Gestión de profesores (CRUD)
 */

let allTeachers = [];

async function loadTeachers() {
  showTableLoading("teachers-tbody", 4);
  try {
    const data = await apiGet("getTeachers");
    allTeachers = data.teachers || [];
    renderTeachers(allTeachers);
  } catch (err) {
    showTableEmpty("teachers-tbody", 4, "Error al cargar profesores: " + err.message);
    showToast("Error al cargar profesores", "error");
  }
}

function renderTeachers(list) {
  const tbody = document.getElementById("teachers-tbody");
  if (!tbody) return;

  if (!list.length) {
    showTableEmpty("teachers-tbody", 4, "No hay profesores registrados.");
    return;
  }

  tbody.innerHTML = list.map(t => `
    <tr>
      <td>
        <div class="name-cell">
          <div class="avatar" style="background: var(--amber-100); color: var(--amber-500)">
            ${getInitials(t.nombre)}
          </div>
          <div>
            <div class="font-bold text-sm">${t.nombre}</div>
          </div>
        </div>
      </td>
      <td>${t.documento}</td>
      <td>
        ${(t.materias || []).map(m => `<span class="badge badge-blue" style="margin:2px">${m}</span>`).join("") || '<span class="text-muted text-xs">Sin materias asignadas</span>'}
      </td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline" onclick="openEditTeacher('${t.id}')">✏️ Editar</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteTeacher('${t.id}')">🗑️</button>
      </td>
    </tr>
  `).join("");
}

function openCreateTeacher() {
  document.getElementById("teacher-form").reset();
  document.getElementById("teacher-id").value = "";
  document.getElementById("teacher-modal-title").textContent = "Nuevo Profesor";
  openModal("teacher-modal");
}

function openEditTeacher(id) {
  const t = allTeachers.find(x => x.id === id);
  if (!t) return;
  document.getElementById("teacher-id").value     = t.id;
  document.getElementById("teacher-nombre").value = t.nombre;
  document.getElementById("teacher-doc").value    = t.documento;
  document.getElementById("teacher-modal-title").textContent = "Editar Profesor";
  openModal("teacher-modal");
}

async function saveTeacher() {
  const id       = document.getElementById("teacher-id").value;
  const nombre   = document.getElementById("teacher-nombre").value.trim();
  const documento = document.getElementById("teacher-doc").value.trim();
  const btn      = document.getElementById("btn-save-teacher");

  if (!nombre || !documento) {
    showToast("Todos los campos son obligatorios.", "warning");
    return;
  }

  if (!id && allTeachers.some(t => t.documento === documento)) {
    showToast("Ya existe un profesor con ese documento.", "error");
    return;
  }

  const originalText = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    if (id) {
      await apiPost("updateTeacher", { id, nombre, documento });
      showToast("Profesor actualizado.", "success");
    } else {
      await apiPost("createTeacher", { nombre, documento });
      showToast("Profesor registrado.", "success");
    }
    closeModal("teacher-modal");
    loadTeachers();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

async function deleteTeacher(id) {
  if (!confirmDelete("¿Eliminar este profesor?")) return;
  try {
    await apiPost("deleteTeacher", { id });
    showToast("Profesor eliminado.", "info");
    loadTeachers();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

function getAllTeachers() { return allTeachers; }

// Llenar un <select> con profesores
function populateTeacherSelect(selectEl, selectedId = "") {
  selectEl.innerHTML = '<option value="">— Seleccionar profesor —</option>';
  allTeachers.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.nombre;
    if (t.id === selectedId) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

window.loadTeachers        = loadTeachers;
window.renderTeachers      = renderTeachers;
window.openCreateTeacher   = openCreateTeacher;
window.openEditTeacher     = openEditTeacher;
window.saveTeacher         = saveTeacher;
window.deleteTeacher       = deleteTeacher;
window.getAllTeachers       = getAllTeachers;
window.populateTeacherSelect = populateTeacherSelect;

// Función para cargar/actualizar la lista global de profesores (sin renderizar tabla)
async function loadTeachersData() {
  try {
    const data = await apiGet("getTeachers");
    allTeachers = data.teachers || [];
  } catch (err) {
    console.error("Error al cargar datos de profesores:", err);
    showToast("Error al cargar datos de profesores para el selector.", "error");
  }
}
window.loadTeachersData = loadTeachersData;

// Función para actualizar la caché de profesores (usada por otros módulos)
function setAllTeachers(teachers) {
  allTeachers = teachers;
}
window.setAllTeachers = setAllTeachers;
