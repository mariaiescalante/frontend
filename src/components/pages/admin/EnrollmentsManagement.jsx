import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleX, Eye, ClipboardList } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge } from './AdminPageShell';
import { enrollmentRequests } from './adminSeedData';

export default function EnrollmentsManagement() {
  const [filter, setFilter] = useState('Todos');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState(enrollmentRequests);

  const careers = useMemo(() => {
    const list = new Set(requests.map(r => r.career));
    return ['Todos', ...Array.from(list)];
  }, [requests]);

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => filter === 'Todos' || request.career === filter);
  }, [filter, requests]);



  return (
    <AdminPageShell
      eyebrow="Gestión de inscripciones"
      title="Auditoría de solicitudes académicas"
      subtitle="Supervisa las inscripciones de estudiantes y accede al detalle de sus materias inscritas con una vista uniforme."
      metrics={[
        { label: 'Total de Inscripciones', value: String(requests.length), hint: 'Solicitudes registradas en el período', icon: ClipboardList, tone: 'primary' },
        { label: 'Materias Inscritas', value: String(requests.reduce((sum, r) => sum + r.courses, 0)), hint: 'Total de asignaturas cargadas', icon: ClipboardList, tone: 'info' },
        { label: 'Total de Créditos', value: String(requests.reduce((sum, r) => sum + r.totalCredits, 0)), hint: 'Créditos académicos en curso', icon: CheckCircle2, tone: 'success' }
      ]}
    >
      <SectionCard
        title="Inscripciones por Carrera"
        description="Listado detallado de solicitudes con acceso a su ficha de materias registradas."
        actions={
          <select className="form-input" value={filter} onChange={(event) => setFilter(event.target.value)} style={{ minWidth: '220px' }}>
            {careers.map(career => (
              <option key={career} value={career}>{career}</option>
            ))}
          </select>
        }
      >
        <DataTable columns={["Solicitud", "Estudiante", "Carrera", "Período", "Materias", "Acciones"]}>
          {visibleRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.student}</td>
              <td>{request.career}</td>
              <td>{request.period}</td>
              <td>{request.courses} / {request.totalCredits} cr.</td>
              <td>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ActionButton variant="secondary" onClick={() => setSelectedRequest(request)}><Eye size={14} /> Ver detalle</ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <Modal
        open={Boolean(selectedRequest)}
        title={selectedRequest ? `Detalle ${selectedRequest.id}` : ''}
        subtitle={selectedRequest ? `${selectedRequest.student} - ${selectedRequest.career}` : ''}
        onClose={() => setSelectedRequest(null)}
        footer={
          selectedRequest ? (
            <ActionButton variant="ghost" onClick={() => setSelectedRequest(null)}>Cerrar</ActionButton>
          ) : null
        }
      >
        {selectedRequest ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Materias</span>
                <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{selectedRequest.courses}</strong>
              </div>
              <div className="glass-panel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Créditos</span>
                <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{selectedRequest.totalCredits}</strong>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Materias seleccionadas</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
                {selectedRequest.details.map((detail) => (
                  <li key={detail} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminPageShell>
  );
}
