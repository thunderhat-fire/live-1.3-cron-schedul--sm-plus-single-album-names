'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FollowContextType {
  followingIds: Set<string>;
  toggleFollow: (userId: string, isFollowing: boolean) => void;
  isFollowing: (userId: string) => boolean;
  loading: boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // Fetch user's following list on mount and when session changes
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/following');
        const data = await response.json();
        
        if (data.success && data.following) {
          // Ensure we're working with string IDs
          const followingIds = data.following.map((user: { id: string }) => user.id);
          setFollowingIds(new Set<string>(followingIds));
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [session]);

  const toggleFollow = useCallback((userId: string, isFollowing: boolean) => {
    setFollowingIds(prev => {
      const newSet = new Set(Array.from(prev));
      if (isFollowing) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const isFollowing = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return followingIds.has(userId);
  }, [followingIds]);

  const value = {
    followingIds,
    toggleFollow,
    isFollowing,
    loading
  };

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
} 