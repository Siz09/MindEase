import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export const useSession = ({ pathname }) => {
  const welcomeToastShownRef = useRef(false);
  const sessionExpiredToastShownRef = useRef(false);
  const sessionExpiredTimeoutRef = useRef(null);

  const shouldSuppressToasts = useCallback(
    () => pathname?.startsWith('/admin') || pathname?.startsWith('/login'),
    [pathname]
  );

  const clearSessionExpiredResetTimer = useCallback(() => {
    if (sessionExpiredTimeoutRef.current) {
      clearTimeout(sessionExpiredTimeoutRef.current);
      sessionExpiredTimeoutRef.current = null;
    }
  }, []);

  const markAuthenticated = useCallback(() => {
    welcomeToastShownRef.current = true;
    sessionExpiredToastShownRef.current = false;
    clearSessionExpiredResetTimer();
  }, [clearSessionExpiredResetTimer]);

  const resetSessionFlags = useCallback(() => {
    welcomeToastShownRef.current = false;
    sessionExpiredToastShownRef.current = false;
    clearSessionExpiredResetTimer();
  }, [clearSessionExpiredResetTimer]);

  const showWelcomeBackOnce = useCallback(() => {
    if (welcomeToastShownRef.current) return;
    if (shouldSuppressToasts()) return;
    toast.success('Welcome back!');
    welcomeToastShownRef.current = true;
  }, [shouldSuppressToasts]);

  const showSessionExpiredOnce = useCallback(() => {
    if (shouldSuppressToasts()) return;
    if (sessionExpiredToastShownRef.current) return;

    sessionExpiredToastShownRef.current = true;
    toast.error('Session expired. Please log in again.');

    clearSessionExpiredResetTimer();
    sessionExpiredTimeoutRef.current = setTimeout(() => {
      sessionExpiredToastShownRef.current = false;
      sessionExpiredTimeoutRef.current = null;
    }, 3000);
  }, [shouldSuppressToasts, clearSessionExpiredResetTimer]);

  useEffect(() => {
    return () => {
      clearSessionExpiredResetTimer();
    };
  }, [clearSessionExpiredResetTimer]);

  return {
    markAuthenticated,
    resetSessionFlags,
    showWelcomeBackOnce,
    showSessionExpiredOnce,
    shouldSuppressToasts,
  };
};

