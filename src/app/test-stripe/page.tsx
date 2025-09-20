"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const TestCheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test payment intent creation
      const response = await fetch('/api/test-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000, // £10.00
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Test Payment</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Payment successful!
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Pay £10.00'}
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Test Card Numbers:</h4>
        <ul className="text-sm space-y-1">
          <li><strong>Success:</strong> 4242 4242 4242 4242</li>
          <li><strong>Decline:</strong> 4000 0000 0000 0002</li>
          <li><strong>3D Secure:</strong> 4000 0025 0000 3155</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          Use any future expiry date and any 3-digit CVC.
        </p>
      </div>
    </form>
  );
};

const TestStripePage = () => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      console.log('Test page - Stripe publishable key:', publishableKey ? 'Set' : 'Missing');
      
      if (!publishableKey) {
        setError('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
        setLoading(false);
        return;
      }
      
      if (!publishableKey.startsWith('pk_')) {
        setError('Invalid Stripe publishable key format. Should start with pk_');
        setLoading(false);
        return;
      }
      
      try {
        const stripe = await loadStripe(publishableKey);
        setStripePromise(stripe);
      } catch (err) {
        setError('Failed to load Stripe');
        console.error('Stripe loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading Stripe...</h2>
        <p className="text-neutral-500">Initializing payment system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">Stripe Error</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <p className="text-sm text-neutral-500">
          Please check your environment variables and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-semibold mb-8 text-center">Stripe Integration Test</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
          <p className="font-semibold">Test Environment</p>
          <p className="text-sm">This page tests the Stripe integration with a simple £10 payment.</p>
        </div>

        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <TestCheckoutForm />
          </Elements>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Stripe Not Initialized</p>
            <p className="text-sm">Failed to load Stripe. Please check the console for errors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestStripePage; 