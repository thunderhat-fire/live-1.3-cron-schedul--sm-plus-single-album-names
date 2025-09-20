"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const CheckoutSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const hasShownSuccessToast = useRef(false);
  const hasInitiatedRefresh = useRef(false);

  useEffect(() => {
    // Check if this was a subscription upgrade
    const sessionId = searchParams?.get('session_id');
    
    if (sessionId && session?.user && !hasInitiatedRefresh.current) {
      hasInitiatedRefresh.current = true;
      
      // Check if this was a subscription upgrade by calling Stripe to get session details
      const checkAndRefreshSession = async () => {
        try {
          setIsRefreshingSession(true);
          
          // Give the webhook a moment to process the payment
          console.log('🔄 Waiting for webhook to process payment...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log('🔄 Refreshing session after successful payment...');
          console.log('Current subscription tier:', (session.user as any).subscriptionTier);
          console.log('Current AI mastering credits:', (session.user as any).aiMasteringCredits);
          
          // Single session refresh should be sufficient since webhook updates the database
          await update();
          
          // Wait a moment for the session to update
          setTimeout(() => {
            setIsRefreshingSession(false);
            
            // Show success message only once
            if (!hasShownSuccessToast.current) {
              hasShownSuccessToast.current = true;
              toast.success('Your subscription has been updated! 🎉');
            }
            
            console.log('✅ Session refresh complete');
            console.log('Updated subscription tier:', (session.user as any).subscriptionTier);
            console.log('Updated AI mastering credits:', (session.user as any).aiMasteringCredits);
          }, 500);
          
        } catch (error) {
          console.error('Error refreshing session:', error);
          setIsRefreshingSession(false);
          // Don't show error to user, just log it
        }
      };
      
      checkAndRefreshSession();
    }
  }, [session?.user?.id, update, searchParams]); // Only depend on user ID, not full session

  return (
    <div className="container py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-semibold mb-4">Payment Successful!</h1>
          {isRefreshingSession ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-800 text-sm">Updating your account...</p>
              </div>
            </div>
          ) : (
            <p className="text-neutral-600 mb-6">
              Thank you for your purchase. Your order has been processed successfully.
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">What happens next?</h2>
          <div className="text-left space-y-3 text-sm">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>You'll receive an email confirmation with your order details</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>
                For digital downloads, you'll get access to your files immediately.{' '}
                <a href="/account/subscription" className="text-primary-600 underline hover:text-primary-800">View your downloads</a>
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>For vinyl presales, we'll notify you when the threshold is reached. If not reached — only then will you be refunded. This could be up to 7 days after the presale has ended.</p>
            </div>
            {session && (session.user as any).subscriptionTier === 'gold' && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-gold-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gold-700 font-medium">🌟 Gold tier benefits are now active! Check your analytics and mastering credits.</p>
              </div>
            )}
            {session && (session.user as any).subscriptionTier === 'plus' && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-purple-700 font-medium">✨ Plus tier benefits are now active! Check your mastering credits and promotional credits.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <ButtonPrimary
            className="w-full"
            onClick={() => router.push('/account/subscription')}
            disabled={isRefreshingSession}
          >
            {isRefreshingSession ? 'Updating Account...' : 'View My Orders & Benefits'}
          </ButtonPrimary>
          
          <ButtonPrimary
            className="w-full"
            onClick={() => router.push('/collection')}
            disabled={isRefreshingSession}
          >
            Continue Shopping
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage; 