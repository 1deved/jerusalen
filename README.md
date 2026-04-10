# 📚 Sistema Académico — Guía de Implementación Completa

## Estructura del Proyecto

```
/project
  /css
    styles.css          ← Todos los estilos del sistema
  /js
    api.js              ← Conexión con Google Apps Script
    auth.js             ← Login, sesión, control de acceso
    ui.js               ← Toasts, modales, helpers de interfaz
    sidebar.js          ← Barra lateral de navegación
    students.js         ← CRUD de estudiantes
    teachers.js         ← CRUD de profesores
    subjects.js         ← CRUD de materias
    grades.js           ← Registro de notas (flujo dinámico)
    report.js           ← Generación de boletines
  index.html            ← Página de LOGIN (punto de entrada)
  dashboard.html        ← Panel principal con estadísticas
  students.html         ← Gestión de estudiantes
  teachers.html         ← Gestión de profesores
  subjects.html         ← Gestión de materias
  grades.html           ← Registro de notas
  report.html           ← Boletines en PDF
  backend-apps-script.js ← Código del backend (Google Apps Script)
```

---

## PASO 1 — Crear el Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Copia el **ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```
3. Las hojas se crean **automáticamente** al hacer el primer deploy, pero si prefieres crearlas manualmente, estas son las columnas:

| Hoja       | Columnas                                                        |
|------------|-----------------------------------------------------------------|
| `users`    | id, username, password, role, documento                        |
| `students` | id, nombre, documento, grado                                   |
| `teachers` | id, nombre, documento                                          |
| `subjects` | id, nombre, teacher_id                                         |
| `grades`   | id, student_id, subject_id, nota1, nota2, nota3, promedio      |

### Usuario inicial en la hoja `users`:
El sistema crea automáticamente estos usuarios al inicializar:

| id   | username   | password | role    | documento |
|------|------------|----------|---------|-----------|
| auto | admin      | admin123 | admin   |           |
| auto | profesor1  | prof123  | profesor|           |

> Puedes agregar más usuarios directamente en la hoja `users` del Sheet.

---

## PASO 2 — Configurar Google Apps Script

1. Dentro de tu Google Sheet, ve a **Extensiones → Apps Script**.
2. Borra el código de ejemplo que aparece.
3. Copia y pega **todo el contenido** del archivo `backend-apps-script.js`.
4. Busca esta línea al inicio y reemplaza con el ID de tu hoja:
   ```javascript
   const SPREADSHEET_ID = "PEGAR_AQUI_EL_ID_DE_TU_GOOGLE_SHEET";
   ```
5. Haz clic en **Guardar** (ícono de disquete o `Ctrl+S`).

---

## PASO 3 — Desplegar como Web App

1. En Apps Script, haz clic en **Implementar → Nueva implementación**.
2. Haz clic en el ícono ⚙️ junto a "Seleccionar tipo" → elige **Aplicación web**.
3. Configura así:

   | Campo                          | Valor                    |
   |-------------------------------|--------------------------|
   | Descripción                   | Sistema Académico v1     |
   | Ejecutar como                 | Yo mismo (tu cuenta)     |
   | Quién tiene acceso            | **Cualquier persona**    |

4. Haz clic en **Implementar**.
5. Acepta los permisos que solicita (Google Drive, Sheets).
6. **Copia la URL** que aparece (algo como `https://script.google.com/macros/s/...../exec`).

> ⚠️ Guarda bien esta URL — la necesitarás en el siguiente paso.

---

## PASO 4 — Inicializar las hojas

1. Abre tu navegador y ve a:
   ```
   TU_URL_DEL_APPS_SCRIPT?action=initSheets
   ```
2. Deberías ver: `{"ok":true}`
3. Regresa a tu Google Sheet — verás las 5 hojas creadas con sus cabeceras.

---

## PASO 5 — Conectar el frontend

1. Abre el archivo `js/api.js`.
2. Reemplaza la URL en la primera línea:
   ```javascript
   const API_URL = "PEGAR_AQUI_EL_LINK_DEL_APPS_SCRIPT";
   //               ↑ Pega aquí la URL del Paso 3
   ```

---

## PASO 6 — Publicar el frontend

