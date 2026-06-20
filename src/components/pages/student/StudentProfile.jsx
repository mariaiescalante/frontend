import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  ShieldAlert,
  Save,
  Check
} from 'lucide-react';
import { AdminPageShell, SectionCard, ActionButton, StatusBadge, fieldStyle } from '../admin/AdminPageShell';
import api from '../../../services/api';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState(false);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      const data = res.data || res;
      setProfile(data);
      setEmail(data.email || '');
      setPhone(data.phone || '');
      // Fallback local storage for address since backend doesn't store address
      const localAddress = localStorage.getItem(`address_${data.id}`) || 'San Cristóbal, Estado Táchira';
      setAddress(localAddress);
    } catch (err) {
      console.error('Error loading student profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      // Save phone and email to backend
      const res = await api.put('/auth/profile_update', {
        email: email.trim(),
        phone: phone.trim()
      });

      // Save address locally
      if (profile?.id) {
        localStorage.setItem(`address_${profile.id}`, address.trim());
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      const updatedData = res.data || res;
      setProfile(prev => ({
        ...prev,
        ...updatedData
      }));
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Error al actualizar el perfil');
    }
  };

  if (loading || !profile) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Datos Personales"
        subtitle="Cargando perfil..."
      >
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos personales desde el servidor...</span>
        </div>
      </AdminPageShell>
    );
  }

  // Parse fields or fallback
  const facultyName = profile.career?.toLowerCase().includes('sistemas') || profile.career?.toLowerCase().includes('informática')
    ? 'Tecnología' 
    : 'Ciencias Sociales';
  const directorName = profile.career?.toLowerCase().includes('sistemas') || profile.career?.toLowerCase().includes('informática')
    ? 'Ing. Mariela Rivas'
    : 'MSc. Laura Méndez';

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Datos Personales y Programa Académico"
      subtitle="Consulta tu ficha de estudiante, edita tu información de contacto y revisa tu estado académico actual en la institución."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Personal details card */}
        <SectionCard
          title="Información Personal"
          description="Detalles personales del estudiante. Solo los campos de contacto son editables."
          actions={
            <ActionButton variant="accent" onClick={handleSave} style={{ minHeight: '40px', padding: '8px 16px' }}>
              {saved ? (
                <>
                  <Check size={16} /> Guardado
                </>
              ) : (
                <>
                  <Save size={16} /> Guardar cambios
                </>
              )}
            </ActionButton>
          }
        >
          {saved && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                fontSize: '0.92rem',
                fontWeight: 600
              }}
            >
              ¡Tus datos de contacto han sido actualizados exitosamente!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px' }}>
            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Nombre
              </span>
              <input className="form-input" value={profile.first_name || ''} disabled style={{ background: '#f1f5f9' }} />
            </label>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Apellido
              </span>
              <input className="form-input" value={profile.first_lastname || ''} disabled style={{ background: '#f1f5f9' }} />
            </label>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} /> Cédula de Identidad
              </span>
              <input className="form-input" value={profile.document_id || ''} disabled style={{ background: '#f1f5f9' }} />
            </label>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Fecha de Nacimiento
              </span>
              <input className="form-input" type="date" value={profile.date_birth || ''} disabled style={{ background: '#f1f5f9' }} />
            </label>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Correo Electrónico
              </span>
              <input
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> Teléfono Móvil
              </span>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 0414-1234567"
              />
            </label>

            <label className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Dirección de Habitación
              </span>
              <textarea
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Urb. Las Lomas, Calle 5..."
                style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
              />
            </label>
          </div>
        </SectionCard>

        {/* Academic status card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SectionCard
            title="Programa y Estado"
            description="Estado académico e información curricular vigente."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Carrera / Programa
                </span>
                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{profile.career || 'Sin asignar'}</strong>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Facultad de {facultyName}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Director</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{directorName}</strong>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>Periodo Activo</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>2026-II</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={18} style={{ color: '#1d4ed8' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Índice (CUM)</span>
                    <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{Number(profile.cum || 16.45).toFixed(2)}</strong>
                  </div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right', marginBottom: '4px' }}>Estatus</span>
                  <StatusBadge tone={profile.academicStatus === 'Regular' ? 'success' : 'warning'}>
                    {profile.academicStatus || 'Regular'}
                  </StatusBadge>
                </div>
              </div>

              {profile.academicStatus === 'Desfasado' && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 209, 0, 0.08)',
                    border: '1px solid rgba(255, 209, 0, 0.28)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start'
                  }}
                >
                  <ShieldAlert size={18} style={{ color: '#7c5a00', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#7c5a00', lineHeight: 1.45 }}>
                    <strong>Aviso de Regularidad:</strong> Posees asignaturas de semestres anteriores pendientes. Esto limita tu inscripción ordinaria debido a la prelación de materias de niveles superiores.
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
