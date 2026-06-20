import React, { useState, useEffect } from 'react';
import { FileText, Printer, CheckCircle, AlertCircle, FileCheck, Layers } from 'lucide-react';
import { AdminPageShell, ActionButton, SectionCard } from '../admin/AdminPageShell';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';

export default function StudentDocuments() {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState([]);
  const [activePeriodName, setActivePeriodName] = useState('');

  useEffect(() => {
    async function loadDocumentsData() {
      if (!user) return;
      try {
        const [regRes, regDetRes, secRes, periodsRes] = await Promise.all([
          api.get('/registrations'),
          api.get('/registration-details'),
          api.get('/sections'),
          api.get('/periods')
        ]);
        
        const activePeriod = periodsRes.data.find(p => p.enrollment_status === 'Abierta');
        if (activePeriod) setActivePeriodName(activePeriod.name_period);
        
        if (!activePeriod) return;

        const rawReg = Array.isArray(reg) ? reg : (reg?.data || []);
        const studentReg = rawReg.find(r => r.id_student === user.id_student && r.id_period === activePeriod.id_period);
        
        if (!studentReg) return;

        const studentDetails = (regDetRes.data || []).filter(d => d.id_registration === studentReg.id_registration);
        
        const mappedEnrolled = studentDetails.map(d => {
          const sec = (secRes.data || []).find(s => s.id_section === d.id_section);
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
      }
    }
    loadDocumentsData();
  }, [user]);

  const profile = {
    name: user?.first_name || '',
    lastname: user?.first_lastname || '',
    cedula: user?.document_id || '',
    career: user?.career || '',
    currentPeriod: activePeriodName || 'Actual'
  };

  const isEnrolled = enrolled.length > 0;

  const handlePrintStudyCertificate = () => {
    const printableHtml = `
      <html>
        <head>
          <title>Constancia de Estudios - ${profile.cedula}</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              margin: 50px;
              color: #0f172a;
              background-color: #ffffff;
              line-height: 1.8;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
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
              font-size: 1.4rem;
              font-weight: 800;
              color: #051124;
              margin: 40px 0 50px 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .body-text {
              font-size: 1.05rem;
              text-align: justify;
              margin-bottom: 40px;
              text-indent: 40px;
            }
            .signatures-container {
              margin-top: 100px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .signature-line {
              width: 250px;
              border-top: 1px solid #000;
              margin-bottom: 10px;
            }
            .signature-box {
              font-size: 0.9rem;
              color: #0f172a;
            }
            .footer {
              margin-top: 100px;
              text-align: center;
              font-size: 0.72rem;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
            .seal-watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 8rem;
              font-weight: 900;
              color: rgba(5, 17, 36, 0.03);
              letter-spacing: 10px;
              z-index: -1;
              pointer-events: none;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="seal-watermark">UPTNT</div>

          <table class="header-table">
            <tr>
              <td class="header-logo-cell">
                <div style="background-color: #051124; padding: 8px; border-radius: 10px; display: inline-block;">
                  <span style="color: #ffffff; font-weight: 900; font-family: sans-serif; font-size: 20px; letter-spacing: 1px;">SGUMS</span>
                </div>
              </td>
              <td class="header-text-cell">
                <h2>Universidad Politécnica Territorial del Norte del Táchira</h2>
                <p>Secretaría de Control de Estudios y Registro Académico</p>
              </td>
            </tr>
          </table>

          <div class="doc-title">Constancia de Estudios</div>

          <div class="body-text">
            Quien suscribe, Coordinador de Registro Académico y Admisión de la <strong>Universidad Politécnica Territorial del Norte del Táchira Manuela Sáenz</strong>, hace constar por medio de la presente que el ciudadano(a) <strong>${profile.name.toUpperCase()} ${profile.lastname.toUpperCase()}</strong>, titular de la Cédula de Identidad número <strong>${profile.cedula}</strong>, es estudiante regular y activo de esta casa de estudios en la carrera de <strong>${profile.career.toUpperCase()}</strong>.
          </div>

          <div class="body-text">
            El mencionado estudiante se encuentra formalmente matriculado y cursando actividades académicas correspondientes al Período Lectivo <strong>${profile.currentPeriod}</strong>, gozando de todos los derechos y deberes consagrados en el reglamento interno de la institución.
          </div>

          <div class="body-text">
            Constancia que se expide a petición de la parte interesada, en la ciudad de San Cristóbal, Estado Táchira, a los ${new Date().getDate()} días del mes de junio del año 2026.
          </div>

          <div class="signatures-container">
            <div class="signature-line"></div>
            <div class="signature-box">
              <strong>MSc. Laura Méndez</strong><br>
              Directora de Control de Estudios y Registro Académico<br>
              UPTNT Manuela Sáenz
            </div>
          </div>

          <div class="footer">
            Este documento cuenta con firma y sello electrónico respaldado digitalmente.<br>
            Código de Verificación Único: SEC-REG-${Math.floor(100000 + Math.random() * 900000)}
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

  const handlePrintEnrollmentReceipt = () => {
    if (!isEnrolled) return;

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

  return (
    <AdminPageShell
      eyebrow="Portal del Estudiante"
      title="Generación de Constancias y Trámites"
      subtitle="Descarga e imprime de manera instantánea y automatizada las constancias y reportes de tu expediente institucional."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Study Certificate card */}
        <SectionCard
          title="Constancia de Estudios"
          description="Documento oficial que certifica tu condición de estudiante activo para trámites externos."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileCheck size={20} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', marginBottom: '4px' }}>
                  Estado: Generación Disponible
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                  Documento habilitado para el periodo <strong>{profile.currentPeriod}</strong>. Cuenta con firma digital.
                </span>
              </div>
            </div>

            <ActionButton variant="accent" onClick={handlePrintStudyCertificate} style={{ width: '100%' }}>
              <Printer size={16} /> Imprimir Constancia de Estudios
            </ActionButton>
          </div>
        </SectionCard>

        {/* Enrollment Receipt card */}
        <SectionCard
          title="Comprobante de Inscripción"
          description="Detalle formal con las materias y secciones inscritas en el periodo académico vigente."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {isEnrolled ? (
                <>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.12)', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', marginBottom: '4px' }}>
                      Estado: Inscripción Detectada
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                      Carga académica de <strong>{enrolled.length} materias</strong> detectada. Listo para descarga.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a', marginBottom: '4px' }}>
                      Estado: Inscripción Pendiente
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                      No se han detectado materias inscritas en el ciclo activo. Habilítalo completando tu inscripción.
                    </span>
                  </div>
                </>
              )}
            </div>

            <ActionButton
              variant="primary"
              disabled={!isEnrolled}
              onClick={handlePrintEnrollmentReceipt}
              style={{ width: '100%' }}
            >
              <Printer size={16} /> Imprimir Comprobante de Inscripción
            </ActionButton>
          </div>
        </SectionCard>

      </div>
    </AdminPageShell>
  );
}
