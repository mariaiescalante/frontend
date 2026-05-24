import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import StitchMascot from '../../assets/StitchMascot';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin, isStudent, isTeacher } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Define sidebar menu options based on role
  const menuItems = [
    {
      path: '/dashboard',
      name: 'Panel General',
      icon: LayoutDashboard,
      visible: true
    },
    {
      path: '/students',
      name: 'Estudiantes',
      icon: GraduationCap,
      visible: isAdmin || isTeacher
    },
    {
      path: '/teachers',
      name: 'Docentes',
      icon: Users,
      visible: isAdmin
    },
    {
      path: '/subjects',
      name: 'Materias y Secciones',
      icon: BookOpen,
      visible: true
    },
    {
      path: '/registrations',
      name: 'Inscripciones',
      icon: ClipboardList,
      visible: isAdmin || isStudent
    },
    {
      path: '/documents',
      name: 'Solicitud Documentos',
      icon: FileText,
      visible: true
    }
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: collapsed ? '80px' : '260px',
        minWidth: collapsed ? '80px' : '260px',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 40px)',
        margin: '20px 0 20px 20px',
        padding: '24px 16px',
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'var(--bg-glass)'
      }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: '-14px',
          top: '32px',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)',
          color: '#000'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand Mascot Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '36px',
          textAlign: 'center',
          overflow: 'hidden'
        }}
      >
        <StitchMascot size={collapsed ? 48 : 88} />
        {!collapsed && (
          <div>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}
            >
              Stitch Académico
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              SISTEMA ACADÉMICO V1.0
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 229, 255, 0.15)' : '1px solid transparent',
                  transition: 'var(--transition)',
                  fontWeight: isActive ? '600' : '400',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={20} style={{ minWidth: '20px' }} />
                {!collapsed && <span style={{ fontSize: '0.9rem' }}>{item.name}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Bottom Footer Details */}
      {!collapsed && (
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)'
          }}
        >
          <p>Conectado a la API</p>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>ONLINE</span>
        </div>
      )}
    </aside>
  );
}
