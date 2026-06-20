import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, FileLock2 } from 'lucide-react';
import { ActionButton, AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function TeacherRecords() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  
  const [assignments, setAssignments] = useState([]);
  const [allDetails, setAllDetails] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!user?.id_teacher) return;
      try {
        setLoading(true);
        const [secRes, detRes] = await Promise.all([
          api.get('/sections'),
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
  }, [user]);

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

  const closeRecord = async (record) => {
    if (record.detailsCount === 0) {
      alert('Esta sección no tiene estudiantes inscritos.');
      return;
    }

    const approved = window.confirm('Al cerrar el acta no podrás editar notas para esta sección. ¿Deseas continuar?');
    if (!approved) return;

    try {
      setIsClosing(true);
      // Actualizar todos los detalles de esta sección a 'Confirmada'
      await Promise.all(record.detailsIds.map(id => 
        api.put(`/registration-details/${id}`, {
          grade_status: 'Confirmada'
        })
      ));
      
      alert('Acta cerrada exitosamente.');
      
      // Recargar detalles
      const detRes = await api.get('/registration-details');
      setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));

    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al intentar cerrar el acta.');
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
      subtitle="Cierra actas para bloquear edicion y dejar constancia academica final en el sistema."
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
                  <StatusBadge tone={record.status === 'cerrada' ? 'neutral' : 'warning'}>
                    {record.status}
                  </StatusBadge>
                </td>
                <td>
                  {record.status === 'cerrada' ? (
                    <StatusBadge tone="success">Bloqueada</StatusBadge>
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
    </AdminPageShell>
  );
}
