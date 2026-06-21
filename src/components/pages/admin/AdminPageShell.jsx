import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

const tonePalette = {
  primary: {
    background: 'rgba(5, 17, 36, 0.08)',
    text: '#051124',
    border: 'rgba(5, 17, 36, 0.15)'
  },
  success: {
    background: 'rgba(34, 197, 94, 0.12)',
    text: '#15803d',
    border: 'rgba(34, 197, 94, 0.2)'
  },
  warning: {
    background: 'rgba(255, 209, 0, 0.18)',
    text: '#7c5a00',
    border: 'rgba(255, 209, 0, 0.28)'
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.12)',
    text: '#b91c1c',
    border: 'rgba(239, 68, 68, 0.2)'
  },
  info: {
    background: 'rgba(59, 130, 246, 0.12)',
    text: '#1d4ed8',
    border: 'rgba(59, 130, 246, 0.2)'
  },
  neutral: {
    background: '#f8fafc',
    text: '#475569',
    border: '#e2e8f0'
  }
};

export const fieldStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '12px 14px',
  color: '#0f172a',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.2s ease'
};

export const sectionCardStyle = {
  background: '#ffffff',
  border: '1px solid #dbe4f0',
  borderRadius: '18px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  overflow: 'visible'
};

export function StatusBadge({ children, tone = 'neutral', style }) {
  const palette = tonePalette[tone] || tonePalette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 10px',
        borderRadius: '999px',
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: palette.background,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {children}
    </span>
  );
}

export function ActionButton({ variant = 'primary', children, style, ...props }) {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #051124 0%, #17315a 100%)',
      color: '#ffffff',
      border: '1px solid #051124'
    },
    accent: {
      background: 'linear-gradient(135deg, #ffd100 0%, #f5c400 100%)',
      color: '#051124',
      border: '1px solid #f5c400'
    },
    secondary: {
      background: '#ffffff',
      color: '#051124',
      border: '1px solid #cbd5e1'
    },
    ghost: {
      background: 'transparent',
      color: '#475569',
      border: '1px solid #e2e8f0'
    },
    danger: {
      background: '#fff1f2',
      color: '#b91c1c',
      border: '1px solid #fecdd3'
    }
  };

  const selected = variants[variant] || variants.primary;

  return (
    <button
      type="button"
      {...props}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '12px',
        padding: '11px 16px',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: variant === 'accent' ? '0 8px 20px rgba(255, 209, 0, 0.22)' : 'none',
        ...selected,
        ...style
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-1px)';
        if (variant === 'accent') {
          event.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 209, 0, 0.3)';
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        if (variant === 'accent') {
          event.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 209, 0, 0.22)';
        }
      }}
    >
      {children}
    </button>
  );
}

export function MetricCard({ label, value, hint, icon: Icon, tone = 'primary' }) {
  const palette = tonePalette[tone] || tonePalette.primary;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        background: '#ffffff',
        border: `1px solid ${palette.border}`,
        borderTop: `4px solid ${palette.text}`,
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        minHeight: '132px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
          </span>
          <span style={{ fontSize: '1.85rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#0f172a', lineHeight: 1.05 }}>
            {value}
          </span>
        </div>
        {Icon ? (
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: palette.background, color: palette.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {hint ? <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>{hint}</p> : null}
    </div>
  );
}

export function AdminPageShell({ eyebrow = 'Panel administrativo', title, subtitle, actions, metrics = [], children }) {
  return (
    <div className="admin-page-shell" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <section
        className="glass-panel admin-page-shell-hero"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '28px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #051124 0%, #0d2141 50%, #17315a 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(5, 17, 36, 0.18)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-40px auto auto -20px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 209, 0, 0.28) 0%, rgba(255, 209, 0, 0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 'auto -30px -50px auto',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(59, 130, 246, 0) 68%)',
            pointerEvents: 'none'
          }}
        />
          <div className="admin-page-shell-hero-content" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="admin-page-shell-hero-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
              <div className="admin-page-shell-hero-copy" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '760px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content', padding: '6px 12px', borderRadius: '999px', background: 'rgba(255, 209, 0, 0.16)', color: '#ffd100', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {eyebrow}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3.8vw, 2.05rem)', fontWeight: 800, lineHeight: 1.08 }}>
                  {title}
                </h2>
                {subtitle ? (
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.98rem', lineHeight: 1.65, maxWidth: '66ch' }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
              {actions ? <div className="admin-page-shell-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}>{actions}</div> : null}
          </div>
        </div>
      </section>

      {metrics.length ? (
          <section className="admin-page-shell-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>
      ) : null}

      {children}
    </div>
  );
}

export function SectionCard({ title, description, actions, children, style, className = '' }) {
  return (
    <section className={`glass-panel admin-section-card ${className}`.trim()} style={{ ...sectionCardStyle, padding: '0', ...style }}>
      {(title || description || actions) ? (
        <header className="admin-section-card-header" style={{ padding: '22px 24px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {title ? <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>{title}</h3> : null}
            {description ? <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55 }}>{description}</p> : null}
          </div>
          {actions ? <div className="admin-section-card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>{actions}</div> : null}
        </header>
      ) : null}
      <div className="admin-section-card-body" style={{ padding: '24px' }}>{children}</div>
    </section>
  );
}

export function DataTable({ columns, children }) {
  return (
    <div className="custom-table-container" style={{ borderRadius: '14px' }}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({ open, title, subtitle, onClose, children, footer }) {
  // Lock body scroll while modal is open (prevents Android background bleed)
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  // Mount the modal directly on body via portal — no stacking context issues
  return ReactDOM.createPortal(
    <div
      className="sgums-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        paddingTop: '16px',
        zIndex: 9999,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={onClose}
    >
      <div
        className="custom-modal-scrollbar"
        style={{
          width: 'min(920px, 100%)',
          maxHeight: 'none',
          background: '#ffffff',
          border: '1px solid #dbe4f0',
          borderRadius: '22px',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
          marginBottom: '16px',
          flexShrink: 0,
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header style={{ padding: '22px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{title}</h3>
            {subtitle ? <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55 }}>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </header>
        <div style={{ padding: '24px' }}>{children}</div>
        {footer ? (
          <footer style={{ padding: '18px 24px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export function ProgressBar({ value, tone = 'primary' }) {
  const palette = tonePalette[tone] || tonePalette.primary;

  return (
    <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: '999px', background: palette.text, boxShadow: `0 0 0 1px ${palette.border} inset` }} />
    </div>
  );
}

export function CustomSelect({ value, onChange, options, placeholder = 'Seleccionar...', style }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value || String(opt.value) === String(value));
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          minHeight: '42px',
          padding: '10px 14px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#0f172a',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          userSelect: 'none',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼</span>
      </div>

      {isOpen && (
        <ul
          className="custom-select-list"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 100,
            listStyle: 'none',
            padding: '6px 0',
            margin: 0
          }}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                onChange(opt.value);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#0f172a',
                background: (opt.value === value || String(opt.value) === String(value)) ? '#ffd100' : 'transparent',
                fontWeight: (opt.value === value || String(opt.value) === String(value)) ? '700' : 'normal',
                transition: 'background 0.15s ease',
                wordBreak: 'break-word',
                lineHeight: '1.4'
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value && String(opt.value) !== String(value)) e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value && String(opt.value) !== String(value)) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

