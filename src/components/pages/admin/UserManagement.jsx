import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Users, UserPlus, Edit3, Trash2, GraduationCap, Briefcase, Shield, Check, Sparkles, CheckSquare, Square, ClipboardCheck, Layers } from 'lucide-react';
import { AdminPageShell, ActionButton, DataTable, Modal, SectionCard, StatusBadge, fieldStyle, CustomSelect, Pagination } from './AdminPageShell';
import { careerCatalog } from './adminSeedData';
import { registerUser } from '../../../services/auth';
import api from '../../../services/api';
import { MODULE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../../../constants/permissions';
import {
  LIMITS,
  sanitizeLettersOnly,
  sanitizeDigitsOnly,
  sanitizeDocumentNumber,
  sanitizeEmail,
  sanitizeUsername,
  validatePersonName,
  validateEmailField,
  validateDocumentField,
  validatePhoneField,
  getMaxBirthDate,
  validateBirthDate
} from '../../../utils/validation';

const defaultTeacherTitleOptions = ['Licenciado', 'Ingeniero', 'MSc', 'PhD', 'Otro'];
const documentTypeOptions = [

  { value: 'V', label: 'V - Nacional' },
  { value: 'E', label: 'E - Extranjero' },
  { value: 'P', label: 'P - Pasaporte' }
];


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
  const isAdmin = roleId === 1 || `${roleValue}`.toLowerCase() === 'admin' || `${roleValue}`.toLowerCase() === 'administrador';
  const isControlEstudios = roleId === 4 || `${roleValue}`.toLowerCase().includes('control');
  const isGestionAcademica = roleId === 5 || `${roleValue}`.toLowerCase().includes('gesti');

  const firstName = user?.first_name ?? user?.name ?? '';
  const secondName = user?.second_name ?? '';
  const lastName = user?.first_lastname ?? user?.last_name ?? user?.lastname ?? '';
  const secondLastName = user?.second_lastname ?? '';
  const fullName = [firstName, secondName, lastName, secondLastName].filter(Boolean).join(' ').trim();

  const roleName = 
    isTeacher ? 'Docente' :
    isStudent ? 'Estudiante' :
    isAdmin ? 'Administrador' :
    isControlEstudios ? 'Control de Estudios' :
    isGestionAcademica ? 'Gestión Académica' :
    (user?.Role?.name_role || 'Usuario');

  const record = {
    id: user?.document_id ?? user?.id ?? user?.cedula ?? '',
    name: fullName || user?.full_name || user?.fullName || '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    phone: user?.phone ?? '',
    status: user?.status ?? (isTeacher ? 'Disponible' : 'Activo'),
    roleName,
    rawUser: user
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
      period: user?.period ?? user?.academic_period ?? 'Sin período',
      cum: Number(user?.cum ?? user?.average ?? 0)
    };
  }

  return record;
};

const splitUsersByRole = (users) => {
  const nextStudents = [];
  const nextTeachers = [];
  const nextAdmins = [];

  users.forEach((user) => {
    const roleValue = user?.id_role ?? user?.role ?? user?.user_role ?? '';
    const roleId = Number(roleValue);
    const isTeacher = roleId === 2 || `${roleValue}`.toLowerCase() === 'docente';
    const isAdmin = roleId === 1 || `${roleValue}`.toLowerCase() === 'admin' || `${roleValue}`.toLowerCase() === 'administrador';

    if (isTeacher) {
      nextTeachers.push(normalizeBackendUser(user));
    } else if (isAdmin) {
      nextAdmins.push(normalizeBackendUser(user));
    } else {
      nextStudents.push(normalizeBackendUser(user));
    }
  });

  return { nextStudents, nextTeachers, nextAdmins };
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
  academicTitle: defaultTeacherTitleOptions[0],
  status: 'Activo',
  permissions: [...(DEFAULT_ROLE_PERMISSIONS[userType] || [])]
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
      period: 'Sin período',
      cum: 0,
      username: form.username.trim(),
      phone: form.phone.trim()
    };
  }

  if (form.userType === 'teacher') {
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
  }

  return {
    id: documentId,
    name: fullName,
    email: form.email.trim(),
    status: 'Activo',
    username: form.username.trim(),
    phone: form.phone.trim()
  };
};

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

const normalizeDocumentNumber = (value, type = 'V') => sanitizeDocumentNumber(value, type);

const normalizePhoneNumber = (value) => sanitizeDigitsOnly(value, LIMITS.PHONE_MAX);

