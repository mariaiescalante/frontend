import React, { useState, useEffect } from 'react';
import { History, Search, GraduationCap, XCircle } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge, fieldStyle, Pagination, CustomSelect, ConfirmDialog } from './AdminPageShell';
import api from '../../../services/api';
import { logoBase64 } from '../../../assets/logoConstant';


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

  // Career filter
  const [careerFilter, setCareerFilter] = useState('');
  const [careers, setCareers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const handleWithdrawSubject = async () => {
    if (!withdrawTarget) return;
    try {
      await api.put(`/registration-details/${withdrawTarget.id_detail}`, {
        subject_status: 'Retirado'
      });
      setWithdrawTarget(null);
      // Refresh history
      const response = await api.get(`/academic-history/${selectedId}`);
      setHistoryData(response.data || response);
    } catch (err) {
      console.error('Error withdrawing subject:', err);
      alert('No se pudo retirar la materia. Intente de nuevo.');
      setWithdrawTarget(null);
    }
  };

  useEffect(() => {
    api.get('/careers').then(res => {
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const list = raw.map(c => ({ value: c.name_career, label: c.name_career }));
      setCareers(list);
    }).catch(err => console.error('Error fetching careers:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchStudents() {
      try {
        setLoadingList(true);
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
          role: 'students',
          search: query || '',
          career: careerFilter || '',
          status: statusFilter || ''
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
  }, [currentPage, query, careerFilter, statusFilter]);

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

  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
        } else {
          reject(new Error('La librería PDF no se cargó correctamente.'));
        }
      };
      script.onerror = () => reject(new Error('Fallo al descargar la librería de PDF desde el servidor.'));
      document.head.appendChild(script);
    });
  };

  const handleExportHistory = async () => {
    if (!displayData) return;

    try {
      const html2pdf = await loadHtml2Pdf();

      let tableHtml = '';
      displayData.timeline.forEach((course) => {
        let statusColor = '#475569';
        if (course.status === 'Aprobada' || course.status === 'Aprobado') statusColor = '#16a34a';
        else if (course.status === 'Reprobada' || course.status === 'Reprobado') statusColor = '#dc2626';
        else if (course.status === 'Cursando' || course.status === 'En curso') statusColor = '#0284c7';

        tableHtml += `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 0.85rem;"><strong>${course.period}</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 0.85rem;">${course.subject}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: 700; font-size: 0.85rem;">${Number(course.grade || 0).toFixed(1)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; color: ${statusColor}; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">
              ${course.status}
            </td>
          </tr>
        `;
      });

      const reportHtml = `
        <div style="font-family: 'Inter', Arial, sans-serif; color: #0f172a; padding: 30px; background-color: #ffffff; max-width: 760px; margin: 0 auto; box-sizing: border-box;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <td style="width: 80px; vertical-align: middle;">
                <img src="${logoBase64}" alt="Logo UPTNT" style="width: 70px; height: auto; display: block;" />
              </td>
              <td style="text-align: left; vertical-align: middle; padding-left: 15px;">
                <h2 style="margin: 0; font-size: 1.15rem; color: #051124; font-weight: 800; letter-spacing: 0.02em;">
                  Universidad Politécnica Territorial del Norte del Táchira
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: #475569; text-transform: uppercase; font-weight: 600;">
                  Secretaría General · Departamento de Registro y Control Académico
                </p>
              </td>
            </tr>
          </table>

          <div style="text-align: center; font-size: 1.35rem; font-weight: 800; color: #051124; margin: 15px 0 25px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #051124; padding-bottom: 8px;">
            Reporte de Historial Académico
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
            <div style="font-size: 0.88rem; line-height: 1.5;">
              <strong style="color: #475569; font-size: 0.78rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Estudiante</strong>
              <span style="color: #0f172a; font-weight: 700;">${displayData.name}</span>
            </div>
            <div style="font-size: 0.88rem; line-height: 1.5;">
              <strong style="color: #475569; font-size: 0.78rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Cédula de Identidad</strong>
              <span style="color: #0f172a; font-weight: 700;">${selectedId}</span>
            </div>
            <div style="font-size: 0.88rem; line-height: 1.5;">
              <strong style="color: #475569; font-size: 0.78rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Carrera / Programa</strong>
              <span style="color: #0f172a; font-weight: 700;">${displayData.career}</span>
            </div>
            <div style="font-size: 0.88rem; line-height: 1.5;">
              <strong style="color: #475569; font-size: 0.78rem; text-transform: uppercase; display: block; margin-bottom: 2px;">Fecha de Emisión</strong>
              <span style="color: #0f172a; font-weight: 700;">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr>
                <th style="border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 0.75rem; text-align: left; background-color: #f1f5f9; color: #051124; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; width: 20%;">Periodo</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 0.75rem; text-align: left; background-color: #f1f5f9; color: #051124; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; width: 50%;">Asignatura</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 0.75rem; text-align: center; background-color: #f1f5f9; color: #051124; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; width: 15%;">Calificación</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 0.75rem; text-align: center; background-color: #f1f5f9; color: #051124; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; width: 15%;">Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${tableHtml}
            </tbody>
          </table>

          <div style="margin-top: 25px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div style="font-size: 0.95rem; font-weight: 800; color: #051124;">
              <small style="display: block; font-size: 0.72rem; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Índice Acumulado (CUM)</small>
              <span style="font-size: 1.25rem; font-weight: 800;">${Number(displayData.cum || 0).toFixed(1)}</span>
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #051124;">
              <small style="display: block; font-size: 0.72rem; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Créditos Aprobados</small>
              <span style="font-size: 1.25rem; font-weight: 800;">${displayData.credits} UC</span>
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #051124;">
              <small style="display: block; font-size: 0.72rem; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Materias Registradas</small>
              <span style="font-size: 1.25rem; font-weight: 800;">${displayData.courses}</span>
            </div>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 0.72rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Este reporte representa el récord académico digitalizado del estudiante en el sistema administrativo.<br>
            Generado el ${new Date().toLocaleString()} · Sistema de Gestión Universitaria (SGUMS)
          </div>
        </div>
      `;
      const opt = {
        margin:       15,
        filename:     `Historial_Academico_${selectedId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().from(reportHtml).set(opt).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert(`No se pudo descargar el PDF: ${err.message || err}. Verifique su conexión a internet.`);
    }
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
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxWidth: '800px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input 
              value={query} 
              onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} 
              placeholder="Cédula o nombre" 
              style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} 
              disabled={loadingList && !students.length} 
            />
          </div>
          <div style={{ minWidth: '180px', flex: 1 }}>
            <CustomSelect
              value={careerFilter}
              onChange={(v) => { setCareerFilter(v); setCurrentPage(1); }}
              options={[{ value: '', label: 'Todas las carreras' }, ...careers]}
              placeholder="Todas las carreras"
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <CustomSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
                { value: 'Bloqueado', label: 'Bloqueado' }
              ]}
              placeholder="Todos los estados"
            />
          </div>
        </div>
      </SectionCard>

      <div className="history-main-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard className="history-list-card" title="Estudiantes encontrados" description="Selecciona una ficha para cargar su resumen histórico.">
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

        <SectionCard className="history-details-card" title={displayData.name || 'Seleccione un estudiante'} description={displayData.career || '---'}>
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
                <article key={`${entry.period}-${entry.subject}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto auto', gap: '12px', alignItems: 'center', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '16px', background: entry.status === 'Retirado' ? 'rgba(239, 68, 68, 0.04)' : '#f8fafc' }}>
                  <strong style={{ color: '#051124' }}>{entry.period}</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>{entry.subject}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Nota final consolidada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge tone={entry.grade >= 8 ? 'success' : entry.grade >= 6.5 ? 'warning' : 'danger'}>{Number(entry.grade || 0).toFixed(1)}</StatusBadge>
                    <StatusBadge tone={entry.status === 'Retirado' ? 'danger' : 'info'}>{entry.status}</StatusBadge>
                  </div>
                  {entry.status === 'Cursando' && (
                    <button
                      type="button"
                      onClick={() => setWithdrawTarget(entry)}
                      title="Retirar materia"
                      style={{
                        background: 'none',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#dc2626',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        opacity: 0.75,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
                    >
                      <XCircle size={16} />
                      Retirar materia
                    </button>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="history-footer-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            <ActionButton variant="primary" disabled={loadingHistory || !historyData} onClick={handleExportHistory}>Exportar historial</ActionButton>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={!!withdrawTarget}
        title="Retirar materia"
        message={`¿Está seguro de retirar la materia "${withdrawTarget?.subject}" del período ${withdrawTarget?.period}? Esta acción se verá reflejada en el récord del estudiante.`}
        confirmText="Sí, retirar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleWithdrawSubject}
        onCancel={() => setWithdrawTarget(null)}
      />

    </AdminPageShell>
  );
}
