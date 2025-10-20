import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiGet } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import useInterval from '../hooks/useInterval';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [params] = useSearchParams();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    sessionStorage.setItem('justReturnedFromCheckout', '1');
    toast.info('Payment successful. Finalizing your subscription…');
  }, []);

  const sessionId = params.get('session_id');
  const startedRef = useRef(false);
  const elapsedRef = useRef(0);
  const intervalMs = 1500;
  const timeoutMs = 45000;

  useInterval(async () => {
    startedRef.current = true;
    try {
      const data = await apiGet('/api/subscription/status', token);
      const s = typeof data === 'string' ? data : (data?.status ?? 'inactive');
      if (s === 'active') {
        toast.success('Subscription activated');
        navigate('/subscription', { replace: true, state: { sessionId } });
        return;
      }
    } catch (e) {
      // ignore transient errors during polling
    }
    elapsedRef.current += intervalMs;
    if (elapsedRef.current >= timeoutMs) {
      toast.warning('Still processing your subscription. It may take a moment.');
      navigate('/subscription', { replace: true, state: { sessionId } });
    }
  }, intervalMs);

  return <div style={{ padding: 24 }}>Processing your subscription…</div>;
}
