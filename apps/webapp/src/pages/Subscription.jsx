import { useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Subscription.css';

function PlanCard({ title, priceText, onSelect, loading }) {
  return (
    <div className="plan-card">
      <h3>{title}</h3>
      <p className="price">{priceText}</p>
      <button disabled={loading} onClick={onSelect} className="btn-primary">
        {loading ? 'Processing...' : 'Subscribe'}
      </button>
    </div>
  );
}

export default function Subscription() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('loading');

  const refreshStatus = useCallback(async () => {
    try {
      const data = await apiGet('/api/subscription/status', token);
      const s = typeof data === 'string' ? data : (data?.status ?? 'inactive');
      setStatus(s);
    } catch (e) {
      console.error('Failed to fetch subscription status:', e);
      toast.error('Unable to load subscription status');
      setStatus('inactive');
    }
  }, [token]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function startCheckout(planType) {
    setLoading(true);
    try {
      const resp = await apiPost('/api/subscription/create', { planType }, token);
      const payload = resp?.data ?? resp;

      if (payload.checkoutSessionId && payload.publishableKey) {
        const stripe = await loadStripe(payload.publishableKey);
        const { error } = await stripe.redirectToCheckout({ sessionId: payload.checkoutSessionId });
        if (error) throw error;
      } else if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
      } else {
        toast.success(payload?.message ?? 'Subscription updated');
        refreshStatus();
      }
    } catch (e) {
      console.error(e);
      toast.error('Unable to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="subscription-page">
      <h2>Your Plan</h2>
      <div className={`status-pill status-${status}`}>Status: {status}</div>

      <section className="plans">
        <h2>Choose a plan</h2>
        <div className="plans-grid">
          <PlanCard
            title="Premium - Monthly"
            priceText="$29 / month"
            loading={loading}
            onSelect={() => startCheckout('PREMIUM')}
          />
          <PlanCard
            title="Enterprise - Annual"
            priceText="$299 / year"
            loading={loading}
            onSelect={() => startCheckout('ENTERPRISE')}
          />
        </div>
        <p className="note">
          You'll be redirected to Stripe Checkout. After success you'll land back at this page.
        </p>
      </section>
    </div>
  );
}
