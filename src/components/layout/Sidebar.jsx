import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
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
  Users
} from 'lucide-react';
import universityLogo from '../../assets/logo-uptnt.png';

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { user, logout, isAdmin, isStudent, isTeacher } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    return 'PORTAL ACADÉMICO';
  };

  const getInitials = () => {
    if (!user) return 'SG';
    const first = user.name ? user.name[0] : '';
    const last = user.lastname ? user.lastname[0] : '';
    return (first + last).toUpperCase();
  };

  // Sidebar navigation menu items based on role
  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: isAdmin
    },
    {
      path: '/admin/users',
      name: 'Usuarios',
      icon: UserCog,
      visible: isAdmin
    },
    {
      path: '/admin/careers',
      name: 'Carreras',
      icon: Award,
      visible: isAdmin
    },
    {
      path: '/admin/pensum',
      name: 'Pensum',
      icon: BookOpen,
      visible: isAdmin
    },
    {
      path: '/admin/periods',
      name: 'Períodos',
      icon: Calendar,
      visible: isAdmin
    },
    {
      path: '/admin/enrollments',
      name: 'Inscripciones',
      icon: ClipboardCheck,
      visible: isAdmin
    },
    {
      path: '/admin/sections',
      name: 'Secciones',
      icon: Layers,
      visible: isAdmin
    },
    {
      path: '/admin/teacher-assignment',
      name: 'Asignación Docente',
      icon: UserCheck,
      visible: isAdmin
    },
    {
      path: '/admin/grades',
      name: 'Notas',
      icon: ClipboardList,
      visible: isAdmin
    },
    {
      path: '/admin/pre-registrations',
      name: 'Aspirantes',
      icon: Users,
      visible: isAdmin
    },
    {
      path: '/admin/history',
      name: 'Historial',
      icon: History,
      visible: isAdmin
    },
    {
      path: '/teacher/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: isTeacher
    },
    {
      path: '/teacher/subjects',
      name: 'Asignaturas Impartidas',
      icon: BookOpen,
      visible: isTeacher
    },
    {
      path: '/teacher/students',
      name: 'Estudiantes Inscritos',
      icon: Users,
      visible: isTeacher
    },
    {
      path: '/teacher/records',
      name: 'Cerrar Actas',
      icon: FileLock2,
      visible: isTeacher
    },
    {
      path: '/teacher/history',
      name: 'Historial Impartido',
      icon: History,
      visible: isTeacher
    },
    {
      path: '/student/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      visible: isStudent
    },
    {
      path: '/student/profile',
      name: 'Datos Personales',
      icon: UserCog,
      visible: isStudent
    },
    {
      path: '/student/pensum',
      name: 'Pensum de Estudios',
      icon: BookOpen,
      visible: isStudent
    },
    {
      path: '/student/enrollment',
      name: 'Inscripción de Materias',
      icon: ClipboardCheck,
      visible: isStudent
    },
    {
      path: '/student/schedule',
      name: 'Mi Horario',
      icon: Calendar,
      visible: isStudent
    },
    {
      path: '/student/record',
      name: 'Récord Académico',
      icon: History,
      visible: isStudent
    },
    {
      path: '/student/documents',
      name: 'Constancias y Reportes',
      icon: FileLock2,
      visible: isStudent
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
