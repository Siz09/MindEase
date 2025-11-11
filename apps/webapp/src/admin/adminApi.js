'use client';

import axios from 'axios';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const adminApi = axios.create({
  baseURL: `${base}/api`,
  timeout: 20000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default adminApi;
