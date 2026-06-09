import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Info,
  Trash2
} from 'lucide-react';
import { AdminPageShell, SectionCard, ActionButton, StatusBadge } from '../admin/AdminPageShell';
import { pensumSystems, availableSections } from './studentSeedData';
import { loadAcademicRecord, loadEnrolledSections, saveEnrolledSections, resetEnrollment } from './studentStorage';

// Schedule parsing helper to detect collisions
function parseSchedule(scheduleStr) {
  try {
    const parts = scheduleStr.split(' ');
    if (parts.length < 2) return null;
    const daysPart = parts[0]; // "Lunes/Miércoles"
    const hoursPart = parts.slice(1).join(''); // "08:00-10:00"
    
    const days = daysPart.split('/');
    const [startStr, endStr] = hoursPart.split('-');
    
    const parseTime = (tStr) => {
      const [h, m] = tStr.trim().split(':').map(Number);
      return h + m / 60;
    };
    
    return {
      days,
      start: parseTime(startStr),
      end: parseTime(endStr)
    };
  } catch {
    return null;
  }
}

function hasOverlap(sch1, sch2) {
  const p1 = parseSchedule(sch1);
  const p2 = parseSchedule(sch2);
  if (!p1 || !p2) return false;
  
  const commonDays = p1.days.filter(d => p2.days.includes(d));
  if (commonDays.length === 0) return false;
  
  return p1.start < p2.end && p2.start < p1.end;
}

