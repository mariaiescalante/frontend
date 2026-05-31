# Plan de Trabajo: Módulo Docente

Este plan define el alcance funcional del módulo docente. Todo lo que se describe aquí pertenece al panel docente, pero se implementa como bloques separados para mantener el dashboard, la consulta académica y la gestión de notas con responsabilidades claras.

---

## User Review Required

> [!IMPORTANT]
> **Aclaración de alcance:**
> - El **dashboard docente** se mantiene como una vista aparte, solo para resumen e indicadores.
> - Los módulos funcionales del docente se desarrollan dentro del panel docente, pero como secciones independientes.
> - La selección de carrera, asignatura y sección debe ser el punto de entrada para ver estudiantes y registrar notas.
> - El docente debe poder registrar contenido evaluado por corte, descargar el listado o acta en PDF y conservar evidencia de la carga realizada.

---

## Módulos a Implementar

### 1. Consultar Asignaturas Impartidas
**Objetivo:** mostrar al docente las asignaturas que tiene asignadas.

**Debe incluir:**
- Lista de asignaturas asignadas al docente.
- Sección correspondiente a cada asignatura.
- Carrera asociada.
- Semestre de la materia.
- Estado o período académico, si aplica.
- Selección de asignatura y sección como punto de entrada al resto del flujo.

**Resultado esperado:** el docente identifica rápidamente qué materia dicta, en qué sección, de qué carrera es y a qué semestre pertenece.

---

### 2. Ver Estudiantes Inscritos
**Objetivo:** mostrar la lista de estudiantes inscritos por materia y sección.

**Debe incluir:**
- Lista de estudiantes por asignatura y sección seleccionada.
- Cédula y nombre completo.
- Barra de búsqueda por cédula o por nombre.
- Vista filtrada por la carrera, asignatura y sección que el docente seleccione.
- Acceso al detalle de cada estudiante para registrar evaluaciones.

**Resultado esperado:** al elegir la carrera, asignatura y sección, el docente ve automáticamente los estudiantes inscritos en ese grupo.

---

### 3. Registrar Evaluaciones por Estudiante
**Objetivo:** permitir al docente cargar las notas de cada estudiante.

**Debe incluir:**
- Carga de los 4 cortes por estudiante.
- Posibilidad de editar notas dentro de un límite de tiempo definido.
- Validación de rangos y formato numérico.
- Indicación de si la nota fue guardada, pendiente o bloqueada.
- Registro del contenido evaluado en cada corte o nota.

**Resultado esperado:** el docente puede registrar cada evaluación de forma ordenada y con trazabilidad de qué contenido se evaluó.

---

### 4. Descargar Acta o Listado de Notas en PDF
**Objetivo:** generar evidencia formal de las notas cargadas.

**Debe incluir:**
- Descarga en PDF del listado o acta de notas apenas el docente termine la carga.
- Información del docente, asignatura, sección, carrera y período.
- Lista de estudiantes con sus cortes y observaciones.
- Fecha y hora de emisión.
- Formato de constancia para respaldar que las notas fueron cargadas correctamente.

**Resultado esperado:** el docente obtiene un documento descargable como respaldo inmediato de la carga de notas.

---

### 5. Cerrar Acta de Notas
**Objetivo:** bloquear la edición de las notas una vez verificadas.

**Debe incluir:**
- Acción explícita de cierre por parte del docente.
- Confirmación antes de cerrar.
- Bloqueo de edición posterior.
- Estado visible de acta cerrada.
- Registro de auditoría si el backend lo soporta.

**Resultado esperado:** las notas quedan protegidas contra modificaciones posteriores al cierre.

---

### 6. Consultar Historial de Asignaturas Impartidas
**Objetivo:** permitir al docente revisar materias dictadas en períodos anteriores.

**Debe incluir:**
- Historial por período académico.
- Asignatura, sección, carrera y semestre.
- Estado final de la materia.
- Acceso a notas o actas anteriores, si aplica.
- Consulta en modo solo lectura.

**Resultado esperado:** el docente puede revisar su historial académico sin alterar registros previos.

---

## Orden Sugerido de Implementación

### Fase 1. Estructura del módulo docente
- Definir la sección del panel docente separada del dashboard.
- Preparar el flujo principal por carrera, asignatura y sección.
- Reutilizar el estilo visual del sistema.

### Fase 2. Consulta de asignaturas impartidas
- Mostrar las materias asignadas al docente.
- Incluir carrera, semestre y sección.
- Permitir seleccionar una asignatura para continuar al siguiente módulo.

### Fase 3. Estudiantes inscritos
- Cargar estudiantes por asignatura y sección.
- Agregar búsqueda por cédula o por nombre.
- Preparar la lista base para el registro de evaluaciones.

### Fase 4. Registro de evaluaciones
- Implementar los 4 cortes por estudiante.
- Agregar el campo para contenido evaluado por nota.
- Validar rangos, formato y ventana de edición.

### Fase 5. PDF y cierre de acta
- Generar el PDF con las notas cargadas.
- Permitir descargar el acta o listado como constancia.
- Agregar el cierre de acta y bloquear edición.

### Fase 6. Historial docente
- Consultar materias impartidas en períodos anteriores.
- Mostrar resultados y actas en modo lectura.

---

## Dependencias Funcionales

- Autenticación del docente y obtención de su perfil.
- Relación entre docente, carrera, asignatura, sección y período.
- Acceso a estudiantes inscritos por materia.
- Servicio para guardar notas por corte.
- Servicio para registrar el contenido evaluado en cada nota.
- Servicio para generar y descargar PDF.
- Servicio para cerrar actas.
- Control de permisos y validaciones de edición.

---

## Criterios de Aceptación

- El docente solo ve sus asignaturas asignadas.
- Puede seleccionar carrera, asignatura y sección para cargar estudiantes.
- Puede buscar estudiantes por cédula o por nombre.
- Puede registrar los 4 cortes de cada estudiante.
- Puede especificar qué contenido evaluó en cada nota.
- Puede descargar el acta o listado en PDF como constancia.
- Puede cerrar el acta y dejarla bloqueada.
- Puede consultar el historial de asignaturas impartidas en modo lectura.

---

## Riesgos a Validar

- Definición exacta del límite de tiempo para editar notas.
- Formato real del PDF y si se genera en frontend o backend.
- Contrato exacto entre docente, asignatura, sección, carrera y período.
- Campos necesarios para notas, contenido evaluado y observaciones.
- Estados necesarios para bloquear edición y registrar cierre de actas.

---

## Verificación Propuesta

- Confirmar contratos de API para materias, estudiantes inscritos, notas, cierre y PDF.
- Probar búsqueda por cédula y por nombre con datos reales.
- Validar que las notas no se puedan modificar fuera de la ventana permitida.
- Verificar que el acta o listado PDF se descargue correctamente.
- Confirmar que el historial muestre solo información histórica y no editable.

---

## Próximo Paso

Revisar este plan con el usuario para confirmar si así se separan correctamente los módulos del panel docente antes de implementarlos.
