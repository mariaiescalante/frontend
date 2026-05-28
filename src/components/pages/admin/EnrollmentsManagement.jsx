import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleX, Eye, ClipboardList } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge } from './AdminPageShell';
import { enrollmentRequests } from './adminSeedData';

export default function EnrollmentsManagement() {
  const [filter, setFilter] = useState('Todos');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState(enrollmentRequests);

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => filter === 'Todos' || request.status === filter);
  }, [filter, requests]);

  const updateStatus = (id, nextStatus) => {
    setRequests((currentRequests) => currentRequests.map((request) => (request.id === id ? { ...request, status: nextStatus } : request)));
  };

  return (
    <AdminPageShell
      eyebrow="Gestión de inscripciones"
      title="Auditoría de solicitudes académicas"
      subtitle="Supervisa las inscripciones de estudiantes, aprueba o rechaza solicitudes y abre el detalle con una vista uniforme."
      metrics={[
        { label: 'Pendientes', value: requests.filter((request) => request.status === 'Pendiente').length, hint: 'Solicitudes esperando revisión', icon: ClipboardList, tone: 'warning' },
        { label: 'Aprobadas', value: requests.filter((request) => request.status === 'Aprobada').length, hint: 'Inscripciones confirmadas', icon: CheckCircle2, tone: 'success' },
        { label: 'Rechazadas', value: requests.filter((request) => request.status === 'Rechazada').length, hint: 'Solicitudes con observaciones', icon: CircleX, tone: 'danger' }
      ]}
    >
      <SectionCard
        title="Estados de revisión"
        description="Selecciona el conjunto que deseas auditar antes de tomar una decisión."
        actions={
          <select className="form-input" value={filter} onChange={(event) => setFilter(event.target.value)} style={{ minWidth: '220px' }}>
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Aprobada</option>
            <option>Rechazada</option>
          </select>
        }
      >
        <DataTable columns={["Solicitud", "Estudiante", "Carrera", "Período", "Materias", "Estado", "Acciones"]}>
          {visibleRequests.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.student}</td>
              <td>{request.career}</td>
              <td>{request.period}</td>
              <td>{request.courses} / {request.totalCredits} cr.</td>
              <td>
                <StatusBadge tone={request.status === 'Pendiente' ? 'warning' : request.status === 'Aprobada' ? 'success' : 'danger'}>{request.status}</StatusBadge>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ActionButton variant="secondary" onClick={() => setSelectedRequest(request)}><Eye size={14} /> Ver</ActionButton>
                  <ActionButton variant="accent" onClick={() => updateStatus(request.id, 'Aprobada')}><CheckCircle2 size={14} /> Aprobar</ActionButton>
                  <ActionButton variant="danger" onClick={() => updateStatus(request.id, 'Rechazada')}><CircleX size={14} /> Rechazar</ActionButton>
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
            <>
              <ActionButton variant="ghost" onClick={() => setSelectedRequest(null)}>Cerrar</ActionButton>
              <ActionButton variant="accent" onClick={() => setSelectedRequest(null)}>Confirmar revisión</ActionButton>
            </>
          ) : null
        }
      >
        {selectedRequest ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <div className="glass-panel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '16px' }}>
                <span className="form-label">Cuentas</span>
                <strong>{selectedRequest.courses}</strong>
              </div>
              <div className="glass-panel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '16px' }}>
                <span className="form-label">Créditos</span>
                <strong>{selectedRequest.totalCredits}</strong>
              </div>
              <div className="glass-panel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '16px' }}>
                <span className="form-label">Estado</span>
                <StatusBadge tone={selectedRequest.status === 'Pendiente' ? 'warning' : selectedRequest.status === 'Aprobada' ? 'success' : 'danger'}>{selectedRequest.status}</StatusBadge>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px', color: '#0f172a' }}>Materias seleccionadas</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', display: 'grid', gap: '8px' }}>
                {selectedRequest.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminPageShell>
  );
}
