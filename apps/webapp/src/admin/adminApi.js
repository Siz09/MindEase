'use client';

import axios from 'axios';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const adminApi = axios.create({
  baseURL: `${base}/api`,
  timeout: 10000, // Reduced from 20s to 10s for faster feedback
  // Note: withCredentials is only needed for cookies/session, not for Bearer tokens
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Helper to check if error is retryable
const isRetryableError = (error) => {
  // Don't retry canceled requests
  if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
    return false;
  }
  // Don't retry abort errors
  if (error.name === 'AbortError' || error.name === 'CanceledError') {
    return false;
  }
  // Don't retry timeout errors (they've already timed out)
  if (error.code === 'ECONNABORTED') {
    return false;
  }
  // Retry network errors (connection issues)
  if (!error.response) return true;
  // Retry server errors, timeout, and rate limit
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429;
};

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Check if we should retry
    if (config._retryCount < MAX_RETRIES && isRetryableError(error)) {
      config._retryCount += 1;
      console.log(`Retrying request (${config._retryCount}/${MAX_RETRIES}):`, config.url);

      // Wait before retrying
      await delay(RETRY_DELAY * config._retryCount);

      // Retry the request
      return adminApi(config);
    }

    // Handle final error (don't log canceled requests as errors)
    if (
      error.code === 'ERR_CANCELED' ||
      error.message === 'canceled' ||
      error.name === 'AbortError'
    ) {
      // Request was canceled - this is normal (component unmount, new request, etc.)
      // Don't treat it as an error
      const cancelError = new Error('Request canceled');
      cancelError.isCanceled = true;
      return Promise.reject(cancelError);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url);
      error.message = 'Request timed out. Please check your connection and try again.';
    } else if (error.message === 'Network Error' || !error.response) {
      console.error('Network error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        fullURL: error.config?.baseURL + error.config?.url,
        message: error.message,
        code: error.code,
        response: error.response ? 'present' : 'missing',
      });
      error.message = `Network error: ${error.config?.baseURL}${error.config?.url}. Please check your connection and CORS settings.`;
    }

    return Promise.reject(error);
  }
);

export default adminApi;
