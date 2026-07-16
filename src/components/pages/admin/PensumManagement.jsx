import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BookMarked, Layers3, PlusCircle, Trash2, CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge, fieldStyle, CustomSelect } from './AdminPageShell';
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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '', code: '' });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, id: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const pendingDeleteIdRef = useRef(null);
  const submittingRef = useRef(false);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

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
    setLoading(true);

    const [careersRes, pensumsRes, semestersRes, subjectsRes] = await Promise.allSettled([
      api.get('/careers'),
      api.get('/pensums'),
      api.get('/semesters'),
      api.get('/subjects'),
    ]);

    if (careersRes.status === 'fulfilled') {
      const data = careersRes.value;
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setCareers(raw);
      if (raw.length > 0 && !careerCode) {
        setCareerCode(raw[0].code_career);
      }
    }

    if (pensumsRes.status === 'fulfilled') {
      const data = pensumsRes.value;
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setPensums(raw);
    }

    if (semestersRes.status === 'fulfilled') {
      const data = semestersRes.value;
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setSemesters(raw);
    }

    if (subjectsRes.status === 'fulfilled') {
      const data = subjectsRes.value;
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setGlobalSubjects(raw);
    }

    setLoading(false);
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
    if (submittingRef.current) return;
    try {
      const { id_career, name_pensum, resolution_date, is_active } = pensumForm;
      if (!id_career || !name_pensum) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }
      submittingRef.current = true;
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
      submittingRef.current = false;
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
    if (submittingRef.current) return;
    try {
      const { code_subject, name_subject, credit_units, id_pensum, id_semester, id_prerequisite_1, id_prerequisite_2, id_prerequisite_3 } = form;

      if (!code_subject || !name_subject || !credit_units || !id_pensum || !id_semester) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }

      submittingRef.current = true;
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
      submittingRef.current = false;
    }
  };

  const handleDeleteSubject = (id_pensum_subject, name, code) => {
    setDeleteDialog({ open: true, id: id_pensum_subject, name, code });
  };

  const executeRemoveFromPensum = async () => {
    const { id, name } = deleteDialog;
    if (!id) return;
    setDeleteDialog({ open: false, id: null, name: '', code: '' });

    try {
      await api.delete(`/pensum-subjects/${id}`);
      await loadData();
    } catch (err) {
      console.error('Error removing subject from pensum:', err);
      if (name) showNotification('error', `Error al remover la materia "${name}" del pensum`);
    }
  };

  const executeDeleteCompletely = () => {
    const { id } = deleteDialog;
    if (!id) return;
    pendingDeleteIdRef.current = id;
    setDeleteDialog({ open: false, id: null, name: '', code: '' });
    setDeletePassword('');
    setPasswordDialog({ open: true, id });
  };

  const executeFullDeleteWithPassword = async () => {
    const id = pendingDeleteIdRef.current || passwordDialog.id;
    if (!id || !deletePassword) return;

    try {
      await api.post(`/pensum-subjects/${id}/full-delete`, { password: deletePassword });
      setPasswordDialog({ open: false, id: null });
      pendingDeleteIdRef.current = null;
      setDeletePassword('');
      await loadData();
      showNotification('success', 'Materia eliminada exitosamente');
    } catch (err) {
      console.error('Error deleting subject completely:', err);
      const msg = err.data?.message || err.message || 'Error al eliminar la materia';
      showNotification('error', msg);
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
            <CustomSelect
              value={careerCode}
              onChange={(value) => {
                setCareerCode(value);
                setSemesterFilter('Todos');
              }}
              options={careers.map((career) => ({ value: career.code_career, label: career.name_career }))}
            />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Semestre</span>
            <CustomSelect
              value={semesterFilter}
              onChange={(value) => setSemesterFilter(value)}
              style={semestersWithSubjects.length === 0 ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              options={[
                { value: 'Todos', label: 'Todos' },
                ...semestersWithSubjects.map((semester) => ({ value: semester.term, label: semester.term }))
              ]}
            />
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
                              onClick={() => handleDeleteSubject(subject.id_pensum_subject, subject.name, subject.code)}
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
            <CustomSelect
              value={form.id_pensum}
              onChange={(value) => setForm({ ...form, id_pensum: value })}
              options={[
                { value: '', label: 'Seleccione un pensum' },
                ...pensums.map((p) => ({ value: p.id_pensum, label: `${p.Career?.name_career} (${p.name_pensum})` }))
              ]}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Semestre</span>
            <CustomSelect
              value={form.id_semester}
              onChange={(value) => setForm({ ...form, id_semester: value })}
              options={[
                { value: '', label: 'Seleccione un semestre' },
                ...semesters.map((s) => ({ value: s.id_semester, label: s.name_semester }))
              ]}
            />
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
              <CustomSelect
                value={selectedGlobalSubjectId}
                onChange={(value) => {
                  const id = value;
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
                options={[
                  { value: '', label: 'Seleccione una materia registrada...' },
                  ...globalSubjects.map((sub) => ({ value: sub.id_subject, label: `${sub.name_subject} (${sub.code_subject})` }))
                ]}
              />
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
                <CustomSelect
                  value={form.id_prerequisite_1}
                  onChange={(value) => setForm({ ...form, id_prerequisite_1: value })}
                  options={[
                    { value: '', label: 'Ninguno' },
                    ...eligiblePrerequisites.map((ps) => ({ value: ps.id_pensum_subject, label: `${ps.Subject?.name_subject || ps.Subject?.name} (${ps.code_subject})` }))
                  ]}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Prerrequisito 2</span>
                <CustomSelect
                  value={form.id_prerequisite_2}
                  onChange={(value) => setForm({ ...form, id_prerequisite_2: value })}
                  options={[
                    { value: '', label: 'Ninguno' },
                    ...eligiblePrerequisites.map((ps) => ({ value: ps.id_pensum_subject, label: `${ps.Subject?.name_subject || ps.Subject?.name} (${ps.code_subject})` }))
                  ]}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Prerrequisito 3</span>
                <CustomSelect
                  value={form.id_prerequisite_3}
                  onChange={(value) => setForm({ ...form, id_prerequisite_3: value })}
                  options={[
                    { value: '', label: 'Ninguno' },
                    ...eligiblePrerequisites.map((ps) => ({ value: ps.id_pensum_subject, label: `${ps.Subject?.name_subject || ps.Subject?.name} (${ps.code_subject})` }))
                  ]}
                />
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
            <CustomSelect
              value={pensumForm.id_career}
              onChange={(value) => setPensumForm({ ...pensumForm, id_career: value })}
              options={[
                { value: '', label: 'Seleccione una carrera' },
                ...careers.map((c) => ({ value: c.id_career, label: `${c.name_career} (${c.code_career})` }))
              ]}
            />
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
            <CustomSelect
              value={pensumForm.is_active ? 'true' : 'false'}
              onChange={(value) => setPensumForm({ ...pensumForm, is_active: value === 'true' })}
              options={[
                { value: 'true', label: 'Activo' },
                { value: 'false', label: 'Inactivo' }
              ]}
            />
          </label>
        </div>
      </Modal>
      {/* DIÁLOGO CONTRASEÑA */}
      {passwordDialog.open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', zIndex: 80,
          }}
          onClick={() => { setPasswordDialog({ open: false, id: null }); setDeletePassword(''); }}
        >
          <div
            style={{
              width: 'min(400px, 100%)', background: '#ffffff', border: '1px solid #dbe4f0',
              borderRadius: '22px', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
              padding: '32px', textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fff1f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="#b91c1c" />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Eliminar completamente
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Ingrese su contraseña de administrador para confirmar la eliminación definitiva de la materia.
            </p>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Contraseña de administrador"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') executeFullDeleteWithPassword(); }}
                style={{ textAlign: 'center', paddingRight: '44px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', padding: '8px', display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <ActionButton variant="ghost" onClick={() => { setPasswordDialog({ open: false, id: null }); setDeletePassword(''); }}>
                Cancelar
              </ActionButton>
              <button
                type="button"
                onClick={executeFullDeleteWithPassword}
                disabled={!deletePassword}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderRadius: '12px', padding: '11px 20px', fontFamily: 'var(--font-heading)',
                  fontSize: '0.85rem', fontWeight: 700, cursor: deletePassword ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease', opacity: deletePassword ? 1 : 0.5,
                  background: '#b91c1c', color: '#ffffff', border: '1px solid #b91c1c',
                }}
              >
                Confirmar y eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteDialog.open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', zIndex: 70,
          }}
          onClick={() => setDeleteDialog({ open: false, id: null, name: '', code: '' })}
        >
          <div
            style={{
              width: 'min(440px, 100%)', background: '#ffffff', border: '1px solid #dbe4f0',
              borderRadius: '22px', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
              padding: '32px', textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fff1f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="#b91c1c" />
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Eliminar materia
            </h3>
            <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
              ¿Qué desea hacer con <strong>{deleteDialog.name}</strong> ({deleteDialog.code})?
            </p>
            <p style={{ margin: '0 0 28px', color: '#94a3b8', fontSize: '0.82rem' }}>
              Si solo la remueve del pensum, podrá volver a agregarla después.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <ActionButton variant="ghost" onClick={() => setDeleteDialog({ open: false, id: null, name: '', code: '' })}>
                Cancelar
              </ActionButton>
              <ActionButton variant="accent" onClick={executeRemoveFromPensum}>
                Solo remover del pensum
              </ActionButton>
              <button
                type="button"
                onClick={executeDeleteCompletely}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderRadius: '12px', padding: '11px 20px', fontFamily: 'var(--font-heading)',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
                  background: '#b91c1c', color: '#ffffff', border: '1px solid #b91c1c',
                }}
              >
                Eliminar completamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN CENTRAL */}
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
              {notification.type === 'success' ? 'Eliminado' : 'Error'}
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
