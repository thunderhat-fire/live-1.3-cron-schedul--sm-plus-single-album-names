"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// FAQ Categories and their questions
const FAQ_DATA = {
  general: [
    {
      id: 'faq-1',
      question: 'What is VinylFunders?',
      answer: 'VinylFunders is a marketplace for vinyl records where users can buy, sell, and trade physical music albums, as well as digital downlaods. We provide a platform for music enthusiasts to PreSale and distribute their Albums to their Fans whom have a passion for vinyl.'
    },
    {
      id: 'faq-2',
      question: 'How do I create an account?',
      answer: 'Click the "Login" button in the top right corner. You can create an account using your email address or sign in with your social media accounts. Once registered, you can start by uploading any music you want to release and sent to your fans as a PreSale and subsequently sell digital copies of your music - once the PreSale is over.'
    },
    {
      id: 'faq-3',
      question: 'Is VinylFunders available worldwide?',
      answer: 'Yes! VinylFunders is available worldwide. A surcharge is applied at checkout for postage to Europe and worldwide. Postage to UK is FREE!'
    },
    {
      id: 'faq-live-streaming',
      question: 'How does live streaming work on VinylFunders?',
      answer: 'VinylFunders offers live streaming capabilities for Plus & Gold tier creators. You can go live directly from your profile to connect with your fans, promote your vinyl releases, and build your audience. The "Go Live" button appears in your avatar dropdown menu when you have a Plus subscription. Live streams are displayed on your profile page and can help you engage with fans and promote your presale campaigns.'
    }
  ],
  buying: [
    {
      id: 'faq-4',
      question: 'How do I purchase a vinyl record?',
      answer: 'Browse the marketplace, select the vinyl you want to purchase, and click "Buy Now" or add it to your cart. Follow the checkout process to complete your purchase using our secure payment system.'
    },
    {
      id: 'faq-4b',
      question: 'How long before I get my copies to my fans?',
      answer: 'Typically this will be 8-9 weeks after the PreSale ends. Please be aware that as part of the quality checking process, the Artist that creates the PreSale is sent a test pressing—which needs to be signed off. This may or may not increase the time to fans receiving their copy of the Record.'
    },
    {
      id: 'faq-5',
      question: 'What payment methods are accepted?',
      answer: 'We accept major credit cards payments for your convenience and security. Your Payments are secure and protected by our Payment Providers Terms.'
    },
    {
      id: 'faq-6',
      question: 'What if I receive a damaged record?',
      answer: 'If you receive a damaged record, please contact our support team within 48 hours of delivery. Document the damage with photos, and we will help resolve the issue through our buyer protection program. We cannot guarantee that you will receive a new copy of the vinyl - however you will be refunded.'
    }
  ],
  selling: [
    {
      id: 'faq-7',
      question: 'How do I start selling on VinylFunders?',
      answer: 'To start selling, login and upload your music files and the platform will list your vinyl records. Make sure to provide accurate descriptions and high-quality album artwork of your items.'
    },
    {
      id: 'faq-8',
      question: 'What are the seller fees?',
      answer: 'None - there are no fees for listing your albums on the system. But you do need to pay for membership to the site.'
    },
    {
      id: 'faq-9',
      question: 'How do we ship vinyl Records safely?',
      answer: 'We use appropriate packaging materials, including sturdy boxes and wrap. We use vinyl-specific mailers and including stiffeners to prevent warping during transit.'
    },
    {
      id: 'faq-artist-paid',
      question: 'I am an Artist - how do I get paid?',
      answer: 'As a submitting author on the completion of a presale - if your fans reach the target - you will be paid the associated amount. This will be paid via PayPal or bank transfer.'
    },
    {
      id: 'faq-payment-processing',
      question: 'What happens if some of the orders for the PreSale can\'t be processed?',
      answer: 'If for example you have a successful captured 100 record PreSale and on charging the customers payment method - 5 payments are declined - we will deduct this number of records cost from your remuneration. This will apply up to a maximum of 10% of the threshold number. You will receive the associated number of Vinyl Records not charged to your fans, via the postal delivery. We reserve the right to cancel any presale that incurs non captured payments over the 10% threshold limit.'
    },
  ],
  technical: [
    {
      id: 'faq-10',
      question: 'What file formats are accepted for album artwork?',
      answer: 'We accept JPG and PNG formats for album artwork. Images should be at least 1500x1500 pixels and no larger than 5MB.'
    },
    {
      id: 'faq-10b',
      question: 'What file formats for audio?',
      answer: 'The best results come from high quality audio formats. We accept FLAC and WAV. Though we can also accept your upload audio of MP3, your fans will receive a higher fidelity vinyl if you use FLAC or WAV.\n\nPlease be aware that we will master for Vinyl your files - this is a separate process to mastering for Digital Submission - YOU ARE RESPONSIBLE for digital mastering and subsequent submission to the system. You can use our [AI digital mastering](/mastering-upload) service.'
    },
    {
      id: 'faq-10c',
      question: 'How are my digital sales served to my fans and buyers?',
      answer: 'The files you upload as your album audio are the ones that are served as a Digital Download option - once the PreSale ends. Since YOU MUST PROVIDE Mastered for digital files  - then this is what will be served to your fans when they purchase a copy of the Digital Album.'
    },
    {
      id: 'faq-11',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your inbox to reset your password.'
    }
  ]
};

// Function to parse markdown-style links in FAQ answers
const parseAnswer = (answer: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(answer)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(answer.slice(lastIndex, match.index));
    }
    
    // Add the link
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <Link 
        key={match.index} 
        href={linkUrl} 
        className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300"
      >
        {linkText}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < answer.length) {
    parts.push(answer.slice(lastIndex));
  }
  
  // If no links were found, return the original text
  if (parts.length === 0) {
    return answer;
  }
  
  // Split by newlines and create paragraphs
  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }
    return part;
  });
};

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);

  // Filter questions based on search query and category
  useEffect(() => {
    let questions = [];
    if (selectedCategory === 'all') {
      questions = Object.values(FAQ_DATA).flat();
    } else {
      questions = FAQ_DATA[selectedCategory as keyof typeof FAQ_DATA] || [];
    }

    if (searchQuery) {
      questions = questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredQuestions(questions);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="relative mb-8">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search FAQ..."
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['all', ...Object.keys(FAQ_DATA)].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredQuestions.map((faq) => (
          <Disclosure as="div" key={faq.id} className="rounded-lg bg-white dark:bg-neutral-900 shadow-sm">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg px-4 py-4 text-left text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring focus-visible:ring-primary-500 focus-visible:ring-opacity-75">
                  <span className="text-neutral-900 dark:text-neutral-100">{faq.question}</span>
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
                  <Disclosure.Panel className="px-4 pb-4 pt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {parseAnswer(faq.answer)}
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        ))}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            No questions found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ; 