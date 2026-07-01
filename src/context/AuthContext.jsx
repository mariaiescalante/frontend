import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import AuthContext from './authContext';

const TOKEN_KEY = 'stitch_token';

const normalizeUser = (payload) => {
  if (!payload) {
    return null;
  }

  if (payload.user) {
    return payload.user;
  }

  if (payload.data?.user) {
    return payload.data.user;
  }

  if (payload.data) {
    return payload.data;
  }

  return payload;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isInitializing = useRef(true);

  // Parse user role helpers
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Admin';
  const isStudent = user?.role === 'Estudiante';
  const isTeacher = user?.role === 'Docente';

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const profile = await api.get('/auth/profile');
          setUser(normalizeUser(profile));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      isInitializing.current = false;
      setLoading(false);
    }

    if (isInitializing.current) {
      initAuth();
    }
  }, [token, logout]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });

      const accessToken = response?.access_token || response?.token;

      if (!accessToken) {
        throw new Error('La respuesta del login no devolvió un token válido');
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);

      const profile = await api.get('/auth/profile');
      const userData = normalizeUser(profile);
      setUser(userData);

      setLoading(false);
      return userData;
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
      setLoading(false);
      throw err;
    }
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
