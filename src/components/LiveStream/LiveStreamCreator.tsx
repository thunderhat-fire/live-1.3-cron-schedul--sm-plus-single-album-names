'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isPlusMember } from '@/utils/membership';
import { useStream } from '@/contexts/StreamContext';

interface LiveStreamCreatorProps {
  maxDuration?: number; // in seconds, default 600 (10 minutes)
  onStreamEnd?: (recordingUrl: string) => void;
}

const LiveStreamCreator: React.FC<LiveStreamCreatorProps> = ({
  maxDuration = 600,
  onStreamEnd
}) => {
  const { data: session } = useSession();
  const { stats, updateStats, setActiveStream } = useStream();
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamId = useRef<string>(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStreaming) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            stopStream();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStreaming]);

  const isPlus = isPlusMember(session?.user?.id || '');

  const startStream = async () => {
    try {
      // Start media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Set the stream URL in context so viewers can access it
        setActiveStream(streamId.current, videoRef.current.srcObject as unknown as string);
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setActiveStream(null, null);
        if (onStreamEnd) onStreamEnd(url);
      };

      mediaRecorder.start();
      setIsStreaming(true);
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const stopStream = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    setTimeRemaining(maxDuration);
  };

  const handleShare = async () => {
    updateStats('share');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my live stream!',
          text: 'I\'m live streaming right now. Come join me!',
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

  if (!isPlus) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">Plus Members Only</h2>
        <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
          Live streaming is available exclusively to Plus members. Upgrade your membership to access this feature.
        </p>
        <a
          href="/pricing"
          className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
        >
          Upgrade to Plus
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Presale Banner */}
      {session?.user?.currentPresaleId && (
        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">Current Presale</h3>
          <a
            href={`/presale/${session.user.currentPresaleId}`}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            View Presale Details →
          </a>
        </div>
      )}

      <div className="aspect-video bg-neutral-800 rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="mt-4 space-y-4">
        {/* Stream Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
          
          <button
            onClick={isStreaming ? stopStream : startStream}
            className={`px-6 py-2 rounded-full font-medium ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isStreaming ? 'End Stream' : 'Start Stream'}
          </button>
        </div>

        {/* Stream Stats */}
        {isStreaming && (
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
        )}
      </div>
    </div>
  );
};

export default LiveStreamCreator; 