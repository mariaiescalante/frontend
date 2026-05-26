import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ShieldCheck, KeyRound, AlertTriangle, BadgeCheck } from 'lucide-react';
import { resetPassword } from '../../services/auth';

const getTokenFromSearch = (search) => {
  const params = new URLSearchParams(search);
  return params.get('token') || params.get('resetToken') || params.get('recoveryToken') || '';
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getTokenFromSearch(location.search).trim();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedNew = newPassword.trim();
    const normalizedConfirm = confirmPassword.trim();

    if (!token) {
      setError('El enlace de recuperación no incluye un token válido. Solicita uno nuevo.');
      return;
    }

    if (!normalizedNew || !normalizedConfirm) {
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
      const response = await resetPassword({
        token,
        newPassword: normalizedNew,
        confirmPassword: normalizedConfirm,
      });

      const message = response?.message || 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.';
      setSuccess(message);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (requestError) {
      setError(requestError.message || 'No fue posible actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
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

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            Restablecer contraseña
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: '500',
              color: '#718096',
              lineHeight: '1.5',
              margin: 0
            }}
          >
            Crea una nueva clave segura para volver a entrar al sistema.
          </p>
        </div>

        {!token && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fff7ed',
              color: '#9a3412',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              border: '1px solid #fed7aa',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertTriangle size={16} />
            El enlace no incluye el token de recuperación. Solicita uno nuevo desde &quot;Olvidé mi contraseña&quot;.
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fff1f2',
              color: '#9f1239',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              border: '1px solid #fecdd3',
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
              background: '#ecfdf5',
              color: '#166534',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              border: '1px solid #bbf7d0',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            showValue={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
          />

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              background: '#facc15',
              color: '#0b1c3f',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '700',
              fontSize: '14.5px',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              boxShadow: '0 4px 10px rgba(250, 204, 21, 0.25)',
              transition: 'background-color 0.2s, transform 0.1s',
              opacity: loading || !token ? 0.75 : 1,
              cursor: loading || !token ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #edf2f7',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: '#718096',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#718096" />
            <span>Proceso seguro</span>
          </div>

          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2b6cb0',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <KeyRound size={14} />
            Volver al login
          </Link>
        </div>

        <p
          style={{
            marginTop: '14px',
            fontSize: '11px',
            color: '#718096',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.5
          }}
        >
          Si no recibes el correo, revisa spam o solicita un nuevo enlace.
        </p>
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
          autoComplete="new-password"
          required
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
          onFocus={(event) => (event.target.style.borderColor = '#0b1c3f')}
          onBlur={(event) => (event.target.style.borderColor = '#e2e8f0')}
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
            color: '#a0aec0'
          }}
        >
          {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}