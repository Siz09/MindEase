import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiGet } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import useInterval from '../hooks/useInterval';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  const mountedOnce = useRef(false);
  const navigated = useRef(false);
  const infoToastId = useRef(null);

  // polling settings
  const intervalMs = 1500;
  const timeoutMs = 45000;
  const elapsedRef = useRef(0);

  // use state to toggle polling off
  const [shouldPoll, setShouldPoll] = useState(true);

  // one-time side effects
  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    sessionStorage.setItem('justReturnedFromCheckout', '1');
    infoToastId.current = toast.info('Payment successful. Finalizing your subscription…', {
      toastId: 'finalizing-sub',
      autoClose: 4000,
    });

    // If no sessionId, just go to subscription page
    if (!sessionId) {
      if (!navigated.current) {
        navigated.current = true;
        setShouldPoll(false);
        toast.warn('Missing checkout session. Showing subscription page.');
        navigate('/subscription', { replace: true });
      }
    }
  }, [navigate, sessionId]);

  // guard: if no token, kick to login once (or your preferred route)
  useEffect(() => {
    if (!token && !navigated.current) {
      navigated.current = true;
      setShouldPoll(false); // stop polling immediately
      toast.error('Authentication required');
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // helper to finish exactly once
  const finish = (path = '/subscription', state) => {
    if (navigated.current) return;
    navigated.current = true;
    setShouldPoll(false); // stop useInterval by switching delay to null
    navigate(path, { replace: true, state });
  };

  useInterval(
    async () => {
      // double-check guards inside the tick
      if (!shouldPoll || navigated.current || !token || !sessionId) return;

      try {
        const data = await apiGet('/api/subscription/status', token);
        const s = typeof data === 'string' ? data : (data?.status ?? 'inactive');

        if (s === 'active') {
          toast.success('Subscription activated', { toastId: 'sub-activated' });
          finish('/subscription', { sessionId });
          return;
        }
      } catch {
        // ignore transient errors during polling
      }

      elapsedRef.current += intervalMs;
      if (elapsedRef.current >= timeoutMs) {
        toast.warning('Still processing your subscription. It may take a moment.');
        finish('/subscription', { sessionId, timedOut: true });
      }
    },
    shouldPoll ? intervalMs : null // ← passing null stops the interval
  );

  // no setState after unmount
  useEffect(() => {
    return () => {
      setShouldPoll(false);
    };
  }, []);

  return <div style={{ padding: 24 }}>Processing your subscription…</div>;
}
