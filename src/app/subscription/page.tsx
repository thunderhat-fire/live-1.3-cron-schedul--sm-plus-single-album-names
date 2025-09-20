"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import React, { FC, useEffect } from "react";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import RequireKyc from '@/components/RequireKyc';
import { useSearchParams } from 'next/navigation';

export interface PricingItem {
  isPopular: boolean;
  name: string;
  pricing: string;
  desc: string;
  per: string;
  features: string[];
}

const pricings: PricingItem[] = [
  {
    isPopular: false,
    name: "Starter",
    pricing: "£30",
    per: "per upload",
    features: ["Pay-as-you-go uploads", "Basic analytics", "Full Customer Support"],
    desc: `Get started with our starter tier. Pay £30 for each presale upload or upgrade to Plus/Gold for unlimited uploads.`,
  },
  {
    isPopular: true,
    name: "Plus",
    pricing: "£145",
    per: "one-off",
    features: [
      "Everything in Starter",
      "Premium display placement",
      "£20 promotional credit on Instagram or TikTok",
      "8x professionally AI mastered tracks",
      "Livestream to your fans (Go Live Expo)"
    ],
    desc: `Enhanced features to grow your vinyl business and understand your audience.`,
  },
  {
    isPopular: false,
    name: "Gold",
    pricing: "£199",
    per: "one-off",
    features: [
      "Everything in Plus",
      "Full Analytics (views, player counts, Buyer locations + more)",
      "1-1 Promotional Strategy meeting",
      "Longer preSale timelines - four weeks",
      "Priority customer support",
      "Exclusive promotional opportunities"
    ],
    desc: `Premium tier with extended presale periods and enhanced support for serious artists.`,
  },
];

const PageSubcription = ({}) => {
  const { data: session } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle success/cancel messages from Stripe Checkout
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');
    const tier = searchParams?.get('tier');

    if (success === 'true' && tier) {
      if (tier === 'starter') {
        setMessage({
          type: 'success',
          text: `Payment successful! You have purchased a pay-as-you-go credit. You can now create one presale upload.`
        });
      } else {
        setMessage({
          type: 'success',
          text: `Payment successful! You have been upgraded to the ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier.`
        });
      }
    } else if (canceled === 'true') {
      setMessage({
        type: 'error',
        text: 'Payment was canceled. You can try again anytime.'
      });
    }
  }, [searchParams]);

  const handleUpgrade = async (tier: string) => {
    if (!session?.user) {
      window.location.href = `/login?redirect=/subscription?upgrade=${tier}`;
      return;
    }
    setLoadingTier(tier);
    setMessage(null);
    try {
      const res = await fetch('/api/upgrade-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to start upgrade payment.'
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to start upgrade payment.'
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const renderPricingItem = (pricing: PricingItem, index: number) => {
    return (
      <div
        key={index}
        className={`h-full relative px-6 py-8 rounded-3xl border-2 flex flex-col overflow-hidden ${
          pricing.isPopular
            ? "border-primary-500"
            : "border-neutral-100 dark:border-neutral-700"
        }`}
      >
        {pricing.isPopular && (
          <span className="bg-primary-500 text-white px-3 py-1 tracking-widest text-xs absolute right-3 top-3 rounded-full z-10">
            POPULAR
          </span>
        )}
        <div className="mb-8">
          <h3 className="block text-sm uppercase tracking-widest text-neutral-6000 dark:text-neutral-300 mb-2 font-medium">
            {pricing.name === "Gold" ? (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#FFD700" />
                  <path d="M8.5 12.5L11 15L15.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {pricing.name}
              </span>
            ) : (
              pricing.name
            )}
          </h3>
          <h2 className="text-5xl leading-none flex items-center text-slate-800 dark:text-slate-200">
            <span>{pricing.pricing}</span>
            <span className="text-lg ml-1 font-normal text-neutral-500">
              {pricing.per}
            </span>
          </h2>
        </div>
        <nav className="space-y-4 mb-8">
          {pricing.features.map((item, index) => (
            <li className="flex items-center" key={index}>
              <span className="mr-4 inline-flex flex-shrink-0 text-primary-6000">
                <CheckIcon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {item}
              </span>
            </li>
          ))}
        </nav>
        <div className="flex flex-col mt-auto">
          <button
            className="bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleUpgrade(pricing.name.toLowerCase())}
            disabled={!!loadingTier}
          >
            {loadingTier === pricing.name.toLowerCase() ? 'Redirecting...' : 'Submit'}
          </button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
            {pricing.desc}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`nc-PageSubcription container pb-24 lg:pb-32 `}>
      <header className="text-center max-w-2xl mx-auto my-20">
        <h2 className="flex items-center text-3xl leading-[115%] md:text-5xl md:leading-[115%] font-semibold text-neutral-900 dark:text-neutral-100 justify-center">
          <span className="mr-4 text-3xl md:text-4xl leading-none">💎</span>
          Subscription
        </h2>
        <span className="block text-sm mt-2 text-neutral-700 sm:text-base dark:text-neutral-200">
          Pricing to fit the needs of any Artist and Fanbase
        </span>
      </header>

      {/* Success/Error Messages */}
      {message && (
        <div className={`max-w-2xl mx-auto mb-8 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <section className="text-neutral-600 text-sm md:text-base overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-5 xl:gap-8">
          {pricings.map(renderPricingItem)}
        </div>
      </section>
    </div>
  );
};

export default function PageSubscriptionWrapper() {
  return (
    <RequireKyc>
      <PageSubcription />
    </RequireKyc>
  );
}
