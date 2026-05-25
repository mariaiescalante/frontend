import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Mail, ShieldCheck } from 'lucide-react';
import { requestPasswordReset } from '../../services/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const sanitizedEmail = email.trim();
    if (!sanitizedEmail) {
      setError('Ingresa tu correo institucional para continuar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await requestPasswordReset(sanitizedEmail);
      const message = response?.message || 'Si el correo existe, recibirás las instrucciones para recuperar tu contraseña.';
      setSuccess(message);
      setEmail('');
    } catch (requestError) {
      setError(requestError.message || 'No fue posible procesar la solicitud.');
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
          boxSizing: 'border-box'
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
            Recuperar acceso
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
            Ingresa tu correo institucional para recibir instrucciones de recuperación.
          </p>
        </div>

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
              lineHeight: 1.4
            }}
          >
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
              lineHeight: 1.4
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: '700',
                color: '#2d3748'
              }}
            >
              Correo institucional
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="email"
                type="email"
                placeholder="tu-correo@universidad.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
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
              <Mail
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

          <button
            type="submit"
            disabled={loading}
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
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
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
            color: '#718096'
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
            <ArrowLeft size={14} />
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
          Si no recibes el correo, revisa spam o contacta soporte.
        </p>
      </div>
    </div>
  );
}