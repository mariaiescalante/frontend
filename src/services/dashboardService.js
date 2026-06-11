import { http } from './api';

export const getAdminDashboard = () => http.get('/dashboard/admin');
export const getTeacherDashboard = () => http.get('/dashboard/teacher');
export const getStudentDashboard = () => http.get('/dashboard/student');
