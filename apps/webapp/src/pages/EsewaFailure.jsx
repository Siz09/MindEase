'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { decodeEsewaCallback, getQueryParams } from '../utils/esewa';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function EsewaFailure() {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const params = getQueryParams(window.location.search);

    // Check if data is Base64 encoded
    if (params.data) {
      const decoded = decodeEsewaCallback(params.data);
      if (decoded) {
        setPaymentData(decoded);
      }
    } else {
      setPaymentData(params);
    }

    toast.error('Payment failed or was canceled. Please try again.');
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData?.transaction_uuid && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Transaction UUID</p>
              <p className="text-lg font-mono">{paymentData.transaction_uuid}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Unfortunately, your payment could not be processed. This could be due to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Insufficient balance in your eSewa account</li>
              <li>Payment was canceled</li>
              <li>Network or technical issues</li>
              <li>Invalid payment details</li>
            </ul>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => navigate('/subscription')} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
