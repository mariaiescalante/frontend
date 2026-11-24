import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-sgums.onrender.com/api';
//const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'stitch_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let detailMessage = null;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      detailMessage = data.errors
        .map(e => typeof e === 'object' ? `${e.campo ? e.campo + ': ' : ''}${e.mensaje || JSON.stringify(e)}` : String(e))
        .join(', ');
    }

    const apiMessage = data?.message || data?.error;
    let message = apiMessage;
    if (detailMessage) {
      message = apiMessage ? `${apiMessage}: ${detailMessage}` : detailMessage;
    }
    if (!message) {
      message = error.message || 'Error de red';
    }

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.data = data;
    normalizedError.response = error.response;

    return Promise.reject(normalizedError);
  }
);

// Registro de peticiones activas mutantes (POST, PUT, PATCH, DELETE) para evitar doble envío accidental
const activeMutations = new Set();

const buildMutationKey = (method, endpoint, data) => {
  const normMethod = String(method || '').toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(normMethod)) {
    return null;
  }
  let payloadStr = '';
  try {
    payloadStr = data ? JSON.stringify(data) : '';
  } catch {
    payloadStr = '';
  }
  return `${normMethod}:${endpoint}:${payloadStr}`;
};

const request = async (method, endpoint, data, config = {}, retries = 2) => {
  const mutationKey = buildMutationKey(method, endpoint, data);

  // Si esta misma petición de guardado/borrado ya está procesándose, bloqueamos la duplicada
  if (mutationKey && activeMutations.has(mutationKey)) {
    console.warn(`[API] Petición duplicada prevenida: ${mutationKey}`);
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('La acción ya se está procesando, por favor espere...')), 50);
    });
  }

  if (mutationKey) {
    activeMutations.add(mutationKey);
  }

  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await api.request({
          url: endpoint,
          method,
          data,
          ...config,
        });

        if (response.status === 204) {
          return null;
        }

        return response.data;
      } catch (error) {
        const isNetworkError = !error.response;
        const isLastAttempt = attempt === retries;

        if (isNetworkError && !isLastAttempt) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }

        throw error;
      }
    }
  } finally {
    if (mutationKey) {
      activeMutations.delete(mutationKey);
    }
  }
};

export const http = {
  request,
  get(endpoint, config = {}) {
    return request('GET', endpoint, undefined, config);
  },
  post(endpoint, body, config = {}) {
    return request('POST', endpoint, body, config);
  },
  put(endpoint, body, config = {}) {
    return request('PUT', endpoint, body, config);
  },
  delete(endpoint, config = {}) {
    return request('DELETE', endpoint, undefined, config);
  },
};

export default http;
