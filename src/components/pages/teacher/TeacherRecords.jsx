import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileLock2 } from 'lucide-react';
import { ActionButton, AdminPageShell, DataTable, SectionCard, StatusBadge, ConfirmDialog, CustomSelect } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function TeacherRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState({ open: false, record: null });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };
  
  const [assignments, setAssignments] = useState([]);
  const [allDetails, setAllDetails] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  useEffect(() => {
    async function loadPeriods() {
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
    loadPeriods();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user?.id_teacher || !selectedPeriod) return;
      try {
        setLoading(true);
        const [secRes, detRes] = await Promise.all([
          api.get(`/sections?id_period=${selectedPeriod}`),
          api.get('/registration-details')
        ]);
        
        const teacherSections = (Array.isArray(secRes) ? secRes : secRes?.data).filter(s => s.id_teacher === user.id_teacher);
        setAssignments(teacherSections);
        setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, selectedPeriod]);

  const records = useMemo(() => {
    return assignments.map((item) => {
      // Find details for this section
      const sectionDetails = allDetails.filter(d => d.id_section === item.id_section);
      
      // If there are details and ALL of them are "Confirmada", the acta is closed.
      // Otherwise it's abierta.
      let status = 'abierta';
      if (sectionDetails.length > 0 && sectionDetails.every(d => d.grade_status === 'Confirmada')) {
        status = 'cerrada';
      }

      return {
        id: item.id_section,
        code: item.Subject?.code_subject || '',
        subject: item.Subject?.name_subject || 'Desconocido',
        section: item.section_code || '',
        career: item.Career?.name_career || 'N/A',
        period: item.AcademicPeriod?.name_period || 'N/A',
        status,
        detailsCount: sectionDetails.length,
        detailsIds: sectionDetails.map(d => d.id_detail)
      };
    });
  }, [assignments, allDetails]);

  const openCount = records.filter((record) => record.status !== 'cerrada').length;
  const selectedPeriodObj = periods.find(p => String(p.id_period) === String(selectedPeriod));
  const isCulminado = selectedPeriodObj?.period_status === 'Culminado';

  const closeRecord = (record) => {
    if (record.detailsCount === 0) {
      showNotification('error', 'Esta sección no tiene estudiantes inscritos.');
      return;
    }
    setConfirmClose({ open: true, record });
  };

  const executeCloseRecord = async () => {
    const record = confirmClose.record;
    if (!record) return;
    setConfirmClose({ open: false, record: null });

    try {
      setIsClosing(true);
      // Actualizar todos los detalles de esta sección a 'Confirmada'
      await Promise.all(record.detailsIds.map(id => 
        api.put(`/registration-details/${id}`, {
          grade_status: 'Confirmada'
        })
      ));
      
      showNotification('success', 'Acta cerrada exitosamente.');
      
      // Recargar detalles
      const detRes = await api.get('/registration-details');
      setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));

    } catch (err) {
      console.error(err);
      showNotification('error', 'Ocurrió un error al intentar cerrar el acta.');
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Modulo Docente"
        title="Cerrar Actas de Notas"
        subtitle="Cargando actas..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Verificando estado de actas...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Cerrar Actas de Notas"
      subtitle="Cierre de actas de notas para dejar constancia académica definitiva."
      metrics={[
        {
          label: 'Actas abiertas',
          value: openCount,
          hint: 'Actas pendientes por cierre',
          icon: FileLock2,
          tone: openCount ? 'warning' : 'success'
        },
        {
          label: 'Actas cerradas',
          value: records.length - openCount,
          hint: 'Registros bloqueados para edicion',
          icon: CheckCircle2,
          tone: 'success'
        }
      ]}
    >
      <SectionCard
        title="Control de cierre"
        description="Una vez cerrada el acta, las notas de la seccion no podran editarse y pasarán al récord definitivo del estudiante."
      >
        <div style={{ marginBottom: '16px', maxWidth: '300px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Período Académico</span>
            <CustomSelect
              value={selectedPeriod}
              onChange={(val) => setSelectedPeriod(String(val))}
              options={periods.map(p => ({ value: String(p.id_period), label: p.name_period }))}
            />
          </label>
        </div>
        <DataTable columns={['Codigo', 'Asignatura', 'Seccion', 'Carrera', 'Periodo', 'Estado', 'Accion']}>
          {records.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No tienes asignaturas asignadas.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id}>
                <td>{record.code}</td>
                <td>{record.subject}</td>
                <td>{record.section}</td>
                <td>{record.career}</td>
                <td>{record.period}</td>
                <td>
                  <StatusBadge tone={record.status === 'cerrada' ? 'warning' : 'success'}>
                    {record.status}
                  </StatusBadge>
                </td>
                <td>
                  {record.status === 'cerrada' ? (
                    <StatusBadge tone="warning">Bloqueada</StatusBadge>
                  ) : isCulminado ? (
                    <StatusBadge tone="danger">Período culminado</StatusBadge>
                  ) : (
                    <ActionButton 
                      variant="secondary" 
                      onClick={() => closeRecord(record)}
                      disabled={isClosing}
                    >
                      {isClosing ? 'Cerrando...' : 'Cerrar acta'}
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </SectionCard>
      <ConfirmDialog
        open={confirmClose.open}
        title="Cerrar acta"
        message="Al cerrar el acta no podrás editar notas para esta sección. ¿Deseas continuar?"
        confirmText="Cerrar acta"
        variant="accent"
        onConfirm={executeCloseRecord}
        onCancel={() => setConfirmClose({ open: false, record: null })}
      />
      <style>{`@keyframes notifPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      {notification.show && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.4)',
            animation: 'notifPop 0.25s ease',
          }}
          onClick={() => setNotification({ show: false, type: '', message: '' })}
        >
          <div
            style={{
              width: 'min(360px, 90%)', background: '#ffffff', borderRadius: '24px',
              padding: '40px 32px 32px', textAlign: 'center',
              boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: notification.type === 'success'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}>
              {notification.type === 'success'
                ? <CheckCircle2 size={36} color="#ffffff" strokeWidth={2.5} />
                : <XCircle size={36} color="#ffffff" strokeWidth={2.5} />
              }
            </div>
            <h3 style={{
              margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800,
              color: notification.type === 'success' ? '#065f46' : '#991b1b',
            }}>
              {notification.type === 'success' ? 'Acta cerrada' : 'Error'}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {notification.message}
            </p>
            <ActionButton variant="accent" onClick={() => setNotification({ show: false, type: '', message: '' })}>
              Aceptar
            </ActionButton>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
