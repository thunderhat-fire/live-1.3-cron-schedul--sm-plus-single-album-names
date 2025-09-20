'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useStreamStore } from '@/store/streamStore';

// Dynamically import FloatingLiveStreamWindow with no SSR
const FloatingLiveStreamWindow = dynamic(
  () => import('./FloatingLiveStreamWindow'),
  { ssr: false }
);

const GlobalStreamWindow: React.FC = () => {
  const { isStreaming, setIsStreaming } = useStreamStore();

  if (!isStreaming) return null;

  return (
    <FloatingLiveStreamWindow 
      onClose={() => setIsStreaming(false)} 
    />
  );
};

export default GlobalStreamWindow; 