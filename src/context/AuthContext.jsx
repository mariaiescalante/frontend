import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stitch_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse user role helpers
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Admin';
  const isStudent = user?.role === 'Estudiante';
  const isTeacher = user?.role === 'Docente';

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          // Attempt to retrieve profile from backend
          const profile = await api.get('/auth/profile');
          setUser(profile);
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      
      const { access_token, user: userData } = response;
      
      // Save to state & localstorage
      localStorage.setItem('stitch_token', access_token);
      setToken(access_token);
      
      // The login response might return the user directly, otherwise fetch profile
      if (userData) {
        setUser(userData);
      } else {
        const profile = await api.get('/auth/profile');
        setUser(profile);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('stitch_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isStudent,
    isTeacher,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export default AuthContext;
