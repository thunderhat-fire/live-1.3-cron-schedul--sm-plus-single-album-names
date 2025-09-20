"use client";

import React, { FC, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NcImage from "@/shared/NcImage/NcImage";
import { DEFAULT_NFT_IMAGE } from "@/constants/images";
import LikeButton from "@/components/LikeButton";
import Prices from "@/components/Prices";
import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import { useLikes } from "@/contexts/LikesContext";
import Image from "next/image";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { PlayIcon } from "@heroicons/react/24/solid";
import { PauseIcon } from "@heroicons/react/24/solid";

export interface CardNFTMusicProps {
  className?: string;
  nft: {
    id: string;
    name: string;
    price?: string | number;
    stock?: number;
    imageUrl?: string;
    sideAImage?: string;
    endDate?: string;
    recordSize?: string;
  };
}

const CardNFTMusic: FC<CardNFTMusicProps> = ({
  className = "",
  nft,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { isLiked, toggleLike } = useLikes();

  const handleLike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/nfts/${nft.id}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toggleLike(nft.id, data.liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`nc-CardNFTMusic relative group ${className}`}
      data-nc-id="CardNFTMusic"
    >
      <div className="">
        <div className="relative">
          <div className="">
            <Link href={`/nft-detail/${nft.id}`}>
              <img
                className="w-full h-[270px] rounded-3xl object-cover"
                src={nft.sideAImage || nft.imageUrl || DEFAULT_NFT_IMAGE}
                alt={nft.name}
                onError={(e) => {
                  const failedUrl = e.currentTarget.src;
                  console.error('❌ Image failed to load:', failedUrl);
                  
                  // Use a data URL as fallback to avoid infinite loops
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTgwIDEwNUwxNTAgMTM1TDEyMCAxMDVMMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                }}
              />
            </Link>
          </div>
          <div className="absolute top-3 left-3">
            {nft.recordSize && (
              <div className="px-2 py-1 text-xs bg-white rounded-full flex items-center space-x-1">
                <span className="text-neutral-700 dark:text-neutral-900">
                  {nft.recordSize}
                </span>
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <button
              className={`w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 nc-shadow-lg ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={handleLike}
              disabled={isLoading}
            >
              {isLiked(nft.id) ? (
                <HeartIconSolid className="w-5 h-5 text-red-500 fill-current" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <h2 className="text-lg font-medium">
            <Link href={`/nft-detail/${nft.id}`} className="line-clamp-1">
              {nft.name}
            </Link>
          </h2>
          <div className="flex items-center space-x-3">
            {nft.price && (
              <Prices price={typeof nft.price === 'number' ? nft.price.toString() : nft.price} className="flex items-center space-x-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardNFTMusic; 