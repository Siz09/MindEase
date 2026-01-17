import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export const useSession = ({ pathname }) => {
  const { t } = useTranslation();
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
    toast.success(t('auth.welcomeBack', 'Welcome Back'));
    welcomeToastShownRef.current = true;
  }, [shouldSuppressToasts, t]);

  const showSessionExpiredOnce = useCallback(() => {
    if (shouldSuppressToasts()) return;
    if (sessionExpiredToastShownRef.current) return;

    sessionExpiredToastShownRef.current = true;
    toast.error(t('auth.sessionExpired', 'Session expired. Please log in again.'));

    clearSessionExpiredResetTimer();
    sessionExpiredTimeoutRef.current = setTimeout(() => {
      sessionExpiredToastShownRef.current = false;
      sessionExpiredTimeoutRef.current = null;
    }, 3000);
  }, [shouldSuppressToasts, clearSessionExpiredResetTimer, t]);

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
