import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound, AlertTriangle, BadgeCheck, LockKeyhole } from 'lucide-react';
import { changePassword } from '../../services/auth';
import useAuth from '../../hooks/useAuth';
import { AdminPageShell, SectionCard, ActionButton, StatusBadge } from './admin/AdminPageShell';

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
    <AdminPageShell
      eyebrow="Seguridad"
      title="Cambiar Contraseña"
      subtitle={user ? `Usuario: ${user.name || ''} ${user.lastname || ''} · Actualiza tu clave de acceso de manera segura.` : 'Actualiza tu clave de acceso desde el panel autenticado.'}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <SectionCard
          title="Seguridad de la Cuenta"
          description="Detalles técnicos y recomendaciones sobre la actualización de tu clave."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InfoRow icon={<ShieldCheck size={18} />} title="Token activo" text="Se adjunta automáticamente en la petición protegida." />
            <InfoRow icon={<LockKeyhole size={18} />} title="Contraseña actual" text="Debes escribir tu clave actual para confirmar el cambio." />
            <InfoRow icon={<BadgeCheck size={18} />} title="Redirección" text="Al completar el cambio, la sesión se cerrará por seguridad." />
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <ActionButton variant="secondary">
                  <ArrowLeft size={16} /> Volver al Dashboard
                </ActionButton>
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Formulario de Actualización"
          description="Escribe tu clave actual y tu nueva clave para continuar."
        >
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#fff1f2',
                color: '#b91c1c',
                fontSize: '0.88rem',
                border: '1px solid #fecdd3',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#065f46',
                fontSize: '0.88rem',
                border: '1px solid #a7f3d0',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <BadgeCheck size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
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

            <ActionButton
              type="submit"
              variant="accent"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '10px',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </ActionButton>
          </form>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}

function PasswordField({ id, label, value, onChange, showValue, onToggle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: '0.8rem',
          fontWeight: '700',
          color: '#64748b'
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
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '13px 44px 13px 16px',
            fontSize: '13.5px',
            color: '#0f172a',
            fontFamily: "var(--font-body)",
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.2s ease'
          }}
          onFocus={(event) => (event.target.style.borderColor = '#051124')}
          onBlur={(event) => (event.target.style.borderColor = '#cbd5e1')}
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
            color: '#94a3b8'
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
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
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
          background: 'rgba(5, 17, 36, 0.08)',
          color: '#051124',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: '700', fontSize: '0.9rem', margin: '0 0 4px 0', color: '#0f172a' }}>{title}</p>
        <span style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>{text}</span>
      </div>
    </div>
  );
}