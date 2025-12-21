import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

export default function useJournalAIStatus({ enabled = true } = {}) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [aiStatus, setAiStatus] = useState({ available: false, loading: true });

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
      if (!enabled) return;
      if (isOffline) {
        setAiStatus({ available: false, loading: false });
        return;
      }
      const res = await api.get('/journal/ai-status');
      const data = res.data || {};
      setAiStatus({ available: !!data.aiAvailable, loading: false });
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({ available: false, loading: false });
    }
  }, [enabled, isOffline]);

  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  return { isOffline, aiStatus, refresh: checkAIStatus };
}

