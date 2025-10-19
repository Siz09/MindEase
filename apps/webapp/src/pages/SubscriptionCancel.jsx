import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SubscriptionCancel() {
  const navigate = useNavigate();
  useEffect(() => {
    toast.info('Checkout canceled.');
    const t = setTimeout(() => navigate('/subscription'), 800);
    return () => clearTimeout(t);
  }, [navigate]);
  return <div style={{ padding: 24 }}>Canceled. Returning…</div>;
}
