import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  DoorOpen,
  Plus,
  Search,
  Building2,
  Users,
  Calendar,
  Layers,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import {
  AdminPageShell,
  ActionButton,
  Modal,
  SectionCard,
  StatusBadge,
  fieldStyle,
  ProgressBar,
  CustomSelect,
  ConfirmDialog
} from './AdminPageShell';
import api from '../../../services/api';

const CLASSROOM_TYPES = ['Teoría', 'Laboratorio', 'Taller', 'Auditorio'];
const CLASSROOM_STATUSES = ['Disponible', 'Mantenimiento', 'Inhabilitada'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIME_SLOTS = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00'
];

export default function ClassroomsManagement() {
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtros
  const [query, setQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });

  // Modal de horario / ocupación
  const [scheduleModal, setScheduleModal] = useState({
    open: false,
    classroom: null,
    sections: [],
    loading: false
  });

  const [form, setForm] = useState({
    code_classroom: '',
    name_classroom: '',
    building: 'Edificio Central',
    floor: 'Planta Baja',
    capacity: 35,
    classroom_type: 'Teoría',
    status: 'Disponible',
    resources: '',
    notes: ''
  });

  // Cargar Aulas y Períodos
  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      let classList = [];
      try {
        const classRes = await api.get('/classrooms');
        classList = Array.isArray(classRes.data) ? classRes.data : (Array.isArray(classRes) ? classRes : []);
      } catch (cErr) {
        console.warn('Endpoint /classrooms aún no disponible en el servidor remoto:', cErr?.message);
      }
      setClassrooms(classList);

      try {
        const perRes = await api.get('/periods');
        const perList = Array.isArray(perRes.data) ? perRes.data : (Array.isArray(perRes) ? perRes : []);
        setPeriods(perList);
        if (!selectedPeriod && perList.length > 0) {
          const active = perList.find(p => p.period_status === 'Activo') || perList[0];
          setSelectedPeriod(String(active.id_period));
        }
      } catch (pErr) {
        console.warn('Error cargando períodos:', pErr?.message);
      }
    } catch (err) {
      console.error('Error cargando aulas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  // Lista de edificios únicos para el filtro
  const buildings = useMemo(() => {
    const list = Array.from(new Set(classrooms.map(c => c.building).filter(Boolean)));
    return ['Todos', ...list];
  }, [classrooms]);

  // Filtrado de aulas
  const visibleClassrooms = useMemo(() => {
    return classrooms.filter(item => {
      const matchesBuilding = buildingFilter === 'Todos' || item.building === buildingFilter;
      const matchesType = typeFilter === 'Todos' || item.classroom_type === typeFilter;
      const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
      const matchesQuery = !query.trim() ||
        `${item.code_classroom} ${item.name_classroom} ${item.building} ${item.resources || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());

      return matchesBuilding && matchesType && matchesStatus && matchesQuery;
    });
  }, [classrooms, buildingFilter, typeFilter, statusFilter, query]);

  // Métricas
  const stats = useMemo(() => {
    const total = classrooms.length;
    const available = classrooms.filter(c => c.status === 'Disponible').length;
    const labs = classrooms.filter(c => c.classroom_type === 'Laboratorio' || c.classroom_type === 'Taller').length;
    const totalCapacity = classrooms.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
    return { total, available, labs, totalCapacity };
  }, [classrooms]);

  // Abrir modal nueva aula
  const handleNewClassroom = () => {
    setEditingClassroom(null);
    setForm({
      code_classroom: '',
      name_classroom: '',
      building: 'Edificio Central',
      floor: 'Planta Baja',
      capacity: 35,
      classroom_type: 'Teoría',
      status: 'Disponible',
      resources: 'Pizarra acrílica, pupitres, A/C',
      notes: ''
    });
    setModalOpen(true);
  };

  // Abrir modal editar aula
  const handleEditClassroom = (item) => {
    setEditingClassroom(item);
    setForm({
      code_classroom: item.code_classroom,
      name_classroom: item.name_classroom,
      building: item.building || 'Edificio Central',
      floor: item.floor || 'Planta Baja',
      capacity: item.capacity || 30,
      classroom_type: item.classroom_type || 'Teoría',
      status: item.status || 'Disponible',
      resources: item.resources || '',
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  // Guardar aula (crear o editar)
  const handleSave = async () => {
    if (!form.code_classroom.trim() || !form.name_classroom.trim()) {
      alert('El código y el nombre del aula son obligatorios.');
      return;
    }

    try {
      if (editingClassroom) {
        await api.put(`/classrooms/${editingClassroom.id_classroom}`, form);
      } else {
        await api.post('/classrooms', form);
      }
      setModalOpen(false);
      loadClassrooms();
    } catch (err) {
      alert(err.message || 'Error al guardar el aula');
    }
  };

  // Confirmar eliminación
  const handleDelete = (item) => {
    setConfirmDelete({ open: true, id: item.id_classroom, name: item.name_classroom });
  };

  const executeDelete = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    setConfirmDelete({ open: false, id: null, name: '' });
    try {
      await api.delete(`/classrooms/${id}`);
      loadClassrooms();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el aula');
    }
  };

  // Ver horario / ocupación semanal
  const handleViewSchedule = async (classroom) => {
    setScheduleModal({
      open: true,
      classroom,
      sections: [],
      loading: true
    });

    try {
      const periodParam = selectedPeriod ? `?id_period=${selectedPeriod}` : '';
      const res = await api.get(`/classrooms/${classroom.id_classroom}/schedule${periodParam}`);
      const data = res.data || res;
      setScheduleModal(prev => ({
        ...prev,
        sections: data.sections || [],
        loading: false
      }));
    } catch (err) {
      console.error('Error cargando horario de aula:', err);
      setScheduleModal(prev => ({ ...prev, loading: false }));
    }
  };

  const statusToneMap = {
    Disponible: 'success',
    Mantenimiento: 'warning',
    Inhabilitada: 'danger'
  };

  const typeToneMap = {
    Teoría: 'info',
    Laboratorio: 'warning',
    Taller: 'neutral',
    Auditorio: 'primary'
  };

  return (
    <AdminPageShell
      title="Gestión de Aulas y Espacios"
      subtitle="Administra los espacios físicos universitarios, controla su capacidad, tipo de recinto y supervisa los horarios de ocupación semanal."
      actions={
        <ActionButton variant="accent" onClick={handleNewClassroom}>
          <Plus size={16} /> Nueva Aula
        </ActionButton>
      }
    >
      {/* 1. Tarjetas de Métricas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(5, 17, 36, 0.08)', color: '#051124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DoorOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Espacios</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.12)', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Aulas Disponibles</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', lineHeight: 1.2 }}>{stats.available}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255, 209, 0, 0.2)', color: '#7c5a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Laboratorios y Talleres</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.labs}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Capacidad Instalada</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{stats.totalCapacity} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>puestos</span></div>
          </div>
        </div>
      </section>

      {/* 2. Filtros y Búsqueda */}
      <SectionCard style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Buscar aula o espacio</span>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="form-input"
                style={{ ...fieldStyle, paddingLeft: '40px' }}
                type="text"
                placeholder="Código, nombre o recurso..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Edificio / Módulo</span>
            <CustomSelect
              value={buildingFilter}
              onChange={setBuildingFilter}
              options={buildings.map(b => ({ value: b, label: b }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Tipo de Espacio</span>
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={['Todos', ...CLASSROOM_TYPES].map(t => ({ value: t, label: t }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Estado</span>
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={['Todos', ...CLASSROOM_STATUSES].map(s => ({ value: s, label: s }))}
            />
          </label>
        </div>
      </SectionCard>

      {/* 3. Catálogo de Aulas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #dbe4f0', borderTopColor: '#051124', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Cargando inventario de aulas...</p>
        </div>
      ) : visibleClassrooms.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #dbe4f0', borderRadius: '18px', padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <DoorOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>No se encontraron aulas</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Ajusta los filtros de búsqueda o agrega un nuevo espacio físico.</p>
        </div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {visibleClassrooms.map((item) => (
            <article
              key={item.id_classroom}
              style={{
                background: '#ffffff',
                border: '1px solid #dbe4f0',
                borderRadius: '18px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <StatusBadge tone="primary">{item.code_classroom}</StatusBadge>
                    <StatusBadge tone={statusToneMap[item.status] || 'neutral'}>{item.status}</StatusBadge>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{item.name_classroom}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                    <Building2 size={15} />
                    <span>{item.building} • {item.floor || 'PB'}</span>
                  </div>
                </div>
                <StatusBadge tone={typeToneMap[item.classroom_type] || 'neutral'}>{item.classroom_type}</StatusBadge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, display: 'block' }}>Capacidad</span>
                  <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{item.capacity} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>estudiantes</span></strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, display: 'block' }}>Régimen</span>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>Presencial</strong>
                </div>
              </div>

              {item.resources && (
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Equipamiento / Recursos</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {item.resources.split(',').map((res, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.78rem',
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {res.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <ActionButton
                  variant="secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleViewSchedule(item)}
                >
                  <Calendar size={15} /> Ver Ocupación
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => handleEditClassroom(item)}>
                  Editar
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => handleDelete(item)}>
                  Eliminar
                </ActionButton>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* 4. Modal: Crear / Editar Aula */}
      <Modal
        open={modalOpen}
        title={editingClassroom ? 'Editar Aula / Espacio' : 'Registrar Nueva Aula'}
        subtitle="Completa los datos del espacio físico para incorporarlo a la planificación académica."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={handleSave}>Guardar Espacio</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Código del Aula *</span>
            <input
              className="form-input"
              style={fieldStyle}
              type="text"
              placeholder="Ej: AULA-08, LAB-05"
              value={form.code_classroom}
              onChange={(e) => setForm({ ...form, code_classroom: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Nombre Descriptivo *</span>
            <input
              className="form-input"
              style={fieldStyle}
              type="text"
              placeholder="Ej: Aula 08 - Audiovisual"
              value={form.name_classroom}
              onChange={(e) => setForm({ ...form, name_classroom: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Edificio / Módulo</span>
            <input
              className="form-input"
              style={fieldStyle}
              type="text"
              placeholder="Ej: Edificio Central"
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Piso / Nivel</span>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm({ ...form, floor: val })}
              options={['Planta Baja', 'Piso 1', 'Piso 2', 'Piso 3', 'Sótano'].map(p => ({ value: p, label: p }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Capacidad Máxima (Estudiantes)</span>
            <input
              className="form-input"
              style={fieldStyle}
              type="number"
              min="1"
              max="500"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Tipo de Espacio</span>
            <CustomSelect
              value={form.classroom_type}
              onChange={(val) => setForm({ ...form, classroom_type: val })}
              options={CLASSROOM_TYPES.map(t => ({ value: t, label: t }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Estado Operativo</span>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm({ ...form, status: val })}
              options={[
                { value: 'Disponible', label: 'Disponible (Habilitada para clases)' },
                { value: 'Mantenimiento', label: 'En Mantenimiento (Temporalmente fuera de servicio)' },
                { value: 'Inhabilitada', label: 'Inhabilitada (No asignar)' }
              ]}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Recursos y Equipamiento (separados por coma)</span>
            <input
              className="form-input"
              style={fieldStyle}
              type="text"
              placeholder="Ej: Pizarra acrílica, 30 computadoras, Video beam, A/C"
              value={form.resources}
              onChange={(e) => setForm({ ...form, resources: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Notas adicionales (opcional)</span>
            <textarea
              className="form-input"
              style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }}
              placeholder="Observaciones de acceso, llaves de laboratorio, etc."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
      </Modal>

      {/* 5. Modal: Matriz de Ocupación Horaria */}
      <Modal
        open={scheduleModal.open}
        title={`Matriz de Ocupación: ${scheduleModal.classroom?.name_classroom || 'Aula'}`}
        subtitle={`Consulta las secciones académicas asignadas y los bloques libres en ${scheduleModal.classroom?.building || 'el campus'}.`}
        onClose={() => setScheduleModal({ open: false, classroom: null, sections: [], loading: false })}
        footer={
          <ActionButton variant="secondary" onClick={() => setScheduleModal({ open: false, classroom: null, sections: [], loading: false })}>
            Cerrar Ventana
          </ActionButton>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Período Seleccionado:</span>
              <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>
                {periods.find(p => String(p.id_period) === String(selectedPeriod))?.name_period || 'Período Activo'}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <StatusBadge tone="primary">{scheduleModal.sections.length} Secciones Asignadas</StatusBadge>
              <StatusBadge tone={statusToneMap[scheduleModal.classroom?.status] || 'neutral'}>{scheduleModal.classroom?.status}</StatusBadge>
            </div>
          </div>

          {scheduleModal.loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #dbe4f0', borderTopColor: '#051124', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Cargando programación del aula...</p>
            </div>
          ) : scheduleModal.sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '14px', border: '1px dashed rgba(34, 197, 94, 0.3)' }}>
              <CheckCircle2 size={36} style={{ color: '#16a34a', marginBottom: '8px' }} />
              <h4 style={{ margin: 0, color: '#15803d', fontSize: '1.05rem' }}>Aula 100% Disponible</h4>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                No hay secciones programadas en este espacio para el período seleccionado.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                Clases Programadas en este Espacio
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                {scheduleModal.sections.map((sec) => {
                  const teacher = sec.Teacher?.User
                    ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}`
                    : 'Docente no asignado';

                  return (
                    <div
                      key={sec.id_section}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StatusBadge tone="success">Sección {sec.section_code}</StatusBadge>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {sec.schedule_info}
                        </span>
                      </div>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{sec.Subject?.name_subject}</strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Prof. {teacher}</span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Cupos: {sec.quota_max} estudiantes</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 6. Confirmación de Eliminación */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Eliminar Espacio Físico"
        message={`¿Estás seguro de que deseas eliminar permanentemente el aula "${confirmDelete.name}"? Esta acción solo se permite si no tiene secciones asignadas.`}
        confirmText="Eliminar Aula"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: '' })}
      />
    </AdminPageShell>
  );
}
