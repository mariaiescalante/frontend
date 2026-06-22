import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import universityLogo from '../../assets/logo-uptnt.png';

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const [activePeriod, setActivePeriod] = useState('...');
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function fetchActivePeriod() {
      try {
        const res = await api.get('/periods');
        const periodsList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const active = periodsList.find((p) => p.period_status === 'Activo');
        if (active) {
          setActivePeriod(active.name_period);
        } else if (periodsList.length > 0) {
          setActivePeriod(periodsList[0].name_period);
        } else {
          setActivePeriod('Ninguno');
        }
      } catch (err) {
        console.error('Error fetching active period in navbar:', err);
        setActivePeriod('2026-II');
      }
    }
    fetchActivePeriod();

    window.addEventListener('academic-period-updated', fetchActivePeriod);
    return () => {
      window.removeEventListener('academic-period-updated', fetchActivePeriod);
    };
  }, []);

  // Determine page title dynamically based on active route path
  const getPageTitle = (path) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Portal Académico';
    
    const lastSegment = segments[segments.length - 1];
    
    switch (lastSegment) {
      case 'dashboard':
        return 'Dashboard';
      case 'users':
        return 'Gestión de Usuarios';
      case 'careers':
        return 'Gestión de Carreras';
      case 'pensum':
        return 'Gestión de Pensum';
      case 'periods':
        return 'Períodos Académicos';
      case 'enrollments':
        return 'Gestión de Inscripciones';
      case 'sections':
        return 'Gestión de Secciones';
      case 'teacher-assignment':
        return 'Asignación Docente';
      case 'grades':
        return 'Control de Notas';
      case 'history':
        return 'Historial Académico';
      case 'pre-registrations':
      case 'aspirantes':
        return 'Control de Aspirantes';
      case 'subjects':
        return 'Asignaturas Impartidas';
      case 'students':
        return 'Estudiantes Inscritos';
      case 'records':
        return 'Cerrar Actas';
      case 'teachers':
        return 'Docentes';
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
      {/* Mobile top row: hamburger + brand logo + app name */}
      <div className="sgums-navbar-mobile-top">
        <button type="button" className="sgums-navbar-menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
          <Menu size={20} />
        </button>
        <div className="sgums-navbar-mobile-brand">
          <img src={universityLogo} alt="Logo UPTNT" className="sgums-navbar-mobile-logo" />
          <span className="sgums-navbar-mobile-appname">SGUMS</span>
        </div>
      </div>

      {/* Left side: Page Title, Divider, Cycle Badge */}
      <div className="sgums-navbar-left">
        <h1 className="sgums-navbar-title">
          {getPageTitle(location.pathname)}
        </h1>
        <div className="sgums-navbar-divider"></div>
        <div className="sgums-navbar-ciclo">
          CICLO ACTUAL: <span className="sgums-navbar-badge">{activePeriod}</span>
        </div>
      </div>

      {/* Right side: System Status and Notifications */}
      <div className="sgums-navbar-right">
        <div className="sgums-system-status">
          <span className="sgums-api-status-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Sistema: Operativo</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            className="sgums-navbar-notif" 
            aria-label="Notificaciones"
            onClick={() => setShowNotifications(!showNotifications)}
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
            {unreadCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '10px',
              width: '320px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCheck size={14} /> Marcar todas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No tienes notificaciones
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id_notification}
                      style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: notif.is_read ? '#fff' : '#f0f9ff',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id_notification);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{notif.title}</strong>
                        {!notif.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }}></span>}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>{notif.message}</p>
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
