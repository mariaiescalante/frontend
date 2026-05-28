import React from 'react';
import { Users, ClipboardList, GraduationCap, LayoutGrid, FileCheck, Clock } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard } from './AdminPageShell';

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
          <circle stroke="rgba(255, 255, 255, 0.08)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle stroke="#ffd100" fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} r={normalizedRadius} cx={radius} cy={radius} strokeLinecap="round" transform={`rotate(-90 ${radius} ${radius})`} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
          <span style={{ fontSize: '1.85rem', fontWeight: '800', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>{percentage}%</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.08em', marginTop: '4px' }}>CPU LOAD</span>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ title, description, time, borderLeftColor, icon: Icon, iconBg }) => (
  <div style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `4px solid ${borderLeftColor}`, alignItems: 'center' }}>
    <div style={{ backgroundColor: iconBg, padding: '10px', borderRadius: '8px', color: borderLeftColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{title}</h5>
      <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{description}</p>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'inline-block' }}>{time}</span>
    </div>
  </div>
);

export default function AdminDashboard() {
  return (
    <AdminPageShell
      eyebrow="Dashboard administrativo"
      title="Visión general del panel de administración"
      subtitle="La portada conserva el mismo lenguaje visual que los nuevos módulos: superficies claras, encabezados oscuros y acentos dorados para resaltar la acción principal."
      metrics={[
        { label: 'Estudiantes activos', value: '2,840', hint: '+3.2% vs ciclo anterior', icon: Users, tone: 'primary' },
        { label: 'Secciones habilitadas', value: '156', hint: 'Capacidad promedio: 82%', icon: ClipboardList, tone: 'warning' },
        { label: 'Docentes en línea', value: '42', hint: 'Monitoreo en tiempo real', icon: GraduationCap, tone: 'success' },
        { label: 'Inscripciones hoy', value: '124', hint: 'Pico máximo: 10:30 AM', icon: LayoutGrid, tone: 'info' }
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        <SectionCard title="Actividad reciente del sistema" description="Últimas acciones relevantes del entorno académico.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ActivityItem title="Cierre de actas - Período 2024-I" description="Finalizado por Registro Académico. 14,200 notas procesadas." time="Hace 2 horas" borderLeftColor="#051124" icon={FileCheck} iconBg="rgba(5, 17, 36, 0.08)" />
            <ActivityItem title="Actualización de pensum - Ing. Industrial" description="Modificación en 4 asignaturas de nivel superior aprobada." time="Ayer, 05:15 PM" borderLeftColor="#ffd100" icon={Clock} iconBg="rgba(255, 209, 0, 0.15)" />
          </div>
        </SectionCard>

        <div style={{ backgroundColor: '#051124', borderRadius: '18px', padding: '28px', boxShadow: '0 18px 40px rgba(5, 17, 36, 0.18)', display: 'flex', flexDirection: 'column', color: '#ffffff', minHeight: '360px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Estado del servidor</h3>
          <CpuCircularProgress percentage={70} />
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500', lineHeight: '1.5', marginBottom: '24px' }}>Tiempo de actividad: 142 días, 05:22:11</div>
          <ActionButton variant="ghost" style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.12)', background: 'rgba(255, 255, 255, 0.05)' }}>Ver logs detallados</ActionButton>
        </div>
      </div>
    </AdminPageShell>
  );
}
