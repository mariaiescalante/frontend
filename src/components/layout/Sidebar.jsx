import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  KeyRound,
  LogOut,
  School,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Award,
  Calendar,
  ClipboardCheck,
  Layers,
  UserCheck,
  History
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isAdmin, isStudent, isTeacher } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      visible: true
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
      path: '/admin/history',
      name: 'Historial',
      icon: History,
      visible: isAdmin
    }
  ];

  return (
    <aside
      className="sgums-sidebar"
      style={{
        width: collapsed ? '80px' : '280px',
        minWidth: collapsed ? '80px' : '280px'
      }}
    >
      {/* Collapse Button */}
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

      {/* Brand logo container */}
      <div className="sgums-sidebar-logo-container" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div className="sgums-sidebar-logo-icon">
          <School size={24} />
        </div>
        {!collapsed && (
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
                  const isDashboardActive = item.path === '/dashboard' && location.pathname.includes('dashboard');
                  const isAdminDashboardActive = item.path === '/admin/dashboard' && location.pathname.startsWith('/admin/dashboard');
                  return (isActive || isDashboardActive || isAdminDashboardActive) ? 'sgums-sidebar-link active' : 'sgums-sidebar-link';
                }}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px' : '12px 16px'
                }}
              >
                <div className="sgums-sidebar-link-icon">
                  <Icon size={20} />
                </div>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Sidebar Footer details */}
      <div className="sgums-sidebar-footer" style={{ alignItems: collapsed ? 'center' : 'stretch' }}>
        {user && !collapsed && (
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

        {user && collapsed && (
          <div
            className="sgums-sidebar-avatar"
            title={`${user.name} ${user.lastname} (${user.role})`}
            style={{ margin: '8px auto' }}
          >
            {getInitials()}
          </div>
        )}

        {/* Action button container */}
        <div className="sgums-sidebar-footer-actions" style={{ alignItems: collapsed ? 'center' : 'stretch' }}>
          <NavLink
            to="/change-password"
            className={({ isActive }) => 
              `sgums-sidebar-footer-btn${isActive ? ' active' : ''}`
            }
            style={({ isActive }) => ({
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: isActive ? '#ffd100' : undefined,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            })}
          >
            <KeyRound size={16} />
            {!collapsed && <span>Cambiar Contraseña</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className="sgums-sidebar-footer-btn logout-btn"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <LogOut size={16} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>

          <div className="sgums-api-status" style={{ justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? '0' : '4px' }}>
            <span className="sgums-api-status-dot"></span>
            {!collapsed && <span>ONLINE</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
