"use client";

import React, { FC, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Heading from "@/components/Heading/Heading";
import { placeholderImage, defaultAvatar } from "@/constants/images";

export interface SectionLargeSliderProps {
  className?: string;
  nfts?: {
    id: string;
    name: string;
    sideAImage?: string;
    price?: string | number;
    user?: {
      name: string;
      image: string;
    };
  }[];
}

const SectionLargeSlider: FC<SectionLargeSliderProps> = ({
  className = "",
  nfts = [],
}) => {
  const router = useRouter();

  if (!nfts.length) return null;

  return (
    <div className={`nc-SectionLargeSlider relative ${className}`}>
      <Heading
        className="mb-12 lg:mb-14 text-neutral-900 dark:text-neutral-50"
        fontClass="text-3xl md:text-4xl 2xl:text-5xl font-semibold"
        isCenter
      >
        Browse by AUTHOR
      </Heading>
      <div className="relative">
        {nfts.map((nft, index) => (
          <div key={nft.id} className="relative">
            <div className="aspect-w-16 aspect-h-9 relative">
              <Image
                src={nft.sideAImage || placeholderImage}
                alt={nft.name || "NFT"}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover rounded-3xl"
              />
            </div>
            <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/60 to-transparent rounded-3xl">
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-white">
                  <Link href={`/nft-detail/${nft.id}`}>{nft.name}</Link>
                </h2>
                <div className="flex items-center mt-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <Image
                      className="h-10 w-10 rounded-full object-cover"
                      src={nft.user?.image || defaultAvatar}
                      alt={nft.user?.name || "Artist"}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="ml-3">
                    <span className="block text-white text-sm">Creator</span>
                    <span className="block text-white font-medium">
                      {nft.user?.name || "Unknown Artist"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionLargeSlider;
