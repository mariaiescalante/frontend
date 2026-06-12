import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, PlusSquare, Search } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, ProgressBar, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
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

  const [form, setForm] = useState({
    id_period: '',
    id_subject: '',
    id_teacher: '',
    id_career: '',
    section_code: '',
    quota_max: 30,
    classroom: '',
    schedule_info: ''
  });

  async function loadData() {
    try {
      setLoading(true);
      const [secRes, carRes, subRes, teaRes, perRes] = await Promise.all([
        api.get('/sections'),
        api.get('/careers'),
        api.get('/subjects'),
        api.get('/teachers'),
        api.get('/periods')
      ]);

      setSections(Array.isArray(secRes.data) ? secRes.data : secRes);
      setCareers(Array.isArray(carRes.data) ? carRes.data : carRes);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : subRes);
      setTeachers(Array.isArray(teaRes.data) ? teaRes.data : teaRes);
      setPeriods(Array.isArray(perRes.data) ? perRes.data : perRes);
    } catch (err) {
      console.error('Error fetching data for sections management:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesSubject = subjectFilter === 'Todas' || String(section.id_subject) === subjectFilter;
      const matchesCareer = careerFilter === 'Todas' || String(section.id_career) === careerFilter;
      const sectionName = section.Subject?.name_subject || '';
      const matchesQuery = `${section.section_code} ${sectionName} ${section.classroom || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchesSubject && matchesCareer && matchesQuery;
    });
  }, [sections, subjectFilter, careerFilter, query]);

  const handleNewSection = () => {
    setEditingSection(null);
    setForm({
      id_period: periods[0]?.id_period || '',
      id_subject: subjects[0]?.id_subject || '',
      id_teacher: teachers[0]?.id_teacher || '',
      id_career: careers[0]?.id_career || '',
      section_code: '',
      quota_max: 30,
      classroom: '',
      schedule_info: ''
    });
    setModalOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setForm({
      id_period: section.id_period,
      id_subject: section.id_subject,
      id_teacher: section.id_teacher,
      id_career: section.id_career,
      section_code: section.section_code,
      quota_max: section.quota_max,
      classroom: section.classroom || '',
      schedule_info: section.schedule_info || ''
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
        classroom: form.classroom.trim() || null,
        schedule_info: form.schedule_info.trim() || null
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
      loadData();
    } catch (err) {
      console.error('Error saving section:', err);
      alert(err.message || 'Error al guardar la sección');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea cerrar/eliminar esta sección?')) return;
    try {
      await api.delete(`/sections/${id}`);
      loadData();
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

  return (
    <AdminPageShell
      eyebrow="Gestión de secciones"
      title="Secciones académicas y cupos"
      subtitle="El listado presenta cupos, horario y aula asignada con un estilo limpio para abrir nuevas secciones rápidamente."
      actions={<ActionButton variant="accent" onClick={handleNewSection}><PlusSquare size={16} /> Abrir sección</ActionButton>}
      metrics={[
        { label: 'Secciones activas', value: activeCount.toString(), hint: 'Aulas abiertas en el período actual', icon: Layers3, tone: 'primary' },
        { label: 'Cupos máximos', value: totalQuotas.toString(), hint: 'Matrícula total disponible', icon: Layers3, tone: 'info' }
      ]}
    >
      <SectionCard title="Filtros de secciones" description="Refina por materia, carrera o texto libre para ubicar el grupo correcto.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sección, materia o aula" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
            </div>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Materia</span>
            <select className="form-input" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              <option value="Todas">Todas</option>
              {subjects.map((sub) => <option key={sub.id_subject} value={sub.id_subject}>{sub.name_subject}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select className="form-input" value={careerFilter} onChange={(event) => setCareerFilter(event.target.value)}>
              <option value="Todas">Todas</option>
              {careers.map((car) => <option key={car.id_career} value={car.id_career}>{car.name_career}</option>)}
            </select>
          </label>
        </div>
      </SectionCard>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
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
                <ActionButton variant="secondary" onClick={() => handleEditSection(section)}>Editar</ActionButton>
                <ActionButton variant="ghost" onClick={() => handleDelete(section.id_section)}>Cerrar sección</ActionButton>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Código de Sección</span>
            <input className="form-input" value={form.section_code} onChange={e => setForm({...form, section_code: e.target.value})} placeholder="Código (ej: INF-A)" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Materia</span>
            <select className="form-input" value={form.id_subject} onChange={e => setForm({...form, id_subject: e.target.value})}>
              {subjects.map(s => <option key={s.id_subject} value={s.id_subject}>{s.name_subject}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Carrera</span>
            <select className="form-input" value={form.id_career} onChange={e => setForm({...form, id_career: e.target.value})}>
              {careers.map(c => <option key={c.id_career} value={c.id_career}>{c.name_career}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Periodo Académico</span>
            <select className="form-input" value={form.id_period} onChange={e => setForm({...form, id_period: e.target.value})}>
              {periods.map(p => <option key={p.id_period} value={p.id_period}>{p.name_period}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Docente</span>
            <select className="form-input" value={form.id_teacher} onChange={e => setForm({...form, id_teacher: e.target.value})}>
              {teachers.map(t => {
                const name = t.User ? `${t.User.first_name || ''} ${t.User.first_lastname || ''}`.trim() : 'Docente sin nombre';
                return <option key={t.id_teacher} value={t.id_teacher}>{name}</option>;
              })}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Cupos Máximos</span>
            <input className="form-input" type="number" value={form.quota_max} onChange={e => setForm({...form, quota_max: e.target.value})} placeholder="Cupos máximos" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Horario</span>
            <input className="form-input" value={form.schedule_info} onChange={e => setForm({...form, schedule_info: e.target.value})} placeholder="Horario (ej: Lun/Mie 08:00 - 10:00)" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Aula</span>
            <input className="form-input" value={form.classroom} onChange={e => setForm({...form, classroom: e.target.value})} placeholder="Aula (ej: Aula 04)" />
          </label>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
