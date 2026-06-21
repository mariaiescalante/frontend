import React, { useMemo, useState, useEffect } from 'react';
import { Download, Search, Users, Save, FileSpreadsheet, Printer } from 'lucide-react';
import { ActionButton, AdminPageShell, SectionCard, StatusBadge, CustomSelect } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';
import { logoBase64 } from '../../../assets/logoConstant';

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
        
        const rawSec = Array.isArray(secRes) ? secRes : (secRes?.data || []);
        const teacherSections = rawSec.filter(s => s.id_teacher === user.id_teacher);
        setAssignments(teacherSections);
        setAllDetails(Array.isArray(detRes) ? detRes : (detRes?.data || []));
        setAllRegistrations(Array.isArray(regRes) ? regRes : (regRes?.data || []));
        setAllUsers(Array.isArray(userRes) ? userRes : (userRes?.data || []));
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
        if (avg >= 9.5 && count === 4) status = 'Aprobado'; // Simplified criteria
        else if (count === 4) status = 'Reprobado';

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
      setAllDetails(Array.isArray(detRes) ? detRes : (detRes?.data || []));
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
            <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${student.cedula}</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${student.name}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700;">${computeAverage(student.grades)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;"><ul>${row}</ul></td>
          </tr>
        `;
      })
      .join('');

    const printable = `
      <html>
        <head>
          <title>Acta de Notas - ${sectionObj.Subject?.name_subject}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              margin: 20px;
              color: #0f172a;
              background-color: #ffffff;
            }
            #element-to-print {
              width: 720px;
              padding-right: 25px;
              box-sizing: border-box;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .header-logo-cell {
              width: 80px;
              vertical-align: middle;
            }
            .header-text-cell {
              text-align: left;
              vertical-align: middle;
              padding-left: 15px;
            }
            .header-text-cell h2 {
              margin: 0;
              font-size: 1.15rem;
              color: #051124;
              font-weight: 800;
              letter-spacing: 0.02em;
            }
            .header-text-cell p {
              margin: 4px 0 0 0;
              font-size: 0.75rem;
              color: #475569;
              text-transform: uppercase;
              font-weight: 600;
            }
            .doc-title {
              text-align: center;
              font-size: 1.35rem;
              font-weight: 800;
              color: #051124;
              margin: 15px 0 25px 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #051124;
              padding-bottom: 8px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 25px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 18px;
            }
            .meta-item {
              font-size: 0.88rem;
              line-height: 1.5;
            }
            .meta-item strong {
              color: #475569;
              font-size: 0.78rem;
              text-transform: uppercase;
              display: block;
              margin-bottom: 2px;
            }
            .meta-item span {
              color: #0f172a;
              font-weight: 700;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            table.data-table th {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              font-size: 0.75rem;
              text-align: left;
              background-color: #f1f5f9;
              color: #051124;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            ul { margin: 0; padding-left: 16px; font-size: 0.78rem; }
            li { margin-bottom: 2px; }
            .signatures-container {
              margin-top: 50px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 100px;
              text-align: center;
            }
            .signature-box {
              border-top: 1px solid #64748b;
              padding-top: 8px;
              font-size: 0.8rem;
              color: #475569;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 0.72rem;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div id="element-to-print">
            <table class="header-table">
              <tr>
                <td class="header-logo-cell">
                  <img src="${logoBase64}" alt="Logo UPTNT" style="width: 70px; height: auto; display: block;" />
                </td>
                <td class="header-text-cell">
                  <h2>Universidad Politécnica Territorial del Norte del Táchira</h2>
                  <p>Dirección de Control de Estudios · Registro de Calificaciones</p>
                </td>
              </tr>
            </table>

            <div class="doc-title">Constancia de Carga de Notas y Listado de Estudiantes</div>

            <div class="meta-grid">
              <div class="meta-item">
                <strong>Asignatura / Sección</strong>
                <span>${sectionObj.Subject?.name_subject || 'Desconocido'} - Sección ${sectionObj.section_code || ''}</span>
              </div>
              <div class="meta-item">
                <strong>Carrera</strong>
                <span>${sectionObj.Career?.name_career || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <strong>Período Académico</strong>
                <span>${sectionObj.AcademicPeriod?.name_period || 'N/A'}</span>
              </div>
              <div class="meta-item">
                <strong>Fecha de Emisión</strong>
                <span>${new Date().toLocaleString()}</span>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Cédula</th>
                  <th style="width: 35%;">Estudiante</th>
                  <th style="width: 10%; text-align: center;">Promedio</th>
                  <th style="width: 40%;">Detalle de Cortes y Contenido</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
              </tbody>
            </table>

            <div class="signatures-container">
              <div class="signature-box">
                <strong>Firma del Docente</strong><br>
                ${user?.first_name || ''} ${user?.first_lastname || ''}
              </div>
              <div class="signature-box">
                <strong>Coordinación Académica</strong><br>
                UPTNT Manuela Sáenz
              </div>
            </div>

            <div class="footer">
              Este documento representa el listado oficial de carga de notas emitido por el docente.<br>
              Sistema de Gestión Universitaria (SGUMS)
            </div>
          </div>

          <script>
            window.onload = function() {
              const element = document.getElementById('element-to-print');
              const opt = {
                margin:       15,
                filename:     'Listado_${(sectionObj.Subject?.name_subject || 'Estudiantes').replace(/[^a-zA-Z0-9]/g, '_')}_Seccion_${sectionObj.section_code || ''}.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
              };
              html2pdf().from(element).set(opt).save().then(() => {
                setTimeout(() => window.close(), 800);
              }).catch(err => {
                console.error('Error generating PDF with html2pdf, falling back to window.print', err);
                window.print();
              });
            };
          </script>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=980,height=720');
    if (!popup) return;
    popup.document.open();
    popup.document.write(printable);
    popup.document.close();
  };

  const handleDownloadExcel = () => {
    if (!sectionObj || !filteredRecords.length) return;

    const headers = [
      'Cédula',
      'Estudiante',
      'Corte 1',
      'Contenido 1',
      'Corte 2',
      'Contenido 2',
      'Corte 3',
      'Contenido 3',
      'Corte 4',
      'Contenido 4',
      'Promedio'
    ];

    const rows = filteredRecords.map(student => [
      student.cedula,
      student.name,
      student.grades.c1 || '',
      student.contents.c1 || '',
      student.grades.c2 || '',
      student.contents.c2 || '',
      student.grades.c3 || '',
      student.contents.c3 || '',
      student.grades.c4 || '',
      student.contents.c4 || '',
      computeAverage(student.grades)
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const filename = `Listado_${sectionObj.Subject?.name_subject || 'Estudiantes'}_${sectionObj.section_code || ''}`
      .replace(/[^a-zA-Z0-9_]/g, '_');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Printer size={16} /> Descargar PDF / Imprimir Listado
          </ActionButton>
          <ActionButton variant="secondary" onClick={handleDownloadExcel} disabled={!sectionObj || !editableRecords.length}>
            <FileSpreadsheet size={16} /> Descargar Excel (.csv)
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
            <CustomSelect
              value={career}
              onChange={(val) => setCareer(String(val))}
              options={careerOptions.map((option) => ({
                value: option,
                label: option
              }))}
            />
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Asignatura</span>
            <CustomSelect
              value={subject}
              onChange={(val) => setSubject(String(val))}
              options={subjectOptions.map((option) => ({
                value: option,
                label: option
              }))}
            />
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Seccion</span>
            <CustomSelect
              value={selectedSectionId}
              onChange={(val) => setSelectedSectionId(String(val))}
              options={sectionOptions.map((option) => ({
                value: String(option.id_section),
                label: option.section_code
              }))}
            />
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
