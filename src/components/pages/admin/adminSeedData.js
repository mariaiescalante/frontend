export const careerCatalog = [
  {
    code: 'ING-SIS',
    name: 'Ingeniería en Sistemas',
    faculty: 'Tecnología',
    creditsRequired: 160,
    semesters: 10,
    subjects: 58,
    status: 'Activa',
    head: 'Ing. Mariela Rivas'
  },
  {
    code: 'ING-IND',
    name: 'Ingeniería Industrial',
    faculty: 'Ingeniería',
    creditsRequired: 162,
    semesters: 10,
    subjects: 56,
    status: 'Activa',
    head: 'Ing. Diego Pineda'
  },
  {
    code: 'LIC-ADM',
    name: 'Administración de Empresas',
    faculty: 'Ciencias Económicas',
    creditsRequired: 150,
    semesters: 9,
    subjects: 52,
    status: 'Actualización',
    head: 'MSc. Laura Méndez'
  },
  {
    code: 'LIC-MAT',
    name: 'Matemáticas Aplicadas',
    faculty: 'Ciencias Básicas',
    creditsRequired: 148,
    semesters: 9,
    subjects: 49,
    status: 'Activa',
    head: 'Dr. Sergio Arias'
  }
];

export const studentsCatalog = [
  {
    id: '20231001',
    name: 'Sofía Herrera',
    email: 'sofia.herrera@sgums.edu',
    career: 'Ingeniería en Sistemas',
    status: 'Activo',
    period: '2026-II',
    cum: 8.7
  },
  {
    id: '20231012',
    name: 'Luis Pérez',
    email: 'luis.perez@sgums.edu',
    career: 'Ingeniería Industrial',
    status: 'Activo',
    period: '2026-II',
    cum: 8.1
  },
  {
    id: '20230888',
    name: 'Valeria Gómez',
    email: 'valeria.gomez@sgums.edu',
    career: 'Administración de Empresas',
    status: 'Inactivo',
    period: '2025-II',
    cum: 7.6
  },
  {
    id: '20231124',
    name: 'Andrés Castillo',
    email: 'andres.castillo@sgums.edu',
    career: 'Matemáticas Aplicadas',
    status: 'Activo',
    period: '2026-I',
    cum: 8.9
  }
];

export const teachersCatalog = [
  {
    id: 'DOC-101',
    name: 'Dra. Camila Torres',
    department: 'Tecnología',
    expertise: 'Arquitectura de software',
    status: 'Disponible',
    load: 74
  },
  {
    id: 'DOC-102',
    name: 'Ing. Roberto León',
    department: 'Ingeniería',
    expertise: 'Optimización industrial',
    status: 'Asignado',
    load: 91
  },
  {
    id: 'DOC-103',
    name: 'MSc. Elena Martínez',
    department: 'Ciencias Económicas',
    expertise: 'Gestión estratégica',
    status: 'Disponible',
    load: 63
  },
  {
    id: 'DOC-104',
    name: 'Dr. Javier Ortega',
    department: 'Ciencias Básicas',
    expertise: 'Análisis numérico',
    status: 'En supervisión',
    load: 85
  }
];

