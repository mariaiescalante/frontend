import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, CirclePlus, Clock3, Trash2, Edit2 } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge, CustomSelect } from './AdminPageShell';
import api from '../../../services/api';

export default function AcademicPeriods() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name_period: '',
    start_date: '',
    end_date: '',
    enrollment_status: 'Cerrada',
    period_status: 'Planificacion',
  });

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.get('/periods');
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setPeriods(data);
      // Dispatch event to update navbar cycle badge
      window.dispatchEvent(new Event('academic-period-updated'));
    } catch (err) {
      console.error('Error fetching academic periods:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (period) => {
    setEditingId(period.id_period);
    setForm({
      name_period: period.name_period,
      start_date: period.start_date,
      end_date: period.end_date,
      enrollment_status: period.enrollment_status,
      period_status: period.period_status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name_period: '',
      start_date: '',
      end_date: '',
      enrollment_status: 'Cerrada',
      period_status: 'Planificacion',
    });
  };

  const handleSave = async () => {
    try {
      const { name_period, start_date, end_date, enrollment_status, period_status } = form;
      if (!name_period || !start_date || !end_date) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }
      setSubmitting(true);

      const payload = {
        name_period: name_period.trim(),
        start_date,
        end_date,
        enrollment_status,
        period_status,
      };

      if (editingId) {
        await api.put(`/periods/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post('/periods', payload);
      }

      setForm({
        name_period: '',
        start_date: '',
        end_date: '',
        enrollment_status: 'Cerrada',
        period_status: 'Planificacion',
      });
      await loadData();
    } catch (err) {
      console.error('Error saving period:', err);
      alert(err.response?.data?.message || err.message || 'Error al guardar el período académico');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Está seguro que desea eliminar el período "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/periods/${id}`);
      if (editingId === id) {
        setEditingId(null);
        setForm({
          name_period: '',
          start_date: '',
          end_date: '',
          enrollment_status: 'Cerrada',
          period_status: 'Planificacion',
        });
      }
      await loadData();
    } catch (err) {
      console.error('Error deleting period:', err);
      alert(err.response?.data?.message || err.message || 'Error al eliminar el período académico');
    }
  };

  // Metrics calculations
  const activePeriodName = useMemo(() => {
    const active = periods.find(p => p.period_status === 'Activo');
    return active ? active.name_period : (periods[0]?.name_period || 'Ninguno');
  }, [periods]);

  const activePeriodsCount = useMemo(() => {
    return periods.filter(p => p.period_status === 'Activo' || p.enrollment_status === 'Abierta').length;
  }, [periods]);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Gestión de períodos"
        title="Períodos académicos activos, pasados e históricos"
        subtitle="Cargando información..."
        metrics={[
          { label: 'Período actual', value: '...', hint: 'Cargando...', icon: CalendarDays, tone: 'warning' },
          { label: 'Historiales', value: '...', hint: 'Cargando...', icon: Clock3, tone: 'primary' },
          { label: 'Estados', value: '...', hint: 'Cargando...', icon: Clock3, tone: 'info' }
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
      eyebrow="Gestión de períodos"
      title="Períodos académicos activos, pasados e históricos"
      subtitle="Cada ciclo se presenta con su calendario y estado operativo para mantener clara la transición entre inscripciones, clases y cierre."
      metrics={[
        { label: 'Período actual', value: activePeriodName, hint: 'Periodo activo o más reciente', icon: CalendarDays, tone: 'warning' },
        { label: 'Historiales', value: `${periods.length}`, hint: 'Ciclos registrados en la base de datos', icon: Clock3, tone: 'primary' },
        { label: 'Estados', value: `${activePeriodsCount}`, hint: 'Ciclos activos o en inscripción', icon: Clock3, tone: 'info' }
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '18px', alignItems: 'start' }}>
        <SectionCard title="Línea de tiempo académica" description="La historia de períodos conserva el orden visual del módulo para lectura rápida.">
          {periods.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              No hay períodos académicos registrados. Utiliza el formulario de la derecha para crear uno.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {periods.map((period) => {
                const isPeriodActive = period.period_status === 'Activo';
                const isEnrollmentOpen = period.enrollment_status === 'Abierta';
                const isPeriodEnded = period.period_status === 'Culminado';
                
                const indicatorColor = isPeriodActive ? '#10b981' : isEnrollmentOpen ? '#ffd100' : isPeriodEnded ? '#94a3b8' : '#3b82f6';
                const badgeTone = isPeriodActive ? 'success' : isEnrollmentOpen ? 'warning' : isPeriodEnded ? 'neutral' : 'info';

                return (
                  <article key={period.id_period} style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
                    <div style={{ width: '12px', borderRadius: '999px', background: indicatorColor }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, paddingRight: '60px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{period.name_period}</h4>
                        <div className="period-badges-container">
                          <StatusBadge tone={badgeTone}>Periodo: {period.period_status}</StatusBadge>
                          <StatusBadge tone={isEnrollmentOpen ? 'warning' : 'neutral'}>Inscripción: {period.enrollment_status}</StatusBadge>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                        Calendario del ciclo académico registrado en base de datos.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: '#64748b', display: 'block' }}>Inicio</span><strong>{period.start_date}</strong></div>
                        <div><span style={{ color: '#64748b', display: 'block' }}>Fin</span><strong>{period.end_date}</strong></div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', right: '16px', top: '16px', display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleStartEdit(period)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Editar período"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(period.id_period, period.name_period)}
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
                        }}
                        title="Eliminar período"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={editingId ? 'Editar período' : 'Crear período'}
          description={editingId ? 'Modifica las fechas y estados operativos del ciclo académico.' : 'Formulario rápido para abrir una nueva ventana administrativa.'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Nombre del período</span>
              <input
                className="form-input"
                placeholder="Ej: 2027-I"
                value={form.name_period}
                onChange={(e) => setForm({ ...form, name_period: e.target.value })}
              />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Fecha inicio</span>
              <input
                className="form-input"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Fecha fin</span>
              <input
                className="form-input"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Estado de inscripción</span>
              <CustomSelect
                value={form.enrollment_status}
                onChange={(val) => setForm({ ...form, enrollment_status: String(val) })}
                options={[
                  { value: 'Planificacion', label: 'Planificación' },
                  { value: 'Abierta', label: 'Abierta' },
                  { value: 'Cerrada', label: 'Cerrada' },
                  { value: 'Modificaciones', label: 'Modificaciones' }
                ]}
              />
            </label>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Estado del período</span>
              <CustomSelect
                value={form.period_status}
                onChange={(val) => setForm({ ...form, period_status: String(val) })}
                options={[
                  { value: 'Planificacion', label: 'Planificación' },
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Culminado', label: 'Culminado' }
                ]}
              />
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              <ActionButton
                variant="accent"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Período'}
              </ActionButton>
              {editingId && (
                <ActionButton
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                >
                  Cancelar
                </ActionButton>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
