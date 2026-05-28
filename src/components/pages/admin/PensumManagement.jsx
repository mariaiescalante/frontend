import React, { useMemo, useState } from 'react';
import { BookMarked, Layers3, PlusCircle } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge } from './AdminPageShell';
import { careerCatalog, pensumCatalog } from './adminSeedData';

export default function PensumManagement() {
  const [careerCode, setCareerCode] = useState(careerCatalog[0].code);
  const [semesterFilter, setSemesterFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);

  const currentPensum = pensumCatalog[careerCode] || { career: 'Sin datos', semesters: [] };
  const semesters = currentPensum.semesters;

  const filteredSemesters = useMemo(() => {
    return semesterFilter === 'Todos' ? semesters : semesters.filter((semester) => semester.term === semesterFilter);
  }, [semesterFilter, semesters]);

  return (
    <AdminPageShell
      eyebrow="Gestión de pensum"
      title="Plan de estudios por carrera"
      subtitle="La malla académica se visualiza por ciclos para editar materias, créditos y prerrequisitos sin perder contexto."
      actions={
        <ActionButton variant="accent" onClick={() => setModalOpen(true)}>
          <PlusCircle size={16} /> Agregar materia
        </ActionButton>
      }
      metrics={[
        { label: 'Ciclos visibles', value: `${semesters.length}`, hint: 'Semestres cargados para la carrera activa', icon: Layers3, tone: 'primary' },
        { label: 'Materias totales', value: semesters.reduce((accumulator, semester) => accumulator + semester.subjects.length, 0), hint: 'Asignaturas por ciclo y nivel', icon: BookMarked, tone: 'info' },
        { label: 'Obligatorias', value: semesters.flatMap((semester) => semester.subjects).filter((subject) => subject.mandatory).length, hint: 'Núcleo académico del programa', icon: BookMarked, tone: 'success' }
      ]}
    >
      <SectionCard title="Filtros del pensum" description="Elige la carrera y el semestre que deseas inspeccionar o editar.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', maxWidth: '760px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select className="form-input" value={careerCode} onChange={(event) => setCareerCode(event.target.value)}>
              {careerCatalog.map((career) => (
                <option key={career.code} value={career.code}>{career.name}</option>
              ))}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Semestre</span>
            <select className="form-input" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
              <option>Todos</option>
              {semesters.map((semester) => (
                <option key={semester.term}>{semester.term}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title={`Pensum de ${currentPensum.career}`} description="Agrupación por ciclo con indicadores claros de créditos, prerrequisitos y obligatoriedad.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredSemesters.map((semester) => (
            <article key={semester.term} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden' }}>
              <header style={{ padding: '18px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{semester.term}</h4>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{semester.subjects.length} asignaturas registradas</p>
                </div>
                <StatusBadge tone="info">Ciclo activo</StatusBadge>
              </header>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {semester.subjects.map((subject) => (
                    <div key={subject.code} style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <strong style={{ color: '#0f172a' }}>{subject.name}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>{subject.code}</span>
                        </div>
                        <StatusBadge tone={subject.mandatory ? 'success' : 'warning'}>{subject.mandatory ? 'Obligatoria' : 'Electiva'}</StatusBadge>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: '#64748b', display: 'block' }}>Créditos</span><strong>{subject.credits}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block' }}>Prerreq.</span><strong>{subject.prereq}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block' }}>Tipo</span><strong>{subject.mandatory ? 'Núcleo' : 'Optativa'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Agregar materia al pensum"
        subtitle="Mantiene el mismo lenguaje de panel para que la edición curricular se vea integrada."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={() => setModalOpen(false)}>Guardar materia</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <input className="form-input" placeholder="Código" />
          <input className="form-input" placeholder="Nombre" />
          <input className="form-input" placeholder="Semestre" />
          <input className="form-input" placeholder="Créditos" />
          <input className="form-input" placeholder="Prerrequisito" />
          <select className="form-input">
            <option>Obligatoria</option>
            <option>Electiva</option>
          </select>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
