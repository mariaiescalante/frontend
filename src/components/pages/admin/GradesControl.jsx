import React, { useMemo, useState, useEffect } from 'react';
import { Award, FilePenLine, ShieldCheck, Save } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, StatusBadge } from './AdminPageShell';
import api from '../../../services/api';

export default function GradesControl() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allSections, setAllSections] = useState([]);
  const [allDetails, setAllDetails] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [secRes, detRes, regRes, userRes] = await Promise.all([
          api.get('/sections'),
          api.get('/registration-details'),
          api.get('/registrations'),
          api.get('/users')
        ]);
        setAllSections((Array.isArray(secRes) ? secRes : (secRes?.data || [])));
        setAllDetails((Array.isArray(detRes) ? detRes : (detRes?.data || [])));
        setAllRegistrations((Array.isArray(regRes) ? regRes : (regRes?.data || [])));
        setAllUsers((Array.isArray(userRes) ? userRes : (userRes?.data || [])));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [sectionId, setSectionId] = useState('');
  
  useEffect(() => {
    if (allSections.length > 0 && !sectionId) {
      setSectionId(String(allSections[0].id_section));
    }
  }, [allSections, sectionId]);

  const selectedSection = useMemo(() => {
    return allSections.find(s => s.id_section === Number(sectionId)) || null;
  }, [allSections, sectionId]);

  const rawGrades = useMemo(() => {
    if (!selectedSection) return [];
    const details = allDetails.filter(d => d.id_section === selectedSection.id_section);
    return details.map(d => {
      const reg = allRegistrations.find(r => r.id_registration === d.id_registration);
      const studentUser = allUsers.find(u => u.Student?.id_student === reg?.id_student);
      
      return {
        id: d.id_detail,
        cedula: studentUser?.document_id || 'Sin CI',
        name: `${studentUser?.first_name || ''} ${studentUser?.first_lastname || ''}`.trim() || 'Desconocido',
        c1: Number(d.corte_1) || 0,
        c2: Number(d.corte_2) || 0,
        c3: Number(d.corte_3) || 0,
        c4: Number(d.corte_4) || 0,
        final: Number(d.final_note) || 0,
        status: d.subject_status,
        grade_status: d.grade_status
      };
    });
  }, [selectedSection, allDetails, allRegistrations, allUsers]);

  const [grades, setGrades] = useState([]);

  useEffect(() => {
    setGrades(rawGrades);
  }, [rawGrades]);

  const isClosed = grades.length > 0 && grades[0].grade_status === 'Confirmada';

  const updateGrade = (detailId, index, value) => {
    if (isClosed) return;
    setGrades((currentGrades) => currentGrades.map((student) => {
      if (student.id !== detailId) return student;
      const val = Number(value) || 0;
      const mapped = { ...student };
      if (index === 0) mapped.c1 = val;
      if (index === 1) mapped.c2 = val;
      if (index === 2) mapped.c3 = val;
      if (index === 3) mapped.c4 = val;
      
      mapped.final = (mapped.c1 + mapped.c2 + mapped.c3 + mapped.c4) / 4;
      return mapped;
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedSection) return;
    try {
      setIsSaving(true);
      await Promise.all(grades.map(r => {
        let status = 'Cursando';
        if (r.final >= 9.5) status = 'Aprobada'; // Simplified criteria
        else status = 'Reprobada';

        return api.put(`/registration-details/${r.id}`, {
          corte_1: r.c1,
          corte_2: r.c2,
          corte_3: r.c3,
          corte_4: r.c4,
          final_note: r.final,
          subject_status: status
        });
      }));
      alert('Notas actualizadas correctamente en la base de datos.');
      const detRes = await api.get('/registration-details');
      setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));
    } catch(err) {
      console.error(err);
      alert('Error al guardar notas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseActa = async () => {
    if (!selectedSection) return;
    if (grades.length === 0) {
      alert('No hay estudiantes inscritos en esta sección.');
      return;
    }
    const confirm = window.confirm('Al cerrar el acta se bloqueará la edición para docentes y administradores. ¿Deseas continuar?');
    if (!confirm) return;

    try {
      setIsSaving(true);
      await Promise.all(grades.map(r => 
        api.put(`/registration-details/${r.id}`, { grade_status: 'Confirmada' })
      ));
      alert('Acta cerrada exitosamente.');
      const detRes = await api.get('/registration-details');
      setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));
    } catch(err) {
      console.error(err);
      alert('Error cerrando acta.');
    } finally {
      setIsSaving(false);
    }
  };

  const avgFinal = grades.length > 0 ? (grades.reduce((acc, g) => acc + Number(g.final), 0) / grades.length).toFixed(1) : 0;

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Control de notas"
        title="Evaluaciones por sección y materia"
        subtitle="Cargando sistema..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Obteniendo actas desde la base de datos...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Control de notas"
      title="Evaluaciones por sección y materia"
      subtitle="Corrige notas de manera administrativa, revisa promedios y cierra actas de forma definitiva en el sistema."
      metrics={[
        { label: 'Sección seleccionada', value: selectedSection?.section_code || '--', hint: selectedSection?.Subject?.name_subject || 'Ninguna', icon: Award, tone: 'primary' },
        { label: 'Estudiantes', value: grades.length, hint: 'Matrícula actual registrada', icon: FilePenLine, tone: 'info' },
        { label: 'Promedio del grupo', value: avgFinal, hint: 'Resultado general de la sección', icon: ShieldCheck, tone: 'success' }
      ]}
    >
      <SectionCard title="Seleccionar sección y materia" description="El control combina datos de curso con una vista compacta del acta conectada a la base de datos real.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', maxWidth: '700px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Sección</span>
            <select className="form-input" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {allSections.map((sec) => (
                <option key={sec.id_section} value={sec.id_section}>
                  {sec.section_code} - {sec.Subject?.name_subject}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
             <StatusBadge tone={isClosed ? 'neutral' : 'success'}>
                {isClosed ? 'ACTA CERRADA (SOLO LECTURA)' : 'ACTA ABIERTA (EDICIÓN HABILITADA)'}
             </StatusBadge>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Libro de calificaciones" description="Edición en línea de cortes parciales y nota final.">
        {grades.length === 0 ? (
           <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay alumnos inscritos en esta sección.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {grades.map((student) => (
              <article key={student.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'grid', gap: '14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>{student.name}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.84rem' }}>{student.cedula}</span>
                  </div>
                  <StatusBadge tone={student.final >= 9.5 ? 'success' : student.final >= 6.5 ? 'warning' : 'danger'}>{student.final >= 9.5 ? 'Aprobado' : 'En riesgo'}</StatusBadge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px' }}>
                  <label className="form-group" style={{ marginBottom: 0 }}>
                    <span className="form-label">Corte 1</span>
                    <input className="form-input" disabled={isClosed} value={student.c1} onChange={(e) => updateGrade(student.id, 0, e.target.value)} />
                  </label>
                  <label className="form-group" style={{ marginBottom: 0 }}>
                    <span className="form-label">Corte 2</span>
                    <input className="form-input" disabled={isClosed} value={student.c2} onChange={(e) => updateGrade(student.id, 1, e.target.value)} />
                  </label>
                  <label className="form-group" style={{ marginBottom: 0 }}>
                    <span className="form-label">Corte 3</span>
                    <input className="form-input" disabled={isClosed} value={student.c3} onChange={(e) => updateGrade(student.id, 2, e.target.value)} />
                  </label>
                  <label className="form-group" style={{ marginBottom: 0 }}>
                    <span className="form-label">Corte 4</span>
                    <input className="form-input" disabled={isClosed} value={student.c4} onChange={(e) => updateGrade(student.id, 3, e.target.value)} />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <span className="form-label">Final</span>
                    <div style={{ height: '46px', display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: '12px', background: '#ffffff', border: '1px solid #cbd5e1', fontWeight: 800, color: '#051124' }}>{student.final.toFixed(1)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
          <ActionButton variant="primary" onClick={handleSaveGrades} disabled={isClosed || isSaving || grades.length === 0}>
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Notas'}
          </ActionButton>
          <ActionButton variant="accent" onClick={handleCloseActa} disabled={isClosed || isSaving || grades.length === 0}>Cerrar acta</ActionButton>
        </div>
      </SectionCard>
    </AdminPageShell>
  );
}
