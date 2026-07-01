import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, CircleX, Eye, ClipboardList } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge, CustomSelect, Pagination } from './AdminPageShell';
import api from '../../../services/api';

export default function EnrollmentsManagement() {
  const [filter, setFilter] = useState('Todos');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Cargar períodos al montar y elegir el activo
  useEffect(() => {
    async function init() {
      try {
        const perRes = await api.get('/periods');
        const perList = Array.isArray(perRes.data) ? perRes.data : perRes;
        setPeriods(perList);
        const active = perList.find(p => p.period_status === 'Activo') || perList[0];
        setSelectedPeriod(String(active?.id_period || ''));
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  // Cargar inscripciones cuando cambia página o período seleccionado
  useEffect(() => {
    async function loadData() {
      if (!selectedPeriod) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
        });
        if (selectedPeriod) params.set('id_period', selectedPeriod);
        const regRes = await api.get(`/registrations?${params.toString()}`);
        if (regRes?.data && regRes?.meta) {
          setAllRegistrations(regRes.data);
          setTotalPages(regRes.meta.totalPages);
          setTotalItems(regRes.meta.totalItems);
        } else {
          const list = Array.isArray(regRes?.data) ? regRes.data : (Array.isArray(regRes) ? regRes : []);
          setAllRegistrations(list);
          setTotalPages(1);
          setTotalItems(list.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentPage, selectedPeriod]);

  const requests = useMemo(() => {
    return allRegistrations.map(reg => {
      // Backend now includes Student -> User and Student -> Career
      const studentUser = reg.Student?.User;
      const studentName = studentUser ? `${studentUser.document_id} - ${studentUser.first_name} ${studentUser.first_lastname}` : `ID Estudiante: ${reg.id_student}`;
      const careerName = reg.Student?.Career?.name_career || 'No definida';
      const period = reg.AcademicPeriod?.name_period || 'Desconocido';
      
      const detailsForReg = reg.RegistrationDetails || [];
      let totalCredits = 0;
      const detailsTexts = detailsForReg.map(d => {
        const sec = d.Section;
        if (sec && sec.Subject) {
          totalCredits += sec.Subject.credit_units || 0;
          return `${sec.section_code} - ${sec.Subject.name_subject}`;
        }
        return `Seccion ID: ${d.id_section}`;
      });

      return {
        id: reg.id_registration,
        student: studentName,
        career: careerName,
        period: period,
        courses: detailsForReg.length,
        totalCredits: totalCredits,
        details: detailsTexts
      };
    });
  }, [allRegistrations]);

  const careers = useMemo(() => {
    const list = new Set(requests.map(r => r.career));
    return ['Todos', ...Array.from(list)];
  }, [requests]);

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => filter === 'Todos' || request.career === filter);
  }, [filter, requests]);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Gestión de inscripciones"
        title="Auditoría de solicitudes académicas"
        subtitle="Cargando inscripciones desde el servidor..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Gestión de inscripciones"
      title="Auditoría de solicitudes académicas"
      subtitle="Supervisa las inscripciones de estudiantes y accede al detalle de sus materias inscritas con una vista uniforme conectada a la base de datos."
      metrics={[
        { label: 'Total de Inscripciones', value: String(requests.length), hint: 'Solicitudes registradas en el sistema', icon: ClipboardList, tone: 'primary' },
        { label: 'Materias Inscritas', value: String(requests.reduce((sum, r) => sum + r.courses, 0)), hint: 'Total de asignaturas cargadas', icon: ClipboardList, tone: 'info' },
        { label: 'Total de Créditos', value: String(requests.reduce((sum, r) => sum + r.totalCredits, 0)), hint: 'Créditos académicos en curso', icon: CheckCircle2, tone: 'success' }
      ]}
    >
      <SectionCard
        title="Inscripciones por Carrera"
        description="Listado detallado de solicitudes con acceso a su ficha de materias registradas."
        actions={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <CustomSelect
              value={selectedPeriod}
              onChange={(val) => { setSelectedPeriod(String(val)); setCurrentPage(1); }}
              options={periods.map(p => ({ value: String(p.id_period), label: p.name_period }))}
              style={{ minWidth: '160px' }}
            />
            <CustomSelect
              value={filter}
              onChange={(val) => { setFilter(String(val)); setCurrentPage(1); }}
              options={careers.map(career => ({
                value: career,
                label: career
              }))}
              style={{ minWidth: '220px' }}
            />
          </div>
        }
      >
        <DataTable columns={["Solicitud", "Estudiante", "Carrera", "Período", "Materias", "Acciones"]}>
          {visibleRequests.map((request) => (
            <tr key={request.id}>
              <td>REQ-{request.id}</td>
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
          {visibleRequests.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No se encontraron inscripciones</td>
            </tr>
          )}
        </DataTable>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </SectionCard>

      <Modal
        open={Boolean(selectedRequest)}
        title={selectedRequest ? `Detalle de Solicitud REQ-${selectedRequest.id}` : ''}
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
                {selectedRequest.details.length === 0 ? (
                  <li style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem', color: '#64748b', fontWeight: 600 }}>Sin materias inscritas</li>
                ) : (
                  selectedRequest.details.map((detail, idx) => (
                    <li key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                      {detail}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminPageShell>
  );
}
