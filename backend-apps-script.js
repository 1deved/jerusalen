/**
 * ============================================================
 * SISTEMA ACADÉMICO — BACKEND (Google Apps Script)
 * ============================================================
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet.
 * 2. Ve a Extensiones → Apps Script.
 * 3. Pega todo este código en el editor.
 * 4. Haz clic en "Implementar" → "Nueva implementación".
 * 5. Tipo: Aplicación web / Acceso: Cualquier persona.
 * 6. Copia la URL generada y pégala en /js/api.js → API_URL.
 *
 * HOJAS REQUERIDAS (se crean automáticamente):
 *   users | students | teachers | subjects | grades
 * ============================================================
 */

// ── ID de tu Google Spreadsheet ─────────────────────────────────────────────
// (Se obtiene de la URL: .../spreadsheets/d/ID/edit)
const SPREADSHEET_ID = "1nwbopTEQo_cu0vVYPoKwhGsRQQechx2uOGH70r2c68E";

// ── Nombres de hojas ─────────────────────────────────────────────────────────
const SHEETS = {
  users: "users",
  students: "students",
  teachers: "teachers",
  subjects: "subjects",
  grades: "grades",
};

// ── Cabeceras de cada hoja ────────────────────────────────────────────────────
const HEADERS = {
  users: ["id", "username", "password", "role", "documento"],
  students: ["id", "nombre", "documento", "grado"],
  teachers: ["id", "nombre", "documento"],
  subjects: ["id", "nombre", "teacher_id"],
  grades: [
    "id",
    "student_id",
    "subject_id",
    "student_nombre",
    "subject_nombre",
    "grado",
    "nota1",
    "nota2",
    "nota3",
    "nota4",
    "inas",
    "promedio",
  ],
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name] || []);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data
    .slice(1)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    })
    .filter((obj) => obj.id && String(obj.id).trim() !== ""); // Omitir filas vacías o con ID en blanco
}

