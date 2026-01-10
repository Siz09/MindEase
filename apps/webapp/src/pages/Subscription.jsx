'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import useInterval from '../hooks/useInterval';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Separator } from '../components/ui/Separator';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <Card
      className={cn(
        'relative flex flex-col transition-all',
        isRecommended && 'border-green-600 shadow-lg ring-2 ring-green-600/20',
        isActive && 'border-green-400 bg-green-50/50 dark:bg-green-950/20',
        !isActive && 'hover:border-green-500 hover:shadow-md'
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-3 py-1">
            Recommended
          </Badge>
        </div>
      )}
      {isActive && (
        <div className="absolute -top-3 right-4">
          <Badge variant="success" className="px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-green-600 dark:text-green-500">${price}</span>
          <span className="text-muted-foreground text-lg">/{period}</span>
        </div>

        <Separator />

        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        <Button
          variant={isActive ? 'outline' : 'primary'}
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={onSelect}
          loading={loading}
        >
          {isActive ? 'Current Plan' : loading ? 'Processing...' : 'Subscribe'}
        </Button>
      </CardFooter>
    </Card>
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
    'Breathing exercises & meditation',
    'Priority support',
  ];

  if (status === 'loading') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subscription status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Your Subscription
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage your MindEase Premium subscription
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="success" className="px-4 py-2 text-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Premium Member
            </Badge>
          </div>

          {/* Current Plan Card */}
          <div className="mx-auto w-full max-w-[28rem]">
            <Card className="border-green-400 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-2xl">Premium Monthly</CardTitle>
                <CardDescription className="text-base">
                  You have access to all premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-500">$29</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <Separator />
                <ul className="space-y-3">
                  {premiumFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowUpgradeView(!showUpgradeView)}
                >
                  {showUpgradeView ? 'Hide Plans' : 'Upgrade or Change Plan'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Subscription
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Upgrade View */}
          {showUpgradeView && (
            <div className="space-y-6 rounded-lg border bg-gray-50/50 p-6 dark:bg-gray-900/50">
              <h2 className="text-center text-2xl font-semibold">Choose Your Plan</h2>
              <div className="grid gap-6 md:grid-cols-2">
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

          {/* Cancel Confirmation Dialog */}
          <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cancel Subscription?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your subscription? You'll lose access to premium
                  features at the end of your current billing period.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="danger"
                  className="w-full sm:w-auto"
                  onClick={cancelSubscription}
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? 'Canceling...' : 'Cancel Subscription'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Footer */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help? Contact our support team for assistance with your subscription.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Unlock premium features to enhance your mental wellness journey
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge
            variant={
              status === 'canceled'
                ? 'destructive'
                : status === 'past_due'
                  ? 'warning'
                  : 'secondary'
            }
            className="px-4 py-2 text-sm"
          >
            <span
              className={cn(
                'mr-2 h-2 w-2 rounded-full',
                status === 'canceled'
                  ? 'bg-red-500'
                  : status === 'past_due'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              )}
            ></span>
            {status === 'canceled'
              ? 'Subscription Canceled'
              : status === 'past_due'
                ? 'Payment Issue'
                : 'Free Plan'}
          </Badge>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard
            title="Free"
            description="Get started with basic features"
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
            description="Full access to all features"
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
            description="Best value for long-term wellness"
            price="299"
            period="year"
            features={[...premiumFeatures, 'Save $48 per year']}
            isActive={false}
            isRecommended={false}
            loading={loading}
            onSelect={() => startCheckout('ANNUAL')}
          />
        </div>

        {/* Footer */}
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You'll be redirected to Stripe Checkout. After success you'll land back at this page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
