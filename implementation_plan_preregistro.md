# Plan de Implementación: Módulo de Aspirantes (Administrativo)

Este plan de diseño describe cómo agregar el módulo de **Aspirantes** al panel de administración para recibir, listar, visualizar, revisar y aprobar las preinscripciones realizadas desde el formulario de pre-registro de admisiones.

## User Review Required

> [!IMPORTANT]
> - El backend ya cuenta con un modelo y rutas para `pre-registrations`, pero la lista por defecto no devuelve los nombres de carreras, estados, municipios o parroquias (solo sus IDs). Modificaremos el controlador del backend para incluir estas relaciones en las consultas `list` y `get` para mostrarlas de forma amigable.
> - La aprobación de un pre-registro actualizará su estado a `Aprobado` en la base de datos (`status_pre: 'Aprobado'`).

---

## Proposed Changes

### Backend Components

#### [MODIFY] [preRegistrationController.js](file:///c:/Users/Javian/Documents/MIS%20REPOS/Lenguaje_3/backend/src/controllers/preRegistrationController.js)
- Importar modelos relacionales: `State`, `Municipality`, `Parish`, `Career`, `Semester`.
- Modificar el método `list` para realizar un `findAll` incluyendo estas relaciones con sus nombres (`name_state`, `name_career`, etc.).
- Modificar el método `get` para realizar un `findByPk` incluyendo las mismas relaciones.

---

### Frontend Components

#### [NEW] [Aspirantes.jsx](file:///c:/Users/Javian/Documents/MIS%20REPOS/Lenguaje_3/frontend/src/components/pages/admin/Aspirantes.jsx)
- Crear una nueva página de gestión usando la estética premium actual:
  - **Métricas**: Tarjetas superiores con indicadores de total de aspirantes, pendientes, aprobados y rechazados.
  - **Filtros**: Buscador de texto (cédula, nombre, correo) y selector de estado (`Todos`, `Pendiente`, `En Revisión`, `Aprobado`, `Rechazado`).
  - **Tabla de datos**: Muestra Cédula, Nombre Completo, Carrera, Modalidad de Ingreso, Estado y Fecha de Creación.
  - **Modal de Detalle**: Al pulsar "Ver detalles", se abre un modal de pantalla completa o expandido con pestañas o secciones organizadas:
    - **Datos Personales**: Nombre, nacionalidad, fecha de nacimiento, contacto (correo/teléfono).
    - **Residencia**: Dirección completa, estado, municipio y parroquia.
    - **Datos Académicos**: Carrera solicitada, modalidad, PNF o programa, tipo de institución y año de egreso.
    - **Observaciones**: Muestra las observaciones ingresadas y los documentos declarados.
    - **Acción/Gestión**: Botones para actualizar el estado del aspirante (`Aprobar`, `Rechazar`, `Poner en Revisión`) o eliminar el registro.

#### [MODIFY] [App.jsx](file:///c:/Users/Javian/Documents/MIS%20REPOS/Lenguaje_3/frontend/src/App.jsx)
- Importar el nuevo componente `Aspirantes`.
- Registrar la ruta `admin/pre-registrations` (y redirigir opcionalmente `admin/aspirantes` para compatibilidad) apuntando a `<Aspirantes />`.

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/Javian/Documents/MIS%20REPOS/Lenguaje_3/frontend/src/components/layout/Sidebar.jsx)
- Añadir el menú de navegación "Aspirantes" en el listado de navegación para el rol `Admin` usando un ícono adecuado (como `Users` de Lucide).

#### [MODIFY] [Navbar.jsx](file:///c:/Users/Javian/Documents/MIS%20REPOS/Lenguaje_3/frontend/src/components/layout/Navbar.jsx)
- Registrar el caso `pre-registrations` en `getPageTitle()` para que el navbar de la página muestre el título correcto: "Control de Aspirantes".

---

## Verification Plan

### Automated/Manual Verification
- Enviar un registro de prueba desde el formulario de pre-registro de la web principal (`frontend_webside`).
- Acceder al portal administrativo con credenciales de Administrador.
- Verificar que el enlace "Aspirantes" aparezca en la barra lateral con su respectivo ícono y contador.
- Verificar que la lista muestre al nuevo aspirante con su carrera y estado "Pendiente".
- Abrir los detalles del aspirante, verificar que los nombres de los estados, municipios y carreras aparezcan correctamente.
- Cambiar el estado a "En Revisión" y luego a "Aprobado", verificando que la base de datos se actualice correctamente en tiempo real.
- Comprobar que el diseño se adapte de forma correcta a dispositivos móviles.
