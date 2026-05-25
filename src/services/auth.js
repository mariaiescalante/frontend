import api from './api';

export const requestPasswordReset = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const changePassword = ({ currentPassword, newPassword, confirmPassword }) => {
  return api.post('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
};
