// Seed data for Student Portal demo (Sofía Herrera)

export const studentProfile = {
  cedula: 'V-28900123',
  name: 'Sofía',
  lastname: 'Herrera',
  email: 'sofia.herrera@sgums.edu',
  phone: '0414-7654321',
  birthDate: '2004-05-15',
  address: 'San Cristóbal, Sector Pirineos, Av. Principal #12',
  career: 'Ingeniería en Sistemas',
  faculty: 'Tecnología',
  director: 'Ing. Mariela Rivas',
  admissionPeriod: '2025-I',
  cum: 16.5, // Venezuelan standard scale (0-20), matching grades like 17, 18, etc.
  creditsRequired: 160,
  academicStatus: 'Desfasado', // Since she has a pending prerequisite
  currentPeriod: '2026-II'
};

export const pensumSystems = [
  {
    semester: 1,
    subjects: [
      { code: 'SIS-101', name: 'Fundamentos de Programación', credits: 4, prereq: 'Ninguno', mandatory: true },
      { code: 'MAT-101', name: 'Álgebra Lineal', credits: 3, prereq: 'Ninguno', mandatory: true },
      { code: 'COM-101', name: 'Comunicación Oral', credits: 2, prereq: 'Ninguno', mandatory: true }
    ]
  },
  {
    semester: 2,
    subjects: [
      { code: 'SIS-201', name: 'Programación Orientada a Objetos', credits: 4, prereq: 'SIS-101', mandatory: true },
      { code: 'MAT-201', name: 'Cálculo Diferencial', credits: 3, prereq: 'MAT-101', mandatory: true },
      { code: 'RED-201', name: 'Redes de Computadoras I', credits: 3, prereq: 'SIS-101', mandatory: true }
    ]
  },
  {
    semester: 3,
    subjects: [
      { code: 'SIS-301', name: 'Bases de Datos I', credits: 4, prereq: 'SIS-201', mandatory: true },
      { code: 'SIS-302', name: 'Estructuras de Datos', credits: 4, prereq: 'SIS-201', mandatory: true },
      { code: 'ING-301', name: 'Inglés Técnico', credits: 2, prereq: 'COM-101', mandatory: false }
    ]
  },
  {
    semester: 4,
    subjects: [
      { code: 'SIS-401', name: 'Ingeniería de Software I', credits: 4, prereq: 'SIS-301', mandatory: true },
      { code: 'SIS-402', name: 'Sistemas Operativos', credits: 4, prereq: 'SIS-302', mandatory: true },
      { code: 'RED-401', name: 'Redes de Computadoras II', credits: 4, prereq: 'RED-201', mandatory: true }
    ]
  },
  {
    semester: 5,
    subjects: [
      { code: 'SIS-501', name: 'Ingeniería de Software II', credits: 4, prereq: 'SIS-401', mandatory: true },
      { code: 'SIS-502', name: 'Desarrollo Web', credits: 4, prereq: 'SIS-301', mandatory: false },
      { code: 'MAT-501', name: 'Estadística y Probabilidades', credits: 3, prereq: 'MAT-201', mandatory: true }
    ]
  }
];

export const academicRecord = [
  // Semestre 1 (Periodo 2025-I)
  { code: 'SIS-101', name: 'Fundamentos de Programación', credits: 4, grade: 18, status: 'Aprobada', period: '2025-I' },
  { code: 'MAT-101', name: 'Álgebra Lineal', credits: 3, grade: 15, status: 'Aprobada', period: '2025-I' },
  { code: 'COM-101', name: 'Comunicación Oral', credits: 2, grade: 17, status: 'Aprobada', period: '2025-I' },

  // Semestre 2 (Periodo 2025-II)
  { code: 'SIS-201', name: 'Programación Orientada a Objetos', credits: 4, grade: 16, status: 'Aprobada', period: '2025-II' },
  { code: 'MAT-201', name: 'Cálculo Diferencial', credits: 3, grade: 14, status: 'Aprobada', period: '2025-II' },
  { code: 'RED-201', name: 'Redes de Computadoras I', credits: 3, grade: 8, status: 'Reprobada', period: '2025-II' }, // Failed!

  // Semestre 3 (Periodo 2026-I)
  { code: 'SIS-301', name: 'Bases de Datos I', credits: 4, grade: 17, status: 'Aprobada', period: '2026-I' },
  { code: 'SIS-302', name: 'Estructuras de Datos', credits: 4, grade: 18, status: 'Aprobada', period: '2026-I' },
  { code: 'ING-301', name: 'Inglés Técnico', credits: 2, grade: 19, status: 'Aprobada', period: '2026-I' }
];

export const availableSections = {
  'RED-201': [
    { code: 'RED-201-A', schedule: 'Martes/Jueves 08:00 - 10:00', classroom: 'Lab Redes', teacher: 'Prof. Carlos Rivas', capacity: 30, enrolled: 18 },
    { code: 'RED-201-B', schedule: 'Martes/Jueves 10:00 - 12:00', classroom: 'Lab Redes', teacher: 'Prof. Carlos Rivas', capacity: 30, enrolled: 22 }
  ],
  'SIS-401': [
    { code: 'SIS-401-A', schedule: 'Lunes/Miércoles 08:00 - 10:00', classroom: 'Aula 12', teacher: 'Prof. Luis García', capacity: 35, enrolled: 25 },
    { code: 'SIS-401-B', schedule: 'Lunes/Miércoles 10:00 - 12:00', classroom: 'Aula 12', teacher: 'Prof. Luis García', capacity: 35, enrolled: 15 }
  ],
  'SIS-402': [
    { code: 'SIS-402-A', schedule: 'Martes/Jueves 14:00 - 16:00', classroom: 'Lab Computación 1', teacher: 'Prof. Roberto León', capacity: 30, enrolled: 28 },
    { code: 'SIS-402-B', schedule: 'Martes/Jueves 16:00 - 18:00', classroom: 'Lab Computación 1', teacher: 'Prof. Roberto León', capacity: 30, enrolled: 12 }
  ],
  'RED-401': [
    { code: 'RED-401-A', schedule: 'Lunes/Miércoles 14:00 - 16:00', classroom: 'Lab Redes', teacher: 'Prof. Carlos Rivas', capacity: 25, enrolled: 14 }
  ]
};
