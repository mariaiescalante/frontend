import React from 'react';

export default function StudentDashboard() {
  return (
    <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '12px' }}>
        Dashboard Estudiante
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        Bienvenido al portal académico de estudiantes. En este espacio podrás realizar la inscripción de tus asignaturas, consultar tus notas definitivas, y realizar solicitudes formales de documentos académicos como constancias y récord de notas.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Mi Carga Académica</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Horarios, materias y secciones inscritas</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Calificaciones</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notas detalladas por período académico</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Trámites y Solicitudes</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Constancias de estudio y récord notas</span>
        </div>
      </div>
    </div>
  );
}
