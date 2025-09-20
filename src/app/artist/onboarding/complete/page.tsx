'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import Link from 'next/link';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.user?.id) {
        return; // Wait for session
      }

      try {
        // Check the user's current onboarding status
        const response = await fetch('/api/artist/connect-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check onboarding status');
        }

        if (data.onboardingComplete && data.chargesEnabled) {
          setStatus('success');
        } else {
          setError('Onboarding not yet complete. You may need to finish the process.');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Error checking onboarding status:', err);
        setError(err.message || 'Failed to check onboarding status');
        setStatus('error');
      }
    };

    checkOnboardingStatus();
  }, [session]);

  // No longer needed with direct Link
  const handleContinue = () => {};

  const handleRetry = () => {
    router.push('/'); // Go back to dashboard where they can retry
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Checking your payment setup...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your onboarding status.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Not Complete
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Your payment setup is not yet complete. You may need to finish the verification process.'}
          </p>
          <div className="space-x-4">
            <ButtonPrimary onClick={handleRetry}>
              Return to Dashboard
            </ButtonPrimary>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Payment Setup Complete!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Congratulations! Your payment setup is now complete. You can now create vinyl presales and receive payments from your fans.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h2>
          <ul className="text-left space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              You can now create vinyl presales
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Payments will be processed automatically
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Funds will be transferred to your bank account – on successful presale completion
            </li>
          </ul>
        </div>

        <Link href="/upload-item">
          <ButtonPrimary className="text-lg px-8 py-3">
            Create Your First Presale
          </ButtonPrimary>
        </Link>
      </div>
    </div>
  );
} 