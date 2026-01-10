import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useSession } from '../hooks/useSession';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { authApiMe } from '../utils/auth/authApi';
import { useAuthActions } from '../hooks/useAuthActions';
import { decodeJwtPayload } from '../utils/auth/tokenUtils';

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
  const { markAuthenticated, resetSessionFlags, showWelcomeBackOnce, showSessionExpiredOnce } =
    useSession({ pathname: location.pathname });

  const tokenLooksLikeAdmin = useCallback((candidateToken) => {
    const payload = decodeJwtPayload(candidateToken);
    const roles = []
      .concat(payload?.role || [])
      .concat(payload?.authority || [])
      .concat(payload?.authorities || [])
      .concat(payload?.roles || []);
    return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  }, []);

  // Helper to get translated error message
  const getErrorMessage = useCallback(
    (errorCode, fallback) => {
      const key = `auth.errors.${errorCode}`;
      if (errorCode && i18next.exists(key)) {
        return t(key);
      }
      return fallback;
    },
    [t]
  );

  const setAuthTokens = useCallback((nextToken, nextRefreshToken) => {
    if (nextToken) {
      localStorage.setItem('token', nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
    }

    if (nextRefreshToken !== undefined) {
      if (nextRefreshToken) {
        localStorage.setItem('refreshToken', nextRefreshToken);
        setRefreshToken(nextRefreshToken);
      } else {
        localStorage.removeItem('refreshToken');
        setRefreshToken(null);
      }
    }
  }, []);

  const clearSessionState = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
  }, []);

  useTokenRefresh({
    token,
    refreshToken,
    setAuthTokens,
    clearSession: clearSessionState,
    onSessionExpired: showSessionExpiredOnce,
    pathname: location.pathname,
  });

  const {
    login,
    loginAnonymously,
    register,
    updateUser,
    convertAnonymousToFull,
    sendPasswordResetEmail,
    logout,
  } = useAuthActions({
    t,
    getErrorMessage,
    token,
    currentUser,
    setCurrentUser,
    setAuthTokens,
    clearSessionState,
    markAuthenticated,
    resetSessionFlags,
  });

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
        // If an admin JWT was previously persisted into user storage, clear it so we don't
        // authenticate into the user UI with an admin session on browser reopen.
        if (tokenLooksLikeAdmin(storedToken)) {
          clearSessionState();
          setLoading(false);
          return;
        }
        try {
          const userData = await authApiMe({ token: storedToken });
          setCurrentUser(userData);
          setToken(storedToken);
          showWelcomeBackOnce();
          markAuthenticated();
        } catch (error) {
          console.error('Auth check failed:', error);
          clearSessionState();
          showSessionExpiredOnce();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [
    location.pathname,
    clearSessionState,
    showWelcomeBackOnce,
    markAuthenticated,
    showSessionExpiredOnce,
    tokenLooksLikeAdmin,
  ]);

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
