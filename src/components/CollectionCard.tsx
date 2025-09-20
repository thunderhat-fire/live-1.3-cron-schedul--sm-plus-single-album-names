import React, { FC } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import NcImage from "@/shared/NcImage/NcImage";
import VerifyIcon from "./VerifyIcon";
import Link from "next/link";

export interface CollectionCardProps {
  className?: string;
  recordLabel?: {
    name: string;
    count: number;
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

const CollectionCard: FC<CollectionCardProps> = ({
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
    <div
      className={`CollectionCard relative p-4 rounded-2xl overflow-hidden h-[410px] flex flex-col group ${className}`}
    >
      <NcImage
        fill
        containerClassName="absolute inset-0 z-0 overflow-hidden"
        src={mainImage}
        alt={recordLabel?.name || "Collection background"}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 group-hover:h-full to-transparent "></div>

      <div className="relative mt-auto">
        {/* AUTHOR */}
        <div className="flex items-center">
          <Avatar 
            sizeClass="h-6 w-6" 
            containerClassName="ring-2 ring-white" 
            imgUrl={creatorImage}
          />
          <div className="ml-2 text-xs text-white">
            <span className="font-normal">by</span>
            {` `}
            <span className="font-medium">{creator || 'Unknown Artist'}</span>
          </div>
          <VerifyIcon iconClass="w-4 h-4" subscriptionTier={creatorSubscriptionTier} />
        </div>
        {/* TITLE */}
        <h2 className="font-semibold text-3xl mt-1.5 text-white">
          {recordLabel.name}
        </h2>
        {/* LISTS */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          {otherImages.map((img, index) => (
            <NcImage
              key={index}
              containerClassName="relative z-0 w-full h-20 rounded-xl overflow-hidden"
              fill
              src={img}
              alt={`Collection item ${index + 1}`}
            />
          ))}
        </div>
        {/* COUNT */}
        <div className="mt-3 text-white text-sm">
          {recordLabel.count} {recordLabel.count === 1 ? 'Album' : 'Albums'}
        </div>
      </div>
      <Link href={`/collection?label=${encodeURIComponent(recordLabel.name)}`} className="absolute inset-0"></Link>
    </div>
  );
};

export default CollectionCard;