import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { toast } from 'react-toastify';

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
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get('http://localhost:8080/api/auth/me');
          setCurrentUser(response.data.user);
          setToken(storedToken);
          toast.success('Welcome back!');
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          toast.error('Session expired. Please log in again.');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Configure axios interceptors for global error handling
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);

        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;

          switch (status) {
            case 401:
              errorMessage = data?.message || 'Session expired. Please log in again.';
              localStorage.removeItem('token');
              setToken(null);
              setCurrentUser(null);
              break;
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
          // Network error
          errorMessage = 'Network error. Please check your connection.';
        } else {
          // Other error
          errorMessage = error.message || 'An unexpected error occurred';
        }

        toast.error(errorMessage);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);
  const login = async (email, password) => {
    try {
      const toastId = toast.loading('Signing in...');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const firebaseToken = await firebaseUser.getIdToken();

      const response = await axios.post('http://localhost:8080/api/auth/login', {
        firebaseToken,
      });

      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setCurrentUser(userData);

      toast.update(toastId, {
        render: 'Successfully signed in!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true, user: userData, token: jwtToken };
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed';
      if (error.code === 'auth/invalid-credential') {
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

      return { success: false, error: errorMessage };
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

      // Register anonymously with our backend
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        email: `anonymous_${firebaseUser.uid}@mindease.com`,
        firebaseToken,
        anonymousMode: true,
      });

      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setCurrentUser(userData);

      toast.update(toastId, {
        render: 'Continuing anonymously!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true, user: userData, token: jwtToken };
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
      const response = await axios.post('http://localhost:8080/api/auth/register', {
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

      // Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
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
      };
    }
  };

  const updateUser = async (updates) => {
    try {
      // Use the correct endpoint for anonymous mode
      if (updates.anonymousMode !== undefined) {
        const response = await axios.patch(
          `http://localhost:8080/api/users/${currentUser.id}/anonymous-mode`,
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

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
    auth.signOut();
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
