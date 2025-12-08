'use client';

import axios from 'axios';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const adminApi = axios.create({
  baseURL: `${base}/api`,
  timeout: 20000,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors, timeouts, and other errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Admin API request failed:', error.message);
    }
    return Promise.reject(error);
  }
);

export default adminApi;
