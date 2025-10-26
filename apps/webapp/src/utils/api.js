import axios from 'axios';

// Derive base URL from env, defaulting to local dev
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${base}/api`,
  timeout: 20000,
});

// Attach backend JWT from localStorage (set by AuthContext)
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
