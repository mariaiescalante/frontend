import React, { useState, useEffect } from 'react';
import { History, LibraryBig } from 'lucide-react';
import { AdminPageShell, DataTable, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function TeacherHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.id_teacher) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [secRes, detRes] = await Promise.all([
          api.get('/sections'),
          api.get('/registration-details')
        ]);
        
        const allSections = Array.isArray(secRes) ? secRes : (secRes?.data || []);
        const allDetails = Array.isArray(detRes) ? detRes : (detRes?.data || []);
        
        const teacherSections = allSections.filter(s => s.id_teacher === user.id_teacher);
        
        const historyList = [];
        for (const s of teacherSections) {
          const sectionDetails = allDetails.filter(d => d.id_section === s.id_section);
          
          const isClosedPeriod = s.AcademicPeriod?.period_status === 'Cerrada';
          const isClosedActa = sectionDetails.length > 0 && sectionDetails.every(d => d.grade_status === 'Confirmada');
          
          if (isClosedPeriod || isClosedActa) {
            historyList.push({
              id: s.id_section,
              period: s.AcademicPeriod?.name_period || 'N/A',
              code: s.Subject?.code_subject || '',
              subject: s.Subject?.name_subject || 'Desconocido',
              section: s.section_code || '',
              career: s.Career?.name_career || 'No definida',
              semester: 'N/A',
              status: isClosedPeriod ? 'Periodo cerrado' : 'Acta cerrada'
            });
          }
        }
        
        setHistory(historyList);
      } catch (err) {
        console.error('Error loading teacher history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Modulo Docente"
        title="Consultar Historial de Asignaturas Impartidas"
        subtitle="Cargando historial..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando historial académico...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Consultar Historial de Asignaturas Impartidas"
      subtitle="Consulta periodos anteriores en modo solo lectura para mantener trazabilidad academica."
      metrics={[
        {
          label: 'Periodos registrados',
          value: new Set(history.map((item) => item.period)).size,
          hint: 'Cantidad de periodos historicos disponibles',
          icon: History,
          tone: 'info'
        },
        {
          label: 'Asignaturas historicas',
          value: history.length,
          hint: 'Materias impartidas en periodos anteriores',
          icon: LibraryBig,
          tone: 'primary'
        }
      ]}
    >
      <SectionCard
        title="Historial academico"
        description="Vista solo lectura de asignaturas impartidas con su estado final."
      >
        <DataTable columns={['Periodo', 'Codigo', 'Asignatura', 'Seccion', 'Carrera', 'Semestre', 'Estado']}>
          {history.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No tienes asignaturas registradas en el historial.
              </td>
            </tr>
          ) : (
            history.map((item) => (
              <tr key={item.id}>
                <td>{item.period}</td>
                <td>{item.code}</td>
                <td>{item.subject}</td>
                <td>{item.section}</td>
                <td>{item.career}</td>
                <td>{item.semester}</td>
                <td>
                  <StatusBadge tone="neutral">{item.status}</StatusBadge>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </SectionCard>
    </AdminPageShell>
  );
}
