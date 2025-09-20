"use client";

import React from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const SELLER_GUIDE_DATA = [
  {
    id: 'guide-1',
    question: 'Getting Started as a Seller',
    answer: 'To begin selling on VinylFunders, follow these steps:\n\n1. Create and verify your account\n2. Complete your seller profile with accurate information\n3. Set up your payment details for receiving funds\n4. Upload your first album for PreSale'
  },
  {
    id: 'guide-2',
    question: 'PreSale Campaign Setup',
    answer: 'Creating a successful PreSale campaign:\n\n1. Set realistic minimum order quantities\n2. Provide high-quality album artwork (JPG/PNG, 1500x1500px minimum)\n3. Write compelling album descriptions'
  },
  {
    id: 'guide-3',
    question: 'Pricing and Fees',
    answer: 'VinylFunders operates on a transparent fee structure:\n\n• No commission on PreSale listings\n• The per-record sale price decreases as you choose higher presale quantities (e.g., 100, 200, or 500 records).\n• Subscriptions can be joined at a one off fee - for additional benefits.'
  },
  {
    id: 'guide-4',
    question: 'Managing Orders and Shipping',
    answer: 'Our Fulfillment best practices:\n\nOrder fulfillment best practices:\n\n1. Monitor your PreSale campaign progress\n2. Once minimum quantity is met, begin production\n3. Use proper vinyl packaging materials\n4. Include tracking information for all shipments\n5. Maintain clear communication with buyers about timelines'
  },
  {
    id: 'guide-5',
    question: 'Quality Standards',
    answer: 'Maintain high quality standards:\n\n1. Use professional mastering for vinyl production\n2. Ensure artwork meets platform requirements (1500x1500px minimum)\n3. Test press approval before full production\n4. Quality check all records before shipping\n5. Use appropriate protective packaging'
  },
  {
    id: 'guide-6',
    question: 'Communication Guidelines',
    answer: 'Best practices for buyer communication:\n\n1. Respond to inquiries within 24 hours\n2. Provide regular updates on PreSale progress\n3. Be transparent about any delays or issues\n4. Use the platform\'s messaging system for all communications\n5. Maintain professional and courteous interaction'
  },
  {
    id: 'guide-7',
    question: 'Handling Issues and Returns',
    answer: 'Problem resolution process:\n\n1. Address buyer concerns promptly\n2. Document any reported damages with photos\n3. Process valid returns within 48 hours\n4. Follow platform guidelines for dispute resolution\n5. Maintain detailed records of all transactions'
  }
];

const SellerGuide = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-neutral-900 dark:text-neutral-100">
        Seller Guide
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-center">
        Everything you need to know about selling vinyl records on VinylFunders
      </p>

      <div className="space-y-4">
        {SELLER_GUIDE_DATA.map((guide) => (
          <Disclosure as="div" key={guide.id} className="rounded-lg bg-white dark:bg-neutral-900 shadow-sm">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg px-4 py-4 text-left text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring focus-visible:ring-primary-500 focus-visible:ring-opacity-75">
                  <span className="text-neutral-900 dark:text-neutral-100">{guide.question}</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'rotate-180 transform' : ''
                    } h-5 w-5 text-neutral-500`}
                  />
                </Disclosure.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel className="px-4 pb-4 pt-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                    {guide.answer}
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
};

export default SellerGuide; 