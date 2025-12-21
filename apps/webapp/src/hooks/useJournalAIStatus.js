import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

export default function useJournalAIStatus({ enabled = true } = {}) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [aiStatus, setAiStatus] = useState({ available: false, loading: true });

  const isMountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort?.();
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAIStatus = useCallback(async () => {
    try {
      controllerRef.current?.abort?.();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (!enabled) {
        if (isMountedRef.current) setAiStatus({ available: false, loading: false });
        return;
      }
      if (isOffline) {
        if (isMountedRef.current) setAiStatus({ available: false, loading: false });
        return;
      }

      setAiStatus((prev) => ({ ...prev, loading: true }));
      const res = await api.get('/journal/ai-status', { signal: controller.signal });
      const data = res.data || {};
      if (!isMountedRef.current || controller.signal.aborted) return;
      setAiStatus({ available: !!data.aiAvailable, loading: false });
    } catch (error) {
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') return;
      console.error('Error checking AI status:', error);
      if (isMountedRef.current) setAiStatus({ available: false, loading: false });
    }
  }, [enabled, isOffline]);

  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  return { isOffline, aiStatus, refresh: checkAIStatus };
}
