import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Layers3, PlusSquare, Search } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge, fieldStyle, ProgressBar, CustomSelect, ConfirmDialog } from './AdminPageShell';
import api from '../../../services/api';

export default function SectionsManagement() {
  const [sections, setSections] = useState([]);
  const [careers, setCareers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const [careerFilter, setCareerFilter] = useState('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [form, setForm] = useState({
    id_period: '',
    id_subject: '',
    id_teacher: '',
    id_career: '',
    section_code: 'A',
    quota_max: 30,
    classroom: 'Aula 01',
    schedule_day: 'Lunes',
    schedule_start: '08:00',
    schedule_end: '10:00'
  });

  // Cargar datos de referencia una vez al montar
  useEffect(() => {
    async function init() {
      try {
        const [carRes, subRes, teaRes, perRes] = await Promise.all([
          api.get('/careers'),
          api.get('/subjects'),
          api.get('/teachers'),
          api.get('/periods')
        ]);
        setCareers(Array.isArray(carRes.data) ? carRes.data : carRes);
        setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes);
        setTeachers(Array.isArray(teaRes.data) ? teaRes.data : teaRes);
        const perList = Array.isArray(perRes.data) ? perRes.data : perRes;
        setPeriods(perList);
        const active = perList.find(p => p.period_status === 'Activo') || perList[0];
        setSelectedPeriod(String(active?.id_period || ''));
      } catch (err) {
        console.error('Error fetching reference data:', err);
      }
    }
    init();
  }, []);

  // Cuando cambia el período seleccionado, cargar secciones
  const loadSections = useCallback(async (periodId) => {
    if (!periodId) return;
    setLoading(true);
    try {
      const secRes = await api.get(`/sections?id_period=${periodId}`);
      setSections(Array.isArray(secRes.data) ? secRes.data : secRes);
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriod) loadSections(selectedPeriod);
  }, [selectedPeriod, loadSections]);

  const visibleSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesSubject = subjectFilter === 'Todas' || String(section.id_subject) === String(subjectFilter);
      const matchesCareer = careerFilter === 'Todas' || String(section.id_career) === String(careerFilter);
      const sectionName = section.Subject?.name_subject || '';
      const matchesQuery = `${section.section_code} ${sectionName} ${section.classroom || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesCareer && matchesQuery;
    });
  }, [sections, subjectFilter, careerFilter, query]);

  const handleNewSection = () => {
    setEditingSection(null);
    setForm({
      id_period: selectedPeriod,
      id_subject: subjects[0]?.id_subject || '',
      id_teacher: teachers[0]?.id_teacher || '',
      id_career: careers[0]?.id_career || '',
      section_code: 'A',
      quota_max: 30,
      classroom: 'Aula 01',
      schedule_day: 'Lunes',
      schedule_start: '08:00',
      schedule_end: '10:00'
    });
    setModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    let day = 'Lunes';
    let start = '08:00';
    let end = '10:00';
    if (section.schedule_info) {
      const match = section.schedule_info.match(/^(\w+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
      if (match) {
        day = match[1];
        start = match[2];
        end = match[3];
      }
    }

    setForm({
      id_period: section.id_period,
      id_subject: section.id_subject,
      id_teacher: section.id_teacher,
      id_career: section.id_career,
      section_code: section.section_code,
      quota_max: section.quota_max,
      classroom: section.classroom || 'Aula 01',
      schedule_day: day,
      schedule_start: start,
      schedule_end: end
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        id_period: Number(form.id_period),
        id_subject: Number(form.id_subject),
        id_teacher: Number(form.id_teacher),
        id_career: Number(form.id_career),
        section_code: form.section_code.trim(),
        quota_max: Number(form.quota_max),
        classroom: form.classroom,
        schedule_info: `${form.schedule_day} ${form.schedule_start} - ${form.schedule_end}`
      };

      if (!payload.id_period || !payload.id_subject || !payload.id_teacher || !payload.id_career || !payload.section_code || !payload.quota_max) {
        alert('Por favor complete todos los campos obligatorios.');
        return;
      }

      if (editingSection) {
        await api.put(`/sections/${editingSection.id_section}`, payload);
      } else {
        await api.post('/sections', payload);
      }

      setModalOpen(false);
      loadSections(selectedPeriod);
    } catch (err) {
      console.error('Error saving section:', err);
      alert(err.message || 'Error al guardar la sección');
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const executeDelete = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setConfirmDelete({ open: false, id: null });

    try {
      await api.delete(`/sections/${id}`);
      loadSections(selectedPeriod);
    } catch (err) {
      console.error('Error deleting section:', err);
      alert(err.message || 'Error al eliminar la sección');
    }
  };

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Gestión de secciones"
        title="Secciones académicas y cupos"
        subtitle="Cargando secciones..."
        metrics={[
          { label: 'Secciones activas', value: '...', hint: 'Cargando...', icon: Layers3, tone: 'primary' },
          { label: 'Cupos asignados', value: '...', hint: 'Cargando...', icon: Layers3, tone: 'info' }
        ]}
      >
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos desde el servidor...</span>
        </div>
      </AdminPageShell>
    );
  }

  // Count active sections and total quotas
  const activeCount = sections.length;
  const totalQuotas = sections.reduce((acc, s) => acc + s.quota_max, 0);

  const selectedPeriodObj = periods.find(p => String(p.id_period) === String(selectedPeriod));
  const isCulminado = selectedPeriodObj?.period_status === 'Culminado';

  return (
    <AdminPageShell
      eyebrow="Gestión de secciones"
      title="Secciones académicas y cupos"
      subtitle="El listado presenta cupos, horario y aula asignada con un estilo limpio para abrir nuevas secciones rápidamente."
      actions={
        <ActionButton variant="accent" onClick={handleNewSection} disabled={isCulminado}>
          <PlusSquare size={16} /> Abrir sección
        </ActionButton>
      }
      metrics={[
        { label: 'Secciones', value: activeCount.toString(), hint: `Aulas abiertas en el período seleccionado`, icon: Layers3, tone: 'primary' },
        { label: 'Cupos máximos', value: totalQuotas.toString(), hint: 'Matrícula total disponible', icon: Layers3, tone: 'info' }
      ]}
    >
      <SectionCard title="Filtros de secciones" description="Refina por período, materia, carrera o texto libre para ubicar el grupo correcto.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Período Académico</span>
            <CustomSelect
              value={selectedPeriod}
              onChange={(val) => setSelectedPeriod(String(val))}
              options={periods.map(p => ({ value: String(p.id_period), label: p.name_period }))}
            />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sección, materia o aula" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
            </div>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Materia</span>
            <CustomSelect
              value={subjectFilter}
              onChange={(value) => setSubjectFilter(value)}
              options={[
                { value: 'Todas', label: 'Todas' },
                ...subjects.map((sub) => ({ value: sub.id_subject, label: sub.name_subject }))
              ]}
            />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <CustomSelect
              value={careerFilter}
              onChange={(value) => setCareerFilter(value)}
              options={[
                { value: 'Todas', label: 'Todas' },
                ...careers.map((car) => ({ value: car.id_career, label: car.name_career }))
              ]}
            />
          </label>
        </div>
      </SectionCard>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px' }}>
        {visibleSections.map((section) => {
          const teacherUser = section.Teacher?.User;
          const teacherName = teacherUser ? `${teacherUser.first_name || ''} ${teacherUser.first_lastname || ''}`.trim() : 'Sin asignar';
          const careerName = section.Career?.name_career || 'General';

          return (
            <article key={section.id_section} style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge tone="success">{section.section_code}</StatusBadge>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{section.AcademicPeriod?.name_period}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>{section.Subject?.name_subject}</h3>
                  <p style={{ margin: 0, color: '#051124', fontSize: '0.88rem', fontWeight: 600 }}>{careerName}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.84rem' }}>Profesor: {teacherName}</p>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 17, 36, 0.08)', color: '#051124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers3 size={20} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <div><span style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Horario</span><strong style={{ display: 'block', fontSize: '0.88rem' }}>{section.schedule_info || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Aula</span><strong style={{ display: 'block', fontSize: '0.88rem' }}>{section.classroom || 'N/A'}</strong></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem', color: '#64748b' }}>
                  <span>Cupos Máximos</span>
                  <span>{section.quota_max}</span>
                </div>
                <ProgressBar value={100} tone="primary" />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
                <ActionButton variant="secondary" onClick={() => handleEditSection(section)} disabled={isCulminado}>Editar</ActionButton>
                <ActionButton variant="ghost" onClick={() => handleDelete(section.id_section)} disabled={isCulminado}>Cerrar sección</ActionButton>
              </div>
            </article>
          );
        })}
      </section>

      <Modal
        open={modalOpen}
        title={editingSection ? "Editar sección" : "Abrir nueva sección"}
        subtitle="El formulario respeta la identidad visual del panel para crear una sección sin saltos de diseño."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={handleSave}>Guardar sección</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Código de Sección</span>
            <CustomSelect
              value={form.section_code}
              onChange={value => setForm({...form, section_code: value})}
              options={[
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
                { value: 'D', label: 'D' },
                { value: 'E', label: 'E' },
                { value: 'F', label: 'F' }
              ]}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Materia</span>
            <CustomSelect
              value={form.id_subject}
              onChange={value => setForm({...form, id_subject: value})}
              options={subjects.map(s => ({ value: s.id_subject, label: s.name_subject }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Carrera</span>
            <CustomSelect
              value={form.id_career}
              onChange={value => setForm({...form, id_career: value})}
              options={careers.map(c => ({ value: c.id_career, label: c.name_career }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Periodo Académico</span>
            <CustomSelect
              value={form.id_period}
              onChange={value => setForm({...form, id_period: value})}
              options={periods.map(p => ({ value: p.id_period, label: p.name_period }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Docente</span>
            <CustomSelect
              value={form.id_teacher}
              onChange={value => setForm({...form, id_teacher: value})}
              options={teachers.map(t => ({
                value: t.id_teacher,
                label: t.User ? `${t.User.first_name || ''} ${t.User.first_lastname || ''}`.trim() : 'Docente sin nombre'
              }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Cupos Máximos</span>
            <input className="form-input" type="number" value={form.quota_max} onChange={e => setForm({...form, quota_max: e.target.value})} placeholder="Cupos máximos" />
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Horario</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <CustomSelect
                value={form.schedule_day}
                onChange={value => setForm({...form, schedule_day: value})}
                options={['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => ({ value: d, label: d }))}
              />
              <CustomSelect
                value={form.schedule_start}
                onChange={value => setForm({...form, schedule_start: value})}
                options={['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => ({ value: t, label: `Desde ${t}` }))}
              />
              <CustomSelect
                value={form.schedule_end}
                onChange={value => setForm({...form, schedule_end: value})}
                options={['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => ({ value: t, label: `Hasta ${t}` }))}
              />
            </div>
          </div>
          
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Aula</span>
            <CustomSelect
              value={form.classroom}
              onChange={value => setForm({...form, classroom: value})}
              options={[
                ...['Aula 01', 'Aula 02', 'Aula 03', 'Aula 04', 'Aula 05', 'Aula 06', 'Aula 07'].map(a => ({ value: a, label: a })),
                ...['Lab 01', 'Lab 02', 'Lab 03', 'Lab 04'].map(a => ({ value: a, label: a }))
              ]}
            />
          </label>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete.open}
        title="Cerrar / Eliminar sección"
        message="¿Está seguro de que desea cerrar/eliminar esta sección?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </AdminPageShell>
  );
}
