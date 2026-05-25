import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  // Determine page title dynamically based on active route path
  const getPageTitle = (path) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Portal Académico';
    
    const lastSegment = segments[segments.length - 1];
    
    switch (lastSegment) {
      case 'dashboard':
        return 'Dashboard';
      case 'students':
        return 'Estudiantes';
      case 'teachers':
        return 'Docentes';
      case 'subjects':
        return 'Asignaturas';
      case 'registrations':
        return 'Inscripciones';
      case 'documents':
        return 'Solicitud Documentos';
      case 'change-password':
        return 'Cambiar Contraseña';
      default:
        return 'Portal Académico';
    }
  };

  return (
    <header className="sgums-navbar">
      {/* Left side: Page Title, Divider, Cycle Badge */}
      <div className="sgums-navbar-left">
        <h1 className="sgums-navbar-title">
          {getPageTitle(location.pathname)}
        </h1>
        <div className="sgums-navbar-divider"></div>
        <div className="sgums-navbar-ciclo">
          CICLO ACTUAL: <span className="sgums-navbar-badge">2026-II</span>
        </div>
      </div>

      {/* Right side: System Status and Notifications */}
      <div className="sgums-navbar-right">
        <div className="sgums-system-status">
          <span className="sgums-api-status-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Sistema: Operativo</span>
        </div>
        <button 
          className="sgums-navbar-notif" 
          aria-label="Notificaciones"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <Bell size={20} />
          <span 
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444'
            }}
          />
        </button>
      </div>
    </header>
  );
}
