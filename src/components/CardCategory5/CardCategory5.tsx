import React, { FC } from "react";
import NcImage from "@/shared/NcImage/NcImage";
import images1 from "@/images/nfts/cat1.webp";
import Link from "next/link";
import { StaticImageData } from "next/image";

export interface CardCategory5Props {
  className?: string;
  featuredImage?: string | StaticImageData;
  name: string;
  index: number;
  nftCount?: number;
  singlesCount?: number;
  albumsCount?: number;
}

const COLORS = [
  "bg-purple-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-gray-500",
];

const CardCategory5: FC<CardCategory5Props> = ({
  className = "",
  featuredImage = images1,
  name,
  index,
  nftCount = 0,
  singlesCount = 0,
  albumsCount = 0,
}) => {
  return (
    <Link
      href={`/collection?label=${encodeURIComponent(name)}`}
      className={`nc-CardCategory5 flex flex-col ${className}`}
    >
      <div
        className={`flex-shrink-0 relative w-full aspect-w-4 aspect-h-3 h-0 rounded-2xl overflow-hidden group`}
      >
        <NcImage
          containerClassName=""
          src={typeof featuredImage === 'string' ? featuredImage : featuredImage?.src || images1.src}
          className="object-cover rounded-2xl z-0"
          fill
          alt={name}
        />
        <span className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black bg-opacity-10 transition-opacity"></span>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`w-10 h-10 rounded-full ${COLORS[index % COLORS.length]}`}></div>
        <div className="ml-3">
          <h2
            className={`text-base sm:text-lg text-neutral-900 dark:text-neutral-100 font-medium truncate`}
          >
            {name}
          </h2>
          <span
            className={`block mt-1 text-sm text-neutral-6000 dark:text-neutral-400`}
          >
            {(() => {
              const singles = singlesCount || 0;
              const albums = albumsCount || 0;
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
    </Link>
  );
};

export default CardCategory5;
