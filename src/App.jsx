import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout';
import Login from './components/pages/Login';
import ForgotPassword from './components/pages/ForgotPassword';
import ResetPassword from './components/pages/ResetPassword';
import ChangePassword from './components/pages/ChangePassword';
import AdminDashboard from './components/pages/admin/Dashboard';
import TeacherDashboard from './components/pages/teacher/Dashboard';
import StudentDashboard from './components/pages/student/Dashboard';
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
  const { isAdmin, isTeacher, isStudent } = useAuth();

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
            <Route path="teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="student/dashboard" element={<StudentDashboard />} />

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
