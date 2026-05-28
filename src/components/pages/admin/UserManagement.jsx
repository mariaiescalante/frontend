import React, { useMemo, useRef, useState } from 'react';
import { Search, Users, UserPlus, Edit3, Trash2 } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
import { careerCatalog, teachersCatalog, studentsCatalog } from './adminSeedData';

const initialForm = {
  id: '',
  name: '',
  lastname: '',
  email: '',
  role: 'Estudiante',
  assignment: ''
};

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('students');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const idRef = useRef(null);
  const nameRef = useRef(null);
  const lastnameRef = useRef(null);
  const emailRef = useRef(null);
  const roleRef = useRef(null);
  const assignmentRef = useRef(null);

  const records = activeTab === 'students' ? studentsCatalog : teachersCatalog;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const values = Object.values(record).join(' ').toLowerCase();
      const matchesQuery = values.includes(query.toLowerCase());
      const statusValue = record.status || 'Disponible';
      const matchesStatus = statusFilter === 'Todos' || statusValue.toLowerCase() === statusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [records, query, statusFilter]);

  const careerOptions = careerCatalog.map((career) => career.name);

  return (
    <AdminPageShell
      eyebrow="Gestión de usuarios"
      title="Registro de estudiantes y docentes"
      subtitle="Administra altas, búsquedas y estados con una vista limpia que conserva la misma estética del panel principal."
      actions={
        <>
          <ActionButton variant="secondary" onClick={() => setActiveTab('students')}>
            Estudiantes
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setActiveTab('teachers')}>
            Docentes
          </ActionButton>
          <ActionButton variant="accent" onClick={() => setModalOpen(true)}>
            <UserPlus size={16} /> Nuevo usuario
          </ActionButton>
        </>
      }
      metrics={[
        { label: 'Usuarios activos', value: '3,284', hint: 'Todos los registros con sesión habilitada', icon: Users, tone: 'primary' },
        { label: 'Estudiantes', value: '2,840', hint: 'Distribuidos en 4 carreras principales', icon: Users, tone: 'info' },
        { label: 'Docentes', value: '144', hint: 'Carga promedio inferior al 80%', icon: Users, tone: 'success' }
      ]}
    >
      <SectionCard title="Búsqueda y filtros" description="Filtra por cédula, nombre o estado sin perder la navegación entre estudiantes y docentes.">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cédula, nombre o correo" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={fieldStyle}>
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Disponible</option>
              <option>Asignado</option>
              <option>En supervisión</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Carrera / Departamento</span>
            <select defaultValue="" style={fieldStyle}>
              <option value="">Todas las opciones</option>
              {careerOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title={activeTab === 'students' ? 'Estudiantes registrados' : 'Docentes registrados'} description="Listado detallado con acciones directas para administrar cada ficha.">
        <DataTable columns={activeTab === 'students'
          ? ['Cédula', 'Nombre', 'Correo', 'Carrera', 'Periodo', 'Estado', 'Acciones']
          : ['Cédula', 'Nombre', 'Departamento', 'Especialidad', 'Estado', 'Carga', 'Acciones']}>
          {filteredRecords.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>{record.name}</td>
              {activeTab === 'students' ? <td>{record.email}</td> : <td>{record.department}</td>}
              {activeTab === 'students' ? <td>{record.career}</td> : <td>{record.expertise}</td>}
              {activeTab === 'students'
                ? <td>{record.period}</td>
                : <td><StatusBadge tone="info">{record.status}</StatusBadge></td>}
              {activeTab === 'students'
                ? <td><StatusBadge tone={record.status === 'Activo' ? 'success' : 'danger'}>{record.status}</StatusBadge></td>
                : <td>{record.load}%</td>}
              <td>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ActionButton variant="ghost"><Edit3 size={14} /> Editar</ActionButton>
                  <ActionButton variant="danger"><Trash2 size={14} /> Eliminar</ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <Modal
        open={modalOpen}
        title="Registrar nuevo usuario"
        subtitle="Completa la ficha básica y deja lista la cuenta para sincronizarla con el backend."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={() => setModalOpen(false)}>Guardar usuario</ActionButton>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Cédula</span>
            <input className="form-input" defaultValue={form.id} ref={idRef} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Nombre</span>
            <input className="form-input" defaultValue={form.name} ref={nameRef} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Apellidos</span>
            <input className="form-input" defaultValue={form.lastname} ref={lastnameRef} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Correo</span>
            <input className="form-input" defaultValue={form.email} ref={emailRef} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Rol</span>
            <select className="form-input" defaultValue={form.role} ref={roleRef}>
              <option>Estudiante</option>
              <option>Docente</option>
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera / Departamento</span>
            <select className="form-input" defaultValue={form.assignment} ref={assignmentRef}>
              <option value="">Seleccionar</option>
              {careerOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
