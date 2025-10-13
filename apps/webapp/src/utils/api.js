import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Add JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getNotifications = (page = 0, size = 10) =>
  api.get(`/notifications/list?page=${page}&size=${size}`);

export const markNotificationRead = (id) => api.patch(`/notifications/mark-read/${id}`);

export const patchQuietHours = (payload) => api.patch('/user/quiet-hours', payload);

export default api;
