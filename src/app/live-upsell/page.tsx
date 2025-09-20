"use client";
import { useRouter } from 'next/navigation';

export default function LiveUpsellPage() {
  const router = useRouter();
  return (
    <div className="container py-16 text-center">
      <h1 className="text-3xl font-bold mb-6">Go Live Streaming</h1>
      <p className="mb-6 text-lg text-neutral-700">
        Live streaming is available for <span className="font-semibold text-primary-600">Plus</span> and <span className="font-semibold text-yellow-600">Gold</span> members only.<br />
        Upgrade your plan to unlock this feature!
      </p>
      <div className="flex flex-col items-center gap-4">
        <button
          className="min-w-[200px] bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600"
          onClick={() => router.push('/account/subscription')}
        >
          Upgrade to Plus or Gold
        </button>
        <button
          className="min-w-[200px] bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300"
          onClick={() => router.push('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
} 