import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, Printer, Clock, MapPin, User, FileText } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard, DataTable } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function StudentSchedule() {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePeriodName, setActivePeriodName] = useState('');

  useEffect(() => {
    async function loadSchedule() {
      if (!user) return;
      try {
        setLoading(true);
        const [regRes, regDetRes, secRes, periodsRes] = await Promise.all([
          api.get('/registrations'),
          api.get('/registration-details'),
          api.get('/sections'),
          api.get('/periods')
        ]);
        
        // Unwrap responses safely
        const rawPeriods = Array.isArray(periodsRes) ? periodsRes : (periodsRes?.data || []);
        const activePeriod = rawPeriods.find(p => p.enrollment_status === 'Abierta');
        if (!activePeriod) {
          setEnrolled([]);
          return;
        }

        setActivePeriodName(activePeriod.name_period);

        const rawReg = Array.isArray(regRes) ? regRes : (regRes?.data || []);
        const studentReg = rawReg.find(r => r.id_student === user.id_student && r.id_period === activePeriod.id_period);
        
        if (!studentReg) {
          setEnrolled([]);
          return;
        }

        const rawRegDet = Array.isArray(regDetRes) ? regDetRes : (regDetRes?.data || []);
        const studentDetails = rawRegDet.filter(d => d.id_registration === studentReg.id_registration);
        
        const rawSec = Array.isArray(secRes) ? secRes : (secRes?.data || []);
        
        const mappedEnrolled = studentDetails.map(d => {
          const sec = rawSec.find(s => s.id_section === d.id_section);
          return {
            code: sec?.Subject?.code_subject || '',
            name: sec?.Subject?.name_subject || '',
            sectionCode: sec?.section_code || '',
            credits: sec?.Subject?.credit_units || 0,
            schedule: sec?.schedule_info || '',
            classroom: sec?.classroom || '',
            teacher: sec?.Teacher?.User ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}` : 'Sin docente'
          };
        });

        setEnrolled(mappedEnrolled);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [user]);

  const profile = {
    name: user?.first_name || '',
    lastname: user?.first_lastname || '',
    cedula: user?.document_id || '',
    career: user?.career || '',
    currentPeriod: activePeriodName || 'Actual'
  };

  // Group classes by day for the visual weekly planner
  const weeklyPlanner = useMemo(() => {
    const days = {
      Lunes: [],
      Martes: [],
      Miércoles: [],
      Jueves: [],
      Viernes: []
    };

    enrolled.forEach((course) => {
      if (!course.schedule) return;
      const parts = course.schedule.split(' ');
      if (parts.length < 2) return;
      const daysPart = parts[0]; 
      const timePart = parts.slice(1).join(' '); 

      const scheduleDays = daysPart.split('/');
      scheduleDays.forEach((d) => {
        if (days[d]) {
          days[d].push({
            code: course.code,
            name: course.name,
            section: course.sectionCode,
            time: timePart,
            classroom: course.classroom
          });
        }
      });
    });

    Object.keys(days).forEach((d) => {
      days[d].sort((a, b) => a.time.localeCompare(b.time));
    });

    return days;
  }, [enrolled]);

  const handlePrintComprobante = () => {
    if (enrolled.length === 0) return;

    const tableRows = enrolled
      .map(
        (course) => `
        <tr>
          <td><strong>${course.code}</strong></td>
          <td>${course.name}</td>
          <td>${course.sectionCode}</td>
          <td style="text-align: center;">${course.credits} UC</td>
          <td>${course.schedule}</td>
          <td>${course.classroom}</td>
          <td>${course.teacher}</td>
        </tr>
      `
      )
      .join('');

    const totalCredits = enrolled.reduce((sum, c) => sum + c.credits, 0);

    const printableHtml = `
      <html>
        <head>
          <title>Comprobante de Inscripción - ${profile.cedula}</title>
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
              margin: 20px 0 30px 0;
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
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            table.data-table th, table.data-table td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              font-size: 0.82rem;
              text-align: left;
            }
            table.data-table th {
              background-color: #f1f5f9;
              color: #051124;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 0.75rem;
              letter-spacing: 0.04em;
            }
            .totals-row {
              margin-top: 20px;
              text-align: right;
              font-size: 0.95rem;
              font-weight: 800;
              color: #051124;
              padding-right: 12px;
            }
            .signatures-container {
              margin-top: 80px;
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
              margin-top: 80px;
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
                <p>Dirección de Control de Estudios · Coordinación Académica</p>
              </td>
            </tr>
          </table>

          <div class="doc-title">Comprobante Oficial de Inscripción</div>

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
              <strong>Período Académico</strong>
              <span>Período ${profile.currentPeriod}</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Asignatura</th>
                <th>Sección</th>
                <th style="text-align: center;">Créditos</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Docente</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="totals-row">
            Total de Unidades de Crédito Inscritas: ${totalCredits} UC
          </div>

          <div class="signatures-container">
            <div class="signature-box">
              <strong>Firma del Estudiante</strong><br>
              ${profile.name} ${profile.lastname}
            </div>
            <div class="signature-box">
              <strong>Coordinación de Control de Estudios</strong><br>
              UPTNT Manuela Sáenz
            </div>
          </div>

          <div class="footer">
            Este documento representa una constancia formal digitalizada de inscripción.<br>
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

  if (loading) {
    return (
      <AdminPageShell
        eyebrow="Portal del Estudiante"
        title="Consulta de Horario Escolar"
        subtitle="Visualiza tu agenda semanal de clases..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando horario...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Consulta de Horario Escolar"
      subtitle="Visualiza tu agenda semanal de clases, aulas asignadas y descarga tu comprobante de inscripción oficial en PDF."
      actions={
        enrolled.length > 0 && (
          <ActionButton variant="accent" onClick={handlePrintComprobante}>
            <Printer size={16} /> Imprimir Comprobante
          </ActionButton>
        )
      }
    >
      {enrolled.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '18px' }}>
          <Calendar size={64} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Sin Carga Académica Registrada
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Aún no has inscrito asignaturas para el periodo actual <strong>{activePeriodName || 'Actual'}</strong>. Para ver tu horario, primero debes completar el proceso de inscripción.
          </p>
          <Link to="/student/enrollment" style={{ textDecoration: 'none' }}>
            <ActionButton variant="primary">Ir a Inscribir Materias</ActionButton>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SectionCard
            title="Planificador Semanal"
            description="Distribución de tus clases de Lunes a Viernes según las secciones inscritas."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '14px' }}>
              {Object.keys(weeklyPlanner).map((day) => {
                const classes = weeklyPlanner[day];
                return (
                  <div
                    key={day}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minHeight: '260px'
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: '#051124',
                        textTransform: 'uppercase',
                        borderBottom: '2px solid #cbd5e1',
                        paddingBottom: '6px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {day}
                    </span>

                    {classes.length === 0 ? (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#94a3b8',
                          fontStyle: 'italic',
                          marginTop: '10px',
                          display: 'block',
                          textAlign: 'center'
                        }}
                      >
                        Sin clases
                      </span>
                    ) : (
                      classes.map((cls, idx) => (
                        <div
                          key={`${cls.code}-${idx}`}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                          }}
                        >
                          <strong style={{ fontSize: '0.82rem', color: '#0f172a', lineHeight: 1.2 }}>
                            {cls.name}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} /> {cls.time}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={10} /> {cls.classroom}
                          </span>
                          <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '2px' }}>
                            Secc. {cls.section}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Listado Detallado de Carga Horaria"
            description="Detalle completo de materias, docentes y ubicación de aulas."
          >
            <DataTable columns={['Código', 'Materia', 'Sección', 'Créditos', 'Horario', 'Aula', 'Docente']}>
              {enrolled.map((course) => (
                <tr key={course.code}>
                  <td>
                    <strong>{course.code}</strong>
                  </td>
                  <td>{course.name}</td>
                  <td>{course.sectionCode}</td>
                  <td>{course.credits} UC</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: '#64748b' }} />
                      <span>{course.schedule}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: '#64748b' }} />
                      <span>{course.classroom}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      <span>{course.teacher}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>
        </div>
      )}
    </AdminPageShell>
  );
}
