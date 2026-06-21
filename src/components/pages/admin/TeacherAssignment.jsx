import React, { useMemo, useState, useEffect } from 'react';
import { BadgeCheck, UserRoundCog, Slash } from 'lucide-react';
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

  const [form, setForm] = useState({
    id_career: '',
    id_semester: '',
    id_subject: '',
    id_section: '',
    id_teacher: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [careersRes, semestersRes, teachersRes, sectionsRes, pensumsRes] = await Promise.all([
        api.get('/careers'),
        api.get('/semesters'),
        api.get('/teachers'),
        api.get('/sections'),
        api.get('/pensums'),
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

      // Initialize form fields
      const initialForm = {
        id_career: rawCareers[0]?.id_career || '',
        id_semester: rawSemesters[0]?.id_semester || '',
        id_subject: '',
        id_section: '',
        id_teacher: rawTeachers[0]?.id_teacher || '',
      };

      // Set first matching subject and section if available
      const activePensum = rawPensums.find(p => p.id_career === rawCareers[0]?.id_career && p.is_active) ||
                           rawPensums.find(p => p.id_career === rawCareers[0]?.id_career);
      if (activePensum && rawSemesters[0]) {
        const matchingSubjects = (activePensum.PensumSubjects || [])
          .filter(ps => ps.id_semester === rawSemesters[0].id_semester)
          .map(ps => ps.Subject)
          .filter(Boolean);
        
        if (matchingSubjects[0]) {
          initialForm.id_subject = matchingSubjects[0].id_subject;
          
          const matchingSections = rawSections.filter(sec => 
            sec.id_subject === matchingSubjects[0].id_subject &&
            sec.id_career === rawCareers[0].id_career
          );
          if (matchingSections[0]) {
            initialForm.id_section = matchingSections[0].id_section;
          }
        }
      }

      setForm(initialForm);
    } catch (err) {
      console.error('Error loading teacher assignment data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCareer = useMemo(() => {
    return careers.find(c => c.id_career === Number(form.id_career));
  }, [careers, form.id_career]);

  const currentPensum = useMemo(() => {
    if (!selectedCareer) return null;
    return pensums.find(p => p.id_career === selectedCareer.id_career && p.is_active) ||
           pensums.find(p => p.id_career === selectedCareer.id_career);
  }, [pensums, selectedCareer]);

  const eligibleSubjects = useMemo(() => {
    if (!currentPensum || !form.id_semester) return [];
    return (currentPensum.PensumSubjects || [])
      .filter(ps => ps.id_semester === Number(form.id_semester))
      .map(ps => ps.Subject)
      .filter(Boolean);
  }, [currentPensum, form.id_semester]);

  const eligibleSections = useMemo(() => {
    if (!form.id_subject || !form.id_career) return [];
    return sections.filter(sec => 
      sec.id_subject === Number(form.id_subject) && 
      sec.id_career === Number(form.id_career)
    );
  }, [sections, form.id_subject, form.id_career]);

  // Handle cascading dropdown state changes
  const handleCareerChange = (id_career) => {
    const activePensum = pensums.find(p => p.id_career === Number(id_career) && p.is_active) ||
                         pensums.find(p => p.id_career === Number(id_career));
    
    let nextSubjectId = '';
    let nextSectionId = '';
    
    if (activePensum && form.id_semester) {
      const matchSubjects = (activePensum.PensumSubjects || [])
        .filter(ps => ps.id_semester === Number(form.id_semester))
        .map(ps => ps.Subject)
        .filter(Boolean);
      
      if (matchSubjects[0]) {
        nextSubjectId = matchSubjects[0].id_subject;
        const matchSections = sections.filter(sec => 
          sec.id_subject === matchSubjects[0].id_subject &&
          sec.id_career === Number(id_career)
        );
        if (matchSections[0]) {
          nextSectionId = matchSections[0].id_section;
        }
      }
    }
    
    setForm(prev => ({
      ...prev,
      id_career,
      id_subject: nextSubjectId,
      id_section: nextSectionId
    }));
  };

  const handleSemesterChange = (id_semester) => {
    let nextSubjectId = '';
    let nextSectionId = '';
    
    if (currentPensum) {
      const matchSubjects = (currentPensum.PensumSubjects || [])
        .filter(ps => ps.id_semester === Number(id_semester))
        .map(ps => ps.Subject)
        .filter(Boolean);
      
      if (matchSubjects[0]) {
        nextSubjectId = matchSubjects[0].id_subject;
        const matchSections = sections.filter(sec => 
          sec.id_subject === matchSubjects[0].id_subject &&
          sec.id_career === Number(form.id_career)
        );
        if (matchSections[0]) {
          nextSectionId = matchSections[0].id_section;
        }
      }
    }
    
    setForm(prev => ({
      ...prev,
      id_semester,
      id_subject: nextSubjectId,
      id_section: nextSectionId
    }));
  };

  const handleSubjectChange = (id_subject) => {
    let nextSectionId = '';
    const matchSections = sections.filter(sec => 
      sec.id_subject === Number(id_subject) &&
      sec.id_career === Number(form.id_career)
    );
    if (matchSections[0]) {
      nextSectionId = matchSections[0].id_section;
    }
    
    setForm(prev => ({
      ...prev,
      id_subject,
      id_section: nextSectionId
    }));
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
        alert('Por favor seleccione una sección y un docente.');
        return;
      }
      setSubmitting(true);

      const sectionObj = sections.find(s => s.id_section === Number(id_section));
      if (!sectionObj) {
        alert('Sección no encontrada.');
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
      alert('Asignación de docente realizada con éxito.');
      await loadData();
    } catch (err) {
      console.error('Error updating section teacher:', err);
      alert(err.response?.data?.message || err.message || 'Error al guardar la asignación');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedSections = useMemo(() => {
    return sections.filter(sec => sec.id_teacher !== null);
  }, [sections]);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Asignación docente"
        title="Flujo jerárquico de vinculación académica"
        subtitle="Cargando información..."
        metrics={[
          { label: 'Asignaciones vigentes', value: '...', hint: 'Cargando...', icon: UserRoundCog, tone: 'primary' },
          { label: 'Docentes registrados', value: '...', hint: 'Cargando...', icon: BadgeCheck, tone: 'success' },
          { label: 'Conflictos', value: '...', hint: 'Cargando...', icon: Slash, tone: 'info' }
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
      subtitle="Selecciona carrera, ciclo, materia, sección y docente en una secuencia clara que respeta el lenguaje visual del resto del portal."
      metrics={[
        { label: 'Asignaciones vigentes', value: `${assignedSections.length}`, hint: 'Secciones activas con docente asignado', icon: UserRoundCog, tone: 'primary' },
        { label: 'Docentes registrados', value: `${teachers.length}`, hint: 'Cuerpo docente registrado', icon: BadgeCheck, tone: 'success' },
        { label: 'Conflictos', value: scheduleConflict ? '1' : '0', hint: 'Validación de choque de horario', icon: Slash, tone: scheduleConflict ? 'danger' : 'info' }
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Flujo de asignación" description="La secuencia de selección limita errores y mantiene la navegación intuitiva.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Carrera</span>
              <CustomSelect
                value={form.id_career}
                onChange={(value) => handleCareerChange(value)}
                options={careers.map((c) => ({ value: c.id_career, label: c.name_career }))}
              />
            </label>
            
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Semestre</span>
              <CustomSelect
                value={form.id_semester}
                onChange={(value) => handleSemesterChange(value)}
                options={semesters.map((s) => ({ value: s.id_semester, label: s.name_semester }))}
              />
            </label>
            
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Asignatura</span>
              <CustomSelect
                value={form.id_subject}
                onChange={(value) => handleSubjectChange(value)}
                options={[
                  { value: '', label: 'Seleccione una asignatura...' },
                  ...eligibleSubjects.map((s) => ({ value: s.id_subject, label: s.name_subject }))
                ]}
              />
            </label>
            
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Sección</span>
              <CustomSelect
                value={form.id_section}
                onChange={(value) => setForm(prev => ({ ...prev, id_section: value }))}
                options={[
                  { value: '', label: 'Seleccione una sección...' },
                  ...eligibleSections.map((sec) => ({
                    value: sec.id_section,
                    label: `${sec.section_code} - ${sec.classroom || 'Sin aula'}`
                  }))
                ]}
              />
            </label>
            
            <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <span className="form-label">Docente</span>
              <CustomSelect
                value={form.id_teacher}
                onChange={(value) => setForm(prev => ({ ...prev, id_teacher: value }))}
                options={teachers.map((t) => ({
                  value: t.id_teacher,
                  label: `${t.User ? `${t.User.first_name} ${t.User.first_lastname}` : `ID Docente: ${t.id_teacher}`} (${t.profession})`
                }))}
              />
            </label>
          </div>
          
          {scheduleConflict && (
            <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)', color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.55 }}>
              ⚠️ conflicto de horario: El docente seleccionado ya tiene asignada otra sección en el mismo horario y día de clase.
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            <ActionButton variant="accent" onClick={handleSave} disabled={submitting || !form.id_section || !form.id_teacher}>
              {submitting ? 'Asignando...' : 'Asignar docente'}
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard title="Asignaciones vigentes" description="Agrupación útil para auditoría rápida y revisión de carga.">
          {assignedSections.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              No hay docentes asignados a ninguna sección actualmente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {assignedSections.map((sec) => (
                <article key={sec.id_section} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: '#f8fafc', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f172a' }}>{sec.Subject?.name_subject || 'Asignatura'}</strong>
                    <StatusBadge tone="info">{sec.section_code}</StatusBadge>
                  </div>
                  <span style={{ color: '#475569', fontWeight: 600 }}>
                    {sec.Teacher?.User ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}` : 'Docente asignado'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {sec.Career?.name_career || 'Carrera'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Horario: {sec.schedule_info || 'Sin asignar'}
                  </span>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
