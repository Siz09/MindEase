import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
  const [user, setUser] = useState(null);
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
          setUser(response.data.user);
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

  const login = async (email, password) => {
    try {
      // Show loading toast
      const toastId = toast.loading('Signing in...');

      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Step 2: Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Step 3: Login to our backend
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        firebaseToken,
      });

      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);

      // Update toast to success
      toast.update(toastId, {
        render: 'Successfully signed in!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Login failed';
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (email, password, anonymousMode = false) => {
    try {
      // Show loading toast
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

      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);

      // Update toast to success
      toast.update(toastId, {
        render: 'Account created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);

      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      }

      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    auth.signOut();
    toast.info('You have been logged out');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
