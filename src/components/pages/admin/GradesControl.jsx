import React, { useMemo, useState } from 'react';
import { Award, FilePenLine, ShieldCheck } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge } from './AdminPageShell';
import { gradeSections } from './adminSeedData';

export default function GradesControl() {
  const [sectionCode, setSectionCode] = useState(gradeSections[0].section);
  const [subject, setSubject] = useState(gradeSections[0].subject);
  const [grades, setGrades] = useState(gradeSections[0].students);

  const section = useMemo(() => gradeSections.find((entry) => entry.section === sectionCode) || gradeSections[0], [sectionCode]);

  const updateGrade = (studentId, index, value) => {
    setGrades((currentGrades) => currentGrades.map((student) => {
      if (student.id !== studentId) return student;
      const nextCuts = [...student.cortes];
      nextCuts[index] = Number(value) || 0;
      const nextFinal = Number((nextCuts.reduce((accumulator, cut) => accumulator + cut, 0) / nextCuts.length).toFixed(1));
      return { ...student, cortes: nextCuts, final: nextFinal };
    }));
  };

  return (
    <AdminPageShell
      eyebrow="Control de notas"
      title="Evaluaciones por sección y materia"
      subtitle="Corrige notas, revisa promedios y deja el acta lista antes del cierre definitivo."
      metrics={[
        { label: 'Sección seleccionada', value: section.section, hint: section.teacher, icon: Award, tone: 'primary' },
        { label: 'Estudiantes', value: section.students.length, hint: 'Matrícula actual registrada', icon: FilePenLine, tone: 'info' },
        { label: 'Promedio del grupo', value: (section.students.reduce((accumulator, student) => accumulator + student.final, 0) / section.students.length).toFixed(1), hint: 'Resultado general de la sección', icon: ShieldCheck, tone: 'success' }
      ]}
    >
      <SectionCard title="Seleccionar sección y materia" description="El control combina datos de curso con una vista compacta del acta.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', maxWidth: '700px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Sección</span>
            <select className="form-input" value={sectionCode} onChange={(event) => {
              const nextSection = gradeSections.find((entry) => entry.section === event.target.value) || gradeSections[0];
              setSectionCode(nextSection.section);
              setSubject(nextSection.subject);
              setGrades(nextSection.students);
            }}>
              {gradeSections.map((gradeSection) => <option key={gradeSection.section}>{gradeSection.section}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Materia</span>
            <input className="form-input" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Libro de calificaciones" description="Edición en línea de cortes parciales y nota final.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {grades.map((student) => (
            <article key={student.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'grid', gap: '14px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ color: '#0f172a' }}>{student.name}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.84rem' }}>{student.id}</span>
                </div>
                <StatusBadge tone={student.final >= 8 ? 'success' : student.final >= 6.5 ? 'warning' : 'danger'}>{student.final >= 8 ? 'Aprobado' : 'En riesgo'}</StatusBadge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                {student.cortes.map((cut, index) => (
                  <label className="form-group" style={{ marginBottom: 0 }} key={`${student.id}-${index}`}>
                    <span className="form-label">Corte {index + 1}</span>
                    <input className="form-input" value={cut} onChange={(event) => updateGrade(student.id, index, event.target.value)} />
                  </label>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span className="form-label">Final</span>
                  <div style={{ height: '46px', display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: '12px', background: '#ffffff', border: '1px solid #cbd5e1', fontWeight: 800, color: '#051124' }}>{student.final.toFixed(1)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
          <ActionButton variant="secondary">Auditar notas</ActionButton>
          <ActionButton variant="accent">Cerrar acta</ActionButton>
        </div>
      </SectionCard>
    </AdminPageShell>
  );
}
