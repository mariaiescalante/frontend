import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import StitchMascot from '../../assets/StitchMascot';
import { LogIn, KeyRound, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // If already authenticated, redirect to Dashboard immediately
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!username.trim() || !password.trim()) {
      setLocalError('Por favor ingresa usuario y contraseña');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Error de inicio de sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1b1933 0%, var(--bg-primary) 100%)',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 30px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px'
        }}
      >
        {/* Animated Stitch Coder Logo */}
        <StitchMascot size={110} className="stitch-glow-logo" />
        
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.85rem',
            fontWeight: '700',
            marginTop: '16px',
            marginBottom: '6px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-pink))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Iniciar Sesión
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Portal Académico del Estudiante y Docente
        </p>

        {/* Feedback Messages */}
        {(localError || authError) && (
          <div
            style={{
              background: 'rgba(255, 94, 151, 0.1)',
              border: '1px solid rgba(255, 94, 151, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--accent-pink)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={18} style={{ minWidth: '18px' }} />
            <span>{localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario o Correo</label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                style={{ width: '100%', paddingLeft: '46px' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <KeyRound
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                style={{ width: '100%', paddingLeft: '46px' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: '10px',
              padding: '14px',
              fontSize: '1rem'
            }}
          >
            {submitting ? 'Verificando datos...' : 'Ingresar al Portal'}
            {!submitting && <LogIn size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>¿Olvidaste tu contraseña? Contacta al administrador</p>
        </div>
      </div>
    </div>
  );
}
