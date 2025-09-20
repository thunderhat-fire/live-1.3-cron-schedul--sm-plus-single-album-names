'use client';

import React, { useEffect, useRef } from 'react';
import { useStream } from '@/contexts/StreamContext';
import { useStreamPlaceholder } from '@/hooks/useStreamPlaceholder';

const LiveStreamViewer: React.FC = () => {
  const { stats, updateStats, streamUrl } = useStream();
  const { placeholderVideo } = useStreamPlaceholder();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (
      streamUrl &&
      videoRef.current &&
      typeof streamUrl === 'object' &&
      'getTracks' in streamUrl
    ) {
      videoRef.current.srcObject = streamUrl as MediaStream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [streamUrl]);

  const handleShare = async () => {
    updateStats('share');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this live stream!',
          text: 'I\'m watching an amazing live stream. Join me!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing stream:', error);
      }
    }
  };

  const handleLike = () => {
    updateStats('like');
  };

  return (
    <div className="w-full" style={{ minHeight: 360, background: 'red' }}>
      <div
        className="w-full max-w-xs bg-neutral-800 rounded-xl flex items-center justify-center mx-auto border-2 border-blue-500"
        style={{ minHeight: 135, aspectRatio: '16/9' }}
      >
        {streamUrl ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            muted={false}
            className="w-full h-full object-cover"
            style={{ minHeight: 360, aspectRatio: '16/9' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-600 rounded-lg">
            <div className="text-center text-white">
              <h3 className="text-xl font-semibold mb-2">Stream Starting Soon</h3>
              <p className="text-sm opacity-75">The Artist may choose to stream shortly</p>
            </div>
          </div>
        )}
      </div>
      {/* Stream Stats */}
      <div className="mt-4">
        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
          <div className="flex space-x-6">
            <div>
              <span className="block text-sm text-neutral-500">Views</span>
              <span className="text-lg font-semibold">{stats.viewCount}</span>
            </div>
            <div>
              <span className="block text-sm text-neutral-500">Likes</span>
              <span className="text-lg font-semibold">{stats.likeCount}</span>
            </div>
            <div>
              <span className="block text-sm text-neutral-500">Shares</span>
              <span className="text-lg font-semibold">{stats.shareCount}</span>
            </div>
            <div>
              <span className="block text-sm text-neutral-500">Chat Messages</span>
              <span className="text-lg font-semibold">{stats.chatCount}</span>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleLike}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamViewer; 