import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import { toast } from 'react-toastify';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const location = useLocation();
  const welcomeToastShownRef = useRef(false);

  // Helper to get translated error message
  const getErrorMessage = (errorCode, fallback) => {
    if (errorCode && t(`auth.errors.${errorCode}`, { defaultValue: null })) {
      return t(`auth.errors.${errorCode}`);
    }
    return fallback;
  };
  const isRefreshingRef = useRef(false);
  const failedQueueRef = useRef([]);
  const tokenRefreshTimerRef = useRef(null);

  // Utility to decode JWT and get expiration
  const getTokenExpiration = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Proactive token refresh - refresh 5 minutes before expiration
  useEffect(() => {
    if (!token || !refreshToken) {
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
      return;
    }

    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) return;

    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // 5 minutes before expiry

    if (refreshTime > 0) {
      console.log(
        `Token will be proactively refreshed in ${Math.round(refreshTime / 1000 / 60)} minutes`
      );

      tokenRefreshTimerRef.current = setTimeout(async () => {
        console.log('Proactively refreshing token...');
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const newToken = response.data.data.token;
          const newRefreshToken = response.data.data.refreshToken;

          setToken(newToken);
          setRefreshToken(newRefreshToken);
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          console.log('Token proactively refreshed successfully');
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
          // Don't logout - let the interceptor handle it on next request
        }
      }, refreshTime);
    } else if (timeUntilExpiry > 0) {
      // Token expires soon, refresh immediately
      console.log('Token expires soon, refreshing immediately...');
      axios
        .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
        .then((response) => {
          const newToken = response.data.data.token;
          const newRefreshToken = response.data.data.refreshToken;
          setToken(newToken);
          setRefreshToken(newRefreshToken);
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
        })
        .catch((error) => {
          console.error('Immediate token refresh failed:', error);
        });
    }

    return () => {
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, [token, refreshToken]);

  // Check if user is authenticated on app load
  useEffect(() => {
    // Skip user auth checks on admin pages to avoid noise and unnecessary calls
    if (location.pathname.startsWith('/admin')) {
      setLoading(false);
      return;
    }
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
          // Handle both old format (response.data.user) and new format (response.data directly)
          const userData = response.data.user || response.data;
          setCurrentUser(userData);
          setToken(storedToken);
          if (!welcomeToastShownRef.current) {
            toast.success('Welcome back!');
            welcomeToastShownRef.current = true;
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          welcomeToastShownRef.current = false;
          // Suppress toast on login route to reduce flicker
          if (!location.pathname.startsWith('/login')) {
            toast.error('Session expired. Please log in again.');
          }
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [location.pathname]);

  // Helper to DRY success-path state updates and toasts
  const handleAuthSuccess = (jwtToken, userData, refreshTokenValue, toastId, messageText) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);

    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
      setRefreshToken(refreshTokenValue);
    }

    setCurrentUser(userData);
    welcomeToastShownRef.current = true;

    if (toastId) {
      toast.update(toastId, {
        render: messageText || 'Signed in!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    }
    return { success: true, user: userData, token: jwtToken, refreshToken: refreshTokenValue };
  };

  // Configure axios interceptors for global error handling and token refresh
  useEffect(() => {
    const processQueue = (error, token = null) => {
      failedQueueRef.current.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueueRef.current = [];
    };

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        console.error('API Error:', error);

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshingRef.current) {
            // Queue the request while refresh is in progress
            return new Promise((resolve, reject) => {
              failedQueueRef.current.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return axios(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshingRef.current = true;

          const storedRefreshToken = localStorage.getItem('refreshToken');

          if (storedRefreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                refreshToken: storedRefreshToken,
              });

              const { token: newToken, refreshToken: newRefreshToken } = response.data;

              localStorage.setItem('token', newToken);
              setToken(newToken);

              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
                setRefreshToken(newRefreshToken);
              }

              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

              processQueue(null, newToken);
              isRefreshingRef.current = false;

              return axios(originalRequest);
            } catch (refreshError) {
              processQueue(refreshError, null);
              isRefreshingRef.current = false;

              // Refresh failed, clear session
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setToken(null);
              setRefreshToken(null);
              setCurrentUser(null);

              if (
                !location.pathname.startsWith('/admin') &&
                !location.pathname.startsWith('/login')
              ) {
                toast.error('Session expired. Please log in again.');
              }

              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token available
            isRefreshingRef.current = false;
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);

            if (
              !location.pathname.startsWith('/admin') &&
              !location.pathname.startsWith('/login')
            ) {
              toast.error('Session expired. Please log in again.');
            }

            return Promise.reject(error);
          }
        }

        // Handle other errors
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
              if (data.errors) {
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

        // Suppress global toasts on admin pages and for 401 errors (already handled above)
        if (!location.pathname.startsWith('/admin') && error.response?.status !== 401) {
          toast.error(errorMessage);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [location.pathname, refreshToken]);
  const login = async (email, password) => {
    try {
      const toastId = toast.loading('Signing in...');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const firebaseToken = await firebaseUser.getIdToken();

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        firebaseToken,
      });

      const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = response.data;
      // If the account is ADMIN, do not bind it to user session here.
      // Let the caller (Login page) adopt it into AdminAuth instead to keep sessions separate.
      const role = userData?.role || userData?.authority;
      if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
        toast.update(toastId, {
          render: 'Signed in as admin',
          type: 'success',
          isLoading: false,
          autoClose: 1500,
        });
        return {
          success: true,
          user: userData,
          token: jwtToken,
          refreshToken: refreshTokenValue,
          isAdmin: true,
        };
      }

      return handleAuthSuccess(
        jwtToken,
        userData,
        refreshTokenValue,
        toastId,
        'Successfully signed in!'
      );
    } catch (error) {
      console.error('Login error:', error);

      const errorCode = error.response?.data?.code;
      let errorMessage = getErrorMessage(errorCode, t('auth.loginError'));

      // Handle Firebase error codes if no backend code
      if (!errorCode) {
        if (error.code === 'auth/invalid-credential') {
          errorMessage = getErrorMessage('INVALID_CREDENTIALS', 'Invalid email or password.');
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = getErrorMessage('USER_NOT_FOUND', 'No account found with this email.');
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = getErrorMessage('INVALID_CREDENTIALS', 'Incorrect password.');
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);

      return { success: false, error: errorMessage, code: errorCode };
    }
  };

  const loginAnonymously = async () => {
    try {
      const toastId = toast.loading('Continuing anonymously...');

      // Sign in anonymously with Firebase
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // First try to login (handles returning anonymous users)
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          firebaseToken,
        });

        const {
          token: jwtToken,
          refreshToken: refreshTokenValue,
          user: userData,
        } = loginResponse.data;
        return handleAuthSuccess(
          jwtToken,
          userData,
          refreshTokenValue,
          toastId,
          'Continuing anonymously!'
        );
      } catch (loginErr) {
        const status = loginErr?.response?.status;
        const message = loginErr?.response?.data?.message || '';
        const errorCode = loginErr?.response?.data?.code;

        // If user doesn't exist yet, register then proceed
        if (errorCode === 'USER_NOT_FOUND' || status === 404) {
          const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            email: `anonymous_${firebaseUser.uid}@mindease.com`,
            firebaseToken,
            anonymousMode: true,
          });
          const {
            token: jwtToken,
            refreshToken: refreshTokenValue,
            user: userData,
          } = registerResponse.data;
          return handleAuthSuccess(
            jwtToken,
            userData,
            refreshTokenValue,
            toastId,
            'Continuing anonymously!'
          );
        }

        // Any other error bubbles up to outer catch
        throw loginErr;
      }
    } catch (error) {
      console.error('Anonymous login error:', error);
      toast.error('Failed to continue anonymously. Please try again.');
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, anonymousMode = false, autoLogin = true) => {
    try {
      const toastId = toast.loading('Creating account...');

      // Step 1: Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Step 2: Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Step 3: Register in our backend
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email,
        firebaseToken,
        anonymousMode,
      });

      const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = response.data;

      if (autoLogin) {
        // Auto-login after successful registration
        return handleAuthSuccess(
          jwtToken,
          userData,
          refreshTokenValue,
          toastId,
          'Account created! Welcome to MindEase!'
        );
      } else {
        // Do not auto-login. Ensure clean auth state.
        try {
          await auth.signOut();
        } catch (e) {
          // Non-fatal: just ensure local state is cleared
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setRefreshToken(null);
        setCurrentUser(null);
        welcomeToastShownRef.current = false;

        toast.update(toastId, {
          render: 'Account created! Please log in.',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);

      const errorCode = error.response?.data?.code;
      let errorMessage = getErrorMessage(errorCode, t('auth.registerError'));

      // Handle Firebase error codes if no backend code
      if (!errorCode) {
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = getErrorMessage(
            'USER_ALREADY_EXISTS',
            'This email is already registered. Please log in instead.'
          );
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = t('auth.invalidEmailFormat');
        } else if (error.code === 'auth/weak-password') {
          errorMessage = getErrorMessage(
            'WEAK_PASSWORD',
            'Password should be at least 6 characters.'
          );
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  };

  const updateUser = async (updates) => {
    try {
      // Use the correct endpoint for anonymous mode
      if (updates.anonymousMode !== undefined) {
        const response = await axios.patch(
          `${API_BASE_URL}/api/users/${currentUser.id}/anonymous-mode`,
          { anonymousMode: updates.anonymousMode },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCurrentUser((prev) => ({ ...prev, ...response.data }));
        return { success: true };
      }

      // For other updates, use a different endpoint or handle accordingly
      return { success: false, error: 'Only anonymous mode updates are supported' };
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user settings');
      return { success: false, error: error.message };
    }
  };

  const convertAnonymousToFull = async (email, password) => {
    try {
      const toastId = toast.loading('Converting account...');

      // Link anonymous account with email/password in Firebase
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No active session');
      }

      // Import the credential helper
      const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(firebaseUser, credential);

      // Get new Firebase token
      const firebaseToken = await firebaseUser.getIdToken(true); // Force refresh

      // Call backend to convert account
      const response = await axios.post(`${API_BASE_URL}/api/auth/convert-anonymous`, {
        email,
        password,
        firebaseToken,
      });

      const { token: jwtToken, refreshToken: refreshTokenValue, user: userData } = response.data;

      // Update local state
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);

      if (refreshTokenValue) {
        localStorage.setItem('refreshToken', refreshTokenValue);
        setRefreshToken(refreshTokenValue);
      }

      setCurrentUser(userData);

      toast.update(toastId, {
        render: 'Account converted successfully! Welcome to MindEase!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true, user: userData };
    } catch (error) {
      console.error('Convert anonymous error:', error);

      const errorCode = error.response?.data?.code;
      let errorMessage = getErrorMessage(errorCode, 'Failed to convert account');

      // Handle Firebase error codes if no backend code
      if (!errorCode) {
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = getErrorMessage(
            'EMAIL_IN_USE',
            'This email is already in use. Please use a different email.'
          );
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = t('auth.invalidEmailFormat');
        } else if (error.code === 'auth/weak-password') {
          errorMessage = getErrorMessage(
            'WEAK_PASSWORD',
            'Password should be at least 6 characters.'
          );
        } else if (error.code === 'auth/requires-recent-login') {
          errorMessage = 'Please log out and log back in before converting your account.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);

      return { success: false, error: errorMessage, code: errorCode };
    }
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      // Track the request in backend for rate limiting and monitoring
      try {
        await axios.post(`${API_BASE_URL}/api/auth/request-password-reset`, { email });
      } catch (backendError) {
        // Check for rate limit error
        if (backendError.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
          const errorMsg = getErrorMessage(
            'RATE_LIMIT_EXCEEDED',
            'Too many reset requests. Please try again later.'
          );
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
        // Continue even if backend tracking fails
        console.warn('Backend tracking failed for password reset:', backendError);
      }

      // Send password reset email via Firebase
      await firebaseSendPasswordResetEmail(auth, email);
      toast.success(t('auth.passwordResetEmailSent', { email }));
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);

      let errorMessage = t('auth.passwordResetError');

      // Handle Firebase error codes
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists - show generic message
        errorMessage = t('auth.passwordResetGenericSuccess');
        return { success: true }; // Return success to prevent account enumeration
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmailFormat');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = getErrorMessage(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests. Please try again later.'
        );
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to revoke refresh tokens
      if (token) {
        await axios.post(`${API_BASE_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
    auth.signOut();
    welcomeToastShownRef.current = false;
    toast.info('You have been logged out');
  };

  const value = {
    currentUser,
    token,
    loading,
    login,
    loginAnonymously,
    register,
    updateUser,
    convertAnonymousToFull,
    sendPasswordResetEmail,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
