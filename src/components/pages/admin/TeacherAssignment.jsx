import React, { useMemo, useState, useEffect } from 'react';
import { 
  BadgeCheck, 
  UserRoundCog, 
  Slash, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Layers, 
  AlertCircle, 
  Clock, 
  MapPin, 
  UserCheck, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge, CustomSelect } from './AdminPageShell';
import api from '../../../services/api';

export default function TeacherAssignment() {
  const [careers, setCareers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [pensums, setPensums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [sectionFilterTab, setSectionFilterTab] = useState('all'); // 'all' | 'unassigned' | 'assigned'
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  const [form, setForm] = useState({
    id_career: '',
    id_semester: '',
    id_subject: '',
    id_section: '',
    id_teacher: '',
  });

  async function loadData(periodId) {
    try {
      setLoading(true);
      if (!periodId) { 
        setLoading(false); 
        return; 
      }

      const sectionsUrl = `/sections?id_period=${periodId}`;
      const [careersRes, semestersRes, teachersRes, sectionsRes, pensumsRes] = await Promise.all([
        api.get('/careers'),
        api.get('/semesters'),
        api.get('/teachers'),
        api.get(sectionsUrl),
        api.get('/pensums').catch(() => ({ data: [] })),
      ]);

      const rawCareers = Array.isArray(careersRes.data) ? careersRes.data : (Array.isArray(careersRes) ? careersRes : []);
      const rawSemesters = Array.isArray(semestersRes.data) ? semestersRes.data : (Array.isArray(semestersRes) ? semestersRes : []);
      const rawTeachers = Array.isArray(teachersRes.data) ? teachersRes.data : (Array.isArray(teachersRes) ? teachersRes : []);
      const rawSections = Array.isArray(sectionsRes.data) ? sectionsRes.data : (Array.isArray(sectionsRes) ? sectionsRes : []);
      const rawPensums = Array.isArray(pensumsRes.data) ? pensumsRes.data : (Array.isArray(pensumsRes) ? pensumsRes : []);

      setCareers(rawCareers);
      setSemesters(rawSemesters);
      setTeachers(rawTeachers);
      setSections(rawSections);
      setPensums(rawPensums);

      // Initialize form with first career if not already set
      setForm(prev => {
        const nextCareerId = prev.id_career || (rawCareers[0]?.id_career ? String(rawCareers[0].id_career) : '');
        return {
          id_career: nextCareerId,
          id_semester: prev.id_semester || '',
          id_subject: prev.id_subject || '',
          id_section: prev.id_section || '',
          id_teacher: prev.id_teacher || (rawTeachers[0]?.id_teacher ? String(rawTeachers[0].id_teacher) : ''),
        };
      });
    } catch (err) {
      console.error('Error loading teacher assignment data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/periods').then(res => {
      const rawPeriods = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setPeriods(rawPeriods);
      const active = rawPeriods.find(p => p.is_active || p.period_status === 'Activo') || rawPeriods[0];
      setSelectedPeriodId(active ? String(active.id_period) : '');
    }).catch(() => setPeriods([]));
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadData(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  // Mapping from pensum: subjectId -> Set of semesterIds for the current career
  const subjectSemesterMap = useMemo(() => {
    const map = new Map();
    pensums.forEach(p => {
      if (!form.id_career || p.id_career === Number(form.id_career)) {
        p.PensumSubjects?.forEach(ps => {
          if (!map.has(ps.id_subject)) {
            map.set(ps.id_subject, new Set());
          }
          map.get(ps.id_subject).add(ps.id_semester);
        });
      }
    });
    return map;
  }, [pensums, form.id_career]);

  // Subjects that have sections created in the selected career
  const eligibleSubjects = useMemo(() => {
    if (!form.id_career) return [];
    const careerSections = sections.filter(sec => sec.id_career === Number(form.id_career));
    
    const subjectMap = new Map();
    careerSections.forEach(sec => {
      if (sec.Subject) {
        if (!subjectMap.has(sec.id_subject)) {
          subjectMap.set(sec.id_subject, {
            id_subject: sec.id_subject,
            name_subject: sec.Subject.name_subject,
            code_subject: sec.Subject.code_subject,
            totalSections: 0,
            unassignedCount: 0
          });
        }
        const item = subjectMap.get(sec.id_subject);
        item.totalSections += 1;
        if (!sec.id_teacher) {
          item.unassignedCount += 1;
        }
      }
    });

    let list = Array.from(subjectMap.values());

    // Filter by semester if selected
    if (form.id_semester) {
      list = list.filter(sub => {
        const semSet = subjectSemesterMap.get(sub.id_subject);
        return semSet && semSet.has(Number(form.id_semester));
      });
    }

    return list;
  }, [sections, form.id_career, form.id_semester, subjectSemesterMap]);

  // Sections matching career, semester and subject
  const eligibleSections = useMemo(() => {
    if (!form.id_career) return [];
    return sections.filter(sec => {
      const matchCareer = sec.id_career === Number(form.id_career);
      const matchSubject = form.id_subject ? sec.id_subject === Number(form.id_subject) : true;
      let matchSemester = true;
      if (form.id_semester) {
        const semSet = subjectSemesterMap.get(sec.id_subject);
        matchSemester = semSet ? semSet.has(Number(form.id_semester)) : true;
      }
      return matchCareer && matchSubject && matchSemester;
    });
  }, [sections, form.id_career, form.id_subject, form.id_semester, subjectSemesterMap]);

  // Handle cascading dropdown state changes
  const handleCareerChange = (id_career) => {
    setForm(prev => ({
      ...prev,
      id_career,
      id_semester: '',
      id_subject: '',
      id_section: ''
    }));
  };

  const handleSemesterChange = (id_semester) => {
    setForm(prev => ({
      ...prev,
      id_semester,
      id_subject: '',
      id_section: ''
    }));
  };

  const handleSubjectChange = (id_subject) => {
    // When subject changes, reset section or pick first section if available
    const matchSections = sections.filter(sec => 
      sec.id_subject === Number(id_subject) &&
      sec.id_career === Number(form.id_career)
    );

    setForm(prev => ({
      ...prev,
      id_subject,
      id_section: matchSections[0] ? String(matchSections[0].id_section) : ''
    }));
  };

  // Quick select a section from the overview list into the form
  const handleSelectSectionFromList = (sec) => {
    // Determine semester if available
    let matchedSemester = '';
    const semSet = subjectSemesterMap.get(sec.id_subject);
    if (semSet && semSet.size > 0) {
      matchedSemester = String(Array.from(semSet)[0]);
    }

    setForm({
      id_career: String(sec.id_career),
      id_semester: matchedSemester || form.id_semester,
      id_subject: String(sec.id_subject),
      id_section: String(sec.id_section),
      id_teacher: sec.id_teacher ? String(sec.id_teacher) : (teachers[0]?.id_teacher ? String(teachers[0].id_teacher) : ''),
    });

    const formElement = document.getElementById('assignment-form-card');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Real-time schedule overlap collision detector
  const scheduleConflict = useMemo(() => {
    if (!form.id_teacher || !form.id_section) return false;
    const selectedSection = sections.find(s => s.id_section === Number(form.id_section));
    if (!selectedSection || !selectedSection.schedule_info) return false;
    
    return sections.some(sec => 
      sec.id_section !== selectedSection.id_section &&
      sec.id_teacher === Number(form.id_teacher) &&
      sec.schedule_info === selectedSection.schedule_info
    );
  }, [sections, form.id_teacher, form.id_section]);

  const handleSave = async () => {
    try {
      const { id_section, id_teacher } = form;
      if (!id_section || !id_teacher) {
        showNotification('error', 'Por favor seleccione una sección y un docente.');
        return;
      }
      setSubmitting(true);

      const sectionObj = sections.find(s => s.id_section === Number(id_section));
      if (!sectionObj) {
        showNotification('error', 'Sección no encontrada.');
        return;
      }

      // Payload matching backend validateZod criteria
      const payload = {
        id_period: sectionObj.id_period,
        id_subject: sectionObj.id_subject,
        id_career: sectionObj.id_career,
        section_code: sectionObj.section_code,
        quota_max: sectionObj.quota_max,
        classroom: sectionObj.classroom,
        schedule_info: sectionObj.schedule_info,
        id_teacher: Number(id_teacher)
      };

      await api.put(`/sections/${id_section}`, payload);
      showNotification('success', 'Asignación de docente realizada con éxito.');
      await loadData(selectedPeriodId);
    } catch (err) {
      console.error('Error updating section teacher:', err);
      showNotification('error', err.response?.data?.message || err.message || 'Error al guardar la asignación');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedSections = useMemo(() => {
    return sections.filter(sec => sec.id_teacher !== null);
  }, [sections]);

  const unassignedSections = useMemo(() => {
    return sections.filter(sec => sec.id_teacher === null);
  }, [sections]);

  const filteredSectionsForList = useMemo(() => {
    let list = sections;
    if (sectionFilterTab === 'unassigned') {
      list = unassignedSections;
    } else if (sectionFilterTab === 'assigned') {
      list = assignedSections;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(sec => 
        (sec.Subject?.name_subject && sec.Subject.name_subject.toLowerCase().includes(q)) ||
        (sec.section_code && sec.section_code.toLowerCase().includes(q)) ||
        (sec.classroom && sec.classroom.toLowerCase().includes(q)) ||
        (sec.Teacher?.User && `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}`.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sections, unassignedSections, assignedSections, sectionFilterTab, searchQuery]);

  if (loading && !sections.length) {
    return (
      <AdminPageShell
        eyebrow="Asignación docente"
        title="Asignación de docentes a secciones"
        subtitle="Cargando información..."
        metrics={[
          { label: 'Secciones del período', value: '...', hint: 'Cargando...', icon: Layers, tone: 'primary' },
          { label: 'Docentes registrados', value: '...', hint: 'Cargando...', icon: BadgeCheck, tone: 'success' },
          { label: 'Pendientes por asignar', value: '...', hint: 'Cargando...', icon: UserRoundCog, tone: 'warning' },
          { label: 'Conflictos', value: '0', hint: 'Cargando...', icon: Slash, tone: 'info' }
        ]}
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos desde la base de datos...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Asignación docente"
      title="Flujo jerárquico de vinculación académica"
      subtitle="Asignación de docentes a secciones por carrera, semestre y asignatura."
      metrics={[
        { label: 'Secciones del período', value: `${sections.length}`, hint: 'Secciones activas en el período', icon: Layers, tone: 'primary' },
        { label: 'Docentes registrados', value: `${teachers.length}`, hint: 'Cuerpo docente registrado', icon: BadgeCheck, tone: 'success' },
        { label: 'Pendientes por asignar', value: `${unassignedSections.length}`, hint: 'Secciones sin docente asignado', icon: UserRoundCog, tone: unassignedSections.length > 0 ? 'warning' : 'success' },
        { label: 'Conflictos', value: scheduleConflict ? '1' : '0', hint: 'Validación de choque de horario', icon: Slash, tone: scheduleConflict ? 'danger' : 'info' }
      ]}
    >
      {/* Selector de Período Académico */}
      <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px' }}>
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Período académico:</span>
        <select
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
            background: '#fff', fontSize: '0.9rem', fontWeight: 500, minWidth: '220px'
          }}
        >
          {periods.map(p => (
            <option key={p.id_period} value={p.id_period}>
              {p.name_period} {p.period_status === 'Activo' ? '(Activo)' : ''}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Total de secciones en este período: <strong>{sections.length}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '22px', alignItems: 'start' }}>
        
        {/* Formulario de Asignación */}
        <div id="assignment-form-card">
          <SectionCard 
            title="Formulario de asignación" 
            description="Selecciona la carrera, asignatura y sección para vincular al docente correspondiente."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
              
              {/* Carrera */}
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Carrera</span>
                <CustomSelect
                  value={form.id_career}
                  onChange={(value) => handleCareerChange(value)}
                  options={careers.map((c) => ({ value: String(c.id_career), label: c.name_career }))}
                />
              </label>
              
              {/* Semestre (Opcional / Filtro) */}
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Semestre</span>
                <CustomSelect
                  value={form.id_semester}
                  onChange={(value) => handleSemesterChange(value)}
                  options={[
                    { value: '', label: 'Todos los semestres' },
                    ...semesters.map((s) => ({ value: String(s.id_semester), label: s.name_semester }))
                  ]}
                />
              </label>
              
              {/* Asignatura */}
              <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <span className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Asignatura</span>
                <CustomSelect
                  value={form.id_subject}
                  onChange={(value) => handleSubjectChange(value)}
                  options={[
                    { value: '', label: 'Seleccione una asignatura...' },
                    ...eligibleSubjects.map((s) => ({ 
                      value: String(s.id_subject), 
                      label: `${s.name_subject} (${s.totalSections} ${s.totalSections === 1 ? 'sección' : 'secciones'})` 
                    }))
                  ]}
                />
              </label>
              
              {/* Sección */}
              <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <span className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                  Sección y Aula asignada
                </span>
                <CustomSelect
                  value={form.id_section}
                  onChange={(value) => {
                    const sec = sections.find(s => s.id_section === Number(value));
                    setForm(prev => ({ 
                      ...prev, 
                      id_section: value,
                      id_subject: sec ? String(sec.id_subject) : prev.id_subject,
                      id_teacher: sec?.id_teacher ? String(sec.id_teacher) : prev.id_teacher
                    }));
                  }}
                  options={[
                    { 
                      value: '', 
                      label: eligibleSections.length === 0 
                        ? (form.id_subject ? 'No hay secciones abiertas para esta asignatura' : 'Seleccione una asignatura primero...') 
                        : 'Seleccione una sección...' 
                    },
                    ...eligibleSections.map((sec) => {
                      const teacherName = sec.Teacher?.User 
                        ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}` 
                        : null;
                      const teacherStatus = teacherName 
                        ? `[Docente actual: ${teacherName}]` 
                        : '[⚠️ Sin docente asignado]';
                      
                      return {
                        value: String(sec.id_section),
                        label: `Sección ${sec.section_code} | Aula: ${sec.classroom || 'Sin aula'} | Horario: ${sec.schedule_info || 'Sin horario'} ${teacherStatus}`
                      };
                    })
                  ]}
                />
              </label>

              {form.id_subject && eligibleSections.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  color: '#854d0e',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#854d0e" />
                  <span>Esta asignatura no tiene secciones registradas para el período actual. Puedes crear una sección en el módulo <strong>Secciones</strong>.</span>
                </div>
              )}
              
              {/* Docente */}
              <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <span className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Docente</span>
                <CustomSelect
                  value={form.id_teacher}
                  onChange={(value) => setForm(prev => ({ ...prev, id_teacher: value }))}
                  options={[
                    { value: '', label: 'Seleccione un docente...' },
                    ...teachers.map((t) => ({
                      value: String(t.id_teacher),
                      label: `${t.User ? `${t.User.first_name} ${t.User.first_lastname}` : `Docente ID: ${t.id_teacher}`} — ${t.profession || 'Docente'}`
                    }))
                  ]}
                />
              </label>
            </div>
            
            {scheduleConflict && (
              <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)', color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.55 }}>
                ⚠️ <strong>Conflicto de horario:</strong> El docente seleccionado ya tiene asignada otra sección en el mismo horario y día de clase en este período.
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
              <ActionButton 
                variant="accent" 
                onClick={handleSave} 
                disabled={submitting || !form.id_section || !form.id_teacher}
              >
                {submitting ? 'Guardando...' : 'Asignar docente a la sección'}
              </ActionButton>
            </div>
          </SectionCard>
        </div>

        {/* Listado y Resumen de Secciones del Período */}
        <SectionCard 
          title="Secciones del período" 
          description="Visualiza todas las secciones del período actual y su estado de asignación docente."
        >
          {/* Pestañas de filtrado rápido */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setSectionFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: sectionFilterTab === 'all' ? '#1d4ed8' : '#f1f5f9',
                color: sectionFilterTab === 'all' ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              Todas ({sections.length})
            </button>
            <button
              type="button"
              onClick={() => setSectionFilterTab('unassigned')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: sectionFilterTab === 'unassigned' ? '#dc2626' : '#fee2e2',
                color: sectionFilterTab === 'unassigned' ? '#ffffff' : '#991b1b',
                transition: 'all 0.15s ease'
              }}
            >
              Sin docente ({unassignedSections.length})
            </button>
            <button
              type="button"
              onClick={() => setSectionFilterTab('assigned')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: sectionFilterTab === 'assigned' ? '#16a34a' : '#dcfce7',
                color: sectionFilterTab === 'assigned' ? '#ffffff' : '#166534',
                transition: 'all 0.15s ease'
              }}
            >
              Con docente ({assignedSections.length})
            </button>
          </div>

          {/* Barra de búsqueda rápida */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por materia, sección, aula o profesor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                fontSize: '0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

          {filteredSectionsForList.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
              No se encontraron secciones para este filtro.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredSectionsForList.map((sec) => {
                const teacherUser = sec.Teacher?.User;
                const isAssigned = !!teacherUser;
                const isCurrentFormSection = String(sec.id_section) === String(form.id_section);

                return (
                  <article 
                    key={sec.id_section} 
                    style={{ 
                      border: isCurrentFormSection ? '2px solid #ffd100' : '1px solid #e2e8f0', 
                      borderRadius: '14px', 
                      padding: '14px 16px', 
                      background: isCurrentFormSection ? '#fefce8' : '#ffffff', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      transition: 'border 0.2s ease',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '0.8rem', 
                          fontWeight: 800, 
                          background: 'rgba(59, 130, 246, 0.12)', 
                          color: '#1d4ed8',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          letterSpacing: '0.02em'
                        }}>
                          Sección {sec.section_code}
                        </span>
                        <strong style={{ color: '#0f172a', fontSize: '0.98rem' }}>
                          {sec.Subject?.name_subject || 'Asignatura'}
                        </strong>
                      </div>
                      <StatusBadge tone={isAssigned ? 'success' : 'danger'}>
                        {isAssigned ? 'Asignada' : 'Sin Docente'}
                      </StatusBadge>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.82rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={14} color="#64748b" />
                        {sec.Career?.name_career || 'Carrera'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#f59e0b" />
                        {sec.classroom || 'Sin aula'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="#3b82f6" />
                        {sec.schedule_info || 'Sin horario'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#64748b', marginRight: '4px' }}>Docente:</span>
                        {isAssigned ? (
                          <strong style={{ color: '#16a34a' }}>
                            {teacherUser.first_name} {teacherUser.first_lastname}
                          </strong>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>
                            Pendiente por asignar
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectSectionFromList(sec)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isAssigned ? '1px solid #cbd5e1' : 'none',
                          background: isAssigned ? '#f8fafc' : '#ffd100',
                          color: '#051124',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isAssigned ? 'Reasignar' : 'Asignar Docente'}
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

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
              {notification.type === 'success' ? 'Asignado' : 'Error'}
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
