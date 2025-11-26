import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const location = useLocation();
  const welcomeToastShownRef = useRef(false);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

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
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        console.error('API Error:', error);

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // Queue the request while refresh is in progress
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
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
          isRefreshing = true;

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
              isRefreshing = false;

              return axios(originalRequest);
            } catch (refreshError) {
              processQueue(refreshError, null);
              isRefreshing = false;

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
            isRefreshing = false;
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

      let errorMessage = 'Login failed';
      const errorCode = error.response?.data?.code;

      // Handle backend error codes
      if (errorCode === 'USER_NOT_FOUND') {
        errorMessage = 'No account found. Please register first.';
      } else if (errorCode === 'INVALID_FIREBASE_TOKEN') {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (errorCode === 'LOGIN_FAILED') {
        errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      }
      // Handle Firebase error codes
      else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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

  const register = async (email, password, anonymousMode = false) => {
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

      // Do not auto-login after registration. Ensure clean auth state.
      try {
        await auth.signOut();
      } catch (e) {
        // Non-fatal: just ensure local state is cleared
      }
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      welcomeToastShownRef.current = false;

      toast.update(toastId, {
        render: 'Account created! Please log in.',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);

      let errorMessage = 'Registration failed';
      const errorCode = error.response?.data?.code;

      // Handle backend error codes
      if (errorCode === 'USER_ALREADY_EXISTS') {
        errorMessage = 'This account already exists. Please log in instead.';
      } else if (errorCode === 'INVALID_FIREBASE_TOKEN') {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (errorCode === 'REGISTRATION_FAILED') {
        errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      }
      // Handle Firebase error codes
      else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      // Backend or Axios errors
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
