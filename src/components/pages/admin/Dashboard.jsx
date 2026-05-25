import React from 'react';
import { 
  Users, 
  ClipboardList, 
  GraduationCap, 
  LayoutGrid, 
  FileCheck, 
  Clock 
} from 'lucide-react';

// Specialized Circular Progress Component for CPU Load
const CpuCircularProgress = ({ percentage }) => {
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '24px 0' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2}>
          {/* Outer Track Circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Active Highlight Arc */}
          <circle
            stroke="#ffd100"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}
        >
          <span style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {percentage}%
          </span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.08em', marginTop: '4px' }}>
            CPU LOAD
          </span>
        </div>
      </div>
    </div>
  );
};

// StatCard Component for the top numeric summary
const StatCard = ({ title, value, subtext, isPositive, hasDot, icon: Icon }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <div
          style={{
            backgroundColor: '#f1f5f9',
            padding: '8px',
            borderRadius: '8px',
            color: '#051124',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div>
        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-heading)', lineHeight: '1.1' }}>
          {value}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
        {isPositive && (
          <span style={{ color: '#22c55e', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem' }}>▲</span> {subtext}
          </span>
        )}
        {hasDot && (
          <span style={{ color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
            {subtext}
          </span>
        )}
        {!isPositive && !hasDot && (
          <span style={{ color: '#64748b', fontWeight: '500' }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

// ActivityItem Component representing logs
const ActivityItem = ({ title, description, time, borderLeftColor, icon: Icon, iconBg }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        borderLeft: `4px solid ${borderLeftColor}`,
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.01)'
      }}
    >
      <div
        style={{
          backgroundColor: iconBg,
          padding: '10px',
          borderRadius: '8px',
          color: borderLeftColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
          {title}
        </h5>
        <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {description}
        </p>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'inline-block' }}>
          {time}
        </span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', minHeight: '100%' }}>
      
      {/* 1. Stat Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        <StatCard 
          title="Estudiantes Activos" 
          value="2,840" 
          subtext="+3.2% vs ciclo anterior" 
          isPositive={true}
          icon={Users} 
        />
        <StatCard 
          title="Secciones Habilitadas" 
          value="156" 
          subtext="Capacidad promedio: 82%" 
          icon={ClipboardList} 
        />
        <StatCard 
          title="Docentes en Línea" 
          value="42" 
          subtext="Monitoreo en tiempo real" 
          hasDot={true}
          icon={GraduationCap} 
        />
        <StatCard 
          title="Inscripciones Hoy" 
          value="124" 
          subtext="Pico máximo: 10:30 AM" 
          icon={LayoutGrid} 
        />
      </div>

      {/* 2. Main Content Dashboard Sections (Split) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '32px',
        alignItems: 'start',
        width: '100%'
      }}>
        
        {/* Left Card: Recent System Activity */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Actividad Reciente del Sistema
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ActivityItem 
              title="Cierre de Actas - Período 2024-I"
              description="Finalizado por Registro Académico. 14,200 notas procesadas."
              time="Hace 2 horas"
              borderLeftColor="#051124"
              icon={FileCheck}
              iconBg="rgba(5, 17, 36, 0.08)"
            />
            <ActivityItem 
              title="Actualización de Pensum - Ing. Industrial"
              description="Modificación en 4 asignaturas de nivel superior aprobada."
              time="Ayer, 05:15 PM"
              borderLeftColor="#ffd100"
              icon={Clock}
              iconBg="rgba(255, 209, 0, 0.15)"
            />
          </div>
        </div>

        {/* Right Card: Server Status (Deep Dark Blue Card) */}
        <div style={{
          backgroundColor: '#051124',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 20px 0 rgba(5, 17, 36, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          color: '#ffffff',
          minHeight: '360px'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: 0, textAlign: 'left' }}>
            Estado del Servidor
          </h3>
          
          {/* Circle Gauge Component */}
          <CpuCircularProgress percentage={70} />

          {/* Active Uptime text */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '0.8rem', 
            color: '#94a3b8', 
            fontWeight: '500', 
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            Tiempo de actividad: 142 días, 05:22:11
          </div>

          {/* Detailed Logs Action Button */}
          <button
            type="button"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '14px 20px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              marginTop: 'auto',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            Ver Logs Detallados
          </button>
        </div>

      </div>

      {/* Responsive media query layout wrapper using standard flexbox overrides on smaller viewports */}
      <style>
        {`
          @media (max-width: 1024px) {
            div[style*="grid-template-columns: 2fr 1fr"] {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
          }
        `}
      </style>

    </div>
  );
}
