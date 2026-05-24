import React from 'react';

export default function TeacherDashboard() {
  return (
    <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-pink)', marginBottom: '12px' }}>
        Dashboard Docente
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        Bienvenido al panel del personal docente. Desde aquí puedes visualizar tus secciones asignadas, cargar las calificaciones correspondientes a los diferentes cortes y registrar el porcentaje de asistencia de tus estudiantes.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Secciones Activas</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Listado de materias dictadas este semestre</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Carga de Notas</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registro de cortes 1, 2, 3 y 4</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Asistencia</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Control y porcentaje de asistencia estudiantil</span>
        </div>
      </div>
    </div>
  );
}
