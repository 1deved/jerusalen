/**
 * grades.js — Registro de notas con flujo dinámico
 */

let gradeStudentRows = []; // Lista de estudiantes en el formulario de notas

// ── Inicializar página de notas ──────────────────────────────────────────────
async function initGradesPage(session) {
  const teacherSel = document.getElementById("grade-teacher");
  const subjectSel = document.getElementById("grade-subject");

  const teachers = getAllTeachers(); // Ahora ya estarán cargados
  const subjects = getAllSubjects(); // Ahora ya estarán cargados

  // Si es profesor: filtrar solo su usuario
  if (session.role === "profesor") {
    const myTeacher = teachers.find(t => t.documento === session.documento);
    teacherSel.innerHTML = myTeacher
      ? `<option value="${myTeacher.id}">${myTeacher.nombre}</option>`
      : `<option value="">Sin profesor vinculado</option>`;
    teacherSel.disabled = true;
    filterSubjectsForTeacher(myTeacher?.id || "");
  } else {
    teacherSel.innerHTML = '<option value="">— Seleccionar profesor —</option>';
    teachers.forEach(t => {
      const o = document.createElement("option");
      o.value = t.id; o.textContent = t.nombre;
      teacherSel.appendChild(o);
    });
  }

  teacherSel.addEventListener("change", () => {
    filterSubjectsForTeacher(teacherSel.value);
  });

  subjectSel.addEventListener("change", () => {
    if (subjectSel.value) loadExistingGrades(subjectSel.value);
  });

  // Listener para actualizar sugerencias de estudiantes cuando cambia el grado
  const levelInput = document.getElementById("grade-level");
  if (levelInput) {
    levelInput.addEventListener("input", updateStudentSuggestions);
  }

  // Listener para el buscador de estudiantes (Paso 2)
  const studentSearch = document.getElementById("grade-student-search");
  if (studentSearch) {
    studentSearch.addEventListener("input", updateStudentSuggestions);
  }

  // Poblar sugerencias de grados existentes
  populateGradeSuggestions();
}

// ── Filtrar materias según el profesor elegido ───────────────────────────────
function filterSubjectsForTeacher(teacherId) {
  const subjectSel = document.getElementById("grade-subject");
  subjectSel.innerHTML = '<option value="">— Seleccionar materia —</option>';

  const subs = getSubjectsByTeacher(teacherId);
  subs.forEach(s => {
    const o = document.createElement("option");
    o.value = s.id; o.textContent = s.nombre;
    subjectSel.appendChild(o);
  });

  // Limpiar lista de estudiantes
  gradeStudentRows = [];
  renderGradeRows();
}

// ── Cargar notas existentes para la materia ──────────────────────────────────
async function loadExistingGrades(subjectId) {
  try {
    const data = await apiGet("getGradesBySubject", { subjectId });
    const grades = data.grades || [];
    gradeStudentRows = grades.map(g => ({
      student_id: g.student_id,
      nombre:     g.studentName,
      nota1:      g.nota1 || "",
      nota2:      g.nota2 || "",
      nota3:      g.nota3 || "",
      promedio:   g.promedio || "",
      gradeId:    g.id,
    }));
    renderGradeRows();
  } catch (err) {
    showToast("Error al cargar notas: " + err.message, "error");
  }
}

// ── Agregar estudiante al formulario de notas ────────────────────────────────
function addStudentToGrades() {
  const doc   = document.getElementById("grade-student-search").value.trim();
  const nombre = document.getElementById("grade-student-name").value.trim();

  if (!doc || !nombre) {
    showToast("Completa documento y nombre del estudiante.", "warning");
    return;
  }

  // Evitar duplicado en la tabla
  if (gradeStudentRows.some(r => r.documento === doc)) {
    showToast("Este estudiante ya está en la lista.", "warning");
    return;
  }

  gradeStudentRows.push({
    documento: doc,
    nombre:    nombre,
    student_id: document.getElementById("grade-student-id").value || null,
    nota1: "", nota2: "", nota3: "", promedio: "",
    gradeId: null,
  });

  // Limpiar campos de búsqueda
  document.getElementById("grade-student-search").value = "";
  document.getElementById("grade-student-name").value   = "";
  document.getElementById("grade-student-id").value     = "";
  document.getElementById("grade-student-grado").value  = "";

  renderGradeRows();
}

// ── Buscar estudiante por documento ──────────────────────────────────────────
async function lookupStudentByDoc(btn) {
  const doc = document.getElementById("grade-student-search").value.trim();
  if (!doc) return;

  // Feedback visual de carga
  const searchBtn = btn || document.getElementById("btn-lookup-student");
  const originalText = searchBtn ? searchBtn.innerHTML : "🔍";
  if (searchBtn) setButtonLoading(searchBtn, true, originalText, "");

  try {
    // Intentar buscar en caché local primero para mayor rapidez
    const localStudent = (typeof getAllStudents === 'function' ? getAllStudents() : [])
      .find(s => String(s.documento) === String(doc));

    let s = localStudent;
    if (!s) {
      const data = await apiGet("getStudentByDoc", { documento: doc });
      s = data.student;
    }

    if (s) {
      document.getElementById("grade-student-name").value  = s.nombre;
      document.getElementById("grade-student-id").value    = s.id;
      document.getElementById("grade-student-grado").value = s.grado;
    } else {
      document.getElementById("grade-student-name").value  = "";
      document.getElementById("grade-student-id").value    = "";
      showToast("Estudiante no encontrado. Completa el nombre para crearlo.", "info");
    }
  } catch (err) {
    showToast("Error buscando estudiante: " + err.message, "error");
  } finally {
    if (searchBtn) setButtonLoading(searchBtn, false, originalText);
  }
}

