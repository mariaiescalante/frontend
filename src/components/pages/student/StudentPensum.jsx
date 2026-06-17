import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { AdminPageShell, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { loadAcademicRecord } from './studentStorage';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function StudentPensum() {
  const { user } = useAuth();
  const [pensums, setPensums] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [record] = useState(() => loadAcademicRecord());

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pensumsRes, semestersRes] = await Promise.all([
          api.get('/pensums'),
          api.get('/semesters')
        ]);

        const rawPensums = Array.isArray(pensumsRes.data) ? pensumsRes.data : (Array.isArray(pensumsRes) ? pensumsRes : []);
        const rawSemesters = Array.isArray(semestersRes.data) ? semestersRes.data : (Array.isArray(semestersRes) ? semestersRes : []);

        setPensums(rawPensums);
        setSemesters(rawSemesters);
      } catch (err) {
        console.error('Error fetching student pensum data:', err);
        setError('Error al conectar con el servidor para cargar el pensum.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Find the pensum matching student's career name (active first)
  const currentPensum = useMemo(() => {
    if (!user || !user.career || pensums.length === 0) return null;
    return (
      pensums.find((p) => p.Career?.name_career?.toLowerCase() === user.career.toLowerCase() && p.is_active) ||
      pensums.find((p) => p.Career?.name_career?.toLowerCase() === user.career.toLowerCase())
    );
  }, [pensums, user]);

  // Group subjects by semesters
  const semestersWithSubjects = useMemo(() => {
    if (!currentPensum || semesters.length === 0) return [];

    const limit = currentPensum.Career?.total_semesters || 8;
    const activeSemesters = semesters
      .filter((s) => s.number_semester <= limit)
      .sort((a, b) => a.number_semester - b.number_semester);

    return activeSemesters.map((sem) => {
      const psList = currentPensum.PensumSubjects || [];
      const subjectsInSemester = psList
        .filter((ps) => ps.id_semester === sem.id_semester)
        .map((ps) => {
          // Map prerequisites (support array format of multiple prerequisites)
          const prereqCodes = Array.isArray(ps.Prerequisites)
            ? ps.Prerequisites.map((pr) => {
                const sub = pr.RequiredPensumSubject?.Subject;
                return sub?.code_subject || sub?.code || pr.RequiredPensumSubject?.code_subject;
              }).filter(Boolean)
            : [];
          const prereqText = prereqCodes.length > 0 ? prereqCodes.join(', ') : 'Ninguno';

          return {
            id_pensum_subject: ps.id_pensum_subject,
            code: ps.code_subject || ps.Subject?.code_subject || '',
            name: ps.Subject?.name_subject || 'Sin nombre',
            credits: ps.Subject?.credit_units || 0,
            mandatory: true,
            prereq: prereqText,
          };
        });

      return {
        id_semester: sem.id_semester,
        term: sem.name_semester,
        subjects: subjectsInSemester,
      };
    });
  }, [currentPensum, semesters]);

  // Auto-initialize active semester select
  useEffect(() => {
    if (semestersWithSubjects.length > 0 && !activeSemester) {
      setActiveSemester(semestersWithSubjects[0].id_semester);
    }
  }, [semestersWithSubjects, activeSemester]);

  // Helper to determine the status and grade of a subject
  const getSubjectStatus = (code) => {
    const found = record.find((item) => item.code === code);
    if (!found) return { status: 'Pendiente', grade: null };
    return {
      status: found.status, // 'Aprobada' or 'Reprobada'
      grade: found.grade
    };
  };

  const activeGroup = useMemo(() => {
    return semestersWithSubjects.find((g) => g.id_semester === activeSemester);
  }, [semestersWithSubjects, activeSemester]);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Pensum y Malla Curricular"
        subtitle="Consulta la malla académica oficial de tu carrera."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando malla académica oficial de tu carrera...</span>
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Pensum y Malla Curricular"
        subtitle="Consulta la malla académica oficial de tu carrera."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#dc2626' }}>
          <span>{error}</span>
        </div>
      </AdminPageShell>
    );
  }

  if (!currentPensum) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Pensum y Malla Curricular de Estudios"
        subtitle={`Consulta tu malla académica oficial.`}
      >
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Pensum No Asignado
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 12px', lineHeight: 1.6 }}>
            No se ha encontrado un pensum oficial activo para la carrera <strong>{user?.career || 'de tu perfil'}</strong> en el sistema. Por favor, contacta al departamento de Control de Estudios.
          </p>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Pensum y Malla Curricular de Estudios"
      subtitle={`Consulta la malla académica oficial de tu carrera (${user?.career || 'Sin carrera'}), el estatus de aprobación de tus unidades curriculares y los prerrequisitos (prelación) de cada materia.`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Semester Selection Dropdown */}
        <SectionCard title="Filtrar por Semestre" description="Selecciona el semestre para ver las unidades curriculares correspondientes.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Seleccionar Semestre
            </span>
            <select
              className="form-input"
              value={activeSemester || ''}
              onChange={(e) => setActiveSemester(Number(e.target.value))}
              style={{ minHeight: '44px', padding: '10px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', width: '100%' }}
            >
              {semestersWithSubjects.map((group) => (
                <option key={group.id_semester} value={group.id_semester}>
                  {group.term}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        {activeGroup && (
          <SectionCard
            title={`Asignaturas - ${activeGroup.term}`}
            description="Asignaturas obligatorias y electivas correspondientes al semestre seleccionado."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeGroup.subjects.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.92rem', fontStyle: 'italic' }}>
                  No hay asignaturas registradas para este semestre.
                </div>
              ) : (
                activeGroup.subjects.map((subject) => {
                  const info = getSubjectStatus(subject.code);
                  let statusColor = '#94a3b8'; // default grey
                  let statusBg = 'rgba(148, 163, 184, 0.05)';
                  let statusBorder = 'rgba(148, 163, 184, 0.15)';
                  let StatusIcon = HelpCircle;

                  if (info.status === 'Aprobada') {
                    statusColor = '#16a34a'; // green
                    statusBg = 'rgba(22, 163, 74, 0.06)';
                    statusBorder = 'rgba(22, 163, 74, 0.2)';
                    StatusIcon = CheckCircle;
                  } else if (info.status === 'Reprobada') {
                    statusColor = '#dc2626'; // red
                    statusBg = 'rgba(220, 38, 38, 0.06)';
                    statusBorder = 'rgba(220, 38, 38, 0.2)';
                    StatusIcon = XCircle;
                  }

                  return (
                    <div
                      key={subject.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: statusBg,
                        border: `1px solid ${statusBorder}`,
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                        <div style={{ color: statusColor, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <StatusIcon size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {subject.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Cód: <strong>{subject.code}</strong> · {subject.credits} UC · Prelación: <em>{subject.prereq}</em>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {info.status === 'Aprobada' && (
                          <StatusBadge tone="success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            Nota: {info.grade}
                          </StatusBadge>
                        )}
                        {info.status === 'Reprobada' && (
                          <StatusBadge tone="danger" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            Reprobado ({info.grade})
                          </StatusBadge>
                        )}
                        {info.status === 'Pendiente' && (
                          <StatusBadge tone="neutral" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            Pendiente
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </AdminPageShell>
  );
}
