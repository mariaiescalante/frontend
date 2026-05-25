import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { KeyRound, LogOut, User, BookOpen, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChangePassword = () => {
    setMenuOpen(false);
    navigate('/change-password');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="glass-panel"
      style={{
        position: 'relative',
        zIndex: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderRadius: '0 0 16px 16px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        backgroundColor: 'var(--bg-glass)',
        marginBottom: '20px'
      }}
    >
      {/* Left side info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            background: 'rgba(0, 229, 255, 0.1)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <BookOpen size={20} color="var(--accent-cyan)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>
            Portal Académico
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Período Activo: 2026-I
          </span>
        </div>
      </div>

      {/* Right side Profile & Logout */}
      <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {user.name} {user.lastname}
              </p>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--accent-pink)',
                  background: 'rgba(255, 94, 151, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                {user.role}
              </span>
            </div>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.1)'
              }}
            >
              <User size={18} color="#000" />
            </button>
          </div>
        )}

        {menuOpen && user && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: '58px',
              right: 0,
              minWidth: '220px',
              background: 'rgba(10, 12, 24, 0.98)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
              padding: '8px',
              zIndex: 60,
              backdropFilter: 'blur(14px)'
            }}
          >
            <button
              type="button"
              onClick={handleChangePassword}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                transition: 'var(--transition)',
                textAlign: 'left'
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'rgba(0, 229, 255, 0.08)';
                event.currentTarget.style.color = 'var(--accent-cyan)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
                event.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={16} />
                Cambiar contraseña
              </span>
              <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                transition: 'var(--transition)',
                textAlign: 'left'
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'rgba(255, 94, 151, 0.08)';
                event.currentTarget.style.color = 'var(--accent-pink)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
                event.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LogOut size={16} />
                Salir
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
