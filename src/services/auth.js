import api from './api';

export const requestPasswordReset = (email) => {
  return api.post('/auth/forgot-password', { email });
};