export const pensumCatalog = {
  'ING-SIS': {
    career: 'Ingeniería en Sistemas',
    semesters: [
      {
        term: 'Semestre 1',
        subjects: [
          { code: 'SIS-101', name: 'Fundamentos de Programación', credits: 4, prereq: 'Ninguno', mandatory: true },
          { code: 'MAT-101', name: 'Álgebra Lineal', credits: 3, prereq: 'Ninguno', mandatory: true },
          { code: 'COM-101', name: 'Comunicación Oral', credits: 2, prereq: 'Ninguno', mandatory: true }
        ]
      },
      {
        term: 'Semestre 2',
        subjects: [
          { code: 'SIS-201', name: 'Programación Orientada a Objetos', credits: 4, prereq: 'SIS-101', mandatory: true },
          { code: 'MAT-201', name: 'Cálculo Diferencial', credits: 3, prereq: 'MAT-101', mandatory: true },
          { code: 'RED-201', name: 'Redes I', credits: 3, prereq: 'SIS-101', mandatory: true }
        ]
      },
      {
        term: 'Semestre 3',
        subjects: [
          { code: 'SIS-301', name: 'Bases de Datos', credits: 4, prereq: 'SIS-201', mandatory: true },
          { code: 'SIS-302', name: 'Estructuras de Datos', credits: 4, prereq: 'SIS-201', mandatory: true },
          { code: 'ING-301', name: 'Inglés Técnico', credits: 2, prereq: 'COM-101', mandatory: false }
        ]
      }
    ]
  },
  'ING-IND': {
    career: 'Ingeniería Industrial',
    semesters: [
      {
        term: 'Semestre 1',
        subjects: [
          { code: 'IND-101', name: 'Introducción a la Ingeniería', credits: 3, prereq: 'Ninguno', mandatory: true },
          { code: 'MAT-101', name: 'Matemática Básica', credits: 4, prereq: 'Ninguno', mandatory: true },
          { code: 'ADM-101', name: 'Gestión Empresarial', credits: 2, prereq: 'Ninguno', mandatory: true }
        ]
      },
      {
        term: 'Semestre 2',
        subjects: [
          { code: 'IND-201', name: 'Procesos de Manufactura', credits: 4, prereq: 'IND-101', mandatory: true },
          { code: 'EST-201', name: 'Estadística', credits: 3, prereq: 'MAT-101', mandatory: true },
          { code: 'CAL-201', name: 'Control de Calidad', credits: 3, prereq: 'IND-101', mandatory: true }
        ]
      }
    ]
  }
};

export const academicPeriods = [
  { name: '2026-II', status: 'Inscripción Abierta', start: '2026-08-03', end: '2026-12-18', note: 'Matrícula prioritaria para estudiantes regulares' },
  { name: '2026-I', status: 'Cerrado', start: '2026-01-20', end: '2026-06-20', note: 'Actas consolidadas y archivadas' },
  { name: '2025-II', status: 'Cerrado', start: '2025-08-04', end: '2025-12-12', note: 'Ciclo histórico para consulta' },
  { name: '2025-I', status: 'Planificación', start: '2025-01-20', end: '2025-06-18', note: 'Ajuste de carga y pensum' }
];

export const enrollmentRequests = [
  {
    id: 'INS-2041',
    student: 'Sofía Herrera',
    career: 'Ingeniería en Sistemas',
    courses: 5,
    status: 'Pendiente',
    period: '2026-II',
    totalCredits: 18,
    details: ['SIS-301 Bases de Datos', 'SIS-302 Estructuras de Datos', 'MAT-301 Probabilidad']
  },
  {
    id: 'INS-2042',
    student: 'Luis Pérez',
    career: 'Ingeniería Industrial',
    courses: 4,
    status: 'Aprobada',
    period: '2026-II',
    totalCredits: 16,
    details: ['IND-201 Procesos de Manufactura', 'EST-201 Estadística']
  },
  {
    id: 'INS-2043',
    student: 'Valeria Gómez',
    career: 'Administración de Empresas',
    courses: 3,
    status: 'Rechazada',
    period: '2026-II',
    totalCredits: 12,
    details: ['ADM-301 Finanzas', 'ADM-302 Mercadeo Estratégico']
  },
  {
    id: 'INS-2044',
    student: 'Andrés Castillo',
    career: 'Matemáticas Aplicadas',
    courses: 4,
    status: 'Pendiente',
    period: '2026-II',
    totalCredits: 15,
    details: ['MAT-303 Cálculo Avanzado', 'MAT-304 Métodos Numéricos']
  }
];

