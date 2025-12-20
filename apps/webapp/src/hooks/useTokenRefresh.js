import { useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getTokenExpirationMs } from '../utils/auth/tokenUtils';
import { authApiRefresh } from '../utils/auth/authApi';

const REFRESH_SKEW_MS = 5 * 60 * 1000; // 5 minutes

const parseRefreshResponse = (data) => {
  // Backend returns { token, refreshToken, user, ... }
  const token = data?.token || data?.data?.token;
  const refreshToken = data?.refreshToken || data?.data?.refreshToken;
  return { token, refreshToken };
};

export const useTokenRefresh = ({
  token,
  refreshToken,
  setAuthTokens,
  clearSession,
  onSessionExpired,
  pathname,
}) => {
  const isRefreshingRef = useRef(false);
  const failedQueueRef = useRef([]);
  const tokenRefreshTimerRef = useRef(null);

  // Keep axios default Authorization header in sync with token state.
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Proactive refresh before expiry.
  useEffect(() => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }

    if (!token || !refreshToken) return;

    const expirationMs = getTokenExpirationMs(token);
    if (!expirationMs) return;

    const now = Date.now();
    const timeUntilExpiry = expirationMs - now;
    const refreshInMs = timeUntilExpiry - REFRESH_SKEW_MS;

    const runRefresh = async () => {
      try {
        const data = await authApiRefresh({ refreshToken });
        const parsed = parseRefreshResponse(data);
        if (!parsed.token) throw new Error('Missing token in refresh response');
        setAuthTokens(parsed.token, parsed.refreshToken);
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    };

    if (refreshInMs > 0) {
      tokenRefreshTimerRef.current = setTimeout(runRefresh, refreshInMs);
    } else if (timeUntilExpiry > 0) {
      runRefresh();
    }

    return () => {
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, [token, refreshToken, setAuthTokens]);

  // Interceptor for 401 refresh + global error toasts.
  useEffect(() => {
    const processQueue = (error, nextToken = null) => {
      failedQueueRef.current.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(nextToken);
      });
      failedQueueRef.current = [];
    };

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshingRef.current) {
            return new Promise((resolve, reject) => {
              failedQueueRef.current.push({ resolve, reject });
            })
              .then((nextToken) => {
                originalRequest.headers['Authorization'] = `Bearer ${nextToken}`;
                return axios(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshingRef.current = true;

          const storedRefreshToken = localStorage.getItem('refreshToken') || refreshToken;

          if (!storedRefreshToken) {
            isRefreshingRef.current = false;
            clearSession();
            onSessionExpired?.();
            return Promise.reject(error);
          }

          try {
            const data = await authApiRefresh({ refreshToken: storedRefreshToken });
            const parsed = parseRefreshResponse(data);
            if (!parsed.token) throw new Error('Missing token in refresh response');

            setAuthTokens(parsed.token, parsed.refreshToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${parsed.token}`;

            processQueue(null, parsed.token);
            isRefreshingRef.current = false;
            return axios(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshingRef.current = false;

            clearSession();
            onSessionExpired?.();
            return Promise.reject(refreshError);
          }
        }

        // Non-auth errors: keep existing global toast behavior.
        if (!pathname?.startsWith('/admin') && error.response?.status !== 401) {
          let errorMessage = 'An unexpected error occurred';
          if (error.response) {
            const { status, data } = error.response;
            switch (status) {
              case 403:
                errorMessage = data?.message || 'Access denied';
                break;
              case 404:
                errorMessage = data?.message || 'Resource not found';
                break;
              case 422:
                errorMessage = data?.message || 'Validation failed';
                if (data?.errors) {
                  errorMessage += ': ' + data.errors.join(', ');
                }
                break;
              case 500:
                errorMessage = data?.message || 'Server error. Please try again later.';
                break;
              default:
                errorMessage = data?.message || `Error: ${status}`;
            }
          } else if (error.request) {
            errorMessage = 'Network error. Please check your connection.';
          } else {
            errorMessage = error.message || 'An unexpected error occurred';
          }

          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, setAuthTokens, clearSession, onSessionExpired, pathname]);
};