const formatDocumentId = (type, value) => {
  const documentType = (type || 'V').toUpperCase();
  const documentNumber = normalizeDocumentNumber(value, documentType);
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
  admin: 1,
  teacher: 2,
  student: 3,
  control_estudios: 4,
  gestion_academica: 5
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
  const [adminForm, setAdminForm] = useState(createInitialForm('admin'));
  const [controlEstudiosForm, setControlEstudiosForm] = useState(createInitialForm('control_estudios'));
  const [gestionAcademicaForm, setGestionAcademicaForm] = useState(createInitialForm('gestion_academica'));
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdPassword, setCreatedPassword] = useState(null);
  const [careerList, setCareerList] = useState([]);
  const [extraFilter, setExtraFilter] = useState('');
  const [academicTitles, setAcademicTitles] = useState(defaultTeacherTitleOptions);


  // Pagination state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({ students: 0, teachers: 0, admins: 0, controlEstudios: 0, gestionAcademica: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [resStudents, resTeachers, resAdmins, resControl, resGestion] = await Promise.all([
        api.get('/users?limit=1&role=students'),
        api.get('/users?limit=1&role=teachers'),
        api.get('/users?limit=1&role=admins'),
        api.get('/users?limit=1&role=control_estudios'),
        api.get('/users?limit=1&role=gestion_academica')
      ]);
      setStats({
        students: resStudents?.meta?.totalItems || resStudents?.data?.meta?.totalItems || 0,
        teachers: resTeachers?.meta?.totalItems || resTeachers?.data?.meta?.totalItems || 0,
        admins: resAdmins?.meta?.totalItems || resAdmins?.data?.meta?.totalItems || 0,
        controlEstudios: resControl?.meta?.totalItems || resControl?.data?.meta?.totalItems || 0,
        gestionAcademica: resGestion?.meta?.totalItems || resGestion?.data?.meta?.totalItems || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setExtraFilter('');
  }, [activeTab]);

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
    let isMounted = true;
    async function loadAcademicTitles() {
      try {
        const res = await api.get('/academic-titles');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        if (isMounted && list.length > 0) {
          const names = list.map(item => typeof item === 'string' ? item : item.name_title).filter(Boolean);
          if (names.length > 0) {
            setAcademicTitles(names);
          }
        }
      } catch (err) {
        console.error('Failed to load academic titles:', err);
      }
    }
    loadAcademicTitles();
    return () => { isMounted = false; };
  }, []);




  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
          role: activeTab,
          status: statusFilter !== 'Todos' ? statusFilter : '',
          search: query || '',
          ...(activeTab === 'students' && extraFilter ? { career: extraFilter } : {}),
          ...(activeTab === 'teachers' && extraFilter ? { academic_title: extraFilter } : {})
        });

        
        const response = await api.get(`/users?${params.toString()}`);
        if (isMounted) {
          if (response?.data && response?.meta) {
            setRecords(response.data.map(normalizeBackendUser));
            setTotalPages(response.meta.totalPages);
            setTotalItems(response.meta.totalItems);
          } else if (Array.isArray(response?.data)) {
            setRecords(response.data.map(normalizeBackendUser));
            setTotalPages(1);
            setTotalItems(response.data.length);
          } else if (Array.isArray(response)) {
            // Fallback just in case backend hasn't restarted
            setRecords(response.map(normalizeBackendUser));
            setTotalPages(1);
            setTotalItems(response.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // Add small delay for search debouncing
    const timerId = setTimeout(() => {
      fetchUsers();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [activeTab, currentPage, statusFilter, query, extraFilter, refreshKey]);

  const form = userType === 'student'
    ? studentForm
    : userType === 'teacher'
      ? teacherForm
      : userType === 'control_estudios'
        ? controlEstudiosForm
        : userType === 'gestion_academica'
          ? gestionAcademicaForm
          : adminForm;
  const filteredRecords = records; // Server-side filtering applied
  const activeStudentsCount = activeTab === 'students' ? totalItems : 0;
  const activeTeachersCount = activeTab === 'teachers' ? totalItems : 0;
  const activeAdminsCount = activeTab === 'admins' ? totalItems : 0;
  const totalActiveUsers = totalItems; // Just showing total for current tab

  const careerOptions = careerList.length > 0
    ? careerList.map((c) => (typeof c === 'string' ? c : c?.name_career)).filter(Boolean)
    : careerCatalog.map((career) => career.name);

  const [modalTab, setModalTab] = useState('datos');

  const openUserModal = (type) => {
    const nextType = type || (
      activeTab === 'students' ? 'student' :
      activeTab === 'teachers' ? 'teacher' :
      activeTab === 'control_estudios' ? 'control_estudios' :
      activeTab === 'gestion_academica' ? 'gestion_academica' :
      'admin'
    );
    setUserType(nextType);
    setFormError('');
    setShowPassword(false);
    setModalTab('datos');
    setModalOpen(true);
  };

  const handleFieldChange = (field, rawValue) => {
    let value = rawValue;

    if (field === 'firstName' || field === 'secondName' || field === 'lastName' || field === 'secondLastName') {
      value = sanitizeLettersOnly(rawValue, LIMITS.NAME_MAX);
    } else if (field === 'documentNumber') {
      value = sanitizeDocumentNumber(rawValue, form.documentType);
    } else if (field === 'documentType') {
      value = rawValue;
    } else if (field === 'phone') {
      value = sanitizeDigitsOnly(rawValue, LIMITS.PHONE_MAX);
    } else if (field === 'email') {
      value = sanitizeEmail(rawValue, LIMITS.EMAIL_MAX);
    } else if (field === 'username') {
      value = sanitizeUsername(rawValue, LIMITS.USERNAME_MAX);
    }

    const updater = (currentForm) => {
      const next = { ...currentForm, [field]: value };
      if (field === 'documentType') {
        next.documentNumber = sanitizeDocumentNumber(currentForm.documentNumber, value);
      }
      return next;
    };

    if (userType === 'student') {
      setStudentForm(updater);
    } else if (userType === 'teacher') {
      setTeacherForm(updater);
    } else if (userType === 'control_estudios') {
      setControlEstudiosForm(updater);
    } else if (userType === 'gestion_academica') {
      setGestionAcademicaForm(updater);
    } else if (userType === 'admin') {
      setAdminForm(updater);
    }
  };

  const handleUserTypeChange = (nextType) => {
    setUserType(nextType);
    setFormError('');
    setShowPassword(false);
    if (nextType === 'student') {
      setStudentForm(prev => ({ ...prev, permissions: [...(DEFAULT_ROLE_PERMISSIONS.student || [])] }));
    } else if (nextType === 'teacher') {
      setTeacherForm(prev => ({ ...prev, permissions: [...(DEFAULT_ROLE_PERMISSIONS.teacher || [])] }));
    } else if (nextType === 'control_estudios') {
      setControlEstudiosForm(prev => ({ ...prev, permissions: [...(DEFAULT_ROLE_PERMISSIONS.control_estudios || [])] }));
    } else if (nextType === 'gestion_academica') {
      setGestionAcademicaForm(prev => ({ ...prev, permissions: [...(DEFAULT_ROLE_PERMISSIONS.gestion_academica || [])] }));
    } else if (nextType === 'admin') {
      setAdminForm(prev => ({ ...prev, permissions: [...(DEFAULT_ROLE_PERMISSIONS.admin || [])] }));
    }
  };

  const validateForm = () => {
    const firstNameErr = validatePersonName(form.firstName, 'El primer nombre', true);
    if (firstNameErr) return firstNameErr;

    const secondNameErr = validatePersonName(form.secondName, 'El segundo nombre', false);
    if (secondNameErr) return secondNameErr;

    const lastNameErr = validatePersonName(form.lastName, 'El primer apellido', true);
    if (lastNameErr) return lastNameErr;

    const secondLastNameErr = validatePersonName(form.secondLastName, 'El segundo apellido', false);
    if (secondLastNameErr) return secondLastNameErr;

    const birthDateErr = validateBirthDate(form.birthDate, false, LIMITS.MIN_AGE);
    if (birthDateErr) return birthDateErr;

    const emailErr = validateEmailField(form.email, true);
    if (emailErr) return emailErr;

    if (!editingUser) {
      const docErr = validateDocumentField(form.documentNumber, form.documentType);
      if (docErr) return docErr;
    }

    const phoneErr = validatePhoneField(form.phone, true);
    if (phoneErr) return phoneErr;

    if (form.username.trim() && form.username.trim().length < LIMITS.USERNAME_MIN) {
      return `El nombre de usuario debe tener entre ${LIMITS.USERNAME_MIN} y ${LIMITS.USERNAME_MAX} caracteres.`;
    }

    const pwd = form.password.trim();
    if (pwd && pwd.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (pwd && (!/[A-Z]/.test(pwd) || !/[^a-zA-Z0-9]/.test(pwd))) {
      return 'La contraseña debe contener al menos una mayúscula y un carácter especial.';
    }

    if (form.userType === 'student' && !form.career.trim()) return 'Selecciona una carrera para el estudiante.';
    if (form.userType === 'teacher' && !form.academicTitle.trim()) return 'Selecciona el título académico del docente.';

    return '';
  };

  const [editingUser, setEditingUser] = useState(null);

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormError('');
    setShowPassword(false);
    setModalTab('datos');
  };

  const handleStartEdit = (record) => {
    setEditingUser(record);

    const raw = record.rawUser;
    const roleId = Number(raw?.id_role);

    let tabToType = 'admin';
    if (roleId === 3 || activeTab === 'students') tabToType = 'student';
    else if (roleId === 2 || activeTab === 'teachers') tabToType = 'teacher';
    else if (roleId === 4 || activeTab === 'control_estudios') tabToType = 'control_estudios';
    else if (roleId === 5 || activeTab === 'gestion_academica') tabToType = 'gestion_academica';
    else if (roleId === 1 || activeTab === 'admins') tabToType = 'admin';

    setUserType(tabToType);

    const docId = record.id || '';
    const docParts = docId.split('-');
    const docType = docParts[0] || 'V';
    const docNum = docParts[1] || docId.replace(/^[VEP]-/, '') || '';

    const nameParts = (record.name || '').split(' ');
    const firstName = raw?.first_name || nameParts[0] || '';
    const secondName = raw?.second_name || '';
    const lastName = raw?.first_lastname || nameParts.slice(1).join(' ') || '';
    const secondLastName = raw?.second_lastname || '';

    const birthDate = raw?.date_birth ? raw.date_birth.split('T')[0] : '';

    const currentPermissions = Array.isArray(raw?.permissions) && raw.permissions.length > 0
      ? [...raw.permissions]
      : [...(DEFAULT_ROLE_PERMISSIONS[tabToType] || [])];

    const initialForm = {
      userType: tabToType,
      firstName,
      secondName,
      lastName,
      secondLastName,
      birthDate,
      email: record.email || '',
      documentType: docType,
      documentNumber: docNum,
      phone: (record.phone || '').replace('-', ''),
      username: record.username || '',
      password: '',
      career: record.career || '',
      academicTitle: record.department || academicTitles[0] || 'Licenciado',
      status: record.status || 'Activo',
      permissions: currentPermissions
    };

    if (tabToType === 'student') {
      setStudentForm(initialForm);
    } else if (tabToType === 'teacher') {
      setTeacherForm(initialForm);
    } else if (tabToType === 'control_estudios') {
      setControlEstudiosForm(initialForm);
    } else if (tabToType === 'gestion_academica') {
      setGestionAcademicaForm(initialForm);
    } else {
      setAdminForm(initialForm);
    }

    setFormError('');
    setShowPassword(false);
    setModalTab('datos');
    setModalOpen(true);
  };

  const handleTogglePermission = (permId) => {
    const current = form.permissions || [];
    const exists = current.includes(permId);
    const updated = exists ? current.filter(id => id !== permId) : [...current, permId];
    handleFieldChange('permissions', updated);
  };

  const handleSelectAllPermissions = () => {
    handleFieldChange('permissions', MODULE_PERMISSIONS.map(m => m.id));
  };

  const handleClearPermissions = () => {
    handleFieldChange('permissions', []);
  };

  const handleResetRolePermissions = () => {
    handleFieldChange('permissions', [...(DEFAULT_ROLE_PERMISSIONS[userType] || [])]);
  };

  const handleSetCoordinatorPreset = () => {
    const coordinatorPerms = Array.from(new Set([
      ...(DEFAULT_ROLE_PERMISSIONS.teacher || []),
      'admin:sections',
      'admin:classrooms',
      'admin:pensum',
      'admin:teacher-assignment',
      'admin:enrollments'
    ]));
    handleFieldChange('permissions', coordinatorPerms);
  };

  const handleToggleRolePermissions = (targetRole) => {
    let roleModules = [];
    if (targetRole === 'control_estudios') {
      roleModules = MODULE_PERMISSIONS.filter(m => m.category === 'Control de Estudios').map(m => m.id);
    } else if (targetRole === 'gestion_academica') {
      roleModules = MODULE_PERMISSIONS.filter(m => m.category === 'Gestión Académica').map(m => m.id);
    } else {
      roleModules = MODULE_PERMISSIONS.filter(m => m.role === targetRole).map(m => m.id);
    }
    const current = form.permissions || [];
    const allSelected = roleModules.length > 0 && roleModules.every(id => current.includes(id));

    if (allSelected) {
      handleFieldChange('permissions', current.filter(id => !roleModules.includes(id)));
    } else {
      const next = Array.from(new Set([...current, ...roleModules]));
      handleFieldChange('permissions', next);
    }
  };

  const handleToggleCategoryPermissions = (categoryName) => {
    const categoryModules = MODULE_PERMISSIONS.filter(m => m.category === categoryName).map(m => m.id);
    const current = form.permissions || [];
    const allSelected = categoryModules.length > 0 && categoryModules.every(id => current.includes(id));

    if (allSelected) {
      handleFieldChange('permissions', current.filter(id => !categoryModules.includes(id)));
    } else {
      const next = Array.from(new Set([...current, ...categoryModules]));
      handleFieldChange('permissions', next);
    }
  };

  const CATEGORY_THEMES = {
    'Administración General': {
      badgeBg: '#eff6ff',
      badgeText: '#1d4ed8',
      badgeBorder: '#bfdbfe',
      cardCheckedBg: '#f8faff',
      cardCheckedBorder: '#3b82f6',
      checkBg: '#2563eb',
      checkColor: '#ffffff'
    },
    'Gestión Académica': {
      badgeBg: '#f0fdfa',
      badgeText: '#0f766e',
      badgeBorder: '#99f6e4',
      cardCheckedBg: '#f0fdfa',
      cardCheckedBorder: '#14b8a6',
      checkBg: '#0d9488',
      checkColor: '#ffffff'
    },
    'Control de Estudios': {
      badgeBg: '#fefce8',
      badgeText: '#854d0e',
      badgeBorder: '#fef08a',
      cardCheckedBg: '#fffdf5',
      cardCheckedBorder: '#f59e0b',
      checkBg: '#d97706',
      checkColor: '#ffffff'
    },
    'Docencia': {
      badgeBg: '#ecfdf5',
      badgeText: '#047857',
      badgeBorder: '#a7f3d0',
      cardCheckedBg: '#f0fdf4',
      cardCheckedBorder: '#10b981',
      checkBg: '#059669',
      checkColor: '#ffffff'
    },
    'Estudiante': {
      badgeBg: '#f5f3ff',
      badgeText: '#6d28d9',
      badgeBorder: '#ddd6fe',
      cardCheckedBg: '#faf5ff',
      cardCheckedBorder: '#8b5cf6',
      checkBg: '#7c3aed',
      checkColor: '#ffffff'
    }
  };

  const permissionCategories = useMemo(() => {
    return Array.from(new Set(MODULE_PERMISSIONS.map((m) => m.category)));
  }, []);

  const handleDeleteUser = async (record) => {
    try {
      const id = record.rawUser?.id_user || record.id;
      if (!id) return;
      await api.delete(`/users/${id}`);

      setRefreshKey(k => k + 1);
      fetchStats();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleSubmit = async () => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      setModalTab('datos');
      return;
    }

    const payload = {
      first_name: form.firstName.trim(),
      first_lastname: form.lastName.trim(),
      second_name: form.secondName.trim() || undefined,
      second_lastname: form.secondLastName.trim() || undefined,
      date_birth: form.birthDate || null,
      id_role: ROLE_IDS[form.userType] ?? ROLE_IDS.student,
      email: form.email.trim(),
      phone: formatPhone(form.phone),
      username: form.username.trim() || undefined,
      status: form.status || 'Activo',
      permissions: Array.isArray(form.permissions) ? form.permissions : []
    };

    if (!editingUser) {
      payload.document_id = formatDocumentId(form.documentType, form.documentNumber);
    }

    if (form.userType === 'student') {
      payload.career = form.career;
    } else if (form.userType === 'teacher') {
      payload.academic_grade = form.academicTitle;
      payload.profession = form.academicTitle;
    }

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    setSubmitting(true);
    setFormError('');

    try {
      let response;
      if (editingUser) {
        response = await api.put(`/users/${editingUser.rawUser.id_user}`, payload);
      } else {
        response = await registerUser(payload);
      }

      const backendUser = response?.user || response?.data?.user || response?.data || response;
      const localRecord = normalizeBackendUser(backendUser);

      const tempPassword = response?.temporal_password || response?.data?.temporal_password;

      if (editingUser) {
        if (form.userType === 'student') {
          setStudentForm(createInitialForm('student'));
        } else if (form.userType === 'teacher') {
          setTeacherForm(createInitialForm('teacher'));
        } else if (form.userType === 'control_estudios') {
          setControlEstudiosForm(createInitialForm('control_estudios'));
        } else if (form.userType === 'gestion_academica') {
          setGestionAcademicaForm(createInitialForm('gestion_academica'));
        } else if (form.userType === 'admin') {
          setAdminForm(createInitialForm('admin'));
        }
      } else {
        if (form.userType === 'student') {
          setStudentForm(createInitialForm('student'));
        } else if (form.userType === 'teacher') {
          setTeacherForm(createInitialForm('teacher'));
        } else if (form.userType === 'control_estudios') {
          setControlEstudiosForm(createInitialForm('control_estudios'));
        } else if (form.userType === 'gestion_academica') {
          setGestionAcademicaForm(createInitialForm('gestion_academica'));
        } else if (form.userType === 'admin') {
          setAdminForm(createInitialForm('admin'));
        }
        if (tempPassword) {
          setCreatedPassword(tempPassword);
        }
      }

      setRefreshKey(k => k + 1);
      fetchStats();

      setModalOpen(false);
      setEditingUser(null);
      setShowPassword(false);
    } catch (error) {
      console.error('User save error:', error?.data || error);
      setFormError(formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Gestión de usuarios"
      title="Administración de usuarios y roles"
      subtitle="Registro, edición y gestión de estudiantes, docentes, administradores, control de estudios y gestión académica."
      carouselMetrics={true}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <ActionButton
              variant={activeTab === 'students' ? 'accent' : 'secondary'}
              onClick={() => { setActiveTab('students'); setCurrentPage(1); }}
              style={activeTab === 'students' ? { fontWeight: 800, borderColor: '#f5c400', boxShadow: '0 6px 18px rgba(255, 209, 0, 0.35)' } : undefined}
            >
              Estudiantes
            </ActionButton>
            <ActionButton
              variant={activeTab === 'teachers' ? 'accent' : 'secondary'}
              onClick={() => { setActiveTab('teachers'); setCurrentPage(1); }}
              style={activeTab === 'teachers' ? { fontWeight: 800, borderColor: '#f5c400', boxShadow: '0 6px 18px rgba(255, 209, 0, 0.35)' } : undefined}
            >
              Docentes
            </ActionButton>
            <ActionButton
              variant={activeTab === 'admins' ? 'accent' : 'secondary'}
              onClick={() => { setActiveTab('admins'); setCurrentPage(1); }}
              style={activeTab === 'admins' ? { fontWeight: 800, borderColor: '#f5c400', boxShadow: '0 6px 18px rgba(255, 209, 0, 0.35)' } : undefined}
            >
              Administradores
            </ActionButton>
            <ActionButton
              variant={activeTab === 'control_estudios' ? 'accent' : 'secondary'}
              onClick={() => { setActiveTab('control_estudios'); setCurrentPage(1); }}
              style={activeTab === 'control_estudios' ? { fontWeight: 800, borderColor: '#f5c400', boxShadow: '0 6px 18px rgba(255, 209, 0, 0.35)' } : undefined}
            >
              Control de Estudios
            </ActionButton>
            <ActionButton
              variant={activeTab === 'gestion_academica' ? 'accent' : 'secondary'}
              onClick={() => { setActiveTab('gestion_academica'); setCurrentPage(1); }}
              style={activeTab === 'gestion_academica' ? { fontWeight: 800, borderColor: '#f5c400', boxShadow: '0 6px 18px rgba(255, 209, 0, 0.35)' } : undefined}
            >
              Gestión Académica
            </ActionButton>
          </div>

          <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.25)', margin: '0 4px' }} />

          <ActionButton variant="accent" onClick={() => openUserModal()}>
            <UserPlus size={16} /> Nuevo usuario
          </ActionButton>
        </div>
      }
      metrics={[
        { label: 'Total Usuarios', value: String(stats.students + stats.teachers + stats.admins + stats.controlEstudios + stats.gestionAcademica), hint: 'Registrados en el sistema', icon: Users, tone: 'primary' },
        { label: 'Estudiantes', value: String(stats.students), hint: 'Inscritos', icon: GraduationCap, tone: 'success' },
        { label: 'Docentes', value: String(stats.teachers), hint: 'Registrados', icon: Briefcase, tone: 'info' },
        { label: 'Administradores', value: String(stats.admins), hint: 'Acceso total', icon: Shield, tone: 'warning' },
        { label: 'Control de Estudios', value: String(stats.controlEstudios), hint: 'Personal asignado', icon: ClipboardCheck, tone: 'warning' },
        { label: 'Gestión Académica', value: String(stats.gestionAcademica), hint: 'Coordinadores', icon: Layers, tone: 'info' }
      ]}
    >
      <SectionCard title="Búsqueda y filtros" description="Filtra por cédula, nombre o estado sin perder la navegación entre los distintos roles.">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Buscar</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Cédula, nombre o correo" style={{ ...fieldStyle, minHeight: '44px', lineHeight: 1.2, paddingLeft: '42px' }} />
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</span>
            <CustomSelect
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
              options={[
                { value: 'Todos', label: 'Todos' },
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
                { value: 'Bloqueado', label: 'Bloqueado' }
              ]}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: (activeTab !== 'students' && activeTab !== 'teachers') ? 0.5 : 1 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {activeTab === 'students' ? 'Carrera' : (activeTab === 'teachers' ? 'Título Académico' : 'Filtro adicional')}
            </span>
            <CustomSelect
              value={extraFilter}
              onChange={(value) => { setExtraFilter(value); setCurrentPage(1); }}
              style={(activeTab !== 'students' && activeTab !== 'teachers') ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              options={
                (activeTab !== 'students' && activeTab !== 'teachers')
                  ? [{ value: '', label: 'No aplicable' }]
                  : [
                      { value: '', label: 'Todas las opciones' },
                      ...(activeTab === 'students'
                        ? careerOptions.map((option) => ({ value: option, label: option }))
                        : academicTitles.map((option) => ({ value: option, label: option })))
                    ]

              }
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title={
          activeTab === 'students' ? 'Estudiantes registrados' :
          activeTab === 'teachers' ? 'Docentes registrados' :
          activeTab === 'admins' ? 'Administradores registrados' :
          activeTab === 'control_estudios' ? 'Personal de Control de Estudios' :
          'Coordinadores de Gestión Académica'
        }
        description="Listado detallado con acciones directas para administrar cada usuario y ficha."
      >
        <DataTable columns={
          activeTab === 'students'
            ? ['Cédula', 'Nombre', 'Correo', 'Carrera', 'Periodo', 'Estado', 'Acciones']
            : (activeTab === 'teachers'
              ? ['Cédula', 'Nombre', 'Título Académico', 'Estado', 'Carga', 'Acciones']
              : ['Cédula', 'Nombre', 'Correo', 'Teléfono', 'Estado', 'Acciones'])
        }>

          {filteredRecords.length === 0 ? (
            <tr>
              <td colSpan={activeTab === 'students' ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                {statusFilter !== 'Todos'
                  ? `No hay ${
                      activeTab === 'students' ? 'estudiantes' :
                      activeTab === 'teachers' ? 'docentes' :
                      activeTab === 'admins' ? 'administradores' :
                      activeTab === 'control_estudios' ? 'personal de control de estudios' :
                      'coordinadores de gestión académica'
                    } con estado "${statusFilter}"`
                  : `No hay ${
                      activeTab === 'students' ? 'estudiantes' :
                      activeTab === 'teachers' ? 'docentes' :
                      activeTab === 'admins' ? 'administradores' :
                      activeTab === 'control_estudios' ? 'personal de control de estudios' :
                      'coordinadores de gestión académica'
                    } registrados`}
              </td>
            </tr>
          ) : filteredRecords.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td>{record.name}</td>
              {activeTab === 'students' && (
                <>
                  <td>{record.email}</td>
                  <td>{record.career}</td>
                  <td>{record.period}</td>
                  <td><StatusBadge tone={record.status === 'Activo' ? 'success' : 'danger'}>{record.status}</StatusBadge></td>
                </>
              )}
              {activeTab === 'teachers' && (
                <>
                  <td>{record.department || 'Sin título'}</td>
                  <td><StatusBadge tone="info">{record.status}</StatusBadge></td>
                  <td>{record.load}%</td>
                </>
              )}

              {(activeTab === 'admins' || activeTab === 'control_estudios' || activeTab === 'gestion_academica') && (
                <>
                  <td>{record.email}</td>
                  <td>{record.phone || 'Sin asignar'}</td>
                  <td><StatusBadge tone={record.status === 'Activo' ? 'success' : 'danger'}>{record.status}</StatusBadge></td>
                </>
              )}
              <td>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ActionButton variant="ghost" onClick={() => handleStartEdit(record)}><Edit3 size={14} /> Editar</ActionButton>
                  <ActionButton variant="danger" onClick={() => handleDeleteUser(record)}><Trash2 size={14} /> Eliminar</ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </SectionCard>

      <Modal
        open={modalOpen}
        title={editingUser
          ? (
            userType === 'student' ? 'Editar estudiante' :
            userType === 'teacher' ? 'Editar docente' :
            userType === 'control_estudios' ? 'Editar personal de Control de Estudios' :
            userType === 'gestion_academica' ? 'Editar coordinador de Gestión Académica' :
            'Editar administrador'
          )
          : (
            userType === 'student' ? 'Registrar estudiante' :
            userType === 'teacher' ? 'Registrar docente' :
            userType === 'control_estudios' ? 'Registrar Control de Estudios' :
            userType === 'gestion_academica' ? 'Registrar Gestión Académica' :
            'Registrar administrador'
          )
        }
        subtitle={
          userType === 'student'
            ? 'Completa los datos del estudiante y deja su cuenta lista para iniciar sesión.'
            : userType === 'teacher'
              ? 'Completa los datos del docente y deja su cuenta lista para iniciar sesión.'
              : userType === 'control_estudios'
                ? 'Completa los datos del personal de control de estudios y define sus módulos de acceso.'
                : userType === 'gestion_academica'
                  ? 'Completa los datos del coordinador de gestión académica y define sus módulos de acceso.'
                  : 'Completa los datos del administrador y deja su cuenta lista para iniciar sesión.'
        }
        onClose={handleCloseModal}
        footer={
          <>
            <ActionButton variant="ghost" onClick={handleCloseModal} disabled={submitting}>Cancelar</ActionButton>
            <ActionButton variant="accent" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando...' : (editingUser ? 'Guardar cambios' : 'Guardar usuario')}
            </ActionButton>
          </>
        }
      >
        {!editingUser && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <ActionButton variant={userType === 'student' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('student')}>
              Estudiante
            </ActionButton>
            <ActionButton variant={userType === 'teacher' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('teacher')}>
              Docente
            </ActionButton>
            <ActionButton variant={userType === 'admin' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('admin')}>
              Administrador
            </ActionButton>
            <ActionButton variant={userType === 'control_estudios' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('control_estudios')}>
              Control de Estudios
            </ActionButton>
            <ActionButton variant={userType === 'gestion_academica' ? 'primary' : 'secondary'} onClick={() => handleUserTypeChange('gestion_academica')}>
              Gestión Académica
            </ActionButton>
          </div>
        )}

        {formError ? (
          <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#fff1f2', color: '#b91c1c', border: '1px solid #fecdd3', fontSize: '0.92rem', fontWeight: 600 }}>
            {formError}
          </div>
        ) : null}

        {/* Pestañas superiores del Modal: 1. Datos Personales | 2. Permisos y Módulos */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '5px',
            background: '#f1f5f9',
            borderRadius: '14px',
            marginBottom: '18px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => setModalTab('datos')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: modalTab === 'datos' ? '1px solid #e2e8f0' : '1px solid transparent',
              background: modalTab === 'datos' ? '#ffffff' : 'transparent',
              color: modalTab === 'datos' ? '#0f172a' : '#64748b',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: modalTab === 'datos' ? '0 2px 6px rgba(15, 23, 42, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>1. Datos Personales</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('permisos')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: modalTab === 'permisos' ? '1px solid #e2e8f0' : '1px solid transparent',
              background: modalTab === 'permisos' ? '#ffffff' : 'transparent',
              color: modalTab === 'permisos' ? '#0f172a' : '#64748b',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: modalTab === 'permisos' ? '0 2px 6px rgba(15, 23, 42, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield size={16} />
            <span>2. Permisos y Módulos</span>
            <span
              style={{
                background: modalTab === 'permisos' ? '#0f172a' : '#e2e8f0',
                color: modalTab === 'permisos' ? '#ffffff' : '#475569',
                fontSize: '0.73rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {(form.permissions || []).length}
            </span>
          </button>
        </div>

        {modalTab === 'datos' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Primer nombre</span>
                <input
                  className="form-input"
                  maxLength={LIMITS.NAME_MAX}
                  placeholder="Solo letras"
                  value={form.firstName}
                  onChange={(event) => handleFieldChange('firstName', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Segundo nombre</span>
                <input
                  className="form-input"
                  maxLength={LIMITS.NAME_MAX}
                  placeholder="Opcional"
                  value={form.secondName}
                  onChange={(event) => handleFieldChange('secondName', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Primer apellido</span>
                <input
                  className="form-input"
                  maxLength={LIMITS.NAME_MAX}
                  placeholder="Solo letras"
                  value={form.lastName}
                  onChange={(event) => handleFieldChange('lastName', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Segundo apellido</span>
                <input
                  className="form-input"
                  maxLength={LIMITS.NAME_MAX}
                  placeholder="Opcional"
                  value={form.secondLastName}
                  onChange={(event) => handleFieldChange('secondLastName', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Fecha de nacimiento</span>
                <input
                  className="form-input"
                  type="date"
                  min="1920-01-01"
                  max={getMaxBirthDate(LIMITS.MIN_AGE)}
                  value={form.birthDate}
                  onChange={(event) => handleFieldChange('birthDate', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Correo</span>
                <input
                  className="form-input"
                  type="email"
                  maxLength={LIMITS.EMAIL_MAX}
                  placeholder="usuario@dominio.com"
                  value={form.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                />
              </label>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Tipo de documento</span>
                <CustomSelect
                  value={form.documentType}
                  onChange={(value) => handleFieldChange('documentType', value)}
                  options={documentTypeOptions}
                />
              </div>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Número de documento / cédula</span>
                <input
                  className="form-input"
                  inputMode={form.documentType === 'P' ? 'text' : 'numeric'}
                  maxLength={form.documentType === 'P' ? LIMITS.PASSPORT_MAX : LIMITS.DOC_MAX}
                  placeholder={form.documentType === 'P' ? 'Pasaporte' : 'Ej: 12345678'}
                  disabled={Boolean(editingUser)}
                  value={form.documentNumber}
                  onChange={(event) => handleFieldChange('documentNumber', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Teléfono</span>
                <input
                  className="form-input"
                  inputMode="numeric"
                  maxLength={LIMITS.PHONE_MAX}
                  placeholder="Ej: 04141234567"
                  value={form.phone}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                />
              </label>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Username</span>
                <input
                  className="form-input"
                  maxLength={LIMITS.USERNAME_MAX}
                  placeholder="usuario_123"
                  value={form.username}
                  onChange={(event) => handleFieldChange('username', event.target.value)}
                />
              </label>
              {editingUser ? (
                <label key="field-password-locked" className="form-group" style={{ marginBottom: 0, opacity: 0.6 }}>
                  <span className="form-label">Contraseña (Bloqueada en edición)</span>
                  <input className="form-input" type="password" value="••••••••" disabled style={{ cursor: 'not-allowed' }} />
                </label>
              ) : null}

              <div
                className="form-group"
                style={{ marginBottom: 0, display: userType === 'student' ? 'block' : 'none' }}
              >
                <span className="form-label">Carrera</span>
                <CustomSelect
                  value={form.career}
                  onChange={(value) => handleFieldChange('career', value)}
                  options={[
                    { value: '', label: 'Seleccionar' },
                    ...careerOptions.map((option) => ({ value: option, label: option }))
                  ]}
                />
              </div>
              <div
                className="form-group"
                style={{ marginBottom: 0, display: userType === 'teacher' ? 'block' : 'none' }}
              >
                <span className="form-label">Título académico</span>
                <CustomSelect
                  value={form.academicTitle}
                  onChange={(value) => handleFieldChange('academicTitle', value)}
                  options={academicTitles.map((option) => ({ value: option, label: option }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Estado</span>
                <CustomSelect
                  value={form.status || 'Activo'}
                  onChange={(value) => handleFieldChange('status', value)}
                  options={[
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' },
                    { value: 'Bloqueado', label: 'Bloqueado' }
                  ]}
                />
              </div>

              <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <span className="form-label">Tipo de registro</span>
                <input
                  className="form-input"
                  value={
                    userType === 'student' ? 'Estudiante' :
                    userType === 'teacher' ? 'Docente' :
                    userType === 'admin' ? 'Administrador' :
                    userType === 'control_estudios' ? 'Control de Estudios' :
                    'Gestión Académica'
                  }
                  disabled
                />
              </label>
            </div>

            {/* Barra de resumen rápido de permisos al final de Datos Personales */}
            <div
              style={{
                marginTop: '18px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                <Shield size={16} color="#0f172a" />
                <span>
                  Permisos asignados automáticamente para este rol:{' '}
                  <strong style={{ color: '#0f172a' }}>{(form.permissions || []).length} módulos activos</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalTab('permisos')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                Personalizar permisos →
              </button>
            </div>
          </>
        ) : (
          /* Pestaña 2: Permisos y Módulos de Acceso (Diseño monocromático y limpio) */
          <div
            style={{
              padding: '20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Permisos y Módulos de Acceso
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Marca o desmarca los módulos a los que tendrá acceso este usuario.
                </p>
              </div>

              {/* Quick Global Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResetRolePermissions}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Restablece los permisos originales del rol seleccionado"
                >
                  ↺ Predeterminados del rol
                </button>
                <button
                  type="button"
                  onClick={handleClearPermissions}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Desmarcar todo
                </button>
              </div>
            </div>

            {/* Quick Selection Toolbar by Role (Monocromático y sin exceso de colores) */}
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Plantillas por rol:
              </span>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { key: 'student', label: 'Estudiante', checkFn: () => MODULE_PERMISSIONS.filter(m => m.role === 'student').every(m => (form.permissions || []).includes(m.id)) },
                  { key: 'teacher', label: 'Docente', checkFn: () => MODULE_PERMISSIONS.filter(m => m.role === 'teacher').every(m => (form.permissions || []).includes(m.id)) },
                  { key: 'control_estudios', label: 'Control de Estudios', checkFn: () => MODULE_PERMISSIONS.filter(m => m.category === 'Control de Estudios').every(m => (form.permissions || []).includes(m.id)) },
                  { key: 'gestion_academica', label: 'Gestión Académica', checkFn: () => MODULE_PERMISSIONS.filter(m => m.category === 'Gestión Académica').every(m => (form.permissions || []).includes(m.id)) },
                  { key: 'admin', label: 'Administrador', checkFn: () => MODULE_PERMISSIONS.filter(m => m.role === 'admin').every(m => (form.permissions || []).includes(m.id)) },
                ].map((preset) => {
                  const active = preset.checkFn();
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleToggleRolePermissions(preset.key)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${active ? '#0f172a' : '#cbd5e1'}`,
                        background: active ? '#0f172a' : '#f8fafc',
                        color: active ? '#ffffff' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {active ? `✓ ${preset.label}` : `+ ${preset.label}`}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSetCoordinatorPreset}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Docente + Secciones, Aulas, Pensum, Asignación Docente e Inscripciones"
                >
                  + Perfil Coordinador
                </button>
              </div>
            </div>

            {/* Grouped Modules List (Estilo limpio y uniforme) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {permissionCategories.map((category) => {
                const categoryModules = MODULE_PERMISSIONS.filter(m => m.category === category);
                const selectedCount = categoryModules.filter(m => (form.permissions || []).includes(m.id)).length;
                const allCategorySelected = categoryModules.length > 0 && selectedCount === categoryModules.length;

                return (
                  <div
                    key={category}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {/* Category Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #f1f5f9',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#0f172a',
                          }}
                        >
                          {category}
                        </span>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: selectedCount > 0 ? '#f1f5f9' : 'transparent',
                            color: selectedCount > 0 ? '#334155' : '#94a3b8',
                            fontWeight: 700,
                          }}
                        >
                          {`${selectedCount} / ${categoryModules.length}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCategoryPermissions(category)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {allCategorySelected ? 'Desmarcar grupo' : 'Marcar grupo'}
                      </button>
                    </div>

                    {/* Modules Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '8px',
                      }}
                    >
                      {categoryModules.map((module) => {
                        const isChecked = (form.permissions || []).includes(module.id);
                        return (
                          <div
                            key={module.id}
                            onClick={() => handleTogglePermission(module.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: isChecked ? '#f8fafc' : '#ffffff',
                              border: `1.5px solid ${isChecked ? '#0f172a' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div
                              style={{
                                marginTop: '2px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '5px',
                                border: `2px solid ${isChecked ? '#0f172a' : '#cbd5e1'}`,
                                background: isChecked ? '#0f172a' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                flexShrink: 0,
                              }}
                            >
                              <Check
                                size={12}
                                strokeWidth={3.2}
                                style={{ opacity: isChecked ? 1 : 0 }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: isChecked ? 800 : 600,
                                  color: '#0f172a',
                                  lineHeight: 1.25,
                                }}
                              >
                                {module.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#64748b',
                                  marginTop: '2px',
                                  lineHeight: 1.25,
                                }}
                              >
                                {module.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {createdPassword && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 17, 36, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', maxWidth: '480px', width: '100%',
            padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            borderTop: '6px solid #ffd100', position: 'relative'
          }}>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setCreatedPassword(null)}
              style={{
                position: 'absolute', top: '14px', right: '14px', width: '36px', height: '36px',
                borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc',
                color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '18px', fontWeight: 700
              }}
            >
              &times;
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(255, 209, 0, 0.12)', color: '#7c5a00',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                Usuario creado exitosamente
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>
                Se ha enviado un correo con las credenciales al usuario.
              </p>
            </div>
            <div style={{
              background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: '14px',
              padding: '20px', marginBottom: '24px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Contraseña temporal
              </div>
              <div style={{
                fontSize: '1.4rem', fontWeight: 800, color: '#2563eb',
                fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center',
                padding: '12px', background: '#fff', borderRadius: '10px',
                border: '1px dashed #93c5fd'
              }}>
                {createdPassword}
              </div>
            </div>
            <button
              onClick={() => setCreatedPassword(null)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: 'none', background: '#ffd100', color: '#051124',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
