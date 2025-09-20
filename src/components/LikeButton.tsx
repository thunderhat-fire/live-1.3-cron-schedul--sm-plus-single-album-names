"use client";

import React, { FC, useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLikes } from "@/contexts/LikesContext";

export interface LikeButtonProps {
  className?: string;
  liked?: boolean;
  nftId: string;
}

const LikeButton: FC<LikeButtonProps> = ({ className = "", liked = false, nftId }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { isLiked, toggleLike } = useLikes();

  const handleLike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/nfts/${nftId}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toggleLike(nftId, data.liked);
      }
    } catch (error) {
      console.error('Error liking NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-neutral-700 dark:text-slate-300 nc-shadow-lg hover:bg-neutral-100 dark:hover:bg-slate-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleLike}
      disabled={isLoading}
    >
      {isLiked(nftId) ? (
        <HeartIconSolid className="w-5 h-5 text-red-500 fill-current" />
      ) : (
        <HeartIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default LikeButton;