export const sectionCatalog = [
  { code: 'SIS-301-A', subject: 'Bases de Datos', semester: 'Semestre 3', schedule: 'Lun/Mie 08:00 - 10:00', classroom: 'Lab 204', capacity: 35, enrolled: 29 },
  { code: 'SIS-302-B', subject: 'Estructuras de Datos', semester: 'Semestre 3', schedule: 'Mar/Jue 10:00 - 12:00', classroom: 'Aula 18', capacity: 30, enrolled: 27 },
  { code: 'IND-201-A', subject: 'Procesos de Manufactura', semester: 'Semestre 2', schedule: 'Lun/Mie 14:00 - 16:00', classroom: 'Aula 12', capacity: 32, enrolled: 31 },
  { code: 'ADM-301-B', subject: 'Finanzas Corporativas', semester: 'Semestre 5', schedule: 'Mar/Jue 16:00 - 18:00', classroom: 'Aula 07', capacity: 28, enrolled: 21 },
  { code: 'MAT-303-A', subject: 'Cálculo Avanzado', semester: 'Semestre 4', schedule: 'Vie 08:00 - 12:00', classroom: 'Aula 03', capacity: 24, enrolled: 19 }
];

export const teacherAssignments = [
  { career: 'Ingeniería en Sistemas', semester: 'Semestre 3', subject: 'Bases de Datos', section: 'SIS-301-A', teacher: 'Dra. Camila Torres', schedule: 'Lun/Mie 08:00 - 10:00' },
  { career: 'Ingeniería Industrial', semester: 'Semestre 2', subject: 'Procesos de Manufactura', section: 'IND-201-A', teacher: 'Ing. Roberto León', schedule: 'Lun/Mie 14:00 - 16:00' },
  { career: 'Administración de Empresas', semester: 'Semestre 5', subject: 'Finanzas Corporativas', section: 'ADM-301-B', teacher: 'MSc. Elena Martínez', schedule: 'Mar/Jue 16:00 - 18:00' }
];

export const gradeSections = [
  {
    section: 'SIS-301-A',
    subject: 'Bases de Datos',
    teacher: 'Dra. Camila Torres',
    students: [
      { id: '20231001', name: 'Sofía Herrera', cortes: [9.1, 8.8, 9.0], final: 9.0 },
      { id: '20231124', name: 'Andrés Castillo', cortes: [8.5, 8.9, 9.3], final: 8.9 },
      { id: '20230933', name: 'Daniela Rojas', cortes: [7.8, 8.0, 8.1], final: 8.0 }
    ]
  },
  {
    section: 'IND-201-A',
    subject: 'Procesos de Manufactura',
    teacher: 'Ing. Roberto León',
    students: [
      { id: '20231012', name: 'Luis Pérez', cortes: [8.1, 7.9, 8.5], final: 8.2 },
      { id: '20230984', name: 'Paula Mendoza', cortes: [8.8, 9.0, 8.6], final: 8.8 }
    ]
  }
];

export const academicHistories = [
  {
    id: '20231001',
    name: 'Sofía Herrera',
    career: 'Ingeniería en Sistemas',
    cum: 8.7,
    credits: 114,
    courses: 36,
    timeline: [
      { period: '2025-II', subject: 'Bases de Datos', grade: 9.0, status: 'Aprobada' },
      { period: '2025-II', subject: 'Estructuras de Datos', grade: 8.6, status: 'Aprobada' },
      { period: '2026-I', subject: 'Redes I', grade: 8.8, status: 'Aprobada' }
    ]
  },
  {
    id: '20231012',
    name: 'Luis Pérez',
    career: 'Ingeniería Industrial',
    cum: 8.1,
    credits: 102,
    courses: 31,
    timeline: [
      { period: '2025-II', subject: 'Estadística', grade: 8.0, status: 'Aprobada' },
      { period: '2026-I', subject: 'Procesos de Manufactura', grade: 8.2, status: 'Aprobada' },
      { period: '2026-I', subject: 'Calidad Total', grade: 7.9, status: 'Aprobada' }
    ]
  }
];
