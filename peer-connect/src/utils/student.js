import { api } from './api';

export const getStudentProfile = () => api('/api/student/profile');

export const updateStudentProfile = (updates) =>
  api('/api/student/profile', { method: 'PUT', body: updates });

export const findTutors = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`/api/student/tutors${qs ? `?${qs}` : ''}`);
};