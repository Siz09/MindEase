'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { decodeEsewaCallback, getQueryParams } from '../utils/esewa';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function EsewaSuccess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    // Get callback data from URL parameters
    const params = getQueryParams(window.location.search);

    // Check if data is Base64 encoded
    if (params.data) {
      const decoded = decodeEsewaCallback(params.data);
      if (decoded) {
        setPaymentData(decoded);
      }
    } else {
      // Use direct parameters
      setPaymentData(params);
    }

    // Show success message
    if (params.status === 'COMPLETE' || params.transaction_code) {
      toast.success('Payment successful! Your subscription is now active.');

      // Redirect to subscription page after a delay
      const timer = setTimeout(() => {
        navigate('/subscription');
      }, 3000);

      return () => clearTimeout(timer);
    }

    setLoading(false);
  }, [navigate]);

  if (loading && !paymentData) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Processing payment...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentData?.status === 'COMPLETE' || paymentData?.transaction_code;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className={isSuccess ? 'border-green-500' : 'border-yellow-500'}>
        <CardHeader>
          <CardTitle className={isSuccess ? 'text-green-600' : 'text-yellow-600'}>
            {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData?.transaction_code && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Code</p>
              <p className="text-lg font-mono font-semibold">{paymentData.transaction_code}</p>
            </div>
          )}

          {paymentData?.transaction_uuid && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Transaction UUID</p>
              <p className="text-lg font-mono">{paymentData.transaction_uuid}</p>
            </div>
          )}

          {paymentData?.total_amount && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
              <p className="text-lg font-semibold">NPR {paymentData.total_amount}</p>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4">
              <p className="text-green-600 dark:text-green-400">
                Your subscription has been activated successfully. You now have access to all
                premium features.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/subscription')} className="flex-1">
                  View Subscription
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-yellow-600 dark:text-yellow-400">
                Your payment is being processed. This may take a few moments. Please check your
                subscription status shortly.
              </p>
              <Button onClick={() => navigate('/subscription')} className="w-full">
                Check Subscription Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
