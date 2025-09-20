import React from 'react';
import FAQ from '@/components/FAQ/FAQ';
import ButtonPrimary from '@/shared/Button/ButtonPrimary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center & FAQ',
  description: 'Find answers to frequently asked questions about VinylFunders. Learn how to fund vinyl presales, create projects, and navigate our platform.',
  keywords: ['help', 'FAQ', 'vinyl presale guide', 'platform help', 'artist guide', 'buyer guide'],
  openGraph: {
    title: 'Help Center & FAQ | VinylFunders',
    description: 'Find answers to frequently asked questions about VinylFunders.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center & FAQ | VinylFunders',
    description: 'Find answers to frequently asked questions about VinylFunders.',
  },
};

const HelpCenterPage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          How can we help you?
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl mx-auto">
          Find answers to common questions about VinylFunders, or contact our support team for personalized assistance.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Contact Support
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Need personalized help? Our support team is here for you.
          </p>
          <ButtonPrimary href="/contact">Get in Touch</ButtonPrimary>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Seller Guide
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Learn how to create successful PreSales and sell your vinyl records on VinylFunders.
          </p>
          <ButtonPrimary href="/seller-guide">Read Guide</ButtonPrimary>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Buyer Protection
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Understanding our buyer protection program and policies.
          </p>
          <ButtonPrimary href="/buyer-protection">Learn More</ButtonPrimary>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-8">
          Frequently Asked Questions
        </h2>
        <FAQ />
      </div>

      {/* Still Need Help Section */}
      <div className="text-center bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-8">
        <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
          Still Need Help?
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
          Can&apos;t find what you&apos;re looking for? Our support team is ready to assist you.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <ButtonPrimary href="/contact">Contact Support</ButtonPrimary>
          <ButtonPrimary href="/forum" className="bg-secondary-500 hover:bg-secondary-600 border-none">Discussion Forums</ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage; 