function generateId() {
  return Utilities.getUuid().substring(0, 8);
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAR HOJAS Y USUARIO ADMIN POR DEFECTO
// ═══════════════════════════════════════════════════════════

function initializeSheets() {
  Object.keys(SHEETS).forEach((name) => {
    const sheet = getSheet(name);
    // Asegurar que las cabeceras en la hoja coincidan exactamente con la definición actual de HEADERS
    sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  });

  // Crear usuario admin por defecto si no existe
  const usersSheet = getSheet(SHEETS.users);
  const users = sheetToObjects(usersSheet);
  if (!users.some((u) => u.username === "admin")) {
    usersSheet.appendRow([generateId(), "admin", "admin123", "admin", ""]);
  }
  if (!users.some((u) => u.username === "profesor1")) {
    usersSheet.appendRow([
      generateId(),
      "profesor1",
      "prof123",
      "profesor",
      "",
    ]);
  }
  return { ok: true };
}

function authorizeServices() {
  // Forzamos la detección de scopes de lectura, creación y copia
  DriveApp.getRootFolder();
  const dummyFile = DriveApp.createFile("TEMP_AUTH", "test");
  
  // Forzamos la detección del scope de Google Documents
  const tempDoc = DocumentApp.create("TEMP_DOC_AUTH");
  DriveApp.getFileById(tempDoc.getId()).setTrashed(true);
  
  dummyFile.setTrashed(true);
  console.log("Servicios autorizados correctamente.");
}

// ═══════════════════════════════════════════════════════════
// ENRUTADOR PRINCIPAL
// ═══════════════════════════════════════════════════════════

function doGet(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;
    let result;

    switch (action) {
      case "getStudents":
        result = getStudents();
        break;
      case "getTeachers":
        result = getTeachers();
        break;
      case "getSubjects":
        result = getSubjects();
        break;
      case "getGradesBySubject":
        result = getGradesBySubject(params.subjectId);
        break;
      case "getStudentByDoc":
        result = getStudentByDoc(params.documento);
        break;
      case "getStudentReport":
        result = getStudentReport(params.studentId);
        break;
      case "generateBulletin":
        result = generateBulletin(params);
        break;
      case "getDashboardStats":
        result = getDashboardStats();
        break;
      case "initSheets":
        result = initializeSheets();
        break;
      default:
        result = { error: "Acción no reconocida: " + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action } = body;
    let result;

    switch (action) {
      // Auth
      case "login":
        result = login(body);
        break;
      // Students
      case "createStudent":
        result = createStudent(body);
        break;
      case "updateStudent":
        result = updateStudent(body);
        break;
      case "deleteStudent":
        result = deleteRecord(SHEETS.students, body.id);
        break;
      // Teachers
      case "createTeacher":
        result = createTeacher(body);
        break;
      case "updateTeacher":
        result = updateTeacher(body);
        break;
      case "deleteTeacher":
        result = deleteRecord(SHEETS.teachers, body.id);
        break;
      // Subjects
      case "createSubject":
        result = createSubject(body);
        break;
      case "updateSubject":
        result = updateSubject(body);
        break;
      case "deleteSubject":
        result = deleteRecord(SHEETS.subjects, body.id);
        break;
      // Grades
      case "saveGrades":
        result = saveGrades(body);
        break;
      default:
        result = { error: "Acción no reconocida: " + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════

function login({ username, password }) {
  const sheet = getSheet(SHEETS.users);
  const users = sheetToObjects(sheet);
  const user = users.find(
    (u) =>
      String(u.username).toLowerCase() === String(username).toLowerCase() &&
      String(u.password) === String(password),
  );

  if (!user)
    return { success: false, message: "Usuario o contraseña incorrectos." };

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      documento: user.documento || "",
    },
  };
}

// ═══════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════

function getStudents() {
  const sheet = getSheet(SHEETS.students);
  const students = sheetToObjects(sheet);
  return { students };
}

function getStudentByDoc(documento) {
  const sheet = getSheet(SHEETS.students);
  const students = sheetToObjects(sheet);
  const student =
    students.find((s) => String(s.documento) === String(documento)) || null;
  return { student };
}

function createStudent({ nombre, documento, grado }) {
  const sheet = getSheet(SHEETS.students);
  const students = sheetToObjects(sheet);

  if (students.some((s) => String(s.documento) === String(documento))) {
    return { error: "Ya existe un estudiante con ese documento." };
  }

  const id = generateId();
  sheet.appendRow([id, nombre, documento, grado]);
  return { success: true, id };
}

function updateStudent({ id, nombre, documento, grado }) {
  const sheet = getSheet(SHEETS.students);
  const row = findRowById(sheet, id);
  if (row < 0) return { error: "Estudiante no encontrado." };
  sheet.getRange(row, 1, 1, 4).setValues([[id, nombre, documento, grado]]);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// TEACHERS
// ═══════════════════════════════════════════════════════════

function getTeachers() {
  const tSheet = getSheet(SHEETS.teachers);
  const sSheet = getSheet(SHEETS.subjects);
  const teachers = sheetToObjects(tSheet);
  const subjects = sheetToObjects(sSheet);

  // Añadir materias asignadas a cada profesor
  const result = teachers.map((t) => ({
    ...t,
    materias: subjects
      .filter((s) => String(s.teacher_id) === String(t.id))
      .map((s) => s.nombre),
  }));

  return { teachers: result };
}

function createTeacher({ nombre, documento }) {
  const sheet = getSheet(SHEETS.teachers);
  const teachers = sheetToObjects(sheet);

  if (teachers.some((t) => String(t.documento) === String(documento))) {
    return { error: "Ya existe un profesor con ese documento." };
  }

  const id = generateId();
  sheet.appendRow([id, nombre, documento]);
  return { success: true, id };
}

function updateTeacher({ id, nombre, documento }) {
  const sheet = getSheet(SHEETS.teachers);
  const row = findRowById(sheet, id);
  if (row < 0) return { error: "Profesor no encontrado." };
  sheet.getRange(row, 1, 1, 3).setValues([[id, nombre, documento]]);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════

function getSubjects() {
  const sSheet = getSheet(SHEETS.subjects);
  const tSheet = getSheet(SHEETS.teachers);
  const subjects = sheetToObjects(sSheet);
  const teachers = sheetToObjects(tSheet);

  // Añadir nombre del profesor
  const result = subjects.map((s) => {
    const teacher = teachers.find((t) => String(t.id) === String(s.teacher_id));
    return { ...s, teacherName: teacher ? teacher.nombre : "—" };
  });

  return { subjects: result };
}

function createSubject({ nombre, teacher_id }) {
  const sheet = getSheet(SHEETS.subjects);
  const id = generateId();
  sheet.appendRow([id, nombre, teacher_id]);
  return { success: true, id };
}

function updateSubject({ id, nombre, teacher_id }) {
  const sheet = getSheet(SHEETS.subjects);
  const row = findRowById(sheet, id);
  if (row < 0) return { error: "Materia no encontrada." };
  sheet.getRange(row, 1, 1, 3).setValues([[id, nombre, teacher_id]]);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// GRADES
// ═══════════════════════════════════════════════════════════

function getGradesBySubject(subjectId) {
  const gSheet = getSheet(SHEETS.grades);
  const sSheet = getSheet(SHEETS.students);
  const grades = sheetToObjects(gSheet);
  const students = sheetToObjects(sSheet);

  const filtered = grades
    .filter((g) => String(g.subject_id) === String(subjectId))
    .map((g) => {
      const student = students.find(
        (s) => String(s.id) === String(g.student_id),
      );
      return { 
        ...g, 
        studentName: student ? student.nombre : (g.student_nombre || "—"),
        documento: student ? student.documento : "" 
      };
    });

  return { grades: filtered };
}

/**
 * Guardar (crear o actualizar) notas de múltiples estudiantes en una materia.
 * Si el estudiante no existe aún → se crea automáticamente.
 */
function saveGrades({ subjectId, grado, grades }) {
  const gSheet = getSheet(SHEETS.grades);
  const sSheet = getSheet(SHEETS.students);
  const subSheet = getSheet(SHEETS.subjects);
  const allGrades = sheetToObjects(gSheet);
  const allStudents = sheetToObjects(sSheet);
  const allSubjects = sheetToObjects(subSheet);

  const subject = allSubjects.find(s => String(s.id) === String(subjectId));

  grades.forEach((g) => {
    let studentId = g.student_id;

    // Crear estudiante si no existe
    if (!studentId && g.documento) {
      const existing = allStudents.find(
        (s) => String(s.documento) === String(g.documento),
      );
      if (existing) {
        studentId = existing.id;
      } else {
        studentId = generateId();
        sSheet.appendRow([studentId, g.nombre, g.documento, grado || ""]);
        allStudents.push({
          id: studentId,
          nombre: g.nombre,
          documento: g.documento,
          grado,
        });
      }
    }

    const student = allStudents.find(s => String(s.id) === String(studentId));
    const studentName = student ? student.nombre : g.nombre;
    const currentGrado = student ? student.grado : (grado || "");
    const subjectName = subject ? subject.nombre : "";

    const promedio = calcAverage(g.nota1, g.nota2, g.nota3, g.nota4);

    if (g.gradeId) {
      // Actualizar nota existente
      const row = findRowById(gSheet, g.gradeId);
      if (row > 0) {
        gSheet
          .getRange(row, 1, 1, 12)
          .setValues([
            [
              g.gradeId,
              studentId,
              subjectId,
              studentName,
              subjectName,
              currentGrado,
              g.nota1,
              g.nota2,
              g.nota3,
              g.nota4,
              g.inas,
              promedio,
            ],
          ]);
      }
    } else {
      // Verificar si ya existe nota para este estudiante en esta materia
      const existing = allGrades.find(
        (r) =>
          String(r.student_id) === String(studentId) &&
          String(r.subject_id) === String(subjectId),
      );
      if (existing) {
        const row = findRowById(gSheet, existing.id);
        if (row > 0) {
          gSheet
            .getRange(row, 1, 1, 12)
            .setValues([
              [
                existing.id,
                studentId,
                subjectId,
                studentName,
                subjectName,
                currentGrado,
                g.nota1,
                g.nota2,
                g.nota3,
                g.nota4,
                g.inas,
                promedio,
              ],
            ]);
        }
      } else {
        const id = generateId();
        gSheet.appendRow([
          id,
          studentId,
          subjectId,
          studentName,
          subjectName,
          currentGrado,
          g.nota1,
          g.nota2,
          g.nota3,
          g.nota4,
          g.inas,
          promedio,
        ]);
        allGrades.push({ id, student_id: studentId, subject_id: subjectId });
      }
    }
  });

  return { success: true };
}

function calcAverage(...vals) {
  const nums = vals.filter(v => v !== "" && v !== null && v !== undefined).map(Number).filter(n => !isNaN(n));
  if (!nums.length) return 0;
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
}

// ═══════════════════════════════════════════════════════════
// STUDENT REPORT (para boletín)
// ═══════════════════════════════════════════════════════════

function getStudentReport(studentId) {
  const sSheet = getSheet(SHEETS.students);
  const gSheet = getSheet(SHEETS.grades);
  const subSheet = getSheet(SHEETS.subjects);
  const tSheet = getSheet(SHEETS.teachers);

  const students = sheetToObjects(sSheet);
  const grades = sheetToObjects(gSheet);
  const subjects = sheetToObjects(subSheet);
  const teachers = sheetToObjects(tSheet);

  const student = students.find((s) => String(s.id) === String(studentId));
  if (!student) return { error: "Estudiante no encontrado." };

  const studentGrades = grades
    .filter((g) => String(g.student_id) === String(studentId))
    .map((g) => {
      const subject = subjects.find(
        (s) => String(s.id) === String(g.subject_id),
      );
      const teacher = subject
        ? teachers.find((t) => String(t.id) === String(subject.teacher_id))
        : null;
      return {
        ...g,
        subjectName: subject ? subject.nombre : "—",
        teacherName: teacher ? teacher.nombre : "—",
      };
    });

  return { student, grades: studentGrades };
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

function getDashboardStats() {
  const students = sheetToObjects(getSheet(SHEETS.students));
  const teachers = sheetToObjects(getSheet(SHEETS.teachers));
  const subjects = sheetToObjects(getSheet(SHEETS.subjects));
  const grades = sheetToObjects(getSheet(SHEETS.grades));

  // Últimas 5 notas
  const recentGrades = grades
    .slice(-5)
    .reverse()
    .map((g) => {
      const student = students.find(
        (s) => String(s.id) === String(g.student_id),
      );
      const subject = subjects.find(
        (s) => String(s.id) === String(g.subject_id),
      );
      return {
        studentName: student ? student.nombre : "—",
        subjectName: subject ? subject.nombre : "—",
        promedio: g.promedio,
      };
    });

  return {
    students: students.length,
    teachers: teachers.length,
    subjects: subjects.length,
    grades: grades.length,
    recentGrades,
  };
}

// ═══════════════════════════════════════════════════════════
// DELETE GENÉRICO
// ═══════════════════════════════════════════════════════════

function deleteRecord(sheetName, id) {
  const sheet = getSheet(sheetName);
  const row = findRowById(sheet, id);
  if (row < 0) return { error: "Registro no encontrado." };
  sheet.deleteRow(row);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// GENERACIÓN DE BOLETÍN EN DOCX
// Agrega estas funciones al final de tu backend-apps-script.js
// Y agrega el caso "generateBulletin" en el switch de doGet()
// ═══════════════════════════════════════════════════════════

// ID de la plantilla en Google Docs
const TEMPLATE_DOC_ID = "1dWHkW9nswewX89aO3gvGpzGJyxMspGtYYIzgY3NBVgI";

/**
 * Genera el boletín llenando la plantilla con los datos del estudiante.
 * Retorna una URL de descarga temporal del archivo .docx
 */
function generateBulletin(params) {
  const studentId = params.studentId;
  const periodo = params.periodo || "Periodo 1 - 2025";

  // 1. Obtener datos del estudiante y sus notas
  const reportData = getStudentReport(studentId);
  if (reportData.error) return { error: reportData.error };

  const { student, grades } = reportData;

  // 2. Construir mapa de marcadores → valores
  const markers = buildMarkers(student, grades, periodo);

  // 3. Copiar la plantilla a una versión temporal
  const templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const tempName =
    "Boletin_" + student.nombre.replace(/ /g, "_") + "_" + Date.now();
  const tempFile = templateFile.makeCopy(tempName, DriveApp.getRootFolder());
  const tempDoc = DocumentApp.openById(tempFile.getId());
  const body = tempDoc.getBody();

  // 4. Reemplazar todos los marcadores en el documento
  Object.entries(markers).forEach(([marker, value]) => {
    body.replaceText(marker, value || "");
  });

  tempDoc.saveAndClose();

  // 5. Exportar como .docx usando UrlFetchApp (más estable que getAs)
  const urlExport = "https://docs.google.com/feeds/download/documents/export/Export?id=" + tempFile.getId() + "&exportFormat=docx";
  const docxBlob = UrlFetchApp.fetch(urlExport, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
  }).getBlob();
  
  docxBlob.setName("Boletin_" + student.nombre + ".docx");

  // Guardar el .docx en Drive temporalmente
  const outputFolder = getOrCreateFolder("Boletines_Generados");
  const existingFiles = outputFolder.getFilesByName(docxBlob.getName());
  while (existingFiles.hasNext()) existingFiles.next().setTrashed(true); // eliminar versión anterior

  const docxFile = outputFolder.createFile(docxBlob);
  docxFile.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW,
  );

  // Eliminar el Google Doc temporal (ya no lo necesitamos)
  tempFile.setTrashed(true);

  // 6. Retornar URL de descarga directa
  const fileId = docxFile.getId();
  const downloadUrl =
    "https://drive.google.com/uc?export=download&id=" + fileId;

  return {
    success: true,
    url: downloadUrl,
    fileId: fileId,
    nombre: student.nombre,
  };
}

/**
 * Construye el mapa completo de marcadores con los valores reales.
 */
function buildMarkers(student, grades, periodo) {
  const result = {
    "\\{\\{NOMBRE\\}\\}": student.nombre || "",
    "\\{\\{GRADO\\}\\}": student.grado || "",
    "\\{\\{NRO_MATRICULA\\}\\}": student.documento || "",
    "\\{\\{PERIODO\\}\\}": periodo,
  };

  // Definición de sufijos y patrones de búsqueda para las materias
  const areaMapping = [
    { suffix: "MAT", search: "MATEMAT" },
    { suffix: "HUM", search: "HUMANIDAD" },
    { suffix: "ING", search: "INGLES" },
    { suffix: "ESP", search: "ESPA" },
    { suffix: "CN",  search: "NATURAL" },
    { suffix: "CS",  search: "SOCIAL" },
    { suffix: "ETI", search: "ETICA" },
    { suffix: "TEC", search: "TECNOL" },
    { suffix: "EF",  search: "FISICA" },
    { suffix: "EA",  search: "ARTIS" },
    { suffix: "CON", search: "CONVIV" },
    { suffix: "COM", search: "COMPROMISO" }
  ];

  // Helper para determinar el nivel de desempeño (DA, DB, DC, DD)
  function getLevel(score) {
    const s = parseFloat(score);
    if (isNaN(s)) return "";
    if (s >= 9.0) return "DA";
    if (s >= 8.0) return "DB";
    if (s >= 6.0) return "DC";
    return "DD";
  }

  areaMapping.forEach(area => {
    // Buscar la materia que coincida con el patrón de búsqueda
    const grade = grades.find(g => 
      g.subjectName && g.subjectName.toUpperCase().includes(area.search)
    );

    // Marcador de compatibilidad (ej: {{NOTA_MATEMATICA}})
    const compatKey = "\\{\\{NOTA_" + (area.search === "MATEMAT" ? "MATEMATICA" : area.search) + "\\}\\}";
    const avgVal = grade && grade.promedio !== "" && !isNaN(parseFloat(grade.promedio)) ? parseFloat(grade.promedio).toFixed(1) : "";
    result[compatKey] = avgVal;

    // Procesar los 4 periodos (P1-P4 y N1-N4)
    for (let p = 1; p <= 4; p++) {
      let val = "";
      if (grade) {
        if (p === 1) val = grade.nota1;
        else if (p === 2) val = grade.nota2;
        else if (p === 3) val = grade.nota3;
        else if (p === 4) val = grade.nota4;
      }

      const isNumeric = val !== "" && val !== null && val !== undefined && !isNaN(parseFloat(val));
      const scoreStr = isNumeric ? parseFloat(val).toFixed(1) : "";
      result["\\{\\{P" + p + "_" + area.suffix + "\\}\\}"] = scoreStr;
      result["\\{\\{N" + p + "_" + area.suffix + "\\}\\}"] = getLevel(scoreStr);
    }

    // Agregar marcador de inasistencias
    result["\\{\\{INAS_" + area.suffix + "\\}\\}"] = grade ? grade.inas || "0" : "0";
  });

  return result;
}

/**
 * Obtiene o crea una carpeta en Drive con el nombre dado.
 */
function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}
