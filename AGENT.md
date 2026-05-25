## Te dejo el bloque clave que debería conocer:

- El backend expone su API bajo index.js con prefijo /api.
- La base de desarrollo es http://localhost:3000/api.
- Hay autenticación con JWT en Auth.md.
- El login está en POST /api/auth/login.
- El registro está en POST /api/auth/register.
- El perfil autenticado está en GET /api/auth/profile.
- El cambio de contraseña está en POST /api/auth/change-password.
- La recuperación de contraseña está en POST /api/auth/forgot-password.
- La app tiene Swagger en /api/docs.
- El backend usa CORS, así que el frontend puede consumir la API desde otro puerto.
- El token debe enviarse como Authorization: Bearer <token> en rutas protegidas.
- La API devuelve JSON.
- Los módulos principales son usuarios, roles, carreras, materias, secciones, estudiantes, docentes, inscripciones, pensums, prerrequisitos, períodos, auditoría y solicitudes de documentos.

## Estructura que conviene seguir en el frontend
Como ya tienes carpetas como components, context, hooks y services, el agente frontend debería trabajar así:

- services/ para llamadas a la API.
- context/ para estado global de auth y usuario.
- hooks/ para lógica reutilizable.
- components/ para UI reusable.
- pages/ o rutas separadas para cada pantalla.
- un archivo central para la URL base de la API.

## Lo más importante para conectar con el backend
El agente frontend debería asumir esto:

- Guardar el token después del login.
- Adjuntar el token en cada request protegida.
- Manejar respuestas 400, 401, 404 y 500.
- Validar formularios antes de enviar.
- No hardcodear datos del backend; consumir siempre desde servicios.
- Usar la documentación de API.md como contrato principal.

---

- El frontend consume el backend en http://localhost:3000/api.
- Usa axios.
- Todas las peticiones protegidas deben enviar Authorization: Bearer <token>.
- Hay login, registro, perfil, cambio de contraseña y recuperación en /api/auth.
- El backend devuelve JSON y tiene CORS habilitado.
- La documentación de endpoints está en API.md y Auth.md.
- Organiza el frontend en services, context, hooks, components y pantallas.
- Centraliza la base URL y el manejo de token.
- Maneja estados de carga, error y vacío en cada pantalla.
- Usa formularios separados por módulo y no mezcles lógica de red con UI.

## Instrucciones del frontend

Este proyecto es el frontend de una API académica. El objetivo es consumir el backend existente de forma consistente, ordenada y mantenible.

## Reglas generales

- Usar Axios como única librería HTTP.
- No mezclar Axios con fetch dentro del proyecto.
- Mantener la estructura por capas: components, context, hooks, services, pages o views.
- Separar lógica de UI, lógica de estado y lógica de red.
- Priorizar componentes reutilizables.
- Mantener el código simple, legible y modular.

## Integración con el backend

- El backend expone la API bajo http://localhost:3000/api.
- Todas las peticiones deben salir desde una instancia central de Axios.
- Crear un archivo único para la configuración del cliente HTTP.
- Usar interceptores para adjuntar el token automáticamente cuando exista.
- Manejar errores de forma centralizada, especialmente 400, 401, 404 y 500.
- Consultar la documentación del backend para contratos y nombres de campos.
- No asumir campos extra ni estructuras no documentadas.

## Autenticación

- El login usa POST /api/auth/login.
- El registro usa POST /api/auth/register.
- El perfil autenticado usa GET /api/auth/profile.
- El cambio de contraseña usa POST /api/auth/change-password.
- La recuperación de contraseña usa POST /api/auth/forgot-password.
- El token debe enviarse como Bearer en el encabezado Authorization.
- Guardar el token de forma segura según la estrategia del proyecto.
- Si el token no existe o expira, redirigir al login.

## Organización sugerida

- services: llamadas a la API.
- context: sesión, usuario y autenticación.
- hooks: lógica reutilizable.
- components: botones, tablas, formularios, modales y layouts.
- pages o views: pantallas completas.
- utils o constants: configuración común.

## Pantallas mínimas

- Login.
- Registro.
- Recuperar contraseña.
- Dashboard.
- Perfil.
- CRUD de entidades principales según el backend.

## Estilo de trabajo

- Antes de crear una pantalla, revisar qué datos devuelve el backend.
- Reutilizar un patrón de formulario y tabla para módulos CRUD.
- Validar formularios del lado del cliente antes de enviar.
- Mostrar estados de carga, vacío y error.
- No duplicar lógica entre pantallas parecidas.

## Criterios técnicos

- Usar variables de entorno para la base URL.
- No hardcodear endpoints en múltiples archivos.
- Centralizar el manejo de sesión.
- Mantener consistencia visual y de nombres.
- Documentar componentes y servicios con comentarios claros.