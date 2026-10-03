/**
 * Catálogo centralizado de módulos y permisos en el Frontend.
 * Los nombres (label) coinciden exactamente con los nombres originales del menú/sidebar.
 */

export const MODULE_PERMISSIONS = [
  // 1. Administración General
  {
    id: 'admin:dashboard',
    label: 'Dashboard',
    category: 'Administración General',
    role: 'admin',
    description: 'Resumen global y estadísticas institucionales'
  },
  {
    id: 'admin:users',
    label: 'Usuarios',
    category: 'Administración General',
    role: 'admin',
    description: 'Creación, edición y control de acceso de usuarios'
  },
  {
    id: 'admin:periods',
    label: 'Períodos',
    category: 'Administración General',
    role: 'admin',
    description: 'Apertura y cierre de períodos e inscripciones'
  },
  {
    id: 'admin:history',
    label: 'Historial',
    category: 'Administración General',
    role: 'admin',
    description: 'Trazabilidad de acciones y eventos del sistema'
  },

  // 2. Gestión Académica y Curricular
  {
    id: 'admin:careers',
    label: 'Carreras',
    category: 'Gestión Académica',
    role: 'admin',
    description: 'Administración de programas y carreras académicas'
  },
  {
    id: 'admin:pensum',
    label: 'Pensum',
    category: 'Gestión Académica',
    role: 'admin',
    description: 'Malla curricular, materias y prelaciones'
  },
  {
    id: 'admin:sections',
    label: 'Secciones',
    category: 'Gestión Académica',
    role: 'admin',
    description: 'Creación de secciones, cupos y horarios de clase'
  },
  {
    id: 'admin:classrooms',
    label: 'Aulas y Espacios',
    category: 'Gestión Académica',
    role: 'admin',
    description: 'Control de aulas, laboratorios y capacidad'
  },
  {
    id: 'admin:teacher-assignment',
    label: 'Asignación Docente',
    category: 'Gestión Académica',
    role: 'admin',
    description: 'Asignación de profesores a secciones de asignaturas'
  },

  // 3. Control de Estudios e Inscripciones
  {
    id: 'admin:enrollments',
    label: 'Inscripciones',
    category: 'Control de Estudios',
    role: 'admin',
    description: 'Inscripción administrativa y gestión de matrículas'
  },
  {
    id: 'admin:grades',
    label: 'Notas',
    category: 'Control de Estudios',
    role: 'admin',
    description: 'Visualización y auditoría de calificaciones globales'
  },
  {
    id: 'admin:pre-registrations',
    label: 'Aspirantes',
    category: 'Control de Estudios',
    role: 'admin',
    description: 'Validación y admisión de nuevos aspirantes'
  },

  // 4. Módulos de Docencia
  {
    id: 'teacher:dashboard',
    label: 'Dashboard',
    category: 'Docencia',
    role: 'teacher',
    description: 'Panel principal del profesor'
  },
  {
    id: 'teacher:subjects',
    label: 'Asignaturas Impartidas',
    category: 'Docencia',
    role: 'teacher',
    description: 'Listado de asignaturas asignadas al docente'
  },
  {
    id: 'teacher:students',
    label: 'Estudiantes Inscritos',
    category: 'Docencia',
    role: 'teacher',
    description: 'Consulta de listas de estudiantes por sección'
  },
  {
    id: 'teacher:records',
    label: 'Cerrar Actas',
    category: 'Docencia',
    role: 'teacher',
    description: 'Carga definitiva y cierre de actas de calificaciones'
  },
  {
    id: 'teacher:history',
    label: 'Historial Impartido',
    category: 'Docencia',
    role: 'teacher',
    description: 'Historial de períodos y materias dictadas anteriormente'
  },

  // 5. Módulos de Estudiantes
  {
    id: 'student:dashboard',
    label: 'Dashboard',
    category: 'Estudiante',
    role: 'student',
    description: 'Panel del estudiante'
  },
  {
    id: 'student:profile',
    label: 'Datos Personales',
    category: 'Estudiante',
    role: 'student',
    description: 'Consulta y actualización de perfil del estudiante'
  },
  {
    id: 'student:pensum',
    label: 'Pensum de Estudios',
    category: 'Estudiante',
    role: 'student',
    description: 'Consulta de avance en la carrera y materias'
  },
  {
    id: 'student:enrollment',
    label: 'Inscripción de Materias',
    category: 'Estudiante',
    role: 'student',
    description: 'Módulo de autogestión de inscripción'
  },
  {
    id: 'student:schedule',
    label: 'Mi Horario',
    category: 'Estudiante',
    role: 'student',
    description: 'Horario semanal de clases inscritas'
  },
  {
    id: 'student:record',
    label: 'Récord Académico',
    category: 'Estudiante',
    role: 'student',
    description: 'Historial de notas y promedio acumulado'
  },
  {
    id: 'student:documents',
    label: 'Constancias y Reportes',
    category: 'Estudiante',
    role: 'student',
    description: 'Descarga de constancias de estudio e inscripción'
  }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: MODULE_PERMISSIONS.filter(m => m.role === 'admin').map(m => m.id),
  teacher: MODULE_PERMISSIONS.filter(m => m.role === 'teacher').map(m => m.id),
  student: MODULE_PERMISSIONS.filter(m => m.role === 'student').map(m => m.id),
  control_estudios: ['admin:dashboard', 'admin:enrollments', 'admin:grades', 'admin:pre-registrations'],
  gestion_academica: ['admin:dashboard', 'admin:careers', 'admin:pensum', 'admin:sections', 'admin:classrooms', 'admin:teacher-assignment']
};

/**
 * Evalúa si un usuario tiene acceso a un módulo específico.
 * @param {Object} user Objeto de usuario autenticado
 * @param {string} permissionId Identificador del módulo (ej: 'admin:sections')
 * @returns {boolean}
 */
export function hasModulePermission(user, permissionId) {
  if (!user) return false;

  // 1. Si el usuario tiene permisos granulares explícitos configurados
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permissionId);
  }

  // 2. Si no tiene permisos personalizados (retrocompatibilidad total por rol)
  const roleStr = String(user.role || '').toLowerCase();
  const roleId = Number(user.id_role);

  const isAdmin = roleStr === 'admin' || roleStr === 'administrador' || roleId === 1;
  const isTeacher = roleStr === 'docente' || roleId === 2;
  const isStudent = roleStr === 'estudiante' || roleId === 3;
  const isControlEstudios = roleStr.includes('control') || roleId === 4;
  const isGestionAcademica = roleStr.includes('gesti') || roleId === 5;

  if (isAdmin) {
    return permissionId.startsWith('admin:');
  }

  if (isTeacher) {
    return permissionId.startsWith('teacher:');
  }

  if (isStudent) {
    return permissionId.startsWith('student:');
  }

  if (isControlEstudios) {
    return DEFAULT_ROLE_PERMISSIONS.control_estudios.includes(permissionId);
  }

  if (isGestionAcademica) {
    return DEFAULT_ROLE_PERMISSIONS.gestion_academica.includes(permissionId);
  }

  return false;
}
