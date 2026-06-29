import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import http from '../services/api';

const getSaludo = (roleId, nombre) => ({
  1: `¡Bienvenido ${nombre} al asistente de administracion del SGUMS! ¿En que puedo ayudarte con la gestion de usuarios, periodos academicos o configuracion del sistema?`,
  2: `¡Bienvenido ${nombre} al asistente para docentes del SGUMS! ¿Necesitas ayuda con la carga de actas de notas o la gestion de tus secciones?`,
  3: `¡Hola ${nombre}! Soy el asistente del SGUMS. Puedo ayudarte a consultar tu pensum, inscripciones, notas y mas. ¿Que necesitas?`,
}[roleId]);

const ROLE_LABELS = {
  1: 'Asistente Admin',
  2: 'Asistente Docente',
  3: 'Asistente Estudiantil',
};

const ROLE_THEME = {
  1: { bar: 'var(--accent-cyan)', glow: 'rgba(0, 229, 255, 0.3)' },
  2: { bar: '#ffd100', glow: 'rgba(255, 209, 0, 0.3)' },
  3: { bar: 'var(--accent-pink)', glow: 'rgba(255, 94, 151, 0.3)' },
};

export default function ChatbotUniversitario({ roleId = 3, userName = '' }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const mensajesRef = useRef(null);
  const inputRef = useRef(null);
  const theme = ROLE_THEME[roleId] || ROLE_THEME[3];

  useEffect(() => {
    const nombre = userName?.trim() || (roleId === 1 ? 'Administrador' : roleId === 2 ? 'Docente' : 'Estudiante');
    setMensajes([
      { emisor: 'bot', texto: getSaludo(roleId, nombre) },
    ]);
  }, [roleId, userName]);

  useEffect(() => {
    mensajesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [abierto]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || cargando) return;

    setInput('');
    setMensajes((prev) => [...prev, { emisor: 'usuario', texto }]);
    setCargando(true);

    try {
      const data = await http.post('/chatbot/consultar', {
        mensaje: texto,
        roleId,
        nombre: userName,
      });
      setMensajes((prev) => [
        ...prev,
        { emisor: 'bot', texto: data.respuesta || 'No entendi tu consulta.' },
      ]);
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          emisor: 'bot',
          texto:
            err?.data?.error ||
            err?.message ||
            'Ocurrio un error al procesar tu consulta. Intenta de nuevo.',
        },
      ]);
    } finally {
      setCargando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 229, 255, 0.2)',
          background: 'linear-gradient(135deg, #0a1628, #051124)',
          color: 'var(--accent-cyan)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(0, 229, 255, 0.1)',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.4), inset 0 1px 0 rgba(0, 229, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(0, 229, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.2)';
        }}
        aria-label="Abrir chat"
      >
        {abierto ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {abierto && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: '320px',
            height: '480px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
          }}
          className="chatbot-window"
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(5, 17, 36, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={18} color="#000" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {ROLE_LABELS[roleId] || 'Asistente SGUMS'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '2px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  En linea
                </span>
              </div>
            </div>
            <div
              style={{
                width: '3px',
                height: '30px',
                borderRadius: '2px',
                background: theme.bar,
                boxShadow: `0 0 8px ${theme.glow}`,
                flexShrink: 0,
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
            className="chatbot-messages"
          >
            {mensajes.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.emisor === 'usuario' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius:
                    msg.emisor === 'usuario'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                  background:
                    msg.emisor === 'usuario'
                      ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))'
                      : 'rgba(255, 255, 255, 0.04)',
                  border:
                    msg.emisor === 'usuario'
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                  color: msg.emisor === 'usuario' ? '#000' : 'var(--text-primary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-line',
                  boxShadow:
                    msg.emisor === 'usuario'
                      ? '0 2px 8px rgba(0, 229, 255, 0.2)'
                      : '0 1px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                {msg.texto}
              </div>
            ))}

            {cargando && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Loader2
                  size={14}
                  style={{
                    animation: 'chatbotSpin 1s linear infinite',
                    color: 'var(--accent-cyan)',
                  }}
                />
                Pensando...
              </div>
            )}

            <div ref={mensajesRef} />
          </div>

          <div
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(5, 17, 36, 0.4)',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              disabled={cargando}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 229, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: 'none',
                background:
                  cargando || !input.trim()
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                color: cargando || !input.trim() ? 'var(--text-muted)' : '#000',
                cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow:
                  cargando || !input.trim()
                    ? 'none'
                    : '0 2px 8px rgba(0, 229, 255, 0.2)',
              }}
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatbotSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .chatbot-window {
          animation: chatbotFadeIn 0.2s ease-out;
        }

        @keyframes chatbotFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chatbot-messages::-webkit-scrollbar {
          width: 4px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: var(--accent-cyan);
          box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
        }

        @media (min-width: 640px) {
          .chatbot-window {
            width: 384px !important;
          }
        }
      `}</style>
    </>
  );
}
