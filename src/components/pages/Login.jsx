import React, { useState } from 'react';
import { GraduationCap, User, Eye, EyeOff, ShieldAlert, LifeBuoy } from 'lucide-react';

export default function Login() {
  // states to bind field values
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // minimal form submission placeholder as requested
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Beautiful classic dark navy color overlay over a university building photo (using Unsplash academic backdrop)
        background: `linear-gradient(rgba(11, 28, 63, 0.88), rgba(11, 28, 63, 0.88)), url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)',
          padding: '44px 40px 32px 40px',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Academic Hat Logo (Birrete) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#0b1c3f',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(11, 28, 63, 0.2)'
            }}
          >
            <GraduationCap size={32} color="#ffffff" strokeWidth={1.5} />
          </div>
        </div>

        {/* Header Titles */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontSize: '2.1rem',
              fontWeight: '800',
              color: '#0b1c3f',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em'
            }}
          >
            SGUMS
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: '500',
              color: '#718096',
              lineHeight: '1.5',
              margin: 0,
              maxWidth: '320px',
              display: 'inline-block'
            }}
          >
            Universidad Politécnica Territorial del Norte del Táchira<br />
            Manuela Sáenz
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label
              htmlFor="usuario"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                color: '#2d3748'
              }}
            >
              Usuario
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="usuario"
                type="text"
                placeholder="Ingrese su usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '13px 44px 13px 16px',
                  fontSize: '13.5px',
                  color: '#1e293b',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0b1c3f')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              <User
                size={18}
                color="#a0aec0"
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label
              htmlFor="contrasena"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                color: '#2d3748'
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="contrasena"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '13px 44px 13px 16px',
                  fontSize: '13.5px',
                  color: '#1e293b',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0b1c3f')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#a0aec0'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              marginTop: '4px'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4a5568',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                style={{
                  accentColor: '#0b1c3f',
                  cursor: 'pointer',
                  width: '15px',
                  height: '15px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}
              />
              Recordarme
            </label>
            <a
              href="#forgot"
              style={{
                color: '#2b6cb0',
                fontWeight: '600',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.target.style.color = '#1a365d')}
              onMouseLeave={(e) => (e.target.style.color = '#2b6cb0')}
            >
              Olvidé mi contraseña
            </a>
          </div>

          {/* Yellow Action Button */}
          <button
            type="submit"
            style={{
              background: '#facc15',
              color: '#0b1c3f',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '700',
              fontSize: '14.5px',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              boxShadow: '0 4px 10px rgba(250, 204, 21, 0.25)',
              transition: 'background-color 0.2s, transform 0.1s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eab308';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#facc15';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Iniciar Sesión
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'inline-block' }}
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        </form>

        {/* Footer info inside the white card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid #edf2f7',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: '#718096'
          }}
        >
          {/* SSL indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} color="#718096" />
            <span>Conexión Segura (SSL)</span>
          </div>

          {/* Technical support */}
          <a
            href="#support"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#718096',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => (e.target.style.color = '#2d3748')}
            onMouseLeave={(e) => (e.target.style.color = '#718096')}
          >
            <LifeBuoy size={14} />
            <span>Soporte Técnico</span>
          </a>
        </div>
      </div>
    </div>
  );
}
