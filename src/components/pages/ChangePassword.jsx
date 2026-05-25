import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound, AlertTriangle, BadgeCheck, LockKeyhole } from 'lucide-react';
import { changePassword } from '../../services/auth';
import useAuth from '../../hooks/useAuth';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout, user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedCurrent = currentPassword.trim();
    const normalizedNew = newPassword.trim();
    const normalizedConfirm = confirmPassword.trim();

    if (!normalizedCurrent || !normalizedNew || !normalizedConfirm) {
      setError('Completa todos los campos para continuar.');
      return;
    }

    if (normalizedNew.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (normalizedNew !== normalizedConfirm) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await changePassword({
        currentPassword: normalizedCurrent,
        newPassword: normalizedNew,
        confirmPassword: normalizedConfirm,
      });

      const message = response?.message || 'Contraseña actualizada correctamente.';
      setSuccess(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 1200);
    } catch (requestError) {
      if (requestError.status === 401) {
        setError('Tu sesión expiró. Vuelve a iniciar sesión.');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message || 'No fue posible actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <KeyRound size={24} color="#000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.9rem', marginBottom: '6px' }}>Cambiar contraseña</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {user ? `${user.name || ''} ${user.lastname || ''}`.trim() : 'Actualiza tu clave desde el panel autenticado.'}
              </p>
            </div>
          </div>

          <span className="status-badge active">Sesión activa</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 520px)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        <section className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Seguridad de la cuenta</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Esta acción se ejecuta con la sesión actual y usa el token almacenado para validar el cambio.
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow icon={<ShieldCheck size={16} />} title="Token activo" text="Se adjunta automáticamente en la petición protegida." />
            <InfoRow icon={<LockKeyhole size={16} />} title="Contraseña actual" text="Debes escribir tu clave actual para confirmar el cambio." />
            <InfoRow icon={<BadgeCheck size={16} />} title="Redirección" text="Al completar el cambio, la sesión se cierra por seguridad." />
          </div>

          <div
            style={{
              marginTop: '22px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Navegación rápida</p>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <ArrowLeft size={14} />
              Volver al dashboard
            </Link>
          </div>
        </section>

        <section className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '18px' }}>Formulario de actualización</h3>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 94, 151, 0.08)',
                color: '#ff9db8',
                fontSize: '13px',
                border: '1px solid rgba(255, 94, 151, 0.25)',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 229, 255, 0.08)',
                color: 'var(--accent-cyan)',
                fontSize: '13px',
                border: '1px solid rgba(0, 229, 255, 0.18)',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <BadgeCheck size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <PasswordField
              id="current-password"
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              showValue={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((value) => !value)}
            />

            <PasswordField
              id="new-password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              showValue={showNewPassword}
              onToggle={() => setShowNewPassword((value) => !value)}
            />

            <PasswordField
              id="confirm-password"
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showValue={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                justifyContent: 'center',
                marginTop: '6px',
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, showValue, onToggle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: '700',
          color: '#2d3748'
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id={id}
          type={showValue ? 'text' : 'password'}
          placeholder="••••••••"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={
            id === 'current-password' ? 'current-password' : 'new-password'
          }
          required
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '13px 44px 13px 16px',
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'var(--transition)'
          }}
          onFocus={(event) => (event.target.style.borderColor = 'var(--accent-cyan)')}
          onBlur={(event) => (event.target.style.borderColor = 'var(--border-color)')}
        />
        <button
          type="button"
          onClick={onToggle}
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
            color: 'var(--text-muted)'
          }}
        >
          {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, title, text }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: 'rgba(0, 229, 255, 0.08)',
          color: 'var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</p>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{text}</span>
      </div>
    </div>
  );
}