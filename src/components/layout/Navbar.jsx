import React from 'react';
import useAuth from '../../hooks/useAuth';
import { LogOut, User, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header
      className="glass-panel"
      style={{
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
            <div
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
            </div>
          </div>
        )}

        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-pink)';
            e.currentTarget.style.color = 'var(--accent-pink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
