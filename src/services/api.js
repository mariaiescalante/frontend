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
    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    const message = apiMessage || error.message || 'Error de red';

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.data = error.response?.data;

    return Promise.reject(normalizedError);
  }
);

const request = async (method, endpoint, data, config = {}, retries = 2) => {
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
