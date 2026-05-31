export const teacherAssignments = [
  {
    id: 'asg-1',
    code: 'INF-301',
    subject: 'Programacion III',
    section: 'A-01',
    career: 'Informatica',
    semester: '2026-II',
    period: '2026-II',
    enrolled: 28,
    editableUntil: '2026-12-10T23:59:59',
    actStatus: 'abierta'
  },
  {
    id: 'asg-2',
    code: 'ADM-220',
    subject: 'Metodologia de la Investigacion',
    section: 'B-02',
    career: 'Administracion',
    semester: '2026-II',
    period: '2026-II',
    enrolled: 24,
    editableUntil: '2026-12-10T23:59:59',
    actStatus: 'abierta'
  },
  {
    id: 'asg-3',
    code: 'INF-405',
    subject: 'Arquitectura de Software',
    section: 'C-03',
    career: 'Informatica',
    semester: '2026-I',
    period: '2026-I',
    enrolled: 21,
    editableUntil: '2026-06-15T23:59:59',
    actStatus: 'cerrada'
  }
];

export const teacherEnrollments = {
  'asg-1': [
    {
      id: 'st-001',
      cedula: 'V-28900123',
      name: 'Maria Fernanda Soto',
      grades: { c1: '18', c2: '19', c3: '17', c4: '' },
      contents: {
        c1: 'Estructuras de datos',
        c2: 'POO avanzada',
        c3: 'Persistencia con API REST',
        c4: ''
      }
    },
    {
      id: 'st-002',
      cedula: 'V-29544321',
      name: 'Andres Pirela',
      grades: { c1: '14', c2: '16', c3: '', c4: '' },
      contents: {
        c1: 'Listas enlazadas',
        c2: 'Componentes y modularidad',
        c3: '',
        c4: ''
      }
    },
    {
      id: 'st-003',
      cedula: 'V-30011234',
      name: 'Gabriela Morales',
      grades: { c1: '', c2: '', c3: '', c4: '' },
      contents: { c1: '', c2: '', c3: '', c4: '' }
    }
  ],
  'asg-2': [
    {
      id: 'st-004',
      cedula: 'V-28765001',
      name: 'Jose Martinez',
      grades: { c1: '20', c2: '18', c3: '19', c4: '' },
      contents: {
        c1: 'Diseno de marco teorico',
        c2: 'Normas APA',
        c3: 'Instrumentos de recoleccion',
        c4: ''
      }
    },
    {
      id: 'st-005',
      cedula: 'V-29100876',
      name: 'Daniela Suarez',
      grades: { c1: '17', c2: '', c3: '', c4: '' },
      contents: {
        c1: 'Problema de investigacion',
        c2: '',
        c3: '',
        c4: ''
      }
    }
  ],
  'asg-3': [
    {
      id: 'st-006',
      cedula: 'V-27888999',
      name: 'Luis Ramirez',
      grades: { c1: '16', c2: '15', c3: '17', c4: '18' },
      contents: {
        c1: 'Patrones creacionales',
        c2: 'Patrones estructurales',
        c3: 'Patrones de comportamiento',
        c4: 'Microservicios'
      }
    }
  ]
};

export const teacherHistory = [
  {
    id: 'hist-1',
    period: '2026-I',
    code: 'INF-405',
    subject: 'Arquitectura de Software',
    section: 'C-03',
    career: 'Informatica',
    semester: '2026-I',
    status: 'Acta cerrada'
  },
  {
    id: 'hist-2',
    period: '2025-II',
    code: 'INF-220',
    subject: 'Base de Datos II',
    section: 'D-01',
    career: 'Informatica',
    semester: '2025-II',
    status: 'Acta cerrada'
  }
];

export function cloneEnrollments() {
  return JSON.parse(JSON.stringify(teacherEnrollments));
}
