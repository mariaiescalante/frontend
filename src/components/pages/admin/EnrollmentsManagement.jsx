import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  CircleX,
  Eye,
  ClipboardList,
  UserPlus,
  Search,
  Trash2,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  AlertTriangle,
  Check,
  X,
  Plus,
  Sparkles,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  AdminPageShell,
  ActionButton,
  DataTable,
  Modal,
  SectionCard,
  StatusBadge,
  CustomSelect,
  Pagination,
  ConfirmDialog,
  fieldStyle
} from './AdminPageShell';
import api from '../../../services/api';

// Helpers para detección de choques de horario
function normalizeDay(dayStr) {
  if (!dayStr) return '';
  const clean = dayStr.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (clean.startsWith('lun')) return 'Lunes';
  if (clean.startsWith('mar')) return 'Martes';
  if (clean.startsWith('mie')) return 'Miércoles';
  if (clean.startsWith('jue')) return 'Jueves';
  if (clean.startsWith('vie')) return 'Viernes';
  if (clean.startsWith('sab')) return 'Sábado';
  if (clean.startsWith('dom')) return 'Domingo';
  return dayStr;
}

function parseSchedule(scheduleStr) {
  try {
    if (!scheduleStr) return null;
    const parts = scheduleStr.split(' ');
    if (parts.length < 2) return null;
    const daysPart = parts[0];
    const hoursPart = parts.slice(1).join('');

    const days = daysPart.split('/').map(normalizeDay);
    const [startStr, endStr] = hoursPart.split('-');
    if (!startStr || !endStr) return null;

    const parseTime = (tStr) => {
      const clean = tStr.trim().toLowerCase();
      const match = clean.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);

      const isPM = /pm/i.test(clean);
      const isAM = /am/i.test(clean);

      if (isPM && h < 12) {
        h += 12;
      } else if (isAM && h === 12) {
        h = 0;
      } else if (!isPM && !isAM) {
        if (h >= 1 && h < 8) {
          h += 12;
        }
      }
      return h + m / 60;
    };

    return {
      days,
      start: parseTime(startStr),
      end: parseTime(endStr)
    };
  } catch {
    return null;
  }
}

function hasOverlap(sch1, sch2) {
  const p1 = parseSchedule(sch1);
  const p2 = parseSchedule(sch2);
  if (!p1 || !p2) return false;

  const commonDays = p1.days.filter((d) => p2.days.includes(d));
  if (commonDays.length === 0) return false;

  return p1.start < p2.end && p1.end > p2.start;
}

