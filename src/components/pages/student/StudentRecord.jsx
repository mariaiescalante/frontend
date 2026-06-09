import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle2, FileText, Printer, ShieldAlert } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, DataTable, StatusBadge } from '../admin/AdminPageShell';
import { loadAcademicRecord, loadEnrolledSections, loadStudentProfile } from './studentStorage';

export default function StudentRecord() {
  const [profile] = useState(() => loadStudentProfile());
  const [record] = useState(() => loadAcademicRecord());
  const [enrolled] = useState(() => loadEnrolledSections());

  // Merge historical record with current enrolled courses (without grades)
  const fullHistory = React.useMemo(() => {
    const history = [...record];
    
    // Add enrolled sections as "Cursando" if they aren't already in history
    enrolled.forEach((course) => {
      const alreadyInHistory = history.some((h) => h.code === course.code && h.period === profile.currentPeriod);
      if (!alreadyInHistory) {
        history.push({
          code: course.code,
          name: course.name,
          credits: course.credits,
          grade: '--',
          status: 'Cursando',
          period: profile.currentPeriod
        });
      }
    });

    return history;
  }, [record, enrolled, profile]);

  // Group history by period for rendering
  const historyByPeriod = React.useMemo(() => {
    const periods = {};
    fullHistory.forEach((item) => {
      if (!periods[item.period]) {
        periods[item.period] = [];
      }
      periods[item.period].push(item);
    });
    return periods;
  }, [fullHistory]);

  // Calculations
  const completedCourses = record.filter((item) => item.status === 'Aprobada' || item.status === 'Reprobada');
  
  const totalPassedCredits = record
    .filter((item) => item.status === 'Aprobada')
    .reduce((sum, item) => sum + item.credits, 0);

  const averageGrade = React.useMemo(() => {
    const graded = completedCourses.filter((c) => typeof c.grade === 'number');
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, c) => acc + c.grade, 0);
    return sum / graded.length;
  }, [completedCourses]);

  const handlePrintRecord = () => {
    // Generate chronological rows for the PDF printout
    const sortedPeriods = Object.keys(historyByPeriod).sort();
    
    let tableHtml = '';
    sortedPeriods.forEach((period) => {
      tableHtml += `
        <tr>
          <td colspan="5" style="background-color: #f8fafc; font-weight: 800; color: #051124; padding: 10px; font-size: 0.85rem; border: 1px solid #cbd5e1;">
            PERÍODO ACADÉMICO: ${period}
          </td>
        </tr>
      `;
      
      historyByPeriod[period].forEach((course) => {
        let statusColor = '#475569';
        if (course.status === 'Aprobada') statusColor = '#16a34a';
        if (course.status === 'Reprobada') statusColor = '#dc2626';

        tableHtml += `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${course.code}</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">${course.name}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${course.credits} UC</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: 700;">${course.grade}</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: ${statusColor}; font-weight: 700; font-size: 0.78rem; text-transform: uppercase;">
              ${course.status}
            </td>
          </tr>
        `;
      });
    });

    const printableHtml = `
      <html>
        <head>
          <title>Récord Académico de Calificaciones - ${profile.cedula}</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              margin: 40px;
              color: #0f172a;
              background-color: #ffffff;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
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
              margin: 20px 0 35px 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #051124;
              padding-bottom: 8px;
            }
            .student-info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 30px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 18px;
            }
            .info-item {
              font-size: 0.88rem;
              line-height: 1.5;
            }
            .info-item strong {
              color: #475569;
              font-size: 0.78rem;
              text-transform: uppercase;
              display: block;
              margin-bottom: 2px;
            }
            .info-item span {
              color: #0f172a;
              font-weight: 700;
            }
            table.record-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            table.record-table th {
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
            table.record-table td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              font-size: 0.82rem;
            }
            .summary-box {
              margin-top: 30px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 16px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
            .summary-stat {
              font-size: 0.95rem;
              font-weight: 800;
              color: #051124;
            }
            .summary-stat small {
              display: block;
              font-size: 0.72rem;
              color: #475569;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .signatures-container {
              margin-top: 70px;
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
              margin-top: 70px;
              text-align: center;
              font-size: 0.72rem;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="header-logo-cell">
                <div style="background-color: #051124; padding: 8px; border-radius: 10px; display: inline-block;">
                  <span style="color: #ffffff; font-weight: 900; font-family: sans-serif; font-size: 20px; letter-spacing: 1px;">SGUMS</span>
                </div>
              </td>
              <td class="header-text-cell">
                <h2>Universidad Politécnica Territorial del Norte del Táchira</h2>
                <p>Secretaría General · Departamento de Registro y Control Académico</p>
              </td>
            </tr>
          </table>

          <div class="doc-title">Récord Histórico de Notas y Trayecto Académico</div>

          <div class="student-info-grid">
            <div class="info-item">
              <strong>Estudiante</strong>
              <span>${profile.name} ${profile.lastname}</span>
            </div>
            <div class="info-item">
              <strong>Cédula de Identidad</strong>
              <span>${profile.cedula}</span>
            </div>
            <div class="info-item">
              <strong>Carrera / Programa</strong>
              <span>${profile.career}</span>
            </div>
            <div class="info-item">
              <strong>Facultad</strong>
              <span>Facultad de ${profile.faculty}</span>
            </div>
          </div>

          <table class="record-table">
            <thead>
              <tr>
                <th style="width: 15%;">Código</th>
                <th style="width: 50%;">Asignatura</th>
                <th style="text-align: center; width: 12%;">Créditos</th>
                <th style="text-align: center; width: 10%;">Calificación</th>
                <th style="text-align: center; width: 13%;">Estatus</th>
              </tr>
            </thead>
            <tbody>
              ${tableHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-stat">
              <small>Índice de Rendimiento Acumulado (CUM)</small>
              <span>${averageGrade.toFixed(2)} / 20</span>
            </div>
            <div class="summary-stat">
              <small>Créditos Aprobados Acumulados</small>
              <span>${totalPassedCredits} / ${profile.creditsRequired} UC</span>
            </div>
          </div>

          <div class="signatures-container">
            <div class="signature-box">
              <strong>Coordinador(a) de Registro Académico</strong><br>
              UPTNT Manuela Sáenz
            </div>
            <div class="signature-box">
              <strong>Secretaría General</strong><br>
              Firma y Sello Oficial
            </div>
          </div>

          <div class="footer">
            Este récord representa el historial académico verificado del estudiante.<br>
            Emitido el ${new Date().toLocaleString()} · Sistema de Gestión Universitaria (SGUMS)
          </div>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=1000,height=750');
    if (!popup) return;
    popup.document.open();
    popup.document.write(printableHtml);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 250);
  };

  const metrics = [
    {
      label: 'Promedio General (CUM)',
      value: `${averageGrade.toFixed(2)} / 20`,
      hint: 'Cálculo basado en materias finalizadas',
      icon: Award,
      tone: 'info'
    },
    {
      label: 'Créditos Aprobados',
      value: `${totalPassedCredits} UC`,
      hint: `Requeridos para graduación: ${profile.creditsRequired} UC`,
      icon: BookOpen,
      tone: 'success'
    },
    {
      label: 'Materias Históricas',
      value: completedCourses.length,
      hint: `${record.filter((c) => c.status === 'Aprobada').length} Aprobadas · ${record.filter((c) => c.status === 'Reprobada').length} Reprobadas`,
      icon: CheckCircle2,
      tone: 'primary'
    }
  ];

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Récord y Trayectoria Académica"
      subtitle="Consulta tu historial oficial de calificaciones obtenidas por periodo lectivo, créditos aprobados y descarga tu expediente de notas digital."
      metrics={metrics}
      actions={
        <ActionButton variant="accent" onClick={handlePrintRecord}>
          <Printer size={16} /> Descargar Récord Académico
        </ActionButton>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Render periods in descending order (newest first) */}
        {Object.keys(historyByPeriod)
          .sort((a, b) => b.localeCompare(a))
          .map((period) => (
            <SectionCard
              key={period}
              title={`Periodo Académico: ${period}`}
              description="Calificaciones finales consolidadas en este ciclo de estudios."
            >
              <DataTable columns={['Código', 'Asignatura', 'Créditos', 'Calificación', 'Estatus']}>
                {historyByPeriod[period].map((course) => {
                  let tone = 'neutral';
                  if (course.status === 'Aprobada') tone = 'success';
                  if (course.status === 'Reprobada') tone = 'danger';
                  if (course.status === 'Cursando') tone = 'info';

                  return (
                    <tr key={course.code}>
                      <td>
                        <strong>{course.code}</strong>
                      </td>
                      <td>{course.name}</td>
                      <td>{course.credits} UC</td>
                      <td style={{ fontWeight: '800' }}>{course.grade}</td>
                      <td>
                        <StatusBadge tone={tone}>{course.status}</StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            </SectionCard>
          ))}
      </div>
    </AdminPageShell>
  );
}
