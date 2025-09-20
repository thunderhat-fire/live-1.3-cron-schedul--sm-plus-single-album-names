'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface AuthorLiveStreamProps {
  authorId: string;
  isAuthorPage?: boolean;
  hlsUrl: string;
}

const AuthorLiveStream: React.FC<AuthorLiveStreamProps> = ({
  authorId,
  isAuthorPage = false,
  hlsUrl,
}) => {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(true);

  // If not expanded, show minimized tab
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>Live Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px]">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
        {/* Stream Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Live Now</h2>
              <div className="flex items-center mt-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Live
                </span>
              </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stream Content */}
        <div className="p-4">
          {/* Video Player */}
          <div className="aspect-video w-full">
            <video
              controls
              autoPlay
              muted
              className="w-full h-full rounded-lg"
              src={hlsUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorLiveStream; 