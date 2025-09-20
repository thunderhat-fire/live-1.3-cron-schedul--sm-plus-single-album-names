'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Redirect to the author page
    router.push('/author');
  }, [session, status, router]);

  return (
    <div className="container py-10">
      <div className="text-center">Loading...</div>
    </div>
  );
} 