import React, { useState } from 'react';
import { CalendarDays, CirclePlus, Clock3 } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge } from './AdminPageShell';
import { academicPeriods } from './adminSeedData';

export default function AcademicPeriods() {
  const [status, setStatus] = useState('Planificación');

  return (
    <AdminPageShell
      eyebrow="Gestión de períodos"
      title="Períodos académicos activos, pasados e históricos"
      subtitle="Cada ciclo se presenta con su calendario y estado operativo para mantener clara la transición entre inscripciones, clases y cierre."
      actions={<ActionButton variant="accent"><CirclePlus size={16} /> Nuevo período</ActionButton>}
      metrics={[
        { label: 'Período actual', value: '2026-II', hint: 'Inscripción abierta y lista de espera activa', icon: CalendarDays, tone: 'warning' },
        { label: 'Historiales', value: '4', hint: 'Ciclos disponibles para consulta administrativa', icon: Clock3, tone: 'primary' },
        { label: 'Estados', value: '4', hint: 'Planificación, inscripción, curso y cierre', icon: Clock3, tone: 'info' }
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Línea de tiempo académica" description="La historia de períodos conserva el orden visual del módulo para lectura rápida.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {academicPeriods.map((period) => (
              <article key={period.name} style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ width: '12px', borderRadius: '999px', background: period.status === 'Inscripción Abierta' ? '#ffd100' : period.status === 'Cerrado' ? '#94a3b8' : '#3b82f6' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{period.name}</h4>
                    <StatusBadge tone={period.status === 'Inscripción Abierta' ? 'warning' : period.status === 'Cerrado' ? 'neutral' : 'info'}>{period.status}</StatusBadge>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{period.note}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748b', display: 'block' }}>Inicio</span><strong>{period.start}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block' }}>Fin</span><strong>{period.end}</strong></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Crear período" description="Formulario rápido para abrir una nueva ventana administrativa.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Nombre del período</span>
              <input className="form-input" placeholder="2027-I" />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Fecha inicio</span>
              <input className="form-input" type="date" />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Fecha fin</span>
              <input className="form-input" type="date" />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Estado operativo</span>
              <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>Planificación</option>
                <option>Inscripción Abierta</option>
                <option>Clases en Curso</option>
                <option>Cerrado</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              <ActionButton variant="secondary">Guardar borrador</ActionButton>
              <ActionButton variant="accent">Abrir período</ActionButton>
            </div>
          </div>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
