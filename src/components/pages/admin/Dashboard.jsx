import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, GraduationCap, LayoutGrid, FileCheck, Clock, Calendar, Trash2, PlusCircle, PenTool } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard } from './AdminPageShell';
import { getAdminDashboard } from '../../../services/dashboardService';


const ActivityItem = ({ title, description, time, borderLeftColor, icon: Icon, iconBg, onClick }) => (
  <div 
    onClick={onClick}
    className="activity-item-clickable"
    style={{ 
      display: 'flex', 
      gap: '16px', 
      padding: '20px', 
      backgroundColor: '#f8fafc', 
      borderRadius: '12px', 
      borderLeft: `4px solid ${borderLeftColor}`, 
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }}
  >
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

const PeriodCircularProgress = ({ percentage = 0 }) => {
  const radius = 65;
  const stroke = 8;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2}>
          <circle stroke="#f1f5f9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle 
            stroke="url(#goldGradient)" 
            fill="transparent" 
            strokeWidth={stroke} 
            strokeDasharray={`${circumference} ${circumference}`} 
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} 
            r={normalizedRadius} 
            cx={radius} 
            cy={radius} 
            strokeLinecap="round" 
            transform={`rotate(-90 ${radius} ${radius})`} 
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd100" />
              <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          lineHeight: '1.1'
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#051124' }}>{percentage}%</span>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Avance</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminDashboard();
        setData(res);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Dashboard administrativo"
        title="Visión general del panel de administración"
        subtitle="Cargando datos del sistema..."
        metrics={[
          { label: 'Estudiantes activos', value: '...', hint: 'Cargando...', icon: Users, tone: 'primary' },
          { label: 'Secciones habilitadas', value: '...', hint: 'Cargando...', icon: ClipboardList, tone: 'warning' },
          { label: 'Docentes en línea', value: '...', hint: 'Cargando...', icon: GraduationCap, tone: 'success' },
          { label: 'Inscripciones hoy', value: '...', hint: 'Cargando...', icon: LayoutGrid, tone: 'info' }
        ]}
      >
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos dinámicos desde el servidor...</span>
        </div>
      </AdminPageShell>
    );
  }

  const metrics = [
    { label: 'Estudiantes activos', value: data?.metrics?.activeStudents.toLocaleString() || '0', hint: '+3.2% vs ciclo anterior', icon: Users, tone: 'primary' },
    { label: 'Secciones habilitadas', value: data?.metrics?.sectionsCount.toString() || '0', hint: 'Capacidad promedio: 82%', icon: ClipboardList, tone: 'warning' },
    { label: 'Docentes registrados', value: data?.metrics?.teachersCount.toString() || '0', hint: 'Monitoreo en tiempo real', icon: GraduationCap, tone: 'success' },
    { label: 'Inscripciones hoy', value: data?.metrics?.enrollmentsToday.toString() || '0', hint: 'Pico máximo: 10:30 AM', icon: LayoutGrid, tone: 'info' }
  ];

  const iconMap = {
    FileCheck: FileCheck,
    Clock: Clock,
    User: Users,
    Plus: PlusCircle,
    Trash: Trash2,
    Update: PenTool
  };

  return (
    <AdminPageShell
      eyebrow="Dashboard administrativo"
      title="Visión general del panel de administración"
      subtitle="La portada conserva el mismo lenguaje visual que los nuevos módulos: superficies claras, encabezados oscuros y acentos dorados para resaltar la acción principal."
      metrics={metrics}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        <SectionCard title="Actividad reciente del sistema" description="Últimas acciones relevantes del entorno académico.">
          <div 
            className="activity-scroll-container" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              maxHeight: '420px', 
              overflowY: 'auto', 
              paddingRight: '8px' 
            }}
          >
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => {
                const Icon = iconMap[item.iconName] || Clock;
                return (
                  <ActivityItem
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    time={item.time}
                    borderLeftColor={item.borderLeftColor}
                    icon={Icon}
                    iconBg={`${item.borderLeftColor}15`}
                    onClick={() => setSelectedActivity(item)}
                  />
                );
              })
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No hay actividades recientes registradas en el sistema.
              </div>
            )}
          </div>
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Estado del Período Académico */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '18px', 
            padding: '24px', 
            boxShadow: '0 15px 35px rgba(255, 209, 0, 0.12)', // Glowing gold-colored shadow
            display: 'flex', 
            flexDirection: 'column', 
            color: '#0f172a',
            border: '1px solid rgba(255, 209, 0, 0.25)', // soft amber border
            borderTop: '4px solid #ffd100', // Gold top accent line
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Soft gold backdrop light */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at top right, rgba(255, 209, 0, 0.08), transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
              <h3 style={{ 
                fontSize: '1.15rem', 
                fontWeight: '800', 
                color: '#051124', 
                margin: 0, 
                fontFamily: 'var(--font-heading)', 
                letterSpacing: '-0.02em' 
              }}>
                Período Académico
              </h3>
            </div>

            {/* Side-by-side flex row layout */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '14px 0', position: 'relative', zIndex: 2 }}>
              {/* Left Column: Larger Gauge */}
              <div style={{ flexShrink: 0 }}>
                <PeriodCircularProgress percentage={data?.periodInfo?.percentage || 0} />
              </div>

              {/* Right Column: Key Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                
                {/* 1. Academic Cap / Period name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ backgroundColor: 'rgba(255, 209, 0, 0.12)', color: '#7c5a00', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                    <Calendar size={14} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Período</span>
                    <span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0f172a' }}>{data?.periodInfo?.name || '2026-I'}</span>
                  </div>
                </div>

                {/* 2. Days remaining */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                    <Clock size={14} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Tiempo Restante</span>
                    <span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0f172a' }}>
                      {data?.periodInfo?.daysRemaining || 0} días
                    </span>
                  </div>
                </div>

                {/* 3. Status with pulsing green dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    backgroundColor: data?.periodInfo?.status === 'Activo' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                    color: data?.periodInfo?.status === 'Activo' ? '#22c55e' : '#64748b', 
                    padding: '6px', 
                    borderRadius: '6px', 
                    display: 'flex' 
                  }}>
                    <FileCheck size={14} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Estado</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {data?.periodInfo?.status === 'Activo' && (
                        <span className="status-pulsing-dot" style={{ 
                          width: '6px', 
                          height: '6px', 
                          backgroundColor: '#22c55e', 
                          borderRadius: '50%', 
                          display: 'inline-block'
                        }} />
                      )}
                      <span style={{ fontSize: '0.825rem', fontWeight: '800', color: data?.periodInfo?.status === 'Activo' ? '#22c55e' : '#64748b', textTransform: 'capitalize' }}>
                        {data?.periodInfo?.status || 'Activo'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <Link to="/admin/periods" style={{ textDecoration: 'none', marginTop: '10px', position: 'relative', zIndex: 2 }}>
              <button className="manage-periods-btn" style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffd100 0%, #ffb300 100%)',
                color: '#051124',
                fontWeight: '800',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(255, 209, 0, 0.25)',
                transition: 'all 0.2s ease-in-out'
              }}>
                <Calendar size={15} /> Gestionar Períodos
              </button>
            </Link>
          </div>

          {/* Card 2: Acciones Pendientes */}
          <div style={{ 
            backgroundColor: '#051124', 
            borderRadius: '18px', 
            padding: '28px', 
            boxShadow: '0 18px 40px rgba(5, 17, 36, 0.25)', 
            display: 'flex', 
            flexDirection: 'column', 
            color: '#ffffff', 
            minHeight: '360px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle top ambient light effect (Blue-themed for actions) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '800', 
                color: '#ffffff', 
                margin: 0, 
                fontFamily: 'var(--font-heading)', 
                letterSpacing: '-0.02em' 
              }}>
                Acciones Pendientes
              </h3>
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: '700', 
                color: '#94a3b8', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                Control
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              
              {/* 1. Pre-registrations (Aspirantes) */}
              <Link to="/admin/pre-registrations" className="pending-task-item" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    background: 'rgba(255, 209, 0, 0.12)', 
                    color: '#ffd100', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Users size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>Preinscripciones</div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Aspirantes por validar</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '800', 
                      color: '#ffd100',
                      background: 'rgba(255, 209, 0, 0.18)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {data?.pendingTasks?.preRegistrations || 0}
                    </span>
                  </div>
                </div>
              </Link>

              {/* 2. Sections without teacher */}
              <Link to="/admin/teacher-assignment" className="pending-task-item" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    background: 'rgba(239, 68, 68, 0.12)', 
                    color: '#ef4444', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <GraduationCap size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>Secciones sin Docente</div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Asignación de profesores</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '800', 
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.18)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {data?.pendingTasks?.sectionsWithoutTeacher || 0}
                    </span>
                  </div>
                </div>
              </Link>

              {/* 3. Grades confirmations pending */}
              <Link to="/admin/grades" className="pending-task-item" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    background: 'rgba(59, 130, 246, 0.12)', 
                    color: '#3b82f6', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <ClipboardList size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>Actas en Carga</div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Notas por confirmar</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '800', 
                      color: '#3b82f6',
                      background: 'rgba(59, 130, 246, 0.18)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {data?.pendingTasks?.gradesConfirmations || 0}
                    </span>
                  </div>
                </div>
              </Link>

            </div>

            {/* Inline CSS styling for hover and scrollbar effects */}
            <style>
              {`
                .pending-task-item > div:hover {
                  background: rgba(255, 255, 255, 0.07) !important;
                  border-color: rgba(255, 255, 255, 0.15) !important;
                  transform: translateX(4px);
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }
                
                .activity-scroll-container::-webkit-scrollbar {
                  width: 6px;
                }
                .activity-scroll-container::-webkit-scrollbar-track {
                  background: transparent;
                }
                .activity-scroll-container::-webkit-scrollbar-thumb {
                  background: rgba(148, 163, 184, 0.3);
                  border-radius: 4px;
                }
                .activity-scroll-container::-webkit-scrollbar-thumb:hover {
                  background: rgba(148, 163, 184, 0.5);
                }
                
                @keyframes status-pulse {
                  0% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                  }
                  70% {
                    transform: scale(1);
                    box-shadow: 0 0 0 5px rgba(34, 197, 94, 0);
                  }
                  100% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
                  }
                }
                
                .status-pulsing-dot {
                  animation: status-pulse 1.8s infinite;
                }

                .manage-periods-btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 18px rgba(255, 209, 0, 0.4) !important;
                  background: linear-gradient(135deg, #ffe033 0%, #ffc000 100%) !important;
                }
                .manage-periods-btn:active {
                  transform: translateY(0);
                }
                .activity-item-clickable:hover {
                  background-color: #f1f5f9 !important;
                  transform: translateY(-1px);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }
                
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translateY(20px); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
              `}
            </style>
          </div>
        </div>
      </div>

      {/* Modal for Activity Details */}
      {selectedActivity && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 17, 36, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 209, 0, 0.2)',
            borderTop: `6px solid ${selectedActivity.borderLeftColor}`,
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Close icon button at top right */}
            <button 
              onClick={() => setSelectedActivity(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              &times;
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                backgroundColor: `${selectedActivity.borderLeftColor}15`,
                color: selectedActivity.borderLeftColor,
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {React.createElement(iconMap[selectedActivity.iconName] || Clock, { size: 24 })}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Bitácora de Auditoría</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#051124', margin: '2px 0 0 0' }}>{selectedActivity.title}</h4>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #f1f5f9' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '4px' }}>Detalles de la Acción</span>
                <p style={{ fontSize: '0.925rem', color: '#334155', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {selectedActivity.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Fecha y Hora</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{selectedActivity.time}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Categoría</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: selectedActivity.borderLeftColor, textTransform: 'uppercase' }}>
                    {selectedActivity.iconName === 'Trash' ? 'Eliminación' : (selectedActivity.iconName === 'Plus' ? 'Creación' : 'Modificación')}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={() => setSelectedActivity(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
