import api, { http } from './api';

export const registerUser = (payload) => {
  return http.post('/auth/register', payload);
};

export const requestPasswordReset = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = ({ token, newPassword, confirmPassword }) => {
  return api.post('/auth/reset-password', {
    token,
    newPassword,
    confirmPassword,
  });
};

export const changePassword = ({ currentPassword, newPassword, confirmPassword }) => {
  return api.post('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
};
