import React from 'react';
import Image from 'next/image';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <Image
            src="/images/logo.png"
            alt="VinylFunders Logo"
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-white">
          We&apos;ll be back soon!
        </h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
          <p className="text-xl mb-6 text-neutral-600 dark:text-neutral-300">
            We&apos;re currently updating VinylFunders to bring you an even better experience.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-neutral-600 dark:text-neutral-300">
                Maintenance in progress
              </span>
            </div>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Expected completion: Soon
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            For urgent inquiries, please contact us at{' '}
            <a 
              href="mailto:support@vinylfunders.com" 
              className="text-primary-500 hover:text-primary-600"
            >
              support@vinylfunders.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage; 