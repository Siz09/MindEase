'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Subscription.css';
import { loadStripe } from '@stripe/stripe-js';
import useInterval from '../hooks/useInterval';

function PlanCard({
  title,
  description,
  price,
  period,
  features,
  isRecommended,
  isActive,
  loading,
  onSelect,
}) {
  return (
    <div className={`plan-card ${isRecommended ? 'recommended' : ''} ${isActive ? 'active' : ''}`}>
      {isRecommended && <div className="recommended-badge">Recommended</div>}
      {isActive && <div className="active-badge">Current Plan</div>}

      <div className="plan-header">
        <h3>{title}</h3>
        <p className="plan-description">{description}</p>
      </div>

      <div className="plan-pricing">
        <span className="plan-price">${price}</span>
        <span className="plan-period">/{period}</span>
      </div>

      <ul className="plan-features">
        {features.map((feature, idx) => (
          <li key={idx}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`plan-button ${isActive ? 'manage' : ''}`}
        disabled={loading}
        onClick={onSelect}
      >
        {isActive ? 'Manage' : loading ? 'Processing...' : 'Subscribe'}
      </button>
    </div>
  );
}

export default function Subscription() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('loading');
  const [showUpgradeView, setShowUpgradeView] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
    const justReturned = sessionStorage.getItem('justReturnedFromCheckout');
    if (justReturned) {
      setIntensePolling(true);
      sessionStorage.removeItem('justReturnedFromCheckout');
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      prevStatusRef.current = status;
      return;
    }

    const prev = prevStatusRef.current;
    if (prev !== status) {
      if (status === 'active') {
        toast.success('Subscription activated');
        if (intensePolling) setIntensePolling(false);
        setShowUpgradeView(false);
      } else if (status === 'canceled') {
        toast.info('Subscription canceled');
      } else if (status === 'past_due') {
        toast.error('Payment failed');
      }
      prevStatusRef.current = status;
    }
  }, [status, intensePolling]);

  const delay = intensePolling ? 1500 : 15000;
  useInterval(() => {
    refreshStatus().catch(() => {});
  }, delay);

  useEffect(() => {
    if (!intensePolling) return;
    const t = setTimeout(() => setIntensePolling(false), 45000);
    return () => clearTimeout(t);
  }, [intensePolling]);

  const TRUSTED_DOMAINS = ['checkout.stripe.com', 'localhost', '127.0.0.1', 'yourdomain.com'];

  function safeRedirect(urlString) {
    try {
      const url = new URL(urlString);
      const host = url.hostname;
      const ok = TRUSTED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
      if (!ok) throw new Error('Untrusted redirect URL');
      window.location.assign(url.toString());
      return true;
    } catch (err) {
      console.error('Invalid or untrusted checkout URL:', err);
      toast.error('Invalid checkout URL received');
      return false;
    }
  }

  async function startCheckout(billingPeriod) {
    setLoading(true);
    try {
      const resp = await apiPost('/api/subscription/create', { billingPeriod }, token);
      const payload = resp?.data ?? resp;

      if (payload?.sessionId && payload?.publishableKey) {
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        const stripe = await loadStripe(payload.publishableKey);
        const { error } = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
        if (error) {
          sessionStorage.removeItem('justReturnedFromCheckout');
          console.error('Stripe redirect error:', error);
          toast.error(error.message || 'Stripe redirect failed');
        }
        return;
      }

      if (payload?.sessionUrl) {
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        if (!safeRedirect(payload.sessionUrl)) {
          sessionStorage.removeItem('justReturnedFromCheckout');
        }
        return;
      }
      if (payload?.checkoutUrl) {
        sessionStorage.setItem('justReturnedFromCheckout', '1');
        if (!safeRedirect(payload.checkoutUrl)) {
          sessionStorage.removeItem('justReturnedFromCheckout');
        }
        return;
      }

      toast.success(payload?.message ?? 'Subscription updated');
      refreshStatus();
    } catch (e) {
      console.error(e);
      toast.error('Unable to start checkout');
    } finally {
      setLoading(false);
    }
  }

  async function cancelSubscription() {
    setLoading(true);
    try {
      await apiPost('/api/subscription/cancel', {}, token);
      toast.success('Subscription canceled successfully');
      setShowCancelModal(false);
      refreshStatus();
    } catch (e) {
      console.error(e);
      toast.error('Unable to cancel subscription');
    } finally {
      setLoading(false);
    }
  }

  const premiumFeatures = [
    'Unlimited chat sessions',
    'Advanced mood tracking',
    'Personalized insights',
    'Mindfulness library',
    'Priority support',
  ];

  if (status === 'loading') {
    return (
      <div className="subscription-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="subscription-page">
        <div className="subscription-header">
          <h1>Your Subscription</h1>
          <p>Manage your MindEase Premium subscription</p>
        </div>

        <div className="subscription-status">
          <div className={`status-badge status-${status}`}>
            <span className="status-dot"></span>
            <span className="status-text">Premium Member</span>
          </div>
        </div>

        {/* Current Plan Display */}
        <div className="current-subscription-container">
          <div className="current-plan-card">
            <div className="plan-header">
              <h3>Premium Monthly</h3>
              <p className="plan-description">You have access to all premium features</p>
            </div>

            <div className="plan-pricing">
              <span className="plan-price">$29</span>
              <span className="plan-period">/month</span>
            </div>

            <ul className="plan-features">
              {premiumFeatures.map((feature, idx) => (
                <li key={idx}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="subscription-actions">
            <button
              className="action-button upgrade-button"
              onClick={() => setShowUpgradeView(!showUpgradeView)}
            >
              {showUpgradeView ? 'Hide Plans' : 'Upgrade or Change Plan'}
            </button>
            <button
              className="action-button cancel-button"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Upgrade View */}
        {showUpgradeView && (
          <div className="upgrade-view">
            <h2>Choose Your Plan</h2>
            <div className="plans-container">
              <PlanCard
                title="Premium Monthly"
                description="Your current plan"
                price="29"
                period="month"
                features={premiumFeatures}
                isActive={true}
                isRecommended={false}
                loading={false}
                onSelect={() => toast.info('You are already on this plan')}
              />

              <PlanCard
                title="Premium Annual"
                description="Best value - Save $48/year"
                price="299"
                period="year"
                features={[...premiumFeatures, 'Save $48 per year']}
                isActive={false}
                isRecommended={true}
                loading={loading}
                onSelect={() => startCheckout('ANNUAL')}
              />
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Cancel Subscription?</h2>
              <p>
                Are you sure you want to cancel your subscription? You'll lose access to premium
                features.
              </p>
              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setShowCancelModal(false)}>
                  Keep Subscription
                </button>
                <button
                  className="modal-button confirm"
                  onClick={cancelSubscription}
                  disabled={loading}
                >
                  {loading ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="subscription-footer">
          <p>Need help? Contact our support team for assistance with your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock premium features to enhance your mental wellness journey</p>
      </div>

      <div className="subscription-status">
        <div className={`status-badge status-${status}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {status === 'canceled'
              ? 'Subscription Canceled'
              : status === 'past_due'
                ? 'Payment Issue'
                : 'Free Plan'}
          </span>
        </div>
      </div>

      <div className="plans-container">
        <PlanCard
          title="Free"
          description="Get started"
          price="0"
          period="forever"
          features={[
            'Basic mood tracking',
            'Journal entries',
            'Limited chat access',
            'Community resources',
          ]}
          isActive={status === 'inactive'}
          isRecommended={false}
          loading={false}
          onSelect={() => toast.info('You are already on the free plan')}
        />

        <PlanCard
          title="Premium Monthly"
          description="Full access"
          price="29"
          period="month"
          features={premiumFeatures}
          isActive={false}
          isRecommended={true}
          loading={loading}
          onSelect={() => startCheckout('MONTHLY')}
        />

        <PlanCard
          title="Premium Annual"
          description="Best value"
          price="299"
          period="year"
          features={[...premiumFeatures, 'Save $48 per year']}
          isActive={false}
          isRecommended={false}
          loading={loading}
          onSelect={() => startCheckout('ANNUAL')}
        />
      </div>

      <div className="subscription-footer">
        <p>You'll be redirected to Stripe Checkout. After success you'll land back at this page.</p>
      </div>
    </div>
  );
}
