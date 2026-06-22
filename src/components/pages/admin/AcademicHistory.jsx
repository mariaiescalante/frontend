import React, { useState, useEffect } from 'react';
import { History, Search, GraduationCap } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge, fieldStyle, Pagination } from './AdminPageShell';
import api from '../../../services/api';

export default function AcademicHistory() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [students, setStudents] = useState([]);
  const [historyData, setHistoryData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function fetchStudents() {
      try {
        setLoadingList(true);
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
          role: 'students',
          search: query || ''
        });
        
        const response = await api.get(`/users?${params.toString()}`);
        if (!isMounted) return;

        let studentsList = [];
        if (response?.data && response?.meta) {
          studentsList = response.data;
          setTotalPages(response.meta.totalPages);
        } else if (Array.isArray(response?.data)) {
          studentsList = response.data;
          setTotalPages(1);
        } else if (Array.isArray(response)) {
          studentsList = response;
          setTotalPages(1);
        }

        const formattedList = studentsList.map(u => {
          const raw = u.rawUser || u;
          const firstName = raw?.first_name || raw?.name || '';
          const lastName = raw?.first_lastname || raw?.lastname || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ') || u.name;

          return {
            id: raw?.document_id || u.id || '',
            name: fullName,
            career: u.career || (u.Student?.Career?.name_career) || 'Ingeniería en Sistemas'
          };
        });

        setStudents(formattedList);
        // Do not auto-select if we are just switching pages, unless nothing is selected yet
        if (formattedList.length > 0 && !selectedId) {
          setSelectedId(formattedList[0].id);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }

    const timerId = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [currentPage, query]);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!selectedId) return;
      try {
        setLoadingHistory(true);
        const response = await api.get(`/academic-history/${selectedId}`);
        if (!isMounted) return;
        setHistoryData(response.data || response);
      } catch (err) {
        console.error('Error fetching history:', err);
        if (isMounted) setHistoryData(null);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [selectedId]);

  const selectedStudentBasic = students.find(s => s.id === selectedId) || students[0];

  const displayData = historyData || {
    name: selectedStudentBasic?.name || '',
    career: selectedStudentBasic?.career || '',
    cum: 0,
    credits: 0,
    courses: 0,
    timeline: []
  };

  return (
    <AdminPageShell
      eyebrow="Historial académico"
      title="Seguimiento integral del estudiante"
      subtitle="Busca por cédula o nombre y revisa el acumulado, créditos aprobados y la línea de tiempo de su rendimiento."
      metrics={[
        { label: 'CUM promedio', value: Number(displayData.cum || 0).toFixed(1), hint: 'Promedio acumulado del estudiante seleccionado', icon: History, tone: 'primary' },
        { label: 'Créditos aprobados', value: displayData.credits, hint: 'Carga académica superada con éxito', icon: GraduationCap, tone: 'success' },
        { label: 'Materias cursadas', value: displayData.courses, hint: 'Registro histórico disponible', icon: History, tone: 'info' }
      ]}
    >
      <SectionCard title="Buscador predictivo" description="Filtra el listado y selecciona un estudiante para ver su recorrido completo.">
        <div style={{ maxWidth: '420px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input 
              value={query} 
              onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} 
              placeholder="Cédula o nombre" 
              style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} 
              disabled={loadingList && !students.length} 
            />
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Estudiantes encontrados" description="Selecciona una ficha para cargar su resumen histórico.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loadingList && students.length === 0 ? (
              <span style={{ color: '#64748b' }}>Cargando estudiantes...</span>
            ) : students.length === 0 ? (
              <span style={{ color: '#64748b' }}>No hay resultados</span>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  style={{
                    textAlign: 'left',
                    border: selectedId === student.id ? '1px solid #051124' : '1px solid #e2e8f0',
                    background: selectedId === student.id ? 'rgba(5, 17, 36, 0.06)' : '#f8fafc',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f172a' }}>{student.name}</strong>
                    <StatusBadge tone="info">{student.id}</StatusBadge>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{student.career}</span>
                </button>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: '16px' }}>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </SectionCard>

        <SectionCard title={displayData.name || 'Seleccione un estudiante'} description={displayData.career || '---'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', opacity: loadingHistory ? 0.5 : 1 }}>
              <span className="form-label">CUM</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{Number(displayData.cum || 0).toFixed(1)}</strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', opacity: loadingHistory ? 0.5 : 1 }}>
              <span className="form-label">Créditos</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{displayData.credits}</strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', opacity: loadingHistory ? 0.5 : 1 }}>
              <span className="form-label">Materias</span>
              <strong style={{ display: 'block', fontSize: '1.6rem', color: '#051124' }}>{displayData.courses}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: loadingHistory ? 0.5 : 1 }}>
            {loadingHistory ? (
              <span style={{ color: '#64748b' }}>Cargando historial...</span>
            ) : displayData.timeline.length === 0 ? (
              <span style={{ color: '#64748b' }}>No hay registros académicos</span>
            ) : (
              displayData.timeline.map((entry, idx) => (
                <article key={`${entry.period}-${entry.subject}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '12px', alignItems: 'center', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                  <strong style={{ color: '#051124' }}>{entry.period}</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>{entry.subject}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Nota final consolidada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge tone={entry.grade >= 8 ? 'success' : entry.grade >= 6.5 ? 'warning' : 'danger'}>{Number(entry.grade || 0).toFixed(1)}</StatusBadge>
                    <StatusBadge tone="info">{entry.status}</StatusBadge>
                  </div>
                </article>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            <ActionButton variant="secondary" disabled={loadingHistory || !historyData}>Exportar historial</ActionButton>
            <ActionButton variant="accent" disabled={loadingHistory || !historyData}>Generar constancia</ActionButton>
          </div>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
