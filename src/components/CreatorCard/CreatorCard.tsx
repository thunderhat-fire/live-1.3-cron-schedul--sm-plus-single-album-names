'use client';

import { FC } from 'react';
import Link from 'next/link';
import Avatar from '@/shared/Avatar/Avatar';
import VerifyIcon from '@/components/VerifyIcon';
import FollowButton from '@/components/FollowButton';
import Badge from '@/shared/Badge/Badge';
import styles from './CreatorCard.module.css';

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

export interface CreatorCardProps {
  className?: string;
  index?: number;
  author: Creator;
  following?: boolean;
  onAuthorClick?: (author: Creator) => void;
}

const CreatorCard: FC<CreatorCardProps> = ({
  className = '',
  index,
  author,
  following = false,
  onAuthorClick,
}) => {
  // Get gradient based on author ID
  const getGradient = () => {
    if (!author?.id) return 0;
    const seed = author.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return seed % 8;
  };

  return (
    <Link
      href={`/author/view/${author.id}`}
      className={`block ${className}`}
    >
      <div className={`${styles.card} ${styles[`gradient${getGradient()}`]}`}>
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

            <div className="mt-1 text-sm font-medium">
              <span className="text-white">{author.nftsCount || 0}</span>
              <span className="text-white/80"> NFTs</span>
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

export default CreatorCard; 