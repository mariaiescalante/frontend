import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout';
import Login from './components/pages/Login';
import ForgotPassword from './components/pages/ForgotPassword';
import ResetPassword from './components/pages/ResetPassword';
import ChangePassword from './components/pages/ChangePassword';
import AdminDashboard from './components/pages/admin/Dashboard';
import UserManagement from './components/pages/admin/UserManagement';
import CareersManagement from './components/pages/admin/CareersManagement';
import PensumManagement from './components/pages/admin/PensumManagement';
import AcademicPeriods from './components/pages/admin/AcademicPeriods';
import EnrollmentsManagement from './components/pages/admin/EnrollmentsManagement';
import SectionsManagement from './components/pages/admin/SectionsManagement';
import TeacherAssignment from './components/pages/admin/TeacherAssignment';
import GradesControl from './components/pages/admin/GradesControl';
import AcademicHistory from './components/pages/admin/AcademicHistory';
import Aspirantes from './components/pages/admin/Aspirantes';
import TeacherDashboard from './components/pages/teacher/Dashboard';
import TeacherSubjects from './components/pages/teacher/TeacherSubjects';
import TeacherStudents from './components/pages/teacher/TeacherStudents';
import TeacherRecords from './components/pages/teacher/TeacherRecords';
import TeacherHistory from './components/pages/teacher/TeacherHistory';
import StudentDashboard from './components/pages/student/Dashboard';
import StudentProfile from './components/pages/student/StudentProfile';
import StudentPensum from './components/pages/student/StudentPensum';
import StudentEnrollment from './components/pages/student/StudentEnrollment';
import StudentSchedule from './components/pages/student/StudentSchedule';
import StudentRecord from './components/pages/student/StudentRecord';
import StudentDocuments from './components/pages/student/StudentDocuments';
import useAuth from './hooks/useAuth';
import './App.css';

// Simple helper components to make every sidebar link functional immediately!
// This makes the Stitch platform integration extremely easy.
const PlaceholderPage = ({ title }) => (
  <div className="glass-panel" style={{ padding: '40px', textAlign: 'left' }}>
    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>{title}</h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
      Este módulo está completamente andamiado y listo. Aquí es donde puedes arrastrar y soltar la pantalla que te entregue **Stitch**.
    </p>
    <div
      style={{
        border: '2px dashed var(--border-color)',
        borderRadius: '12px',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}
    >
      <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '6px' }}>
        Listo para integrar componente de Stitch
      </p>
      <span style={{ fontSize: '0.85rem' }}>
        Modifica el archivo en <code>src/components/pages/{title.replace(/ /g, '')}.jsx</code>
      </span>
    </div>
  </div>
);

const DashboardRedirect = () => {
  const { isAdmin, isTeacher, isStudent, loading } = useAuth();

  // While auth is still resolving, render nothing to avoid a premature
  // redirect to /login before the role has been loaded.
  if (loading) {
    return null;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isTeacher) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (isStudent) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />

          {/* Secure Layout Routes */}
          <Route path="/" element={<AppLayout />}>
            {/* Automatic redirect from root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="change-password" element={<ChangePassword />} />

            {/* Role-based Dashboards */}
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/careers" element={<CareersManagement />} />
            <Route path="admin/pensum" element={<PensumManagement />} />
            <Route path="admin/periods" element={<AcademicPeriods />} />
            <Route path="admin/enrollments" element={<EnrollmentsManagement />} />
            <Route path="admin/sections" element={<SectionsManagement />} />
            <Route path="admin/teacher-assignment" element={<TeacherAssignment />} />
            <Route path="admin/grades" element={<GradesControl />} />
            <Route path="admin/history" element={<AcademicHistory />} />
            <Route path="admin/pre-registrations" element={<Aspirantes />} />
            <Route path="admin/aspirantes" element={<Navigate to="/admin/pre-registrations" replace />} />
            <Route path="teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="teacher/subjects" element={<TeacherSubjects />} />
            <Route path="teacher/students" element={<TeacherStudents />} />
            <Route path="teacher/records" element={<TeacherRecords />} />
            <Route path="teacher/history" element={<TeacherHistory />} />
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="student/profile" element={<StudentProfile />} />
            <Route path="student/pensum" element={<StudentPensum />} />
            <Route path="student/enrollment" element={<StudentEnrollment />} />
            <Route path="student/schedule" element={<StudentSchedule />} />
            <Route path="student/record" element={<StudentRecord />} />
            <Route path="student/documents" element={<StudentDocuments />} />

            {/* Placeholders for Stitch Screens */}
            <Route path="students" element={<PlaceholderPage title="Gestión de Estudiantes" />} />
            <Route path="teachers" element={<PlaceholderPage title="Gestión de Docentes" />} />
            <Route path="subjects" element={<PlaceholderPage title="Materias y Secciones" />} />
            <Route path="registrations" element={<PlaceholderPage title="Inscripción de Materias" />} />
            <Route path="documents" element={<PlaceholderPage title="Solicitud de Documentos" />} />
          </Route>

          {/* Catch-all redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
