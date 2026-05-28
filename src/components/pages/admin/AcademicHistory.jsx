import React, { useMemo, useState } from 'react';
import { History, Search, GraduationCap } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
import { academicHistories } from './adminSeedData';

export default function AcademicHistory() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(academicHistories[0].id);

  const visibleStudents = useMemo(() => {
    return academicHistories.filter((student) => `${student.id} ${student.name}`.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const selectedStudent = visibleStudents.find((student) => student.id === selectedId) || visibleStudents[0] || academicHistories[0];

  return (
    <AdminPageShell
      eyebrow="Historial académico"
      title="Seguimiento integral del estudiante"
      subtitle="Busca por cédula o nombre y revisa el acumulado, créditos aprobados y la línea de tiempo de su rendimiento."
      metrics={[
        { label: 'CUM promedio', value: selectedStudent.cum.toFixed(1), hint: 'Promedio acumulado del estudiante seleccionado', icon: History, tone: 'primary' },
        { label: 'Créditos aprobados', value: selectedStudent.credits, hint: 'Carga académica superada con éxito', icon: GraduationCap, tone: 'success' },
        { label: 'Materias cursadas', value: selectedStudent.courses, hint: 'Registro histórico disponible', icon: History, tone: 'info' }
      ]}
    >
      <SectionCard title="Buscador predictivo" description="Filtra el listado y selecciona un estudiante para ver su recorrido completo.">
        <div style={{ maxWidth: '420px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cédula o nombre" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Estudiantes encontrados" description="Selecciona una ficha para cargar su resumen histórico.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedId(student.id)}
                style={{
                  textAlign: 'left',
                  border: selectedId === student.id ? '1px solid #051124' : '1px solid #e2e8f0',
                  background: selectedId === student.id ? 'rgba(5, 17, 36, 0.06)' : '#f8fafc',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a' }}>{student.name}</strong>
                  <StatusBadge tone="info">{student.id}</StatusBadge>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{student.career}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={selectedStudent.name} description={selectedStudent.career}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <span className="form-label">CUM</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{selectedStudent.cum.toFixed(1)}</strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <span className="form-label">Créditos</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{selectedStudent.credits}</strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <span className="form-label">Materias</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{selectedStudent.courses}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedStudent.timeline.map((entry) => (
              <article key={`${entry.period}-${entry.subject}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '12px', alignItems: 'center', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                <strong style={{ color: '#051124' }}>{entry.period}</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ color: '#0f172a' }}>{entry.subject}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Nota final consolidada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge tone={entry.grade >= 8 ? 'success' : entry.grade >= 6.5 ? 'warning' : 'danger'}>{entry.grade.toFixed(1)}</StatusBadge>
                  <StatusBadge tone="info">{entry.status}</StatusBadge>
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            <ActionButton variant="secondary">Exportar historial</ActionButton>
            <ActionButton variant="accent">Generar constancia</ActionButton>
          </div>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
