'use client';

import CardNFTMusic from "@/components/CardNFTMusic";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface NFT {
  id: string;
  name: string;
  price: string;
  stock?: number;
  imageUrl?: string;
  endDate?: string;
  isLiked: boolean;
  sideATracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
}

const LikedPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedNFTs = async () => {
      try {
        console.log('Fetching liked NFTs...');
        const response = await fetch('/api/user/liked-nfts');
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        if (data.success && data.nfts) {
          console.log('Raw NFT data from API:', data.nfts[0]);
          const transformedNFTs = data.nfts.map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            price: nft.price.toString(),
            stock: nft.currentOrders || 0,
            imageUrl: nft.sideAImage || nft.imageUrl,
            sideAImage: nft.sideAImage,
            sideBImage: nft.sideBImage,
            endDate: nft.endDate,
            isLiked: true,
            viewCount: nft.viewCount || 0,
            likeCount: nft.likeCount || 0,
            recordSize: nft.recordSize || '12inch',
            recordLabel: nft.recordLabel || 'Unknown Label',
            isVinylPresale: nft.isVinylPresale ?? true,
            sideATracks: nft.sideATracks || [],
            sideBTracks: nft.sideBTracks || [],
            user: nft.user && {
              id: nft.user.id,
              name: nft.user.name,
              image: nft.user.image,
              subscriptionTier: nft.user.subscriptionTier
            },
            creator: nft.creator,
            userImage: nft.userImage,
            creatorSubscriptionTier: nft.creatorSubscriptionTier,
            description: nft.description,
            genre: nft.genre,
            currentOrders: nft.currentOrders,
            targetOrders: nft.targetOrders,
            isDeleted: nft.isDeleted || false,
            isCurated: nft.isCurated || false,
            isRadioEligible: nft.isRadioEligible || false,
          }));
          setNfts(transformedNFTs);
        } else {
          setError(data.error || 'Failed to fetch liked Albums');
        }
      } catch (error) {
        console.error('Error fetching liked NFTs:', error);
        setError('Failed to fetch liked Albums. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchLikedNFTs();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="container py-10">Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {error}
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            No liked Albums yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Start exploring and like some Albums to see them here
          </p>
          <div className="mt-6">
            <ButtonPrimary onClick={() => router.push('/')}>
              Explore Albums
            </ButtonPrimary>
          </div>
        </div>
      </div>
    );
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

export default LikedPage;
