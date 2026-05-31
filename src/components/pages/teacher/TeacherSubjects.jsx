import React, { useMemo, useState } from 'react';
import { BookOpenCheck, Filter } from 'lucide-react';
import { AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { teacherAssignments } from './teacherSeedData';

export default function TeacherSubjects() {
  const [careerFilter, setCareerFilter] = useState('Todas');
  const [periodFilter, setPeriodFilter] = useState('Todos');

  const careerOptions = useMemo(
    () => ['Todas', ...new Set(teacherAssignments.map((item) => item.career))],
    []
  );

  const periodOptions = useMemo(
    () => ['Todos', ...new Set(teacherAssignments.map((item) => item.period))],
    []
  );

  const filteredAssignments = useMemo(() => {
    return teacherAssignments.filter((item) => {
      const byCareer = careerFilter === 'Todas' || item.career === careerFilter;
      const byPeriod = periodFilter === 'Todos' || item.period === periodFilter;
      return byCareer && byPeriod;
    });
  }, [careerFilter, periodFilter]);

  const metrics = [
    {
      label: 'Asignaturas activas',
      value: filteredAssignments.length,
      hint: 'Materias impartidas por el docente en el filtro actual',
      icon: BookOpenCheck,
      tone: 'info'
    },
    {
      label: 'Secciones',
      value: filteredAssignments.length,
      hint: 'Una seccion por asignatura en esta version del modulo',
      icon: Filter,
      tone: 'primary'
    }
  ];

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Consultar Asignaturas Impartidas"
      subtitle="Visualiza las asignaturas asignadas con su seccion, carrera y semestre."
      metrics={metrics}
    >
      <SectionCard
        title="Filtros de consulta"
        description="Aplica filtros para localizar rapidamente la carga academica del docente."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select className="form-input" value={careerFilter} onChange={(event) => setCareerFilter(event.target.value)}>
              {careerOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Periodo</span>
            <select className="form-input" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
              {periodOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Asignaturas asignadas"
        description="Estas materias son las que actualmente dicta el docente segun su carga academica."
      >
        <DataTable columns={['Codigo', 'Asignatura', 'Seccion', 'Carrera', 'Semestre', 'Periodo', 'Estado Acta']}>
          {filteredAssignments.map((item) => (
            <tr key={item.id}>
              <td>{item.code}</td>
              <td>{item.subject}</td>
              <td>{item.section}</td>
              <td>{item.career}</td>
              <td>{item.semester}</td>
              <td>{item.period}</td>
              <td>
                <StatusBadge tone={item.actStatus === 'cerrada' ? 'neutral' : 'success'}>
                  {item.actStatus}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>
    </AdminPageShell>
  );
}
