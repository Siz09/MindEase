import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Subscription.css';
import { loadStripe } from '@stripe/stripe-js';
import useInterval from '../hooks/useInterval';

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
  const prevStatusRef = useRef('loading');
  const hydratedRef = useRef(false);
  const [intensePolling, setIntensePolling] = useState(false);

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
    // If returning from checkout, enable short, intense polling window
    const justReturned = sessionStorage.getItem('justReturnedFromCheckout');
    if (justReturned) {
      setIntensePolling(true);
      sessionStorage.removeItem('justReturnedFromCheckout');
    }
  }, [refreshStatus]);

  // Track previous status to fire transition toasts once
  useEffect(() => {
    if (!hydratedRef.current) {
      // Skip toasts on initial hydration
      hydratedRef.current = true;
      prevStatusRef.current = status;
      return;
    }

    const prev = prevStatusRef.current;
    if (prev !== status) {
      if (status === 'active') {
        toast.success('Subscription activated');
        if (intensePolling) setIntensePolling(false);
      } else if (status === 'canceled') {
        toast.info('Subscription canceled');
      } else if (status === 'past_due') {
        toast.error('Payment failed');
      }
      prevStatusRef.current = status;
    }
  }, [status, intensePolling]);

  // Background polling: short interval during return-from-checkout
  // and slower interval otherwise, via reusable hook.
  const delay = intensePolling ? 1500 : 15000;
  useInterval(() => {
    refreshStatus().catch(() => {});
  }, delay);

  // Auto-disable intense polling after 45s
  useEffect(() => {
    if (!intensePolling) return;
    const t = setTimeout(() => setIntensePolling(false), 45000);
    return () => clearTimeout(t);
  }, [intensePolling]);

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

      // New flow: Stripe Checkout sessionId + publishableKey
      if (payload?.sessionId && payload?.publishableKey) {
        // Mark that we're heading to checkout — used for post-return polling
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        const stripe = await loadStripe(payload.publishableKey);
        const { error } = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
          toast.error(error.message || 'Stripe redirect failed');
        }
        return; // browser will navigate away on success
      }

      // Fallbacks: direct URL provided by backend (older flows)
      if (payload?.sessionUrl) {
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        safeRedirect(payload.sessionUrl);
        return;
      }
      if (payload?.checkoutUrl) {
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        safeRedirect(payload.checkoutUrl);
        return;
      }

      // No redirect – treat as immediate status change
      toast.success(payload?.message ?? 'Subscription updated');
      refreshStatus();
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
