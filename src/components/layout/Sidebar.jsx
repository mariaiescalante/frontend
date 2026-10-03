import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Award,
  Calendar,
  ClipboardCheck,
  Layers,
  UserCheck,
  History,
  FileLock2,
  Users,
  DoorOpen
} from 'lucide-react';
import { hasModulePermission } from '../../constants/permissions';
import universityLogo from '../../assets/logo-uptnt.png';

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { user, logout, isAdmin, isStudent, isTeacher, isControlEstudios, isGestionAcademica } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkEnrollment() {
      try {
        const res = await api.get('/periods/active');
        const activePeriod = res.data || res;
        // Enrollment is open only when status is 'Abierta'
        setIsEnrollmentOpen(activePeriod?.enrollment_status === 'Abierta');
      } catch {
        // If there's no active period or error, enrollment is closed by default
        setIsEnrollmentOpen(false);
      }
    }
    checkEnrollment();

    window.addEventListener('academic-period-updated', checkEnrollment);
    return () => {
      window.removeEventListener('academic-period-updated', checkEnrollment);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');

    const updateIsMobile = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  const isCompact = !isMobile && collapsed;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getPortalName = () => {
    if (isAdmin) return 'ADMIN PORTAL';
    if (isTeacher) return 'DOCENTE PORTAL';
    if (isStudent) return 'PORTAL ESTUDIANTE';
    if (isControlEstudios) return 'CONTROL DE ESTUDIOS';
    if (isGestionAcademica) return 'GESTIÓN ACADÉMICA';
    return 'PORTAL ACADÉMICO';
  };

  const getInitials = () => {
    if (!user) return 'SG';
    const first = user.name ? user.name[0] : '';
    const last = user.lastname ? user.lastname[0] : '';
    return (first + last).toUpperCase();
  };

  // Sidebar navigation menu items based on granular permissions
  const menuItems = [
    {
      id: 'admin:dashboard',
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: hasModulePermission(user, 'admin:dashboard')
    },
    {
      id: 'admin:users',
      path: '/admin/users',
      name: 'Usuarios',
      icon: UserCog,
      visible: hasModulePermission(user, 'admin:users')
    },
    {
      id: 'admin:careers',
      path: '/admin/careers',
      name: 'Carreras',
      icon: Award,
      visible: hasModulePermission(user, 'admin:careers')
    },
    {
      id: 'admin:pensum',
      path: '/admin/pensum',
      name: 'Pensum',
      icon: BookOpen,
      visible: hasModulePermission(user, 'admin:pensum')
    },
    {
      id: 'admin:periods',
      path: '/admin/periods',
      name: 'Períodos',
      icon: Calendar,
      visible: hasModulePermission(user, 'admin:periods')
    },
    {
      id: 'admin:enrollments',
      path: '/admin/enrollments',
      name: 'Inscripciones',
      icon: ClipboardCheck,
      visible: hasModulePermission(user, 'admin:enrollments')
    },
    {
      id: 'admin:sections',
      path: '/admin/sections',
      name: 'Secciones',
      icon: Layers,
      visible: hasModulePermission(user, 'admin:sections')
    },
    {
      id: 'admin:classrooms',
      path: '/admin/classrooms',
      name: 'Aulas y Espacios',
      icon: DoorOpen,
      visible: hasModulePermission(user, 'admin:classrooms')
    },
    {
      id: 'admin:teacher-assignment',
      path: '/admin/teacher-assignment',
      name: 'Asignación Docente',
      icon: UserCheck,
      visible: hasModulePermission(user, 'admin:teacher-assignment')
    },
    {
      id: 'admin:grades',
      path: '/admin/grades',
      name: 'Notas',
      icon: ClipboardList,
      visible: hasModulePermission(user, 'admin:grades')
    },
    {
      id: 'admin:pre-registrations',
      path: '/admin/pre-registrations',
      name: 'Aspirantes',
      icon: Users,
      visible: hasModulePermission(user, 'admin:pre-registrations')
    },
    {
      id: 'admin:history',
      path: '/admin/history',
      name: 'Historial',
      icon: History,
      visible: hasModulePermission(user, 'admin:history')
    },
    {
      id: 'teacher:dashboard',
      path: '/teacher/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: hasModulePermission(user, 'teacher:dashboard')
    },
    {
      id: 'teacher:subjects',
      path: '/teacher/subjects',
      name: 'Asignaturas Impartidas',
      icon: BookOpen,
      visible: hasModulePermission(user, 'teacher:subjects')
    },
    {
      id: 'teacher:students',
      path: '/teacher/students',
      name: 'Estudiantes Inscritos',
      icon: Users,
      visible: hasModulePermission(user, 'teacher:students')
    },
    {
      id: 'teacher:records',
      path: '/teacher/records',
      name: 'Cerrar Actas',
      icon: FileLock2,
      visible: hasModulePermission(user, 'teacher:records')
    },
    {
      id: 'teacher:history',
      path: '/teacher/history',
      name: 'Historial Impartido',
      icon: History,
      visible: hasModulePermission(user, 'teacher:history')
    },
    {
      id: 'student:dashboard',
      path: '/student/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: hasModulePermission(user, 'student:dashboard')
    },
    {
      id: 'student:profile',
      path: '/student/profile',
      name: 'Datos Personales',
      icon: UserCog,
      visible: hasModulePermission(user, 'student:profile')
    },
    {
      id: 'student:pensum',
      path: '/student/pensum',
      name: 'Pensum de Estudios',
      icon: BookOpen,
      visible: hasModulePermission(user, 'student:pensum')
    },
    {
      id: 'student:enrollment',
      path: '/student/enrollment',
      name: 'Inscripción de Materias',
      icon: ClipboardCheck,
      visible: hasModulePermission(user, 'student:enrollment') && isEnrollmentOpen
    },
    {
      id: 'student:schedule',
      path: '/student/schedule',
      name: 'Mi Horario',
      icon: Calendar,
      visible: hasModulePermission(user, 'student:schedule')
    },
    {
      id: 'student:record',
      path: '/student/record',
      name: 'Récord Académico',
      icon: History,
      visible: hasModulePermission(user, 'student:record')
    },
    {
      id: 'student:documents',
      path: '/student/documents',
      name: 'Constancias y Reportes',
      icon: FileLock2,
      visible: hasModulePermission(user, 'student:documents')
    }
  ];

  return (
    <aside
      className={`sgums-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      style={{
        width: isCompact ? '80px' : '280px',
        minWidth: isCompact ? '80px' : '280px'
      }}
    >
      {/* Collapse Button */}
      {!isMobile ? (
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            right: '-14px',
            top: '32px',
            background: '#ffd100',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            color: '#051124',
            zIndex: 50,
            transition: 'all 0.2s ease'
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      ) : null}

      {/* Brand logo container */}
      <div className="sgums-sidebar-logo-container" style={{ justifyContent: isCompact ? 'center' : 'flex-start' }}>
        <div className="sgums-sidebar-logo-icon">
          <img src={universityLogo} alt="Logo UPTNT" className="sgums-sidebar-logo-image" />
        </div>
        {!isCompact && (
          <div className="sgums-sidebar-logo-text">
            <span className="sgums-sidebar-title">SGUMS</span>
            <span className="sgums-sidebar-subtitle">{getPortalName()}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sgums-sidebar-nav">
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => {
                  const nestedActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (isActive || nestedActive) ? 'sgums-sidebar-link active' : 'sgums-sidebar-link';
                }}
                style={{
                  justifyContent: isCompact ? 'center' : 'flex-start',
                  padding: isCompact ? '12px' : '12px 16px'
                }}
                onClick={() => {
                  if (onMobileClose) onMobileClose();
                }}
              >
                <div className="sgums-sidebar-link-icon">
                  <Icon size={20} />
                </div>
                {!isCompact && <span className="sgums-sidebar-link-text">{item.name}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Sidebar Footer details */}
      <div className="sgums-sidebar-footer" style={{ alignItems: isCompact ? 'center' : 'stretch' }}>
        {user && !isCompact && (
          <div className="sgums-sidebar-profile">
            <div className="sgums-sidebar-avatar">
              {getInitials()}
            </div>
            <div className="sgums-sidebar-profile-info">
              <span className="sgums-sidebar-profile-name">
                {user.name} {user.lastname}
              </span>
              <span className="sgums-sidebar-profile-role">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {user && isCompact && (
          <div
            className="sgums-sidebar-avatar"
            title={`${user.name} ${user.lastname} (${user.role})`}
            style={{ margin: '8px auto' }}
          >
            {getInitials()}
          </div>
        )}

        {/* Action button container */}
        <div className="sgums-sidebar-footer-actions" style={{ alignItems: isCompact ? 'center' : 'stretch' }}>
          <NavLink
            to="/change-password"
            className={({ isActive }) => 
              `sgums-sidebar-footer-btn${isActive ? ' active' : ''}`
            }
            style={({ isActive }) => ({
              justifyContent: isCompact ? 'center' : 'flex-start',
              color: isActive ? '#ffd100' : undefined,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            })}
            onClick={() => {
              if (onMobileClose) onMobileClose();
            }}
          >
            <KeyRound size={16} />
            {!isCompact && <span>Cambiar Contraseña</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className="sgums-sidebar-footer-btn logout-btn"
            style={{ justifyContent: isCompact ? 'center' : 'flex-start' }}
          >
            <LogOut size={16} />
            {!isCompact && <span>Cerrar Sesión</span>}
          </button>

          <div className="sgums-api-status" style={{ justifyContent: isCompact ? 'center' : 'flex-start', paddingLeft: isCompact ? '0' : '4px' }}>
            <span className="sgums-api-status-dot"></span>
            {!isCompact && <span>ONLINE</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
