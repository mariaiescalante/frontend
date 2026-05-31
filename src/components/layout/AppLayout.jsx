import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './Layout.css';

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Show a gorgeous cosmic loader while authenticating/restoring session
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          gap: '20px'
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(0, 229, 255, 0.1)',
            borderTopColor: 'var(--accent-cyan)',
            borderRadius: '50%',
            animation: 'loaderSpin 1s linear infinite'
          }}
        />
        <style>
          {`
            @keyframes loaderSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <p style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
          Restaurando sesión espacial...
        </p>
      </div>
    );
  }

  // Redirect to Login if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="sgums-sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="sgums-main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar onMenuClick={() => setMobileSidebarOpen((current) => !current)} />
        <main className="sgums-content-container">
          {/* Dynamic route rendering for the screens (Stitch Pages) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
