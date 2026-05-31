import React, { useMemo, useState } from 'react';
import { Download, Search, Users } from 'lucide-react';
import { ActionButton, AdminPageShell, SectionCard, StatusBadge } from '../admin/AdminPageShell';
import { cloneEnrollments, teacherAssignments } from './teacherSeedData';
import { loadActStatusMap } from './teacherStorage';

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
  const [enrollments, setEnrollments] = useState(() => cloneEnrollments());
  const [search, setSearch] = useState('');

  const careerOptions = useMemo(
    () => [...new Set(teacherAssignments.map((item) => item.career))],
    []
  );

  const [career, setCareer] = useState(careerOptions[0] || '');

  const subjectOptions = useMemo(() => {
    return teacherAssignments
      .filter((item) => item.career === career)
      .map((item) => item.subject);
  }, [career]);

  const [subject, setSubject] = useState(subjectOptions[0] || '');

  const sectionOptions = useMemo(() => {
    return teacherAssignments
      .filter((item) => item.career === career && item.subject === subject)
      .map((item) => item.section);
  }, [career, subject]);

  const [section, setSection] = useState(sectionOptions[0] || '');

  const assignment = useMemo(() => {
    return teacherAssignments.find(
      (item) => item.career === career && item.subject === subject && item.section === section
    );
  }, [career, subject, section]);

  const statusMap = useMemo(() => loadActStatusMap(), []);
  const currentActStatus = assignment ? (statusMap[assignment.id] || assignment.actStatus) : 'abierta';

  const isEditWindowOpen = useMemo(() => {
    if (!assignment) return false;
    const editableByDate = new Date() <= new Date(assignment.editableUntil);
    return editableByDate && currentActStatus !== 'cerrada';
  }, [assignment, currentActStatus]);

  const records = assignment ? enrollments[assignment.id] || [] : [];

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;

    return records.filter((student) => {
      return student.cedula.toLowerCase().includes(term) || student.name.toLowerCase().includes(term);
    });
  }, [records, search]);

  const metrics = [
    {
      label: 'Estudiantes inscritos',
      value: records.length,
      hint: assignment ? `${assignment.subject} - ${assignment.section}` : 'Selecciona una asignatura',
      icon: Users,
      tone: 'primary'
    }
  ];

  const updateStudent = (studentId, updater) => {
    if (!assignment || !isEditWindowOpen) return;

    setEnrollments((prev) => {
      const currentList = prev[assignment.id] || [];
      const nextList = currentList.map((student) => {
        if (student.id !== studentId) return student;
        return updater(student);
      });
      return { ...prev, [assignment.id]: nextList };
    });
  };

  const handleGradeChange = (studentId, cut, nextValue) => {
    const normalized = clampGrade(nextValue);

    updateStudent(studentId, (student) => ({
      ...student,
      grades: {
        ...student.grades,
        [cut]: normalized
      }
    }));
  };

  const handleContentChange = (studentId, cut, nextValue) => {
    updateStudent(studentId, (student) => ({
      ...student,
      contents: {
        ...student.contents,
        [cut]: nextValue
      }
    }));
  };

  const handleDownloadRecord = () => {
    if (!assignment) return;

    const reportRows = records
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
          <title>Acta de Notas - ${assignment.subject}</title>
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
            <div><strong>Asignatura:</strong> ${assignment.subject}</div>
            <div><strong>Seccion:</strong> ${assignment.section}</div>
            <div><strong>Carrera:</strong> ${assignment.career}</div>
            <div><strong>Periodo:</strong> ${assignment.period}</div>
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

  return (
    <AdminPageShell
      eyebrow="Modulo Docente"
      title="Ver Estudiantes Inscritos y Registrar Evaluaciones"
      subtitle="Selecciona carrera, asignatura y seccion para cargar notas por estudiante, registrar contenido evaluado y descargar constancia."
      metrics={metrics}
      actions={(
        <ActionButton variant="accent" onClick={handleDownloadRecord} disabled={!assignment || !records.length}>
          <Download size={16} /> Descargar acta/listado
        </ActionButton>
      )}
    >
      <SectionCard
        title="Seleccion academica"
        description="El listado de estudiantes aparece segun carrera, asignatura y seccion."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Carrera</span>
            <select
              className="form-input"
              value={career}
              onChange={(event) => {
                const nextCareer = event.target.value;
                setCareer(nextCareer);

                const nextSubjectOptions = teacherAssignments
                  .filter((item) => item.career === nextCareer)
                  .map((item) => item.subject);

                const nextSubject = nextSubjectOptions[0] || '';
                setSubject(nextSubject);

                const nextSections = teacherAssignments
                  .filter((item) => item.career === nextCareer && item.subject === nextSubject)
                  .map((item) => item.section);

                setSection(nextSections[0] || '');
              }}
            >
              {careerOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Asignatura</span>
            <select
              className="form-input"
              value={subject}
              onChange={(event) => {
                const nextSubject = event.target.value;
                setSubject(nextSubject);
                const nextSections = teacherAssignments
                  .filter((item) => item.career === career && item.subject === nextSubject)
                  .map((item) => item.section);
                setSection(nextSections[0] || '');
              }}
            >
              {subjectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">Seccion</span>
            <select className="form-input" value={section} onChange={(event) => setSection(event.target.value)}>
              {sectionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <StatusBadge tone={isEditWindowOpen ? 'success' : 'warning'}>
            {isEditWindowOpen ? 'Edicion habilitada' : 'Fuera de tiempo o acta cerrada'}
          </StatusBadge>
          {assignment ? (
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Puedes modificar notas hasta {new Date(assignment.editableUntil).toLocaleDateString()}.
            </span>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Listado de estudiantes y evaluaciones"
        description="Busca por cedula o nombre. Registra 4 cortes y el contenido evaluado por cada nota."
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
              {filteredRecords.map((student) => (
                <tr key={student.id}>
                  <td>{student.cedula}</td>
                  <td>{student.name}</td>

                  {cuts.map((cut, idx) => (
                    <React.Fragment key={`${student.id}-${cut}`}>
                      <td>
                        <input
                          className="form-input"
                          value={student.grades[cut]}
                          disabled={!isEditWindowOpen}
                          onChange={(event) => handleGradeChange(student.id, cut, event.target.value)}
                          placeholder={`C${idx + 1}`}
                          style={{ minWidth: '86px', padding: '9px 10px' }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input"
                          value={student.contents[cut]}
                          disabled={!isEditWindowOpen}
                          onChange={(event) => handleContentChange(student.id, cut, event.target.value)}
                          placeholder={`Contenido corte ${idx + 1}`}
                          style={{ minWidth: '200px', padding: '9px 10px' }}
                        />
                      </td>
                    </React.Fragment>
                  ))}

                  <td>{computeAverage(student.grades)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AdminPageShell>
  );
}