export default function StudentEnrollment() {
  const [record] = useState(() => loadAcademicRecord());
  const [enrolled, setEnrolled] = useState(() => loadEnrolledSections());
  const [selectedSubjects, setSelectedSubjects] = useState({}); // { subjectCode: sectionIndex }
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setEnrolled(loadEnrolledSections());
  }, []);

  const approvedCodes = useMemo(() => {
    return new Set(record.filter((item) => item.status === 'Aprobada').map((item) => item.code));
  }, [record]);

  // Handle subject toggle
  const handleToggleSubject = (subjectCode) => {
    setSelectedSubjects((prev) => {
      const next = { ...prev };
      if (next[subjectCode] !== undefined) {
        delete next[subjectCode];
      } else {
        next[subjectCode] = 0; // Default to first section
      }
      return next;
    });
  };

  // Handle section dropdown change
  const handleSectionChange = (subjectCode, sectionIndex) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectCode]: Number(sectionIndex)
    }));
  };

  // List of selected subject info objects
  const selectedList = useMemo(() => {
    return Object.keys(selectedSubjects).map((code) => {
      // Find subject in pensum
      let subjectObj = null;
      for (const group of pensumSystems) {
        const found = group.subjects.find((s) => s.code === code);
        if (found) {
          subjectObj = found;
          break;
        }
      }

      const sections = availableSections[code] || [];
      const sectionIdx = selectedSubjects[code];
      const sectionObj = sections[sectionIdx] || null;

      return {
        code,
        name: subjectObj ? subjectObj.name : 'Asignatura',
        credits: subjectObj ? subjectObj.credits : 0,
        sectionCode: sectionObj ? sectionObj.code : '',
        schedule: sectionObj ? sectionObj.schedule : '',
        classroom: sectionObj ? sectionObj.classroom : '',
        teacher: sectionObj ? sectionObj.teacher : ''
      };
    });
  }, [selectedSubjects]);

  // Calculate total credits selected
  const totalCredits = useMemo(() => {
    return selectedList.reduce((sum, item) => sum + item.credits, 0);
  }, [selectedList]);

  // Check for conflicts
  const scheduleConflicts = useMemo(() => {
    const conflicts = [];
    for (let i = 0; i < selectedList.length; i++) {
      for (let j = i + 1; j < selectedList.length; j++) {
        const s1 = selectedList[i];
        const s2 = selectedList[j];
        if (hasOverlap(s1.schedule, s2.schedule)) {
          conflicts.push(`Choque entre ${s1.name} y ${s2.name} (${s1.schedule})`);
        }
      }
    }
    return conflicts;
  }, [selectedList]);

  const handleEnrollSubmit = () => {
    if (totalCredits === 0 || totalCredits > 24 || scheduleConflicts.length > 0) return;
    saveEnrolledSections(selectedList);
    setEnrolled(selectedList);
    setSuccess(true);
    setSelectedSubjects({});
  };

  const handleReset = () => {
    resetEnrollment();
    setEnrolled([]);
    setSuccess(false);
  };

  if (enrolled.length > 0) {
    return (
      <AdminPageShell
        eyebrow="Inscripción de Materias"
        title="Proceso de Inscripción de Unidades Curriculares"
        subtitle="Tu inscripción para el periodo académico actual ha sido formalizada."
      >
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
          <CheckCircle size={64} style={{ color: '#16a34a', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Inscripción Confirmada Exitosamente
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Has completado el proceso de matriculación para el periodo <strong>2026-II</strong>. Puedes consultar tu horario de clases o generar tu comprobante de inscripción oficial.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link to="/student/schedule" style={{ textDecoration: 'none' }}>
              <ActionButton variant="primary">Ver Mi Horario</ActionButton>
            </Link>
            <Link to="/student/documents" style={{ textDecoration: 'none' }}>
              <ActionButton variant="accent">Comprobante de Inscripción</ActionButton>
            </Link>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', maxWidth: '300px', margin: '0 auto' }}>
            <ActionButton variant="danger" onClick={handleReset} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <Trash2 size={12} /> Deshacer inscripción (Simulador)
            </ActionButton>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Inscripción de Materias"
      title="Selección de Unidades Curriculares"
      subtitle="Período Académico Activo: 2026-II. Selecciona las asignaturas que deseas inscribir, respetando el límite de unidades de crédito y las prelaciones."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Available Subjects column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pensumSystems.map((group) => {
            // Check if there's any pending subject or we should show this semester
            return (
              <SectionCard
                key={group.semester}
                title={`Semestre ${group.semester}`}
                description="Listado de asignaturas y secciones disponibles para ofertar."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {group.subjects.map((subject) => {
                    const isPassed = approvedCodes.has(subject.code);
                    const isPrereqMet = subject.prereq === 'Ninguno' || approvedCodes.has(subject.prereq);
                    const isBlocked = !isPassed && !isPrereqMet;

                    const sections = availableSections[subject.code] || [];
                    const isSelected = selectedSubjects[subject.code] !== undefined;

                    return (
                      <div
                        key={subject.code}
                        style={{
                          padding: '16px',
                          border: isSelected ? '1px solid #ffd100' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          background: isSelected ? 'rgba(255, 209, 0, 0.02)' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          opacity: isBlocked ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isPassed || isBlocked}
                              onChange={() => handleToggleSubject(subject.code)}
                              style={{
                                cursor: (isPassed || isBlocked) ? 'not-allowed' : 'pointer',
                                width: '18px',
                                height: '18px',
                                accentColor: '#051124',
                                marginTop: '4px'
                              }}
                            />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.98rem', color: '#0f172a' }}>
                                {subject.name}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Cód: <strong>{subject.code}</strong> · {subject.credits} UC · Prelación: <em>{subject.prereq}</em>
                              </span>
                            </div>
                          </div>

                          <div>
                            {isPassed && (
                              <StatusBadge tone="success" style={{ fontSize: '0.72rem' }}>
                                Aprobada
                              </StatusBadge>
                            )}
                            {isBlocked && (
                              <StatusBadge tone="danger" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={10} /> Prelada por {subject.prereq}
                              </StatusBadge>
                            )}
                            {!isPassed && !isBlocked && !isSelected && (
                              <StatusBadge tone="info" style={{ fontSize: '0.72rem' }}>
                                Habilitada
                              </StatusBadge>
                            )}
                            {isSelected && (
                              <StatusBadge tone="warning" style={{ fontSize: '0.72rem' }}>
                                Seleccionada
                              </StatusBadge>
                            )}
                          </div>
                        </div>

                        {/* If checked, show sections */}
                        {isSelected && sections.length > 0 && (
                          <div
                            style={{
                              padding: '12px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              marginTop: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                Seleccionar Sección Disponible:
                              </span>
                              <select
                                className="form-input"
                                value={selectedSubjects[subject.code]}
                                onChange={(e) => handleSectionChange(subject.code, e.target.value)}
                                style={{ minHeight: '38px', padding: '6px 12px', background: '#ffffff' }}
                              >
                                {sections.map((sec, idx) => (
                                  <option key={sec.code} value={idx}>
                                    {sec.code} - {sec.schedule} ({sec.classroom}) - {sec.teacher} [Cupos: {sec.capacity - sec.enrolled}]
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            );
          })}
        </div>

        {/* Enrollment summary column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
          <SectionCard
            title="Resumen de Matrícula"
            description={`Inscripción de unidades curriculares para el período actual.`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Créditos Inscritos</span>
                  <strong style={{ color: totalCredits > 24 ? '#dc2626' : '#0f172a', fontSize: '1.3rem' }}>{totalCredits}</strong>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Límite Máximo</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.3rem' }}>24 UC</strong>
                </div>
              </div>

              {/* Warnings/Alerts */}
              {totalCredits > 24 && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Has excedido el límite de 24 créditos permitidos para este período académico.</span>
                </div>
              )}

              {scheduleConflicts.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontWeight: 700 }}>Conflicto de Horarios:</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem' }}>
                    {scheduleConflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Selected List */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Detalle Selección:
                </span>
                
                {selectedList.length === 0 ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Ninguna asignatura seleccionada.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedList.map((item) => (
                      <div key={item.code} style={{ background: '#f8fafc', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Sección: <strong>{item.sectionCode}</strong> | Horario: {item.schedule}
                          </span>
                        </div>
                        <StatusBadge tone="info" style={{ fontSize: '0.7rem' }}>
                          {item.credits} UC
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Submit */}
              <ActionButton
                variant="accent"
                disabled={totalCredits === 0 || totalCredits > 24 || scheduleConflicts.length > 0}
                onClick={handleEnrollSubmit}
                style={{ width: '100%', minHeight: '44px', marginTop: '10px' }}
              >
                Confirmar Inscripción
              </ActionButton>
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
