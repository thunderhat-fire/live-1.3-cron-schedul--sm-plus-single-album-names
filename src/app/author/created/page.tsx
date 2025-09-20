'use client';

import React, { useEffect, useState } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import Pagination from "@/shared/Pagination/Pagination";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface NFT {
  id: string;
  name: string;
  price: string;
  stock?: number;
  imageUrl?: string;
  endDate?: string;
  isVinylPresale: boolean;
  viewCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  recordSize?: string;
  recordLabel?: string;
  user?: {
    id: string;
    name: string;
    image: string;
    subscriptionTier?: string;
  };
  sideATracks?: any[];
  sideBTracks?: any[];
}

const CreatedPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!session?.user?.id) return;
      
      try {
        // Use the robust API endpoint that includes views and likes
        const response = await fetch(`/api/nfts/user/${session.user.id}?tab=created`);
        const data = await response.json();
        
        if (data.success && data.nfts) {
          const transformedNFTs = data.nfts.map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            price: nft.price?.toString() || '0',
            stock: nft.currentOrders || 0,
            imageUrl: nft.sideAImage || nft.imageUrl,
            endDate: nft.endDate,
            isVinylPresale: nft.isVinylPresale ?? true,
            viewCount: nft.viewCount || 0,
            likeCount: nft.likesCount || 0,
            isLiked: nft.isLiked || false,
            recordSize: nft.recordSize || '12inch',
            recordLabel: nft.recordLabel || 'Unknown Label',
            user: nft.user,
            sideATracks: nft.sideATracks || [],
            sideBTracks: nft.sideBTracks || []
          }));
          setNfts(transformedNFTs);
        }
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNFTs();
  }, [session]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
        {nfts.map((nft) => (
          <CardNFTMusic 
            key={nft.id} 
            nft={nft} 
            featuredImage={nft.imageUrl}
          />
        ))}
      </div>
      <div className="flex flex-col mt-12 lg:mt-16 space-y-5 sm:space-y-0 sm:space-x-3 sm:flex-row sm:justify-between sm:items-center">
        <Pagination />
      </div>
    </div>
  );
};

export default CreatedPage;
