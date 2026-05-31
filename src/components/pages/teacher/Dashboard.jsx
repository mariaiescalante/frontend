import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpenCheck, FileDown, FileLock2, History, Users } from 'lucide-react';
import { AdminPageShell, SectionCard } from '../admin/AdminPageShell';
import { teacherAssignments, teacherHistory } from './teacherSeedData';

const quickModules = [
  {
    path: '/teacher/subjects',
    title: 'Asignaturas impartidas',
    description: 'Consulta materias, secciones, carrera y semestre asignados.',
    icon: BookOpenCheck
  },
  {
    path: '/teacher/students',
    title: 'Estudiantes y evaluaciones',
    description: 'Busca por cedula o nombre, carga 4 cortes y contenido evaluado.',
    icon: Users
  },
  {
    path: '/teacher/records',
    title: 'Actas y cierre',
    description: 'Descarga constancia de notas y cierra actas para bloquear edicion.',
    icon: FileLock2
  },
  {
    path: '/teacher/history',
    title: 'Historial impartido',
    description: 'Revisa materias impartidas de periodos anteriores en solo lectura.',
    icon: History
  }
];

export default function TeacherDashboard() {
  const openAssignments = teacherAssignments.filter((item) => item.actStatus !== 'cerrada').length;

  return (
    <AdminPageShell
      eyebrow="Panel Docente"
      title="Dashboard Docente"
      subtitle="Vista de resumen del docente. Los procesos academicos operativos estan en los modulos del menu lateral."
      metrics={[
        {
          label: 'Asignaturas activas',
          value: teacherAssignments.length,
          hint: 'Carga academica total del docente',
          icon: BookOpenCheck,
          tone: 'info'
        },
        {
          label: 'Actas pendientes',
          value: openAssignments,
          hint: 'Secciones con acta aun abierta',
          icon: FileDown,
          tone: openAssignments ? 'warning' : 'success'
        },
        {
          label: 'Historial registrado',
          value: teacherHistory.length,
          hint: 'Asignaturas historicas disponibles para consulta',
          icon: History,
          tone: 'primary'
        }
      ]}
    >
      <SectionCard
        title="Modulos disponibles"
        description="Cada proceso se encuentra en un modulo independiente para mantener trazabilidad y orden academico."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
          {quickModules.map((moduleItem) => {
            const Icon = moduleItem.icon;
            return (
              <NavLink
                key={moduleItem.path}
                to={moduleItem.path}
                style={{
                  textDecoration: 'none',
                  color: '#0f172a',
                  border: '1px solid #dbe4f0',
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                </div>
                <strong style={{ fontSize: '0.95rem' }}>{moduleItem.title}</strong>
                <span style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.55 }}>{moduleItem.description}</span>
              </NavLink>
            );
          })}
        </div>
      </SectionCard>
    </AdminPageShell>
  );
}
