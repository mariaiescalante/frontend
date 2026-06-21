import React, { useMemo, useState, useEffect } from 'react';
import { BookOpenCheck, Filter } from 'lucide-react';
import { AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function TeacherSubjects() {
  const { user } = useAuth();
  const [careerFilter, setCareerFilter] = useState('Todas');
  const [periodFilter, setPeriodFilter] = useState('Todos');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      if (!user?.id_teacher) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [secRes, detRes] = await Promise.all([
          api.get('/sections'),
          api.get('/registration-details')
        ]);
        
        const allSections = Array.isArray(secRes) ? secRes : (secRes?.data || []);
        const allDetails = Array.isArray(detRes) ? detRes : (detRes?.data || []);
        
        // Filtrar las secciones que corresponden a este profesor
        const teacherSections = allSections.filter(s => s.id_teacher === user.id_teacher);
        
        const mapped = teacherSections.map(s => {
          const sectionDetails = allDetails.filter(d => d.id_section === s.id_section);
          let status = 'abierta';
          if (sectionDetails.length > 0 && sectionDetails.every(d => d.grade_status === 'Confirmada')) {
            status = 'cerrada';
          }
          
          return {
            id: s.id_section,
            code: s.Subject?.code_subject || '',
            subject: s.Subject?.name_subject || 'Desconocido',
            section: s.section_code || '',
            career: s.Career?.name_career || 'No definida',
            semester: 'N/A', // Semester is derived from PensumSubject usually, showing N/A
            period: s.AcademicPeriod?.name_period || '',
            actStatus: status
          };
        });
        
        setAssignments(mapped);
      } catch (err) {
        console.error('Error loading teacher subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, [user]);

  const careerOptions = useMemo(
    () => ['Todas', ...new Set(assignments.map((item) => item.career))],
    [assignments]
  );

  const periodOptions = useMemo(
    () => ['Todos', ...new Set(assignments.map((item) => item.period))],
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const byCareer = careerFilter === 'Todas' || item.career === careerFilter;
      const byPeriod = periodFilter === 'Todos' || item.period === periodFilter;
      return byCareer && byPeriod;
    });
  }, [careerFilter, periodFilter, assignments]);

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

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Modulo Docente"
        title="Consultar Asignaturas Impartidas"
        subtitle="Cargando carga académica..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando asignaturas...</span>
        </div>
      </AdminPageShell>
    );
  }

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
