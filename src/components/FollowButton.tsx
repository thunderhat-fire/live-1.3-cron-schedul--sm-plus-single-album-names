"use client";

import React, { FC, useState, useEffect } from "react";
import ButtonPrimary, {
  ButtonPrimaryProps,
} from "@/shared/Button/ButtonPrimary";
import ButtonSecondary from "@/shared/Button/ButtonSecondary";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFollow } from "@/contexts/FollowContext";

export interface FollowButtonProps {
  className?: string;
  authorId: string;
  isFollowing?: boolean;
}

const FollowButton: FC<FollowButtonProps> = ({
  className = "",
  authorId,
  isFollowing: initialIsFollowing = false,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { isFollowing, toggleFollow, loading: contextLoading } = useFollow();
  const [isLoading, setIsLoading] = useState(false);
  const [following, setFollowing] = useState(initialIsFollowing);

  useEffect(() => {
    if (!contextLoading && authorId) {
      const contextFollowing = isFollowing(authorId);
      // Only update if the context state is different from our local state
      if (contextFollowing !== following) {
        setFollowing(contextFollowing);
      }
    }
  }, [contextLoading, authorId, isFollowing, following]);

  const handleFollow = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!authorId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/${authorId}/follow`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toggleFollow(authorId, data.following);
        setFollowing(data.following);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <ButtonSecondary
        className={`border border-slate-200 dark:border-slate-700 ${className}`}
        sizeClass="px-4 py-1.5 min-w-[84px]"
        fontSize="text-sm font-medium"
        disabled={true}
      >
        <span className="text-sm">Loading...</span>
      </ButtonSecondary>
    );
  }

  return !following ? (
    <ButtonPrimary
      className={`${className}`}
      sizeClass="px-4 py-1.5 min-w-[84px]"
      fontSize="text-sm font-medium"
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Follow"}
    </ButtonPrimary>
  ) : (
    <ButtonSecondary
      className={`${className}`}
      sizeClass="px-4 py-1.5 min-w-[84px]"
      fontSize="text-sm font-medium"
      onClick={handleFollow}
      disabled={isLoading}
    >
      <span className="text-sm">{isLoading ? "Loading..." : "Following"}</span>
    </ButtonSecondary>
  );
};

export default FollowButton;
