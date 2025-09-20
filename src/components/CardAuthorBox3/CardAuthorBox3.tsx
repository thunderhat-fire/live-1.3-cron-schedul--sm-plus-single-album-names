"use client";

import React, { FC } from "react";
import Avatar from "@/shared/Avatar/Avatar";
import NcImage from "@/shared/NcImage/NcImage";
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

export interface CardAuthorBox3Props {
  className?: string;
  author: Creator;
  following?: boolean;
}

const CardAuthorBox3: FC<CardAuthorBox3Props> = ({
  className = "",
  author,
  following = false,
}) => {
  return (
    <div
      className={`nc-CardAuthorBox3 relative flex flex-col p-4 overflow-hidden [ nc-box-has-hover ] [ nc-dark-box-bg-has-hover ] ${className}`}
    >
      <div className="relative flex-shrink-0 h-36">
        <NcImage
          fill
          containerClassName="absolute inset-0"
          src={author.image || '/images/avatars/default-avatar.png'}
          className="object-cover w-full h-full"
          alt={author.name || 'Author avatar'}
        />
      </div>

      <div className="-mt-6">
        <div className="text-center">
          <Avatar
            containerClassName="ring-4 ring-white dark:ring-black !shadow-xl"
            sizeClass="w-12 h-12 text-2xl"
            radius="rounded-full"
            imgUrl={author.image || '/images/avatars/default-avatar.png'}
          />
        </div>
        <div className="mt-2.5 flex items-start justify-between">
          <div className="text-center w-full">
            <h2 className={`text-base font-medium flex items-center justify-center`}>
              <span className="">{author.name || 'Unknown Artist'}</span>
              <VerifyIcon subscriptionTier={author.subscriptionTier} />
            </h2>
            <span
              className={`block mt-0.5 text-sm text-neutral-500 dark:text-neutral-400 text-center`}
            >
              {author.followersCount || 0} followers
            </span>
          </div>
          <FollowButton 
            authorId={author.id}
            isFollowing={following}
          />
        </div>
        <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          {author.bio || 'No bio available'}
        </div>
      </div>

      <Link 
        href={`/author/view/${author.id}`}
        className="absolute inset-0"
      />
    </div>
  );
};

export default CardAuthorBox3;
