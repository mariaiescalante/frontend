import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  User,
  BookOpen,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { getStudentDashboard } from '../../../services/dashboardService';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getStudentDashboard();
        setData(res);
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
        setError(err.message || 'Error al cargar datos del estudiante');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Bienvenido de nuevo"
        subtitle="Cargando portal del estudiante..."
        metrics={[
          { label: 'Programa Académico', value: '...', hint: 'Cargando...', icon: GraduationCap, tone: 'primary' },
          { label: 'Promedio General (CUM)', value: '...', hint: 'Cargando...', icon: Award, tone: 'info' },
          { label: 'Créditos Aprobados', value: '...', hint: 'Cargando...', icon: CheckCircle, tone: 'success' },
          { label: 'Estado Académico', value: '...', hint: 'Cargando...', icon: AlertTriangle, tone: 'primary' }
        ]}
      >
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos dinámicos desde el servidor...</span>
        </div>
      </AdminPageShell>
    );
  }

  const profile = data?.profile || {
    name: '',
    lastname: '',
    career: '',
    faculty: '',
    director: '',
    cum: 0,
    creditsRequired: 160,
    academicStatus: '',
    currentPeriod: ''
  };

  const enrolled = data?.enrolled || [];
  const creditsPassed = data?.metrics?.creditsPassed || 0;

  const metrics = [
    {
      label: 'Programa Académico',
      value: profile.career,
      hint: `${profile.faculty} · Directora: ${profile.director}`,
      icon: GraduationCap,
      tone: 'primary'
    },
    {
      label: 'Promedio General (CUM)',
      value: `${Number(profile.cum || 0).toFixed(2)} / 20`,
      hint: 'Escala nacional aprobatoria (10-20)',
      icon: Award,
      tone: 'info'
    },
    {
      label: 'Créditos Aprobados',
      value: `${creditsPassed} / ${profile.creditsRequired}`,
      hint: `${Math.round((creditsPassed / profile.creditsRequired) * 100)}% de la carrera completada`,
      icon: CheckCircle,
      tone: 'success'
    },
    {
      label: 'Estado Académico',
      value: profile.academicStatus,
      hint: profile.academicStatus === 'Regular' ? 'Estudiante regular al día' : 'Revisar materias pendientes',
      icon: AlertTriangle,
      tone: profile.academicStatus === 'Regular' ? 'success' : 'warning'
    }
  ];

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title={`Bienvenido de nuevo, ${profile.name} ${profile.lastname}`}
      subtitle="Desde este panel puedes gestionar tu carga académica, inscribir asignaturas del periodo actual, consultar calificaciones e imprimir tus documentos oficiales."
      metrics={metrics}
    >
      {/* Dynamic enrollment status banner */}
      {enrolled.length === 0 ? (
        <article
          className="glass-panel"
          style={{
            padding: '24px',
            border: '1px solid rgba(245, 196, 0, 0.3)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255, 209, 0, 0.05) 0%, rgba(255, 209, 0, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', maxWidth: '750px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 209, 0, 0.18)',
                color: '#7c5a00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Proceso de Inscripción Pendiente - Periodo {profile.currentPeriod}
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {creditsPassed === 0 ? (
                  `¡Te damos la bienvenida a tu carrera! Tu inscripción formal para el periodo académico actual aún no ha sido realizada. Por favor, procede a realizar la inscripción de tus asignaturas para iniciar tu trayectoria de estudios.`
                ) : (
                  `Tu inscripción formal aún no ha sido realizada. Recuerda que al poseer un estado de ${profile.academicStatus} debido a materias pendientes (como RED-201 Redes de Computadoras I), debes saldar la prelación inscribiendo la materia de arrastre para poder liberar asignaturas superiores.`
                )}
              </p>
            </div>
          </div>
          <Link to="/student/enrollment" style={{ textDecoration: 'none' }}>
            <ActionButton variant="accent">
              Ir a Inscribir Materias <ArrowRight size={16} />
            </ActionButton>
          </Link>
        </article>
      ) : (
        <article
          className="glass-panel"
          style={{
            padding: '24px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', maxWidth: '750px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                ¡Inscripción Formalizada! - Periodo {profile.currentPeriod}
              </h3>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Has inscrito satisfactoriamente <strong>{enrolled.length} asignaturas</strong> en este ciclo. Puedes consultar tu horario de clases, aulas asignadas y descargar el comprobante oficial en el módulo correspondiente.
              </p>
            </div>
          </div>
          <Link to="/student/schedule" style={{ textDecoration: 'none' }}>
            <ActionButton variant="primary">
              Ver Mi Horario <ArrowRight size={16} />
            </ActionButton>
          </Link>
        </article>
      )}

      {/* Main grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Enrolled Subjects list / Info */}
        <SectionCard
          title="Mis Clases del Periodo"
          description={
            enrolled.length > 0
              ? 'Listado de materias y secciones en curso para el periodo lectivo actual.'
              : 'Aún no posees materias inscritas para este ciclo académico.'
          }
        >
          {enrolled.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {enrolled.map((item) => (
                <div
                  key={item.code}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                      {item.code} · {item.credits} UC
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Sección: <strong>{item.sectionCode}</strong> | Aula: {item.classroom} | Docente: {item.teacher}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
                      {item.schedule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <BookOpen size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <p style={{ margin: '0 0 16px', fontSize: '0.92rem' }}>
                Para comenzar a ver tus horarios y calificaciones, realiza el proceso de matriculación de unidades curriculares.
              </p>
              <Link to="/student/enrollment" style={{ textDecoration: 'none' }}>
                <ActionButton variant="secondary">Iniciar Inscripción</ActionButton>
              </Link>
            </div>
          )}
        </SectionCard>

        {/* Shortcuts Panel */}
        <SectionCard
          title="Accesos Rápidos"
          description="Accede directamente a los módulos y reportes de tu portal académico."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/student/profile" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <User size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Datos Personales</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Perfil y estatus académico</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/student/pensum" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <BookOpen size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Pensum de Estudios</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Visualizar plan curricular</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/student/enrollment" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <ClipboardCheck size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Inscripción de Materias</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Habilitaciones y prelaciones</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/student/schedule" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <Calendar size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Mi Horario</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Clases, aulas e inscripción</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/student/record" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <Award size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Récord Académico</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Historial e informes de notas</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/student/documents" style={{ textDecoration: 'none' }}>
              <div
                className="shortcut-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#0f172a'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(5, 17, 36, 0.06)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#051124' }}>
                  <FileText size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Constancias y Reportes</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Generar PDF de estudio/inscripción</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            </Link>
          </div>
          <style>
            {`
              .shortcut-card:hover {
                border-color: #ffd100 !important;
                box-shadow: 0 4px 12px rgba(255, 209, 0, 0.1);
                transform: translateY(-1px);
              }
            `}
          </style>
        </SectionCard>
      </div>
    </AdminPageShell>
  );
}
