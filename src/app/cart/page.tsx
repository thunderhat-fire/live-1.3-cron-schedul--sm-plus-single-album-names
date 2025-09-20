"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import ButtonSecondary from '@/shared/Button/ButtonSecondary';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const CheckoutForm = () => {
  const { items, getTotal, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [shippingZone, setShippingZone] = useState('');

  // Check if user is logged in - required for all purchases
  const isLoggedIn = !!session?.user?.email;
  const isLoadingAuth = status === 'loading';

  const handleStripeCheckout = async () => {
    // Require login for all purchases
    if (!isLoggedIn) {
      setError('Please log in to complete your purchase');
      return;
    }

    if (!shippingZone) {
      setError('Please select your shipping region');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            format: item.format,
            imageUrl: item.imageUrl,
            maxQuantity: item.maxQuantity,
          })),
          customerEmail: session?.user?.email,
          customerName: session?.user?.name,
          shippingZone,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Stripe Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Checkout</h3>
        
        <div className="mb-6">
          {!isLoggedIn ? (
            // Login prompt for non-authenticated users
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Login Required</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                You need to be logged in to complete your purchase and access your account benefits.
              </p>
              <div className="flex gap-3">
                <Link href="/login" className="flex-1">
                  <ButtonPrimary className="w-full text-sm py-2">
                    Sign In
                  </ButtonPrimary>
                </Link>
                <Link href="/signup" className="flex-1">
                  <ButtonSecondary className="w-full text-sm py-2">
                    Create Account
                  </ButtonSecondary>
                </Link>
              </div>
            </div>
          ) : (
            // User info display for authenticated users
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-green-800 dark:text-green-200">Logged in as:</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {session?.user?.name} ({session?.user?.email})
              </p>
            </div>
          )}
        </div>

        {/* Shipping Zone Selection */}
        <div className="mb-6">
          <label htmlFor="shippingZone" className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Region *
          </label>
          <select
            id="shippingZone"
            value={shippingZone}
            onChange={(e) => setShippingZone(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select region</option>
            <option value="uk">United Kingdom</option>
            <option value="eu">Europe (EU)</option>
            <option value="na">USA / Canada</option>
            <option value="row">Rest of World</option>
          </select>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-blue-800">Secure Stripe Checkout</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              You'll be redirected to Stripe's secure checkout page where you can:
            </p>
            <ul className="text-sm text-blue-700 mb-3 space-y-1">
              <li>• Enter your payment details securely</li>
              <li>• Add shipping and billing addresses</li>
              <li>• Use Apple Pay, Google Pay, or any major card</li>
              <li>• Complete your purchase with confidence</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Apple Pay
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Google Pay
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                All Major Cards
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Bank Transfers
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStripeCheckout}
            disabled={loading || !isLoggedIn || !shippingZone || isLoadingAuth}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
          >
            {isLoadingAuth ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking Login Status...
              </>
            ) : loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Checkout Session...
              </>
            ) : !isLoggedIn ? (
              <>
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Login Required to Checkout</span>
              </>
            ) : (
              <>
                <span>Continue to Secure Checkout - £{getTotal().toFixed(2)}</span>
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Powered by Stripe • Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getTotal } = useCart();
  const router = useRouter();

  const handleQuantityChange = async (itemId: string, format: 'vinyl' | 'digital', newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId, format);
    } else {
      await updateQuantity(itemId, format, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-3xl font-semibold">Your cart is empty</h2>
        <p className="mt-4 text-neutral-500">
          Browse our collection to find your next favorite record.
        </p>
        <ButtonPrimary
          className="mt-8"
          onClick={() => router.push('/collection')}
        >
          Browse Collection
        </ButtonPrimary>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-semibold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {items.map((item) => (
            <div 
              key={`${item.id}-${item.format}`}
              className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg mb-4"
            >
              <div className="relative w-20 h-20">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-neutral-500">£{item.price}</p>
                <p className="text-sm text-neutral-500 capitalize">{item.format}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.format, item.quantity - 1)}
                  className="p-2 text-neutral-500 hover:text-neutral-700"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.format, item.quantity + 1)}
                  className="p-2 text-neutral-500 hover:text-neutral-700"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="font-semibold">£{(item.price * item.quantity).toFixed(2)}</p>
              </div>

              <button
                onClick={() => removeFromCart(item.id, item.format)}
                className="p-2 text-neutral-500 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>£{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mb-4">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>£{getTotal().toFixed(2)}</span>
              </div>
            </div>

            <CheckoutForm />

            <ButtonSecondary
              className="w-full mt-4"
              onClick={() => router.push('/collection')}
            >
              Continue Shopping
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 