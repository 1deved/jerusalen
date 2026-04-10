/**
 * subjects.js — Gestión de materias (CRUD)
 */

let allSubjects = [];

async function loadSubjects() {
  showTableLoading("subjects-tbody", 4);
  try {
    const data = await apiGet("getSubjects");
    allSubjects = data.subjects || [];
    renderSubjects(allSubjects);
  } catch (err) {
    showTableEmpty("subjects-tbody", 4, "Error al cargar materias: " + err.message);
    showToast("Error al cargar materias", "error");
  }
}

function renderSubjects(list) {
  const tbody = document.getElementById("subjects-tbody");
  if (!tbody) return;

  if (!list.length) {
    showTableEmpty("subjects-tbody", 4, "No hay materias registradas.");
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td>
        <div class="font-bold text-sm">${s.nombre}</div>
      </td>
      <td>
        <div class="name-cell">
          <div class="avatar avatar-sm" style="background: var(--amber-100); color: var(--amber-500)">
            ${getInitials(s.teacherName || "")}
          </div>
          <span class="text-sm">${s.teacherName || "—"}</span>
        </div>
      </td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline" onclick="openEditSubject('${s.id}', this)">✏️ Editar</button>
        <button class="btn btn-sm btn-danger"  onclick="deleteSubject('${s.id}')">🗑️</button>
      </td>
    </tr>
  `).join("");
}

// ── Modal creación/edición ───────────────────────────────────────────────────
async function openCreateSubject(btn) {
  const originalText = btn ? btn.innerHTML : "";
  if (btn) setButtonLoading(btn, true, originalText, "Cargando...");

  document.getElementById("subject-form").reset();
  document.getElementById("subject-id").value = "";
  document.getElementById("subject-modal-title").textContent = "Nueva Materia";

  // Asegurar que los profesores estén cargados antes de mostrar el select
  let teachers = typeof getAllTeachers === 'function' ? getAllTeachers() : [];
  if (!teachers.length) {
    const data = await apiGet("getTeachers");
    teachers = data.teachers || [];
    if (typeof allTeachers !== 'undefined') allTeachers = teachers; // Actualizar caché si existe
  }

  const sel = document.getElementById("subject-teacher");
  sel.innerHTML = '<option value="">— Seleccionar profesor —</option>';
  teachers.forEach(t => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.nombre;
    sel.appendChild(o);
  });

  if (btn) setButtonLoading(btn, false, originalText);
  openModal("subject-modal");
}

async function openEditSubject(id, btn) {
  const s = allSubjects.find(x => x.id === id);
  if (!s) return;

  const originalText = btn ? btn.innerHTML : "";
  if (btn) setButtonLoading(btn, true, originalText, "Cargando...");

  document.getElementById("subject-id").value      = s.id;
  document.getElementById("subject-nombre").value  = s.nombre;
  document.getElementById("subject-modal-title").textContent = "Editar Materia";

  // Asegurar que los profesores estén cargados
  let teachers = typeof getAllTeachers === 'function' ? getAllTeachers() : [];
  if (!teachers.length) {
    const data = await apiGet("getTeachers");
    teachers = data.teachers || [];
    if (typeof allTeachers !== 'undefined') allTeachers = teachers;
  }

  const sel = document.getElementById("subject-teacher");
  sel.innerHTML = '<option value="">— Seleccionar profesor —</option>';
  teachers.forEach(t => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.nombre;
    if (t.id === s.teacher_id) o.selected = true;
    sel.appendChild(o);
  });

  if (btn) setButtonLoading(btn, false, originalText);
  openModal("subject-modal");
}

async function saveSubject() {
  const id         = document.getElementById("subject-id").value;
  const nombre     = document.getElementById("subject-nombre").value.trim();
  const teacher_id = document.getElementById("subject-teacher").value;
  const btn        = document.getElementById("btn-save-subject");

  if (!nombre || !teacher_id) {
    showToast("Todos los campos son obligatorios.", "warning");
    return;
  }

  const originalText = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    if (id) {
      await apiPost("updateSubject", { id, nombre, teacher_id });
      showToast("Materia actualizada.", "success");
    } else {
      await apiPost("createSubject", { nombre, teacher_id });
      showToast("Materia registrada.", "success");
    }
    closeModal("subject-modal");
    loadSubjects();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

async function deleteSubject(id) {
  if (!confirmDelete("¿Eliminar esta materia y sus notas asociadas?")) return;
  try {
    await apiPost("deleteSubject", { id });
    showToast("Materia eliminada.", "info");
    loadSubjects();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

function getAllSubjects() { return allSubjects; }

// Filtrar materias por teacherId
function getSubjectsByTeacher(teacherId) {
  return allSubjects.filter(s => s.teacher_id === teacherId);
}

window.loadSubjects       = loadSubjects;
window.renderSubjects     = renderSubjects;
window.openCreateSubject  = openCreateSubject;
window.openEditSubject    = openEditSubject;
window.saveSubject        = saveSubject;
window.deleteSubject      = deleteSubject;
window.getAllSubjects      = getAllSubjects;
window.getSubjectsByTeacher = getSubjectsByTeacher;

// Función para actualizar la caché de materias (usada por otros módulos)
function setAllSubjects(subjects) {
  allSubjects = subjects;
}
window.setAllSubjects = setAllSubjects;
