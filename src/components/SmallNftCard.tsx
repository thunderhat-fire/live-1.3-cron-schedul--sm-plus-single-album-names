import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/outline';

interface SmallNftCardProps {
  nft: {
    id: string;
    name: string;
    description: string;
    genre?: string;
    creator?: string;
    userImage?: string;
    creatorSubscriptionTier?: string;
    recordSize?: string;
    recordLabel?: string;
    price?: number;
    endDate?: string;
    imageUrl?: string;
    sideAImage?: string;
    sideBImage?: string;
    currentOrders?: number;
    targetOrders?: number;
    isVinylPresale?: boolean;
    isLiked?: boolean;
    likeCount?: number;
    viewCount?: number;
  };
}

const SmallNftCard: React.FC<SmallNftCardProps> = ({ nft }) => {
  // Calculate correct price based on record size and presale status
  const getCorrectPrice = () => {
    // If presale is completed or showing as digital, always £13
    if (nft.showAsDigital || !nft.isVinylPresale) return 13;
    
    // Check record size for pricing
    if (nft.recordSize === '7inch' || nft.recordSize === '7 inch') {
      return 13; // Fixed price for 7-inch records
    }
    
    // 12-inch tiered pricing based on target orders
    if (nft.targetOrders === 100) return 26;
    if (nft.targetOrders === 200) return 22;
    if (nft.targetOrders === 500) return 20;
    return 26; // Default to 26 if not matched
  };

  // Get the best available image for Side A
  const getSideAImage = () => {
    if (nft.sideAImage) return nft.sideAImage;
    if (nft.imageUrl) return nft.imageUrl;
    return '/default-nft.png';
  };

  // Get Side B image (fallback to Side A if no Side B)
  const getSideBImage = () => {
    if (nft.sideBImage) return nft.sideBImage;
    return getSideAImage();
  };

  // Check if we have a different Side B image to enable flip effect
  const hasFlipEffect = false; // Disabled flip effects

  return (
    <div className="w-40 bg-white dark:bg-neutral-900 rounded-lg shadow p-2 flex flex-col items-center text-xs group">
      <div className="relative w-32 h-32 mb-2">
        {/* Simple image display - no flip effects */}
        <img
          src={getSideAImage()}
          alt={nft.name}
          className="w-full h-full object-cover rounded"
          onError={(e) => {
            console.error('SmallNftCard image failed to load:', getSideAImage());
            e.currentTarget.src = '/images/placeholder-small.png';
          }}
        />
      </div>
      <div className="font-semibold text-center truncate w-full" title={nft.name}>{nft.name}</div>
      <div className="text-neutral-500 truncate w-full text-center" title={nft.creator}>{nft.creator}</div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="font-bold">£{getCorrectPrice().toFixed(2)}</span>
        <span className="text-neutral-400">|</span>
        <span>{nft.recordSize}</span>
      </div>
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className="flex items-center gap-1"><HeartIcon className="w-4 h-4 text-neutral-400 inline-block" />{nft.likeCount ?? 0}</span>
        <span className="text-neutral-400">|</span>
        <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4 inline-block" />{nft.viewCount ?? 0}</span>
      </div>
      <div className="text-neutral-400 mt-1 truncate w-full text-center" title={nft.recordLabel}>{nft.recordLabel}</div>
      <div className="text-neutral-400 mt-1 truncate w-full text-center" title={nft.genre}>{nft.genre}</div>
      {nft.endDate && (
        <div className="text-[10px] text-neutral-400 mt-1">Ends: {new Date(nft.endDate).toLocaleDateString()}</div>
      )}
    </div>
  );
};

export default SmallNftCard; 