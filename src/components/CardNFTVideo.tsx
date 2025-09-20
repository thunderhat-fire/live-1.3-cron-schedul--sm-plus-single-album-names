import React, { FC, useId } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import NcImage from "@/shared/NcImage/NcImage";
import { DEFAULT_NFT_IMAGE } from "@/constants/images";
import LikeButton from "./LikeButton";
import Prices from "./Prices";
import VideoForNft from "./VideoForNft";
import Link from "next/link";

export interface CardNFTVideoProps {
  className?: string;
  nft: {
    id: string;
    name: string;
    price?: string | number;
    imageUrl?: string;
    videoUrl?: string;
    isLiked?: boolean;
    creator?: {
      id: string;
      name: string;
      avatar?: string;
    };
    endDate?: string;
    totalSupply?: number;
  };
}

const CardNFTVideo: FC<CardNFTVideoProps> = ({
  className = "",
  nft,
}) => {
  const renderAvatars = () => {
    if (!nft.creator) return null;
    
    return (
      <div className="hidden sm:flex -space-x-1 ">
        <Avatar
          containerClassName="ring-2 ring-white dark:ring-neutral-900"
          sizeClass="h-5 w-5 text-sm"
          imgUrl={nft.creator.avatar}
        />
      </div>
    );
  };

  return (
    <div
      className={`nc-CardNFTVideo relative flex flex-col group ${className}`}
    >
      <div className="relative flex-shrink-0">
        <div className="relative aspect-w-16 aspect-h-9 w-full h-0 rounded-3xl overflow-hidden z-0">
          <VideoForNft
            featuredImage={nft.imageUrl || DEFAULT_NFT_IMAGE}
            videoUrl={nft.videoUrl}
          />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <LikeButton
            liked={nft.isLiked}
            className=""
            nftId={nft.id}
          />
        </div>
      </div>

      <div className="p-5 relative">
        <Link href={`/nft-detail/${nft.id}`} className="absolute inset-0"></Link>
        <div className="flex justify-between items-center">
          <h2 className={`sm:text-lg font-semibold hover:text-primary-6000`}>
            {nft.name}
          </h2>
          <div className="ml-2 flex items-center space-x-3">
            {renderAvatars()}
            {nft.totalSupply && (
              <span className="text-neutral-700 dark:text-neutral-400 text-xs">
                {nft.totalSupply} items
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mt-3.5">
          {nft.price && (
            <Prices 
              price={typeof nft.price === 'number' ? nft.price.toString() : nft.price}
              labelTextClassName="bg-white dark:bg-neutral-900"
            />
          )}
          {nft.endDate && (
            <div className="text-right">
              <span className="block text-xs text-white font-normal tracking-wide">
                Remaining time
              </span>
              <span className="block font-semibold mt-0.5 text-white">
                {new Date(nft.endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardNFTVideo;
