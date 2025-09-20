"use client";

import React, { FC, useState, useEffect } from "react";
import HeaderFilterSection from "@/components/HeaderFilterSection";
import CardNFTMusic from "@/components/CardNFTMusic";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import { NFT } from "@/types/nft";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

//
export interface SectionGridFeatureNFT2Props {
  className?: string;
}

interface ProcessedNFT {
  id: string;
  name: string;
  price: string | number;
  recordSize?: string;
  imageUrl?: string;
  sideAImage?: string;
  endDate?: string;
  recordLabel?: string;
  viewCount?: number;
  currentOrders?: number;
  targetOrders?: number;
  isVinylPresale?: boolean;
  showAsDigital?: boolean;
  user: {
    id?: string;
    name: string;
    image: string;
    subscriptionTier?: string;
  };
  isLiked?: boolean;
}

const SectionGridFeatureNFT2: FC<SectionGridFeatureNFT2Props> = ({
  className = "",
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [nfts, setNfts] = useState<ProcessedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("All Albums");
  const [sortOrder, setSortOrder] = useState("Recently-listed");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        setPage(1); // Reset to page 1 when filters change
        const genre = activeGenre === "All Albums" ? "" : activeGenre;
        const response = await fetch(`/api/nfts?genre=${genre}&sortOrder=${sortOrder}&limit=8&page=1`);
        const data = await response.json();
        if (data.nfts) {
          // Process NFTs to ensure they match the required format
          const processedNfts: ProcessedNFT[] = data.nfts.map((nft: NFT) => ({
            id: nft.id,
            name: nft.name || "Untitled NFT",
            price: nft.price,
            recordSize: nft.recordSize,
            imageUrl: nft.imageUrl,
            sideAImage: nft.sideAImage,
            endDate: nft.endDate,
            recordLabel: nft.recordLabel,
            viewCount: nft.viewCount,
            currentOrders: nft.currentOrders,
            targetOrders: nft.targetOrders,
            isLiked: nft.isLiked,
            isVinylPresale: nft.isVinylPresale,
            showAsDigital: nft.showAsDigital,
            user: {
              id: nft.user?.id,
              name: nft.user?.name || "Unknown Artist",
              image: nft.user?.image || "/images/avatars/default-avatar.png",
              subscriptionTier: nft.user?.subscriptionTier,
            }
          }));
          setNfts(processedNfts);
          setHasMore(data.nfts.length === 8 && data.total > 8);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [activeGenre, sortOrder]);

  const handleLike = async (nftId: string) => {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/nfts/${nftId}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        // Update the liked status in the local state
        setNfts(prev => prev.map(nft => 
          nft.id === nftId ? { ...nft, isLiked: data.liked } : nft
        ));
      }
    } catch (error) {
      console.error('Error liking NFT:', error);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const genre = activeGenre === "All Albums" ? "" : activeGenre;
      const response = await fetch(`/api/nfts?genre=${genre}&sortOrder=${sortOrder}&limit=8&page=${nextPage}`);
      const data = await response.json();
      
      if (data.nfts && data.nfts.length > 0) {
        const newNfts: ProcessedNFT[] = data.nfts.map((nft: NFT) => ({
          id: nft.id,
          name: nft.name || "Untitled NFT",
          price: nft.price,
          recordSize: nft.recordSize,
          imageUrl: nft.imageUrl,
          sideAImage: nft.sideAImage,
          endDate: nft.endDate,
          recordLabel: nft.recordLabel,
          viewCount: nft.viewCount,
          currentOrders: nft.currentOrders,
          targetOrders: nft.targetOrders,
          isLiked: nft.isLiked,
          isVinylPresale: nft.isVinylPresale,
          showAsDigital: nft.showAsDigital,
          user: {
            id: nft.user?.id,
            name: nft.user?.name || "Unknown Artist",
            image: nft.user?.image || "/images/avatars/default-avatar.png",
            subscriptionTier: nft.user?.subscriptionTier,
          }
        }));
        
        setNfts(prev => [...prev, ...newNfts]);
        setPage(nextPage);
        setHasMore(data.nfts.length === 8 && (nfts.length + newNfts.length) < data.total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more NFTs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className={`nc-SectionGridFeatureNFT2 relative ${className}`}>
      <HeaderFilterSection 
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
        onSortChange={setSortOrder}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10 mt-8 lg:mt-10">
        {loading ? (
          // Loading skeletons
          Array(8).fill(null).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-neutral-200 dark:bg-neutral-800 rounded-3xl h-[270px]"></div>
              <div className="mt-4 space-y-3">
                <div className="bg-neutral-200 dark:bg-neutral-800 h-5 w-2/3 rounded"></div>
                <div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-1/2 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          // Actual NFTs
          nfts.map((nft) => (
            <CardNFTMusic 
              key={nft.id} 
              nft={nft}
              onLike={handleLike}
            />
          ))
        )}
      </div>

      <div className="flex mt-16 justify-center items-center">
        {hasMore && (
          <ButtonPrimary 
            onClick={loadMore}
            disabled={loadingMore}
            className={loadingMore ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {loadingMore ? 'Loading...' : 'Show me more'}
          </ButtonPrimary>
        )}
      </div>
      <div className="w-full flex flex-col items-center justify-center mt-8 mb-2">
        <span className="text-sm text-neutral-700 dark:text-neutral-200 mb-1 text-center">Support your Artist and click on the relevant Album above</span>
        <a href="/buyer-protection" className="text-sm text-primary-600 hover:underline text-center">Read our Buyer guide</a>
      </div>
    </div>
  );
};

export default SectionGridFeatureNFT2;
