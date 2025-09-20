"use client";

import React, { FC, useState, useEffect } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import VerifyIcon from "@/components/VerifyIcon";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import styles from './CardAuthorBox4.module.css';
import { useFollow } from "@/contexts/FollowContext";
import Image from "next/image";

// Array of abstract background images
const abstractBackgrounds = [
  '/images/pexels/abstracts/2441454.jpg',
  '/images/pexels/abstracts/4765691.jpg',
  '/images/pexels/abstracts/4800161.jpg',
  '/images/pexels/abstracts/380337.jpg',
  '/images/pexels/abstracts/2179483.jpg',
  '/images/pexels/abstracts/5022849.jpg',
  '/images/pexels/abstracts/3631430.jpg'
];

export interface Creator {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  nftsCount: number;
  followersCount: number;
  isFollowing: boolean;
  subscriptionTier?: string;
}

export interface CardAuthorBox4Props {
  className?: string;
  authorIndex?: number;
  author: Creator;
}

const CardAuthorBox4: FC<CardAuthorBox4Props> = ({
  className = "",
  authorIndex,
  author,
}) => {
  const { isFollowing, toggleFollow } = useFollow();
  const [following, setFollowing] = useState(author.isFollowing);

  useEffect(() => {
    setFollowing(isFollowing(author.id));
  }, [author.id, isFollowing]);
  
  // Get background image based on author ID
  const getRandomBackground = () => {
    if (!author?.id) return abstractBackgrounds[0];
    // Use author ID to generate a consistent background for each author
    const seed = author.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return abstractBackgrounds[seed % abstractBackgrounds.length];
  };

  return (
    <Link href={`/author/${author.id}/created`}>
      <div className={`${styles.card} ${className}`}>
        <div className={styles.backgroundImage}>
          <Image
            src={getRandomBackground()}
            alt="Author background"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className={styles.overlay} />
        <div className={styles.content}>
          {authorIndex && (
            <span className="absolute top-6 sm:top-10 left-6 sm:left-10 text-xs text-white">
              #{authorIndex}
            </span>
          )}
          <div className="flex flex-col items-center">
            <div className="flex justify-center">
              <Avatar 
                sizeClass="w-20 h-20 text-2xl" 
                radius="rounded-full"
                imgUrl={author.image || '/images/avatars/default-avatar.png'}
              />
            </div>
            <div className="mt-3 text-center">
              <h2 className="text-base font-medium flex items-center justify-center text-white">
                <span>{author.name || 'Unknown Artist'}</span>
                <VerifyIcon subscriptionTier={author.subscriptionTier} />
              </h2>
              <span className="block mt-0.5 text-sm text-white/80 text-center">
                {author.followersCount || 0} followers
              </span>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium flex items-center justify-center text-white">
                <span>{author.nftsCount || 0}</span>
                <span className="ml-1 text-white/80">Albums</span>
              </span>
            </div>
            <div 
              className="relative mt-5 w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <FollowButton 
                className="w-full" 
                authorId={author.id}
                isFollowing={following}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardAuthorBox4;
