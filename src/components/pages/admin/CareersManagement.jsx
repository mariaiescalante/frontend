import React, { useMemo, useState } from 'react';
import { Search, School, BookOpenCheck, Plus } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge, fieldStyle, ProgressBar } from './AdminPageShell';
import { careerCatalog } from './adminSeedData';

export default function CareersManagement() {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const visibleCareers = useMemo(() => {
    return careerCatalog.filter((career) => `${career.code} ${career.name} ${career.faculty}`.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <AdminPageShell
      eyebrow="Gestión de carreras"
      title="Carreras con identidad visual uniforme"
      subtitle="Catálogo académico con buscador, métricas y tarjetas claras para editar la oferta sin perder la coherencia del panel."
      actions={
        <ActionButton variant="accent" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nueva carrera
        </ActionButton>
      }
      metrics={[
        { label: 'Carreras activas', value: '4', hint: '2 ingenierías y 2 licenciaturas', icon: School, tone: 'primary' },
        { label: 'Créditos promedio', value: '155', hint: 'Base de malla común por programa', icon: BookOpenCheck, tone: 'info' },
        { label: 'Actualizaciones', value: '1', hint: 'Programa en ajuste curricular', icon: BookOpenCheck, tone: 'warning' }
      ]}
    >
      <SectionCard title="Buscador de carreras" description="Filtra por código, nombre o facultad para ubicar un programa académico con rapidez.">
        <div style={{ maxWidth: '420px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar carrera" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
          </div>
        </div>
      </SectionCard>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '18px' }}>
        {visibleCareers.map((career) => (
          <article key={career.code} className="glass-panel" style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <StatusBadge tone={career.status === 'Activa' ? 'success' : 'warning'}>{career.status}</StatusBadge>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{career.name}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{career.faculty}</p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 17, 36, 0.08)', color: '#051124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={20} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Código</span>
                <strong style={{ color: '#0f172a' }}>{career.code}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Director</span>
                <strong style={{ color: '#0f172a' }}>{career.head}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Créditos</p>
                <strong>{career.creditsRequired}</strong>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Semestres</p>
                <strong>{career.semesters}</strong>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Materias</p>
                <strong>{career.subjects}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Avance del programa</span>
              <ProgressBar value={Math.min(100, career.subjects * 1.4)} tone={career.status === 'Activa' ? 'primary' : 'warning'} />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton variant="secondary">Editar</ActionButton>
              <ActionButton variant="ghost">Ver pensum</ActionButton>
            </div>
          </article>
        ))}
      </section>

      <Modal
        open={modalOpen}
        title="Crear o editar carrera"
        subtitle="El formulario comparte la misma jerarquía visual del resto del panel para no romper la experiencia."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={() => setModalOpen(false)}>Guardar carrera</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <input className="form-input" placeholder="Código" />
          <input className="form-input" placeholder="Nombre" />
          <input className="form-input" placeholder="Facultad" />
          <input className="form-input" placeholder="Director académico" />
          <input className="form-input" placeholder="Créditos requeridos" />
          <input className="form-input" placeholder="Semestres" />
        </div>
      </Modal>
    </AdminPageShell>
  );
}
