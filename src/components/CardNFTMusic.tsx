"use client";

import React, { FC } from "react";
// Removed Image import since we're using regular img tags
import Link from "next/link";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon, EyeIcon } from "@heroicons/react/24/outline";
import VerifyIcon from "./VerifyIcon";
import Prices from "./Prices";
import RemainingTimeNftCard from "./RemainingTimeNftCard";
import RecordIcon from "./RecordIcon";
import Avatar from "@/shared/Avatar/Avatar";

export interface CardNFTMusicProps {
  className?: string;
  featuredImage?: string;
  nft: {
    id: string;
    name: string;
    price: string | number;
    recordSize?: string;
    imageUrl?: string;
    sideAImage?: string;
    sideBImage?: string; // Added sideBImage property
    endDate?: string;
    recordLabel?: string;
    viewCount?: number;
    likeCount?: number;
    currentOrders?: number;
    targetOrders?: number;
    user?: {
      id?: string;
      name?: string;
      image?: string;
      subscriptionTier?: string;
    };
    isLiked?: boolean;
    isVinylPresale?: boolean;
    showAsDigital?: boolean; // Added showAsDigital property
  };
  hideView?: boolean;
  hideAvatar?: boolean;
  onLike?: (id: string) => Promise<void>;
}

const CardNFTMusic: FC<CardNFTMusicProps> = ({
  className = "",
  featuredImage,
  nft,
  hideView = false,
  hideAvatar = false,
  onLike,
}) => {
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLike) {
      await onLike(nft.id);
    }
  };

  const getCurrentOrders = () => {
    return (nft.targetOrders || 100) - (nft.currentOrders || 0);
  };

  const stockCount = getCurrentOrders();

  // Calculate correct price based on record size and presale status
  const getCorrectPrice = () => {
    // If presale is completed or showing as digital, use digital pricing
    if (nft.showAsDigital || !nft.isVinylPresale) {
      return nft.recordSize === '7 inch' ? 4 : 13; // £4 for 7-inch digital, £13 for 12-inch digital
    }
    
    // Vinyl pricing - check record size first
    if (nft.recordSize === '7 inch') {
      return 13; // Fixed price for 7-inch vinyl
    }
    
    // 12-inch vinyl tiered pricing based on target orders
    if (nft.targetOrders === 100) return 26;
    if (nft.targetOrders === 200) return 22;
    if (nft.targetOrders === 500) return 20;
    return 26; // Default to 26 if not matched
  };

  const displayPrice = getCorrectPrice().toFixed(2);

  // Get the best available image for Side A
  const getSideAImage = () => {
    if (nft.sideAImage) return nft.sideAImage;
    if (nft.imageUrl) return nft.imageUrl;
    if (featuredImage) return featuredImage;
    return '/images/placeholder-small.png';
  };

  // Debug: log image URLs
  console.log('🎵 NFT Card Image Debug:', {
    id: nft.id,
    name: nft.name,
    sideAImage: nft.sideAImage,
    imageUrl: nft.imageUrl,
    featuredImage,
    finalImage: getSideAImage()
  });

  // Get Side B image (fallback to Side A if no Side B)
  const getSideBImage = () => {
    if (nft.sideBImage) return nft.sideBImage;
    return getSideAImage(); // Fallback to Side A if no Side B image
  };

  // Check if we have a different Side B image to enable flip effect
  const hasFlipEffect = false; // Disabled flip effects

  return (
    <div
      className={`nc-CardNFTMusic relative group border border-neutral-200 dark:border-neutral-700 p-4 rounded-3xl min-h-[420px] flex flex-col justify-between ${className}`}
      data-nc-id="CardNFTMusic"
    >
      <div className="flex-1 flex flex-col justify-between">
        <div className="relative">
          <div className="">
            <Link href={`/nft-detail/${nft.id}`}>
              <div className="relative w-full h-[270px]">
                {/* Simple image display - no flip effects */}
                <img
                  src={getSideAImage()}
                  className="object-cover w-full h-full rounded-2xl group-hover:scale-[1.03] transition-transform duration-300 ease-in-out"
                  alt={nft.name}
                  onError={(e) => {
                    const failedUrl = e.currentTarget.src;
                    console.error('❌ Image failed to load:', failedUrl);
                    
                    // Use a data URL as fallback to avoid infinite loops
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTgwIDEwNUwxNTAgMTM1TDEyMCAxMDVMMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                  }}
                />
              </div>
            </Link>
          </div>
          {nft.endDate && (
            <RemainingTimeNftCard endDate={nft.endDate} />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-2 py-1 text-xs bg-white rounded-full flex items-center space-x-1">
              <span className="text-neutral-700 dark:text-neutral-900">
                {nft.recordSize || "12 inch"}
              </span>
            </div>
            
            {/* Flip indicator for cards with Side B */}
            {hasFlipEffect && (
              <div className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-3 h-3 animate-spin-slow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>Hover to flip</span>
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <div className="px-2 py-1 text-xs bg-white rounded-full flex items-center space-x-1">
              <span className="text-neutral-700 dark:text-neutral-900">
                {nft.currentOrders || 0} / {nft.targetOrders || 100} sold
              </span>
            </div>
            {onLike && (
              <button
                className={`w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-900 rounded-full ${
                  nft.isLiked ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-200'
                }`}
                onClick={handleLike}
              >
                {nft.isLiked ? (
                  <HeartIconSolid className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium flex-shrink min-w-0">
              <Link href={`/nft-detail/${nft.id}`} className="block truncate max-w-[140px]" title={nft.name}>
                {nft.name.length > 13 ? `${nft.name.substring(0, 13)}...` : nft.name}
              </Link>
            </h2>
            <div className="flex items-center flex-shrink-0">
              <Prices 
                price={displayPrice} 
                className="flex items-center space-x-1" 
              />
            </div>
          </div>
          
          {/* Digital Download / Vinyl Pre-sale indicator */}
          <div className="flex items-center justify-between gap-3 mt-1">
            <div></div> {/* Empty left side */}
            <div className="flex items-center flex-shrink-0">
              <span className={`text-sm ${nft.isVinylPresale ? 'text-neutral-500 dark:text-neutral-400' : nft.showAsDigital ? 'text-green-600 dark:text-green-400' : 'invisible'}`}>
                {nft.isVinylPresale ? 'Vinyl Pre-sale' : nft.showAsDigital ? 'Digital Download' : ''}
              </span>
            </div>
          </div>
          
          {!hideAvatar && nft.user && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <Link 
                href={nft.user.id ? `/author/${nft.user.id}` : '#'}
                className="flex items-center text-neutral-700 dark:text-neutral-300 hover:text-primary-500 transition-colors cursor-pointer flex-shrink min-w-0"
              >
                <Avatar
                  imgUrl={nft.user.image}
                  sizeClass="h-8 w-8"
                  radius="rounded-full"
                />
                <span className="ml-2 text-sm flex items-center">
                  {nft.user.name || 'Unknown Artist'}
                  <VerifyIcon 
                    className="ml-1" 
                    iconClass="w-3 h-3" 
                    subscriptionTier={nft.user.subscriptionTier}
                  />
                </span>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-3">
            {!hideView && (
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4" />
                <span className="ml-1 text-sm">
                  {nft.viewCount?.toLocaleString() || 0}
                </span>
              </div>
            )}
            <div className="flex items-center">
              {nft.isLiked ? (
                <HeartIconSolid className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              <span className="ml-1 text-sm">
                {nft.likeCount?.toLocaleString() || 0}
              </span>
            </div>
          </div>
          {nft.recordLabel && (
            <div className="flex items-center text-sm">
              <RecordIcon className="w-3.5 h-3.5 mr-1" />
              <span>{nft.recordLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardNFTMusic;

