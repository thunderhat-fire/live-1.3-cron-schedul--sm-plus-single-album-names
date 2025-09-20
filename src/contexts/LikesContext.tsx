'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface LikesContextType {
  likedNfts: Set<string>;
  toggleLike: (nftId: string, isLiked: boolean) => void;
  isLiked: (nftId: string) => boolean;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [likedNfts, setLikedNfts] = useState<Set<string>>(new Set());
  const { data: session } = useSession();

  // Fetch user's liked NFTs on mount and when session changes
  useEffect(() => {
    const fetchLikedNFTs = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/user/liked-nfts');
        const data = await response.json();
        
        if (data.success && data.nfts) {
          const likedNftIds = new Set(data.nfts.map((nft: { id: string }) => nft.id)) as Set<string>;
          setLikedNfts(likedNftIds);
        }
      } catch (error) {
        console.error('Error fetching liked NFTs:', error);
      }
    };

    fetchLikedNFTs();
  }, [session]);

  const toggleLike = useCallback((nftId: string, isLiked: boolean) => {
    setLikedNfts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(nftId);
      } else {
        newSet.delete(nftId);
      }
      return newSet;
    });
  }, []);

  const isLiked = useCallback((nftId: string) => {
    return likedNfts.has(nftId);
  }, [likedNfts]);

  return (
    <LikesContext.Provider value={{ likedNfts, toggleLike, isLiked }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
} 