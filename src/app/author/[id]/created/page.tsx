'use client';

import React, { useEffect, useState } from "react";
import CardNFTMusic from "@/components/CardNFTMusic";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import Pagination from "@/shared/Pagination/Pagination";
import { useSession } from "next-auth/react";
import { Route } from "next";
import ArchiveFilterListBox from "@/components/ArchiveFilterListBox";

interface NFT {
  id: string;
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  endDate?: string;
  recordSize?: string;
  viewCount: number;
  isLiked: boolean;
  sideATracks?: Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
  }>;
}

interface Props {
  params: {
    id: string;
  };
}

const CreatedPage = ({ params }: Props) => {
  const { data: session } = useSession();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    try {
      // Use the unified API endpoint
      const response = await fetch(`/api/nfts/user/${params?.id}?tab=created`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.success && data.nfts) {
        // Map to full NFT card format
        const transformedNFTs = data.nfts.map((nft: any) => ({
          id: nft.id,
          name: nft.name,
          price: nft.price?.toString() || '0',
          stock: nft.currentOrders || 0,
          imageUrl: nft.sideAImage || nft.imageUrl,
          sideAImage: nft.sideAImage,
          sideBImage: nft.sideBImage,
          endDate: nft.endDate,
          isVinylPresale: nft.isVinylPresale ?? true,
          viewCount: nft.viewCount || 0,
          likeCount: nft.likeCount || 0,
          isLiked: nft.isLiked || false,
          recordSize: nft.recordSize || '12inch',
          recordLabel: nft.recordLabel || 'Unknown Label',
          user: nft.user && {
            id: nft.user.id,
            name: nft.user.name,
            image: nft.user.image,
            subscriptionTier: nft.user.subscriptionTier
          },
          sideATracks: nft.sideATracks || [],
          sideBTracks: nft.sideBTracks || [],
          creator: nft.creator,
          userImage: nft.userImage,
          creatorSubscriptionTier: nft.creatorSubscriptionTier,
          description: nft.description,
          genre: nft.genre,
          currentOrders: nft.currentOrders,
          targetOrders: nft.targetOrders,
        }));
        setNfts(transformedNFTs);
      } else {
        setError('Failed to fetch created NFTs');
      }
    } catch (error) {
      console.error('Error fetching created NFTs:', error);
      setError('Failed to fetch created NFTs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchNFTs();
    }
  }, [params?.id]);

  const handleFilterChange = (filteredNFTs: NFT[]) => {
    setNfts(filteredNFTs);
  };

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
            No Albums created yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            This creator hasn&apos;t created any Albums yet
          </p>
          {session?.user?.id === params?.id && (
            <div className="mt-6">
              <ButtonPrimary href={"/create" as Route}>
                Create Your First Album
              </ButtonPrimary>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8 lg:mt-10">
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