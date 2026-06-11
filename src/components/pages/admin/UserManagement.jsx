import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users, UserPlus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge, fieldStyle } from './AdminPageShell';
import { careerCatalog, teachersCatalog, studentsCatalog } from './adminSeedData';
import { registerUser } from '../../../services/auth';
import api from '../../../services/api';

const teacherTitleOptions = ['Licenciado', 'Ingeniero', 'MSc', 'PhD', 'Otro'];
const documentTypeOptions = [
  { value: 'V', label: 'V - Nacional' },
  { value: 'E', label: 'E - Extranjero' },
  { value: 'P', label: 'P - Pasaporte' }
];
const STUDENTS_STORAGE_KEY = 'admin_users_students';
const TEACHERS_STORAGE_KEY = 'admin_users_teachers';

const readStoredRecords = (storageKey, fallbackRecords) => {
  if (typeof window === 'undefined') {
    return fallbackRecords;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return fallbackRecords;
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue : fallbackRecords;
  } catch {
    return fallbackRecords;
  }
};

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [payload?.users, payload?.results, payload?.items, payload?.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeBackendUser = (user) => {
  const roleValue = user?.id_role ?? user?.role ?? user?.user_role ?? '';
  const roleId = Number(roleValue);
  const isTeacher = roleId === 2 || `${roleValue}`.toLowerCase() === 'docente';
  const isStudent = roleId === 3 || `${roleValue}`.toLowerCase() === 'estudiante';

  const firstName = user?.first_name ?? user?.name ?? '';
  const secondName = user?.second_name ?? '';
  const lastName = user?.last_name ?? user?.lastname ?? '';
  const secondLastName = user?.second_lastname ?? '';
  const fullName = [firstName, secondName, lastName, secondLastName].filter(Boolean).join(' ').trim();

  const record = {
    id: user?.document_id ?? user?.id ?? user?.cedula ?? '',
    name: fullName || user?.full_name || user?.fullName || '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    phone: user?.phone ?? '',
    status: user?.status ?? (isTeacher ? 'Disponible' : 'Activo')
  };

  if (isTeacher) {
    return {
      ...record,
      department: user?.academic_title ?? user?.academicTitle ?? user?.department ?? '',
      expertise: user?.expertise ?? 'Pendiente de asignación',
      load: Number(user?.load ?? user?.carga ?? 0)
    };
  }

  if (isStudent) {
    return {
      ...record,
      career: user?.career ?? '',
      period: user?.period ?? user?.academic_period ?? '2026-II',
      cum: Number(user?.cum ?? user?.average ?? 0)
    };
  }

  return record;
};

const splitUsersByRole = (users) => {
  const nextStudents = [];
  const nextTeachers = [];

  users.forEach((user) => {
    const roleValue = user?.id_role ?? user?.role ?? user?.user_role ?? '';
    const roleId = Number(roleValue);
    const isTeacher = roleId === 2 || `${roleValue}`.toLowerCase() === 'docente';

    if (isTeacher) {
      nextTeachers.push(normalizeBackendUser(user));
      return;
    }

    nextStudents.push(normalizeBackendUser(user));
  });

  return { nextStudents, nextTeachers };
};

const createInitialForm = (userType = 'student') => ({
  userType,
  firstName: '',
  secondName: '',
  lastName: '',
  secondLastName: '',
  birthDate: '',
  email: '',
  documentType: 'V',
  documentNumber: '',
  phone: '',
  username: '',
  password: '',
  career: '',
  academicTitle: teacherTitleOptions[0]
});

const buildLocalRecord = (form) => {
  const fullName = [form.firstName, form.secondName, form.lastName, form.secondLastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ');
  const documentId = `${form.documentType}-${form.documentNumber.trim()}`;

  if (form.userType === 'student') {
    return {
      id: documentId,
      name: fullName,
      email: form.email.trim(),
      career: form.career,
      status: 'Activo',
      period: '2026-II',
      cum: 0,
      username: form.username.trim(),
      phone: form.phone.trim()
    };
  }

  return {
    id: documentId,
    name: fullName,
    department: form.academicTitle,
    expertise: 'Pendiente de asignación',
    status: 'Disponible',
    load: 0,
    email: form.email.trim(),
    username: form.username.trim(),
    phone: form.phone.trim()
  };
};

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

const normalizeDocumentNumber = (value) => value.replace(/\D/g, '').slice(0, 8);

const normalizePhoneNumber = (value) => value.replace(/\D/g, '').slice(0, 11);

const formatDocumentId = (type, value) => {
  const documentNumber = normalizeDocumentNumber(value);
  const documentType = (type || '').toUpperCase();
  return documentNumber ? `${documentType}-${documentNumber}` : `${documentType}-`;
};

const formatPhone = (value) => {
  const digits = normalizePhoneNumber(value);

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const ROLE_IDS = {
  teacher: 2,
  student: 3
};

const describeValidationItem = (item) => {
  if (item == null) {
    return '';
  }

  if (typeof item === 'string') {
    return item;
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }

  if (Array.isArray(item)) {
    return item.map(describeValidationItem).filter(Boolean).join(' · ');
  }

  if (typeof item === 'object') {
    const parts = [item.field, item.path, item.param, item.location, item.message, item.msg]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    if (parts.length) {
      return parts.join(': ');
    }

    try {
      return JSON.stringify(item);
    } catch {
      return '[validación sin formato]';
    }
  }

  return String(item);
};

const formatApiError = (error) => {
  const responseData = error?.data;
  const validationParts = [];

  if (responseData?.message) {
    validationParts.push(responseData.message);
  }

  if (Array.isArray(responseData?.errors)) {
    validationParts.push(...responseData.errors.map(describeValidationItem));
  }

  if (responseData?.errors && !Array.isArray(responseData.errors)) {
    validationParts.push(describeValidationItem(responseData.errors));
  }

  if (Array.isArray(responseData?.error)) {
    validationParts.push(...responseData.error.map(describeValidationItem));
  }

  if (responseData?.error && !Array.isArray(responseData.error)) {
    validationParts.push(describeValidationItem(responseData.error));
  }

  if (responseData?.details) {
    validationParts.push(describeValidationItem(responseData.details));
  }

  if (responseData?.validationErrors) {
    validationParts.push(describeValidationItem(responseData.validationErrors));
  }

  if (validationParts.length) {
    return validationParts.filter(Boolean).join(' · ');
  }

  return error?.message || 'No fue posible registrar el usuario.';
};

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('students');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [userType, setUserType] = useState('student');
  const [studentForm, setStudentForm] = useState(createInitialForm('student'));
  const [teacherForm, setTeacherForm] = useState(createInitialForm('teacher'));
  const [students, setStudents] = useState(() => readStoredRecords(STUDENTS_STORAGE_KEY, studentsCatalog));
  const [teachers, setTeachers] = useState(() => readStoredRecords(TEACHERS_STORAGE_KEY, teachersCatalog));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [careerList, setCareerList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCareers() {
      try {
        const res = await api.get('/careers');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (isMounted) {
          setCareerList(list);
        }
      } catch (err) {
        console.error('Failed to load careers:', err);
      }
    }
    loadCareers();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    window.localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  }, [students, teachers]);

  useEffect(() => {
    let isMounted = true;

    const hydrateUsers = async () => {
      const endpoints = ['/admin/users', '/users'];

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          const users = unwrapArrayPayload(response?.data ?? response);

          if (!users.length) {
            continue;
          }

          const { nextStudents, nextTeachers } = splitUsersByRole(users);

          if (!isMounted) {
            return;
          }

          if (nextStudents.length) {
            setStudents(nextStudents);
          }

          if (nextTeachers.length) {
            setTeachers(nextTeachers);
          }

          return;
        } catch {
          // Try the next candidate endpoint.
        }
      }
    };

    hydrateUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const records = activeTab === 'students' ? students : teachers;
  const form = userType === 'student' ? studentForm : teacherForm;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const values = Object.values(record).join(' ').toLowerCase();
      const matchesQuery = values.includes(query.toLowerCase());
      const statusValue = record.status || 'Disponible';
      const matchesStatus = statusFilter === 'Todos' || statusValue.toLowerCase() === statusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [records, query, statusFilter]);

  const careerOptions = careerList.length > 0
    ? careerList.map((c) => c.name_career)
    : careerCatalog.map((career) => career.name);

  const openUserModal = (type) => {
    const nextType = type || (activeTab === 'students' ? 'student' : 'teacher');
    setUserType(nextType);
    setFormError('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    if (userType === 'student') {
      setStudentForm((currentForm) => ({
        ...currentForm,
        [field]: value
      }));
      return;
    }

    setTeacherForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const handleUserTypeChange = (nextType) => {
    setUserType(nextType);
    setFormError('');
    setShowPassword(false);
  };

  const validateForm = () => {
    if (!form.firstName.trim()) return 'El primer nombre es obligatorio.';
    if (!form.lastName.trim()) return 'El primer apellido es obligatorio.';
    if (!form.email.trim()) return 'El correo es obligatorio.';
    if (!isValidEmail(form.email)) return 'El correo no tiene un formato válido.';
    if (normalizeDocumentNumber(form.documentNumber).length !== 8) return 'La cédula debe tener 8 dígitos.';
    if (normalizePhoneNumber(form.phone).length !== 11) return 'El teléfono debe tener 11 dígitos.';
    if (!form.username.trim()) return 'El username es obligatorio.';
    if (!form.password.trim() || form.password.trim().length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.userType === 'student' && !form.career.trim()) return 'Selecciona una carrera para el estudiante.';
    if (form.userType === 'teacher' && !form.academicTitle.trim()) return 'Selecciona el título académico del docente.';

    return '';
  };

  const handleSubmit = async () => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      document_id: formatDocumentId(form.documentType, form.documentNumber),
      name: form.firstName.trim(),
      lastname: form.lastName.trim(),
      second_name: form.secondName.trim(),
      second_lastname: form.secondLastName.trim(),
      date_birth: form.birthDate,
      id_role: ROLE_IDS[form.userType] ?? ROLE_IDS.student,
      email: form.email.trim(),
      phone: formatPhone(form.phone),
      username: form.username.trim(),
      password: form.password,
      career: form.career,
      academic_grade: form.academicTitle,
      profession: form.academicTitle
    };

    setSubmitting(true);
    setFormError('');

    try {
      const response = await registerUser(payload);
      const backendUser = response?.user || response?.data?.user || response?.data || response;
      const localRecord = { ...buildLocalRecord(form), ...(backendUser && typeof backendUser === 'object' ? backendUser : {}) };

      if (form.userType === 'student') {
        setStudents((currentStudents) => [localRecord, ...currentStudents]);
        setStudentForm(createInitialForm('student'));
      } else {
        setTeachers((currentTeachers) => [localRecord, ...currentTeachers]);
        setTeacherForm(createInitialForm('teacher'));
      }

      setModalOpen(false);
      setShowPassword(false);
    } catch (error) {
      console.error('registerUser validation error:', error?.data || error);
      setFormError(formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

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
          <ActionButton variant="accent" onClick={() => openUserModal()}>
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
        title={userType === 'student' ? 'Registrar estudiante' : 'Registrar docente'}
        subtitle={userType === 'student'
          ? 'Completa los datos del estudiante y deja su cuenta lista para iniciar sesión.'
          : 'Completa los datos del docente y deja su cuenta lista para iniciar sesión.'}
        onClose={() => {
          setModalOpen(false);
          setFormError('');
          setShowPassword(false);
        }}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar usuario'}
            </ActionButton>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <ActionButton variant={userType === 'student' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('student')}>
            Estudiante
          </ActionButton>
          <ActionButton variant={userType === 'teacher' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('teacher')}>
            Docente
          </ActionButton>
        </div>

        {formError ? (
          <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '0.92rem', fontWeight: 600 }}>
            {formError}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Primer nombre</span>
            <input className="form-input" value={form.firstName} onChange={(event) => handleFieldChange('firstName', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Segundo nombre</span>
            <input className="form-input" value={form.secondName} onChange={(event) => handleFieldChange('secondName', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Primer apellido</span>
            <input className="form-input" value={form.lastName} onChange={(event) => handleFieldChange('lastName', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Segundo apellido</span>
            <input className="form-input" value={form.secondLastName} onChange={(event) => handleFieldChange('secondLastName', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Fecha de nacimiento</span>
            <input className="form-input" type="date" value={form.birthDate} onChange={(event) => handleFieldChange('birthDate', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Correo</span>
            <input className="form-input" type="email" value={form.email} onChange={(event) => handleFieldChange('email', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Tipo de documento</span>
            <select className="form-input" value={form.documentType} onChange={(event) => handleFieldChange('documentType', event.target.value)}>
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Número de documento / cédula</span>
            <input className="form-input" value={form.documentNumber} onChange={(event) => handleFieldChange('documentNumber', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Teléfono</span>
            <input className="form-input" value={form.phone} onChange={(event) => handleFieldChange('phone', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Username</span>
            <input className="form-input" value={form.username} onChange={(event) => handleFieldChange('username', event.target.value)} />
          </label>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Contraseña</span>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                autoComplete="new-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {userType === 'student' ? (
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Carrera</span>
              <select className="form-input" value={form.career} onChange={(event) => handleFieldChange('career', event.target.value)}>
                <option value="">Seleccionar</option>
                {careerOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Título académico</span>
              <select className="form-input" value={form.academicTitle} onChange={(event) => handleFieldChange('academicTitle', event.target.value)}>
                {teacherTitleOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          )}

          <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
            <span className="form-label">Tipo de registro</span>
            <input className="form-input" value={userType === 'student' ? 'Estudiante' : 'Docente'} disabled />
          </label>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
