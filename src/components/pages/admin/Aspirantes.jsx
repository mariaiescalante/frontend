import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Users, UserCheck, CheckCircle2, XCircle, AlertCircle, Trash2, Calendar, FileText, MapPin, Eye, Info } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge, fieldStyle, CustomSelect, Pagination } from './AdminPageShell';
import api from '../../../services/api';

export default function Aspirantes() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Tracks which specific action button is loading: 'revision' | 'reject' | 'approve' | 'delete' | null
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [resApproved, resPending, resRejected] = await Promise.all([
        api.get('/pre-registrations?limit=1&status_pre=Aprobado'),
        api.get('/pre-registrations?limit=1&status_pre=Pendiente'),
        api.get('/pre-registrations?limit=1&status_pre=Rechazado')
      ]);
      setStats({
        approved: resApproved?.meta?.totalItems || resApproved?.data?.meta?.totalItems || 0,
        pending: resPending?.meta?.totalItems || resPending?.data?.meta?.totalItems || 0,
        rejected: resRejected?.meta?.totalItems || resRejected?.data?.meta?.totalItems || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status_pre: statusFilter !== 'Todos' ? statusFilter : '',
        search: query || ''
      });
      const response = await api.get(`/pre-registrations?${params.toString()}`);
      if (response?.data && response?.meta) {
        setApplicants(response.data);
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.totalItems);
      } else {
        const items = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : (response?.items ?? []));
        setApplicants(items);
        setTotalPages(1);
        setTotalItems(items.length);
      }
    } catch (err) {
      console.error(err);
      setError('No fue posible cargar la lista de aspirantes de la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, query]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchApplicants();
    }, 300);
    return () => clearTimeout(timerId);
  }, [fetchApplicants]);

  const filteredApplicants = applicants;

  // Metric computations (just using totalItems since backend does pagination)
  const metrics = useMemo(() => {
    return [
      { label: 'Total Aspirantes', value: String(totalItems), hint: 'Resultados encontrados', icon: Users, tone: 'primary' },
      { label: 'Aprobados', value: String(stats.approved), hint: 'Admitidos', icon: CheckCircle2, tone: 'success' },
      { label: 'Pendientes', value: String(stats.pending), hint: 'Por revisar', icon: AlertCircle, tone: 'warning' },
      { label: 'Rechazados', value: String(stats.rejected), hint: 'No admitidos', icon: XCircle, tone: 'danger' }
    ];
  }, [totalItems, stats]);

  const handleViewDetails = (applicant) => {
    setSelectedApplicant(applicant);
    setActionError('');
    setActionSuccess('');
    setModalOpen(true);
  };

  const getApplicantCode = (applicant) => applicant?.verification_code || `PR-${String(applicant?.id_pre || '').padStart(6, '0')}`;

  const handleUpdateStatus = useCallback(async (id, newStatus, actionKey) => {
    setActionLoading(actionKey);
    setActionError('');
    setActionSuccess('');
    try {
      const response = await api.put(`/pre-registrations/${id}`, { status_pre: newStatus });
      const updatedItem = response?.data ?? response;

      // Update local state
      setApplicants(prev => prev.map(a => a.id_pre === id ? { ...a, ...updatedItem } : a));

      // Update selected applicant details view
      if (selectedApplicant && selectedApplicant.id_pre === id) {
        setSelectedApplicant(prev => ({ ...prev, ...updatedItem }));
      }

      fetchStats();

      setActionSuccess(`El estado ha sido cambiado a "${newStatus}" correctamente.`);

      setTimeout(() => {
        setActionSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setActionError(err.message || 'Error al actualizar el estado del aspirante.');
    } finally {
      setActionLoading(null);
    }
  }, [selectedApplicant]);

  const handleDeleteApplicant = useCallback(async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas marcar este pre-registro como eliminado? Se ocultará del listado, pero se conservará en la base de datos.')) {
      return;
    }

    setActionLoading('delete');
    try {
      await api.delete(`/pre-registrations/${id}`);
      setApplicants(prev => prev.filter(a => a.id_pre !== id));
      if (selectedApplicant && selectedApplicant.id_pre === id) {
        setModalOpen(false);
        setSelectedApplicant(null);
      }
      fetchStats();
    } catch (err) {
      console.error(err);
      setActionError(err.message || 'Error al eliminar el aspirante.');
    } finally {
      setActionLoading(null);
    }
  }, [selectedApplicant]);

  // Inline spinner SVG component
  const Spinner = ({ size = 14, color = 'currentColor' }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'aspirantes-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes aspirantes-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );

  const isAnyLoading = actionLoading !== null;

  return (
    <AdminPageShell
      eyebrow="Gestión de Admisiones"
      title="Control de Aspirantes"
      subtitle="Recibe, verifica y aprueba la información enviada desde el formulario de pre-registro de admisiones."
      metrics={metrics}
    >
      <SectionCard 
        title="Búsqueda y filtros de aspirantes" 
        description="Filtra por cédula, nombre, correo o carrera para encontrar perfiles específicos."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input 
                value={query} 
                onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} 
                placeholder="Nombre, cédula, correo o carrera..." 
                style={{ ...fieldStyle, minHeight: '44px', paddingLeft: '42px' }} 
              />
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado de preinscripción</span>
            <CustomSelect 
              value={statusFilter} 
              onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} 
              options={[
                { value: 'Todos', label: 'Todos los estados' },
                { value: 'Pendiente', label: 'Pendiente' },
                { value: 'En Revisión', label: 'En Revisión' },
                { value: 'Aprobado', label: 'Aprobado' },
                { value: 'Rechazado', label: 'Rechazado' }
              ]}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard 
        title="Listado de aspirantes recibidos" 
        description={`Se encontraron ${filteredApplicants.length} aspirante(s) en la base de datos.`}
        actions={
          <ActionButton variant="secondary" onClick={fetchApplicants} disabled={loading}>
            Actualizar Lista
          </ActionButton>
        }
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Cargando información de los aspirantes...
          </div>
        ) : error ? (
          <div style={{ padding: '30px', borderRadius: '12px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', textAlign: 'center' }}>
            {error}
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            No se encontraron pre-registros que coincidan con la búsqueda.
          </div>
        ) : (
          <DataTable columns={['Código', 'Cédula', 'Aspirante', 'Carrera', 'Modalidad', 'Estado', 'Fecha', 'Acciones']}>
            {filteredApplicants.map((app) => {
              const fullName = `${app.first_name} ${app.first_lastname}`;
              const docText = `${app.document_type}-${app.document_id}`;
              const statusText = app.status_pre || 'Pendiente';
              const statusTone = 
                statusText === 'Aprobado' ? 'success' : 
                statusText === 'En Revisión' ? 'info' : 
                statusText === 'Rechazado' ? 'danger' : 'warning';
              
              const dateText = app.created_at 
                ? new Date(app.created_at).toLocaleDateString('es-VE') 
                : 'N/D';

              return (
                <tr key={app.id_pre}>
                  <td><strong>{getApplicantCode(app)}</strong></td>
                  <td><strong>{docText}</strong></td>
                  <td>{fullName}</td>
                  <td>{app.Career?.name_career || `ID: ${app.id_career}`}</td>
                  <td>{app.entry_mode}</td>
                  <td><StatusBadge tone={statusTone}>{statusText}</StatusBadge></td>
                  <td>{dateText}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <ActionButton variant="secondary" onClick={() => handleViewDetails(app)} style={{ padding: '6px 12px' }}>
                        <Eye size={14} /> Detalles
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => handleDeleteApplicant(app.id_pre)}
                        disabled={isAnyLoading}
                        style={{ padding: '6px 12px' }}
                      >
                        {actionLoading === 'delete' ? <Spinner size={14} color="#b91c1c" /> : <Trash2 size={14} />}
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </SectionCard>

      {/* Detail view Modal */}
      {selectedApplicant && (
        <Modal
          open={modalOpen}
          title={`Ficha de Aspirante: ${selectedApplicant.first_name} ${selectedApplicant.first_lastname}`}
          subtitle={`Código ${getApplicantCode(selectedApplicant)} · Estado: ${selectedApplicant.status_pre || 'Pendiente'}`}
          onClose={() => setModalOpen(false)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <ActionButton
                  variant="danger"
                  onClick={() => handleDeleteApplicant(selectedApplicant.id_pre)}
                  disabled={isAnyLoading}
                  style={{ opacity: isAnyLoading && actionLoading !== 'delete' ? 0.5 : 1 }}
                >
                  {actionLoading === 'delete' ? (
                    <><Spinner size={15} color="#b91c1c" /> Eliminando...</>
                  ) : (
                    <><Trash2 size={16} /> Eliminar Aspirante</>
                  )}
                </ActionButton>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionButton variant="ghost" onClick={() => setModalOpen(false)} disabled={isAnyLoading}>
                  Cerrar
                </ActionButton>
                {selectedApplicant.status_pre !== 'En Revisión' && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => handleUpdateStatus(selectedApplicant.id_pre, 'En Revisión', 'revision')}
                    disabled={isAnyLoading}
                    style={{ opacity: isAnyLoading && actionLoading !== 'revision' ? 0.5 : 1, flex: '1 1 auto', textAlign: 'center', justifyContent: 'center' }}
                  >
                    {actionLoading === 'revision' ? (
                      <><Spinner size={14} /> Procesando...</>
                    ) : (
                      'Poner En Revisión'
                    )}
                  </ActionButton>
                )}
                {selectedApplicant.status_pre !== 'Rechazado' && (
                  <ActionButton
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedApplicant.id_pre, 'Rechazado', 'reject')}
                    disabled={isAnyLoading}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      color: '#dc2626',
                      opacity: isAnyLoading && actionLoading !== 'reject' ? 0.5 : 1,
                      flex: '1 1 auto',
                      textAlign: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {actionLoading === 'reject' ? (
                      <><Spinner size={14} color="#dc2626" /> Procesando...</>
                    ) : (
                      'Rechazar'
                    )}
                  </ActionButton>
                )}
                {selectedApplicant.status_pre !== 'Aprobado' && (
                  <ActionButton
                    variant="accent"
                    onClick={() => handleUpdateStatus(selectedApplicant.id_pre, 'Aprobado', 'approve')}
                    disabled={isAnyLoading}
                    style={{ opacity: isAnyLoading && actionLoading !== 'approve' ? 0.5 : 1, flex: '1 1 auto', textAlign: 'center', justifyContent: 'center' }}
                  >
                    {actionLoading === 'approve' ? (
                      <><Spinner size={14} color="#051124" /> Aprobando...</>
                    ) : (
                      'Aprobar Aspirante'
                    )}
                  </ActionButton>
                )}
              </div>
            </div>
          }
        >
          {actionError && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', fontWeight: 600 }}>
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600 }}>
              {actionSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
            
            {/* COLUMN 1: Personal & Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', wordBreak: 'break-word' }}>
                <h4 style={{ margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <Users size={18} style={{ color: '#0b5ed7' }} /> Datos Personales
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Código de pre-registro</span>
                    <strong style={{ color: '#0f172a' }}>{getApplicantCode(selectedApplicant)}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Nombre Completo</span>
                    <strong style={{ color: '#0f172a' }}>
                      {selectedApplicant.first_name} {selectedApplicant.second_name || ''} {selectedApplicant.first_lastname} {selectedApplicant.second_lastname || ''}
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Documento</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.document_type}-{selectedApplicant.document_id}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Nacionalidad</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.nationality}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Fecha de Nacimiento</span>
                    <strong style={{ color: '#0f172a' }}>{selectedApplicant.birth_date}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Correo Electrónico</span>
                    <strong style={{ color: '#0f172a' }}>{selectedApplicant.email}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Teléfono</span>
                    <strong style={{ color: '#0f172a' }}>{selectedApplicant.phone}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', wordBreak: 'break-word' }}>
                <h4 style={{ margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <MapPin size={18} style={{ color: '#0b5ed7' }} /> Dirección y Residencia
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Estado</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.State?.name_state || `ID: ${selectedApplicant.id_state}`}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Municipio</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.Municipality?.name_municipality || `ID: ${selectedApplicant.id_municipality}`}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Parroquia o Sector</span>
                    <strong style={{ color: '#0f172a' }}>{selectedApplicant.Parish?.name_parish || `ID: ${selectedApplicant.id_parish}`}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Dirección Completa</span>
                    <span style={{ color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.4 }}>{selectedApplicant.full_address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Academic Profile & Obs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', wordBreak: 'break-word' }}>
                <h4 style={{ margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <Calendar size={18} style={{ color: '#0b5ed7' }} /> Perfil Académico Solicitado
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Carrera de Interés</span>
                    <strong style={{ color: '#051124', fontSize: '1.05rem' }}>{selectedApplicant.Career?.name_career || `ID: ${selectedApplicant.id_career}`}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Modalidad Ingreso</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.entry_mode}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Semestre Solicitado</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.Semester?.number_semester || '1'}</strong>
                    </div>
                  </div>
                  {selectedApplicant.academic_area && (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Área de Interés / PNF</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.academic_area}</strong>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Institución de Procedencia</span>
                    <strong style={{ color: '#0f172a' }}>{selectedApplicant.inst_procedencia || 'No declarada'}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Tipo de Plantel</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.inst_type || 'N/D'}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Año de Egreso</span>
                      <strong style={{ color: '#0f172a' }}>{selectedApplicant.grad_year || 'N/D'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', wordBreak: 'break-word' }}>
                <h4 style={{ margin: '0 0 14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <FileText size={18} style={{ color: '#0b5ed7' }} /> Observaciones y Declaraciones
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Observaciones / Documentación Cargada</span>
                    <div style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.88rem', 
                      color: '#334155', 
                      background: '#ffffff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '8px', 
                      padding: '10px',
                      maxHeight: '140px',
                      overflowY: 'auto'
                    }}>
                      {selectedApplicant.observations || 'Sin observaciones registradas.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedApplicant.confirmo_info ? '#22c55e' : '#cbd5e1' }} />
                      <span>Información confirmada como verdadera y verificable</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedApplicant.autorizo_datos ? '#22c55e' : '#cbd5e1' }} />
                      <span>Uso de datos autorizado para fines académicos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Modal>
      )}
    </AdminPageShell>
  );
}
