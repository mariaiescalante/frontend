import React, { useEffect, useMemo, useState } from 'react';
import { Search, School, BookOpenCheck, Plus } from 'lucide-react';
import { AdminPageShell, ActionButton, Modal, SectionCard, StatusBadge, fieldStyle, ProgressBar, CustomSelect } from './AdminPageShell';
import api from '../../../services/api';

const decorateCareer = (c) => {
  const code = c.code_career || '';
  const name = c.name_career || '';
  
  let faculty = 'Tecnología';
  let head = 'Pendiente de asignación';
  let creditsRequired = 150;
  let subjects = 50;

  if (code.includes('SIS') || name.toLowerCase().includes('sistemas')) {
    faculty = 'Tecnología';
    head = 'Ing. Mariela Rivas';
    creditsRequired = 160;
    subjects = 58;
  } else if (code.includes('IND') || name.toLowerCase().includes('industrial')) {
    faculty = 'Ingeniería';
    head = 'Ing. Diego Pineda';
    creditsRequired = 162;
    subjects = 56;
  } else if (code.includes('ADM') || name.toLowerCase().includes('administración')) {
    faculty = 'Ciencias Económicas';
    head = 'MSc. Laura Méndez';
    creditsRequired = 150;
    subjects = 52;
  } else if (code.includes('MAT') || name.toLowerCase().includes('matemática')) {
    faculty = 'Ciencias Básicas';
    head = 'Dr. Sergio Arias';
    creditsRequired = 148;
    subjects = 49;
  }

  return {
    id: c.id_career,
    code: c.code_career,
    name: c.name_career,
    semesters: c.total_semesters,
    status: c.is_active ? 'Activa' : 'Inactiva',
    faculty,
    head,
    creditsRequired,
    subjects
  };
};

export default function CareersManagement() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [form, setForm] = useState({
    code_career: '',
    name_career: '',
    total_semesters: 10,
    is_active: true
  });

  async function loadCareers() {
    try {
      setLoading(true);
      const res = await api.get('/careers');
      const rawCareers = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const decorated = rawCareers.map(decorateCareer);
      setCareers(decorated);
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCareers();
  }, []);

  const visibleCareers = useMemo(() => {
    return careers.filter((career) => 
      `${career.code} ${career.name} ${career.faculty}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [careers, query]);

  const handleNewCareer = () => {
    setEditingCareer(null);
    setForm({
      code_career: '',
      name_career: '',
      total_semesters: 10,
      is_active: true
    });
    setModalOpen(true);
  };

  const handleEditCareer = (career) => {
    setEditingCareer(career);
    setForm({
      code_career: career.code,
      name_career: career.name,
      total_semesters: career.semesters,
      is_active: career.status === 'Activa'
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        code_career: form.code_career.trim(),
        name_career: form.name_career.trim(),
        total_semesters: Number(form.total_semesters),
        is_active: form.is_active
      };

      if (!payload.code_career || !payload.name_career || !payload.total_semesters) {
        alert('Por favor complete todos los campos.');
        return;
      }

      if (editingCareer) {
        await api.put(`/careers/${editingCareer.id}`, payload);
      } else {
        await api.post('/careers', payload);
      }

      setModalOpen(false);
      loadCareers();
    } catch (err) {
      console.error('Error saving career:', err);
      alert(err.message || 'Error al guardar la carrera');
    }
  };

  const activeCount = careers.filter(c => c.status === 'Activa').length;
  const avgCredits = careers.length > 0 
    ? Math.round(careers.reduce((acc, c) => acc + c.creditsRequired, 0) / careers.length)
    : 150;
  const updatesCount = careers.filter(c => c.status !== 'Activa').length;

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Gestión de carreras"
        title="Carreras"
        subtitle="Cargando el catálogo académico..."
        metrics={[
          { label: 'Carreras activas', value: '...', hint: 'Cargando...', icon: School, tone: 'primary' },
          { label: 'Créditos promedio', value: '...', hint: 'Cargando...', icon: BookOpenCheck, tone: 'info' },
          { label: 'Inactivas', value: '...', hint: 'Cargando...', icon: BookOpenCheck, tone: 'warning' }
        ]}
      >
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando carreras desde el servidor...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Gestión de carreras"
      title="Carreras con identidad visual uniforme"
      subtitle="Catálogo académico con buscador, métricas y tarjetas claras para editar la oferta sin perder la coherencia del panel."
      actions={
        <ActionButton variant="accent" onClick={handleNewCareer}>
          <Plus size={16} /> Nueva carrera
        </ActionButton>
      }
      metrics={[
        { label: 'Carreras activas', value: activeCount.toString(), hint: `${careers.length} programas totales`, icon: School, tone: 'primary' },
        { label: 'Créditos promedio', value: avgCredits.toString(), hint: 'Base de malla común por programa', icon: BookOpenCheck, tone: 'info' },
        { label: 'Inactivas', value: updatesCount.toString(), hint: 'Programas en ajuste curricular', icon: BookOpenCheck, tone: 'warning' }
      ]}
    >
      <SectionCard title="Buscador de carreras" description="Filtra por código, nombre o facultad para ubicar un programa académico con rapidez.">
        <div style={{ maxWidth: '420px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar carrera" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
          </div>
        </div>
      </SectionCard>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '18px' }}>
        {visibleCareers.map((career) => (
          <article key={career.code} className="glass-panel" style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <StatusBadge tone={career.status === 'Activa' ? 'success' : 'warning'}>{career.status}</StatusBadge>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{career.name}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{career.faculty}</p>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(5, 17, 36, 0.08)', color: '#051124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={20} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Código</span>
                <strong style={{ color: '#0f172a' }}>{career.code}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Director</span>
                <strong style={{ color: '#0f172a' }}>{career.head}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Créditos</p>
                <strong>{career.creditsRequired}</strong>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Semestres</p>
                <strong>{career.semesters}</strong>
              </div>
              <div>
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Materias</p>
                <strong>{career.subjects}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Avance del programa</span>
              <ProgressBar value={Math.min(100, career.subjects * 1.4)} tone={career.status === 'Activa' ? 'primary' : 'warning'} />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton variant="secondary" onClick={() => handleEditCareer(career)}>Editar</ActionButton>
              <ActionButton variant="ghost">Ver pensum</ActionButton>
            </div>
          </article>
        ))}
      </section>

      <Modal
        open={modalOpen}
        title={editingCareer ? 'Editar carrera' : 'Crear carrera'}
        subtitle="Completa los campos para actualizar la oferta académica del sistema."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={handleSave}>Guardar carrera</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Código de la Carrera</span>
            <input className="form-input" value={form.code_career} onChange={e => setForm({...form, code_career: e.target.value})} placeholder="Código (ej: ING-SIS)" disabled={!!editingCareer} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Nombre</span>
            <input className="form-input" value={form.name_career} onChange={e => setForm({...form, name_career: e.target.value})} placeholder="Nombre (ej: Ingeniería en Sistemas)" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Semestres</span>
            <input className="form-input" type="number" value={form.total_semesters} onChange={e => setForm({...form, total_semesters: e.target.value})} placeholder="Cantidad de Semestres" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Estado</span>
            <CustomSelect
              value={form.is_active ? 'true' : 'false'}
              onChange={value => setForm({...form, is_active: value === 'true'})}
              options={[
                { value: 'true', label: 'Activa' },
                { value: 'false', label: 'Inactiva' }
              ]}
            />
          </label>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
