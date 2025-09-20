'use client';

import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Avatar from '@/shared/Avatar/Avatar';
import VerifyIcon from '@/components/VerifyIcon';
import FollowButton from '@/components/FollowButton';
import Badge from '@/shared/Badge/Badge';
import styles from './CardAuthorBox.module.css';

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

export interface CardAuthorBoxProps {
  className?: string;
  index?: number;
  author: Creator;
  following?: boolean;
}

const CardAuthorBox: FC<CardAuthorBoxProps> = ({
  className = '',
  index,
  author,
  following = false,
}) => {
  const getRandomBackground = () => {
    if (!author?.id) return abstractBackgrounds[0];
    // Use author ID to generate a consistent background for each author
    const seed = author.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return abstractBackgrounds[seed % abstractBackgrounds.length];
  };

  return (
    <Link
      href={`/author/view/${author.id}`}
      className={`block ${className}`}
    >
      <div className={`${styles.authorCard}`}>
        <div className="absolute inset-0">
          <Image
            src={getRandomBackground()}
            alt="Author background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className={styles.overlay} />
        <div className={styles.content}>
          {/* Top badge for rankings */}
          {index && index <= 3 && (
            <Badge
              className="absolute left-3 top-3"
              color={index === 1 ? "red" : index === 2 ? "blue" : "green"}
              name={`#${index}`}
            />
          )}

          {/* Avatar */}
          <Avatar
            sizeClass="w-[100px] h-[100px] text-2xl"
            radius="rounded-full"
            imgUrl={author.image || '/images/avatars/default-avatar.png'}
          />

          {/* Author info */}
          <div className="mt-4 text-center">
            <h2 className="text-base font-semibold text-white flex items-center justify-center gap-1">
              {author.name || 'Unknown Artist'}
              <VerifyIcon subscriptionTier={author.subscriptionTier} />
            </h2>

            <div className="mt-1 text-sm font-medium text-center">
              <span className="text-white">{author.followersCount || 0} followers</span>
              <br />
              <span className="text-white">{author.nftsCount || 0} Albums</span>
            </div>
          </div>

          {/* Follow button */}
          <FollowButton
            className="mt-4"
            isFollowing={following}
            authorId={author.id}
          />
        </div>
      </div>
    </Link>
  );
};

export default CardAuthorBox; 