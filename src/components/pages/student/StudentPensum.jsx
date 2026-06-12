import React, { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { AdminPageShell, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { pensumSystems } from './studentSeedData';
import { loadAcademicRecord } from './studentStorage';

export default function StudentPensum() {
  const [record] = useState(() => loadAcademicRecord());
  const [activeSemester, setActiveSemester] = useState(1);

  // Helper to determine the status and grade of a subject
  const getSubjectStatus = (code) => {
    const found = record.find((item) => item.code === code);
    if (!found) return { status: 'Pendiente', grade: null };
    return {
      status: found.status, // 'Aprobada' or 'Reprobada'
      grade: found.grade
    };
  };

  const activeGroup = pensumSystems.find((g) => g.semester === activeSemester);

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Pensum y Malla Curricular de Estudios"
      subtitle="Consulta la malla académica oficial de tu carrera, el estatus de aprobación de tus unidades curriculares y los prerrequisitos (prelación) de cada materia."
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
              value={activeSemester}
              onChange={(e) => setActiveSemester(Number(e.target.value))}
              style={{ minHeight: '44px', padding: '10px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', width: '100%' }}
            >
              {pensumSystems.map((group) => (
                <option key={group.semester} value={group.semester}>
                  Semestre {group.semester}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        {activeGroup && (
          <SectionCard
            title={`Asignaturas - Semestre ${activeGroup.semester}`}
            description="Asignaturas obligatorias y electivas correspondientes al semestre seleccionado."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeGroup.subjects.map((subject) => {
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
              })}
            </div>
          </SectionCard>
        )}
      </div>
    </AdminPageShell>
  );
}
