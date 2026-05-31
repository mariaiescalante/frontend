import React from 'react';
import { History, LibraryBig } from 'lucide-react';
import { AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { teacherHistory } from './teacherSeedData';

export default function TeacherHistory() {
  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Consultar Historial de Asignaturas Impartidas"
      subtitle="Consulta periodos anteriores en modo solo lectura para mantener trazabilidad academica."
      metrics={[
        {
          label: 'Periodos registrados',
          value: new Set(teacherHistory.map((item) => item.period)).size,
          hint: 'Cantidad de periodos historicos disponibles',
          icon: History,
          tone: 'info'
        },
        {
          label: 'Asignaturas historicas',
          value: teacherHistory.length,
          hint: 'Materias impartidas en periodos anteriores',
          icon: LibraryBig,
          tone: 'primary'
        }
      ]}
    >
      <SectionCard
        title="Historial academico"
        description="Vista solo lectura de asignaturas impartidas con su estado final."
      >
        <DataTable columns={['Periodo', 'Codigo', 'Asignatura', 'Seccion', 'Carrera', 'Semestre', 'Estado']}>
          {teacherHistory.map((item) => (
            <tr key={item.id}>
              <td>{item.period}</td>
              <td>{item.code}</td>
              <td>{item.subject}</td>
              <td>{item.section}</td>
              <td>{item.career}</td>
              <td>{item.semester}</td>
              <td>
                <StatusBadge tone="neutral">{item.status}</StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>
    </AdminPageShell>
  );
}
