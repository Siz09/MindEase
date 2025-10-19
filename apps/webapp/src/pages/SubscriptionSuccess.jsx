import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    toast.success('Payment successful! Updating your plan…');
    const t = setTimeout(() => navigate('/subscription'), 1200);
    return () => clearTimeout(t);
  }, [navigate]);
  return <div style={{ padding: 24 }}>Processing your subscription…</div>;
}
