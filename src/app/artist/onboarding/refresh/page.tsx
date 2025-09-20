'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function OnboardingRefreshPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    const restartOnboarding = async () => {
      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      try {
        // Create a new onboarding link
        const response = await fetch('/api/artist/connect-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessType: 'individual',
            country: 'GB',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to restart onboarding');
        }

        if (data.onboardingComplete) {
          // Already complete, redirect to success page
          router.push('/artist/onboarding/complete');
          return;
        }

        // Redirect to new onboarding URL
        if (data.onboardingUrl) {
          window.location.href = data.onboardingUrl;
        } else {
          throw new Error('No onboarding URL received');
        }
      } catch (error) {
        console.error('Error restarting onboarding:', error);
        // Redirect back to main page with error
        router.push('/?onboarding_error=true');
      }
    };

    // Small delay to ensure session is loaded
    const timer = setTimeout(restartOnboarding, 500);
    return () => clearTimeout(timer);
  }, [session, router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Restarting Payment Setup...
        </h1>
        <p className="text-gray-600">
          Please wait while we prepare your payment setup process.
        </p>
      </div>
    </div>
  );
} 