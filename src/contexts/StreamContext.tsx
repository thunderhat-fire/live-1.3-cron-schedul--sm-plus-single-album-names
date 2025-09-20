'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StreamStats, StreamMessage, Stream } from '@/types/stream';

interface StreamContextType {
  streamId: string | null;
  streamUrl: string | null;
  stats: StreamStats;
  messages: StreamMessage[];
  updateStats: (type: 'view' | 'like' | 'share') => void;
  addMessage: (message: StreamMessage) => void;
  setActiveStream: (id: string | null, url: string | null) => void;
  archiveStream: (streamId: string) => Promise<void>;
}

const defaultStats: StreamStats = {
  viewCount: 0,
  likeCount: 0,
  shareCount: 0,
  chatCount: 0,
};

const StreamContext = createContext<StreamContextType>({
  streamId: null,
  streamUrl: null,
  stats: defaultStats,
  messages: [],
  updateStats: () => {},
  addMessage: () => {},
  setActiveStream: () => {},
  archiveStream: async () => {},
});

export const useStream = () => useContext(StreamContext);

export const StreamProvider: React.FC<{
  children: React.ReactNode;
  initialStreamId?: string;
}> = ({ children, initialStreamId = null }) => {
  const [streamId, setStreamId] = useState<string | null>(initialStreamId);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<StreamStats>(defaultStats);
  const [messages, setMessages] = useState<StreamMessage[]>([]);

  const updateStats = (type: 'view' | 'like' | 'share') => {
    setStats(prev => ({
      ...prev,
      [type === 'view' ? 'viewCount' : type === 'like' ? 'likeCount' : 'shareCount']: 
        prev[type === 'view' ? 'viewCount' : type === 'like' ? 'likeCount' : 'shareCount'] + 1,
    }));
  };

  const addMessage = (message: StreamMessage) => {
    setMessages(prev => [...prev, message]);
    setStats(prev => ({
      ...prev,
      chatCount: prev.chatCount + 1,
    }));
  };

  const setActiveStream = (id: string | null, url: string | null) => {
    setStreamId(id);
    setStreamUrl(url);
    if (id && !url) {
      updateStats('view');
    }
  };

  const archiveStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/archive`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive stream');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error archiving stream:', error);
      throw error;
    }
  };

  // Add view count when stream starts
  useEffect(() => {
    if (streamId) {
      updateStats('view');
    }
  }, [streamId]);

  // Fetch stream data when streamId changes
  useEffect(() => {
    if (streamId) {
      const fetchStreamData = async () => {
        try {
          // Fetch stats
          const statsResponse = await fetch(`/api/streams/${streamId}/stats`);
          const statsData = await statsResponse.json();
          if (statsResponse.ok && statsData) {
            setStats(statsData);
          }

          // Fetch messages
          const messagesResponse = await fetch(`/api/streams/${streamId}/messages`);
          const messagesData = await messagesResponse.json();
          if (messagesResponse.ok && messagesData && Array.isArray(messagesData.messages)) {
            setMessages(messagesData.messages);
            }

          setStreamUrl(null);
        } catch (error) {
          console.error('Error fetching stream data:', error);
        }
      };

      fetchStreamData();
    }
  }, [streamId]);

  return (
    <StreamContext.Provider
      value={{
        streamId,
        streamUrl,
        stats,
        messages,
        updateStats,
        addMessage,
        setActiveStream,
        archiveStream,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}; 