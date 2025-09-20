"use client";

import React, { FC } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import VerifyIcon from "@/components/VerifyIcon";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";

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

export interface CardAuthorBox2Props {
  className?: string;
  author: Creator;
  following?: boolean;
}

const CardAuthorBox2: FC<CardAuthorBox2Props> = ({
  className = "",
  author,
  following = false,
}) => {
  return (
    <div
      className={`nc-CardAuthorBox2 relative flex flex-col items-center justify-center text-center px-3 py-5 [ nc-box-has-hover nc-dark-box-bg-has-hover ] ${className}`}
    >
      <Avatar 
        sizeClass="w-20 h-20 text-2xl" 
        radius="rounded-full"
        imgUrl={author.image || '/images/avatars/default-avatar.png'}
      />
      <div className="mt-3 text-center">
        <h2 className={`text-sm sm:text-base font-medium flex items-center justify-center`}>
          {author.name || 'Unknown Artist'}
          <VerifyIcon subscriptionTier={author.subscriptionTier} />
        </h2>
        <span className={`block mt-1 text-sm text-neutral-500 dark:text-neutral-400 text-center`}>
          {author.followersCount || 0} followers
        </span>
      </div>
      <FollowButton 
        className="mt-3" 
        isFollowing={following}
        authorId={author.id}
      />
      <Link
        href={`/author/view/${author.id}`}
        className="absolute inset-0"
      />
    </div>
  );
};

export default CardAuthorBox2;
