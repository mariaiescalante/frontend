import React, { useMemo, useState, useEffect } from 'react';
import { Download, Search, Users, Save } from 'lucide-react';
import { ActionButton, AdminPageShell, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

const cuts = ['c1', 'c2', 'c3', 'c4'];

function computeAverage(grades) {
  const values = cuts
    .map((cut) => Number(grades[cut]))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!values.length) return '--';
  const total = values.reduce((sum, value) => sum + value, 0);
  return (total / values.length).toFixed(2);
}

function clampGrade(raw) {
  if (raw === '') return '';
  const value = Number(raw);
  if (!Number.isFinite(value)) return '';
  return String(Math.max(0, Math.min(20, value)));
}

export default function TeacherStudents() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [allDetails, setAllDetails] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!user?.id_teacher) return;
      try {
        setLoading(true);
        const [secRes, detRes, regRes, userRes] = await Promise.all([
          api.get('/sections'),
          api.get('/registration-details'),
          api.get('/registrations'),
          api.get('/users')
        ]);
        
        const teacherSections = (Array.isArray(secRes) ? secRes : secRes?.data).filter(s => s.id_teacher === user.id_teacher);
        setAssignments(teacherSections);
        setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));
        setAllRegistrations(regRes.data);
        setAllUsers(userRes.data);
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Dropdown selections
  const careerOptions = useMemo(() => {
    return [...new Set(assignments.map(a => a.Career?.name_career || 'N/A'))];
  }, [assignments]);
  
  const [career, setCareer] = useState('');
  useEffect(() => { 
    if (!careerOptions.includes(career) && careerOptions.length > 0) setCareer(careerOptions[0]); 
  }, [careerOptions, career]);

  const subjectOptions = useMemo(() => {
    return [...new Set(assignments.filter(a => (a.Career?.name_career || 'N/A') === career).map(a => a.Subject?.name_subject || 'N/A'))];
  }, [career, assignments]);
  
  const [subject, setSubject] = useState('');
  useEffect(() => { 
    if (!subjectOptions.includes(subject) && subjectOptions.length > 0) setSubject(subjectOptions[0]); 
  }, [subjectOptions, subject]);

  const sectionOptions = useMemo(() => {
    return assignments.filter(a => (a.Career?.name_career || 'N/A') === career && (a.Subject?.name_subject || 'N/A') === subject);
  }, [career, subject, assignments]);
  
  const [sectionObj, setSectionObj] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  useEffect(() => { 
    if (sectionOptions.length > 0) {
      if (!selectedSectionId || !sectionOptions.find(s => s.id_section === Number(selectedSectionId))) {
        setSelectedSectionId(String(sectionOptions[0].id_section));
        setSectionObj(sectionOptions[0]);
      } else {
        setSectionObj(sectionOptions.find(s => s.id_section === Number(selectedSectionId)));
      }
    } else {
      setSectionObj(null);
      setSelectedSectionId('');
    }
  }, [sectionOptions, selectedSectionId]);

  // Derived records
  const records = useMemo(() => {
    if (!sectionObj) return [];
    const details = allDetails.filter(d => d.id_section === sectionObj.id_section);
    return details.map(d => {
      const reg = allRegistrations.find(r => r.id_registration === d.id_registration);
      const studentUser = allUsers.find(u => u.Student?.id_student === reg?.id_student);
      
      return {
        id_detail: d.id_detail,
        cedula: studentUser?.document_id || 'Sin CI',
        name: `${studentUser?.first_name || ''} ${studentUser?.first_lastname || ''}`.trim() || 'Estudiante Desconocido',
        grades: {
          c1: d.corte_1 || '',
          c2: d.corte_2 || '',
          c3: d.corte_3 || '',
          c4: d.corte_4 || ''
        },
        contents: { c1: '', c2: '', c3: '', c4: '' }, // We don't store this in DB currently
        grade_status: d.grade_status
      };
    });
  }, [sectionObj, allDetails, allRegistrations, allUsers]);

  const [editableRecords, setEditableRecords] = useState([]);
  
  useEffect(() => {
    setEditableRecords(records);
  }, [records]);

  const isEditWindowOpen = useMemo(() => {
    if (!sectionObj) return false;
    // If any student has grade_status === Confirmada, acta is closed.
    if (editableRecords.length > 0 && editableRecords[0].grade_status === 'Confirmada') return false;
    return true;
  }, [sectionObj, editableRecords]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return editableRecords;

    return editableRecords.filter((student) => {
      return student.cedula.toLowerCase().includes(term) || student.name.toLowerCase().includes(term);
    });
  }, [editableRecords, search]);

  const handleGradeChange = (detailId, cut, nextValue) => {
    if (!isEditWindowOpen) return;
    const normalized = clampGrade(nextValue);

    setEditableRecords((prev) => 
      prev.map(r => r.id_detail === detailId ? { ...r, grades: { ...r.grades, [cut]: normalized } } : r)
    );
  };

  const handleContentChange = (detailId, cut, nextValue) => {
    if (!isEditWindowOpen) return;
    setEditableRecords((prev) => 
      prev.map(r => r.id_detail === detailId ? { ...r, contents: { ...r.contents, [cut]: nextValue } } : r)
    );
  };

  const handleSaveGrades = async () => {
    if (!sectionObj) return;
    try {
      setIsSaving(true);
      await Promise.all(editableRecords.map(r => {
        const d = allDetails.find(detail => detail.id_detail === r.id_detail);
        if(!d) return Promise.resolve();
        
        // Simple 4-cut average
        const c1 = Number(r.grades.c1) || 0;
        const c2 = Number(r.grades.c2) || 0;
        const c3 = Number(r.grades.c3) || 0;
        const c4 = Number(r.grades.c4) || 0;
        let count = 0;
        if(r.grades.c1 !== '') count++;
        if(r.grades.c2 !== '') count++;
        if(r.grades.c3 !== '') count++;
        if(r.grades.c4 !== '') count++;
        
        const avg = count === 0 ? 0 : (c1 + c2 + c3 + c4) / count;
        
        let status = 'Cursando';
        if (avg >= 9.5 && count === 4) status = 'Aprobada'; // Simplified criteria
        else if (count === 4) status = 'Reprobada';

        return api.put(`/registration-details/${r.id_detail}`, {
          corte_1: r.grades.c1 === '' ? 0 : r.grades.c1,
          corte_2: r.grades.c2 === '' ? 0 : r.grades.c2,
          corte_3: r.grades.c3 === '' ? 0 : r.grades.c3,
          corte_4: r.grades.c4 === '' ? 0 : r.grades.c4,
          final_note: avg,
          subject_status: status
        });
      }));
      alert('Notas guardadas correctamente en la base de datos.');
      
      // Reload details to sync state
      const detRes = await api.get('/registration-details');
      setAllDetails((Array.isArray(detRes) ? detRes : detRes?.data));
    } catch(err) {
      console.error(err);
      alert('Error guardando notas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadRecord = () => {
    if (!sectionObj) return;

    const reportRows = editableRecords
      .map((student) => {
        const row = cuts
          .map((cut, index) => {
            const grade = student.grades[cut] || '--';
            const content = student.contents[cut] || 'Sin contenido';
            return `<li><strong>Corte ${index + 1}:</strong> ${grade} / <em>${content}</em></li>`;
          })
          .join('');

        return `
          <tr>
            <td>${student.cedula}</td>
            <td>${student.name}</td>
            <td>${computeAverage(student.grades)}</td>
            <td><ul>${row}</ul></td>
          </tr>
        `;
      })
      .join('');

    const printable = `
      <html>
        <head>
          <title>Acta de Notas - ${sectionObj.Subject?.name_subject}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            .meta { margin-bottom: 18px; color: #334155; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; text-align: left; }
            th { background: #f8fafc; }
            ul { margin: 0; padding-left: 16px; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>Constancia de Carga de Notas</h1>
          <div class="meta">
            <div><strong>Asignatura:</strong> ${sectionObj.Subject?.name_subject}</div>
            <div><strong>Seccion:</strong> ${sectionObj.section_code}</div>
            <div><strong>Carrera:</strong> ${sectionObj.Career?.name_career}</div>
            <div><strong>Periodo:</strong> ${sectionObj.AcademicPeriod?.name_period}</div>
            <div><strong>Fecha de emision:</strong> ${new Date().toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cedula</th>
                <th>Estudiante</th>
                <th>Promedio</th>
                <th>Detalle de cortes y contenido evaluado</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=980,height=720');
    if (!popup) return;
    popup.document.open();
    popup.document.write(printable);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const metrics = [
    {
      label: 'Estudiantes inscritos',
      value: editableRecords.length,
      hint: sectionObj ? `${sectionObj.Subject?.name_subject} - ${sectionObj.section_code}` : 'Selecciona una asignatura',
      icon: Users,
      tone: 'primary'
    }
  ];

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Modulo Docente"
        title="Cargar Calificaciones"
        subtitle="Cargando secciones y estudiantes..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Obteniendo datos desde el sistema...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Ver Estudiantes Inscritos y Registrar Evaluaciones"
      subtitle="Selecciona carrera, asignatura y seccion para cargar notas por estudiante en la base de datos."
      metrics={metrics}
      actions={(
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionButton variant="primary" onClick={handleSaveGrades} disabled={!sectionObj || !isEditWindowOpen || isSaving}>
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Notas'}
          </ActionButton>
          <ActionButton variant="accent" onClick={handleDownloadRecord} disabled={!sectionObj || !editableRecords.length}>
            <Download size={16} /> Descargar acta/listado
          </ActionButton>
        </div>
      )}
    >
      <SectionCard
        title="Seleccion academica"
        description="El listado de estudiantes aparece segun carrera, asignatura y seccion."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select className="form-input" value={career} onChange={(e) => setCareer(e.target.value)}>
              {careerOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Asignatura</span>
            <select className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Seccion</span>
            <select className="form-input" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)}>
              {sectionOptions.map((option) => (
                <option key={option.id_section} value={option.id_section}>{option.section_code}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <StatusBadge tone={isEditWindowOpen ? 'success' : 'warning'}>
            {isEditWindowOpen ? 'Edicion habilitada' : 'Acta cerrada / Solo lectura'}
          </StatusBadge>
          {sectionObj && isEditWindowOpen ? (
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
              No olvides pulsar "Guardar Notas" luego de hacer los cambios.
            </span>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Listado de estudiantes y evaluaciones"
        description="Busca por cedula o nombre. Registra los cortes. Se autoguardarán los valores."
      >
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
          <input
            className="form-input"
            placeholder="Buscar por cedula o nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ paddingLeft: '38px', minHeight: '44px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ minWidth: '1160px' }}>
            <thead>
              <tr>
                <th>Cedula</th>
                <th>Estudiante</th>
                <th>Corte 1</th>
                <th>Contenido 1</th>
                <th>Corte 2</th>
                <th>Contenido 2</th>
                <th>Corte 3</th>
                <th>Contenido 3</th>
                <th>Corte 4</th>
                <th>Contenido 4</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    No hay estudiantes inscritos en esta sección.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((student) => (
                  <tr key={student.id_detail}>
                    <td>{student.cedula}</td>
                    <td>{student.name}</td>

                    {cuts.map((cut, idx) => (
                      <React.Fragment key={`${student.id_detail}-${cut}`}>
                        <td>
                          <input
                            className="form-input"
                            value={student.grades[cut]}
                            disabled={!isEditWindowOpen}
                            onChange={(event) => handleGradeChange(student.id_detail, cut, event.target.value)}
                            placeholder={`C${idx + 1}`}
                            style={{ minWidth: '86px', padding: '9px 10px' }}
                          />
                        </td>
                        <td>
                          <input
                            className="form-input"
                            value={student.contents[cut]}
                            disabled={!isEditWindowOpen}
                            onChange={(event) => handleContentChange(student.id_detail, cut, event.target.value)}
                            placeholder={`Contenido corte ${idx + 1}`}
                            style={{ minWidth: '200px', padding: '9px 10px' }}
                          />
                        </td>
                      </React.Fragment>
                    ))}

                    <td>{computeAverage(student.grades)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AdminPageShell>
  );
}
