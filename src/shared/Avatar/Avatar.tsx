"use client";

import React, { FC } from "react";
import { avatarColors } from "@/contains/contants";
import VerifyIcon from "@/components/VerifyIcon";
import Image, { StaticImageData } from "next/image";
import { defaultAvatar } from "@/constants/images";

export interface AvatarProps {
  containerClassName?: string;
  sizeClass?: string;
  radius?: string;
  imgUrl?: string | StaticImageData;
  userName?: string;
  hasChecked?: boolean;
  hasCheckedClass?: string;
  isPlusUser?: boolean;
}

const Avatar: FC<AvatarProps> = ({
  containerClassName = "ring-2 ring-white dark:ring-neutral-900",
  sizeClass = "h-6 w-6 text-sm",
  radius = "rounded-full",
  imgUrl,
  userName,
  hasChecked,
  hasCheckedClass = "w-4 h-4 bottom-1 -right-0.5",
  isPlusUser = false,
}) => {
  const name = userName || "User";
  // Extract size from class and multiply by 2 for higher resolution
  const [baseWidth, baseHeight] = sizeClass.match(/\d+/g)?.map(Number) || [24, 24];
  const width = baseWidth * 2;
  const height = baseHeight * 2;
  
  // Process the image URL
  const processImageUrl = (url: string | StaticImageData | undefined): string => {
    if (!url) return defaultAvatar;
    if (typeof url !== 'string') return url.src;
    
    // If it's already a full URL or starts with /, return as is
    if (url.startsWith('http') || url.startsWith('/')) return url;
    
    // Add https:// if the URL is just a domain
    return `https://${url}`;
  };

  const imageUrl = processImageUrl(imgUrl);

  // Debug logging
  console.log('Avatar Debug:', {
    imgUrl,
    processedImageUrl: imageUrl,
    defaultAvatar,
    userName: name
  });

  return (
    <div
      className={`wil-avatar relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden text-neutral-100 uppercase font-semibold shadow-inner pointer-events-none ${radius} ${sizeClass} ${containerClassName}`}
      style={{ position: 'relative' }}
    >
      <Image
        width={width}
        height={height}
        className="object-cover w-full h-full"
        src={imageUrl}
        alt={name}
        priority
        quality={95}
        sizes={`${Math.max(width, height)}px`}
      />
      {hasChecked && (
        <span className={`absolute ${hasCheckedClass}`}>
          <VerifyIcon className="text-blue-500" isPlusUser={isPlusUser} />
        </span>
      )}
    </div>
  );
};

export default Avatar;
