import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileLock2 } from 'lucide-react';
import { ActionButton, AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { teacherAssignments } from './teacherSeedData';
import { loadActStatusMap, saveActStatusMap } from './teacherStorage';

export default function TeacherRecords() {
  const [actStatusMap, setActStatusMap] = useState(() => loadActStatusMap());

  const records = useMemo(() => {
    return teacherAssignments.map((item) => {
      const status = actStatusMap[item.id] || item.actStatus;
      return { ...item, status };
    });
  }, [actStatusMap]);

  const openCount = records.filter((record) => record.status !== 'cerrada').length;

  const closeRecord = (assignmentId) => {
    const approved = window.confirm('Al cerrar el acta no podras editar notas para esta seccion. Deseas continuar?');
    if (!approved) return;

    const nextMap = { ...actStatusMap, [assignmentId]: 'cerrada' };
    setActStatusMap(nextMap);
    saveActStatusMap(nextMap);
  };

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Cerrar Actas de Notas"
      subtitle="Cierra actas para bloquear edicion y dejar constancia academica final."
      metrics={[
        {
          label: 'Actas abiertas',
          value: openCount,
          hint: 'Actas pendientes por cierre',
          icon: FileLock2,
          tone: openCount ? 'warning' : 'success'
        },
        {
          label: 'Actas cerradas',
          value: records.length - openCount,
          hint: 'Registros bloqueados para edicion',
          icon: CheckCircle2,
          tone: 'success'
        }
      ]}
    >
      <SectionCard
        title="Control de cierre"
        description="Una vez cerrada el acta, las notas de la seccion no podran editarse."
      >
        <DataTable columns={['Codigo', 'Asignatura', 'Seccion', 'Carrera', 'Periodo', 'Estado', 'Accion']}>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.code}</td>
              <td>{record.subject}</td>
              <td>{record.section}</td>
              <td>{record.career}</td>
              <td>{record.period}</td>
              <td>
                <StatusBadge tone={record.status === 'cerrada' ? 'neutral' : 'warning'}>
                  {record.status}
                </StatusBadge>
              </td>
              <td>
                {record.status === 'cerrada' ? (
                  <StatusBadge tone="success">Bloqueada</StatusBadge>
                ) : (
                  <ActionButton variant="secondary" onClick={() => closeRecord(record.id)}>
                    Cerrar acta
                  </ActionButton>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>
    </AdminPageShell>
  );
}