// ── Actualizar datalist de sugerencias según el grado ────────────────────────
function updateStudentSuggestions() {
  const grado = document.getElementById("grade-level").value.trim().toLowerCase();
  const datalist = document.getElementById("students-datalist");
  if (!datalist) return;

  datalist.innerHTML = "";
  const students = typeof getAllStudents === 'function' ? getAllStudents() : [];

  // Filtrar estudiantes: 
  // Si hay grado escrito, mostrar solo de ese grado.
  // Si no hay grado, mostrar todos para facilitar la búsqueda.
  const filtered = grado 
    ? students.filter(s => s.grado && s.grado.toLowerCase().includes(grado))
    : students;

  filtered.forEach(s => {
    const option = document.createElement("option");
    // El valor es el documento (lo que se escribe al elegir)
    option.value = s.documento;
    // El texto/label ayuda a identificar al estudiante por nombre
    option.label = `${s.nombre} (${s.grado || 'Sin grado'})`;
    datalist.appendChild(option);
  });
}

// ── Renderizar filas de la tabla de notas ────────────────────────────────────
function renderGradeRows() {
  const tbody = document.getElementById("grade-rows");
  if (!tbody) return;

  if (!gradeStudentRows.length) {
    tbody.innerHTML = `
      <tr id="grade-empty-row">
        <td colspan="6">
          <div class="table-empty">
            <div class="empty-icon">📋</div>
            <p>Agrega estudiantes para registrar sus notas.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = gradeStudentRows.map((row, idx) => `
    <tr>
      <td>
        <div class="name-cell">
          <div class="avatar avatar-sm">${getInitials(row.nombre)}</div>
          <span class="text-sm font-bold">${row.nombre}</span>
        </div>
      </td>
      <td><input type="number" class="form-control grade-input" min="0" max="10" step="0.1"
           value="${row.nota1}" oninput="updateGradeRow(${idx},1,this.value)" placeholder="0.0"></td>
      <td><input type="number" class="form-control grade-input" min="0" max="10" step="0.1"
           value="${row.nota2}" oninput="updateGradeRow(${idx},2,this.value)" placeholder="0.0"></td>
      <td><input type="number" class="form-control grade-input" min="0" max="10" step="0.1"
           value="${row.nota3}" oninput="updateGradeRow(${idx},3,this.value)" placeholder="0.0"></td>
      <td id="avg-${idx}">${formatGrade(row.promedio)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removeGradeRow(${idx})">✕</button>
      </td>
    </tr>
  `).join("");
}

// ── Actualizar nota y recalcular promedio ─────────────────────────────────────
function updateGradeRow(idx, corte, value) {
  const row = gradeStudentRows[idx];
  if (!row) return;
  row[`nota${corte}`] = value;

  const vals = [row.nota1, row.nota2, row.nota3]
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);

  row.promedio = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "";
  const avgEl = document.getElementById(`avg-${idx}`);
  if (avgEl) avgEl.innerHTML = formatGrade(row.promedio);
}

function removeGradeRow(idx) {
  gradeStudentRows.splice(idx, 1);
  renderGradeRows();
}

// ── Guardar todas las notas ───────────────────────────────────────────────────
async function saveAllGrades() {
  const subjectId = document.getElementById("grade-subject").value;
  const grado     = document.getElementById("grade-level").value.trim();
  const btn       = document.getElementById("btn-save-grades");

  if (!subjectId) {
    showToast("Selecciona una materia.", "warning");
    return;
  }
  if (!gradeStudentRows.length) {
    showToast("Agrega al menos un estudiante.", "warning");
    return;
  }

  const originalText = btn.innerHTML;
  setButtonLoading(btn, true);

  try {
    const payload = {
      subjectId,
      grado,
      grades: gradeStudentRows.map(r => ({
        student_id: r.student_id || null,
        nombre:     r.nombre,
        documento:  r.documento || "",
        nota1:      r.nota1 || 0,
        nota2:      r.nota2 || 0,
        nota3:      r.nota3 || 0,
        promedio:   r.promedio || 0,
        gradeId:    r.gradeId || null,
      })),
    };

    await apiPost("saveGrades", payload);
    showToast("¡Notas guardadas exitosamente!", "success");
    loadExistingGrades(subjectId);
  } catch (err) {
    showToast("Error guardando notas: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

// ── Poblar sugerencias de grados existentes ──────────────────────────────────
function populateGradeSuggestions() {
  const students = typeof getAllStudents === 'function' ? getAllStudents() : [];
  // Obtener lista de grados únicos y filtrar vacíos
  const uniqueGrades = [...new Set(students.map(s => s.grado).filter(g => g))];
  const dl = document.getElementById("grades-datalist");
  if (!dl) return;

  dl.innerHTML = uniqueGrades.map(g => `<option value="${g}">`).join("");
}

window.initGradesPage       = initGradesPage;
window.filterSubjectsForTeacher = filterSubjectsForTeacher;
window.loadExistingGrades   = loadExistingGrades;
window.addStudentToGrades   = addStudentToGrades;
window.lookupStudentByDoc   = lookupStudentByDoc;
window.renderGradeRows      = renderGradeRows;
window.updateGradeRow       = updateGradeRow;
window.removeGradeRow       = removeGradeRow;
window.saveAllGrades        = saveAllGrades;
window.updateStudentSuggestions = updateStudentSuggestions;
window.updateStudentSuggestions = updateStudentSuggestions;
window.populateGradeSuggestions = populateGradeSuggestions;
