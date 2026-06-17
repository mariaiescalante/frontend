import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Layers3, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
import api from '../../../services/api';

export default function PensumManagement() {
  const [careers, setCareers] = useState([]);
  const [pensums, setPensums] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [selectedGlobalSubjectId, setSelectedGlobalSubjectId] = useState('');
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [careerCode, setCareerCode] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [pensumModalOpen, setPensumModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Subject Form state with up to 3 optional prerequisites
  const [form, setForm] = useState({
    code_subject: '',
    name_subject: '',
    credit_units: 3,
    id_pensum: '',
    id_semester: '',
    id_prerequisite_1: '',
    id_prerequisite_2: '',
    id_prerequisite_3: '',
  });

  // Pensum Form state
  const [pensumForm, setPensumForm] = useState({
    id_career: '',
    name_pensum: '',
    resolution_date: '',
    is_active: true,
  });

  async function loadData() {
    try {
      setLoading(true);
      const [careersRes, pensumsRes, semestersRes, subjectsRes] = await Promise.all([
        api.get('/careers'),
        api.get('/pensums'),
        api.get('/semesters'),
        api.get('/subjects'),
      ]);

      const rawCareers = Array.isArray(careersRes.data) ? careersRes.data : (Array.isArray(careersRes) ? careersRes : []);
      const rawPensums = Array.isArray(pensumsRes.data) ? pensumsRes.data : (Array.isArray(pensumsRes) ? pensumsRes : []);
      const rawSemesters = Array.isArray(semestersRes.data) ? semestersRes.data : (Array.isArray(semestersRes) ? semestersRes : []);
      const rawSubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : (Array.isArray(subjectsRes) ? subjectsRes : []);

      setCareers(rawCareers);
      setPensums(rawPensums);
      setSemesters(rawSemesters);
      setGlobalSubjects(rawSubjects);

      // Auto-select first active career if not set
      if (rawCareers.length > 0 && !careerCode) {
        setCareerCode(rawCareers[0].code_career);
      }
    } catch (err) {
      console.error('Error fetching pensum data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCareer = useMemo(() => {
    return careers.find((c) => c.code_career === careerCode);
  }, [careers, careerCode]);

  const currentPensum = useMemo(() => {
    if (!selectedCareer) return null;
    return (
      pensums.find((p) => p.id_career === selectedCareer.id_career && p.is_active) ||
      pensums.find((p) => p.id_career === selectedCareer.id_career)
    );
  }, [pensums, selectedCareer]);

  const semestersWithSubjects = useMemo(() => {
    if (!selectedCareer || !currentPensum) return [];

    const limit = selectedCareer.total_semesters || 8;
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
            code: ps.code_subject,
            baseCode: ps.Subject?.code_subject || '',
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
  }, [currentPensum, selectedCareer, semesters]);

  const filteredSemesters = useMemo(() => {
    return semesterFilter === 'Todos'
      ? semestersWithSubjects
      : semestersWithSubjects.filter((s) => s.term === semesterFilter);
  }, [semesterFilter, semestersWithSubjects]);

  const handleOpenPensumModal = () => {
    setPensumForm({
      id_career: selectedCareer?.id_career || '',
      name_pensum: '',
      resolution_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    setPensumModalOpen(true);
  };

  const handleSavePensum = async () => {
    try {
      const { id_career, name_pensum, resolution_date, is_active } = pensumForm;
      if (!id_career || !name_pensum) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }
      setSubmitting(true);
      await api.post('/pensums', {
        id_career: Number(id_career),
        name_pensum: name_pensum.trim(),
        resolution_date: resolution_date || null,
        is_active: Boolean(is_active),
      });
      setPensumModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving pensum:', err);
      alert(err.response?.data?.message || err.message || 'Error al guardar el pensum');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddModal = () => {
    setForm({
      code_subject: '',
      name_subject: '',
      credit_units: 3,
      id_pensum: currentPensum?.id_pensum || '',
      id_semester: semesters[0]?.id_semester || '',
      id_prerequisite_1: '',
      id_prerequisite_2: '',
      id_prerequisite_3: '',
    });
    setSelectedGlobalSubjectId('');
    setIsCreatingNewSubject(false);
    setModalOpen(true);
  };

  const handleSaveSubject = async () => {
    try {
      const { code_subject, name_subject, credit_units, id_pensum, id_semester, id_prerequisite_1, id_prerequisite_2, id_prerequisite_3 } = form;

      if (!code_subject || !name_subject || !credit_units || !id_pensum || !id_semester) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }

      setSubmitting(true);

      const prereqs = [id_prerequisite_1, id_prerequisite_2, id_prerequisite_3]
        .map(Number)
        .filter((val) => !isNaN(val) && val > 0);

      const payload = {
        code_subject: code_subject.trim(),
        name_subject: name_subject.trim(),
        credit_units: Number(credit_units),
        id_pensum: Number(id_pensum),
        id_semester: Number(id_semester),
        id_prerequisites: prereqs
      };

      await api.post('/subjects', payload);

      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving subject:', err);
      const msg = err.response?.data?.message || err.message || 'Error al guardar la materia';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id_pensum_subject, name) => {
    if (!window.confirm(`¿Está seguro que desea remover la materia "${name}" de este pensum?`)) {
      return;
    }

    try {
      await api.delete(`/pensum-subjects/${id_pensum_subject}`);
      await loadData();
    } catch (err) {
      console.error('Error removing subject from pensum:', err);
      alert('Error al remover la materia del pensum');
    }
  };

  const eligiblePrerequisites = useMemo(() => {
    if (!currentPensum) return [];
    return currentPensum.PensumSubjects || [];
  }, [currentPensum]);

  const totalSubjectsCount = semestersWithSubjects.reduce((acc, sem) => acc + sem.subjects.length, 0);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Gestión de pensum"
        title="Plan de estudios por carrera"
        subtitle="Cargando información del pensum..."
        metrics={[
          { label: 'Ciclos visibles', value: '...', hint: 'Cargando...', icon: Layers3, tone: 'primary' },
          { label: 'Materias totales', value: '...', hint: 'Cargando...', icon: BookMarked, tone: 'info' },
          { label: 'Obligatorias', value: '...', hint: 'Cargando...', icon: BookMarked, tone: 'success' },
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
      eyebrow="Gestión de pensum"
      title="Plan de estudios por carrera"
      subtitle="La malla académica se conecta con el backend para editar asignaturas, créditos y prelaciones en tiempo real."
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentPensum && (
            <ActionButton variant="accent" onClick={handleOpenAddModal}>
              <PlusCircle size={16} /> Agregar materia
            </ActionButton>
          )}
          <ActionButton variant="secondary" onClick={handleOpenPensumModal}>
            <PlusCircle size={16} /> Nuevo Pensum
          </ActionButton>
        </div>
      }
      metrics={[
        {
          label: 'Ciclos visibles',
          value: `${semestersWithSubjects.length}`,
          hint: 'Semestres cargados para la carrera activa',
          icon: Layers3,
          tone: 'primary',
        },
        {
          label: 'Materias totales',
          value: `${totalSubjectsCount}`,
          hint: 'Asignaturas por ciclo y nivel',
          icon: BookMarked,
          tone: 'info',
        },
        {
          label: 'Obligatorias',
          value: `${totalSubjectsCount}`,
          hint: 'Núcleo académico del programa',
          icon: BookMarked,
          tone: 'success',
        },
      ]}
    >
      <SectionCard title="Filtros del pensum" description="Elige la carrera y el semestre que deseas inspeccionar o editar.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', maxWidth: '760px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select
              className="form-input"
              value={careerCode}
              onChange={(event) => {
                setCareerCode(event.target.value);
                setSemesterFilter('Todos');
              }}
            >
              {careers.map((career) => (
                <option key={career.code_career} value={career.code_career}>
                  {career.name_career}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Semestre</span>
            <select
              className="form-input"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              disabled={semestersWithSubjects.length === 0}
            >
              <option>Todos</option>
              {semestersWithSubjects.map((semester) => (
                <option key={semester.term} value={semester.term}>
                  {semester.term}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      {selectedCareer && !currentPensum && (
        <SectionCard
          title={`Pensum de ${selectedCareer.name_career}`}
          description="Aún no se ha inicializado el plan de estudios para esta carrera."
        >
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Para poder agregar materias a esta carrera, es necesario crear y activar un plan de estudios (Pensum).
            </p>
            <ActionButton variant="accent" onClick={handleOpenPensumModal}>
              Crear Plan de Estudios
            </ActionButton>
          </div>
        </SectionCard>
      )}

      {currentPensum && (
        <SectionCard
          title={`Pensum de ${selectedCareer?.name_career}`}
          description={`Agrupación por ciclo con prelaciones e identificadores combinados (${currentPensum.name_pensum}).`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredSemesters.map((semester) => (
              <article key={semester.term} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden' }}>
                <header
                  style={{
                    padding: '18px 20px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{semester.term}</h4>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                      {semester.subjects.length} asignaturas registradas
                    </p>
                  </div>
                  <StatusBadge tone="info">Ciclo activo</StatusBadge>
                </header>
                <div style={{ padding: '20px' }}>
                  {semester.subjects.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, textAlign: 'center', padding: '10px' }}>
                      No hay materias asignadas a este semestre.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                      {semester.subjects.map((subject) => (
                        <div
                          key={subject.code}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #dbe4f0',
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
                              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{subject.name}</strong>
                              <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                Código: {subject.code}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                Base: {subject.baseCode}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteSubject(subject.id_pensum_subject, subject.name)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'absolute',
                                right: '12px',
                                top: '12px',
                              }}
                              title="Remover del pensum"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', fontSize: '0.82rem', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                            <div>
                              <span style={{ color: '#64748b', display: 'block' }}>Créditos</span>
                              <strong>{subject.credits} UC</strong>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: '#64748b', display: 'block' }}>Prerreq.</span>
                              <strong style={{ color: subject.prereq !== 'Ninguno' ? '#3b82f6' : '#0f172a' }}>{subject.prereq}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {/* MODAL AGREGAR MATERIA */}
      <Modal
        open={modalOpen}
        title="Agregar materia al pensum"
        subtitle="Materia compartida o nueva que se asocia al pensum activo de la carrera."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </ActionButton>
            <ActionButton variant="accent" onClick={handleSaveSubject} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar materia'}
            </ActionButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Pensum / Carrera</span>
            <select
              className="form-input"
              value={form.id_pensum}
              onChange={(e) => setForm({ ...form, id_pensum: e.target.value })}
            >
              <option value="">Seleccione un pensum</option>
              {pensums.map((p) => (
                <option key={p.id_pensum} value={p.id_pensum}>
                  {p.Career?.name_career} ({p.name_pensum})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Semestre</span>
            <select
              className="form-input"
              value={form.id_semester}
              onChange={(e) => setForm({ ...form, id_semester: e.target.value })}
            >
              <option value="">Seleccione un semestre</option>
              {semesters.map((s) => (
                <option key={s.id_semester} value={s.id_semester}>
                  {s.name_semester}
                </option>
              ))}
            </select>
          </label>

          {/* Segmented control to choose between selecting an existing subject or creating a new one */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewSubject(false);
                setSelectedGlobalSubjectId('');
                setForm(prev => ({
                  ...prev,
                  code_subject: '',
                  name_subject: '',
                  credit_units: 3
                }));
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: '1px solid',
                borderColor: !isCreatingNewSubject ? '#3b82f6' : '#e2e8f0',
                background: !isCreatingNewSubject ? '#eff6ff' : 'transparent',
                color: !isCreatingNewSubject ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Materia Existente
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewSubject(true);
                setSelectedGlobalSubjectId('');
                setForm(prev => ({
                  ...prev,
                  code_subject: '',
                  name_subject: '',
                  credit_units: 3
                }));
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: '1px solid',
                borderColor: isCreatingNewSubject ? '#3b82f6' : '#e2e8f0',
                background: isCreatingNewSubject ? '#eff6ff' : 'transparent',
                color: isCreatingNewSubject ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              + Crear Nueva Materia
            </button>
          </div>

          {!isCreatingNewSubject ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Buscar Materia Registrada</span>
              <select
                className="form-input"
                value={selectedGlobalSubjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedGlobalSubjectId(id);
                  if (id) {
                    const sub = globalSubjects.find(s => String(s.id_subject) === String(id));
                    if (sub) {
                      setForm(prev => ({
                        ...prev,
                        code_subject: sub.code_subject || '',
                        name_subject: sub.name_subject || '',
                        credit_units: sub.credit_units || 3
                      }));
                    }
                  } else {
                    setForm(prev => ({
                      ...prev,
                      code_subject: '',
                      name_subject: '',
                      credit_units: 3
                    }));
                  }
                }}
              >
                <option value="">Seleccione una materia registrada...</option>
                {globalSubjects.map((sub) => (
                  <option key={sub.id_subject} value={sub.id_subject}>
                    {sub.name_subject} ({sub.code_subject})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
              ℹ️ Estás creando una materia nueva a nivel global. Al guardarla, se agregará a la base de datos y se asociará a este pensum.
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              Código Base (ej: MAT-101) {!isCreatingNewSubject && '🔒'}
            </span>
            <input
              className="form-input"
              value={form.code_subject}
              onChange={(e) => setForm({ ...form, code_subject: e.target.value })}
              placeholder={!isCreatingNewSubject && !selectedGlobalSubjectId ? "Seleccione una materia arriba..." : "Código único de la materia"}
              disabled={!isCreatingNewSubject}
              style={{ background: !isCreatingNewSubject ? '#f1f5f9' : '#ffffff', cursor: !isCreatingNewSubject ? 'not-allowed' : 'text' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              Nombre {!isCreatingNewSubject && '🔒'}
            </span>
            <input
              className="form-input"
              value={form.name_subject}
              onChange={(e) => setForm({ ...form, name_subject: e.target.value })}
              placeholder={!isCreatingNewSubject && !selectedGlobalSubjectId ? "Seleccione una materia arriba..." : "Nombre de la materia"}
              disabled={!isCreatingNewSubject}
              style={{ background: !isCreatingNewSubject ? '#f1f5f9' : '#ffffff', cursor: !isCreatingNewSubject ? 'not-allowed' : 'text' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
              Unidades de Crédito {!isCreatingNewSubject && '🔒'}
            </span>
            <input
              className="form-input"
              type="number"
              value={form.credit_units}
              onChange={(e) => setForm({ ...form, credit_units: e.target.value })}
              placeholder="Número de créditos"
              disabled={!isCreatingNewSubject}
              style={{ background: !isCreatingNewSubject ? '#f1f5f9' : '#ffffff', cursor: !isCreatingNewSubject ? 'not-allowed' : 'text' }}
            />
          </label>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>
              Prelaciones / Prerrequisitos (Opcionales, máximo 3)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Prerrequisito 1</span>
                <select
                  className="form-input"
                  value={form.id_prerequisite_1}
                  onChange={(e) => setForm({ ...form, id_prerequisite_1: e.target.value })}
                >
                  <option value="">Ninguno</option>
                  {eligiblePrerequisites.map((ps) => (
                    <option key={ps.id_pensum_subject} value={ps.id_pensum_subject}>
                      {ps.Subject?.name_subject || ps.Subject?.name} ({ps.code_subject})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Prerrequisito 2</span>
                <select
                  className="form-input"
                  value={form.id_prerequisite_2}
                  onChange={(e) => setForm({ ...form, id_prerequisite_2: e.target.value })}
                >
                  <option value="">Ninguno</option>
                  {eligiblePrerequisites.map((ps) => (
                    <option key={ps.id_pensum_subject} value={ps.id_pensum_subject}>
                      {ps.Subject?.name_subject || ps.Subject?.name} ({ps.code_subject})
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Prerrequisito 3</span>
                <select
                  className="form-input"
                  value={form.id_prerequisite_3}
                  onChange={(e) => setForm({ ...form, id_prerequisite_3: e.target.value })}
                >
                  <option value="">Ninguno</option>
                  {eligiblePrerequisites.map((ps) => (
                    <option key={ps.id_pensum_subject} value={ps.id_pensum_subject}>
                      {ps.Subject?.name_subject || ps.Subject?.name} ({ps.code_subject})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL CREAR PENSUM */}
      <Modal
        open={pensumModalOpen}
        title="Crear nuevo Pensum"
        subtitle="Crea un plan de estudios para una carrera académica específica."
        onClose={() => setPensumModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setPensumModalOpen(false)} disabled={submitting}>
              Cancelar
            </ActionButton>
            <ActionButton variant="accent" onClick={handleSavePensum} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Pensum'}
            </ActionButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Carrera Asociada</span>
            <select
              className="form-input"
              value={pensumForm.id_career}
              onChange={(e) => setPensumForm({ ...pensumForm, id_career: e.target.value })}
            >
              <option value="">Seleccione una carrera</option>
              {careers.map((c) => (
                <option key={c.id_career} value={c.id_career}>
                  {c.name_career} ({c.code_career})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Nombre del Pensum (ej: Pensum 2026)</span>
            <input
              className="form-input"
              value={pensumForm.name_pensum}
              onChange={(e) => setPensumForm({ ...pensumForm, name_pensum: e.target.value })}
              placeholder="Ej: Pensum 2026"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Fecha de Resolución</span>
            <input
              className="form-input"
              type="date"
              value={pensumForm.resolution_date}
              onChange={(e) => setPensumForm({ ...pensumForm, resolution_date: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Estado</span>
            <select
              className="form-input"
              value={pensumForm.is_active ? 'true' : 'false'}
              onChange={(e) => setPensumForm({ ...pensumForm, is_active: e.target.value === 'true' })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