export default function EnrollmentsManagement() {
  const [filter, setFilter] = useState('Todos');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [allRegistrations, setAllRegistrations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Estados para el Modal de Inscripción Administrativa
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollPeriodId, setEnrollPeriodId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [availableSections, setAvailableSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState({});
  const [selectedSections, setSelectedSections] = useState([]);
  const [careerFilterOnly, setCareerFilterOnly] = useState(true);
  const [sectionSearch, setSectionSearch] = useState('');

  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);

  // Estados para confirmación de anulación / eliminación
  const [confirmDeleteReg, setConfirmDeleteReg] = useState(null);
  const [confirmDeleteDetail, setConfirmDeleteDetail] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Cargar períodos al montar y elegir el activo
  useEffect(() => {
    async function init() {
      try {
        const perRes = await api.get('/periods');
        const perList = Array.isArray(perRes.data) ? perRes.data : perRes;
        setPeriods(perList);
        const active = perList.find((p) => p.period_status === 'Activo') || perList[0];
        const activeId = String(active?.id_period || '');
        setSelectedPeriod(activeId);
        setEnrollPeriodId(activeId);
      } catch (err) {
        console.error('Error cargando períodos:', err);
      }
    }
    init();
  }, []);

  // Función para recargar la lista de inscripciones
  const loadRegistrations = async () => {
    if (!selectedPeriod) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
      });
      if (selectedPeriod) params.set('id_period', selectedPeriod);
      const regRes = await api.get(`/registrations?${params.toString()}`);
      if (regRes?.data && regRes?.meta) {
        setAllRegistrations(regRes.data);
        setTotalPages(regRes.meta.totalPages);
        setTotalItems(regRes.meta.totalItems);
      } else {
        const list = Array.isArray(regRes?.data) ? regRes.data : (Array.isArray(regRes) ? regRes : []);
        setAllRegistrations(list);
        setTotalPages(1);
        setTotalItems(list.length);
      }
    } catch (err) {
      console.error('Error cargando inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar inscripciones cuando cambia página o período seleccionado
  useEffect(() => {
    loadRegistrations();
  }, [currentPage, selectedPeriod]);

  // Cargar estudiantes y secciones cuando se abre el modal de inscripción
  useEffect(() => {
    if (!isEnrollModalOpen) return;

    async function loadEnrollmentData() {
      try {
        setLoadingStudents(true);
        const resStudents = await api.get('/students');
        const studentsList = Array.isArray(resStudents?.data) ? resStudents.data : (Array.isArray(resStudents) ? resStudents : []);
        setStudents(studentsList);
      } catch (err) {
        console.error('Error cargando estudiantes:', err);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadEnrollmentData();
  }, [isEnrollModalOpen]);

  // Cargar secciones para el período del modal
  useEffect(() => {
    if (!isEnrollModalOpen || !enrollPeriodId) return;

    async function loadSectionsForPeriod() {
      try {
        setLoadingSections(true);
        const [secRes, detRes] = await Promise.all([
          api.get(`/sections?id_period=${enrollPeriodId}`),
          api.get('/registration-details').catch(() => ({ data: [] }))
        ]);

        const rawSections = Array.isArray(secRes?.data) ? secRes.data : (Array.isArray(secRes) ? secRes : []);
        const rawDetails = Array.isArray(detRes?.data) ? detRes.data : (Array.isArray(detRes) ? detRes : []);

        // Calcular cupos ocupados por sección
        const seatsMap = {};
        rawDetails.forEach((d) => {
          if (d.subject_status !== 'Retirado') {
            seatsMap[d.id_section] = (seatsMap[d.id_section] || 0) + 1;
          }
        });

        setAvailableSections(rawSections);
        setOccupiedSeats(seatsMap);
      } catch (err) {
        console.error('Error cargando secciones:', err);
      } finally {
        setLoadingSections(false);
      }
    }

    loadSectionsForPeriod();
  }, [isEnrollModalOpen, enrollPeriodId]);

  // Mapeo detallado de inscripciones para la tabla
  const requests = useMemo(() => {
    return allRegistrations.map((reg) => {
      const studentUser = reg.Student?.User;
      const studentName = studentUser
        ? `${studentUser.document_id} - ${studentUser.first_name} ${studentUser.first_lastname}`
        : `ID Estudiante: ${reg.id_student}`;
      const careerName = reg.Student?.Career?.name_career || 'No definida';
      const period = reg.AcademicPeriod?.name_period || 'Desconocido';

      const detailsForReg = reg.RegistrationDetails || [];
      let totalCredits = 0;

      const details = detailsForReg.map((d) => {
        const sec = d.Section;
        const subj = sec?.Subject;
        const credits = subj?.credit_units || 0;
        if (d.subject_status !== 'Retirado') {
          totalCredits += credits;
        }

        return {
          id_detail: d.id_detail,
          id_section: d.id_section,
          subject_status: d.subject_status || 'Cursando',
          section_code: sec?.section_code || '',
          schedule_info: sec?.schedule_info || 'Por asignar',
          classroom: sec?.classroom || 'Por asignar',
          subject_name: subj?.name_subject || 'Asignatura',
          subject_code: subj?.code_subject || '',
          credits: credits
        };
      });

      return {
        id: reg.id_registration,
        id_student: reg.id_student,
        id_period: reg.id_period,
        student: studentName,
        studentUser,
        studentObj: reg.Student,
        career: careerName,
        period: period,
        courses: details.filter((d) => d.subject_status !== 'Retirado').length,
        totalCredits: totalCredits,
        details: details,
        rawReg: reg
      };
    });
  }, [allRegistrations]);

  const careers = useMemo(() => {
    const list = new Set(requests.map((r) => r.career));
    return ['Todos', ...Array.from(list)];
  }, [requests]);

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => filter === 'Todos' || request.career === filter);
  }, [filter, requests]);

  // Filtrado de estudiantes en el modal de inscripción
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    const q = studentSearch.toLowerCase().trim();
    return students.filter((s) => {
      const u = s.User;
      const fullName = `${u?.first_name || ''} ${u?.second_name || ''} ${u?.first_lastname || ''} ${u?.second_lastname || ''}`.toLowerCase();
      const doc = (u?.document_id || '').toLowerCase();
      const email = (u?.email || u?.institutional_email || '').toLowerCase();
      const car = (s.Career?.name_career || '').toLowerCase();
      return fullName.includes(q) || doc.includes(q) || email.includes(q) || car.includes(q);
    });
  }, [students, studentSearch]);

  // Inscripción previa existente para el estudiante seleccionado en el período del modal
  const existingStudentReg = useMemo(() => {
    if (!selectedStudent || !enrollPeriodId) return null;
    return allRegistrations.find(
      (r) => r.id_student === selectedStudent.id_student && String(r.id_period) === String(enrollPeriodId)
    );
  }, [selectedStudent, enrollPeriodId, allRegistrations]);

  // IDs de secciones en las que el estudiante ya está inscrito
  const alreadyEnrolledSectionIds = useMemo(() => {
    if (!existingStudentReg) return new Set();
    const details = existingStudentReg.RegistrationDetails || [];
    return new Set(
      details.filter((d) => d.subject_status !== 'Retirado').map((d) => d.id_section)
    );
  }, [existingStudentReg]);

  // IDs de materias en las que el estudiante ya está inscrito
  const alreadyEnrolledSubjectIds = useMemo(() => {
    if (!existingStudentReg) return new Set();
    const details = existingStudentReg.RegistrationDetails || [];
    return new Set(
      details
        .filter((d) => d.subject_status !== 'Retirado' && d.Section?.id_subject)
        .map((d) => d.Section.id_subject)
    );
  }, [existingStudentReg]);

  // Filtrado de secciones para el estudiante en el modal
  const filteredSections = useMemo(() => {
    let list = availableSections;

    // Filtro por carrera del estudiante si está activado
    if (careerFilterOnly && selectedStudent?.id_career) {
      list = list.filter((sec) => sec.id_career === selectedStudent.id_career);
    }

    // Filtro por texto de búsqueda
    if (sectionSearch.trim()) {
      const q = sectionSearch.toLowerCase().trim();
      list = list.filter((sec) => {
        const subName = (sec.Subject?.name_subject || '').toLowerCase();
        const subCode = (sec.Subject?.code_subject || '').toLowerCase();
        const secCode = (sec.section_code || '').toLowerCase();
        const prof = (sec.Teacher?.User ? `${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}` : '').toLowerCase();
        return subName.includes(q) || subCode.includes(q) || secCode.includes(q) || prof.includes(q);
      });
    }

    return list;
  }, [availableSections, careerFilterOnly, selectedStudent, sectionSearch]);

  // Créditos totales de las secciones seleccionadas
  const totalSelectedCredits = useMemo(() => {
    return selectedSections.reduce((sum, s) => sum + (s.Subject?.credit_units || 0), 0);
  }, [selectedSections]);

  // Manejador para alternar sección seleccionada
  const handleToggleSection = (section) => {
    setEnrollError(null);
    const isAlreadySelected = selectedSections.some((s) => s.id_section === section.id_section);

    if (isAlreadySelected) {
      setSelectedSections((prev) => prev.filter((s) => s.id_section !== section.id_section));
      return;
    }

    // 1. Validar que no tenga otra sección de la misma materia seleccionada
    const sameSubjectSec = selectedSections.find((s) => s.id_subject === section.id_subject);

    // 2. Validar choques de horario con las otras secciones ya seleccionadas
    const otherSelected = selectedSections.filter((s) => s.id_subject !== section.id_subject);
    const conflict = otherSelected.find((s) => hasOverlap(s.schedule_info, section.schedule_info));

    if (conflict) {
      setEnrollError(
        `Conflicto de Horario: La sección ${section.section_code} de "${section.Subject?.name_subject}" (${section.schedule_info}) choca con "${conflict.Subject?.name_subject}" (${conflict.schedule_info}).`
      );
      return;
    }

    if (sameSubjectSec) {
      // Reemplaza la sección previa de la misma materia
      setSelectedSections((prev) => [
        ...prev.filter((s) => s.id_subject !== section.id_subject),
        section
      ]);
    } else {
      setSelectedSections((prev) => [...prev, section]);
    }
  };

  // Abrir modal de inscripción
  const handleOpenEnrollModal = (preselectedStudent = null) => {
    setSelectedStudent(preselectedStudent);
    setSelectedSections([]);
    setStudentSearch('');
    setSectionSearch('');
    setEnrollError(null);
    setEnrollSuccess(null);
    setIsEnrollModalOpen(true);
  };

  // Procesar envío de inscripción
  const handleEnrollSubmit = async () => {
    if (!selectedStudent) {
      setEnrollError('Por favor selecciona un estudiante.');
      return;
    }

    if (selectedSections.length === 0) {
      setEnrollError('Debes seleccionar al menos una materia para inscribir.');
      return;
    }

    if (totalSelectedCredits > 24) {
      setEnrollError('El total de créditos supera el límite permitido (máx. 24 UC).');
      return;
    }

    try {
      setIsSubmittingEnroll(true);
      setEnrollError(null);

      let targetRegId = existingStudentReg?.id_registration;

      // Si no existe inscripción previa en este período, crearla
      if (!targetRegId) {
        const regRes = await api.post('/registrations', {
          id_student: selectedStudent.id_student,
          id_period: parseInt(enrollPeriodId),
          status: 'Inscrito'
        });
        targetRegId = regRes.id_registration || regRes.data?.id_registration;
      }

      // Inscribir las materias seleccionadas mediante RegistrationDetail
      await Promise.all(
        selectedSections.map(async (sec) => {
          return api.post('/registration-details', {
            id_registration: targetRegId,
            id_section: sec.id_section,
            corte_1: 0,
            corte_2: 0,
            corte_3: 0,
            corte_4: 0,
            recuperatorio: 0,
            final_note: 0,
            attendance_percentage: 100,
            subject_status: 'Cursando'
          });
        })
      );

      const stName = `${selectedStudent.User?.first_name || ''} ${selectedStudent.User?.first_lastname || ''}`;
      setEnrollSuccess(`¡Inscripción exitosa! Se inscribieron ${selectedSections.length} materias para ${stName}.`);

      // Recargar inscripciones
      await loadRegistrations();

      // Cerrar modal tras feedback
      setTimeout(() => {
        setIsEnrollModalOpen(false);
        setSelectedSections([]);
        setSelectedStudent(null);
        setEnrollSuccess(null);
      }, 1600);
    } catch (err) {
      console.error('Error al procesar la inscripción:', err);
      if (err.data && err.data.errors) {
        const errorDetails = err.data.errors.map((e) => `${e.campo || e.path || 'Error'}: ${e.mensaje || e.message || ''}`).join('\n');
        setEnrollError(`Error de validación:\n${errorDetails}`);
      } else {
        setEnrollError(err.message || 'Error al procesar la inscripción');
      }
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // Anular inscripción completa
  const handleConfirmDeleteReg = async () => {
    if (!confirmDeleteReg) return;
    try {
      setIsDeleting(true);
      await api.delete(`/registrations/${confirmDeleteReg.id}`);
      await loadRegistrations();
      if (selectedRequest?.id === confirmDeleteReg.id) {
        setSelectedRequest(null);
      }
      setConfirmDeleteReg(null);
    } catch (err) {
      console.error('Error al anular inscripción:', err);
      alert(err.message || 'No se pudo anular la inscripción');
    } finally {
      setIsDeleting(false);
    }
  };

  // Retirar una materia específica de la inscripción
  const handleConfirmDeleteDetail = async () => {
    if (!confirmDeleteDetail) return;
    try {
      setIsDeleting(true);
      await api.delete(`/registration-details/${confirmDeleteDetail.id_detail}`);
      await loadRegistrations();

      // Actualizar vista del modal de detalle si está abierto
      if (selectedRequest) {
        setSelectedRequest((prev) => {
          if (!prev) return null;
          const updatedDetails = prev.details.filter((d) => d.id_detail !== confirmDeleteDetail.id_detail);
          return {
            ...prev,
            courses: updatedDetails.filter((d) => d.subject_status !== 'Retirado').length,
            totalCredits: updatedDetails.reduce((sum, d) => sum + (d.subject_status !== 'Retirado' ? d.credits : 0), 0),
            details: updatedDetails
          };
        });
      }
      setConfirmDeleteDetail(null);
    } catch (err) {
      console.error('Error al retirar asignatura:', err);
      alert(err.message || 'No se pudo retirar la asignatura');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && allRegistrations.length === 0) {
    return (
      <AdminPageShell
        eyebrow="Gestión de inscripciones"
        title="Auditoría de solicitudes académicas"
        subtitle="Cargando inscripciones desde el servidor..."
      >
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <span>Cargando datos...</span>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      eyebrow="Gestión de inscripciones"
      title="Inscripción y Auditoría Académica"
      subtitle="Supervisión de inscripciones, asignación administrativa de materias y control de carga horaria."
      metrics={[
        { label: 'Total de Inscripciones', value: String(totalItems || requests.length), hint: 'Solicitudes en el período', icon: ClipboardList, tone: 'primary' },
        { label: 'Materias Inscritas', value: String(requests.reduce((sum, r) => sum + r.courses, 0)), hint: 'Total de asignaturas cargadas', icon: BookOpen, tone: 'info' },
        { label: 'Total de Créditos', value: String(requests.reduce((sum, r) => sum + r.totalCredits, 0)), hint: 'Créditos académicos en curso', icon: CheckCircle2, tone: 'success' }
      ]}
    >
      <SectionCard
        title="Inscripciones por Carrera"
        description="Listado de estudiantes inscritos con acceso a su ficha de materias y panel de matriculación."
        actions={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <ActionButton
              variant="accent"
              onClick={() => handleOpenEnrollModal()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
            >
              <UserPlus size={16} /> Inscribir Estudiante
            </ActionButton>

            <CustomSelect
              value={selectedPeriod}
              onChange={(val) => { setSelectedPeriod(String(val)); setCurrentPage(1); }}
              options={periods.map((p) => ({ value: String(p.id_period), label: p.name_period }))}
              style={{ minWidth: '160px' }}
            />

            <CustomSelect
              value={filter}
              onChange={(val) => { setFilter(String(val)); setCurrentPage(1); }}
              options={careers.map((career) => ({
                value: career,
                label: career
              }))}
              style={{ minWidth: '220px' }}
            />
          </div>
        }
      >
        <DataTable columns={["Solicitud", "Estudiante", "Carrera", "Período", "Materias", "Acciones"]}>
          {visibleRequests.map((request) => (
            <tr key={request.id}>
              <td>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>REQ-{request.id}</span>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: '#0f172a' }}>{request.studentUser ? `${request.studentUser.first_name} ${request.studentUser.first_lastname}` : request.student}</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Cédula: {request.studentUser?.document_id || 'N/A'}</span>
                </div>
              </td>
              <td>{request.career}</td>
              <td>
                <StatusBadge tone="info">{request.period}</StatusBadge>
              </td>
              <td>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {request.courses} {request.courses === 1 ? 'materia' : 'materias'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                  ({request.totalCredits} UC)
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <ActionButton variant="secondary" onClick={() => setSelectedRequest(request)}>
                    <Eye size={14} /> Ver detalle
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    onClick={() => setConfirmDeleteReg(request)}
                    title="Anular inscripción completa"
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
          {visibleRequests.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No se encontraron inscripciones registradas para los filtros seleccionados.
              </td>
            </tr>
          )}
        </DataTable>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </SectionCard>

      {/* MODAL 1: DETALLE DE SOLICITUD DE INSCRIPCIÓN */}
      <Modal
        open={Boolean(selectedRequest)}
        title={selectedRequest ? `Detalle de Inscripción REQ-${selectedRequest.id}` : ''}
        subtitle={selectedRequest ? `${selectedRequest.student} - ${selectedRequest.career}` : ''}
        onClose={() => setSelectedRequest(null)}
        footer={
          selectedRequest ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <ActionButton
                variant="accent"
                onClick={() => {
                  const st = selectedRequest.studentObj;
                  setSelectedRequest(null);
                  handleOpenEnrollModal(st);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Inscribir más materias
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setSelectedRequest(null)}>
                Cerrar
              </ActionButton>
            </div>
          ) : null
        }
      >
        {selectedRequest ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Materias Cursando</span>
                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{selectedRequest.courses}</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Créditos</span>
                <strong style={{ display: 'block', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{selectedRequest.totalCredits} UC</strong>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Período</span>
                <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{selectedRequest.period}</strong>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Asignaturas inscritas ({selectedRequest.details.length})
                </h4>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {selectedRequest.details.length === 0 ? (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                    Este estudiante no posee materias inscritas en esta solicitud.
                  </div>
                ) : (
                  selectedRequest.details.map((detail) => (
                    <div
                      key={detail.id_detail}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', wordBreak: 'break-word' }}>
                            {detail.subject_code ? `${detail.subject_code} - ` : ''}{detail.subject_name}
                          </span>
                          <StatusBadge tone="primary">Sec. {detail.section_code}</StatusBadge>
                          <StatusBadge tone="neutral">{detail.credits} UC</StatusBadge>
                          <StatusBadge tone={detail.subject_status === 'Cursando' ? 'info' : detail.subject_status === 'Aprobada' ? 'success' : 'neutral'}>
                            {detail.subject_status}
                          </StatusBadge>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#3b82f6" /> {detail.schedule_info}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#f59e0b" /> {detail.classroom}
                          </span>
                        </div>
                      </div>

                      <ActionButton
                        variant="ghost"
                        onClick={() => setConfirmDeleteDetail(detail)}
                        title="Retirar esta asignatura"
                        style={{ color: '#ef4444', padding: '6px 10px', fontSize: '0.8rem', flexShrink: 0 }}
                      >
                        <Trash2 size={14} /> Retirar
                      </ActionButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL 2: PROCESO ADMINISTRATIVO DE INSCRIPCIÓN DE ESTUDIANTE */}
      <Modal
        open={isEnrollModalOpen}
        title="Inscripción Administrativa de Estudiante"
        subtitle="Matriculación manual de estudiantes y selección de carga horaria en el período académico."
        onClose={() => {
          if (!isSubmittingEnroll) setIsEnrollModalOpen(false);
        }}
        footer={
          <div className="enroll-modal-footer-container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div className="enroll-modal-counters" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#f8fafc', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                Seleccionadas: <strong style={{ color: '#0f172a' }}>{selectedSections.length} materias</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                Créditos: <strong style={{ color: totalSelectedCredits > 24 ? '#b91c1c' : '#15803d' }}>{totalSelectedCredits} / 24 UC</strong>
              </span>
            </div>

            <div className="enroll-modal-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton
                variant="ghost"
                onClick={() => setIsEnrollModalOpen(false)}
                disabled={isSubmittingEnroll}
                style={{ minWidth: '90px' }}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                variant="accent"
                onClick={handleEnrollSubmit}
                disabled={isSubmittingEnroll || !selectedStudent || selectedSections.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, minWidth: '170px' }}
              >
                {isSubmittingEnroll ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <Check size={16} /> Confirmar e Inscribir
                  </>
                )}
              </ActionButton>
            </div>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '18px' }}>
          {/* Mensajes de Alerta / Éxito */}
          {enrollError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', fontSize: '0.88rem', wordBreak: 'break-word' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{enrollError}</span>
            </div>
          )}

          {enrollSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#15803d', fontSize: '0.88rem', wordBreak: 'break-word' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{enrollSuccess}</span>
            </div>
          )}

          {/* PASO 1: SELECCIONAR PERÍODO Y ESTUDIANTE */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px' }}>
                <GraduationCap size={16} color="#3b82f6" style={{ flexShrink: 0 }} /> <span>1. Datos del Estudiante y Período</span>
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Período:</span>
                <CustomSelect
                  value={enrollPeriodId}
                  onChange={(val) => {
                    setEnrollPeriodId(String(val));
                    setSelectedSections([]);
                  }}
                  options={periods.map((p) => ({ value: String(p.id_period), label: p.name_period }))}
                  style={{ minWidth: '120px', maxWidth: '180px' }}
                />
              </div>
            </div>

            {!selectedStudent ? (
              <div>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar estudiante por Cédula, Nombre o Carrera..."
                    style={{ ...fieldStyle, paddingLeft: '40px' }}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#ffffff' }}>
                  {loadingStudents ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>Cargando lista de estudiantes...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>No se encontraron estudiantes coincidentes</div>
                  ) : (
                    filteredStudents.map((st) => {
                      const u = st.User;
                      const fullName = `${u?.first_name || ''} ${u?.first_lastname || ''}`;
                      return (
                        <div
                          key={st.id_student}
                          onClick={() => {
                            setSelectedStudent(st);
                            setSelectedSections([]);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: 0 }}>
                            <strong style={{ fontSize: '0.88rem', color: '#0f172a', wordBreak: 'break-word', lineHeight: 1.3 }}>{fullName}</strong>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center', lineHeight: 1.35 }}>
                              <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                                {u?.document_id || 'N/A'}
                              </span>
                              <span>•</span>
                              <span>{st.Career?.name_career || 'Sin carrera'}</span>
                              <span>•</span>
                              <span>Sem. {st.Semester?.number_semester || 1}</span>
                            </div>
                          </div>
                          <ActionButton variant="secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            Seleccionar
                          </ActionButton>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #051124 0%, #17315a 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>
                    {selectedStudent.User?.first_name?.[0] || 'E'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', wordBreak: 'break-word' }}>
                      {selectedStudent.User?.first_name} {selectedStudent.User?.first_lastname}
                    </h5>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '3px', alignItems: 'center' }}>
                      <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                        {selectedStudent.User?.document_id}
                      </span>
                      <span>•</span>
                      <span>{selectedStudent.Career?.name_career || 'No asignada'}</span>
                      <span>•</span>
                      <span>Semestre {selectedStudent.Semester?.number_semester || 1}</span>
                    </div>
                  </div>
                </div>

                <ActionButton
                  variant="ghost"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedSections([]);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 12px', flexShrink: 0 }}
                >
                  Cambiar estudiante
                </ActionButton>
              </div>
            )}

            {/* Banner si el estudiante ya posee inscripción activa en este período */}
            {existingStudentReg && (
              <div style={{ marginTop: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#1e40af', wordBreak: 'break-word' }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  Este estudiante ya posee la inscripción <strong>REQ-{existingStudentReg.id_registration}</strong> en este período con <strong>{alreadyEnrolledSectionIds.size} materias inscritas</strong>. Las materias que marques a continuación se agregarán a su carga académica actual.
                </span>
              </div>
            )}
          </div>

          {/* PASO 2: SELECCIÓN DE MATERIAS Y SECCIONES */}
          {selectedStudent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px' }}>
                  <BookOpen size={16} color="#3b82f6" style={{ flexShrink: 0 }} /> <span>2. Selección de Asignaturas Disponibles</span>
                </h4>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', cursor: 'pointer', background: '#ffffff', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={careerFilterOnly}
                    onChange={(e) => setCareerFilterOnly(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Solo materias de su carrera ({selectedStudent.Career?.career_code || selectedStudent.Career?.name_career?.substring(0, 15) || 'Carrera'})</span>
                </label>
              </div>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="Filtrar por código o nombre de materia, docente o sección..."
                  style={{ ...fieldStyle, paddingLeft: '36px', padding: '9px 12px 9px 36px', fontSize: '0.88rem' }}
                />
              </div>

              {loadingSections ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Cargando oferta académica del período...</div>
              ) : filteredSections.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  No se encontraron secciones activas para los criterios seleccionados.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredSections.map((sec) => {
                    const isAlreadyEnrolled = alreadyEnrolledSectionIds.has(sec.id_section);
                    const isSubjectAlreadyEnrolled = !isAlreadyEnrolled && alreadyEnrolledSubjectIds.has(sec.id_subject);
                    const isSelected = selectedSections.some((s) => s.id_section === sec.id_section);
                    const occupied = occupiedSeats[sec.id_section] || 0;
                    const maxQuota = sec.quota_max || 30;
                    const isFull = occupied >= maxQuota;

                    const teacherName = sec.Teacher?.User
                      ? `Prof. ${sec.Teacher.User.first_name} ${sec.Teacher.User.first_lastname}`
                      : 'Profesor por asignar';

                    return (
                      <div
                        key={sec.id_section}
                        onClick={() => {
                          if (!isAlreadyEnrolled && !isSubjectAlreadyEnrolled) {
                            handleToggleSection(sec);
                          }
                        }}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.06)' : isAlreadyEnrolled ? '#f8fafc' : '#ffffff',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '11px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          cursor: (isAlreadyEnrolled || isSubjectAlreadyEnrolled) ? 'not-allowed' : 'pointer',
                          opacity: (isAlreadyEnrolled || isSubjectAlreadyEnrolled) ? 0.65 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Top row: Checkbox + Subject Name + Badges + Cupos */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 0%', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected || isAlreadyEnrolled}
                              disabled={isAlreadyEnrolled || isSubjectAlreadyEnrolled}
                              onChange={() => {}}
                              style={{ width: '17px', height: '17px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                            />

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.92rem', color: '#0f172a', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                  {sec.Subject?.code_subject ? `${sec.Subject.code_subject} - ` : ''}{sec.Subject?.name_subject || 'Asignatura'}
                                </strong>
                                <StatusBadge tone="primary">Sec. {sec.section_code}</StatusBadge>
                                <StatusBadge tone="neutral">{sec.Subject?.credit_units || 0} UC</StatusBadge>

                                {isAlreadyEnrolled && (
                                  <StatusBadge tone="success">Ya inscrita</StatusBadge>
                                )}
                                {isSubjectAlreadyEnrolled && (
                                  <StatusBadge tone="warning">Otra sección inscrita</StatusBadge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cupos info right aligned */}
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isFull ? '#b91c1c' : '#15803d', whiteSpace: 'nowrap' }}>
                              {occupied} / {maxQuota} cupos
                            </span>
                            <span style={{ fontSize: '0.72rem', color: isFull ? '#b91c1c' : '#64748b', whiteSpace: 'nowrap' }}>
                              {maxQuota - occupied > 0 ? `${maxQuota - occupied} disp.` : 'Lleno'}
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: Schedule, Classroom, Teacher */}
                        <div
                          className="enroll-section-bottom-row"
                          style={{
                            display: 'flex',
                            gap: '8px 14px',
                            fontSize: '0.78rem',
                            color: '#64748b',
                            flexWrap: 'wrap',
                            paddingLeft: '27px',
                            borderTop: '1px dashed #f1f5f9',
                            paddingTop: '6px',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#3b82f6" /> {sec.schedule_info || 'Horario por asignar'}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#f59e0b" /> {sec.classroom || 'Aula por asignar'}
                          </span>
                          <span>• {teacherName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* DIÁLOGO DE CONFIRMACIÓN: ANULAR INSCRIPCIÓN COMPLETA */}
      <ConfirmDialog
        open={Boolean(confirmDeleteReg)}
        title="¿Anular inscripción completa?"
        message={`Estás a punto de anular la inscripción REQ-${confirmDeleteReg?.id} para el estudiante "${confirmDeleteReg?.student}". Esta acción eliminará todas las asignaturas inscritas de este período.`}
        confirmText={isDeleting ? 'Anulando...' : 'Sí, anular inscripción'}
        cancelText="Conservar inscripción"
        variant="danger"
        onConfirm={handleConfirmDeleteReg}
        onCancel={() => {
          if (!isDeleting) setConfirmDeleteReg(null);
        }}
      />

      {/* DIÁLOGO DE CONFIRMACIÓN: RETIRAR ASIGNATURA */}
      <ConfirmDialog
        open={Boolean(confirmDeleteDetail)}
        title="¿Retirar asignatura de la inscripción?"
        message={`¿Confirmas que deseas retirar "${confirmDeleteDetail?.subject_name}" (Sección ${confirmDeleteDetail?.section_code}) de la inscripción del estudiante?`}
        confirmText={isDeleting ? 'Retirando...' : 'Sí, retirar asignatura'}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteDetail}
        onCancel={() => {
          if (!isDeleting) setConfirmDeleteDetail(null);
        }}
      />
    </AdminPageShell>
  );
}
