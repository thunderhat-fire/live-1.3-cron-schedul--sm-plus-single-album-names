'use client';

import React, { useState, useEffect, useCallback } from "react";
import CardNFTMusic, { CardNFTMusicProps } from "@/components/CardNFTMusic";

export default function AllNFTsPage() {
  const [nfts, setNfts] = useState<CardNFTMusicProps['nft'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllNFTs = useCallback(async () => {
    try {
      // Use a special parameter to get ALL NFTs without filtering
      const response = await fetch('/api/nfts?showAll=true&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }
      const data = await response.json();
      
      if (data.nfts) {
        const transformedNFTs = data.nfts.map((nft: any) => {
          // Ensure price is always a string or number
          const price = typeof nft.price === 'undefined' ? '0' : nft.price;

          return {
            id: nft.id,
            name: nft.name,
            price,
            recordSize: nft.recordSize || '12inch',
            imageUrl: nft.imageUrl || '',
            sideAImage: nft.sideAImage || '',
            endDate: nft.endDate || '',
            recordLabel: nft.recordLabel || '',
            viewCount: nft.viewCount || 0,
            likeCount: nft.likeCount || 0,
            currentOrders: nft.currentOrders || 0,
            targetOrders: nft.targetOrders || 100,
            isLiked: nft.isLiked || false,
            user: {
              id: nft.user?.id || 'unknown',
              name: nft.user?.name || 'Unknown Artist',
              image: nft.user?.image || '/images/avatars/default-avatar.png',
              subscriptionTier: nft.user?.subscriptionTier || 'starter'
            }
          };
        });
        setNfts(transformedNFTs);
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNFTs();
  }, [fetchAllNFTs]);

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (error) {
    return <div className="container py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4">All Albums</h1>
      <h4 className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
        This is where you can see and choose an Album to support.<br />
        Buying a PreSale copy ensures you will receive a pressing of the vinyl LP when the target purchase threshold is met.<br />
        If the target is not met - you&apos;re not charged anything
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <CardNFTMusic 
            key={nft.id} 
            nft={nft} 
            featuredImage={nft.sideAImage}
          />
        ))}
      </div>
    </div>
  );
} 