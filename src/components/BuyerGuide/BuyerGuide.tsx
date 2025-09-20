"use client";

import React from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const BUYER_GUIDE_DATA = [
  {
    id: 'guide-1',
    question: 'Understanding PreSales',
    answer: 'PreSales on VinylFunders work as follows:\n\n1. Artists list their vinyl records for PreSale with a minimum order quantity\n2. You can reserve your copy by making a payment\n3. Once the minimum order quantity is met, production begins\n4. Track the PreSale progress in real-time on the product page'
  },
  {
    id: 'guide-2',
    question: 'Buyer Protection Program',
    answer: 'Our Buyer Protection Program includes:\n\n1. Secure payment processing\n2. Quality guarantee for all vinyl records\n3. 48-hour window to report damages upon delivery\n4. Dispute resolution support\n5. Tracking information for all shipments'
  },
  {
    id: 'guide-3',
    question: 'Payment Security',
    answer: 'Your payments are secure with VinylFunders:\n\n1. All transactions are processed through secure payment providers\n2. We accept major credit cards only\n3. Your payment information is never stored on our servers\n4. All transactions are encrypted end-to-end\n5. Immediate notification of transaction status'
  },
  {
    id: 'guide-4',
    question: 'Shipping and Delivery',
    answer: 'Our shipping process ensures your vinyl arrives safely:\n\n1. All records are shipped in professional vinyl mailers\n2. Protective packaging includes stiffeners to prevent warping\n3. Tracking information provided for all orders\n4. Estimated delivery times provided at checkout'
  },
  {
    id: 'guide-5',
    question: 'Quality Assurance',
    answer: 'We maintain high quality standards:\n\n1. All vinyl records undergo quality checks before shipping\n2. Test pressings are approved before full production\n3. Professional mastering is required for all releases\n4. Visual inspection of artwork and packaging\n5. Condition verification before dispatch'
  },
  {
    id: 'guide-6',
    question: 'Reporting Issues',
    answer: 'If you encounter any issues:\n\n1. Report damages within 48 hours of delivery\n2. Take clear photos of any damage\n3. Keep all original packaging for potential returns\n4. Our support team will guide you through the resolution process'
  },
  {
    id: 'guide-7',
    question: 'Refund Policy',
    answer: 'Understanding our refund process:\n\n1. Full refund for damaged items (reported within 48 hours)\n2. Refunds processed within 5-10 business days - of end of presale\n3. Original payment method will be refunded\n4. Shipping costs may be refunded depending on circumstances'
  }
];

const BuyerGuide = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-neutral-900 dark:text-neutral-100">
        Buyer Protection Guide
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-center">
        Everything you need to know about buying vinyl records safely on VinylFunders
      </p>

      <div className="space-y-4">
        {BUYER_GUIDE_DATA.map((guide) => (
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

export default BuyerGuide; 