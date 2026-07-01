import React, { useState, useEffect, useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, FileText, Printer, ShieldAlert } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, DataTable, StatusBadge } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';
import { logoBase64 } from '../../../assets/logoConstant';

export default function StudentRecord() {
  const { user } = useAuth();
  const [fullHistory, setFullHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      if (!user) return;
      try {
        setLoading(true);
        const [regRes, regDetRes, secRes, periodsRes] = await Promise.all([
          api.get('/registrations'),
          api.get('/registration-details'),
          api.get('/sections'),
          api.get('/periods')
        ]);
        
        const rawReg = Array.isArray(regRes) ? regRes : (regRes?.data || []);
        const rawRegDetails = Array.isArray(regDetRes) ? regDetRes : (regDetRes?.data || []);
        const rawSections = Array.isArray(secRes) ? secRes : (secRes?.data || []);
        const periodsList = Array.isArray(periodsRes) ? periodsRes : (periodsRes?.data || []);
        
        const periodMap = {};
        periodsList.forEach(p => {
          periodMap[p.id_period] = p.name_period;
        });

        const studentRegistrations = rawReg.filter(r => r.id_student === user.id_student);
        const studentRegIds = studentRegistrations.map(r => r.id_registration);
        const studentDetails = rawRegDetails.filter(d => studentRegIds.includes(d.id_registration) && d.subject_status !== 'Retirado');

        const history = studentDetails.map(d => {
          const sec = rawSections.find(s => s.id_section === d.id_section);
          const subj = sec?.Subject;
          const reg = studentRegistrations.find(r => r.id_registration === d.id_registration);
          const periodName = periodMap[reg?.id_period] || 'Desconocido';
          
          let statusStr = 'Pendiente';
          if (d.subject_status === 'Aprobada' || d.subject_status === 'Aprobado') statusStr = 'Aprobada';
          else if (d.subject_status === 'Reprobada' || d.subject_status === 'Reprobado') statusStr = 'Reprobada';
          else if (d.subject_status === 'En curso' || d.subject_status === 'Cursando') statusStr = 'Cursando';

          return {
            code: subj?.code_subject || '',
            name: subj?.name_subject || 'Desconocido',
            credits: subj?.credit_units || 0,
            grade: (statusStr === 'Cursando' || statusStr === 'Pendiente') ? '--' : d.final_note,
            status: statusStr,
            period: periodName
          };
        });

        setFullHistory(history);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [user]);

  const profile = {
    name: user?.first_name || '',
    lastname: user?.first_lastname || '',
    cedula: user?.document_id || '',
    career: user?.career || '',
    faculty: 'N/A', // Assuming faculty is not provided directly in user profile
    creditsRequired: 160 // Fallback assuming 160 UC required for graduation
  };

  const historyByPeriod = useMemo(() => {
    const periods = {};
    fullHistory.forEach((item) => {
      if (!periods[item.period]) {
        periods[item.period] = [];
      }
      periods[item.period].push(item);
    });
    return periods;
  }, [fullHistory]);

  const completedCourses = fullHistory.filter((item) => item.status === 'Aprobada' || item.status === 'Reprobada');
  
  const totalPassedCredits = fullHistory
    .filter((item) => item.status === 'Aprobada')
    .reduce((sum, item) => sum + item.credits, 0);

  const averageGrade = useMemo(() => {
    const graded = completedCourses.filter((c) => typeof c.grade === 'number' || !isNaN(Number(c.grade)));
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, c) => acc + Number(c.grade), 0);
    return sum / graded.length;
  }, [completedCourses]);

  const handlePrintRecord = () => {
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
            .student-info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 25px;
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
              margin-top: 25px;
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
                <span>${Number(averageGrade || 0).toFixed(2)} / 20</span>
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
          </div>

          <script>
            window.onload = function() {
              const element = document.getElementById('element-to-print');
              const opt = {
                margin:       15,
                filename:     'Record_Academico_${profile.cedula}.pdf',
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

    const popup = window.open('', '_blank', 'width=1000,height=750');
    if (!popup) return;
    popup.document.open();
    popup.document.write(printableHtml);
    popup.document.close();
  };

  const metrics = [
    {
      label: 'Promedio General (CUM)',
      value: `${Number(averageGrade || 0).toFixed(2)} / 20`,
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
      hint: `${fullHistory.filter((c) => c.status === 'Aprobada').length} Aprobadas · ${fullHistory.filter((c) => c.status === 'Reprobada').length} Reprobadas`,
      icon: CheckCircle2,
      tone: 'primary'
    }
  ];

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Récord y Trayectoria Académica"
        subtitle="Cargando récord académico..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Consultando datos académicos...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Récord y Trayectoria Académica"
      subtitle="Consulta tu historial oficial de calificaciones obtenidas por periodo lectivo, créditos aprobados y descarga tu expediente de notas digital."
      metrics={metrics}
      actions={
        fullHistory.length > 0 && (
          <ActionButton variant="accent" onClick={handlePrintRecord}>
            <Printer size={16} /> Descargar PDF / Imprimir Récord
          </ActionButton>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.keys(historyByPeriod).length === 0 ? (
           <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
             <FileText size={64} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
             <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
               Sin Récord Académico
             </h2>
             <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
               Aún no tienes calificaciones registradas en el sistema.
             </p>
           </div>
        ) : (
          Object.keys(historyByPeriod)
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
            ))
        )}
      </div>
    </AdminPageShell>
  );
}
