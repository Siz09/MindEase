'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import useInterval from '../hooks/useInterval';
import { submitEsewaForm } from '../utils/esewa';
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
} from '../components/ui/dialog';
import { Separator } from '../components/ui/Separator';
import { Check, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';
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
          <Badge variant="default" className="px-3 py-1 bg-green-600 text-white border-green-600">
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

      <CardFooter className="pt-6 px-6 pb-6">
        <Button
          variant={isActive ? 'outline' : 'default'}
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={onSelect}
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
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const prevStatusRef = useRef('loading');
  const hydratedRef = useRef(false);
  const [intensePolling, setIntensePolling] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe'); // 'stripe' or 'esewa'
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [pendingBillingPeriod, setPendingBillingPeriod] = useState(null);
  const [hasClearedIncomplete, setHasClearedIncomplete] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await apiGet('/api/subscription/status', token);
      const s = typeof data === 'string' ? data : (data?.status ?? 'inactive');
      // Treat 'canceled' status as 'inactive' for display purposes
      setStatus(s === 'canceled' ? 'inactive' : s);
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

  // Automatically clear incomplete subscriptions when page loads (only once per incomplete status)
  useEffect(() => {
    const clearIncompleteIfNeeded = async () => {
      if (status === 'incomplete' && token && !hasClearedIncomplete) {
        setHasClearedIncomplete(true); // Prevent multiple attempts
        try {
          await apiPost('/api/subscription/clear-incomplete', {}, token);
          // Small delay before refreshing to ensure backend has processed
          setTimeout(() => {
            refreshStatus();
          }, 500);
        } catch (e) {
          // Silently fail - user can manually clear if needed
          console.log('Could not auto-clear incomplete subscription:', e);
          // Don't reset flag on error - prevent infinite retry loops
        }
      }
    };

    // Only run when status is incomplete and we haven't cleared it yet
    if (status === 'incomplete' && !hasClearedIncomplete && token) {
      clearIncompleteIfNeeded();
    }
  }, [status, token, refreshStatus, hasClearedIncomplete]);

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
        // Don't show toast for canceled status - it's handled in cancelSubscription function
        // Just refresh to show free plan view
        if (intensePolling) setIntensePolling(false); // Stop polling for canceled status
      } else if (status === 'inactive') {
        // Stop polling when status becomes inactive (e.g., after clearing incomplete)
        if (intensePolling) setIntensePolling(false);
      } else if (status === 'past_due') {
        toast.error('Payment failed');
      }
      prevStatusRef.current = status;
    }
  }, [status, intensePolling]);

  // Only poll when actively waiting for a status change (after checkout)
  // Stop polling once status is stable to reduce unnecessary API calls
  const delay = intensePolling ? 1500 : null; // Only poll during intense polling (after checkout)
  useInterval(() => {
    if (intensePolling) {
      refreshStatus().catch(() => {});
    }
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

  async function startCheckout(billingPeriod, paymentMethod = 'stripe') {
    setLoading(true);
    try {
      if (paymentMethod === 'esewa') {
        // Calculate amounts for eSewa (in NPR)
        // Premium Monthly: $29 ≈ NPR 3900 (approximate conversion rate 1 USD = 134 NPR)
        // Premium Annual: $299 ≈ NPR 40,000 (approximate conversion rate 1 USD = 134 NPR)
        const rateUsdToNpr = 134;
        const monthlyUsd = 29;
        const annualUsd = 299;

        const amount =
          billingPeriod === 'ANNUAL' || billingPeriod === 'annual'
            ? Math.round(annualUsd * rateUsdToNpr)
            : Math.round(monthlyUsd * rateUsdToNpr);

        const taxAmount = Math.round(amount * 0.13); // 13% VAT (approximate for Nepal)

        const request = {
          amount: amount,
          taxAmount: taxAmount,
          productServiceCharge: 0,
          productDeliveryCharge: 0,
          billingPeriod: billingPeriod,
        };

        const resp = await apiPost('/api/esewa/create', request, token);
        const payload = resp?.data ?? resp;

        if (payload?.checkoutUrl && payload?.formData) {
          sessionStorage.setItem('justReturnedFromCheckout', '1');
          const formData = JSON.parse(payload.formData);
          submitEsewaForm(payload.checkoutUrl, formData);
          return;
        }

        toast.error('Failed to create eSewa payment request');
        return;
      }

      // Stripe payment flow
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

      // Parse error message to extract backend error details
      let errorMessage = 'Unable to start checkout';
      let errorData = null;

      try {
        // Try to parse the error message which contains JSON
        const errorMatch = e.message?.match(/\{.*\}/);
        if (errorMatch) {
          errorData = JSON.parse(errorMatch[0]);
          errorMessage = errorData.message || errorMessage;

          // Handle specific error cases
          if (errorData.error === 'subscription_exists') {
            // User already has a subscription - refresh status to show it
            // This could be active, incomplete, or past_due
            toast.warning(errorMessage || 'You already have a subscription in progress or active');
            refreshStatus();
            return; // Exit early, don't show generic error
          }
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        console.error('Failed to parse error response:', parseError);
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function cancelSubscription() {
    setLoading(true);
    try {
      // Use simpler endpoint for incomplete subscriptions
      const endpoint =
        status === 'incomplete' ? '/api/subscription/clear-incomplete' : '/api/subscription/cancel';

      await apiPost(endpoint, {}, token);
      const message =
        status === 'incomplete' ? 'Subscription process canceled' : 'Subscription process canceled';
      toast.success(message);
      setShowCancelModal(false);
      refreshStatus();
    } catch (e) {
      console.error(e);

      // Parse error message to extract backend error details
      let errorMessage =
        status === 'incomplete'
          ? 'Unable to clear incomplete subscription'
          : 'Unable to cancel subscription';

      try {
        const errorMatch = e.message?.match(/\{.*\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          errorMessage = errorData.message || errorMessage;
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }

      toast.error(errorMessage);
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
            <Badge
              variant="default"
              className="px-4 py-2 text-sm bg-green-600 text-white border-green-600"
            >
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
              <CardFooter className="flex-col gap-3 px-6 pb-6">
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    'w-full transition-transform duration-150 ease-in-out',
                    isButtonPressed && 'scale-95'
                  )}
                  onMouseDown={() => setIsButtonPressed(true)}
                  onMouseUp={() => setIsButtonPressed(false)}
                  onMouseLeave={() => setIsButtonPressed(false)}
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
            <div className="space-y-6 rounded-lg border bg-gray-50/50 p-6 dark:bg-gray-900/50 transition-all duration-300 ease-in-out">
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
                  onSelect={() => {
                    setPendingBillingPeriod('ANNUAL');
                    setShowPaymentMethodDialog(true);
                  }}
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
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={cancelSubscription}
                  disabled={loading}
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

        {/* Status Badge - Don't show for canceled status, treat as free plan */}
        {status !== 'canceled' && (
          <div className="flex justify-center">
            <Badge
              variant={
                status === 'past_due'
                  ? 'warning'
                  : status === 'incomplete'
                    ? 'warning'
                    : 'secondary'
              }
              className="px-4 py-2 text-sm"
            >
              <span
                className={cn(
                  'mr-2 h-2 w-2 rounded-full',
                  status === 'past_due'
                    ? 'bg-yellow-500'
                    : status === 'incomplete'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                )}
              ></span>
              {status === 'past_due'
                ? 'Payment Issue'
                : status === 'incomplete'
                  ? 'Incomplete Subscription'
                  : 'Free Plan'}
            </Badge>
          </div>
        )}

        {/* Incomplete Subscription Alert */}
        {status === 'incomplete' && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Incomplete Subscription Detected
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    You have an incomplete subscription from a previous checkout attempt. Please
                    clear it to start a new subscription.
                  </p>
                  <Button
                    variant="default"
                    onClick={cancelSubscription}
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {loading ? 'Clearing...' : 'Clear Incomplete Subscription'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard
            title="Free"
            description="Get started with basic features"
            price="0"
            period="forever"
            features={[
              'Basic mood tracking',
              '1 journal entry per day',
              '20 chat messages per day',
              '1 AI summary per month',
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
            onSelect={() => {
              setPendingBillingPeriod('MONTHLY');
              setShowPaymentMethodDialog(true);
            }}
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
            onSelect={() => {
              setPendingBillingPeriod('ANNUAL');
              setShowPaymentMethodDialog(true);
            }}
          />
        </div>

        {/* Payment Method Dialog */}
        <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Choose Payment Method</DialogTitle>
              <DialogDescription className="text-base pt-2">
                Select your preferred payment method to continue with your subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {/* Stripe Option */}
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('stripe')}
                className={cn(
                  'relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left group',
                  'hover:shadow-md hover:border-green-400',
                  selectedPaymentMethod === 'stripe'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/40 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 p-3 rounded-lg transition-colors',
                    selectedPaymentMethod === 'stripe'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/20'
                  )}
                >
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      Stripe
                    </h3>
                    {selectedPaymentMethod === 'stripe' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Credit/Debit Card</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Pay with Visa, Mastercard, American Express, and more
                  </p>
                </div>
              </button>

              {/* eSewa Option */}
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('esewa')}
                className={cn(
                  'relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left group',
                  'hover:shadow-md hover:border-orange-400',
                  selectedPaymentMethod === 'esewa'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 p-3 rounded-lg transition-colors',
                    selectedPaymentMethod === 'esewa'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20'
                  )}
                >
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      eSewa
                    </h3>
                    {selectedPaymentMethod === 'esewa' && (
                      <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Digital Wallet (Nepal)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Pay securely with your eSewa wallet account
                  </p>
                </div>
              </button>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentMethodDialog(false);
                  setPendingBillingPeriod(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingBillingPeriod) {
                    startCheckout(pendingBillingPeriod, selectedPaymentMethod);
                    setShowPaymentMethodDialog(false);
                    setPendingBillingPeriod(null);
                  }
                }}
                disabled={loading}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processing...' : 'Continue with Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose your payment method. After payment, you'll be redirected back to this page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
