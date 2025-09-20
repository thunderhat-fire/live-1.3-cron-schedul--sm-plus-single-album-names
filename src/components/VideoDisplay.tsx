import React, { useEffect, useRef } from 'react';

interface VideoDisplayProps {
  mediaStream: MediaStream | null;
  isStreaming: boolean;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({ mediaStream, isStreaming }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {isStreaming ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
          <div className="text-center">
            <p className="text-lg font-medium">No active stream</p>
            <p className="text-sm text-gray-400">Start streaming to see your video</p>
          </div>
        </div>
      )}
    </div>
  );
}; 