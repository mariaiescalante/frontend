import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import api from '../../services/api';

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const [activePeriod, setActivePeriod] = useState('...');

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
      <button type="button" className="sgums-navbar-menu-btn" onClick={onMenuClick} aria-label="Abrir menú">
        <Menu size={20} />
      </button>

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
