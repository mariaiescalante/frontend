# Plan de Trabajo: Ajuste del Módulo de Usuarios

Este plan define el trabajo necesario para adaptar el módulo de usuarios a los campos reales que exige el backend, separando el registro de estudiantes y docentes sin romper el responsive ya aplicado en el panel administrativo.

## Objetivo

Actualizar el formulario de registro de usuarios para que:

- El registro de **estudiante** solicite:
  - Primer nombre
  - Segundo nombre
  - Primer apellido
  - Segundo apellido
  - Fecha de nacimiento
  - Correo
  - Cédula
  - Teléfono
  - Username
  - Contraseña
  - Carrera
- El registro de **docente** solicite los mismos datos base, pero reemplace **Carrera** por el nivel o título profesional correspondiente, por ejemplo:
  - Licenciado
  - Ingeniero
  - MSc
  - Otro valor que el backend permita

## Alcance

El ajuste se hará en el módulo de administración de usuarios, manteniendo la estructura visual actual y el comportamiento responsive del panel.

## Plan de trabajo

### 1. Revisar el contrato del backend

- Confirmar el endpoint exacto de registro.
- Verificar los nombres reales de los campos esperados por el backend.
- Validar si el backend distingue estudiante y docente por un campo de rol, por un tipo de usuario o por payloads distintos.
- Identificar si hay validaciones obligatorias como formato de correo, longitud de contraseña, cédula o teléfono.

### 2. Separar el flujo de registro por tipo de usuario

- Mantener una misma pantalla de usuarios, pero dividir el formulario en dos vistas o pestañas:
  - Registro de estudiante
  - Registro de docente
- Evitar mostrar campos que no correspondan al tipo seleccionado.
- Reutilizar el mismo modal o contenedor actual para no duplicar estructura visual.

### 3. Ajustar los campos del formulario

- Para estudiante, mostrar los campos requeridos por el backend.
- Para docente, mostrar los mismos campos base y reemplazar la carrera por el campo académico correspondiente.
- Asegurar que `username` y `password` formen parte del alta para permitir inicio de sesión posterior.
- Normalizar etiquetas, placeholders y mensajes de ayuda para que coincidan con el lenguaje del sistema.

### 4. Implementar validación antes de enviar

- Validar campos obligatorios en frontend.
- Revisar formatos mínimos de correo, cédula, teléfono y contraseña.
- Mostrar errores claros cerca del campo correspondiente.
- Evitar enviar datos incompletos o incompatibles con el backend.

### 5. Conectar el formulario con la capa de servicios

- Mover la lógica de envío a `services/`.
- Usar la instancia centralizada de Axios ya definida en el proyecto.
- Construir el payload según el tipo de usuario seleccionado.
- Manejar respuestas de error del backend de forma controlada.

### 6. Preservar el responsive existente

- Mantener los componentes visuales actuales del panel administrativo.
- Conservar el uso de grids adaptables para que el formulario se acomode en escritorio, tablet y móvil.
- Verificar que el modal no desborde en pantallas pequeñas.
- Evitar cambios estructurales innecesarios en `AdminPageShell`, `SectionCard` y los estilos reutilizados.

### 7. Probar el flujo completo

- Verificar el registro de estudiante.
- Verificar el registro de docente.
- Confirmar que el payload enviado coincide con el backend.
- Revisar que el diseño siga respondiendo correctamente en móvil y escritorio.

## Criterios de aceptación

- El formulario de estudiante contiene solo los campos requeridos para estudiante.
- El formulario de docente contiene solo los campos requeridos para docente.
- El registro incluye credenciales para iniciar sesión.
- El flujo respeta el responsive ya existente.
- El envío de datos coincide con el contrato del backend.

## Verificación sugerida

- Ejecutar `npm run build` para comprobar que no se rompa la compilación.
- Hacer una revisión visual en móvil y escritorio.
- Validar el alta de ambos tipos de usuario contra el backend real.
