import { useState } from 'react';
import Image from 'next/image';
import { Stream } from '@prisma/client';

interface LiveStreamThumbnailProps {
  stream: Stream;
  onClick?: () => void;
}

export default function LiveStreamThumbnail({ stream, onClick }: LiveStreamThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!stream.channelName || !stream.token || !stream.uid) {
    return (
      <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full text-neutral-400">
          <p>Stream not available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {isHovered ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-white">Stream not available</p>
            <p className="text-sm text-neutral-400">Click to watch</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-white">{stream.title}</p>
            <p className="text-sm text-neutral-400">Click to watch</p>
          </div>
        </div>
      )}
    </div>
  );
} 