### Opción A — GitHub Pages (Recomendado, gratis)
1. Crea un repositorio en [github.com](https://github.com).
2. Sube todos los archivos del proyecto.
3. Ve a **Settings → Pages → Branch: main → Save**.
4. Tu sistema estará en: `https://tu-usuario.github.io/nombre-repo/`

### Opción B — Netlify (Muy fácil)
1. Ve a [netlify.com](https://netlify.com) → "Add new site" → "Deploy manually".
2. Arrastra la carpeta del proyecto.
3. ¡Listo! Obtienes un enlace público.

### Opción C — Uso local
1. Abre `index.html` directamente en el navegador.
2. Nota: Algunas funciones pueden requerir un servidor local (usa [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code).

---

## Flujo de uso del sistema

### 1. Login
- Accede a `index.html`.
- Ingresa `admin` / `admin123`.
- Eres redirigido al **Dashboard**.

### 2. Configuración inicial (como Admin)
1. Ve a **Profesores** → Registra los docentes.
2. Ve a **Materias** → Crea materias y asigna profesores.
3. Ve a **Estudiantes** → Registra los estudiantes (o créalos directamente desde Notas).

### 3. Registro de notas
1. Ve a **Notas**.
2. Selecciona **Profesor** → las materias se filtran automáticamente.
3. Selecciona la **Materia**.
4. Busca estudiantes por documento:
   - Si existe → se autocompleta.
   - Si no existe → escribe nombre → se crea al guardar.
5. Ingresa Corte 1, Corte 2, Corte 3.
6. El promedio se calcula automáticamente.
7. Haz clic en **Guardar Todas las Notas**.

### 4. Generar boletín
1. Ve a **Boletines**.
2. Selecciona el estudiante.
3. Escribe el período (ej: "Año Escolar 2025").
4. Haz clic en **Generar Boletín**.
5. Aparece el boletín completo con todas las notas y promedios.
6. Usa **Imprimir** o **Descargar PDF** (Ctrl+P → Guardar como PDF).

---

## Roles y permisos

| Función                | Admin | Profesor |
|------------------------|-------|----------|
| Ver Dashboard          | ✅    | ✅       |
| Gestionar Estudiantes  | ✅    | ❌       |
| Gestionar Profesores   | ✅    | ❌       |
| Gestionar Materias     | ✅    | ❌       |
| Registrar Notas        | ✅    | ✅       |
| Ver Boletines          | ✅    | ✅       |

> Los profesores solo ven sus propias materias en el formulario de notas.

---

## Vincular profesor con usuario

Para que un profesor solo vea sus materias al iniciar sesión, asegúrate de que en la hoja `users` el campo `documento` coincida con el documento registrado en la hoja `teachers`.

| users.documento | teachers.documento |
|-----------------|--------------------|
| 87654321        | 87654321           ← mismo valor

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "Error al cargar datos" | Verifica que la `API_URL` en `api.js` esté correcta |
| "No tiene permisos" | Al desplegar Apps Script, asegúrate de elegir "Cualquier persona" |
| Los datos no se guardan | Ve a Apps Script → Implementar → Gestionar implementaciones → actualiza la implementación |
| El login no funciona | Verifica que la hoja `users` tenga datos y el deploy esté activo |
| Hojas no creadas | Visita `TU_URL?action=initSheets` en el navegador |

---

## Actualizar el backend

Si modificas el código de Apps Script, debes **crear una nueva implementación** o **actualizar** la existente:
1. Apps Script → Implementar → Gestionar implementaciones.
2. Edita la implementación existente → elige la versión nueva → Implementar.

---

## Personalización

### Cambiar nombre de la institución
Edita el boletín en `js/report.js`, línea:
```javascript
<h2>📚 Instituto Académico</h2>
```

### Cambiar escala de notas
Por defecto las notas van de 0 a 10. Para cambiar a 0-5 o 0-100, edita los inputs en `grades.html`:
```html
<input type="number" min="0" max="10" ...>
<!-- Cambia max="10" por max="5" o max="100" -->
```

### Agregar más cortes
En el backend (`saveGrades`), agrega columnas `nota4`, `nota5` a la hoja `grades` y actualiza el frontend en `grades.js` y `grades.html`.

---

## Tecnologías utilizadas

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, JavaScript (Vanilla)   |
| Backend    | Google Apps Script (serverless)     |
| Base datos | Google Sheets                       |
| Auth       | localStorage + validación en Sheets |
| PDF        | API nativa de impresión del navegador |

---

*Sistema Académico v1.0 — Desarrollado con Google Apps Script + Frontend Vanilla*
