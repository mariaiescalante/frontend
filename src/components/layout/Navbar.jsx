import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Menu,
  CheckCheck,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  Mail,
  Phone,
  ShieldCheck,
  IdCard,
  GraduationCap,
  Briefcase,
  Pencil,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { Modal, ActionButton, fieldStyle } from '../pages/admin/AdminPageShell';
import { LIMITS, sanitizeEmail, sanitizeDigitsOnly, validateEmailField, validatePhoneField, validateBirthDate, getMaxBirthDate } from '../../utils/validation';
import universityLogo from '../../assets/logo-uptnt.png';

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, refreshProfile, logout, isAdmin, isStudent, isTeacher, isControlEstudios, isGestionAcademica } = useAuth();
  const [activePeriod, setActivePeriod] = useState('...');
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // Estados del menú desplegable y modal de Perfil en el Header
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', phone: '', date_birth: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!user) return 'SG';
    const first = (user.first_name || user.name || '')[0] || '';
    const last = (user.first_lastname || user.lastname || '')[0] || '';
    return (first + last).toUpperCase() || 'SG';
  };

  const getFullName = () => {
    if (!user) return 'Usuario SGUMS';
    const parts = [
      user.first_name || user.name,
      user.second_name,
      user.first_lastname || user.lastname,
      user.second_lastname,
    ].filter(Boolean);
    return parts.join(' ') || 'Usuario SGUMS';
  };

  const formatBirthDate = (rawDate) => {
    if (!rawDate) return 'No registrada';
    const clean = String(rawDate).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setProfileModalOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const openProfileModal = async () => {
    setProfileMenuOpen(false);
    setIsEditingContact(false);
    setContactFeedback(null);
    setContactForm({
      email: user?.email || '',
      phone: user?.phone || '',
      date_birth: user?.date_birth ? String(user.date_birth).split('T')[0] : '',
    });
    setProfileModalOpen(true);
    if (typeof refreshProfile === 'function') {
      try {
        const fresh = await refreshProfile();
        if (fresh) {
          setContactForm({
            email: fresh.email || '',
            phone: fresh.phone || '',
            date_birth: fresh.date_birth ? String(fresh.date_birth).split('T')[0] : '',
          });
        }
      } catch {
        // Mantiene datos actuales en memoria si falla la recarga
      }
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactFeedback(null);

    const cleanEmail = contactForm.email.trim();
    const cleanPhone = contactForm.phone.trim();
    const cleanBirthDate = (contactForm.date_birth || '').trim();

    const emailError = validateEmailField(cleanEmail, true);
    if (emailError) {
      setContactFeedback({ type: 'error', text: emailError });
      return;
    }

    const phoneError = validatePhoneField(cleanPhone, false);
    if (phoneError) {
      setContactFeedback({ type: 'error', text: phoneError });
      return;
    }

    if (cleanBirthDate) {
      const birthError = validateBirthDate(cleanBirthDate, false);
      if (birthError) {
        setContactFeedback({ type: 'error', text: birthError });
        return;
      }
    }

    setSavingContact(true);
    try {
      const payload = {
        email: cleanEmail,
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        ...(cleanBirthDate ? { date_birth: cleanBirthDate } : {}),
      };
      const updated = await api.put('/auth/profile_update', payload);
      if (updated && typeof setUser === 'function') {
        setUser((prev) => ({ ...prev, ...updated }));
      }
      setIsEditingContact(false);
      setContactFeedback({ type: 'success', text: 'Tus datos se actualizaron correctamente.' });
    } catch (err) {
      setContactFeedback({
        type: 'error',
        text: err.message || 'No se pudieron actualizar los datos de contacto.',
      });
    } finally {
      setSavingContact(false);
    }
  };

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
      case 'classrooms':
        return 'Aulas y Espacios';
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

      {/* Right side: System Status, Notifications, and User Profile */}
      <div className="sgums-navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="sgums-system-status">
          <span className="sgums-api-status-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Sistema: Operativo</span>
        </div>

        {/* Campanita de Notificaciones */}
        <div style={{ position: 'relative' }} ref={notifDropdownRef}>
          <button 
            className="sgums-navbar-notif" 
            aria-label="Notificaciones"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setProfileMenuOpen(false);
            }}
            style={{
              background: showNotifications ? '#f1f5f9' : 'transparent',
              border: '1px solid transparent',
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
              borderRadius: '14px',
              boxShadow: '0 14px 35px rgba(15, 23, 42, 0.14)',
              border: '1px solid #e2e8f0',
              zIndex: 80,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCheck size={14} /> Marcar todas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
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
                        <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{notif.title}</strong>
                        {!notif.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }}></span>}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: '1.4' }}>{notif.message}</p>
                      <small style={{ color: '#94a3b8', fontSize: '0.73rem', marginTop: '6px', display: 'block' }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador vertical sutil */}
        {user && (
          <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
        )}

        {/* Botón de Perfil de Usuario en el Header + Menú Desplegable */}
        {user && (
          <div style={{ position: 'relative' }} ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen((prev) => !prev);
                setShowNotifications(false);
              }}
              title="Ver opciones de mi perfil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 4px',
                borderRadius: '12px',
                border: profileMenuOpen ? '1px solid #cbd5e1' : '1px solid transparent',
                background: profileMenuOpen ? '#f1f5f9' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!profileMenuOpen) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!profileMenuOpen) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#0b1c3f',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {getInitials()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {getFullName()}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.role || 'Usuario'}
                </span>
              </div>
              <ChevronDown
                size={14}
                color="#64748b"
                style={{
                  transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  marginLeft: '2px',
                }}
              />
            </button>

            {profileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '250px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '8px',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                  zIndex: 90,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '2px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getFullName()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {user.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openProfileModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <User size={16} color="#051124" />
                  <span>Mi Perfil (Información)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/change-password');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <KeyRound size={16} color="#051124" />
                  <span>Cambiar Contraseña</span>
                </button>

                <div style={{ borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#dc2626',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={16} color="#dc2626" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Información Personal del Usuario */}
      <Modal
        open={profileModalOpen}
        onClose={() => {
          if (!savingContact) {
            setProfileModalOpen(false);
            setIsEditingContact(false);
            setContactFeedback(null);
          }
        }}
        title="Mi Perfil Institucional"
        subtitle="Información personal, credenciales de identificación y datos de contacto registrados en SGUMS."
        footer={
          <>
            <ActionButton
              variant="secondary"
              onClick={() => {
                setProfileModalOpen(false);
                setIsEditingContact(false);
                setContactFeedback(null);
              }}
              disabled={savingContact}
            >
              Cerrar
            </ActionButton>
            {!isEditingContact ? (
              <ActionButton
                variant="accent"
                icon={Pencil}
                onClick={() => {
                  setContactForm({
                    email: user?.email || '',
                    phone: user?.phone || '',
                    date_birth: user?.date_birth ? String(user.date_birth).split('T')[0] : '',
                  });
                  setContactFeedback(null);
                  setIsEditingContact(true);
                }}
              >
                Editar Contacto
              </ActionButton>
            ) : (
              <ActionButton
                variant="accent"
                onClick={handleSaveContact}
                disabled={savingContact}
              >
                {savingContact ? 'Guardando...' : 'Guardar Cambios'}
              </ActionButton>
            )}
          </>
        }
      >
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Encabezado de Perfil limpio y sin degradado */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                padding: '20px 22px',
                borderRadius: '18px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: '#ffd100',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {getInitials()}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    {getFullName()}
                  </h4>
                  <span
                    style={{
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      fontSize: '0.71rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {user.status || 'Activo'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#92400e',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Rol: {user.role || 'Usuario'}
                  </span>
                  {user.username && (
                    <span
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '8px',
                      }}
                    >
                      Usuario: <strong style={{ color: '#0f172a' }}>@{user.username}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Datos Personales en cuadrícula simétrica 2x2 */}
            <div>
              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Datos de Identificación Personal
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IdCard size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Documento de Identidad
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {user.document_id || 'No registrado'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Nombres
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {[user.first_name || user.name, user.second_name].filter(Boolean).join(' ') || 'No registrado'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Apellidos
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {[user.first_lastname || user.lastname, user.second_lastname].filter(Boolean).join(' ') || 'No registrado'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Fecha de Nacimiento
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {formatBirthDate(user.date_birth)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos de Contacto (Lectura o Edición) */}
            <div>
              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Información de Contacto
              </span>
              {!isEditingContact ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef9c3', color: '#a16207', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={17} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Correo Electrónico
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px', wordBreak: 'break-all' }}>
                        {user.email || 'No registrado'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef9c3', color: '#a16207', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Teléfono Móvil
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {user.phone || 'No registrado'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveContact}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    padding: '18px',
                    borderRadius: '16px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Correo Electrónico</span>
                    <input
                      type="email"
                      maxLength={LIMITS.EMAIL_MAX}
                      value={contactForm.email}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, email: sanitizeEmail(e.target.value, LIMITS.EMAIL_MAX) }))}
                      style={fieldStyle}
                      required
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Teléfono Móvil (10-11 dígitos)</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={LIMITS.PHONE_MAX}
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, phone: sanitizeDigitsOnly(e.target.value, LIMITS.PHONE_MAX) }))}
                      placeholder="04141234567"
                      style={fieldStyle}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Fecha de Nacimiento</span>
                    <input
                      type="date"
                      min="1920-01-01"
                      max={getMaxBirthDate(LIMITS.MIN_AGE)}
                      value={contactForm.date_birth || ''}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, date_birth: e.target.value }))}
                      style={fieldStyle}
                    />
                  </label>
                </form>
              )}
            </div>

            {/* Información Académica o Administrativa según el Rol */}
            <div>
              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Ficha Institucional ({user.role || 'Usuario'})
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                }}
              >
                {isStudent && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <GraduationCap size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Carrera Universitaria
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                          {user.career || 'Asignada en expediente'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShieldCheck size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Estado / CUM
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                          {user.academicStatus || 'Regular'} · CUM: {Number(user.cum || 0).toFixed(2)} pts
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isTeacher && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Briefcase size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Título Académico
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                          {user.academic_title || 'Docente Universitario'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '13px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef9c3', color: '#a16207', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <GraduationCap size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Especialidad / Dedicación
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                          {user.expertise || 'Docencia Universitaria'}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(isAdmin || isControlEstudios || isGestionAcademica) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.71rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Nivel de Autorización
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {isAdmin
                          ? 'Acceso Total Administrativo y Respaldo de Base de Datos'
                          : `Gestión Institucional — ${user.role}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {contactFeedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: contactFeedback.type === 'success' ? '#ecfdf5' : '#fff1f2',
                  border: `1px solid ${contactFeedback.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
                  color: contactFeedback.type === 'success' ? '#065f46' : '#9f1239',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{contactFeedback.text}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </header>
  );
}
