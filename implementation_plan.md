# Plan de Implementación: Estandarización de Navegación y Encabezado (Estilo SGUMS)

Este plan detalla el rediseño y estandarización de la estructura de navegación global (`AppLayout`, `Sidebar` y `Navbar`) para cumplir con la estética exacta de la imagen de referencia [image_28605e.png](image_28605e.png). El objetivo es lograr una interfaz fija, limpia y unificada para todos los roles (Admin, Docente y Estudiante).

---

## User Review Required

> [!IMPORTANT]
> **Estructura Visual de Navegación Unificada:**
> - El **Sidebar** será sólido, de color azul marino corporativo (`#051124` / `#0b1c3f`), con un logo principal que simula el de la universidad (ícono de templo educativo en amarillo y texto "SGUMS / PORTAL ACADÉMICO" o el rol actual del usuario). El enlace activo tendrá fondo amarillo brillante (`#ffd100` / `#facc15`) y texto azul marino, garantizando máxima visibilidad.
> - La barra superior (**Navbar**) tendrá fondo blanco sólido, texto azul marino, un divisor vertical, y mostrará el título de la página, el ciclo activo, el estado del sistema en verde y el botón de notificaciones.
> - El perfil del usuario (nombre, rol y foto/avatar) y la opción de **Cerrar Sesión** se trasladarán al pie del **Sidebar**, complementando el indicador de estado de la API (`ONLINE`), logrando la distribución exacta de la imagen de referencia.
> - Se implementará una hoja de estilos unificada `Layout.css` para centralizar y aplicar estos cambios de forma constante en todo el sistema.

---

## Proposed Changes

### Layout System

#### [NEW] [Layout.css](file:///c:/Users/Core/Documents/Uni/7mo%20semestre/Lenguaje%20III/frontend/src/components/layout/Layout.css)
Crearemos una hoja de estilos unificada para la estructura de la aplicación.
- Layout fijo y no scrollable para el marco global (`height: 100vh; overflow: hidden`).
- Sidebar sólido azul marino (`#0b1c3f`) con items inactivos en gris y activos en amarillo brillante (`#ffd100`) con esquinas redondeadas.
- Navbar sólido blanco con borde inferior tenue y elementos alineados a la perfección.
- Scrollbar personalizado para el área interna de contenido (`.app-content-page`).

#### [MODIFY] [AppLayout.jsx](file:///c:/Users/Core/Documents/Uni/7mo%20semestre/Lenguaje%20III/frontend/src/components/layout/AppLayout.jsx)
Reescribiremos el contenedor para cargar el Sidebar, la barra principal y el Outlet usando las nuevas clases estructuradas.
- Importará la hoja de estilos unificada `Layout.css`.
- Definirá el grid general fijo de forma robusta.

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/Core/Documents/Uni/7mo%20semestre/Lenguaje%20III/frontend/src/components/layout/Sidebar.jsx)
Rediseñaremos el componente de barra lateral.
- **Marca:** Se sustituye la mascota por un logo corporativo (Ícono de templo en amarillo + texto "SGUMS" y "PORTAL" en blanco).
- **Navegación:** Enlaces con diseño plano, aplicando la clase activa con fondo amarillo brillante y texto azul oscuro.
- **Pie de página:** Se integrará la tarjeta de perfil del usuario (Avatar con iniciales del usuario, Nombre completo y Rol en mayúsculas), el botón interactivo de "Cerrar Sesión" con ícono Lucide `LogOut` y el estado de la API con punto verde parpadeante.

#### [MODIFY] [Navbar.jsx](file:///c:/Users/Core/Documents/Uni/7mo%20semestre/Lenguaje%20III/frontend/src/components/layout/Navbar.jsx)
Simplificaremos la barra de navegación superior.
- **Estilo:** Fondo blanco, tipografía azul marino, línea divisoria y badge amarillo de ciclo actual (`2026-I` o el configurado).
- **Estatus:** Mostrará el indicador "Sistema: Operativo" con su punto verde dinámico y el ícono de notificaciones con efecto hover a la derecha. El menú/perfil flotante se mantendrá si es necesario, pero el diseño principal reflejará la imagen de referencia con la máxima precisión.

---

## Verification Plan

### Automated Tests
- Validaremos de forma estática la correcta importación y empaquetado ejecutando `npm run build` en el workspace del proyecto.

### Manual Verification
- Validar visualmente en el navegador que el Sidebar y el Navbar permanezcan fijos y que solo el Outlet genere barra de desplazamiento vertical interna.
- Validar el contraste de color de los enlaces activos e inactivos en el Sidebar.
- Verificar que el cierre de sesión y la visualización de datos de perfil funcionen correctamente en el pie de la barra lateral.
