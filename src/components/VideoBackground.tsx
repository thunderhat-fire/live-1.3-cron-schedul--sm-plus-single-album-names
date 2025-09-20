'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  videoUrl: string;
  className?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoUrl,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      console.log('Video can play:', videoUrl);
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      const errorMessage = `Video failed to load: ${videoUrl}`;
      setError(errorMessage);
      console.error(errorMessage, e);
    };

    const handlePlay = () => {
      console.log('Video started playing:', videoUrl);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
    };
  }, [videoUrl]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 z-10">
          <div className="text-gray-600 dark:text-gray-300">Loading video...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900/20 z-10">
          <div className="text-red-600 dark:text-red-400 text-center p-4">
            <div className="font-semibold">Video Error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute inset-0 bg-black/30 z-2" /> {/* Overlay for better text visibility */}
    </div>
  );
};

export default VideoBackground; 