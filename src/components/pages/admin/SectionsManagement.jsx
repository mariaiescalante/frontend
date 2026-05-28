import React, { useMemo, useState } from 'react';
import { Layers3, PlusSquare, Search } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, ProgressBar, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
import { sectionCatalog } from './adminSeedData';

export default function SectionsManagement() {
  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const [semesterFilter, setSemesterFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const subjects = ['Todas', ...new Set(sectionCatalog.map((section) => section.subject))];
  const semesters = ['Todos', ...new Set(sectionCatalog.map((section) => section.semester))];

  const visibleSections = useMemo(() => {
    return sectionCatalog.filter((section) => {
      const matchesSubject = subjectFilter === 'Todas' || section.subject === subjectFilter;
      const matchesSemester = semesterFilter === 'Todos' || section.semester === semesterFilter;
      const matchesQuery = `${section.code} ${section.subject} ${section.classroom}`.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesSemester && matchesQuery;
    });
  }, [subjectFilter, semesterFilter, query]);

  return (
    <AdminPageShell
      eyebrow="Gestión de secciones"
      title="Secciones académicas y cupos"
      subtitle="El listado presenta cupos, horario y aula asignada con un estilo limpio para abrir nuevas secciones rápidamente."
      actions={<ActionButton variant="accent" onClick={() => setModalOpen(true)}><PlusSquare size={16} /> Abrir sección</ActionButton>}
      metrics={[
        { label: 'Secciones activas', value: `${sectionCatalog.length}`, hint: 'Aulas abiertas en el período actual', icon: Layers3, tone: 'primary' },
        { label: 'Cupos usados', value: `${sectionCatalog.reduce((accumulator, section) => accumulator + section.enrolled, 0)}`, hint: 'Matrícula total acumulada', icon: Layers3, tone: 'info' },
        { label: 'Promedio ocupación', value: `${Math.round(sectionCatalog.reduce((accumulator, section) => accumulator + (section.enrolled / section.capacity) * 100, 0) / sectionCatalog.length)}%`, hint: 'Carga promedio de aulas', icon: Layers3, tone: 'warning' }
      ]}
    >
      <SectionCard title="Filtros de secciones" description="Refina por materia, semestre o texto libre para ubicar el grupo correcto.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sección, materia o aula" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
            </div>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Materia</span>
            <select className="form-input" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              {subjects.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Semestre</span>
            <select className="form-input" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
              {semesters.map((semester) => <option key={semester}>{semester}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Ocupación</span>
            <select className="form-input" defaultValue="Todas">
              <option>Todas</option>
              <option>Menos de 50%</option>
              <option>50% a 80%</option>
              <option>Más de 80%</option>
            </select>
          </label>
        </div>
      </SectionCard>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '18px' }}>
        {visibleSections.map((section) => {
          const occupancy = Math.round((section.enrolled / section.capacity) * 100);
          return (
            <article key={section.code} style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <StatusBadge tone={occupancy > 80 ? 'danger' : occupancy > 60 ? 'warning' : 'success'}>{section.code}</StatusBadge>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>{section.subject}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{section.semester}</p>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 17, 36, 0.08)', color: '#051124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers3 size={20} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <div><span style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Horario</span><strong style={{ display: 'block' }}>{section.schedule}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Aula</span><strong style={{ display: 'block' }}>{section.classroom}</strong></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem', color: '#64748b' }}>
                  <span>Cupos</span>
                  <span>{section.enrolled}/{section.capacity} ({occupancy}%)</span>
                </div>
                <ProgressBar value={occupancy} tone={occupancy > 80 ? 'danger' : occupancy > 60 ? 'warning' : 'success'} />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <ActionButton variant="secondary">Editar</ActionButton>
                <ActionButton variant="ghost">Cerrar sección</ActionButton>
              </div>
            </article>
          );
        })}
      </section>

      <Modal
        open={modalOpen}
        title="Abrir nueva sección"
        subtitle="El formulario respeta la identidad visual del panel para crear una sección sin saltos de diseño."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={() => setModalOpen(false)}>Guardar sección</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <input className="form-input" placeholder="Código de sección" />
          <input className="form-input" placeholder="Materia" />
          <input className="form-input" placeholder="Semestre" />
          <input className="form-input" placeholder="Cupos máximos" />
          <input className="form-input" placeholder="Horario" />
          <input className="form-input" placeholder="Aula" />
        </div>
      </Modal>
    </AdminPageShell>
  );
}
