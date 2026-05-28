import React, { useMemo, useState } from 'react';
import { BadgeCheck, UserRoundCog, Slash } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge } from './AdminPageShell';
import { careerCatalog, sectionCatalog, teacherAssignments, teachersCatalog, pensumCatalog } from './adminSeedData';

const initialCareerCode = 'ING-SIS';
const initialSemester = 'Semestre 3';
const initialSubject = 'Bases de Datos';
const initialSection = 'SIS-301-A';
const initialTeacher = teachersCatalog[0].name;

const semesterOptions = (careerCode) => (pensumCatalog[careerCode]?.semesters || []).map((semester) => semester.term);

export default function TeacherAssignment() {
  const [careerCode, setCareerCode] = useState(initialCareerCode);
  const [semester, setSemester] = useState(initialSemester);
  const [subject, setSubject] = useState(initialSubject);
  const [section, setSection] = useState(initialSection);
  const [teacher, setTeacher] = useState(initialTeacher);

  const availableSubjects = useMemo(() => {
    const semesterData = pensumCatalog[careerCode]?.semesters.find((entry) => entry.term === semester);
    return semesterData ? semesterData.subjects.map((entry) => entry.name) : [];
  }, [careerCode, semester]);

  const availableSections = useMemo(() => {
    const matches = sectionCatalog.filter((entry) => entry.subject === subject);
    return matches.length ? matches : sectionCatalog;
  }, [subject]);

  const warning = subject === 'Bases de Datos' && teacher === 'Ing. Roberto León';

  const handleCareerChange = (nextCareer) => {
    const nextSemester = semesterOptions(nextCareer)[0] || 'Semestre 1';
    const nextSubject = pensumCatalog[nextCareer]?.semesters.find((entry) => entry.term === nextSemester)?.subjects[0]?.name || '';
    const nextSection = sectionCatalog.find((entry) => entry.subject === nextSubject)?.code || sectionCatalog[0].code;

    setCareerCode(nextCareer);
    setSemester(nextSemester);
    setSubject(nextSubject);
    setSection(nextSection);
  };

  return (
    <AdminPageShell
      eyebrow="Asignación docente"
      title="Flujo jerárquico de vinculación académica"
      subtitle="Selecciona carrera, ciclo, materia, sección y docente en una secuencia clara que respeta el lenguaje visual del resto del portal."
      metrics={[
        { label: 'Asignaciones vigentes', value: `${teacherAssignments.length}`, hint: 'Vínculos activos en auditoría rápida', icon: UserRoundCog, tone: 'primary' },
        { label: 'Docentes disponibles', value: `${teachersCatalog.filter((teacherRecord) => teacherRecord.status === 'Disponible').length}`, hint: 'Profesores listos para nueva carga', icon: BadgeCheck, tone: 'success' },
        { label: 'Conflictos', value: warning ? '1' : '0', hint: 'Validación de horario al vuelo', icon: Slash, tone: warning ? 'danger' : 'info' }
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Flujo de asignación" description="La secuencia de selección limita errores y mantiene la navegación intuitiva.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Carrera</span>
              <select className="form-input" value={careerCode} onChange={(event) => handleCareerChange(event.target.value)}>
                {careerCatalog.map((career) => <option key={career.code} value={career.code}>{career.name}</option>)}
              </select>
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Semestre</span>
              <select className="form-input" value={semester} onChange={(event) => setSemester(event.target.value)}>
                {semesterOptions(careerCode).map((semesterOption) => <option key={semesterOption}>{semesterOption}</option>)}
              </select>
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Asignatura</span>
              <select className="form-input" value={subject} onChange={(event) => setSubject(event.target.value)}>
                {availableSubjects.map((subjectOption) => <option key={subjectOption}>{subjectOption}</option>)}
              </select>
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Sección</span>
              <select className="form-input" value={section} onChange={(event) => setSection(event.target.value)}>
                {availableSections.map((sectionOption) => <option key={sectionOption.code} value={sectionOption.code}>{sectionOption.code} - {sectionOption.classroom}</option>)}
              </select>
            </label>
            <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <span className="form-label">Docente</span>
              <select className="form-input" value={teacher} onChange={(event) => setTeacher(event.target.value)}>
                {teachersCatalog.map((teacherOption) => <option key={teacherOption.id}>{teacherOption.name}</option>)}
              </select>
            </label>
          </div>
          {warning ? (
            <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)', color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Se detectó un posible conflicto de horario. Revisa la carga antes de consolidar la asignación.
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            <ActionButton variant="secondary">Previsualizar</ActionButton>
            <ActionButton variant="accent">Asignar docente</ActionButton>
          </div>
        </SectionCard>

        <SectionCard title="Asignaciones vigentes" description="Agrupación útil para auditoría rápida y revisión de carga.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {teacherAssignments.map((assignment) => (
              <article key={`${assignment.section}-${assignment.teacher}`} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: '#f8fafc', display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a' }}>{assignment.subject}</strong>
                  <StatusBadge tone="info">{assignment.section}</StatusBadge>
                </div>
                <span style={{ color: '#475569' }}>{assignment.teacher}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{assignment.career} · {assignment.semester}</span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{assignment.schedule}</span>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
