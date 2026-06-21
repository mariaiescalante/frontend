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
import { AdminPageShell, SectionCard, ActionButton, StatusBadge, CustomSelect } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

// Schedule parsing helper to detect collisions
function normalizeDay(dayStr) {
  if (!dayStr) return '';
  const clean = dayStr.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (clean.startsWith('lun')) return 'Lunes';
  if (clean.startsWith('mar')) return 'Martes';
  if (clean.startsWith('mie')) return 'Miércoles';
  if (clean.startsWith('jue')) return 'Jueves';
  if (clean.startsWith('vie')) return 'Viernes';
  if (clean.startsWith('sab')) return 'Sábado';
  if (clean.startsWith('dom')) return 'Domingo';
  return dayStr;
}

function parseSchedule(scheduleStr) {
  try {
    const parts = scheduleStr.split(' ');
    if (parts.length < 2) return null;
    const daysPart = parts[0]; 
    const hoursPart = parts.slice(1).join(''); 
    
    const days = daysPart.split('/').map(normalizeDay);
    const [startStr, endStr] = hoursPart.split('-');
    
    const parseTime = (tStr) => {
      const clean = tStr.trim().toLowerCase();
      const match = clean.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      
      const isPM = /pm/i.test(clean);
      const isAM = /am/i.test(clean);
      
      if (isPM && h < 12) {
        h += 12;
      } else if (isAM && h === 12) {
        h = 0;
      } else if (!isPM && !isAM) {
        if (h >= 1 && h < 8) {
          h += 12;
        }
      }
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
  
}

export default function StudentEnrollment() {
  const { user } = useAuth();
  const [record, setRecord] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [success, setSuccess] = useState(false);
  const [activeSemester, setActiveSemester] = useState(1);
  
  const [pensumSystems, setPensumSystems] = useState([]);
  const [availableSections, setAvailableSections] = useState({});

  // Enrollment process states from API
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [activePeriodName, setActivePeriodName] = useState('');
  const [activePeriodId, setActivePeriodId] = useState(null);

  useEffect(() => {
    async function checkEnrollment() {
      if (!user) return;
      try {
        setLoadingEnrollment(true);
        const resPeriods = await api.get('/periods');
        const periodsList = (Array.isArray(resPeriods) ? resPeriods : (Array.isArray(resPeriods?.data) ? resPeriods.data : []));
        const activePeriod = periodsList.find((p) => p.enrollment_status === 'Abierta');
        
        if (activePeriod) {
          setIsEnrollmentOpen(true);
          setActivePeriodName(activePeriod.name_period);
          setActivePeriodId(activePeriod.id_period);
          
          // Fetch data
          const [pensumsRes, semestersRes, sectionsRes, regRes, regDetRes] = await Promise.all([
            api.get('/pensums'),
            api.get('/semesters'),
            api.get(`/sections`),
            api.get('/registrations'),
            api.get('/registration-details')
          ]);

          const rawPensums = Array.isArray(pensumsRes) ? pensumsRes : (pensumsRes?.data || []);
          const rawSemesters = Array.isArray(semestersRes) ? semestersRes : (semestersRes?.data || []);
          const rawSections = Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.data || []);
          const rawRegistrations = Array.isArray(regRes) ? regRes : (regRes?.data || []);
          const rawRegDetails = Array.isArray(regDetRes) ? regDetRes : (regDetRes?.data || []);

          // 1. Build record
          const studentRegistrations = rawRegistrations.filter(r => r.id_student === user.id_student);
          const studentRegIds = studentRegistrations.map(r => r.id_registration);
          const studentDetails = rawRegDetails.filter(d => studentRegIds.includes(d.id_registration));

          const fetchedRecord = studentDetails.map(d => {
            const sec = rawSections.find(s => s.id_section === d.id_section);
            const subj = sec?.Subject;
            return {
              code: subj?.code_subject || '',
              name: subj?.name_subject || 'Desconocido',
              credits: subj?.credit_units || 0,
              grade: d.final_note,
              status: (d.subject_status === 'Aprobada' || d.subject_status === 'Aprobado') ? 'Aprobada' : ((d.subject_status === 'Reprobada' || d.subject_status === 'Reprobado') ? 'Reprobada' : 'Pendiente')
            };
          });
          setRecord(fetchedRecord);

          // Check if already enrolled in this period
          const currentPeriodReg = studentRegistrations.find(r => r.id_period === activePeriod.id_period);
          if (currentPeriodReg) {
            const currentDetails = rawRegDetails.filter(d => d.id_registration === currentPeriodReg.id_registration);
            const currentEnrolled = currentDetails.map(d => {
              const sec = rawSections.find(s => s.id_section === d.id_section);
              return {
                code: sec?.Subject?.code_subject || '',
                name: sec?.Subject?.name_subject || '',
                credits: sec?.Subject?.credit_units || 0,
                sectionCode: sec?.section_code || '',
                schedule: sec?.schedule_info || '',
                classroom: sec?.classroom || '',
                id_section: sec?.id_section
              };
            });
            setEnrolled(currentEnrolled);
          }

          // 2. Build pensumSystems (like StudentPensum.jsx)
          const currentPensum = (rawPensums.find((p) => p.Career?.name_career?.toLowerCase() === user.career.toLowerCase() && p.is_active) ||
                                rawPensums.find((p) => p.Career?.name_career?.toLowerCase() === user.career.toLowerCase()));
          
          if (currentPensum) {
            const limit = currentPensum.Career?.total_semesters || 8;
            const activeSemesters = rawSemesters
              .filter((s) => s.number_semester <= limit)
              .sort((a, b) => a.number_semester - b.number_semester);

            const mappedPensum = activeSemesters.map((sem) => {
              const psList = currentPensum.PensumSubjects || [];
              const subjectsInSemester = psList
                .filter((ps) => ps.id_semester === sem.id_semester)
                .map((ps) => {
                  const prereqCodes = Array.isArray(ps.Prerequisites)
                    ? ps.Prerequisites.map((pr) => {
                        const sub = pr.RequiredPensumSubject?.Subject;
                        return sub?.code_subject || sub?.code || pr.RequiredPensumSubject?.code_subject;
                      }).filter(Boolean)
                    : [];
                  const prereqText = prereqCodes.length > 0 ? prereqCodes.join(', ') : 'Ninguno';

                  return {
                    code: ps.Subject?.code_subject || ps.code_subject || '',
                    name: ps.Subject?.name_subject || 'Sin nombre',
                    credits: ps.Subject?.credit_units || 0,
                    mandatory: true,
                    prereq: prereqText,
                  };
                });

              return {
                semester: sem.number_semester,
                subjects: subjectsInSemester,
              };
            });
            setPensumSystems(mappedPensum);
          }

          // 3. Build availableSections map
          const sectionsMap = {};
          rawSections.filter(s => s.id_period === activePeriod.id_period).forEach(sec => {
             const code = sec.Subject?.code_subject || '';
             if(!sectionsMap[code]) sectionsMap[code] = [];
             
             const enrolledCount = rawRegDetails.filter(d => d.id_section === sec.id_section).length;

             sectionsMap[code].push({
                id_section: sec.id_section,
                code: sec.section_code,
                schedule: sec.schedule_info || 'Por asignar',
                classroom: sec.classroom || 'Por asignar',
                teacher: sec.Teacher?.User ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}` : 'Sin profesor',
                capacity: sec.quota_max || 30,
                enrolled: enrolledCount
             });
          });
          setAvailableSections(sectionsMap);

        } else {
          setIsEnrollmentOpen(false);
          setActivePeriodName('');
        }
      } catch (err) {
        console.error('Error fetching enrollment process status:', err);
        setIsEnrollmentOpen(false);
      } finally {
        setLoadingEnrollment(false);
      }
    }
    checkEnrollment();
  }, [user]);

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
        // Check if the default section conflicts with already selected subjects
        const sections = availableSections[subjectCode] || [];
        const sectionObj = sections[0] || null;
        if (sectionObj) {
          const conflict = selectedList.find(item => item.code !== subjectCode && hasOverlap(item.schedule, sectionObj.schedule));
          if (conflict) {
            alert(`Conflicto de Horario:\nNo es posible inscribir "${subjectCode}". Su horario (${sectionObj.schedule}) choca con la asignatura "${conflict.name}" (${conflict.schedule}) que ya has seleccionado.`);
            return prev;
          }
        }
        next[subjectCode] = 0; // Default to first section
      }
      return next;
    });
  };

  // Handle section dropdown change
  const handleSectionChange = (subjectCode, sectionIndex) => {
    const sections = availableSections[subjectCode] || [];
    const sectionObj = sections[Number(sectionIndex)] || null;
    if (sectionObj) {
      const conflict = selectedList.find(item => item.code !== subjectCode && hasOverlap(item.schedule, sectionObj.schedule));
      if (conflict) {
        alert(`Conflicto de Horario:\nNo se puede seleccionar la sección ${sectionObj.code}. Su horario (${sectionObj.schedule}) choca con la asignatura "${conflict.name}" (${conflict.schedule}) que ya has seleccionado.`);
        return;
      }
    }

    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectCode]: Number(sectionIndex)
    }));
  };

  // List of selected subject info objects
  const selectedList = useMemo(() => {
    return Object.keys(selectedSubjects).map((code) => {
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
        teacher: sectionObj ? sectionObj.teacher : '',
        id_section: sectionObj ? sectionObj.id_section : null
      };
    });
  }, [selectedSubjects, pensumSystems, availableSections]);

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

  const handleEnrollSubmit = async () => {
    if (totalCredits === 0 || totalCredits > 24 || scheduleConflicts.length > 0) return;
    
    try {
      setLoadingEnrollment(true);
      const res = await api.post('/registrations', {
        id_student: user.id_student,
        id_period: activePeriodId,
        status: 'Inscrito'
      });
      const id_registration = res?.id_registration || res?.data?.id_registration;

      await Promise.all(selectedList.map(async (item) => {
        return api.post('/registration-details', {
          id_registration,
          id_section: item.id_section,
          corte_1: 0, corte_2: 0, corte_3: 0, corte_4: 0, recuperatorio: 0,
          final_note: 0, attendance_percentage: 0, subject_status: 'Cursando'
        });
      }));

      setEnrolled(selectedList);
      setSuccess(true);
      setSelectedSubjects({});
    } catch (err) {
      console.error('Error in handleEnrollSubmit:', err);
      if (err.data && err.data.errors) {
        const errorDetails = err.data.errors.map(e => `${e.campo || e.path || 'Error'}: ${e.mensaje || e.message || ''}`).join('\n');
        alert(`Error de validación:\n${errorDetails}`);
      } else {
        alert(err.message || 'Error al procesar inscripción');
      }
    } finally {
      setLoadingEnrollment(false);
    }
  };

  const handleReset = async () => {
    // In a real scenario we'd call a DELETE to remove the registration
    // Since this is just replacing the simulator, we'll alert that cancellation needs to go through admin
    alert('Para anular su inscripción, por favor contacte a Control de Estudios.');
  };

  const activeGroup = useMemo(() => {
    return pensumSystems.find((group) => group.semester === activeSemester);
  }, [activeSemester, pensumSystems]);

  if (loadingEnrollment) {
    return (
      <AdminPageShell
        eyebrow="Inscripción de Materias"
        title="Proceso de Inscripción de Unidades Curriculares"
        subtitle="Verificando estado del período..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Consultando datos en el sistema...</span>
        </div>
      </AdminPageShell>
    );
  }

  if (!isEnrollmentOpen) {
    return (
      <AdminPageShell
        eyebrow="Inscripción de Materias"
        title="Proceso de Inscripción Cerrado"
        subtitle="El período de matriculación para el ciclo académico actual no se encuentra disponible."
      >
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
          <AlertTriangle size={64} style={{ color: '#eab308', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Inscripción Fuera de Período
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            El período de inscripciones para estudiantes no está abierto en este momento. Por favor, mantente atento a los canales informativos institucionales para conocer las fechas de apertura del próximo ciclo académico, o ponte en contacto con el departamento de Control de Estudios.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/student/dashboard" style={{ textDecoration: 'none' }}>
              <ActionButton variant="primary">Volver al Dashboard</ActionButton>
            </Link>
          </div>
        </div>
      </AdminPageShell>
    );
  }

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
            Has completado el proceso de matriculación para el periodo <strong>{activePeriodName}</strong>. Puedes consultar tu horario de clases o generar tu comprobante de inscripción oficial.
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
              <Info size={12} /> Solicitar retiro de asignaturas
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
      subtitle={`Período Académico Activo: ${activePeriodName}. Selecciona las asignaturas que deseas inscribir, respetando el límite de unidades de crédito y las prelaciones.`}
    >
      <div className="enrollment-grid">
        {/* Available Subjects column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0, width: '100%' }}>
          
          {/* Semester selection dropdown */}
          <div style={{ display: 'block', width: '100%', marginBottom: '14px' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Seleccionar Semestre
            </span>
            <CustomSelect
              value={activeSemester}
              onChange={(val) => setActiveSemester(Number(val))}
              options={pensumSystems.map((group) => ({
                value: group.semester,
                label: `Semestre ${group.semester}`
              }))}
            />
          </div>

          {activeGroup && (
            <SectionCard
              title={`Asignaturas - Semestre ${activeGroup.semester}`}
              description={`Unidades curriculares ofertadas correspondientes al semestre ${activeGroup.semester}.`}
              style={{ overflow: 'visible' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, width: '100%' }}>
                {activeGroup.subjects.map((subject) => {
                  const isPassed = approvedCodes.has(subject.code);
                  const isPrereqMet = subject.prereq === 'Ninguno' || subject.prereq.split(', ').every(pr => approvedCodes.has(pr));
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
                        transition: 'all 0.2s ease',
                        minWidth: 0,
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isPassed || isBlocked || sections.length === 0}
                            onChange={() => handleToggleSubject(subject.code)}
                            style={{
                              cursor: (isPassed || isBlocked || sections.length === 0) ? 'not-allowed' : 'pointer',
                              width: '18px',
                              height: '18px',
                              accentColor: '#051124',
                              marginTop: '4px'
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', fontSize: '0.98rem', color: '#0f172a', wordBreak: 'break-word' }}>
                              {subject.name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', wordBreak: 'break-word' }}>
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
                          {!isPassed && !isBlocked && !isSelected && sections.length > 0 && (
                            <StatusBadge tone="info" style={{ fontSize: '0.72rem' }}>
                              Habilitada
                            </StatusBadge>
                          )}
                          {!isPassed && !isBlocked && !isSelected && sections.length === 0 && (
                            <StatusBadge tone="neutral" style={{ fontSize: '0.72rem' }}>
                              Sin secciones
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
                            gap: '10px',
                            minWidth: 0,
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'block', width: '100%' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Seleccionar Sección Disponible:
                            </span>
                            <CustomSelect
                              value={selectedSubjects[subject.code]}
                              onChange={(val) => handleSectionChange(subject.code, val)}
                              options={sections.map((sec, idx) => ({
                                value: idx,
                                label: `${sec.code} - ${sec.schedule} (${sec.classroom}) - ${sec.teacher} [Cupos: ${sec.capacity - sec.enrolled}]`
                              }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>
 
        {/* Enrollment summary column */}
        <div className="enrollment-grid-summary" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px', minWidth: 0, width: '100%' }}>
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
