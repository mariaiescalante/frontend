import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
        Dashboard Administrativo
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
        Bienvenido al panel de gestión del administrador. Aquí podrás administrar el personal docente, inscribir nuevos alumnos, configurar periodos académicos, pensums y auditar registros del sistema.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Control de Usuarios</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenimiento de credenciales y perfiles</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Configuración Curricular</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Definición de materias, carreras y pensums</span>
        </div>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Bitácora de Auditoría</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registro cronológico de acciones del sistema</span>
        </div>
      </div>
    </div>
  );
}
