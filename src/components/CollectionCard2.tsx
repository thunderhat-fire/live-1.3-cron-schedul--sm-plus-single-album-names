"use client";

import React, { FC } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import NcImage from "@/shared/NcImage/NcImage";
import VerifyIcon from "./VerifyIcon";
import Link from "next/link";

export interface CollectionCard2Props {
  className?: string;
  recordLabel?: {
    name: string;
    count: number;
    singlesCount?: number;
    albumsCount?: number;
    recordLabelImage?: string;
    nfts: {
      id: string;
      name: string;
      sideAImage: string;
      creator: string;
      creatorImage: string;
      creatorSubscriptionTier?: string;
    }[];
  };
}

const CollectionCard2: FC<CollectionCard2Props> = ({
  className = "",
  recordLabel
}) => {
  if (!recordLabel || !recordLabel.nfts.length) return null;

  const mainImage = recordLabel.recordLabelImage || recordLabel.nfts[0]?.sideAImage;
  const otherImages = recordLabel.nfts.slice(0, 3).map(nft => nft.sideAImage);
  const creator = recordLabel.nfts[0]?.creator;
  const creatorImage = recordLabel.nfts[0]?.creatorImage;
  const creatorSubscriptionTier = recordLabel.nfts[0]?.creatorSubscriptionTier;

  return (
    <div className={`CollectionCard2 group relative ${className}`}>
      <div className="relative flex flex-col">
        <NcImage
          containerClassName="relative z-0 aspect-w-8 aspect-h-5"
          className="object-cover rounded-xl"
          src={mainImage}
          sizes="(max-width: 600px) 480px, 33vw"
          fill
          alt={recordLabel.name || "Collection image"}
        />
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {otherImages.map((img, index) => (
            <NcImage
              key={index}
              fill
              containerClassName="relative w-full h-28"
              className="object-cover rounded-xl"
              src={img}
              sizes="150px"
              alt={`Collection item ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="relative mt-5 ">
        {/* TITLE */}
        <h2 className="font-semibold text-2xl group-hover:text-primary-500 transition-colors">
          {recordLabel.name}
        </h2>
        {/* AUTHOR */}
        <div className="mt-2 flex justify-between">
          <div className="flex items-center truncate">
            <Avatar 
              sizeClass="h-6 w-6" 
              imgUrl={creatorImage}
            />
            <div className="ml-2 text-sm truncate">
              <span className="font-normal hidden sm:inline-block">
                Creator
              </span>
              {` `}
              <span className="font-medium">{creator || 'Unknown Artist'}</span>
            </div>
            <VerifyIcon iconClass="w-4 h-4" subscriptionTier={creatorSubscriptionTier} />
          </div>
          <span className="mb-0.5 ml-2 inline-flex justify-center items-center px-2 py-1.5 border-2 border-secondary-500 text-secondary-500 rounded-md text-xs !leading-none font-medium">
            {(() => {
              const singles = recordLabel.singlesCount || 0;
              const albums = recordLabel.albumsCount || 0;
              const total = singles + albums;
              
              if (total === 0) return '0 Releases';
              if (singles > 0 && albums > 0) {
                return `${singles} Single${singles !== 1 ? 's' : ''} • ${albums} Album${albums !== 1 ? 's' : ''}`;
              }
              if (singles > 0) {
                return `${singles} Single${singles !== 1 ? 's' : ''}`;
              }
              return `${albums} Album${albums !== 1 ? 's' : ''}`;
            })()}
          </span>
        </div>
      </div>
      <Link href={`/collection?label=${encodeURIComponent(recordLabel.name)}`} className="absolute inset-0"></Link>
    </div>
  );
};

export default CollectionCard2;
