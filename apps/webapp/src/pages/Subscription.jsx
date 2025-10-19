import { useEffect, useState, useCallback } from 'react';
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

  // Configure trusted domains for redirects
  const TRUSTED_DOMAINS = ['checkout.stripe.com', 'localhost', '127.0.0.1', 'yourdomain.com'];

  function safeRedirect(urlString) {
    try {
      const url = new URL(urlString);
      const host = url.hostname;
      const ok = TRUSTED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
      if (!ok) throw new Error('Untrusted redirect URL');
      window.location.assign(url.toString());
    } catch (err) {
      console.error('Invalid or untrusted checkout URL:', err);
      toast.error('Invalid checkout URL received');
    }
  }

  async function startCheckout(planType) {
    setLoading(true);
    try {
      const resp = await apiPost('/api/subscription/create', { planType }, token);
      const payload = resp?.data ?? resp;

      // Preferred: server returns a session URL
      if (payload.sessionUrl) {
        safeRedirect(payload.sessionUrl);
      } else if (payload.checkoutUrl) {
        // Backward compatible name
        safeRedirect(payload.checkoutUrl);
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
