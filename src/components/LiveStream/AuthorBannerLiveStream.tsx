import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LiveKitProfileViewer from './LiveKitProfileViewer';

interface AuthorBannerLiveStreamProps {
  authorId: string;
  className?: string;
}

const AuthorBannerLiveStream: React.FC<AuthorBannerLiveStreamProps> = ({
  authorId,
  className = '',
}) => {
  const { data: session } = useSession();
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    async function pollLiveStatus() {
      try {
        const res = await fetch(`/api/live-status/${authorId}`);
        const data = await res.json();
        setIsLive(data.isLive);
        setIsLoading(false);
      } catch (e) {
        setIsLive(false);
        setIsLoading(false);
      }
    }
    pollLiveStatus();
    pollInterval = setInterval(pollLiveStatus, 7000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [authorId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Checking live status...</p>
        </div>
      </div>
    );
  }

  if (isLive) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <LiveKitProfileViewer roomName={authorId} />
      </div>
    );
  }

  return null;
};

export default AuthorBannerLiveStream; 