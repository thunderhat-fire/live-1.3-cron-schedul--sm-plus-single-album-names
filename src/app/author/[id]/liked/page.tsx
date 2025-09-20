'use client';

import React, { useEffect, useState } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

interface NFT {
  id: string;
  name: string;
  price: string;
  stock?: number;
  imageUrl?: string;
  sideAImage?: string;
  endDate?: string;
  isLiked: boolean;
  viewCount?: number;
  likeCount?: number;
  recordSize?: string;
  recordLabel?: string;
  user?: {
    id?: string;
    name?: string;
    image?: string;
    subscriptionTier?: string;
  };
  sideATracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
}

const AuthorLikedPage = () => {
  const params = useParams();
  const { data: session } = useSession();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedNFTs = async () => {
      try {
        if (!params?.id) return;
        
        const response = await fetch(`/api/user/${params.id}/liked-nfts`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        if (data.success && data.nfts) {
          console.log("Liked NFTs (raw from API):", data.nfts);
          const transformedNFTs = data.nfts.map((nft: any) => ({
            id: nft.id,
            name: nft.name,
            price: nft.price.toString(),
            stock: nft.currentOrders || 0,
            imageUrl: nft.sideAImage || nft.imageUrl,
            sideAImage: nft.sideAImage,
            endDate: nft.endDate,
            isLiked: session?.user?.id === params?.id ? true : nft.isLiked,
            viewCount: nft.viewCount || 0,
            likeCount: nft.likeCount || 0,
            recordSize: nft.recordSize || '12inch',
            recordLabel: nft.recordLabel,
            user: nft.user && {
              id: nft.user.id,
              name: nft.user.name,
              image: nft.user.image,
              subscriptionTier: nft.user.subscriptionTier
            },
            sideATracks: nft.sideATracks
          }));
          setNfts(transformedNFTs);
          console.log("Liked NFTs (transformed):", transformedNFTs);
        } else {
          setError(data.error || 'Failed to fetch liked NFTs');
        }
      } catch (error) {
        console.error('Error fetching liked NFTs:', error);
        setError('Failed to fetch liked NFTs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLikedNFTs();
  }, [params?.id, session]);

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
            Nothing here yet.
          </h3>
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

export default AuthorLikedPage; 